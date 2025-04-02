// Background script for Julian browser extension
// Handles context menu creation and API calls

// Import storage utilities
import { browserAPI, getFromStorage, setToStorage } from './storage.js';

// Create context menu items
function createContextMenus() {
  browserAPI.contextMenus.create({
    id: "askJulian",
    title: "Ask Julian",
    contexts: ["selection", "page"]
  });

  browserAPI.contextMenus.create({
    id: "summarize",
    title: "Summarize Page",
    contexts: ["page"]
  });

  browserAPI.contextMenus.create({
    id: "generate",
    title: "Generate with Julian",
    contexts: ["selection", "page"]
  });

  browserAPI.contextMenus.create({
    id: "copyMainText",
    title: "Copy Main Text (Reader Mode)",
    contexts: ["page"]
  });
  
  // Add a separator
  browserAPI.contextMenus.create({
    id: "separator",
    type: "separator",
    contexts: ["selection", "page"]
  });
  
  // Add settings menu item
  browserAPI.contextMenus.create({
    id: "settings",
    title: "Settings",
    contexts: ["selection", "page"]
  });
}

// Initialize extension
browserAPI.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

// For Firefox compatibility (in case the onInstalled event doesn't fire)
if (typeof browser !== 'undefined') {
  createContextMenus();
}

// Handle context menu clicks
browserAPI.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "askJulian":
      if (info.selectionText) {
        handleAskJulian(info.selectionText, tab.id);
      }
      break;
    case "summarize":
      browserAPI.tabs.sendMessage(tab.id, { action: "summarize", tabId: tab.id });
      break;
    case "generate":
      if (info.selectionText) {
        handleGenerate(info.selectionText, tab.id);
      }
      break;
    case "copyMainText":
      browserAPI.tabs.sendMessage(tab.id, { action: "copyMainText", tabId: tab.id });
      break;
    case "settings":
      // Open the options page
      browserAPI.runtime.openOptionsPage();
      break;
  }
});

// Handle messages from content script
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);
  if (message.action === "summarize") {
    getFromStorage(["llmConfig", "promptRecipes"]).then(data => {
      const recipe = data.promptRecipes?.find(r => r.name === "Summarize Page") || 
                    { prompt: "Summarize the following text: {text}" };
      const prompt = recipe.prompt.replace("{text}", message.text);
      
      fetchAIResponse(data.llmConfig || getDefaultConfig(), prompt)
        .then(response => {
          browserAPI.tabs.sendMessage(message.tabId, { 
            action: "showResponse", 
            text: response.generated_text || response,
            type: "summarize"
          });
          sendResponse({ success: true }); // Send response to keep promise alive
        })
        .catch(error => {
          browserAPI.tabs.sendMessage(message.tabId, { 
            action: "showError", 
            error: error.toString() 
          });
          sendResponse({ success: false, error: error.toString() }); // Send response to keep promise alive
        });
    });
    
    return true; // Indicates async response
  }
  
  if (message.action === "askJulian" || message.action === "generate") {
    getFromStorage(["llmConfig", "promptRecipes"]).then(data => {
      const recipeName = message.action === "askJulian" ? "Ask Julian" : "Generate Text";
      const defaultPrompt = message.action === "askJulian" 
        ? "Answer the following question: {text}" 
        : "Generate text based on: {text}";
      
      const recipe = data.promptRecipes?.find(r => r.name === recipeName) || 
                    { prompt: defaultPrompt };
      console.log("Recipe:", recipe);
      const prompt = recipe.prompt.replace("{text}", message.text);
      
      fetchAIResponse(data.llmConfig || getDefaultConfig(), prompt)
        .then(response => {
          browserAPI.tabs.sendMessage(message.tabId, { 
            action: "showResponse", 
            text: response.generated_text || response,
            type: message.action
          });
          sendResponse({ success: true }); // Send response to keep promise alive
        })
        .catch(error => {
          console.error("Error in background script:", error);
          browserAPI.tabs.sendMessage(message.tabId, { 
            action: "showError", 
            error: error.toString() 
          });
          sendResponse({ success: false, error: error.toString() }); // Send response to keep promise alive
        });
    });
    
    return true; // Indicates async response
  }
  
  if (message.action === "getCurrentTabId") {
    if (sender.tab) {
      sendResponse({ tabId: sender.tab.id });
    }
    return true;
  }

  if (message.action === "textCopied") {
    // Calculate word count from the copied text
    let wordCount = 0;
    if (message.text) {
      // Count words by splitting on whitespace and filtering out empty strings
      const words = message.text.trim().split(/\s+/).filter(word => word.length > 0);
      wordCount = words.length;
    }
    
    // Notify the user that text has been copied
    browserAPI.tabs.sendMessage(message.tabId, { 
      action: "showResponse", 
      text: `${wordCount.toLocaleString()} words copied to clipboard in reader mode format.`,
      type: "info"
    });
    sendResponse({ success: true });
    return true;
  }
});

// Helper functions
function handleAskJulian(text, tabId) {
  browserAPI.tabs.sendMessage(tabId, { 
    action: "askJulian", 
    text: text,
    tabId: tabId
  });
}

function handleGenerate(text, tabId) {
  browserAPI.tabs.sendMessage(tabId, { 
    action: "generate", 
    text: text,
    tabId: tabId
  });
}

function getDefaultConfig() {
  return {
    provider: "huggingface",
    apiKey: "",
    model: "facebook/bart-large-cnn"
  };
}

function fetchAIResponse(config, prompt) {
  console.log("Fetching AI response with config:", config, "and prompt:", prompt) ;
  return new Promise((resolve, reject) => {
    getFromStorage(["providerApiKeys", "apiKeyUsage"]).then(data => {
      const providerApiKeys = data.providerApiKeys || {};
      const apiKeyUsage = data.apiKeyUsage || {};
      let apiKey = config.apiKey;
      let providerName = config.provider;
      let customApiUrl = config.customUrl;
      
      // Use provider-specific API key if available
      if (config.provider === "huggingface" && providerApiKeys.huggingface) {
        // Handle both string and object formats
        if (typeof providerApiKeys.huggingface === 'string') {
          apiKey = providerApiKeys.huggingface;
        } else {
          apiKey = providerApiKeys.huggingface.key;
          // Use custom URL if provided
          if (providerApiKeys.huggingface.url) {
            customApiUrl = providerApiKeys.huggingface.url;
          }
        }
      } else if (config.provider === "custom" && providerApiKeys.custom) {
        // Handle both string and object formats
        if (typeof providerApiKeys.custom === 'string') {
          apiKey = providerApiKeys.custom;
        } else {
          apiKey = providerApiKeys.custom.key;
          // Use custom URL if provided and not already set in config
          if (providerApiKeys.custom.url && !config.customUrl) {
            customApiUrl = providerApiKeys.custom.url;
          }
        }
      } else {
        // Check if we're using a custom provider from the providerApiKeys
        Object.entries(providerApiKeys).forEach(([provider, keyData]) => {
          if (provider !== "huggingface" && provider !== "custom") {
            // Check if the custom URL includes the provider name
            const providerInUrl = config.customUrl && config.customUrl.includes(provider);
            
            // Handle both string and object formats
            if (typeof keyData === 'string') {
              if (providerInUrl) {
                apiKey = keyData;
                providerName = provider;
              }
            } else {
              if (providerInUrl || (keyData.url && config.customUrl === keyData.url)) {
                apiKey = keyData.key;
                providerName = provider;
                // Use the provider's URL if not already set
                if (keyData.url && !customApiUrl) {
                  customApiUrl = keyData.url;
                }
              }
            }
          }
        });
      }
      
      // Check if we have an API key for providers that need one
      if (!apiKey) {
        reject(new Error("API key not set. Please configure in options."));
        return;
      }
      
      let url;
      let body;
      let headers = {
        "Content-Type": "application/json"
      };

      switch (config.provider) {
        case "huggingface":
          // Use custom URL if provided, otherwise use the default Hugging Face API URL
          url = customApiUrl || `https://api-inference.huggingface.co/models/${config.model || "facebook/bart-large-cnn"}`;
          headers["Authorization"] = `Bearer ${apiKey}`;
          // Use the correct format for Hugging Face inference API
          body = JSON.stringify({ 
            inputs: prompt,
            options: {
              use_cache: true,
              wait_for_model: true
            }
          });
          break;
        case "custom":
          if (!customApiUrl) {
            reject(new Error("Custom URL not set. Please configure in options."));
            return;
          }
          url = customApiUrl;
          if (apiKey) {
            headers["Authorization"] = `Bearer ${apiKey}`;
          }
          // Use a generic format for custom APIs
          body = JSON.stringify({ 
            prompt: prompt,
            max_tokens: 500,
            temperature: 0.7
          });
          break;
        default:
          reject(new Error(`Unknown provider: ${config.provider}`));
          return;
      }
      
      // Update the last used timestamp for this provider
      updateApiKeyLastUsed(providerName);
      
      // Make the API request
      fetch(url, {
        method: "POST",
        headers: headers,
        body: body
      })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${text}`);
          });
        }
        return response.json();
      })
      .then(data => {
        resolve(data);
      })
      .catch(error => {
        console.error("Error in API request:", error);
        reject(error);
      });
    });
  });
}

// Update the last used timestamp for an API key
function updateApiKeyLastUsed(provider) {
  getFromStorage(["apiKeyUsage"]).then(data => {
    const apiKeyUsage = data.apiKeyUsage || {};
    
    // Update the last used timestamp
    if (!apiKeyUsage[provider]) {
      apiKeyUsage[provider] = {};
    }
    
    apiKeyUsage[provider].lastUsed = new Date().toISOString();
    
    // Save the updated usage data
    setToStorage({ apiKeyUsage });
  });
}

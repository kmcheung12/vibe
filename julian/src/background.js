// Background script for Julian browser extension
// Handles context menu creation and API calls

// Import storage utilities
import { browserAPI, getFromStorage, setToStorage } from './storage.js';
// Import default settings
import { DEFAULT_SETTINGS } from './defaults.js';

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
    getFromStorage(["providers", "currentProviderId", "promptRecipes"]).then(data => {
      const recipe = data.promptRecipes?.find(r => r.name === "Summarize Page") || 
                    { prompt: "Summarize the following text: {text}" };
      const prompt = recipe.prompt.replace("{text}", message.text);
      
      // Get the current provider
      const providers = data.providers || DEFAULT_SETTINGS.providers;
      const currentProviderId = data.currentProviderId || DEFAULT_SETTINGS.currentProviderId;
      const currentProvider = providers.find(p => p.id === currentProviderId) || providers[0];
      
      fetchAIResponse(currentProvider, prompt)
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
    getFromStorage(["providers", "currentProviderId", "promptRecipes"]).then(data => {
      const recipeName = message.action === "askJulian" ? "Ask Julian" : "Generate Text";
      const defaultPrompt = message.action === "askJulian" 
        ? "Answer the following question: {text}" 
        : "Generate text based on: {text}";
      
      const recipe = data.promptRecipes?.find(r => r.name === recipeName) || 
                    { prompt: defaultPrompt };
      console.log("Recipe:", recipe);
      const prompt = recipe.prompt.replace("{text}", message.text);
      
      // Get the current provider
      const providers = data.providers || DEFAULT_SETTINGS.providers;
      const currentProviderId = data.currentProviderId || DEFAULT_SETTINGS.currentProviderId;
      const currentProvider = providers.find(p => p.id === currentProviderId) || providers[0];
      
      fetchAIResponse(currentProvider, prompt)
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

function fetchAIResponse(provider, prompt) {
  console.log("Fetching AI response with provider:", provider, "and prompt:", prompt);
  return new Promise((resolve, reject) => {
    // Update the provider's last used timestamp
    updateProviderLastUsed(provider.id);
    
    // Create a simple test prompt
    const testPrompt = prompt;
    
    // Prepare headers based on schema
    const headers = {};
    
    // Process schema headers with variable substitution
    if (provider.schema.headers) {
      Object.entries(provider.schema.headers).forEach(([key, value]) => {
        if (value === null) return; // Skip null values
        
        // Replace variables in header values
        if (typeof value === 'string') {
          let processedValue = value;
          
          // Replace {apiKey} with the actual API key
          if (value.includes('{apiKey}') && provider.apiKey) {
            processedValue = processedValue.replace('{apiKey}', provider.apiKey);
          }
          
          headers[key] = processedValue;
        } else {
          headers[key] = value;
        }
      });
    }
    
    // Process schema body with variable substitution
    let requestBody = {};
    if (provider.schema.body) {
      requestBody = JSON.parse(JSON.stringify(provider.schema.body)); // Deep clone
      
      // Replace variables in the body
      const replaceInObject = (obj) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            // Replace {prompt} with the test prompt
            if (obj[key].includes('{prompt}')) {
              obj[key] = obj[key].replace('{prompt}', testPrompt);
            }
            
            // Replace {model} with the model name
            if (obj[key].includes('{model}')) {
              obj[key] = obj[key].replace('{model}', provider.model);
            }
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            replaceInObject(obj[key]);
          }
        }
      };
      
      replaceInObject(requestBody);
    }
    
    // Make the API request
    fetch(provider.apiUrl, {
      method: provider.schema.method || "POST",
      headers: headers,
      body: JSON.stringify(requestBody)
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
      // Process the response based on the provider type
      let result;
      
      // Handle different response formats
      if (provider.id === "huggingface") {
        result = data[0]?.generated_text || data.generated_text || data;
      } else if (provider.id === "ollama") {
        result = data.response || data;
      } else {
        // Default handling for other providers
        result = data.generated_text || data.response || data.output || data.text || data;
      }
      
      resolve(result);
    })
    .catch(error => {
      console.error("API request error:", error);
      reject(error);
    });
  });
}

// Update the last used timestamp for a provider
function updateProviderLastUsed(providerId) {
  getFromStorage(["providers"]).then(data => {
    const providers = data.providers || DEFAULT_SETTINGS.providers;
    
    // Find the provider
    const providerIndex = providers.findIndex(p => p.id === providerId);
    
    if (providerIndex >= 0) {
      // Update the timestamp
      providers[providerIndex].lastUsed = Date.now();
      
      // Save the updated data
      setToStorage({ providers });
    }
  });
}

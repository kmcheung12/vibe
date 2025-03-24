// Background script for Julian browser extension
// Handles context menu creation and API calls

// Use the appropriate API namespace based on the browser
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Create context menu items
function createContextMenus() {
  browserAPI.contextMenus.create({
    id: "askJulian",
    title: "Ask Julian",
    contexts: ["selection"]
  });

  browserAPI.contextMenus.create({
    id: "summarize",
    title: "Summarize Page",
    contexts: ["page"]
  });

  browserAPI.contextMenus.create({
    id: "generate",
    title: "Generate with Julian",
    contexts: ["selection"]
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
  }
});

// Handle messages from content script
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);
  if (message.action === "summarize") {
    // Use Promise-based approach for Firefox compatibility
    const storagePromise = typeof browser !== 'undefined' ? 
      browserAPI.storage.sync.get(["llmConfig", "promptRecipes"]) :
      new Promise(resolve => {
        browserAPI.storage.sync.get(["llmConfig", "promptRecipes"], resolve);
      });
    
    // Create a promise chain that properly resolves
    storagePromise
      .then(data => {
        const recipe = data.promptRecipes?.find(r => r.name === "Summarize Page") || 
                      { prompt: "Summarize the following text: {text}" };
        const prompt = recipe.prompt.replace("{text}", message.text);
        
        return fetchAIResponse(data.llmConfig || getDefaultConfig(), prompt);
      })
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
    
    return true; // Indicates async response
  }
  
  if (message.action === "askJulian" || message.action === "generate") {
    // Use Promise-based approach for Firefox compatibility
    const storagePromise = typeof browser !== 'undefined' ? 
      browserAPI.storage.sync.get(["llmConfig", "promptRecipes"]) :
      new Promise(resolve => {
        browserAPI.storage.sync.get(["llmConfig", "promptRecipes"], resolve);
      });
    
    // Create a promise chain that properly resolves
    storagePromise
      .then(data => {
        const recipeName = message.action === "askJulian" ? "Ask Julian" : "Generate Text";
        const defaultPrompt = message.action === "askJulian" 
          ? "Answer the following question: {text}" 
          : "Generate text based on: {text}";
        
        const recipe = data.promptRecipes?.find(r => r.name === recipeName) || 
                      { prompt: defaultPrompt };
        console.log("Recipe:", recipe);
        const prompt = recipe.prompt.replace("{text}", message.text);
        
        return fetchAIResponse(data.llmConfig || getDefaultConfig(), prompt);
      })
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
    
    return true; // Indicates async response
  }
  
  if (message.action === "getCurrentTabId") {
    if (sender.tab) {
      sendResponse({ tabId: sender.tab.id });
    }
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
  // Get the provider-specific API key if available
  return new Promise((resolve, reject) => {
    const storagePromise = typeof browser !== 'undefined' ? 
      browserAPI.storage.sync.get(["providerApiKeys", "apiKeyUsage"]) :
      new Promise(innerResolve => {
        browserAPI.storage.sync.get(["providerApiKeys", "apiKeyUsage"], innerResolve);
      });
    
    storagePromise.then(data => {
      const providerApiKeys = data.providerApiKeys || {};
      const apiKeyUsage = data.apiKeyUsage || {};
      let apiKey = config.apiKey;
      let providerName = config.provider;
      
      // Use provider-specific API key if available
      if (config.provider === "huggingface" && providerApiKeys.huggingface) {
        apiKey = providerApiKeys.huggingface;
      } else if (config.provider === "custom" && providerApiKeys.custom) {
        apiKey = providerApiKeys.custom;
      } else {
        // Check if we're using a custom provider from the providerApiKeys
        Object.entries(providerApiKeys).forEach(([provider, key]) => {
          if (provider !== "huggingface" && provider !== "custom" && provider !== "ollama") {
            if (config.customUrl && config.customUrl.includes(provider)) {
              apiKey = key;
              providerName = provider;
            }
          }
        });
      }
      
      // Check if we have an API key for providers that need one
      if (!apiKey && config.provider !== "ollama") {
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
          url = `https://api-inference.huggingface.co/models/${config.model || "facebook/bart-large-cnn"}`;
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
        case "ollama":
          // Ollama is a free local LLM option
          url = config.customUrl || "http://localhost:11434/api/generate";
          body = JSON.stringify({ 
            model: config.model || "llama2", 
            prompt: prompt,
            stream: false
          });
          break;
        case "custom":
          if (!config.customUrl) {
            reject(new Error("Custom URL not set. Please configure in options."));
            return;
          }
          url = config.customUrl;
          if (apiKey) {
            headers["Authorization"] = `Bearer ${apiKey}`;
          }
          body = JSON.stringify({ inputs: prompt });
          break;
        default:
          reject(new Error("Unknown provider. Please configure in options."));
          return;
      }

      fetch(url, {
        method: "POST",
        headers: headers,
        body: body
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Update the last used timestamp for this provider
        updateApiKeyLastUsed(providerName);
        
        // Format the response based on the provider
        if (config.provider === "ollama") {
          resolve({ generated_text: data.response });
        } else {
          resolve(data);
        }
      })
      .catch(error => {
        reject(error);
      });
    });
  });
}

// Update the last used timestamp for an API key
function updateApiKeyLastUsed(provider) {
  // Use Promise-based approach for Firefox compatibility
  const storagePromise = typeof browser !== 'undefined' ? 
    browserAPI.storage.sync.get(["apiKeyUsage"]) :
    new Promise(resolve => {
      browserAPI.storage.sync.get(["apiKeyUsage"], resolve);
    });
  
  storagePromise.then(data => {
    const apiKeyUsage = data.apiKeyUsage || {};
    
    // Update the last used timestamp
    if (!apiKeyUsage[provider]) {
      apiKeyUsage[provider] = {};
    }
    
    apiKeyUsage[provider].lastUsed = new Date().toISOString();
    
    // Save the updated usage data
    browserAPI.storage.sync.set({ apiKeyUsage });
  });
}

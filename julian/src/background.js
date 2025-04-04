// Background script for Julian browser extension
// Handles context menu creation and API calls

// Import storage utilities
import { browserAPI, getFromStorage, setToStorage } from './storage.js';
// Import default settings
import { DEFAULT_SETTINGS } from './defaults.js';
// Import service functions
import { ask, summarize } from './service.js';

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
    const useStreaming = message.stream === true;
    console.log(useStreaming);
    if (!useStreaming) {

      // Non-streaming mode
      summarize(message.text, false)
        .then(response => {
          browserAPI.tabs.sendMessage(message.tabId, { 
            action: "showResponse", 
            text: response.text,
            type: "summarize",
            completed: response.completed
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
    } else {
      // Streaming mode
      console.log("Streaming mode")
      summarize("Hello, this is a test.", true)
        .then(async streamResponse => {
          // Process the stream
          try {
            while (true) {
              
              const chunk = await streamResponse.read();
              console.log("Processing chunk...", chunk.text);
              // Send the chunk to the content script
              browserAPI.tabs.sendMessage(message.tabId, {
                action: "showResponse",
                text: chunk.text,
                type: "summarize",
                completed: chunk.completed
              });
              
              // If this is the last chunk, break the loop
              if (chunk.completed) {
                break;
              }
            }
            sendResponse({ success: true });
          } catch (error) {
            browserAPI.tabs.sendMessage(message.tabId, {
              action: "showError",
              error: error.toString()
            });
            sendResponse({ success: false, error: error.toString() });
          }
        })
        .catch(error => {
          browserAPI.tabs.sendMessage(message.tabId, { 
            action: "showError", 
            error: error.toString() 
          });
          sendResponse({ success: false, error: error.toString() });
        });
    }
    
    return true; // Indicates async response
  }
  
  if (message.action === "askJulian" || message.action === "generate") {
    const useStreaming = message.stream === true;
    
    if (!useStreaming) {
      // Non-streaming mode
      ask(message.text, false)
        .then(response => {
          browserAPI.tabs.sendMessage(message.tabId, { 
            action: "showResponse", 
            text: response.text,
            type: message.action === "askJulian" ? "ask" : "generate",
            completed: response.completed
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
    } else {
      // Streaming mode
      ask(message.text, true)
        .then(async streamResponse => {
          // Process the stream
          try {
            while (true) {
              const chunk = await streamResponse.read();
              
              // Send the chunk to the content script
              browserAPI.tabs.sendMessage(message.tabId, {
                action: "showResponse",
                text: chunk.text,
                type: message.action === "askJulian" ? "ask" : "generate",
                completed: chunk.completed
              });
              
              // If this is the last chunk, break the loop
              if (chunk.completed) {
                break;
              }
            }
            sendResponse({ success: true });
          } catch (error) {
            browserAPI.tabs.sendMessage(message.tabId, {
              action: "showError",
              error: error.toString()
            });
            sendResponse({ success: false, error: error.toString() });
          }
        })
        .catch(error => {
          browserAPI.tabs.sendMessage(message.tabId, { 
            action: "showError", 
            error: error.toString() 
          });
          sendResponse({ success: false, error: error.toString() });
        });
    }
    
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

// Background script for Julian browser extension
// Handles context menu creation and API calls

// Import storage utilities
import { browserAPI } from './storage.js';
// Import service functions
import { summarize } from './service.js';

// Create context menu items
function createContextMenus() {
  browserAPI.contextMenus.create({
    id: "summarize",
    title: "Summarize Page",
    contexts: ["page"]
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
    case "summarize":
      browserAPI.tabs.sendMessage(tab.id, { action: "summarize", tabId: tab.id });
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
    summarize(message.text, message.stream)
      .then(async streamResponse => {
        try {
          while (true) {
            const { text, completed } = await streamResponse.read();
            console.log("Processing chunk...", { text, completed });
            browserAPI.tabs.sendMessage(message.tabId, {
              action: "showResponse",
              text,
              type: "summarize",
              completed
            });
            
            // If this is the last chunk, break the loop
            if (completed) {
              break;
            }
          }
        } catch (error) {
          console.error(error);
          browserAPI.tabs.sendMessage(message.tabId, {
            action: "showError",
            error: error.toString()
          });
        }
      })
      .catch(error => {
        browserAPI.tabs.sendMessage(message.tabId, { 
          action: "showError", 
          error: error.toString() 
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
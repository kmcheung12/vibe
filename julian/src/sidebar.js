// Sidebar script for Julian browser extension
// Handles sidebar functionality and communication with background script

// Use the appropriate API namespace based on the browser
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// DOM elements
const elements = {
  closeButton: document.getElementById('close-button'),
  responseArea: document.getElementById('response-area'),
  inputText: document.getElementById('input-text'),
  askButton: document.getElementById('ask-button'),
  summarizeButton: document.getElementById('summarize-button'),
  generateButton: document.getElementById('generate-button')
};

// Initialize the sidebar
function initSidebar() {
  // Set up event listeners
  elements.closeButton.addEventListener('click', closeSidebar);
  elements.askButton.addEventListener('click', handleAskJulian);
  elements.summarizeButton.addEventListener('click', handleSummarizePage);
  elements.generateButton.addEventListener('click', handleGenerateText);
  
  // Handle Enter key in textarea
  elements.inputText.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAskJulian();
    }
  });
  
  // Listen for messages from background script
  browserAPI.runtime.onMessage.addListener((message) => {
    if (message.action === 'showResponse') {
      displayResponse(message.text, message.type);
    } else if (message.action === 'showError') {
      displayError(message.error);
    }
  });
}

// Close the sidebar
function closeSidebar() {
  window.parent.postMessage({ action: 'closeSidebar' }, '*');
}

// Handle "Ask Julian" button click
function handleAskJulian() {
  const text = elements.inputText.value.trim();
  if (text) {
    displayLoading();
    browserAPI.runtime.sendMessage({
      action: 'askJulian',
      text: text,
      tabId: getCurrentTabId()
    });
  }
}

// Handle "Summarize Page" button click
function handleSummarizePage() {
  displayLoading();
  // Use Promise-based approach for Firefox compatibility
  const queryPromise = typeof browser !== 'undefined' ?
    browserAPI.tabs.query({ active: true, currentWindow: true }) :
    new Promise(resolve => {
      browserAPI.tabs.query({ active: true, currentWindow: true }, resolve);
    });
    
  queryPromise.then(tabs => {
    browserAPI.tabs.sendMessage(tabs[0].id, { action: 'summarize', tabId: tabs[0].id });
  });
}

// Handle "Generate Text" button click
function handleGenerateText() {
  const text = elements.inputText.value.trim();
  if (text) {
    displayLoading();
    browserAPI.runtime.sendMessage({
      action: 'generate',
      text: text,
      tabId: getCurrentTabId()
    });
  }
}

// Display loading indicator
function displayLoading() {
  elements.responseArea.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `;
}

// Display response in the sidebar
function displayResponse(text, type) {
  let title;
  switch (type) {
    case 'summarize':
      title = 'Page Summary';
      break;
    case 'askJulian':
      title = 'Julian\'s Answer';
      break;
    case 'generate':
      title = 'Generated Text';
      break;
    default:
      title = 'Response';
  }
  
  elements.responseArea.innerHTML = `
    <h3 style="margin-top: 0; color: #4a55af;">${title}</h3>
    <div>${formatResponse(text)}</div>
  `;
}

// Display error in the sidebar
function displayError(error) {
  elements.responseArea.innerHTML = `
    <h3 style="margin-top: 0; color: #e74c3c;">Error</h3>
    <div style="color: #e74c3c;">${error}</div>
  `;
}

// Format the response text
function formatResponse(text) {
  if (typeof text === 'object') {
    try {
      text = JSON.stringify(text, null, 2);
    } catch (e) {
      text = 'Error formatting response: ' + e.message;
    }
  }
  
  // Convert line breaks to <br> tags
  return text.replace(/\n/g, '<br>');
}

// Get the current tab ID
function getCurrentTabId() {
  return new Promise(resolve => {
    // Use Promise-based approach for Firefox compatibility
    const queryPromise = typeof browser !== 'undefined' ?
      browserAPI.tabs.query({ active: true, currentWindow: true }) :
      new Promise(resolve => {
        browserAPI.tabs.query({ active: true, currentWindow: true }, resolve);
      });
      
    queryPromise.then(tabs => {
      resolve(tabs[0].id);
    });
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSidebar);

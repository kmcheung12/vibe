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

// Store intermediate streaming results
let responseBuffer = '';

// Initialize the sidebar
function initSidebar() {
  // Set up event listeners
  console.log("Init sidebar, sidebar.js");
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
      console.log("Sidebar received message from background: ", message);
      displayResponse(message.text, message.type, message.completed);
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
    // Reset streaming buffer for new request
    responseBuffer = '';
    browserAPI.runtime.sendMessage({
      action: 'askJulian',
      text: text,
      tabId: getCurrentTabId(),
      stream: true // Enable streaming mode
    });
  }
}

// Handle "Summarize Page" button click
function handleSummarizePage() {
  displayLoading();
  // Reset streaming buffer for new request
  responseBuffer = '';
  // Use Promise-based approach for Firefox compatibility
  const queryPromise = typeof browser !== 'undefined' ?
    browserAPI.tabs.query({ active: true, currentWindow: true }) :
    new Promise(resolve => {
      browserAPI.tabs.query({ active: true, currentWindow: true }, resolve);
    });
    
  queryPromise.then(tabs => {
    browserAPI.tabs.sendMessage(tabs[0].id, { 
      action: 'summarize', 
      tabId: tabs[0].id,
      stream: true // Enable streaming mode
    });
  });
}

// Handle "Generate Text" button click
function handleGenerateText() {
  const text = elements.inputText.value.trim();
  if (text) {
    displayLoading();
    // Reset streaming buffer for new request
    responseBuffer = '';
    browserAPI.runtime.sendMessage({
      action: 'generate',
      text: text,
      tabId: getCurrentTabId(),
      stream: true // Enable streaming mode
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
function displayResponse(text, type, completed = true) {
  console.log('Sidebar displaying response:', text, type, completed);
  let title;
  switch (type) {
    case 'summarize':
      title = 'Page Summary';
      break;
    case 'ask':
      title = 'Julian\'s Answer';
      break;
    case 'generate':
      title = 'Generated Text';
      break;
    default:
      title = 'Response';
  }
  
  // For streaming responses, accumulate text until completed
  if (!completed) {
    responseBuffer += text;
    
    elements.responseArea.innerHTML = `
      <h3 style="margin-top: 0; color: #4a55af;">${title}</h3>
      <div>${formatResponse(responseBuffer)}</div>
      <div class="streaming-indicator">Streaming...</div>
    `;
  } else {
    // If this is a completed response
    if (text) {
      // If text is provided, use it directly (non-streaming case)
      elements.responseArea.innerHTML = `
        <h3 style="margin-top: 0; color: #4a55af;">${title}</h3>
        <div>${formatResponse(text)}</div>
      `;
    } else {
      // If no text is provided, use the accumulated buffer (end of streaming)
      elements.responseArea.innerHTML = `
        <h3 style="margin-top: 0; color: #4a55af;">${title}</h3>
        <div>${formatResponse(responseBuffer)}</div>
      `;
      // Reset the buffer after displaying the final response
      responseBuffer = '';
    }
  }
}

// Display error in the sidebar
function displayError(error) {
  console.log('Displaying error:', error);
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

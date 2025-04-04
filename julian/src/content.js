// Content script for Julian browser extension
// Handles page interactions and displays the sidebar

// Use the appropriate API namespace based on the browser
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Import Readability from Mozilla
import { Readability } from '@mozilla/readability';

// Create sidebar elements
let sidebar = null;
let sidebarVisible = false;
// Store intermediate streaming results
let responseBuffer = '';

// Initialize when the page loads
function initializeJulian() {
  createSidebar();
  
  // Listen for messages from background script
  browserAPI.runtime.onMessage.addListener((message) => {
    console.log("Content received message from background: ", message);
    if (message.action === "summarize") {
      showSidebar();
      const pageText = document.body.innerText;
      resetResponseArea();
      browserAPI.runtime.sendMessage({
        action: "summarize",
        text: pageText,
        stream: true,
        tabId: message.tabId
      });
    } else if (message.action === "askJulian") {
      resetResponseArea();
      showSidebar();
      document.getElementById("julian-input").value = message.text;
      document.getElementById("julian-ask").click();
    } else if (message.action === "generate") {
      resetResponseArea();
      showSidebar();
      document.getElementById("julian-input").value = message.text;
      document.getElementById("julian-generate").click();
    } else if (message.action === "showResponse") {
      showSidebar();
      displayResponse(message.text, message.type, message.completed);
    } else if (message.action === "showError") {
      showSidebar();
      displayError(message.error);
    } else if (message.action === "copyMainText") {
      copyMainTextToClipboard(message.tabId);
    }
  });
}

// Create the sidebar UI
function createSidebar() {
  if (sidebar) return;
  
  sidebar = document.createElement("div");
  sidebar.id = "julian-sidebar";
  sidebar.style.cssText = `
    position: fixed;
    top: 0;
    right: -400px;
    width: 380px;
    height: 100vh;
    background-color: #ffffff;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    transition: right 0.3s ease;
    display: flex;
    flex-direction: column;
    font-family: Arial, sans-serif;
  `;
  
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: #4a55af;
    color: white;
  `;
  
  const title = document.createElement("h2");
  title.textContent = "Julian";
  title.style.margin = "0";
  
  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
  `;
  closeButton.onclick = hideSidebar;
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  const content = document.createElement("div");
  content.style.cssText = `
    flex: 1;
    padding: 15px;
    overflow-y: auto;
  `;
  
  const responseArea = document.createElement("div");
  responseArea.id = "julian-response";
  responseArea.style.cssText = `
    min-height: 200px;
    margin-bottom: 15px;
    padding: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    background-color: #f9f9f9;
    overflow-wrap: break-word;
  `;
  
  const inputArea = document.createElement("div");
  inputArea.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;
  
  const textarea = document.createElement("textarea");
  textarea.id = "julian-input";
  textarea.placeholder = "Ask Julian something...";
  textarea.style.cssText = `
    width: 100%;
    height: 100px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    resize: none;
  `;
  
  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
    display: flex;
    gap: 10px;
  `;
  
  const askButton = document.createElement("button");
  askButton.textContent = "Ask Julian";
  askButton.id = "julian-ask";
  askButton.style.cssText = `
    padding: 8px 15px;
    background-color: #4a55af;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `;
  askButton.onclick = () => {
    const text = document.getElementById("julian-input").value.trim();
    if (text) {
      resetResponseArea();
      displayLoading();
      console.log("Asking Julian...");
      // Get the tab ID first, then send the message
      getCurrentTabId().then(tabId => {
        browserAPI.runtime.sendMessage({
          action: "askJulian",
          text: text,
          stream: true,
          tabId: tabId
        });
      });
    }
  };
  
  const summarizeButton = document.createElement("button");
  summarizeButton.textContent = "Summarize Page";
  summarizeButton.style.cssText = `
    padding: 8px 15px;
    background-color: #4a55af;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `;
  summarizeButton.onclick = () => {
    displayLoading();
    console.log("Summarizing page...");
    const text = document.getElementById("julian-input").value.trim();
    if (text) {
      resetResponseArea();
      displayLoading();
      getCurrentTabId().then(tabId => {
        browserAPI.runtime.sendMessage({
          action: "summarize",
          text: text,
          stream: true,
          tabId: tabId
        });
      });
    }
  };
  
  const generateButton = document.createElement("button");
  generateButton.textContent = "Generate";
  generateButton.id = "julian-generate";
  generateButton.style.cssText = `
    padding: 8px 15px;
    background-color: #4a55af;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `;
  generateButton.onclick = () => {
    const text = document.getElementById("julian-input").value.trim();
    if (text) {
      resetResponseArea();
      console.log("Generating text...");
      displayLoading();
      // Get the tab ID first, then send the message
      getCurrentTabId().then(tabId => {
        browserAPI.runtime.sendMessage({
          action: "generate",
          text: text,
          stream: true,
          tabId: tabId
        });
      });
    }
  };
  
  buttonContainer.appendChild(askButton);
  buttonContainer.appendChild(summarizeButton);
  buttonContainer.appendChild(generateButton);
  
  inputArea.appendChild(textarea);
  inputArea.appendChild(buttonContainer);
  
  content.appendChild(responseArea);
  content.appendChild(inputArea);
  
  sidebar.appendChild(header);
  sidebar.appendChild(content);
  
  document.body.appendChild(sidebar);
  
  // Add toggle button to the page
  const toggleButton = document.createElement("button");
  toggleButton.id = "julian-toggle";
  toggleButton.textContent = "J";
  toggleButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #4a55af;
    color: white;
    font-size: 24px;
    font-weight: bold;
    border: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    z-index: 9998;
  `;
  toggleButton.onclick = toggleSidebar;
  
  document.body.appendChild(toggleButton);
}

// Show the sidebar
function showSidebar() {
  if (!sidebar) createSidebar();
  sidebar.style.right = "0";
  sidebarVisible = true;
}

// Hide the sidebar
function hideSidebar() {
  if (sidebar) {
    sidebar.style.right = "-400px";
    sidebarVisible = false;
  }
}

// Toggle the sidebar visibility
function toggleSidebar() {
  if (sidebarVisible) {
    hideSidebar();
  } else {
    showSidebar();
  }
}

// Display loading indicator
function displayLoading() {
  const responseArea = document.getElementById("julian-response");
  responseArea.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100px;">
      <div style="border: 4px solid #f3f3f3; border-top: 4px solid #4a55af; border-radius: 50%; width: 30px; height: 30px; animation: julian-spin 1s linear infinite;"></div>
    </div>
    <style>
      @keyframes julian-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
}

function resetResponseArea() {
  const responseArea = document.getElementById("julian-response");
  responseBuffer = '';
  responseArea.innerHTML = `
  <div>${formatResponse(responseBuffer)}</div>
  <div class="streaming-indicator">Streaming...</div>
`;
}
// Display response in the sidebar
function displayResponse(text, type, completed = true) {
  const responseArea = document.getElementById("julian-response");
  
  let title;
  switch (type) {
    case "summarize":
      title = "Page Summary";
      break;
    case "askJulian":
      title = "Julian's Answer";
      break;
    case "generate":
      title = "Generated Text";
      break;
    default:
      title = "Response";
  }
  
  if (!completed) {
    responseBuffer += text;
    
    responseArea.innerHTML = `
      <h3 style="margin-top: 0; color: #4a55af;">${title}</h3>
      <div>${formatResponse(responseBuffer)}</div>
      <div class="streaming-indicator">Streaming...</div>
    `;
  } else {
    responseArea.innerHTML = `
      <h3 style="margin-top: 0; color: #4a55af;">${title}</h3>
      <div>${formatResponse(responseBuffer)}</div>
    `;
  }
}

// Display error in the sidebar
function displayError(error) {
  const responseArea = document.getElementById("julian-response");
  responseArea.innerHTML = `
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
      text = "Error formatting response: " + e.message;
    }
  }
  
  // Convert line breaks to <br> tags
  return text.replace(/\n/g, '<br>');
}

// Get the current tab ID
function getCurrentTabId() {
  return new Promise((resolve) => {
    browserAPI.runtime.sendMessage({action: "getCurrentTabId"}, (response) => {
      resolve(response?.tabId);
    });
  });
}

// Extract and copy main text in reader mode format
function copyMainTextToClipboard(tabId) {
  try {
    // Time how long it takes to extract main text
    const startTime = performance.now();
    console.log("Start copying main text to clipboard", startTime);
    // Use Mozilla's Readability to extract main content
    const documentClone = document.cloneNode(true);
    const reader = new Readability(documentClone);
    const article = reader.parse();
    const endTime = performance.now();
    console.log(`Time to extract main text: ${endTime - startTime} ms`);
    if (!article) {
      throw new Error("Could not parse page content with Readability");
    }
    
    // Format the content for clipboard
    const title = article.title || document.title;
    const content = article.textContent || article.content;
    
    // Format the text with title and content
    const formattedText = `${title}\n\n${content}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(formattedText)
      .then(() => {
        console.log("Text copied to clipboard");
        // Notify background script that text was copied
        browserAPI.runtime.sendMessage({
          action: "textCopied",
          text: formattedText,
          tabId: tabId
        });
      })
      .catch(err => {
        console.error("Failed to copy text: ", err);
        displayError("Failed to copy text: " + err.message);
      });
  } catch (error) {
    console.error("Error extracting main content: ", error);
    displayError("Error extracting main content: " + error.message);
  }
}

// Initialize when the page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeJulian);
} else {
  initializeJulian();
}

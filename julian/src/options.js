// Options page script for Julian browser extension
// Handles settings configuration and storage

// Import storage utilities
import { browserAPI, getFromStorage, setToStorage, clearStorage } from './storage.js';

// Default settings
const DEFAULT_SETTINGS = {
  llmConfig: {
    provider: "huggingface",
    model: "facebook/bart-large-cnn",
    apiKey: "",
    customUrl: "",
    lastUsed: null
  },
  promptRecipes: [
    { name: "Ask Julian", prompt: "Answer the following question: {text}" },
    { name: "Summarize Page", prompt: "Summarize the following text in a concise way: {text}" },
    { name: "Generate Text", prompt: "Generate text based on: {text}" }
  ],
  generalSettings: {
    showSidebarToggle: true,
    autoShowSidebar: true
  }
};

// DOM elements
let elements = {};

// Initialize the options page
function init() {
  // Get DOM elements
  elements = {
    status: document.getElementById("status"),
    currentProvider: document.getElementById("currentProvider"),
    currentApiKey: document.getElementById("currentApiKey"),
    currentModel: document.getElementById("currentModel"),
    customUrlContainer: document.getElementById("customUrlContainer"),
    customUrl: document.getElementById("customUrl"),
    testApi: document.getElementById("testApi"),
    recipes: document.getElementById("recipes"),
    addRecipe: document.getElementById("addRecipe"),
    showSidebarToggle: document.getElementById("showSidebarToggle"),
    autoShowSidebar: document.getElementById("autoShowSidebar"),
    save: document.getElementById("save"),
    apiKeysList: document.getElementById("apiKeysList"),
    newProviderName: document.getElementById("newProviderName"),
    newProviderKey: document.getElementById("newProviderKey"),
    newProviderUrl: document.getElementById("newProviderUrl"),
    addApiKey: document.getElementById("addApiKey"),
    buildTime: document.getElementById("buildTime")
  };
  
  // Set build time
  setBuildTime();
  
  // Load settings
  loadSettings();
  
  // Set up event listeners
  elements.testApi.addEventListener("click", testApiConnection);
  elements.addRecipe.addEventListener("click", addRecipe);
  elements.addApiKey.addEventListener("click", addNewApiKey);
  elements.save.addEventListener("click", saveSettings);
}

// Set the build time in the UI
function setBuildTime() {
  if (elements.buildTime) {
    // __BUILD_TIME__ is a global constant that will be replaced at build time
    const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'Unknown';
    const formattedDate = buildTime !== 'Unknown' ? new Date(buildTime).toLocaleString() : 'Unknown';
    elements.buildTime.textContent = formattedDate;
  }
}

// Load settings from storage
function loadSettings() {
  // Use Promise-based approach for Firefox compatibility
  getFromStorage(["llmConfig", "promptRecipes", "generalSettings"]).then(data => {
    const mergedSettings = {
      llmConfig: data.llmConfig || DEFAULT_SETTINGS.llmConfig,
      promptRecipes: data.promptRecipes || DEFAULT_SETTINGS.promptRecipes,
      generalSettings: data.generalSettings || DEFAULT_SETTINGS.generalSettings
    };
    
    // Update the current configuration display
    updateCurrentConfigDisplay(mergedSettings.llmConfig);
    
    // Populate form fields
    populateFormFields(mergedSettings);
    renderRecipes(mergedSettings.promptRecipes);
    renderApiKeys(mergedSettings.llmConfig);
  });
}

// Update the current configuration display
function updateCurrentConfigDisplay(config) {
  elements.currentProvider.textContent = formatProviderName(config.provider);
  elements.currentApiKey.textContent = maskApiKey(config.apiKey);
  elements.currentModel.textContent = config.model || "Not set";
  
  // Show custom URL container if provider is custom
  if (config.provider === "custom") {
    elements.customUrlContainer.style.display = "block";
    elements.customUrl.value = config.customUrl || "";
  } else {
    elements.customUrlContainer.style.display = "none";
  }
}

// Mask API key for display
function maskApiKey(key) {
  if (!key) return "Not set";
  if (key.length <= 8) return "••••••••";
  return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4);
}

// Populate form fields with settings
function populateFormFields(settings) {
  // Set general settings
  elements.showSidebarToggle.checked = settings.generalSettings.showSidebarToggle;
  elements.autoShowSidebar.checked = settings.generalSettings.autoShowSidebar;
  
  // Set custom URL if provider is custom
  if (settings.llmConfig.provider === "custom") {
    elements.customUrl.value = settings.llmConfig.customUrl || "";
    elements.customUrlContainer.style.display = "block";
  } else {
    elements.customUrlContainer.style.display = "none";
  }
}

// Test API connection
function testApiConnection() {
  // Get the provider and API key from the form
  const providerName = elements.newProviderName.value.trim();
  const apiKey = elements.newProviderKey.value.trim();
  const apiUrl = elements.newProviderUrl.value.trim();
  
  if (!providerName) {
    showStatus("Please enter a provider name", "error");
    return;
  }
  
  if (!apiKey) {
    showStatus("Please enter an API key", "error");
    return;
  }
  
  // Create a test config
  const testConfig = {
    provider: "custom", // Use custom provider for testing
    apiKey: apiKey,
    customUrl: apiUrl || "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
  };
  
  // Show testing status
  showStatus("Testing API connection...", "info");
  
  // Create a simple test prompt
  const testPrompt = "Hello, this is a test.";
  
  // Make a test request
  fetch(testConfig.customUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${testConfig.apiKey}`
    },
    body: JSON.stringify({ 
      inputs: testPrompt,
      options: {
        use_cache: true,
        wait_for_model: true
      }
    })
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
    showStatus("API connection successful!", "success");
    console.log("API test response:", data);
  })
  .catch(error => {
    showStatus(`API connection failed: ${error.message}`, "error");
    console.error("API test error:", error);
  });
}

// Render prompt recipes table
function renderRecipes(recipes) {
  elements.recipes.innerHTML = "";
  
  recipes.forEach((recipe, index) => {
    const row = document.createElement("tr");
    
    // Name cell
    const nameCell = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = recipe.name;
    nameInput.dataset.index = index;
    nameInput.className = "recipe-name";
    nameCell.appendChild(nameInput);
    
    // Prompt cell
    const promptCell = document.createElement("td");
    const promptTextarea = document.createElement("textarea");
    promptTextarea.value = recipe.prompt;
    promptTextarea.dataset.index = index;
    promptTextarea.className = "recipe-prompt";
    promptCell.appendChild(promptTextarea);
    
    // Action cell
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = () => deleteRecipe(index);
    actionCell.appendChild(deleteButton);
    
    // Add cells to row
    row.appendChild(nameCell);
    row.appendChild(promptCell);
    row.appendChild(actionCell);
    
    elements.recipes.appendChild(row);
  });
}

// Render API keys management table
function renderApiKeys(llmConfig) {
  elements.apiKeysList.innerHTML = "";
  
  // Get current provider from storage
  getFromStorage(["llmConfig"]).then(data => {
    const currentLlmConfig = data.llmConfig || DEFAULT_SETTINGS.llmConfig;
    const currentProvider = currentLlmConfig.provider;
    
    // Create an array of providers from llmConfig
    const apiKeysArray = [];
    
    // Add the current provider
    apiKeysArray.push({
      provider: currentLlmConfig.provider,
      key: currentLlmConfig.apiKey || "",
      url: currentLlmConfig.customUrl || "",
      lastUsed: currentLlmConfig.lastUsed || null,
      isCurrent: true
    });
    
    // Check if there are any API keys to display
    if (apiKeysArray.length === 0) {
      // No API keys to display, show a message and add key button
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 5; // Updated to 5 columns
      cell.style.textAlign = "center";
      cell.style.padding = "20px";
      
      const message = document.createElement("p");
      message.textContent = "No API keys configured yet.";
      cell.appendChild(message);
      
      const editButton = document.createElement("button");
      editButton.textContent = "Edit your LLM provider";
      editButton.onclick = () => {
        // Scroll to the add API key form
        document.querySelector("#newProviderName").scrollIntoView({ behavior: "smooth" });
        // Focus on the provider name field
        setTimeout(() => document.querySelector("#newProviderName").focus(), 500);
      };
      cell.appendChild(editButton);

      row.appendChild(cell);

      elements.apiKeysList.appendChild(row);
      return;
    }
    
    // Render each API key
    apiKeysArray.forEach(item => {
      const row = document.createElement("tr");
      
      // Provider name cell
      const providerCell = document.createElement("td");
      providerCell.textContent = formatProviderName(item.provider);
      
      // Add indicator if this is the current provider
      if (item.isCurrent) {
        const currentBadge = document.createElement("span");
        currentBadge.textContent = " (current)";
        currentBadge.style.color = "#4a55af";
        currentBadge.style.fontWeight = "bold";
        providerCell.appendChild(currentBadge);
      }
      
      // API key cell
      const keyCell = document.createElement("td");
      keyCell.textContent = maskApiKey(item.key);
      keyCell.className = "masked-key";
      
      // API URL cell
      const urlCell = document.createElement("td");
      urlCell.textContent = item.url || "Default";
      
      // Last used cell
      const lastUsedCell = document.createElement("td");
      lastUsedCell.textContent = formatLastUsed(item.lastUsed);
      
      // Actions cell
      const actionCell = document.createElement("td");
      
      // Create button container for better spacing
      const buttonContainer = document.createElement("div");
      buttonContainer.style.display = "flex";
      buttonContainer.style.gap = "5px";
      
      // Edit button
      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      editButton.style.flex = "1";
      editButton.onclick = () => {
        // Populate the form with the current values
        elements.newProviderName.value = formatProviderName(item.provider);
        elements.newProviderKey.value = item.key || "";
        elements.newProviderUrl.value = item.url || "";
        
        // Scroll to the form
        document.querySelector("#newProviderName").scrollIntoView({ behavior: "smooth" });
        // Focus on the provider name field
        setTimeout(() => document.querySelector("#newProviderName").focus(), 500);
      };
      buttonContainer.appendChild(editButton);
      
      // Set as Current button (only show if not current)
      if (!item.isCurrent) {
        const setCurrentButton = document.createElement("button");
        setCurrentButton.textContent = "Set as Current";
        setCurrentButton.style.flex = "1";
        setCurrentButton.onclick = () => setCurrentProvider(item.provider, item.key, item.url);
        buttonContainer.appendChild(setCurrentButton);
      }
      
      // Delete button
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.style.flex = "1";
      deleteButton.onclick = () => deleteApiKey(item.provider);
      buttonContainer.appendChild(deleteButton);
      
      actionCell.appendChild(buttonContainer);
      
      // Add cells to row
      row.appendChild(providerCell);
      row.appendChild(keyCell);
      row.appendChild(urlCell);
      row.appendChild(lastUsedCell);
      row.appendChild(actionCell);
      
      // Add row to table
      elements.apiKeysList.appendChild(row);
    });
  });
}

// Set the current provider
function setCurrentProvider(provider, key, url) {
  getFromStorage(["llmConfig"]).then(data => {
    const llmConfig = data.llmConfig || DEFAULT_SETTINGS.llmConfig;
    
    // Update the llmConfig with the selected provider
    llmConfig.provider = provider;
    llmConfig.apiKey = key;
    
    // Set custom URL if provider is custom or URL is provided
    if (provider === "custom" || url) {
      llmConfig.customUrl = url;
    }
    
    // Save the updated config
    setToStorage({ llmConfig }).then(() => {
      showStatus(`${formatProviderName(provider)} set as current provider`, "success");
      
      // Update the current configuration display
      updateCurrentConfigDisplay(llmConfig);
      
      // Re-render the API keys list to update the current indicator
      renderApiKeys(llmConfig);
    });
  });
}

// Format provider name for display
function formatProviderName(provider) {
  if (provider === "huggingface") return "Hugging Face";
  if (provider === "custom") return "Custom";
  // For custom providers, capitalize first letter of each word
  return provider.split(/[_-]/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(" ");
}

// Format last used date for display
function formatLastUsed(timestamp) {
  if (!timestamp) return "Never";
  
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// Add a new recipe
function addRecipe() {
  getFromStorage(["promptRecipes"]).then(data => {
    const recipes = data.promptRecipes || DEFAULT_SETTINGS.promptRecipes;
    recipes.push({ name: "New Recipe", prompt: "Enter your prompt here. Use {text} as placeholder." });
    renderRecipes(recipes);
  });
}

// Delete a recipe
function deleteRecipe(index) {
  getFromStorage(["promptRecipes"]).then(data => {
    const recipes = data.promptRecipes || DEFAULT_SETTINGS.promptRecipes;
    if (index >= 0 && index < recipes.length) {
      recipes.splice(index, 1);
      renderRecipes(recipes);
    }
  });
}

// Add a new API key
function addNewApiKey() {
  const providerName = elements.newProviderName.value.trim();
  const apiKey = elements.newProviderKey.value.trim();
  const apiUrl = elements.newProviderUrl.value.trim();
  
  if (!providerName) {
    showStatus("Please enter a provider name", "error");
    return;
  }
  
  if (!apiKey) {
    showStatus("Please enter an API key", "error");
    return;
  }
  
  getFromStorage(["llmConfig"]).then(data => {
    const llmConfig = data.llmConfig || DEFAULT_SETTINGS.llmConfig;
    
    // Update the llmConfig with the new API key
    llmConfig.provider = providerName;
    llmConfig.apiKey = apiKey;
    llmConfig.customUrl = apiUrl;
    
    // Save the updated config
    setToStorage({ llmConfig }).then(() => {
      showStatus(`API key for ${providerName} added successfully!`, "success");
      
      // Clear the form fields
      elements.newProviderName.value = "";
      elements.newProviderKey.value = "";
      elements.newProviderUrl.value = "";
      
      // Update the current configuration display
      updateCurrentConfigDisplay(llmConfig);
      
      // Re-render the API keys list
      renderApiKeys(llmConfig);
    });
  });
}

// Delete an API key
function deleteApiKey(provider) {
  if (!confirm(`Are you sure you want to delete the API key for ${formatProviderName(provider)}?`)) {
    return;
  }
  
  getFromStorage(["llmConfig"]).then(data => {
    const llmConfig = data.llmConfig || DEFAULT_SETTINGS.llmConfig;
    
    // Reset the llmConfig
    llmConfig.provider = "huggingface";
    llmConfig.apiKey = "";
    llmConfig.customUrl = "";
    
    // Save the updated config
    setToStorage({ llmConfig }).then(() => {
      showStatus(`API key for ${formatProviderName(provider)} deleted successfully!`, "success");
      
      // Update the current configuration display
      updateCurrentConfigDisplay(llmConfig);
      
      // Re-render the API keys list
      renderApiKeys(llmConfig);
    });
  });
}

// Update the last used timestamp for an API key
function updateApiKeyLastUsed(provider) {
  getFromStorage(["llmConfig"]).then(data => {
    const llmConfig = data.llmConfig || DEFAULT_SETTINGS.llmConfig;
    
    // Update the timestamp if this is the current provider
    if (llmConfig.provider === provider) {
      llmConfig.lastUsed = Date.now();
      
      // Save the updated usage data
      setToStorage({ llmConfig });
    }
  });
}

// Get recipes from form
function getFormRecipes() {
  const recipes = [];
  const nameInputs = document.querySelectorAll(".recipe-name");
  const promptTextareas = document.querySelectorAll(".recipe-prompt");
  
  for (let i = 0; i < nameInputs.length; i++) {
    recipes.push({
      name: nameInputs[i].value.trim(),
      prompt: promptTextareas[i].value.trim()
    });
  }
  
  return recipes;
}

// Get general settings from form
function getFormGeneralSettings() {
  return {
    showSidebarToggle: elements.showSidebarToggle.checked,
    autoShowSidebar: elements.autoShowSidebar.checked
  };
}

// Save settings
function saveSettings() {
  getFromStorage(["llmConfig"]).then(data => {
    const llmConfig = data.llmConfig || DEFAULT_SETTINGS.llmConfig;
    
    // Get custom URL if visible
    if (elements.customUrlContainer.style.display !== "none") {
      llmConfig.customUrl = elements.customUrl.value.trim();
    }
    
    // Get recipes and general settings
    const promptRecipes = getFormRecipes();
    const generalSettings = getFormGeneralSettings();
    
    // Save all settings
    setToStorage({
      llmConfig,
      promptRecipes,
      generalSettings
    }).then(() => {
      showStatus("Settings saved successfully!", "success");
    });
  });
}

// Show status message
function showStatus(message, type = "info") {
  elements.status.textContent = message;
  elements.status.style.display = "block";
  
  // Clear existing classes
  elements.status.className = "status";
  
  // Add type-specific class
  if (type) {
    elements.status.classList.add(type);
  }
  
  // Hide after 5 seconds
  setTimeout(() => {
    elements.status.style.display = "none";
  }, 5000);
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

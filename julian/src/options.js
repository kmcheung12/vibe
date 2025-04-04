// Options page script for Julian browser extension
// Handles settings configuration and storage

// Import storage utilities
import { getFromStorage, setToStorage } from './storage.js';
// Import default settings and schemas
import { DEFAULT_SETTINGS } from './defaults.js';
// Import service functions
import { ping } from './service.js';

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
    apiUrlContainer: document.getElementById("apiUrlContainer"),
    apiUrl: document.getElementById("apiUrl"),
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
  elements.addApiKey.addEventListener("click", addProvider);
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
  getFromStorage(["providers", "currentProviderId", "promptRecipes", "generalSettings"]).then(data => {
    console.log(data);
    let settings;
    if (Object.keys(data).length === 0) {
      settings = DEFAULT_SETTINGS;
      setToStorage(settings).then(() => {
        console.log("Settings initialized with default values.");
      }).catch(error => {
        console.error("Failed to initialize settings with default values:", error);
      });
    } else {
      settings = data;
    }
    
    // Get the current provider
    const currentProvider = getCurrentProvider(settings.providers, settings.currentProviderId);
    
    // Update the current configuration display
    updateCurrentConfigDisplay(currentProvider);
    
    // Populate form fields
    populateFormFields(settings);
    renderRecipes(settings.promptRecipes);
    renderApiKeys(settings.providers, settings.currentProviderId);
  });
}

// Get the current provider from the providers list
function getCurrentProvider(providers, currentProviderId) {
  return providers.find(provider => provider.id === currentProviderId) || providers[0];
}

// Update the current configuration display
function updateCurrentConfigDisplay(provider) {
  elements.currentProvider.textContent = provider.name;
  elements.currentApiKey.textContent = maskApiKey(provider.apiKey);
  elements.currentModel.textContent = provider.model || "Not set";
  
  // Show API URL container if provider is custom
  if (provider.id === "custom") {
    elements.apiUrlContainer.style.display = "block";
    elements.apiUrl.value = provider.apiUrl || "";
  } else {
    elements.apiUrlContainer.style.display = "none";
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
  
  // Get the current provider
  const currentProvider = getCurrentProvider(settings.providers, settings.currentProviderId);
  
  // Set API URL if provider is custom
  if (currentProvider.id === "custom") {
    elements.apiUrl.value = currentProvider.apiUrl || "";
    elements.apiUrlContainer.style.display = "block";
  } else {
    elements.apiUrlContainer.style.display = "none";
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
  
  // Allow empty API key for localhost
  const isLocalhost = apiUrl && (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1'));
  if (!apiKey && !isLocalhost) {
    showStatus("Please enter an API key", "error");
    return;
  }
  
  // Show testing status
  showStatus("Testing API connection...", "info");
  
  // Use the service module to test the connection
  ping()
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
function renderApiKeys(providers, currentProviderId) {
  elements.apiKeysList.innerHTML = "";
  
  // Create an array of providers for display
  const apiKeysArray = providers.map(provider => {
    return {
      id: provider.id,
      provider: provider.id,
      name: provider.name,
      key: provider.apiKey || "",
      url: provider.apiUrl || "",
      lastUsed: provider.lastUsed || null,
      isCurrent: provider.id === currentProviderId
    };
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
    providerCell.textContent = item.name;
    
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
      elements.newProviderName.value = item.name;
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
      setCurrentButton.onclick = () => {
        elements.newProviderName.value = item.name;
        elements.newProviderKey.value = item.key || "";
        elements.newProviderUrl.value = item.url || "";
        setCurrentProvider(item.id);
      }
      buttonContainer.appendChild(setCurrentButton);
    }
    
    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.style.flex = "1";
    deleteButton.onclick = () => deleteApiKey(item.id);
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
}

// Set the current provider
function setCurrentProvider(providerId) {
  getFromStorage(["providers", "currentProviderId"]).then(data => {
    const providers = data.providers || DEFAULT_SETTINGS.providers;
    let currentProviderId = providerId;
    
    // Save the updated config
    setToStorage({ currentProviderId }).then(() => {
      const currentProvider = getCurrentProvider(providers, currentProviderId);
      showStatus(`${currentProvider.name} set as current provider`, "success");
      
      // Update the current configuration display
      updateCurrentConfigDisplay(currentProvider);
      
      // Re-render the API keys list to update the current indicator
      renderApiKeys(providers, currentProviderId);
    });
  });
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

// Add a new provider
function addProvider() {
  const providerName = elements.newProviderName.value.trim();
  const apiKey = elements.newProviderKey.value.trim();
  const apiUrl = elements.newProviderUrl.value.trim();
  
  if (!providerName) {
    showStatus("Please enter a provider name", "error");
    return;
  }
  
  // Allow empty API key for localhost
  const isLocalhost = apiUrl && (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1'));
  if (!apiKey && !isLocalhost) {
    showStatus("Please enter an API key", "error");
    return;
  }
  
  getFromStorage(["providers", "currentProviderId"]).then(data => {
    const providers = data.providers || DEFAULT_SETTINGS.providers;
    
    // Create a normalized ID for the provider
    const providerId = providerName.toLowerCase().replace(/\s+/g, '_');
    
    // Check if this provider already exists
    const existingProviderIndex = providers.findIndex(p => p.id === providerId);
    
    if (existingProviderIndex >= 0) {
      // Update existing provider
      providers[existingProviderIndex].name = providerName;
      providers[existingProviderIndex].apiKey = apiKey;
      providers[existingProviderIndex].apiUrl = apiUrl;
    } else {
      // Add new provider
      providers.push({
        id: providerId,
        name: providerName,
        model: "default",
        apiKey: apiKey,
        apiUrl: apiUrl,
        lastUsed: null,
        schema: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": apiKey ? "Bearer {apiKey}" : null
          },
          body: {
            inputs: "{prompt}",
            options: {
              use_cache: true,
              wait_for_model: true
            }
          }
        }
      });
    }
    
    // Set this as the current provider
    const currentProviderId = providerId;
    
    // Save the updated config
    setToStorage({ providers, currentProviderId }).then(() => {
      showStatus(`${providerName} added successfully!`, "success");
      
      // Clear the form fields
      elements.newProviderName.value = "";
      elements.newProviderKey.value = "";
      elements.newProviderUrl.value = "";
      
      // Get the current provider
      const currentProvider = getCurrentProvider(providers, currentProviderId);
      
      // Update the current configuration display
      updateCurrentConfigDisplay(currentProvider);
      
      // Re-render the API keys list
      renderApiKeys(providers, currentProviderId);
    });
  });
}

// Delete an API key
function deleteApiKey(providerId) {
  getFromStorage(["providers", "currentProviderId"]).then(data => {
    const providers = data.providers || DEFAULT_SETTINGS.providers;
    const currentProviderId = data.currentProviderId || DEFAULT_SETTINGS.currentProviderId;
    
    // Find the provider
    const providerIndex = providers.findIndex(p => p.id === providerId);
    
    if (providerIndex >= 0) {
      // Get the provider name for the status message
      const providerName = providers[providerIndex].name;
      
      // Remove the provider
      providers.splice(providerIndex, 1);
      
      // If we deleted the current provider, set a new current provider
      let newCurrentProviderId = currentProviderId;
      if (providerId === currentProviderId) {
        newCurrentProviderId = providers.length > 0 ? providers[0].id : "huggingface";
      }
      
      // Save the updated config
      setToStorage({ providers, currentProviderId: newCurrentProviderId }).then(() => {
        showStatus(`${providerName} deleted successfully!`, "success");
        
        // Get the new current provider
        const currentProvider = getCurrentProvider(providers, newCurrentProviderId);
        
        // Update the current configuration display
        updateCurrentConfigDisplay(currentProvider);
        
        // Re-render the API keys list
        renderApiKeys(providers, newCurrentProviderId);
      });
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
  getFromStorage(["providers", "currentProviderId"]).then(data => {
    const providers = data.providers || DEFAULT_SETTINGS.providers;
    const currentProviderId = data.currentProviderId || DEFAULT_SETTINGS.currentProviderId;
    
    // Get the current provider
    const currentProviderIndex = providers.findIndex(p => p.id === currentProviderId);
    
    if (currentProviderIndex >= 0 && providers[currentProviderIndex].id === "custom") {
      // Get API URL if visible
      if (elements.apiUrlContainer.style.display !== "none") {
        providers[currentProviderIndex].apiUrl = elements.apiUrl.value.trim();
      }
    }
    
    // Get recipes and general settings
    const promptRecipes = getFormRecipes();
    const generalSettings = getFormGeneralSettings();
    
    // Save all settings
    setToStorage({
      providers,
      currentProviderId,
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

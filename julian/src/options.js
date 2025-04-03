// Options page script for Julian browser extension
// Handles settings configuration and storage

// Import storage utilities
import { browserAPI, getFromStorage, setToStorage, clearStorage } from './storage.js';

// Default settings
const DEFAULT_SETTINGS = {
  providers: [
    {
      id: "huggingface",
      name: "Hugging Face",
      model: "facebook/bart-large-cnn",
      apiKey: "",
      apiUrl: "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      lastUsed: null,
      schema: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer {apiKey}"
        },
        body: {
          inputs: "{prompt}",
          options: {
            use_cache: true,
            wait_for_model: true
          }
        }
      }
    },
    {
      id: "ollama",
      name: "Ollama",
      model: "mistral",
      apiKey: "",
      apiUrl: "http://localhost:11434/api/generate",
      lastUsed: null,
      schema: {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: {
          model: "{model}",
          "stream": false,
          prompt: "{prompt}"
        }
      }
    }
  ],
  currentProviderId: "huggingface",
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
    const mergedSettings = {
      providers: data.providers || DEFAULT_SETTINGS.providers,
      currentProviderId: data.currentProviderId || DEFAULT_SETTINGS.currentProviderId,
      promptRecipes: data.promptRecipes || DEFAULT_SETTINGS.promptRecipes,
      generalSettings: data.generalSettings || DEFAULT_SETTINGS.generalSettings
    };
    
    // Get the current provider
    const currentProvider = getCurrentProvider(mergedSettings.providers, mergedSettings.currentProviderId);
    
    // Update the current configuration display
    updateCurrentConfigDisplay(currentProvider);
    
    // Populate form fields
    populateFormFields(mergedSettings);
    renderRecipes(mergedSettings.promptRecipes);
    renderApiKeys(mergedSettings.providers, mergedSettings.currentProviderId);
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
  
  // Get the current provider schema to use as a base
  getFromStorage(["providers", "currentProviderId"]).then(data => {
    const providers = data.providers || DEFAULT_SETTINGS.providers;
    const currentProviderId = data.currentProviderId || DEFAULT_SETTINGS.currentProviderId;
    const currentProvider = getCurrentProvider(providers, currentProviderId);
    
    // Find a matching provider or use the current one
    const providerId = providerName.toLowerCase().replace(/\s+/g, '_');
    const matchingProvider = providers.find(p => p.id === providerId);
    
    // Create a test config based on the provider schema
    const testConfig = {
      id: providerId,
      name: providerName,
      apiKey: apiKey,
      apiUrl: apiUrl,
      model: matchingProvider?.model || currentProvider.model || "default",
      schema: matchingProvider?.schema || currentProvider.schema || {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: {
          inputs: "{prompt}",
          options: {
            use_cache: true,
            wait_for_model: true
          }
        }
      }
    };
    
    // Show testing status
    showStatus("Testing API connection...", "info");
    
    // Create a simple test prompt
    const testPrompt = "Hello, this is a test.";
    
    // Prepare headers based on schema
    const headers = {};
    
    // Process schema headers with variable substitution
    if (testConfig.schema.headers) {
      Object.entries(testConfig.schema.headers).forEach(([key, value]) => {
        if (value === null) return; // Skip null values
        
        // Replace variables in header values
        if (typeof value === 'string') {
          let processedValue = value;
          
          // Replace {apiKey} with the actual API key
          if (value.includes('{apiKey}') && apiKey) {
            processedValue = processedValue.replace('{apiKey}', apiKey);
          }
          
          headers[key] = processedValue;
        } else {
          headers[key] = value;
        }
      });
    }
    
    // Process schema body with variable substitution
    let requestBody = {};
    if (testConfig.schema.body) {
      requestBody = JSON.parse(JSON.stringify(testConfig.schema.body)); // Deep clone
      
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
              obj[key] = obj[key].replace('{model}', testConfig.model);
            }
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            replaceInObject(obj[key]);
          }
        }
      };
      
      replaceInObject(requestBody);
    }
    
    // Make a test request using the schema
    fetch(testConfig.apiUrl, {
      method: testConfig.schema.method || "POST",
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
      showStatus("API connection successful!", "success");
      console.log("API test response:", data);
    })
    .catch(error => {
      showStatus(`API connection failed: ${error.message}`, "error");
      console.error("API test error:", error);
    });
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
      setCurrentButton.onclick = () => setCurrentProvider(item.id);
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

// Format provider name for display
function formatProviderName(provider) {
  if (provider === "huggingface") return "Hugging Face";
  if (provider === "ollama") return "Ollama";
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

// Update the last used timestamp for an API key
function updateApiKeyLastUsed(providerId) {
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

// Options page script for Julian browser extension
// Handles settings configuration and storage

// Use the appropriate API namespace based on the browser
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Default settings
const DEFAULT_SETTINGS = {
  llmConfig: {
    provider: "huggingface",
    model: "facebook/bart-large-cnn",
    apiKey: "",
    customUrl: ""
  },
  // Store API keys for each provider separately
  providerApiKeys: {
    huggingface: "",
    custom: ""
  },
  // Store API key usage information
  apiKeyUsage: {
    huggingface: { lastUsed: null },
    custom: { lastUsed: null }
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
    llmProvider: document.getElementById("llmProvider"),
    model: document.getElementById("model"),
    modelContainer: document.getElementById("modelContainer"),
    customUrlContainer: document.getElementById("customUrlContainer"),
    customUrl: document.getElementById("customUrl"),
    apiKey: document.getElementById("apiKey"),
    testApi: document.getElementById("testApi"),
    recipes: document.getElementById("recipes"),
    addRecipe: document.getElementById("addRecipe"),
    showSidebarToggle: document.getElementById("showSidebarToggle"),
    autoShowSidebar: document.getElementById("autoShowSidebar"),
    save: document.getElementById("save"),
    reset: document.getElementById("reset"),
    apiKeysList: document.getElementById("apiKeysList"),
    newProviderName: document.getElementById("newProviderName"),
    newProviderKey: document.getElementById("newProviderKey"),
    addApiKey: document.getElementById("addApiKey")
  };
  
  // Load settings
  loadSettings();
  
  // Set up event listeners
  elements.llmProvider.addEventListener("change", toggleProviderFields);
  elements.testApi.addEventListener("click", testApiConnection);
  elements.addRecipe.addEventListener("click", addRecipe);
  elements.addApiKey.addEventListener("click", addNewApiKey);
  elements.save.addEventListener("click", saveSettings);
  elements.reset.addEventListener("click", resetSettings);
}

// Load settings from storage
function loadSettings() {
  // Use Promise-based approach for Firefox compatibility
  const storagePromise = typeof browser !== 'undefined' ? 
    browserAPI.storage.sync.get(["llmConfig", "promptRecipes", "generalSettings", "providerApiKeys", "apiKeyUsage"]) :
    new Promise(resolve => {
      browserAPI.storage.sync.get(["llmConfig", "promptRecipes", "generalSettings", "providerApiKeys", "apiKeyUsage"], resolve);
    });
  
  storagePromise.then(data => {
    const mergedSettings = {
      llmConfig: data.llmConfig || DEFAULT_SETTINGS.llmConfig,
      promptRecipes: data.promptRecipes || DEFAULT_SETTINGS.promptRecipes,
      generalSettings: data.generalSettings || DEFAULT_SETTINGS.generalSettings,
      providerApiKeys: data.providerApiKeys || DEFAULT_SETTINGS.providerApiKeys,
      apiKeyUsage: data.apiKeyUsage || DEFAULT_SETTINGS.apiKeyUsage
    };
    
    // Update the current configuration display
    updateCurrentConfigDisplay(mergedSettings.llmConfig);
    
    // Populate form fields
    populateFormFields(mergedSettings);
    renderRecipes(mergedSettings.promptRecipes);
    renderApiKeys(mergedSettings.providerApiKeys, mergedSettings.apiKeyUsage);
  });
}

// Update the current configuration display
function updateCurrentConfigDisplay(config) {
  elements.currentProvider.textContent = config.provider === "custom" ? "Custom" : 
                                        config.provider === "ollama" ? "Ollama (Local)" : 
                                        "Hugging Face";
  elements.currentApiKey.textContent = maskApiKey(config.apiKey);
  
  if (config.provider === "custom") {
    elements.currentModel.textContent = config.customUrl || "Not set";
  } else if (config.provider === "ollama") {
    elements.currentModel.textContent = config.model || "llama2";
  } else {
    elements.currentModel.textContent = config.model || "facebook/bart-large-cnn";
  }
}

// Mask API key for display
function maskApiKey(key) {
  if (!key) return "Not set";
  if (key.length <= 8) return "********";
  return `${key.slice(0, 4)}${"*".repeat(key.length - 8)}${key.slice(-4)}`;
}

// Populate form fields with settings
function populateFormFields(settings) {
  const { llmConfig, generalSettings, providerApiKeys } = settings;
  
  elements.llmProvider.value = llmConfig.provider;
  elements.model.value = llmConfig.model || "";
  elements.customUrl.value = llmConfig.customUrl || "";
  
  // Set the API key based on the current provider
  if (llmConfig.provider === "huggingface") {
    elements.apiKey.value = providerApiKeys.huggingface || llmConfig.apiKey || "";
  } else if (llmConfig.provider === "custom") {
    elements.apiKey.value = providerApiKeys.custom || llmConfig.apiKey || "";
  } else {
    // Ollama doesn't need an API key
    elements.apiKey.value = "";
  }
  
  elements.showSidebarToggle.checked = generalSettings.showSidebarToggle;
  elements.autoShowSidebar.checked = generalSettings.autoShowSidebar;
  
  toggleProviderFields();
}

// Toggle fields based on provider selection
function toggleProviderFields() {
  const provider = elements.llmProvider.value;
  const isCustom = provider === "custom";
  const isOllama = provider === "ollama";
  
  // Show/hide custom URL field
  elements.customUrlContainer.style.display = isCustom ? "block" : "none";
  
  // Show/hide model field
  elements.modelContainer.style.display = isCustom ? "none" : "block";
  
  // Update API key field placeholder based on provider
  if (isOllama) {
    elements.apiKey.placeholder = "Not required for Ollama";
    elements.apiKey.disabled = true;
  } else {
    elements.apiKey.placeholder = "Enter API Key";
    elements.apiKey.disabled = false;
  }
  
  // Load the appropriate API key for the selected provider
  loadApiKeyForProvider(provider);
}

// Load the API key for the selected provider
function loadApiKeyForProvider(provider) {
  // Use Promise-based approach for Firefox compatibility
  const storagePromise = typeof browser !== 'undefined' ? 
    browserAPI.storage.sync.get(["providerApiKeys"]) :
    new Promise(resolve => {
      browserAPI.storage.sync.get(["providerApiKeys"], resolve);
    });
  
  storagePromise.then(data => {
    const providerApiKeys = data.providerApiKeys || DEFAULT_SETTINGS.providerApiKeys;
    
    if (provider === "huggingface") {
      elements.apiKey.value = providerApiKeys.huggingface || "";
    } else if (provider === "custom") {
      elements.apiKey.value = providerApiKeys.custom || "";
    } else {
      // Ollama doesn't need an API key
      elements.apiKey.value = "";
    }
  });
}

// Render prompt recipes table
function renderRecipes(recipes) {
  elements.recipes.innerHTML = "";
  
  recipes.forEach((recipe, index) => {
    const row = document.createElement("tr");
    
    const nameCell = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = recipe.name;
    nameInput.className = "recipe-name";
    nameInput.dataset.index = index;
    nameCell.appendChild(nameInput);
    
    const promptCell = document.createElement("td");
    const promptTextarea = document.createElement("textarea");
    promptTextarea.value = recipe.prompt;
    promptTextarea.className = "recipe-prompt";
    promptTextarea.dataset.index = index;
    promptCell.appendChild(promptTextarea);
    
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = () => deleteRecipe(index);
    actionCell.appendChild(deleteButton);
    
    row.appendChild(nameCell);
    row.appendChild(promptCell);
    row.appendChild(actionCell);
    
    elements.recipes.appendChild(row);
  });
}

// Render API keys management table
function renderApiKeys(providerApiKeys, apiKeyUsage) {
  elements.apiKeysList.innerHTML = "";
  
  // Convert the providerApiKeys object to an array for easier iteration
  const apiKeysArray = Object.entries(providerApiKeys).map(([provider, key]) => {
    return {
      provider,
      key,
      lastUsed: apiKeyUsage[provider]?.lastUsed || null
    };
  });
  
  // Add custom providers from apiKeyUsage that might not be in the default providerApiKeys
  Object.entries(apiKeyUsage).forEach(([provider, usage]) => {
    if (!providerApiKeys.hasOwnProperty(provider) && provider !== "huggingface" && provider !== "custom") {
      apiKeysArray.push({
        provider,
        key: "",
        lastUsed: usage.lastUsed || null
      });
    }
  });
  
  // Check if there are any API keys to display
  if (apiKeysArray.length === 0 || apiKeysArray.every(item => item.provider === "ollama" || !item.key)) {
    // No API keys to display, show a message and add key button
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.style.textAlign = "center";
    cell.style.padding = "20px";
    
    const message = document.createElement("p");
    message.textContent = "No API keys configured yet.";
    cell.appendChild(message);
    
    const addButton = document.createElement("button");
    addButton.textContent = "Add Your First API Key";
    addButton.onclick = () => {
      // Scroll to the add API key form
      document.querySelector("#newProviderName").scrollIntoView({ behavior: "smooth" });
      // Focus on the provider name field
      setTimeout(() => document.querySelector("#newProviderName").focus(), 500);
    };
    cell.appendChild(addButton);
    
    row.appendChild(cell);
    elements.apiKeysList.appendChild(row);
    return;
  }
  
  // Render each API key
  apiKeysArray.forEach(item => {
    if (item.provider === "ollama") return; // Skip Ollama as it doesn't need an API key
    if (!item.key) return; // Skip empty keys
    
    const row = document.createElement("tr");
    
    // Provider name cell
    const providerCell = document.createElement("td");
    providerCell.textContent = formatProviderName(item.provider);
    
    // API key cell
    const keyCell = document.createElement("td");
    keyCell.textContent = maskApiKey(item.key);
    keyCell.className = "masked-key";
    
    // Last used cell
    const lastUsedCell = document.createElement("td");
    lastUsedCell.textContent = formatLastUsed(item.lastUsed);
    
    // Actions cell
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = () => deleteApiKey(item.provider);
    actionCell.appendChild(deleteButton);
    
    // Add cells to row
    row.appendChild(providerCell);
    row.appendChild(keyCell);
    row.appendChild(lastUsedCell);
    row.appendChild(actionCell);
    
    // Add row to table
    elements.apiKeysList.appendChild(row);
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
  // Use Promise-based approach for Firefox compatibility
  const storagePromise = typeof browser !== 'undefined' ? 
    browserAPI.storage.sync.get(["promptRecipes"]) :
    new Promise(resolve => {
      browserAPI.storage.sync.get(["promptRecipes"], resolve);
    });
  
  storagePromise.then(data => {
    const recipes = data.promptRecipes || DEFAULT_SETTINGS.promptRecipes;
    recipes.push({ name: "New Recipe", prompt: "Enter your prompt here. Use {text} as placeholder." });
    renderRecipes(recipes);
  });
}

// Delete a recipe
function deleteRecipe(index) {
  // Use Promise-based approach for Firefox compatibility
  const storagePromise = typeof browser !== 'undefined' ? 
    browserAPI.storage.sync.get(["promptRecipes"]) :
    new Promise(resolve => {
      browserAPI.storage.sync.get(["promptRecipes"], resolve);
    });
  
  storagePromise.then(data => {
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
  
  if (!providerName) {
    showStatus("Please enter a provider name", "error");
    return;
  }
  
  if (!apiKey) {
    showStatus("Please enter an API key", "error");
    return;
  }
  
  // Use Promise-based approach for Firefox compatibility
  const storagePromise = typeof browser !== 'undefined' ? 
    browserAPI.storage.sync.get(["providerApiKeys", "apiKeyUsage"]) :
    new Promise(resolve => {
      browserAPI.storage.sync.get(["providerApiKeys", "apiKeyUsage"], resolve);
    });
  
  storagePromise.then(data => {
    const providerApiKeys = data.providerApiKeys || DEFAULT_SETTINGS.providerApiKeys;
    const apiKeyUsage = data.apiKeyUsage || DEFAULT_SETTINGS.apiKeyUsage;
    
    // Convert provider name to lowercase and replace spaces with underscores for storage
    const normalizedProviderName = providerName.toLowerCase().replace(/\s+/g, '_');
    
    // Add or update the API key
    providerApiKeys[normalizedProviderName] = apiKey;
    
    // Initialize usage tracking if it doesn't exist
    if (!apiKeyUsage[normalizedProviderName]) {
      apiKeyUsage[normalizedProviderName] = { lastUsed: null };
    }
    
    // Save the updated API keys
    const savePromise = typeof browser !== 'undefined' ? 
      browserAPI.storage.sync.set({ providerApiKeys, apiKeyUsage }) :
      new Promise(resolve => {
        browserAPI.storage.sync.set({ providerApiKeys, apiKeyUsage }, resolve);
      });
    
    savePromise.then(() => {
      showStatus(`API key for ${providerName} added successfully!`, "success");
      
      // Clear the form fields
      elements.newProviderName.value = "";
      elements.newProviderKey.value = "";
      
      // Re-render the API keys list
      renderApiKeys(providerApiKeys, apiKeyUsage);
    });
  });
}

// Delete an API key
function deleteApiKey(provider) {
  if (!confirm(`Are you sure you want to delete the API key for ${formatProviderName(provider)}?`)) {
    return;
  }
  
  // Use Promise-based approach for Firefox compatibility
  const storagePromise = typeof browser !== 'undefined' ? 
    browserAPI.storage.sync.get(["providerApiKeys", "apiKeyUsage"]) :
    new Promise(resolve => {
      browserAPI.storage.sync.get(["providerApiKeys", "apiKeyUsage"], resolve);
    });
  
  storagePromise.then(data => {
    const providerApiKeys = data.providerApiKeys || DEFAULT_SETTINGS.providerApiKeys;
    const apiKeyUsage = data.apiKeyUsage || DEFAULT_SETTINGS.apiKeyUsage;
    
    // Check if this is a built-in provider (huggingface or custom)
    if (provider === "huggingface" || provider === "custom") {
      // For built-in providers, just clear the key but keep the entry
      providerApiKeys[provider] = "";
    } else {
      // For custom providers, remove the entry entirely
      delete providerApiKeys[provider];
      delete apiKeyUsage[provider];
    }
    
    // Save the updated API keys
    const savePromise = typeof browser !== 'undefined' ? 
      browserAPI.storage.sync.set({ providerApiKeys, apiKeyUsage }) :
      new Promise(resolve => {
        browserAPI.storage.sync.set({ providerApiKeys, apiKeyUsage }, resolve);
      });
    
    savePromise.then(() => {
      showStatus(`API key for ${formatProviderName(provider)} deleted successfully!`, "success");
      
      // Re-render the API keys list
      renderApiKeys(providerApiKeys, apiKeyUsage);
    });
  });
}

// Test API connection
function testApiConnection() {
  const config = getFormConfig();
  
  if (!config.apiKey && config.provider !== "ollama") {
    showStatus("Please enter an API key", "error");
    return;
  }
  
  showStatus("Testing API connection...", "");
  
  // Create a simple test prompt
  const testPrompt = "Hello, this is a test.";
  
  // Determine the API endpoint based on provider
  let url;
  let headers = {
    "Content-Type": "application/json"
  };
  let body;
  
  switch (config.provider) {
    case "huggingface":
      url = `https://api-inference.huggingface.co/models/${config.model || "facebook/bart-large-cnn"}`;
      headers["Authorization"] = `Bearer ${config.apiKey}`;
      // Use the correct format for Hugging Face inference API
      body = JSON.stringify({ 
        inputs: testPrompt,
        options: {
          use_cache: true,
          wait_for_model: true
        }
      });
      break;
    case "ollama":
      url = config.customUrl || "http://localhost:11434/api/generate";
      body = JSON.stringify({ 
        model: config.model || "llama2", 
        prompt: testPrompt,
        stream: false
      });
      break;
    case "custom":
      if (!config.customUrl) {
        showStatus("Please enter a custom URL", "error");
        return;
      }
      url = config.customUrl;
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }
      body = JSON.stringify({ inputs: testPrompt });
      break;
    default:
      showStatus("Unknown provider selected", "error");
      return;
  }
  
  // Make the test API call
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
    showStatus("API connection successful!", "success");
    console.log("API response:", data);
    
    // Update the last used timestamp for this provider
    updateApiKeyLastUsed(config.provider);
  })
  .catch(error => {
    showStatus(`API connection failed: ${error.message}`, "error");
    console.error("API error:", error);
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
    const apiKeyUsage = data.apiKeyUsage || DEFAULT_SETTINGS.apiKeyUsage;
    
    // Update the last used timestamp
    if (!apiKeyUsage[provider]) {
      apiKeyUsage[provider] = {};
    }
    
    apiKeyUsage[provider].lastUsed = new Date().toISOString();
    
    // Save the updated usage data
    browserAPI.storage.sync.set({ apiKeyUsage });
  });
}

// Get configuration from form
function getFormConfig() {
  return {
    provider: elements.llmProvider.value,
    model: elements.model.value,
    apiKey: elements.apiKey.value,
    customUrl: elements.customUrl.value
  };
}

// Get recipes from form
function getFormRecipes() {
  const recipes = [];
  const nameInputs = document.querySelectorAll(".recipe-name");
  const promptTextareas = document.querySelectorAll(".recipe-prompt");
  
  for (let i = 0; i < nameInputs.length; i++) {
    recipes.push({
      name: nameInputs[i].value,
      prompt: promptTextareas[i].value
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
  const config = getFormConfig();
  const recipes = getFormRecipes();
  const generalSettings = getFormGeneralSettings();
  
  // Get existing providerApiKeys to update
  const storagePromise = typeof browser !== 'undefined' ? 
    browserAPI.storage.sync.get(["providerApiKeys", "apiKeyUsage"]) :
    new Promise(resolve => {
      browserAPI.storage.sync.get(["providerApiKeys", "apiKeyUsage"], resolve);
    });
  
  storagePromise.then(data => {
    const providerApiKeys = data.providerApiKeys || DEFAULT_SETTINGS.providerApiKeys;
    const apiKeyUsage = data.apiKeyUsage || DEFAULT_SETTINGS.apiKeyUsage;
    
    // Update the API key for the current provider
    if (config.provider === "huggingface") {
      providerApiKeys.huggingface = config.apiKey;
    } else if (config.provider === "custom") {
      providerApiKeys.custom = config.apiKey;
    }
    
    const settings = {
      llmConfig: config,
      promptRecipes: recipes,
      generalSettings: generalSettings,
      providerApiKeys: providerApiKeys,
      apiKeyUsage: apiKeyUsage
    };
    
    // Use Promise-based approach for Firefox compatibility
    const savePromise = typeof browser !== 'undefined' ? 
      browserAPI.storage.sync.set(settings) :
      new Promise(resolve => {
        browserAPI.storage.sync.set(settings, resolve);
      });
    
    savePromise.then(() => {
      showStatus("Settings saved successfully!", "success");
      updateCurrentConfigDisplay(config);
      renderApiKeys(providerApiKeys, apiKeyUsage);
    });
  });
}

// Reset settings to defaults
function resetSettings() {
  if (confirm("Are you sure you want to reset all settings to defaults?")) {
    // Use Promise-based approach for Firefox compatibility
    const clearPromise = typeof browser !== 'undefined' ? 
      browserAPI.storage.sync.clear() :
      new Promise(resolve => {
        browserAPI.storage.sync.clear(resolve);
      });
    
    clearPromise.then(() => {
      showStatus("Settings reset to defaults", "success");
      loadSettings();
    });
  }
}

// Show status message
function showStatus(message, type) {
  elements.status.textContent = message;
  elements.status.className = "status";
  if (type) {
    elements.status.classList.add(type);
  }
  elements.status.style.display = "block";
  
  // Hide status after 5 seconds
  setTimeout(() => {
    elements.status.style.display = "none";
  }, 5000);
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

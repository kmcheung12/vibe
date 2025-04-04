// Service module for Julian browser extension
// Handles API interactions with different providers

import { getFromStorage } from './storage.js';
import { DEFAULT_SETTINGS } from './defaults.js';

/**
 * Retrieves the current provider from storage
 * @returns {Promise<Object>} The current provider object
 */
export async function getCurrentProvider() {
  const data = await getFromStorage(["providers", "currentProviderId"]);
  const providers = data.providers || DEFAULT_SETTINGS.providers;
  const currentProviderId = data.currentProviderId || DEFAULT_SETTINGS.currentProviderId;
  return providers.find(provider => provider.id === currentProviderId) || providers[0];
}

/**
 * Prepares API headers based on provider schema
 * @param {Object} provider - The provider object
 * @returns {Object} The prepared headers
 */
function prepareHeaders(provider) {
  const headers = {};
  
  if (provider.schema.headers) {
    Object.entries(provider.schema.headers).forEach(([key, value]) => {
      if (value === null) return; // Skip null values
      
      // Replace variables in header values
      if (typeof value === 'string') {
        let processedValue = value;
        
        // Replace {apiKey} with the actual API key
        if (value.includes('{apiKey}') && provider.apiKey) {
          processedValue = processedValue.replace('{apiKey}', provider.apiKey);
        }
        
        headers[key] = processedValue;
      } else {
        headers[key] = value;
      }
    });
  }
  
  return headers;
}

/**
 * Prepares request body based on provider schema
 * @param {Object} provider - The provider object
 * @param {string} prompt - The prompt to send
 * @param {boolean} stream - Whether to use streaming mode
 * @returns {Object} The prepared request body
 */
function prepareBody(provider, prompt, stream = false) {
  let requestBody = {};
  
  if (provider.schema.body) {
    requestBody = JSON.parse(JSON.stringify(provider.schema.body)); // Deep clone
    
    // Replace variables in the body
    const replaceInObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          // Replace {prompt} with the actual prompt
          if (obj[key].includes('{prompt}')) {
            obj[key] = obj[key].replace('{prompt}', prompt);
          }
          
          // Replace {model} with the model name
          if (obj[key].includes('{model}')) {
            obj[key] = obj[key].replace('{model}', provider.model);
          }
          
          // Replace {stream} with the stream flag
          if (obj[key].includes('{stream}')) {
            obj[key] = stream;
          }
        } else if (key === 'stream') {
          // Directly set the stream value if the key is 'stream'
          obj[key] = stream;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          replaceInObject(obj[key]);
        }
      }
    };
    
    replaceInObject(requestBody);
  }
  
  return requestBody;
}

/**
 * Retrieves prompts from storage
 * @param {string} recipeName - The name of the prompt recipe
 * @param {string} defaultPrompt - The default prompt if recipe not found
 * @param {string} text - The text to insert into the prompt
 * @returns {Promise<string>} The prepared prompt
 */
export async function getPrompt(recipeName, defaultPrompt, text) {
  const data = await getFromStorage(["promptRecipes"]);
  const recipe = data.promptRecipes?.find(r => r.name === recipeName) || 
                { prompt: defaultPrompt };
  return recipe.prompt.replace("{text}", text);
}

/**
 * Updates the last used timestamp for a provider
 * @param {string} providerId - The ID of the provider
 * @returns {Promise<void>}
 */
async function updateProviderLastUsed(providerId) {
  const data = await getFromStorage(["providers"]);
  const providers = data.providers || [];
  
  // Find the provider and update its lastUsed timestamp
  const updatedProviders = providers.map(provider => {
    if (provider.id === providerId) {
      return { ...provider, lastUsed: Date.now() };
    }
    return provider;
  });
  
  // Save the updated providers back to storage
  await browser.storage.local.set({ providers: updatedProviders });
}

/**
 * Sends a ping request to test API connection
 * @param {boolean} stream - Whether to use streaming mode
 * @returns {Promise<Object>} The API response
 */
export async function ping(stream = false) {
  const provider = await getCurrentProvider();
  updateProviderLastUsed(provider.id);
  
  const testPrompt = "Hello, this is a test. Please response yes.";
  const headers = prepareHeaders(provider);
  const requestBody = prepareBody(provider, testPrompt, stream);
  
  return fetch(provider.apiUrl, {
    method: provider.schema.method || "POST",
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
  });
}

/**
 * Sends a question to the AI provider
 * @param {string} question - The question to ask
 * @param {boolean} stream - Whether to use streaming mode
 * @returns {Promise<Object>} The AI response with completion status
 */
export async function ask(question, stream = false) {
  const provider = await getCurrentProvider();
  updateProviderLastUsed(provider.id);
  
  // Get prompt template for "Ask Julian"
  const prompt = await getPrompt(
    "Ask Julian", 
    "Answer the following question: {text}", 
    question
  );
  
  const headers = prepareHeaders(provider);
  const requestBody = prepareBody(provider, prompt, stream);
  
  if (!stream) {
    // Non-streaming mode - return full response at once
    return fetch(provider.apiUrl, {
      method: provider.schema.method || "POST",
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
      // Process the response based on the provider type
      let result;
      
      // Handle different response formats
      if (provider.id === "huggingface") {
        result = data[0]?.generated_text || data.generated_text || data;
      } else if (provider.id === "ollama") {
        result = data.response || data;
      } else {
        // Default handling for other providers
        result = data.generated_text || data.response || data.output || data.text || data;
      }
      
      return { 
        text: result, 
        completed: true 
      };
    });
  } else {
    // Streaming mode - return a reader that emits events
    return fetch(provider.apiUrl, {
      method: provider.schema.method || "POST",
      headers: headers,
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`API request failed: ${response.status} ${response.statusText} - ${text}`);
        });
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      return {
        reader,
        decoder,
        provider,
        read: async function() {
          const { done, value } = await reader.read();
          
          if (done) {
            return { text: "", completed: true };
          }
          
          const chunk = decoder.decode(value, { stream: true });
          let result;
          
          try {
            // Try to parse JSON from the chunk
            const jsonData = JSON.parse(chunk);
            
            // Handle different provider formats
            if (provider.id === "ollama") {
              result = jsonData.response || "";
            } else {
              result = jsonData.generated_text || jsonData.response || jsonData.output || jsonData.text || "";
            }
          } catch (e) {
            // If parsing fails, just use the raw chunk
            result = chunk;
          }
          
          return { text: result, completed: false };
        }
      };
    });
  }
}

/**
 * Sends a text to be summarized by the AI provider
 * @param {string} text - The text to summarize
 * @param {boolean} stream - Whether to use streaming mode
 * @returns {Promise<Object>} The summarized text with completion status
 */
export async function summarize(text, stream = false) {
  
  const provider = await getCurrentProvider();
  updateProviderLastUsed(provider.id);
  
  // Get prompt template for "Summarize Page"
  const prompt = await getPrompt(
    "Summarize Page", 
    "Summarize the following text: {text}", 
    text
  );
  
  const headers = prepareHeaders(provider);
  const requestBody = prepareBody(provider, prompt, stream);
  console.log("service.js", headers, requestBody, stream);
  if (!stream) {
    // Non-streaming mode - return full response at once
    return fetch(provider.apiUrl, {
      method: provider.schema.method || "POST",
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
      // Process the response based on the provider type
      let result;
      
      // Handle different response formats
      if (provider.id === "huggingface") {
        result = data[0]?.generated_text || data.generated_text || data;
      } else if (provider.id === "ollama") {
        result = data.response || data;
      } else {
        // Default handling for other providers
        result = data.generated_text || data.response || data.output || data.text || data;
      }
      
      return { 
        text: result, 
        completed: true 
      };
    });
  } else {
    // Streaming mode - return a reader that emits events
    return fetch(provider.apiUrl, {
      method: provider.schema.method || "POST",
      headers: headers,
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`API request failed: ${response.status} ${response.statusText} - ${text}`);
        });
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      return {
        reader,
        decoder,
        provider,
        read: async function() {
          const { done, value } = await reader.read();
          
          if (done) {
            return { text: "", completed: true };
          }
          
          const chunk = decoder.decode(value, { stream: true });
          let result;
          
          try {
            // Try to parse JSON from the chunk
            const jsonData = JSON.parse(chunk);
            
            // Handle different provider formats
            if (provider.id === "ollama") {
              result = jsonData.response || "";
            } else {
              result = jsonData.generated_text || jsonData.response || jsonData.output || jsonData.text || "";
            }
          } catch (e) {
            // If parsing fails, just use the raw chunk
            result = chunk;
          }
          
          return { text: result, completed: false };
        }
      };
    });
  }
}

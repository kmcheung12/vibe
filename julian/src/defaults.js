// Default configuration for Julian browser extension

// Default schemas for different providers
export const DEFAULT_SCHEMAS = {
  "huggingface": {
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
  },
  "ollama": {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      model: "{model}",
      stream: false,
      prompt: "{prompt}"
    }
  }
};

// Default settings
export const DEFAULT_SETTINGS = {
  providers: [
    {
      id: "huggingface",
      name: "Hugging Face",
      model: "facebook/bart-large-cnn",
      apiKey: "",
      apiUrl: "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      lastUsed: null,
      schema: DEFAULT_SCHEMAS.huggingface
    },
    {
      id: "ollama",
      name: "Ollama",
      model: "mistral",
      apiKey: "",
      apiUrl: "http://localhost:11434/api/generate",
      lastUsed: null,
      schema: DEFAULT_SCHEMAS.ollama
    }
  ],
  currentProviderId: "ollama",
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

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
      apiUrl: "http://192.168.1.84:11434/api/generate",
      lastUsed: null,
      schema: DEFAULT_SCHEMAS.ollama
    }
  ],
  currentProviderId: "ollama",
  promptRecipes: [
    { id: "summarize", name: "Summarize Page", prompt: "Summarize the following article in the following format\n sentiment: {sentiment}\nTime to read: {}\nClick bait-ness: {N/5}\nFake news-ness: {N/5}. What sentiment is the article trying to present, answer the sentiment in one word. How much time is expected to read such article. Evaluate how likely the article is a click bait or fake news.\n ===== \n {text}" }
  ],
  defaultRecipeId: 'summarize',
  generalSettings: {
    showSidebarToggle: true,
    autoShowSidebar: true
  }
};

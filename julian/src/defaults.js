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
      messages: [{
        role: "user",
        content: "{prompt}"
      }],
      stream: false
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
      apiUrl: "http://192.168.1.84:11434/api/chat",
      lastUsed: null,
      schema: DEFAULT_SCHEMAS.ollama
    }
  ],
  currentProviderId: "ollama",
  promptRecipes: [
    { id: "summarize", name: "Summarize Page", prompt: `

# Instructions:
## Summarize:
Summarize the following article in the following dimension
- "Sentiment": {sentiment}
- "Time to read": {time_to_read}
- "Click bait-ness": {click_bait}
- "Fake news-ness": {fake_news}. 
- {summary}
where,
- {sentiment} is one word representing the sentiment of the article.
- {time_to_read} is the time it takes to read the article in minutes.
- {click_bait} and {fake_news} are score from 1 to 5, respond only in number. Do not include other words. 
- {summary} is the summary of the article.

####
{text}
####
` }
  ],
  defaultRecipeId: 'summarize',
  generalSettings: {
    showSidebarToggle: true,
    autoShowSidebar: true
  }
};

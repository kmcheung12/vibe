# Julian Browser Extension

Julian is a Chrome and Firefox extension that offers AI-powered question answering, webpage summarization, and text generation capabilities. It mimics Brave's Leo AI assistant with a customizable interface and configurable LLM tools.

## Features

- **AI-Powered Question Answering**: Query LLM via sidebar or context menu
- **Webpage Summarization**: Summarize pages with user-defined prompt recipes
- **Text Generation**: Generate text from prompts
- **Customizable Settings**: Configure LLM provider, API key, and prompt recipes
- **Privacy-Focused**: No persistent query storage, API keys stored locally

## Installation

### Prerequisites

- Node.js (v16+)
- npm

### Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   cd julian
   npm install
   ```

3. Build the extension:
   - For Chrome:
     ```bash
     npm run build
     ```
   - For Firefox:
     ```bash
     npm run build:firefox
     ```

4. Load the extension:
   - **Chrome**:
     - Open `chrome://extensions/`
     - Enable "Developer mode"
     - Click "Load unpacked"
     - Select the `dist` folder
   - **Firefox**:
     - Open `about:debugging`
     - Click "This Firefox"
     - Click "Load Temporary Add-on"
     - Select any file in the `dist` folder

## Usage

### Sidebar

- Click the Julian icon in your browser toolbar to toggle the sidebar
- Use the sidebar to:
  - Ask questions
  - Summarize the current page
  - Generate text based on your input

### Context Menu

Right-click on any webpage to access Julian's features:
- **Ask Julian**: Right-click on selected text to ask a question
- **Summarize Page**: Right-click anywhere on the page to summarize it
- **Generate with Julian**: Right-click on selected text to generate content

### Options Page

Access the options page by right-clicking the Julian icon and selecting "Options" to:
- Configure your LLM provider and API key
- Customize prompt recipes
- Adjust general settings

## Development

- Run in watch mode for development:
  ```bash
  npm run dev
  ```
- The extension will be built to the `dist` folder
- Any changes to the source files will trigger a rebuild

## Configuration

### LLM Providers

Julian supports the following LLM providers:
- **Hugging Face**: Default provider using models like facebook/bart-large-cnn
- **Custom**: Configure your own API endpoint

### Prompt Recipes

Create and customize prompt recipes for different use cases:
- **Ask Julian**: Default prompt for question answering
- **Summarize Page**: Default prompt for page summarization
- **Generate Text**: Default prompt for text generation

## Privacy

- No data is sent to any server except the configured LLM provider
- API keys are stored locally in your browser's storage
- No query history is maintained

## License

ISC

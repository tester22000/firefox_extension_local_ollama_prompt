## 🤖 Local Ollama Prompt: A Firefox Extension

Local Ollama Prompt is a Firefox extension that leverages the Ollama API to analyze and summarize web content, images, and user-selected text. It provides a seamless user experience through the browser's context menu and allows users to manage a list of custom prompts.

---

### ✨ Key Features

- **Web Content Analysis**: Extracts the main body text from a webpage for analysis by an Ollama model.
- **Image Analysis**: Converts images on a webpage to Base64 data for analysis by multimodal models like `llava`.
- **Selected Text Analysis**: Includes user-selected text in the prompt for targeted analysis.
- **Custom Prompt Management**: Save and reuse your favorite prompts directly from the popup.
- **Ollama Server Configuration**: Easily set your local Ollama server address and a default model from the extension's options page.

---

### 📂 Project Structure

```
ollama-prompt/
├── manifest.json            # Extension metadata and permissions (Manifest V3)
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   └── icon-48.png          # Extension icon files
├── src/
│   ├── js/
│   │   ├── background.js    # Service worker: handles context menus and extension events
│   │   ├── contentScript.js # Accesses webpage DOM to extract data
│   │   ├── popup.js         # Manages the logic for the popup UI
│   │   └── options.js       # Handles the logic for the options page
│   ├── css/
│   │   └── tailwind.css     # The built Tailwind CSS file
│   └── lib/
│       ├── jquery-3.7.1.min.js
│       ├── marked.min.js
│       └── defuddl.min.js   # External libraries (jQuery, Marked.js, deFuddl)
├── popup.html               # The HTML for the popup UI
├── options.html             # The HTML for the options page
└── tailwind.config.js       # Tailwind CSS configuration file
```

---

### ⚙️ Installation and Setup

1. **Run Ollama**: Start your local Ollama server and download the models you need.
2. **Load the Extension**:
	1. Open your Firefox browser.
	2. Navigate to `about:debugging#/runtime/this-firefox` in the address bar.
	3. Click the **"Load Temporary Add-on"** button.
	4. Select the `manifest.json` file from your project directory.
3. **Configure the Extension**:
	1. Go to **"Add-ons and themes"** from the Firefox menu (☰).
	2. Find the `Ollama Prompt` extension and click **"Options"**.
	3. Enter your `Ollama Server URL`, then click **"Test Connection"** to fetch the list of available models.
	4. Select a `Default Model` and click **"Save Settings"**.

---

### 📖 How to Use

1. **Analyze Text**: Select text on a webpage, right-click, and choose **"Analyze selected text with Ollama"**. Then, click the extension icon to open the popup with the text pre-filled.
2. **Analyze an Image**: Right-click an image on a webpage and select **"Analyze image with Ollama"**. Click the extension icon to open the popup in image analysis mode.
3. **Get Results**: Enter your desired prompt in the popup and click the **"Run"** button to get the analysis result from the Ollama API.

---

### 📌 Dependencies

- **jQuery**: Used for simplified DOM manipulation.
- **Marked.js**: Renders the Markdown response from Ollama into HTML.
- **deFuddl**: Used to extract clean article content from a webpage, excluding ads and navigation elements.

These files must be downloaded from their respective sources ([GitHub](https://github.com/markedjs/marked/releases), [CDN](https://cdnjs.com/libraries/marked), or NPM) and placed in the `src/lib/` folder.

---

### 📝 License

This project is licensed under the MIT License.
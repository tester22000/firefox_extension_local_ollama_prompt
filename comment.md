### build tailwind.css

```
npm install -D tailwindcss@3 postcss autoprefixer

npx tailwindcss init -p

npx tailwindcss -i ./src/input.css -o ./src/css/tailwind.css --minify
```

### ollama env setting

```
OLLAMA_ORIGINS="http://localhost,chrome-extension://*,moz-extension://*,safari-web-extension://*"
```
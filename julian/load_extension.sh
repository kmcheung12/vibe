#!/bin/bash

# Build the extension for Firefox
npm run build:firefox

echo "Extension built for Firefox with explicit addon ID"
echo "To load the extension in Firefox:"
echo "1. Open Firefox"
echo "2. Go to about:debugging"
echo "3. Click 'This Firefox'"
echo "4. Click 'Load Temporary Add-on...'"
echo "5. Navigate to the dist folder and select manifest.json"
echo ""
echo "The extension should now load with the proper addon ID and storage API should work."

import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const isFirefox = mode === "firefox";
  const browser = isFirefox ? "firefox" : "chrome";
  
  // Generate build timestamp
  const buildTime = new Date().toISOString();
  
  return {
    plugins: [
      webExtension({
        browser,
        manifest: () => {
          // Use different manifest files for Chrome and Firefox
          if (isFirefox) {
            return JSON.parse(fs.readFileSync("./manifest.firefox.json", "utf-8"));
          } else {
            return JSON.parse(fs.readFileSync("./manifest.json", "utf-8"));
          }
        },
      }),
    ],
    define: {
      // Define global constants that will be replaced at build time
      __BUILD_TIME__: JSON.stringify(buildTime),
    },
  };
});

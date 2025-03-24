import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const isFirefox = mode === "firefox";
  const browser = isFirefox ? "firefox" : "chrome";
  
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
  };
});

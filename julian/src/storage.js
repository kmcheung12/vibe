// Storage utility functions for Julian browser extension

// Determine browser type
const isChrome = typeof browser === 'undefined';
// Use the appropriate API namespace based on the browser
const browserAPI = isChrome ? chrome : browser;

/**
 * Get data from storage
 * @param {string|string[]} keys - The key(s) to retrieve from storage
 * @returns {Promise} - Promise that resolves with the retrieved data
 */
function getFromStorage(keys) {
  return isChrome ? 
    new Promise(resolve => {
      browserAPI.storage.sync.get(keys, resolve);
    }) : 
    browserAPI.storage.sync.get(keys);
}

/**
 * Set data to storage
 * @param {Object} data - The data to save to storage
 * @returns {Promise} - Promise that resolves when data is saved
 */
function setToStorage(data) {
  return isChrome ? 
    new Promise(resolve => {
      browserAPI.storage.sync.set(data, resolve);
    }) : 
    browserAPI.storage.sync.set(data);
}

/**
 * Clear all storage data
 * @returns {Promise} - Promise that resolves when storage is cleared
 */
function clearStorage() {
  return isChrome ? 
    new Promise(resolve => {
      browserAPI.storage.sync.clear(resolve);
    }) : 
    browserAPI.storage.sync.clear();
}

// Export the utility functions and constants
export {
  isChrome,
  browserAPI,
  getFromStorage,
  setToStorage,
  clearStorage
};

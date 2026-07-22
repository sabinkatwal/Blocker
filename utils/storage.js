async function getFullStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['blockedWebsites', 'settings', 'history'], (result) => {
      resolve(result || {});
    });
  });
}

async function setStorageValue(value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(value, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function removeStorageKeys(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keys, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

const STORAGE_DEFAULTS = {
  blockedWebsites: [],
  settings: {},
  history: []
};

function wrapLastError(resolve, reject, value) {
  const error = chrome.runtime.lastError;
  if (error) {
    reject(error);
  } else {
    resolve(value);
  }
}

async function getFullStorage(keys = Object.keys(STORAGE_DEFAULTS)) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(error);
        return;
      }
      const merged = { ...STORAGE_DEFAULTS, ...result };
      resolve(merged);
    });
  });
}

async function setStorageValue(value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(value, () => wrapLastError(resolve, reject));
  });
}

async function removeStorageKeys(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keys, () => wrapLastError(resolve, reject));
  });
}
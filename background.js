importScripts('utils/storage.js', 'utils/timer.js', 'utils/validator.js', 'utils/helpers.js');

const REFRESH_ALARM = 'refresh-blocks';

let isRefreshing = false;
let refreshQueued = false;

async function getAppState() {
  const state = await getFullStorage();
  return {
    blockedWebsites: state.blockedWebsites || [],
    settings: state.settings || {},
    history: state.history || []
  };
}

async function saveAppState(updates) {
  await setStorageValue(updates);
}

async function createRefreshAlarm() {
  chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: 1 });
}

async function sendNotification(id, title, message) {
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: 'icons/128.png',
    title,
    message,
    priority: 2
  });
}

function updateBadge(count) {
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#3b67f7' });
}

async function refreshActiveBlocks() {
  if (isRefreshing) {
    refreshQueued = true;
    return null;
  }
  isRefreshing = true;

  try {
    const state = await getAppState();
    const activeBlocks = [];
    let changed = false;

    for (const entry of state.blockedWebsites) {
      if (isExpired(entry)) {
        if (!entry.notifiedEnded) {
          sendNotification(`end-${entry.domain}-${entry.endTime}`, 'FocusBlocker', `Blocking ended for ${entry.domain}`);
          entry.notifiedEnded = true;
        }
        changed = true;
        continue;
      }

      if (shouldNotifyFiveMin(entry)) {
        sendNotification(`five-min-${entry.domain}-${entry.endTime}`, 'FocusBlocker', `5 minutes remaining for ${entry.domain}`);
        entry.notifiedFiveMin = true;
        changed = true;
      }

      activeBlocks.push(entry);
    }

    if (changed || activeBlocks.length !== state.blockedWebsites.length) {
      await saveAppState({ blockedWebsites: activeBlocks });
    }

    updateBadge(activeBlocks.length);
    return activeBlocks;
  } catch (error) {
    console.error('FocusBlocker: failed to refresh blocks', error);
    return null;
  } finally {
    isRefreshing = false;
    if (refreshQueued) {
      refreshQueued = false;
      refreshActiveBlocks();
    }
  }
}

async function redirectIfBlocked(tab, activeBlocks) {
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }

  const pageHost = getHostnameFromUrl(tab.url);
  if (!pageHost) {
    return;
  }

  for (const block of activeBlocks) {
    if (isDomainMatch(pageHost, block.domain)) {
      const redirectUrl = chrome.runtime.getURL(`blocked.html?target=${encodeURIComponent(block.domain)}`);
      if (tab.url !== redirectUrl) {
        chrome.tabs.update(tab.id, { url: redirectUrl });
      }
      return;
    }
  }
}

async function handleTabUpdated(tabId, changeInfo, tab) {
  try {
    if (changeInfo.status !== 'complete' || !tab.url) {
      return;
    }

    const activeBlocks = await refreshActiveBlocks();
    if (!activeBlocks) {
      return;
    }

    await redirectIfBlocked(tab, activeBlocks);
  } catch (error) {
    console.error('FocusBlocker: failed to handle tab update', error);
  }
}

async function enforceBlocksOnOpenTabs() {
  try {
    const activeBlocks = await refreshActiveBlocks();
    if (!activeBlocks || !activeBlocks.length) {
      return;
    }

    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      await redirectIfBlocked(tab, activeBlocks);
    }
  } catch (error) {
    console.error('FocusBlocker: failed to enforce blocks on open tabs', error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  createRefreshAlarm();
  refreshActiveBlocks();
});

chrome.runtime.onStartup.addListener(() => {
  createRefreshAlarm();
  refreshActiveBlocks();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === REFRESH_ALARM) {
    refreshActiveBlocks();
  }
});

chrome.tabs.onUpdated.addListener(handleTabUpdated);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.blockedWebsites) {
    enforceBlocksOnOpenTabs();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'openPopup') {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    sendResponse({ success: true });
  }
  return false;
});

chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
});
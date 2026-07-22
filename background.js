importScripts('utils/storage.js', 'utils/timer.js', 'utils/validator.js', 'utils/helpers.js');

const REFRESH_ALARM = 'refresh-blocks';

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
      sendNotification(`five-min-${entry.domain}`, 'FocusBlocker', `5 minutes remaining for ${entry.domain}`);
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
}

async function handleTabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.status !== 'complete' || !tab.url) {
    return;
  }

  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }

  const activeBlocks = await refreshActiveBlocks();
  const pageHost = getHostnameFromUrl(tab.url);

  if (!pageHost) {
    return;
  }

  for (const block of activeBlocks) {
    if (isDomainMatch(pageHost, block.domain)) {
      const redirectUrl = chrome.runtime.getURL(`blocked.html?target=${encodeURIComponent(block.domain)}`);
      if (tab.url !== redirectUrl) {
        chrome.tabs.update(tabId, { url: redirectUrl });
      }
      return;
    }
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await createRefreshAlarm();
  await refreshActiveBlocks();
});

chrome.runtime.onStartup.addListener(async () => {
  await createRefreshAlarm();
  await refreshActiveBlocks();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === REFRESH_ALARM) {
    await refreshActiveBlocks();
  }
});

chrome.tabs.onUpdated.addListener(handleTabUpdated);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.blockedWebsites) {
    refreshActiveBlocks();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'openPopup') {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    sendResponse({ success: true });
  }
});

chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
});

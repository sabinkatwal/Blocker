const blockedDomainElement = document.getElementById('blockedDomain');
const remainingTimeElement = document.getElementById('remainingTime');
const currentTimeElement = document.getElementById('currentTime');
const quoteText = document.getElementById('quoteText');
const productivityTip = document.getElementById('productivityTip');
const backButton = document.getElementById('backButton');
const openPopupButton = document.getElementById('openPopupButton');

const quotes = [
  'A short break can make your next hour more productive.',
  'Focus is the secret to achieving more with less time.',
  'Build momentum in small, intentional bursts.',
  'Every minute of focus creates a stronger future.',
  'Consistency beats intensity when it comes to progress.'
];

const tips = [
  'Try the Pomodoro method: work 25 minutes, then rest 5.',
  'Limit open tabs to one or two during deep focus sessions.',
  'Turn off notifications for nonessential apps while working.',
  'Use a simple checklist for the next task before you begin.',
  'Set a clear outcome for this blocking session.'
];

const STORAGE_RESYNC_MS = 5000;

let tickInterval = null;
let currentEntry = null;
let hasExited = false;

function getQueryParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || '';
}

function updateCurrentTime() {
  currentTimeElement.textContent = formatTime(new Date());
}

function exitBlockedPage() {
  if (hasExited) {
    return;
  }
  hasExited = true;
  if (tickInterval) {
    clearInterval(tickInterval);
  }
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.close();
  }
}

async function fetchEntry(blockedDomain) {
  try {
    const state = await getFullStorage();
    return (state.blockedWebsites || []).find((item) => item.domain === blockedDomain) || null;
  } catch (error) {
    return currentEntry;
  }
}

function renderRemaining() {
  if (!currentEntry) {
    remainingTimeElement.textContent = '00:00:00';
    exitBlockedPage();
    return;
  }

  const remainingMs = getRemainingMs(currentEntry);
  remainingTimeElement.textContent = formatCountdown(remainingMs);

  if (remainingMs <= 0) {
    exitBlockedPage();
  }
}

function chooseRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function openPopupWindow() {
  chrome.runtime.sendMessage({ action: 'openPopup' }, () => {
    void chrome.runtime.lastError;
  });
}

backButton.addEventListener('click', () => {
  exitBlockedPage();
});

openPopupButton.addEventListener('click', () => {
  openPopupWindow();
});

async function initBlockedPage() {
  const domain = getQueryParameter('target');
  blockedDomainElement.textContent = domain || 'This website';
  quoteText.textContent = chooseRandom(quotes);
  productivityTip.textContent = chooseRandom(tips);
  updateCurrentTime();

  if (!domain) {
    remainingTimeElement.textContent = '00:00:00';
    return;
  }

  currentEntry = await fetchEntry(domain);
  renderRemaining();

  let msSinceResync = 0;

  tickInterval = setInterval(async () => {
    updateCurrentTime();
    msSinceResync += 1000;

    if (msSinceResync >= STORAGE_RESYNC_MS) {
      msSinceResync = 0;
      currentEntry = await fetchEntry(domain);
    }

    renderRemaining();
  }, 1000);
}

initBlockedPage();
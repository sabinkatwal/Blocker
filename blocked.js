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

function getQueryParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || '';
}

function updateCurrentTime() {
  currentTimeElement.textContent = formatTime(new Date());
}

async function updateRemainingTime(blockedDomain) {
  const state = await getFullStorage();
  const entry = (state.blockedWebsites || []).find((item) => item.domain === blockedDomain);
  if (!entry) {
    remainingTimeElement.textContent = '00:00:00';
    return;
  }

  const remainingMs = getRemainingMs(entry);
  remainingTimeElement.textContent = formatCountdown(remainingMs);
}

function chooseRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function openPopupWindow() {
  chrome.runtime.sendMessage({ action: 'openPopup' });
}

backButton.addEventListener('click', () => {
  window.history.back();
});

openPopupButton.addEventListener('click', () => {
  openPopupWindow();
});

async function initBlockedPage() {
  const domain = getQueryParameter('target');
  blockedDomainElement.textContent = domain ? domain : 'This website';
  quoteText.textContent = chooseRandom(quotes);
  productivityTip.textContent = chooseRandom(tips);

  await updateRemainingTime(domain);
  updateCurrentTime();

  setInterval(() => {
    updateRemainingTime(domain);
    updateCurrentTime();
  }, 1000);
}

initBlockedPage();

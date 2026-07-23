const websiteInput = document.getElementById('websiteInput');
const durationSelect = document.getElementById('durationSelect');
const customDurationGroup = document.getElementById('customDurationGroup');
const customDuration = document.getElementById('customDuration');
const addButton = document.getElementById('addButton');
const clearButton = document.getElementById('clearButton');
const searchInput = document.getElementById('searchInput');
const blockedList = document.getElementById('blockedList');
const statusMessage = document.getElementById('statusMessage');
const activeCount = document.getElementById('activeCount');
const listCount = document.getElementById('listCount');

const durationMap = {
  '15': 15 * 60 * 1000,
  '30': 30 * 60 * 1000,
  '60': 60 * 60 * 1000,
  '120': 120 * 60 * 1000,
  '240': 240 * 60 * 1000
};

let blockedWebsites = [];
let filteredWebsites = [];
let countdownInterval = null;

function debounce(fn, delayMs) {
  let timeoutId = null;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

function updateCustomFieldVisibility() {
  const isCustom = durationSelect.value === 'custom';
  customDurationGroup.classList.toggle('hidden', !isCustom);
}

function renderBlockedList() {
  blockedList.innerHTML = '';
  const searchTerm = searchInput.value.trim().toLowerCase();

  filteredWebsites = blockedWebsites.filter((entry) => entry.domain.includes(searchTerm));

  if (!filteredWebsites.length) {
    blockedList.innerHTML = '<p class="empty-state">No active blocked websites found.</p>';
    listCount.textContent = '0 entries';
    activeCount.textContent = `${blockedWebsites.length} active`;
    return;
  }

  const fragment = document.createDocumentFragment();

  filteredWebsites.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'block-item';

    const label = document.createElement('p');
    label.textContent = entry.domain;

    const countdown = document.createElement('span');
    countdown.className = 'countdown-text';
    countdown.textContent = `${formatCountdown(getRemainingMs(entry))} remaining`;

    const meta = document.createElement('div');
    meta.className = 'meta';
    const endsSpan = document.createElement('span');
    endsSpan.textContent = `Ends: ${formatTime(new Date(entry.endTime))}`;
    const startedSpan = document.createElement('span');
    startedSpan.textContent = `Started: ${formatTime(new Date(entry.startTime))}`;
    meta.appendChild(endsSpan);
    meta.appendChild(startedSpan);

    const actions = document.createElement('div');
    actions.className = 'block-actions';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-button';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => removeBlockedWebsite(entry.domain));

    actions.appendChild(removeButton);
    item.appendChild(label);
    item.appendChild(countdown);
    item.appendChild(meta);
    item.appendChild(actions);
    fragment.appendChild(item);
  });

  blockedList.appendChild(fragment);
  listCount.textContent = `${filteredWebsites.length} entries`;
  activeCount.textContent = `${blockedWebsites.length} active`;
}

function refreshCountdown() {
  const entries = Array.from(blockedList.getElementsByClassName('block-item'));
  let anyExpired = false;

  filteredWebsites.forEach((entry, index) => {
    const remainingMs = getRemainingMs(entry);
    if (remainingMs <= 0) {
      anyExpired = true;
    }
    const countdown = entries[index]?.querySelector('.countdown-text');
    if (countdown) {
      countdown.textContent = `${formatCountdown(remainingMs)} remaining`;
    }
  });

  if (anyExpired) {
    loadState();
  }
}

async function loadState() {
  try {
    const state = await getFullStorage();
    blockedWebsites = state.blockedWebsites || [];
    renderBlockedList();
  } catch (error) {
    displayStatus('Could not load blocked list.');
  }
}

async function saveBlockedWebsites() {
  try {
    await setStorageValue({ blockedWebsites });
    return true;
  } catch (error) {
    displayStatus('Could not save changes. Please try again.');
    return false;
  }
}

function displayStatus(message, isError = true) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#f7c1c1' : '#b9f7d4';
}

function clearStatus() {
  statusMessage.textContent = '';
}

function parseDuration() {
  if (durationSelect.value === 'custom') {
    const minutes = Number(customDuration.value);
    return Number.isFinite(minutes) && minutes >= 5 ? minutes * 60 * 1000 : null;
  }
  return durationMap[durationSelect.value] || null;
}

async function addBlockedWebsite() {
  clearStatus();
  const rawValue = websiteInput.value;
  const domain = normalizeDomain(rawValue);

  if (!domain) {
    displayStatus('Please enter a valid website domain.');
    return;
  }

  if (isDuplicateDomain(domain, blockedWebsites)) {
    displayStatus('This website is already blocked.');
    return;
  }

  const durationMs = parseDuration();
  if (!durationMs) {
    displayStatus('Set a valid duration of at least 5 minutes.');
    return;
  }

  const newEntry = createBlockEntry(domain, durationMs);
  const previous = blockedWebsites;
  blockedWebsites = [newEntry, ...blockedWebsites];

  const saved = await saveBlockedWebsites();
  if (!saved) {
    blockedWebsites = previous;
    return;
  }

  renderBlockedList();
  websiteInput.value = '';
  customDuration.value = '';
  durationSelect.value = '15';
  updateCustomFieldVisibility();
  displayStatus('Website blocked successfully.', false);
}

async function removeBlockedWebsite(domain) {
  const previous = blockedWebsites;
  blockedWebsites = blockedWebsites.filter((entry) => entry.domain !== domain);
  const saved = await saveBlockedWebsites();
  if (!saved) {
    blockedWebsites = previous;
    return;
  }
  renderBlockedList();
}

async function clearAllBlockedWebsites() {
  const previous = blockedWebsites;
  blockedWebsites = [];
  const saved = await saveBlockedWebsites();
  if (!saved) {
    blockedWebsites = previous;
    return;
  }
  renderBlockedList();
}

const handleSearch = debounce(() => renderBlockedList(), 150);

function handleWebsiteInputKeydown(event) {
  if (event.key === 'Enter') {
    addBlockedWebsite();
  }
}

function handleStorageChanged(changes, area) {
  if (area === 'local' && changes.blockedWebsites) {
    blockedWebsites = changes.blockedWebsites.newValue || [];
    renderBlockedList();
  }
}

function bindEvents() {
  durationSelect.addEventListener('change', updateCustomFieldVisibility);
  addButton.addEventListener('click', addBlockedWebsite);
  clearButton.addEventListener('click', clearAllBlockedWebsites);
  searchInput.addEventListener('input', handleSearch);
  websiteInput.addEventListener('keydown', handleWebsiteInputKeydown);
  customDuration.addEventListener('keydown', handleWebsiteInputKeydown);
  chrome.storage.onChanged.addListener(handleStorageChanged);
  window.addEventListener('beforeunload', () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
  });
}

function startCountdownTimer() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  countdownInterval = setInterval(() => {
    refreshCountdown();
  }, 1000);
}

async function init() {
  bindEvents();
  updateCustomFieldVisibility();
  await loadState();
  startCountdownTimer();
}

init();
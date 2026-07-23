function createBlockEntry(domain, durationMs) {
  if (!domain || typeof domain !== 'string') {
    throw new Error('createBlockEntry: domain must be a non-empty string');
  }
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error('createBlockEntry: durationMs must be a positive number');
  }

  const now = Date.now();
  return {
    id: `${domain}-${now}`,
    domain,
    startTime: now,
    endTime: now + durationMs,
    notifiedFiveMin: false,
    notifiedEnded: false
  };
}

function getRemainingMs(entry) {
  return Math.max(0, entry.endTime - Date.now());
}

function isExpired(entry) {
  return Date.now() >= entry.endTime;
}

function shouldNotifyFiveMin(entry) {
  if (entry.notifiedFiveMin || entry.notifiedEnded) {
    return false;
  }

  const remainingMs = entry.endTime - Date.now();
  return remainingMs <= 5 * 60 * 1000 && remainingMs > 0;
}

function shouldNotifyEnded(entry) {
  return !entry.notifiedEnded && isExpired(entry);
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
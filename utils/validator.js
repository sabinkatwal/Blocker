const allowedDomainPattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;

function normalizeDomain(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');

  if (!allowedDomainPattern.test(normalized)) {
    return null;
  }

  return normalized;
}

function isDuplicateDomain(domain, blockedWebsites) {
  return blockedWebsites.some((entry) => entry.domain === domain);
}

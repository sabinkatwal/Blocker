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
    .replace(/\?.*$/, '')
    .replace(/#.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '');

  if (!allowedDomainPattern.test(normalized)) {
    return null;
  }

  return normalized;
}

function isDuplicateDomain(domain, blockedWebsites) {
  if (!domain || !Array.isArray(blockedWebsites)) {
    return false;
  }
  const normalized = domain.toLowerCase();
  return blockedWebsites.some(
    (entry) => entry.domain && entry.domain.toLowerCase() === normalized
  );
}
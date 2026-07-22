function getHostnameFromUrl(url) {
  try {
    const normalizedUrl = url.trim();
    const parsed = new URL(normalizedUrl);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch (error) {
    return null;
  }
}

function isDomainMatch(hostname, blockedDomain) {
  const normalizedHostname = hostname.replace(/^www\./, '').toLowerCase();
  const normalizedBlocked = blockedDomain.toLowerCase();

  if (normalizedHostname === normalizedBlocked) {
    return true;
  }

  return normalizedHostname.endsWith(`.${normalizedBlocked}`);
}

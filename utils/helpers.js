function getHostnameFromUrl(url) {
  if (typeof url !== 'string' || !url.trim()) {
    return null;
  }

  const normalizedUrl = url.trim();

  try {
    return new URL(normalizedUrl).hostname.replace(/^www\./, '').toLowerCase();
  } catch (error) {
    try {
      return new URL(`https://${normalizedUrl}`).hostname.replace(/^www\./, '').toLowerCase();
    } catch (fallbackError) {
      return null;
    }
  }
}

function isDomainMatch(hostname, blockedDomain) {
  if (!hostname || !blockedDomain) {
    return false;
  }

  const normalizedHostname = hostname.replace(/^www\./, '').toLowerCase();
  const normalizedBlocked = blockedDomain.replace(/^www\./, '').toLowerCase();

  if (!normalizedBlocked) {
    return false;
  }

  return (
    normalizedHostname === normalizedBlocked ||
    normalizedHostname.endsWith(`.${normalizedBlocked}`)
  );
}

function isUrlBlocked(url, blockedDomains) {
  const hostname = getHostnameFromUrl(url);
  if (!hostname || !Array.isArray(blockedDomains)) {
    return false;
  }
  return blockedDomains.some((domain) => isDomainMatch(hostname, domain));
}
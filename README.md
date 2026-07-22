# FocusBlocker

FocusBlocker is a Chrome and Microsoft Edge extension that blocks distracting websites using timed sessions, notifications, and a polished dark UI.

## Installation

1. Clone or download the `FocusBlocker` folder.
2. Open Chrome or Edge.
3. Go to `chrome://extensions` or `edge://extensions`.
4. Enable `Developer mode`.
5. Click `Load unpacked`.
6. Select the `s:\project\blocker` folder.

## Load unpacked

- In Chrome: `chrome://extensions`
- In Edge: `edge://extensions`
- Enable `Developer mode`
- Click `Load unpacked`
- Choose the `FocusBlocker` folder

## Permissions

- `storage` — store blocked websites, timers, settings, and history
- `tabs` — detect tab updates and redirect blocked pages
- `alarms` — periodically refresh active block timers
- `notifications` — alert the user when blocking starts, ends, or is about to expire
- `activeTab` — allow extension activity in the current tab context
- `host_permissions` `<all_urls>` — inspect active tab URLs for matching blocked domains

## Architecture

- `manifest.json` — declares extension metadata, permissions, and service worker.
- `background.js` — service worker handles tab updates, timer refresh, badge updates, and notifications.
- `popup.html` / `popup.js` / `popup.css` — user interface to add, remove, search, and manage active blocked websites.
- `blocked.html` / `blocked.js` / `blocked.css` — destination page shown when a blocked website is detected.
- `utils/storage.js` — helper functions for chrome.storage.local read/write operations.
- `utils/timer.js` — block entry creation, countdown formatting, and expiration detection.
- `utils/validator.js` — input validation and domain normalization.
- `utils/helpers.js` — URL hostname extraction and domain matching.

## How blocking works

1. The extension listens for `chrome.tabs.onUpdated` events.
2. When a tab finishes loading, it reads the tab URL.
3. It normalizes the hostname and compares it against active blocked domains.
4. If the URL matches a blocked domain or any subdomain, it redirects the tab to `blocked.html`.
5. A query parameter is provided so the blocked page can display the target domain and remaining time.

## How storage works

- `blockedWebsites` stores an array of active block entries.
- Each block entry contains `domain`, `startTime`, `endTime`, and notification flags.
- Storage is loaded at popup initialization and refreshed by the background alarm.
- Expired entries are removed automatically and badge counts update accordingly.

## How timers work

- Each entry records a `startTime` and `endTime` in milliseconds.
- The background worker runs every minute via `chrome.alarms`.
- It removes expired entries and sends notifications when blocking ends or when 5 minutes remain.
- The popup updates countdown values every second.

## Browser compatibility

- Google Chrome (Manifest V3)
- Microsoft Edge (Chromium-based)

## Future improvements

- Add support for pausing and reactivating blocked sessions.
- Add persistent history and analytics.
- Add customizable motivational messages and tips.
- Add category-based blocking, work/break schedules, and custom themes.
- Add `declarativeNetRequest` support for more efficient browser-level blocking.

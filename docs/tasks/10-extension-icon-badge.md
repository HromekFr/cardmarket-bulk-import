---
title: Extension icon badge
type: AFK
state: New
priority: 2
created: 2026-04-14
prd: ../prds/2026-04-14-manabox-automated-bulk-listing.md
blocked-by:
  - 06-single-page-automation-tracer-bullet.md
tags: [badge, icon, ux]
---

## What to build

Display a live count of cards listed on the extension icon badge while automation is running, so the user can see progress at a glance without opening the popup.

The background script updates `chrome.action.setBadgeText` whenever `listedCount` changes in the automation state. The badge is cleared (empty string) when status is `idle` or `complete`.

Badge styling: use a visible background colour (e.g. green) so it stands out from the default icon. Text should be the `listedCount` as a string.

This is a thin slice that hooks into the state machine events already established in slice 6. No new state is needed — it reads `listedCount` from the existing automation state via `chrome.storage.onChanged` in the background script.

## Acceptance criteria

- [ ] Badge shows the current `listedCount` while automation status is `running` or `paused`
- [ ] Badge updates after each page completion without requiring the popup to be open
- [ ] Badge is cleared when automation is `idle` or transitions to `complete`
- [ ] Badge has a background colour that makes it visible against the extension icon

## User stories addressed

- User story 19

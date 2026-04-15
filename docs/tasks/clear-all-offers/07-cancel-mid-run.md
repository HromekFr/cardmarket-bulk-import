---
title: Cancel Mid-Run
type: AFK
state: Done
priority: 2
created: 2026-04-15
prd: ../prds/2026-04-15-clear-all-offers.md
blocked-by:
  - 05-single-page-clear-ui.md
tags: []
---

## What to build

Wire up the Cancel button shown during a running clear. Clicking Cancel calls `cancelClearing()`, which removes the `clearOffersState` key from `chrome.storage`, stops the removal loop from processing any further rows, and resets the UI to idle state.

Articles already removed stay removed. Articles not yet processed remain listed.

## Acceptance criteria

- [ ] A "Cancel" button is visible alongside the progress counter during a running clear
- [ ] Clicking Cancel stops the loop — no further remove buttons are clicked after cancel
- [ ] `clearOffersState` is absent from `chrome.storage` after cancellation
- [ ] The UI resets to idle state (enabled "Clear All Offers" button) after cancellation
- [ ] If the page reloads after cancellation, the content script starts in idle state (no auto-resume)
- [ ] Manually tested: cancel mid-way through a multi-article clear leaves remaining articles intact

## User stories addressed

- User story 7: cancel button allows stopping the run at any time

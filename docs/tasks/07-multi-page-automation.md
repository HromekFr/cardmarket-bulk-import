---
title: Multi-page automation
type: AFK
state: New
priority: 2
created: 2026-04-14
prd: ../prds/2026-04-14-manabox-automated-bulk-listing.md
blocked-by:
  - 06-single-page-automation-tracer-bullet.md
tags: [automation, pagination]
---

## What to build

Extend the automation to advance through multiple pages within a single expansion. After a page submission succeeds, the background script checks whether a next page exists and navigates to it after the configured delay.

After the content script sends `pageComplete`, the background script:
1. Reads `a[data-direction="next"]` from the current page's DOM (via a message from the content script, or by injecting a script to read it) — the href is the authoritative next-page URL
2. Waits for `submissionDelay` ms (from Settings Store)
3. If a next-page link exists: calls `advancePage()` on the state machine and navigates the tab to the next URL
4. If no next-page link exists: this expansion is complete (handled by slice 8)

The content script should include the next-page URL (or `null`) in its `pageComplete` message so the background does not need to query the DOM separately.

The configurable delay from the Settings Store is applied here between page navigations.

## Acceptance criteria

- [ ] After a successful page submission, the background waits `submissionDelay` ms before navigating
- [ ] The tab is navigated to the next page URL (`&site=N`) when a next-page link exists
- [ ] The state machine's `currentPage` is incremented correctly
- [ ] The popup log shows a new entry for each page processed
- [ ] When there is no next page, the automation does not attempt to navigate further (expansion complete)
- [ ] Changing the submission delay in Settings is reflected in subsequent page transitions without restarting

## User stories addressed

- User story 9
- User story 14

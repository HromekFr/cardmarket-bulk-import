---
title: Multi-expansion automation
type: AFK
state: New
priority: 2
created: 2026-04-14
prd: ../prds/2026-04-14-manabox-automated-bulk-listing.md
blocked-by:
  - 07-multi-page-automation.md
tags: [automation, multi-expansion, completion]
---

## What to build

Extend the automation to chain through all expansions in the CSV. When the last page of an expansion completes (no next-page link), the background script advances to the next expansion and navigates to its first page. This repeats until all expansions are exhausted, at which point the state machine transitions to `complete`.

Changes to the background script:
- When `pageComplete` arrives with `nextPageUrl: null`, call `advanceExpansion()` instead of `advancePage()`
- If `remainingExpansions` is now empty after advancing, call `complete()` and update the badge/popup
- Otherwise navigate to the next expansion's first page URL

The popup's AutoListPanel `complete` state (already built in slice 6) should now show:
- Total cards listed across all expansions
- Full list of unmatched cards across all expansions, grouped by expansion name

The popup log should show one section per expansion with page count and listed count.

## Acceptance criteria

- [ ] After the last page of an expansion, the background navigates to the next expansion's first page
- [ ] The state machine transitions to `complete` when all expansions are processed
- [ ] The popup shows a final summary: total listed count and complete unmatched card list
- [ ] Unmatched cards in the summary are identifiable by name and expansion
- [ ] The extension icon badge is cleared on completion
- [ ] A "Start New Run" button in the popup resets state to `idle`

## User stories addressed

- User story 10
- User story 18

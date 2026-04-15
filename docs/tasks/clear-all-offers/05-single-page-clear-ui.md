---
title: Single-Page Clear + Confirmation UI
type: AFK
state: New
priority: 2
created: 2026-04-15
prd: ../prds/2026-04-15-clear-all-offers.md
blocked-by:
  - 01-content-script-scaffold.md
  - 02-clear-runner-row-scraping.md
  - 03-clear-runner-state-management.md
  - 04-clear-runner-single-removal.md
tags: []
---

## What to build

Wire together all `clear-runner` functions and the `App.tsx` component into a working end-to-end single-page clear. After this slice, a user can open the Offers page, click the button, confirm, watch the progress counter, and see the done message — for a single page of articles with no pagination.

The UI has three states (see PRD "React component" section):
- **Idle**: "Clear All Offers" button; article count for confirmation is read from `span.total-count`
- **Running**: "Removing… (N/total)" label + Cancel button (Cancel does nothing yet — wired in slice 07)
- **Done**: "Done — N articles removed" message, then reset to idle

The confirmation dialog should display the count from `span.total-count` and require explicit confirmation before starting.

## Acceptance criteria

- [ ] Clicking "Clear All Offers" shows a confirmation dialog with the correct article count
- [ ] Declining the confirmation leaves the page unchanged
- [ ] Confirming starts the removal loop; the button transitions to the running state showing "Removing… (0/N)"
- [ ] The counter increments after each article is removed
- [ ] After all rows on the page are removed, the done message appears with the correct total
- [ ] The button returns to idle state after the done message
- [ ] Manually tested end-to-end on the live Offers page with at least one article present

## User stories addressed

- User story 2: confirmation dialog shows article count
- User story 4: full removal of every article on the page
- User story 5: sequential removal, one at a time
- User story 6: live progress counter visible inline
- User story 9: done message when complete
- User story 11: button disabled when no articles present
- User story 12: session cookies used transparently via DOM button clicks

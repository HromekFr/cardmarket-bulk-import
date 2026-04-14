---
title: Resume and Stop
type: AFK
state: New
priority: 2
created: 2026-04-14
prd: ../prds/2026-04-14-manabox-automated-bulk-listing.md
blocked-by:
  - 06-single-page-automation-tracer-bullet.md
tags: [automation, resume, stop, resumable]
---

## What to build

Allow the user to stop an in-progress automation run and resume it later from exactly where it stopped, without re-uploading the CSV.

Stop behaviour:
- The Stop button in the AutoListPanel sends a `pause` action to the background
- The background transitions the state machine to `paused` after the current page finishes (not mid-fill)
- The CardMarket tab is left at the last processed URL
- The popup transitions to a `paused` state showing the current progress and a Resume button

Resume behaviour:
- The Resume button sends a `resume` action to the background
- The background transitions the state machine to `running`
- Navigation continues from the current expansion and page stored in state (no re-upload needed)
- If the browser was closed and reopened, the popup detects a `paused` state in `chrome.storage.local` on load and shows the Resume button automatically

Because all state is persisted in `chrome.storage.local` (built in slice 5), resume works across popup close, browser restart, and tab crash.

## Acceptance criteria

- [ ] Clicking Stop after a page completes transitions the automation to `paused`
- [ ] The popup shows the Resume button and current progress when `paused`
- [ ] Clicking Resume continues from the correct expansion and page
- [ ] Closing and reopening the popup while `paused` still shows the Resume option
- [ ] Reopening the browser while `paused` restores the paused state correctly
- [ ] Resuming navigates to the correct CardMarket URL (correct expansion, correct page)

## User stories addressed

- User story 11
- User story 12
- User story 13

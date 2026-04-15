---
title: Multi-Page Auto-Resume
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

Extend the clearing loop to handle multiple pages. After all visible article rows are removed from the current page, navigate to the base Offers URL (no page parameter) to reload. On reload, `resumeIfActive()` detects the in-progress storage state and automatically continues the loop. This repeats until the page loads with no article rows, at which point the run is marked complete and storage is cleared.

This slice also calls `resumeIfActive()` in the content script's mount hook so that the UI correctly reflects running state on reload (showing the progress counter rather than the idle button).

See the PRD's "Module: clear-runner" steps 4–6 and "State persistence" sections.

## Acceptance criteria

- [ ] After clearing all rows on a page, the extension navigates to the base Offers URL
- [ ] On reload with an active state in storage, the UI starts in running state immediately (no idle flash)
- [ ] The `removed` counter carries over correctly across page reloads
- [ ] When the reloaded page has no article rows, the run is marked complete and storage is cleared
- [ ] The done message shows the total number of articles removed across all pages
- [ ] Manually tested end-to-end with a multi-page offers list

## User stories addressed

- User story 3: all articles across all pages are removed
- User story 8: auto-resumes after page reload without manual intervention
- User story 9: correctly detects completion when no articles remain

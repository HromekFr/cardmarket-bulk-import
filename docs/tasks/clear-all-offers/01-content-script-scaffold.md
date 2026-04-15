---
title: Content Script Scaffold
type: AFK
state: Done
priority: 2
created: 2026-04-15
prd: ../prds/2026-04-15-clear-all-offers.md
blocked-by: []
tags: []
---

## What to build

Create the new `clearOffers.content` entry point that injects a placeholder "Clear All Offers" button onto the CardMarket Offers page. This is the scaffolding slice — no removal logic yet, just the content script wired up and the button visible in the right place.

The content script should match `*://*.cardmarket.com/*/*/Stock/Offers/Singles*` so it works across all games. Mount a React component into the empty `div.col-3:last-child` inside the top `div.row.pagination` element on the page.

The button should be labelled "Clear All Offers", visually consistent with CardMarket's Bootstrap button style (e.g. `btn-danger`), and disabled when no article rows are present on the page (`div[id^="articleRow"]`).

See the PRD's "New content script" and "React component" sections for placement and UI state details.

## Acceptance criteria

- [ ] Navigating to `/en/Magic/Stock/Offers/Singles` (or any game equivalent) shows the "Clear All Offers" button in the top pagination row's right column
- [ ] The button is disabled when the page has no article rows
- [ ] The button is enabled when at least one article row is present
- [ ] The content script does not inject on any other CardMarket page
- [ ] No removal logic is wired up yet — clicking the button does nothing (or logs a placeholder)

## User stories addressed

- User story 1: button appears on the Offers page
- User story 10: works for all games via wildcard URL match
- User story 11: button is disabled when no articles are present

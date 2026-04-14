---
title: Single-page automation tracer bullet
type: AFK
state: New
priority: 2
created: 2026-04-14
prd: ../prds/2026-04-14-manabox-automated-bulk-listing.md
blocked-by:
  - 02-settings-store-and-panel.md
  - 03-manabox-csv-parser.md
  - 04-mtg-condition-support.md
  - 05-automation-state-machine.md
tags: [automation, e2e, tracer-bullet, popup, content-script]
---

## What to build

The core end-to-end automation slice. This is the tracer bullet that wires all previous slices together into a working, demoable flow. It handles exactly one page of one expansion — no pagination, no multi-expansion chaining yet.

Full flow:
1. User opens the extension popup and sees a new "Auto-list" panel
2. User uploads a ManaBox CSV and clicks Start
3. The ManaBox CSV Parser parses the file (using the price floor from Settings Store)
4. The Automation State Machine receives the parsed cards, groups them by expansion, and navigates the CardMarket tab to the first expansion's first page URL
5. The content script detects the automation mode flag in `chrome.storage.local`, reads the current expansion's cards, and fills the form (quantity, price, condition, language, foil) for every matching row
6. Unmatched cards on this page are collected
7. The content script clicks the submit button and watches `#NewArticleTableWrapper` via `MutationObserver` for success
8. On success, the content script sends a `pageComplete` message to the background with the listed count and unmatched cards
9. The background updates the state machine and appends a log entry
10. The popup's AutoListPanel reflects the update in real time via `chrome.storage.onChanged`

The AutoListPanel needs three visible states for this slice: `idle` (upload + Start), `running` (live log, Stop button), and `complete` (summary with listed count and unmatched card list).

Background → content script communication: content script reads automation state from storage on page load (no explicit message needed). Content → background: `pageComplete` message.

See the Automation Content Script, AutoListPanel, and Messaging Contract sections in the PRD Implementation Decisions.

## Acceptance criteria

- [ ] AutoListPanel is accessible from the popup
- [ ] Uploading a non-ManaBox CSV shows an error; a valid ManaBox CSV enables the Start button
- [ ] Clicking Start navigates a CardMarket tab to the correct expansion URL (`?idExpansion=X&sortBy=number`)
- [ ] The content script fills matching rows with the correct quantity, price, condition, language, and foil values
- [ ] The submit button is clicked programmatically
- [ ] Success is detected via `MutationObserver` on `#NewArticleTableWrapper`
- [ ] The popup log shows a completion entry with cards listed and unmatched count
- [ ] Unmatched cards are listed in the completion summary
- [ ] The Stop button transitions automation to `paused`
- [ ] The existing injected-button manual flow on the CardMarket page is unaffected

## User stories addressed

- User story 1
- User story 2
- User story 3
- User story 13
- User story 16
- User story 17
- User story 18
- User story 20

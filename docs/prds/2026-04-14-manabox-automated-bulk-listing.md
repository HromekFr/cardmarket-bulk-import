---
title: ManaBox Automated Bulk Listing
type: Feature
state: New
priority: 2
created: 2026-04-14
tags: [automation, manabox, mtg, bulk-listing]
---

## Problem Statement

Listing Magic: The Gathering cards for sale on CardMarket is a slow, repetitive, error-prone manual process. The user manages their collection in ManaBox and exports it as a CSV. CardMarket's bulk listing interface is paginated (up to 100 cards per page, sorted by collector number), meaning cards from a single expansion can span multiple pages. Navigating to a new page discards any unsaved form input. Changing price for cheaper cards requires manually overriding each one to a minimum acceptable price. The result is a multi-step, multi-page, multi-session workflow that takes hours for a large collection.

## Solution

Extend the existing cardmarket-bulk-import Chrome extension with a fully automated bulk listing mode. The user uploads a ManaBox CSV export from the extension popup once, configures a price floor and submission delay, and clicks Start. The extension then autonomously navigates to each expansion's bulk listing page, fills in quantity, price, condition, language, and foil for every matching card, submits the form, advances through pages, and moves to the next expansion — repeating until every card in the CSV has been processed. A live progress log in the popup shows what is happening in real time. If the automation is interrupted it can be resumed from where it stopped.

The existing injected-button manual flow is preserved unchanged for corrections and one-off listings.

## User Stories

1. As a seller, I want to upload my ManaBox CSV once from the popup, so that I do not have to manually navigate to each expansion and page.
2. As a seller, I want the extension to automatically detect a ManaBox CSV without requiring me to map columns, so that I can start an automation run in seconds.
3. As a seller, I want all cards in my CSV to be listed by default with no filtering, so that the CSV itself is the authoritative list of what to sell.
4. As a seller, I want any card priced below my configured floor to be automatically raised to that floor, so that I never accidentally undersell bulk cards.
5. As a seller, I want to use the purchase price from ManaBox as my listing price when it is above my floor, so that the prices I tracked in ManaBox are used directly without manual entry.
6. As a seller, I want the price floor to be configurable in the extension settings, so that I can change my minimum without editing code.
7. As a seller, I want foil cards in my CSV to be listed as foil automatically, so that the foil flag is never forgotten.
8. As a seller, I want ManaBox condition values to be mapped to the correct CardMarket condition automatically, so that card conditions are always accurate.
9. As a seller, I want the automation to navigate through all pages of an expansion automatically after each submission, so that I do not have to manually advance pages.
10. As a seller, I want the automation to move to the next expansion automatically after all pages are processed, so that the entire CSV is handled without my intervention.
11. As a seller, I want the automation state to be saved persistently, so that if the popup is closed or the browser crashes I can resume from where I left off.
12. As a seller, I want a Resume button in the popup, so that I can continue an interrupted automation run without re-uploading the CSV.
13. As a seller, I want a Stop button in the popup, so that I can safely pause the automation at any time.
14. As a seller, I want a configurable delay between page submissions, so that I can avoid triggering Cloudflare rate limiting on CardMarket.
15. As a seller, I want the submission delay to be configurable in the extension settings, so that I can tune it without editing code.
16. As a seller, I want a live progress log in the popup showing each expansion, page, and cards listed, so that I can monitor what is happening in real time.
17. As a seller, I want unmatched cards (cards the extension could not find on the CardMarket page) to be skipped and logged, so that the automation does not stall on problem cards.
18. As a seller, I want a completion summary showing total cards listed and a list of all unmatched cards, so that I know what still needs manual attention after a run.
19. As a seller, I want the extension icon badge to show the running count of cards listed, so that I can see progress at a glance without opening the popup.
20. As a seller, I want the existing injected-button manual flow on the CardMarket page to remain unchanged, so that I can still use it for one-off corrections after an automated run.
21. As a seller, I want the settings panel to persist my price floor and delay across browser sessions, so that I do not have to reconfigure them each time.
22. As a seller, I want the automation to sort by collector number on every expansion page, so that cards appear in a consistent, predictable order.
23. As a seller, I want the language from my ManaBox CSV to be used for each card listing, so that English cards are listed as English, etc.

## Implementation Decisions

### ManaBox CSV Parser (new deep module)
- Pure function that takes a `File` and returns a typed array of parsed ManaBox rows.
- Detects ManaBox format by checking for the presence of a `ManaBox ID` column in the CSV header.
- Applies a fixed column mapping: Name, Language, Quantity, Purchase price, Set code, Foil, Condition.
- Applies the price floor: `Math.max(purchasePrice, settings.priceFloor)`.
- Maps conditions: `near_mint` → 2, `good` → 4; unknown values fall back to 2 (Near Mint).
- Maps foil: value `"foil"` → true, anything else → false.
- This module has no side effects and is straightforwardly unit-testable with fixture CSV files.

### Automation State Machine (new deep module, lives in background script)
- Manages a persistent state object stored in `chrome.storage.local`.
- State shape: `{ status, remainingExpansions, currentExpansionId, currentPage, listedCount, unmatchedCards, log }`.
- Status transitions: `idle → running → (paused | complete)`, `paused → running`.
- Exposes actions: `start(parsedCards)`, `resume()`, `pause()`, `advancePage()`, `advanceExpansion()`, `recordListed(count)`, `recordUnmatched(cards[])`, `appendLog(entry)`, `complete()`.
- Responsible for constructing the CardMarket BulkListing URL for each expansion and page: `?idExpansion={id}&sortBy=number` for page 1, appending `&site={n}` for subsequent pages.
- Resolves Set codes to CardMarket expansion IDs using the existing MTGJSON data layer.
- Groups input cards by expansion before storing, so each expansion is a self-contained batch.
- Opens or reuses a CardMarket tab via the Chrome tabs API; navigates it to the correct URL.
- Listens for messages from the content script signalling page completion, then advances state and navigates.
- Pure state transitions are unit-testable in isolation from the Chrome API.

### Automation Content Script (modify existing or new content script entry point)
- Activates when the page URL matches the BulkListing pattern AND a `chrome.storage.local` automation flag is set.
- Reads the current expansion's pending cards from storage.
- Filters cards to those matching rows visible on the current page (using existing `matchName` logic from `MtgGameManager`).
- Fills quantity, price, condition (`idCondition` select), language, and foil for each matched row.
- Unmatched cards are collected and reported back to the background.
- After filling, clicks the submit button (`input[type="submit"][form="BulkListingForm"]`).
- Uses a `MutationObserver` on `#NewArticleTableWrapper` to detect successful submission.
- After the configured delay, sends a `pageComplete` message to the background script with listed count and unmatched cards.
- Does not navigate itself — navigation is always triggered by the background script.

### MtgGameManager — condition support (modify existing)
- Add a `conditionElSelector` targeting `select[name^="idCondition"]` per row.
- Extend `fillRow` to set the condition select value using the parsed condition integer.
- Add `condition` as a parsed field on the MTG `ParsedRow` type.

### Settings Store (new module)
- Thin wrapper around `chrome.storage.sync`.
- Schema: `{ priceFloor: number, submissionDelay: number }`.
- Provides `getSettings()` and `saveSettings(partial)` with typed defaults.
- Used by the ManaBox CSV Parser (for price floor) and the Automation Content Script (for delay).

### Popup: SettingsPanel (new panel)
- New panel added to the existing popup `PanelManager`.
- Two numeric inputs: Price Floor (€, step 0.01, min 0) and Submission Delay (ms, step 100, min 0).
- Reads from and writes to the Settings Store on change.

### Popup: AutoListPanel (new panel)
- New panel added to the existing popup `PanelManager`.
- States: `idle`, `running`, `paused`, `complete`.
- In `idle`: shows a CSV file upload input and a Start button.
- In `running`/`paused`: shows Stop/Resume buttons and a live scrollable log.
- In `complete`: shows the summary (total listed, list of unmatched cards) and a Start New Run button.
- Reads live state from `chrome.storage.local` via a storage change listener to update the log in real time without polling.
- Does not own automation logic — it only reads state and sends messages to the background.

### Extension icon badge
- Background script updates `chrome.action.setBadgeText` whenever `listedCount` changes in the automation state.
- Badge cleared on `idle` or `complete`.

### Messaging contract between background and content script
- Background → content: no explicit message needed; content script reads state from storage on page load.
- Content → background: `pageComplete { listedCount: number, unmatchedCards: UnmatchedCard[] }`.
- Background → popup: state changes propagate via `chrome.storage.onChanged`.

## Testing Decisions

Good tests verify observable behaviour through a module's public interface, not its internal implementation. They use real inputs and assert on real outputs. They do not test that a specific private function was called.

### ManaBox CSV Parser
- Unit tests covering: valid ManaBox CSV is parsed correctly, non-ManaBox CSV is rejected, price floor is applied when purchase price is below floor, price above floor is used as-is, `foil` value maps to true, `normal` maps to false, `near_mint` maps to condition 2, `good` maps to condition 4, unknown condition falls back to 2, language is passed through, quantity is parsed as integer.
- Fixture files: a small representative ManaBox CSV (5–10 rows covering all edge cases).
- No mocking needed — pure function.

### Automation State Machine
- Unit tests covering: initial state is idle, `start()` transitions to running and groups cards by expansion, `pause()` transitions to paused, `resume()` transitions back to running, `advancePage()` increments page, `advanceExpansion()` moves to next expansion and resets page, `complete()` transitions to complete, `recordUnmatched()` accumulates unmatched cards, `appendLog()` appends entries, state survives a simulated storage round-trip.
- Chrome storage API mocked at the boundary.

### Settings Store
- Unit tests covering: `getSettings()` returns defaults when storage is empty, `saveSettings()` persists values, `getSettings()` returns previously saved values.
- Chrome storage API mocked at the boundary.

### MtgGameManager condition mapping
- Unit test covering the `near_mint` → 2 and `good` → 4 mappings via the parser, and that the condition value is applied to the DOM element in `fillRow`.

There are currently no tests in the codebase (noted as a TODO). A testing framework (e.g. Vitest) will need to be configured as part of this work.

## Out of Scope

- Support for CardMarket games other than Magic: The Gathering.
- Listing cards that are not in the ManaBox CSV (e.g. manually adding cards during automation).
- Automatic de-duplication or merging of existing CardMarket listings.
- Condition values beyond `near_mint` and `good` — these will be added once a full ManaBox condition export is available.
- Pricing strategies other than purchase-price-with-floor (e.g. market price percentage).
- Support for non-English CardMarket storefronts (URL language prefix is assumed to match the user's existing browser session).
- Handling CardMarket CAPTCHA challenges or full Cloudflare blocks — the configurable delay reduces risk but does not solve it.
- Signed, altered, or misprint card attributes (already listed as a TODO in the existing extension).

## Further Notes

- The submission endpoint is `POST /en/Magic/AjaxAction/Article_BulkListProduct` (AJAX, no page reload). Success is detected via a `MutationObserver` on `#NewArticleTableWrapper`. The content script does not need to intercept the network response.
- Pagination uses the `site` query parameter: page 1 has no `site` param, subsequent pages use `&site=N`. The next-page link is an anchor with `data-direction="next"` whose `href` is the authoritative next URL.
- The CardMarket form enforces the 100-article limit server-side. Rows with `amount=0` are silently ignored, so the extension does not need to enforce this limit explicitly.
- The CSRF token `__cmtkn` is already present in the form DOM and submitted automatically when the form's submit button is clicked — the extension does not need to handle it manually.
- `chrome.storage.local` is preferred over `chrome.storage.sync` for automation state because the payload (full card list) may exceed the `sync` per-item quota.

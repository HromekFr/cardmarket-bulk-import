---
title: Clear All Offers
type: Feature
state: New
priority: 2
created: 2026-04-15
tags: [offers, bulk-remove, automation]
---

## Problem Statement

When a seller wants to reprice their entire CardMarket inventory (e.g. to adjust floor prices after a market shift), they must manually remove each listed article one by one. Each removal requires finding the row, setting an amount, and clicking a button — repeated for every article across every page. With dozens or hundreds of listings this is tedious and error-prone. There is no built-in CardMarket UI to clear all offers at once.

## Solution

Inject a "Clear All Offers" button directly onto the CardMarket Offers page (`/Stock/Offers/Singles`). When clicked, the button shows a confirmation dialog with the total article count. On confirmation, the extension automatically sets each article's amount to 999 (guaranteeing full removal regardless of actual stock quantity), clicks the remove button for each row, waits for the DOM to confirm removal, then reloads the base Offers URL to catch any articles that shifted from subsequent pages. This continues until no articles remain. Progress is shown inline on the button. The operation can be cancelled at any time. State is persisted to `chrome.storage` so the run auto-resumes if the page reloads mid-clear.

## User Stories

1. As a seller, I want a "Clear All Offers" button on my Offers page, so that I can start a bulk removal without navigating to any other page.
2. As a seller, I want a confirmation dialog showing the total number of articles before clearing starts, so that I know exactly what I am about to remove and can avoid accidental clears.
3. As a seller, I want the extension to remove every article across all pages automatically, so that I do not have to manually clear each page.
4. As a seller, I want each article to be fully removed regardless of how many copies I have listed, so that I never need to know the exact stock quantity before clearing.
5. As a seller, I want the extension to wait for each removal to complete before moving to the next, so that requests are not sent faster than CardMarket can process them.
6. As a seller, I want a live progress counter ("Removing… 3/12") inline on the button, so that I can see the operation is running without needing to open the extension popup.
7. As a seller, I want a Cancel button visible during the run, so that I can stop mid-clear if I change my mind.
8. As a seller, I want the clear operation to automatically resume after a page reload, so that multi-page clears complete without manual intervention.
9. As a seller, I want the extension to detect when all articles have been removed and show a "Done — N articles removed" summary, so that I know the clear is complete.
10. As a seller, I want the clear to work across all games on CardMarket (Magic, Pokémon, etc.), so that I can use it regardless of which game I sell.
11. As a seller, I want the button to be disabled while a clear is not in progress and show a meaningful label, so that I do not accidentally trigger it.
12. As a seller using a logged-in browser session, I want the removal requests to reuse my existing session cookies, so that no extra authentication is required.

## Implementation Decisions

### New content script: `clearOffers.content`

A new content script is injected on all pages matching `*://*.cardmarket.com/*/*/Stock/Offers/Singles*`. It mounts a React component into the empty right-hand `col-3` column inside the top `div.row.pagination` element — the same row that shows the article hit count and page navigation. This placement keeps the button visually anchored to the table controls without modifying any existing page structure.

### Module: `clear-runner`

The core logic lives in a single deep module (`clear-runner.ts`) with a narrow public interface:

- `resumeIfActive()` — called on every page load; checks `chrome.storage` for an in-progress state and continues the loop if found.
- `startClearing(totalCount: number)` — initialises storage state and begins the clearing loop.
- `cancelClearing()` — removes storage state and signals the loop to stop.

Internally, the runner:
1. Queries the DOM for all `div[id^="articleRow"]` elements to get the current page's article IDs.
2. For each row: sets the `.amount-input` value to `999`, then clicks the `.btn-danger` remove button within that row.
3. Uses a `MutationObserver` to wait for the row element to be removed from the DOM before proceeding to the next row.
4. After all rows on the page are cleared, navigates to the base Offers URL (no page parameter) to reload fresh. Any articles that shifted from subsequent pages will now appear on page 1.
5. On reload, `resumeIfActive()` detects the in-progress state and repeats from step 1.
6. When no article rows are found on reload, the run is marked complete and storage state is cleared.

### State shape in `chrome.storage.local`

```
clearOffersState: {
  active: boolean,
  removed: number,
  total: number
}
```

`total` is read once from `span.total-count` at the moment the user confirms. It is used only for the progress display and does not affect correctness.

### React component: `App.tsx`

Thin UI layer. Three display states:
- **Idle** — "Clear All Offers" button, enabled when article rows are present on the page.
- **Running** — button replaced by "Removing… (removed/total)" label plus a "Cancel" button. Both are rendered inline in the pagination col.
- **Done** — brief "Done — N articles removed" message, then resets to idle.

The component does not contain any removal logic; it only calls into `clear-runner`.

### Article count

The total article count for the confirmation dialog is read from `span.total-count` in the pagination row. This is the authoritative count shown by CardMarket and does not require DOM traversal of the table itself.

### Removal amount

Each article's `.amount-input` is set to `999` programmatically before clicking the remove button. This exceeds any realistic stock quantity, ensuring CardMarket treats it as a full removal. The HTML `max` attribute on the input is not a constraint when the value is set via JavaScript.

### No background script involvement

Unlike the automated bulk listing feature, clearing does not require background script coordination. All logic runs within the content script. `chrome.storage` is used only for cross-reload state persistence, not for message passing.

## Testing Decisions

Tests should verify observable behaviour, not implementation details. A good test sets up a realistic DOM fragment (matching the structure of the actual Offers page), calls a `clear-runner` function, and asserts on the resulting DOM state or storage state — not on which internal methods were called.

### Modules to test: `clear-runner`

This is the only module with non-trivial logic and is worth full TDD coverage. The React component (`App.tsx`) is a thin wrapper and does not require dedicated unit tests.

**Test cases:**
- `getArticleRows()` returns correct IDs from a DOM fragment containing multiple `div[id^="articleRow"]` elements.
- `clearCurrentPage()` sets the amount input to `999` and clicks the remove button for each row.
- The runner waits for a row's DOM element to disappear before processing the next row (observable via mock MutationObserver or by controlling when the element is removed in the test).
- `startClearing()` writes the expected initial state to `chrome.storage`.
- `resumeIfActive()` does nothing when storage is empty.
- `resumeIfActive()` resumes the loop when storage contains an active state.
- `cancelClearing()` removes the storage state and the loop does not process further rows.
- When no article rows are found after a reload, the run is marked complete and storage is cleared.
- Progress counters (`removed`, `total`) are incremented correctly after each removal.

**Prior art:** `src/entrypoints/injectedButton.content/game-manager/__tests__/mtg-condition.test.ts` and the automation reducer tests use Vitest with DOM utilities. The same test setup applies here.

TDD approach: write each failing test first, implement the minimum code to pass it, then refactor.

## Out of Scope

- Selective clearing (removing only articles matching a filter, set, or price range).
- Undo / restore functionality after clearing.
- Clearing offers for a specific expansion only.
- Any interaction with the CardMarket API beyond what the existing remove button already triggers.
- Changes to the existing bulk listing or auto-list features.
- Support for the CardMarket mobile app or any non-browser client.

## Further Notes

- CardMarket's remove button uses an obfuscated `jcp()` callback with encoded args baked into the `onclick` attribute at page render time. By clicking the existing DOM button rather than reconstructing the API call, the extension avoids needing to reverse-engineer the encoding and remains resilient to future changes in the obfuscation scheme.
- The Cloudflare challenge (`cf_clearance` cookie) is already satisfied by the user's active browser session. Content script requests inherit all session cookies and are indistinguishable from manual user interaction.
- The pagination row HTML (`div.row.g-0.pagination`) appears both above and below the article table. The button is injected into the top row's empty `col-3` for immediate visibility.
- The `total` count shown in the progress display may drift from reality if some removals fail silently, but this does not affect correctness — the runner always checks the DOM for remaining rows rather than counting down from `total`.

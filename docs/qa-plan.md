# QA Test Plan — ManaBox Automated Bulk Listing

**Project**: cardmarket-bulk-import  
**Scope**: Settings, ManaBox CSV parser, MTG condition support, Automation state machine, Single-page automation, Multi-page automation, Multi-expansion automation, Resume/Stop, Extension icon badge

> **Agent-verified (not in this plan)**: `yarn test` (56 passed) and `yarn compile` (no new TS errors) are run by CI / agent before manual QA begins.

---

## Setup

### Prerequisites
- Chrome (latest stable)
- A CardMarket seller account with access to the Bulk Listing page
- A ManaBox export CSV (or use the fixture at `src/utils/__tests__/fixtures/manabox.csv` as a reference)
- Extension built and loaded in Chrome as an unpacked extension (`yarn build`, load `./output/chrome-mv3`)

---

## Automated test coverage (do not re-test manually)

The following behaviours are fully covered by the Vitest test suite and do not require manual verification:

| Module | What is tested |
|--------|---------------|
| `manabox-parser` | All 7 column mappings, price floor application, foil flag, condition mapping (all values + unknown fallback), non-ManaBox CSV rejection |
| `game-manager/utils/condition` | `fillCondition` sets the correct select value; defaults to 2 (NM) when undefined |
| `utils/settings` | Defaults returned when storage empty; stored values returned; `saveSettings` partial merge |
| `automation/reducer` | All state transitions (start, pause, resume, advancePage, advanceExpansion, recordListed, recordUnmatched, appendLog, complete); no-ops for invalid transitions; `currentExpansionCards` carried through |
| `automation/url` | Page-1 URL omits `&site=`; page-N URL includes `&site=N` |
| `automation/groupByExpansion` | Groups by expansion, case-insensitive match, unknown set → unresolved |
| `automation/store` | Initial state from empty storage; dispatch applies and persists; round-trip survives |
| `automation/matchCards` | Exact, case-insensitive, diacritic-normalised match; substring fallback; exact preferred over substring; unmatched cards collected; null/empty row names tolerated |
| `automation/resolvePageCompletion` | nextPage when URL present; nextExpansion when expansions remain; complete when none remain; nextPage takes precedence |
| `automation/badge` | Empty string for idle/complete; listedCount string for running/paused |

---

## TC-02 — Settings Store and Panel

**Pre-condition**: extension popup open in Chrome.

| # | Step | Expected |
|---|------|----------|
| 2.1 | Open popup | Home screen shows five buttons: Auto-list, How to use, Settings, Report an issue, About. |
| 2.2 | Click **Settings** | Settings panel opens with title "Settings". Two numeric inputs visible: *Price Floor (€)* and *Submission Delay (ms)*. |
| 2.3 | Check default values | Price Floor shows `0.2`. Submission Delay shows `2000`. |
| 2.4 | Change Price Floor to `0.50`, Submission Delay to `3000`. Click **Save**. | Button briefly shows "Saved!". |
| 2.5 | Close and reopen the popup. Navigate to Settings. | Price Floor shows `0.5`, Submission Delay shows `3000`. Values persisted. |
| 2.6 | Enter `-1` in Price Floor. Click **Save**. | Form shows a validation error. The value is not saved (reopen confirms previous value still set). |
| 2.7 | Enter `-500` in Submission Delay. Click **Save**. | Validation error shown. Value not saved. |
| 2.8 | Reset both fields to their defaults (`0.2`, `2000`) and save. | Saved successfully. |

---

## TC-03 — ManaBox CSV parser (integration smoke)

**Pre-condition**: a real ManaBox CSV export available (or the fixture at `src/utils/__tests__/fixtures/manabox.csv`).

> Core parsing logic is unit-tested. These tests verify the parser integrates correctly in the actual Auto-list flow (see TC-06).

| # | Step | Expected |
|---|------|----------|
| 3.1 | In the Auto-list panel, upload the ManaBox fixture CSV | Start button becomes enabled. No error shown. |
| 3.2 | Upload a non-ManaBox CSV (e.g. a plain spreadsheet export without a `ManaBox ID` column) | Error message "Not a valid ManaBox CSV (missing ManaBox ID column)" shown. Start button stays disabled. |
| 3.3 | Upload a completely invalid file (e.g. a `.txt` file) | Error message shown. Start button stays disabled. |

---

## TC-04 — MTG condition support in the bulk listing form

**Pre-condition**: on the CardMarket MTG Bulk Listing page with at least one visible article row. The manual "Import CSV…" button is visible.

| # | Step | Expected |
|---|------|----------|
| 4.1 | Use the existing **Import CSV…** manual flow with a CSV that has no condition column | The `idCondition` select for filled rows is set to **Near Mint (2)**. Other fields (quantity, price, language, foil) are unaffected. |
| 4.2 | Use a CSV where a row maps to condition `good` (integer `4`) | The `idCondition` select for that row shows the option corresponding to value `4` (Good). |
| 4.3 | Use the manual flow with rows for multiple conditions (Mint, Near Mint, Excellent, Good, Light Played, Played, Poor — values 1–7) | Each row's condition select is set to the correct option. |
| 4.4 | Verify the existing manual flow still works end-to-end (fill page, quantity, price, language, foil) | No regression. All fields fill as before. |

---

## TC-05 — Automation State Machine (storage inspection)

> State machine logic is unit-tested. These checks verify state is actually written to `chrome.storage.local` and survives real browser events.

| # | Step | Expected |
|---|------|----------|
| 5.1 | Open DevTools → Application → Storage → Local Storage for the extension's background page | `automationState` key absent (or status = `idle`). |
| 5.2 | Start an automation run (TC-06). While running, inspect storage. | `automationState` has `status: "running"`, `currentExpansionId` set, `currentPage: 1`. |
| 5.3 | Close Chrome entirely while automation is `paused`. Reopen Chrome and load the extension popup. | Popup shows the paused state with Resume button. Storage still has `status: "paused"`. |

---

## TC-06 — Single-page automation (E2E tracer bullet)

**Pre-condition**:  
- CardMarket account logged in  
- A ManaBox CSV export for a **single expansion** with cards that exist on the CardMarket Bulk Listing page  
- Settings → Price Floor = `0.20`, Submission Delay = `2000`

| # | Step | Expected |
|---|------|----------|
| 6.1 | Open popup → click **Auto-list** | AutoList panel shows idle state: file input and disabled Start button. |
| 6.2 | Upload a valid ManaBox CSV | Start button becomes enabled. No error shown. |
| 6.3 | Click **Start** | Popup transitions to *running* state (spinner + Stop button + Progress log). A CardMarket tab opens (or is focused) and navigates to `https://www.cardmarket.com/en/Magic/Stock/ListingMethods/BulkListing?idExpansion=<id>&sortBy=number`. |
| 6.4 | Watch the CardMarket tab | For each matching card row on the page: Quantity, Price (≥ Price Floor), Language, Foil checkbox, and Condition select are filled correctly. |
| 6.5 | Observe form submission | `input[type="submit"][form="BulkListingForm"]` is clicked programmatically. The table (`#NewArticleTableWrapper`) updates to reflect the submission. |
| 6.6 | After ~2 s (submission delay), popup transitions to *complete* state | Complete state shows: total listed count, list of any unmatched cards (with name and set code). |
| 6.7 | Verify unmatched cards | Cards from the CSV whose names did not match any row on the CardMarket page appear in the unmatched list with correct name and set. |
| 6.8 | Cards with price below floor | All prices in filled rows are ≥ the configured Price Floor. |
| 6.9 | **Regression**: existing "Import CSV…" manual button | Button is still visible on the CardMarket page. Full manual flow (file upload → column mapping → select rows → fill page) works without regression. |

---

## TC-07 — Multi-page automation

**Pre-condition**: a ManaBox CSV with enough cards in one expansion that the CardMarket page has a **next-page** link (`a[data-direction="next"]`).

| # | Step | Expected |
|---|------|----------|
| 7.1 | Start automation (TC-06 steps 6.1–6.3) | First page is filled and submitted. |
| 7.2 | After submission and delay | Tab navigates to the same expansion's next page (`?idExpansion=<id>&sortBy=number&site=2`). |
| 7.3 | Second page is processed | Cards matching the second page are filled. Submit is clicked. |
| 7.4 | When no further pages exist | Automation transitions to *complete* (no more `a[data-direction="next"]`). |
| 7.5 | Popup log | One log entry per page processed. Each entry shows the page number, listed count, and unmatched count. |
| 7.6 | Change Submission Delay to `5000` in Settings mid-run | Verify subsequent page transitions wait approximately 5 s before navigating. (Changing delay does not require restarting the run.) |

---

## TC-08 — Multi-expansion automation

**Pre-condition**: a ManaBox CSV containing cards from **two or more different MTG set codes** (e.g. `LEA` and `LEB`), all resolvable via MTGJSON.

| # | Step | Expected |
|---|------|----------|
| 8.1 | Start automation | First expansion's page 1 is processed. |
| 8.2 | After last page of first expansion completes | Tab navigates to the second expansion's page 1 URL (`?idExpansion=<id2>&sortBy=number`). |
| 8.3 | Second expansion is processed | Cards matching that expansion are filled. |
| 8.4 | After all expansions complete | Popup transitions to *complete* state. |
| 8.5 | Complete state summary | Total listed count reflects cards from **all** expansions. Unmatched list covers all expansions. |
| 8.6 | Unknown set codes | Cards with a set code not found in MTGJSON appear in the unmatched list immediately (skipped before automation starts). Log entry notes how many were skipped. |
| 8.7 | Click **Start new run** | Popup returns to *idle* state. `automationState` is cleared from storage. |

---

## TC-09 — Resume and Stop

**Pre-condition**: automation is in progress (at least one page has been processed, more pages or expansions remain).

| # | Step | Expected |
|---|------|----------|
| 9.1 | While automation is *running*, click **Stop** | After the **current page finishes** (not mid-fill), automation transitions to *paused*. Popup shows Resume + Stop buttons and current progress. The CardMarket tab remains at the last processed URL. |
| 9.2 | Close and reopen the popup while *paused* | Popup immediately shows paused state with Resume button and correct listed count. |
| 9.3 | Restart Chrome while *paused*. Reopen popup. | Paused state is restored from `chrome.storage.local`. Resume button visible. |
| 9.4 | Click **Resume** | Background dispatches `resume`, navigates the tab to the correct expansion and page (`?idExpansion=<id>&sortBy=number[&site=N]`). Automation continues from where it stopped. |
| 9.5 | Resume after browser restart | Same as 9.4 — correct URL, correct cards processed (no re-upload, no data loss). |
| 9.6 | Stop at page 1 of expansion 2, resume | Navigates to expansion 2 page 1, not back to expansion 1. |

---

## TC-10 — Extension icon badge

**Pre-condition**: automation started (TC-06 or later).

| # | Step | Expected |
|---|------|----------|
| 10.1 | Automation status = *idle* | No badge text on the extension icon. |
| 10.2 | Automation transitions to *running* | Badge appears with text `"0"` (green background). |
| 10.3 | After each page completes | Badge text updates to the current cumulative `listedCount` (e.g. `"12"`, then `"28"`, …). Updates without the popup being open. |
| 10.4 | Automation *paused* | Badge remains visible with the last listed count. |
| 10.5 | Automation transitions to *complete* | Badge text clears (empty string). |
| 10.6 | Start new run resets badge | After clicking Start new run and before starting again, badge is empty. |

---

## Regression checklist

Run these after every task group to confirm nothing was broken:

- [ ] Manual "Import CSV…" button visible and fully functional on BulkListing page
- [ ] Popup opens, all five home-screen buttons navigate to their panels and back
- [ ] Settings panel saves and restores values across popup close
- [ ] Extension loads without console errors in both the popup and content script contexts

---

## Known limitations / out of scope for this QA cycle

| Item | Note |
|------|------|
| Non-MTG games | Only the MTG (`/en/Magic/`) path is automated. GenericGameManager manual flow is unchanged. |
| CardMarket DOM selector drift | If CardMarket changes `input[type="submit"][form="BulkListingForm"]`, `a[data-direction="next"]`, or `#NewArticleTableWrapper`, automation will silently fail. Re-verify after any CardMarket UI update. |
| MTGJSON network dependency | The `start` action fetches `https://mtgjson.com/api/v5/csv/sets.csv`. In an offline environment, unknown set codes will cause all cards to appear unmatched. |
| Foil handling | `"foil"` → `isFoil: true`; any other value → false. ManaBox exports other values as `"normal"` — verify if a future ManaBox version changes this. |
| Submission delay accuracy | `setTimeout` in the background service worker may be throttled by Chrome. Actual delay may exceed the configured value under system load. |
| wxt.config.ts TS error | A pre-existing TypeScript error caused by a vite version mismatch between WXT and `vite-plugin-node-polyfills`. Does not affect runtime behaviour. Do not flag as a regression. |

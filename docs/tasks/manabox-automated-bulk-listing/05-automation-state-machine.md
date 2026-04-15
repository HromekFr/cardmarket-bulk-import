---
title: Automation State Machine
type: AFK
state: New
priority: 2
created: 2026-04-14
prd: ../prds/2026-04-14-manabox-automated-bulk-listing.md
blocked-by:
  - 01-vitest-testing-infrastructure.md
tags: [automation, state-machine, background, tdd]
---

## What to build

A persistent state machine that lives in the background script and manages the full automation lifecycle. State is stored in `chrome.storage.local`. Built with TDD — the pure state transition logic is tested in isolation, with the Chrome storage API mocked at the boundary.

State shape:
```
{
  status: 'idle' | 'running' | 'paused' | 'complete',
  remainingExpansions: ExpansionBatch[],
  currentExpansionId: number | null,
  currentPage: number,
  listedCount: number,
  unmatchedCards: UnmatchedCard[],
  log: LogEntry[],
}
```

Actions to implement:
- `start(parsedCards)` — groups cards by Set code, resolves each to a CardMarket `idExpansion` via the existing MTGJSON data layer, transitions to `running`
- `resume()` — transitions `paused → running`
- `pause()` — transitions `running → paused`
- `advancePage()` — increments `currentPage`
- `advanceExpansion()` — moves to the next expansion, resets `currentPage` to 1
- `recordListed(count)` — increments `listedCount`
- `recordUnmatched(cards[])` — appends to `unmatchedCards`
- `appendLog(entry)` — appends a log entry
- `complete()` — transitions to `complete`

URL construction helper: builds `?idExpansion={id}&sortBy=number` for page 1, `?idExpansion={id}&sortBy=number&site={n}` for page N.

See the Automation State Machine section in the PRD Implementation Decisions and Testing Decisions.

## Acceptance criteria

- [ ] All status transitions are correctly enforced (invalid transitions are no-ops or throw)
- [ ] `start()` groups input cards by expansion and resolves Set codes to CardMarket IDs
- [ ] `advancePage()` and `advanceExpansion()` update state correctly
- [ ] `recordListed` and `recordUnmatched` accumulate correctly
- [ ] State is written to and read from `chrome.storage.local`
- [ ] State survives a simulated storage round-trip in tests
- [ ] All transitions covered by Vitest unit tests with Chrome storage mocked

## User stories addressed

- User story 9
- User story 10
- User story 11
- User story 22

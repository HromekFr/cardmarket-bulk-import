---
title: clear-runner — State Management (TDD)
type: AFK
state: New
priority: 2
created: 2026-04-15
prd: ../prds/2026-04-15-clear-all-offers.md
blocked-by: []
tags: [tdd]
---

## What to build

TDD the `chrome.storage` state management functions in `clear-runner.ts`: `startClearing()`, `cancelClearing()`, and `resumeIfActive()`.

These three functions are the persistence boundary — they are the only place that reads from or writes to `chrome.storage.local` under the `clearOffersState` key.

State shape:
```
clearOffersState: {
  active: boolean,
  removed: number,
  total: number
}
```

Follow red-green-refactor. Mock `chrome.storage.local` in tests (Vitest provides a jsdom environment; use a simple in-memory stub for storage). Prior art: automation reducer tests in the codebase.

See the PRD's "State shape" and "Module: clear-runner" sections for full behaviour spec.

## Acceptance criteria

- [ ] `startClearing(total)` writes `{ active: true, removed: 0, total }` to storage
- [ ] `cancelClearing()` removes the `clearOffersState` key from storage
- [ ] `resumeIfActive()` returns `null` (and does not throw) when storage is empty
- [ ] `resumeIfActive()` returns the persisted state when an active clear is stored
- [ ] `startClearing()` increments `removed` correctly as removals are recorded
- [ ] All tests written test-first
- [ ] All tests pass with `vitest`

## User stories addressed

- User story 8: operation auto-resumes after page reload via persisted state
- User story 9: extension knows when all articles are removed (active → cleared)

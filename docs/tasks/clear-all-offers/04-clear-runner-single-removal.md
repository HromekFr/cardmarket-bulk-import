---
title: clear-runner — Single Row Removal (TDD)
type: AFK
state: New
priority: 2
created: 2026-04-15
prd: ../prds/2026-04-15-clear-all-offers.md
blocked-by:
  - 02-clear-runner-row-scraping.md
tags: [tdd]
---

## What to build

TDD the single-row removal logic in `clear-runner.ts`. Given an article row element, this logic must:

1. Find the `.amount-input` within the row and set its value to `999`
2. Find the `.btn-danger` remove button within the row and click it
3. Wait for the row's DOM element to be removed before resolving (signals the AJAX call completed)

The wait-for-removal should use a `MutationObserver` on the row's parent, resolving when the row element is no longer in the DOM. This mirrors the DOM-mutation pattern used in `automation-runner.ts`.

Follow red-green-refactor. In tests, control when the row disappears from the DOM to verify the wait behaviour. Prior art: `automation-runner.ts` MutationObserver usage.

See the PRD's "Module: clear-runner" step 2–3 for full behaviour spec.

## Acceptance criteria

- [ ] The `.amount-input` value is set to `999` before the remove button is clicked
- [ ] The `.btn-danger` button within the row receives a click event
- [ ] The function does not resolve until the row element is removed from the DOM
- [ ] If the row is already absent when called, the function resolves immediately
- [ ] All tests written test-first
- [ ] All tests pass with `vitest`

## User stories addressed

- User story 4: amount set to 999 ensures full removal regardless of actual stock quantity
- User story 5: waits for each removal to complete before moving to the next

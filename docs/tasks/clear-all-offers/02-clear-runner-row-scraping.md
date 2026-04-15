---
title: clear-runner — Article Row Scraping (TDD)
type: AFK
state: Done
priority: 2
created: 2026-04-15
prd: ../prds/2026-04-15-clear-all-offers.md
blocked-by: []
tags: [tdd]
---

## What to build

TDD the `getArticleRows()` function in `clear-runner.ts`. This function inspects the current page DOM and returns the list of article IDs to be removed.

Follow red-green-refactor: write a failing test first, implement the minimum code to pass it, then refactor.

See the PRD's "Module: clear-runner" section for the expected behaviour. Prior art for test setup: `src/entrypoints/injectedButton.content/game-manager/__tests__/mtg-condition.test.ts`.

## Acceptance criteria

- [ ] `getArticleRows()` returns an empty array when no `div[id^="articleRow"]` elements are present in the DOM
- [ ] `getArticleRows()` returns the correct article IDs when one or more rows are present
- [ ] `getArticleRows()` ignores any `div` elements whose id does not start with `articleRow`
- [ ] All tests written test-first (failing test exists in git before the implementation)
- [ ] All tests pass with `vitest`

## User stories addressed

- User story 3: extension must find all articles to remove them
- User story 4: full removal regardless of stock quantity requires correct row identification

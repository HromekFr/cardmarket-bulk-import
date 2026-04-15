---
title: MtgGameManager condition support
type: AFK
state: New
priority: 2
created: 2026-04-14
prd: ../prds/2026-04-14-manabox-automated-bulk-listing.md
blocked-by:
  - 01-vitest-testing-infrastructure.md
tags: [mtg, condition, game-manager, tdd]
---

## What to build

Extend the existing `MtgGameManager` to support the `condition` field in the CardMarket bulk listing form. This is a narrow, additive change to the existing `fillRow` logic.

Changes:
- Add a `conditionElSelector` targeting `select[name^="idCondition"]` per table row
- Extend `fillRow` to set the condition select value using the integer condition value from the parsed row
- Add `condition` as a typed field on the MTG `ParsedRow` type

The condition integer values match CardMarket's dropdown: 1=Mint, 2=Near Mint, 3=Excellent, 4=Good, 5=Light Played, 6=Played, 7=Poor.

The existing manual flow (injected button) must continue to work unchanged after this modification. If no condition is provided, `fillRow` should default to Near Mint (2) to preserve backward compatibility.

Write tests for the condition mapping logic. See the MtgGameManager condition mapping section in the PRD Testing Decisions.

## Acceptance criteria

- [ ] `fillRow` sets the `idCondition` select element to the correct value
- [ ] Existing `fillRow` behaviour for quantity, price, language, and foil is unchanged
- [ ] When no condition is provided the select defaults to Near Mint (2)
- [ ] Unit test verifies the condition value is applied correctly
- [ ] The existing injected-button manual flow still works end-to-end

## User stories addressed

- User story 8
- User story 20

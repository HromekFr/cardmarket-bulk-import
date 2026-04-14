---
title: ManaBox CSV Parser
type: AFK
state: New
priority: 2
created: 2026-04-14
prd: ../prds/2026-04-14-manabox-automated-bulk-listing.md
blocked-by:
  - 01-vitest-testing-infrastructure.md
tags: [parser, manabox, tdd]
---

## What to build

A pure parsing function built with TDD that takes a ManaBox CSV `File` and returns a typed array of parsed rows. No side effects, no Chrome API calls, no DOM access — pure input/output.

Fixed column mapping from ManaBox export format:
- `Name` → name
- `Language` → language
- `Quantity` → quantity (integer)
- `Purchase price` → price (apply floor: `Math.max(price, priceFloor)`)
- `Set code` → set
- `Foil` → isFoil (`"foil"` → true, anything else → false)
- `Condition` → condition (`"near_mint"` → 2, `"good"` → 4, unknown → 2)

ManaBox format is detected by the presence of a `ManaBox ID` column in the CSV header. If not detected, the parser rejects the file.

The price floor is passed in as a parameter (not read from storage — the caller provides it).

Include a small fixture CSV file (5–10 rows) covering all edge cases for use in tests. Use TDD: write failing tests first, then implement.

See the ManaBox CSV Parser section in the PRD Implementation Decisions and Testing Decisions.

## Acceptance criteria

- [ ] Parser correctly maps all ManaBox columns to the typed output shape
- [ ] Price floor is applied: prices below the floor are raised to the floor
- [ ] Prices above the floor are used as-is
- [ ] `"foil"` maps to `isFoil: true`, `"normal"` maps to `isFoil: false`
- [ ] `"near_mint"` maps to condition `2`, `"good"` maps to condition `4`
- [ ] Unknown condition values fall back to `2` (Near Mint)
- [ ] Language and quantity are correctly parsed
- [ ] A non-ManaBox CSV (missing `ManaBox ID` column) is rejected
- [ ] All cases covered by Vitest unit tests using a fixture CSV

## User stories addressed

- User story 1
- User story 2
- User story 3
- User story 4
- User story 5
- User story 7
- User story 8
- User story 23

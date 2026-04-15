---
title: Vitest testing infrastructure
type: AFK
state: New
priority: 2
created: 2026-04-14
prd: ../prds/2026-04-14-manabox-automated-bulk-listing.md
blocked-by: []
tags: [testing, infrastructure]
---

## What to build

Configure Vitest in the project so that unit tests can be written and run. The project currently has no test infrastructure at all (noted as a TODO in docs/TODO.md). This slice installs and wires up the test runner so all subsequent TDD slices have a working foundation.

Deliverables:
- Vitest installed and configured (vitest.config.ts or via vite config)
- A test script in package.json (e.g. `yarn test`)
- One passing smoke test to verify the setup works end-to-end
- TypeScript types for tests resolve correctly

No feature code is written in this slice.

## Acceptance criteria

- [ ] `yarn test` (or equivalent) runs and exits successfully
- [ ] At least one passing smoke test exists
- [ ] TypeScript is correctly configured for test files (no type errors in tests)
- [ ] Test output is readable in the terminal

## User stories addressed

- Enables testing for all subsequent slices (3, 4, 5)

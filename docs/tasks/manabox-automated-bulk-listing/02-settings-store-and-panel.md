---
title: Settings Store and SettingsPanel
type: AFK
state: New
priority: 2
created: 2026-04-14
prd: ../prds/2026-04-14-manabox-automated-bulk-listing.md
blocked-by: []
tags: [settings, popup]
---

## What to build

A thin `chrome.storage.sync` wrapper (Settings Store) that persists user-configurable values, and a new Settings panel in the extension popup where the user can change those values.

Settings schema (with defaults):
- `priceFloor`: number, default `0.20` (€)
- `submissionDelay`: number, default `2000` (ms)

The Settings Store is a module with `getSettings()` and `saveSettings(partial)`. The SettingsPanel is a new panel added to the existing popup `PanelManager` alongside the existing Home, Instructions, About, and Report Issue panels.

See the Settings Store and SettingsPanel sections in the PRD Implementation Decisions.

## Acceptance criteria

- [ ] A Settings entry point is visible in the popup navigation
- [ ] The panel shows two numeric inputs: Price Floor (€) and Submission Delay (ms)
- [ ] Changing a value and closing/reopening the popup shows the saved value
- [ ] Defaults (€0.20 / 2000ms) are shown when no value has been saved yet
- [ ] Invalid inputs (negative numbers) are rejected or clamped
- [ ] Settings Store module is exported and usable by other modules

## User stories addressed

- User story 6
- User story 14
- User story 15
- User story 21

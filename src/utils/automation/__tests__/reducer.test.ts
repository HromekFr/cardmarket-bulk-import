import { describe, it, expect } from 'vitest';
import { automationReducer, INITIAL_STATE } from '../reducer';
import type { AutomationState } from '../types';

// Helper: build a minimal ExpansionBatch
function batch(cardmarketId: number) {
  return { cardmarketId, cards: [] };
}

// Helper: state already in running with one expansion active
function runningState(overrides: Partial<AutomationState> = {}): AutomationState {
  return {
    ...INITIAL_STATE,
    status: 'running',
    currentExpansionId: 1,
    currentPage: 1,
    ...overrides,
  };
}

describe('start', () => {
  it('transitions idle → running and sets first expansion as current', () => {
    const cards = [{ name: 'Black Lotus', set: 'LEA', language: 'English', quantity: 1, price: 1, isFoil: false, condition: 2 }];
    const state = automationReducer(INITIAL_STATE, {
      type: 'start',
      expansions: [{ cardmarketId: 10, cards }, batch(20), batch(30)],
    });
    expect(state.status).toBe('running');
    expect(state.currentExpansionId).toBe(10);
    expect(state.currentExpansionCards).toEqual(cards);
    expect(state.remainingExpansions).toEqual([batch(20), batch(30)]);
    expect(state.currentPage).toBe(1);
  });

  it('is a no-op from non-idle status', () => {
    const running = runningState({ currentExpansionId: 99 });
    const state = automationReducer(running, {
      type: 'start',
      expansions: [batch(10)],
    });
    expect(state).toEqual(running);
  });
});

describe('pause', () => {
  it('transitions running → paused', () => {
    const state = automationReducer(runningState(), { type: 'pause' });
    expect(state.status).toBe('paused');
  });

  it('is a no-op from non-running status', () => {
    const paused: AutomationState = { ...runningState(), status: 'paused' };
    const state = automationReducer(paused, { type: 'pause' });
    expect(state).toEqual(paused);
  });
});

describe('resume', () => {
  it('transitions paused → running', () => {
    const paused: AutomationState = { ...runningState(), status: 'paused' };
    const state = automationReducer(paused, { type: 'resume' });
    expect(state.status).toBe('running');
  });

  it('is a no-op from non-paused status', () => {
    const running = runningState();
    const state = automationReducer(running, { type: 'resume' });
    expect(state).toEqual(running);
  });
});

describe('advancePage', () => {
  it('increments currentPage', () => {
    const state = automationReducer(runningState({ currentPage: 3 }), { type: 'advancePage' });
    expect(state.currentPage).toBe(4);
  });
});

describe('advanceExpansion', () => {
  it('moves to the next expansion and resets page to 1', () => {
    const state = automationReducer(
      runningState({ currentPage: 5, remainingExpansions: [batch(20), batch(30)] }),
      { type: 'advanceExpansion' },
    );
    expect(state.currentExpansionId).toBe(20);
    expect(state.remainingExpansions).toEqual([batch(30)]);
    expect(state.currentPage).toBe(1);
  });

  it('sets currentExpansionId to null when no expansions remain', () => {
    const state = automationReducer(
      runningState({ remainingExpansions: [] }),
      { type: 'advanceExpansion' },
    );
    expect(state.currentExpansionId).toBeNull();
    expect(state.remainingExpansions).toEqual([]);
  });
});

describe('setExpansionCards', () => {
  it('replaces currentExpansionCards with the provided list', () => {
    const initial = runningState({
      currentExpansionCards: [
        { name: 'Black Lotus', set: 'LEA', language: 'en', quantity: 1, price: 1, isFoil: false, condition: 2 },
        { name: 'Mox Ruby', set: 'LEA', language: 'en', quantity: 1, price: 1, isFoil: false, condition: 2 },
      ],
    });
    const remaining = [
      { name: 'Mox Ruby', set: 'LEA', language: 'en', quantity: 1, price: 1, isFoil: false, condition: 2 },
    ];
    const state = automationReducer(initial, { type: 'setExpansionCards', cards: remaining });
    expect(state.currentExpansionCards).toEqual(remaining);
  });

  it('sets currentExpansionCards to empty when all cards were matched', () => {
    const initial = runningState({
      currentExpansionCards: [
        { name: 'Black Lotus', set: 'LEA', language: 'en', quantity: 1, price: 1, isFoil: false, condition: 2 },
      ],
    });
    const state = automationReducer(initial, { type: 'setExpansionCards', cards: [] });
    expect(state.currentExpansionCards).toEqual([]);
  });
});

describe('recordListed', () => {
  it('accumulates listed count', () => {
    const s1 = automationReducer(runningState({ listedCount: 5 }), { type: 'recordListed', count: 3 });
    expect(s1.listedCount).toBe(8);
    const s2 = automationReducer(s1, { type: 'recordListed', count: 2 });
    expect(s2.listedCount).toBe(10);
  });
});

describe('recordUnmatched', () => {
  it('appends unmatched cards', () => {
    const card = { name: 'Black Lotus', set: 'LEA', quantity: 1 };
    const s1 = automationReducer(runningState(), { type: 'recordUnmatched', cards: [card] });
    expect(s1.unmatchedCards).toEqual([card]);
    const card2 = { name: 'Mox Ruby', set: 'LEA', quantity: 1 };
    const s2 = automationReducer(s1, { type: 'recordUnmatched', cards: [card2] });
    expect(s2.unmatchedCards).toEqual([card, card2]);
  });
});

describe('appendLog', () => {
  it('appends log entries in order', () => {
    const e1 = { timestamp: 1000, message: 'Page 1 done' };
    const e2 = { timestamp: 2000, message: 'Page 2 done' };
    const s1 = automationReducer(runningState(), { type: 'appendLog', entry: e1 });
    const s2 = automationReducer(s1, { type: 'appendLog', entry: e2 });
    expect(s2.log).toEqual([e1, e2]);
  });
});

describe('complete', () => {
  it('transitions to complete', () => {
    const state = automationReducer(runningState(), { type: 'complete' });
    expect(state.status).toBe('complete');
  });
});

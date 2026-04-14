import { describe, it, expect, beforeEach, vi } from 'vitest';
import { INITIAL_STATE } from '../reducer';

// Mock chrome.storage.local before importing the store
const storageData: Record<string, unknown> = {};

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn((keys: string[], cb: (r: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        for (const k of keys) {
          if (k in storageData) result[k] = storageData[k];
        }
        cb(result);
      }),
      set: vi.fn((items: Record<string, unknown>, cb?: () => void) => {
        Object.assign(storageData, items);
        cb?.();
      }),
    },
  },
});

import { getAutomationState, dispatchAutomation } from '../store';

beforeEach(() => {
  for (const k of Object.keys(storageData)) delete storageData[k];
  vi.clearAllMocks();
});

describe('getAutomationState', () => {
  it('returns INITIAL_STATE when storage is empty', async () => {
    const state = await getAutomationState();
    expect(state).toEqual(INITIAL_STATE);
  });

  it('returns stored state on subsequent calls', async () => {
    await dispatchAutomation({ type: 'start', expansions: [{ cardmarketId: 42, cards: [] }] });
    const state = await getAutomationState();
    expect(state.status).toBe('running');
    expect(state.currentExpansionId).toBe(42);
  });
});

describe('dispatchAutomation', () => {
  it('applies action and persists new state to storage', async () => {
    await dispatchAutomation({ type: 'start', expansions: [{ cardmarketId: 7, cards: [] }] });
    const state = await getAutomationState();
    expect(state.status).toBe('running');
    expect(state.currentExpansionId).toBe(7);
  });

  it('state survives a storage round-trip', async () => {
    await dispatchAutomation({ type: 'start', expansions: [{ cardmarketId: 5, cards: [] }] });
    await dispatchAutomation({ type: 'recordListed', count: 10 });
    await dispatchAutomation({ type: 'appendLog', entry: { timestamp: 999, message: 'done' } });

    const state = await getAutomationState();
    expect(state.listedCount).toBe(10);
    expect(state.log).toHaveLength(1);
    expect(state.log[0].message).toBe('done');
  });
});

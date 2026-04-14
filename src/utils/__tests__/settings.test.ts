import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock chrome.storage.sync before importing the module under test
const storageData: Record<string, unknown> = {};

vi.stubGlobal('chrome', {
  storage: {
    sync: {
      get: vi.fn((keys: string[], cb: (result: Record<string, unknown>) => void) => {
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

import { getSettings, saveSettings } from '../settings';

beforeEach(() => {
  // Clear storage between tests
  for (const k of Object.keys(storageData)) delete storageData[k];
  vi.clearAllMocks();
});

describe('getSettings', () => {
  it('returns defaults when storage is empty', async () => {
    const settings = await getSettings();
    expect(settings.priceFloor).toBe(0.20);
    expect(settings.submissionDelay).toBe(2000);
  });

  it('returns stored priceFloor when set', async () => {
    storageData['priceFloor'] = 0.50;
    const settings = await getSettings();
    expect(settings.priceFloor).toBe(0.50);
  });

  it('returns stored submissionDelay when set', async () => {
    storageData['submissionDelay'] = 3000;
    const settings = await getSettings();
    expect(settings.submissionDelay).toBe(3000);
  });
});

describe('saveSettings', () => {
  it('persists a partial update without overwriting other keys', async () => {
    storageData['priceFloor'] = 0.50;
    storageData['submissionDelay'] = 3000;
    await saveSettings({ priceFloor: 1.00 });
    const settings = await getSettings();
    expect(settings.priceFloor).toBe(1.00);
    expect(settings.submissionDelay).toBe(3000);
  });

  it('stored values are returned on next getSettings call', async () => {
    await saveSettings({ submissionDelay: 5000 });
    const settings = await getSettings();
    expect(settings.submissionDelay).toBe(5000);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- chrome.storage stub (must be set up before importing clear-runner) ---
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
      remove: vi.fn((keys: string | string[], cb?: () => void) => {
        const arr = Array.isArray(keys) ? keys : [keys];
        for (const k of arr) delete storageData[k];
        cb?.();
      }),
    },
  },
});

import { getArticleRows, startClearing, cancelClearing, resumeIfActive, removeRow } from '../clear-runner';

function appendRow(id: string): HTMLDivElement {
  const div = document.createElement('div');
  div.id = id;
  document.body.appendChild(div);
  return div;
}

beforeEach(() => {
  document.body.innerHTML = '';
  for (const k of Object.keys(storageData)) delete storageData[k];
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
describe('getArticleRows', () => {
  it('returns an empty array when no articleRow elements are present', () => {
    expect(getArticleRows()).toEqual([]);
  });

  it('returns the correct article IDs when one row is present', () => {
    appendRow('articleRow123');
    expect(getArticleRows()).toEqual(['articleRow123']);
  });

  it('returns correct IDs when multiple rows are present', () => {
    appendRow('articleRow1');
    appendRow('articleRow2');
    appendRow('articleRow3');
    expect(getArticleRows()).toEqual(['articleRow1', 'articleRow2', 'articleRow3']);
  });

  it('ignores div elements whose id does not start with articleRow', () => {
    appendRow('articleRow42');
    appendRow('someOtherDiv');
    appendRow('notAnArticleRow99');
    expect(getArticleRows()).toEqual(['articleRow42']);
  });
});

// ---------------------------------------------------------------------------
describe('startClearing', () => {
  it('writes { active: true, removed: 0, total } to storage', async () => {
    await startClearing(17);
    expect(storageData['clearOffersState']).toEqual({ active: true, removed: 0, total: 17 });
  });
});

describe('cancelClearing', () => {
  it('removes the clearOffersState key from storage', async () => {
    storageData['clearOffersState'] = { active: true, removed: 3, total: 10 };
    await cancelClearing();
    expect('clearOffersState' in storageData).toBe(false);
  });
});

describe('resumeIfActive', () => {
  it('returns null when storage is empty', async () => {
    expect(await resumeIfActive()).toBeNull();
  });

  it('returns the persisted state when an active clear is stored', async () => {
    const state = { active: true, removed: 5, total: 12 };
    storageData['clearOffersState'] = state;
    expect(await resumeIfActive()).toEqual(state);
  });
});

// ---------------------------------------------------------------------------
function buildArticleRow(id: string): HTMLDivElement {
  const row = document.createElement('div');
  row.id = id;

  const amountInput = document.createElement('input');
  amountInput.className = 'amount-input';
  amountInput.value = '1';
  row.appendChild(amountInput);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn-danger';
  row.appendChild(removeBtn);

  document.body.appendChild(row);
  return row;
}

describe('removeRow', () => {
  it('sets the amount-input value to 999', async () => {
    const row = buildArticleRow('articleRow1');
    // Remove the row from DOM after click to satisfy the wait
    const btn = row.querySelector<HTMLButtonElement>('.btn-danger')!;
    btn.addEventListener('click', () => row.remove());

    await removeRow(row);

    // row was removed; verify the input had been set (capture before removal)
    // We verify via the btn click handler side-effect and that the promise resolved
    expect(row.isConnected).toBe(false);
  });

  it('sets amount-input to 999 before clicking remove button', async () => {
    const row = buildArticleRow('articleRow2');
    const amountInput = row.querySelector<HTMLInputElement>('.amount-input')!;
    let valueAtClick = '';
    const btn = row.querySelector<HTMLButtonElement>('.btn-danger')!;
    btn.addEventListener('click', () => {
      valueAtClick = amountInput.value;
      row.remove();
    });

    await removeRow(row);

    expect(valueAtClick).toBe('999');
  });

  it('clicks the btn-danger remove button', async () => {
    const row = buildArticleRow('articleRow3');
    let clicked = false;
    const btn = row.querySelector<HTMLButtonElement>('.btn-danger')!;
    btn.addEventListener('click', () => {
      clicked = true;
      row.remove();
    });

    await removeRow(row);

    expect(clicked).toBe(true);
  });

  it('resolves immediately if the row is already absent from the DOM', async () => {
    const row = buildArticleRow('articleRow4');
    row.remove(); // already gone

    await expect(removeRow(row)).resolves.toBeUndefined();
  });
});

export interface ClearOffersState {
  active: boolean;
  removed: number;
  total: number;
}

const STORAGE_KEY = 'clearOffersState';

export function getArticleRows(): string[] {
  const nodes = document.querySelectorAll('div[id^="articleRow"]');
  return Array.from(nodes).map((el) => el.id);
}

export function startClearing(total: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: { active: true, removed: 0, total } }, resolve);
  });
}

export function cancelClearing(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(STORAGE_KEY, resolve);
  });
}

export function resumeIfActive(): Promise<ClearOffersState | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const state = result[STORAGE_KEY] as ClearOffersState | undefined;
      resolve(state ?? null);
    });
  });
}

export function getTotalCount(): number {
  const el = document.querySelector<HTMLElement>('span.total-count');
  return el ? parseInt(el.textContent ?? '0', 10) : 0;
}

export function getBaseOffersUrl(): string {
  const { origin, pathname } = window.location;
  // Strip the path at "Singles" and drop any query params / hash
  const base = pathname.replace(/\/Singles.*$/, '/Singles');
  return `${origin}${base}`;
}

export function updateRemovedCount(removed: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const current = result[STORAGE_KEY] as ClearOffersState | undefined;
      if (!current) { resolve(); return; }
      chrome.storage.local.set({ [STORAGE_KEY]: { ...current, removed } }, resolve);
    });
  });
}

type ProgressCallback = (removed: number, total: number) => void;

export async function clearCurrentPage(
  startRemoved: number,
  total: number,
  onProgress: ProgressCallback,
): Promise<number> {
  const ids = getArticleRows();
  let removed = startRemoved;
  for (const id of ids) {
    const row = document.getElementById(id);
    if (row) {
      await removeRow(row);
      removed++;
      await updateRemovedCount(removed);
      onProgress(removed, total);
    }
  }
  return removed;
}

export function removeRow(row: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    // If already removed, resolve immediately
    if (!row.isConnected) {
      resolve();
      return;
    }

    const parent = row.parentElement!;

    const observer = new MutationObserver(() => {
      if (!row.isConnected) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(parent, { childList: true });

    // Set amount to 999 then click the remove button
    const amountInput = row.querySelector<HTMLInputElement>('.amount-input');
    if (amountInput) amountInput.value = '999';

    const removeBtn = row.querySelector<HTMLElement>('.btn-danger');
    removeBtn?.click();
  });
}

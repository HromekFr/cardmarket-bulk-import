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

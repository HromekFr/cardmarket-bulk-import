export type Settings = {
  priceFloor: number;
  submissionDelay: number;
};

const DEFAULTS: Settings = {
  priceFloor: 0.20,
  submissionDelay: 2000,
};

const KEYS = Object.keys(DEFAULTS) as (keyof Settings)[];

export function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(KEYS, (result) => {
      resolve({
        priceFloor: (result['priceFloor'] as number) ?? DEFAULTS.priceFloor,
        submissionDelay: (result['submissionDelay'] as number) ?? DEFAULTS.submissionDelay,
      });
    });
  });
}

export function saveSettings(partial: Partial<Settings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(partial, resolve);
  });
}

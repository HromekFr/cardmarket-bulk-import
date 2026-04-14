import type { AutomationAction, AutomationState } from './types';
import { automationReducer, INITIAL_STATE } from './reducer';

const STORAGE_KEY = 'automationState';

export function getAutomationState(): Promise<AutomationState> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve((result[STORAGE_KEY] as AutomationState) ?? INITIAL_STATE);
    });
  });
}

export async function dispatchAutomation(action: AutomationAction): Promise<AutomationState> {
  const current = await getAutomationState();
  const next = automationReducer(current, action);
  await new Promise<void>((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: next }, resolve);
  });
  return next;
}

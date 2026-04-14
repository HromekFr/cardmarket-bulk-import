import type { AutomationStatus } from './types';

export function deriveBadgeText(status: AutomationStatus, listedCount: number): string {
  if (status === 'idle' || status === 'complete') return '';
  return listedCount.toString();
}

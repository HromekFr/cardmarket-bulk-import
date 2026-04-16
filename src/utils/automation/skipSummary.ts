import type { UnmatchedCard } from './types';

export function buildSkipSummaryEntry(unresolved: UnmatchedCard[]): { message: string; detail: string[] } {
  const totalQuantity = unresolved.reduce((sum, c) => sum + c.quantity, 0);
  const bySet = unresolved.reduce<Record<string, number>>((acc, c) => {
    acc[c.set] = (acc[c.set] ?? 0) + c.quantity;
    return acc;
  }, {});
  return {
    message: `${totalQuantity} card(s) skipped — unrecognised set codes.`,
    detail: Object.entries(bySet).map(([set, qty]) => `${set}: ${qty} card(s)`),
  };
}

import type { ExpansionBatch } from './types';

export type PageCompletionResult =
  | { type: 'nextPage'; navigateTo: string }
  | { type: 'nextExpansion'; expansionId: number }
  | { type: 'complete' };

export function resolvePageCompletion(
  remainingExpansions: ExpansionBatch[],
  nextPageUrl: string | null,
  hasRemainingCards: boolean,
): PageCompletionResult {
  if (nextPageUrl !== null && hasRemainingCards) {
    return { type: 'nextPage', navigateTo: nextPageUrl };
  }
  if (remainingExpansions.length > 0) {
    return { type: 'nextExpansion', expansionId: remainingExpansions[0].cardmarketId };
  }
  return { type: 'complete' };
}

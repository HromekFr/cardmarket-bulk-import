import type { ExpansionBatch } from './types';

export type PageCompletionResult =
  | { type: 'nextPage'; navigateTo: string }
  | { type: 'nextExpansion'; expansionId: number }
  | { type: 'complete' };

export function resolvePageCompletion(
  remainingExpansions: ExpansionBatch[],
  nextPageUrl: string | null,
): PageCompletionResult {
  if (nextPageUrl !== null) {
    return { type: 'nextPage', navigateTo: nextPageUrl };
  }
  if (remainingExpansions.length > 0) {
    return { type: 'nextExpansion', expansionId: remainingExpansions[0].cardmarketId };
  }
  return { type: 'complete' };
}

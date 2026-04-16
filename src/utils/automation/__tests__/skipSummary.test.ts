import { describe, it, expect } from 'vitest';
import { buildSkipSummaryEntry } from '../skipSummary';
import type { UnmatchedCard } from '../types';

function card(set: string, quantity: number): UnmatchedCard {
  return { name: 'Card', set, quantity };
}

describe('buildSkipSummaryEntry', () => {
  it('reports total quantity, not row count, in the header message', () => {
    const unresolved = [card('FAKE', 5), card('ALSO', 3)];
    const { message } = buildSkipSummaryEntry(unresolved);
    expect(message).toBe('8 card(s) skipped — unrecognised set codes.');
  });
});

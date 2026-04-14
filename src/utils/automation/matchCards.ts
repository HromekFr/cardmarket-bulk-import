import { compareNormalized, normalizeString } from '../index';
import type { ManaBoxRow } from '../manabox-parser';
import type { UnmatchedCard } from './types';

export type MatchedCard = {
  card: ManaBoxRow;
  rowName: string;
};

export function matchCardsToRows(
  cards: ManaBoxRow[],
  rowNames: (string | null | undefined)[],
): { matched: MatchedCard[]; unmatched: UnmatchedCard[] } {
  const validRowNames = rowNames.filter((n): n is string => !!n);
  const matched: MatchedCard[] = [];
  const unmatched: UnmatchedCard[] = [];

  for (const card of cards) {
    let exactMatch: string | null = null;
    let substringMatch: string | null = null;

    for (const rowName of validRowNames) {
      if (compareNormalized(rowName, card.name)) {
        exactMatch = rowName;
        break;
      }
      if (normalizeString(rowName).includes(normalizeString(card.name))) {
        substringMatch = rowName;
      }
    }

    const rowName = exactMatch ?? substringMatch;
    if (rowName) {
      matched.push({ card, rowName });
    } else {
      unmatched.push({ name: card.name, set: card.set, quantity: card.quantity });
    }
  }

  return { matched, unmatched };
}

import type { ManaBoxRow } from '../manabox-parser';
import type { ExpansionBatch, UnmatchedCard } from './types';

export type SetData = {
  matchKeys: string[];
  code: string;
  cardmarketId: number;
};

export function groupByExpansion(
  cards: ManaBoxRow[],
  sets: SetData[],
): { batches: ExpansionBatch[]; unresolved: UnmatchedCard[] } {
  const batchMap = new Map<number, ManaBoxRow[]>();
  const unresolved: UnmatchedCard[] = [];

  for (const card of cards) {
    const match = sets.find((s) =>
      s.matchKeys.some((k) => k.toLowerCase() === card.set.toLowerCase()),
    );
    if (!match) {
      unresolved.push({ name: card.name, set: card.set, quantity: card.quantity });
      continue;
    }
    const existing = batchMap.get(match.cardmarketId) ?? [];
    batchMap.set(match.cardmarketId, [...existing, card]);
  }

  const batches: ExpansionBatch[] = Array.from(batchMap.entries()).map(
    ([cardmarketId, cards]) => ({ cardmarketId, cards }),
  );

  return { batches, unresolved };
}

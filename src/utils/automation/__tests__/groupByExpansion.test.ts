import { describe, it, expect } from 'vitest';
import { groupByExpansion } from '../groupByExpansion';
import type { ManaBoxRow } from '../../manabox-parser';

const SET_DATA = [
  { matchKeys: ['LEA', 'Limited Edition Alpha'], code: 'LEA', cardmarketId: 1 },
  { matchKeys: ['LEB', 'Limited Edition Beta'], code: 'LEB', cardmarketId: 2 },
];

function row(name: string, set: string): ManaBoxRow {
  return { name, set, language: 'English', quantity: 1, price: 0.5, isFoil: false, condition: 2 };
}

describe('groupByExpansion', () => {
  it('groups cards with the same resolved expansion into one batch', () => {
    const cards = [row('Black Lotus', 'LEA'), row('Ancestral Recall', 'LEA'), row('Mox Ruby', 'LEB')];
    const { batches } = groupByExpansion(cards, SET_DATA);
    expect(batches).toHaveLength(2);
    expect(batches.find((b) => b.cardmarketId === 1)?.cards).toHaveLength(2);
    expect(batches.find((b) => b.cardmarketId === 2)?.cards).toHaveLength(1);
  });

  it('puts cards with unknown set code into unresolved', () => {
    const cards = [row('Fake Card', 'FAKE')];
    const { batches, unresolved } = groupByExpansion(cards, SET_DATA);
    expect(batches).toHaveLength(0);
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0].name).toBe('Fake Card');
  });

  it('matches set code case-insensitively', () => {
    const cards = [row('Black Lotus', 'lea')];
    const { batches } = groupByExpansion(cards, SET_DATA);
    expect(batches).toHaveLength(1);
    expect(batches[0].cardmarketId).toBe(1);
  });

  it('unknown set code with no match goes to unresolved', () => {
    const cards = [row('Unknown Card', 'FAKE2')];
    const { batches, unresolved } = groupByExpansion(cards, SET_DATA);
    expect(batches).toHaveLength(0);
    expect(unresolved[0].set).toBe('FAKE2');
  });

  it('resolves a ManaBox alias code that is only in matchKeys (not a native MTGJSON code)', () => {
    // Simulate getMTGJSONDataImpl injecting an alias: ManaBox uses 'LTC' but MTGJSON uses 'LTC_NATIVE'
    const setsWithAlias = [
      { matchKeys: ['LTC_NATIVE', 'Tales of Middle-earth Commander', 'LTC'], code: 'LTC_NATIVE', cardmarketId: 99 },
    ];
    const cards = [row('Gandalf', 'LTC')];
    const { batches, unresolved } = groupByExpansion(cards, setsWithAlias);
    expect(unresolved).toHaveLength(0);
    expect(batches).toHaveLength(1);
    expect(batches[0].cardmarketId).toBe(99);
  });
});

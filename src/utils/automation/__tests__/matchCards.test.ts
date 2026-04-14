import { describe, it, expect } from 'vitest';
import { matchCardsToRows } from '../matchCards';
import type { ManaBoxRow } from '../../manabox-parser';

function row(name: string, set = 'LEA'): ManaBoxRow {
  return { name, set, language: 'English', quantity: 1, price: 0.5, isFoil: false, condition: 2 };
}

describe('matchCardsToRows', () => {
  it('exact normalized match', () => {
    const { matched } = matchCardsToRows([row('Black Lotus')], ['Black Lotus']);
    expect(matched).toHaveLength(1);
    expect(matched[0].rowName).toBe('Black Lotus');
  });

  it('case-insensitive match', () => {
    const { matched } = matchCardsToRows([row('black lotus')], ['Black Lotus']);
    expect(matched).toHaveLength(1);
  });

  it('diacritic-normalized match', () => {
    // page shows diacritics, CSV does not
    const { matched } = matchCardsToRows([row('Legión')], ['Legion']);
    expect(matched).toHaveLength(1);
  });

  it('substring fallback when no exact match', () => {
    // page shows "Black Lotus (Alpha)" but CSV has "Black Lotus"
    const { matched } = matchCardsToRows([row('Black Lotus')], ['Black Lotus (Alpha)']);
    expect(matched).toHaveLength(1);
    expect(matched[0].rowName).toBe('Black Lotus (Alpha)');
  });

  it('exact match preferred over substring when both exist', () => {
    const rowNames = ['Black Lotus (Alpha)', 'Black Lotus'];
    const { matched } = matchCardsToRows([row('Black Lotus')], rowNames);
    expect(matched[0].rowName).toBe('Black Lotus');
  });

  it('puts card in unmatched when no row found', () => {
    const { matched, unmatched } = matchCardsToRows([row('Fake Card')], ['Black Lotus']);
    expect(matched).toHaveLength(0);
    expect(unmatched).toHaveLength(1);
    expect(unmatched[0].name).toBe('Fake Card');
  });

  it('handles multiple cards, some matched some not', () => {
    const cards = [row('Black Lotus'), row('Ancestral Recall'), row('Fake Card')];
    const rowNames = ['Black Lotus', 'Ancestral Recall', 'Time Walk'];
    const { matched, unmatched } = matchCardsToRows(cards, rowNames);
    expect(matched).toHaveLength(2);
    expect(unmatched).toHaveLength(1);
    expect(unmatched[0].name).toBe('Fake Card');
  });

  it('ignores null / empty row names from DOM', () => {
    const { matched } = matchCardsToRows([row('Black Lotus')], [null, '', 'Black Lotus']);
    expect(matched).toHaveLength(1);
  });
});

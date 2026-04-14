import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseManaBoxCsv } from '../manabox-parser';

function makeFile(filename: string): File {
  const content = readFileSync(
    resolve(__dirname, 'fixtures', filename),
    'utf-8',
  );
  return new File([content], filename, { type: 'text/csv' });
}

describe('parseManaBoxCsv', () => {
  it('maps all columns to the correct output shape', async () => {
    const rows = await parseManaBoxCsv(makeFile('manabox.csv'), 0.20);
    const row = rows[0];
    expect(row.name).toBe('Black Lotus');
    expect(row.set).toBe('LEA');
    expect(row.quantity).toBe(2);
    expect(row.language).toBe('English');
  });

  it('applies price floor: price below floor is raised to floor', async () => {
    const rows = await parseManaBoxCsv(makeFile('manabox.csv'), 0.20);
    // Row 0: purchase price 0.10 < floor 0.20 → should be 0.20
    expect(rows[0].price).toBe(0.20);
  });

  it('applies price floor: price above floor is kept as-is', async () => {
    const rows = await parseManaBoxCsv(makeFile('manabox.csv'), 0.20);
    // Row 1: purchase price 1.50 > floor 0.20 → should be 1.50
    expect(rows[1].price).toBe(1.50);
  });

  it('maps "foil" to isFoil: true', async () => {
    const rows = await parseManaBoxCsv(makeFile('manabox.csv'), 0.20);
    expect(rows[1].isFoil).toBe(true); // row 1 is foil
  });

  it('maps "normal" to isFoil: false', async () => {
    const rows = await parseManaBoxCsv(makeFile('manabox.csv'), 0.20);
    expect(rows[0].isFoil).toBe(false); // row 0 is normal
  });

  it('maps "near_mint" to condition 2', async () => {
    const rows = await parseManaBoxCsv(makeFile('manabox.csv'), 0.20);
    expect(rows[0].condition).toBe(2);
  });

  it('maps "good" to condition 4', async () => {
    const rows = await parseManaBoxCsv(makeFile('manabox.csv'), 0.20);
    expect(rows[1].condition).toBe(4);
  });

  it('falls back unknown condition to 2 (Near Mint)', async () => {
    const rows = await parseManaBoxCsv(makeFile('manabox.csv'), 0.20);
    // Row 3: condition "unknown_condition" → 2
    expect(rows[3].condition).toBe(2);
  });

  it('rejects a non-ManaBox CSV (missing ManaBox ID column)', async () => {
    const nonManabox = new File(['Name,Quantity\nBlack Lotus,1\n'], 'other.csv', { type: 'text/csv' });
    await expect(parseManaBoxCsv(nonManabox, 0.20)).rejects.toThrow();
  });

  it('parses a CSV exported with a UTF-8 BOM', async () => {
    const rows = await parseManaBoxCsv(makeFile('manabox-bom.csv'), 0);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Black Lotus');
  });
});

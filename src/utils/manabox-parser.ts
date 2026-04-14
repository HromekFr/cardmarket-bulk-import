import { parse } from 'csv-parse/sync';

export type ManaBoxRow = {
  name: string;
  language: string;
  quantity: number;
  price: number;
  set: string;
  isFoil: boolean;
  condition: number;
};

const CONDITION_MAP: Record<string, number> = {
  near_mint: 2,
  good: 4,
  excellent: 3,
  light_played: 5,
  played: 6,
  poor: 7,
  mint: 1,
};

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export async function parseManaBoxCsv(file: File, priceFloor: number): Promise<ManaBoxRow[]> {
  const text = await readFileAsText(file);
  const records: Record<string, string>[] = parse(text, {
    columns: true,
    skipEmptyLines: true,
    bom: true,
  });

  if (records.length === 0 || !('ManaBox ID' in records[0])) {
    throw new Error('Not a ManaBox CSV: missing "ManaBox ID" column');
  }

  return records.map((row) => {
    const rawPrice = parseFloat(row['Purchase price']) || 0;
    return {
      name: row['Name'],
      language: row['Language'],
      quantity: parseInt(row['Quantity'], 10) || 0,
      price: Math.max(rawPrice, priceFloor),
      set: row['Set code'],
      isFoil: row['Foil']?.toLowerCase() === 'foil',
      condition: CONDITION_MAP[row['Condition']?.toLowerCase()] ?? 2,
    };
  });
}

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import { beforeAll, describe, expect, it } from 'vitest';
import { MCM_ID_OVERRIDES } from './mcm-id-overrides';

const SETS_CSV_URL = 'https://mtgjson.com/api/v5/csv/sets.csv';

const VARIANT_SUFFIXES = [
  ': Extras',
  ': First-Place',
  ': Minigame',
  ': Prerelease',
  ': Promos',
  ': Tokens',
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const CM_DROPDOWN_PATH = resolve(__dirname, '../../../../../page_structure/sets_dropdown.html');

type MTGJSONRow = {
  code: string;
  name: string;
  mcmId: string;
  mcmName: string;
};

type Suggestion = { id: number; name: string };

function parseDropdown(html: string): Map<number, string> {
  const byId = new Map<number, string>();
  const regex = /<option value="(\d+)">([^<]+)<\/option>/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    byId.set(parseInt(m[1], 10), m[2]);
  }
  return byId;
}

function hasVariantSuffix(name: string): boolean {
  return VARIANT_SUFFIXES.some((s) => name.endsWith(s));
}

function stripVariantSuffix(name: string): string {
  for (const s of VARIANT_SUFFIXES) {
    if (name.endsWith(s)) return name.slice(0, -s.length);
  }
  return name;
}

function findSuggestion(
  mtgjsonName: string,
  mtgjsonMcmName: string,
  cmByName: Map<string, number>,
): Suggestion | null {
  // Try stripping variant suffix from MTGJSON's own mcmName first (most authoritative)
  if (mtgjsonMcmName) {
    const stripped = stripVariantSuffix(mtgjsonMcmName);
    if (stripped !== mtgjsonMcmName && cmByName.has(stripped)) {
      return { id: cmByName.get(stripped)!, name: stripped };
    }
    if (cmByName.has(mtgjsonMcmName)) {
      return { id: cmByName.get(mtgjsonMcmName)!, name: mtgjsonMcmName };
    }
  }
  // Fall back to MTGJSON's set name
  if (cmByName.has(mtgjsonName)) {
    return { id: cmByName.get(mtgjsonName)!, name: mtgjsonName };
  }
  return null;
}

function formatSuggestion(code: string, suggestion: Suggestion | null): string {
  if (!suggestion) return '    → No suggestion found — check CardMarket manually';
  return `    → Suggested fix: MCM_ID_OVERRIDES["${code}"] = ${suggestion.id}  // ${suggestion.name}`;
}

describe('CardMarket ID mappings', () => {
  let rows: MTGJSONRow[];
  let cmById: Map<number, string>;
  let cmByName: Map<string, number>;

  beforeAll(async () => {
    const res = await fetch(SETS_CSV_URL);
    const text = await res.text();
    rows = parse(text, { columns: true, skip_empty_lines: true }) as MTGJSONRow[];

    const html = readFileSync(CM_DROPDOWN_PATH, 'utf-8');
    cmById = parseDropdown(html);
    cmByName = new Map([...cmById.entries()].map(([id, name]) => [name, id]));
  });

  it('no mcmId resolves to a variant expansion on CardMarket [case A]', () => {
    const mismatches: string[] = [];

    for (const row of rows) {
      if (!row.mcmId) continue;
      if (MCM_ID_OVERRIDES[row.code] !== undefined) continue;

      const id = parseInt(row.mcmId, 10);
      const cmName = cmById.get(id);
      if (!cmName) continue;

      if (hasVariantSuffix(cmName) && !hasVariantSuffix(row.mcmName)) {
        const suggestion = findSuggestion(row.name, row.mcmName, cmByName);
        mismatches.push(
          `  [CASE_A] ${row.code} "${row.name}"\n` +
          `    mcmId=${id} resolves to "${cmName}" (variant suffix) but MTGJSON mcmName="${row.mcmName}"\n` +
          formatSuggestion(row.code, suggestion),
        );
      }
    }

    expect(
      mismatches,
      `Found ${mismatches.length} uncovered case A mismatch(es). Add entries to MCM_ID_OVERRIDES in mcm-id-overrides.ts:\n\n${mismatches.join('\n\n')}`,
    ).toHaveLength(0);
  });

  it('all mcmIds exist in CardMarket [case B]', () => {
    const mismatches: string[] = [];

    for (const row of rows) {
      if (!row.mcmId) continue;
      if (MCM_ID_OVERRIDES[row.code] !== undefined) continue;

      const id = parseInt(row.mcmId, 10);
      if (!cmById.has(id)) {
        const suggestion = findSuggestion(row.name, row.mcmName, cmByName);
        mismatches.push(
          `  [CASE_B] ${row.code} "${row.name}"\n` +
          `    mcmId=${id} doesn't exist in CardMarket (MTGJSON mcmName="${row.mcmName}")\n` +
          formatSuggestion(row.code, suggestion),
        );
      }
    }

    expect(
      mismatches,
      `Found ${mismatches.length} uncovered case B mismatch(es). Add entries to MCM_ID_OVERRIDES in mcm-id-overrides.ts:\n\n${mismatches.join('\n\n')}`,
    ).toHaveLength(0);
  });

  it('no set exists on CardMarket without an mcmId mapping [case C]', () => {
    const mismatches: string[] = [];

    for (const row of rows) {
      if (row.mcmId) continue;
      if (!row.name) continue;
      if (MCM_ID_OVERRIDES[row.code] !== undefined) continue;

      // Check if this set exists on CardMarket (exact name, or as a base set ignoring variant entries)
      const cmMatches: Suggestion[] = [];
      for (const [cmName, cmId] of cmByName.entries()) {
        const base = stripVariantSuffix(cmName);
        if (base === row.name) {
          cmMatches.push({ id: cmId, name: cmName });
        }
      }

      const baseMatch = cmMatches.find((m) => !hasVariantSuffix(m.name));
      if (baseMatch) {
        mismatches.push(
          `  [CASE_C] ${row.code} "${row.name}"\n` +
          `    No mcmId in MTGJSON but found on CardMarket\n` +
          formatSuggestion(row.code, baseMatch),
        );
      }
    }

    expect(
      mismatches,
      `Found ${mismatches.length} uncovered case C mismatch(es). Add entries to MCM_ID_OVERRIDES in mcm-id-overrides.ts:\n\n${mismatches.join('\n\n')}`,
    ).toHaveLength(0);
  });
});

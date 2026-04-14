import memoize from 'memoize';
import type { Set } from 'mtggraphql';

import { readCsv } from '../../../utils/csv';

const SETS_ENDPOINT = 'https://mtgjson.com/api/v5/csv/sets.csv';

// MTGJSON mcmId corrections: MTGJSON maps these set codes to the wrong CardMarket expansion.
// Each entry is: set code → correct CardMarket idExpansion.
// M20: MTGJSON points to 2490 (Core 2020: Extras) instead of 2447 (Core 2020).
const MCM_ID_OVERRIDES: Record<string, number> = {
  M20: 2447,
};

async function getMTGJSONDataImpl() {
  const res = await fetch(SETS_ENDPOINT);
  const blob = await res.blob();
  const file = new File([blob], 'sets.csv');
  const data = await readCsv(file);
  return (data.rows as Set[])
    // Filter out any that don't have a set Id
    .filter((set) => !!set.mcmId)
    // Convert the set Ids to number correctly
    .map((v) => ({ ...v, mcmId: Number(v.mcmId) }))
    // Map to our data structure
    .map((set) => ({
      matchKeys: [
        set.code,
        set.codeV3,
        set.keyruneCode,
        set.id,
        set.mcmId,
        set.mcmName,
        set.mtgoCode,
        set.name,
      ]
        .filter((v) => !!v)
        .map((v) => v!.toString()),
      code: set.code!,
      cardmarketId: MCM_ID_OVERRIDES[set.code!] ?? set.mcmId,
    }));
}

export const getMTGJSONData = memoize(getMTGJSONDataImpl);

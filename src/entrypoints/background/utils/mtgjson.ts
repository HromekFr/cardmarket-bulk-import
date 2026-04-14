import memoize from 'memoize';
import type { Set } from 'mtggraphql';

import { readCsv } from '../../../utils/csv';
import { MCM_ID_OVERRIDES } from './mcm-id-overrides';

async function getMTGJSONDataImpl() {
  const res = await fetch(SETS_ENDPOINT);
  const blob = await res.blob();
  const file = new File([blob], 'sets.csv');
  const data = await readCsv(file);
  return (data.rows as Set[])
    // Filter out sets with no mcmId unless we have a manual override for them
    .filter((set) => !!set.mcmId || !!MCM_ID_OVERRIDES[set.code!])
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

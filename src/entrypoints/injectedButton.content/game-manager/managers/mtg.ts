import memoize from 'memoize';
import { sendMessage } from 'webext-bridge/content-script';
import * as yup from 'yup';

import GenericGameManager from './generic';
import type { CommonParsedRowFields } from './generic';
import { compareNormalized } from '../../../../utils';
import type { TranslationKey } from '../../../../utils';
import { fillCondition } from '../utils/condition';

async function getMTGJSONDataImpl() {
  // We can't fetch inside the content script, so we delegate to the background with messages
  return sendMessage('cardmarket-bulk-import.getMTGJSONData', undefined, 'background');
}

const getMTGJSONData = memoize(getMTGJSONDataImpl);

async function matchSetToCardmarketIdImpl(set: string) {
  const sets = await getMTGJSONData();
  const result = sets.find(({ matchKeys }) => !!matchKeys.find((v) => compareNormalized(v, set)));
  if (result) return { code: result.code, cardmarketId: result.cardmarketId };
  return null;
}

const matchSetToCardmarketId = memoize(matchSetToCardmarketIdImpl);

const VALID_FOIL_VALUES = ['t', '1', 'foil', 'yes'];
const foilElSelector = 'td input[name^="isFoil"]';

class MtgGameManager extends GenericGameManager<'set' | 'isFoil', { set: string, isFoil: boolean, condition: number }> {
  extraColumns: Record<'set' | 'isFoil', TranslationKey> = {
    set: 'injectedButton.gameManagers.mtg.importCsvForm.set.label',
    isFoil: 'injectedButton.gameManagers.mtg.importCsvForm.isFoil.label',
  };

  extraValidationSchema = yup.object({
    set: yup.string(),
    isFoil: yup.string(),
  });

  async parseRow(
    id: number,
    rawRowData: Record<string, unknown>,
    columnMapping: {
      name: string,
      quantity: string | undefined,
      price: string | undefined,
      language: string | undefined,
      set: string | undefined,
      isFoil: string | undefined,
    }) {
    const parsedData = await super.parseRow(id, rawRowData, columnMapping);
    let set = columnMapping['set'] ? String(rawRowData[columnMapping['set']]) : '';
    let enabled = !!parsedData.matchedName;
    if (set) {
      const paramsCode = Number(new URLSearchParams(window.location.search).get('idExpansion'));
      const data = await matchSetToCardmarketId(set);
      if (data) {
        set = data.code;
        if (data.cardmarketId !== paramsCode) enabled = false;
      }
      else {
        set = '';
      }
    }
    return {
      ...parsedData,
      set: set,
      isFoil: columnMapping['isFoil']
        ? VALID_FOIL_VALUES.includes(String(rawRowData[columnMapping['isFoil']]).toLowerCase())
        : false,
      condition: 2,
      enabled,
    };
  }

  async fillRow(
    trEl: HTMLTableRowElement,
    row: (CommonParsedRowFields & { set: string, isFoil: boolean, condition: number }),
  ): Promise<HTMLTableRowElement> {
    const resolvedEl = await super.fillRow(trEl, row);
    const foilEl: HTMLInputElement = resolvedEl.querySelector(foilElSelector)!;
    if (row.isFoil) foilEl.checked = true;
    fillCondition(resolvedEl, row.condition);
    return resolvedEl;
  };

  extraTableColumns: Record<'set' | 'isFoil' | 'condition', null | TranslationKey> = {
    set: 'injectedButton.gameManagers.mtg.selectRowsFormTable.set',
    isFoil: 'injectedButton.gameManagers.mtg.selectRowsFormTable.isFoil',
    condition: null,
  };
};

export default MtgGameManager;

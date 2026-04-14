import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Tests for MtgGameManager condition support.
 * We test the fillRow behaviour by building a minimal DOM table row
 * that mimics the CardMarket bulk listing form structure.
 */

function buildTableRow(opts: { quantity?: string; condition?: string } = {}): HTMLTableRowElement {
  const tr = document.createElement('tr');

  const quantityTd = document.createElement('td');
  const quantityInput = document.createElement('input');
  quantityInput.name = 'amount';
  quantityInput.defaultValue = '0';
  quantityInput.value = opts.quantity ?? '0';
  quantityTd.appendChild(quantityInput);

  const priceTd = document.createElement('td');
  const priceInput = document.createElement('input');
  priceInput.name = 'price[EUR]';
  priceInput.defaultValue = '0.00';
  priceInput.value = '0.00';
  priceTd.appendChild(priceInput);

  const languageTd = document.createElement('td');
  const languageSelect = document.createElement('select');
  languageSelect.name = 'idLanguage';
  const langOption = document.createElement('option');
  langOption.value = '1';
  languageSelect.appendChild(langOption);
  languageTd.appendChild(languageSelect);

  const foilTd = document.createElement('td');
  const foilInput = document.createElement('input');
  foilInput.type = 'checkbox';
  foilInput.name = 'isFoil[0]';
  foilTd.appendChild(foilInput);

  const conditionTd = document.createElement('td');
  const conditionSelect = document.createElement('select');
  conditionSelect.name = 'idCondition[0]';
  for (const v of ['1', '2', '3', '4', '5', '6', '7']) {
    const opt = document.createElement('option');
    opt.value = v;
    conditionSelect.appendChild(opt);
  }
  if (opts.condition) conditionSelect.value = opts.condition;
  conditionTd.appendChild(conditionSelect);

  tr.appendChild(quantityTd);
  tr.appendChild(priceTd);
  tr.appendChild(languageTd);
  tr.appendChild(foilTd);
  tr.appendChild(conditionTd);
  return tr;
}

describe('MtgGameManager fillRow — condition', () => {
  it('sets the condition select to the provided value', async () => {
    const { fillCondition } = await import('../utils/condition');
    const tr = buildTableRow();
    fillCondition(tr, 4);
    const select = tr.querySelector<HTMLSelectElement>('select[name^="idCondition"]')!;
    expect(select.value).toBe('4');
  });

  it('defaults to Near Mint (2) when condition is not provided', async () => {
    const { fillCondition } = await import('../utils/condition');
    const tr = buildTableRow();
    fillCondition(tr, undefined);
    const select = tr.querySelector<HTMLSelectElement>('select[name^="idCondition"]')!;
    expect(select.value).toBe('2');
  });
});

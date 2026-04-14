export const conditionElSelector = 'select[name^="idCondition"]';

export function fillCondition(trEl: HTMLTableRowElement, condition: number | undefined): void {
  const select = trEl.querySelector<HTMLSelectElement>(conditionElSelector);
  if (select) select.value = String(condition ?? 2);
}

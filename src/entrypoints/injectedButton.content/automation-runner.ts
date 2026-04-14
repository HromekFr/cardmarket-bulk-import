import { sendMessage } from 'webext-bridge/content-script';

import { getAutomationState } from '../../utils/automation/store';
import { matchCardsToRows } from '../../utils/automation/matchCards';
import { fillCondition } from './game-manager/utils/condition';
import { matchLanguage } from './game-manager/utils/language';
import {
  getWebsiteRows,
  quantityElSelector,
  priceElSelector,
  languageElSelector,
} from './game-manager/utils/html';

const FOIL_SELECTOR = 'td input[name^="isFoil"]';
const SUBMIT_SELECTOR = 'input[type="submit"][form="BulkListingForm"]';
const MUTATION_TARGET_SELECTOR = '#NewArticleTableWrapper';

function fillAutomationRow(trEl: HTMLTableRowElement, card: {
  quantity: number;
  price: number;
  language: string;
  isFoil: boolean;
  condition: number;
}): void {
  const quantityEl = trEl.querySelector<HTMLInputElement>(quantityElSelector);
  const priceEl = trEl.querySelector<HTMLInputElement>(priceElSelector);
  const languageEl = trEl.querySelector<HTMLSelectElement>(languageElSelector);
  const foilEl = trEl.querySelector<HTMLInputElement>(FOIL_SELECTOR);

  if (quantityEl) quantityEl.value = card.quantity.toString();
  if (priceEl) priceEl.value = card.price.toFixed(2);
  if (languageEl) {
    const lang = matchLanguage(card.language);
    if (lang.matched) languageEl.value = lang.data.mkmValue.toString();
  }
  if (foilEl) foilEl.checked = card.isFoil;
  fillCondition(trEl, card.condition);
}

function waitForTableMutation(): Promise<void> {
  return new Promise((resolve) => {
    const target = document.querySelector(MUTATION_TARGET_SELECTOR);
    if (!target) {
      resolve();
      return;
    }
    const observer = new MutationObserver(() => {
      observer.disconnect();
      resolve();
    });
    observer.observe(target, { childList: true, subtree: true });
    // Fallback: resolve after 10 s if no mutation fires
    setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 10_000);
  });
}

export async function runAutomationPage(): Promise<void> {
  const state = await getAutomationState();
  if (state.status !== 'running') return;

  const expansionCards = state.currentExpansionCards;

  const rowEls = getWebsiteRows();
  const rowNames = rowEls.map((el) => el.textContent);
  const { matched, unmatched } = matchCardsToRows(expansionCards, rowNames);

  let listedCount = 0;
  for (const { card, rowName } of matched) {
    const nameEl = rowEls.find((el) => el.textContent === rowName);
    if (!nameEl) continue;
    const trEl = nameEl.closest('tr') as HTMLTableRowElement | null;
    if (!trEl) continue;
    fillAutomationRow(trEl, card);
    listedCount++;
  }

  // Submit the form
  const submitBtn = document.querySelector<HTMLInputElement>(SUBMIT_SELECTOR);
  submitBtn?.click();

  // Wait for table to update (success indicator)
  await waitForTableMutation();

  // Read the next-page link AFTER the table mutation (task 07)
  const nextLink = document.querySelector<HTMLAnchorElement>('a[data-direction="next"]');
  const nextPageUrl = nextLink?.href ?? null;

  await sendMessage(
    'cardmarket-bulk-import.pageComplete',
    { listedCount, unmatchedCards: unmatched, nextPageUrl },
    'background',
  );
}

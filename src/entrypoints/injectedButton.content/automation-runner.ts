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

  console.log(`[automation-runner] expansion cards to place: ${expansionCards.length}`, expansionCards.map((c) => c.name));
  console.log(`[automation-runner] CardMarket rows on page: ${rowNames.length}`, rowNames);

  const { matched, unmatched } = matchCardsToRows(expansionCards, rowNames);

  console.log(`[automation-runner] matched: ${matched.length}`, matched.map((m) => `${m.card.name} → "${m.rowName}"`));
  console.log(`[automation-runner] not found this page: ${unmatched.length}`, unmatched.map((c) => c.name));

  // Cards not found on this page are passed back so the background can trim
  // currentExpansionCards — preventing already-listed cards from re-appearing
  // as unmatched on subsequent pages.
  const remainingCards = expansionCards.filter(
    (card) => !matched.some((m) => m.card === card),
  );

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

  // Read the next-page link AFTER the table mutation (task 07).
  // Guard: only treat as a next-page link if it points back into the BulkListing flow.
  // The CardMarket page also contains a paginated existing-stock table whose
  // a[data-direction="next"] would otherwise be picked up after submission.
  const nextLink = document.querySelector<HTMLAnchorElement>('a[data-direction="next"]');
  const nextPageUrl =
    nextLink?.href?.includes('/BulkListing') ? nextLink.href : null;

  await sendMessage(
    'cardmarket-bulk-import.pageComplete',
    { listedCount, unmatchedCards: unmatched, remainingCards, nextPageUrl },
    'background',
  );
}

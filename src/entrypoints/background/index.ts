import { defineBackground } from '#imports';

import { onMessage } from 'webext-bridge/background';

import { getMTGJSONData } from './utils/mtgjson';
import { groupByExpansion } from '../../utils/automation/groupByExpansion';
import { dispatchAutomation, getAutomationState } from '../../utils/automation/store';
import { buildPageUrl } from '../../utils/automation/url';
import { resolvePageCompletion } from '../../utils/automation/resolvePageCompletion';
import { deriveBadgeText } from '../../utils/automation/badge';
import { getSettings } from '../../utils/settings';
import type { AutomationState } from '../../utils/automation/types';

const CM_BULK_LISTING_BASE =
  'https://www.cardmarket.com/en/Magic/Stock/ListingMethods/BulkListing';

async function getOrOpenCardMarketTab(): Promise<number> {
  const tabs = await chrome.tabs.query({ url: '*://*.cardmarket.com/*' });
  if (tabs.length > 0 && tabs[0].id != null) return tabs[0].id;
  const tab = await chrome.tabs.create({ url: CM_BULK_LISTING_BASE });
  return tab.id!;
}

async function navigateTo(url: string): Promise<void> {
  const tabId = await getOrOpenCardMarketTab();
  await chrome.tabs.update(tabId, { url, active: true });
}

function updateBadge(status: string, listedCount: number): void {
  const text = deriveBadgeText(status as Parameters<typeof deriveBadgeText>[0], listedCount);
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: text ? '#2ecc71' : '#000000' });
}

export default defineBackground(() => {
  // Cache MTGJSON data at startup for faster first use
  getMTGJSONData();

  // ── Badge: update whenever automation state changes ──────────────────────
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (!('automationState' in changes)) return;
    const newState = changes['automationState'].newValue as AutomationState | undefined;
    if (newState) updateBadge(newState.status, newState.listedCount);
  });

  // ── getMTGJSONData ───────────────────────────────────────────────────────
  onMessage('cardmarket-bulk-import.getMTGJSONData', async () => {
    return await getMTGJSONData();
  });

  // ── startAutomation ──────────────────────────────────────────────────────
  onMessage('cardmarket-bulk-import.startAutomation', async ({ data }) => {
    const sets = await getMTGJSONData();
    const { batches, unresolved } = groupByExpansion(data.cards, sets);

    if (batches.length === 0) {
      await dispatchAutomation({
        type: 'appendLog',
        entry: { timestamp: Date.now(), message: 'No matching expansions found — check Set codes.' },
      });
      return undefined;
    }

    await dispatchAutomation({ type: 'start', expansions: batches });

    if (unresolved.length > 0) {
      await dispatchAutomation({ type: 'recordUnmatched', cards: unresolved });
      // Group by set code so the detail list stays concise
      const bySet = unresolved.reduce<Record<string, number>>((acc, c) => {
        acc[c.set] = (acc[c.set] ?? 0) + c.quantity;
        return acc;
      }, {});
      await dispatchAutomation({
        type: 'appendLog',
        entry: {
          timestamp: Date.now(),
          message: `${unresolved.length} card(s) skipped — unrecognised set codes.`,
          detail: Object.entries(bySet).map(([set, qty]) => `${set}: ${qty} card(s)`),
        },
      });
    }

    const state = await getAutomationState();
    const url = CM_BULK_LISTING_BASE + buildPageUrl(state.currentExpansionId!, 1);
    await navigateTo(url);

    return undefined;
  });

  // ── pageComplete ─────────────────────────────────────────────────────────
  onMessage('cardmarket-bulk-import.pageComplete', async ({ data }) => {
    const { listedCount, unmatchedCards, remainingCards, nextPageUrl } = data;
    const state = await getAutomationState();

    console.log(
      `[automation] page ${state.currentPage} complete —`,
      `listed: ${listedCount},`,
      `not found this page: ${unmatchedCards.length},`,
      `remaining for expansion: ${remainingCards.length},`,
      `nextPageUrl: ${nextPageUrl ?? 'none'}`,
    );
    if (unmatchedCards.length > 0) {
      console.log('[automation] not found this page:', unmatchedCards.map((c) => `${c.name} (${c.set})`));
    }

    await dispatchAutomation({ type: 'recordListed', count: listedCount });
    await dispatchAutomation({ type: 'setExpansionCards', cards: remainingCards });

    await dispatchAutomation({
      type: 'appendLog',
      entry: {
        timestamp: Date.now(),
        message: `Page ${state.currentPage} done — ${listedCount} listed, ${unmatchedCards.length} not found on this page.`,
        detail: unmatchedCards.length > 0
          ? unmatchedCards.map((c) => `${c.name} (${c.set})`)
          : undefined,
      },
    });

    // Decide what to do next
    const decision = resolvePageCompletion(state.remainingExpansions, nextPageUrl, remainingCards.length > 0);
    console.log(`[automation] decision: ${decision.type}`);
    const { submissionDelay } = await getSettings();

    if (decision.type === 'nextPage') {
      // Still cards to place on subsequent pages — do not record unmatched yet
      await dispatchAutomation({ type: 'advancePage' });
      setTimeout(async () => {
        const s = await getAutomationState();
        if (s.status === 'running') await navigateTo(decision.navigateTo);
      }, submissionDelay);

    } else {
      // Expansion is done — cards still in remainingCards were never listed
      if (remainingCards.length > 0) {
        const trulyUnmatched = remainingCards.map((c) => ({ name: c.name, set: c.set, quantity: c.quantity }));
        console.log('[automation] truly unmatched (never listed):', trulyUnmatched.map((c) => `${c.name} (${c.set})`));
        await dispatchAutomation({ type: 'recordUnmatched', cards: trulyUnmatched });
      }

      if (decision.type === 'nextExpansion') {
        await dispatchAutomation({ type: 'advanceExpansion' });
        await dispatchAutomation({
          type: 'appendLog',
          entry: {
            timestamp: Date.now(),
            message: `Expansion done — moving to next expansion (id: ${decision.expansionId}).`,
          },
        });
        setTimeout(async () => {
          const s = await getAutomationState();
          if (s.status === 'running') {
            const url = CM_BULK_LISTING_BASE + buildPageUrl(decision.expansionId, 1);
            await navigateTo(url);
          }
        }, submissionDelay);

      } else {
        // All expansions complete
        await dispatchAutomation({ type: 'complete' });
        const finalState = await getAutomationState();
        console.log(
          `[automation] complete — total listed: ${finalState.listedCount},`,
          `total unmatched: ${finalState.unmatchedCards.length}`,
        );
        await dispatchAutomation({
          type: 'appendLog',
          entry: { timestamp: Date.now(), message: 'All expansions complete!' },
        });
      }
    }

    return undefined;
  });

  // ── resumeAutomation (Task 09) ────────────────────────────────────────────
  onMessage('cardmarket-bulk-import.resumeAutomation', async () => {
    await dispatchAutomation({ type: 'resume' });
    const state = await getAutomationState();
    if (state.currentExpansionId !== null) {
      const url = CM_BULK_LISTING_BASE + buildPageUrl(state.currentExpansionId, state.currentPage);
      await navigateTo(url);
    }
    return undefined;
  });
});

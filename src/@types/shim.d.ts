import type { ProtocolWithReturn } from 'webext-bridge';

import { getMTGJSONData } from '../entrypoints/background/utils/mtgjson';
import type { ManaBoxRow } from '../utils/manabox-parser';
import type { UnmatchedCard } from '../utils/automation/types';

declare module 'webext-bridge' {
  export interface ProtocolMap {
    'cardmarket-bulk-import.getMTGJSONData': ProtocolWithReturn<
      undefined,
      ReturnType<typeof getMTGJSONData>
    >,
    'cardmarket-bulk-import.startAutomation': ProtocolWithReturn<
      { cards: ManaBoxRow[] },
      undefined
    >,
    'cardmarket-bulk-import.pageComplete': ProtocolWithReturn<
      { listedCount: number; unmatchedCards: UnmatchedCard[]; remainingCards: ManaBoxRow[]; nextPageUrl: string | null },
      undefined
    >,
    'cardmarket-bulk-import.resumeAutomation': ProtocolWithReturn<
      undefined,
      undefined
    >,
  }
}

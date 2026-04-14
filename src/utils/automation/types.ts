import type { ManaBoxRow } from '../manabox-parser';

export type { ManaBoxRow };

export type AutomationStatus = 'idle' | 'running' | 'paused' | 'complete';

export type ExpansionBatch = {
  cardmarketId: number;
  cards: ManaBoxRow[];
};

export type UnmatchedCard = {
  name: string;
  set: string;
  quantity: number;
};

export type LogEntry = {
  timestamp: number;
  message: string;
  detail?: string[];
};

export type AutomationState = {
  status: AutomationStatus;
  remainingExpansions: ExpansionBatch[];
  currentExpansionId: number | null;
  currentExpansionCards: ManaBoxRow[];
  currentPage: number;
  listedCount: number;
  unmatchedCards: UnmatchedCard[];
  log: LogEntry[];
};

export type AutomationAction =
  | { type: 'start'; expansions: ExpansionBatch[] }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'advancePage' }
  | { type: 'advanceExpansion' }
  | { type: 'setExpansionCards'; cards: ManaBoxRow[] }
  | { type: 'recordListed'; count: number }
  | { type: 'recordUnmatched'; cards: UnmatchedCard[] }
  | { type: 'appendLog'; entry: LogEntry }
  | { type: 'complete' };

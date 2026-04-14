import type { AutomationAction, AutomationState } from './types';

export const INITIAL_STATE: AutomationState = {
  status: 'idle',
  remainingExpansions: [],
  currentExpansionId: null,
  currentExpansionCards: [],
  currentPage: 1,
  listedCount: 0,
  unmatchedCards: [],
  log: [],
};

export function automationReducer(state: AutomationState, action: AutomationAction): AutomationState {
  switch (action.type) {
    case 'start': {
      if (state.status !== 'idle') return state;
      const [first, ...rest] = action.expansions;
      return {
        ...state,
        status: 'running',
        currentExpansionId: first?.cardmarketId ?? null,
        currentExpansionCards: first?.cards ?? [],
        remainingExpansions: rest,
        currentPage: 1,
      };
    }

    case 'pause': {
      if (state.status !== 'running') return state;
      return { ...state, status: 'paused' };
    }

    case 'resume': {
      if (state.status !== 'paused') return state;
      return { ...state, status: 'running' };
    }

    case 'advancePage': {
      return { ...state, currentPage: state.currentPage + 1 };
    }

    case 'advanceExpansion': {
      const [next, ...rest] = state.remainingExpansions;
      return {
        ...state,
        currentExpansionId: next?.cardmarketId ?? null,
        currentExpansionCards: next?.cards ?? [],
        remainingExpansions: rest,
        currentPage: 1,
      };
    }

    case 'setExpansionCards': {
      return { ...state, currentExpansionCards: action.cards };
    }

    case 'recordListed': {
      return { ...state, listedCount: state.listedCount + action.count };
    }

    case 'recordUnmatched': {
      return { ...state, unmatchedCards: [...state.unmatchedCards, ...action.cards] };
    }

    case 'appendLog': {
      return { ...state, log: [...state.log, action.entry] };
    }

    case 'complete': {
      return { ...state, status: 'complete' };
    }

    default:
      return state;
  }
}

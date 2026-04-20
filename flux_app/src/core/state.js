import { INITIAL_MARKET_DATA } from './constants.js';

export const state = {
  mockEntryState: {
    bookedSlot: null,
    unlockTime: 0,
    isLate: false,
    timerInterval: null
  },
  
  mockMarketData: [...INITIAL_MARKET_DATA],
  
  marketInterval: null,
  
  flashNotifTracker: {
    firstShown: false,
    extraCount: 0,
    lastShownAt: 0
  },
  
  p5Instance: null,
  bgShouldBeWaking: false
};

// Persistence functions
export function saveEntryState() {
  const { timerInterval, ...serializable } = state.mockEntryState;
  localStorage.setItem('flux_entry_state', JSON.stringify(serializable));
}

export function loadEntryState() {
  const saved = localStorage.getItem('flux_entry_state');
  if (saved) {
    const data = JSON.parse(saved);
    state.mockEntryState = { ...state.mockEntryState, ...data };
  }
}

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
  bgShouldBeWaking: false,

  // Intelligence Synthesis State (v2.0)
  intelligenceHUD: {
    flowPulse: 50,
    syncIntegrity: 98.4,
    stadiumDensity: 0.65,
    identityHash: 'FLX-001X',
    lastDirective: 'SYSTEM STABLE'
  },

  // v3.0 MASTERPIECE SIMULATION
  stadiumMatrix: {
    sectors: Array.from({ length: 9 }).map((_, i) => ({
      id: i + 1,
      name: `SECTOR ${i + 1}`,
      occupancy: Math.floor(Math.random() * 400 + 100),
      capacity: 1000,
      status: 'NOMINAL'
    })),
    userSession: {
      isCheckedIn: false,
      walletBalance: 1500,
      purchasedVouchers: [],
      entryTimestamp: null,
      currentSector: null
    },
    directives: [
      { id: 1, text: "Redistribution: Sector 4 attendees suggest redirect to Gate D.", level: 'info' }
    ]
  }
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

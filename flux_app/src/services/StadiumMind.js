import { state } from '../core/state.js';

/**
 * STADIUM MIND - THE SENTIENT LOGIC ENGINE (v4.0 PHOENIX)
 * Centered on Predictive Analysis, Event Orchestration, and Sovereign Feedback.
 */

export const StadiumMind = {
  isInitialized: false,
  eventTimer: null,

  init: () => {
    if (StadiumMind.isInitialized) return;
    StadiumMind.isInitialized = true;
    console.log('[StadiumMind] v4.0 Sovereign Core Online.');

    // 1. Hook into Global Heartbeat
    window.addEventListener('flux-heartbeat', (e) => {
      StadiumMind.simulationTick(e.detail);
    });

    // 2. Start the Event Orchestrator
    StadiumMind.startEventOrchestrator();
  },

  startEventOrchestrator: () => {
    // Every 25-45 seconds, trigger a major Stadium Event
    const nextEvent = () => {
      const delay = Math.random() * 20000 + 25000;
      StadiumMind.eventTimer = setTimeout(() => {
        StadiumMind.triggerMajorEvent();
        nextEvent();
      }, delay);
    };
    nextEvent();
  },

  triggerMajorEvent: () => {
    const events = [
      { text: "TOUCHDOWN: TEAM ALPHA SCORES! // PREPARE FOR CONCOURSE SURGE", level: 'success', impact: 'surge' },
      { text: "HALFTIME INITIATED // ACTIVATING FLASH MARKET DIVERSIONS", level: 'warning', impact: 'market' },
      { text: "INCIDENT: SECTOR 2 ESCALATOR LOCK // REDIRECTING FLOW TO GATE D", level: 'error', impact: 'redirect' },
      { text: "WEATHER ALERT: RAIN DETECTED // INDOOR CONGESTION PREDICTED", level: 'info', impact: 'indoor' }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    StadiumMind.addDirective(event.text, event.level);
    
    // Impact the Global Metrics
    if (event.impact === 'surge') {
       state.stadiumMatrix.sectors.forEach(s => s.occupancy = Math.min(s.capacity, s.occupancy + 100));
    }
  },

  simulationTick: (metrics) => {
    const matrix = state.stadiumMatrix;
    
    // 1. PREDICTIVE LOGIC: Analyze Trends
    matrix.sectors.forEach(s => {
      // Natural Flux
      const flux = (Math.random() - 0.5) * 20;
      s.occupancy = Math.max(0, Math.min(s.capacity, Math.round(s.occupancy + flux)));
      
      const load = s.occupancy / s.capacity;
      s.status = load > 0.85 ? 'CRITICAL' : load > 0.65 ? 'DENSE' : 'NOMINAL';

      // PREDICT SURGE
      if (s.status === 'NOMINAL' && load > 0.55 && Math.random() > 0.7) {
         StadiumMind.addDirective(`PREDICTIVE: Potential Surge detected in ${s.name}. Monitoring...`, 'info');
      }
    });

    // 2. ADAPTIVE DIRECTIVES
    const criticalSector = matrix.sectors.find(s => s.status === 'CRITICAL');
    if (criticalSector) {
      StadiumMind.addDirective(`SOVEREIGN REDIRECT: ${criticalSector.name} overcapacity. Locking Gate ${criticalSector.id}.`, 'warning');
    }
  },

  addDirective: (text, level) => {
    const matrix = state.stadiumMatrix;
    // Debounce similar rapid-fire directives
    if (matrix.directives[0] && matrix.directives[0].text === text) return;
    
    matrix.directives.unshift({ id: Date.now(), text, level });
    if (matrix.directives.length > 8) matrix.directives.pop();
    
    // BROADCAST Globally
    window.dispatchEvent(new CustomEvent('stadium-directive', { detail: matrix.directives[0] }));
  },

  processAction: (type, data) => {
    console.log(`[StadiumMind] Execution: ${type}`, data);
    const session = state.stadiumMatrix.userSession;

    switch (type) {
      case 'CHECK_IN':
        session.isCheckedIn = true;
        session.entryTimestamp = Date.now();
        StadiumMind.addDirective("SOVEREIGN AUTH: Identity Transferred to Local Mesh. Welcome.", "success");
        break;

      case 'PURCHASE':
        if (session.walletBalance >= data.price) {
          session.walletBalance -= data.price;
          session.purchasedVouchers.push({ ...data, timestamp: Date.now() });
          
          // Affect Global Inventory
          const stall = state.mockMarketData.find(s => s.name === data.name);
          if (stall) stall.inventory = Math.max(0, stall.inventory - 1);
          
          StadiumMind.addDirective(`TX-SYNC: ${data.name} acquired. Ledger updated.`, "success");
          return true;
        }
        return false;

      case 'TERMINATE_SESSION':
        session.isCheckedIn = false;
        StadiumMind.addDirective("DATA PURGE: Session Scrubbed. Farewell.", "info");
        break;
    }
  }
};

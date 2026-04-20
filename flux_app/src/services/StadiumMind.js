import { state } from '../core/state.js';

/**
 * STADIUM MIND - THE EXECUTIVE INTELLIGENCE (v3.0 IOS)
 * Central simulation engine that manages sectors, inventory, and directives.
 */

export const StadiumMind = {
  init: () => {
    console.log('[StadiumMind] Executive Intelligence Online.');
    // The simulation ticks alongside the FlowOrchestrator heartbeat
    window.addEventListener('flux-heartbeat', (e) => {
      StadiumMind.simulationTick(e.detail);
    });
  },

  simulationTick: (metrics) => {
    const matrix = state.stadiumMatrix;
    
    // 1. Update Sector Densities based on Heartbeat
    matrix.sectors.forEach(s => {
      const jitter = (Math.random() - 0.5) * (metrics.flowPulse / 10);
      s.occupancy = Math.max(0, Math.min(s.capacity, Math.round(s.occupancy + jitter)));
      
      const load = s.occupancy / s.capacity;
      s.status = load > 0.85 ? 'CRITICAL' : load > 0.6 ? 'DENSE' : 'NOMINAL';
    });

    // 2. Generate Autonomous Directives
    const criticalSector = matrix.sectors.find(s => s.status === 'CRITICAL');
    if (criticalSector) {
      StadiumMind.addDirective(`SURGE: ${criticalSector.name} at capacity. Diverting traffic to Sector ${criticalSector.id === 9 ? 1 : criticalSector.id + 1}.`, 'warning');
    }
    
    // 3. Random Event Simulation
    if (Math.random() > 0.95) {
      StadiumMind.addDirective("MAINTENANCE: Escalator sync reset in Sector 1.", "info");
    }
  },

  addDirective: (text, level) => {
    const matrix = state.stadiumMatrix;
    if (matrix.directives.some(d => d.text === text)) return; // Prevent duplicates
    
    matrix.directives.unshift({ id: Date.now(), text, level });
    if (matrix.directives.length > 5) matrix.directives.pop();
    
    window.dispatchEvent(new CustomEvent('stadium-directive', { detail: matrix.directives[0] }));
  },

  processAction: (type, data) => {
    console.log(`[StadiumMind] Processing ${type}:`, data);
    const session = state.stadiumMatrix.userSession;

    switch (type) {
      case 'CHECK_IN':
        session.isCheckedIn = true;
        session.entryTimestamp = Date.now();
        session.currentSector = 4; // Default entry gate sector
        StadiumMind.addDirective("PASS-SYNC: Identity verified at Gate 4. Welcome to Flux Sector.", "success");
        break;

      case 'PURCHASE':
        if (session.walletBalance >= data.price) {
          session.walletBalance -= data.price;
          session.purchasedVouchers.push({ ...data, timestamp: Date.now() });
          
          // Impact the world: Reduce inventory of the stall
          const stall = state.mockMarketData.find(s => s.name === data.name);
          if (stall) stall.inventory = Math.max(0, stall.inventory - 1);
          
          StadiumMind.addDirective(`TRANSACTION: ${data.name} voucher issued. Balance: $${session.walletBalance}`, "success");
          return true;
        }
        return false;

      case 'TERMINATE_SESSION':
        session.isCheckedIn = false;
        session.purchasedVouchers = [];
        StadiumMind.addDirective("SESSION DISSOLVED: Identity scrubbed. Safe travel.", "info");
        break;
    }
  }
};

import { state } from '../core/state.js';

/**
 * FLOW ORCHESTRATOR - The Stadium Heartbeat (v2.0 IOS)
 * Manages the global reactive pulse that synchronizes all modules.
 */

export const FlowOrchestrator = {
  heartbeatInterval: null,

  init: () => {
    if (FlowOrchestrator.heartbeatInterval) return;
    
    console.log('[IOS-Flow] Initializing stadium heartbeat...');
    FlowOrchestrator.heartbeatInterval = setInterval(() => {
      FlowOrchestrator.tick();
    }, 4000);
  },

  tick: () => {
    const s = state.intelligenceHUD;
    
    // 1. Oscillate Flow Pulse (0-100)
    const drift = (Math.random() - 0.5) * 10;
    s.flowPulse = Math.round(Math.min(100, Math.max(0, s.flowPulse + drift)));
    
    // 2. Fluxtuate Sync Integrity
    s.syncIntegrity = (97 + Math.random() * 2.9).toFixed(1);
    
    // 3. Dynamic Stadium Density (Trending)
    s.stadiumDensity = Math.min(1, Math.max(0.2, s.stadiumDensity + (Math.random() - 0.5) * 0.05));
    
    // 4. Identity Jitter (Hardware simulation feel)
    s.identityHash = `FLX-${Math.floor(Math.random()*9000+1000)}${Math.random() > 0.5 ? 'X' : 'P'}`;
    
    // 5. Intelligence Directive
    const directives = ["SYSTEM STABLE", "FLOW OPTIMIZING", "CAPACITY WARNING", "PHASE SYNC ACTIVE", "CONCOURSE SURGE"];
    s.lastDirective = directives[Math.floor(Math.random() * directives.length)];

    // Trigger HUD Update Event
    window.dispatchEvent(new CustomEvent('flux-heartbeat', { detail: s }));
  },

  getMetrics: () => state.intelligenceHUD
};

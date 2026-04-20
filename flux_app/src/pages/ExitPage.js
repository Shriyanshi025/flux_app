import { state } from '../core/state.js';
import { EXIT_TIER_DATA } from '../core/constants.js';
import { authService } from '../services/authService.js';
import { uiUtils } from '../utils/uiUtils.js';
import { FlowOrchestrator } from '../services/FlowOrchestrator.js';
import { StadiumMind } from '../services/StadiumMind.js';
import { QRComponent } from '../components/QRComponent.js';

/**
 * EXIT PROTOCOL - EXECUTIVE SYNTHESIS (v3.0 MASTERPIECE)
 * Implements priority-aware dispersal and stateful session termination.
 */

export const ExitPage = {
  render: (mountDashboardModule) => {
    if (!authService.isAuth()) return;

    const content = `
      <div id="exit-container" class="animated" style="width:100%;">
        <!-- TOP STATUS RIBBON -->
        <div class="market-ticker animated" id="exit-ticker" style="padding:0.75rem; display:flex; align-items:center; background:rgba(255,0,60,0.15); border-bottom:1px solid #ff003c; backdrop-filter:blur(10px);">
          <div class="pulse-dot" style="background:#ff003c; margin-right:12px;"></div>
          <div style="flex:1; color: #fff; font-weight:900; font-size:0.75rem; letter-spacing:2px; font-family:var(--font-logo);">EXIT PROTOCOL ALPHA ACTIVE</div>
          <div id="exit-global-sync" style="font-size:0.5rem; color:rgba(255,255,255,0.4); font-family:monospace;">SYNCING...</div>
        </div>
        
        <div class="main-feed" style="gap:1.2rem; padding:20px; padding-bottom:150px;">
          
          <!-- SMART DEPARTURE GATE STATUS -->
          <div class="promo-card animated" style="border-color:#00ff66; padding:1.5rem; background:rgba(0,0,0,0.5);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
               <p style="color:rgba(255,255,255,0.3); font-size:0.6rem; text-transform:uppercase; letter-spacing:2px; margin:0;">Personal Departure Window</p>
               <span id="gate-sync-status" style="font-size:0.6rem; color:#00ff66; font-weight:900;">CALCULATING...</span>
            </div>
            <h2 id="gate-id" style="color:#fff; font-size:2.4rem; font-weight:900; margin:0; font-family:var(--font-logo);">GATE B-4</h2>
            <p id="walk-time-est" style="color:var(--text-muted); font-size:0.85rem; margin-top:8px;">Priority Grade: <b id="priority-grade">---</b></p>
            <div class="divider" style="height:1px; background:rgba(255,255,255,0.05); margin:15px 0;"></div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
               <p style="color:rgba(255,255,255,0.3); font-size:0.55rem; margin:0;">ROUTE INTEGRITY</p>
               <p id="route-integrity-val" style="color:#00ff66; font-size:0.7rem; font-weight:900; margin:0;">98.2%</p>
            </div>
            <div style="background:rgba(255,255,255,0.05); height:4px; border-radius:2px; margin-top:8px;"><div id="route-integrity-bar" style="width:98%; background:#00ff66; height:100%; border-radius:2px; transition:width 1s ease;"></div></div>
          </div>

          <!-- TRANSPORT SYNC DASHBOARD -->
          <div class="promo-card" id="transport-card" style="border-color:rgba(255,255,255,0.1); padding:1.2rem; background:rgba(18,18,18,0.4);">
            <p style="color:var(--text-muted); font-size:0.6rem; text-transform:uppercase; letter-spacing:2px; margin-bottom:1.2rem;">Live Transit Telemetry</p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
               <div class="transit-node" style="background:rgba(255,255,255,0.03); border-radius:12px; padding:12px; border:1px solid rgba(255,255,255,0.05);">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.55rem; color:rgba(255,255,255,0.3); font-weight:800;">TRAIN A-LINE</span>
                    <div class="pulse-dot" id="train-dot" style="width:6px; height:6px; background:#00ff66;"></div>
                  </div>
                  <p id="transport-train" style="font-size:1.4rem; font-weight:900; margin:10px 0 0 0; color:#fff; font-family:var(--font-logo);">4 MIN</p>
               </div>
               <div class="transit-node" style="background:rgba(255,255,255,0.03); border-radius:12px; padding:12px; border:1px solid rgba(255,255,255,0.05);">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.55rem; color:rgba(255,255,255,0.3); font-weight:800;">BUS (SHUTTLE)</span>
                    <div class="pulse-dot" id="bus-dot" style="width:6px; height:6px; background:#ffaa00;"></div>
                  </div>
                  <p id="transport-bus" style="font-size:1.4rem; font-weight:900; margin:10px 0 0 0; color:#fff; font-family:var(--font-logo);">12 MIN</p>
               </div>
               <div style="background:rgba(255,255,255,0.02); border-radius:12px; padding:15px; border:1px solid rgba(255,255,255,0.05); grid-column: span 2;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.6rem; color:rgba(255,255,255,0.4); font-weight:700;">RIDESHARE NETWORK</span>
                    <span id="uber-surge" style="font-size:0.6rem; color:#ff003c; font-weight:900; letter-spacing:1px;">SYNCING VALS</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px;">
                    <p style="font-size:0.8rem; margin:0; color:var(--text-muted);">Wait time: <span id="transport-uber" style="color:#fff; font-weight:900;">8 MIN</span></p>
                    <span id="uber-cars" style="color:var(--text-muted); font-size:0.6rem;">--- cars nearby</span>
                  </div>
               </div>
            </div>
          </div>

          <!-- WAVE METERS (KINETIC PHYSICS) -->
          <div class="promo-card" id="exit-waves-card" style="border-color:rgba(255,255,255,0.08); background:rgba(0,0,0,0.6);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
               <p style="color:rgba(255,255,255,0.3); text-transform:uppercase; font-size:0.6rem; margin:0; letter-spacing:2px;">Concourse Flow Cadence</p>
               <div style="display:flex; align-items:center; gap:10px;">
                  <span id="pressure-badge" style="background:#00ff66; color:#000; font-size:0.5rem; font-weight:900; padding:2px 6px; border-radius:4px;">OPTIMAL</span>
                  <span style="font-size:0.6rem; color:#fff; font-weight:900; letter-spacing:1px;">WAVE-RESET: <span id="exit-countdown">15.0</span></span>
               </div>
            </div>
            ${Object.entries(EXIT_TIER_DATA).map(([k, t], i) => `
              <div class="wave-row" data-tier="${k}" style="margin-top: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span style="font-size:0.9rem; font-weight:900; color:#fff; letter-spacing:1px; font-family:var(--font-logo);">${t.label.toUpperCase()}</span>
                  <span class="wave-count" style="font-size:0.7rem; color:var(--text-muted); font-weight:700;">${t.count} attendees</span>
                </div>
                <div style="background:rgba(255,255,255,0.03); height:12px; border-radius:6px; overflow:hidden; position:relative;">
                  <div class="wave-bar" style="width:${t.pct}%; background:${t.color}; height:100%; border-radius:6px; transition:width 2s ease;"></div>
                </div>
              </div>
            `).join('')}
            <button class="btn-primary" id="request-exit-pass" style="margin-top:2rem; height:50px; background:var(--accent); border-color:var(--accent); color:#000; font-weight:900; letter-spacing:1px;">GENERATE DEPARTURE TICKET</button>
          </div>
        </div>
      </div>

      <!-- EXIT HANDSHAKE OVERLAY -->
      <div id="exit-auth-overlay" class="animated hidden" style="position:fixed; inset:0; background:rgba(0,0,0,0.98); z-index:9500; display:flex; align-items:center; justify-content:center; padding:2rem; backdrop-filter:blur(25px);">
         <div class="promo-card" style="width:100%; max-width:320px; text-align:center; padding:2rem; border-color:#ff003c; background:#000; box-shadow:0 0 100px rgba(255,0,60,0.1);">
            <div id="exit-auth-stage">
               <div class="pulse-dot" style="background:#ff003c; margin:0 auto 10px auto;"></div>
               <p id="exit-ver-text" style="color:#ff003c; font-size:0.6rem; font-weight:900; letter-spacing:2px; text-transform:uppercase;">Calculating Route Safety</p>
               <div style="margin-top:20px; background:rgba(255,255,255,0.05); height:2px; border-radius:1px;"><div id="exit-auth-bar" style="width:0%; background:#ff003c; height:100%; transition:width 0.4s;"></div></div>
            </div>
            <div id="exit-ticket-view" class="hidden">
               <p style="color:#ff003c; font-size:0.7rem; font-weight:900; letter-spacing:5px; margin-bottom:2rem;">DEPARTURE SUCCESS</p>
               <div style="width:180px; height:220px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); margin:0 auto; border-radius:16px; padding:20px; display:flex; flex-direction:column; align-items:center;">
                  <div style="width:120px; height:120px; background:#fff; border-radius:8px; padding:8px;">
                    ${QRComponent.generateSVG('EXIT-' + Date.now())}
                  </div>
                  <div style="margin-top:20px; text-align:center;">
                     <p style="color:#fff; font-size:1.2rem; font-weight:900; margin:0;">GATE B-4</p>
                     <p style="color:var(--text-muted); font-size:0.5rem; letter-spacing:1px; margin-top:5px;">SEC-TOKEN: ${Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                  </div>
               </div>
               <p style="color:rgba(255,255,255,0.3); font-size:0.6rem; margin-top:2rem;">Following this, session identity will be DISSOLVED.</p>
               <button class="btn-primary" id="terminate-session-btn" style="margin-top:1.5rem; height:50px; background:rgba(255,0,60,0.1); border-color:#ff003c; color:#ff003c;">DISSOLVE SESSION & EXIT</button>
            </div>
         </div>
      </div>
    `;

    mountDashboardModule(content, 3, 'EXIT-INTELLIGENCE');
    ExitPage.bindIOSync();
    ExitPage.bindInteractions();
  },

  bindIOSync: () => {
    const syncHandler = (e) => {
      ExitPage.reactiveTick(e.detail);
    };
    window.addEventListener('flux-heartbeat', syncHandler);
    ExitPage.reactiveTick(FlowOrchestrator.getMetrics());

    // Local countdown logic
    let secondsLeft = 15.0;
    const cdInt = setInterval(() => {
       const cdEl = document.getElementById('exit-countdown');
       if (!cdEl) { clearInterval(cdInt); return; }
       secondsLeft = secondsLeft <= 0 ? 15.0 : secondsLeft - 0.1;
       cdEl.innerText = secondsLeft.toFixed(1);
    }, 100);

    const observer = new MutationObserver(() => {
      if (!document.getElementById('exit-container')) {
        window.removeEventListener('flux-heartbeat', syncHandler);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  reactiveTick: (metrics) => {
    const pulse = metrics.flowPulse;
    const session = state.stadiumMatrix.userSession;
    
    const syncEl = document.getElementById('exit-global-sync');
    if (syncEl) syncEl.innerText = `PHASE SYNC: ${metrics.syncIntegrity}%`;

    // Priority Logic (v3.0)
    const priorityGrade = document.getElementById('priority-grade');
    if (priorityGrade) {
       const hasCheckedIn = session.isCheckedIn;
       const rank = hasCheckedIn ? 'HIGH (PRE-VERIFIED)' : 'STANDARD (UNVERIFIED)';
       priorityGrade.innerText = rank;
       priorityGrade.style.color = hasCheckedIn ? '#00ff66' : '#ffaa00';
       document.getElementById('gate-sync-status').innerText = hasCheckedIn ? 'SECURE' : 'PENDING';
    }

    // Transit Sync
    const train = document.getElementById('transport-train');
    if (train) {
       train.innerText = `${Math.floor((100 - pulse) / 10) + 1} MIN`;
       document.getElementById('transport-bus').innerText = `${Math.floor(pulse / 8) + 4} MIN`;
       document.getElementById('transport-uber').innerText = `${Math.floor(pulse / 6) + 2} MIN`;
       document.getElementById('uber-surge').innerText = `${(1 + pulse/100).toFixed(1)}x SURGE ACTIVE`;
    }

    // Wave Physics
    document.querySelectorAll('.wave-row').forEach(row => {
       const tier = row.getAttribute('data-tier');
       const t = EXIT_TIER_DATA[tier];
       const bar = row.querySelector('.wave-bar');
       const offset = (pulse / 100) * 15;
       bar.style.width = Math.min(100, t.pct + offset) + '%';
    });
  },

  bindInteractions: () => {
    document.getElementById('request-exit-pass').addEventListener('click', () => {
       const overlay = document.getElementById('exit-auth-overlay');
       const stage = document.getElementById('exit-auth-stage');
       const view = document.getElementById('exit-ticket-view');
       const bar = document.getElementById('exit-auth-bar');
       const text = document.getElementById('exit-ver-text');

       overlay.classList.remove('hidden');
       stage.classList.remove('hidden');
       view.classList.add('hidden');
       
       setTimeout(() => { bar.style.width = '40%'; text.innerText = "Simulating Concourse Load"; }, 800);
       setTimeout(() => { bar.style.width = '90%'; text.innerText = "Syncing Departure Gate"; }, 1600);
       setTimeout(() => {
          stage.classList.add('hidden');
          view.classList.remove('hidden');
       }, 2200);
    });

    document.getElementById('terminate-session-btn').addEventListener('click', () => {
       // v3.0 MASTERPIECE: Dissolve Session Persistence
       StadiumMind.processAction('TERMINATE_SESSION');
       location.reload(); // Hard reset for session dissolution as requested
    });
  }
};

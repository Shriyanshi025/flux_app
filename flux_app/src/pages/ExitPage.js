import { state } from '../core/state.js';
import { EXIT_TIER_DATA } from '../core/constants.js';
import { authService } from '../services/authService.js';
import { uiUtils } from '../utils/uiUtils.js';

export const ExitPage = {
  render: (mountDashboardModule) => {
    if (!authService.isAuth()) return;

    const tier = EXIT_TIER_DATA.stroller; // Mock default

    const content = `
      <div id="exit-container" style="width:100%;">
        <!-- TOP STATUS RIBBON (Legacy RESTORE) -->
        <div class="market-ticker" id="exit-ticker" style="padding:0.75rem; display:flex; align-items:center; background:rgba(255,0,60,0.1); border-bottom:1px solid #ff003c;">
          <div class="pulse-dot" style="background:#ff003c; margin-right:12px;"></div>
          <div style="flex:1; color: #fff; font-weight:900; font-size:0.75rem; letter-spacing:2px; font-family:var(--font-logo);">EXIT PROTOCOL ALPHA ACTIVE</div>
        </div>
        
        <div class="main-feed" style="gap:1.2rem; padding-bottom:150px;">
          
          <!-- SMART DEPARTURE GATE STATUS -->
          <div class="promo-card animated" style="border-color:#00ff66; padding:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
               <p style="color:rgba(255,255,255,0.3); font-size:0.6rem; text-transform:uppercase; letter-spacing:2px; margin:0;">Target Departure Gate</p>
               <span id="gate-sync-status" style="font-size:0.6rem; color:#00ff66; font-weight:900;">SYNCED</span>
            </div>
            <h2 id="gate-id" style="color:#fff; font-size:2.4rem; font-weight:900; margin:0; font-family:var(--font-logo);">GATE B-4</h2>
            <p style="color:var(--text-muted); font-size:0.85rem; margin-top:8px;">Estimated walk time: <b>6 MIN</b></p>
            <div class="divider" style="height:1px; background:rgba(255,255,255,0.05); margin:15px 0;"></div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
               <p style="color:rgba(255,255,255,0.3); font-size:0.55rem; margin:0;">ROUTE INTEGRITY</p>
               <p id="route-integrity-val" style="color:#00ff66; font-size:0.7rem; font-weight:900; margin:0;">98.2%</p>
            </div>
            <div style="background:rgba(255,255,255,0.05); height:4px; border-radius:2px; margin-top:8px;"><div id="route-integrity-bar" style="width:98%; background:#00ff66; height:100%; border-radius:2px;"></div></div>
          </div>

          <!-- TRANSPORT SYNC DASHBOARD (RESTORED DEPTH) -->
          <div class="promo-card" id="transport-card" style="border-color:rgba(255,255,255,0.1); padding:1.2rem;">
            <p style="color:var(--text-muted); font-size:0.6rem; text-transform:uppercase; letter-spacing:2px; margin-bottom:1.2rem;">Live Transit Telemetry</p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
               <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:12px; border:1px solid rgba(255,255,255,0.05);">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.55rem; color:rgba(255,255,255,0.3); font-weight:800;">TRAIN A-LINE</span>
                    <div class="pulse-dot" style="width:6px; height:6px; background:#00ff66;"></div>
                  </div>
                  <p id="transport-train" style="font-size:1.4rem; font-weight:900; margin:10px 0 0 0; color:#fff; font-family:var(--font-logo);">4 MIN</p>
               </div>
               <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:12px; border:1px solid rgba(255,255,255,0.05);">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.55rem; color:rgba(255,255,255,0.3); font-weight:800;">BUS (SHUTTLE)</span>
                    <div class="pulse-dot" style="width:6px; height:6px; background:#ffaa00;"></div>
                  </div>
                  <p id="transport-bus" style="font-size:1.4rem; font-weight:900; margin:10px 0 0 0; color:#fff; font-family:var(--font-logo);">12 MIN</p>
               </div>
               <div style="background:rgba(255,255,255,0.02); border-radius:12px; padding:15px; border:1px solid rgba(255,255,255,0.05); grid-column: span 2;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.6rem; color:rgba(255,255,255,0.4); font-weight:700;">RIDESHARE NETWORK</span>
                    <span id="uber-surge" style="font-size:0.6rem; color:#ff003c; font-weight:900; letter-spacing:1px;">2.4x SURGE active</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px;">
                    <p style="font-size:0.8rem; margin:0; color:var(--text-muted);">Wait time: <span id="transport-uber" style="color:#fff; font-weight:900;">8 MIN</span></p>
                    <span style="color:var(--text-muted); font-size:0.6rem;">${(Math.random()*15 + 10).toFixed(0)} cars nearby</span>
                  </div>
               </div>
            </div>
          </div>

          <!-- WAVE METERS (KINETIC WAVE PRESSURE RESTORE) -->
          <div class="promo-card" style="border-color:rgba(255,255,255,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
               <p style="color:rgba(255,255,255,0.3); text-transform:uppercase; font-size:0.6rem; margin:0; letter-spacing:2px;">Concourse Flow Cadence</p>
               <span style="font-size:0.6rem; color:#00ff66; font-weight:900; letter-spacing:1px;">NEXT WAVE: <span id="exit-countdown">15:00</span></span>
            </div>
            ${Object.entries(EXIT_TIER_DATA).map(([k, t], i) => `
              <div style="margin-top: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span style="font-size:0.9rem; font-weight:900; color:#fff; letter-spacing:1px; font-family:var(--font-logo);">${t.label.toUpperCase()}</span>
                  <span style="font-size:0.7rem; color:var(--text-muted); font-weight:700;">${t.count} attendees</span>
                </div>
                <div style="background:rgba(255,255,255,0.03); height:8px; border-radius:4px; overflow:hidden; position:relative;">
                  <div class="wave-pulse" style="width:${t.pct}%; background:${t.color}; height:100%; border-radius:4px; transition:width 2s ease;"></div>
                  ${i === 0 ? '<div class="wave-flow-line"></div>' : ''}
                </div>
              </div>
            `).join('')}
            <p style="text-align:center; color:rgba(255,255,255,0.2); font-size:0.55rem; margin-top:20px; letter-spacing:4px;">WAVE PRESSURE MONITOR ACTIVE</p>
          </div>
        </div>
      </div>
    `;

    mountDashboardModule(content, 3, 'EXIT-INTELLIGENCE');
    ExitPage.initDeepSimulation();
  },

  initDeepSimulation: () => {
    if (state.exitInterval) clearInterval(state.exitInterval);
    
    let secondsLeft = 900;
    state.exitInterval = setInterval(() => {
      // 1. Tick Countdown
      secondsLeft--;
      const min = Math.floor(secondsLeft / 60);
      const sec = secondsLeft % 60;
      const cdEl = document.getElementById('exit-countdown');
      if (cdEl) cdEl.innerText = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      
      // 2. Transport & Integrity simulation (LOST OBJECTS RESTORE)
      if (Math.random() > 0.7) {
        const train = document.getElementById('transport-train');
        const bus = document.getElementById('transport-bus');
        const uber = document.getElementById('transport-uber');
        const surge = document.getElementById('uber-surge');
        const integrityVal = document.getElementById('route-integrity-val');
        const integrityBar = document.getElementById('route-integrity-bar');
        
        if (train) train.innerText = `${Math.floor(Math.random() * 8 + 1)} MIN`;
        if (bus) bus.innerText = `${Math.floor(Math.random() * 15 + 5)} MIN`;
        if (uber) uber.innerText = `${Math.floor(Math.random() * 20 + 2)} MIN`;
        if (surge) surge.innerText = `${(Math.random() * 2 + 1).toFixed(1)}x SURGE ACTIVE`;
        
        if (integrityVal && integrityBar) {
           const val = (95 + Math.random() * 4.9).toFixed(1);
           integrityVal.innerText = `${val}%`;
           integrityBar.style.width = `${val}%`;
        }
      }
    }, 2000);
  }
};

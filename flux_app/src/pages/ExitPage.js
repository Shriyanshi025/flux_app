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
        <!-- SMARTS: TOP URGENCY RIBBON -->
        <div class="market-ticker" id="exit-ticker" style="padding:0.75rem; display:flex; align-items:center; background:rgba(255,0,60,0.1); border-bottom:1px solid #ff003c;">
          <div class="pulse-dot" style="background:#ff003c; margin-right:12px;"></div>
          <div style="flex:1; color: #fff; font-weight:700; font-size:0.8rem; letter-spacing:1px;">NEXT RELEASE WAVE: <span id="exit-countdown">15:00</span></div>
        </div>
        
        <div class="main-feed" style="gap:1.2rem; padding-bottom:150px;">
          
          <!-- SMART RECOMMENDATION CARD -->
          <div class="promo-card animated" style="border-color:#00e5ff; background:linear-gradient(135deg, rgba(0,229,255,0.1) 0%, transparent 100%);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
               <h3 style="color:#00e5ff; margin:0; font-size:0.8rem;">SMART ORCHESTRATION</h3>
               <span style="font-size:0.6rem; color:rgba(0,229,255,0.5);">v1.5 ENGINE</span>
            </div>
            <p style="color:#fff; font-size:1.1rem; font-weight:900; margin:0;">OPTIMAL DEPARTURE WINDOW: <span id="smart-window-time">22:45</span></p>
            <p style="color:var(--text-muted); font-size:0.8rem; margin-top:8px;">Based on your sector load and current wave cadence, we recommend standing by in 12 minutes.</p>
            <div style="margin-top:15px; display:flex; gap:10px;">
               <div style="flex:1; background:rgba(255,255,255,0.05); border-radius:8px; padding:10px; text-align:center;">
                  <p style="color:rgba(255,255,255,0.3); font-size:0.55rem; margin:0;">STAY & SAVE</p>
                  <p style="color:#00ff66; font-size:0.9rem; font-weight:900; margin:4px 0;">+15% PTS</p>
               </div>
               <div style="flex:1; background:rgba(255,255,255,0.05); border-radius:8px; padding:10px; text-align:center;">
                  <p style="color:rgba(255,255,255,0.3); font-size:0.55rem; margin:0;">EXPRESS EXIT</p>
                  <p style="color:#ffaa00; font-size:0.9rem; font-weight:900; margin:4px 0;">-22 MIN</p>
               </div>
            </div>
          </div>

          <!-- TRANSPORT SYNC DASHBOARD -->
          <div class="promo-card" style="border-color:rgba(255,255,255,0.1); padding:1.2rem;">
            <p style="color:var(--text-muted); font-size:0.6rem; text-transform:uppercase; letter-spacing:2px; margin-bottom:1rem;">Live Transport Sync</p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
               <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:12px; border:1px solid rgba(255,255,255,0.02);">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.65rem; color:rgba(255,255,255,0.4);">TRAIN (LINE A)</span>
                    <div class="pulse-dot" style="width:6px; height:6px; background:#00ff66;"></div>
                  </div>
                  <p id="transport-train" style="font-size:1.1rem; font-weight:900; margin:8px 0 0 0;">4 MIN</p>
               </div>
               <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:12px; border:1px solid rgba(255,255,255,0.02);">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.65rem; color:rgba(255,255,255,0.4);">SHUTTLE BUS</span>
                    <div class="pulse-dot" style="width:6px; height:6px; background:#ffaa00;"></div>
                  </div>
                  <p id="transport-bus" style="font-size:1.1rem; font-weight:900; margin:8px 0 0 0;">12 MIN</p>
               </div>
               <div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:12px; border:1px solid rgba(255,255,255,0.02); grid-column: span 2;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.65rem; color:rgba(255,255,255,0.4);">RIDESHARE (UBER/LYFT)</span>
                    <span id="uber-surge" style="font-size:0.65rem; color:#ff003c; font-weight:900;">2.4x SURGE</span>
                  </div>
                  <p style="font-size:0.8rem; margin:8px 0 0 0; color:var(--text-muted);">Wait time: <span id="transport-uber" style="color:#fff; font-weight:700;">8 MIN</span></p>
               </div>
            </div>
          </div>

          <!-- WAVE METERS 2.0 (KINETIC) -->
          <div class="promo-card" style="border-color:rgba(255,255,255,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
               <p style="color:var(--text-muted); text-transform:uppercase; font-size:0.65rem; margin:0;">Live Release Cadence</p>
               <span style="font-size:0.6rem; color:#00ff66;">CONCOURSE FLOW: OPTIMAL</span>
            </div>
            ${Object.entries(EXIT_TIER_DATA).map(([k, t], i) => `
              <div style="margin-top: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-size:0.85rem; font-weight:700; color:#fff;">${t.label}</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">${t.count} ATND</span>
                </div>
                <div style="background:rgba(255,255,255,0.03); height:8px; border-radius:4px; overflow:hidden; position:relative;">
                  <div class="wave-pulse" style="width:${t.pct}%; background:${t.color}; height:100%; border-radius:4px;"></div>
                  ${i === 0 ? '<div class="wave-flow-line"></div>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    mountDashboardModule(content, 3, 'EXIT-ORCHESTRATION');
    ExitPage.initSimulation();
  },

  initSimulation: () => {
    if (state.exitInterval) clearInterval(state.exitInterval);
    
    let secondsLeft = 900;
    state.exitInterval = setInterval(() => {
      // 1. Tick Countdown
      secondsLeft--;
      const min = Math.floor(secondsLeft / 60);
      const sec = secondsLeft % 60;
      const cdEl = document.getElementById('exit-countdown');
      if (cdEl) cdEl.innerText = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      
      // 2. Transport Intel Simulation
      if (Math.random() > 0.7) {
        const train = document.getElementById('transport-train');
        const bus = document.getElementById('transport-bus');
        const uber = document.getElementById('transport-uber');
        const surge = document.getElementById('uber-surge');
        
        if (train) train.innerText = `${Math.floor(Math.random() * 8 + 1)} MIN`;
        if (bus) bus.innerText = `${Math.floor(Math.random() * 15 + 5)} MIN`;
        if (uber) uber.innerText = `${Math.floor(Math.random() * 20 + 2)} MIN`;
        if (surge) surge.innerText = `${(Math.random() * 2 + 1).toFixed(1)}x SURGE`;
      }
    }, 2000);
  }
};

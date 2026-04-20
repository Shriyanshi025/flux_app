import { state } from '../core/state.js';
import { EXIT_TIER_DATA } from '../core/constants.js';
import { authService } from '../services/authService.js';
import { uiUtils } from '../utils/uiUtils.js';

export const ExitPage = {
  render: (mountDashboardModule) => {
    if (!authService.isAuth()) return;

    const tier = EXIT_TIER_DATA.stroller; // Mock default tier

    const content = `
      <div id="exit-container" style="width:100%;">
        <div class="market-ticker" id="exit-ticker" style="padding:0.75rem; display:flex; align-items:center;">
          <span style="background:#ff003c; color:#fff; padding:2px 10px; border-radius:20px; font-weight:700;">RELEASE ACTIVE</span>
          <div style="flex:1; margin-left: 10px; color: var(--text-muted);">Next wave in: <span id="exit-countdown">15:00</span></div>
        </div>
        
        <div class="main-feed" style="gap:1.2rem;">
          <div class="promo-card" style="border-color:${tier.color}; background:${tier.color}18;">
            <p style="color:var(--text-muted); font-size:0.7rem; text-transform:uppercase; margin-bottom:5px;">Assigned Status</p>
            <h2 style="color:#fff; margin:0; font-size:1.8rem; font-weight:900;">${tier.label.toUpperCase()}</h2>
            <p style="color:var(--text-muted); margin-top:5px; font-size:0.9rem;">${tier.desc}</p>
            <div style="background:${tier.color}; color:#000; padding:6px 16px; border-radius:20px; font-weight:900; margin-top: 15px; display: inline-block; font-size:0.8rem;">${tier.action}</div>
          </div>

          <!-- SMART SIMULATION: SURGE FORECAST -->
          <div class="promo-card" style="border-color:rgba(255,255,255,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
               <p style="color:var(--text-muted); text-transform:uppercase; font-size:0.65rem; margin:0;">Wait Time Forecast</p>
               <span style="color:#00ff66; font-size:0.7rem;">-12% Savings</span>
            </div>
            <div id="surge-graph" style="height:80px; margin-top:1.5rem; display:flex; align-items:flex-end; gap:4px;">
               ${[40, 60, 90, 80, 50, 30, 20, 15].map((h, i) => `
                 <div style="flex:1; height:${h}%; background:${i === 6 ? '#00ff66' : 'rgba(255,255,255,0.1)'}; border-radius:2px; position:relative;">
                   ${i === 6 ? '<div style="position:absolute; top:-20px; left:50%; transform:translateX(-50%); font-size:0.6rem; color:#00ff66;">YOU</div>' : ''}
                 </div>
               `).join('')}
            </div>
            <p style="text-align:center; color:rgba(255,255,255,0.3); font-size:0.6rem; margin-top:10px; letter-spacing:1px;">CONCOURSE LOAD (ESTIMATED)</p>
          </div>

          <!-- DYNAMIC STATS -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.2rem;">
            <div class="promo-card" style="padding:1.2rem; text-align:center;">
              <span style="color:rgba(255,255,255,0.3); font-size:0.6rem; text-transform:uppercase;">Station Sync</span>
              <p id="exit-stat-sync" style="color:#00ff66; font-size:1.2rem; font-weight:900; margin:5px 0;">99.8%</p>
            </div>
             <div class="promo-card" style="padding:1.2rem; text-align:center;">
              <span style="color:rgba(255,255,255,0.3); font-size:0.6rem; text-transform:uppercase;">Exit Integrity</span>
              <p id="exit-stat-load" style="color:#fff; font-size:1.2rem; font-weight:900; margin:5px 0;">OPTIMAL</p>
            </div>
          </div>

          <div class="promo-card" style="border-color:rgba(255,255,255,0.08); padding-bottom:120px;">
            <p style="color:var(--text-muted); text-transform:uppercase; font-size:0.65rem;">Live Crowd Wave Meter</p>
            ${Object.entries(EXIT_TIER_DATA).map(([k, t]) => `
              <div style="margin-top: 12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-size:0.8rem; font-weight:600;">${t.label}</span>
                  <span style="font-size:0.7rem; color:var(--text-muted);">${t.count} attendees</span>
                </div>
                <div style="background:rgba(255,255,255,0.06); height:4px; border-radius:2px;"><div style="width:${t.pct}%; background:${t.color}; height:100%; border-radius:2px;"></div></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    mountDashboardModule(content, 3, 'EXIT');
    ExitPage.initSimulation();
  },

  initSimulation: () => {
    if (state.exitInterval) clearInterval(state.exitInterval);
    
    let secondsLeft = 900; // 15:00
    state.exitInterval = setInterval(() => {
      // 1. Tick Countdown
      secondsLeft--;
      const min = Math.floor(secondsLeft / 60);
      const sec = secondsLeft % 60;
      const cdEl = document.getElementById('exit-countdown');
      if (cdEl) cdEl.innerText = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      
      // 2. Randomize Stats for 'Smart' Feel
      const syncEl = document.getElementById('exit-stat-sync');
      const loadEl = document.getElementById('exit-stat-load');
      if (syncEl) syncEl.innerText = (99 + Math.random()).toFixed(2) + '%';
      if (loadEl) {
        const loads = ['OPTIMAL', 'NOMINAL', 'DENSE', 'OPTIMAL'];
        loadEl.innerText = loads[Math.floor(Math.random() * loads.length)];
        loadEl.style.color = loadEl.innerText === 'DENSE' ? '#ffaa00' : '#fff';
      }
    }, 2000);
  }
};

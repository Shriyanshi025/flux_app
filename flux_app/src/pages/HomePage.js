import { authService } from '../services/authService.js';
import { state } from '../core/state.js';
import { StadiumMind } from '../services/StadiumMind.js';
import { FlowOrchestrator } from '../services/FlowOrchestrator.js';

/**
 * HOME PAGE - THE SOVEREIGN CORE (v4.0 PHOENIX)
 * Centered Intelligence Sphere with Broadcast Event Ticker.
 */

export const HomePage = {
  render: (mountDashboardModule, renderEntry, renderMarket, renderExit) => {
    const user = JSON.parse(localStorage.getItem('flux_user') || '{}');
    const username = (user.name || 'GUEST').split(' ')[0].toUpperCase();
    const session = state.stadiumMatrix.userSession;
    
    // THE CINEMATIC CONTENT
    const content = `
      <div id="home-container" class="animated">
        <!-- SOVEREIGN BROADCAST TICKER -->
        <div class="broadcast-ticker animated" id="home-broadcast-ticker">
           BOOTING SOVEREIGN CORE PROTOCOL // SESSION ACTIVE
        </div>

        <div style="padding: 0 var(--screen-pad); margin-top:15px;">
           <!-- TOP HUD: TELEMETRY -->
           <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
              <div>
                 <span style="color:var(--text-dim); font-size:0.5rem; letter-spacing:3px; text-transform:uppercase;">Command Center</span>
                 <h1 style="color:#fff; font-size:1.6rem; letter-spacing:-1px;">HELLO, ${username}</h1>
              </div>
              <div style="text-align:right;">
                 <span style="color:var(--text-dim); font-size:0.5rem; letter-spacing:3px; text-transform:uppercase;">Credits</span>
                 <h2 id="home-wallet" style="color:var(--accent); font-size:1.6rem; letter-spacing:-1px;">$${session.walletBalance}</h2>
              </div>
           </div>

           <!-- SOVEREIGN DATA SPHERE (HEATMAP) -->
           <div class="promo-card" style="padding:2rem; background:rgba(255,255,255,0.01); border-color:rgba(255,255,255,0.05); margin-bottom:2rem; perspective:1000px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                 <span style="color:#fff; font-size:0.7rem; font-weight:900; letter-spacing:2px;">STADIUM THERMAL MATRIX</span>
                 <div style="display:flex; align-items:center; gap:8px; font-size:0.5rem; color:var(--accent); font-weight:900;">
                    <button id="provoke-event-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--accent); font-size:0.45rem; padding:2px 6px; border-radius:4px; cursor:pointer;">PROVOKE SYNC</button>
                    <div class="pulse-dot" style="background:var(--accent);"></div> CORE SYNCED
                 </div>
              </div>
              <div id="home-heatmap-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; transform: rotateX(15deg);">
                 ${state.stadiumMatrix.sectors.map(s => `
                   <div class="heatmap-sector" data-sector="${s.id}" style="height:100px;">
                      <div class="sector-fill" style="position:absolute; bottom:0; left:0; right:0; height:0%; background:var(--accent); opacity:0.12; transition:height 1.2s cubic-bezier(0.19, 1, 0.22, 1);"></div>
                      <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                         <span style="font-size:0.5rem; color:rgba(255,255,255,0.1); font-weight:900;">S${s.id}</span>
                         <span class="sector-load" style="font-size:0.75rem; color:rgba(255,255,255,0.5); font-family:monospace; margin-top:2px;">--%</span>
                      </div>
                   </div>
                 `).join('')}
              </div>
           </div>

           <!-- COMMAND LOG: EXECUTIVE DIRECTIVES -->
           <div id="command-feed-container" class="promo-card" style="padding:1.5rem; border-color:var(--accent-alt); background:rgba(255,0,122,0.02); margin-bottom:1.5rem; min-height:100px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                 <span style="color:var(--accent-alt); font-size:0.5rem; font-weight:900; letter-spacing:3px; text-transform:uppercase;">Intelligence Stream</span>
                 <span id="intel-algorithm" style="font-size:0.4rem; color:rgba(255,255,255,0.2); font-family:monospace;">STADIUM_MIND_v4.0</span>
              </div>
              <div id="home-directives-list" style="margin-top:12px; display:flex; flex-direction:column; gap:8px;">
                 <div style="font-size:0.55rem; color:rgba(255,255,255,0.3); font-family:monospace;">[SYS] BOOTING HEAVY LOGIC ENGINE... [OK]</div>
                 ${state.stadiumMatrix.directives.map(d => `
                   <div class="directive-item" style="font-size:0.65rem; color:rgba(255,255,255,0.7); font-family:monospace; border-left:2px solid var(--accent-alt); padding-left:12px;">
                      <span style="color:var(--accent-alt);">>>></span> ${d.text}
                   </div>
                 `).join('')}
              </div>
           </div>

           <!-- TELEMETRY FEED (The Heavy Logic Trace) -->
           <div id="telemetry-trace" style="margin-bottom:2rem; padding: 0 10px; font-family:monospace; font-size:0.5rem; color:rgba(57, 255, 20, 0.3); height:20px; overflow:hidden;">
              <span id="trace-line">CALCULATING SECTOR THERMALS... [SYNC: 99.8%] [LOAD: NOMINAL]</span>
           </div>

           <!-- NAVIGATION ACTIONS (The Cards) -->
           <div id="home-actions" style="display:grid; grid-template-columns:1fr; gap:1.2rem; padding-bottom:120px;">
              <div class="promo-card animated" id="open-entry-btn" style="padding:1.5rem; --card-theme:#00ff66;">
                 <h3 style="font-size:0.9rem; margin:0;">VERIFY ENTRY PROTOCOL</h3>
              </div>
              <div class="promo-card animated" id="open-market-btn" style="padding:1.5rem; --card-theme:#00e5ff;">
                 <h3 style="font-size:0.9rem; margin:0;">ACCESS MARKET ECONOMY</h3>
              </div>
              <div class="promo-card animated" id="open-exit-btn" style="padding:1.5rem; --card-theme:#ff007a;">
                 <h3 style="font-size:0.9rem; margin:0;">INITIALIZE DEPARTURE</h3>
              </div>
           </div>
        </div>
      </div>
    `;

    mountDashboardModule(content, 0, 'FLUX-SOVEREIGN');
    HomePage.bindEvents(renderEntry, renderMarket, renderExit);
    HomePage.initInteractions();
  },

  bindEvents: (renderEntry, renderMarket, renderExit) => {
    document.getElementById('open-entry-btn')?.addEventListener('click', renderEntry);
    document.getElementById('open-market-btn')?.addEventListener('click', renderMarket);
    document.getElementById('open-exit-btn')?.addEventListener('click', renderExit);
    document.getElementById('provoke-event-btn')?.addEventListener('click', () => {
       StadiumMind.triggerMajorEvent();
       HomePage.updateUI();
    });
  },

  initInteractions: () => {
    StadiumMind.init();
    const syncHandler = (e) => { HomePage.updateUI(); };
    window.addEventListener('flux-heartbeat', syncHandler);
    HomePage.updateUI();

    // CINEMATIC MOUSE TRACKING for the Mesh Background
    document.addEventListener('mousemove', (e) => {
       const x = (e.clientX / window.innerWidth) * 100;
       const y = (e.clientY / window.innerHeight) * 100;
       document.documentElement.style.setProperty('--mouse-x', `${x}%`);
       document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    });

    const observer = new MutationObserver(() => {
      if (!document.getElementById('home-container')) {
        window.removeEventListener('flux-heartbeat', syncHandler);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  updateUI: () => {
    const trace = document.getElementById('trace-line');

    if (wallet) wallet.innerText = `$${matrix.userSession.walletBalance}`;
    
    if (trace) {
       const ms = Date.now().toString().slice(-3);
       trace.innerText = `CALCULATING SECTOR THERMALS... [SYNC: 99.${ms[0]}%] [LOAD: ${matrix.sectors[0].status}] [ALGO: VECTOR_V4]`;
    }

    if (ticker && matrix.directives[0]) {
       ticker.innerText = matrix.directives[0].text.toUpperCase();
    }

    if (feed) {
       feed.innerHTML = matrix.directives.slice(0, 3).map(d => `
          <div class="directive-item animated" style="font-size:0.65rem; color:rgba(255,255,255,0.7); font-family:monospace; border-left:2px solid var(--accent-alt); padding-left:12px;">
             <span style="color:var(--accent-alt);">>>></span> ${d.text}
          </div>
       `).join('');
    }

    if (grid) {
       matrix.sectors.forEach(s => {
          const secEl = grid.querySelector(`[data-sector="${s.id}"]`);
          if (secEl) {
             const fill = secEl.querySelector('.sector-fill');
             const loadStr = secEl.querySelector('.sector-load');
             const pct = (s.occupancy / s.capacity) * 100;
             fill.style.height = pct + '%';
             loadStr.innerText = Math.round(pct) + '%';
             
             const color = s.status === 'CRITICAL' ? 'var(--accent-alt)' : s.status === 'DENSE' ? 'var(--accent-gold)' : 'var(--accent)';
             fill.style.background = color;
             secEl.style.borderColor = s.status === 'CRITICAL' ? 'rgba(255,0,122,0.3)' : 'rgba(255,255,255,0.05)';
          }
       });
    }
  }
};

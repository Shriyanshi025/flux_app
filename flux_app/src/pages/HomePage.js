import { authService } from '../services/authService.js';
import { state } from '../core/state.js';
import { StadiumMind } from '../services/StadiumMind.js';
import { FlowOrchestrator } from '../services/FlowOrchestrator.js';

/**
 * HOME PAGE - EXECUTIVE CONTROL TOWER (v3.0 IOS)
 * High-fidelity command center featuring live heatmaps and autonomous directives.
 */

export const HomePage = {
  render: (mountDashboardModule, renderEntry, renderMarket, renderExit) => {
    const user = JSON.parse(localStorage.getItem('flux_user') || '{}');
    const username = (user.name || 'GUEST').split(' ')[0].toUpperCase();
    const session = state.stadiumMatrix.userSession;
    
    const content = `
      <div id="home-container" class="animated">
        <!-- TOP HUD: TELEMETRY BAR -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; background:rgba(255,255,255,0.03); border-radius:16px; margin-bottom:20px; border:1px solid rgba(255,255,255,0.05);">
           <div>
              <p style="color:rgba(255,255,255,0.3); font-size:0.5rem; text-transform:uppercase; letter-spacing:2px; margin:0;">Session Auth</p>
              <h2 style="color:#fff; font-size:1.1rem; margin:2px 0 0 0; font-family:var(--font-logo);">${username}</h2>
           </div>
           <div style="text-align:right;">
              <p style="color:rgba(255,255,255,0.3); font-size:0.5rem; text-transform:uppercase; letter-spacing:2px; margin:0;">Flux Balance</p>
              <h2 id="home-wallet" style="color:var(--accent); font-size:1.1rem; margin:2px 0 0 0; font-family:var(--font-logo);">$${session.walletBalance}</h2>
           </div>
        </div>

        <!-- SECTOR HEATMAP GRID -->
        <div class="promo-card" style="padding:1.5rem; border-color:rgba(255,255,255,0.1); background:rgba(0,0,0,0.4); margin-bottom:20px;">
           <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
              <p style="color:#fff; font-size:0.75rem; font-weight:900; letter-spacing:1px; margin:0;">REGIONAL FLOW MATRIX</p>
              <div style="font-size:0.5rem; color:var(--accent); text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:5px;">
                 <div class="status-dot active"></div> LIVE FEED
              </div>
           </div>
           <div id="home-heatmap-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; height:120px;">
              ${state.stadiumMatrix.sectors.map(s => `
                <div class="heatmap-sector" data-sector="${s.id}" style="background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.05); position:relative; overflow:hidden; transition:0.4s;">
                   <div class="sector-fill" style="position:absolute; bottom:0; left:0; right:0; height:0%; background:var(--accent); opacity:0.1; transition:height 1s ease;"></div>
                   <span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:0.6rem; color:rgba(255,255,255,0.2); font-weight:900;">S${s.id}</span>
                </div>
              `).join('')}
           </div>
        </div>

        <!-- COMMAND FEED: AUTONOMOUS DIRECTIVES -->
        <div id="command-feed-container" class="promo-card" style="border-color:#ff003c; background:rgba(255,0,60,0.02); padding:1rem; margin-bottom:25px; height:100px; overflow:hidden; position:relative;">
           <div style="position:absolute; top:8px; left:12px; color:#ff003c; font-size:0.5rem; font-weight:900; letter-spacing:2px; text-transform:uppercase;">Command Log</div>
           <div id="home-directives-list" style="margin-top:20px; display:flex; flex-direction:column; gap:8px;">
              ${state.stadiumMatrix.directives.map(d => `
                <p style="margin:0; font-size:0.65rem; color:rgba(255,255,255,0.6); font-family:monospace; line-height:1.2;">
                   <span style="color:#ff003c;">></span> ${d.text}
                </p>
              `).join('')}
           </div>
        </div>

        <!-- NAVIGATION ACTIONS -->
        <div class="main-feed" id="home-feed" style="gap:1rem; padding-bottom:120px;">
          <div class="stand-card promo-card card-arrival" style="min-height:auto; padding:1.2rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
               <h3 style="margin:0; font-size:1rem; font-family:var(--font-logo);">ENTRY PROTOCOL</h3>
               <span style="font-size:0.5rem; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">${session.isCheckedIn ? 'ACTIVE' : 'LOCKED'}</span>
            </div>
            <p style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-bottom:15px;">Hardware-mimicking verify/check-in simulation.</p>
            <button class="btn-primary" id="open-entry-btn" style="height:45px; font-size:0.8rem;">LAUNCH ENTRY CHANNEL</button>
          </div>

          <div class="stand-card promo-card card-halftime" style="min-height:auto; padding:1.2rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
               <h3 style="margin:0; font-size:1rem; font-family:var(--font-logo);">FLASH MARKET</h3>
               <span style="font-size:0.5rem; background:rgba(0,255,102,0.1); color:#00ff66; padding:2px 6px; border-radius:4px;">DYN-PRICING: ON</span>
            </div>
            <p style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-bottom:15px;">Dynamic pricing based on real-time sector density.</p>
            <button class="btn-primary" id="open-market-btn" style="height:45px; font-size:0.8rem;">ACCESS MARKET Economy</button>
          </div>

          <div class="stand-card promo-card card-departure" style="min-height:auto; padding:1.2rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
               <h3 style="margin:0; font-size:1rem; font-family:var(--font-logo);">EXIT INTELLIGENCE</h3>
               <span style="font-size:0.5rem; background:rgba(255,0,60,0.1); color:#ff003c; padding:2px 6px; border-radius:4px;">WAVE CAP: 15%</span>
            </div>
            <p style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-bottom:15px;">Priority wave dispersal and transit synchronization.</p>
            <button class="btn-primary" id="open-exit-btn" style="height:45px; font-size:0.8rem;">INITIALIZE DEPARTURE</button>
          </div>
        </div>
      </div>
    `;

    mountDashboardModule(content, 0, 'FLUX-COMMAND');
    HomePage.bindEvents(renderEntry, renderMarket, renderExit);
    HomePage.initSync();
  },

  bindEvents: (renderEntry, renderMarket, renderExit) => {
    document.getElementById('open-entry-btn')?.addEventListener('click', renderEntry);
    document.getElementById('open-market-btn')?.addEventListener('click', renderMarket);
    document.getElementById('open-exit-btn')?.addEventListener('click', renderExit);
  },

  initSync: () => {
    // 1. Initialize StadiumMind (singleton-ish)
    StadiumMind.init();

    const syncHandler = (e) => {
       HomePage.updateUI();
    };

    window.addEventListener('flux-heartbeat', syncHandler);
    HomePage.updateUI();

    // Cleanup
    const observer = new MutationObserver(() => {
      if (!document.getElementById('home-container')) {
        window.removeEventListener('flux-heartbeat', syncHandler);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  updateUI: () => {
    const matrix = state.stadiumMatrix;
    const feed = document.getElementById('home-directives-list');
    const wallet = document.getElementById('home-wallet');
    const grid = document.getElementById('home-heatmap-grid');

    if (wallet) wallet.innerText = `$${matrix.userSession.walletBalance}`;

    if (feed) {
       feed.innerHTML = matrix.directives.map(d => `
          <p class="directive-item animated" style="margin:0; font-size:0.65rem; color:rgba(255,255,255,0.6); font-family:monospace; line-height:1.2; border-left:2px solid ${d.level === 'warning' ? '#ff003c' : '#00e5ff'}; padding-left:8px;">
             <span style="color:${d.level === 'warning' ? '#ff003c' : '#00e5ff'};">${d.level === 'warning' ? '!' : '>'}</span> ${d.text}
          </p>
       `).join('');
    }

    if (grid) {
       matrix.sectors.forEach(s => {
          const secEl = grid.querySelector(`[data-sector="${s.id}"]`);
          if (secEl) {
             const fill = secEl.querySelector('.sector-fill');
             const pct = (s.occupancy / s.capacity) * 100;
             fill.style.height = pct + '%';
             fill.style.background = s.status === 'CRITICAL' ? '#ff003c' : s.status === 'DENSE' ? '#ffaa00' : 'var(--accent)';
             secEl.style.borderColor = s.status === 'CRITICAL' ? 'rgba(255,0,60,0.3)' : 'rgba(255,255,255,0.05)';
          }
       });
    }
  }
};

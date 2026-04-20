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
        <div class="market-ticker" id="exit-ticker" style="padding:0.75rem; display:flex; align-items:center;">
          <span style="background:#ff003c; color:#fff; padding:2px 10px; border-radius:20px; font-weight:700;">RELEASE ACTIVE</span>
          <div style="flex:1; margin-left: 10px; color: var(--text-muted);">Next wave in: <span id="exit-countdown">15:00</span></div>
        </div>
        <div class="main-feed" style="gap:1.2rem;">
          <div class="promo-card" style="border-color:${tier.color}; background:${tier.color}18;">
            <h2 style="color:#fff; margin:0;">${tier.label.toUpperCase()}</h2>
            <p style="color:var(--text-muted);">${tier.desc}</p>
            <div style="background:${tier.color}; color:#000; padding:4px 12px; border-radius:20px; font-weight:900; margin-top: 10px; display: inline-block;">${tier.action}</div>
          </div>
          <div class="promo-card" style="border-color:rgba(255,255,255,0.08);">
            <p style="color:var(--text-muted); text-transform:uppercase; font-size:0.65rem;">Live Crowd Wave Meter</p>
            ${Object.entries(EXIT_TIER_DATA).map(([k, t]) => `
              <div style="margin-top: 8px;">
                <p style="font-size:0.8rem; margin:0;">${t.label}: ${t.count} attendees</p>
                <div style="background:rgba(255,255,255,0.06); height:4px; margin-top:4px;"><div style="width:${t.pct}%; background:${t.color}; height:100%;"></div></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    mountDashboardModule(content, 3, 'EXIT');
  }
};

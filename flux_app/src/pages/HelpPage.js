import { Navigation } from '../components/Navigation.js';

export const HelpPage = {
  render: (mountDashboardModule) => {
    const content = `
      <div id="help-container" style="width:100%; padding-bottom: 50px;">
        <div class="promo-card" style="border-color: #00ff66; margin-bottom: 2rem;">
          <h2 style="color:#00ff66; margin-bottom:0.5rem;">FLUX Support Engine</h2>
          <p style="color:var(--text-muted); font-size:0.85rem;">Orchestrating solutions for the modern attendee.</p>
        </div>

        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div class="stand-card">
            <h3>How does the QR work?</h3>
            <p style="color:var(--text-muted); font-size:0.8rem; margin-top:5px;">Your QR is a rotating security token. It only activates when you are within 2km of the venue and your arrival slot is active.</p>
          </div>
          <div class="stand-card">
            <h3>What are FLUX Points?</h3>
            <p style="color:var(--text-muted); font-size:0.8rem; margin-top:5px;">Earn points by booking off-peak slots. Points can be redeemed for Flash Market discounts or Priority Exit status.</p>
          </div>
          <div class="stand-card">
            <h3>Emergency Assistance</h3>
            <p style="color:var(--text-muted); font-size:0.8rem; margin-top:5px;">Tap the 'Urgent' button in the status bar for immediate steward dispatch to your GPS location.</p>
          </div>
        </div>

        <div class="promo-card" style="margin-top:2rem; border-color: rgba(255,255,255,0.1); background:rgba(255,255,255,0.02); text-align:center;">
          <p style="color:#fff; font-weight:700;">System Version: v1.5.0-MODULAR</p>
          <p style="color:var(--text-muted); font-size:0.7rem; margin-top:5px;">&copy; 2026 FLUX Fortress Protocol. Developed for evaluation.</p>
        </div>
      </div>
    `;

    mountDashboardModule(content, -1, 'HELP');
  }
};

import { state } from '../core/state.js';
import { authService } from '../services/authService.js';
import { uiUtils } from '../utils/uiUtils.js';

export const MarketPage = {
  render: (mountDashboardModule) => {
    if (!authService.isAuth()) return;

    const content = `
      <div class="market-ticker top-ribbon" id="market-ticker">
        <div class="ticker-tape" id="ticker-tape"></div>
      </div>
      <div id="market-container" class="market-section" style="width:100%;">
        <div class="promo-card market-intelligence-card" style="margin-bottom: 1.5rem; border-color: #ff003c; background: rgba(255,0,60,0.05);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
             <h3 style="color: #ff003c; text-transform: uppercase; margin:0; font-size:0.8rem;">Traffic Redirect Active</h3>
             <div class="pulse-dot" style="background:#ff003c;"></div>
          </div>
          <p style="margin:0; font-size:0.9rem;">Recommendation: <b>North Concourse Taco Stall</b></p>
          <p style="margin:5px 0 0 0; font-size:0.75rem; color: #ff003c; font-weight:700;">PROFIT: 40% OFF | SAVE 12 MIN</p>
        </div>
        
        <div id="market-feed" class="market-feed" style="display:flex; flex-direction:column; gap:1.2rem;"></div>
        
        <div class="promo-card" style="margin-top:2rem; border-color:rgba(255,255,255,0.05); text-align:center; padding:1.5rem;">
          <p style="color:rgba(255,255,255,0.3); font-size:0.6rem; text-transform:uppercase; letter-spacing:2px;">Dynamic Heatmap Analytics</p>
          <div style="display:flex; justify-content:space-around; margin-top:15px;">
            ${[3, 5, 8, 4, 6].map(h => `<div style="width:12px; height:${h * 4}px; background:rgba(255,255,255,0.1); border-radius:2px;"></div>`).join('')}
          </div>
        </div>
      </div>
    `;

    mountDashboardModule(content, 2, 'MARKET');
    MarketPage.updateDisplay();
    
    if (state.marketInterval) clearInterval(state.marketInterval);
    state.marketInterval = setInterval(() => {
      MarketPage.simulateMarket();
      MarketPage.updateDisplay();
    }, 4000);
  },

  simulateMarket: () => {
    state.mockMarketData.forEach(item => {
      const deltaWait = Math.floor(Math.random() * 5) - 2;
      item.wait = Math.max(1, Math.min(25, item.wait + deltaWait));
      item.trend = deltaWait > 0 ? 'up' : deltaWait < 0 ? 'down' : 'stable';
      item.priceCurrent = item.wait > 18 ? (item.priceBase * 0.7).toFixed(2) : item.priceBase.toFixed(2);
    });
  },

  updateDisplay: () => {
    const tapeEl = document.getElementById('ticker-tape');
    const feedEl = document.getElementById('market-feed');
    if (!feedEl) return;

    if (tapeEl) {
      const items = state.mockMarketData.map(item => {
        const trendIcon = item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '●';
        return `<span class="ticker-item ${item.trend}">${item.name.toUpperCase()} <span style="font-size:0.6rem; opacity:0.6;">${trendIcon}</span> ${item.wait}m</span>`;
      }).join('');
      tapeEl.innerHTML = items + items + items; // Triple for infinite scroll feel
    }

    feedEl.innerHTML = state.mockMarketData.map(item => {
      const density = (item.wait / 25) * 100;
      const barColor = density > 70 ? '#ff003c' : density > 40 ? '#ffaa00' : '#39ff14';
      const isDiscounted = item.wait > 18;
      
      return `
        <div class="stand-card promo-card" style="padding:1.4rem; --card-theme: ${barColor}">
          <div class="stand-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <h3 style="margin:0; font-size:1.1rem; color:#fff;">${item.name}</h3>
              <p style="font-size:0.7rem; color:var(--text-muted); margin-top:4px;">${item.wait} MIN WAIT</p>
            </div>
            <div style="text-align:right;">
              <span class="price-val" style="font-size:1.4rem; font-weight:900; color:${isDiscounted ? '#39ff14' : '#fff'};">$${item.priceCurrent}</span>
              ${isDiscounted ? '<p style="font-size:0.55rem; color:#39ff14; font-weight:700;">FLUX FLASH SALE</p>' : ''}
            </div>
          </div>
          <div class="density-system" style="margin-top:1.2rem;">
            <div class="density-bar-container" style="background:rgba(255,255,255,0.05); height:6px; border-radius:3px; overflow:hidden;">
              <div class="density-bar" style="width: ${density}%; background: ${barColor}; height: 100%; transition: width 1s ease;"></div>
            </div>
          </div>
        </div>
      `;
    }).join('') + (authService.isGuest() ? uiUtils.guestUpgradeCard('Discounts - Registered Only') : '');
    
    if (authService.isGuest()) uiUtils.bindGuestUpgradeBtn();
  }
};

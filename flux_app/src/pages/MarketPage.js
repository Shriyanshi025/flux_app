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
        <div class="promo-card market-intelligence-card" style="margin-bottom: 2rem; border-color: #ff3c3c;">
          <h3 style="color: #ff3c3c; text-transform: uppercase;">Market Intelligence</h3>
          <p>Action: <b>Redirect to Taco Stall</b> (40% OFF)</p>
        </div>
        <div id="market-feed" class="market-feed"></div>
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
      const items = state.mockMarketData.map(item => `
        <span class="ticker-item ${item.trend}">${item.name.toUpperCase()} | ${item.wait}m</span>
      `).join('');
      tapeEl.innerHTML = items + items;
    }

    feedEl.innerHTML = state.mockMarketData.map(item => {
      const density = (item.wait / 25) * 100;
      const barColor = density > 70 ? '#ff003c' : density > 40 ? '#ffaa00' : '#00ff66';
      
      return `
        <div class="stand-card">
          <div class="stand-header">
            <h3>${item.name}</h3>
            <span class="price-val">$${item.priceCurrent}</span>
          </div>
          <div class="density-system">
            <div class="density-label"><span>WAIT: ${item.wait} MIN</span></div>
            <div class="density-bar-container"><div class="density-bar" style="width: ${density}%; background: ${barColor}"></div></div>
          </div>
        </div>
      `;
    }).join('') + (authService.isGuest() ? uiUtils.guestUpgradeCard('Discounts - Registered Only') : '');
    
    if (authService.isGuest()) uiUtils.bindGuestUpgradeBtn();
  }
};

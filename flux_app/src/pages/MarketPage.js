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
        <!-- CORE INTELLIGENCE CARD -->
        <div class="promo-card market-intelligence-card" style="margin-bottom: 1.5rem; border-color: #ff003c; background: rgba(255,0,60,0.05);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
             <h3 style="color: #ff003c; text-transform: uppercase; margin:0; font-size:0.8rem; letter-spacing:2px;">Crowd Redirection Active</h3>
             <div class="pulse-dot" style="background:#ff003c;"></div>
          </div>
          <p style="margin:0; font-size:0.9rem;">Intelligence: <b>Sector Delta</b> is currently <b>DENSE</b>.</p>
          <p style="margin:5px 0 0 0; font-size:0.75rem; color: #ff003c; font-weight:700;">PROFIT: 40% OFF at Sector Beta (Taco Stall)</p>
        </div>

        <!-- INTERACTIVE HEATMAP GRID -->
        <div class="promo-card" style="margin-bottom:1.5rem; padding:1.2rem; border-color:rgba(255,255,255,0.05);">
           <p style="color:var(--text-muted); font-size:0.6rem; text-transform:uppercase; letter-spacing:2px; margin-bottom:1rem;">Interactive Sector Heatmap</p>
           <div id="heatmap-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; height:120px;">
              ${Array.from({ length: 9 }).map((_, i) => {
                const density = [20, 80, 40, 10, 95, 30, 20, 60, 40][i];
                const color = density > 70 ? 'rgba(255,0,60,0.6)' : density > 40 ? 'rgba(255,170,0,0.4)' : 'rgba(0,255,102,0.2)';
                return `<div class="heatmap-sector" data-sector="${i}" style="background:${color}; border-radius:4px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.6rem; font-weight:700; color:rgba(255,255,255,0.4); border:1px solid rgba(255,255,255,0.05); transition:0.3s;">S${i+1}</div>`;
              }).join('')}
           </div>
           <div id="sector-details" style="margin-top:10px; font-size:0.65rem; color:rgba(255,255,255,0.3); text-align:center;">
              TAP A SECTOR FOR DETAILED TELEMETRY
           </div>
        </div>
        
        <div id="market-feed" class="market-feed" style="display:flex; flex-direction:column; gap:1.2rem; padding-bottom:120px;"></div>
      </div>

      <!-- VOUCHER OVERLAY (HIDDEN BY DEFAULT) -->
      <div id="voucher-overlay" class="animated hidden" style="position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:9000; display:flex; align-items:center; justify-content:center; padding:2rem;">
         <div class="promo-card" style="width:100%; max-width:320px; text-align:center; padding:2rem; border-color:#00ff66;">
            <p style="color:#00ff66; font-size:0.7rem; font-weight:900; letter-spacing:4px; margin-bottom:1.5rem;">VOUCHER SECURED</p>
            <div id="voucher-qr" style="width:160px; height:160px; background:#fff; margin:0 auto; border-radius:12px; padding:10px; filter:blur(10px); transition:filter 0.5s ease; cursor:pointer; position:relative;">
               <div id="unblur-hint" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#000; font-weight:900; font-size:0.8rem;">TAP TO UNLOCK</div>
            </div>
            <h3 id="voucher-title" style="color:#fff; margin-top:2rem;">---</h3>
            <p id="voucher-desc" style="color:var(--text-muted); font-size:0.85rem; margin-top:10px;">Unique transaction ID: FLUX-TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            <button class="btn-primary" id="close-voucher-btn" style="margin-top:2rem;">BACK TO MARKET</button>
         </div>
      </div>
    `;

    mountDashboardModule(content, 2, 'MARKET-INTELLIGENCE');
    MarketPage.bindEvents();
    MarketPage.updateDisplay();
    
    if (state.marketInterval) clearInterval(state.marketInterval);
    state.marketInterval = setInterval(() => {
      MarketPage.simulateMarket();
      MarketPage.updateDisplay();
    }, 4000);
  },

  bindEvents: () => {
    // Heatmap Interaction
    document.querySelectorAll('.heatmap-sector').forEach(sec => {
      sec.addEventListener('click', (e) => {
        const sid = e.target.getAttribute('data-sector');
        const labels = ["CLEAN", "SURGING", "NOMINAL", "RESTRICTED", "CAPACITY", "CLEAN", "OPTIMAL", "SURGING", "NOMINAL"];
        const colors = ["#00ff66", "#ffaa00", "#fff", "#ff003c", "#ff003c", "#00ff66", "#00ff66", "#ffaa00", "#fff"];
        const detailEl = document.getElementById('sector-details');
        detailEl.innerHTML = `SECTOR ${parseInt(sid)+1} STATUS: <span style="color:${colors[sid]}; font-weight:900;">${labels[sid]}</span>`;
        
        // Flash animation
        e.target.style.transform = 'scale(0.95)';
        setTimeout(() => e.target.style.transform = 'scale(1)', 100);
      });
    });

    // Voucher Logic
    const vOverlay = document.getElementById('voucher-overlay');
    const vQR = document.getElementById('voucher-qr');
    vQR.addEventListener('click', () => {
      vQR.style.filter = 'blur(0)';
      document.getElementById('unblur-hint').style.display = 'none';
      vQR.innerHTML = QRComponent.generateSVG(Date.now());
    });
    document.getElementById('close-voucher-btn').addEventListener('click', () => {
      vOverlay.classList.add('hidden');
      vQR.style.filter = 'blur(10px)';
      vQR.innerHTML = '<div id="unblur-hint" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#000; font-weight:900; font-size:0.8rem;">TAP TO UNLOCK</div>';
    });
  },

  simulateMarket: () => {
    state.mockMarketData.forEach(item => {
      const deltaWait = Math.floor(Math.random() * 5) - 2;
      item.wait = Math.max(1, Math.min(25, item.wait + deltaWait));
      item.trend = deltaWait > 0 ? 'up' : deltaWait < 0 ? 'down' : 'stable';
      item.priceCurrent = item.wait > 18 ? (item.priceBase * 0.7).toFixed(2) : item.priceBase.toFixed(2);
      
      // Simulated stock depletion
      item.stockCount = item.stockCount || 50;
      if (Math.random() > 0.6) item.stockCount = Math.max(0, item.stockCount - 1);
    });
  },

  updateDisplay: () => {
    const tapeEl = document.getElementById('ticker-tape');
    const feedEl = document.getElementById('market-feed');
    if (!feedEl) return;

    if (tapeEl) {
      const items = state.mockMarketData.map(item => {
        const color = item.trend === 'up' ? '#ff003c' : item.trend === 'down' ? '#00ff66' : '#fff';
        return `<span class="ticker-item" style="color:${color};">${item.name.toUpperCase()} ${item.wait}m</span>`;
      }).join('');
      tapeEl.innerHTML = items + items + items;
    }

    feedEl.innerHTML = state.mockMarketData.map(item => {
      const density = (item.wait / 25) * 100;
      const barColor = density > 70 ? '#ff003c' : density > 40 ? '#ffaa00' : '#00ff66';
      const isDiscounted = item.wait > 18;
      
      return `
        <div class="stand-card promo-card" data-name="${item.name}" style="padding:1.4rem; --card-theme: ${barColor}">
          <div class="stand-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <h3 style="margin:0; font-size:1.1rem; color:#fff;">${item.name}</h3>
              <p style="font-size:0.7rem; color:rgba(255,255,255,0.4); margin-top:4px; font-weight:700;">SECTOR S${Math.floor(Math.random()*9)+1} | STOCK: ${item.stockCount || 42}</p>
            </div>
            <div style="text-align:right;">
              <span class="price-val" style="font-size:1.4rem; font-weight:900; color:${isDiscounted ? '#00ff66' : '#fff'};">$${item.priceCurrent}</span>
              ${isDiscounted ? '<p style="font-size:0.55rem; color:#00ff66; font-weight:700; margin-top:2px;">FLASH DISCOUNT</p>' : ''}
            </div>
          </div>
          <div class="density-system" style="margin-top:1.2rem;">
            <div class="density-bar-container" style="background:rgba(255,255,255,0.05); height:6px; border-radius:3px; overflow:hidden;">
              <div class="density-bar" style="width: ${density}%; background: ${barColor}; height: 100%; transition: width 1s ease;"></div>
            </div>
          </div>
          <button class="btn-primary btn-claim" style="margin-top:1.2rem; height:40px; font-size:0.8rem; background:${isDiscounted ? '#00ff66' : 'transparent'}; color:${isDiscounted ? '#000' : '#fff'};">CLAIM VOUCHER</button>
        </div>
      `;
    }).join('') + (authService.isGuest() ? uiUtils.guestUpgradeCard('Discounts - Registered Only') : '');
    
    containerBindVouchers();
  }
};

function containerBindVouchers() {
  document.querySelectorAll('.btn-claim').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.promo-card');
      const name = card.getAttribute('data-name');
      const overlay = document.getElementById('voucher-overlay');
      document.getElementById('voucher-title').innerText = name.toUpperCase();
      overlay.classList.remove('hidden');
    });
  });
}

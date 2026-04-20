import { state } from '../core/state.js';
import { authService } from '../services/authService.js';
import { uiUtils } from '../utils/uiUtils.js';
import { SystemBrain } from '../services/SystemBrain.js';
import { QRComponent } from '../components/QRComponent.js';
import { FlowOrchestrator } from '../services/FlowOrchestrator.js';
import { StadiumMind } from '../services/StadiumMind.js';

/**
 * MARKET PROTOCOL - STATEFUL ECONOMY (v3.0 MASTERPIECE)
 * Implements persistent inventory, wallet-linked purchases, and dynamic diversion.
 */

export const MarketPage = {
  render: (mountDashboardModule) => {
    if (!authService.isAuth()) return;

    const content = `
      <div id="market-container" class="market-section animated" style="width:100%; min-height:85vh; background:rgba(0,0,0,0.3);">
        <div class="market-ticker top-ribbon" id="market-ticker" style="background:rgba(19,19,19,0.9); border-bottom:1px solid rgba(255,255,255,0.1);">
          <div class="ticker-tape" id="ticker-tape"></div>
        </div>
        
        <div style="padding:15px 20px;">
          <!-- WALLET HUD -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:12px; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center;">
             <span style="color:rgba(255,255,255,0.3); font-size:0.55rem; text-transform:uppercase; letter-spacing:2px; font-weight:800;">Available Credits</span>
             <span id="market-wallet" style="color:var(--accent); font-weight:900; font-size:1rem; font-family:var(--font-logo);">$${state.stadiumMatrix.userSession.walletBalance}</span>
          </div>

          <!-- SMARTS: ALGORITHMIC RECOMMENDATION -->
          <div class="promo-card market-intelligence-card animated" id="intel-card" style="margin-bottom: 1.5rem; border-color: #ff003c; background: rgba(255,0,60,0.05); overflow:hidden;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
               <h3 id="intel-header" style="color: #ff003c; text-transform: uppercase; margin:0; font-size:0.75rem; letter-spacing:2px; font-weight:900;">Directive: SYNCING...</h3>
               <div class="pulse-dot" style="background:#ff003c;"></div>
            </div>
            <p style="margin:0; font-size:0.95rem; color:#fff;">Recommendation: <b id="smart-rec-name">CALCULATING...</b></p>
            <div style="display:flex; gap:10px; margin-top:10px;">
               <div id="intel-stat-latency" style="background:rgba(255,0,60,0.1); padding:4px 10px; border-radius:4px; font-size:0.6rem; color:#ff003c; font-weight:900;">SCANNING LOAD</div>
               <div id="intel-stat-profit" style="background:rgba(255,0,60,0.1); padding:4px 10px; border-radius:4px; font-size:0.6rem; color:#ff003c; font-weight:900;">PROFIT: ANALYZING</div>
            </div>
          </div>
          
          <div id="market-feed" class="market-feed" style="display:flex; flex-direction:column; gap:1.2rem; padding-bottom:120px;"></div>
        </div>
      </div>

      <!-- VOUCHER PASS OVERLAY -->
      <div id="voucher-overlay" class="animated hidden" style="position:fixed; inset:0; background:rgba(0,0,0,0.98); z-index:9000; display:flex; align-items:center; justify-content:center; padding:2rem; backdrop-filter:blur(20px);">
         <div class="promo-card" id="voucher-pass-card" style="width:100%; max-width:320px; text-align:center; padding:2rem; border-color:#00ff66; background:#000; box-shadow:0 0 100px rgba(0,255,102,0.1);">
            <div id="voucher-verification-stage" style="margin-bottom:20px;">
               <div class="pulse-dot" style="background:#00ff66; margin:0 auto 10px auto;"></div>
               <p id="verification-text" style="color:#00ff66; font-size:0.6rem; font-weight:900; letter-spacing:2px; text-transform:uppercase;">Issuing Transaction</p>
            </div>
            <div id="voucher-qr-container" class="hidden">
               <p style="color:#00ff66; font-size:0.7rem; font-weight:900; letter-spacing:5px; margin-bottom:2rem;">SECURED VOUCHER</p>
               <div id="voucher-qr" style="width:180px; height:180px; background:#fff; margin:0 auto; border-radius:16px; padding:12px; cursor:pointer; position:relative; box-shadow:0 0 50px rgba(57,255,20,0.2);">
               </div>
               <h2 id="voucher-title" style="color:#fff; margin-top:2rem; font-family:var(--font-logo); font-size:1.4rem;">---</h2>
               <p id="voucher-hash" style="color:rgba(255,255,255,0.3); font-size:0.6rem; margin-top:10px; font-family:monospace;"></p>
               <button class="btn-primary" id="close-voucher-btn" style="margin-top:2.5rem; height:50px; background:rgba(0,255,102,0.1); border-color:#00ff66; color:#00ff66;">RE-ENTER MARKET</button>
            </div>
         </div>
      </div>
    `;

    mountDashboardModule(content, 2, 'MARKET-DATA-PASS');
    MarketPage.bindDeepEvents();
    MarketPage.initAlgorithmicSync();
  },

  initAlgorithmicSync: () => {
    const syncHandler = (e) => {
      MarketPage.algorithmicTick(e.detail);
    };
    window.addEventListener('flux-heartbeat', syncHandler);
    MarketPage.algorithmicTick(FlowOrchestrator.getMetrics());

    const observer = new MutationObserver(() => {
      if (!document.getElementById('market-container')) {
        window.removeEventListener('flux-heartbeat', syncHandler);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  algorithmicTick: (metrics) => {
    const pulse = metrics.flowPulse;
    const isHighLoad = pulse > 65;

    // Update Intelligence Card
    const intelHeader = document.getElementById('intel-header');
    const intelWait = document.getElementById('intel-stat-latency');
    const intelProfit = document.getElementById('intel-stat-profit');
    if (intelHeader) {
      intelHeader.innerText = isHighLoad ? "Directive: DIVERSION ACTIVE" : "Directive: OPTIMAL FLOW";
      intelHeader.style.color = isHighLoad ? "#ffaa00" : "#ff003c";
      intelWait.innerText = `LOAD: ${pulse}%`;
      intelProfit.innerText = `PROFIT: ${isHighLoad ? 'SURGE' : 'STABLE'}`;
    }

    // Dynamic Pricing Logic (v3.0)
    state.mockMarketData.forEach(item => {
      const loadOffset = (pulse / 100) * 10;
      item.wait = Math.round(item.waitBase + loadOffset + (Math.random() * 2));
      const discountTrigger = item.wait > 20 || isHighLoad;
      item.priceCurrent = (item.priceBase * (discountTrigger ? 0.65 : 1.0)).toFixed(2);
      item.isDiscounted = discountTrigger;
    });

    MarketPage.updateUI();
  },

  updateUI: () => {
    const feedEl = document.getElementById('market-feed');
    const tapeEl = document.getElementById('ticker-tape');
    const walletEl = document.getElementById('market-wallet');
    if (!feedEl) return;

    if (walletEl) walletEl.innerText = `$${state.stadiumMatrix.userSession.walletBalance}`;

    if (tapeEl) {
      const items = state.mockMarketData.map(item => {
        return `<span class="ticker-item" style="color:${item.isDiscounted ? '#00ff66' : '#fff'}; margin-right:30px;">${item.name.toUpperCase()} • $${item.priceCurrent}</span>`;
      }).join('');
      tapeEl.innerHTML = items + items;
    }

    feedEl.innerHTML = state.mockMarketData.map(item => {
      const density = (item.wait / 30) * 100;
      const barColor = density > 75 ? '#ff003c' : density > 50 ? '#ffaa00' : '#00ff66';
      const isSoldOut = (item.inventory || 0) <= 0;
      
      return `
        <div class="stand-card promo-card animated" data-name="${item.name}" style="padding:1.4rem; --card-theme: ${barColor}; opacity:${isSoldOut ? 0.5 : 1}">
          <div class="stand-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <h3 style="margin:0; font-size:1.1rem; color:#fff; font-family:var(--font-logo);">${item.name}</h3>
              <p style="font-size:0.7rem; color:rgba(255,255,255,0.4); margin-top:4px; font-weight:700; letter-spacing:1px;">STOCK: ${item.inventory} | LATENCY: ${item.wait}M</p>
            </div>
            <div style="text-align:right;">
              <span class="price-val" style="font-size:1.4rem; font-weight:900; color:${item.isDiscounted ? '#00ff66' : '#fff'};">$${item.priceCurrent}</span>
            </div>
          </div>
          <div class="density-system" style="margin-top:1.2rem;">
            <div class="density-bar-container" style="background:rgba(255,255,255,0.05); height:4px; border-radius:2px; overflow:hidden;">
              <div class="density-bar" style="width: ${density}%; background: ${barColor}; height: 100%; transition: width 1s ease;"></div>
            </div>
          </div>
          <button class="btn-primary btn-claim-voucher" 
                  data-price="${item.priceCurrent}" 
                  style="margin-top:1.2rem; height:45px; font-size:0.8rem; background:${isSoldOut ? '#333' : (item.isDiscounted ? '#00ff66' : 'transparent')}; color:${item.isDiscounted && !isSoldOut ? '#000' : '#fff'}" 
                  ${isSoldOut ? 'disabled' : ''}>
            ${isSoldOut ? 'STOCK DEPLETED' : 'GENERATE SECURE VOUCHER'}
          </button>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.btn-claim-voucher').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.promo-card');
        const name = card.getAttribute('data-name');
        const price = parseFloat(e.target.getAttribute('data-price'));
        
        // v3.0 MASTERPIECE: Process Stateful Purchase
        const success = StadiumMind.processAction('PURCHASE', { name, price });
        if (success) {
           MarketPage.initVoucherVerification(name);
        } else {
           alert("INSUFFICIENT FLUX BALANCE");
        }
      });
    });
  },

  initVoucherVerification: (name) => {
    const overlay = document.getElementById('voucher-overlay');
    const container = document.getElementById('voucher-qr-container');
    const stage = document.getElementById('voucher-verification-stage');
    const verText = document.getElementById('verification-text');
    
    overlay.classList.remove('hidden');
    container.classList.add('hidden');
    stage.classList.remove('hidden');
    
    setTimeout(() => verText.innerText = "Encrypting Handshake", 800);
    setTimeout(() => {
      stage.classList.add('hidden');
      container.classList.remove('hidden');
      document.getElementById('voucher-title').innerText = name.toUpperCase();
      document.getElementById('voucher-hash').innerText = `TX-HASH: ${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
      document.getElementById('voucher-qr').innerHTML = QRComponent.generateSVG(Date.now());
    }, 1600);
  },

  bindDeepEvents: () => {
    document.getElementById('close-voucher-btn').addEventListener('click', () => {
      document.getElementById('voucher-overlay').classList.add('hidden');
      MarketPage.updateUI();
    });
  }
};

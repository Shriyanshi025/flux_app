import { state } from '../core/state.js';
import { authService } from '../services/authService.js';
import { uiUtils } from '../utils/uiUtils.js';
import { SystemBrain } from '../services/SystemBrain.js';
import { QRComponent } from '../components/QRComponent.js';
import { FlowOrchestrator } from '../services/FlowOrchestrator.js';

/**
 * MARKET PROTOCOL - ALGORITHMIC HARDENING (v2.0 IOS)
 * Implements a globally-reactive economy driven by the stadium's heartbeat.
 */

export const MarketPage = {
  render: (mountDashboardModule) => {
    if (!authService.isAuth()) return;

    const content = `
      <div class="market-ticker top-ribbon" id="market-ticker" style="background:rgba(19,19,19,0.9); border-bottom:1px solid rgba(255,255,255,0.1);">
        <div class="ticker-tape" id="ticker-tape"></div>
      </div>
      
      <div id="market-container" class="market-section" style="width:100%;">
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

        <div class="promo-card animated" style="margin-bottom:1.5rem; padding:1.2rem; border-color:rgba(255,255,255,0.05); background:#111;">
           <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
              <p style="color:rgba(255,255,255,0.3); font-size:0.6rem; text-transform:uppercase; letter-spacing:2px; margin:0;">Regional Flow Map</p>
              <span id="heatmap-status" style="font-size:0.6rem; color:#00ff66; font-weight:900;">REAL-TIME</span>
           </div>
           <div id="heatmap-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; height:100px;">
              ${Array.from({ length: 9 }).map((_, i) => {
                const density = [20, 80, 40, 10, 95, 30, 20, 60, 40][i];
                const color = density > 70 ? 'rgba(255,0,60,0.5)' : density > 40 ? 'rgba(255,170,0,0.3)' : 'rgba(0,255,102,0.15)';
                return `<div class="heatmap-sector" data-sector="${i}" style="background:${color}; border-radius:6px; cursor:pointer; border:1px solid rgba(255,255,255,0.03); transition:0.3s;"></div>`;
              }).join('')}
           </div>
        </div>
        
        <div id="market-feed" class="market-feed" style="display:flex; flex-direction:column; gap:1.2rem; padding-bottom:120px;"></div>
      </div>

      <!-- VOUCHER PASS OVERLAY (HIGH-FIDELITY) -->
      <div id="voucher-overlay" class="animated hidden" style="position:fixed; inset:0; background:rgba(0,0,0,0.98); z-index:9000; display:flex; align-items:center; justify-content:center; padding:2rem; backdrop-filter:blur(20px);">
         <div class="promo-card" id="voucher-pass-card" style="width:100%; max-width:320px; text-align:center; padding:2rem; border-color:#00ff66; background:#000; box-shadow:0 0 100px rgba(0,255,102,0.1);">
            <div id="voucher-verification-stage" style="margin-bottom:20px;">
               <div class="pulse-dot" style="background:#00ff66; margin:0 auto 10px auto;"></div>
               <p id="verification-text" style="color:#00ff66; font-size:0.6rem; font-weight:900; letter-spacing:2px; text-transform:uppercase;">Authenticating Request</p>
            </div>
            
            <div id="voucher-qr-container" class="hidden">
               <p style="color:#00ff66; font-size:0.7rem; font-weight:900; letter-spacing:5px; margin-bottom:2rem;">SECURED VOUCHER</p>
               <div id="voucher-qr" style="width:180px; height:180px; background:#fff; margin:0 auto; border-radius:16px; padding:12px; filter:blur(15px); transition:filter 0.8s cubic-bezier(0.19, 1, 0.22, 1); cursor:pointer; position:relative; box-shadow:0 0 50px rgba(57,255,20,0.2);">
                  <div id="unblur-hint" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#000; font-weight:900; font-size:0.75rem;">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:10px;"><path d="M12 11V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-5"/><path d="M8 8H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4"/><path d="M8 12h7"/></svg>
                     TAP TO UNLOCK
                  </div>
               </div>
               <h2 id="voucher-title" style="color:#fff; margin-top:2rem; font-family:var(--font-logo); font-size:1.4rem;">---</h2>
               <p id="voucher-hash" style="color:rgba(255,255,255,0.3); font-size:0.6rem; margin-top:10px; font-family:monospace;"></p>
               <button class="btn-primary" id="close-voucher-btn" style="margin-top:2.5rem; height:50px; background:rgba(0,255,102,0.1); border-color:#00ff66; color:#00ff66;">RETURN TO TERMINAL</button>
            </div>
         </div>
      </div>
    `;

    mountDashboardModule(content, 2, 'MARKET-DATA-PASS');
    MarketPage.bindDeepEvents();
    MarketPage.initAlgorithmicSync();
  },

  initAlgorithmicSync: () => {
    // Single global listener for the Market Page
    const syncHandler = (e) => {
      const metrics = e.detail;
      MarketPage.algorithmicTick(metrics);
    };
    
    window.addEventListener('flux-heartbeat', syncHandler);
    MarketPage.algorithmicTick(FlowOrchestrator.getMetrics());

    // Cleanup listener on unmount
    const observer = new MutationObserver((mutations) => {
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

    // Update Market Pricing
    state.mockMarketData.forEach(item => {
      // Logic: If pulse is high, items in high-latency sectors get HIGHER discounts
      const loadOffset = (pulse / 100) * 10;
      item.wait = Math.round(item.waitBase + loadOffset + (Math.random() * 2));
      
      const discountTrigger = item.wait > 20 || isHighLoad;
      const discountFactor = discountTrigger ? 0.65 : 1.0;
      item.priceCurrent = (item.priceBase * discountFactor).toFixed(2);
      item.isDiscounted = discountTrigger;
    });

    MarketPage.updateUI();
  },

  updateUI: () => {
    const feedEl = document.getElementById('market-feed');
    const tapeEl = document.getElementById('ticker-tape');
    if (!feedEl) return;

    // Ticker Update
    if (tapeEl) {
      const items = state.mockMarketData.map(item => {
        return `<span class="ticker-item" style="color:${item.isDiscounted ? '#00ff66' : '#fff'}; margin-right:30px;">${item.name.toUpperCase()} • $${item.priceCurrent}</span>`;
      }).join('');
      tapeEl.innerHTML = items + items;
    }

    // Feed Update (Minimize Flicker)
    feedEl.innerHTML = state.mockMarketData.map(item => {
      const density = (item.wait / 30) * 100;
      const barColor = density > 75 ? '#ff003c' : density > 50 ? '#ffaa00' : '#00ff66';
      
      return `
        <div class="stand-card promo-card animated" data-name="${item.name}" style="padding:1.4rem; --card-theme: ${barColor}">
          <div class="stand-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <h3 style="margin:0; font-size:1.1rem; color:#fff; font-family:var(--font-logo);">${item.name}</h3>
              <p style="font-size:0.7rem; color:rgba(255,255,255,0.4); margin-top:4px; font-weight:700; letter-spacing:1px;">TX-ID: ${Math.random().toString(36).substr(2, 6).toUpperCase()} | LATENCY: ${item.wait}M</p>
            </div>
            <div style="text-align:right;">
              <span class="price-val" style="font-size:1.4rem; font-weight:900; color:${item.isDiscounted ? '#00ff66' : '#fff'};">$${item.priceCurrent}</span>
              ${item.isDiscounted ? '<p style="font-size:0.55rem; color:#00ff66; font-weight:900; margin:2px 0 0 0;">DIVERSION RATE APPLY</p>' : ''}
            </div>
          </div>
          <div class="density-system" style="margin-top:1.2rem;">
            <div class="density-bar-container" style="background:rgba(255,255,255,0.05); height:4px; border-radius:2px; overflow:hidden;">
              <div class="density-bar" style="width: ${density}%; background: ${barColor}; height: 100%; transition: width 1s ease;"></div>
            </div>
          </div>
          <button class="btn-primary btn-claim-voucher" style="margin-top:1.2rem; height:45px; font-size:0.8rem; background:${item.isDiscounted ? '#00ff66' : 'transparent'}; color:${item.isDiscounted ? '#000' : '#fff'}; border-color:${item.isDiscounted ? '#00ff66' : 'rgba(255,255,255,0.1)'}">GENERATE SECURE VOUCHER</button>
        </div>
      `;
    }).join('');

    // Re-bind buttons
    document.querySelectorAll('.btn-claim-voucher').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = e.target.closest('.promo-card').getAttribute('data-name');
        MarketPage.initVoucherVerification(name);
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
    
    // Simulate 3-stage network authentication
    setTimeout(() => verText.innerText = "Encrypting Handshake", 800);
    setTimeout(() => verText.innerText = "Verified by Flux-Core", 1600);
    setTimeout(() => {
      stage.classList.add('hidden');
      container.classList.remove('hidden');
      document.getElementById('voucher-title').innerText = name.toUpperCase();
      document.getElementById('voucher-hash').innerText = `TX-SIG: ${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
    }, 2400);
  },

  bindDeepEvents: () => {
    const vQR = document.getElementById('voucher-qr');
    vQR.addEventListener('click', () => {
      vQR.style.filter = 'blur(0)';
      document.getElementById('unblur-hint').style.display = 'none';
      vQR.innerHTML = QRComponent.generateSVG(Date.now());
    });
    
    document.getElementById('close-voucher-btn').addEventListener('click', () => {
      document.getElementById('voucher-overlay').classList.add('hidden');
      vQR.style.filter = 'blur(15px)';
      vQR.innerHTML = `<div id="unblur-hint" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#000; font-weight:900; font-size:0.75rem;">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:10px;"><path d="M12 11V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-5"/><path d="M8 8H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4"/><path d="M8 12h7"/></svg>
                         TAP TO UNLOCK
                       </div>`;
    });
  }
};

import { state, saveEntryState } from '../core/state.js';
import { SLOT_CAPACITY } from '../core/constants.js';
import { authService } from '../services/authService.js';
import { uiUtils } from '../utils/uiUtils.js';
import { getLocationState, calculateDistance } from '../services/locationService.js';
import { SystemBrainWidget } from '../components/SystemBrainWidget.js';
import { QRComponent } from '../components/QRComponent.js';
import { FlowOrchestrator } from '../services/FlowOrchestrator.js';

/**
 * ENTRY PROTOCOL - HIGH-INTELLIGENCE HARDENING (v2.0 IOS)
 * Transforms the simple booking view into a multi-stage hardware handshake.
 */

export const EntryPage = {
  render: (mountDashboardModule, renderMap) => {
    if (!authService.isAuth()) return;

    const content = `<div id="entry-view" style="width: 100%; display: flex; flex-direction: column;"></div>`;
    mountDashboardModule(content, 1, 'ENTRY-PASS-SECURE');
    const entryFeed = document.getElementById('entry-view');
    
    if (!state.mockEntryState.bookedSlot) {
      EntryPage.renderTimeSlots(entryFeed);
    } else {
      EntryPage.renderProximityView(entryFeed, renderMap);
    }
  },

  renderTimeSlots: (container) => {
    const isGuest = authService.isGuest();
    const availableKeys = Object.keys(SLOT_CAPACITY);
    const metrics = FlowOrchestrator.getMetrics();

    container.innerHTML = `
      <div class="promo-card animated" style="border-color:rgba(255,255,255,0.1); text-align:center; margin-top:1rem; background:rgba(0,255,102,0.02)">
        <p style="color:var(--text-muted); font-size:0.7rem; text-transform:uppercase; letter-spacing:2px;">Arrival Allocation Engine</p>
        <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin:0.5rem 0;">
           <h2 style="color:#00ff66; margin:0; font-family:var(--font-logo);">SECURE WINDOW</h2>
           <span style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; font-size:0.5rem; color:#fff;">LOAD: ${Math.round(metrics.stadiumDensity * 100)}%</span>
        </div>
      </div>
      <div class="entry-grid" style="display: grid; gap: 15px; padding: 20px;">
        ${availableKeys.map((key, i) => {
          const cap = SLOT_CAPACITY[key];
          // Calculate dynamic load based on stadium density
          const dynamicLoad = Math.round((cap.booked / cap.max) * 100);
          const isFull = cap.booked >= cap.max;
          const isRecommended = !isFull && !cap.isPeak && metrics.stadiumDensity < 0.8; 
          
          return `
            <div class="promo-card slot-card" data-time="${key}" style="${isGuest ? 'opacity:0.5; pointer-events:none;' : ''} border-color:${isRecommended ? '#00ff66' : 'rgba(255,255,255,0.08)'}">
              ${isRecommended ? '<div style="position:absolute; top:12px; right:12px; background:#00ff66; color:#000; font-size:0.6rem; font-weight:900; padding:2px 8px; border-radius:4px;">OPTIMAL</div>' : ''}
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <p style="color: ${cap.isPeak ? '#ffaa00' : '#00ff66'}; font-weight: 700; margin:0;">${cap.label}</p>
                <span style="font-size:0.7rem; color:var(--text-muted);">${dynamicLoad}% LOAD</span>
              </div>
              <p style="font-size:0.75rem; color: rgba(255,255,255,0.4); margin:8px 0;">LATENCY: ${cap.ptsPerMin || 12} MIN</p>
              <div style="background: rgba(255,255,255,0.05); height: 3px; border-radius:2px;"><div style="width: ${dynamicLoad}%; background: ${cap.isPeak ? '#ffaa00' : '#00ff66'}; height: 100%;"></div></div>
              <button class="btn-primary btn-book" style="margin-top:15px; height:45px;" ${isFull ? 'disabled' : ''}>${isFull ? 'BOOK FREQUENCY' : 'ALLOCATE WINDOW'}</button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.querySelectorAll('.btn-book').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.target.closest('[data-time]').getAttribute('data-time');
        SLOT_CAPACITY[key].booked++;
        state.mockEntryState.bookedSlot = SLOT_CAPACITY[key].label;
        state.mockEntryState.unlockTime = Date.now() + 15000;
        saveEntryState();
        EntryPage.renderProximityView(container, null);
      });
    });
  },

  renderProximityView: (container, renderMap) => {
    const { selectedLocationName, distance } = getLocationState();
    
    container.innerHTML = `
      <div class="promo-card animated" id="maps-engine-card" style="border-color: #00ff66; background:rgba(0,0,0,0.5);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
           <p style="color: #00ff66; font-weight: 700; margin:0; font-size:0.8rem;">${selectedLocationName || 'SECTOR SELECTION REQUIRED'}</p>
           <div id="proximity-ping-status" style="font-size:0.5rem; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:5px;">
              <div class="status-dot active"></div> Pinging Node...
           </div>
        </div>
        <div id="google-maps-engine" style="height: 140px; background: #000; border:1px solid rgba(255,255,255,0.05); border-radius: 12px; display: flex; flex-direction:column; align-items: center; justify-content: center; position:relative; overflow:hidden;">
           ${selectedLocationName ? `
             <div class="radar-ping"></div>
             <p style="color: #00ff66; font-weight: 800; font-size:1.8rem; z-index:10; font-family:var(--font-logo); margin:0;">${distance} KM</p>
             <p style="color:rgba(255,255,255,0.2); font-size:0.5rem; margin-top:5px; z-index:10;">SPATIAL OFFSET ACTIVE</p>
           ` : `
             <button class="btn-primary" id="launch-nav-btn" style="width:80%;">LAUNCH NAVIGATOR</button>
           `}
        </div>
        ${selectedLocationName ? `<button id="resync-maps-btn" class="btn-primary" style="margin-top: 10px; height:40px; font-size:0.8rem; background:transparent;">RE-INITIALIZE FREQUENCY</button>` : ''}
      </div>
      <div id="slots-section-view"></div>
    `;

    document.getElementById('resync-maps-btn')?.addEventListener('click', renderMap);
    document.getElementById('launch-nav-btn')?.addEventListener('click', renderMap);
    
    EntryPage.renderSmartHandshake(document.getElementById('slots-section-view'));
  },

  /**
   * SMART HANDSHAKE (v2.0)
   * Multi-stage hardware handshake simulation.
   */
  renderSmartHandshake: (container) => {
    container.innerHTML = `
      <div class="lockout-screen animated" style="text-align: center; padding: 20px;">
        <div style="margin-bottom:2rem;">
          <h2 id="handshake-title" style="color: #fff; letter-spacing:4px; font-size:0.9rem; margin-bottom:5px; font-weight:900;">INITIALIZING...</h2>
          <div id="handshake-meta" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:10px; display:inline-block; margin-top:10px; min-width:140px;">
            <p style="color:rgba(255,255,255,0.3); font-size:0.5rem; text-transform:uppercase; margin:0;">Frequency Identity</p>
            <p id="handshake-uid" style="color:#fff; font-size:0.75rem; font-weight:700; margin:4px 0 0 0; font-family:monospace;">WAITING...</p>
          </div>
        </div>
        
        <div class="secure-qr-box" style="width:180px; height:180px; margin:0 auto; position:relative; overflow:hidden; border:1px solid rgba(255,255,255,0.1); border-radius:24px; background:rgba(0,0,0,0.5);">
           <div class="scanline"></div>
           <canvas id="handshake-oscilloscope" width="180" height="180" style="position:absolute; inset:0;"></canvas>
           <div id="handshake-status-icon" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; opacity:0.1; color:#00ff66;">
             <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
           </div>
        </div>

        <div style="margin-top:2.5rem;">
           <h1 class="countdown-timer" id="entry-timer" style="font-size:3.5rem; font-weight:900; color:#fff; font-family:var(--font-logo); margin:0; text-shadow:0 0 20px rgba(255,0,60,0.5);">15.00</h1>
           <p id="handshake-action-text" style="color:rgba(255,255,255,0.3); font-size:0.6rem; text-transform:uppercase; letter-spacing:3px; margin-top:5px;">Hardware Auth</p>
        </div>
        
        <div style="margin-top:20px; background:rgba(255,255,255,0.05); height:4px; border-radius:2px; max-width:200px; margin-left:auto; margin-right:auto;">
           <div id="handshake-progress" style="width:0%; background:var(--accent); height:100%; transition:width 0.5s;"></div>
        </div>
      </div>
    `;

    const ctx = document.getElementById('handshake-oscilloscope').getContext('2d');
    let frame = 0;
    
    const drawScope = () => {
       ctx.clearRect(0,0,180,180);
       ctx.beginPath();
       ctx.strokeStyle = 'rgba(0, 255, 102, 0.3)';
       ctx.lineWidth = 2;
       for(let x=0; x<180; x++) {
          const y = 90 + Math.sin(x*0.05 + frame*0.1) * 20 * Math.sin(frame*0.02);
          if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
       }
       ctx.stroke();
       frame++;
       if(document.getElementById('handshake-oscilloscope')) requestAnimationFrame(drawScope);
    };
    drawScope();

    const timerInterval = setInterval(() => {
      const diff = state.mockEntryState.unlockTime - Date.now();
      const metrics = FlowOrchestrator.getMetrics();
      
      if (diff <= 0) {
        clearInterval(timerInterval);
        EntryPage.checkAndUnlockMetadata(container, metrics.identityHash);
        return;
      }

      const totalMs = diff;
      const progress = ((15000 - totalMs) / 15000) * 100;
      
      document.getElementById('entry-timer').innerText = (totalMs / 1000).toFixed(2);
      document.getElementById('handshake-progress').style.width = progress + '%';
      document.getElementById('handshake-uid').innerText = metrics.identityHash;

      // Stage Updates
      const title = document.getElementById('handshake-title');
      const action = document.getElementById('handshake-action-text');
      if (progress < 25) {
         title.innerText = "HARDWARE INIT";
         action.innerText = "Encrypting Channel";
      } else if (progress < 70) {
         title.innerText = "SAMPLING FREQUENCY";
         action.innerText = `Sync: ${metrics.syncIntegrity}%`;
      } else {
         title.innerText = "FINALIZING LOCK";
         action.innerText = "Pinning Frequency";
      }
    }, 100);
  },

  checkAndUnlockMetadata: async (container, uid) => {
    const { distance } = getLocationState();
    container.innerHTML = `
      <div class="lockout-screen animated" style="text-align:center;">
        <div class="promo-card" style="border-color:#00ff66; padding:1.5rem; background:rgba(0,0,0,0.85); box-shadow:0 0 50px rgba(0,255,102,0.1);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <p style="color:#00ff66; font-size:0.7rem; font-weight:900; letter-spacing:2px; margin:0;">IDENTITY VERIFIED</p>
            <span style="font-size:0.6rem; color:rgba(255,255,255,0.3); font-family:monospace;">${uid}</span>
          </div>
          ${SystemBrainWidget.render(distance)}
          <button class="btn-primary" id="start-geo-verification" style="background: #00ff66; color:#000; font-weight: 900; margin-top:2rem; letter-spacing:1px; box-shadow:0 10px 30px rgba(0,255,102,0.3);">REVEAL FREQUENCY PASS</button>
        </div>
      </div>
    `;

    document.getElementById('start-geo-verification').addEventListener('click', () => {
      EntryPage.renderFinalPass(container, uid);
    });
  },

  renderFinalPass: (container, uid) => {
    const { distance } = getLocationState();
    const canSeeQR = distance !== null && distance <= 2.0;
    const metrics = FlowOrchestrator.getMetrics();

    container.innerHTML = `
      <div class="lockout-screen animated" style="text-align: center;">
        <div class="promo-card" style="border-color:${canSeeQR ? '#00ff66' : '#ff003c'}; background:rgba(0,0,0,0.9); box-shadow:0 20px 60px rgba(0,0,0,0.8);">
          <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.05); margin-bottom:20px;">
             <p style="color: #fff; font-size:0.9rem; font-weight:800; letter-spacing:1px; margin:0;">${canSeeQR ? 'FREQUENCY ACTIVE' : 'LOCKED'}</p>
             <span style="font-size:0.65rem; color:rgba(255,255,255,0.3); font-family:monospace;">${uid}</span>
          </div>
          
          <div id="qr-zone" style="margin:1.5rem 0;">
            ${canSeeQR ? `
              <div id="live-qr-pattern" style="margin: 0 auto; width:180px; height:180px; background:#fff; border-radius:16px; padding:12px; box-shadow:0 0 40px rgba(0,255,102,0.4);"></div>
              <div id="qr-telemetry" style="margin-top:15px;">
                 <p style="color: #00ff66; font-size:0.65rem; font-weight:900; letter-spacing:3px; margin:0;">METRIC SYNC: ${metrics.syncIntegrity}%</p>
                 <p style="color:rgba(255,255,255,0.2); font-size:0.45rem; margin-top:5px; text-transform:uppercase;">Encryption: Rotating Signature Active</p>
              </div>
            ` : `
              <div style="padding:2.5rem 1.5rem; border:2px dashed #ff003c; border-radius:24px; background:rgba(255,0,60,0.05);">
                <p style="color: #ff003c; font-weight: 900; font-size:1.4rem; margin:0; font-family:var(--font-logo);">OUTSIDE RANGE</p>
                <p style="color:rgba(255,0,60,0.6); font-size:0.8rem; margin-top:10px;">Proximity Protocol Verification Failed</p>
              </div>
            `}
          </div>

          <button class="btn-primary" id="reset-entry-btn" style="margin-top: 1.5rem; background:transparent; color:rgba(255,255,255,0.2); font-size:0.65rem; height:35px; border-color:rgba(255,255,255,0.05);">TERMINATE DEEP-SESSION</button>
        </div>
      </div>
    `;

    if (canSeeQR) {
      // Dynamic QR Refresh
      let qrSeed = Date.now();
      const injectQR = () => {
        const el = document.getElementById('live-qr-pattern');
        if (el) el.innerHTML = QRComponent.generateSVG(qrSeed);
      };
      injectQR();
      const qrInterval = setInterval(() => {
        if (!document.getElementById('live-qr-pattern')) {
          clearInterval(qrInterval);
          return;
        }
        qrSeed = Date.now();
        injectQR();
      }, 3000);
    }

    document.getElementById('reset-entry-btn').addEventListener('click', () => {
      state.mockEntryState.bookedSlot = null;
      EntryPage.render(mountDashboardModule, renderMap); 
    });
  }
};

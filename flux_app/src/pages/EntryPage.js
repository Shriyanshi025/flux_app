import { state, saveEntryState } from '../core/state.js';
import { SLOT_CAPACITY } from '../core/constants.js';
import { authService } from '../services/authService.js';
import { uiUtils } from '../utils/uiUtils.js';
import { getLocationState, calculateDistance } from '../services/locationService.js';
import { SystemBrainWidget } from '../components/SystemBrainWidget.js';
import { QRComponent } from '../components/QRComponent.js';

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

    container.innerHTML = `
      <div class="promo-card" style="border-color:rgba(255,255,255,0.1); text-align:center; margin-top:1rem;">
        <p style="color:var(--text-muted); font-size:0.7rem; text-transform:uppercase; letter-spacing:2px;">Arrival Allocation Engine</p>
        <h2 style="color:#00ff66; margin:0.5rem 0; font-family:var(--font-logo);">SECURE WINDOW</h2>
      </div>
      <div class="entry-grid" style="display: grid; gap: 15px; padding: 20px;">
        ${availableKeys.map((key, i) => {
          const cap = SLOT_CAPACITY[key];
          const pct = Math.round((cap.booked / cap.max) * 100);
          const isFull = cap.booked >= cap.max;
          const isRecommended = !isFull && (i === 1 || i === 2); 
          
          return `
            <div class="promo-card slot-card" data-time="${key}" style="${isGuest ? 'opacity:0.5; pointer-events:none;' : ''} border-color:${isRecommended ? '#00ff66' : 'rgba(255,255,255,0.08)'}">
              ${isRecommended ? '<div style="position:absolute; top:12px; right:12px; background:#00ff66; color:#000; font-size:0.6rem; font-weight:900; padding:2px 8px; border-radius:4px;">OPTIMAL</div>' : ''}
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <p style="color: ${cap.isPeak ? '#ffaa00' : '#00ff66'}; font-weight: 700; margin:0;">${cap.label}</p>
                <span style="font-size:0.7rem; color:var(--text-muted);">${pct}% LOAD</span>
              </div>
              <p style="font-size:0.75rem; color: rgba(255,255,255,0.4); margin:8px 0;">LATENCY: ${cap.ptsPerMin || 12} MIN</p>
              <div style="background: rgba(255,255,255,0.05); height: 3px; border-radius:2px;"><div style="width: ${pct}%; background: ${cap.isPeak ? '#ffaa00' : '#00ff66'}; height: 100%;"></div></div>
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
      <div class="promo-card" id="maps-engine-card" style="border-color: #00ff66;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
           <p style="color: #00ff66; font-weight: 700; margin:0;">${selectedLocationName || 'SECTOR SELECTION REQUIRED'}</p>
           <span style="font-size:0.6rem; color:rgba(255,255,255,0.3); text-transform:uppercase;">Status: Pinging...</span>
        </div>
        <div id="google-maps-engine" style="height: 140px; background: #000; border:1px solid rgba(255,255,255,0.05); border-radius: 12px; display: flex; flex-direction:column; align-items: center; justify-content: center; position:relative; overflow:hidden;">
           ${selectedLocationName ? `
             <div class="radar-ping"></div> <!-- HIGH-FIDELITY CSS TOKEN RESTORED -->
             <p style="color: #00ff66; font-weight: 800; font-size:1.5rem; z-index:10; font-family:var(--font-logo);">${distance} KM</p>
           ` : `
             <button class="btn-primary" id="launch-nav-btn" style="width:80%;">LAUNCH NAVIGATOR</button>
           `}
        </div>
        ${selectedLocationName ? `<button id="resync-maps-btn" class="btn-primary" style="margin-top: 10px; height:40px; font-size:0.8rem; background:transparent;">RE-INITIALIZE LOCATION</button>` : ''}
      </div>
      <div id="slots-section-view"></div>
    `;

    document.getElementById('resync-maps-btn')?.addEventListener('click', renderMap);
    document.getElementById('launch-nav-btn')?.addEventListener('click', renderMap);
    
    EntryPage.renderRestoredLockout(document.getElementById('slots-section-view'));
  },

  renderRestoredLockout: (container) => {
    // Generate identity metadata (Lost Object Restore)
    const sessionUID = Math.random().toString(36).substr(2, 9).toUpperCase();
    
    container.innerHTML = `
      <div class="lockout-screen animated" style="text-align: center; padding: 20px;">
        <div style="margin-bottom:2rem;">
          <h2 style="color: #4a0024; letter-spacing:4px; font-size:0.9rem; margin-bottom:5px; font-weight:900;">SECURE SCAN ACTIVE</h2>
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:10px; display:inline-block; margin-top:10px;">
            <p style="color:rgba(255,255,255,0.3); font-size:0.5rem; text-transform:uppercase; margin:0;">Identity Pass UID</p>
            <p style="color:#fff; font-size:0.75rem; font-weight:700; margin:4px 0 0 0; font-family:monospace;">${sessionUID}</p>
          </div>
        </div>
        
        <!-- SECURE SCANNER BOX (Restored Scanline) -->
        <div class="secure-qr-box" style="width:180px; height:180px; margin:0 auto; position:relative; overflow:hidden; border:1px solid rgba(255,255,255,0.1); border-radius:24px; background:rgba(0,0,0,0.5);">
           <div class="scanline"></div>
           <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; opacity:0.1; color:#00ff66;">
             <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
           </div>
        </div>

        <h1 class="countdown-timer" id="entry-timer" style="font-size:3.5rem; font-weight:900; color:#fff; font-family:var(--font-logo); margin-top:2.5rem; text-shadow:0 0 20px rgba(255,0,60,0.5);">00:15</h1>
        <p style="color:rgba(255,255,255,0.3); font-size:0.6rem; text-transform:uppercase; letter-spacing:3px;">Synchronizing...</p>
      </div>
    `;

    const timerInterval = setInterval(() => {
      const diff = state.mockEntryState.unlockTime - Date.now();
      if (diff <= 0) {
        clearInterval(timerInterval);
        EntryPage.checkAndUnlockMetadata(container, sessionUID);
        return;
      }
      const totalSec = Math.floor(diff / 1000);
      document.getElementById('entry-timer').innerText = `00:${String(totalSec).padStart(2, '0')}`;
    }, 1000);
  },

  checkAndUnlockMetadata: async (container, uid) => {
    const { distance } = getLocationState();
    container.innerHTML = `
      <div class="lockout-screen animated" style="text-align:center;">
        <div class="promo-card" style="border-color:#00ff66; padding:1.5rem; background:rgba(0,0,0,0.85);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <p style="color:#00ff66; font-size:0.7rem; font-weight:900; letter-spacing:2px; margin:0;">SCAN SUCCESS</p>
            <span style="font-size:0.6rem; color:rgba(255,255,255,0.3);">${uid}</span>
          </div>
          ${SystemBrainWidget.render(distance)}
          <button class="btn-primary" id="start-geo-verification" style="background: #00ff66; color:#000; font-weight: 900; margin-top:2rem; letter-spacing:1px;">REVEAL FREQUENCY PASS</button>
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

    container.innerHTML = `
      <div class="lockout-screen animated" style="text-align: center;">
        <div class="promo-card" style="border-color:${canSeeQR ? '#00ff66' : '#ff003c'}; background:rgba(0,0,0,0.9);">
          <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.05); margin-bottom:20px;">
             <p style="color: #fff; font-size:0.9rem; font-weight:800; letter-spacing:1px; margin:0;">${canSeeQR ? 'FREQUENCY ACTIVE' : 'LOCKED'}</p>
             <span style="font-size:0.65rem; color:rgba(255,255,255,0.3); font-family:monospace;">ID: ${uid}</span>
          </div>
          
          <div id="qr-zone" style="margin:1.5rem 0;">
            ${canSeeQR ? `
              <div id="live-qr-pattern" style="margin: 0 auto; width:180px; height:180px; background:#fff; border-radius:16px; padding:12px; box-shadow:0 0 40px rgba(0,255,102,0.4);"></div>
              <p style="color: #00ff66; font-size:0.65rem; font-weight:900; margin-top:15px; letter-spacing:3px;">METRIC SYNC: 99.8%</p>
            ` : `
              <div style="padding:2.5rem 1.5rem; border:2px dashed #ff003c; border-radius:24px; background:rgba(255,0,60,0.05);">
                <p style="color: #ff003c; font-weight: 900; font-size:1.4rem; margin:0; font-family:var(--font-logo);">OUTSIDE RANGE</p>
                <p style="color:rgba(255,0,60,0.6); font-size:0.8rem; margin-top:10px;">Proximity Protocol Verification Failed</p>
              </div>
            `}
          </div>

          <button class="btn-primary" id="reset-entry-btn" style="margin-top: 1.5rem; background:transparent; color:rgba(255,255,255,0.2); font-size:0.65rem; height:35px; border-color:rgba(255,255,255,0.05);">LOGOUT DEEP-SESSION</button>
        </div>
      </div>
    `;

    if (canSeeQR) {
      let qrSeed = Date.now();
      const injectQR = () => {
        const el = document.getElementById('live-qr-pattern');
        if (el) el.innerHTML = QRComponent.generateSVG(qrSeed);
      };
      injectQR();
      setInterval(() => {
        qrSeed = Date.now();
        injectQR();
      }, 3000);
    }

    document.getElementById('reset-entry-btn').addEventListener('click', () => {
      state.mockEntryState.bookedSlot = null;
      EntryPage.render(null, null); 
    });
  }
};

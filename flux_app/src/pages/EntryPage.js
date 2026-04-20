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
    mountDashboardModule(content, 1, 'ENTRY-PROTOCOL');
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
        <p style="color:var(--text-muted); font-size:0.7rem; text-transform:uppercase;">Intelligent Arrival Allocation</p>
        <h2 style="color:#00ff66; margin:0.5rem 0;">SECURE YOUR WINDOW</h2>
      </div>
      <div class="entry-grid" style="display: grid; gap: 15px; padding: 20px;">
        ${availableKeys.map((key, i) => {
          const cap = SLOT_CAPACITY[key];
          const pct = Math.round((cap.booked / cap.max) * 100);
          const isFull = cap.booked >= cap.max;
          
          // SMART LOGIC: Recommend the slot with lowest capacity that isn't full
          const isRecommended = !isFull && (i === 1 || i === 2); // Simplified mock logic
          
          return `
            <div class="promo-card slot-card" data-time="${key}" style="${isGuest ? 'opacity:0.5; pointer-events:none;' : ''} border-color:${isRecommended ? '#00ff66' : 'rgba(255,255,255,0.08)'}">
              ${isRecommended ? '<div style="position:absolute; top:12px; right:12px; background:#00ff66; color:#000; font-size:0.6rem; font-weight:900; padding:2px 8px; border-radius:4px;">RECOMMENDED</div>' : ''}
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <p style="color: ${cap.isPeak ? '#ffaa00' : '#00ff66'}; font-weight: 700; margin:0;">${cap.label}</p>
                <span style="font-size:0.7rem; color:var(--text-muted);">${pct}% LOAD</span>
              </div>
              <p style="font-size:0.75rem; color: rgba(255,255,255,0.4); margin:8px 0;">ETA: ${cap.ptsPerMin || 12} FLUX Points/min</p>
              <div style="background: rgba(255,255,255,0.05); height: 3px; border-radius:2px;"><div style="width: ${pct}%; background: ${cap.isPeak ? '#ffaa00' : '#00ff66'}; height: 100%;"></div></div>
              <button class="btn-primary btn-book" style="margin-top:15px; height:45px;" ${isFull ? 'disabled' : ''}>${isFull ? 'FULL' : 'ALLOCATE WINDOW'}</button>
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
           <p style="color: #00ff66; font-weight: 700; margin:0;">${selectedLocationName || 'TARGET: FREQUENCY LOCK'}</p>
           <span style="font-size:0.6rem; color:rgba(255,255,255,0.3);">DIST: ${distance || '---'} KM</span>
        </div>
        <div id="google-maps-engine" style="height: 140px; background: #000; border:1px solid rgba(255,255,255,0.05); border-radius: 12px; display: flex; flex-direction:column; align-items: center; justify-content: center; position:relative; overflow:hidden;">
           ${selectedLocationName ? `
             <div class="radar-ping"></div>
             <p style="color: #00ff66; font-weight: 800; font-size:1.5rem; z-index:10;">${distance} KM</p>
           ` : `
             <button class="btn-primary" id="launch-nav-btn" style="width:80%;">LAUNCH NAVIGATOR</button>
           `}
        </div>
        ${selectedLocationName ? `<button id="resync-maps-btn" class="btn-primary" style="margin-top: 10px; height:40px; font-size:0.8rem;">RE-SYNC LOCATION</button>` : ''}
      </div>
      <div id="slots-section-view"></div>
    `;

    document.getElementById('resync-maps-btn')?.addEventListener('click', renderMap);
    document.getElementById('launch-nav-btn')?.addEventListener('click', renderMap);
    
    EntryPage.renderSmartLockout(document.getElementById('slots-section-view'));
  },

  renderSmartLockout: (container) => {
    container.innerHTML = `
      <div class="lockout-screen animated" style="text-align: center; padding: 20px;">
        <div style="margin-bottom:2rem;">
          <h2 style="color: #00e5ff; letter-spacing:4px; font-size:0.9rem; margin-bottom:5px;">IDENTITY CONVERGENCE</h2>
          <p style="color:rgba(255,255,255,0.3); font-size:0.6rem; text-transform:uppercase;">Synchronizing with local frequency...</p>
        </div>
        
        <!-- HOLOGRAPHIC RADAR -->
        <div class="holographic-radar" style="width:200px; height:200px; margin:0 auto; position:relative; border-radius:50%; border:1px solid rgba(0, 229, 255, 0.1); background:radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%);">
           <div class="radar-sweep"></div>
           <div class="radar-core"></div>
           <div class="radar-target-dot" style="top:30%; left:60%;"></div>
           <div class="radar-target-dot" style="top:70%; left:20%;"></div>
        </div>

        <h1 class="countdown-timer" id="entry-timer" style="font-size:3rem; font-weight:900; color:#fff; font-family:var(--font-logo); margin-top:2rem;">00:15</h1>
      </div>
    `;

    const timerInterval = setInterval(() => {
      const diff = state.mockEntryState.unlockTime - Date.now();
      if (diff <= 0) {
        clearInterval(timerInterval);
        EntryPage.checkGeofenceAndUnlock(container);
        return;
      }
      const totalSec = Math.floor(diff / 1000);
      document.getElementById('entry-timer').innerText = `00:${String(totalSec).padStart(2, '0')}`;
    }, 1000);
  },

  checkGeofenceAndUnlock: async (container) => {
    const { distance } = getLocationState();
    container.innerHTML = `
      <div class="lockout-screen animated" style="text-align:center;">
        <div class="promo-card" style="border-color:#00ff66; padding:2rem;">
          <h2 style="color: #fff; margin-bottom:1.5rem;">🚨 IDENTITY MATCHED</h2>
          ${SystemBrainWidget.render(distance)}
          <button class="btn-primary" id="start-geo-verification" style="background: #00ff66; color:#000; font-weight: 900; margin-top:2rem;">GENERATE SECURE PASS</button>
        </div>
      </div>
    `;

    document.getElementById('start-geo-verification').addEventListener('click', () => {
      EntryPage.renderActivePass(container);
    });
  },

  renderActivePass: (container) => {
    const { distance } = getLocationState();
    const canSeeQR = distance !== null && distance <= 2.0;

    container.innerHTML = `
      <div class="lockout-screen animated" style="text-align: center;">
        <div class="promo-card" style="border-color:${canSeeQR ? '#00ff66' : '#ff003c'}">
          <h2 style="color: #fff; font-size:1.1rem; letter-spacing:2px;">${canSeeQR ? '⚡ ACCESS GRANTED' : '⚠️ RANGE EXCEEDED'}</h2>
          
          <div id="qr-zone" style="margin:2rem 0;">
            ${canSeeQR ? `
              <div id="live-qr-pattern" style="margin: 0 auto; width:180px; height:180px; background:#fff; border-radius:12px; padding:10px; box-shadow:0 0 30px rgba(0,255,102,0.3);"></div>
              <p id="qr-refresh-label" style="color: #00ff66; font-size:0.7rem; font-weight:700; margin-top:15px; letter-spacing:2px;">ROTATING FREQUENCY: 3s</p>
            ` : `
              <div style="padding:2rem; border:2px dashed #ff003c; border-radius:24px;">
                <p style="color: #ff003c; font-weight: 900; font-size:1.2rem; margin:0;">ENTRY LOCKED</p>
                <p style="color:rgba(255,0,60,0.6); font-size:0.8rem; margin-top:10px;">Proximity Violation: ${distance} km</p>
              </div>
            `}
          </div>

          ${SystemBrainWidget.render(distance)}
          
          <button class="btn-primary" id="reset-entry-btn" style="margin-top: 2rem; background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.3); font-size:0.7rem; height:40px;">RESET SIMULATION</button>
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

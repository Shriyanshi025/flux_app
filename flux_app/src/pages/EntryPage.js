import { state, saveEntryState } from '../core/state.js';
import { SLOT_CAPACITY } from '../core/constants.js';
import { authService } from '../services/authService.js';
import { uiUtils } from '../utils/uiUtils.js';
import { getLocationState, fetchUserLocation, calculateDistance } from '../services/locationService.js';
import { SystemBrainWidget } from '../components/SystemBrainWidget.js';
import { QRComponent } from '../components/QRComponent.js';

export const EntryPage = {
  render: (mountDashboardModule, renderMap) => {
    if (!authService.isAuth()) return;

    const content = `
      <div id="entry-container" style="width: 100%;">
        <div id="entry-view" style="width: 100%; display: flex; flex-direction: column;"></div>
      </div>
    `;

    mountDashboardModule(content, 1, 'ENTRY');
    const entryFeed = document.getElementById('entry-view');
    
    if (!state.mockEntryState.bookedSlot) {
      EntryPage.renderTimeSlots(entryFeed);
      if (authService.isGuest()) {
        const warning = document.createElement('div');
        warning.className = 'guest-warning-banner';
        warning.innerHTML = `You are using guest access. Booking and QR are for registered users.`;
        entryFeed.prepend(warning);
      }
    } else {
      EntryPage.renderProximityView(entryFeed, renderMap);
    }
  },

  renderTimeSlots: (container) => {
    const isGuest = authService.isGuest();
    const availableKeys = Object.keys(SLOT_CAPACITY);

    container.innerHTML = `
      <h2 style="color: #00ff66; text-align: center; margin-top: 2rem;">Choose Your Window</h2>
      <div class="entry-grid" style="display: grid; gap: 20px; padding: 20px;">
        ${availableKeys.map(key => {
          const cap = SLOT_CAPACITY[key];
          const pct = Math.round((cap.booked / cap.max) * 100);
          const isFull = cap.booked >= cap.max;
          const style = isGuest ? "opacity: 0.5; pointer-events: none;" : "";
          
          return `
            <div class="promo-card slot-card" data-time="${key}" style="${style}">
              <p style="color: ${cap.isPeak ? '#ffaa00' : '#00ff66'}; font-weight: 700;">${cap.label}</p>
              <p style="font-size: 0.8rem; color: var(--text-muted);">+${cap.points} FLUX Points</p>
              <div style="background: #222; height: 4px; margin: 10px 0;"><div style="width: ${pct}%; background: ${cap.isPeak ? '#ffaa00' : '#00ff66'}; height: 100%;"></div></div>
              <button class="btn-primary btn-book" ${isFull ? 'disabled' : ''}>${isFull ? 'FULL' : 'Book Window'}</button>
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
        EntryPage.renderLockout(container);
      });
    });
  },

  renderProximityView: (container, renderMap) => {
    const { selectedLocation, selectedLocationName, distance } = getLocationState();
    
    container.innerHTML = `
      <div class="promo-card" id="maps-engine-card" style="border-color: #00ff66;">
        ${selectedLocation ? `
           <p style="color: #00ff66; font-weight: 700;">${selectedLocationName}</p>
           <div id="google-maps-engine" style="height: 160px; background: #080808; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <p style="color: #00ff66; font-weight: 800;">${distance !== null ? `${distance} km` : 'Detecting...'}</p>
           </div>
           <button id="resync-maps-btn" class="btn-primary" style="margin-top: 10px;">Switch Location</button>
        ` : `
           <button class="btn-primary" id="launch-nav-btn">LAUNCH NAVIGATOR</button>
        `}
      </div>
      <div id="slots-section-view"></div>
    `;

    document.getElementById('resync-maps-btn')?.addEventListener('click', renderMap);
    document.getElementById('launch-nav-btn')?.addEventListener('click', renderMap);
    
    EntryPage.renderLockout(document.getElementById('slots-section-view'));
  },

  renderLockout: (container) => {
    container.innerHTML = `
      <div class="lockout-screen animated" style="text-align: center; padding: 20px;">
        <h2 style="color: #00e5ff;">PROXIMITY SCAN ACTIVE</h2>
        <div class="secure-qr-box" style="margin: 20px auto;"><div class="scanline"></div></div>
        <h1 class="countdown-timer" id="entry-timer">00:15</h1>
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
      <div class="lockout-screen animated">
        <h2 style="color: #fff;">🚨 Security Check</h2>
        ${SystemBrainWidget.render(distance)}
        <button class="btn-primary" id="start-geo-verification" style="background: #ffaa00; font-weight: 800;">Verify & Unlock QR</button>
      </div>
    `;

    document.getElementById('start-geo-verification').addEventListener('click', () => {
      EntryPage.renderActivePass(container);
    });
  },

  renderActivePass: (container) => {
    const { distance, selectedLocationName } = getLocationState();
    const canSeeQR = distance !== null && distance <= 2.0;

    container.innerHTML = `
      <div class="lockout-screen animated" style="text-align: center;">
        <h2 style="color: #fff;">${canSeeQR ? '⚡ FAST LANE ACTIVE' : '⚠️ OUTSIDE RANGE'}</h2>
        <div id="qr-zone">
          ${canSeeQR ? `
            <div id="live-qr-pattern" style="margin: 20px auto;"></div>
            <p id="qr-refresh-label" style="color: #00ff66;">Refreshing in 3s</p>
          ` : `
            <p style="color: #ff003c; font-weight: 900;">ENTRY LOCKED</p>
            <p>You are ${distance}km away. Move within 2km.</p>
          `}
        </div>
        ${SystemBrainWidget.render(distance)}
        <button class="btn-primary" id="reset-entry-btn" style="margin-top: 20px; opacity: 0.5;">Reset Demo</button>
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
      EntryPage.render(null, null); // Simplified re-render
    });
  }
};

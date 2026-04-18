import './style.css'

let p5Instance = null;
let bgShouldBeWaking = false;
let p5RetryCount = 0;
const MAX_P5_RETRIES = 50;

const STADIUMS = [
  { name: 'Sector 4 Arena (New York)', lat: 40.7128, lng: -74.0060 },
  { name: 'O2 London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo Dome', lat: 35.6762, lng: 139.6503 }
];

// Capacity Cap: each slot has a hard limit. Full slots vanish from the menu.
const SLOT_CAPACITY = {
  'relaxed':  { label: 'Relaxed Arrival (2h)', booked: 127, max: 500, points: 200, isPeak: false },
  'early':    { label: 'Early Bird (1.5h)',    booked: 312, max: 500, points: 100, isPeak: false },
  'standard': { label: 'Standard Entry (1h)',  booked: 489, max: 500, points: 50,  isPeak: false },
  'peak':     { label: 'Peak Pulse (30m)',     booked: 500, max: 500, points: 0,   isPeak: true  } // FULL
};

let mockEntryState = {
  bookedSlot: null,
  unlockTime: 0,
  isLate: false,
  timerInterval: null,
  lockedLocation: null // { name, lat, lng }
};

// --- FLASH MARKET: Simulation State ---
let mockMarketData = [
  { id: 'burgers-s4', name: 'Sector 4 Burgers', type: 'Main', wait: 8, inventory: 95, priceBase: 12.00, priceCurrent: 12.00, sector: 4, trend: 'stable' },
  { id: 'tacos-g-d', name: 'Gate D Tacos', type: 'Exotic', wait: 3, inventory: 88, priceBase: 10.00, priceCurrent: 10.00, sector: 2, trend: 'stable' },
  { id: 'pizza-w-w', name: 'West Wing Pizza', type: 'Main', wait: 12, inventory: 70, priceBase: 14.00, priceCurrent: 14.00, sector: 1, trend: 'stable' },
  { id: 'dogs-e-e', name: 'East End Dogs', type: 'Quick', wait: 5, inventory: 99, priceBase: 8.00, priceCurrent: 8.00, sector: 6, trend: 'stable' }
];

let marketInterval = null;

// --- NOTIFICATION THROTTLE STATE ---
const flashNotifTracker = {
  firstShown: false,
  extraCount: 0,
  lastShownAt: 0
};

function updateMarketSimulation() {
  mockMarketData.forEach(item => {
    // Random fluctuation: Wait time changes +/- 2 mins
    const deltaWait = Math.floor(Math.random() * 5) - 2;
    item.wait = Math.max(1, Math.min(25, item.wait + deltaWait));
    
    // Inventory slowly drops
    if (Math.random() > 0.7) item.inventory = Math.max(5, item.inventory - 1);
    
    // Trend indicator
    if (deltaWait > 0) item.trend = 'up';
    else if (deltaWait < 0) item.trend = 'down';
    else item.trend = 'stable';
    
    // Dynamic Arbitrage Trigger for "Bribe" prices
    // If wait > 15m, price drops. If wait < 5m, price stays base.
    if (item.wait > 18) {
       item.priceCurrent = (item.priceBase * 0.7).toFixed(2); // 30% Off Bribe
    } else {
       item.priceCurrent = item.priceBase.toFixed(2);
    }
  });

  // If we are currently in the Flash Market view, re-render it
  if (document.getElementById('market-feed')) {
    updateMarketDisplay();
  }
  
  // Watchtower: Check if Sector 4 (User Sector) is crushed
  const s4 = mockMarketData.find(m => m.id === 'burgers-s4');
  if (s4 && s4.wait > 15) {
     checkForArbitrageDeals(s4);
  }
}

function checkForArbitrageDeals(congestedStand) {
  const now = Date.now();
  
  // 1. Mandatory 3s lapse between ANY notifications
  if (now - flashNotifTracker.lastShownAt < 3000) return;

  // 2. Initial Post-Login Notification
  if (!flashNotifTracker.firstShown) {
     const dealStand = mockMarketData.find(m => m.wait < 6 && m.id !== congestedStand.id);
     if (dealStand) {
        showFlashDealAlert(congestedStand, dealStand);
        flashNotifTracker.firstShown = true;
        flashNotifTracker.lastShownAt = now;
     }
     return;
  }

  // 3. func1 & func2: Interest Check
  // If user hasn't visited Market yet, extraCount is 0 (stop).
  // If they HAVE visited, extraCount is reset to 2 per visit.
  if (flashNotifTracker.extraCount > 0) {
     const dealStand = mockMarketData.find(m => m.wait < 6 && m.id !== congestedStand.id);
     if (dealStand) {
        showFlashDealAlert(congestedStand, dealStand);
        flashNotifTracker.extraCount--;
        flashNotifTracker.lastShownAt = now;
     }
  }
}

// === GOOGLE SERVICES: FIREBASE ANALYTICS (Simulated) ===
const firebaseConfig = { projectId: 'engaged-hash-492618-d8', appId: 'flux-fortress-1' };
function logFirebaseEvent(evt, data = {}) {
  console.log(`[Firebase Analytics] Event: ${evt}`, { ...data, timestamp: Date.now() });
}
// Log initial session start
logFirebaseEvent('app_session_start', { vertical: 'Smart Infrastructure' });


// === PERSISTENCE HELPERS ===
function saveEntryState() {
  const { timerInterval, ...serializable } = mockEntryState;
  localStorage.setItem('flux_entry_state', JSON.stringify(serializable));
}

function loadEntryState() {
  const saved = localStorage.getItem('flux_entry_state');
  if (saved) {
    const data = JSON.parse(saved);
    mockEntryState = { ...mockEntryState, ...data };
  }
  
  // Also check for legacy or individual lock key
  const legacyLock = localStorage.getItem('flux_target_stadium');
  if (legacyLock && !mockEntryState.lockedLocation) {
    mockEntryState.lockedLocation = { name: legacyLock, lat: 40.7128, lng: -74.0060 }; // Defaulting for legacy
  }
}


// === UTILITY: Haversine distance in km ===
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// === QR CODE SVG GENERATOR ===
// Produces a visually authentic QR code SVG with randomised data modules.
// Seed changes every 3s so the code visually "rotates" and screenshots show
// a frozen frame that is different from the live display.
function generateQRSVG(seed) {
  const mods = 21;  // QR Version 1: 21×21
  const msz  = 9;   // pixels per module
  const total = mods * msz;

  let rng = (seed >>> 0);
  const rand = () => { rng = ((rng * 1664525 + 1013904223) >>> 0); return rng / 4294967296; };

  // Data modules — skip finder/timing reserved areas
  let data = '';
  for (let r = 0; r < mods; r++) {
    for (let c = 0; c < mods; c++) {
      if (r < 9 && c < 9)         continue; // top-left finder
      if (r < 9 && c > 12)        continue; // top-right finder
      if (r > 12 && c < 9)        continue; // bottom-left finder
      if (r === 6 || c === 6) {              // timing pattern
        if ((r + c) % 2 === 0) data += `<rect x="${c*msz}" y="${r*msz}" width="${msz}" height="${msz}" fill="#000"/>`;
        continue;
      }
      if (rand() > 0.52) data += `<rect x="${c*msz}" y="${r*msz}" width="${msz}" height="${msz}" fill="#000"/>`;
    }
  }

  // Finder pattern (7×7 with inner eye)
  const fp = (x, y) => `
    <rect x="${x}" y="${y}" width="${7*msz}" height="${7*msz}" fill="#000"/>
    <rect x="${x+msz}" y="${y+msz}" width="${5*msz}" height="${5*msz}" fill="#fff"/>
    <rect x="${x+2*msz}" y="${y+2*msz}" width="${3*msz}" height="${3*msz}" fill="#000"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}">
    <rect width="${total}" height="${total}" fill="#fff"/>
    ${data}
    ${fp(0, 0)}
    ${fp((mods-7)*msz, 0)}
    ${fp(0, (mods-7)*msz)}
  </svg>`;
}

// ============================================================
// SECURITY & SESSION WRAPPERS
// ============================================================
function isAuth() {
  return !!localStorage.getItem('flux_user');
}

function authGuard() {
  if (!isAuth()) {
     renderAuthPage();
     return false;
  }
  return true;
}

// ============================================================
// LOGIN / REGISTER SCREEN
// ============================================================
function renderAuthPage() {
  document.body.className = 'theme-auth';
  hibernateEverything(); 
  document.querySelector('#app').innerHTML = `
    <div id="app-container">
      <h1 class="logo">FLUX</h1>
      
      <div id="welcome-msg" class="hidden" style="text-align: center; margin-bottom: 2rem;">
        <p style="color: var(--text-muted);">Welcome back,</p>
        <h2 id="saved-username" style="margin:0; font-size: 2rem; color: var(--accent); text-shadow: 0 0 10px rgba(57, 255, 20, 0.5);"></h2>
      </div>

      <div class="auth-box">
        <div class="tabs" id="auth-tabs">
          <div class="tab active" data-target="login-form">Login</div>
          <div class="tab" data-target="register-form">Register</div>
        </div>

        <div id="login-form" class="animated">
          <button id="biometric-login-btn" class="btn-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3a2 2 0 0 0-2 2"></path><path d="M19 3a2 2 0 0 1 2 2"></path><path d="M21 19a2 2 0 0 1-2 2"></path><path d="M5 21a2 2 0 0 1-2-2"></path><path d="M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0"></path><path d="M9 16c0 1.657 1.343 3 3 3s3-1.343 3-3"></path><path d="M15 8V8.01"></path><path d="M9 8V8.01"></path></svg>
            FaceID / Fingerprint
          </button>
          
          <div style="margin-top: 1.5rem; text-align: center;">
            <a href="#" id="continue-guest-btn" style="color: rgba(255,255,255,0.4); text-decoration: none; font-size: 0.9rem; letter-spacing: 0.05em; transition: color 0.3s;">
              Continue as <span style="color: #ffaa00; font-weight: 700;">GUEST</span>
            </a>
          </div>
        </div>


        <div id="register-form" class="hidden animated">
          <div class="form-group">
            <label>Username</label>
            <input type="text" id="reg-username" placeholder="Enter username..." />
          </div>
          
          <div class="form-group">
            <label>Location</label>
            <input type="text" id="reg-location" placeholder="e.g. Current Location" />
            <button class="geo-btn" id="fetch-location-btn">Auto</button>
          </div>

          <div class="form-group">
            <label>Nearest Stadium</label>
            <input type="text" id="reg-stadium" placeholder="Select auto to compute..." readonly />
          </div>

          <button id="register-submit-btn" class="btn-primary" style="background: var(--accent); color: black;">
            Initialize Fortress
          </button>
        </div>
    </div>
  `;
  bindEvents();
  loadEntryState();
  checkExistingUser();
}


function computeNearestStadium(lat, lng) {
  // Haversine — finds closest stadium from array
  let nearest = STADIUMS[0];
  let minDist = Infinity;
  STADIUMS.forEach(s => {
    const dLat = (s.lat - lat) * Math.PI / 180;
    const dLng = (s.lng - lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat * Math.PI/180) * Math.cos(s.lat * Math.PI/180) * Math.sin(dLng/2)**2;
    const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    if (dist < minDist) { minDist = dist; nearest = s; }
  });
  return nearest;
}

function bindEvents() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const targetId = e.currentTarget.getAttribute('data-target');
      document.getElementById('login-form').classList.add('hidden');
      document.getElementById('register-form').classList.add('hidden');
      document.getElementById(targetId).classList.remove('hidden');
    });
  });

  const fetchBtn = document.getElementById('fetch-location-btn');
  if (fetchBtn) fetchBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
      fetchBtn.innerHTML = '...';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const stadium = computeNearestStadium(pos.coords.latitude, pos.coords.longitude);
          document.getElementById('reg-location').value = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
          document.getElementById('reg-stadium').value = stadium.name;
          fetchBtn.innerHTML = 'Done ✓';
        },
        () => {
          // Fallback if denied
          document.getElementById('reg-location').value = '40.7128, -74.0060';
          document.getElementById('reg-stadium').value = 'Sector 4 Arena (New York)';
          fetchBtn.innerHTML = 'Done ✓';
        }
      );
    } else {
      document.getElementById('reg-location').value = '40.7128, -74.0060';
      document.getElementById('reg-stadium').value = 'Sector 4 Arena (New York)';
      fetchBtn.innerHTML = 'Done ✓';
    }
  });

  const regBtn = document.getElementById('register-submit-btn');
  if (regBtn) regBtn.addEventListener('click', () => {
    const username = document.getElementById('reg-username').value.trim();
    if (username) {
      logFirebaseEvent('identity_created', { username });
      localStorage.setItem('flux_user', username);
      renderHomePage();

    } else {
      alert('Please enter a username');
    }
  });

  const bioBtn = document.getElementById('biometric-login-btn');
  if (bioBtn) bioBtn.addEventListener('click', () => {
    bioBtn.innerHTML = 'Scanning Biometrics...';
    bioBtn.disabled = true;
    setTimeout(() => {
      bioBtn.innerHTML = 'Authenticated ✓';
      bioBtn.style.background = 'var(--accent)';
      bioBtn.style.color = '#000';
      document.body.style.boxShadow = 'inset 0 0 100px var(--accent)';
      setTimeout(() => {
        document.body.style.boxShadow = '';
        renderHomePage();
      }, 1000);
    }, 1500);
  });

  const guestBtn = document.getElementById('continue-guest-btn');
  if (guestBtn) guestBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.setItem('flux_user', 'GUEST');
    renderHomePage();
  });
}


function checkExistingUser() {
  const user = localStorage.getItem('flux_user');
  if (user) {
    renderHomePage();
  }
}

function hibernateEverything() {
  bgShouldBeWaking = false;
  p5Instance?.hibernate();
  if (marketInterval) clearInterval(marketInterval);
  marketInterval = null;
}

function mountDashboardModule(moduleHtml, activeIndex = 0, pageTitle = '', backAction = renderHomePage) {
  const appEl = document.querySelector('#app');
  if (!appEl) return;

  // 1. Build Header
  const isHome = activeIndex === 0;
  const headerHtml = `
    <div class="top-nav">
      <div style="display: flex; align-items: center; gap: 1rem;">
        ${isHome ? `
          <button id="nav-menu-btn" class="nav-back-btn" title="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        ` : `
          <button id="nav-back-btn" class="nav-back-btn" title="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
        `}
        <div class="logo-small" id="top-logo" style="cursor: pointer;">${isHome ? 'FLUX' : (pageTitle || 'DASHBOARD')}</div>
      </div>
      <div class="avatar" style="cursor: pointer;" id="nav-avatar">
         ${getAvatarHTML(parseInt(localStorage.getItem('flux_avatar_idx') || 0), 28)}
      </div>
    </div>
  `;

  // 2. Build Shell
  appEl.innerHTML = `
    <div id="shell-container">
      <div id="shell-header">${headerHtml}</div>
      <div id="module-viewport" class="animated">
        ${moduleHtml}
      </div>
      <div id="shell-footer">
        ${getBottomNavHTML()}
      </div>
    </div>
  `;

  // 3. Bind Core Nav Listeners
  bindUniversalNav();
  setNavActive(activeIndex);

  // 4. Bind specific UI triggers
  document.getElementById('nav-back-btn')?.addEventListener('click', backAction);
  document.getElementById('nav-menu-btn')?.addEventListener('click', () => {
    renderSideNav();
    const nav = document.getElementById('side-nav');
    const isShowing = nav?.classList.contains('show');
    toggleSideNav(!isShowing);
  });
  
  document.getElementById('top-logo')?.addEventListener('click', () => {
    dismissAllOverlays();
    renderHomePage();
  });
  
  // Update Profile clicks
  document.querySelectorAll('#nav-avatar').forEach(el => {
    el.addEventListener('click', renderProfilePage);
  });
}

function renderHomePage() {
  if (!authGuard()) return;

  document.body.className = 'theme-dashboard';
  const hasPlayedDrone = sessionStorage.getItem('flux_drone_played');
  const appEl = document.querySelector('#app');

  if (hasPlayedDrone) {
    document.body.classList.add('theme-blue');
    document.body.classList.remove('theme-magenta');
    bgShouldBeWaking = true;
    p5Instance?.wake(); 
    
    // Mount Home Content via Shell
    renderHomeHTML();
    return;
  }


  const preloadImg = new Image();
  preloadImg.src = '/drone_shot.png';
  
  preloadImg.onload = () => {
    document.body.classList.add('theme-blue');
    document.body.classList.remove('theme-magenta');

    const droneEl = document.createElement('div');
    droneEl.id = 'intro-drone';
    droneEl.className = 'drone-zoom';
    appEl.parentNode.insertBefore(droneEl, appEl);
    appEl.innerHTML = '';

    setTimeout(() => {
      const drone = document.getElementById('intro-drone');
      if (drone) drone.remove();
      sessionStorage.setItem('flux_drone_played', 'true');
      bgShouldBeWaking = true;
      p5Instance?.wake(); 
      renderHomeHTML();
    }, 3000);
  };
}

function renderHomeHTML() {
  const content = `
    <div id="home-container" style="width: 100%;">
      <!-- User Greeting -->
      <div class="home-greeting" id="home-greeting" style="margin: 0 !important; text-align: center; color: #fff; font-size: 1.1rem; letter-spacing: 0.1em; text-transform: uppercase; font-family: var(--font-logo);">
        HELLO, ${localStorage.getItem('flux_user')?.split(' ')[0].toUpperCase() || 'GUEST'}
      </div>

      <!-- Scrollable content -->
      <div class="main-feed" id="home-feed" style="gap: 30px;">
        <div class="promo-card card-arrival">
          <h3>Arrival: Green Carpet</h3>
          <p>Book a 10-minute arrival slot up to 7 days in advance. Arrive on time, unlock the Fast Lane.</p>
          <div class="blurred-qr"></div>
          <button class="btn-primary" id="open-entry-btn">Book My Arrival Slot</button>
        </div>

        <div class="promo-card card-halftime">
          <h3>Halftime: Flash Market</h3>
          <p>40k people want Burgers. Tacos are empty. Take 50% Off deals and skip the concourse crush entirely.</p>
          <button class="btn-primary" id="open-market-btn">Live Heatmap Deals</button>
        </div>

        <div class="promo-card card-departure">
          <h3>Departure: Relaxed Stay</h3>
          <p>Avoid post-game congestion. Stay in your seat, unlock exclusive interviews, or redeem a 20% ride discount!</p>
          <button class="btn-primary" id="open-exit-btn">View Relaxed Stay Perks</button>
        </div>

        <!-- Copyright Footer -->
        <div class="copyright-footer">
          <p>&copy; 2026 Shriyanshi Sinha. All Rights Reserved.</p>
          <p class="footer-tagline">Engineered via Fortress Protocol</p>
        </div>
      </div>
    </div>
  `;

  mountDashboardModule(content, 0);

  // Home Specific Listeners
  document.getElementById('open-entry-btn')?.addEventListener('click', () => {
    renderEntryModule();
  });
  document.getElementById('open-market-btn')?.addEventListener('click', () => {
    renderFlashMarket();
  });
  document.getElementById('open-exit-btn')?.addEventListener('click', () => {
    renderExitModule();
  });

  // Start market background simulation if not running
  if (!marketInterval) {
    marketInterval = setInterval(updateMarketSimulation, 4000);
  }
}

function renderFlashMarket() {
  if (!authGuard()) return;

  const content = `
    <div class="market-ticker" id="market-ticker">
      <div class="ticker-tape" id="ticker-tape">
        <!-- Items injected by simulation loop (doubled for seamless loop) -->
      </div>
    </div>
    <div id="market-container" style="width:100%;">
      <div id="market-feed" class="market-feed">
        ${renderHeatmap()}
      </div>
    </div>
  `;

  mountDashboardModule(content, 2, 'MARKET');

  document.getElementById('nav-back-btn')?.addEventListener('click', renderHomePage);
  
  // Simulation Guard
  if (!marketInterval) {
    marketInterval = setInterval(updateMarketSimulation, 2000);
  }
  updateMarketSimulation(); 
}

function updateMarketDisplay() {
  const tapeEl = document.getElementById('ticker-tape');
  const feedEl = document.getElementById('market-feed');
  if (!feedEl) return;

  // Refresh Ticker tape — duplicate items for seamless infinite scroll
  if (tapeEl) {
    const items = mockMarketData.map(item => `
      <span class="ticker-item ${item.trend}">
        ${item.name.toUpperCase()} &nbsp;|&nbsp; ${item.wait}m 
        ${item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '—'}
      </span>
    `).join('');
    // Duplicate for seamless loop
    tapeEl.innerHTML = items + items;
  }

  // Refresh Feed
  feedEl.innerHTML = mockMarketData.map(item => {
    const density = (item.wait / 25) * 100;
    const barColor = density > 70 ? '#ff003c' : density > 40 ? '#ffaa00' : 'var(--accent)';
    const priceColor = item.priceCurrent < item.priceBase ? 'var(--accent)' : '#fff';

    return `
      <div class="stand-card">
        <div class="stand-header">
          <div class="stand-info">
            <h3>${item.name}</h3>
            <span class="type">${item.type} • SECTOR ${item.sector}</span>
          </div>
          <div class="stand-price">
            <span class="price-val" style="color: ${priceColor}">$${item.priceCurrent}</span>
            <span class="price-delta" style="color: ${priceColor}">
              ${item.priceCurrent < item.priceBase ? 'ARBITRAGE DEAL' : 'STANDARD PRICE'}
            </span>
          </div>
        </div>
        
        <div class="density-system">
          <div class="density-label">
            <span>CONGESTION: ${item.wait} MIN WAIT</span>
            <span>${Math.round(density)}% LOAD</span>
          </div>
          <div class="density-bar-container">
            <div class="density-bar" style="width: ${density}%; background: ${barColor}"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
function renderHeatmap() {
  return mockMarketData.map(item => {
    const density = (item.wait / 25) * 100;
    const barColor = density > 70 ? '#ff003c' : density > 40 ? '#ffaa00' : 'var(--accent)';
    const priceColor = item.priceCurrent < item.priceBase ? 'var(--accent)' : '#fff';

    return `
      <div class="stand-card">
        <div class="stand-header">
          <div class="stand-info">
            <h3>${item.name}</h3>
            <span class="type">${item.type} • SECTOR ${item.sector}</span>
          </div>
          <div class="stand-price">
            <span class="price-val" style="color: ${priceColor}">$${item.priceCurrent}</span>
            <span class="price-delta" style="color: ${priceColor}">
              ${item.priceCurrent < item.priceBase ? 'ARBITRAGE DEAL' : 'STANDARD PRICE'}
            </span>
          </div>
        </div>
        
        <div class="density-system">
          <div class="density-label">
            <span>CONGESTION: ${item.wait} MIN WAIT</span>
            <span>${Math.round(density)}% LOAD</span>
          </div>
          <div class="density-bar-container">
            <div class="density-bar" style="width: ${density}%; background: ${barColor}"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function showFlashDealAlert(congested, deal) {

  if (document.getElementById('flash-deal-active')) return;

  
  const overlay = document.createElement('div');
  overlay.id = 'flash-deal-active';
  overlay.className = 'flash-deal-overlay animated';
  overlay.innerHTML = `
    <div class="flash-card">
      <div class="flash-badge">FLASH DEAL FOUND</div>
      <div class="flash-header">
        <h2>Sector ${congested.sector} Spike!</h2>
      </div>
      <p class="flash-desc">
        Wait time at ${congested.name} reached ${congested.wait}m. 
        Switch to <strong>${deal.name}</strong> now and get 
        <span style="color: var(--accent); font-weight: 800;">30% OFF</span> everything!
      </p>
      <button class="btn-primary" id="take-deal-btn">Redeem at Gate D</button>
      <button id="close-deal-btn" style="margin-top: 1rem; background: none; border: none; color: #555; text-transform: uppercase; font-size: 0.7rem; cursor: pointer; letter-spacing: 0.1em;">Ignore Deal</button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('take-deal-btn').addEventListener('click', () => {
    logFirebaseEvent('flash_deal_redeemed', { from: congested.id, to: deal.id });
    overlay.remove();
    renderFlashMarket();
  });

  document.getElementById('close-deal-btn').addEventListener('click', () => {
    overlay.remove();
  });
}


function initSmartHomeLogic() {
  const homeFeed = document.getElementById('home-feed');
  if (!homeFeed) return;

  const cards = Array.from(homeFeed.querySelectorAll('.promo-card'));
  const sentinel = document.getElementById('end-sentinel');
  const copyright = document.getElementById('copyright-notice');

  // 1. Copyright Visibility (Intersection Observer)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        copyright.classList.add('visible');
      } else {
        copyright.classList.remove('visible');
      }
    });
  }, { threshold: 0.1 });

  if (sentinel) observer.observe(sentinel);

  // 2. Progressive Card Vanishing Logic
  // We use a linear interpolation (lerp) based on the next card's position.
  const STICKY_TOP = 100;

  const updateCardVis = () => {
    cards.forEach((card, i) => {
      const nextCard = cards[i + 1];
      if (!nextCard) return;

      const rect = card.getBoundingClientRect();
      const nextRect = nextCard.getBoundingClientRect();
      
      // We start fading when Card 2's top is 100px above Card 1's bottom.
      // We finish fading when Card 2's top is at 120px (slightly BEFORE sticky 100px)
      // to ensure Card 1 is ABSOLUTELY GONE before the overlay is perfect.
      const startFadeY = rect.bottom;
      const endFadeY   = STICKY_TOP + 20; // Added 20px buffer for absolute hiding
      
      let opacity = 1;
      let scale   = 1;
      let blur    = 0;

      if (nextRect.top <= startFadeY) {
        const range = startFadeY - endFadeY;
        const progress = (nextRect.top - endFadeY) / range;
        
        // Quadratic curve for a more cinematic fade
        opacity = Math.max(0, Math.min(1, progress * progress));
        
        scale = 0.95 + (0.05 * opacity);
        blur  = (1 - opacity) * 8;
      }
      
      card.style.opacity = opacity;
      card.style.transform = `scale(${scale})`;
      card.style.filter = `blur(${blur}px)`;
      
      // Strict hidden state
      if (opacity <= 0.01) {
        card.style.opacity = '0';
        card.style.visibility = 'hidden';
      } else {
        card.style.visibility = 'visible';
      }
      
      card.style.pointerEvents = opacity < 0.1 ? 'none' : 'auto';
    });
  };

  homeFeed.addEventListener('scroll', updateCardVis);
  // Initial check
  updateCardVis();
}

// (BindHomeEvents consolidated above)


/** Side Nav Logic */
function renderSideNav() {
  if (document.getElementById('side-nav')) return; // already exists

  const overlay = document.createElement('div');
  overlay.id = 'side-nav-overlay';
  overlay.className = 'side-nav-overlay';
  
  const nav = document.createElement('div');
  nav.id = 'side-nav';
  nav.className = 'side-nav';

  nav.innerHTML = `
    <div class="nav-panel-item" id="nav-prof">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      Profile
    </div>
    <div class="nav-panel-item" id="nav-about">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      About
    </div>
    <div class="nav-panel-item" id="nav-help">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      Help
    </div>
    <div class="nav-panel-item logout" id="nav-logout">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      Log Out
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(nav);

  overlay.addEventListener('click', () => toggleSideNav(false));
  
  document.getElementById('nav-logout').addEventListener('click', () => {
    localStorage.clear();
    location.reload();
  });

  document.getElementById('nav-prof').addEventListener('click', () => {
    toggleSideNav(false);
    renderProfilePage();
  });

  document.getElementById('nav-about').addEventListener('click', () => {
    toggleSideNav(false);
    renderAboutPage();
  });

  document.getElementById('nav-help').addEventListener('click', () => {
    toggleSideNav(false);
    renderHelpPage();
  });
}

/** 
 * PROFILE EDITING
 */
function renderProfileEdit() {
  if (!authGuard()) return;

  const currentName = localStorage.getItem('flux_user') || 'GUEST';
  const currentMob = localStorage.getItem('flux_mob') || '+91 ···· ····';
  const currentEmail = localStorage.getItem('flux_email') || 'alex@fortress.io';
  const currentAvatarIdx = parseInt(localStorage.getItem('flux_avatar_idx') || 0);
  const bioEnabled = localStorage.getItem('flux_bio') !== 'false';

  const draft = {
    user: currentName,
    mob: currentMob,
    email: currentEmail,
    bio: bioEnabled,
    avatar: currentAvatarIdx
  };

  const content = `
    <div class="main-feed" style="gap:1.5rem; padding-top:10px;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <div style="position: relative; width: fit-content; margin: 0 auto 1.5rem auto;">
          <div id="edit-avatar-container" class="avatar" style="width: 80px; height: 80px; background: ${getAvatarTheme(draft.avatar).bg}; border-width: 3px;">
             ${getAvatarHTML(draft.avatar, 40)}
          </div>
          <div id="change-avatar-btn" style="position: absolute; bottom: 0; right: 0; background: var(--accent); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid var(--bg-core); cursor: pointer;">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </div>
        </div>
        <h2 id="edit-display-name" style="margin: 0; font-size: 1.8rem; color: #fff; font-family:var(--font-logo);">${currentName.toUpperCase()}</h2>
        <p style="color: var(--accent); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 8px;">Edit Protocol Identity</p>
      </div>

      <div style="width: 100%; max-width: 450px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.2rem;">
        ${renderEditRow('Protocol Username', draft.user, 'edit-user')}
        ${renderEditRow('Frequency (Mob)', draft.mob, 'edit-mob')}
        ${renderEditRow('Signal (Email)', draft.email, 'edit-email')}
        
        <div class="promo-card" style="display: flex; justify-content: space-between; align-items: center; border-color: rgba(255,255,255,0.1);">
          <div>
            <h4 style="margin:0; color:#fff; font-size:0.9rem;">Biometric Pulse ID</h4>
            <p style="margin:4px 0 0 0; color:var(--text-muted); font-size:0.75rem;">Enable high-speed terminal decrypt.</p>
          </div>
          <div id="bio-toggle" style="width:50px; height:26px; border-radius:30px; background:${draft.bio ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}; position:relative; cursor:pointer; transition:all 0.3s;">
             <div style="position:absolute; top:3px; left:${draft.bio ? '27px' : '3px'}; width:20px; height:20px; background:#fff; border-radius:50%; transition:all 0.3s;"></div>
          </div>
        </div>

        <div style="margin-top: 2rem;">
          <button id="edit-confirm-btn" class="btn-primary" style="width: 100%; background: var(--accent); color: #000; font-weight: 800;">CONFIRM IDENTITY SYNC</button>
        </div>
      </div>
    </div>
  `;

  mountDashboardModule(content, 0, 'PROTOCOL EDIT', renderProfilePage);

  // Bind Switch Avatar
  document.getElementById('change-avatar-btn').addEventListener('click', () => {
    showAvatarPicker(draft.avatar, (newIdx) => {
      draft.avatar = newIdx;
      const theme = getAvatarTheme(newIdx);
      const container = document.getElementById('edit-avatar-container');
      container.style.background = theme.bg;
      container.innerHTML = getAvatarHTML(newIdx, 40);
    });
  });

  // Bind Bio Toggle
  document.getElementById('bio-toggle').addEventListener('click', () => {
    draft.bio = !draft.bio;
    document.getElementById('bio-toggle').style.background = draft.bio ? 'var(--accent)' : 'rgba(255,255,255,0.1)';
    document.getElementById('bio-toggle').firstElementChild.style.left = draft.bio ? '27px' : '3px';
  });

  // Confirm Sync
  document.getElementById('edit-confirm-btn').addEventListener('click', () => {
    localStorage.setItem('flux_user', draft.user);
    localStorage.setItem('flux_mob', draft.mob);
    localStorage.setItem('flux_email', draft.email);
    localStorage.setItem('flux_bio', draft.bio);
    localStorage.setItem('flux_avatar_idx', draft.avatar);
    
    // Global Header Sync
    const navAvatar = document.getElementById('nav-avatar');
    if (navAvatar) navAvatar.innerHTML = getAvatarHTML(draft.avatar, 28);
    
    renderProfilePage();
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  });

  // Inline Pencil Edits
  document.querySelectorAll('.edit-pencil').forEach(p => {
    p.addEventListener('click', (e) => {
      const fieldId = e.currentTarget.getAttribute('data-field');
      const container = document.getElementById(fieldId).parentNode;
      const currentVal = document.getElementById(fieldId).innerText;
      
      container.innerHTML = `<input type="text" id="${fieldId}-input" value="${currentVal}" style="background: transparent; border: none; border-bottom: 2px solid var(--accent); color: #fff; font-size: 1.1rem; width: 100%; outline: none;" autofocus />`;
      
      const input = document.getElementById(`${fieldId}-input`);
      input.addEventListener('blur', () => {
         draft[fieldId.replace('edit-', '')] = input.value;
         container.innerHTML = `<p id="${fieldId}" style="color: #fff; font-size: 1.1rem; margin: 0;">${input.value}</p>`;
         if (fieldId === 'edit-user') document.getElementById('edit-display-name').innerText = input.value.toUpperCase();
      });
    });
  });
}

function renderEditRow(label, value, id) {
  return `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
      <div style="flex: 1;">
        <p style="color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; margin: 0 0 4px 0;">${label}</p>
        <p id="${id}" style="color: #fff; font-size: 1.1rem; margin: 0;">${value}</p>
      </div>
      <div class="edit-pencil" data-field="${id}" style="cursor: pointer; color: var(--accent); opacity: 0.6;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
      </div>
    </div>
  `;
}

function toggleSideNav(isOpen) {
  const nav = document.getElementById('side-nav');
  const overlay = document.getElementById('side-nav-overlay');
  if (!nav || !overlay) return; // Not created yet

  if (isOpen) {
    nav.classList.add('show');
    overlay.classList.add('show');
  } else {
    nav.classList.remove('show');
    overlay.classList.remove('show');
  }
}

function dismissAllOverlays() {
  toggleSideNav(false);
  document.getElementById('flash-deal-active')?.remove();
  document.querySelectorAll('.profile-overlay').forEach(el => el.remove());
}

function setNavActive(targetIndex) {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach((n, i) => {
    n.classList.remove('active');
    n.style.color = '';
    if (i === targetIndex) {
      n.classList.add('active');
      n.style.color = n.getAttribute('data-color');
      if (navigator.vibrate) navigator.vibrate(50);
    }
  });
}

/**
 * PROFILE PAGE: Main Dashboard Module
 */
function renderProfilePage() {
  if (!authGuard()) return;

  const username = localStorage.getItem('flux_user') || 'User';
  const avatarIdx = parseInt(localStorage.getItem('flux_avatar_idx') || 0);

  const content = `
    <div class="main-feed" style="gap: 1.5rem; padding-top: 10px;">
      <div class="curved-deck" style="padding: 2.5rem 2rem; border-radius: 28px; width: 100%; max-width: 500px; margin: 0 auto; background: rgba(0,0,0,0.4);">
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 1.2rem;">
            <div class="avatar" style="width: 60px; height: 60px; background: ${getAvatarTheme(avatarIdx).bg}; border-width: 2.5px;">
                ${getAvatarHTML(avatarIdx, 30)}
            </div>
            <div style="text-align: left;">
              <h2 style="color: var(--accent); margin: 0; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8;">Identity Pass</h2>
              <p style="font-size: 1.4rem; margin: 2px 0 0 0; color: #fff; font-weight: 700; line-height: 1;">${username}</p>
            </div>
          </div>
          <div id="prof-page-edit" style="background: var(--accent); color: #000; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid var(--bg-core); cursor: pointer; box-shadow: 0 4px 15px rgba(0,255,102,0.3); transition: transform 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </div>
        </div>

        <div class="promo-card" id="prof-card-data" style="text-align: left; width: 100%; border-color: rgba(255,255,255,0.2); margin-bottom: 2rem; background: rgba(255,255,255,0.03);">
            <p style="color: #00ffcc; text-transform: uppercase; font-size: 0.8rem; margin:0 0 5px 0;">Trust Level</p>
            <p style="margin: 0; color: white; font-weight: 700; font-size: 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1rem;">Zero-Trust Biometric Secure ✓</p>
            <p style="color: #00ffcc; text-transform: uppercase; font-size: 0.8rem; margin:0 0 5px 0;">Identity Status</p>
            <p style="margin: 0; color: white; line-height: 1.4;">Personal information encrypted & stored consistently with Fortress ID protocols.</p>
            <button id="prof-logout-btn" style="margin-top: 2rem; width: 100%; background: rgba(255, 60, 60, 0.1); border: 1px solid #ff3c3c; color: #ff3c3c; padding: 0.8rem; border-radius: 10px; cursor: pointer; font-weight: 800; font-size: 0.85rem; letter-spacing: 0.05em;">
              LOG OUT / RESET IDENTITY
            </button>
        </div>
      </div>
    </div>
  `;

  mountDashboardModule(content, 0, 'IDENTITY PASS');

  document.getElementById('prof-page-edit').addEventListener('click', renderProfileEdit);
  document.getElementById('prof-logout-btn').addEventListener('click', () => {
    hibernateEverything();
    localStorage.clear();
    location.reload();
  });
}

/**
 * ABOUT PAGE: Smart Congestion Orchestration
 */
function renderAboutPage() {
  if (!authGuard()) return;

  const content = `
    <div class="main-feed" style="gap: 1.5rem; padding-top: 10px;">
      <div class="promo-card" style="border-color: var(--accent); background: rgba(57, 255, 20, 0.05);">
        <h2 style="font-family: var(--font-logo); font-size: 1.8rem; margin-bottom: 1rem; color: var(--accent);">SMART CONGESTION ORCHESTRATION</h2>
        <p style="color: #fff; line-height: 1.6; font-size: 1rem;">
          FLUX is not just a dashboard; it is the central nervous system for crowd dynamics. 
          By combining real-time mass-flow analytics with economic incentives, we orchestrate 
          the movement of thousands to eliminate friction before it begins.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
        <div class="promo-card">
          <h3 style="color: var(--accent); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Live Navigation</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.5;">
            Integration with Google Maps Cloud Platform enables real-time stadium frequency locking 
            and precise proximity triggers for secure arrival slot authentication.
          </p>
        </div>

        <div class="promo-card">
          <h3 style="color: var(--accent); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">The Flow Engine</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.5;">
            Our proprietary algorithms predict mass congestion at gates and concourses 15 minutes before they peak, 
            dynamically shifting loads to under-utilized infrastructure.
          </p>
        </div>
        
        <div class="promo-card">
          <h3 style="color: var(--accent); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Incentive Arbitrage</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.5;">
            We use surge-based discounting to "bribe" crowd segments away from high-density zones, 
            turning stadium bottlenecks into optimal throughput opportunities.
          </p>
        </div>

        <div class="promo-card">
          <h3 style="color: var(--accent); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Zero-Trust Transit</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.5;">
            Every move is secured by the Fortress Protocol. Your identity is your key, 
            authenticated via biometric pulse-points at every gate, lounge, and exit.
          </p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 2rem; opacity: 0.5; font-size: 0.7rem; letter-spacing: 0.2em;">
        BUILD v1.0.4 • THE FORTRESS PROTOCOL
      </div>
    </div>
  `;

  mountDashboardModule(content, 0, 'FLUX');
}


/**
 * HELP PAGE: Comprehensive FAQs & Contact
 */
function renderHelpPage() {
  if (!authGuard()) return;

  const faqs = [
    { q: "What is an Arbitrage Deal?", a: "When a specific vendor or gate is over-capacity, we lower prices at nearby empty locations to shift the crowd. These are live, one-time deals based on real-time heatmap data." },
    { q: "How do Arrival Slots work?", a: "To ensure a smooth Green Carpet experience, you book a 10-minute entry window. Arriving on-time unlocks Fast Lane access and priority security screening." },
    { q: "How is my Flow Tier calculated?", a: "Based on your transport profile (Walking, Public Transit, or Rideshare), we assign you to Sprinter (Urgent), Stroller (Flexible), or Anchor (Relaxed) departure groups." },
    { q: "Is my biometric data safe?", a: "All Fortress ID biometric data is encrypted on-device. FLUX never stores raw fingerprints or facial scans on central servers, adhering to Zero-Trust infrastructure." },
    { q: "What does the Heatmap represent?", a: "The Market Heatmap shows real-time congestion levels across all stadium sectors. Red zones are at peak load; green zones are empty and offer the best Arbitrage discounts." },
    { q: "How do I switch exclusive channels?", a: "In the Exclusive Content module, use the channel switcher at the top to toggle between Locker Room Interviews and the Main Stage performance feeds." },
    { q: "What is 'Stadium Frequency Locking'?", a: "Powered by Google Maps, this feature allows you to calibrate your exact target location. Locking the frequency ensures that the Proximity Protocol can safely activate your arrival QR code only when you are on-site." }
  ];

  const content = `
    <div class="main-feed" style="gap: 1.5rem; padding-top: 10px;">
      
      <!-- FAQ Section -->
      <section>
        <h2 style="font-family: var(--font-logo); font-size: 1.2rem; margin-bottom: 1.2rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em;">Protocol Intelligence (FAQs)</h2>
        <div style="display: flex; flex-direction: column; gap: 0.8rem;">
          ${faqs.map((faq, i) => `
            <div class="promo-card" style="padding: 1rem; cursor: pointer;" onclick="const a = document.getElementById('faq-a-${i}'); a.style.display = a.style.display === 'none' ? 'block' : 'none';">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0; color: #fff; font-size: 0.95rem;">${faq.q}</h4>
                <span style="color: var(--accent); font-size: 1.2rem;">+</span>
              </div>
              <p id="faq-a-${i}" style="display: none; margin-top: 0.8rem; color: var(--text-muted); font-size: 0.85rem; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.8rem;">
                ${faq.a}
              </p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Contact Us Form -->
      <section style="margin-top: 1rem;">
        <h2 style="font-family: var(--font-logo); font-size: 1.2rem; margin-bottom: 1.2rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em;">Transmit Support Request</h2>
        <div class="promo-card" id="contact-form-container">
          <div class="form-group" style="margin-bottom: 0.8rem;">
            <p style="color: var(--accent); font-size: 0.75rem; font-weight: 700; margin-bottom: 8px;">HOW DO I SET MY STADIUM?</p>
            <p style="color: var(--text-muted); font-size: 0.8rem; line-height: 1.4; margin-bottom: 1.2rem;">Navigate to the <b>Entry</b> module and click the "Live Navigation Mode" card. This will open the Google Maps engine where you can lock your stadium frequency for the Proximity Protocol.</p>
          </div>
          <div class="form-group" style="margin-bottom: 1.2rem;">
            <label style="color: var(--accent); font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em;">Transmission Subject</label>
            <input type="text" id="help-subject" placeholder="e.g. Identity Access Issue" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 100%; padding: 0.8rem; border-radius: 8px; margin-top: 4px; outline: none;" />
          </div>
          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="color: var(--accent); font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em;">Signal Message</label>
            <textarea id="help-message" placeholder="Type your message..." style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 100%; padding: 0.8rem; border-radius: 8px; margin-top: 4px; outline: none; min-height: 100px; resize: none;"></textarea>
          </div>
          <button class="btn-primary" id="help-transmit-btn" style="width: 100%; background: var(--accent); color: #000; font-weight: 800;">
            TRANSMIT FREQUENCY
          </button>
        </div>
      </section>

      <div style="height: 40px;"></div>
    </div>
  `;

  mountDashboardModule(content, 0, 'FLUX');

  // Bind Contact Form
  document.getElementById('help-transmit-btn')?.addEventListener('click', () => {
    const sub = document.getElementById('help-subject').value;
    const msg = document.getElementById('help-message').value;

    if (!sub || !msg) {
      alert("Transmission incomplete. Subject and Message required.");
      return;
    }

    const btn = document.getElementById('help-transmit-btn');
    btn.innerHTML = "WAVELENGTH ENCRYPTED ✓";
    btn.style.background = "#fff";
    btn.disabled = true;

    if (navigator.vibrate) navigator.vibrate([20, 40, 20]);

    setTimeout(() => {
      const container = document.getElementById('contact-form-container');
      if (container) {
          container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">📡</div>
              <h3 style="color: #fff; margin-bottom: 0.5rem;">Signal Transmitted</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem;">Orbiting relay has received your frequency. Response expected in 14ms.</p>
              <button class="btn-primary" style="margin-top: 1.5rem; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1);" onclick="renderHomePage()">Return to Dashboard</button>
            </div>
          `;
      }
    }, 1500);
  });
}




// ============================================================
// ENTRY MODULE — GREEN CARPET
// ============================================================
// ============================================================
// ENTRY MODULE — GREEN CARPET
// ============================================================
function renderEntryModule() {
  if (!authGuard()) return;

  const content = `
    <div id="entry-container" style="width: 100%;">
      <div id="entry-view" style="width: 100%; display: flex; flex-direction: column; align-items: stretch;">
         <!-- Content injected here by sub-renderers -->
      </div>
    </div>
  `;

  mountDashboardModule(content, 1, 'ENTRY');
  
  const entryFeed = document.getElementById('entry-view');

  if (!mockEntryState.bookedSlot) {
    // Show nudge if Guest
    const isGuest = localStorage.getItem('flux_user') === 'GUEST';
    if (isGuest) {
       const nudge = document.createElement('div');
       nudge.style = "background: rgba(0, 255, 204, 0.1); border: 1px solid rgba(0, 255, 204, 0.3); padding: 0.8rem; border-radius: 12px; margin-bottom: 2.5rem; text-align: center; color: #00ffcc; font-size: 0.8rem; font-weight: 500; font-family: var(--font-primary);";
       nudge.innerHTML = `⚡ Register your <b style="color:#fff;">Fortress ID</b> to earn and save 500 Entry Points!`;
       entryFeed.prepend(nudge);
    }
    renderTimeSlots(entryFeed);
  } else {
    renderLockout(entryFeed);
  }
}

function renderTimeSlots(container) {
  // Show all slots, but handle FULL ones visually
  const availableKeys = Object.keys(SLOT_CAPACITY);


  const slotCards = availableKeys.map(key => {
    const cap = SLOT_CAPACITY[key];
    const pct = Math.round((cap.booked / cap.max) * 100);
    const remaining = cap.max - cap.booked;
    const almostFull = pct >= 80;

    const isFull = cap.booked >= cap.max;
    
    return `
      <div class="promo-card slot-card ${isFull ? 'slot-full' : ''}" data-time="${key}"
           style="padding: 1rem; --card-theme: ${cap.isPeak ? '#ffaa00' : '#00ff66'}; --card-bg: ${cap.isPeak ? 'rgba(40,25,0,0.4)' : 'rgba(0,26,10,0.4)'}; 
           ${isFull ? 'opacity: 0.4; filter: grayscale(1); cursor: not-allowed; pointer-events: none;' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
          <p style="color: ${cap.isPeak ? '#ffaa00' : '#00ff66'}; margin: 0; font-weight: 700;">${cap.label}</p>
          <span style="font-size:0.7rem; color: ${isFull ? '#888' : (almostFull ? '#ff6b35' : 'var(--text-muted)')};">${isFull ? 'FULL' : `${remaining} left`}</span>
        </div>
        <p style="font-size: 0.78rem; margin: 3px 0 8px 0; color: var(--text-muted);">${cap.points > 0 ? `+${cap.points} FLUX Points 🎖️` : 'Standard Entry'}</p>
        <!-- Capacity bar -->
        <div style="background: rgba(255,255,255,0.08); border-radius: 4px; height: 4px; margin-bottom: 10px; overflow: hidden;">
          <div style="height:100%; width:${pct}%; background: ${isFull ? '#444' : (almostFull ? '#ff6b35' : (cap.isPeak ? '#ffaa00' : '#00ff66'))}; border-radius: 4px; transition: width 0.5s;"></div>
        </div>
        <button class="btn-primary btn-book" ${isFull ? 'disabled' : ''}
                style="padding: 0.5rem 1rem; font-size: 0.8rem; ${isFull ? 'background: #222; border-color: #333; color: #666;' : (cap.isPeak ? 'background:#ffaa00; border-color:#ffaa00; color:black;' : '')}">
          ${isFull ? 'Capacity Full' : 'Book Arrival Window'}
        </button>
      </div>`;

  }).join('');

  container.innerHTML = `
      <div id="entry-feed" style="width: 100%;">
        <h2 style="color: #00ff66; margin-top: 2rem; margin-bottom: 1.5rem; text-align: center;">Choose Your Window</h2>
        
        <div class="promo-card" id="maps-engine-card" 
             style="border-color: #00ff66; background: rgba(0, 255, 102, 0.05); padding: 2rem; margin-bottom: 2.5rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; position: relative; overflow: hidden;">
            
            ${mockEntryState.lockedLocation ? `
               <!-- LOCKED STATE -->
               <div style="position: absolute; top:0; right: 0; background: #00ff66; color: #000; padding: 4px 12px; font-size: 0.65rem; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; border-bottom-left-radius: 12px; z-index: 10;">
                 LOCKED
               </div>

               <p style="color: #00ff66; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.1em; display: flex; align-items: center; gap: 8px;">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                 Location Locked
               </p>
               <h3 style="color: #fff; margin: 0 0 4px 0; font-size: 1.2rem;">${mockEntryState.lockedLocation.name}</h3>
               <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem;">This is your selected destination. Proximity Protocol synced.</p>
               
               <div id="google-maps-engine" style="width: 100%; height: 160px; background: #080808; border-radius: 12px; border: 1px solid rgba(0, 255, 102, 0.2); position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; background-image: radial-gradient(circle at 50% 50%, rgba(0, 255, 102, 0.1) 0%, transparent 70%);">
                  <div style="text-align: center; z-index: 5;">
                     <div style="font-size: 1.5rem; margin-bottom: 8px;">📍</div>
                     <p style="margin: 0; font-size: 0.75rem; color: #fff; font-weight: 600;">${mockEntryState.lockedLocation.lat.toFixed(4)}, ${mockEntryState.lockedLocation.lng.toFixed(4)}</p>
                     <p style="margin: 4px 0 0 0; font-size: 0.65rem; color: #00ff66; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8;">Frequency Stable</p>
                  </div>
                  
                  <button id="resync-maps-btn" style="position: absolute; bottom: 12px; font-size: 0.7rem; background: rgba(0,255,102,0.1); border: 1px solid rgba(0,255,102,0.3); color: #00ff66; padding: 4px 12px; border-radius: 20px; cursor: pointer; backdrop-filter: blur(5px); transition: all 0.2s;">
                    Edit / Switch Location
                  </button>
               </div>
            ` : `
               <!-- UNLOCKED STATE -->
               <p style="color: #00ff66; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.1em;">Live Navigation Mode</p>
               <p style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem;">Syncing with <strong style="color:#fff;">Google Maps Platform</strong>. Tap to set your destination stadium and initialize the Proximity Protocol.</p>
               
               <div id="google-maps-engine" style="width: 100%; height: 160px; background: #080808; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    <div style="position: absolute; inset: 0; opacity: 0.3; background-image: radial-gradient(circle at 20% 30%, #333 1px, transparent 1px), radial-gradient(circle at 60% 70%, #333 1.5px, transparent 1px); background-size: 40px 40px;"></div>
                    <div style="position: relative; z-index: 5; text-align: center;">
                       <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ff66" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                       <p style="margin: 5px 0 0 0; font-size: 0.7rem; color: #00ff66; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Click to Launch Maps</p>
                    </div>
                    <div style="position: absolute; bottom: 8px; right: 8px; opacity: 0.6;">
                       <img src="https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_light_color_92x30dp.png" alt="Google" style="height: 12px;">
                    </div>
               </div>
            `}
        </div>

        <div class="entry-grid" style="display: grid; grid-template-columns: 1fr; gap: var(--global-gap);">${slotCards}</div>
      </div>
  `;

  container.querySelectorAll('.btn-book').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('[data-time]');
      const slotKey = card ? card.getAttribute('data-time') : null;
      if (!slotKey) return;
      
      // Increment booked count
      SLOT_CAPACITY[slotKey].booked = Math.min(SLOT_CAPACITY[slotKey].booked + 1, SLOT_CAPACITY[slotKey].max);
      mockEntryState.bookedSlot = SLOT_CAPACITY[slotKey].label;
      logFirebaseEvent('entry_slot_booked', { slotType: slotKey });
      mockEntryState.unlockTime = Date.now() + (15 * 1000); // 15s demo countdown
      mockEntryState.isLate = false;
      saveEntryState();
      renderLockout(container);

    });
  });

  document.getElementById('maps-engine-card')?.addEventListener('click', renderMapModule);

  bindUniversalNav();
}

function renderLockout(container) {
  container.innerHTML = `
     <div class="lockout-screen animated" style="width: 100%; text-align: center;">
        <!-- High-Fidelity Heads Up Notice -->
        <div style="width: 100%; background: #ffaa00; color: #000; padding: 0.8rem; border-radius: 12px; margin-bottom: 2rem; text-align: center; font-weight: 700; font-size: 0.85rem; box-shadow: 0 10px 20px rgba(0,0,0,0.3);">
           ⚠️ HEADS UP: Please reach the required proximity range for enabling the QR code otherwise QR won't be enabled.
        </div>

        <p style="color: rgba(255,255,255,0.25); text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.2em; margin-bottom: 0.5rem;">Secure Session Active</p>
        <h2 style="color: #fff; margin: 0 0 2rem 0; font-size: 1.2rem; font-weight: 300;">PROXIMITY SCAN FOR <span style="color: var(--accent); font-weight: 700;">${(localStorage.getItem('flux_user') || 'GUEST').toUpperCase()}</span></h2>

        <h2 style="color: #00e5ff; text-transform: uppercase; margin: 0 0 0.5rem 0; font-size: 1.5rem; letter-spacing: 0.08em;">Transit Mode</h2>

        <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0 0 1.5rem 0;">Sleeping Key mapped to: <b style="color: #fff;">${mockEntryState.bookedSlot}</b>. Stand by for unlock.</p>
        
        <div class="qr-payload-container" style="width: 100%; display: flex; flex-direction: column; align-items: center;">
           <div class="secure-qr-box" style="background: rgba(10,10,20,0.6); position: relative;">
              <div class="scanline"></div>
              <p style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.15); font-size:0.7rem; font-family:var(--font-heading); text-transform:uppercase; letter-spacing:0.15em;">Locked</p>
           </div>
           <h1 class="countdown-timer" id="entry-timer" style="margin-top: 1rem;">00:15</h1>
           <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.4rem;">Fast Lane unlocks at zero</p>
        </div>

        <div class="promo-card info-banner" style="border-color: #ffaa00; background: rgba(50, 30, 0, 0.4); padding: 1rem; margin-top: 1.5rem; text-align: left;">
           <p style="color: #ffaa00; font-weight: 700; margin: 0 0 6px 0; text-transform: uppercase; font-size: 0.78rem;">ℹ️ Heads Up</p>
           <p style="color: rgba(255,255,255,0.85); font-size: 0.82rem; margin: 0; line-height: 1.6;">Your code encrypts and refreshes every 3 seconds once unlocked. Show it live at the gate — screenshots won't capture the active payload.</p>
        </div>

        <div class="promo-card" style="border-color: rgba(255,255,255,0.08); background: rgba(10,10,20,0.5); padding: 1rem; margin-top: 1rem; text-align: left;">
           <p style="color: rgba(255,180,0,0.8); font-weight: 700; margin: 0 0 6px 0; text-transform: uppercase; font-size: 0.75rem;">⚠️ Miss Your Window?</p>
           <p style="color: rgba(255,255,255,0.65); font-size: 0.8rem; margin: 0; line-height: 1.6;">Your Green Pass turns Grey if you arrive outside your slot. You'll join the standard queue and lose Fast Lane access for this event.</p>
        </div>
     </div>
  `;

  if (mockEntryState.timerInterval) clearInterval(mockEntryState.timerInterval);

  mockEntryState.timerInterval = setInterval(() => {
    const diff = mockEntryState.unlockTime - Date.now();

      if (diff <= 0) {
      clearInterval(mockEntryState.timerInterval);
      mockEntryState.timerInterval = null;
      renderActivationNotice(container);
      return;
    }

    const timerEl = document.getElementById('entry-timer');
    if (!timerEl) { clearInterval(mockEntryState.timerInterval); return; }

    const totalSec = Math.floor(diff / 1000);
    const ms = Math.floor((diff % 1000) / 10);
    const ss = totalSec % 60;
    const mm = Math.floor(totalSec / 60) % 60;
    timerEl.innerText = `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}.${String(ms).padStart(2,'0')}`;
  }, 50);
}function renderActivationNotice(container) {
  let autoTimer = null;
  const triggerVerification = () => {
    if (autoTimer) clearTimeout(autoTimer);
    checkGeofenceAndUnlock(container);
  };

  container.innerHTML = `
    <div class="lockout-screen animated">
      <!-- Heads Up Notice Bar -->
      <div style="width: 100%; background: #ffaa00; color: #000; padding: 0.8rem; border-radius: 12px; margin-bottom: 1.5rem; text-align: center; font-weight: 700; font-size: 0.85rem; box-shadow: 0 10px 20px rgba(0,0,0,0.3);">
         ⚠️ HEADS UP: Please reach the required proximity range for enabling the QR code otherwise QR won't be enabled.
      </div>

      <h2 style="color: #fff; text-transform: uppercase; margin: 0 0 0.8rem 0; font-size: 1.3rem;">🚨 Security Check</h2>
      <p style="color: rgba(255,255,255,0.7); font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.4;">
        To activate your <b>Fast Lane QR</b>, we must verify your proximity to the stadium gate.
      </p>

      <div class="promo-card" style="border-color: #ffaa00; background: rgba(10,10,20,0.4); text-align: left; padding: 1.2rem;">
        <p style="color: #ffaa00; font-weight: 700; font-size: 0.8rem; margin-bottom: 8px; text-transform: uppercase;">Zero-Trust Verification</p>
        <p style="color: rgba(255,255,255,0.6); font-size: 0.8rem; line-height: 1.6; margin: 0;">
          Physical proximity ensures that only attendees physically present at the gate can claim their slot. Evaluation demo bypass is active.
        </p>
      </div>

      <div style="margin-top: 2rem; width: 100%;">
        <button class="btn-primary" id="start-geo-verification" style="background: #ffaa00; color: black; border-color: #ffaa00;">
          Verify & Unlock QR
        </button>
      </div>
    </div>
  `;

  document.getElementById('start-geo-verification').addEventListener('click', triggerVerification);
  
  // Autonomous demo trigger
  autoTimer = setTimeout(triggerVerification, 2500);
}

function checkGeofenceAndUnlock(container) {
  const stadium = mockEntryState.lockedLocation || STADIUMS[0];
  // Start with a detecting state for realism
  let geoResult = { mode: 'demo', dist: '...', stadium: stadium.name };

  // Trigger real location check (in bg) to update distance label if possible
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const dist = haversineKm(pos.coords.latitude, pos.coords.longitude, stadium.lat, stadium.lng);
      geoResult.dist = dist.toFixed(1);
      if (dist <= 1.0) geoResult.mode = 'real';
      
      // Update label live
      const distLabel = document.getElementById('proximity-dist-label');
      if (distLabel) {
        distLabel.innerHTML = `📍 Distance: <span style="color:#fff;">${geoResult.dist} km</span> from <b style="text-decoration: underline;">${stadium.name}</b>`;
      }
    }, (err) => {
       console.warn('GPS access denied or timed out.');
       const distLabel = document.getElementById('proximity-dist-label');
       if (distLabel) {
         distLabel.innerHTML = `⚠️ <span style="color:#ffaa00;">Enable location access</span> to calculate distance and arrival time to <b style="text-decoration: underline;">${stadium.name}</b>`;
       }
    }, { timeout: 5000, enableHighAccuracy: true });
  }

  // Instant render
  renderActivePass(container, geoResult);
}

function renderActivePass(container, geoContext) {
  const validUntil = Date.now() + (60 * 1000); // 60s demo = real 10-min window
  let qrRotateInterval = null;
  let validityInterval = null;
  let qrSeed = Date.now();

  const isDemo = geoContext.mode === 'demo';
  const slotCode = (mockEntryState.bookedSlot || 'PASS').replace(/[^A-Z0-9]/gi, '').toUpperCase().substring(0, 8);
  const uniqueId = Math.floor(Math.random() * 90000 + 10000);

  container.innerHTML = `
    <div class="lockout-screen animated">
      <!-- Success Status Header (Pixel-perfect mirror of the Verification Bar) -->
      <div style="width: 100%; background: #00ff66; color: #000; padding: 0.8rem; border-radius: 12px; margin-bottom: 2rem; text-align: center; font-weight: 700; font-size: 0.85rem; box-shadow: 0 10px 20px rgba(0,0,0,0.3);">
         ⚡ FAST LANE ACTIVE: Your secure entry key is verified.
      </div>

      <p style="color: rgba(255,255,255,0.25); text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.2em; margin-bottom: 0.5rem;">Identity Match Confirmed</p>
      <h2 style="color: #fff; margin: 0 0 2.5rem 0; font-size: 1.2rem; font-weight: 300;">AUTHENTICATED PASS FOR <span style="color: #00ff66; font-weight: 700;">${(localStorage.getItem('flux_user') || 'GUEST').toUpperCase()}</span></h2>


      <div class="qr-payload-container" style="width: 100%;">
        <!-- Centered QR Box -->
        <div class="secure-qr-box active" id="active-qr-box"
             style="width: 80vw; max-width: 320px; aspect-ratio: 1/1; height: auto; border-radius: 24px; padding: 1.5rem; position: relative; margin: 0 auto; background: rgba(0, 255, 102, 0.03); border: 1px solid rgba(0, 255, 102, 0.3); box-shadow: 0 0 30px rgba(0,255,102,0.1);">
          <div class="live-qr" id="live-qr-pattern" style="width: 100%; height: 100%;"></div>
          <div class="scanline"></div>
        </div>
        
        <p style="color:rgba(255,255,255,0.4); font-size:0.75rem; font-family:monospace; letter-spacing:0.22em; margin-top:2.5rem;">FLUX·${slotCode}·${uniqueId}</p>
        <p style="color: #00ff66; font-size: 0.85rem; margin: 10px 0; font-weight: 500;" id="qr-refresh-label">Refreshing in 3s</p>

        <!-- Dynamic Validity Pill -->
        <div style="margin: 0 auto; margin-top:1.5rem; padding:0.6rem 2.5rem; border-radius:30px; background:rgba(0,255,102,0.1); border:1px solid rgba(0,255,102,0.4); display: inline-block;">
          <p style="color:#00ff66; font-size:1.1rem; margin:0; font-weight:800;">Valid for: <span id="validity-timer">01:00</span></p>
        </div>

        <!-- Expanded Accent Divider (Full-Width boundary) -->
        <div id="proximity-dist-label" style="margin-top: 3.5rem; color: #ffaa00; font-size: 1rem; font-weight: 600; border-top: 2px solid rgba(255,170,0,0.2); padding-top: 1.5rem; width: 100%;">
           📍 Distance: <span style="color:#fff;">${geoContext.dist || '??'} km</span> from <b style="text-decoration: underline;">${geoContext.stadium || 'Target Stadium'}</b>
        </div>
      </div>

      <button class="btn-primary" id="reset-entry-btn" style="margin-top:2.5rem; background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: #888; font-size: 0.75rem;">Reset Demo State</button>
    </div>
  `;

  // === Inject initial QR ===
  const injectQR = () => {
    const el = document.getElementById('live-qr-pattern');
    if (el) el.innerHTML = generateQRSVG(qrSeed);
  };
  injectQR();

  // QR rotation every 3 seconds
  let countdown = 3;
  qrRotateInterval = setInterval(() => {
    countdown--;
    const label = document.getElementById('qr-refresh-label');
    if (!label) { clearInterval(qrRotateInterval); return; }
    if (countdown <= 0) {
      countdown = 3;
      qrSeed = Date.now(); // New seed = visually new QR
      injectQR();
    }
    label.textContent = `Refreshing in ${countdown}s`;
  }, 1000);

  // Validity countdown
  validityInterval = setInterval(() => {
    const remaining = Math.max(0, Math.floor((validUntil - Date.now()) / 1000));
    const vEl = document.getElementById('validity-timer');
    if (!vEl) { clearInterval(validityInterval); clearInterval(qrRotateInterval); return; }
    const vm = Math.floor(remaining / 60);
    const vs = remaining % 60;
    vEl.textContent = `${String(vm).padStart(2,'0')}:${String(vs).padStart(2,'0')}`;
    if (remaining <= 0) {
      clearInterval(validityInterval);
      clearInterval(qrRotateInterval);
      renderExpiredPass(container); // === LATE PENALTY ===
    }
  }, 1000);

  document.getElementById('reset-entry-btn').addEventListener('click', () => {
    clearInterval(qrRotateInterval);
    clearInterval(validityInterval);
    mockEntryState.bookedSlot = null;
    mockEntryState.unlockTime = 0;
    renderEntryModule();
  });
}
function renderExpiredPass(container) {
  container.innerHTML = `
     <div class="lockout-screen animated">
        <h2 style="color: #888; text-transform: uppercase; margin: 0 0 0.5rem 0;">🔒 Pass Expired</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0 0 2rem 0;">Your 10-minute Green Carpet window has closed.</p>

        <div class="secure-qr-box" style="background: rgba(30,30,30,0.8); border: 2px solid #444; width:220px; height:160px; border-radius:10px; display:flex; align-items:center; justify-content:center;">
           <p style="color: #555; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.15em;">Grey Pass</p>
        </div>

        <div class="promo-card" style="border-color: #555; background: rgba(20,20,20,0.6); padding: 1rem; margin-top: 1.5rem;">
           <p style="color: #aaa; font-weight: 700; font-size: 0.8rem; margin: 0 0 5px 0;">Standard Queue Only</p>
           <p style="font-size: 0.82rem; margin: 0 0 1rem 0; color: rgba(255,255,255,0.5); line-height: 1.6;">You missed the Fast Lane window. Please proceed to the standard entry gate. Book earlier next time for rewards!</p>
           <button class="btn-primary" id="rebook-btn" style="background: #444; border-color: #666;">Book a New Slot</button>
        </div>
     </div>
  `;

  document.getElementById('rebook-btn')?.addEventListener('click', () => {
    mockEntryState.bookedSlot = null;
    mockEntryState.unlockTime = 0;
    renderEntryModule();
  });
}

function renderMapModule() {
  if (!authGuard()) return;

  const content = `
    <div class="main-feed" style="padding-top: 10px; padding-bottom: 100px;">
      <div class="promo-card" style="border-color: #00ff66; background: rgba(0, 255, 102, 0.05); padding: 1.5rem; margin-bottom: 2rem;">
        <h2 style="color: #00ff66; margin-bottom: 0.5rem; font-size: 1.2rem;">STADIUM NAVIGATOR</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.4;">
          Synchronizing with <b>Google Maps Platform</b>. Search for a stadium to initialize the Proximity Protocol.
        </p>
      </div>

      <div style="width: 100%; height: 500px; min-height: 500px; flex-shrink: 0; background: #000; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); position: relative; overflow: hidden; margin-bottom: 2.5rem;">
        <!-- Search UI Parent Container (Protected from squashing) -->
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 120px; z-index: 10; display: flex; align-items: center; padding: 0 1.5rem; background: linear-gradient(to bottom, rgba(10,10,12,0.9), transparent); gap: 12px;">
          <input type="text" id="map-search-input" placeholder="Search Stadium Frequency (Press Enter)..." 
                 style="flex: 1; height: 60px; min-height: 60px; flex-shrink: 0; background: #0a0a0c; border: 1px solid var(--accent); color: #fff; padding: 0 1.5rem; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); outline: none; font-size: 1rem;">
          <button id="external-maps-btn" title="Launch External Search" style="flex-shrink: 0; background: var(--accent); border: none; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 15px rgba(0,255,102,0.3);">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
          </button>
        </div>
        
        <iframe 
          id="map-iframe"
          width="100%" 
          height="100%" 
          frameborder="0" 
          style="border:0; filter: invert(90%) hue-rotate(180deg) brightness(0.9); padding-top: 100px;" 
          src="https://www.google.com/maps/embed/v1/search?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&q=stadium+near+London"
          allowfullscreen>
        </iframe>
      </div>

      <div style="text-align: center; margin-bottom: 3rem;">
        <button class="btn-primary" id="confirm-stadium-btn" style="background: var(--accent); color: #000; font-weight: 800; padding: 1.2rem 3rem; border-radius: 50px; box-shadow: 0 0 40px rgba(0,255,102,0.3); width: 100%; border: none; cursor: pointer; font-size: 1rem; letter-spacing: 0.1em; text-transform: uppercase;">
            LOCK STADIUM FREQUENCY
        </button>
      </div>

      <div class="promo-card" style="text-align: left; padding: 1.2rem; border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); line-height: 1.6;">
        <p style="color: var(--accent); font-weight: 700; font-size: 0.75rem; text-transform: uppercase; margin: 0 0 8px 0;">📡 Proximity Protocol Active</p>
        <p style="color: rgba(255,255,255,0.6); font-size: 0.8rem; margin: 0;">
           Your biometric pass will only unlock upon physical arrival within 500m of this location. Initialization confirms your target gate.
        </p>
      </div>

      <div style="height: 100px;"></div>
    </div>
  `;

  mountDashboardModule(content, 1, 'MAPS ENGINE');

  const input = document.getElementById('map-search-input');
  const iframe = document.getElementById('map-iframe');
  
  input?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      const query = input.value.trim();
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
      if (query) {
        iframe.src = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${encodeURIComponent(query)}`;
        logFirebaseEvent('stadium_search', { query });
      }
    }
  });

  document.getElementById('external-maps-btn')?.addEventListener('click', () => {
    const query = (input?.value.trim() || 'stadium').replace(/\\s+/g, '+');
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
    logFirebaseEvent('external_maps_launched', { query });
  });

  document.getElementById('confirm-stadium-btn')?.addEventListener('click', () => {
    const selectedName = input?.value.trim() || 'Detected Stadium';
    
    // Try to find a match in STADIUMS array, otherwise default or create dynamic
    const match = STADIUMS.find(s => s.name.toLowerCase().includes(selectedName.toLowerCase()));
    
    mockEntryState.lockedLocation = match ? { ...match } : {
        name: selectedName,
        lat: 40.7128, // Default fallback
        lng: -74.0060,
        isCustom: true
    };

    localStorage.setItem('flux_target_stadium', mockEntryState.lockedLocation.name);
    saveEntryState();
    
    logFirebaseEvent('stadium_frequency_locked', { 
        location: mockEntryState.lockedLocation.name,
        lat: mockEntryState.lockedLocation.lat,
        lng: mockEntryState.lockedLocation.lng
    });
    
    const btn = document.getElementById('confirm-stadium-btn');
    btn.innerHTML = "FREQUENCY LOCKED ✓";
    btn.style.background = "#fff";
    btn.disabled = true;

    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);

    setTimeout(renderEntryModule, 1000);
  });
}

// App initialization consolidated to bootstrapper at EOF
// function initApp() { ... }
/**
 * AVATAR ENGINE & PICKER
 */
function getAvatarTheme(idx) {
  const themes = [
    { bg: 'linear-gradient(135deg, #00ff66, #00d2ff)', color: 'rgba(255,255,255,0.9)' }, // Matrix Green
    { bg: 'linear-gradient(135deg, #ff00ff, #7000ff)', color: 'rgba(255,255,255,0.9)' }, // Cyber Magenta
    { bg: 'linear-gradient(135deg, #ffaa00, #ff4e00)', color: 'rgba(255,255,255,0.9)' }, // Gold Pulse
    { bg: 'linear-gradient(135deg, #00e5ff, #004a99)', color: 'rgba(255,255,255,0.9)' }  // Arctic Blue
  ];
  return themes[idx] || themes[0];
}

function getAvatarHTML(idx, size) {
  const theme = getAvatarTheme(idx);
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${theme.color}"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`;
}

function showAvatarPicker(currentIdx, onSelect) {
  const overlay = document.createElement('div');
  overlay.className = 'profile-overlay animated';
  overlay.style = "position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:3000; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 2rem;";

  overlay.innerHTML = `
    <div style="width: 100%; max-width: 500px; background: #0a0a0c; border: 1px solid rgba(255,255,255,0.15); border-radius: 40px; padding: 3rem; display: flex; flex-direction: column; align-items: center; box-shadow: 0 50px 100px rgba(0,0,0,0.9); margin-top: 50px;">
      <h2 style="color: var(--accent); margin-bottom: 2rem; text-transform: uppercase; letter-spacing: 0.1em; font-size: 1.2rem;">Choose Your Preset</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        ${[0, 1, 2, 3].map(i => `
          <div class="avatar-option" data-idx="${i}" style="width: 80px; height: 80px; border-radius: 50%; background: ${getAvatarTheme(i).bg}; cursor: pointer; border: ${i === currentIdx ? '4px solid #fff' : '2px solid rgba(255,255,255,0.1)'}; transition: 0.3s; display:flex; align-items:center; justify-content:center;">
             ${getAvatarHTML(i, 40)}
          </div>
        `).join('')}
      </div>
      <button id="close-picker" style="margin-top: 3rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #888; padding: 0.8rem 2rem; border-radius: 30px; cursor: pointer;">Cancel</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelectorAll('.avatar-option').forEach(opt => {
    opt.addEventListener('click', () => {
      onSelect(parseInt(opt.getAttribute('data-idx')));
      overlay.remove();
    });
  });

  document.getElementById('close-picker').addEventListener('click', () => overlay.remove());
}

function getBottomNavHTML() {
  return `
    <!-- Smart Copyright (Fixed above Nav) -->
    <div id="copyright-notice">© 2026 FLUX Crowd Orchestration</div>

    <!-- Sticky Bottom Nav -->
    <div class="bottom-nav">
      <div class="nav-item" data-color="var(--accent)" data-index="0" id="nav-home">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Home
      </div>
      <div class="nav-item" data-color="#fffca3" data-index="1" id="nav-entry-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
        Entry
      </div>
      <div class="nav-item" data-color="#8400ff" data-index="2" id="nav-break">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        Break
      </div>
      <div class="nav-item" data-color="#ff003c" data-index="3" id="nav-exit">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Exit
      </div>
    </div>
  `;
}


function bindUniversalNav() {
  // Navigation Icons
  document.getElementById('nav-home')?.addEventListener('click', () => {
    dismissAllOverlays();
    setNavActive(0);
    renderHomePage(); 
  });

  document.getElementById('nav-entry-btn')?.addEventListener('click', () => {
    dismissAllOverlays();
    setNavActive(1);
    renderEntryModule(); 
  });
  
  document.getElementById('nav-break')?.addEventListener('click', () => {
    dismissAllOverlays();
    setNavActive(2);
    renderFlashMarket();
  });

  document.getElementById('nav-exit')?.addEventListener('click', () => {
    dismissAllOverlays();
    setNavActive(3); 
    renderExitModule();
  });

  // Profile Avatar (Universal)
  document.querySelectorAll('#nav-avatar').forEach(el => {
    el.addEventListener('click', () => {
      dismissAllOverlays();
      renderProfilePage(); // Fixed function name mismatch
    });
  });

  // Dashboard Back Behavior is now handled centrally in mountDashboardModule
}




// ─── EXIT: URGENCY ENGINE ─────────────────────────────────────────────────────
let exitInterval = null;
let exitCountdown = 20 * 60; // 20 minutes in seconds
let exitPhase = 1; // 1=Context Check, 2=Tiered Sort, 3=Release

const exitTierData = {
  sprinter: { count: 1240, label: 'Priority Departure', desc: 'Urgent — Train / Flight', color: '#ff003c', icon: '🚆', action: 'FAST TRACK ACTIVE', pct: 22 },
  stroller:  { count: 2870, label: 'Flexible Departure',  desc: 'Standard — Rideshare',     color: '#ffaa00', icon: '🚗', action: 'SURGE ALERT SENT',  pct: 51 },
  anchor:    { count: 1630, label: 'Relaxed Departure',   desc: 'Stay & Save — Local',      color: '#8400ff', icon: '🎬', action: 'SOFT EXIT LOCKED',  pct: 27 },
};

function getExitPhaseLabel(p) {
  return ['', 'PRE-CHECK', 'SORTING', 'RELEASE ACTIVE'][p];
}

function getExitPhaseDesc(p) {
  return [
    '',
    'Analyzing attendee transport profiles…',
    'Assigning Tiers: Priority → Flexible → Relaxed',
    'Group 1 released. Group 2 in 15 min. Group 3 in 30 min.'
  ][p];
}

function getUserTier() {
  // Simulated: derive from localStorage or default to stroller
  const t = localStorage.getItem('flux_exit_tier') || 'stroller';
  return exitTierData[t];
}

function fmtCountdown(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function renderExitModule() {
  if (!authGuard()) return;

  const tier = getUserTier();

  const content = `
    <div id="exit-container" style="width:100%;">

      <!-- ① Phase Status Bar (like market ticker) -->
      <div class="market-ticker" id="exit-ticker" style="padding:0.75rem 1rem; display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em;">Phase</span>
          <span id="exit-phase-badge" style="background:#ff003c; color:#fff; font-size:0.7rem; font-family:var(--font-logo); padding:2px 10px; border-radius:20px; font-weight:700; letter-spacing:0.05em;">${getExitPhaseLabel(exitPhase)}</span>
        </div>
        <div style="flex:1; font-size:0.75rem; color:var(--text-muted); font-family:var(--font-logo);" id="exit-phase-desc">${getExitPhaseDesc(exitPhase)}</div>
        <div style="font-family:var(--font-logo); font-size:1rem; color:#ff003c; letter-spacing:0.1em; font-weight:700;">
          NEXT RELEASE IN <span id="exit-countdown">${fmtCountdown(exitCountdown)}</span>
        </div>
      </div>

      <!-- ② Main Feed -->
      <div class="main-feed" style="gap:1.2rem;">

        <!-- Personal Flow Score Card -->
        <div class="promo-card" id="exit-personal-card" style="border-color:${tier.color}; background:${tier.color}18; position:relative; overflow:hidden;">
          <div style="position:absolute; top:0; right:0; width:120px; height:120px; background:${tier.color}10; border-radius:50%; transform:translate(30%,-30%);"></div>
          <div style="display:flex; align-items:center; gap:1rem;">
            <div style="font-size:2.5rem;">${tier.icon}</div>
            <div style="text-align:left;">
              <p style="color:${tier.color}; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.1em; margin:0 0 3px 0; font-family:var(--font-logo);">Your Flow Tier</p>
              <h2 style="color:#fff; margin:0; font-size:1.6rem; font-weight:900; line-height:1;">${tier.label.toUpperCase()}</h2>
              <p style="color:var(--text-muted); font-size:0.8rem; margin:4px 0 0 0;">${tier.desc}</p>
            </div>
            <div style="margin-left:auto; text-align:right;">
              <div style="background:${tier.color}; color:#000; font-size:0.65rem; font-weight:900; padding:4px 12px; border-radius:20px; letter-spacing:0.08em;">${tier.action}</div>
            </div>
          </div>

          <!-- Surge / incentive info row -->
          <div id="exit-personal-info" style="border-top:1px solid ${tier.color}30; padding-top:0.8rem; margin-top:0.5rem;">
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.5rem; text-align:center;">
              <div>
                <p style="color:${tier.color}; font-size:1.1rem; font-weight:700; margin:0;" id="exit-stat-wait">4 min</p>
                <p style="color:var(--text-muted); font-size:0.65rem; margin:2px 0 0 0; text-transform:uppercase;">Gate Wait</p>
              </div>
              <div>
                <p style="color:${tier.color}; font-size:1.1rem; font-weight:700; margin:0;" id="exit-stat-surge">2.8×</p>
                <p style="color:var(--text-muted); font-size:0.65rem; margin:2px 0 0 0; text-transform:uppercase;">Surge Now</p>
              </div>
              <div>
                <p style="color:${tier.color}; font-size:1.1rem; font-weight:700; margin:0;" id="exit-stat-crowd">68%</p>
                <p style="color:var(--text-muted); font-size:0.65rem; margin:2px 0 0 0; text-transform:uppercase;">Gate Load</p>
              </div>
            </div>
          </div>

          <button class="btn-primary" id="exit-action-btn" style="width:100%; background:${tier.color}; color:${tier.color === '#ff003c' ? '#fff' : '#000'};">
            ${tier === exitTierData.sprinter ? '🚆 Open Fast Track Route' : tier === exitTierData.stroller ? '💰 View Surge Timeline' : '🎬 Unlock Exclusive Content'}
          </button>
        </div>

        <!-- Crowd Wave Meter -->
        <div class="promo-card" style="border-color:rgba(255,255,255,0.08);">
          <p style="color:var(--text-muted); font-size:0.65rem; text-transform:uppercase; letter-spacing:0.1em; margin:0 0 0.8rem 0;">Live Crowd Wave Status</p>
          <div style="display:flex; flex-direction:column; gap:0.6rem;">
            ${Object.entries(exitTierData).map(([k, t]) => `
              <div style="display:flex; align-items:center; gap:0.8rem;">
                <span style="font-size:1rem; width:24px;">${t.icon}</span>
                <div style="flex:1;">
                  <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                    <span style="font-size:0.75rem; color:#fff; font-weight:600;">${t.label}</span>
                    <span style="font-size:0.7rem; color:${t.color}; font-family:var(--font-logo);">${t.count.toLocaleString()} attendees</span>
                  </div>
                  <div style="background:rgba(255,255,255,0.06); border-radius:4px; height:6px; overflow:hidden;">
                    <div style="width:${t.pct}%; height:100%; background:${t.color}; border-radius:4px; transition:width 1s ease;"></div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- The 3 Tier Strategy Cards -->
        <p style="color:var(--text-muted); font-size:0.65rem; text-transform:uppercase; letter-spacing:0.12em; margin:0; padding:0 0 0.2rem 0;">Flow Tier Breakdown</p>

        <!-- Tier 1: Priority Departure -->
        <div class="stand-card" style="border-color:#ff003c40; padding:1rem 1.2rem;">
          <div class="stand-header">
            <div class="stand-info">
              <div class="type" style="color:#ff003c;">🚆 Tier 1 · Urgent</div>
              <h3 style="margin-top:4px;">Priority Departure</h3>
            </div>
            <div class="stand-price" style="background:#ff003c15; padding:6px 12px; border-radius:8px; border:1px solid #ff003c40;">
              <span class="price-val" style="color:#ff003c; font-size:1rem;">GREEN</span>
              <span class="price-delta" style="color:#ff003c;">FAST TRACK ▲</span>
            </div>
          </div>
          <p style="color:var(--text-muted); font-size:0.8rem; line-height:1.5; margin:0;">Attendees with imminent train or flight connections. They receive a <strong style="color:#ff003c;">Fast Track</strong> notification — their exit route is highlighted on the AR map, guiding them to the least-congested gate immediately.</p>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <span style="background:#ff003c15; border:1px solid #ff003c30; color:#ff003c; font-size:0.65rem; padding:3px 10px; border-radius:20px;">Gate C Priority</span>
            <span style="background:#ff003c15; border:1px solid #ff003c30; color:#ff003c; font-size:0.65rem; padding:3px 10px; border-radius:20px;">Empty Corridor</span>
            <span style="background:#ff003c15; border:1px solid #ff003c30; color:#ff003c; font-size:0.65rem; padding:3px 10px; border-radius:20px;">AR Route Active</span>
          </div>
        </div>

        <!-- Tier 2: Flexible Departure -->
        <div class="stand-card" style="border-color:#ffaa0040; padding:1rem 1.2rem;">
          <div class="stand-header">
            <div class="stand-info">
              <div class="type" style="color:#ffaa00;">🚗 Tier 2 · Standard</div>
              <h3 style="margin-top:4px;">Flexible Departure</h3>
            </div>
            <div class="stand-price" style="background:#ffaa0015; padding:6px 12px; border-radius:8px; border:1px solid #ffaa0040;">
              <span class="price-val" style="color:#ffaa00; font-size:1rem;" id="surge-now">$50</span>
              <span class="price-delta" style="color:#ffaa00;">NOW ▼ WAIT</span>
            </div>
          </div>
          <p style="color:var(--text-muted); font-size:0.8rem; line-height:1.5; margin:0;">Rideshare attendees receive a <strong style="color:#ffaa00;">Surge Alert</strong>. The app shows real savings: waiting just 20 minutes cuts their ride cost significantly — money is the motivator, not a mandate.</p>
          <div style="background:rgba(255,170,0,0.06); border:1px solid #ffaa0030; border-radius:10px; padding:0.8rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="text-align:center;">
                <p style="color:#ff003c; font-size:1.2rem; font-weight:700; margin:0;" id="surge-price-now">$50</p>
                <p style="color:var(--text-muted); font-size:0.65rem; margin:2px 0 0 0;">Leave Now</p>
              </div>
              <div style="color:var(--text-muted); font-size:0.8rem;">→</div>
              <div style="text-align:center;">
                <p style="color:#ffaa00; font-size:1.2rem; font-weight:700; margin:0;">$20</p>
                <p style="color:var(--text-muted); font-size:0.65rem; margin:2px 0 0 0;">Wait 20 min</p>
              </div>
              <div style="color:var(--text-muted); font-size:0.8rem;">→</div>
              <div style="text-align:center;">
                <p style="color:var(--accent); font-size:1.2rem; font-weight:700; margin:0;">$12</p>
                <p style="color:var(--text-muted); font-size:0.65rem; margin:2px 0 0 0;">Wait 40 min</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tier 3: Relaxed Departure -->
        <div class="stand-card" style="border-color:#8400ff40; padding:1rem 1.2rem;">
          <div class="stand-header">
            <div class="stand-info">
              <div class="type" style="color:#8400ff;">🎬 Tier 3 · Stay & Save</div>
              <h3 style="margin-top:4px;">Relaxed Departure</h3>
            </div>
            <div class="stand-price" style="background:#8400ff15; padding:6px 12px; border-radius:8px; border:1px solid #8400ff40;">
              <span class="price-val" style="color:#8400ff; font-size:1rem;">LOCKED</span>
              <span class="price-delta" style="color:#8400ff;">15 MIN ⏳</span>
            </div>
          </div>
          <p style="color:var(--text-muted); font-size:0.8rem; line-height:1.5; margin:0;">Local and flexible attendees receive the <strong style="color:#8400ff;">Soft Exit</strong>. Their exit pass is locked for 15 minutes in exchange for exclusive locker room interview content streaming live on the screen.</p>
          <div id="locker-access-trigger" style="background:rgba(132,0,255,0.06); border:1px solid #8400ff30; border-radius:10px; padding:0.8rem; display:flex; align-items:center; gap:0.8rem; cursor:pointer;">
            <span style="font-size:1.5rem;">🎙️</span>
            <div>
              <p style="color:#8400ff; font-size:0.75rem; font-weight:700; margin:0;">LIVE: Locker Room Access</p>
              <p style="color:var(--text-muted); font-size:0.7rem; margin:3px 0 0 0;">Captain's post-match interview · Exclusive to Relaxed attendees</p>
            </div>
            <div style="margin-left:auto; background:#8400ff; color:#fff; font-size:0.65rem; padding:4px 10px; border-radius:20px; font-weight:700;" id="anchor-timer">15:00</div>
          </div>
        </div>

        <!-- Executive Summary: 4 Pillars -->
        <div class="promo-card" style="border-color:rgba(255,255,255,0.1); background:rgba(255,255,255,0.02);">
          <p style="color:var(--text-muted); font-size:0.65rem; text-transform:uppercase; letter-spacing:0.12em; margin:0 0 1rem 0;">The 4 Strategic Pillars</p>
          <div style="display:flex; flex-direction:column; gap:0.8rem;">
            ${[
              { icon:'✈️', title:'Priority Queuing',     body:'Attendees with urgent connections (trains/flights) leave first. This reduces the immediate crush at the gates.' },
              { icon:'🎬', title:'Relaxed Stay Rewards',  body:'Attendees who stay just 15 minutes longer get exclusive video content, avoiding the peak exit rush.' },
              { icon:'💰', title:'Live Savings Alerts',  body:'Showing real-time ride costs helps attendees choose to wait for lower prices, naturally thinning the crowd.' },
              { icon:'🛡️', title:'Safety & Speed',       body:'By spreading out the departure times, we ensure a safer, faster, and less stressful exit for everyone.' },
            ].map(p => `
              <div style="display:flex; gap:0.8rem; align-items:flex-start; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.8rem;">
                <span style="font-size:1.3rem; flex-shrink:0;">${p.icon}</span>
                <div>
                  <p style="color:#fff; font-weight:700; font-size:0.85rem; margin:0 0 3px 0;">${p.title}</p>
                  <p style="color:var(--text-muted); font-size:0.75rem; line-height:1.5; margin:0;">${p.body}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    </div>
  `;

  mountDashboardModule(content, 3, 'EXIT');

  document.getElementById('nav-back-btn')?.addEventListener('click', renderHomePage);

  // Bind Tier Action Button
  const actionBtn = document.getElementById('exit-action-btn');
  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      const t = getUserTier();
      if (t === exitTierData.sprinter) renderPriorityRoute();
      else if (t === exitTierData.stroller) renderSurgeTimeline();
      else renderExclusiveContent();
    });
  }

  // Bind Specific Locker Room Trigger
  document.getElementById('locker-access-trigger')?.addEventListener('click', renderExclusiveContent);

  // ── Simulation loop ────────────────────────────────────────────
  if (exitInterval) clearInterval(exitInterval);
  exitInterval = setInterval(() => {
    // Countdown
    if (exitCountdown > 0) exitCountdown--;
    const cd = document.getElementById('exit-countdown');
    if (cd) cd.textContent = fmtCountdown(exitCountdown);

    // Phase progression
    const newPhase = exitCountdown > 10 * 60 ? 1 : exitCountdown > 3 * 60 ? 2 : 3;
    if (newPhase !== exitPhase) {
      exitPhase = newPhase;
      const badge = document.getElementById('exit-phase-badge');
      const desc  = document.getElementById('exit-phase-desc');
      const colors = ['', '#ff003c', '#ffaa00', '#8400ff'];
      if (badge) { badge.textContent = getExitPhaseLabel(exitPhase); badge.style.background = colors[exitPhase]; }
      if (desc)  desc.textContent = getExitPhaseDesc(exitPhase);
    }

    // Live stats flicker
    const waits  = ['2 min','4 min','6 min','3 min','5 min','7 min'];
    const surges = ['1.4×','2.1×','2.8×','3.2×','1.9×','2.4×'];
    const loads  = ['42%','55%','68%','74%','61%','48%'];
    const t = Math.floor(Date.now() / 3000) % waits.length;
    const w = document.getElementById('exit-stat-wait');
    const s = document.getElementById('exit-stat-surge');
    const c = document.getElementById('exit-stat-crowd');
    if (w) w.textContent = waits[t];
    if (s) s.textContent = surges[t];
    if (c) c.textContent = loads[t];

    // Surge price animation
    const surgePrices = ['$48','$51','$55','$47','$53','$50'];
    const sp = document.getElementById('surge-price-now');
    if (sp) sp.textContent = surgePrices[t];

    // Anchor timer
    const anchorEl = document.getElementById('anchor-timer');
    if (anchorEl) {
      const aMin = Math.floor((exitCountdown % (15*60)) / 60).toString().padStart(2,'0');
      const aSec = (exitCountdown % 60).toString().padStart(2,'0');
      anchorEl.textContent = `${aMin}:${aSec}`;
    }
  }, 1000);
}


/**
 * EXIT SUB-PAGES (CHILD MODULES)
 */

function renderExitSubPage(subTitle, subContent) {
  const layout = `
    <div id="exit-container" style="width:100%;">
      <!-- Status bar inherits from parent -->
      <div class="market-ticker" style="padding:0.75rem 1rem; display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap; background:rgba(255,255,255,0.03);">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em;">Phase</span>
          <span style="background:#ff003c; color:#fff; font-size:0.7rem; font-family:var(--font-logo); padding:2px 10px; border-radius:20px; font-weight:700;">${getExitPhaseLabel(exitPhase)}</span>
        </div>
        <div style="flex:1; font-size:0.75rem; color:var(--text-muted); font-family:var(--font-logo);">${getExitPhaseDesc(exitPhase)}</div>
        <div style="font-family:var(--font-logo); font-size:1rem; color:#ff003c; letter-spacing:0.1em; font-weight:700;">
          NEXT RELEASE IN <span id="sub-countdown">${fmtCountdown(exitCountdown)}</span>
        </div>
      </div>

      <div class="main-feed" id="exit-sub-feed" style="gap:1.5rem; padding-top:1.5rem;">
        ${subContent}
      </div>
    </div>
  `;

  // Mount with backAction returning to root Exit module
  mountDashboardModule(layout, 3, `EXIT / ${subTitle.toUpperCase()}`, renderExitModule);
  
  // Sync the sub-countdown
  const subCd = setInterval(() => {
    const el = document.getElementById('sub-countdown');
    if (!el) { clearInterval(subCd); return; }
    el.textContent = fmtCountdown(exitCountdown);
  }, 1000);
}

function renderPriorityRoute() {
  const content = `
    <div class="promo-card" style="border-color:#00ff66; background:rgba(0,255,102,0.05); padding:0; overflow:hidden; min-height:400px; display:flex; flex-direction:column;">
      <div id="ar-viewport" style="flex:1; background:#080808; position:relative; overflow:hidden;">
        <!-- Kinetic Radar -->
        <div class="radar-circle" style="position:absolute; top:50%; left:50%; width:300px; height:300px; border:1px solid rgba(0,255,102,0.2); border-radius:50%; transform:translate(-50%,-50%);"></div>
        <div class="radar-circle" style="position:absolute; top:50%; left:50%; width:150px; height:150px; border:1px solid rgba(0,255,102,0.1); border-radius:50%; transform:translate(-50%,-50%);"></div>
        <div class="radar-sweep" style="position:absolute; top:50%; left:50%; width:150px; height:2px; background:linear-gradient(to right, transparent, #00ff66); transform-origin:left center; animation: radar-spin 4s linear infinite;"></div>
        
        <!-- Pushing Path -->
        <svg style="position:absolute; inset:0; width:100%; height:100%;" viewBox="0 0 100 100" preserveAspectRatio="none">
           <path d="M50,90 Q50,50 80,40" fill="none" stroke="#00ff66" stroke-width="2" stroke-dasharray="5,5" class="path-march"></path>
           <circle cx="80" cy="40" r="4" fill="#00ff66" class="pulse-point"></circle>
        </svg>

        <div style="position:absolute; top:20px; left:20px; background:rgba(0,0,0,0.8); padding:8px 15px; border-radius:30px; border:1px solid #00ff66; display:flex; align-items:center; gap:8px;">
          <div style="width:8px; height:8px; background:#00ff66; border-radius:50%; animation: pulse 1s infinite;"></div>
          <span style="color:#00ff66; font-size:0.7rem; font-weight:700; letter-spacing:0.1em;">LIVE AR ROUTE ACTIVE</span>
        </div>

        <div style="position:absolute; bottom:20px; right:20px; text-align:right;">
          <p style="color:var(--text-muted); font-size:0.6rem; text-transform:uppercase; margin:0;">Target</p>
          <p style="color:#fff; font-size:1.1rem; font-weight:800; margin:2px 0 0 0;">GATE C-EXPRESS</p>
        </div>
      </div>

      <div style="padding:1.5rem; background:rgba(0,0,0,0.5); border-top:1px solid rgba(0,255,102,0.2);">
        <p style="color:#fff; font-size:0.9rem; margin:0 0 10px 0; font-weight:600;">Follow the green path to bypass the main concourse.</p>
        <p style="color:var(--text-muted); font-size:0.75rem; margin:0; line-height:1.4;">Your ticket is pre-cleared for the Priority Lane. Show this view to stewards if guided otherwise.</p>
      </div>
    </div>

    <style>
      @keyframes radar-spin { from { transform: translate(0, -50%) rotate(0deg); } to { transform: translate(0, -50%) rotate(360deg); } }
      .path-march { stroke-dashoffset: 100; animation: dash 5s linear infinite; }
      @keyframes dash { to { stroke-dashoffset: 0; } }
      .pulse-point { animation: pulse-glow 2s infinite; }
      @keyframes pulse-glow { 0% { r: 4; opacity: 1; } 100% { r: 12; opacity: 0; } }
    </style>
  `;
  renderExitSubPage('Priority Route', content);
}

function renderSurgeTimeline() {
  const content = `
     <div class="promo-card" id="surge-dashboard" style="border-color:#ffaa00; background:rgba(255,170,0,0.05); text-align:left;">
        <h2 style="color:#ffaa00; font-size:1.3rem; margin:0 0 0.5rem 0;">Live Price Forecast</h2>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:2rem;">Waiting just 25 minutes can save you up to 60% on your return trip.</p>

        <!-- Price Graph -->
        <div style="width:100%; height:180px; display:flex; align-items:flex-end; gap:8%; margin-bottom:2rem; padding:0 10px;">
           ${[
             { label:'NOW', val:100, price:'$50', color:'#ff003c' },
             { label:'15M', val:65, price:'$32', color:'#ffaa00' },
             { label:'30M', val:40, price:'$20', color:'#ffaa00' },
             { label:'45M', val:30, price:'$15', color:'var(--accent)' }
           ].map(b => `
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
                 <span style="font-size:0.75rem; color:${b.color}; font-weight:700;">${b.price}</span>
                 <div style="width:100%; height:${b.val}%; background:${b.color}; border-radius:6px 6px 0 0; opacity:0.8; box-shadow:0 0 15px ${b.color}40;"></div>
                 <span style="font-size:0.6rem; color:var(--text-muted); text-transform:uppercase;">${b.label}</span>
              </div>
           `).join('')}
        </div>

            <div style="background:rgba(255,170,0,0.1); border:1px solid #ffaa0040; border-radius:12px; padding:1.2rem; display:flex; align-items:center; justify-content:space-between;">
           <div>
              <p style="color:#ffaa00; font-size:0.75rem; font-weight:700; text-transform:uppercase; margin:0;">Projected Saving</p>
              <p style="color:#fff; font-size:1.2rem; font-weight:800; margin:4px 0 0 0;">$32.00 Total</p>
           </div>
           <button id="surge-alert-btn" style="background:#ffaa00; color:#000; border:none; padding:0.6rem 1.2rem; border-radius:8px; font-weight:800; font-size:0.75rem; cursor:pointer;">Set Drop Alert</button>
        </div>
     </div>
  `;
  renderExitSubPage('Ride Savings', content);
  
  document.getElementById('surge-alert-btn')?.addEventListener('click', (e) => {
    e.target.innerText = '🔔 Alert Active';
    e.target.style.background = 'transparent';
    e.target.style.border = '1px solid #ffaa00';
    e.target.style.color = '#ffaa00';
  });
}

function renderExclusiveContent() {
  let innerState = {
    channel: 'interviews', // 'interviews' or 'performance'
    isPlaying: false
  };

  const getSubHTML = () => {
    const isInterviews = innerState.channel === 'interviews';
    const playIcon = innerState.isPlaying 
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';

    return `
      <!-- Parent box with forced styles to prevent global hover movement -->
      <div id="exclusive-player-card" class="promo-card" style="border-color:#8400ff; background:rgba(132,0,255,0.05); padding:0; overflow:hidden; transform:none !important; transition:none !important; cursor:default;">
        
        <!-- Channel Switcher -->
        <div style="display:flex; background:rgba(0,0,0,0.4); padding:5px; border-bottom:1px solid rgba(132,0,255,0.2);">
          <button id="chan-interviews" style="flex:1; background:${isInterviews ? '#8400ff' : 'transparent'}; color:${isInterviews ? '#fff' : '#888'}; border:none; padding:8px; border-radius:6px; font-size:0.65rem; font-weight:800; cursor:pointer; transition:background-color 0.2s, color 0.2s;">CH 01: INTERVIEWS</button>
          <button id="chan-performance" style="flex:1; background:${!isInterviews ? '#8400ff' : 'transparent'}; color:${!isInterviews ? '#fff' : '#888'}; border:none; padding:8px; border-radius:6px; font-size:0.65rem; font-weight:800; cursor:pointer; transition:background-color 0.2s, color 0.2s;">CH 02: PERFORMANCE</button>
        </div>

        <div style="width:100%; aspect-ratio:16/9; background:#000; position:relative; display:flex; align-items:center; justify-content:center;">
           <!-- Fake Video Feed -->
           <div style="position:absolute; inset:0; opacity:0.6; background:url('${isInterviews ? 'https://images.unsplash.com/photo-1541534741688-6078c64b5cd9?auto=format&fit=crop&q=80&w=800' : 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800'}') center/cover;"></div>
           <div style="position:absolute; inset:0; background:radial-gradient(circle at center, transparent, rgba(0,0,0,0.8));"></div>
           
           <div style="position:relative; z-index:2; text-align:center;">
              <div id="exclusive-play-btn" style="width:60px; height:60px; border-radius:50%; background:rgba(132,0,255,0.8); display:flex; align-items:center; justify-content:center; border:2px solid #fff; margin-bottom:10px; cursor:pointer;" title="${innerState.isPlaying ? 'Pause' : 'Play'}">
                 ${playIcon}
              </div>
              <p id="player-status-text" style="color:#fff; font-size:0.8rem; font-weight:700; text-shadow:0 2px 10px rgba(0,0,0,0.5);">${innerState.isPlaying ? 'STREAMING LIVE' : 'TAP TO ENTER FEED'}</p>
           </div>

           <div style="position:absolute; top:15px; left:15px; background:#ff003c; color:#fff; padding:3px 10px; border-radius:4px; font-weight:900; font-size:0.65rem; letter-spacing:0.1em; display:flex; align-items:center; gap:5px;">
             <div style="width:6px; height:6px; background:#fff; border-radius:50%; ${innerState.isPlaying ? 'animation: pulse 1s infinite;' : ''}"></div>
             LIVE ACCESS
           </div>

           <div style="position:absolute; bottom:15px; left:15px; right:15px; display:flex; justify-content:space-between; align-items:center;">
              <p style="color:#fff; font-size:0.75rem; margin:0; font-weight:700;">FLUX // ${isInterviews ? 'LOCKER ROOM' : 'MAIN STAGE'}</p>
              <div style="display:flex; gap:3px;">
                 ${[1.2, 0.8, 2, 1.5, 1.1, 1.8].map(h => `<div style="width:3px; height:${innerState.isPlaying ? h * (isInterviews ? 10 : 20) : 5}px; background:#8400ff; transition: height 0.3s ease; ${innerState.isPlaying ? 'animation: wave-pulse 0.5s ease-in-out infinite alternate;' : ''}"></div>`).join('')}
              </div>
           </div>
        </div>

        <div style="padding:1.5rem; text-align:left;">
          <h3 style="color:#8400ff; margin:0 0 10px 0;">${isInterviews ? 'Post-Match: Captains Interview' : 'Live: Electronic Performance'}</h3>
          <p style="color:var(--text-muted); font-size:0.82rem; line-height:1.5; margin:0;">${isInterviews ? 'Enjoy this exclusive behind-the-scenes content while you wait for the final wave release.' : 'Live music and dance performance by guest artists. Stay for the show, avoid the peak exit crush.'}</p>
          
          <div style="margin-top:1.5rem; display:flex; gap:1rem; align-items:center;">
             <div style="flex:1; height:40px; background:rgba(255,255,255,0.05); border-radius:20px; display:flex; align-items:center; padding:0 15px;">
                <p style="margin:0; font-size:0.75rem; color:#888;" id="chat-mock-status">Attendee chat active...</p>
             </div>
             <button id="send-love-btn" style="width:40px; height:40px; border-radius:50%; background:rgba(255,0,60,0.1); border:1px solid #ff003c; color:#ff003c; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:1.2rem;">❤️</button>
          </div>
        </div>
      </div>

      <style>
        #exclusive-player-card { transform: none !important; transition: none !important; }
        #exclusive-player-card div, #exclusive-player-card button, #exclusive-player-card p { transition: none !important; transform: none !important; }
        #chan-interviews:hover, #chan-performance:hover { background-color: rgba(132,0,255,0.4) !important; }
        #send-love-btn:hover { background-color: rgba(255, 0, 60, 0.2) !important; }
        @keyframes wave-pulse { from { height: 5px; } to { height: 25px; } }
      </style>
    `;
  };

  const bindUI = () => {
    // Channel switching
    document.getElementById('chan-interviews')?.addEventListener('click', () => {
      innerState.channel = 'interviews';
      refresh();
    });
    document.getElementById('chan-performance')?.addEventListener('click', () => {
      innerState.channel = 'performance';
      refresh();
    });

    // Play/Pause
    document.getElementById('exclusive-play-btn')?.addEventListener('click', () => {
      innerState.isPlaying = !innerState.isPlaying;
      refresh();
    });

    // Reaction
    document.getElementById('send-love-btn')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      btn.style.backgroundColor = 'rgba(255, 0, 60, 0.4)';
      setTimeout(() => { btn.style.backgroundColor = 'rgba(255,0,60,0.1)'; }, 200);
      
      const chat = document.getElementById('chat-mock-status');
      if (chat) chat.textContent = 'You sent a reaction!';
      setTimeout(() => { if (chat) chat.textContent = 'Attendee chat active...'; }, 2000);
    });
  };

  const refresh = () => {
     const feed = document.getElementById('exit-sub-feed');
     if (feed) {
       feed.innerHTML = getSubHTML();
       bindUI();
     }
  };

  // Initial mount
  renderExitSubPage('Exclusive Feed', getSubHTML());
  // Need a small timeout because renderExitSubPage triggers a full mountDashboardModule
  setTimeout(bindUI, 50);
}



/**
 * P5.js FLOW-FIELD ENGINE - LITERAL REVERT
 */

function initP5Background() {
  if (p5Instance) return;

  if (typeof p5 === 'undefined') {
    if (p5RetryCount < MAX_P5_RETRIES) {
      p5RetryCount++;
      setTimeout(initP5Background, 100);
    } else {
      console.warn('Background Engine: P5 dependency not found after 5s. Disabling.');
    }
    return;
  }

  const sketch = (p) => {
    // --- Literal Port of Vars ---
    const deg = (a) => p.PI / 180 * a;
    const rand = (v1, v2) => Math.floor(v1 + Math.random() * (v2 - v1));
    const opt = {
      particles: (p.windowWidth / 500) > 1 ? 1000 : 500, // Normalized window.width logic
      noiseScale: 0.009,
      angle: p.PI / 180 * -90,
      h1: rand(0, 360), h2: rand(0, 360),
      s1: rand(20, 90), s2: rand(20, 90),
      l1: rand(30, 80), l2: rand(30, 80),
      strokeWeight: 1.2,
      tail: 82,
    };
    const Particles = [];
    let time = 0;

    // --- Literal Particle Class ---
    class Particle {
      constructor(x, y) {
        this.x = x; this.y = y;
        this.lx = x; this.ly = y;
        this.vx = 0; this.vy = 0;
        this.ax = 0; this.ay = 0;
        this.randomize();
      }
      
      randomize() {
        this.hueSemen = Math.random();
        this.hue = this.hueSemen > .5 ? 20 + opt.h1 : 20 + opt.h2;
        this.sat = this.hueSemen > .5 ? opt.s1 : opt.s2;
        this.light = this.hueSemen > .5 ? opt.l1 : opt.l2;
        this.maxSpeed = this.hueSemen > .5 ? 3 : 2;
      }
      
      update() {
        this.follow();
        this.vx += this.ax; this.vy += this.ay;
        var p_mag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        var a = p.atan2(this.vy, this.vx);
        var m = Math.min(this.maxSpeed, p_mag);
        this.vx = Math.cos(a) * m;
        this.vy = Math.sin(a) * m;
        this.x += this.vx; this.y += this.vy;
        this.ax = 0; this.ay = 0;
        this.edges();
      }
      
      follow() {
        let angle = (p.noise(this.x * opt.noiseScale, this.y * opt.noiseScale, time * opt.noiseScale)) * Math.PI * 0.5 + opt.angle;
        this.ax += Math.cos(angle);
        this.ay += Math.sin(angle);
      }
      
      updatePrev() { this.lx = this.x; this.ly = this.y; }
      
      edges() {
        if (this.x < 0) { this.x = p.width; this.updatePrev(); }
        if (this.x > p.width) { this.x = 0; this.updatePrev(); }
        if (this.y < 0) { this.y = p.height; this.updatePrev(); }
        if (this.y > p.height) { this.y = 0; this.updatePrev(); }
      }
      
      render() {
        p.stroke(`hsla(${this.hue}, ${this.sat}%, ${this.light}%, .5)`);
        p.line(this.x, this.y, this.lx, this.ly);
        this.updatePrev();
      }
    }

    // --- Literal Lifecycle ---
    p.setup = () => {
      const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
      cnv.id('flux-bg-canvas');
      cnv.style('position', 'fixed');
      cnv.style('top', '0'); cnv.style('left', '0');
      cnv.style('z-index', '-1');
      cnv.style('opacity', bgShouldBeWaking ? '1' : '0');
      cnv.style('transition', 'opacity 1s ease');
      cnv.style('pointer-events', 'none');

      for (let i = 0; i < opt.particles; i++) {
        Particles.push(new Particle(Math.random() * p.width, Math.random() * p.height));
      }
      p.strokeWeight(opt.strokeWeight);
      if (!bgShouldBeWaking) p.noLoop();
    };

    p.draw = () => {
      time++;
      p.background(0, 100 - opt.tail);
      for (let part of Particles) {
        part.update();
        part.render();
      }
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    // Controller methods for main.js sync
    p.wake = () => {
      const el = document.getElementById('flux-bg-canvas');
      if (el) el.style.opacity = '1';
      p.loop();
    };
    p.hibernate = () => {
      const el = document.getElementById('flux-bg-canvas');
      if (el) el.style.opacity = '0';
      p.noLoop();
    };
    p.triggerRandomize = () => {
      opt.h1 = rand(0, 360); opt.h2 = rand(0, 360);
      opt.s1 = rand(20, 90); opt.s2 = rand(20, 90);
      opt.l1 = rand(30, 80); opt.l2 = rand(30, 80);
      opt.angle += p.PI / 180 * 60 * (Math.random() > .5 ? 1 : -1);
      for (let part of Particles) part.randomize();
    };
  };

  p5Instance = new p5(sketch);

  // Persistence Check: if visibility was requested before init
  if (bgShouldBeWaking) {
    p5Instance.wake();
  }

  // Global Click Integration
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.promo-card') || e.target.closest('button')) return;
    p5Instance?.triggerRandomize();
  });
}

// --- BOOTSTRAPPER ---
bgShouldBeWaking = false;

initP5Background();
renderAuthPage();

// Final failsafe wake attempt
if (bgShouldBeWaking) {
  p5Instance?.wake();
}

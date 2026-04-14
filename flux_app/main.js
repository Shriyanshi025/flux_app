import './style.css'

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
  timerInterval: null
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
// LOGIN / REGISTER SCREEN
// ============================================================
function renderAuthPage() {
  hibernateEverything(); // Ensure P5 is OFF
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
      ${getBottomNavHTML()}
    </div>
  `;

  bindUniversalNav();
  setNavActive(0);

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
  p5Instance?.hibernate();
  if (marketInterval) clearInterval(marketInterval);
  marketInterval = null;
}

function renderHomePage() {
  const hasPlayedDrone = sessionStorage.getItem('flux_drone_played');
  const appEl = document.querySelector('#app');

  if (hasPlayedDrone) {
    document.body.classList.add('theme-blue');
    document.body.classList.remove('theme-magenta');
    p5Instance?.wake(); 
    renderHomeHTML(appEl);
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
      p5Instance?.wake(); 
      renderHomeHTML(appEl);
    }, 3000);
  };
}

function renderHomeHTML(appEl) {
  appEl.innerHTML = `
    <div id="home-container" class="animated">
      
      <!-- Header -->
      <div class="top-nav">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="icon" id="nav-menu-btn">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </div>
          <div class="nav-logo" id="header-logo" style="cursor: pointer;">FLUX</div>
        </div>

        <div class="avatar" id="nav-avatar">
           ${getAvatarHTML(parseInt(localStorage.getItem('flux_avatar_idx') || 0), 28)}
        </div>

      </div>

      <!-- User Greeting -->
      <div class="home-greeting" id="home-greeting" style="padding: 0 var(--screen-pad-x); margin: 0 !important;">
        HELLO, ${localStorage.getItem('flux_user')?.split(' ')[0].toUpperCase() || 'GUEST'}
      </div>

      <!-- Scrollable content -->
      <div class="main-feed" id="home-feed">
        <div class="promo-card card-arrival">
          <h3>Arrival: Green Carpet</h3>
          <p>Book a 10-minute arrival slot up to 7 days in advance. Arrive on time, unlock the Fast Lane.</p>
          <div class="blurred-qr"></div>
          <button class="btn-primary" id="open-entry-btn">Book My Arrival Slot</button>
        </div>

        <div class="promo-card card-halftime">
          <h3>Halftime: Flash Market</h3>
          <p>40k people want Burgers. Tacos are empty. Take 50% Off deals and skip the concourse crush entirely.</p>
          <button class="btn-primary">Live Heatmap Deals</button>
        </div>

        <div class="promo-card card-departure">
          <h3>Departure: Soft Exit</h3>
          <p>Avoid post-game congestion. Stay in your seat, unlock exclusive interviews, or redeem a 20% ride discount!</p>
          <button class="btn-primary">Access Soft-Exit Perks</button>
        </div>

        <!-- Sentinel for copyright detection -->
        <div id="end-sentinel" style="height: 1px; width: 100%; margin-top: 10vh;"></div>
      </div>

      ${getBottomNavHTML()}
    </div>
  `;

  bindHomeEvents();
  bindUniversalNav();
  renderSideNav(); 
  initSmartHomeLogic(); 
  
  // Start market background simulation if not running
  if (!marketInterval) {
    marketInterval = setInterval(updateMarketSimulation, 4000);
  }
}
function bindHomeEvents() {
  // Flash Market Bindings (Card and Nav)
  const flashMarketCard = document.querySelector('.card-halftime button');
  if (flashMarketCard) flashMarketCard.addEventListener('click', () => {
    setNavActive(1);
    renderFlashMarket();
  });
  
  document.getElementById('nav-home')?.addEventListener('click', () => {
    setNavActive(0);
    renderEntryModule();
  });
  
  document.getElementById('nav-break')?.addEventListener('click', () => {
    setNavActive(1);
    renderFlashMarket();
  });

  document.getElementById('nav-exit')?.addEventListener('click', () => {
    setNavActive(2);
    // Soft Exit module placeholder
  });

  document.getElementById('header-logo')?.addEventListener('click', () => {
    renderHomePage();
  });

  // Hamburger & Profile Bindings
  document.getElementById('nav-menu-btn')?.addEventListener('click', () => {
    toggleSideNav(true);
  });
  
  document.getElementById('nav-avatar')?.addEventListener('click', () => {
    renderProfilePage();
  });
}

function renderFlashMarket() {
  const container = document.querySelector('#app');
  container.innerHTML = `
    <div id="app-container" class="animated">
      <div class="top-nav">
        <div style="display: flex; align-items: center; gap: 1rem;">
           <div class="nav-back-btn" id="market-back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></div>
           <div class="nav-logo">MARKET</div>
        </div>
        <div class="avatar" id="nav-avatar">
           ${getAvatarHTML(parseInt(localStorage.getItem('flux_avatar_idx') || 0), 28)}
        </div>
      </div>

      <!-- Live Ticker -->
      <div class="market-ticker">
        <div class="ticker-content" id="ticker-target"></div>
      </div>

      <div class="main-feed" id="market-feed">
        <h2 style="color: #ffaa00;">Flash Market</h2>
        <!-- stands injected here -->
      </div>
      
      ${getBottomNavHTML()}
    </div>
  `;


  bindUniversalNav(); 
  setNavActive(1);    
  
  // Reset-on-Visit: Every visit grants 2 more notifications
  flashNotifTracker.extraCount = 2;
  updateMarketDisplay();
}

function updateMarketDisplay() {
  const tickerEl = document.getElementById('ticker-target');
  const feedEl = document.getElementById('market-feed');
  if (!tickerEl || !feedEl) return;

  // Refresh Ticker
  tickerEl.innerHTML = mockMarketData.map(item => `
    <span class="ticker-item ${item.trend}">
      ${item.name.toUpperCase()} / WAIT: ${item.wait}m 
      ${item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '•'}
    </span>
  `).join('');

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
    <div class="nav-panel-item">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      About
    </div>
    <div class="nav-panel-item">
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
}

/** 
 * PROFILE EDITING - ATOMIC & CONSISTENT
 */
function renderProfileEdit() {
  const currentName = localStorage.getItem('flux_user') || 'GUEST';
  const currentMob = localStorage.getItem('flux_mob') || '+91 ···· ····';
  const currentEmail = localStorage.getItem('flux_email') || 'alex@fortress.io';
  const currentAvatarIdx = parseInt(localStorage.getItem('flux_avatar_idx') || 0);
  const bioEnabled = localStorage.getItem('flux_bio') !== 'false';

  // Draft Data - changes stay here until Confirm
  const draft = {
    user: currentName,
    mob: currentMob,
    email: currentEmail,
    bio: bioEnabled,
    avatar: currentAvatarIdx
  };


  const d = document.createElement('div');
  d.id = 'edit-profile-view';
  d.className = 'profile-overlay animated';
  d.style = "position:fixed; inset:0; background:var(--bg-core); z-index:2000; padding: 2rem var(--screen-pad-x); display: flex; flex-direction: column; align-items: center;";

  d.innerHTML = `
    <!-- Top: Centered Avatar & Name -->
    <div style="text-align: center; margin-bottom: 3rem;">
      <div style="position: relative; width: fit-content; margin: 0 auto 1rem auto;">
        <div id="edit-avatar-container" class="avatar" style="width: 80px; height: 80px; background: ${getAvatarTheme(draft.avatar).bg}; border-width: 3px;">
           ${getAvatarHTML(draft.avatar, 40)}
        </div>
        <div id="change-avatar-btn" style="position: absolute; bottom: 0; right: 0; background: var(--accent); width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid var(--bg-core); cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
           <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </div>
      </div>
      <h2 id="edit-display-name" style="margin: 0; font-size: 1.8rem; color: #fff;">${currentName.toUpperCase()}</h2>


      <p style="color: var(--accent); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 5px;">Fortress ID Identity</p>
    </div>

    <!-- Body: Left Aligned Credentials -->
    <div style="width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 2rem;">
      
      ${renderEditRow('Username', draft.user, 'edit-user')}
      ${renderEditRow('Mobile No', draft.mob, 'edit-mob')}
      ${renderEditRow('Email', draft.email, 'edit-email')}
      
      <!-- Biometrics Toggle -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <p style="color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; margin: 0 0 4px 0;">Biometrics</p>
          <p id="bio-status-text" style="color: #fff; font-size: 1.1rem; margin: 0;">${draft.bio ? 'Active' : 'Inactive'}</p>
        </div>
        <div id="bio-toggle" style="width: 50px; height: 26px; background: ${draft.bio ? 'var(--accent)' : '#333'}; border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s;">
          <div style="width: 20px; height: 20px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: ${draft.bio ? '27px' : '3px'}; transition: 0.3s;"></div>
        </div>
      </div>

    </div>

    <!-- Footer: Confirm/Cancel -->
    <div style="margin-top: 4rem; width: 100%; max-width: 400px; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
       <button id="cancel-edit" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #888; padding: 1rem; border-radius: 12px; cursor: pointer; font-weight:600;">Cancel</button>
       <button id="confirm-edit" style="background: var(--accent); border: none; color: #000; padding: 1rem; border-radius: 12px; cursor: pointer; font-weight:800; box-shadow: 0 0 20px rgba(57,255,20,0.2);">Save Changes</button>
    </div>
  `;

  document.body.appendChild(d);

  // Bind Inline Events
  d.querySelectorAll('.edit-pencil').forEach(p => {
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

  // Toggle Bio
  document.getElementById('bio-toggle').addEventListener('click', () => {
    draft.bio = !draft.bio;
    document.getElementById('bio-toggle').style.background = draft.bio ? 'var(--accent)' : '#333';
    document.getElementById('bio-toggle').firstElementChild.style.left = draft.bio ? '27px' : '3px';
    document.getElementById('bio-status-text').innerText = draft.bio ? 'Active' : 'Inactive';
  });

  // Change Avatar
  document.getElementById('change-avatar-btn').addEventListener('click', () => {
    showAvatarPicker(draft.avatar, (newIdx) => {
      draft.avatar = newIdx;
      const theme = getAvatarTheme(newIdx);
      const container = document.getElementById('edit-avatar-container');
      container.style.background = theme.bg;
      container.innerHTML = getAvatarHTML(newIdx, 40);
    });
  });

  // Cancel
  document.getElementById('cancel-edit').addEventListener('click', () => d.remove());

  // Confirm - SAVE TO PERSISTENCE
  document.getElementById('confirm-edit').addEventListener('click', () => {
    localStorage.setItem('flux_user', draft.user);
    localStorage.setItem('flux_mob', draft.mob);
    localStorage.setItem('flux_email', draft.email);
    localStorage.setItem('flux_bio', draft.bio);
    localStorage.setItem('flux_avatar_idx', draft.avatar);
    
    // Immediate consistent update
    const greeting = document.getElementById('home-greeting');
    if (greeting) greeting.innerText = `HELLO, ${draft.user.split(' ')[0].toUpperCase()}`;
    
    const navAvatar = document.getElementById('nav-avatar');
    if (navAvatar) navAvatar.innerHTML = getAvatarHTML(draft.avatar, 28);

    d.remove();
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
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
  if (isOpen) {
    nav.classList.add('show');
    overlay.classList.add('show');
  } else {
    nav.classList.remove('show');
    overlay.classList.remove('show');
  }
}


/** Helper: activate a specific bottom nav item by index */
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

// ============================================================
// PROFILE PAGE
// ============================================================
function renderProfilePage() {
  const username = localStorage.getItem('flux_user') || 'User';
  const avatarIdx = parseInt(localStorage.getItem('flux_avatar_idx') || 0);

  // Remove existing profile view if re-opened
  const existing = document.getElementById('profile-view');
  if (existing) existing.remove();

  const d = document.createElement('div');
  d.id = 'profile-view';
  d.className = 'profile-overlay animated p5-active';
  // Style pushed to CSS file for absolute grid centering
  d.innerHTML = `
     <div class="curved-deck">
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
          <!-- Identity Cluster -->
          <div style="display: flex; align-items: center; gap: 1.2rem;">
            <div class="avatar" style="width: 60px; height: 60px; background: ${getAvatarTheme(avatarIdx).bg}; border-width: 2.5px;">
                ${getAvatarHTML(avatarIdx, 30)}
            </div>
            <div style="text-align: left;">
              <h2 style="color: var(--accent); margin: 0; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8;">Identity Pass</h2>
              <p style="font-size: 1.4rem; margin: 2px 0 0 0; color: #fff; font-weight: 700; line-height: 1;">${username}</p>
            </div>
          </div>

          <!-- Isolated Management -->
          <div id="prof-popup-edit" style="background: var(--accent); color: #000; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid var(--bg-core); cursor: pointer; box-shadow: 0 4px 15px rgba(0,255,102,0.3); transition: transform 0.2s;" onclick="this.style.transform='scale(0.95)'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </div>
        </div>

        <div class="promo-card" id="prof-card-data" style="text-align: left; width: 100%; max-width: 400px; border-color: rgba(255,255,255,0.2); margin-bottom: 2rem; background: rgba(0,0,0,0.3);">
            <p style="color: #00ffcc; text-transform: uppercase; font-size: 0.8rem; margin:0 0 5px 0;">Trust Level</p>
            <p style="margin: 0; color: white; font-weight: 700; font-size: 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; margin-bottom: 1rem;">Zero-Trust Biometric Secure ✓</p>
            
            <p style="color: #00ffcc; text-transform: uppercase; font-size: 0.8rem; margin:0 0 5px 0;">Identity Status</p>
            <p style="margin: 0; color: white; line-height: 1.4;">Personal information encrypted &amp; stored consistently with Fortress ID protocols.</p>
            
            <button id="logout-btn" style="margin-top: 2rem; width: 100%; background: rgba(255, 60, 60, 0.1); border: 1px solid #ff3c3c; color: #ff3c3c; padding: 0.6rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">
              Log Out / Reset Identity
            </button>
          </div>

          <button class="btn-primary" id="close-profile" style="width: 100%;">Return to FLUX</button>
     </div>

  `;
  document.body.appendChild(d);
  document.getElementById('close-profile').addEventListener('click', () => {
    document.getElementById('profile-view').remove();
  });
  document.getElementById('logout-btn').addEventListener('click', () => {
    hibernateEverything();
    localStorage.clear();
    location.reload();
  });
  document.getElementById('prof-popup-edit').addEventListener('click', () => {
     document.getElementById('profile-view').remove();
     renderProfileEdit();
  });
}



// ============================================================
// ENTRY MODULE — GREEN CARPET
// ============================================================
function renderEntryModule() {
  const appEl = document.querySelector('#app');
  appEl.innerHTML = `
    <div id="entry-container" class="animated">
      <!-- Entry Header -->
      <div class="top-nav">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <button id="entry-back-btn" class="nav-back-btn" title="Back to Dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div class="logo-small">ENTRY</div>
        </div>
        <div class="avatar" style="cursor: pointer;" onclick="renderProfilePage()">
           ${getAvatarHTML(parseInt(localStorage.getItem('flux_avatar_idx') || 0), 28)}
        </div>
      </div>

      <!-- Scrollable content -->
      <div id="entry-view" class="main-feed animated">
         <!-- Content injected here by sub-renderers -->
      </div>
      
      ${getBottomNavHTML()}
    </div>
  `;

  document.getElementById('entry-back-btn').addEventListener('click', renderHomePage);
  document.getElementById('entry-avatar')?.addEventListener('click', renderProfilePage);
  bindUniversalNav(); // Link universal navigation
  setNavActive(0);    // Mark entry as active
  
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
    <div id="app-container" class="animated">
      <div class="top-nav">
        <div style="display: flex; align-items: center; gap: 1rem;">
           <div class="nav-back-btn" id="entry-back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></div>
           <div class="nav-logo">ENTRY</div>
        </div>
        <div class="avatar" id="nav-avatar">
           ${getAvatarHTML(parseInt(localStorage.getItem('flux_avatar_idx') || 0), 28)}
        </div>
      </div>

      <div class="main-feed" id="entry-feed" style="padding-top: 120px !important;">
        <h2 style="color: #00ff66;">Choose Your Window</h2>
        
        <div class="promo-card" id="maps-engine-card" style="border-color: #00ff66; background: rgba(0, 255, 102, 0.05); padding: 2rem; margin-bottom: 2.5rem;">
            <h3 style="color: #00ff66; margin: 0 0 0.8rem 0; font-size: 1.2rem; text-transform: uppercase;">Live Proximity Protocol</h3>
            <p style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem;">Syncing with <strong style="color:#fff;">Google Maps Platform</strong> for real-time stadium geo-fencing and crowd-flow optimization.</p>
            
            <div id="google-maps-engine" style="width: 100%; height: 160px; background: #080808; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                 <!-- Simulated Google Maps Engine (Dark Mode) -->
                 <div style="position: absolute; inset: 0; opacity: 0.3; background-image: radial-gradient(circle at 20% 30%, #333 1px, transparent 1px), radial-gradient(circle at 60% 70%, #333 1.5px, transparent 1px); background-size: 40px 40px;"></div>
                 <div style="position: relative; z-index: 5; text-align: center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ff66" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <p style="margin: 5px 0 0 0; font-size: 0.7rem; color: #00ff66; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Maps Engine Active</p>
                 </div>
                 <div style="position: absolute; bottom: 8px; right: 8px; opacity: 0.6;">
                    <img src="https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_light_color_92x30dp.png" alt="Google" style="height: 12px;">
                 </div>
            </div>
        </div>

        <div class="entry-grid">${slotCards}</div>
      </div>

      ${getBottomNavHTML()}
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

  bindUniversalNav();
}

function renderLockout(container) {
  container.innerHTML = `
     <div class="lockout-screen animated">
        <!-- High-Fidelity Heads Up Notice -->
        <div style="width: 100%; background: #ffaa00; color: #000; padding: 0.8rem; border-radius: 12px; margin-bottom: 2rem; text-align: center; font-weight: 700; font-size: 0.85rem; box-shadow: 0 10px 20px rgba(0,0,0,0.3);">
           ⚠️ HEADS UP: Please reach the required proximity range for enabling the QR code otherwise QR won't be enabled.
        </div>

        <p style="color: rgba(255,255,255,0.25); text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.2em; margin-bottom: 0.5rem; text-align: center;">Secure Session Active</p>
        <h2 style="color: #fff; margin: 0 0 2rem 0; font-size: 1.2rem; font-weight: 300; text-align: center;">PROXIMITY SCAN FOR <span style="color: var(--accent); font-weight: 700;">${(localStorage.getItem('flux_user') || 'GUEST').toUpperCase()}</span></h2>

        <h2 style="color: #00e5ff; text-transform: uppercase; margin: 0 0 0.5rem 0; font-size: 1.5rem; letter-spacing: 0.08em;">Transit Mode</h2>

        <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0 0 1.5rem 0;">Sleeping Key mapped to: <b style="color: #fff;">${mockEntryState.bookedSlot}</b>. Stand by for unlock.</p>
        
        <div class="qr-payload-container">
           <div class="secure-qr-box" style="background: rgba(10,10,20,0.6);">
              <div class="scanline"></div>
              <p style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.15); font-size:0.7rem; font-family:var(--font-heading); text-transform:uppercase; letter-spacing:0.15em;">Locked</p>
           </div>
           <h1 class="countdown-timer" id="entry-timer">00:15</h1>
           <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.4rem;">Fast Lane unlocks at zero</p>
        </div>

        <div class="promo-card info-banner" style="border-color: #ffaa00; background: rgba(50, 30, 0, 0.4); padding: 1rem; margin-top: 1.5rem;">
           <p style="color: #ffaa00; font-weight: 700; margin: 0 0 6px 0; text-transform: uppercase; font-size: 0.78rem;">ℹ️ Heads Up</p>
           <p style="color: rgba(255,255,255,0.85); font-size: 0.82rem; margin: 0; line-height: 1.6;">Your code encrypts and refreshes every 3 seconds once unlocked. Show it live at the gate — screenshots won't capture the active payload.</p>
        </div>

        <div class="promo-card" style="border-color: rgba(255,255,255,0.08); background: rgba(10,10,20,0.5); padding: 1rem; margin-top: 1rem;">
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
          Physical proximity ensures that only fans physically present at the gate can claim their slot. Evaluation demo bypass is active.
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
  const stadium = STADIUMS[0];
  // Start with a realistic simulator distance for the demo
  let geoResult = { mode: 'demo', dist: '5.4', stadium: stadium.name };

  // Trigger real location check (in bg) to update distance label if possible
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const dist = haversineKm(pos.coords.latitude, pos.coords.longitude, stadium.lat, stadium.lng);
      geoResult.dist = dist.toFixed(1);
      if (dist <= 1.0) geoResult.mode = 'real';
      
      // Update label live
      const distLabel = document.getElementById('proximity-dist-label');
      if (distLabel) distLabel.innerHTML = `📍 Distance: ${geoResult.dist} km from nearest stadium.`;
    }, (err) => {
       // Fallback already set to 5.4 for demo
       console.warn('GPS restricted, using demo proximity.');
    }, { timeout: 3000 });
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
           📍 Distance: ${geoContext.dist || '??'} km from nearest stadium.
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

  document.getElementById('rebook-btn').addEventListener('click', () => {
    mockEntryState.bookedSlot = null;
    mockEntryState.unlockTime = 0;
    saveEntryState();
    renderEntryModule();
  });
}

// Start sequence
function initApp() {
  initP5Background(); // Initialize (starts paused)
  renderAuthPage();
}
initApp();
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
      <div class="nav-item" data-color="#00ffe1" data-index="1" id="nav-entry-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
        Entry
      </div>
      <div class="nav-item" data-color="#00ffcc" data-index="2" id="nav-break">
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
    setNavActive(0);
    renderHomePage(); 
  });

  document.getElementById('nav-entry-btn')?.addEventListener('click', () => {
    setNavActive(1);
    renderEntryModule(); 
  });
  
  document.getElementById('nav-break')?.addEventListener('click', () => {
    setNavActive(2);
    renderFlashMarket();
  });

  document.getElementById('nav-exit')?.addEventListener('click', () => {
    setNavActive(3); 
    renderExitModule();
  });

  // Profile Avatar (Universal)
  document.querySelectorAll('#nav-avatar').forEach(el => {
    el.addEventListener('click', () => {
      renderProfilePage(); // Fixed function name mismatch
    });
  });

  // Entry Back Button
  document.getElementById('entry-back-btn')?.addEventListener('click', renderHomePage);
  document.getElementById('market-back-btn')?.addEventListener('click', renderHomePage);
  document.getElementById('exit-back-btn')?.addEventListener('click', renderHomePage);

  // Logo back-to-dashboard shortcut
  document.getElementById('header-logo')?.addEventListener('click', renderHomePage);
}

function renderExitModule() {
  const container = document.querySelector('#app');
  container.innerHTML = `
    <div id="app-container" class="animated">
      <div class="top-nav">
        <div style="display: flex; align-items: center; gap: 1rem;">
           <div class="nav-back-btn" id="exit-back-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></div>
           <div class="nav-logo">EXIT</div>
        </div>
        <div class="avatar" id="nav-avatar">
           ${getAvatarHTML(parseInt(localStorage.getItem('flux_avatar_idx') || 0), 28)}
        </div>
      </div>

      <div class="main-feed" style="padding-top: 10px; display: flex; align-items: center; justify-content: center; height: 50vh;">
         <!-- Placeholder for Future Exit Flow -->
      </div>
      
      ${getBottomNavHTML()}
    </div>
  `;

  document.getElementById('exit-back-btn').addEventListener('click', renderHomePage);
  bindUniversalNav();
  setNavActive(2);
}

/**
 * P5.js FLOW-FIELD ENGINE - LITERAL REVERT
 */
let p5Instance = null;

function initP5Background() {
  if (p5Instance) return;

  if (typeof p5 === 'undefined') {
    setTimeout(initP5Background, 100);
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
      cnv.style('opacity', '0');
      cnv.style('transition', 'opacity 1s ease');
      cnv.style('pointer-events', 'none');

      for (let i = 0; i < opt.particles; i++) {
        Particles.push(new Particle(Math.random() * p.width, Math.random() * p.height));
      }
      p.strokeWeight(opt.strokeWeight);
      p.noLoop();
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

  // Global Event Re-binding
  bindUniversalNav();

  // Global Click Integration
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.promo-card') || e.target.closest('button')) return;
    p5Instance?.triggerRandomize();
  });
}

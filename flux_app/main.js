/**
 * FLUX FORTRESS PROTOCOL - BOOTSTRAPPER (v2.0 INTELLIGENCE SYNTHESIS)
 * Main entry point for the high-fidelity crowd orchestration ecosystem.
 */

import './style.css';
import { state, loadEntryState } from './src/core/state.js';
import { authService } from './src/services/authService.js';
import { backgroundEngine } from './src/utils/backgroundEngine.js';
import { Navigation } from './src/components/Navigation.js';
import { resetLocationState } from './src/services/locationService.js';
import { FlowOrchestrator } from './src/services/FlowOrchestrator.js';

// Page Imports
import { AuthPage } from './src/pages/AuthPage.js';
import { HomePage } from './src/pages/HomePage.js';
import { EntryPage } from './src/pages/EntryPage.js';
import { MarketPage } from './src/pages/MarketPage.js';
import { ExitPage } from './src/pages/ExitPage.js';
import { ProfilePage } from './src/pages/ProfilePage.js';
import { HelpPage } from './src/pages/HelpPage.js';

/**
 * CORE RENDERING ENGINE
 */

function renderApp() {
  const appEl = document.querySelector('#app');
  
  // CINEMATIC DRONE INTRO RESTORATION
  const playIntro = !sessionStorage.getItem('flux_intro_played');
  if (playIntro) {
    sessionStorage.setItem('flux_intro_played', 'true');
    appEl.innerHTML = `
      <div id="intro-drone" class="drone-zoom">
        <div style="text-align:center; position:relative; z-index:10001;">
          <h1 class="logo" style="margin-top:0; font-size:4rem;">FLUX</h1>
          <p style="letter-spacing:0.4em; color:rgba(255,255,255,0.6); font-size:0.8rem;">ESTABLISHING FREQUENCY</p>
        </div>
      </div>
    `;
    setTimeout(() => {
       renderActualApp();
    }, 3200);
  } else {
    renderActualApp();
  }
}

function renderActualApp() {
  if (!authService.isAuth()) {
    AuthPage.render(renderActualApp);
  } else {
    // START GLOBAL INTELLIGENCE HEARTBEAT (v2.0)
    FlowOrchestrator.init();
    
    // START EXECUTIVE STADIUM SIMULATION (v3.0 MASTERPIECE)
    StadiumMind.init();
    
    renderHomePage();
  }
}

function renderHomePage() {
  HomePage.render(mountDashboardModule, renderEntryModule, renderFlashMarket, renderExitModule);
}

function renderEntryModule() {
  EntryPage.render(mountDashboardModule, renderMapModule);
}

function renderFlashMarket() {
  MarketPage.render(mountDashboardModule);
}

function renderExitModule() {
  ExitPage.render(mountDashboardModule);
}

/**
 * NAVIGATOR MODULE (v3.0 - WORLDWIDE RESILIENCE)
 */
async function renderMapModule() {
  const { loadGoogleMaps, initDashboardMap, searchNearby, executeGlobalSearch } = await import('./src/services/mapService.js');
  await loadGoogleMaps();
  
  const content = `
    <div id="navigator-full-screen" class="animated" style="position:relative; width:100%; height:82vh; background:#000; overflow:hidden;">
        <div id="map-search-console" style="position:absolute; top:15px; left:15px; right:15px; z-index:100;">
           <div class="glass-search" style="display:flex; align-items:center; background:rgba(0,0,0,0.85); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.15); border-radius:16px; padding:8px 15px; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" style="opacity:0.6;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input id="pac-input" type="text" placeholder="Search Google Maps" 
                     style="background:transparent; border:none; color:#fff; flex:1; padding:10px 15px; outline:none; font-size:0.95rem; font-family:var(--font-primary);">
              <div style="width:1px; height:24px; background:rgba(255,255,255,0.1); margin:0 10px;"></div>
              <svg id="nav-search-btn" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="cursor:pointer; transition:transform 0.3s;"><path d="m9 18 6-6-6-6"/></svg>
           </div>
           
           <div class="category-scroller" style="display:flex; overflow-x:auto; gap:10px; margin-top:12px; padding-bottom:5px;">
              <button class="map-chip" data-category="stadium">🏟️ Stadiums</button>
              <button class="map-chip" data-category="restaurant">🍔 Food</button>
              <button class="map-chip" data-category="transit">🚉 Transit</button>
              <button class="map-chip" data-category="hotel">🏨 Hotels</button>
              <button class="map-chip" data-category="mall">🛍️ Shopping</button>
           </div>
        </div>
        <div id="map-canvas" style="width:100%; height:100%;"></div>
        <div id="map-actions-layer" style="position:absolute; bottom:100px; left:15px; right:15px; z-index:100;">
           <button class="btn-primary" id="confirm-stadium-btn" style="box-shadow:0 15px 40px rgba(0,255,102,0.4); font-family:var(--font-logo);">LOCK STADIUM FREQUENCY</button>
        </div>
    </div>
  `;
  
  mountDashboardModule(content, 1, 'NAVIGATOR', renderEntryModule);
  initDashboardMap('map-canvas', 'pac-input');
  
  const handleSearch = () => {
    const query = document.getElementById('pac-input').value;
    executeGlobalSearch(query);
  };
  document.getElementById('nav-search-btn')?.addEventListener('click', handleSearch);
  document.getElementById('pac-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  document.querySelectorAll('.map-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const cat = e.target.getAttribute('data-category');
      searchNearby(cat);
    });
  });
  document.getElementById('confirm-stadium-btn')?.addEventListener('click', () => {
    renderEntryModule();
  });
}

/**
 * DASHBOARD SHELL COORDINATOR
 */
function mountDashboardModule(content, navIndex, pageTitle = 'FLUX', backAction = null) {
  document.body.className = 'theme-dashboard';
  const appEl = document.querySelector('#app');
  const isHome = navIndex === 0;

  appEl.innerHTML = `
    <div id="shell-container">
      <header id="shell-header">
        ${Navigation.getTopNavHTML(isHome, pageTitle)}
      </header>
      
      <!-- GLOBAL INTELLIGENCE HUB OVERLAY -->
      ${Navigation.getHUDHTML()}

      <div id="module-viewport">
        ${content}
      </div>
      
      <footer id="shell-footer">
        ${Navigation.getBottomNavHTML()}
      </footer>
    </div>
  `;

  // Bind Shell Events
  Navigation.bindUniversalNav = () => {
    document.getElementById('nav-home')?.addEventListener('click', renderHomePage);
    document.getElementById('nav-entry-btn')?.addEventListener('click', renderEntryModule);
    document.getElementById('nav-break')?.addEventListener('click', renderFlashMarket);
    document.getElementById('nav-exit')?.addEventListener('click', renderExitModule);
    document.getElementById('nav-avatar')?.addEventListener('click', () => ProfilePage.render(renderHomePage));
    document.getElementById('nav-back-btn')?.addEventListener('click', backAction || renderHomePage);
    document.getElementById('nav-menu-btn')?.addEventListener('click', () => {
      Navigation.renderSideNav(
        () => ProfilePage.render(renderHomePage),
        () => alert('FLUX Fortress v2.0.0-IOS'),
        () => HelpPage.render(mountDashboardModule)
      );
      Navigation.toggleSideNav(true);
    });
  };
  
  Navigation.bindUniversalNav();
  setNavActive(navIndex);
  backgroundEngine.wake();
  bindHUDResponsiveLogic();
}

/**
 * INTELLIGENCE HUD SYNC (v2.0)
 * Binds the global heartbeat to the UI.
 */
function bindHUDResponsiveLogic() {
  window.addEventListener('flux-heartbeat', (e) => {
    const data = e.detail;
    const hudFlow = document.getElementById('hud-flow');
    const hudSync = document.getElementById('hud-sync');
    const hudDirective = document.getElementById('hud-directive');
    const hudHash = document.getElementById('hud-hash');
    const hudFlowBar = document.getElementById('hud-flow-bar');
    const hudSyncBar = document.getElementById('hud-sync-bar');

    if (hudFlow) hudFlow.innerText = data.flowPulse;
    if (hudSync) hudSync.innerText = data.syncIntegrity + '%';
    if (hudDirective) hudDirective.innerText = data.lastDirective;
    if (hudHash) hudHash.innerText = data.identityHash;
    if (hudFlowBar) hudFlowBar.style.width = data.flowPulse + '%';
    if (hudSyncBar) hudSyncBar.style.width = (data.syncIntegrity - 0.2) + '%';
  });
}

function setNavActive(idx) {
  document.querySelectorAll('.nav-item').forEach((el, i) => {
    if (i === idx) {
      el.classList.add('active');
      el.style.color = el.getAttribute('data-color');
    } else {
      el.classList.remove('active');
      el.style.color = 'var(--text-muted)';
    }
  });
}

/**
 * INIT BOOTSTRAPPER
 */
resetLocationState();
loadEntryState();
backgroundEngine.init();
renderApp();

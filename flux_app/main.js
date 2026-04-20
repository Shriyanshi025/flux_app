/**
 * FLUX FORTRESS PROTOCOL - BOOTSTRAPPER (v1.5.0 HIGH-FIDELITY RESTORE)
 * Main entry point for the high-fidelity crowd orchestration prototype.
 */

import './style.css';
import { state, loadEntryState } from './src/core/state.js';
import { authService } from './src/services/authService.js';
import { backgroundEngine } from './src/utils/backgroundEngine.js';
import { Navigation } from './src/components/Navigation.js';
import { resetLocationState } from './src/services/locationService.js';

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
 * NAVIGATOR MODULE (v2.0 - GOOGLE MAPS STYLE)
 * High-fidelity restoration of floating search bars and interactive category chips.
 */
async function renderMapModule() {
  const { loadGoogleMaps, initDashboardMap, searchNearby } = await import('./src/services/mapService.js');
  await loadGoogleMaps();
  
  const content = `
    <div id="navigator-full-screen" class="animated" style="position:relative; width:100%; height:82vh; background:#000; overflow:hidden;">
        
        <!-- FLOATING GOOGLE MAPS CONSOLE -->
        <div id="map-search-console" style="position:absolute; top:15px; left:15px; right:15px; z-index:100;">
           <div class="glass-search" style="display:flex; align-items:center; background:rgba(0,0,0,0.85); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.15); border-radius:16px; padding:8px 15px; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" style="opacity:0.6;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input id="pac-input" type="text" placeholder="Search Google Maps" 
                     style="background:transparent; border:none; color:#fff; flex:1; padding:10px 15px; outline:none; font-size:0.95rem; font-family:var(--font-primary);">
              <div style="width:1px; height:24px; background:rgba(255,255,255,0.1); margin:0 10px;"></div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
           </div>
           
           <!-- QUICK CATEGORY CHIPS -->
           <div class="category-scroller" style="display:flex; overflow-x:auto; gap:10px; margin-top:12px; padding-bottom:5px;">
              <button class="map-chip" data-category="stadium">🏟️ Stadiums</button>
              <button class="map-chip" data-category="restaurant">🍔 Food</button>
              <button class="map-chip" data-category="transit">🚉 Transit</button>
              <button class="map-chip" data-category="hotel">🏨 Hotels</button>
              <button class="map-chip" data-category="mall">🛍️ Shopping</button>
           </div>
        </div>

        <div id="map-canvas" style="width:100%; height:100%;"></div>

        <!-- ACTION BUTTONS -->
        <div id="map-actions-layer" style="position:absolute; bottom:100px; left:15px; right:15px; z-index:100;">
           <button class="btn-primary" id="confirm-stadium-btn" style="box-shadow:0 15px 40px rgba(0,255,102,0.4); font-family:var(--font-logo);">LOCK STADIUM FREQUENCY</button>
        </div>
    </div>
  `;
  
  mountDashboardModule(content, 1, 'NAVIGATOR', renderEntryModule);
  
  // Bind Map Logic
  initDashboardMap('map-canvas', 'pac-input');
  
  // Bind Chips
  document.querySelectorAll('.map-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const cat = e.target.getAttribute('data-category');
      searchNearby(cat);
    });
  });

  // BUG FIX: Bind Lock Frequency Button
  document.getElementById('confirm-stadium-btn')?.addEventListener('click', () => {
    console.log('[Navigator] Frequency Locked. Returning to entry protocol.');
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
      
      <div id="module-viewport">
        ${content}
      </div>
      
      <footer id="shell-footer">
        ${Navigation.getBottomNavHTML()}
      </footer>
    </div>
  `;

  // Bind Shared Shell UI
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
        () => alert('FLUX Fortress v1.5.0'),
        () => HelpPage.render(mountDashboardModule)
      );
      Navigation.toggleSideNav(true);
    });
  };
  
  Navigation.bindUniversalNav();
  setNavActive(navIndex);
  backgroundEngine.wake();
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

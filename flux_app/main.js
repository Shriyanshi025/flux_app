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

async function renderMapModule() {
  const { loadGoogleMaps, initDashboardMap } = await import('./src/services/mapService.js');
  await loadGoogleMaps();
  
  const content = `
    <div class="main-feed animated" style="padding-top: 10px; padding-bottom: 100px;">
      <div id="map-frame-container" style="width: 100%; height: 500px; background: #000; border-radius: 24px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
         <input id="pac-input" class="controls" type="text" placeholder="SEARCH WORLD GLOBE..." 
                style="position:absolute; top:20px; left:20px; right:20px; background:rgba(0,0,0,0.8); border:1px solid var(--accent); padding:12px 20px; border-radius:12px; color:#fff; z-index:10; font-family:var(--font-primary); font-size:0.9rem; outline:none; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
         <div id="map-canvas" style="width: 100%; height: 100%;"></div>
      </div>
      <button class="btn-primary" id="confirm-stadium-btn" style="margin-top: 2rem;">LOCK FREQUENCY</button>
    </div>
  `;
  
  mountDashboardModule(content, 1, 'NAVIGATOR', renderEntryModule);
  initDashboardMap('map-canvas', 'pac-input');
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

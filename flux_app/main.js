/**
 * FLUX FORTRESS PROTOCOL - BOOTSTRAPPER (v1.5.0 MODULAR)
 * Main entry point for the high-fidelity crowd orchestration prototype.
 */

import './style.css';
import { state, loadEntryState } from './src/core/state.js';
import { authService } from './src/services/authService.js';
import { backgroundEngine } from './src/utils/backgroundEngine.js';
import { Navigation } from './src/components/Navigation.js';

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
  if (!authService.isAuth()) {
    AuthPage.render(renderApp);
  } else {
    // Basic guard: always start at Home on fresh boot or use location hash for routing
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
  const google = await loadGoogleMaps();
  
  // Logic for the Navigator specialized UI
  const content = `
    <div class="main-feed animated" style="padding-top: 10px; padding-bottom: 100px;">
      <div id="map-frame-container" style="width: 100%; height: 500px; background: #000; border-radius: 24px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
         <div id="map-canvas" style="width: 100%; height: 100%;"></div>
      </div>
      <button class="btn-primary" id="confirm-stadium-btn" style="margin-top: 2rem;">LOCK FREQUENCY</button>
    </div>
  `;
  
  mountDashboardModule(content, 1, 'NAVIGATOR');
  
  // Initialize physical map logic...
  // (Note: This is a simplified wrapper for mapService integration)
  initDashboardMap('map-canvas');
}

/**
 * DASHBOARD SHELL COORDINATOR
 * Manages the top-nav, bottom-nav, and content injection.
 */
function mountDashboardModule(content, navIndex, pageTitle = 'FLUX', backAction = null) {
  document.body.className = 'theme-dashboard';
  const appEl = document.querySelector('#app');
  
  const isHome = navIndex === 0;

  appEl.innerHTML = `
    <div id="app-container">
      ${Navigation.getTopNavHTML(isHome, pageTitle)}
      
      <main class="dashboard-main" style="padding-top: 80px; padding-bottom: 120px;">
        ${content}
      </main>
      
      ${Navigation.getBottomNavHTML()}
    </div>
  `;

  // Bind Shared Shell UI
  Navigation.bindUniversalNav = () => {
    document.getElementById('nav-home')?.addEventListener('click', renderHomePage);
    document.getElementById('nav-entry-btn')?.addEventListener('click', renderEntryModule);
    document.getElementById('nav-break')?.addEventListener('click', renderFlashMarket);
    document.getElementById('nav-exit')?.addEventListener('click', renderExitModule);
    document.getElementById('nav-avatar')?.addEventListener('click', () => ProfilePage.render(renderApp));
    document.getElementById('nav-back-btn')?.addEventListener('click', backAction || renderHomePage);
    document.getElementById('nav-menu-btn')?.addEventListener('click', () => {
      Navigation.renderSideNav(
        () => ProfilePage.render(renderApp),
        () => alert('FLUX Fortress v1.5'),
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
loadEntryState();
backgroundEngine.init();
renderApp();

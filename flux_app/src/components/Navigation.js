import { uiUtils } from '../utils/uiUtils.js';
import { authService } from '../services/authService.js';

export const Navigation = {
  getBottomNavHTML: () => {
    return `
      <!-- Smart Copyright -->
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
  },

  getTopNavHTML: (isHome, pageTitle) => {
    const avatarIdx = parseInt(localStorage.getItem('flux_avatar_idx') || 0);
    return `
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
           ${uiUtils.getAvatarHTML(avatarIdx, 28)}
        </div>
      </div>
    `;
  },

  renderSideNav: (onProfile, onAbout, onHelp) => {
    if (document.getElementById('side-nav')) return;
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
    overlay.addEventListener('click', () => Navigation.toggleSideNav(false));
    document.getElementById('nav-logout').addEventListener('click', () => authService.logout());
    document.getElementById('nav-prof').addEventListener('click', () => { Navigation.toggleSideNav(false); onProfile(); });
    document.getElementById('nav-about').addEventListener('click', () => { Navigation.toggleSideNav(false); onAbout(); });
    document.getElementById('nav-help').addEventListener('click', () => { Navigation.toggleSideNav(false); onHelp(); });
  },

  toggleSideNav: (isOpen) => {
    const nav = document.getElementById('side-nav');
    const overlay = document.getElementById('side-nav-overlay');
    if (!nav || !overlay) return;
    if (isOpen) { nav.classList.add('show'); overlay.classList.add('show'); }
    else { nav.classList.remove('show'); overlay.classList.remove('show'); }
  }
};

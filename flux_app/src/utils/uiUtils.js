import { authService } from '../services/authService.js';

export const uiUtils = {
  getAvatarTheme: (idx) => {
    const themes = [
      { bg: 'linear-gradient(135deg, #00ff66, #00d2ff)', color: 'rgba(255,255,255,0.9)' },
      { bg: 'linear-gradient(135deg, #ff00ff, #7000ff)', color: 'rgba(255,255,255,0.9)' },
      { bg: 'linear-gradient(135deg, #ffaa00, #ff4e00)', color: 'rgba(255,255,255,0.9)' },
      { bg: 'linear-gradient(135deg, #00e5ff, #004a99)', color: 'rgba(255,255,255,0.9)' }
    ];
    return themes[idx] || themes[0];
  },

  getAvatarHTML: (idx, size) => {
    const theme = uiUtils.getAvatarTheme(idx);
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${theme.color}"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`;
  },

  fmtCountdown: (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  },

  guestUpgradeCard: (featureName) => {
    return `
      <div class="promo-card guest-restricted" style="border-color:#ffaa00; background:rgba(40,25,0,0.4); text-align:center; padding:1.5rem; margin-bottom:1rem;">
        <p style="color:#ffaa00; font-weight:800; font-size:1rem; margin:0 0 0.5rem 0;">🔒 ${featureName}</p>
        <p style="color:rgba(255,255,255,0.6); font-size:0.82rem; margin:0 0 1.2rem 0; line-height:1.6;">
          Register to unlock:<br>
          <span style="color:#fff;">Fast Lane Entry · QR Access · Discounts &amp; Exit Benefits</span>
        </p>
        <button class="btn-primary" id="guest-upgrade-btn" style="background:#ffaa00; color:#000; border-color:#ffaa00; margin-top:0;">
          Create Free Account
        </button>
      </div>`;
  },

  bindGuestUpgradeBtn: (onUpgrade) => {
    document.getElementById('guest-upgrade-btn')?.addEventListener('click', () => {
      localStorage.removeItem('flux_user');
      localStorage.removeItem('flux_user_role');
      if (onUpgrade) onUpgrade();
    });
  }
};

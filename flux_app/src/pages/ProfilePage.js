import { uiUtils } from '../utils/uiUtils.js';
import { authService } from '../services/authService.js';

export const ProfilePage = {
  render: (onBack) => {
    const username = localStorage.getItem('flux_user');
    const avatarIdx = parseInt(localStorage.getItem('flux_avatar_idx') || 0);
    const regData = JSON.parse(localStorage.getItem('flux_registered_user') || '{}');

    const overlay = document.createElement('div');
    overlay.className = 'profile-overlay animated';
    overlay.style = "position:fixed; inset:0; background:rgba(0,0,0,0.95); z-index:4000; display:flex; flex-direction:column; padding: 2rem;";

    overlay.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3rem;">
        <button id="close-profile-btn" class="nav-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <h2 style="color:var(--accent); text-transform:uppercase; font-size:0.9rem; letter-spacing:0.1em; margin:0;">Identity Pass</h2>
        <div style="width:40px;"></div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; align-items:center;">
        <div id="change-avatar-btn" style="width:120px; height:120px; border-radius:50%; background:${uiUtils.getAvatarTheme(avatarIdx).bg}; display:flex; align-items:center; justify-content:center; margin-bottom:1.5rem; position:relative; box-shadow:0 0 40px rgba(0,255,102,0.2);">
           ${uiUtils.getAvatarHTML(avatarIdx, 60)}
           <div style="position:absolute; bottom:0; right:0; background:var(--accent); color:#000; padding:6px; border-radius:50%;">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
           </div>
        </div>

        <h2 style="color:#fff; margin:0; font-size:1.8rem; font-weight:900;">${username?.toUpperCase()}</h2>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-top:5px;">UID: FLUX-${Math.floor(Math.random()*90000+10000)}</p>

        <div style="width:100%; margin-top:3rem; gap:1rem; display:flex; flex-direction:column;">
          <div class="promo-card" style="padding:1.2rem; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <p style="color:var(--text-muted); font-size:0.7rem; text-transform:uppercase; margin:0 0 4px 0;">Membership Tier</p>
              <p style="color:#fff; font-weight:700; margin:0;">${authService.isGuest() ? 'Guest (Restricted)' : 'Elite Resident'}</p>
            </div>
            <div style="background:var(--accent); color:#000; font-size:0.65rem; font-weight:900; padding:4px 10px; border-radius:4px;">PRO</div>
          </div>

          <div class="promo-card" style="padding:1.2rem;">
            <p style="color:var(--text-muted); font-size:0.7rem; text-transform:uppercase; margin:0 0 1rem 0;">Identity Details</p>
            <div style="display:flex; flex-direction:column; gap:0.8rem;">
              <div style="display:flex; justify-content:space-between;">
                <span style="color:rgba(255,255,255,0.4); font-size:0.8rem;">Full Name</span>
                <span style="color:#fff; font-size:0.8rem;">${regData.fullName || 'Anonymous User'}</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:rgba(255,255,255,0.4); font-size:0.8rem;">Email</span>
                <span style="color:#fff; font-size:0.8rem;">${regData.email || 'guest@flux.network'}</span>
              </div>
            </div>
          </div>
        </div>

        <button class="btn-primary" id="profile-logout-btn" style="margin-top:auto; margin-bottom:2rem; background:rgba(255,0,60,0.1); border-color:#ff003c; color:#ff003c;">DISSOLVE SESSION</button>
      </div>
    `;

    document.body.appendChild(overlay);
    
    document.getElementById('close-profile-btn').addEventListener('click', () => {
      overlay.remove();
      if (onBack) onBack();
    });

    document.getElementById('profile-logout-btn').addEventListener('click', () => authService.logout());

    document.getElementById('change-avatar-btn').addEventListener('click', () => {
      ProfilePage.showAvatarPicker(avatarIdx, (newIdx) => {
        localStorage.setItem('flux_avatar_idx', newIdx);
        overlay.remove();
        ProfilePage.render(onBack);
      });
    });
  },

  showAvatarPicker: (currentIdx, onSelect) => {
    const picker = document.createElement('div');
    picker.style = "position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:5000; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem;";
    picker.innerHTML = `
      <div style="width:100%; max-width:400px; background:#0a0a0c; border:1px solid rgba(255,255,255,0.1); border-radius:30px; padding:2rem; text-align:center;">
        <h3 style="color:#fff; margin-bottom:1.5rem;">Choose Your Identity</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
          ${[0, 1, 2, 3].map(i => `
            <div class="avatar-option" data-idx="${i}" style="width:80px; height:80px; border-radius:50%; background:${uiUtils.getAvatarTheme(i).bg}; cursor:pointer; margin:0 auto; display:flex; align-items:center; justify-content:center; border:${i === currentIdx ? '3px solid #fff' : 'none'};">
              ${uiUtils.getAvatarHTML(i, 40)}
            </div>
          `).join('')}
        </div>
        <button id="close-avatar-picker" style="margin-top:2rem; background:transparent; border:none; color:var(--text-muted); cursor:pointer;">Cancel</button>
      </div>
    `;
    document.body.appendChild(picker);
    picker.querySelectorAll('.avatar-option').forEach(opt => {
      opt.addEventListener('click', () => {
        onSelect(parseInt(opt.getAttribute('data-idx')));
        picker.remove();
      });
    });
    document.getElementById('close-avatar-picker').addEventListener('click', () => picker.remove());
  }
};

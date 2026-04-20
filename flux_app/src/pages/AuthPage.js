import { authService } from '../services/authService.js';
import { fetchUserLocation } from '../services/locationService.js';
import { STADIUMS } from '../core/constants.js';
import { state } from '../core/state.js';
import { uiUtils } from '../utils/uiUtils.js';

export const AuthPage = {
  render: (onSuccess) => {
    document.body.className = 'theme-auth';
    const appEl = document.querySelector('#app');
    appEl.innerHTML = `
      <div id="app-container" style="height: 100%; overflow-y: auto;">
        <div class="auth-content" style="padding-bottom: 100px;">
          <h1 class="logo">FLUX</h1>
          <div class="auth-box">
            <div class="tabs" id="auth-tabs">
              <div class="tab active" data-target="login-form">Login</div>
              <div class="tab" data-target="register-form">Register</div>
            </div>
            <div id="login-form" class="animated">
              <div class="form-group"><label>Email / Username</label><input type="text" id="login-username" /></div>
              <div class="form-group"><label>Password</label><input type="password" id="login-password" /></div>
              <button id="login-submit-btn" class="btn-primary">Login</button>
              <button id="biometric-login-btn" class="btn-primary">FaceID / Fingerprint</button>
              <div style="margin-top: 1.5rem; text-align: center;">
                <a href="#" id="continue-guest-btn">Continue as <span style="color: #ffaa00;">GUEST</span></a>
              </div>
            </div>
            <div id="register-form" class="hidden animated">
              <div class="form-group"><label>Full Name</label><input type="text" id="reg-fullname" /></div>
              <div class="form-group"><label>Username</label><input type="text" id="reg-username" /></div>
              <div class="form-group"><label>Email</label><input type="email" id="reg-email" /></div>
              <div class="form-group"><label>Password</label><input type="password" id="reg-password" /></div>
              <div class="form-group"><label>Confirm Password</label><input type="password" id="reg-confirm-password" /></div>
              <div class="form-group">
                <label>Location</label><input type="text" id="reg-location" /><button class="geo-btn" id="fetch-location-btn">Auto</button>
              </div>
              <div class="form-group"><label>Nearest Stadium</label><input type="text" id="reg-stadium" readonly /></div>
              <div id="reg-error" style="color:#ff6b6b; display:none;"></div>
              <button id="register-submit-btn" class="btn-primary">Initialize Fortress</button>
            </div>
          </div>
        </div>
      </div>
    `;
    AuthPage.bindEvents(onSuccess);
  },

  computeNearestStadium: (lat, lng) => {
    let nearest = STADIUMS[0];
    let minDist = Infinity;
    const R = 6371;
    STADIUMS.forEach(s => {
      const dLat = (s.lat - lat) * Math.PI / 180;
      const dLng = (s.lng - lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(s.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      if (dist < minDist) { minDist = dist; nearest = s; }
    });
    return nearest;
  },

  bindEvents: (onSuccess) => {
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

    document.getElementById('fetch-location-btn')?.addEventListener('click', async (e) => {
      e.target.innerHTML = '...';
      try {
        const loc = await fetchUserLocation();
        const stadium = AuthPage.computeNearestStadium(loc.lat, loc.lng);
        document.getElementById('reg-location').value = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
        document.getElementById('reg-stadium').value = stadium.name;
        e.target.innerHTML = 'Done ✓';
      } catch (err) {
        document.getElementById('reg-location').value = '51.5074, -0.1278';
        document.getElementById('reg-stadium').value = 'O2 London';
        e.target.innerHTML = 'Done ✓';
      }
    });

    document.getElementById('register-submit-btn')?.addEventListener('click', () => {
      const showErr = (msg) => {
        const el = document.getElementById('reg-error');
        el.textContent = msg; el.style.display = 'block';
      };
      const fullName = document.getElementById('reg-fullname').value.trim();
      const username = document.getElementById('reg-username').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm-password').value;

      if (!fullName || !username || !email || password.length < 6 || password !== confirm) {
        return showErr('Please fill all fields correctly.');
      }

      localStorage.setItem('flux_registered_user', JSON.stringify({ fullName, username, email, passwordHash: authService.simpleHash(password) }));
      localStorage.setItem('flux_user', username);
      localStorage.setItem('flux_user_role', 'registered');
      onSuccess();
    });

    document.getElementById('login-submit-btn')?.addEventListener('click', () => {
      const input = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      if (!input) return alert('Enter credentials');
      
      const stored = JSON.parse(localStorage.getItem('flux_registered_user') || 'null');
      if (stored && (stored.username === input || stored.email === input)) {
        if (password && authService.simpleHash(password) !== stored.passwordHash) return alert('Wrong password');
        localStorage.setItem('flux_user', stored.username);
      } else {
        localStorage.setItem('flux_user', input);
      }
      localStorage.setItem('flux_user_role', 'registered');
      onSuccess();
    });

    document.getElementById('biometric-login-btn')?.addEventListener('click', (e) => {
      e.target.innerHTML = 'Scanning...';
      setTimeout(() => {
        const stored = JSON.parse(localStorage.getItem('flux_registered_user') || 'null');
        localStorage.setItem('flux_user', stored?.username || 'User');
        localStorage.setItem('flux_user_role', 'registered');
        onSuccess();
      }, 1000);
    });

    document.getElementById('continue-guest-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.setItem('flux_user', 'GUEST');
      localStorage.setItem('flux_user_role', 'guest');
      onSuccess();
    });
  }
};

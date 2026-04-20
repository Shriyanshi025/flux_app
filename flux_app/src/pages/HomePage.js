import { authService } from '../services/authService.js';
import { state } from '../core/state.js';

export const HomePage = {
  render: (mountDashboardModule, renderEntry, renderMarket, renderExit) => {
    const username = localStorage.getItem('flux_user')?.split(' ')[0].toUpperCase() || 'GUEST';
    
    const content = `
      <div id="home-container" style="width: 100%;">
        <div class="home-greeting" id="home-greeting" style="text-align: center; color: #fff; text-transform: uppercase;">
          HELLO, ${username}
        </div>
        <div class="main-feed" id="home-feed" style="gap: 30px;">
          <div class="promo-card card-arrival">
            <h3>Arrival: Green Carpet</h3>
            <p>Book a 10-minute arrival slot. Unlock the Fast Lane.</p>
            <div class="blurred-qr"></div>
            <button class="btn-primary" id="open-entry-btn">Book My Arrival Slot</button>
          </div>
          <div class="promo-card card-halftime">
            <h3>Halftime: Flash Market</h3>
            <p>Skip the concourse crush. Take 50% Off deals.</p>
            <button class="btn-primary" id="open-market-btn">Live Heatmap Deals</button>
          </div>
          <div class="promo-card card-departure">
            <h3>Departure: Relaxed Stay</h3>
            <p>Avoid post-game congestion. Stay & Save.</p>
            <button class="btn-primary" id="open-exit-btn">View Relaxed Stay Perks</button>
          </div>
          <div class="copyright-footer">
            <p>&copy; 2026 Shriyanshi Sinha. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    `;

    mountDashboardModule(content, 0);
    HomePage.bindEvents(renderEntry, renderMarket, renderExit);
  },

  bindEvents: (renderEntry, renderMarket, renderExit) => {
    document.getElementById('open-entry-btn')?.addEventListener('click', renderEntry);
    document.getElementById('open-market-btn')?.addEventListener('click', renderMarket);
    document.getElementById('open-exit-btn')?.addEventListener('click', renderExit);
    
    HomePage.initSmartHomeLogic();
  },

  initSmartHomeLogic: () => {
    const homeFeed = document.getElementById('home-feed');
    if (!homeFeed) return;
    const cards = Array.from(homeFeed.querySelectorAll('.promo-card'));
    const STICKY_TOP = 100;

    const updateCardVis = () => {
      cards.forEach((card, i) => {
        const nextCard = cards[i + 1];
        if (!nextCard) return;
        const rect = card.getBoundingClientRect();
        const nextRect = nextCard.getBoundingClientRect();
        const startFadeY = rect.bottom;
        const endFadeY = STICKY_TOP + 20;

        let opacity = 1;
        if (nextRect.top <= startFadeY) {
          const range = startFadeY - endFadeY;
          const progress = (nextRect.top - endFadeY) / range;
          opacity = Math.max(0, Math.min(1, progress * progress));
        }
        card.style.opacity = opacity;
        card.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible';
      });
    };

    homeFeed.addEventListener('scroll', updateCardVis);
    updateCardVis();
  }
};

import { SystemBrain } from '../services/SystemBrain.js';

export const SystemBrainWidget = {
  render: (distance) => {
    const status = SystemBrain.getProximityStatus(distance);
    const isNear = SystemBrain.isWithinEntryRange(distance);
    const color = isNear ? '#00ff66' : '#ffaa00';
    
    return `
      <div class="promo-card brain-widget" style="border-color: ${color}; background: rgba(0,255,102,0.05); padding: 1.2rem; margin-top: 2rem; position: relative; overflow: hidden; animation: slideIn 0.4s ease-out;">
         <div style="position: absolute; right: -10px; top: -10px; opacity: 0.1;">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
         </div>
         <p style="color: ${color}; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 8px 0;">Intelligence Module Output</p>
         <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
               <h3 style="color: #fff; margin: 0; font-size: 1rem; font-weight: 700;">${status}</h3>
               <p style="color: rgba(255,255,255,0.4); font-size: 0.75rem; margin: 4px 0 0 0;">${isNear ? 'Physical frequency locked. QR authorized.' : 'Frequency misaligned. Proceed to target.'}</p>
            </div>
            <div style="text-align: right;">
               <p style="color: ${color}; font-size: 1.2rem; font-weight: 900; margin: 0;">${distance !== null ? distance + ' KM' : '--'}</p>
               <p style="color: rgba(255,255,255,0.3); font-size: 0.6rem; text-transform: uppercase;">Range</p>
            </div>
         </div>
      </div>
    `;
  }
};

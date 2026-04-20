import { SystemBrain } from '../services/SystemBrain.js';

export const SystemBrainWidget = {
  render: (distanceKm, crowdLevel = 45, waitTime = 12) => {
    const distance = parseFloat(distanceKm || 0);
    const flowScore = Math.round(SystemBrain.calculateFlowScore(crowdLevel, distance, waitTime));
    const decision = SystemBrain.getDecision(crowdLevel, distance, waitTime);
    const action = SystemBrain.getAction(crowdLevel, distance, waitTime);
    
    // Status color based on score level
    const scoreColor = flowScore > 80 ? '#ff003c' : flowScore > 50 ? '#ffaa00' : '#00ff66';
    
    return `
      <div class="promo-card brain-widget animated" style="border-color: ${scoreColor}; background: rgba(0,0,0,0.8); padding: 1.5rem; margin-top: 2rem;">
         <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem;">
            <p style="color: ${scoreColor}; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2rem; margin:0;">SYSTEM LOGS (v1.5 INTEL)</p>
            <div class="pulse-dot" style="background:${scoreColor};"></div>
         </div>

         <!-- DATA GRID -->
         <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem; margin-bottom:1.5rem;">
            <div style="padding:10px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
               <p style="color:rgba(255,255,255,0.3); font-size:0.5rem; text-transform:uppercase; margin:0;">Zone</p>
               <p style="color:#fff; font-size:0.8rem; font-weight:700; margin:4px 0 0 0;">Sector 7-G</p>
            </div>
            <div style="padding:10px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
               <p style="color:rgba(255,255,255,0.3); font-size:0.5rem; text-transform:uppercase; margin:0;">Distance</p>
               <p style="color:#fff; font-size:0.8rem; font-weight:700; margin:4px 0 0 0;">${distance.toFixed(2)} KM</p>
            </div>
            <div style="padding:10px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
               <p style="color:rgba(255,255,255,0.3); font-size:0.5rem; text-transform:uppercase; margin:0;">Load</p>
               <p style="color:#fff; font-size:0.8rem; font-weight:700; margin:4px 0 0 0;">${crowdLevel}%</p>
            </div>
            <div style="padding:10px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
               <p style="color:rgba(255,255,255,0.3); font-size:0.5rem; text-transform:uppercase; margin:0;">Latency</p>
               <p style="color:#fff; font-size:0.8rem; font-weight:700; margin:4px 0 0 0;">${waitTime} MIN</p>
            </div>
         </div>

         <div class="divider" style="height:1px; background:rgba(255,255,255,0.1); margin:1.5rem 0;"></div>

         <!-- FLOW SCORE HEX -->
         <div style="text-align:center; margin-bottom:1.5rem;">
            <p style="color:rgba(255,255,255,0.3); font-size:0.6rem; letter-spacing:3px; margin:0 0 10px 0;">FLOW SCORE</p>
            <h1 style="color:${scoreColor}; font-size:4rem; font-weight:900; margin:0; line-height:1; font-family:var(--font-logo);">${flowScore}</h1>
         </div>

         <!-- DECISION BANNER -->
         <div style="background:${scoreColor}15; border:1px solid ${scoreColor}40; padding:12px; border-radius:12px; margin-bottom:1.2rem;">
            <p style="color:${scoreColor}; font-weight:900; font-size:0.8rem; text-align:center; margin:0; letter-spacing:1px;">${decision}</p>
         </div>

         <div style="margin-top:1rem;">
            <p style="color:rgba(255,255,255,0.3); font-size:0.5rem; text-transform:uppercase; margin:0;">Recommended Action</p>
            <p style="color:#fff; font-size:1.1rem; font-weight:700; margin:5px 0 0 0;">${action}</p>
         </div>
      </div>
    `;
  }
};

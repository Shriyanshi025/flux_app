export const STADIUMS = [
  { name: 'Sector 4 Arena (New York)', lat: 40.7128, lng: -74.0060 },
  { name: 'O2 London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo Dome', lat: 35.6762, lng: 139.6503 }
];

export const SLOT_CAPACITY = {
  'relaxed':  { label: 'Relaxed Arrival (2h)', booked: 127, max: 500, points: 200, isPeak: false },
  'early':    { label: 'Early Bird (1.5h)',    booked: 312, max: 500, points: 100, isPeak: false },
  'standard': { label: 'Standard Entry (1h)',  booked: 489, max: 500, points: 50,  isPeak: false },
  'peak':     { label: 'Peak Pulse (30m)',     booked: 500, max: 500, points: 0,   isPeak: true  } 
};

export const EXIT_TIER_DATA = {
  sprinter: { count: 1240, label: 'Priority Departure', desc: 'Urgent — Train / Flight', color: '#ff003c', icon: '🚆', action: 'FAST TRACK ACTIVE', pct: 22 },
  stroller:  { count: 2870, label: 'Flexible Departure',  desc: 'Standard — Rideshare',     color: '#ffaa00', icon: '🚗', action: 'SURGE ALERT SENT',  pct: 51 },
  anchor:    { count: 1630, label: 'Relaxed Departure',   desc: 'Stay & Save — Local',      color: '#8400ff', icon: '🎬', action: 'SOFT EXIT LOCKED',  pct: 27 },
};

export const INITIAL_MARKET_DATA = [
  { id: 'burgers-s4', name: 'Sector 4 Burgers', type: 'Main', wait: 8, inventory: 95, priceBase: 12.00, priceCurrent: 12.00, sector: 4, trend: 'stable' },
  { id: 'tacos-g-d', name: 'Gate D Tacos', type: 'Exotic', wait: 3, inventory: 88, priceBase: 10.00, priceCurrent: 10.00, sector: 2, trend: 'stable' },
  { id: 'pizza-w-w', name: 'West Wing Pizza', type: 'Main', wait: 12, inventory: 70, priceBase: 14.00, priceCurrent: 14.00, sector: 1, trend: 'stable' },
  { id: 'dogs-e-e', name: 'East End Dogs', type: 'Quick', wait: 5, inventory: 99, priceBase: 8.00, priceCurrent: 8.00, sector: 6, trend: 'stable' }
];

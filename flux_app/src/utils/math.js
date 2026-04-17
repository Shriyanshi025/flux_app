/**
 * Haversine distance in km
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/**
 * Seeded random helper
 */
export function seededRandom(seed) {
  let rng = (seed >>> 0);
  return function() {
    rng = ((rng * 1664525 + 1013904223) >>> 0);
    return rng / 4294967296;
  };
}

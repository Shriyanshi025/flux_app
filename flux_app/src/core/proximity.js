import { haversineKm, seededRandom } from '../utils/math.js';

/**
 * High-Security signed QR Key (HMAC Simulation)
 * Generates a rotating signature based on a 3-second time window.
 */
export function generateSignedKey(seed) {
  const timeWindow = Math.floor(Date.now() / 3000);
  const signature = btoa(`FLUX-${seed}-${timeWindow}`).substring(0, 12);
  return signature;
}

/**
 * QR CODE SVG GENERATOR
 * Produces a visually authentic QR code SVG with randomised data modules.
 */
export function generateQRSVG(seed) {
  const mods = 21;  // QR Version 1: 21×21
  const msz  = 9;   // pixels per module
  const total = mods * msz;
  
  // Use a combination of user seed and rotating signature for the matrix
  const signedSeed = generateSignedKey(seed);
  const rand = seededRandom(parseInt(signedSeed, 36));

  // Data modules — skip finder/timing reserved areas
  let data = '';
  for (let r = 0; r < mods; r++) {
    for (let c = 0; c < mods; c++) {
      if (r < 9 && c < 9)         continue; // top-left finder
      if (r < 9 && c > 12)        continue; // top-right finder
      if (r > 12 && c < 9)        continue; // bottom-left finder
      if (r === 6 || c === 6) {              // timing pattern
        if ((r + c) % 2 === 0) data += `<rect x="${c*msz}" y="${r*msz}" width="${msz}" height="${msz}" fill="#000"/>`;
        continue;
      }
      if (rand() > 0.52) data += `<rect x="${c*msz}" y="${r*msz}" width="${msz}" height="${msz}" fill="#000"/>`;
    }
  }

  // Finder pattern (7×7 with inner eye)
  const fp = (x, y) => `
    <rect x="${x}" y="${y}" width="${7*msz}" height="${7*msz}" fill="#000"/>
    <rect x="${x+msz}" y="${y+msz}" width="${5*msz}" height="${5*msz}" fill="#fff"/>
    <rect x="${x+2*msz}" y="${y+2*msz}" width="${3*msz}" height="${3*msz}" fill="#000"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}">
    <rect width="${total}" height="${total}" fill="#fff"/>
    ${data}
    ${fp(0, 0)}
    ${fp((mods-7)*msz, 0)}
    ${fp(0, (mods-7)*msz)}
  </svg>`;
}

/**
 * Proximity Logic (Verification)
 */
export function verifyProximity(userLat, userLng, targetLat, targetLng, maxDistKm = 0.5) {
  const dist = haversineKm(userLat, userLng, targetLat, targetLng);
  return dist <= maxDistKm;
}

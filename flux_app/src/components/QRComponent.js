/**
 * QR Code Engine - Secure Rotating Payload
 * Produces a visually authentic QR code SVG with randomized data modules.
 */
export const QRComponent = {
  generateSVG: (seed) => {
    const mods = 21; // QR Version 1: 21×21
    const msz = 9;  // pixels per module
    const total = mods * msz;

    let rng = (seed >>> 0);
    const rand = () => {
      rng = ((rng * 1664525 + 1013904223) >>> 0);
      return rng / 4294967296;
    };

    // Data modules — skip finder/timing reserved areas
    let data = '';
    for (let r = 0; r < mods; r++) {
      for (let c = 0; c < mods; c++) {
        if (r < 9 && c < 9) continue; // top-left
        if (r < 9 && c > 12) continue; // top-right
        if (r > 12 && c < 9) continue; // bottom-left
        if (r === 6 || c === 6) { // timing
          if ((r + c) % 2 === 0) data += `<rect x="${c * msz}" y="${r * msz}" width="${msz}" height="${msz}" fill="#000"/>`;
          continue;
        }
        if (rand() > 0.52) data += `<rect x="${c * msz}" y="${r * msz}" width="${msz}" height="${msz}" fill="#000"/>`;
      }
    }

    // Finder pattern
    const fp = (x, y) => `
      <rect x="${x}" y="${y}" width="${7 * msz}" height="${7 * msz}" fill="#000"/>
      <rect x="${x + msz}" y="${y + msz}" width="${5 * msz}" height="${5 * msz}" fill="#fff"/>
      <rect x="${x + 2 * msz}" y="${y + 2 * msz}" width="${3 * msz}" height="${3 * msz}" fill="#000"/>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}">
      <rect width="${total}" height="${total}" fill="#fff"/>
      ${data}
      ${fp(0, 0)}
      ${fp((mods - 7) * msz, 0)}
      ${fp(0, (mods - 7) * msz)}
    </svg>`;
  }
};

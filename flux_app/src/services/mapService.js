/**
 * Google Maps SDK Integration Service
 */

export const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

export const STADIUMS = [
  { id: 'ny', name: 'Sector 4 Arena (New York)', lat: 40.7128, lng: -74.0060 },
  { id: 'ldn', name: 'O2 London', lat: 51.5074, lng: -0.1278 },
  { id: 'tyo', name: 'Tokyo Dome', lat: 35.6762, lng: 139.6503 }
];

/**
 * Load Google Maps SDK
 */
export function loadGoogleMaps() {
  if (typeof google !== 'undefined') return Promise.resolve(google);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initMapsCallback&libraries=geometry`;
    script.async = true;
    script.defer = true;
    window.initMapsCallback = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Initialize a Map Instance
 */
export async function initDashboardMap(elementId, centerLat, centerLng) {
  const google = await loadGoogleMaps();
  const map = new google.maps.Map(document.getElementById(elementId), {
    center: { lat: centerLat, lng: centerLng },
    zoom: 14,
    styles: DARK_MAP_STYLE,
    disableDefaultUI: true,
  });

  return map;
}

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
];

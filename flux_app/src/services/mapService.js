/**
 * Google Maps SDK Integration Service
 */

const _rawKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
export const GOOGLE_MAPS_KEY =
  _rawKey && _rawKey.trim() !== ''
    ? _rawKey
    : 'AIzaSyA3oxIok5adpJPXg2qGBdYIcHWCINyO_dc';
if (import.meta.env.DEV) {
  console.log('FINAL API KEY (mapService):', GOOGLE_MAPS_KEY ? '[key loaded]' : '[EMPTY - fallback active]');
}

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initMapsCallback&libraries=geometry,places`;
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
    scrollwheel: false,
    gestureHandling: 'cooperative',
  });

  return map;
}

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64779e" }],
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334e87" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#283d6a" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6f9ba5" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3C7680" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#304a7d" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98a5be" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2c6675" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#255761" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b0d5ce" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "transit",
    elementType: "line",
    stylers: [{ color: "#283d6a" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry.fill",
    stylers: [{ color: "#283d6a" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#3a4762" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1626" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4e6d70" }],
  },
];

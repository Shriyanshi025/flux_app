import { setPinnedLocation, resolveLocationName, calculateDistance } from './locationService.js';

const _rawKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
export const GOOGLE_MAPS_KEY =
  _rawKey && _rawKey.trim() !== ''
    ? _rawKey
    : 'AIzaSyA3oxIok5adpJPXg2qGBdYIcHWCINyO_dc';

export function loadGoogleMaps() {
  if (typeof google !== 'undefined') return Promise.resolve(google);
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-maps-sdk')) return;
    const script = document.createElement('script');
    script.id = 'google-maps-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initMapsCallback&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    window.initMapsCallback = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * HIGH-FIDELITY SMART MAP INITIALIZATION
 * Restores the SearchBox + Geocoder fallback for worldwide 'Globe' navigation.
 */
export async function initDashboardMap(elementId, searchInputId) {
  const google = await loadGoogleMaps();
  const mapCanvas = document.getElementById(elementId);
  if (!mapCanvas) return;

  const map = new google.maps.Map(mapCanvas, {
    center: { lat: 40.7128, lng: -74.0060 }, // Default NYC
    zoom: 12,
    styles: DARK_MAP_STYLE,
    disableDefaultUI: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false
  });

  const marker = new google.maps.Marker({
    map,
    draggable: true,
    animation: google.maps.Animation.DROP,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: "#00ff66",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#ffffff"
    }
  });

  // RESTORE: WORLDWIDE SEARCH LOGIC
  const input = document.getElementById(searchInputId);
  if (input) {
    const searchBox = new google.maps.places.SearchBox(input);
    
    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (!places || places.length === 0) {
        // FALLBACK: Global Geocoder for "World's Globe" resilience
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: input.value }, (results, status) => {
          if (status === 'OK') {
            const loc = results[0].geometry.location;
            updateMapToLocation(loc.lat(), loc.lng());
          } else {
            alert("LOCATION NOT FOUND ON WORLD GLOBE");
          }
        });
        return;
      }
      const place = places[0];
      if (!place.geometry || !place.geometry.location) return;
      updateMapToLocation(place.geometry.location.lat(), place.geometry.location.lng());
    });
  }

  const updateMapToLocation = (lat, lng) => {
    const pos = { lat, lng };
    map.setCenter(pos);
    map.setZoom(15);
    marker.setPosition(pos);
    setPinnedLocation(lat, lng);
    resolveLocationName(lat, lng);
    calculateDistance();
  };

  map.addListener('click', (e) => {
    updateMapToLocation(e.latLng.lat(), e.latLng.lng());
  });

  return map;
}

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#131313" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#39ff14" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#333333" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#222222" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] }
];

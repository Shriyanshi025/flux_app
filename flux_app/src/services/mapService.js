/**
 * MAP SERVICE - Professional Google Maps Integration
 * Supports Secure API Injection, SearchBox Autocomplete, and Live Density Overlays (v3.0).
 */

import { state } from '../core/state.js';
import { setPinnedLocation } from './locationService.js';

let map = null;
let marker = null;
let searchBox = null;
let placesService = null;
let geocoder = null;
let heatCircles = [];

export async function loadGoogleMaps() {
    if (window.google && window.google.maps) return;
    const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&callback=initMapsCallback`;
        script.async = true;
        window.initMapsCallback = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * INIT DASHBOARD MAP
 * High-responsiveness search engine with Geocoder fallbacks.
 */
export async function initDashboardMap(canvasId, inputId) {
    const { Map } = await google.maps.importLibrary("maps");
    const { Marker } = await google.maps.importLibrary("marker");
    const { SearchBox } = await google.maps.importLibrary("places");

    const mapCenter = { lat: 21.1926, lng: 81.2856 }; 

    map = new Map(document.getElementById(canvasId), {
        center: mapCenter,
        zoom: 15,
        mapId: "FLUX_NAVIGATOR_UI", 
        disableDefaultUI: true,
        styles: MapStyles 
    });

    marker = new Marker({
        map: map,
        draggable: true,
        position: mapCenter, 
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#00ff66",
            fillOpacity: 1,
            strokeWeight: 3,
            strokeColor: "#fff"
        }
    });

    const input = document.getElementById(inputId);
    if (input) {
        searchBox = new google.maps.places.SearchBox(input);
        map.addListener("bounds_changed", () => {
            searchBox.setBounds(map.getBounds());
        });
        searchBox.addListener("places_changed", () => {
            const places = searchBox.getPlaces();
            if (places.length === 0) return;
            const place = places[0];
            if (!place.geometry || !place.geometry.location) return;
            updateTargetLocation(place.geometry.location, place.name || place.formatted_address);
            if (place.geometry.viewport) map.fitBounds(place.geometry.viewport); else map.panTo(place.geometry.location);
        });
    }

    placesService = new google.maps.places.PlacesService(map);
    geocoder = new google.maps.Geocoder();

    map.addListener("click", (e) => resolveAddressDeep(e.latLng));
    marker.addListener("dragend", (e) => resolveAddressDeep(e.latLng));

    // MASTERPIECE v3.0: Start Intelligence Overlay Sync
    startIntelligenceOverlaySync();
}

/**
 * INTELLIGENCE OVERLAY SYNC
 * Injects dynamic 'Heat Circles' based on simulated stadium matrix.
 */
function startIntelligenceOverlaySync() {
    window.addEventListener('flux-heartbeat', () => {
        if (!map) return;
        
        // Clear existing heat
        heatCircles.forEach(c => c.setMap(null));
        heatCircles = [];

        const matrix = state.stadiumMatrix;
        const center = map.getCenter();

        // Simulate 9 sectors around the current map center for world-wide visual depth
        matrix.sectors.forEach((s, i) => {
            const angle = (i * 40) * (Math.PI / 180);
            const dist = 0.003; // ~300 meters
            const lat = center.lat() + Math.cos(angle) * dist;
            const lng = center.lng() + Math.sin(angle) * dist;
            
            const color = s.status === 'CRITICAL' ? '#ff003c' : s.status === 'DENSE' ? '#ffaa00' : '#00ff66';
            const radius = (s.occupancy / s.capacity) * 200;

            const circle = new google.maps.Circle({
                map: map,
                center: { lat, lng },
                radius: radius,
                fillColor: color,
                fillOpacity: 0.15,
                strokeColor: color,
                strokeOpacity: 0.3,
                strokeWeight: 1,
                clickable: false
            });
            heatCircles.push(circle);
        });
    });
}

export function executeGlobalSearch(query) {
    if (!query || !geocoder) return;
    geocoder.geocode({ address: query }, (results, status) => {
        if (status === "OK" && results[0]) {
            const place = results[0];
            updateTargetLocation(place.geometry.location, place.formatted_address);
            if (place.geometry.viewport) map.fitBounds(place.geometry.viewport); else {
                map.panTo(place.geometry.location);
                map.setZoom(15);
            }
        }
    });
}

export function searchNearby(category) {
    if (!placesService || !map) return;
    const request = {
        location: map.getCenter(),
        radius: '5000',
        type: [category]
    };
    placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const place = results[0];
            updateTargetLocation(place.geometry.location, place.name);
            map.panTo(place.geometry.location);
            map.setZoom(16);
        }
    });
}

function updateTargetLocation(latLng, name) {
    if (!marker) return;
    marker.setPosition(latLng);
    setPinnedLocation(latLng.lat(), latLng.lng(), name);
}

function resolveAddressDeep(latLng) {
    if (!geocoder) return;
    geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === "OK" && results[0]) {
            updateTargetLocation(latLng, results[0].formatted_address);
        }
    });
}

const MapStyles = [
    { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
    { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

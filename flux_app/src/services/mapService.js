/**
 * MAP SERVICE - Professional Google Maps Integration
 * Supports Secure API Injection, SearchBox Autocomplete, and Deep-Find Discovery.
 */

import { state } from '../core/state.js';
import { setPinnedLocation } from './locationService.js';

let map = null;
let marker = null;
let searchBox = null;
let placesService = null;

export async function loadGoogleMaps() {
    if (window.google && window.google.maps) return;
    
    // FETCH KEYS SECURELY from Environment
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

    const mapCenter = { lat: 21.1926, lng: 81.2856 }; // Default: Durg Region

    map = new Map(document.getElementById(canvasId), {
        center: mapCenter,
        zoom: 14,
        mapId: "FLUX_NAVIGATOR_UI", // Vector map capability
        disableDefaultUI: true,
        styles: MapStyles // High-fidelity dark mode
    });

    marker = new Marker({
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        position: mapCenter, 
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#00ff66",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#fff"
        }
    });

    const input = document.getElementById(inputId);
    searchBox = new google.maps.places.SearchBox(input);

    placesService = new google.maps.places.PlacesService(map);

    // Bias search results towards current viewport
    map.addListener("bounds_changed", () => {
        searchBox.setBounds(map.getBounds());
    });

    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;
        
        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        updateTargetLocation(place.geometry.location, place.name || place.formatted_address);
        
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
        }
    });

    // MANUAL CLICK DISCOVERY (v2.0)
    map.addListener("click", (e) => {
        const latLng = e.latLng;
        resolveAddressDeep(latLng);
    });

    marker.addListener("dragend", (e) => {
        resolveAddressDeep(e.latLng);
    });
}

/**
 * SEARCH NEARBY (Intelligence Overhaul)
 * Uses PlacesService to find category-specific high-vibration targets.
 */
export function searchNearby(category) {
    if (!placesService || !map) return;
    
    console.log(`[MapService] Proximity Scan: ${category}...`);
    
    const request = {
        location: map.getCenter(),
        radius: '5000',
        type: [category]
    };

    placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Pick the best match (first one)
            const place = results[0];
            updateTargetLocation(place.geometry.location, place.name);
            map.panTo(place.geometry.location);
            map.setZoom(16);
        }
    });
}

function updateTargetLocation(latLng, name) {
    marker.setPosition(latLng);
    setPinnedLocation(latLng.lat(), latLng.lng(), name);
}

function resolveAddressDeep(latLng) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === "OK" && results[0]) {
            updateTargetLocation(latLng, results[0].formatted_address);
        }
    });
}

/**
 * HIGH-FIDELITY MAP STYLES
 */
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

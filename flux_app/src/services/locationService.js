// locationService.js

let userLocation = null;
let selectedLocation = null;
let selectedLocationName = "";
let distance = null;

// 📍 Get user's real location
export const fetchUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        resolve(userLocation);
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
};

// 📍 Set pinned location (from map click)
export const setPinnedLocation = (lat, lng) => {
  selectedLocation = { lat, lng };
};

// 📍 Reverse geocode (Google Maps)
export const resolveLocationName = (lat, lng) => {
  return new Promise((resolve, reject) => {
    if (typeof window.google === 'undefined' || !window.google.maps) {
      reject("Google Maps SDK not loaded");
      return;
    }
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        selectedLocationName = results[0].formatted_address;
        resolve(selectedLocationName);
      } else {
        reject("Location name not found");
      }
    });
  });
};

// 📏 Distance calculation (Haversine)
export const calculateDistance = () => {
  if (!userLocation || !selectedLocation) return null;

  const R = 6371; // Earth radius in km
  const dLat = (selectedLocation.lat - userLocation.lat) * Math.PI / 180;
  const dLng = (selectedLocation.lng - userLocation.lng) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(userLocation.lat * Math.PI / 180) *
    Math.cos(selectedLocation.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  distance = (R * c).toFixed(2);
  return distance;
};

// 📦 Getter (single source of truth)
export const getLocationState = () => {
  return {
    userLocation,
    selectedLocation,
    selectedLocationName,
    distance,
  };
};

// 🔄 Reset every session (IMPORTANT)
export const resetLocationState = () => {
  userLocation = null;
  selectedLocation = null;
  selectedLocationName = "";
  distance = null;
};

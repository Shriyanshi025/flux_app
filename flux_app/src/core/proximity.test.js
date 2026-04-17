import { describe, it, expect } from 'vitest';
import { verifyProximity } from './proximity.js';

describe('Proximity Protocol', () => {
  it('should verify proximity within range', () => {
    // New York (Sector 4)
    const nyLat = 40.7128;
    const nyLng = -74.0060;
    
    // 100 meters away
    const userLat = 40.7130; 
    const userLng = -74.0062;
    
    expect(verifyProximity(userLat, userLng, nyLat, nyLng, 0.5)).toBe(true);
  });

  it('should deny access outside range', () => {
    // New York
    const nyLat = 40.7128;
    const nyLng = -74.0060;
    
    // 5km away
    const userLat = 40.7580; 
    const userLng = -73.9855;
    
    expect(verifyProximity(userLat, userLng, nyLat, nyLng, 0.5)).toBe(false);
  });
});

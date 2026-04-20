/**
 * SYSTEM BRAIN - Central Intelligence Module
 * Decoupled from core location logic. 
 * Focuses on Flow Score and Status Feedback.
 */

export const SystemBrain = {
  /**
   * Logic: Is user within entry range?
   * (Expects distance from locationService)
   */
  isWithinEntryRange: (distanceKm) => {
    if (distanceKm === null || isNaN(distanceKm)) return false;
    return parseFloat(distanceKm) <= 2.0;
  },

  /**
   * Status strings
   */
  getProximityStatus: (distanceKm) => {
    if (distanceKm === null || isNaN(distanceKm)) return "Detecting Location...";
    if (parseFloat(distanceKm) <= 2.0) return "Proximity Verified";
    return "Outside Entry Range";
  }
};

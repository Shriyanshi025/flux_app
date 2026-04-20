/**
 * SYSTEM BRAIN - Central Intelligence Module (v1.5.0 HARD RESTORE)
 * Ported from legacy flow_engine.dart and original monolithic algorithms.
 */

export const SystemBrain = {
  /**
   * CORE FLOW ALGORITHM (Ported from legacy)
   * Weighs crowd density, physical proximity, and wait-time overhead.
   */
  calculateFlowScore: (crowdLevel, distanceKm, waitTime) => {
    const crowdWeight = crowdLevel || 50;
    const waitWeight = (waitTime || 0) * 2;
    const distanceWeight = (distanceKm || 0) * 10; // Normalized for 100-base
    
    const score = (crowdWeight + waitWeight + distanceWeight);
    return Math.min(100, Math.max(0, score));
  },

  /**
   * INTELLIGENT DECISION ENGINE
   */
  getDecision: (crowdLevel, distanceKm, waitTime) => {
    if (crowdLevel > 80) return "HIGH CONGESTION";
    if (distanceKm > 2.0) return "FAR FROM TARGET";
    if (waitTime > 15) return "QUEUE OVERLOADED";
    return "NOMINAL FLOW";
  },

  /**
   * RECOMMENDED ACTION ENGINE
   */
  getAction: (crowdLevel, distanceKm, waitTime) => {
    if (crowdLevel > 80) return "Trigger Discount Nearby";
    if (distanceKm > 2.0) return "Execute Geofence Lock";
    if (waitTime > 15) return "Suggest Alternate Sector";
    return "Proceed to Secure Entry";
  },

  /**
   * STATUS UTILITIES
   */
  isWithinEntryRange: (distanceKm) => {
    if (distanceKm === null || isNaN(distanceKm)) return false;
    return parseFloat(distanceKm) <= 2.0;
  },

  getProximityStatus: (distanceKm) => {
    if (distanceKm === null || isNaN(distanceKm)) return "Detecting Frequency...";
    if (parseFloat(distanceKm) <= 2.0) return "Frequency Locked";
    return "Frequency Misaligned";
  }
};

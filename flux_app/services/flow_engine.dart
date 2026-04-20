class FlowEngine {
  /// Calculates the flow score based on crowd level, distance to gate, and wait time.
  /// The score is clamped between 0 and 100.
  double calculateFlowScore(int crowdLevel, double distanceToGate, int waitTime) {
    double score = crowdLevel + (waitTime * 2) + (distanceToGate / 10);
    return score.clamp(0.0, 100.0);
  }

  /// Returns a decision string based on the provided metrics.
  String getDecision(int crowdLevel, double distanceToGate, int waitTime) {
    if (crowdLevel > 80) {
      return "High Congestion";
    } else if (distanceToGate > 500) {
      return "Far From Gate";
    } else if (waitTime > 15) {
      return "Queue Overloaded";
    } else {
      return "Normal";
    }
  }

  /// Returns an action string based on the provided metrics.
  String getAction(int crowdLevel, double distanceToGate, int waitTime) {
    if (crowdLevel > 80) {
      return "Trigger Discount Nearby";
    } else if (distanceToGate > 500) {
      return "Suggest Faster Gate";
    } else if (waitTime > 15) {
      return "Suggest Alternate Stall";
    } else {
      return "No Action";
    }
  }
}

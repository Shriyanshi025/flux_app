import 'package:flutter/material.dart';
import 'dart:math';

class SystemBrainWidget extends StatelessWidget {
  final double userLat;
  final double userLng;
  final double destLat;
  final double destLng;

  const SystemBrainWidget({
    Key? key,
    required this.userLat,
    required this.userLng,
    required this.destLat,
    required this.destLng,
  }) : super(key: key);

  double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const R = 6371; // km
    final dLat = (lat2 - lat1) * 3.141592653589793 / 180;
    final dLon = (lon2 - lon1) * 3.141592653589793 / 180;

    final a = (sin(dLat / 2) * sin(dLat / 2)) +
        cos(lat1 * 3.141592653589793 / 180) *
            cos(lat2 * 3.141592653589793 / 180) *
            (sin(dLon / 2) * sin(dLon / 2));

    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return R * c;
  }

  @override
  Widget build(BuildContext context) {
    // Validation
    if (userLat == 0 || userLng == 0) {
      return _buildErrorCard("Location not available");
    }

    final double distanceKm = calculateDistance(userLat, userLng, destLat, destLng);
    
    // Dynamic Logic based on Distance
    const String zone = "Sector 7-G";
    const int crowdLevel = 85;
    const int waitTime = 20;
    
    // Flow Score calculation (legacy formula matching JS)
    final double flowScore = (crowdLevel + (waitTime * 2) + (distanceKm * 100)).clamp(0.0, 100.0);
    final String decision = distanceKm > 2.0 ? "Far From Venue" : "High Congestion";
    final String action = distanceKm > 2.0 ? "Navigate to Stadium" : "Trigger Discount Nearby";

    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      margin: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            colors: [Colors.blueGrey.shade900, Colors.black87],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionTitle("SYSTEM LOGS"),
            const SizedBox(height: 12),
            _buildDataRow("Zone", zone),
            _buildDataRow("Crowd Level", "$crowdLevel%"),
            _buildDataRow("Distance", "${distanceKm.toStringAsFixed(2)} km"),
            _buildDataRow("Wait Time", "${waitTime}min"),
            
            const Divider(color: Colors.white24, height: 32),

            Center(
              child: Column(
                children: [
                  Text(
                    "FLOW SCORE",
                    style: TextStyle(
                      color: Colors.white70,
                      letterSpacing: 2,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    flowScore.toInt().toString(),
                    style: TextStyle(
                      color: _getScoreColor(flowScore),
                      fontSize: 64,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -2,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: Colors.redAccent.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
              ),
              child: Center(
                child: Text(
                  decision.toUpperCase(),
                  style: TextStyle(
                    color: Colors.redAccent,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 16),

            Text(
              "RECOMMENDED ACTION",
              style: TextStyle(
                color: Colors.white38,
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              action,
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorCard(String message) {
     return Card(
       color: Colors.black87,
       child: Padding(
         padding: const EdgeInsets.all(24.0),
         child: Text(message, style: const TextStyle(color: Colors.redAccent)),
       ),
     );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(
        color: Colors.cyanAccent,
        fontSize: 12,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
      ),
    );
  }

  Widget _buildDataRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white60, fontSize: 14)),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Color _getScoreColor(double score) {
    if (score > 80) return Colors.redAccent;
    if (score > 50) return Colors.orangeAccent;
    return Colors.greenAccent;
  }
}

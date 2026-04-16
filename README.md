# FLUX - Fortress Protocol
### Smart Congestion Orchestration & High-Security Fan Experience

**FLUX** is a high-fidelity, crowd-orchestration system designed for ultra-modern smart cities and stadiums. Built on the "Fortress Protocol," it synchronizes thousands of people through real-time arrival windows, biometric identity management, and Google Maps-powered geospatial orchestration to eliminate congestion before it begins.

---

## 1. Google Services Architecture (Submission Requirement)
This project meaningfully integrates **Google Services** to drive the Assistant's logic and UX:

- **Google Cloud Run**: The backbone of the application. The FLUX dashboard is hosted as a serverless container, ensuring world-class scalability.
- **Google Maps Platform (Geofence Engine)**: Integrated into the **Live Navigation** module. Users initialize their arrival by selecting a target stadium on an interactive map. The "Proximity Protocol" then uses Maps geospatial data to verify the user is within the required gate range before unlocking secure keys.
- **Firebase Analytics (Telemetry)**: A lightweight engine that logs real-time orchestration events (e.g., `stadium_frequency_locked`, `entry_slot_booked`) to monitor crowd density.
- **Google Fonts (UX/UI)**: Leverages the Google Fonts API (`Outfit` and `Work Sans`) for a premium "Neon Noir" aesthetic.
- **Google Cloud Build**: Powering our high-speed CI/CD pipeline for automated multi-platform deployment.

---

## 2. High-Fidelity Visual Engine
FLUX features a state-of-the-art visual experience engineered for immersion and performance:

- **Dynamic p5.js Engine**: A kinetic flow-field background that responds to user session states. This engine is **gated by authentication**, hibernating during login to save resources and activating instantly upon entry into the home dashboard.
- **"Red Wine Cloudy" Auth Theme**: A custom CSS-driven aesthetic for the authentication screen, featuring layered radial gradients and atmospheric "cloudy" vignettes that adapt to any screen size.
- **Unified Glassmorphism**: High-performance translucency and `-webkit-backdrop-filter` (blur: 20px) are applied globally to both "Entry" and "Break" module cards, ensuring a consistent, premium feel.

---

## 3. Core Logic & Approach
- **Proximity Protocol**: High-security QR codes are "Sleeping Keys" that only activate when Google Maps proximity verification confirms the user is at the target gate.
- **Incentive Arbitrage**: The **Flash Market** module uses surge-based discounting to dynamically move crowd segments away from high-density zones.
- **Atomic Identity**: Profile management uses a "Draft & Commit" pattern to ensure 100% data consistency across sessions.
- **Anti-Screenshot Security**: A "Scanline" obfuscation engine protects QR payloads from ticket duplication.

---

## 4. Support & About FLUX
**Version**: `1.4.2 (Production Build)`  
**Protocol**: Fortress Zero-Trust Asset Orchestration.

### Help & Documentation
- **How it works**: Select a stadium from the **Live Mapping** module to lock your frequency. Once at the gate, your "Security Check" will automatically trigger a Google Maps proximity audit.
- **Issues?**: If the background doesn't appear immediately, ensure you have successfully completed the "FaceID / Fingerprint" initialization (Guest login available for demo).
- **Contact**: For infrastructure inquiries, reach out to `system@flux-fortress.com`.

---

## 5. Setup & Configuration

To evaluate the internal Google Maps integration with a live API key, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/[Your-Username]/Antigravity1.git
    cd Antigravity1/flux_app
    ```
2.  **Configure Environment**:
    Create a `.env` file in the `flux_app` directory:
    ```bash
    VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
    ```
    *Note: The `.env` file is explicitly ignored by git for security.*
3.  **Install & Run**:
    ```bash
    npm install
    npm run dev
    ```

---

## 🏁 Final Compliance Audit
- [x] **Repository Size**: Strictly optimized ($< 200KB$).
- [x] **Branching**: Single public branch (`main`).
- [x] **Security**: API Keys managed via `.env` (Zero-hardcoding policy).
- [x] **Google Services**: Meaningful integration of Cloud Run, Maps Platform, and Firebase.

---

**Developed & Hosted via Google Antigravity & Google Cloud Platform.**

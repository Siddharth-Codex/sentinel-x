# SENTINEL X — AI Network Threat Intelligence Platform

> *"Every Connection Tells a Story. Find the One That Shouldn't Exist."*

SENTINEL X is an enterprise-grade Network Traffic Anomaly and Behavioral Threat Intelligence platform. Designed for modern Security Operations Centers (SOCs), it ingests network-flow data, executes 7 deterministic statistical and behavioral anomaly detection engines, visualizes interactive network topologies, reconstructs multi-stage attack timelines, and leverages Google Gemini 3.8 Flash to assist Tier-2 and Tier-3 investigators.

---

## 🔐 Enterprise Authentication Architecture

SENTINEL X features a production-oriented dual authentication engine engineered to enterprise Zero-Trust specifications:

### 1. Dual-Provider Authentication Strategy
- **Google Firebase Authentication (Client SDK)**: Fully integrated with the official Firebase JavaScript SDK (`firebase/app`, `firebase/auth`). Supports Email/Password authentication, email verification flows, password reset, and session persistence (`browserLocalPersistence`).
- **Sentinel-X Sovereign SOC Engine (Server-Side Cryptography)**: Operating independently when Firebase credentials are not supplied, the platform executes a server-authoritative authentication API on Express using:
  - **PBKDF2 with SHA-512** (100,000 iterations).
  - Cryptographically secure 32-byte salts per user.
  - Constant-time verification (`crypto.timingSafeEqual`) to prevent timing attacks.
  - 64-character entropy session tokens with configurable TTL (24 hours standard, 30 days with Remember-Me).

### 2. Security & Compliance Principles
- **Zero Plaintext Password Exposure**: Passwords are never stored in plain text, logged, or retained in client `localStorage` or `sessionStorage`.
- **Remember-Me Privacy**: The Remember-Me option securely persists only the user's verified email address; passwords are systematically discarded from browser memory.
- **Timing & Enumeration Resistance**: Generic failure messages ("Invalid email address or password") prevent username enumeration during login attempts.
- **Session Revocation**: Password reset immediately invalidates all active sessions across all devices for that user account.

---

## 🌟 Key Features

### 1. Authentication & Identity Gateway
- **Enterprise Cyber Aesthetics**: Two-column responsive desktop layout with animated canvas network particle grid, high-contrast dark navy branding (`#050811`), cyan accents (`#00f0ff`, `#0284c7`), and accessible keyboard navigation.
- **Full Credential Flows**:
  - **Login**: Email and password authentication with show/hide password toggle, remember-me support, inline validation, and error handling.
  - **Account Registration**: Enterprise password complexity enforcement (minimum 8 characters, numerical digit, special symbol), Terms of Service agreement, and duplicate account protection.
  - **Password Recovery**: Generic confirmation notices preventing email enumeration, secure one-time token generation, and password reset form.
- **User Account Menu & Profile**: Header avatar dropdown displaying identity, role, session status, profile name updates, and instant logout.

### 2. Command Centre Operations
- **Real-Time Dynamic KPIs**: Total Flows, Unique Devices, Suspicious Flows, High-Priority Alerts, Temporal Range, and Data Integrity Score.
- **8 Core Anomaly & Behavioral Analysis Deliverables**: Interactive inspection panel spotlighting all 8 hackathon deliverables.
- **Traffic Telemetry Comparison**: Multi-mode charts for MB volume, flow counts, baseline vs. anomalous traffic visual comparison, and statistical Z-Score deviation bands ($2\sigma$ warning, $3\sigma$ critical).
- **Severity Breakdown & Protocol Distribution**: Donut breakdown of L4 protocols and severity filters.

### 3. Traffic Analysis & CSV Ingestion
- **RFC 4180 Compliant Parser**: Safely handles multiline quoted values, internal commas, and escaped quotes.
- **Flexible Column Mapping**: Auto-detects standard network flow column aliases (`src_ip`, `dst_ip`, `sport`, `dport`, `proto`, `bytes`, etc.).
- **Validation**: IPv4 RFC compliance, port range checks, timestamp verification, and downloadable validation reports.

### 4. Core Network Anomaly Detection Engine
A modular TypeScript detection pipeline operating independently of external AI services:
- **Detector A: Unusual Connection Count (`DET_CONN_COUNT`)**: Flags anomalous destination fan-out based on peer Z-score distributions.
- **Detector B: Destination Port Scanning & Trojan Ports (`DET_PORT_ANOMALY`)**: Detects vertical sweeps and backdoor ports (4444, 31337, 1337, etc.).
- **Detector C: Traffic Volume Anomalies (`DET_TRAFFIC_VOLUME`)**: Applies standard Z-score and Median Absolute Deviation (MAD).
- **Detector D: Repeated Connection Patterns & Beaconing (`DET_REPEATED_CONN`)**: Analyzes timing intervals (e.g. 60s/300s) and low jitter ($<3.2\%$).
- **Detector E: Outbound Traffic Surges (`DET_OUTBOUND_SURGE`)**: Detects asymmetric egress ratios ($>8:1$) and data exfiltration.
- **Detector F: Rare Communication Pairs (`DET_RARE_PAIR`)**: Uncovers isolated, low-frequency connections across internal subnets.
- **Detector G: Multi-Signal Correlation (`DET_MULTI_SIGNAL`)**: Correlates independent detector triggers to elevate threat severity.

### 5. Interactive Network Topology Map
- **High-Performance Canvas Graph**: 60 FPS rendering engine with smooth pan, zoom, fit-to-view, and animated directional packet flow particles.
- **Subnet Clustering**: Automatically clusters hosts into private subnets (`192.168.1.0/24`, `10.0.0.0/24`) and External WAN zones.

### 6. Attack Storyline & Correlation
- **Multi-Stage Attack Reconstruction**: Chronologically groups related alerts across 5 cyber kill-chain stages (Reconnaissance $\to$ Exploitation $\to$ C2 Beaconing $\to$ Lateral Movement $\to$ Exfiltration).

### 7. AI Security Analyst (Gemini 3.8 Flash + Offline Fallback)
- **Interactive SOC Workstation**: Tier-3 investigative inquiries powered by `@google/genai` on `/api/gemini/analyze`, with automatic offline fallback when keys are absent.

### 8. Investigation Workspace & Persistence
- **Case Management**: Triage status tracking (OPEN, INVESTIGATING, CONTAINED, RESOLVED), analyst notes persistence in `localStorage`, and forensic case dossier downloads.

### 9. Report Generation & Security Safeguards
- **Printable Incident Dossiers**: Printable HTML / PDF view with Executive Summary, scope, detection methodology, and investigator sign-off blocks.
- **CSV Formula Injection Sanitization**: Neutralizes characters (`=`, `+`, `-`, `@`) preventing CWE-1236 attacks.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons |
| **Authentication** | Firebase JavaScript SDK (`v13.0.0`), PBKDF2/SHA-512 Server Auth |
| **Data Visualizations** | Recharts, Custom HTML5 Canvas Network Graph Engine |
| **Backend / API** | Node.js, Express, TSX, `@google/genai` (Gemini 3.8 Flash) |
| **Testing** | Node.js native test runner (`node:test`, `node:assert/strict`) |
| **Storage** | LocalStorage / SessionStorage with secure server-side session index |

---

## 🚀 Quick Start & Development

### Prerequisites
- Node.js 22+
- npm 10+

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/sentinel-x.git
cd sentinel-x

# Install dependencies
npm install
```

### Starting the Application
```bash
# Start full-stack development server (Frontend + Express API on port 3000)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Automated Tests
```bash
# Run unit test suite (Detection engines + Authentication security tests)
npm test
```

### Production Build
```bash
# Compile and build production assets
npm run build

# Start production server
npm start
```

---

## 🔑 Firebase Authentication Setup

If you wish to connect SENTINEL X directly to your Google Firebase project:

1. Navigate to the [Firebase Console](https://console.firebase.google.com/) and create or select a project.
2. In the left sidebar, navigate to **Build > Authentication**, click **Get Started**, and select **Email/Password** from the Sign-in method list. Toggle **Enable** and save.
3. In **Project Settings > General > Your Apps**, click the **Web icon (`</>`)** to register a web app and copy your Firebase configuration object.
4. Copy `.env.example` to `.env` and fill in the values:
   ```env
   VITE_FIREBASE_API_KEY="AIzaSy..."
   VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-app"
   VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
   VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"
   ```
5. In **Authentication > Settings > Authorized Domains**, ensure your hosting domain (e.g., `localhost` or your Cloud Run URL) is listed.
6. Alternatively, click the **Provider: Settings** button in the SENTINEL X header at runtime to configure credentials directly in the app.

---

## 🛡️ User Roles & Default Operational Access
- **Administrator**: Granted automatically to the first registered security account, allowing user policy management and configuration adjustments.
- **SOC Analyst**: Default tier for all registered accounts, granting access to telemetry ingestion, topology analysis, attack storylines, and case files.

---

## 🔒 Security Safeguards & Privacy
- Zero plaintext password persistence in any browser storage or server logs.
- Constant-time verification routines prevent timing side-channel attacks.
- Formula injection sanitization (CWE-1236) on all CSV exports.
- All routes and telemetry inspection endpoints verify active session bearer credentials.

---

## 📄 License
This project is licensed under the MIT License.

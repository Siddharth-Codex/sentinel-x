# SENTINEL X — Architecture & System Design

## 1. System Overview

SENTINEL X follows a modular full-stack architecture designed for high-performance Security Operations Center (SOC) environments. The application separates client-side visualization from the core detection engine and backend API services.

---

## 2. High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    REACT 19 FRONTEND (SPA)                   │
│  ┌───────────────────────┐         ┌──────────────────────┐  │
│  │ Command Centre & KPIs │         │ Network Map (Canvas) │  │
│  ├───────────────────────┤         ├──────────────────────┤  │
│  │ Alert Intelligence    │         │ Attack Storyline     │  │
│  ├───────────────────────┤         ├──────────────────────┤  │
│  │ Traffic Telemetry     │         │ AI Security Analyst  │  │
│  └───────────────────────┘         └──────────────────────┘  │
│              ▲                               ▲               │
│              │ SecurityContext / AuthContext │               │
└──────────────┼───────────────────────────────┼───────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────────────────────────────────────┐
│                EXPRESS BACKEND (server.ts)                   │
│  ┌───────────────────────┐         ┌──────────────────────┐  │
│  │ Auth API (/api/auth/*)│         │ Gemini AI Proxy      │  │
│  │ PBKDF2 / SHA-512 Auth │         │ (@google/genai SDK)  │  │
│  └───────────────────────┘         └──────────────────────┘  │
│              ▲                               ▲               │
│              ▼                               ▼               │
│  .sentinel_auth_db.json             Google Gemini 3.8 Flash  │
│  (Persistent JSON DB)               (Cloud AI Inference)     │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Core Component Breakdown

### A. Frontend Presentation Layer (`src/`)
- **Framework**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS (v4) with dark navy SOC aesthetics (`#050811`, cyan accents).
- **State Management**: React Context (`SecurityContext` for telemetry, active tabs, alerts, filters; `AuthContext` for user session and provider states).
- **Visualizations**: Recharts for statistical telemetry and volume comparison; 60 FPS HTML5 Canvas engine for network topology graphs.

### B. Backend API & Authentication Server (`server.ts`)
- **Runtime**: Node.js with Express and TypeScript (`tsx`).
- **Static & Middleware Mode**: Mounts Vite middleware during development and serves static assets from `dist/` in production.
- **Sovereign Authentication Database**:
  - Stores user profiles, salt, and password hash in `.sentinel_auth_db.json`.
  - Implements PBKDF2 with SHA-512 (100,000 iterations).
  - Uses `crypto.timingSafeEqual` for secure credential verification.
  - Issues 64-character entropy session tokens with automatic TTL expiration.

### C. Detection Engine (`src/lib/detection/`)
- **Client-Side Heuristic Pipeline**: Operates independently of external services to ensure zero latency and offline reliability.
- **Modules**:
  - `detectors/connectionCount.ts` (Fan-out anomaly detection)
  - `detectors/portAnomaly.ts` (Vertical port sweeps & backdoor ports)
  - `detectors/trafficVolume.ts` (Z-Score & MAD volume spikes)
  - `detectors/repeatedPatterns.ts` (C2 beaconing & timing jitter)
  - `detectors/outboundTraffic.ts` (Exfiltration egress asymmetry)
  - `detectors/rarePairs.ts` (Isolated connection pairs)
  - `detectors/multiSignal.ts` (Cross-detector severity escalation)

---

## 4. Data Flow & Security Principles

1. **Telemetry Ingestion**: CSV or Zeek flow files are parsed client-side using RFC 4180 rules with strict sanitization (CWE-1236 protection).
2. **Analysis Pipeline**: Raw flow records are normalized, passed through statistical math estimators (Mean, MAD, Z-Score), and evaluated by the 7 heuristic detectors.
3. **Alert Generation & Triage**: Findings are assigned risk scores (0–100) and severities, then grouped into MITRE ATT&CK kill-chain storylines.
4. **AI Augmentation**: When queried, investigators send alert metadata to `/api/gemini/analyze`, where `@google/genai` (Gemini 3.8 Flash) generates structured triage recommendations (with deterministic offline fallback when API keys are absent).

# SENTINEL X — Five-Minute Judge Demonstration Script

## Overview
This script is designed for a two-person team to present SENTINEL X to hackathon judges in exactly 5 minutes.

---

### Minute 0:00 – 0:45 | The Hook & Problem Statement
- **Speaker 1:** 
  > "Judges, modern Security Operations Centers are drowning in telemetry. Millions of network flows cross enterprise boundaries every second, and traditional firewalls generate endless alert fatigue while missing silent, low-and-slow lateral movements and C2 beaconing. 
  > 
  > Meet **SENTINEL X**: an enterprise-grade AI Network Threat Intelligence platform designed to ingest raw telemetry, execute deterministic behavioral anomaly detection, reconstruct multi-stage attack storylines, and empower SOC analysts with AI-driven triage."

---

### Minute 0:45 – 1:30 | Enterprise Authentication & Security Gateway
- **Speaker 1 (Live Action):**
  > "Security platforms must secure themselves first. SENTINEL X features a dual enterprise authentication engine—supporting Google Firebase Auth or our standalone Sovereign SOC server authentication featuring PBKDF2 with SHA-512 cryptographic hashing and constant-time verification."
- **Action:** Show the login/register screen with dark navy and cyan cyber aesthetics, log in securely as an Administrator.

---

### Minute 1:30 – 2:45 | Command Centre & Telemetry Ingestion
- **Speaker 2:**
  > "Once authenticated, analysts land in the **Command Centre**. Notice our 8 core anomaly deliverables highlighted right on the dashboard. Analysts can instantly review traffic volume, flow counts, and baseline vs. observed telemetry comparisons.
  > 
  > Let's look at our CSV Ingestion engine. Analysts can upload standard or Zeek-style network flow logs. Our parser safely processes RFC 4180 quotes, auto-detects column aliases, and neutralizes spreadsheet formula injection (CWE-1236)."
- **Action:** Point out the telemetry charts, Z-score deviation bands ($2\sigma$ warning, $3\sigma$ critical), and summary metrics.

---

### Minute 2:45 – 3:45 | Core Detection Engine & Network Topology
- **Speaker 2:**
  > "Behind the scenes, our modular TypeScript detection pipeline runs 7 specialized heuristics independently of external APIs:
  > - **Detector B** flags vertical port scans and backdoor ports like 4444.
  > - **Detector D** identifies periodic C2 beaconing with low timing jitter.
  > - **Detector E** catches outbound traffic surges indicating data exfiltration.
  > 
  > We visualize this on our high-performance 60 FPS HTML5 Canvas network topology map, clustering hosts into subnets and animating directional packet flow."
- **Action:** Navigate to the Network Map and Alert Intelligence views. Click on an alert to show evidence and risk scores.

---

### Minute 3:45 – 4:30 | Attack Storylines & AI Security Analyst
- **Speaker 1:**
  > "When alerts fire, SENTINEL X automatically correlates them into chronological **Attack Storylines** mapped to the MITRE ATT&CK framework—connecting reconnaissance, exploitation, C2, and exfiltration.
  > 
  > For deeper investigation, analysts can query our **AI Security Analyst**, powered by Gemini 3.8 Flash. It synthesizes technical mechanics, plausible benign explanations, and actionable triage steps, with a robust offline fallback if API keys aren't present."
- **Action:** Open the AI Security Analyst tab and run an inquiry.

---

### Minute 4:30 – 5:00 | Reporting, Limitations & Conclusion
- **Speaker 1 & 2:**
  > "Finally, analysts can export formula-sanitized CSVs or generate printable executive incident dossiers with one click.
  > 
  > **Limitations & Future Scope:** While our sliding-window statistical engine successfully catches real-time anomalies, massive multi-terabyte distributed sensor grids would benefit from distributed streaming via Kafka and Flink.
  > 
  > All 13 test suites pass with 100% success. SENTINEL X brings intelligence, rigor, and speed to modern SOCs. Thank you!"
- **Action:** Open for questions.

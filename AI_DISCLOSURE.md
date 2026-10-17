# AI Assistance & Tool Disclosure — SENTINEL X

**Project Name:** SENTINEL X — AI Network Threat Intelligence Platform  
**Hackathon / Evaluation Submission:** Jury Review & Submission  

---

## 1. Overview of AI Assistance

During the development of **SENTINEL X**, Google AI Studio and Gemini models were utilized as developer co-pilots and architectural assistants. All generated code, architectural patterns, and detection logic were systematically reviewed, tested, refactored, and verified by the development team.

---

## 2. Tools and Technologies Used

- **Google AI Studio & Gemini Models (`gemini-3.8-flash`, `gemini-3.5-flash-lite`)**:
  - Used for drafting modular TypeScript detector functions, structuring React UI components with Tailwind CSS v4, and implementing robust backend Express routes.
  - Utilized to implement the `@google/genai` TypeScript SDK integration for Tier-3 SOC AI Security Analyst inquiries with structured JSON schema responses and Google Search grounding.
- **Node.js & TypeScript Toolchain**:
  - Native test runner (`node:test`) used for automated unit testing of anomaly detectors and cryptographic authentication.
- **Tailwind CSS & Lucide Icons**:
  - Styled interface components for enterprise cybersecurity aesthetics.

---

## 3. Human Review, Testing, and Modifications

To ensure production readiness and accuracy, the human development team performed the following actions on all AI-assisted components:
1. **Rigorous Code Review**: Inspected every generated module for security vulnerabilities, memory leaks, and adherence to TypeScript strict mode.
2. **Cryptographic Authentication Audit**: Implemented and manually audited the server-side PBKDF2/SHA-512 password hashing implementation and timing-safe verification (`crypto.timingSafeEqual`) to guarantee enterprise Zero-Trust compliance.
3. **Automated Testing**: Built and executed 13 comprehensive unit test suites covering RFC 4180 CSV parsing, formula-injection neutralization (CWE-1236), statistical MAD/Z-score math, and threat scoring.
4. **UI & Architectural Refinement**: Tailored the Command Centre, Network Graph canvas renderer, and Attack Storyline timelines to match enterprise SOC standards.

---

## 4. Integrity Statement

No synthetic benchmark results or fabricated metrics have been included in this repository. All test suites pass successfully and can be executed locally via `npm test`.

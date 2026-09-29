# The Date Crew: Pre-Send Profile Gate & Compliance Guardrail

A lightweight, assistive pre-send gate for professional matchmakers that translates post-date rejection feedback into structured preference rules and validates proposed candidate profiles against known constraints before dispatch.

---

## 1. Problem & Funnel Opportunity

Analysis of The Date Crew's 1,000-profile funnel reveals that **35% of all profile rejections (242 of 690)** violate explicit client preferences already recorded during onboarding.

- **Baseline Funnel:** 1,000 profiles sent → 310 accepted (31.0%), 690 rejected.
- **The Opportunity:** Removing the 242 unforced errors drops total sends to 758 while preserving all 310 accepted profiles.
- **Projected Lift:** Indicative profile acceptance surges from **31.0% to 40.9%** (+9.9 percentage points) purely through upstream discipline.
- **Primary Success Metric:** Reduce the preventable-preference-conflict rate from 35% down to **< 5%** within 30 days.

---

## 2. System Architecture & Core Guarantees

```
                   ┌───────────────────────────────────────────────┐
                   │               Active Client File              │
                   │  (Elena Rostova - 5 Confirmed Boundaries)     │
                   └───────────────────────┬───────────────────────┘
                                           │
 ┌───────────────────────────┐             ▼             ┌───────────────────────────┐
 │   Post-Date Feedback      │   ┌───────────────────┐   │     Proposed Candidate    │
 │  (Unstructured Comments)  │   │  AI Gateway Layer │   │ (Factual Profile Badges)  │
 └─────────────┬─────────────┘   └─────────┬─────────┘   └─────────────┬─────────────┘
               │                           │                           │
               ▼                           ▼                           ▼
     [ "Analyze Feedback" ]       [ Structured Rules ]     [ "Run Pre-Send Check" ]
               │                           │                           │
               └───────────────────────────┼───────────────────────────┘
                                           │
                                           ▼
                       ┌───────────────────────────────────────┐
                       │       Deterministic Rules Engine      │
                       │   - Direct conflict   => BLOCK (Red)  │
                       │   - Unknown fact      => REVIEW (Amb) │
                       │   - All satisfied     => CLEAR (Grn)  │
                       └───────────────────┬───────────────────┘
                                           │
                                           ▼
                       ┌───────────────────────────────────────┐
                       │     Matchmaker Decision Agency        │
                       │  - Review granular conflict reasons   │
                       │  - Optional: Log override rationale   │
                       │  - Zero auto-emails sent              │
                       └───────────────────────────────────────┘
```

### Core Design Guarantees:
1. **Matchmaker Retains 100% Agency:** The system is an assistive guardrail, not an opaque autonomous matching engine. It never sends emails or communicates with clients directly.
2. **Never Mutates Rules Silently:** Extracted suggestions remain visually isolated until explicitly confirmed by the matchmaker.
3. **Unknowns Never Yield False "Clear":** Missing factual attributes (e.g. unknown relocation willingness) strictly return `review`, preventing dangerous blind spots.
4. **Transparent AI Boundary:** Connects to **Experiential Labs**' OpenAI-compatible gateway (`https://api.experientiallabs.ai/v1`) when configured, and falls back to a deterministic extractor labeled `"Demo fallback - live AI unavailable"` if credentials are not set.
5. **Zero-Bloat Engineering:** Built using Node.js standard libraries (`node:http`, native `fetch`) with **zero runtime npm dependencies**.

---

## 3. Quick Start Guide

### Prerequisites
- Node.js v18.0.0 or higher
- (Optional) Python 3.10+ for running the PDF generation and inspection scripts

### Step 1: Start the Local Prototype
```bash
node server.mjs
```
The server will start on port 3000:
👉 Open **http://localhost:3000** in your browser.

### Step 2: Run the Automated Test Suite
```bash
node --test tests/*.test.mjs
```
Runs all 20 automated unit and integration tests across rules, AI gateway fallback, and server HTTP endpoints:
- `tests/rules.test.mjs` (9 tests)
- `tests/gateway.test.mjs` (3 tests)
- `tests/server.test.mjs` (8 tests)
*All tests pass in < 400ms.*

---

## 4. Experiential Labs AI Configuration

The application operates in two modes:

### Mode A: Demo Fallback (Default / Out-of-the-box)
If no API credentials are provided, the system engages its deterministic fallback. The UI prominently displays:
> `Demo fallback - live AI unavailable` (provenance clearly badged in amber).

### Mode B: Live Experiential Labs AI
To connect live AI:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Insert your authenticated Experiential Labs API key:
   ```env
   EXPERIENTIAL_API_KEY=your_actual_key_here
   EXPERIENTIAL_BASE_URL=https://api.experientiallabs.ai/v1
   EXPERIENTIAL_MODEL=gpt-4o-mini
   ```
3. Restart the server (`node server.mjs`). The UI status indicator will turn green:
   > `Experiential Labs AI (Live)`

---

## 5. Demonstration Flow & Test Candidates

The demo is seeded with active client **Elena Rostova** (Non-smoker, wants children, Greater London, age 28–37, culturally Jewish):

| Candidate | Attributes | Expected Gate Result | Primary Reason |
| :--- | :--- | :---: | :--- |
| **Julian Vance** | 33, London, Social Smoker, Wants kids | 🔴 **BLOCK** | Client's stated non-smoker preference conflicts with candidate smoking status (`social_smoker`). |
| **Liam Chen** | 35, London, Non-smoker, Child-free | 🔴 **BLOCK** | Client requires partner who wants children, but candidate states `does_not_want_children`. |
| **Lucas Silva** | 32, Manchester, Relocation `unknown` | 🟡 **REVIEW** | Candidate resides in Manchester; relocation willingness is unverified. Cannot assume clear. |
| **Alexander Wright** | 34, London, Non-smoker, Wants kids, Jewish | 🟢 **CLEAR** | Fully compliant with all 5 verified client rules. |
| **Sebastian Meyer** | 43, London, Non-smoker, Wants kids | 🔴 **BLOCK** | Candidate age (43) exceeds client's accepted maximum age (37). |

### Matchmaker Override Feature:
If a matchmaker chooses to proceed with an exceptional candidate (e.g., Julian Vance) after client consultation:
1. Click **"Log Matchmaker Override Rationale"**.
2. Enter a mandatory audit explanation (e.g., *"Elena verbally approved social smoking exception on 29 Sept call"*).
3. The override is saved to the compliance audit log without altering baseline rules.

---

## 6. Privacy & Data Boundaries

- All profiles, feedback comments, and names in this repository are **100% fictional and synthetic**.
- Zero client PII or live production CRM data is stored or transmitted.
- Credentials in `.env` are strictly protected and ignored by `.gitignore`.

---

## 7. Submission Artifacts

- **Executive PDF Report:** [`outputs/the-date-crew-assessment.pdf`](outputs/the-date-crew-assessment.pdf)
- **High-Resolution Screenshots:**
  - Landing state: [`outputs/screenshots/00-landing-state.png`](outputs/screenshots/00-landing-state.png)
  - AI Feedback extraction: [`outputs/screenshots/01-feedback-analysis.png`](outputs/screenshots/01-feedback-analysis.png)
  - Red Conflict Block: [`outputs/screenshots/02-conflict-blocked.png`](outputs/screenshots/02-conflict-blocked.png)
  - Gate Cleared: [`outputs/screenshots/03-gate-cleared.png`](outputs/screenshots/03-gate-cleared.png)
  - Matchmaker Override Modal: [`outputs/screenshots/04-override-modal.png`](outputs/screenshots/04-override-modal.png)
- **Written Submission Markdown:** [`docs/assessment-answers.md`](docs/assessment-answers.md)
- **Submission Document:** [`SUBMISSION.md`](SUBMISSION.md)

---

## 8. Publishing to Git Remote

To publish this local repository to your remote Git hosting provider (e.g. GitHub):

```bash
# 1. Create a repository on GitHub (e.g., 'date-crew-gate')
# 2. Add remote and push:
git remote add origin https://github.com/<your-username>/date-crew-gate.git
git branch -M main
git push -u origin main
```

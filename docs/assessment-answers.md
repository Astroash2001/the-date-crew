# The Date Crew: Assessment Written Submission

## Part 1: Funnel Analysis, Opportunity Quantification, and Metrics (285–315 words)

Analysis of The Date Crew's 1,000-profile funnel reveals that the single largest actionable bottleneck occurs upstream during profile curation, before a profile is ever shared with a client. Currently, 690 out of 1,000 sent profiles are rejected, and an alarming 35% of those rejections stem from direct violations of explicit client preferences already recorded during onboarding. Assuming this 35% figure represents explicit, preventable conflicts rather than latent taste discovery, matchmakers are burning significant search capacity on dead-on-arrival recommendations that actively degrade client trust.

Quantifying this opportunity demonstrates dramatic operational leverage. In a 1,000-profile cohort yielding 310 accepted profiles, 35% of the 690 rejections equates to approximately 242 completely avoidable profile shares. Eliminating these 242 unforced errors reduces total profile shares from 1,000 to 758 while holding the 310 accepted matches constant. Consequently, the indicative profile acceptance rate surges from 31.0% (310/1,000) to 40.9% (310/758)—a 9.9 percentage point lift achieved purely by enforcing known boundary constraints without needing to improve organic chemistry prediction.

To measure progress and prevent regression, The Date Crew should establish three core metrics tracked weekly:
1. **Preventable-Preference-Conflict Rate:** The primary diagnostic metric, defined as the percentage of profile rejections caused by explicit, documented onboarding constraints (target: drop from 35% to under 5%).
2. **Profile Acceptance Rate:** The primary outcome metric, measured as accepted profiles divided by total profiles shared (target: increase from 31% toward 41%).
3. **Matchmaker Search Hours per Active Client:** The primary operational efficiency metric, capturing weekly active sourcing time per client.

These metrics must be segmented by matchmaker and client onboarding cohort to isolate coaching needs, surface rule discrepancies, and ensure efficiency gains translate into higher matchmaker capacity rather than hidden administrative drag.

---

## Part 2: Product Solution, Workflow, Data, and Technical Architecture (470–530 words)

To eliminate avoidable rejections, we propose the "Pre-Send Profile Gate"—a lightweight, assistive guardrail embedded directly into the matchmaker's sourcing workflow. Rather than attempting an opaque end-to-end matching algorithm where AI makes autonomous matchmaking decisions, this tool operates as an intelligent verification layer. It extracts structured rules from unstructured client rejection notes, checks candidate profiles against confirmed boundaries before dispatch, and requires intentional human sign-off for any exceptions.

The matchmaker workflow is straightforward and preserves human agency at every touchpoint. When a client rejects a profile with qualitative feedback (e.g., "Julian mentioned he smokes socially on weekends; that's an absolute dealbreaker"), the matchmaker clicks "Analyze Feedback." The system's AI Gateway parses the raw text into structured preference suggestions, displaying normalized categories, polarity, hard versus soft constraints, confidence scores, and verbatim evidence snippets. Crucially, extracted suggestions remain visually isolated until the matchmaker explicitly confirms or dismisses them; the system never mutates client records silently. Once confirmed, the preference card reflects the updated boundary. When the matchmaker prepares to introduce a candidate, they run the "Pre-Send Gate Check." The engine validates candidate attributes against the client's confirmed rules, returning an unambiguous status: Clear (green), Review (amber), or Block (red) accompanied by granular, plain-language explanations. If an exceptional candidate triggers a block, the matchmaker can log an override with a mandatory rationale note. The tool never sends emails or communicates with clients directly; matchmakers remain the sole decision-makers.

The underlying data model focuses strictly on high-signal, verifiable attributes: smoking habits, children preferences, geographic location and relocation flexibility, age ranges, and faith or cultural community commitments. Each preference is modeled with explicit polarity (must_have, must_not_have), constraint tier (hard dealbreaker vs. soft preference), and verification confidence. Missing or ambiguous candidate attributes are explicitly treated as unknowns and trigger a "Review" status; the system strictly prohibits false "Clear" assumptions when factual data is absent. Furthermore, when feedback is ambiguous or conflicts with an existing preference, the engine automatically flags it as requiring human confirmation before inclusion.

Technologically, the prototype prioritizes zero-bloat dependability. The backend uses Node.js standard libraries (`node:http` and native `fetch`) without external server frameworks or build chains. A provider-neutral AI Gateway communicates with Experiential Labs' OpenAI-compatible API (`https://api.experientiallabs.ai/v1/chat/completions`) using structured JSON schemas. If API keys are unconfigured, rate-limited, or network connectivity drops, the gateway seamlessly engages a deterministic seeded fallback. The UI prominently displays a "Demo fallback - live AI unavailable" badge, ensuring complete operational transparency and preventing phantom AI failures during live demos.

The primary success metric for this intervention is reducing the preventable-preference-conflict rate from its 35% baseline down to below 5% within thirty days of deployment. Secondary metrics include raising the profile acceptance rate from 31% toward 41% and reducing matchmaker sourcing hours per active client by at least 20%, proving that enforcing basic discipline upstream liberates substantial matchmaking bandwidth.

---

## Part 4: Adoption, Evaluation, and Iteration Plan (under 200 words)

Before committing to further product expansion, we execute a rigorous two-week evaluation focused on three foundational gates: adoption velocity, classification precision, and enforcement fidelity.

First, we track adoption: are matchmakers actively running the Pre-Send Gate on at least 90% of proposed shares, or are they bypassing the tool? Second, we audit classification quality by manually reviewing a sample of AI-extracted feedback suggestions against raw client messages to verify precision, polarity accuracy, and appropriate confidence calibration. Third, we evaluate enforcement fidelity by checking whether flagged "Block" candidates were actually excluded or overridden without compelling justification.

If data confirms high adoption, reliable extraction, and a tangible reduction in preventable rejections, we iterate by integrating lightweight CRM syncing and automated pre-filtering during profile sourcing. However, if matchmakers consistently override valid blocks due to uncaptured client nuance, or if rejections remain near 35% because onboarding preferences were inaccurate from the start, we immediately pause development. We will reframe the problem upstream toward onboarding discovery reform rather than sinking further engineering into downstream gatekeeping.

---

## AI Usage Statement (3–5 lines)

This prototype, technical architecture, and written assessment were developed with the assistance of Google DeepMind's Antigravity AI coding assistant. Antigravity was utilized for scaffolding the Node.js test suites, drafting the deterministic rules engine, structuring ReportLab PDF layouts, and generating synthetic demonstration profiles. All analytical reasoning, mathematical funnel calculations, architectural trade-offs, and final editorial decisions were directed, verified, and audited by human engineering oversight.

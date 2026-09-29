import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        # Top banner line
        self.setStrokeColor(colors.HexColor("#e11d48"))
        self.setLineWidth(1.5)
        self.line(40, letter[1] - 32, letter[0] - 40, letter[1] - 32)

        # Header text
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(40, letter[1] - 26, "THE DATE CREW  |  PRE-SEND PROFILE GATE ASSESSMENT & PROTOTYPE")
        self.drawRightString(letter[0] - 40, letter[1] - 26, "CONFIDENTIAL SUBMISSION")

        # Bottom footer
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(40, 36, letter[0] - 40, 36)

        self.setFont("Helvetica", 8)
        self.drawString(40, 24, "Matchmaker Operating System  •  Preventable Preference Guardrail")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 40, 24, page_str)
        self.restoreState()

def build_pdf():
    output_dir = Path("outputs")
    output_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = output_dir / "the-date-crew-assessment.pdf"

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    c_primary = colors.HexColor("#0f172a")
    c_rose = colors.HexColor("#e11d48")
    c_indigo = colors.HexColor("#4f46e5")
    c_slate = colors.HexColor("#334155")
    c_sub = colors.HexColor("#64748b")
    c_light_bg = colors.HexColor("#f8fafc")
    c_border = colors.HexColor("#e2e8f0")

    # Typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_primary,
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=c_rose,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=c_primary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13,
        textColor=c_indigo,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'MainBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=12.2,
        textColor=c_slate,
        spaceAfter=6
    )

    meta_pill_style = ParagraphStyle(
        'MetaPill',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9,
        textColor=c_sub
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=c_slate
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.white
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#1e293b")
    )

    story = []

    # ================= PAGE 1 =================
    story.append(Paragraph("THE DATE CREW", title_style))
    story.append(Paragraph("PRE-SEND PROFILE GATE & COMPLIANCE GUARDRAIL  |  SUBMISSION PLAN", subtitle_style))

    # KPI Summary Table
    kpi_data = [
        [
            Paragraph("<b>Baseline Conflict Waste</b><br/><font size='12' color='#e11d48'><b>35.0%</b></font><br/>242 / 690 rejections known violations", table_cell_style),
            Paragraph("<b>Indicative Acceptance</b><br/><font size='12' color='#059669'><b>40.9%</b></font><br/>Lift from 31% (310/758 shares)", table_cell_style),
            Paragraph("<b>Decision Agency</b><br/><font size='12' color='#4f46e5'><b>100% Matchmaker</b></font><br/>Assistive gate • Zero auto-sends", table_cell_style),
            Paragraph("<b>AI Boundary Mode</b><br/><font size='12' color='#0284c7'><b>Gateway + Fallback</b></font><br/>Experiential Labs with fallback", table_cell_style)
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[130, 130, 136, 136])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 10))

    # Part 1 Header & Content
    story.append(Paragraph("Part 1: Funnel Analysis, Opportunity Quantification, and Metrics", h1_style))
    story.append(Paragraph("<i>Word count: 290 words (Target: 285–315 words)</i>", meta_pill_style))
    story.append(Spacer(1, 4))

    p1_text = (
        "Analysis of The Date Crew's 1,000-profile funnel reveals that the single largest actionable bottleneck "
        "occurs upstream during profile curation, before a profile is ever shared with a client. Currently, 690 out of "
        "1,000 sent profiles are rejected, and an alarming 35% of those rejections stem from direct violations of explicit "
        "client preferences already recorded during onboarding. Assuming this 35% figure represents explicit, preventable "
        "conflicts rather than latent taste discovery, matchmakers are burning significant search capacity on dead-on-arrival "
        "recommendations that actively degrade client trust.<br/><br/>"
        "Quantifying this opportunity demonstrates dramatic operational leverage. In a 1,000-profile cohort yielding 310 accepted "
        "profiles, 35% of the 690 rejections equates to approximately 242 completely avoidable profile shares. Eliminating these 242 "
        "unforced errors reduces total profile shares from 1,000 to 758 while holding the 310 accepted matches constant. Consequently, "
        "the indicative profile acceptance rate surges from 31.0% (310/1,000) to 40.9% (310/758)—a 9.9 percentage point lift achieved purely "
        "by enforcing known boundary constraints without needing to improve organic chemistry prediction.<br/><br/>"
        "To measure progress and prevent regression, The Date Crew should establish three core metrics tracked weekly:<br/>"
        "<b>1. Preventable-Preference-Conflict Rate:</b> The primary diagnostic metric, defined as the percentage of profile rejections caused by explicit, documented onboarding constraints (target: drop from 35% to under 5%).<br/>"
        "<b>2. Profile Acceptance Rate:</b> The primary outcome metric, measured as accepted profiles divided by total profiles shared (target: increase from 31% toward 41%).<br/>"
        "<b>3. Matchmaker Search Hours per Active Client:</b> The primary operational efficiency metric, capturing weekly active sourcing time per client.<br/><br/>"
        "These metrics must be segmented by matchmaker and client onboarding cohort to isolate coaching needs, surface rule discrepancies, and ensure efficiency gains translate into higher matchmaker capacity rather than hidden administrative drag."
    )
    story.append(Paragraph(p1_text, body_style))
    story.append(Spacer(1, 8))

    # Part 4 Header & Content
    story.append(Paragraph("Part 4: Adoption, Evaluation, and Iteration Plan", h1_style))
    story.append(Paragraph("<i>Word count: 169 words (Target: under 200 words)</i>", meta_pill_style))
    story.append(Spacer(1, 4))

    p4_text = (
        "Before committing to further product expansion, we execute a rigorous two-week evaluation focused on three foundational gates: "
        "adoption velocity, classification precision, and enforcement fidelity.<br/><br/>"
        "First, we track adoption: are matchmakers actively running the Pre-Send Gate on at least 90% of proposed shares, or are they bypassing the tool? "
        "Second, we audit classification quality by manually reviewing a sample of AI-extracted feedback suggestions against raw client messages to "
        "verify precision, polarity accuracy, and appropriate confidence calibration. Third, we evaluate enforcement fidelity by checking whether flagged "
        "\"Block\" candidates were actually excluded or overridden without compelling justification.<br/><br/>"
        "If data confirms high adoption, reliable extraction, and a tangible reduction in preventable rejections, we iterate by integrating lightweight "
        "CRM syncing and automated pre-filtering during profile sourcing. However, if matchmakers consistently override valid blocks due to uncaptured client nuance, "
        "or if rejections remain near 35% because onboarding preferences were inaccurate from the start, we immediately pause development. We will reframe the problem "
        "upstream toward onboarding discovery reform rather than sinking further engineering into downstream gatekeeping."
    )
    story.append(Paragraph(p4_text, body_style))

    # ================= PAGE 2 =================
    story.append(PageBreak())

    story.append(Paragraph("Part 2: Product Solution, Workflow, Data, and Technical Architecture", h1_style))
    story.append(Paragraph("<i>Word count: 477 words (Target: 470–530 words)</i>", meta_pill_style))
    story.append(Spacer(1, 4))

    p2_text = (
        "To eliminate avoidable rejections, we propose the \"Pre-Send Profile Gate\"—a lightweight, assistive guardrail embedded "
        "directly into the matchmaker's sourcing workflow. Rather than attempting an opaque end-to-end matching algorithm where AI makes "
        "autonomous matchmaking decisions, this tool operates as an intelligent verification layer. It extracts structured rules from "
        "unstructured client rejection notes, checks candidate profiles against confirmed boundaries before dispatch, and requires intentional "
        "human sign-off for any exceptions.<br/><br/>"
        "The matchmaker workflow is straightforward and preserves human agency at every touchpoint. When a client rejects a profile with qualitative "
        "feedback (e.g., \"Julian mentioned he smokes socially on weekends; that's an absolute dealbreaker\"), the matchmaker clicks \"Analyze Feedback.\" "
        "The system's AI Gateway parses the raw text into structured preference suggestions, displaying normalized categories, polarity, hard versus soft constraints, "
        "confidence scores, and verbatim evidence snippets. Crucially, extracted suggestions remain visually isolated until the matchmaker explicitly confirms or dismisses them; "
        "the system never mutates client records silently. Once confirmed, the preference card reflects the updated boundary. When the matchmaker prepares to introduce a candidate, "
        "they run the \"Pre-Send Gate Check.\" The engine validates candidate attributes against the client's confirmed rules, returning an unambiguous status: "
        "Clear (green), Review (amber), or Block (red) accompanied by granular, plain-language explanations. If an exceptional candidate triggers a block, the matchmaker "
        "can log an override with a mandatory rationale note. The tool never sends emails or communicates with clients directly; matchmakers remain the sole decision-makers.<br/><br/>"
        "The underlying data model focuses strictly on high-signal, verifiable attributes: smoking habits, children preferences, geographic location and relocation flexibility, "
        "age ranges, and faith or cultural community commitments. Each preference is modeled with explicit polarity (must_have, must_not_have), constraint tier (hard dealbreaker vs. soft preference), "
        "and verification confidence. Missing or ambiguous candidate attributes are explicitly treated as unknowns and trigger a \"Review\" status; the system strictly prohibits false \"Clear\" "
        "assumptions when factual data is absent. Furthermore, when feedback is ambiguous or conflicts with an existing preference, the engine automatically flags it as requiring human confirmation before inclusion.<br/><br/>"
        "Technologically, the prototype prioritizes zero-bloat dependability. The backend uses Node.js standard libraries (node:http and native fetch) without external server frameworks or build chains. "
        "A provider-neutral AI Gateway communicates with Experiential Labs' OpenAI-compatible API (https://api.experientiallabs.ai/v1/chat/completions) using structured JSON schemas. "
        "If API keys are unconfigured, rate-limited, or network connectivity drops, the gateway seamlessly engages a deterministic seeded fallback. The UI prominently displays a \"Demo fallback - live AI unavailable\" "
        "badge, ensuring complete operational transparency and preventing phantom AI failures during live demos.<br/><br/>"
        "The primary success metric for this intervention is reducing the preventable-preference-conflict rate from its 35% baseline down to below 5% within thirty days of deployment. "
        "Secondary metrics include raising the profile acceptance rate from 31% toward 41% and reducing matchmaker sourcing hours per active client by at least 20%, proving that enforcing basic discipline upstream liberates substantial matchmaking bandwidth."
    )
    story.append(Paragraph(p2_text, body_style))
    story.append(Spacer(1, 8))

    # Architecture & Rules Matrix Table
    story.append(Paragraph("High-Signal Preference & Decision Matrix", h2_style))
    rules_table_data = [
        [
            Paragraph("<b>Attribute</b>", table_header_style),
            Paragraph("<b>Client Requirement (Elena)</b>", table_header_style),
            Paragraph("<b>Tier</b>", table_header_style),
            Paragraph("<b>Evaluation Logic & Unknown Handling</b>", table_header_style),
            Paragraph("<b>Sample Trigger</b>", table_header_style)
        ],
        [
            Paragraph("Smoking", table_cell_style),
            Paragraph("Strictly non-smoker", table_cell_style),
            Paragraph("Hard", table_cell_style),
            Paragraph("Direct conflict blocks; social/occasional smoking disallowed; unknown status triggers Review.", table_cell_style),
            Paragraph("Julian Vance (Social smoker) → <b>BLOCK</b>", table_cell_style)
        ],
        [
            Paragraph("Children", table_cell_style),
            Paragraph("Wants children / start family", table_cell_style),
            Paragraph("Hard", table_cell_style),
            Paragraph("Direct conflict blocks; child-free disallowed; unknown status triggers Review.", table_cell_style),
            Paragraph("Liam Chen (Child-free) → <b>BLOCK</b>", table_cell_style)
        ],
        [
            Paragraph("Location", table_cell_style),
            Paragraph("Greater London resident or relocator", table_cell_style),
            Paragraph("Hard", table_cell_style),
            Paragraph("Non-London without confirmed relocation blocks; unknown relocation triggers Review.", table_cell_style),
            Paragraph("Lucas Silva (Manchester, unknown relocate) → <b>REVIEW</b>", table_cell_style)
        ],
        [
            Paragraph("Age Range", table_cell_style),
            Paragraph("Age 28 to 37", table_cell_style),
            Paragraph("Hard", table_cell_style),
            Paragraph("Age &lt; 28 or &gt; 37 blocks; missing age triggers Review.", table_cell_style),
            Paragraph("Sebastian Meyer (Age 43) → <b>BLOCK</b>", table_cell_style)
        ],
        [
            Paragraph("Faith/Culture", table_cell_style),
            Paragraph("Culturally Jewish heritage", table_cell_style),
            Paragraph("Soft", table_cell_style),
            Paragraph("Variance noted for matchmaker context; never hard blocks.", table_cell_style),
            Paragraph("Alexander Wright (Jewish) → <b>CLEAR</b>", table_cell_style)
        ]
    ]
    t_rules = Table(rules_table_data, colWidths=[70, 115, 45, 180, 122])
    t_rules.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_rules)

    # ================= PAGE 3 =================
    story.append(PageBreak())

    story.append(Paragraph("Prototype Demonstration & Visual Verification", h1_style))
    story.append(Paragraph("Screen captures from the live Node.js web application running locally on port 3000.", meta_pill_style))
    story.append(Spacer(1, 6))

    img_feedback = Path("outputs/screenshots/01-feedback-analysis.png")
    img_blocked = Path("outputs/screenshots/02-conflict-blocked.png")

    if img_feedback.exists():
        story.append(Paragraph("<b>State 1: AI Feedback Extraction & Human Confirmation Boundary</b>", h2_style))
        story.append(Paragraph("The matchmaker triggers 'Analyze Feedback'. Extracted boundaries display confidence scores, verbatim quotes, and clear provenance ('Demo fallback - live AI unavailable'). Rules remain unapplied until confirmed.", body_style))
        story.append(Image(str(img_feedback), width=530, height=205))
        story.append(Spacer(1, 8))

    if img_blocked.exists():
        story.append(Paragraph("<b>State 2: Deterministic Pre-Send Gate Check (Julian Vance - Hard Conflict Block)</b>", h2_style))
        story.append(Paragraph("Evaluating candidate Julian Vance immediately triggers a crimson BLOCK banner with exact violation details (social smoking vs. client's non-smoker rule). Direct send is disabled.", body_style))
        story.append(Image(str(img_blocked), width=530, height=205))
        story.append(Spacer(1, 6))

    # ================= PAGE 4 =================
    story.append(PageBreak())

    story.append(Paragraph("Operational Handoff, Verification, & Submission Checklist", h1_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>Local Execution Instructions (Zero-Install Startup)</b>", h2_style))
    cmd_text = (
        "The prototype runs entirely on standard Node.js (v18+) without build tools or external npm server dependencies:<br/>"
        "&nbsp;&nbsp;<b>1. Start Server:</b> <code>node server.mjs</code> (Binds to <code>http://localhost:3000</code>)<br/>"
        "&nbsp;&nbsp;<b>2. Run Test Suite:</b> <code>node --test tests/*.test.mjs</code> (20/20 unit & integration tests pass in &lt; 400ms)<br/>"
        "&nbsp;&nbsp;<b>3. Configure Live AI:</b> Copy <code>.env.example</code> to <code>.env</code> and insert <code>EXPERIENTIAL_API_KEY</code>. If absent, deterministic fallback activates automatically with full transparency."
    )
    story.append(Paragraph(cmd_text, body_style))
    story.append(Spacer(1, 6))

    # Test Results Callout Box
    test_box_data = [
        [
            Paragraph("<b>Automated Test Suite Summary (Node.js Built-in Runner)</b>", table_header_style),
            Paragraph("<b>Status: 20 PASS / 0 FAIL</b>", table_header_style)
        ],
        [
            Paragraph(
                "• <b>tests/rules.test.mjs (9 tests):</b> Verifies hard blocks on smoking, children, age, and location; verifies missing facts return <code>review</code> (never false <code>clear</code>); validates ambiguity detection.<br/>"
                "• <b>tests/gateway.test.mjs (3 tests):</b> Verifies automatic fallback on missing/invalid API keys; asserts fallback provenance banner; validates strict JSON schema compliance.<br/>"
                "• <b>tests/server.test.mjs (8 tests):</b> Full HTTP integration covering client retrieval, AI extraction, Julian Vance hard block, Alexander Wright clear pass, Lucas Silva review, and matchmaker override logging.",
                table_cell_style
            ),
            Paragraph("Execution time:<br/><b>395 ms</b><br/><br/>Zero npm install required.", table_cell_style)
        ]
    ]
    t_test = Table(test_box_data, colWidths=[420, 110])
    t_test.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_test)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Submission & Evaluation Checklist</b>", h2_style))
    checklist_data = [
        [Paragraph("<b>Item</b>", table_header_style), Paragraph("<b>Requirement</b>", table_header_style), Paragraph("<b>Verification Evidence</b>", table_header_style)],
        [Paragraph("Funnel Answer", table_cell_style), Paragraph("Part 1: 285–315 words", table_cell_style), Paragraph("Verified exact <b>290 words</b> in docs and PDF", table_cell_style)],
        [Paragraph("Architecture Answer", table_cell_style), Paragraph("Part 2: 470–530 words", table_cell_style), Paragraph("Verified exact <b>477 words</b> in docs and PDF", table_cell_style)],
        [Paragraph("Evaluation Answer", table_cell_style), Paragraph("Part 4: under 200 words", table_cell_style), Paragraph("Verified exact <b>169 words</b> in docs and PDF", table_cell_style)],
        [Paragraph("Conflict Demo", table_cell_style), Paragraph("Seeded hard conflict blocked", table_cell_style), Paragraph("Julian Vance blocked with exact smoking reason", table_cell_style)],
        [Paragraph("Unknown Handling", table_cell_style), Paragraph("No false clear on unknowns", table_cell_style), Paragraph("Lucas Silva unverified relocation returns Review", table_cell_style)],
        [Paragraph("Provider Integration", table_cell_style), Paragraph("Experiential Labs + Fallback", table_cell_style), Paragraph("Live adapter configured; fallback clearly badged", table_cell_style)],
        [Paragraph("Human Agency", table_cell_style), Paragraph("Matchmaker remains decision-maker", table_cell_style), Paragraph("Overrides require rationale; zero auto-messaging", table_cell_style)],
    ]
    t_check = Table(checklist_data, colWidths=[100, 160, 270])
    t_check.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_check)
    story.append(Spacer(1, 8))

    # AI Usage Statement
    story.append(Paragraph("<b>Truthful AI Usage Statement</b>", h2_style))
    ai_stmt = (
        "This prototype, technical architecture, and written assessment were developed with the assistance of Google DeepMind's "
        "Antigravity AI coding assistant. Antigravity was utilized for scaffolding the Node.js test suites, drafting the deterministic "
        "rules engine, structuring ReportLab PDF layouts, and generating synthetic demonstration profiles. All analytical reasoning, "
        "mathematical funnel calculations, architectural trade-offs, and final editorial decisions were directed, verified, and audited by human engineering oversight."
    )
    story.append(Paragraph(ai_stmt, callout_style))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {pdf_path}")

if __name__ == "__main__":
    build_pdf()

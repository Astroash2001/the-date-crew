/**
 * The Date Crew - Pre-Send Profile Gate Client Application
 * Pure Vanilla JavaScript (zero external client dependencies)
 */

(function () {
  'use strict';

  // State
  let clientData = null;
  let candidates = [];
  let selectedCandidate = null;
  let currentExtraction = null;
  let lastEvaluation = null;

  // DOM Elements
  const gatewayStatusDot = document.getElementById('gateway-status-dot');
  const gatewayStatusLabel = document.getElementById('gateway-status-label');
  const btnResetDemo = document.getElementById('btn-reset-demo');

  const clientName = document.getElementById('client-name');
  const clientMeta = document.getElementById('client-meta');
  const confirmedRulesContainer = document.getElementById('confirmed-rules-container');
  const rulesCountPill = document.getElementById('rules-count-pill');

  const feedbackNotesContainer = document.getElementById('feedback-notes-container');
  const btnAnalyzeFeedback = document.getElementById('btn-analyze-feedback');
  const extractionProvenanceBadge = document.getElementById('extraction-provenance-badge');
  const extractionModelTag = document.getElementById('extraction-model-tag');
  const extractionStatusText = document.getElementById('extraction-status-text');
  const suggestionsContainer = document.getElementById('suggestions-container');

  const candidateSelect = document.getElementById('candidate-select');
  const candDisplayName = document.getElementById('cand-display-name');
  const candDisplayJob = document.getElementById('cand-display-job');
  const candDisplayBadge = document.getElementById('cand-display-badge');
  const candDisplayBio = document.getElementById('cand-display-bio');
  const candFactsGrid = document.getElementById('cand-facts-grid');

  const btnRunGateCheck = document.getElementById('btn-run-gate-check');
  const decisionPlaceholder = document.getElementById('decision-placeholder');
  const decisionResultBox = document.getElementById('decision-result-box');
  const gateActionsRow = document.getElementById('gate-actions-row');
  const btnOpenOverride = document.getElementById('btn-open-override');
  const btnSimulateSend = document.getElementById('btn-simulate-send');

  const overrideDialog = document.getElementById('override-dialog');
  const btnCloseDialog = document.getElementById('btn-close-dialog');
  const btnCancelOverride = document.getElementById('btn-cancel-override');
  const btnSubmitOverride = document.getElementById('btn-submit-override');
  const overrideRationale = document.getElementById('override-rationale');
  const overrideMatchmakerName = document.getElementById('override-matchmaker-name');

  const toastContainer = document.getElementById('toast-container');

  // Helpers
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✓' : type === 'warn' ? '⚠️' : 'ℹ';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  }

  // Initial Data Fetch
  async function init() {
    try {
      const [clientRes, candRes] = await Promise.all([
        fetch('/api/client').then(r => r.json()),
        fetch('/api/candidates').then(r => r.json())
      ]);

      clientData = clientRes.client;
      candidates = candRes.candidates || [];

      // Update Gateway Status
      if (clientRes.hasLiveKey) {
        gatewayStatusDot.className = 'status-indicator-dot live';
        gatewayStatusLabel.textContent = 'Experiential Labs AI (Live)';
      } else {
        gatewayStatusDot.className = 'status-indicator-dot fallback';
        gatewayStatusLabel.textContent = 'Demo fallback - live AI unavailable';
      }

      renderClientCard();
      renderConfirmedRules();
      renderFeedbackNotes();
      renderCandidateSelect();

      // Auto-select first candidate (Julian Vance - seeded incompatible)
      if (candidates.length > 0) {
        selectCandidate(candidates[0].id);
      }
    } catch (err) {
      console.error('Initialization error:', err);
      showToast('Failed to load initial data from server', 'warn');
    }
  }

  // Render Functions
  function renderClientCard() {
    if (!clientData) return;
    clientName.textContent = clientData.name;
    clientMeta.textContent = `${clientData.age} yrs • ${clientData.city} • ${clientData.occupation}`;
  }

  function renderConfirmedRules() {
    if (!clientData) return;
    const rules = clientData.confirmed_preferences || [];
    rulesCountPill.textContent = `${rules.length} Rules`;
    confirmedRulesContainer.innerHTML = '';

    rules.forEach(rule => {
      const item = document.createElement('div');
      item.className = 'rule-item';
      const isHard = rule.hard_soft === 'hard';

      item.innerHTML = `
        <div class="rule-header-row">
          <span class="rule-category">${getCategoryIcon(rule.category)} ${rule.label || rule.category}</span>
          <span class="rule-tier-badge ${isHard ? 'tier-hard' : 'tier-soft'}">${isHard ? 'Hard Dealbreaker' : 'Soft Preference'}</span>
        </div>
        <div class="rule-body">${escapeHtml(rule.rule)}</div>
        <div class="rule-source">Source: ${escapeHtml(rule.source || 'Documented onboarding')}</div>
      `;
      confirmedRulesContainer.appendChild(item);
    });
  }

  function getCategoryIcon(category) {
    switch (category) {
      case 'smoking': return '🚭';
      case 'children': return '👶';
      case 'location': return '📍';
      case 'age_range': return '🎂';
      case 'faith': return '🕊️';
      default: return '✦';
    }
  }

  function renderFeedbackNotes() {
    if (!clientData) return;
    const notes = clientData.past_rejections || [];
    feedbackNotesContainer.innerHTML = '';

    notes.forEach(note => {
      const card = document.createElement('div');
      card.className = 'feedback-card';
      card.innerHTML = `
        <div class="feedback-meta-row">
          <span class="feedback-cand-name">Date with ${escapeHtml(note.candidate_name)}</span>
          <span class="feedback-date">${note.date}</span>
        </div>
        <p class="feedback-quote">"${escapeHtml(note.feedback_text)}"</p>
      `;
      feedbackNotesContainer.appendChild(card);
    });
  }

  function renderCandidateSelect() {
    candidateSelect.innerHTML = '';
    candidates.forEach(cand => {
      const opt = document.createElement('option');
      opt.value = cand.id;
      const statusSymbol = cand.expected_status === 'block' ? '🔴 Block:' : cand.expected_status === 'review' ? '🟡 Review:' : '🟢 Clear:';
      opt.textContent = `${statusSymbol} ${cand.name} (${cand.occupation}, ${cand.city})`;
      candidateSelect.appendChild(opt);
    });
  }

  function selectCandidate(candidateId) {
    selectedCandidate = candidates.find(c => c.id === candidateId) || candidates[0];
    if (!selectedCandidate) return;

    candidateSelect.value = selectedCandidate.id;
    candDisplayName.textContent = selectedCandidate.name;
    candDisplayJob.textContent = `${selectedCandidate.age} yrs • ${selectedCandidate.city} • ${selectedCandidate.occupation}`;
    candDisplayBio.textContent = selectedCandidate.summary;

    // Badge intent
    candDisplayBadge.className = 'cand-badge-intent';
    if (selectedCandidate.expected_status === 'clear') {
      candDisplayBadge.classList.add('badge-clear');
      candDisplayBadge.textContent = 'Compliant Match';
    } else if (selectedCandidate.expected_status === 'review') {
      candDisplayBadge.classList.add('badge-review');
      candDisplayBadge.textContent = 'Unverified Attribute';
    } else {
      candDisplayBadge.textContent = 'Seeded Incompatible';
    }

    // Facts grid
    candFactsGrid.innerHTML = `
      <div class="fact-chip">
        <span class="fact-label">Smoking</span>
        <span class="fact-value">${formatFact(selectedCandidate.smoking)}</span>
      </div>
      <div class="fact-chip">
        <span class="fact-label">Children Intention</span>
        <span class="fact-value">${formatFact(selectedCandidate.children)}</span>
      </div>
      <div class="fact-chip">
        <span class="fact-label">City / Location</span>
        <span class="fact-value">${selectedCandidate.city}</span>
      </div>
      <div class="fact-chip">
        <span class="fact-label">Willing to Relocate</span>
        <span class="fact-value">${formatFact(selectedCandidate.willing_to_relocate)}</span>
      </div>
      <div class="fact-chip">
        <span class="fact-label">Age</span>
        <span class="fact-value">${selectedCandidate.age} yrs</span>
      </div>
      <div class="fact-chip">
        <span class="fact-label">Faith / Tradition</span>
        <span class="fact-value">${selectedCandidate.faith}</span>
      </div>
    `;

    // Reset gate result box to pending
    decisionPlaceholder.classList.remove('hidden');
    decisionResultBox.classList.add('hidden');
    gateActionsRow.classList.add('hidden');
  }

  function formatFact(val) {
    if (val === undefined || val === null || val === 'unknown') return '❓ Unknown / Unverified';
    if (val === true) return 'Yes / Confirmed';
    if (val === false) return 'No / Local only';
    return val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Analyze Feedback Action
  btnAnalyzeFeedback.addEventListener('click', async () => {
    btnAnalyzeFeedback.disabled = true;
    btnAnalyzeFeedback.innerHTML = `<span class="btn-sparkle">⏳</span><span>Extracting Boundaries...</span>`;
    extractionStatusText.textContent = 'Calling AI Gateway to synthesize structured rules from unstructured feedback...';

    try {
      const res = await fetch('/api/analyze-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackItems: clientData.past_rejections })
      });

      const data = await res.json();
      currentExtraction = data;

      // Update Provenance Banner
      if (data.source === 'live') {
        extractionProvenanceBadge.className = 'chip-live-status live';
        extractionProvenanceBadge.textContent = 'Live: Experiential Labs AI';
        extractionModelTag.textContent = data.model || 'live-model';
      } else {
        extractionProvenanceBadge.className = 'chip-live-status';
        extractionProvenanceBadge.textContent = 'Demo fallback - live AI unavailable';
        extractionModelTag.textContent = 'deterministic-fallback';
      }

      extractionStatusText.textContent = `Extracted ${data.suggestions.length} candidate preference boundaries from client feedback:`;
      renderSuggestions(data.suggestions);

      showToast(`Analysis complete: ${data.suggestions.length} rules extracted (${data.source === 'live' ? 'Live AI' : 'Deterministic fallback'})`, 'success');
    } catch (err) {
      console.error('Error analyzing feedback:', err);
      showToast('Error during feedback analysis', 'warn');
    } finally {
      btnAnalyzeFeedback.disabled = false;
      btnAnalyzeFeedback.innerHTML = `<span class="btn-sparkle">✦</span><span>Re-Analyze Feedback</span>`;
    }
  });

  function renderSuggestions(suggestions) {
    suggestionsContainer.innerHTML = '';
    suggestions.forEach(sug => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      const confidencePct = Math.round((sug.confidence || 0.95) * 100);

      item.innerHTML = `
        <div class="sug-header-row">
          <span class="sug-category-badge">${getCategoryIcon(sug.category)} ${sug.label || sug.category}</span>
          <span class="sug-confidence-pill">${confidencePct}% Confidence</span>
        </div>
        <div class="sug-rule-text">${escapeHtml(sug.normalized_preference)}</div>
        <div class="sug-evidence-box">Evidence: "${escapeHtml(sug.evidence_snippet)}"</div>
        <div class="sug-actions-row">
          <button class="btn-dismiss-rule" data-id="${sug.id}">Dismiss</button>
          <button class="btn-confirm-rule" data-id="${sug.id}">Confirm into Rules →</button>
        </div>
      `;

      // Handle Confirm
      const btnConfirm = item.querySelector('.btn-confirm-rule');
      btnConfirm.addEventListener('click', async () => {
        btnConfirm.disabled = true;
        btnConfirm.textContent = 'Saving...';
        try {
          const res = await fetch('/api/confirm-suggestion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suggestion: sug })
          });
          const updateRes = await res.json();
          if (updateRes.success) {
            clientData.confirmed_preferences = updateRes.confirmed_preferences;
            renderConfirmedRules();
            btnConfirm.className = 'btn-confirm-rule confirmed';
            btnConfirm.textContent = '✓ Confirmed by Matchmaker';
            showToast(`Rule '${sug.label || sug.category}' confirmed and added to active gate!`, 'success');
          }
        } catch (err) {
          console.error(err);
          btnConfirm.disabled = false;
          btnConfirm.textContent = 'Retry Confirm';
        }
      });

      // Handle Dismiss
      const btnDismiss = item.querySelector('.btn-dismiss-rule');
      btnDismiss.addEventListener('click', () => {
        item.style.opacity = '0';
        setTimeout(() => item.remove(), 200);
        showToast('Suggestion dismissed without altering rules', 'info');
      });

      suggestionsContainer.appendChild(item);
    });
  }

  // Pre-Send Gate Check Action
  btnRunGateCheck.addEventListener('click', async () => {
    if (!selectedCandidate) return;

    btnRunGateCheck.disabled = true;
    btnRunGateCheck.innerHTML = `<span>Evaluating...</span>`;

    try {
      const res = await fetch('/api/pre-send-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: selectedCandidate.id })
      });

      const data = await res.json();
      lastEvaluation = data.evaluation;
      renderGateDecision(data.evaluation);
    } catch (err) {
      console.error('Error running gate check:', err);
      showToast('Error running gate check', 'warn');
    } finally {
      btnRunGateCheck.disabled = false;
      btnRunGateCheck.innerHTML = `<span>Run Pre-Send Check</span><span class="arrow-icon">→</span>`;
    }
  });

  function renderGateDecision(evaluation) {
    decisionPlaceholder.classList.add('hidden');
    decisionResultBox.classList.remove('hidden', 'status-block', 'status-review', 'status-clear');
    gateActionsRow.classList.remove('hidden');

    const status = evaluation.overallStatus;
    decisionResultBox.classList.add(`status-${status}`);

    let icon = '⛔';
    let title = 'DISPATCH BLOCKED: Hard Preference Conflict';
    let lead = evaluation.primarySummary;

    if (status === 'review') {
      icon = '⚠️';
      title = 'MATCHMAKER REVIEW REQUIRED: Unverified Facts';
      btnSimulateSend.disabled = false;
      btnSimulateSend.textContent = 'Proceed with Verified Notes';
    } else if (status === 'clear') {
      icon = '✅';
      title = 'PRE-SEND GATE CLEARED: Fully Compliant';
      btnSimulateSend.disabled = false;
      btnSimulateSend.textContent = '✓ Ready to Dispatch Profile';
    } else {
      // Block
      btnSimulateSend.disabled = true;
      btnSimulateSend.textContent = 'Dispatch Blocked by Policy';
    }

    const reasonsListHtml = evaluation.detailedChecks.map(check => {
      let bulletClass = 'clear';
      let symbol = '✓';
      if (check.status === 'block') {
        bulletClass = 'block';
        symbol = '✕';
      } else if (check.status === 'review') {
        bulletClass = 'review';
        symbol = '!';
      }

      return `
        <div class="reason-row">
          <span class="reason-bullet">[${symbol}]</span>
          <span class="reason-text">${escapeHtml(check.reason)}</span>
        </div>
      `;
    }).join('');

    decisionResultBox.innerHTML = `
      <div class="result-banner-top">
        <span class="result-status-title">${icon} ${title}</span>
        <span class="result-time-pill">${new Date(evaluation.evaluatedAt).toLocaleTimeString()}</span>
      </div>
      <p class="result-summary-lead">${escapeHtml(lead)}</p>
      <div class="result-reasons-list">
        ${reasonsListHtml}
      </div>
    `;

    if (status === 'block') {
      showToast('Pre-send check BLOCKED: Hard conflict detected', 'warn');
    } else if (status === 'review') {
      showToast('Pre-send check requires human review', 'info');
    } else {
      showToast('Pre-send check CLEARED: Candidate is compliant', 'success');
    }
  }

  // Override Dialog Event Listeners
  btnOpenOverride.addEventListener('click', () => {
    overrideRationale.value = '';
    overrideDialog.showModal();
  });

  btnCloseDialog.addEventListener('click', () => overrideDialog.close());
  btnCancelOverride.addEventListener('click', () => overrideDialog.close());

  btnSubmitOverride.addEventListener('click', async () => {
    const rationale = overrideRationale.value.trim();
    if (rationale.length < 5) {
      showToast('Please provide a substantive override rationale (at least 5 characters)', 'warn');
      return;
    }

    btnSubmitOverride.disabled = true;
    btnSubmitOverride.textContent = 'Logging Override...';

    try {
      const res = await fetch('/api/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidate.id,
          candidateName: selectedCandidate.name,
          rationale: rationale,
          matchmakerName: overrideMatchmakerName.value || 'Lead Matchmaker'
        })
      });

      const data = await res.json();
      if (data.success) {
        overrideDialog.close();
        showToast('Override recorded in compliance audit log. Matchmaker retains ultimate discretion.', 'success');
        btnSimulateSend.disabled = false;
        btnSimulateSend.textContent = '✓ Dispatch Approved via Override';
      }
    } catch (err) {
      console.error(err);
      showToast('Error recording override', 'warn');
    } finally {
      btnSubmitOverride.disabled = false;
      btnSubmitOverride.textContent = 'Confirm & Log Override';
    }
  });

  // Candidate Select Change
  candidateSelect.addEventListener('change', (e) => {
    selectCandidate(e.target.value);
  });

  // Reset Demo
  btnResetDemo.addEventListener('click', async () => {
    if (confirm('Reset demo client and rules to initial state?')) {
      await fetch('/api/reset', { method: 'POST' });
      init();
      showToast('Demo state successfully reset', 'info');
    }
  });

  // Dispatch Button simulation
  btnSimulateSend.addEventListener('click', () => {
    if (btnSimulateSend.disabled) return;
    showToast(`Profile for ${selectedCandidate.name} prepared for matchmaker send! (Simulation only: zero emails sent)`, 'success');
  });

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start app
  init();
})();

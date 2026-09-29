/**
 * Pre-Send Profile Gate - Deterministic Rules Engine
 * Evaluates candidate factual attributes against client confirmed preferences.
 *
 * Core Guarantee:
 * - Direct conflict on any hard rule => 'block'
 * - Missing or unknown facts on any rule => 'review' (NEVER false 'clear')
 * - All hard rules satisfied and known facts => 'clear'
 */

export function evaluateCandidateProfile(client, candidate) {
  if (!client || !candidate) {
    throw new Error('Both client and candidate profiles are required for evaluation');
  }

  const results = [];
  const preferences = client.confirmed_preferences || [];

  for (const pref of preferences) {
    const evalResult = evaluateSinglePreference(pref, candidate);
    results.push(evalResult);
  }

  // Aggregate decisions
  const blocks = results.filter(r => r.status === 'block');
  const reviews = results.filter(r => r.status === 'review');
  const clears = results.filter(r => r.status === 'clear');

  let overallStatus = 'clear';
  let primarySummary = 'Profile satisfies all verified client preferences.';

  if (blocks.length > 0) {
    overallStatus = 'block';
    primarySummary = `Blocked by ${blocks.length} hard conflict${blocks.length > 1 ? 's' : ''}: ${blocks.map(b => b.categoryLabel).join(', ')}.`;
  } else if (reviews.length > 0) {
    overallStatus = 'review';
    primarySummary = `Requires matchmaker review: ${reviews.length} unverified attribute${reviews.length > 1 ? 's' : ''} or soft preference difference${reviews.length > 1 ? 's' : ''}.`;
  }

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    overallStatus,
    primarySummary,
    hasHardConflicts: blocks.length > 0,
    hasUnknowns: reviews.some(r => r.isUnknownFact),
    reasons: results.map(r => r.reason),
    blockReasons: blocks.map(b => b.reason),
    reviewReasons: reviews.map(r => r.reason),
    detailedChecks: results,
    evaluatedAt: new Date().toISOString()
  };
}

export function evaluateSinglePreference(pref, candidate) {
  const category = pref.category;
  const isHard = pref.hard_soft === 'hard';
  const categoryLabel = pref.label || category;

  switch (category) {
    case 'smoking': {
      const candidateVal = candidate.smoking;
      if (!candidateVal || candidateVal === 'unknown') {
        return {
          category,
          categoryLabel,
          status: 'review',
          isHard,
          isUnknownFact: true,
          reason: 'Candidate smoking status is unverified in profile data. Matchmaker must confirm before send.'
        };
      }
      if (pref.polarity === 'must_not_have') {
        const disallowed = pref.disallowed_values || ['social_smoker', 'smoker', 'vaper'];
        if (disallowed.includes(candidateVal)) {
          return {
            category,
            categoryLabel,
            status: isHard ? 'block' : 'review',
            isHard,
            isUnknownFact: false,
            reason: `Client's stated non-smoker preference conflicts with candidate smoking status (Candidate is a ${candidateVal.replace('_', ' ')}).`
          };
        }
      }
      return {
        category,
        categoryLabel,
        status: 'clear',
        isHard,
        isUnknownFact: false,
        reason: 'Candidate is confirmed non-smoker (Compliant).'
      };
    }

    case 'children': {
      const candidateVal = candidate.children;
      if (!candidateVal || candidateVal === 'unknown') {
        return {
          category,
          categoryLabel,
          status: 'review',
          isHard,
          isUnknownFact: true,
          reason: 'Candidate family/children intention is unrecorded. Matchmaker must confirm before send.'
        };
      }
      if (pref.polarity === 'must_have') {
        const allowed = pref.allowed_values || ['wants_children', 'open_to_children'];
        if (!allowed.includes(candidateVal)) {
          return {
            category,
            categoryLabel,
            status: isHard ? 'block' : 'review',
            isHard,
            isUnknownFact: false,
            reason: `Client requires a partner who wants children / to start a family, but candidate states '${candidateVal.replace(/_/g, ' ')}'.`
          };
        }
      }
      return {
        category,
        categoryLabel,
        status: 'clear',
        isHard,
        isUnknownFact: false,
        reason: 'Candidate intentions align with family/children goals (Compliant).'
      };
    }

    case 'location': {
      const targetCity = pref.target_city || 'London';
      const candidateCity = candidate.city;
      const candidateRelocate = candidate.willing_to_relocate;

      if (!candidateCity || candidateCity === 'unknown') {
        return {
          category,
          categoryLabel,
          status: 'review',
          isHard,
          isUnknownFact: true,
          reason: 'Candidate geographic location is unverified.'
        };
      }

      const isLocal = candidateCity.toLowerCase() === targetCity.toLowerCase();
      if (isLocal) {
        return {
          category,
          categoryLabel,
          status: 'clear',
          isHard,
          isUnknownFact: false,
          reason: `Candidate resides locally in ${targetCity} (Compliant).`
        };
      }

      // Candidate is not in target city
      if (candidateRelocate === 'unknown' || candidateRelocate === undefined || candidateRelocate === null) {
        return {
          category,
          categoryLabel,
          status: 'review',
          isHard,
          isUnknownFact: true,
          reason: `Candidate resides in ${candidateCity}; relocation willingness to ${targetCity} is unverified. Cannot assume clear status without verification.`
        };
      }

      if (candidateRelocate === true) {
        return {
          category,
          categoryLabel,
          status: 'clear',
          isHard,
          isUnknownFact: false,
          reason: `Candidate resides in ${candidateCity} but is verified willing to relocate to ${targetCity} (Compliant).`
        };
      }

      return {
        category,
        categoryLabel,
        status: isHard ? 'block' : 'review',
        isHard,
        isUnknownFact: false,
        reason: `Client requires residency in ${targetCity}; candidate is based in ${candidateCity} and unwilling to relocate.`
      };
    }

    case 'age_range': {
      const candidateAge = candidate.age;
      if (candidateAge === undefined || candidateAge === null || candidateAge === 'unknown') {
        return {
          category,
          categoryLabel,
          status: 'review',
          isHard,
          isUnknownFact: true,
          reason: 'Candidate age is not documented in profile.'
        };
      }
      const minAge = pref.min_age ?? 18;
      const maxAge = pref.max_age ?? 99;

      if (candidateAge < minAge || candidateAge > maxAge) {
        return {
          category,
          categoryLabel,
          status: isHard ? 'block' : 'review',
          isHard,
          isUnknownFact: false,
          reason: `Candidate age (${candidateAge}) falls outside client's accepted age range of ${minAge}–${maxAge}.`
        };
      }

      return {
        category,
        categoryLabel,
        status: 'clear',
        isHard,
        isUnknownFact: false,
        reason: `Candidate age (${candidateAge}) is within client's accepted range (${minAge}–${maxAge}).`
      };
    }

    case 'faith': {
      const candidateFaith = candidate.faith;
      const preferred = pref.preferred_values || ['Jewish', 'Culturally Jewish'];

      if (!candidateFaith || candidateFaith === 'unknown') {
        return {
          category,
          categoryLabel,
          status: 'review',
          isHard,
          isUnknownFact: true,
          reason: 'Candidate faith / cultural tradition is unrecorded.'
        };
      }

      const matchesPreferred = preferred.some(p => p.toLowerCase() === candidateFaith.toLowerCase());
      if (matchesPreferred) {
        return {
          category,
          categoryLabel,
          status: 'clear',
          isHard,
          isUnknownFact: false,
          reason: `Candidate aligns with client's preferred cultural heritage (${candidateFaith}).`
        };
      }

      // Since this is a soft preference, it should not hard block, but flags review
      return {
        category,
        categoryLabel,
        status: isHard ? 'block' : 'review',
        isHard,
        isUnknownFact: false,
        reason: `Candidate background (${candidateFaith}) differs from client's soft preference (${preferred.join(' / ')}), but is not a hard dealbreaker.`
      };
    }

    default:
      return {
        category,
        categoryLabel,
        status: 'clear',
        isHard: false,
        isUnknownFact: false,
        reason: `No blocking rule configured for category '${category}'.`
      };
  }
}

/**
 * Assesses whether a feedback snippet is ambiguous or requires human confirmation.
 */
export function validateFeedbackSuggestion(suggestion) {
  const needsConfirmation = 
    suggestion.confidence < 0.85 ||
    suggestion.needs_human_confirmation === true ||
    !suggestion.evidence_snippet ||
    suggestion.evidence_snippet.length < 10 ||
    /maybe|not sure|perhaps|might|sometimes/i.test(suggestion.evidence_snippet);

  return {
    ...suggestion,
    needs_human_confirmation: needsConfirmation
  };
}

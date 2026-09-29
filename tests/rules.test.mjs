import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SEEDED_CLIENT, CANDIDATE_PROFILES } from '../data/demo-data.mjs';
import { evaluateCandidateProfile, evaluateSinglePreference, validateFeedbackSuggestion } from '../src/rules.mjs';

describe('Deterministic Pre-Send Gate Rules Engine', () => {

  test('Direct conflict: Smoker vs Non-smoker produces hard BLOCK', () => {
    const julian = CANDIDATE_PROFILES.find(c => c.id === 'cand_julian');
    assert.ok(julian, 'Julian profile should exist');

    const result = evaluateCandidateProfile(SEEDED_CLIENT, julian);
    assert.equal(result.overallStatus, 'block');
    assert.equal(result.hasHardConflicts, true);

    const smokeCheck = result.detailedChecks.find(c => c.category === 'smoking');
    assert.equal(smokeCheck.status, 'block');
    assert.match(smokeCheck.reason, /client's stated non-smoker preference conflicts with candidate smoking status/i);
  });

  test('Direct conflict: Incompatible children preference produces hard BLOCK', () => {
    const liam = CANDIDATE_PROFILES.find(c => c.id === 'cand_liam');
    assert.ok(liam, 'Liam profile should exist');

    const result = evaluateCandidateProfile(SEEDED_CLIENT, liam);
    assert.equal(result.overallStatus, 'block');
    assert.equal(result.hasHardConflicts, true);

    const kidsCheck = result.detailedChecks.find(c => c.category === 'children');
    assert.equal(kidsCheck.status, 'block');
    assert.match(kidsCheck.reason, /requires a partner who wants children/i);
  });

  test('Direct conflict: Age out of range produces hard BLOCK', () => {
    const sebastian = CANDIDATE_PROFILES.find(c => c.id === 'cand_sebastian');
    assert.ok(sebastian, 'Sebastian profile should exist');

    const result = evaluateCandidateProfile(SEEDED_CLIENT, sebastian);
    assert.equal(result.overallStatus, 'block');
    assert.equal(result.hasHardConflicts, true);

    const ageCheck = result.detailedChecks.find(c => c.category === 'age_range');
    assert.equal(ageCheck.status, 'block');
    assert.match(ageCheck.reason, /falls outside client's accepted age range/i);
  });

  test('Direct conflict: Distant location without relocation willingness produces hard BLOCK', () => {
    const distantCandidate = {
      id: 'cand_distant',
      name: 'Oliver Reed',
      age: 32,
      city: 'Edinburgh',
      smoking: 'non_smoker',
      children: 'wants_children',
      willing_to_relocate: false,
      faith: 'Jewish'
    };

    const result = evaluateCandidateProfile(SEEDED_CLIENT, distantCandidate);
    assert.equal(result.overallStatus, 'block');
    const locCheck = result.detailedChecks.find(c => c.category === 'location');
    assert.equal(locCheck.status, 'block');
    assert.match(locCheck.reason, /unwilling to relocate/i);
  });

  test('Crucial guardrail: Unknown / missing facts NEVER yield false CLEAR (return REVIEW)', () => {
    const lucas = CANDIDATE_PROFILES.find(c => c.id === 'cand_lucas');
    assert.ok(lucas, 'Lucas profile should exist');

    const result = evaluateCandidateProfile(SEEDED_CLIENT, lucas);
    // Lucas is non-smoker, wants children, but lives in Manchester and relocation is 'unknown'
    assert.equal(result.overallStatus, 'review', 'Must require review when relocation is unknown');
    assert.equal(result.hasUnknownFacts !== false, true);

    const locCheck = result.detailedChecks.find(c => c.category === 'location');
    assert.equal(locCheck.status, 'review');
    assert.equal(locCheck.isUnknownFact, true);
    assert.match(locCheck.reason, /relocation willingness.*is unverified.*cannot assume clear/i);
  });

  test('Missing smoking or children attribute returns REVIEW, never CLEAR', () => {
    const incompleteCandidate = {
      id: 'cand_missing_data',
      name: 'Mystery Profile',
      age: 30,
      city: 'London',
      smoking: 'unknown',
      children: 'unknown',
      willing_to_relocate: false,
      faith: 'Jewish'
    };

    const result = evaluateCandidateProfile(SEEDED_CLIENT, incompleteCandidate);
    assert.equal(result.overallStatus, 'review');
    assert.equal(result.hasUnknowns, true);

    const smokeCheck = result.detailedChecks.find(c => c.category === 'smoking');
    assert.equal(smokeCheck.status, 'review');
    assert.equal(smokeCheck.isUnknownFact, true);

    const kidsCheck = result.detailedChecks.find(c => c.category === 'children');
    assert.equal(kidsCheck.status, 'review');
    assert.equal(kidsCheck.isUnknownFact, true);
  });

  test('Fully compatible candidate produces CLEAR status', () => {
    const alexander = CANDIDATE_PROFILES.find(c => c.id === 'cand_alexander');
    assert.ok(alexander, 'Alexander profile should exist');

    const result = evaluateCandidateProfile(SEEDED_CLIENT, alexander);
    assert.equal(result.overallStatus, 'clear');
    assert.equal(result.hasHardConflicts, false);
    assert.equal(result.hasUnknowns, false);
    assert.match(result.primarySummary, /satisfies all verified/i);
  });

  test('Ambiguous feedback requests human confirmation', () => {
    const ambiguousSuggestion = {
      category: 'location',
      normalized_preference: 'Might consider moving outside London',
      polarity: 'must_have',
      hard_soft: 'soft',
      evidence_snippet: 'Maybe in the future she might consider suburbs',
      confidence: 0.65,
      needs_human_confirmation: false
    };

    const validated = validateFeedbackSuggestion(ambiguousSuggestion);
    assert.equal(validated.needs_human_confirmation, true, 'Ambiguous feedback must require human confirmation');
  });

  test('High-confidence explicit feedback does not flag ambiguity', () => {
    const explicitSuggestion = {
      category: 'smoking',
      normalized_preference: 'Strictly non-smoker',
      polarity: 'must_not_have',
      hard_soft: 'hard',
      evidence_snippet: "That is an absolute dealbreaker for me—I cannot date a smoker under any circumstances.",
      confidence: 0.98,
      needs_human_confirmation: false
    };

    const validated = validateFeedbackSuggestion(explicitSuggestion);
    assert.equal(validated.needs_human_confirmation, false);
  });
});

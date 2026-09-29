import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../server.mjs';

const PORT = 3456;
const BASE_URL = `http://localhost:${PORT}`;

describe('End-to-End Server API Integration Tests', () => {

  before((done) => {
    server.listen(PORT, done);
  });

  after((done) => {
    server.close(done);
  });

  test('GET / serves index.html with 200 OK', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /THE DATE CREW/);
    assert.match(html, /PRE-SEND PROFILE GATE/);
  });

  test('GET /api/client returns initial seeded client and gateway status', async () => {
    const res = await fetch(`${BASE_URL}/api/client`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.client.name, 'Elena Rostova');
    assert.equal(data.client.confirmed_preferences.length, 5);
    assert.equal(typeof data.hasLiveKey, 'boolean');
  });

  test('GET /api/candidates returns all 5 seeded profiles', async () => {
    const res = await fetch(`${BASE_URL}/api/candidates`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.candidates.length, 5);
    assert.ok(data.candidates.find(c => c.id === 'cand_julian'));
    assert.ok(data.candidates.find(c => c.id === 'cand_alexander'));
  });

  test('POST /api/analyze-feedback returns fallback analysis with clear badge provenance', async () => {
    const res = await fetch(`${BASE_URL}/api/analyze-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.source, 'fallback');
    assert.equal(data.provider_label, 'Demo fallback - live AI unavailable');
    assert.ok(data.suggestions.length >= 2);
  });

  test('POST /api/pre-send-check flags Julian Vance with hard BLOCK on smoking', async () => {
    const res = await fetch(`${BASE_URL}/api/pre-send-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: 'cand_julian' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.evaluation.overallStatus, 'block');
    assert.equal(data.evaluation.hasHardConflicts, true);
    assert.match(data.evaluation.blockReasons[0], /smoking status/i);
  });

  test('POST /api/pre-send-check flags Alexander Wright as CLEAR', async () => {
    const res = await fetch(`${BASE_URL}/api/pre-send-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: 'cand_alexander' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.evaluation.overallStatus, 'clear');
    assert.equal(data.evaluation.hasHardConflicts, false);
  });

  test('POST /api/pre-send-check flags Lucas Silva as REVIEW due to unverified relocation', async () => {
    const res = await fetch(`${BASE_URL}/api/pre-send-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: 'cand_lucas' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.evaluation.overallStatus, 'review');
    assert.match(data.evaluation.primarySummary, /unverified attribute/i);
  });

  test('POST /api/override logs matchmaker rationale without mutating base rules', async () => {
    const res = await fetch(`${BASE_URL}/api/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: 'cand_julian',
        candidateName: 'Julian Vance',
        rationale: 'Elena agreed to overlook casual social smoking during holiday periods.',
        matchmakerName: 'Senior Matchmaker Jane'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.overrideEntry.candidateId, 'cand_julian');

    // Verify Elena's confirmed preferences were NOT mutated
    const clientRes = await fetch(`${BASE_URL}/api/client`);
    const clientData = await clientRes.json();
    const smokePref = clientData.client.confirmed_preferences.find(p => p.category === 'smoking');
    assert.equal(smokePref.disallowed_values.includes('social_smoker'), true);
  });
});

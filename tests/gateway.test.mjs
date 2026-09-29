import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractPreferences } from '../src/ai-gateway.mjs';
import { SEEDED_CLIENT } from '../data/demo-data.mjs';

describe('AI Gateway & Fallback Behavior', () => {

  test('Missing API key immediately returns clearly labeled deterministic fallback', async () => {
    const result = await extractPreferences({
      feedbackItems: SEEDED_CLIENT.past_rejections,
      env: {} // No API key configured
    });

    assert.equal(result.source, 'fallback');
    assert.equal(result.provider_label, 'Demo fallback - live AI unavailable');
    assert.match(result.fallback_reason, /not configured/i);
    assert.ok(Array.isArray(result.suggestions));
    assert.equal(result.suggestions.length, 2);

    const smokingSug = result.suggestions.find(s => s.category === 'smoking');
    assert.ok(smokingSug);
    assert.equal(smokingSug.polarity, 'must_not_have');
    assert.equal(smokingSug.hard_soft, 'hard');
    assert.ok(smokingSug.evidence_snippet.length > 0);
  });

  test('Invalid API endpoint or failed network returns fallback without throwing', async () => {
    const result = await extractPreferences({
      feedbackItems: SEEDED_CLIENT.past_rejections,
      env: {
        EXPERIENTIAL_API_KEY: 'test-dummy-key',
        EXPERIENTIAL_BASE_URL: 'http://127.0.0.1:59999/invalid-endpoint' // unreachable
      }
    });

    assert.equal(result.source, 'fallback');
    assert.equal(result.provider_label, 'Demo fallback - live AI unavailable');
    assert.ok(result.fallback_reason.includes('Live provider error'));
    assert.ok(result.suggestions.length > 0);
  });

  test('Gateway suggestions conform strictly to required schema', async () => {
    const result = await extractPreferences({
      feedbackItems: SEEDED_CLIENT.past_rejections,
      env: {}
    });

    for (const sug of result.suggestions) {
      assert.ok(typeof sug.id === 'string');
      assert.ok(typeof sug.category === 'string');
      assert.ok(['smoking', 'children', 'location', 'age_range', 'faith', 'lifestyle'].includes(sug.category));
      assert.ok(typeof sug.normalized_preference === 'string');
      assert.ok(['must_have', 'must_not_have', 'neutral'].includes(sug.polarity));
      assert.ok(['hard', 'soft'].includes(sug.hard_soft));
      assert.ok(typeof sug.evidence_snippet === 'string');
      assert.ok(typeof sug.confidence === 'number' && sug.confidence >= 0 && sug.confidence <= 1);
      assert.ok(typeof sug.needs_human_confirmation === 'boolean');
    }
  });
});

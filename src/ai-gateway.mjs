/**
 * Provider-Neutral AI Gateway
 * Dispatches to Experiential Labs adapter when configured, or reliably falls back
 * to deterministic seeded analysis with clear provenance labeling.
 *
 * Core Guarantee:
 * - Never leaks API keys or secrets to browser clients.
 * - Always returns schema-consistent structured JSON.
 * - NEVER pretends a fallback is a live AI result.
 */

import { requestExperientialAnalysis } from './experiential-adapter.mjs';
import { DETERMINISTIC_FALLBACK_ANALYSIS } from '../data/demo-data.mjs';
import { validateFeedbackSuggestion } from './rules.mjs';

export async function extractPreferences({
  feedbackItems = [],
  env = process.env
} = {}) {
  const apiKey = env.EXPERIENTIAL_API_KEY;
  const baseUrl = env.EXPERIENTIAL_BASE_URL || 'https://api.experientiallabs.ai/v1';
  const model = env.EXPERIENTIAL_MODEL || 'gpt-4o-mini';

  // Check if credentials are present
  const hasKey = apiKey && apiKey.trim() !== '' && apiKey !== 'your_experiential_labs_key_here';

  if (!hasKey) {
    return {
      source: 'fallback',
      provider_label: 'Demo fallback - live AI unavailable',
      fallback_reason: 'Experiential Labs API key not configured in .env',
      model: DETERMINISTIC_FALLBACK_ANALYSIS.model,
      analyzed_at: new Date().toISOString(),
      suggestions: DETERMINISTIC_FALLBACK_ANALYSIS.suggestions.map(validateFeedbackSuggestion)
    };
  }

  try {
    const liveResult = await requestExperientialAnalysis({
      feedbackItems,
      apiKey,
      baseUrl,
      model
    });

    const validatedSuggestions = (liveResult.suggestions || []).map(validateFeedbackSuggestion);

    return {
      source: 'live',
      provider_label: 'Experiential Labs AI (Live)',
      model: liveResult.model || model,
      analyzed_at: new Date().toISOString(),
      suggestions: validatedSuggestions
    };
  } catch (error) {
    // Log safe diagnostic server-side
    console.warn(`[AI-Gateway] Experiential Labs call failed (${error.message}). Reverting to deterministic fallback.`);

    return {
      source: 'fallback',
      provider_label: 'Demo fallback - live AI unavailable',
      fallback_reason: `Live provider error: ${error.message}`,
      model: DETERMINISTIC_FALLBACK_ANALYSIS.model,
      analyzed_at: new Date().toISOString(),
      suggestions: DETERMINISTIC_FALLBACK_ANALYSIS.suggestions.map(validateFeedbackSuggestion)
    };
  }
}

/**
 * Experiential Labs AI Adapter
 * Connects to Experiential Labs' OpenAI-compatible Gateway endpoint.
 */

export async function requestExperientialAnalysis({
  feedbackItems,
  apiKey,
  baseUrl = 'https://api.experientiallabs.ai/v1',
  model = 'gpt-4o-mini',
  timeoutMs = 12000
}) {
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_experiential_labs_key_here') {
    throw new Error('Experiential Labs API key is not configured');
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const feedbackText = feedbackItems
    .map((item, idx) => `[Comment ${idx + 1} - regarding ${item.candidate_name || 'Candidate'}]: "${item.feedback_text}"`)
    .join('\n\n');

  const systemPrompt = `You are a compliance assistant for a high-end matchmaking service ("The Date Crew").
Your task is to analyze client post-date rejection feedback and extract structured preference boundaries.

Return ONLY a valid JSON object matching this schema:
{
  "suggestions": [
    {
      "id": "sug_<category>_<index>",
      "category": "smoking" | "children" | "location" | "age_range" | "faith" | "lifestyle",
      "label": "Brief human readable label (e.g., Smoking Status)",
      "normalized_preference": "Clear, concise preference rule",
      "polarity": "must_have" | "must_not_have",
      "hard_soft": "hard" | "soft",
      "evidence_snippet": "Verbatim quote snippet directly from the feedback",
      "confidence": number between 0.0 and 1.0,
      "needs_human_confirmation": boolean (set true if tone is tentative, ambiguous, uses words like 'maybe', or requires human policy judgment),
      "client_quote_source": "Source reference"
    }
  ]
}

Focus only on high-signal attributes: smoking, children/family, location/relocation, age range, faith/cultural community.
Do not hallucinate rules not supported by verbatim text.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze the following rejection feedback comments from client:\n\n${feedbackText}` }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Experiential Labs HTTP ${response.status}: ${response.statusText} - ${errBody.slice(0, 150)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Experiential Labs returned empty message content');
    }

    const parsed = JSON.parse(content);
    if (!parsed || !Array.isArray(parsed.suggestions)) {
      throw new Error('Experiential Labs response did not contain a suggestions array');
    }

    return {
      model: data.model || model,
      suggestions: parsed.suggestions
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Experiential Labs request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

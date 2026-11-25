/**
 * Server-side Gemini client for AI incident triage.
 * The API key stays in .env / Vercel environment variables and is never
 * exposed to public/ or returned in an API response.
 */

const env = require('../config/env');

const ALLOWED_CATEGORIES = ['Hardware', 'Software', 'Network', 'Peripheral', 'Power'];
const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const SLA_MINUTES = { Low: 240, Medium: 240, High: 120, Critical: 60 };

const configured = Boolean(env.GEMINI_API_KEY);

let preferredModel = env.GEMINI_MODEL || 'gemini-4-hydrogen';

function candidates() {
  return [...new Set([
    preferredModel,
    env.GEMINI_MODEL,
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest'
  ].filter(Boolean))];
}

function aiError(message, statusCode = 502) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function buildPrompt(input) {
  return `You are the incident triage assistant for BCA Lab 302 at KLE Technological University.
Classify this laboratory incident for the technician queue.

Workstation: ${input.workstationTag || 'not specified'}
Summary: ${input.title || 'not provided'}
Details: ${input.description || 'not provided'}
Current category: ${input.category || 'not selected'}
Current priority: ${input.priority || 'not selected'}

Allowed categories: Hardware, Software, Network, Peripheral, Power.
Allowed priorities: Low, Medium, High, Critical.
SLA minutes: Low=240, Medium=240, High=120, Critical=60.

Priority rubric:
- Critical: fire, smoke, power loss, or a workstation that is unsafe or unusable for the whole lab.
- High: repeated network drops, hardware failure, or any fault that blocks the current lab exercise.
- Medium: degraded performance or a single application fault with a workaround.
- Low: cosmetic issue or a request that does not block work.

Use only the reported symptoms. Do not invent test results or hardware faults.

Return ONLY a JSON object with this exact shape:
{"category":"...","priority":"...","summary":"one sentence under 18 words","suggestedActions":["step 1","step 2","step 3"]}
No markdown, no code fences, no extra keys.`;
}

async function requestModel(model, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          thinkingConfig: { thinkingBudget: 0 }
        }
      }),
      signal: AbortSignal.timeout(12000)
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    const error = aiError(
      response.status === 429
        ? 'The AI triage quota is busy. Try again in a moment.'
        : 'The AI triage service is temporarily unavailable. Try again.',
      response.status === 401 || response.status === 403 ? 502 : 503
    );
    error.providerStatus = response.status;
    error.providerDetail = detail;
    throw error;
  }

  return response.json();
}

async function generate(prompt) {
  if (!configured) {
    throw aiError('AI triage is not configured. Add GEMINI_API_KEY to .env.', 503);
  }

  let lastError = null;

  for (const model of candidates()) {
    const startedAt = Date.now();
    try {
      const payload = await requestModel(model, prompt);
      const parts = payload.candidates?.[0]?.content?.parts || [];
      const text = parts.map((part) => part.text || '').join('').trim();

      if (!text) {
        lastError = aiError('Gemini returned an empty triage response.', 502);
        console.warn(`[AI] ${model} returned an empty response after ${Date.now() - startedAt}ms`);
        continue;
      }

      preferredModel = model;
      console.log(`[AI] Triage completed with ${model} in ${Date.now() - startedAt}ms`);
      return { text, model: payload.modelVersion || model };
    } catch (error) {
      lastError = error;
      console.warn(`[AI] ${model} failed after ${Date.now() - startedAt}ms: ${error.providerStatus || error.name || 'error'} ${error.message}`);
      // A rejected key or malformed request will not improve on another model.
      if (error.providerStatus === 400 || error.providerStatus === 401 || error.providerStatus === 403) {
        break;
      }
    }
  }

  if (lastError && lastError.statusCode === 502) throw lastError;
  throw aiError('The AI triage service is temporarily unavailable. Try again.', 502);
}

function parsePayload(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // fall through to the readable error below
      }
    }
  }

  throw aiError('Gemini returned an unreadable triage response. Try again.', 502);
}

function normalise(value, allowed, fallback) {
  const match = allowed.find((item) => item.toLowerCase() === String(value || '').trim().toLowerCase());
  return match || fallback;
}

async function triageGrievance(input) {
  const fallbackCategory = ALLOWED_CATEGORIES.includes(input.category) ? input.category : 'Hardware';
  const fallbackPriority = ALLOWED_PRIORITIES.includes(input.priority) ? input.priority : 'Medium';

  const { text, model } = await generate(buildPrompt(input));
  const parsed = parsePayload(text);

  const category = normalise(parsed.category, ALLOWED_CATEGORIES, fallbackCategory);
  const priority = normalise(parsed.priority, ALLOWED_PRIORITIES, fallbackPriority);

  const summary = String(parsed.summary || '').trim().slice(0, 220) || 'Laboratory incident reported.';

  const suggestedActions = Array.isArray(parsed.suggestedActions)
    ? parsed.suggestedActions
      .map((step) => String(step || '').trim())
      .filter(Boolean)
      .slice(0, 4)
    : [];

  return {
    category,
    priority,
    slaMinutes: SLA_MINUTES[priority],
    summary,
    suggestedActions,
    model
  };
}

module.exports = {
  configured,
  triageGrievance
};

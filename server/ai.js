// Gemini-based answer judge with in-memory cache + batching
const AI_MODEL = "gemini-2.5-flash";
const AI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent`;
const AI_TIMEOUT_MS = 12000;

// Cache: key -> { valid, explanation }
const cache = new Map();
const cacheKey = (letter, category, ans) =>
  `${letter.toLowerCase()}|${category.toLowerCase()}|${ans.trim().toLowerCase()}`;

function getApiKey() {
  return process.env.GEMINI_API_KEY || "";
}

function buildPrompt(letter, toAsk) {
  const lines = toAsk
    .map((it, i) => `${i + 1}. Catégorie: "${it.category}" — Réponse: "${it.answer}"`)
    .join("\n");
  return `Tu es l'arbitre du jeu "Petit Bac" en français. La lettre imposée est "${letter.toUpperCase()}".

Règles de validité pour CHAQUE réponse :
- Elle commence par la lettre "${letter.toUpperCase()}" (insensible aux accents et à la casse).
- Elle appartient réellement à la catégorie demandée.
- C'est une réponse plausible et réelle (pas un mot inventé).

Pour chaque réponse, fournis :
- "valid": true ou false
- "explanation": 1 à 2 phrases COURTES en français. Si valide, glisse un petit fait de culture générale concret sur cette réponse (lieu, origine, anecdote, époque, particularité). Si invalide, dis brièvement pourquoi (ex: ne commence pas par la lettre, n'existe pas, n'appartient pas à la catégorie).

Réponses à juger (dans l'ordre) :
${lines}

Réponds STRICTEMENT en JSON, un tableau du même ordre :
[{"valid": true|false, "explanation": "..."}, ...]`;
}

async function callGemini(prompt) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(`${AI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                valid: { type: "boolean" },
                explanation: { type: "string" },
              },
              required: ["valid", "explanation"],
            },
          },
        },
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Gemini HTTP ${res.status}: ${txt.slice(0, 160)}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("AI did not return an array");
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Validate a batch of answers.
 * @param {string} letter
 * @param {{category: string, answer: string}[]} items
 * @returns {Promise<({valid: boolean, explanation: string} | null)[]>}
 *   Same length as input; null entries mean the AI couldn't decide.
 */
async function validateBatch(letter, items) {
  if (!items || !items.length) return [];
  if (!getApiKey()) return items.map(() => null);

  const indexes = new Map(); // key -> [idx]
  const toAsk = [];
  for (let i = 0; i < items.length; i++) {
    const { category, answer } = items[i];
    const k = cacheKey(letter, category, answer);
    if (cache.has(k)) {
      if (!indexes.has(k)) indexes.set(k, []);
      indexes.get(k).push(i);
      continue;
    }
    if (!indexes.has(k)) {
      indexes.set(k, []);
      toAsk.push({ key: k, category, answer });
    }
    indexes.get(k).push(i);
  }

  if (toAsk.length) {
    try {
      const prompt = buildPrompt(letter, toAsk);
      const verdicts = await callGemini(prompt);
      // best-effort align by index; if length mismatch, mark missing as null
      for (let i = 0; i < toAsk.length; i++) {
        const v = verdicts[i];
        if (v && typeof v.valid === "boolean") {
          cache.set(toAsk[i].key, {
            valid: v.valid,
            explanation: String(v.explanation || "").slice(0, 260),
          });
        }
      }
    } catch (e) {
      console.error("[ai] validateBatch failed:", e.message);
    }
  }

  const result = new Array(items.length).fill(null);
  for (const [k, idxs] of indexes.entries()) {
    const v = cache.get(k) || null;
    for (const i of idxs) result[i] = v;
  }
  return result;
}

module.exports = { validateBatch };

const MODEL = "gpt-4.1-nano";
const MAX_TOKENS = 60;
const TEMPERATURE = 0.2;
const EMBED_MODEL = "text-embedding-3-small";

/**
 * Fetch a context-aware definition using OpenAI's Chat Completion API
 * @param {string} word
 * @param {string} sentence
 * @returns {Promise<string|null>}
 */
window.fetchDefinition = async function(word, sentence) {
  const prompt = `In context of "${sentence}", explain "${word}" in ≤15 words, same language as context.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE
      })
    });

    const body = await res.text();
    if (!res.ok) {
      let msg = "Unexpected error.";
      try { msg = JSON.parse(body)?.error?.message || msg; } catch {}
      throw new Error(`OpenAI error ${res.status}: ${msg}`);
    }

    return JSON.parse(body).choices?.[0]?.message?.content?.trim() || "";
  } catch (e) {
    console.error("fetchDefinition failed:", e.message);
    return null;
  }
};

/**
 * Generate OpenAI embeddings for an array of texts
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
window.embedBatch = async function(texts) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts
    })
  });

  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).data.map(d => d.embedding);
};

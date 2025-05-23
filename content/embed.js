/* Clean and flatten visible text from the page */
window.getCleanPageText = function () {
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll("script, style, noscript, code, pre, svg, canvas").forEach(el => el.remove());
  return clone.innerText.replace(/\s+/g, " ").trim();
};

/* Split long text into sentence-based chunks (~maxTokens each) */
window.chunkText = function (str, maxTokens = 400) {
  const sents = str.split(/(?<=[.?!])\s+/);
  const chunks = [];
  let buf = "";
  for (const s of sents) {
    if ((buf + s).split(" ").length > maxTokens) {
      chunks.push(buf.trim());
      buf = s + " ";
    } else {
      buf += s + " ";
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
};

/* Check if the page is already embedded; if not, do it */
window.ensurePageEmbedded = async function () {
  const url = location.href;
  const already = await hasEmbeds(url);
  console.log(`[Embed] Cache check for ${url}: ${already}`);

  if (already) return false; // ⬅️ return false if nothing happened

  const text = getCleanPageText();
  const chunks = chunkText(text);
  const vectors = await embedBatch(chunks);
  await storeEmbeds(url, chunks, vectors);

  console.log("[Embed] Embedding complete.");
  return true; // ⬅️ return true if embedding happened
}

/* Cosine similarity between two vectors */
function cosineSim(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/* Answer a user question using nearest context from embeddings */
window.answerQuestion = async function (question) {
  const url = location.href;
  const vecQ = (await embedBatch([question]))[0];
  const chunks = await getEmbeds(url);

  if (!chunks.length) return "This page is not embedded yet. Please try again later.";

  chunks.forEach(obj => obj.score = cosineSim(vecQ, obj.vec));
  const topChunks = chunks.sort((a, b) => b.score - a.score).slice(0, 4);
  const context = topChunks.map(c => c.text).join("\n\n---\n\n");

  const system = `You are a helpful assistant. You are only allowed to answer based on the context provided.
If the answer is not clearly present or cannot be confidently inferred from the context, respond with:
"I could not find anything about that on this page."`;

  const prompt = `Context:\n${context}\n\nQuestion: ${question}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "I could not find anything about that on this page.";
};


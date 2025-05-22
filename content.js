/* ---- Dyslexia-NLP: click-to-explain  ------------------ */

/* 1. CONFIG  */
const MODEL = "gpt-4.1-nano"; // Most cost-effective OpenAI model
const temperature = 0.2;      // Lower temperature for more deterministic output
const max_tokens = 60;        // Limit response length
const defs = new Map();       // Cache for word ➜ explanation

/* 2. UTILITIES */
function isDifficult(word) {
  return (
    !COMMON_WORDS.has(word.toLowerCase()) &&
    /^[A-Za-z]+$/.test(word)
  );
}

async function fetchDefinition(word, sentence) {
  const prompt = `Given the sentence: "${sentence}", explain the meaning of the word "${word}" in the same language as the sentence. Keep the explanation contextual and under 15 words.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens,
        temperature
      })
    });

    const body = await response.text();

    if (!response.ok) {
      // Optional: parse JSON if valid
      let message = "Unexpected error.";
      try {
        const errJson = JSON.parse(body);
        message = errJson?.error?.message || message;
      } catch {}
      throw new Error(`OpenAI error ${response.status}: ${message}`);
    }

    const data = JSON.parse(body);
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("fetchDefinition failed:", error.message);
    return null;
  }
}

/* 3. TEXT WRAPPING */
function wrapText(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentNode;
    const text = node.nodeValue;
    const parts = text.split(/(\b[A-Za-z]{8,}\b)/);

    if (parts.length === 1) return;

    const fragment = document.createDocumentFragment();
    for (const part of parts) {
      if (isDifficult(part)) {
        const span = document.createElement("span");
        span.className = "df-word";
        span.textContent = part;
        span.dataset.word = part;
        span.dataset.sent = encodeURIComponent(text.trim());
        fragment.appendChild(span);
      } else {
        fragment.appendChild(document.createTextNode(part));
      }
    }
    parent.replaceChild(fragment, node);
  } else if (
    node.nodeType === Node.ELEMENT_NODE &&
    !/^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE)$/i.test(node.tagName)
  ) {
    for (const child of [...node.childNodes]) wrapText(child);
  }
}

wrapText(document.body);

/* 4. INTERACTION HANDLER */
document.addEventListener("click", async (event) => {
  const el = event.target.closest(".df-word");
  if (!el) return;

  const word = el.dataset.word;

  if (defs.has(word)) {
    showTip(el, defs.get(word));
    return;
  }

  showTip(el, "Loading…");

  try {
    const sentence = decodeURIComponent(el.dataset.sent);
    const definition = await fetchDefinition(word, sentence);
    defs.set(word, definition || "No definition found.");
  } catch (err) {
    defs.set(word, "Definition unavailable.");
    console.warn(err);
  }

  showTip(el, defs.get(word));
});

/* 5. TOOLTIP DISPLAY */
function showTip(wordEl, text) {
  let tip = wordEl.querySelector(".df-tooltip-text");
  if (!tip) {
    tip = document.createElement("span");
    tip.className = "df-tooltip-text";
    wordEl.appendChild(tip);
  }
  tip.textContent = text;
  wordEl.classList.add("df-show");}
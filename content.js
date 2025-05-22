// ----------------- Dyslexia-NLP: Click-to-Explain -----------------

// CONFIG
const MODEL = "gpt-4.1-nano";
const temperature = 0.2;
const max_tokens = 60;
const defs = new Map(); // word ➜ explanation cache

/** UTIL: determine if a word is uncommon and difficult */
function isDifficult(word) {
  return !COMMON_WORDS.has(word.toLowerCase()) && /^[A-Za-z]+$/.test(word);
}

/** API: fetch definition from OpenAI */
async function fetchDefinition(word, sentence) {
  const prompt = `Given the sentence: "${sentence}", explain the meaning of the word "${word}" in the same language as the sentence. Keep the explanation contextual and under 15 words.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`, // define this in your secret.js
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens,
        temperature
      })
    });

    const body = await res.text();
    if (!res.ok) {
      let msg = "Unexpected error.";
      try {
        msg = JSON.parse(body)?.error?.message || msg;
      } catch {}
      throw new Error(`OpenAI error ${res.status}: ${msg}`);
    }

    return JSON.parse(body).choices?.[0]?.message?.content?.trim() || "";
  } catch (e) {
    console.error("fetchDefinition failed:", e.message);
    return null;
  }
}

/** TEXT WRAPPING: wrap difficult words with span tooltips */
function wrapTextFast(node) {
  const parent = node.parentNode;
  if (!parent || parent.closest(".df-word")) return;

  const text = node.nodeValue;
  const parts = text.split(/(\b[A-Za-z]{8,}\b)/);
  if (parts.length <= 1 || !parts.some(isDifficult)) return;

  const frag = document.createDocumentFragment();
  const sentence = encodeURIComponent(text.trim());

  for (const part of parts) {
    if (isDifficult(part)) {
      const span = document.createElement("span");
      span.className = "df-word";
      span.textContent = part;
      span.dataset.word = part;
      span.dataset.sent = sentence;
      frag.appendChild(span);
    } else {
      frag.appendChild(document.createTextNode(part));
    }
  }

  parent.replaceChild(frag, node);
}

/** TREE WALKER: find all visible eligible text nodes */
function walkAndWrap(root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentNode;

        if (
          !node.nodeValue.trim() ||
          !parent ||
          parent.classList.contains("df-word") ||
          /^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE|TEXTAREA)$/i.test(parent.tagName)
        ) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const batch = [];
  let node;
  while ((node = walker.nextNode())) batch.push(node);
  batch.forEach(wrapTextFast);
}

/** TOOLTIP: show near word */
function showTip(wordEl, text) {
  let tip = wordEl.querySelector(".df-tooltip-text");

  if (!tip) {
    tip = document.createElement("span");
    tip.className = "df-tooltip-text";

    const closeBtn = document.createElement("button");
    closeBtn.className = "df-tooltip-close";
    closeBtn.innerHTML = "&times;";
    tip.appendChild(closeBtn);

    const textSpan = document.createElement("span");
    textSpan.className = "df-tooltip-content";
    textSpan.textContent = text;
    tip.appendChild(textSpan);

    wordEl.appendChild(tip);
  } else {
    tip.querySelector(".df-tooltip-content").textContent = text;
  }

  wordEl.classList.add("df-show");
}

/** CLICK HANDLING */
document.addEventListener("click", async (event) => {
  // Handle close button
  if (event.target.classList.contains("df-tooltip-close")) {
    const tip = event.target.closest(".df-tooltip-text");
    const wordEl = tip?.closest(".df-word");
    wordEl?.classList.remove("df-show");
    return;
  }

  // Handle word click
  const el = event.target.closest(".df-word");
  if (!el) return;

  const word = el.dataset.word;
  const sentence = decodeURIComponent(el.dataset.sent);

  if (defs.has(word)) {
    showTip(el, defs.get(word));
  } else {
    showTip(el, "Loading…");
    const def = await fetchDefinition(word, sentence);
    defs.set(word, def || "No definition found.");
    showTip(el, defs.get(word));
  }
});

/** START */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => walkAndWrap(document.body));
} else {
  walkAndWrap(document.body);
}

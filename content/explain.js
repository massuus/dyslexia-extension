const defs = new Map(); // In-memory cache
const minWordLength = 4; // Minimum word length to consider

function makeKey(word, sentence) {
  return `${word.toLowerCase()}||${sentence}`;
}

window.isDifficult = function (word) {
  return word.length >= minWordLength &&
         !COMMON_WORDS.has(word.toLowerCase()) &&
         /^\p{L}+$/u.test(word);
};

function wrapTextFast(node) {
  const parent = node.parentNode;
  if (!parent || parent.closest(".df-word")) return;

  // ❌ Skip if inside any clickable or interactive container
  if (parent.closest("a, button, [role='button'], [onclick], [tabindex]")) return;

  if (!node.isConnected) return;

  const text = node.nodeValue;
  const sentence = encodeURIComponent(text.trim());

  const wordRegex = new RegExp(`\\p{L}{${minWordLength},}`, 'gu');
  const matches = [...text.matchAll(wordRegex)];
  if (matches.length === 0) return;

  const frag = document.createDocumentFragment();
  let lastIndex = 0;

  for (const match of matches) {
    const { 0: word, index } = match;
    if (!isDifficult(word)) continue;

    if (index > lastIndex) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex, index)));
    }

    const span = document.createElement("span");
    span.className = "df-word";
    span.textContent = word;
    span.dataset.word = word;
    span.dataset.sent = sentence;
    frag.appendChild(span);

    lastIndex = index + word.length;
  }

  if (lastIndex < text.length) {
    frag.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  if (node.parentNode) {
    node.parentNode.replaceChild(frag, node);
  }
}


window.walkAndWrap = function (root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentNode;
        if (!node.nodeValue.trim() || !parent) return NodeFilter.FILTER_REJECT;

        if (parent.classList.contains("df-word")) return NodeFilter.FILTER_REJECT;

        const INTERACTIVE_TAGS = ["A", "BUTTON", "TEXTAREA", "SELECT", "LABEL", "INPUT", "SUMMARY", "OPTION"];

        if (
          /^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE|TEXTAREA)$/i.test(parent.tagName) ||
          INTERACTIVE_TAGS.includes(parent.tagName) ||
          typeof parent.onclick === "function" ||
          parent.closest("a, button, [role='button'], [onclick], [tabindex]") !== null
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const batch = [];
  let node;
  while ((node = walker.nextNode())) batch.push(node);
  batch.forEach(wrapTextFast);
};

/* ------- Tooltip logic ------- */
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

/* ------- Click handler ------- */
window.setupClickHandler = function () {
  document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("df-tooltip-close")) {
      event.target.closest(".df-word")?.classList.remove("df-show");
      return;
    }

    const el = event.target.closest(".df-word");
    if (!el) return;

    const word = el.dataset.word;
    const sentence = decodeURIComponent(el.dataset.sent);
    const key = makeKey(word, sentence);

    // 1️⃣ In-memory
    if (defs.has(key)) {
      showTip(el, defs.get(key));
      return;
    }

    showTip(el, "Loading…");

    // 2️⃣ IndexedDB
    const cached = await idbGet(word, sentence);
    if (cached) {
      defs.set(key, cached);
      showTip(el, cached);
      return;
    }

    // 3️⃣ API
    const def = await fetchDefinition(word, sentence);
    const finalDef = def || "No definition found.";
    defs.set(key, finalDef);
    idbPut(word, sentence, finalDef);
    showTip(el, finalDef);
  });
};

/* ------- Optional: wrap .br-word spans if enabled ------- */
window.addDfToBrWords = function (root) {
  if (!(root instanceof Element)) return;

  root.querySelectorAll("span.br-word").forEach(br => {
    // Skip if already wrapped
    if (br.closest(".df-word")) return;

    // ❌ Skip if inside a clickable element like a link or button
    const interactive = br.closest("a, button, [role='button'], [onclick], [tabindex]");
    if (interactive) return;

    const txt = br.textContent;
    if (!isDifficult(txt)) return;

    // ✅ Only wrap if safe
    const df = document.createElement("span");
    df.className = "df-word";
    df.dataset.word = txt;
    df.dataset.sent = encodeURIComponent(txt);

    br.replaceWith(df);
    df.appendChild(br);
  });
};


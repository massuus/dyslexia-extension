const defs = new Map(); // In-memory cache

window.isDifficult = function (word) {
  return !COMMON_WORDS.has(word.toLowerCase()) && /^[A-Za-z]+$/.test(word);
};

function makeKey(word, sentence) {
  return word + "||" + sentence;
}

/* ------- Wrapping logic ------- */
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

window.walkAndWrap = function (root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentNode;
        if (!node.nodeValue.trim() || !parent) return NodeFilter.FILTER_REJECT;
        if (parent.classList.contains("df-word")) return NodeFilter.FILTER_REJECT;
        if (/^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE|TEXTAREA)$/i.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
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
    if (br.closest(".df-word")) return;
    const txt = br.textContent;
    if (!isDifficult(txt)) return;

    const df = document.createElement("span");
    df.className = "df-word";
    df.dataset.word = txt;
    df.dataset.sent = encodeURIComponent(txt);
    br.replaceWith(df);
    df.appendChild(br);
  });
};

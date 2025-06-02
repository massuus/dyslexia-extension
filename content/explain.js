const defs = new Map();
const minWordLength = 4;

function fixLen(word) {
  const len = word.length;
  if (len <= 1) return 1;
  if (len <= 3) return 1;
  if (len <= 6) return 2;
  if (len <= 9) return 3;
  return Math.ceil(len * 0.4);
}

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

    const dfSpan = document.createElement("span");
    dfSpan.className = "df-word";
    dfSpan.dataset.word = word;
    dfSpan.dataset.sent = sentence;

    if (window.brOn) {
      const k = fixLen(word);
      const br = document.createElement("span");
      br.className = "br-word";
      br.innerHTML = `<b>${word.slice(0, k)}</b>${word.slice(k)}`;
      dfSpan.appendChild(br);
    } else {
      dfSpan.textContent = word;
    }

    frag.appendChild(dfSpan);
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
  console.warn("[addDfToBrWords] Function called with root:", root);

  if (!(root instanceof Element)) {
    console.warn("[addDfToBrWords] ❌ Root is not a valid Element:", root);
    return;
  }

  if (typeof window.brOn === "undefined") {
    console.warn("[addDfToBrWords] ⚠️ window.brOn is undefined.");
  } else {
    console.warn("[addDfToBrWords] ✅ window.brOn is:", window.brOn);
  }

  if (!window.brOn) {
    console.warn("[addDfToBrWords] ❌ brOn is false, exiting.");
    return;
  }

  console.warn("[addDfToBrWords] 🔍 Searching for span.df-word elements...");

  const dfWords = root.querySelectorAll("span.df-word");
  console.warn(`[addDfToBrWords] 🧠 Found ${dfWords.length} .df-word elements.`);

  dfWords.forEach((df, idx) => {
    console.warn(`[addDfToBrWords] (${idx + 1}/${dfWords.length}) Processing:`, df);

    if (df.querySelector(".br-word")) {
      console.warn(`[addDfToBrWords]   🔁 Skipping: already has .br-word`);
      return;
    }

    const txt = df.textContent?.trim();
    console.warn(`[addDfToBrWords]   📖 Text content:`, txt);

    if (!txt) {
      console.warn("[addDfToBrWords]   ❌ No text found, skipping.");
      return;
    }

    if (typeof window.isDifficult !== "function") {
      console.warn("[addDfToBrWords]   ❌ isDifficult function is missing.");
      return;
    }

    const difficult = window.isDifficult(txt);
    console.warn(`[addDfToBrWords]   🧪 isDifficult('${txt}') →`, difficult);
    if (!difficult) {
      console.warn("[addDfToBrWords]   ❌ Word is not difficult, skipping.");
      return;
    }

    df.textContent = "";
    const k = fixLen(txt);
    console.warn(`[addDfToBrWords]   ✂️ fixLen('${txt}') → ${k}`);

    const br = document.createElement("span");
    br.className = "br-word";
    br.innerHTML = `<b>${txt.slice(0, k)}</b>${txt.slice(k)}`;
    df.appendChild(br);

    console.warn(`[addDfToBrWords]   ✅ Inserted br-word for '${txt}'.`);
  });

  console.warn("[addDfToBrWords] 🎉 Finished processing all df-word elements.");
};




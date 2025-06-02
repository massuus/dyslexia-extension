const BR_ID = "df-br-style";
let brOn = false;
let io = null;
let mo = null;

/* Injects CSS for bold style */
function addCss() {
  if (document.getElementById(BR_ID)) return;
  const style = document.createElement("style");
  style.id = BR_ID;
  style.textContent = ".br-word b { font-weight: 700; }";
  document.head.appendChild(style);
}

function removeCss() {
  document.getElementById(BR_ID)?.remove();
}

/* Determines how many letters to bold based on word length */
function fixLen(word) {
  const len = word.length;
  if (len <= 1) return 1;
  if (len <= 3) return 1;
  if (len <= 6) return 2;
  if (len <= 9) return 3;
  return Math.ceil(len * 0.4);
}

/* Convert a block into BR (and optionally wrap in df-word if explainer is on) */
function convertBlock(block) {
  if (block.hasAttribute("data-br-done")) return;

  function getDifficultWords(text) {
    const words = text.match(/\b[\p{L}\p{M}]{8,}\b/gu) || [];
    return new Set(words.map(w => w.toLowerCase()));
  }

  const difficultWords = getDifficultWords(block.textContent);
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
  const nodes = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentNode;
    const tag = parent.tagName?.toLowerCase();

    if (
      !["script", "style", "textarea"].includes(tag) &&
      !parent.closest(".df-word") &&
      !parent.closest(".br-word")
    ) {
      nodes.push(node);
    }
  }

  for (const node of nodes) {
    const text = node.nodeValue;
    const words = text.split(/(\s+|[\p{Emoji_Presentation}\p{Extended_Pictographic}]+)/gu);
    const frag = document.createDocumentFragment();

    for (let word of words) {
      const trimmed = word.trim();
      if (!trimmed || /\s+/.test(word)) {
        frag.appendChild(document.createTextNode(word));
        continue;
      }

      const wordLower = trimmed.toLowerCase();
      if (/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(trimmed)) {
        frag.appendChild(document.createTextNode(word));
        continue;
      }

      const k = fixLen(trimmed);
      const bolded = `<b>${trimmed.slice(0, k)}</b>${trimmed.slice(k)}`;

      const br = document.createElement("span");
      br.className = "br-word";
      br.innerHTML = bolded;

      if (window.explainerEnabled && difficultWords.has(wordLower)) {
        const df = document.createElement("span");
        df.className = "df-word";
        df.dataset.word = wordLower;
        df.dataset.sent = encodeURIComponent(text);
        df.appendChild(br);
        frag.appendChild(df);
      } else {
        frag.appendChild(br);
      }
    }

    node.replaceWith(frag);
  }

  block.setAttribute("data-br-done", "y");
}

/* Upgrade .df-word spans with br-word formatting if missing */
window.addDfToBrWords = function (root) {

  if (!root) {
    return;
  }

  if (!(root instanceof Element)) {
    return;
  }

  if (!window.brOn) {
    return;
  }


  const dfWords = root.querySelectorAll("span.df-word");

  dfWords.forEach(df => {
    if (df.querySelector(".br-word")) {
      return;
    }

    const txt = df.textContent?.trim();
    if (!txt) {
      return;
    }

    if (!window.isDifficult?.(txt)) {
      return;
    }

    const k = fixLen(txt);
    const br = document.createElement("span");
    br.className = "br-word";
    br.innerHTML = `<b>${txt.slice(0, k)}</b>${txt.slice(k)}`;

    df.textContent = "";
    df.appendChild(br);
  });
};


/* Enable Bionic Reading */
window.enableBR = function () {
  if (brOn) return;
  addCss();
  window.brOn = true;

  const elements = document.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6, td, th");
  io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        convertBlock(entry.target);
        io.unobserve(entry.target);
      }
    }
  }, { rootMargin: "500px" });

  let i = 0;
  function registerBatch(deadline) {
    while (i < elements.length && deadline.timeRemaining() > 5) {
      io.observe(elements[i++]);
    }
    if (i < elements.length) requestIdleCallback(registerBatch);
  }

  requestIdleCallback(registerBatch);

  mo = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (
          n.nodeType === 1 &&
          /^(P|LI|H[1-6]|TD|TH)$/.test(n.tagName)
        ) {
          io.observe(n);
        }
      }
    }
  });

  mo.observe(document.body, { childList: true, subtree: true });

  // 🔁 Upgrade explainer-only spans to include bionic formatting
  addDfToBrWords(document.body);
};

/* Disable Bionic Reading */
function disableBR() {
  if (!brOn) return;
  io?.disconnect?.();
  mo?.disconnect?.();
  removeCss();

  // 🔁 Remove BR wrapping inside df-word
  document.querySelectorAll(".df-word > .br-word").forEach(br => {
    const parent = br.parentElement;
    if (!parent) return;
    const text = document.createTextNode(br.textContent);
    parent.replaceChild(text, br);
  });

  // 🔁 Remove any remaining standalone br-words
  document.querySelectorAll(".br-word").forEach(span => {
    if (!span.closest(".df-word")) {
      span.replaceWith(document.createTextNode(span.textContent));
    }
  });

  // ✅ Also remove outer df-word spans
  document.querySelectorAll(".df-word").forEach(span => {
    span.replaceWith(document.createTextNode(span.textContent));
  });

  brOn = false;
  window.brOn = false;
}


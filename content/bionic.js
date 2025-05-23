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
  const n = word.length;
  return n <= 3 ? 1 : n <= 6 ? 2 : n <= 9 ? 3 : 4;
}

/* Convert a text block into Bionic-style words */
function convertBlock(el, explainerEnabled, isDifficult) {
  if (el.dataset.brDone) return;
  el.dataset.brDone = "y";

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentNode.closest(".br-word")) return NodeFilter.FILTER_REJECT;
      if (/^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE|TEXTAREA)$/i.test(node.parentNode.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  for (const node of textNodes) {
    const parts = node.nodeValue.split(/(\s+)/);
    if (parts.length < 2) continue;

    const frag = document.createDocumentFragment();

    for (const word of parts) {
      if (/^\s+$/.test(word)) {
        frag.appendChild(document.createTextNode(word));
        continue;
      }

      const span = document.createElement("span");
      span.className = "br-word";
      const k = fixLen(word);
      span.innerHTML = `<b>${word.slice(0, k)}</b>${word.slice(k)}`;

      if (explainerEnabled && isDifficult(word)) {
        const df = document.createElement("span");
        df.className = "df-word";
        df.dataset.word = word;
        df.dataset.sent = encodeURIComponent(word);
        df.appendChild(span);
        frag.appendChild(df);
      } else {
        frag.appendChild(span);
      }
    }

    node.parentNode.replaceChild(frag, node);
  }
}

/* Public API: Enable Bionic Reading */
window.enableBR = function (explainerEnabled, isDifficult) {
  if (brOn) return;
  addCss();

  const elements = document.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6");
  io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        convertBlock(entry.target, explainerEnabled, isDifficult);
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
    for (const m of mutations)
      for (const n of m.addedNodes)
        if (n.nodeType === 1 && /^(P|LI|H[1-6])$/.test(n.tagName))
          io.observe(n);
  });

  mo.observe(document.body, { childList: true, subtree: true });
  brOn = true;
};

/* Public API: Disable Bionic Reading */
window.disableBR = function () {
  if (!brOn) return;
  io?.disconnect();
  mo?.disconnect();
  removeCss();

  document.querySelectorAll(".br-word").forEach(el => {
    el.replaceWith(document.createTextNode(el.textContent));
  });

  brOn = false;
};

// This file is content.js
/* ----------------- Dyslexia‑NLP: Click‑to‑Explain ----------------- */

// CONFIG
const MODEL = "gpt-4.1-nano";
const temperature = 0.2;
const max_tokens = 60;

/**
 * In‑memory cache (session‑only) keyed by `word||sentence` so the same word in
 * a different sentence is treated as a new entry.
 */
const defs = new Map();

/**
 * Persistent cache – IndexedDB set‑up. We use a compound key `[word,sentence]`
 * so look‑ups are O(1) and no manual encoding is needed.
 */
const DB_NAME    = "dyslexia‑helper";
const DB_VERSION = 2;
let   dbPromise  = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("defs")) {
        db.createObjectStore("defs", { keyPath: ["word", "sentence"] });
      }
      if (!db.objectStoreNames.contains("pageEmbeds")) {
        const store = db.createObjectStore("pageEmbeds", { keyPath: ["url", "idx"] });
        store.createIndex("byUrl", "url", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });

  return dbPromise;
}

async function idbGet(word, sentence) {
  const db = await openDB();
  return new Promise((res) => {
    const tx    = db.transaction("defs", "readonly");
    const store = tx.objectStore("defs");
    const req   = store.get([word, sentence]);

    req.onsuccess = () => res(req.result?.def || null);
    req.onerror   = () => res(null);
  });
}

async function idbPut(word, sentence, def) {
  const db = await openDB();
  return new Promise((res) => {
    const tx    = db.transaction("defs", "readwrite");
    const store = tx.objectStore("defs");
    store.put({ word, sentence, def });
    tx.oncomplete = () => res();
    tx.onerror    = () => res();
  });
}

/* -------------------- UTILITIES -------------------- */
function makeKey(word, sentence) {
  return word + "||" + sentence;
}

function isDifficult(word) {
  return !COMMON_WORDS.has(word.toLowerCase()) && /^[A-Za-z]+$/.test(word);
}

/* -------------------- API CALL --------------------- */
async function fetchDefinition(word, sentence) {
  const prompt = `In context of "${sentence}", explain "${word}" in \u226415 words, same language as context.`;

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
        max_tokens,
        temperature
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
}

/* ---------------- TEXT WRAPPING -------------------- */
function wrapTextFast(node) {
  const parent = node.parentNode;
  if (!parent || parent.closest(".df-word")) return;

  const text  = node.nodeValue;
  const parts = text.split(/(\b[A-Za-z]{8,}\b)/);
  if (parts.length <= 1 || !parts.some(isDifficult)) return;

  const frag     = document.createDocumentFragment();
  const sentence = encodeURIComponent(text.trim());

  for (const part of parts) {
    if (isDifficult(part)) {
      const span = document.createElement("span");
      span.className     = "df-word";
      span.textContent   = part;
      span.dataset.word  = part;
      span.dataset.sent  = sentence;
      frag.appendChild(span);
    } else {
      frag.appendChild(document.createTextNode(part));
    }
  }

  parent.replaceChild(frag, node);
}

function walkAndWrap(root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentNode;
        if (!node.nodeValue.trim() || !parent || parent.classList.contains("df-word") || /^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE|TEXTAREA)$/i.test(parent.tagName)) {
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
}

/* ------------------ TOOLTIP ------------------------ */
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

/* ---------------- CLICK HANDLER -------------------- */
document.addEventListener("click", async (event) => {
  // close button
  if (event.target.classList.contains("df-tooltip-close")) {
    event.target.closest(".df-word")?.classList.remove("df-show");
    return;
  }

  const el = event.target.closest(".df-word");
  if (!el) return;

  const word     = el.dataset.word;
  const sentence = decodeURIComponent(el.dataset.sent);
  const key      = makeKey(word, sentence);

  // 1️⃣ In‑memory
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

/* ---------------- TOGGLE SUPPORT ------------------- */
let explainerEnabled = false; 
let liveObserver     = null;
let unwrapCleanup    = null;

chrome.storage.sync.get({ explainerEnabled: true }, ({ explainerEnabled: on }) => {
  explainerEnabled = on;
  if (on) enableExplainer();
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "toggleExplainer") return;
  if (msg.enabled && !explainerEnabled) { explainerEnabled = true; enableExplainer(); }
  else if (!msg.enabled && explainerEnabled) { explainerEnabled = false; disableExplainer(); }
});

/* wrap existing <span class="br-word"> if difficult */
function addDfToBrWords(root){
  if (!(root instanceof Element)) return;  // 👈 safeguard added
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
}

function enableExplainer() {
  walkAndWrap(document.body);
  addDfToBrWords(document.body); 

  liveObserver = new MutationObserver((mutations) => {
    for (const m of mutations) for (const n of m.addedNodes) {
      if (n.nodeType === Node.ELEMENT_NODE) {
        walkAndWrap(n);
        addDfToBrWords(n);  
      }
    }
  });
  liveObserver.observe(document.body, { childList: true, subtree: true });

  unwrapCleanup = () => {
    liveObserver?.disconnect();
    liveObserver = null;
    document.querySelectorAll(".df-word").forEach(span => {
      span.replaceWith(document.createTextNode(span.textContent));
    });
  };
}

function disableExplainer() {
  unwrapCleanup?.();
  unwrapCleanup = null;
}

/* ╔════════  PASTEL OVERLAY  ════════╗ */
const OVERLAY_ID = "df-overlay";

function applyOverlay(color) {
  removeOverlay();
  if (!color) return;

  const div   = document.createElement("div");
  div.id      = OVERLAY_ID;
  div.style.cssText = `
    position:fixed;inset:0;pointer-events:none;
    background:${color};
    mix-blend-mode:multiply;
    opacity:.22;               /* tweak strength here */
    z-index:2147483647;        /* sit above everything */
  `;
  document.documentElement.appendChild(div);
}

function removeOverlay() {
  document.getElementById(OVERLAY_ID)?.remove();
}

/* ①  boot – apply stored tint */
chrome.storage.sync.get({ overlayColor: null }, ({ overlayColor }) => {
  applyOverlay(overlayColor);
});

/* ②  react to popup */
chrome.runtime.onMessage.addListener((m) => {
  if (m.type === "setOverlay") {
    chrome.storage.sync.set({ overlayColor: m.color });   // persist
    applyOverlay(m.color);
  }
});
/* ╚══════════════════════════════════╝ */

/* ╔════════  TYPOGRAPHY CONTROL  ════════╗ */
const TYPO_ID = "df-typo-style";
const DEFAULT_TYPO = { font:"inherit", ls:0, ws:0, lh:"normal" };

function applyTypography({ font, ls, ws, lh } = DEFAULT_TYPO) {
  // remove old block
  document.getElementById(TYPO_ID)?.remove();

  const css = `
    @font-face{
      font-family:"OpenDyslexic";
      src:url(${chrome.runtime.getURL("assets/fonts/OpenDyslexic-Regular.woff2")}) format("woff2");
      font-display:swap;
    }
    @font-face{
      font-family:"LexendDeca";
      src:url(${chrome.runtime.getURL("assets/fonts/LexendDeca-VariableFont.woff2")}) format("woff2");
      font-display:swap;
    }

    :root{
      --df-font:${font};
      --df-ls:${ls}px;
      --df-ws:${ws}px;
      --df-lh:${lh};
    }
    html,body,input,textarea,select{
      font-family:var(--df-font)!important;
      letter-spacing:var(--df-ls)!important;
      word-spacing:var(--df-ws)!important;
      line-height:var(--df-lh)!important;
    }`;

  const tag = document.createElement("style");
  tag.id = TYPO_ID;
  tag.textContent = css;
  document.head.appendChild(tag);
}

/* ① boot – apply saved settings */
chrome.storage.sync.get({ typo: DEFAULT_TYPO }, ({ typo }) => applyTypography(typo));

/* ② listen for updates from popup */
chrome.runtime.onMessage.addListener((m) => {
  if (m.type === "setTypography") {
    chrome.storage.sync.set({ typo: m.values });
    applyTypography(m.values);
  }
});
/* ╚══════════════════════════════════╝ */

/* ╔════════  BIONIC READING  ════════╗ */
const BR_ID = "df-br-style";
let brOn=false, io=null, mo=null;

/* helpers */
function addCss(){
  if(document.getElementById(BR_ID)) return;
  const s=document.createElement("style");
  s.id=BR_ID;
  s.textContent=".br-word b{font-weight:700}";
  document.head.appendChild(s);
}
function rmCss(){document.getElementById(BR_ID)?.remove();}
function fixLen(w){const n=w.length;return n<=3?1:n<=6?2:n<=9?3:4;}

/* convert ONE element (p/li/h*) */
/* convert ONE block in-place ----------------------------------- */
function convertBlock(el){
  if (el.dataset.brDone) return;          // already processed
  el.dataset.brDone = "y";

  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(n){
      if (!n.nodeValue.trim()) return 2;
      if (n.parentNode.closest(".br-word")) return 2;   // already bolded
      if (/^(SCRIPT|STYLE|NOSCRIPT|CODE|PRE|TEXTAREA)$/i.test(n.parentNode.tagName)) return 2;
      return 1;
    }
  });

  const txtNodes = [];
  for (let n; (n = tw.nextNode());) txtNodes.push(n);

  txtNodes.forEach(txt => {
    const parts = txt.nodeValue.split(/(\s+)/);
    if (parts.length < 2) return;

    const frag = document.createDocumentFragment();
    parts.forEach(w => {
      if (/^\s+$/.test(w)){ frag.appendChild(document.createTextNode(w)); return; }

      /* build the bolded word */
      const span = document.createElement("span");
      span.className = "br-word";
      const k = fixLen(w);
      span.innerHTML = `<b>${w.slice(0, k)}</b>${w.slice(k)}`;

      /* add dotted underline only if explainer is ON */
      if (explainerEnabled && isDifficult(w)) {
        const df = document.createElement("span");
        df.className   = "df-word";
        df.dataset.word = w;
        df.dataset.sent = encodeURIComponent(w);
        df.appendChild(span);
        frag.appendChild(df);
      } else {
        frag.appendChild(span);
      }
    });
    txt.parentNode.replaceChild(frag, txt);
  });
}

/* enable / disable */
function enableBR(){
  if(brOn) return;
  addCss();

  io=new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(e.isIntersecting){convertBlock(e.target);io.unobserve(e.target);}
    });
  },{rootMargin:"500px"});

  document.querySelectorAll("p,li,h1,h2,h3,h4,h5,h6")
          .forEach(el=>io.observe(el));

  mo=new MutationObserver(ms=>{
    for(const m of ms)for(const n of m.addedNodes)
      if(n.nodeType===1 && /^(P|LI|H[1-6])$/.test(n.tagName)) io.observe(n);
  });
  mo.observe(document.body,{childList:true,subtree:true});
  brOn=true;
}
function disableBR(){
  if(!brOn) return;
  io?.disconnect(); mo?.disconnect(); rmCss();
  document.querySelectorAll(".br-word").forEach(el=>el.replaceWith(el.textContent));
  brOn=false;
}

/* boot + messages */
chrome.storage.sync.get({bionic:false},v=>v.bionic&&enableBR());
chrome.runtime.onMessage.addListener(msg=>{
  if(msg.type==="toggleBionic") msg.enabled?enableBR():disableBR();
});
/* ╚══════════════════════════════════╝ */

const EMBED_MODEL = "text-embedding-3-small";

function getCleanPageText() {
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll("script,style,noscript,code,pre,svg,canvas").forEach(el => el.remove());
  return clone.innerText.replace(/\s+/g, " ").trim();
}

function chunkText(str, maxTokens = 400) {
  const sents = str.split(/(?<=[.?!])\s+/);
  const chunks = [];
  let buf = "";
  for (const s of sents) {
    if ((buf + s).split(" ").length > maxTokens) {
      chunks.push(buf.trim());
      buf = s + " ";
    } else buf += s + " ";
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

async function embedBatch(texts) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts })
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).data.map(d => d.embedding);
}

async function storeEmbeds(url, chunks, vectors) {
  const db = await openDB();
  const tx = db.transaction("pageEmbeds", "readwrite");
  const st = tx.objectStore("pageEmbeds");
  chunks.forEach((txt, i) => st.put({ url, idx: i, text: txt, vec: vectors[i] }));
  return tx.complete;
}

async function ensurePageEmbedded() {
  const url = location.href;
  const db = await openDB();
  const exists = await new Promise(res => {
    const tx = db.transaction("pageEmbeds");
    const ix = tx.objectStore("pageEmbeds").index("byUrl");
    const req = ix.getKey(IDBKeyRange.only(url));
    req.onsuccess = () => res(req.result !== undefined);
  });
  if (exists) return;
  const text = getCleanPageText();
  const chunks = chunkText(text);
  const vecs = await embedBatch(chunks);
  await storeEmbeds(url, chunks, vecs);
}

async function answerQuestion(question) {
  const url = location.href;
  const db = await openDB();
  const vecQ = (await embedBatch([question]))[0];

  const all = await new Promise(res => {
    const tx = db.transaction("pageEmbeds");
    const ix = tx.objectStore("pageEmbeds").index("byUrl");
    const req = ix.getAll(IDBKeyRange.only(url));
    req.onsuccess = () => res(req.result);
  });

  if (!all.length) return "Deze pagina is nog niet ge-embed. Ververs eerst.";

  all.forEach(o => o.score = cosineSim(vecQ, o.vec));
  const top = [...all].sort((a, b) => b.score - a.score).slice(0, 4);

  const context = top.map(o => o.text).join("\n\n---\n\n");
  const sys = "Je bent een AI die alleen antwoord geeft op basis van de gegeven context.";
  const prompt = `Context:\n${context}\n\nVraag: ${question}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "system", content: sys }, { role: "user", content: prompt }],
      temperature: 0.2
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "Geen antwoord ontvangen.";
}
chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "askPagePrompt") {
    createQAWidget();
    if (msg.prefill) {
      await ensurePageEmbedded();
      const output = document.getElementById("df-qa-output");
      const box = document.querySelector(".df-qa-question");
      box.value = msg.prefill;
      output.style.display = "block";
      output.textContent = "Thinking...";
      const answer = await answerQuestion(msg.prefill);
      output.textContent = answer;
    }
  }

  if (msg.type === "forceEmbed") {
    await ensurePageEmbedded();
    alert("Page embedded successfully.");
  }
});


function createQAWidget() {
  if (document.getElementById("df-qa-widget")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "df-qa-widget";
  wrapper.innerHTML = `
    <style>
      :root {
        --c-bg:#f9fafb;
        --c-card:#ffffff;
        --c-text:#111827;
        --c-accent:#2563eb;
        --c-border:#e5e7eb;
        --radius:14px;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --c-bg:#111827;
          --c-card:#1f2937;
          --c-text:#f3f4f6;
          --c-border:#374151;
        }
      }

      #df-qa-widget {
        all: initial;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        background: var(--c-card);
        color: var(--c-text);
        border: 1px solid var(--c-border);
        border-radius: var(--radius);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        z-index: 2147483647;
      }

      .df-qa-card {
        display: flex;
        flex-direction: column;
        padding: 18px 20px 22px;
        gap: 12px;
      }

      .df-qa-card h1 {
        font-size: 15px;
        font-weight: 600;
        margin: 0;
        color: white;
        background: var(--c-accent);
        padding: 8px 12px;
        border-radius: 8px;
      }

      .df-qa-question {
        width: 100%;
        resize: vertical;
        padding: 8px;
        border: 1px solid var(--c-border);
        border-radius: 6px;
        font-size: 13px;
        box-sizing: border-box;
        font-family: inherit;
        background: var(--c-bg);
        color: var(--c-text);
      }

      .df-qa-send {
        background: var(--c-accent);
        color: white;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        padding: 8px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .df-qa-send:hover {
        background: #1e40af;
      }

      .df-qa-answer {
        font-size: 13px;
        background: var(--c-bg);
        padding: 10px;
        border-radius: 8px;
        white-space: pre-wrap;
        max-height: 180px;
        overflow-y: auto;
        border: 1px solid var(--c-border);
      }

      .df-qa-close {
        position: absolute;
        top: 4px;
        right: 10px;
        background: none;
        border: none;
        font-size: 18px;
        color: var(--c-text);
        cursor: pointer;
        font-weight: bold;
      }
    </style>

    <div class="df-qa-card">
      <button class="df-qa-close" title="Close">&times;</button>
      <h1>Ask a question about this page</h1>
      <textarea class="df-qa-question" rows="3" placeholder="e.g. 'Summarize this page'"></textarea>
      <button class="df-qa-send">Ask AI</button>
      <div class="df-qa-answer" id="df-qa-output" style="display:none"></div>
    </div>
  `;

  document.body.appendChild(wrapper);

  const textarea = wrapper.querySelector(".df-qa-question");
  const button = wrapper.querySelector(".df-qa-send");
  const output = wrapper.querySelector(".df-qa-answer");
  const close = wrapper.querySelector(".df-qa-close");

  button.onclick = async () => {
    const question = textarea.value.trim();
    if (!question) return;
    output.style.display = "block";
    output.textContent = "Thinking...";
    await ensurePageEmbedded();
    const answer = await answerQuestion(question);
    output.textContent = answer;
  };

  close.onclick = () => wrapper.remove();
}

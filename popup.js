/* ================================================================
   SAFE MESSAGE DISPATCH
   ================================================================*/
function sendToActiveTab(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) return;                    // no normal tab (e.g. popup over chrome://)
    chrome.tabs.sendMessage(tab.id, message, () => {
      const err = chrome.runtime.lastError;
      if (err && err.message.includes("Could not establish connection")) return; // ignore
      if (err) console.warn("sendMessage error:", err.message);                 // log others
    });
  });
}

/* ================================================================
   WORD-EXPLAINER TOGGLE
   ================================================================*/
const box = document.getElementById("toggle");

chrome.storage.sync.get({ explainerEnabled: true }, ({ explainerEnabled }) => {
  box.checked = explainerEnabled;
});

box.addEventListener("change", () => {
  const enabled = box.checked;
  chrome.storage.sync.set({ explainerEnabled: enabled });
  sendToActiveTab({ type: "toggleExplainer", enabled });
});

/* ================================================================
   PASTEL OVERLAY PICKER
   ================================================================*/
const COLORS = [
  "#fde68a", // amber-200
  "#bbf7d0", // green-200
  "#a5f3fc", // cyan-200
  "#c4b5fd", // violet-300
  "#fbcfe8", // pink-200
  "#ffffff"  // “None”
];

const wrap = document.getElementById("swatch-wrap");

function onSwatchClick(color) {
  const value = color === "#ffffff" ? null : color;
  chrome.storage.sync.set({ overlayColor: value });
  sendToActiveTab({ type: "setOverlay", color: value });
  drawSwatches(color);                       // refresh ring
}

function drawSwatches(activeColor) {
  wrap.innerHTML = "";                       // clear previous
  COLORS.forEach(col => {
    const sw = document.createElement("div");
    sw.className = "swatch";
    sw.style.background = col;
    sw.dataset.active = col === activeColor;
    sw.title = col === "#ffffff" ? "None" : col;
    sw.addEventListener("click", () => onSwatchClick(col));
    wrap.appendChild(sw);
  });
}

chrome.storage.sync.get({ overlayColor: null }, ({ overlayColor }) => {
  drawSwatches(overlayColor ?? "#ffffff");
});

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab && !/^https?:\/\//.test(tab.url)) {
    document.body.classList.add("blocked");
  }
});

/* ╔════════  TYPOGRAPHY PANEL  ════════╗ */
const els = {
  font: document.getElementById("fontSelect"),
  ls:   document.getElementById("ls"),
  ws:   document.getElementById("ws"),
  lh:   document.getElementById("lh"),
  reset:document.getElementById("resetTypo")
};
const defaults = { font:"inherit", ls:0, ws:0, lh:1.4 };   // good baseline

function push(values){
  chrome.storage.sync.set({ typo: values });
  sendToActiveTab({ type:"setTypography", values });
}

function load(){
  chrome.storage.sync.get({ typo: defaults }, ({ typo })=>{
    els.font.value = typo.font;
    els.ls.value   = typo.ls;
    els.ws.value   = typo.ws;
    els.lh.value   = typo.lh;
  });
}

["font","ls","ws","lh"].forEach(k=>{
  els[k].addEventListener("input", ()=> {
    push({
      font: els.font.value,
      ls:   +els.ls.value,
      ws:   +els.ws.value,
      lh:   +els.lh.value
    });
  });
});

els.reset.addEventListener("click", ()=> {
  Object.assign(els,{
    font:{value:defaults.font},
    ls:{value:defaults.ls},
    ws:{value:defaults.ws},
    lh:{value:defaults.lh}
  });
  push(defaults);
  load();
});

load();
/* ╚══════════════════════════════════╝ */

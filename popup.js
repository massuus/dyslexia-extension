// This is the popup script for the Chrome extension. It handles the popup UI and user interactions.
(() => {
/* ---------- safe dispatcher (popup.js) ---------- */
function sendToTab(msg){
  chrome.tabs.query({active:true,currentWindow:true}, ([tab]) => {
    if (!tab?.id) return;                       // e.g. popup over chrome://extensions
    chrome.tabs.sendMessage(tab.id, msg, () => {
      /* Quietly ignore “could not establish connection” */
      void chrome.runtime.lastError;
    });
  });
}

/* ---------- word explainer ---------- */
const expl = document.getElementById("toggle");
if(expl){
  chrome.storage.sync.get({explainerEnabled:true},v=>expl.checked=v.explainerEnabled);
  expl.addEventListener("change",()=>{const en=expl.checked;
    chrome.storage.sync.set({explainerEnabled:en});
    sendToTab({type:"toggleExplainer",enabled:en});
  });
}

/* ---------- overlay picker ---------- */
const COLORS=["#fde68a","#bbf7d0","#a5f3fc","#c4b5fd","#fbcfe8","#ffffff"];
const wrap=document.getElementById("swatch-wrap");
function draw(active){
  wrap.innerHTML="";
  COLORS.forEach(c=>{
    const d=document.createElement("div");
    d.className="swatch";d.style.background=c;d.dataset.active=c===active;
    d.onclick=()=>{const val=c==="#ffffff"?null:c;
      chrome.storage.sync.set({overlayColor:val});
      sendToTab({type:"setOverlay",color:val});draw(c);
    };
    wrap.appendChild(d);
  });
}
chrome.storage.sync.get({overlayColor:null},v=>draw(v.overlayColor??"#ffffff"));

/* ---------- typography panel --------- */
const els = {
  font : document.getElementById("fontSelect"),
  ls   : document.getElementById("ls"),
  ws   : document.getElementById("ws"),
  lh   : document.getElementById("lh"),
  reset: document.getElementById("resetTypo")
};
const defaults = { font:"inherit", ls:0, ws:0, lh:1.4 };

function push(values){
  chrome.storage.sync.set({ typo: values });
  sendToTab({ type:"setTypography", values });
}

function load(){
  chrome.storage.sync.get({ typo: defaults }, ({ typo }) => {
    els.font.value = typo.font;
    els.ls.value   = typo.ls;
    els.ws.value   = typo.ws;
    els.lh.value   = typo.lh;
  });
}

/* live updates */
["font","ls","ws","lh"].forEach(k=>{
  els[k].addEventListener("input", () => push({
    font: els.font.value,
    ls  : +els.ls.value,
    ws  : +els.ws.value,
    lh  : +els.lh.value
  }));
});

/* reset */
els.reset.addEventListener("click", () => {
  Object.assign(els,{
    font:{value:defaults.font},
    ls  :{value:defaults.ls},
    ws  :{value:defaults.ws},
    lh  :{value:defaults.lh}
  });
  push(defaults);
  load();
});

load();

/* ---------- bionic reading ----------- */
const br = document.getElementById("brToggle");
chrome.storage.sync.get({bionic:false},v=>br.checked=v.bionic);
br?.addEventListener("change",()=>{const en=br.checked;
  chrome.storage.sync.set({bionic:en});
  sendToTab({type:"toggleBionic",enabled:en});
});

/* ---------- grey-out on chrome:// ----- */
chrome.tabs.query({active:true,currentWindow:true},([tab])=>{
  if(tab && !/^https?:\/\//.test(tab.url)) document.body.classList.add("blocked");
});

/* ---------- AI buttons ---------- */
document.getElementById("embedBtn")?.addEventListener("click", () => {
  sendToTab({ type: "forceEmbed" });
});

document.getElementById("askBtn")?.addEventListener("click", () => {
  sendToTab({ type: "askPagePrompt" });
});

document.getElementById("summarizeBtn")?.addEventListener("click", () => {
  sendToTab({ type: "askPagePrompt", prefill: "Summarize this page" });
});

let overlayColor = null;

const intensityEl = document.getElementById("tintIntensity");

function updateOverlay(color, intensity) {
  chrome.storage.sync.set({ overlayColor: color, overlayIntensity: intensity });
  sendToTab({ type: "setOverlay", color, intensity });
  draw(); // use the global overlayColor
}

function draw() {
  wrap.innerHTML = "";
  COLORS.forEach(c => {
    const d = document.createElement("div");
    d.className = "swatch";
    d.style.background = c;
    d.dataset.active = c === overlayColor;
    d.onclick = () => {
      overlayColor = c === "#ffffff" ? null : c;
      const intensity = +intensityEl.value;
      updateOverlay(overlayColor, intensity);
    };
    wrap.appendChild(d);
  });
}


chrome.storage.sync.get({ overlayColor: null, overlayIntensity: 22 }, v => {
  overlayColor = v.overlayColor ?? "#ffffff";
  intensityEl.value = v.overlayIntensity ?? 22;
  draw();
});


// intensity change
const debouncedUpdateOverlay = debounce((color, intensity) => {
  updateOverlay(color, intensity);
}, 300);

intensityEl.addEventListener("input", () => {
  const intensity = +intensityEl.value;
  debouncedUpdateOverlay(overlayColor, intensity);
});


function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}



})();



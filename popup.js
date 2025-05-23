// popup.js – Chrome extension popup UI logic
(() => {
  /* ---------- Safe tab message sender ---------- */
  function sendToTab(msg) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, msg, () => {
        void chrome.runtime.lastError; // silently ignore errors
      });
    });
  }

  /* ---------- Word explainer toggle ---------- */
  const expl = document.getElementById("toggle");
  if (expl) {
    chrome.storage.sync.get({ explainerEnabled: true }, v => expl.checked = v.explainerEnabled);
    expl.addEventListener("change", () => {
      const enabled = expl.checked;
      chrome.storage.sync.set({ explainerEnabled: enabled });
      sendToTab({ type: "toggleExplainer", enabled });
    });
  }

  /* ---------- Overlay picker ---------- */
  const COLORS = ["#fde68a", "#bbf7d0", "#a5f3fc", "#c4b5fd", "#fbcfe8", "#ffffff"];
  const wrap = document.getElementById("swatch-wrap");
  const intensityEl = document.getElementById("tintIntensity");
  let overlayColor = null;

  function updateOverlay(color, intensity) {
    chrome.storage.sync.set({ overlayColor: color, overlayIntensity: intensity });
    sendToTab({ type: "setOverlay", color, intensity });
    drawOverlaySwatches();
  }

  function drawOverlaySwatches() {
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
    drawOverlaySwatches();
  });

  const debouncedUpdateOverlay = debounce((color, intensity) => {
    updateOverlay(color, intensity);
  }, 300);

  intensityEl?.addEventListener("input", () => {
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

  /* ---------- Typography controls ---------- */
  const els = {
    font: document.getElementById("fontSelect"),
    ls: document.getElementById("ls"),
    ws: document.getElementById("ws"),
    lh: document.getElementById("lh"),
    reset: document.getElementById("resetTypo")
  };

  const defaults = { font: "inherit", ls: 0, ws: 0, lh: 1.4 };

  function pushTypography(values) {
    chrome.storage.sync.set({ typo: values });
    sendToTab({ type: "setTypography", values });
  }

  function loadTypography() {
    chrome.storage.sync.get({ typo: defaults }, ({ typo }) => {
      els.font.value = typo.font;
      els.ls.value = typo.ls;
      els.ws.value = typo.ws;
      els.lh.value = typo.lh;
    });
  }

  ["font", "ls", "ws", "lh"].forEach(k => {
    els[k].addEventListener("input", () => {
      pushTypography({
        font: els.font.value,
        ls: +els.ls.value,
        ws: +els.ws.value,
        lh: +els.lh.value
      });
    });
  });

  els.reset.addEventListener("click", () => {
    els.font.value = defaults.font;
    els.ls.value = defaults.ls;
    els.ws.value = defaults.ws;
    els.lh.value = defaults.lh;
    pushTypography(defaults);
    loadTypography();
  });

  loadTypography();

  /* ---------- Bionic reading toggle ---------- */
  const br = document.getElementById("brToggle");
  if (br) {
    chrome.storage.sync.get({ bionic: false }, v => br.checked = v.bionic);
    br.addEventListener("change", () => {
      const enabled = br.checked;
      chrome.storage.sync.set({ bionic: enabled });
      sendToTab({ type: "toggleBionic", enabled });
    });
  }

  /* ---------- Grey out UI for system pages ---------- */
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab && !/^https?:\/\//.test(tab.url)) {
      document.body.classList.add("blocked");
    }
  });

  /* ---------- AI Button Actions ---------- */
  document.getElementById("embedBtn")?.addEventListener("click", () => {
    sendToTab({ type: "forceEmbed" });
  });

  document.getElementById("askBtn")?.addEventListener("click", () => {
    sendToTab({ type: "askPagePrompt" });
  });

  document.getElementById("summarizeBtn")?.addEventListener("click", () => {
    sendToTab({ type: "askPagePrompt", prefill: "Summarize this page" });
  });

})();

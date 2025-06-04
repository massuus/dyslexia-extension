window.addEventListener("DOMContentLoaded", () => {
  // ---------- Safe tab message sender ----------
  function sendToTab(msg) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, msg, () => {
        void chrome.runtime.lastError;
      });
    });
  }

  // ---------- Word explainer toggle ----------
  const expl = document.getElementById("toggle");
  if (expl) {
    chrome.storage.sync.get({ explainerEnabled: true }, v => expl.checked = v.explainerEnabled);
    expl.addEventListener("change", () => {
      const enabled = expl.checked;
      chrome.storage.sync.set({ explainerEnabled: enabled });
      sendToTab({ type: "toggleExplainer", enabled });
    });
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "toggleExplainer") {
      if (msg.enabled && !window.explainerEnabled) {
        window.explainerEnabled = true;
        window.walkAndWrap?.(document.body);
        window.setupClickHandler?.();
      } else if (!msg.enabled && window.explainerEnabled) {
        window.explainerEnabled = false;
        document.querySelectorAll(".df-word").forEach(el => {
          el.replaceWith(document.createTextNode(el.textContent));
        });
      }
    }
  });

  // ---------- Overlay picker ----------
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

  function debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  }

  const debouncedUpdateOverlay = debounce((color, intensity) => {
    updateOverlay(color, intensity);
  }, 300);

  intensityEl?.addEventListener("input", () => {
    const intensity = +intensityEl.value;
    debouncedUpdateOverlay(overlayColor, intensity);
  });

  // ---------- Typography controls ----------
  const els = {
    font: document.getElementById("fontSelect"), // may be unused if replaced with dropdown
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
      dropdownBtn.textContent = getFontLabel(typo.font);
      els.ls.value = typo.ls;
      els.ws.value = typo.ws;
      els.lh.value = typo.lh;
    });
  }

  ["ls", "ws", "lh"].forEach(k => {
    els[k].addEventListener("input", () => {
      pushTypography({
        font: dropdownBtn.dataset.value || "inherit",
        ls: +els.ls.value,
        ws: +els.ws.value,
        lh: +els.lh.value
      });
    });
  });

  els.reset.addEventListener("click", () => {
    dropdownBtn.textContent = getFontLabel(defaults.font);
    dropdownBtn.dataset.value = defaults.font;
    els.ls.value = defaults.ls;
    els.ws.value = defaults.ws;
    els.lh.value = defaults.lh;
    pushTypography(defaults);
    loadTypography();
  });

  loadTypography();

  // ---------- Font dropdown ----------
  const dropdownBtn = document.getElementById("fontDropdownBtn");
  const dropdownMenu = document.getElementById("fontDropdownMenu");

  function getFontLabel(value) {
    switch (value) {
      case "'OpenDyslexic',sans-serif": return "OpenDyslexic";
      case "'LexendDeca',sans-serif": return "Lexend Deca";
      case "inherit": return "Website font";
      default: return "Custom Font";
    }
  }

  dropdownBtn.addEventListener("click", () => {
    dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
  });

  dropdownMenu.querySelectorAll("li").forEach(item => {
    item.addEventListener("click", () => {
      const fontValue = item.dataset.value;
      dropdownBtn.textContent = item.textContent;
      dropdownBtn.dataset.value = fontValue;

      chrome.storage.sync.get({ typo: defaults }, ({ typo }) => {
        typo.font = fontValue;
        pushTypography(typo);
      });

      dropdownMenu.style.display = "none";
    });
  });

  document.addEventListener("click", e => {
    if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.style.display = "none";
    }
  });

  // ---------- Bionic toggle ----------
  const br = document.getElementById("brToggle");
  if (br) {
    chrome.storage.sync.get({ bionic: false }, v => br.checked = v.bionic);
    br.addEventListener("change", () => {
      const enabled = br.checked;
      chrome.storage.sync.set({ bionic: enabled });
      sendToTab({ type: "toggleBionic", enabled });
    });
  }

  // ---------- AI Key check ----------
  chrome.storage.sync.get("openaiApiKey", ({ openaiApiKey }) => {
    const hasKey = Boolean(openaiApiKey);
    const aiButtons = ["embedBtn", "askBtn", "summarizeBtn"].map(id => document.getElementById(id));
    const aiDisabledMsg = document.getElementById("aiDisabledMsg");
    const explainerToggleWrap = document.getElementById("explainerToggleWrap");
    const explainerMsg = document.getElementById("explainerDisabledMsg");
    const explainerCard = document.getElementById("explainerCard");

    if (!hasKey) {
      aiButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
      });
      aiDisabledMsg.style.display = "block";
      if (explainerToggleWrap) explainerToggleWrap.style.display = "none";
      if (explainerMsg) explainerMsg.style.display = "block";
      explainerCard?.classList.add("wrap");

      document.getElementById("openOptionsLink")?.addEventListener("click", e => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
      });

      document.getElementById("openOptionsLink2")?.addEventListener("click", e => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
      });
    }
  });

  // ---------- Buttons ----------
  document.getElementById("embedBtn")?.addEventListener("click", () => {
    sendToTab({ type: "forceEmbed" });
  });

  document.getElementById("askBtn")?.addEventListener("click", () => {
    sendToTab({ type: "askPagePrompt" });
  });

  document.getElementById("summarizeBtn")?.addEventListener("click", () => {
    sendToTab({ type: "askPagePrompt", prefill: "Summarize this page" });
  });

  document.getElementById("securityBtn")?.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("security.html") });
  });

  document.getElementById("optionsBtn")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // ---------- Block system pages ----------
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab && !/^https?:\/\//.test(tab.url)) {
      document.body.classList.add("blocked");
    }
  });

  // Version injected via version.js
});

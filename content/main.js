// -------------- INIT STATE --------------
let explainerEnabled = false;
let cleanupExplainer = null;
window.explainerEnabled = false; // Global flag for BR integration

// -------------- TOGGLE EXPLAINER --------------
function enableExplainer() {
  if (!explainerEnabled) return;

  walkAndWrap(document.body);
  addDfToBrWords(document.body);

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1) {
          walkAndWrap(n);
          addDfToBrWords(n);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    document.querySelectorAll(".df-word").forEach(span => {
      span.replaceWith(document.createTextNode(span.textContent));
    });
  };
}

function toggleExplainer(enabled) {
  explainerEnabled = enabled;
  window.explainerEnabled = enabled;
  chrome.storage.sync.set({ explainerEnabled: enabled });

  if (enabled && !cleanupExplainer) {
    cleanupExplainer = enableExplainer();
  } else if (!enabled && cleanupExplainer) {
    cleanupExplainer();
    cleanupExplainer = null;
  }
}

// -------------- MESSAGE HANDLER --------------
chrome.runtime.onMessage.addListener(async (msg) => {
  console.log("[CS] Received message:", msg);

  if (msg.type === "toggleExplainer") {
    toggleExplainer(msg.enabled);
    return;
  }

  if (handleOverlayMessage(msg)) return;
  if (handleTypographyMessage(msg)) return;

  if (msg.type === "toggleBionic") {
    msg.enabled
      ? enableBR() // uses window.explainerEnabled internally
      : disableBR();
    return;
  }

  if (msg.type === "forceEmbed") {
    await ensurePageEmbedded();
    alert("Page embedded successfully.");
    return;
  }

  if (msg.type === "askPagePrompt") {
    createQAWidget();
    console.log("[CS] Trying to launch widget...");
    const output = document.getElementById("df-qa-output");
    const box = document.querySelector(".df-qa-question");

    if (msg.prefill && output && box) {
      box.value = msg.prefill;
      output.style.display = "block";

      const url = location.href;
      const embedded = await hasEmbeds(url);

      if (!embedded) {
        output.textContent = "🔍 Reading page, this will take a sec...";
        try {
          await ensurePageEmbedded();
        } catch (e) {
          output.textContent = "⚠️ Failed to read the page. Try refreshing.";
          return;
        }
      }

      output.textContent = "🧠 Thinking...";
      const answer = await answerQuestion(msg.prefill);
      output.textContent = answer;
    }
    return;
  }
});

// -------------- STARTUP --------------
chrome.storage.sync.get(
  {
    explainerEnabled: false,
    bionic: false
  },
  (prefs) => {
    explainerEnabled = prefs.explainerEnabled;
    window.explainerEnabled = prefs.explainerEnabled;

    if (prefs.explainerEnabled) {
      toggleExplainer(true);
    } else {
      document.querySelectorAll(".df-word").forEach(span => {
        span.replaceWith(document.createTextNode(span.textContent));
      });
    }

    if (prefs.bionic) {
      enableBR(); // internally reads window.explainerEnabled
    }
  }
);

// -------------- INIT EXTRAS --------------
loadStoredOverlay();
loadStoredTypography();
setupClickHandler();

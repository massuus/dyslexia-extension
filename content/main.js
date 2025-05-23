// -------------- INIT STATE --------------
let explainerEnabled = false;
let cleanupExplainer = null;

// -------------- TOGGLE EXPLAINER --------------
function enableExplainer() {
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
      ? enableBR(explainerEnabled, isDifficult)
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
    explainerEnabled: true,
    bionic: false
  },
  (prefs) => {
    toggleExplainer(prefs.explainerEnabled);
    if (prefs.bionic) enableBR(prefs.explainerEnabled, isDifficult);
  }
);

// Initialize features
loadStoredOverlay();
loadStoredTypography();
setupClickHandler();



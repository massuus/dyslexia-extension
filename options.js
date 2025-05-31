const apiKeyInput = document.getElementById("apiKeyInput");
const saveBtn = document.getElementById("saveKeyBtn");
const clearBtn = document.getElementById("clearKeyBtn");
const status = document.getElementById("status");

// Load stored key
chrome.storage.sync.get("openaiApiKey", data => {
  if (data.openaiApiKey) {
    apiKeyInput.value = data.openaiApiKey;
  }
});

// Save key with validation
saveBtn.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  if (!key || !key.startsWith("sk-")) {
    status.textContent = "⚠️ Invalid key. It should start with 'sk-'.";
    return;
  }

  status.textContent = "🔄 Validating key…";

  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${key}`
      }
    });

    if (!res.ok) {
      throw new Error(`OpenAI error ${res.status}`);
    }

    // If validation passed, store the key
    chrome.storage.sync.set({ openaiApiKey: key }, () => {
      status.textContent = "✅ API key saved and validated.";
    });

  } catch (e) {
    status.textContent = "❌ Invalid API key. Please check and try again.";
  }
});


// Clear key
clearBtn.addEventListener("click", () => {
  chrome.storage.sync.remove("openaiApiKey", () => {
    apiKeyInput.value = "";
    status.textContent = "🗑️ API key cleared.";
  });
});

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

// Save key
saveBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key || !key.startsWith("sk-")) {
    status.textContent = "⚠️ Invalid key. It should start with 'sk-'.";
    return;
  }
  chrome.storage.sync.set({ openaiApiKey: key }, () => {
    status.textContent = "✅ API key saved.";
  });
});

// Clear key
clearBtn.addEventListener("click", () => {
  chrome.storage.sync.remove("openaiApiKey", () => {
    apiKeyInput.value = "";
    status.textContent = "🗑️ API key cleared.";
  });
});

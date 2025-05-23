chrome.runtime.onInstalled.addListener(() => {
  console.log("[BG] Installed");
  chrome.contextMenus.create({
    id: "askPage",
    title: "Ask a question about this page...",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("[BG] Context menu clicked", info);

  chrome.tabs.sendMessage(tab.id, { type: "askPagePrompt" }, (res) => {
    if (chrome.runtime.lastError) {
      console.warn("[BG] SendMessage failed:", chrome.runtime.lastError.message);
    } else {
      console.log("[BG] Message sent");
    }
  });
});

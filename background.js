chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "askPage",
    title: "Ask a question about this page...",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {

  chrome.tabs.sendMessage(tab.id, { type: "askPagePrompt" }, (res) => {
    if (chrome.runtime.lastError) {
      console.warn("[BG] SendMessage failed:", chrome.runtime.lastError.message);
    }
  });
});

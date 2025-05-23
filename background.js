// This file is the background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "askPage",
    title: "Ask a question about this page...",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "askPage") {
    chrome.tabs.sendMessage(tab.id, { type: "askPagePrompt" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Unable to send message:", chrome.runtime.lastError.message);
      }
    });
  }
});

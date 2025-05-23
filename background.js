// This file is the background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "askPage",
    title: "Stel een vraag over deze pagina...",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "askPage") {
    chrome.tabs.sendMessage(tab.id, { type: "askPagePrompt" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Kan geen bericht verzenden:", chrome.runtime.lastError.message);
      }
    });
  }
});

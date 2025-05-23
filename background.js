// This file is the background.js and is responsible for setting up the context menu and handling its interactions. It listens for the installation of the extension and creates a context menu item that allows users to ask a question about the current page. When the menu item is clicked, it sends a message to the content script to prompt the user for their question.
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

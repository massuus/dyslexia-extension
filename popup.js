// Load current setting and reflect it in the checkbox
const box = document.getElementById("toggle");
chrome.storage.sync.get({ explainerEnabled: true }, ({ explainerEnabled }) => {
  box.checked = explainerEnabled;
});

// Persist the new value and tell the active tab to update itself
box.addEventListener("change", () => {
  const enabled = box.checked;
  chrome.storage.sync.set({ explainerEnabled: enabled });

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: "toggleExplainer", enabled });
    }
  });
});

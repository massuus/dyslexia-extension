const OVERLAY_ID = "df-overlay";

/**
 * Applies a full-page overlay with the specified color and intensity
 * @param {string|null} color - A hex color string (e.g., "#fde68a") or null to remove
 * @param {number} intensity - An integer from 0–100 representing opacity
 */
window.applyOverlay = function (color, intensity = 22) {
  const existing = document.getElementById(OVERLAY_ID);

  if (!color) {
    removeOverlay();
    return;
  }

  const opacity = (intensity / 100).toFixed(2);

  if (existing) {
    existing.style.background = color;
    existing.style.opacity = opacity;
    return;
  }

  const div = document.createElement("div");
  div.id = OVERLAY_ID;
  div.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    background: ${color};
    mix-blend-mode: multiply;
    opacity: ${opacity};
    z-index: 2147483647;
  `;
  document.documentElement.appendChild(div);
};

/**
 * Removes the overlay if it exists
 */
window.removeOverlay = function () {
  document.getElementById(OVERLAY_ID)?.remove();
};

/**
 * Loads and applies stored overlay settings from `chrome.storage.sync`
 */
window.loadStoredOverlay = function () {
  chrome.storage.sync.get({ overlayColor: null, overlayIntensity: 22 }, ({ overlayColor, overlayIntensity }) => {
    applyOverlay(overlayColor, overlayIntensity);
  });
};

/**
 * Handles messages from popup to update overlay
 * @param {object} msg - Chrome message with type, color, and intensity
 * @returns {boolean} - Whether the message was handled
 */
window.handleOverlayMessage = function (msg) {
  if (msg.type === "setOverlay") {
    chrome.storage.sync.set({ overlayColor: msg.color, overlayIntensity: msg.intensity });
    applyOverlay(msg.color, msg.intensity);
    return true;
  }
  return false;
};

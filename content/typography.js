const TYPO_ID = "df-typo-style";

window.DEFAULT_TYPO = {
  font: "inherit",
  ls: 0,
  ws: 0,
  lh: "normal"
};

/**
 * Apply typography settings to the document
 * @param {Object} settings - Typography settings { font, ls, ws, lh }
 */
window.applyTypography = function ({ font, ls, ws, lh } = DEFAULT_TYPO) {
  document.getElementById(TYPO_ID)?.remove();

  const tag = document.createElement("style");
  tag.id = TYPO_ID;

  let css = "";

  if (font !== "inherit") {
    css += `
      @font-face {
        font-family: "OpenDyslexic";
        src: url(${chrome.runtime.getURL("assets/fonts/OpenDyslexic-Regular.woff2")}) format("woff2");
        font-display: swap;
      }
      @font-face {
        font-family: "LexendDeca";
        src: url(${chrome.runtime.getURL("assets/fonts/LexendDeca-VariableFont.woff2")}) format("woff2");
        font-display: swap;
      }

      html, body, input, textarea, select {
        font-family: ${font} !important;
      }
    `;
  }

  css += `
    html, body, input, textarea, select {
      letter-spacing: ${ls}px !important;
      word-spacing: ${ws}px !important;
      line-height: ${lh} !important;
    }
  `;

  tag.textContent = css;
  document.head.appendChild(tag);
};

/**
 * Load and apply typography settings from storage
 */
window.loadStoredTypography = function () {
  chrome.storage.sync.get({ typo: DEFAULT_TYPO }, ({ typo }) => {
    applyTypography(typo);
  });
};

/**
 * Handle incoming Chrome message to update typography
 * @param {Object} msg - message with type "setTypography" and values
 * @returns {boolean} - true if handled
 */
window.handleTypographyMessage = function (msg) {
  if (msg.type === "setTypography") {
    chrome.storage.sync.set({ typo: msg.values });
    applyTypography(msg.values);
    return true;
  }
  return false;
};

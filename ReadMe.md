# Dyslexia-NLP Helper (MVP)

Chrome-/Edge-compatible extension that makes any web page easier to read for
people with dyslexia or low literacy by **explaining difficult words in-place
with AI and letting the reader tune colours & typography**.

Built by **Sam van Remortel**.

---

## ✨ Current feature set

| Category | What it does |
|----------|--------------|
| **Lexical help** | • Click an underlined word → get a ≤ 15-word, context-aware explanation.<br>• Explanations are generated with OpenAI GPT-4.1-nano.<br>• `IndexedDB` + in-memory cache avoid repeat calls per *word × sentence*. |
| **Visual comfort** | • **Pastel overlay** palette softens page glare.<br>• **Font switcher**: Default / OpenDyslexic / Lexend Deca.<br>• Live sliders for letter-spacing, word-spacing and line-height. |
| **Controls** | • Toolbar popup with an **on/off master switch**.<br>• All settings are saved in `chrome.storage.sync` and follow you across tabs and devices. |
| **Performance** | • Text wrapping runs only when enabled.<br>• Definitions are fetched once, cached forever (unless you clear site data). |

---

## 📦 Installation (developer build)

1. Clone or download this repo.
2. **Add your OpenAI key**  
   ```shell
   cp secret.example.js secret.js
   # then paste your key inside secret.js:
   # const OPENAI_KEY = "sk-XXXXXXXXXXXXXXXXXXXXXXXX";

3. Visit `chrome://extensions` (or `edge://extensions`) → enable **Developer Mode** →
   press **“Load unpacked”** and select the project folder.

> **Heads-up:** the model used (`gpt-4.1-nano`) is small and cheap but still
> costs money. Set a spending cap in your OpenAI dashboard.

---

## 🧑‍🏫 How to use

1. Browse any normal website (HTTP/S).
2. Underlined words mark potential stumbling blocks.
3. Click a word → tooltip pops up with an explanation.
4. Open the extension’s popup to:

   * toggle the helper on/off
   * pick a background tint
   * change font or spacing
5. All choices stick until you change them.

---

## 🔧 Developer notes

* **No keys in source:** `secret.js` is git-ignored.
* **Fonts:** `OpenDyslexic-Regular.woff2` and `LexendDeca-VariableFont.woff2`
  are shipped inside `/assets/fonts` and referenced with `chrome.runtime.getURL`.
* **Manifest v3** — background-less; everything runs in the content script.
* **Caching layers:**

  1. **Map** in the current tab (fastest)
  2. **IndexedDB** (`defs` store, compound key `[word, sentence]`)
  3. **OpenAI** API call (last resort)

---

## Planned ideas:

- Add "bionic reading"


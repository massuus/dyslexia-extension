# Dyslexia-NLP Helper (MVP)

A Chrome/Edge-compatible extension that makes any webpage easier to read for
people with dyslexia or low literacy by **explaining difficult words in-place**
and allowing users to **customize colours and typography**.

Built by **Sam van Remortel**.

---

## ✨ Feature Overview

| Category          | Features |
|------------------|----------|
| **Lexical Help** | • Click underlined words to get ≤ 15-word, context-aware definitions.<br>• Powered by OpenAI `gpt-4.1-nano`.<br>• Uses `IndexedDB` + in-memory cache to avoid duplicate API calls per *word × sentence*. |
| **Visual Comfort** | • Pastel overlay palette to reduce screen glare.<br>• **Tint intensity slider** to adjust overlay strength.<br>• Font options: Default, OpenDyslexic, Lexend Deca.<br>• Sliders for letter spacing, word spacing, and line height. |
| **Controls** | • Toolbar popup with an on/off master switch.<br>• All preferences saved using `chrome.storage.sync` (they persist across tabs and devices). |
| **Performance** | • Only wraps text when enabled.<br>• Definitions are fetched once and cached persistently (unless you clear site data). |
| **Bionic Reading** | • Option to bold the first part of each word for improved readability. |
| **AI Page Tools** | • Ask questions about the page using local embeddings.<br>• Summarize the page.<br>• Force pre-embedding for future queries. |

---

## 📦 Installation (Developer Mode)

1. **Clone or download** this repository.
2. **Add your OpenAI API key:**

   ```bash
   cp secret.example.js secret.js
   # Edit secret.js and paste your key:
   # const OPENAI_KEY = "sk-XXXXXXXXXXXXXXXXXXXXXXXX";
````

3. Open `chrome://extensions` (or `edge://extensions`).
4. Enable **Developer Mode**.
5. Click **"Load unpacked"** and select the project folder.

> ⚠️ *The model used (`gpt-4.1-nano`) is inexpensive, but usage still incurs costs.*
> Set a spending limit in your [OpenAI dashboard](https://platform.openai.com/account/billing/limits) to avoid surprises.

---

## 🧑‍🏫 How to Use

1. Navigate to any standard webpage.
2. Underlined words indicate potential comprehension challenges.
3. Click a word to view a short AI-generated explanation.
4. Use the extension popup to:

   * Toggle the helper on/off
   * Choose a background overlay tint and intensity
   * Switch fonts or adjust spacing
   * Enable bionic reading
   * Ask questions or summarize the page with AI
5. All settings are saved until manually changed.

---

## 🔧 Developer Notes

* `secret.js` is `.gitignore`d — no keys are exposed.
* Fonts (`OpenDyslexic` and `Lexend Deca`) are embedded and loaded locally via `chrome.runtime.getURL`.
* Uses **Manifest V3** with a background-less design — all logic runs in the content script.
* **Caching layers:**

  1. In-memory `Map` (fastest, per session)
  2. Persistent `IndexedDB` (per word × sentence)
  3. OpenAI API (fallback only)

---

## 📸 Preview *(coming soon)*

> Screenshots and demo GIFs will be added in `/docs`.

---

## 🙏 Credits

Crafted with ✨focus and just a little procrastination✨
by **Sam van Remortel**

* Typeface: [OpenDyslexic](https://opendyslexic.org/), [Lexend](https://www.lexend.com/)
* API: [OpenAI](https://platform.openai.com/)


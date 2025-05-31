# Dyslexia Extension v0.3.1

A Chrome/Edge-compatible extension that makes any webpage easier to read for people with dyslexia or low literacy by **explaining difficult words in-place** and allowing users to **customize colours and typography**.

Built by **Sam van Remortel**.

---

## ✨ Feature Overview

| Category          | Features |
|------------------|----------|
| **Lexical Help** | • Click underlined words to get ≤ 15-word, context-aware definitions.<br>• Powered by OpenAI `gpt-4.1-nano`.<br>• Uses `IndexedDB` + in-memory cache to avoid duplicate API calls per *word × sentence*. <br>• ⚠️ Disabled if no OpenAI API key is provided. |
| **AI Page Tools** | • Ask questions about the page using local embeddings.<br>• Summarize the page.<br>• Force pre-embedding for faster future queries.<br>• ⚠️ Disabled if no OpenAI API key is provided. |
| **Visual Comfort** | • Pastel overlay palette to reduce screen glare.<br>• **Tint intensity slider** to adjust overlay strength.<br>• Font options: Default, OpenDyslexic, Lexend Deca.<br>• Sliders for letter spacing, word spacing, and line height. |
| **Bionic Reading** | • Option to bold the first part of each word for improved readability. |

---

## 📦 Installation (Developer Mode)

1. **Clone or download** this repository.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer Mode**.
4. Click **"Load unpacked"** and select the project folder.
5. Open the extension's popup and click the ⚙️ gear icon.
6. Enter your **OpenAI API key** in the settings page.

> ⚠️ *The model used (`gpt-4.1-nano`) is inexpensive, but usage still incurs costs.*  
> Set a spending limit in your [OpenAI dashboard](https://platform.openai.com/account/billing/limits) to avoid surprises.

---

## 🧑‍🏫 How to Use

1. Navigate to any standard webpage.
2. Underlined words indicate potential comprehension challenges.
3. Click a word to view a short AI-generated explanation.
4. Use the popup to:
   * Toggle the helper on/off
   * Choose a background overlay tint and intensity
   * Switch fonts or adjust spacing
   * Enable bionic reading
   * Access page tools powered by AI (if an API key is set)
5. All settings are saved automatically.

---

## 🔐 Security & Privacy

* Your OpenAI key is stored securely using `chrome.storage.sync`.
* No tracking, analytics, or remote storage is used.
* You can view all privacy details [in the Security & Privacy section](./security.html).

---

## 🔧 Developer Notes

* Uses **Manifest V3** with background-less design (no service worker needed).
* Fonts (`OpenDyslexic`, `Lexend Deca`) are embedded and loaded locally.
* Caching layers (for AI definitions):
  1. In-memory `Map` (fastest, per session)
  2. Persistent `IndexedDB` (per word × sentence)
  3. OpenAI API (fallback only)
* Logic split cleanly across `content/`, `popup/`, and `options.js`.

---

## 📸 Preview

> Below are examples of key features in action:

| Feature | Screenshot |
|--------|------------|
| **Word Explainer** | ![Word Explainer](docs/Word%20Explainer.png) |
| **Ask AI** | ![Ask AI](docs/Ask%20AI.png) |
| **AI Tools Panel** | ![AI Tools](docs/AI%20Tools.png) |
| **Bionic Reading** | ![Bionic Reading](docs/Bionic%20Reading.png) |
| **Lexend Font** | ![Lexend Font](docs/Lexend%20Font.png) |
| **OpenDyslexic Font** | ![OpenDyslexic Font](docs/OpenDyslexic%20Font.png) |
| **Tint Overlay Settings** | ![Tint Overlay Settings](docs/Tint%20overlay%20Settings.png) |
| **Typography Settings** | ![Typography Settings](docs/Typography%20Settings.png) |

> Images are stored in `/docs/`. 

---

## 🗓️ Agenda

### Immediate Tasks

* Check if the **OpenAI API key** is valid when the user enters it.
* Resolve the clash between **Bionic Reading** and **Word Explainer**.

### Future plans

* Per-page custom preferences.
* **Word Guesser**: type a word as you think it’s spelled and the AI suggests the correct spelling.
* One-click rewrite: fix grammar and spelling without changing the intended meaning.

---

## 🙏 Credits

Crafted with ✨hyperfocus and procrastination✨  
by **Sam van Remortel**

* Typeface: [OpenDyslexic](https://opendyslexic.org/), [Lexend](https://www.lexend.com/)
* API: [OpenAI](https://platform.openai.com/)

---


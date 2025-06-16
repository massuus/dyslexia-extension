# Dyslexia Extension v0.3.1

A Chrome/Edge-compatible extension that makes any webpage easier to read for people with dyslexia or low literacy by **explaining difficult words in-place** and allowing users to **customize colours and typography**.

Built by **Sam van Remortel**.

🟢 **Now available on the Chrome Web Store:**

<a href="https://chromewebstore.google.com/detail/klpdcdkplgglpiplbkokldplialmekpn" target="_blank" style="display: inline-flex; align-items: center; text-decoration: none;">
  <img src="https://lh3.googleusercontent.com/pe9taKhHUXBON8YvnD3WW6hhGes5Bchf50yZwr8JeYIGxMR7g4I4eC6A_qKjPLtIeHHkmwa0wlx_3ORAaWXxZ94p=s25" alt="Dyslexia Extension Icon" height="25" width="25" style="margin-right: 6px;">
  <img src="https://img.shields.io/chrome-web-store/v/klpdcdkplgglpiplbkokldplialmekpn?label=Install%20on%20Chrome%20Store&logo=googlechrome&style=for-the-badge" alt="Install on Chrome Web Store" height="25">
</a>


---

## ✨ Feature Overview

| Category           | Features                                                                                                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Lexical Help**   | • Click underlined words to get ≤ 15-word, context-aware definitions.<br>• Powered by OpenAI `gpt-4.1-nano`.<br>• Uses `IndexedDB` + in-memory cache to avoid duplicate API calls per *word × sentence*. <br>• ⚠️ Disabled if no OpenAI API key is provided. |
| **AI Page Tools**  | • Ask questions about the page using local embeddings.<br>• Summarize the page.<br>• Force pre-embedding for faster future queries.<br>• ⚠️ Disabled if no OpenAI API key is provided.                                                                       |
| **Visual Comfort** | • Pastel overlay palette to reduce screen glare.<br>• **Tint intensity slider** to adjust overlay strength.<br>• Font options: Default, OpenDyslexic, Lexend Deca.<br>• Sliders for letter spacing, word spacing, and line height.                           |
| **Bionic Reading** | • Option to bold the first part of each word for improved readability.                                                                                                                                                                                       |

---

Absolutely. Here's a cleaner and more structured version of the installation section, with a **dedicated subsection for API key setup** to avoid redundancy and improve clarity:

---

## 📦 Installation

### ➤ Recommended:

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/klpdcdkplgglpiplbkokldplialmekpn).

<a href="https://chromewebstore.google.com/detail/klpdcdkplgglpiplbkokldplialmekpn" target="_blank" style="display: inline-flex; align-items: center; text-decoration: none;">
  <img src="https://lh3.googleusercontent.com/pe9taKhHUXBON8YvnD3WW6hhGes5Bchf50yZwr8JeYIGxMR7g4I4eC6A_qKjPLtIeHHkmwa0wlx_3ORAaWXxZ94p=s25" alt="Dyslexia Extension Icon" height="25" width="25" style="margin-right: 6px;">
  <img src="https://img.shields.io/chrome-web-store/v/klpdcdkplgglpiplbkokldplialmekpn?label=Install%20on%20Chrome%20Store&logo=googlechrome&style=for-the-badge" alt="Install on Chrome Web Store" height="25">
</a>

---

### Developer Mode (Manual):

1. **Clone or download** this repository.
2. Go to `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer Mode** in the top right.
4. Click **“Load unpacked”** and select the project folder.

Here’s a clearer and more explicit version of that section, including the steps to create an API key, the requirement to add credit, and the \$5 minimum deposit:

---

### 🔑 Setting Your OpenAI API Key (Required for AI Features)

To use AI-powered features like **word explanations**, **page questions**, and **summaries**, you need your own **OpenAI API key**.

#### 📌 How to get your API key:

1. Go to [https://platform.openai.com/signup](https://platform.openai.com/signup) and **create an OpenAI account** (if you don’t have one).
2. After logging in, visit your [API keys page](https://platform.openai.com/account/api-keys) and click **“Create new secret key”**.
3. Copy the key that starts with `sk-...`.

> 🧾 **IMPORTANT**:
> OpenAI requires you to add **at least \$5 USD** in credit before you can use the API.
> You can add credit here: [https://platform.openai.com/account/billing/overview](https://platform.openai.com/account/billing/overview)

---

#### 🔧 How to enter your API key in the extension:

1. Click the extension icon in your browser toolbar to open the popup.
2. Click the ⚙️ **gear icon** to open settings.
3. Paste your **OpenAI API key** into the input field and save.

> ⚠️ The extension uses `gpt-4.1-nano`, which is very cost-efficient.
> Still, usage **does cost money**. Set a spending limit in your [billing settings](https://platform.openai.com/account/billing/limits) to stay in control.

---

This layout:

* Makes it clear that **API key setup is required no matter how it's installed**.
* Keeps repeated instructions DRY.
* Adds helpful callouts and links.

---

## 🧑‍🏫 How to Use

1. Navigate to any webpage.
2. Underlined words suggest potential comprehension challenges.
3. Click a word to view a short AI-generated explanation.
4. Use the popup to:

   * Toggle the helper on/off
   * Choose a background overlay tint and intensity
   * Switch fonts or adjust spacing
   * Enable bionic reading
   * Access AI tools (if API key is set)
5. All settings are saved automatically.

---

## 🔐 Security & Privacy

* Your OpenAI API key is stored securely using `chrome.storage.sync`.
* No tracking, analytics, or remote storage is used.
* View all privacy details in the [Security & Privacy section](./security.html).

---

## 🔧 Developer Notes

* Uses **Manifest V3** with a background-less design (no service worker needed).
* Fonts (`OpenDyslexic`, `Lexend Deca`) are embedded and loaded locally.
* Caching layers for AI definitions:

  1. In-memory `Map` (per session)
  2. Persistent `IndexedDB` (per word × sentence)
  3. OpenAI API (fallback only)
* Logic is cleanly split across `content/`, `popup/`, and `options.js`.

---

## 📸 Preview

| Feature                   | Screenshot                                                   |
| ------------------------- | ------------------------------------------------------------ |
| **Word Explainer**        | ![Word Explainer](docs/Word%20Explainer.png)                 |
| **Ask AI**                | ![Ask AI](docs/Ask%20AI.png)                                 |
| **AI Tools Panel**        | ![AI Tools](docs/AI%20Tools.png)                             |
| **Bionic Reading**        | ![Bionic Reading](docs/Bionic%20Reading.png)                 |
| **Lexend Font**           | ![Lexend Font](docs/Lexend%20Font.png)                       |
| **OpenDyslexic Font**     | ![OpenDyslexic Font](docs/OpenDyslexic%20Font.png)           |
| **Tint Overlay Settings** | ![Tint Overlay Settings](docs/Tint%20overlay%20Settings.png) |
| **Typography Settings**   | ![Typography Settings](docs/Typography%20Settings.png)       |

> Images are stored in `/docs/`.

---

## 🗓️ Agenda

### Immediate Tasks

* Think about a better name for the extension.

### Future Plans

* Color picker for **Tint Overlay**.
* Per-page custom preferences.
* **Word Guesser**: Type a word as you think it’s spelled and the AI suggests the correct one.
* One-click rewrite: Fix grammar and spelling without changing the intended meaning.

---

## 📝 Changelog

### v0.3.1

* Fix: Emojis are no longer bolded in Bionic Reading mode.
* Fix: Bionic Reading now correctly applies to all words.
* Feature: Added validation check for the OpenAI API key on entry.
* Fix: Resolved interaction issues between Bionic Reading and Word Explainer.

---

## 🙏 Credits

Crafted with ✨hyperfocus and procrastination✨
by **Sam van Remortel**

* Typeface: [OpenDyslexic](https://opendyslexic.org/), [Lexend](https://www.lexend.com/)
* API: [OpenAI](https://platform.openai.com/)


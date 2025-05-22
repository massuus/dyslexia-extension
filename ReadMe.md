# Dyslexia-NLP Extension

A Chrome browser extension that helps users with dyslexia by **explaining difficult words using AI-powered definitions** based on their context within a sentence. This improves comprehension and makes reading more accessible.

Made by: Sam van Remortel
---

## ✨ Features

* ✅ **Click-to-Explain**: Tap on underlined complex words to see a short, contextual explanation.
* 🧠 **AI-powered NLP**: Uses OpenAI's language model to generate brief definitions based on sentence context.
* ⚡ **Real-time Tooltip**: Instant feedback with tooltips that appear directly next to the word.
* 💾 **Smart Caching**: Previously explained words are remembered to save time and reduce API usage.

---

## 📦 Installation

1. **Clone or download** this repository.
2. Open **Chrome** and go to `chrome://extensions`.
3. Enable **Developer Mode** (toggle in the top-right).
4. Click **"Load unpacked"** and select the folder containing this project.

---

## 🧑‍🏫 Usage

1. Visit any webpage after installing the extension.
2. The extension automatically underlines complex words (words not in the common words list).
3. **Click** on an underlined word to get an explanation tooltip generated using OpenAI.

---

## 🛠 Configuration

* Replace the placeholder in `content.js` with your actual OpenAI API key:

  ```js
  const OPENAI_KEY = "YOUR_OPENAI_API_KEY_HERE";
  ```

> ⚠️ **Never share your API key in public repositories.** 

---

## 🙋 FAQ

**Q: What words get tooltips?**
A: Words that aren’t in the top 100 common English words list.

**Q: Can I add custom words?**
A: You can edit the `COMMON_WORDS` list in `common-words.js` to fine-tune which words are skipped.


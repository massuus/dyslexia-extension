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

2. Create a file called `secret.js` in the root folder of the extension with the following content:

   ```js
   const OPENAI_KEY = "your_openai_api_key_here";
   ```

3. Make sure `secret.js` is listed in `.gitignore` (it already is).

4. Open **Chrome** and go to `chrome://extensions`.

5. Enable **Developer Mode** (toggle in the top-right).

6. Click **"Load unpacked"** and select the folder containing this project.

---

## 🧑‍🏫 Usage

1. Visit any webpage after installing the extension.
2. The extension automatically underlines complex words (words not in the common words list).
3. **Click** on an underlined word to get an explanation tooltip generated using OpenAI.

---

## 🛠 Configuration

* Do **not** hardcode the API key into `content.js`.
* Instead, use the included `secret.js` mechanism to securely keep your key out of version control.
* Optionally, copy `secret.example.js` and rename it to `secret.js` to get started quickly.

> ⚠️ **Never commit your OpenAI API key to GitHub or any public repository.**

---

## 🙋 FAQ

**Q: What words get tooltips?**
A: Words that are longer and not in the top 100 most common English words list.

**Q: Can I add custom words?**
A: Yes, edit the `COMMON_WORDS` list in `common-words.js` to control which words are skipped.

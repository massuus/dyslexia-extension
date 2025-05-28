# Dyslexia Extension

A Chrome extension to help dyslexic readers on any webpage.

---

## Design Challenge Statement

Design a **browser extension** that empowers **dyslexic readers** in a **webpage reading context** to **seamlessly understand unfamiliar vocabulary** and **retrieve answers to their questions** with **minimal disruption** to their reading flow.

---

## System Architecture Overview

The extension comprises two primary user-facing features—“Click-to-Explain” and “Ask AI”—supported by DOM manipulation, lazy-loading text processing, client-side embeddings storage, and interactions with OpenAI’s APIs.

![NLP diagram](./docs/NLP.drawio.svg)

---

## 1. Click-to-Explain Feature

1. **Activation & Wrapping**  
   - An `IntersectionObserver` watches paragraphs, list items, and headings within a 500 px root margin.  
   - During idle periods (`requestIdleCallback`), text nodes are split on words ≥ 8 letters and wrapped in `<span class="df-word">` if `isDifficult(word)` returns true.  
   - A `MutationObserver` handles dynamically added content.

2. **Click Handling & Caching**  
   - A global click listener intercepts clicks on `.df-word` spans.  
   - On click:  
     1. Build a cache key from the word + its sentence.  
     2. Check in-memory `defs` Map.  
     3. Fallback to IndexedDB (`idbGet`).  
     4. If missing, call `fetchDefinition()` which:  
        - Prompts `In context of "<sentence>", explain "<word>" in ≤15 words.`  
        - Uses OpenAI Chat Completion (`gpt-4.1-nano`, temp 0.2, max_tokens 60).  
     5. Store the definition in-memory and in IndexedDB (`idbPut`).  
   - Render the explanation in a tooltip (`.df-tooltip-text`) with a close button.

---

## 2. Ask AI (Page Q&A) Feature

1. **Widget Initialization**  
   - `createQAWidget()` appends a fixed-position UI with a textarea, “Ask AI” button, and output area.

2. **Page Embedding & Storage**  
   - On first use (or if no embeddings):  
     - Scrape visible text nodes.  
     - Split into ~400-token chunks using LangChain’s `RecursiveCharacterTextSplitter`.  
     - Embed chunks via `embedBatch()` (`text-embedding-3-small`).  
     - Store `{ url, idx, text, vec }` in IndexedDB (`pageEmbeds`).

3. **Question Processing**  
   - On submit:  
     1. Embed the query with `embedBatch()`.  
     2. Load stored embeddings (`getEmbeds()`).  
     3. Compute cosine similarity in JS, retrieve top-K chunks.  
     4. Build a RetrievalQA prompt restricted to those contexts.  
     5. Send to OpenAI Chat Completion and display the answer or a “not found” message.

4. **UI & Theming**  
   - Uses CSS custom properties for light/dark themes.  
   - Widget can be closed and reopened without reload.

---

### Video Demo

📹 [Watch a demo screencast](https://imagekit.io/player/embed/massuus/Recording%202025-05-28%20120239%20%281%29.mp4)

---

### Code

[![GitHub Repo](https://img.shields.io/badge/GitHub-massuus%2Fdyslexia--extension-blue?logo=github)](https://github.com/massuus/dyslexia-extension)

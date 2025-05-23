window.createQAWidget = function () {
  if (document.getElementById("df-qa-widget")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "df-qa-widget";
  wrapper.innerHTML = `
    <style>
      :root {
        --c-bg: #f9fafb;
        --c-card: #ffffff;
        --c-text: #111827;
        --c-accent: #2563eb;
        --c-border: #e5e7eb;
        --radius: 14px;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --c-bg: #111827;
          --c-card: #1f2937;
          --c-text: #f3f4f6;
          --c-border: #374151;
        }
      }

      #df-qa-widget {
        all: initial;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        z-index: 2147483647;
      }

      .df-qa-card {
        background: var(--c-card);
        color: var(--c-text);
        border: 1px solid var(--c-border);
        border-radius: var(--radius);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        display: flex;
        flex-direction: column;
        padding: 18px 20px 22px;
        gap: 12px;
      }

      .df-qa-title {
        font-size: 15px;
        font-weight: 600;
        margin: 0;
        color: var(--c-text);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .df-qa-question {
        resize: vertical;
        width: 100%;
        font-size: 13px;
        font-family: inherit;
        padding: 8px;
        border-radius: var(--radius);
        border: 1px solid var(--c-border);
        background: var(--c-bg);
        color: var(--c-text);
        box-sizing: border-box;
      }

      .df-qa-btn {
        width: 100%;
        padding: 10px 12px;
        font-size: 13px;
        font-weight: 500;
        color: var(--c-text);
        background: var(--c-bg);
        border: 1px solid var(--c-border);
        border-radius: var(--radius);
        cursor: pointer;
        transition: background 0.2s, border 0.2s;
      }

      .df-qa-btn:hover {
        background: var(--c-accent);
        color: white;
        border-color: var(--c-accent);
      }

      .df-qa-output {
        font-size: 13px;
        background: var(--c-bg);
        padding: 10px;
        border-radius: var(--radius);
        white-space: pre-wrap;
        max-height: 180px;
        overflow-y: auto;
        border: 1px solid var(--c-border);
        display: none;
        color: var(--c-text);
      }

      .df-qa-close {
        position: absolute;
        top: 6px;
        right: 10px;
        background: none;
        border: none;
        font-size: 16px;
        color: var(--c-text);
        cursor: pointer;
        font-weight: bold;
      }
    </style>

    <div class="df-qa-card">
      <button class="df-qa-close" title="Close">&times;</button>
      <div class="df-qa-title">Ask a question</div>
      <textarea class="df-qa-question" rows="3" placeholder="e.g. Summarize this page"></textarea>
      <button class="df-qa-btn">Ask AI</button>
      <div class="df-qa-output" id="df-qa-output"></div>
    </div>
  `;

  document.body.appendChild(wrapper);

  const box = wrapper.querySelector(".df-qa-question");
  const output = wrapper.querySelector("#df-qa-output");
  const send = wrapper.querySelector(".df-qa-btn");
  const close = wrapper.querySelector(".df-qa-close");

  send.onclick = async () => {
  const question = box.value.trim();
  if (!question) return;

  output.style.display = "block";

  const url = location.href;
  const embedded = await hasEmbeds(url);

  if (!embedded) {
    output.textContent = "🔍 Reading page, this will take a sec...";
    try {
      await ensurePageEmbedded();
    } catch (e) {
      output.textContent = "⚠️ Failed to read the page. Try refreshing.";
      return;
    }
  }

  output.textContent = "🧠 Thinking...";
  const answer = await answerQuestion(question);
  output.textContent = answer;
};
  close.onclick = () => wrapper.remove();
};

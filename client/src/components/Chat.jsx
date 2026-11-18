import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { postJSON } from "../lib/api";
import useAsync from "../lib/useAsync";

const SUGGESTIONS = [
  "Summarize this lecture in 5 bullet points",
  "What are the hardest concepts here?",
  "Explain the main topic like I'm a beginner",
  "What should I revise before an exam?",
];

export default function Chat({ lecture, onUpdate }) {
  const messages = lecture.chat || [];
  const [input, setInput] = useState("");
  const { loading, error, run } = useAsync();
  const listRef = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  function send(text) {
    const question = text.trim();
    if (!question || loading) return;

    const next = [...messages, { role: "user", text: question }];
    onUpdate({ chat: next });
    setInput("");

    run(async () => {
      const data = await postJSON("/api/chat", {
        transcript: lecture.transcript,
        messages: next,
      });
      onUpdate({ chat: [...next, { role: "model", text: data.reply }] });
    });
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div>
      {messages.length > 0 && (
        <div className="panel-toolbar">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onUpdate({ chat: [] })}
            disabled={loading}
          >
            Clear chat
          </button>
        </div>
      )}

      <div className="chat">
        <div className="chat-messages" ref={listRef}>
          {messages.length === 0 && !loading && (
            <div className="chat-intro">
              <div className="empty-icon">💬</div>
              <h2>Ask anything about this lecture</h2>
              <p className="muted">
                Answers come from the lecture itself, so you get what was actually taught.
              </p>
              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="msg user">
                {m.text}
              </div>
            ) : (
              <div key={i} className="msg model">
                <div className="markdown">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              </div>
            )
          )}

          {loading && (
            <div className="msg model typing">
              <span />
              <span />
              <span />
            </div>
          )}
          {error && <p className="error">{error}</p>}
        </div>

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question about the lecture…"
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
      <p className="hint">Enter to send · Shift + Enter for a new line</p>
    </div>
  );
}

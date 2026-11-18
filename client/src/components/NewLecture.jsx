import { useState } from "react";
import { postJSON, uploadFile } from "../lib/api";
import { formatSize } from "../lib/utils";

const FEATURES = [
  { icon: "📝", title: "Smart notes", text: "Structured summary with key terms and takeaways." },
  { icon: "🃏", title: "Flashcards", text: "Flip-through cards for quick revision." },
  { icon: "🎯", title: "Quiz", text: "Multiple choice with explanations and scoring." },
  { icon: "💬", title: "Chat", text: "Ask questions answered from the lecture itself." },
];

export default function NewLecture({ onCreated }) {
  const [mode, setMode] = useState("youtube");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  function switchMode(next) {
    setMode(next);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data =
        mode === "youtube"
          ? await postJSON("/api/transcript", { url })
          : await uploadFile("/api/transcribe", "audio", file);
      onCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="new">
      <span className="eyebrow">AI study companion</span>
      <h1>
        Turn any lecture into <em>notes, flashcards &amp; quizzes.</em>
      </h1>
      <p className="new-sub">
        Paste a YouTube link or upload a recording. LectureLens reads the whole lecture and
        builds your study kit in seconds.
      </p>

      <div className="input-card">
        <div className="segmented">
          <button
            type="button"
            className={mode === "youtube" ? "on" : ""}
            onClick={() => switchMode("youtube")}
          >
            ▶ YouTube link
          </button>
          <button
            type="button"
            className={mode === "upload" ? "on" : ""}
            onClick={() => switchMode("upload")}
          >
            ⬆ Upload recording
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "youtube" ? (
            <div className="url-row">
              <input
                className="text-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                autoFocus
              />
              <button className="btn btn-primary" type="submit" disabled={loading || !url.trim()}>
                {loading ? (
                  <>
                    <span className="spinner" /> Fetching…
                  </>
                ) : (
                  "Get started →"
                )}
              </button>
            </div>
          ) : (
            <>
              <label
                className={`dropzone ${dragging ? "dragging" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const dropped = e.dataTransfer.files[0];
                  if (dropped) setFile(dropped);
                }}
              >
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
                <span className="dropzone-icon">🎙️</span>
                {file ? (
                  <>
                    <strong>{file.name}</strong>
                    <span>{formatSize(file.size)} · click to change</span>
                  </>
                ) : (
                  <>
                    <strong>Drop an audio or video file here</strong>
                    <span>or click to browse · MP3, M4A, WAV, MP4 · up to 500 MB</span>
                  </>
                )}
              </label>
              <button className="btn btn-primary btn-block" type="submit" disabled={loading || !file}>
                {loading ? (
                  <>
                    <span className="spinner" /> Transcribing… long recordings take a few minutes
                  </>
                ) : (
                  "Transcribe & continue →"
                )}
              </button>
            </>
          )}
        </form>

        {error && <p className="error">{error}</p>}
        {mode === "youtube" && !error && (
          <p className="hint">Works with any video that has captions (look for the CC button).</p>
        )}
      </div>

      <div className="features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature">
            <span>{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

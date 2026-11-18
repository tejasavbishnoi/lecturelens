import { useState } from "react";
import { postJSON, uploadFile } from "../lib/api";
import { formatSize } from "../lib/utils";
import useRotating from "../lib/useRotating";
import { EXAMPLES } from "../config";
import HeroPreview from "./HeroPreview";
import Footer from "./Footer";

const FEATURES = [
  { icon: "📝", title: "Smart notes", text: "Structured summary with key terms and takeaways." },
  { icon: "🃏", title: "Flashcards", text: "Flip-through cards for quick revision." },
  { icon: "🎯", title: "Quiz", text: "Multiple choice with explanations and scoring." },
  { icon: "💬", title: "Chat", text: "Ask questions answered from the lecture itself." },
];

const YOUTUBE_STEPS = ["Finding the video…", "Fetching captions…", "Cleaning up the transcript…"];
const UPLOAD_STEPS = [
  "Uploading your recording…",
  "Gemini is listening…",
  "Transcribing every word…",
  "Almost there…",
];

export default function NewLecture({ onCreated }) {
  const [mode, setMode] = useState("youtube");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const step = useRotating(mode === "youtube" ? YOUTUBE_STEPS : UPLOAD_STEPS, loading, 2600);

  function switchMode(next) {
    setMode(next);
    setError("");
  }

  async function start(job) {
    setError("");
    setLoading(true);
    try {
      onCreated(await job());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (mode === "youtube") start(() => postJSON("/api/transcript", { url }));
    else start(() => uploadFile("/api/transcribe", "audio", file));
  }

  function tryExample(example) {
    const exampleUrl = `https://www.youtube.com/watch?v=${example.id}`;
    setMode("youtube");
    setUrl(exampleUrl);
    start(() => postJSON("/api/transcript", { url: exampleUrl }));
  }

  return (
    <div className="new">
      <div className="hero">
        <div>
          <span className="eyebrow">AI study companion</span>
          <h1>
            Turn any lecture into <em>notes, flashcards &amp; quizzes.</em>
          </h1>
          <p className="new-sub">
            Paste a YouTube link or upload a recording. LectureLens reads the whole lecture and
            builds your study kit in seconds.
          </p>
        </div>
        <HeroPreview />
      </div>

      <div className="input-card">
        <div className="segmented" role="group" aria-label="Lecture source">
          <button
            type="button"
            className={mode === "youtube" ? "on" : ""}
            aria-pressed={mode === "youtube"}
            onClick={() => switchMode("youtube")}
          >
            ▶ YouTube link
          </button>
          <button
            type="button"
            className={mode === "upload" ? "on" : ""}
            aria-pressed={mode === "upload"}
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
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                aria-label="YouTube link"
                autoFocus
              />
              <button className="btn btn-primary" type="submit" disabled={loading || !url.trim()}>
                {loading ? "Working…" : "Get started →"}
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
                  className="sr-only"
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
                <span className="dropzone-icon" aria-hidden="true">
                  🎙️
                </span>
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
                {loading ? "Working…" : "Transcribe & continue →"}
              </button>
            </>
          )}
        </form>

        {loading && (
          <p className="loading-line" role="status">
            <span className="spinner" aria-hidden="true" />
            <span key={step} className="loading-text">
              {step}
            </span>
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {mode === "youtube" && !error && !loading && (
          <p className="hint">Works with any video that has captions (look for the CC button).</p>
        )}
      </div>

      <div className="examples">
        <p className="examples-label">No link handy? Try an example:</p>
        <div className="example-list">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              className="example"
              onClick={() => tryExample(ex)}
              disabled={loading}
            >
              <img src={`https://i.ytimg.com/vi/${ex.id}/mqdefault.jpg`} alt="" />
              <span>
                <strong>{ex.title}</strong>
                <small>{ex.channel}</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature">
            <span aria-hidden="true">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
}

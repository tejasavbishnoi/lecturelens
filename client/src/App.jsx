import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function App() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);

  // Step 2: fetch the transcript from YouTube
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTranscript("");
    setNotes("");

    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTranscript(data.text);
      setWordCount(data.wordCount);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Step 3: send the transcript to the AI for notes
  async function handleNotes() {
    setNotesLoading(true);
    setError("");

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotes(data.notes);
    } catch (err) {
      setError(err.message);
    } finally {
      setNotesLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: 20 }}>
      <h1>LectureLens</h1>
      <p>Paste a YouTube lecture link to get started.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          style={{ flex: 1, padding: 10 }}
        />
        <button type="submit" disabled={loading || !url}>
          {loading ? "Fetching..." : "Get transcript"}
        </button>
      </form>

      {error && <p style={{ color: "tomato" }}>{error}</p>}

      {transcript && (
        <div style={{ marginTop: 24, textAlign: "left" }}>
          <details>
            <summary style={{ cursor: "pointer" }}>
              Transcript ({wordCount} words)
            </summary>
            <p style={{ lineHeight: 1.6, maxHeight: 300, overflowY: "auto" }}>
              {transcript}
            </p>
          </details>

          <button
            onClick={handleNotes}
            disabled={notesLoading}
            style={{ marginTop: 16 }}
          >
            {notesLoading ? "Generating notes..." : "✨ Generate notes"}
          </button>

          {notes && (
            <div style={{ marginTop: 24, lineHeight: 1.7 }}>
              <ReactMarkdown>{notes}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
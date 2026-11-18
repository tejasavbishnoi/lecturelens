import { useState } from "react";

export default function App() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTranscript("");

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
        <div style={{ marginTop: 24 }}>
          <h3>Transcript ({wordCount} words)</h3>
          <p style={{ lineHeight: 1.6, maxHeight: 400, overflowY: "auto", textAlign: "left" }}>
            {transcript}
          </p>
        </div>
      )}
    </div>
  );
}
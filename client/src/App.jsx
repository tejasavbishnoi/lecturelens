import { useState } from "react";
import ReactMarkdown from "react-markdown";
import Flashcards from "./components/Flashcards";

export default function App() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [notes, setNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);

  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);

  // Small helper so every AI call works the same way
  async function postJSON(path, body) {
    let res;
    try {
      res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error("Can't reach the server. Is it running?");
    }

    const text = await res.text();
    if (!text) throw new Error("Server sent an empty response. Check the server terminal.");

    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  // Step 2: transcript
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTranscript("");
    setNotes("");
    setCards([]);

    try {
      const data = await postJSON("/api/transcript", { url });
      setTranscript(data.text);
      setWordCount(data.wordCount);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Step 3: notes
  async function handleNotes() {
    setNotesLoading(true);
    setError("");
    try {
      const data = await postJSON("/api/notes", { transcript });
      setNotes(data.notes);
    } catch (err) {
      setError(err.message);
    } finally {
      setNotesLoading(false);
    }
  }

  // Step 4: flashcards
  async function handleFlashcards() {
    setCardsLoading(true);
    setError("");
    try {
      const data = await postJSON("/api/flashcards", { transcript });
      setCards(data.cards);
    } catch (err) {
      setError(err.message);
    } finally {
      setCardsLoading(false);
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

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={handleNotes} disabled={notesLoading}>
              {notesLoading ? "Generating notes..." : "✨ Generate notes"}
            </button>
            <button onClick={handleFlashcards} disabled={cardsLoading}>
              {cardsLoading ? "Making flashcards..." : "🃏 Make flashcards"}
            </button>
          </div>

          {cards.length > 0 && (
            <section style={{ marginTop: 32 }}>
              <h2>Flashcards</h2>
              <Flashcards cards={cards} />
            </section>
          )}

          {notes && (
            <section style={{ marginTop: 32, lineHeight: 1.7 }}>
              <h2>Notes</h2>
              <ReactMarkdown>{notes}</ReactMarkdown>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
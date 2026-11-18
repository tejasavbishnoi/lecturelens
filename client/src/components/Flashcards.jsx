import { useEffect, useState } from "react";
import { postJSON } from "../lib/api";
import useAsync from "../lib/useAsync";
import GeneratePrompt from "./GeneratePrompt";
import "./Flashcards.css";

export default function Flashcards({ lecture, onUpdate, active }) {
  const { loading, error, run } = useAsync();
  const cards = lecture.cards || [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const generate = () =>
    run(async () => {
      const data = await postJSON("/api/flashcards", { transcript: lecture.transcript });
      onUpdate({ cards: data.cards });
      setIndex(0);
      setFlipped(false);
    });

  function go(step) {
    setFlipped(false);
    setIndex((i) => (i + step + cards.length) % cards.length);
  }

  function shuffle() {
    const s = [...cards];
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [s[i], s[j]] = [s[j], s[i]];
    }
    onUpdate({ cards: s });
    setIndex(0);
    setFlipped(false);
  }

  // Keyboard: ← → to move, Space to flip (only while this tab is open)
  useEffect(() => {
    if (!active || cards.length === 0) return;
    function onKey(e) {
      if (["INPUT", "TEXTAREA", "BUTTON"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (cards.length === 0) {
    return (
      <GeneratePrompt
        icon="🃏"
        title="Flashcards"
        text="Question-and-answer cards for the key ideas in this lecture."
        action="🃏 Make flashcards"
        loading={loading}
        loadingText="Making flashcards…"
        error={error}
        onClick={generate}
      />
    );
  }

  const current = Math.min(index, cards.length - 1);
  const card = cards[current];

  return (
    <div className="fc">
      <div className="fc-top">
        <span>
          Card {current + 1} of {cards.length}
        </span>
        <div className="fc-actions">
          <button className="btn btn-ghost btn-sm" onClick={shuffle}>
            ⤮ Shuffle
          </button>
          <button className="btn btn-ghost btn-sm" onClick={generate} disabled={loading}>
            {loading ? "Making…" : "↻ New set"}
          </button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      {/* key={current} makes each new card start face-up without a flip animation */}
      <div
        key={current}
        className={`fc-card ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className="fc-inner">
          <div className="fc-face fc-front">
            <span className="fc-label">Question</span>
            <p>{card.front}</p>
          </div>
          <div className="fc-face fc-back">
            <span className="fc-label">Answer</span>
            <p>{card.back}</p>
          </div>
        </div>
      </div>

      <div className="fc-controls">
        <button className="btn btn-ghost" onClick={() => go(-1)}>
          ← Prev
        </button>
        <div className="fc-dots">
          {cards.map((_, i) => (
            <button
              key={i}
              className={i === current ? "on" : ""}
              aria-label={`Card ${i + 1}`}
              onClick={() => {
                setIndex(i);
                setFlipped(false);
              }}
            />
          ))}
        </div>
        <button className="btn btn-ghost" onClick={() => go(1)}>
          Next →
        </button>
      </div>
      <p className="fc-hint">
        Click the card or press <kbd>Space</kbd> to flip · <kbd>←</kbd> <kbd>→</kbd> to move
      </p>
    </div>
  );
}

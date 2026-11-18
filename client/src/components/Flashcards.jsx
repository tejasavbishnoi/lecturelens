import { useState } from "react";
import "./Flashcards.css";

export default function Flashcards({ cards }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];

  function go(step) {
    setFlipped(false);
    setIndex((i) => (i + step + cards.length) % cards.length);
  }

  return (
    <div className="flashcards">
      <div
        className={`card ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="card-inner">
          <div className="card-face card-front">
            <span className="label">Question</span>
            <p>{card.front}</p>
          </div>
          <div className="card-face card-back">
            <span className="label">Answer</span>
            <p>{card.back}</p>
          </div>
        </div>
      </div>

      <div className="controls">
        <button onClick={() => go(-1)}>← Prev</button>
        <span>
          {index + 1} / {cards.length}
        </span>
        <button onClick={() => go(1)}>Next →</button>
      </div>
      <p className="hint">Click the card to flip it</p>
    </div>
  );
}
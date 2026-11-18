// Small looping animation on the home screen: notes writing themselves + a flashcard flipping
const LINES = [
  { w: "92%", d: "0.3s" },
  { w: "84%", d: "0.6s" },
  { w: "88%", d: "0.9s" },
  { w: "55%", d: "1.2s" },
];
const LINES_2 = [
  { w: "90%", d: "1.8s" },
  { w: "70%", d: "2.1s" },
];

export default function HeroPreview() {
  return (
    <div className="preview" aria-hidden="true">
      <div className="preview-window">
        <div className="preview-bar">
          <span />
          <span />
          <span />
        </div>
        <div className="preview-tabs">
          <span className="on">📝 Notes</span>
          <span>🃏 Cards</span>
          <span>🎯 Quiz</span>
        </div>
        <div className="preview-notes">
          <div className="pv-h" />
          {LINES.map((l, i) => (
            <div key={i} className="pv-l" style={{ "--w": l.w, "--d": l.d }} />
          ))}
          <div className="pv-l sub" style={{ "--w": "40%", "--d": "1.5s" }} />
          {LINES_2.map((l, i) => (
            <div key={`b${i}`} className="pv-l" style={{ "--w": l.w, "--d": l.d }} />
          ))}
        </div>
      </div>

      <div className="preview-card">
        <div className="preview-card-inner">
          <div className="pc-face pc-front">
            <small>Question</small>
            <p>What does a neuron&apos;s activation represent?</p>
          </div>
          <div className="pc-face pc-back">
            <small>Answer</small>
            <p>How strongly the neuron responds to its input, a number between 0 and 1.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

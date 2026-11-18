import { useState } from "react";
import { postJSON } from "../lib/api";
import useAsync from "../lib/useAsync";
import { confetti } from "../lib/confetti";
import GeneratePrompt from "./GeneratePrompt";
import LoadingState from "./LoadingState";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const STEPS = [
  "Reading the lecture…",
  "Choosing what to test…",
  "Writing tricky options…",
  "Adding explanations…",
];

export default function Quiz({ lecture, onUpdate }) {
  const { loading, error, run } = useAsync();
  const questions = lecture.quiz || [];
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]); // chosen option index for each question
  const [finished, setFinished] = useState(false);

  function restart() {
    setCurrent(0);
    setAnswers([]);
    setFinished(false);
  }

  const generate = () =>
    run(async () => {
      const data = await postJSON("/api/quiz", { transcript: lecture.transcript });
      onUpdate({ quiz: data.questions, quizBest: null });
      restart();
    });

  if (loading) return <LoadingState messages={STEPS} variant="quiz" />;

  if (questions.length === 0) {
    return (
      <GeneratePrompt
        icon="🎯"
        title="Test yourself"
        text="10 multiple-choice questions with explanations, built from this lecture."
        action="🎯 Start a quiz"
        error={error}
        onClick={generate}
      />
    );
  }

  const score = answers.filter((a, i) => a === questions[i]?.answerIndex).length;

  // ---------- Results screen ----------
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const message =
      pct === 100
        ? "Perfect score! 🏆"
        : pct >= 80
          ? "Great work!"
          : pct >= 50
            ? "Good effort. Review the misses below."
            : "Worth another look at the notes.";

    return (
      <div className="quiz">
        <div className="result">
          <div
            className="score-ring"
            style={{ "--pct": pct }}
            role="img"
            aria-label={`Score ${score} out of ${questions.length}`}
          >
            <div>
              {score}/{questions.length}
            </div>
          </div>
          <h2>{message}</h2>
          <p className="muted">
            You scored {pct}%
            {lecture.quizBest != null && ` · Best: ${lecture.quizBest}/${questions.length}`}
          </p>
          <div className="result-actions">
            <button className="btn btn-ghost" onClick={restart}>
              ↻ Retry this quiz
            </button>
            <button className="btn btn-primary" onClick={generate}>
              New questions
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="review">
          {questions.map((q, i) => {
            const right = answers[i] === q.answerIndex;
            return (
              <div key={i} className={`review-item ${right ? "" : "missed"}`}>
                <p className="review-q">
                  {i + 1}. {q.question}
                </p>
                {!right && <p className="muted">Your answer: {q.options[answers[i]] ?? "—"}</p>}
                <p>✓ {q.options[q.answerIndex]}</p>
                <p className="muted">{q.explanation}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- Question screen ----------
  const q = questions[current];
  const chosen = answers[current];
  const answered = chosen !== undefined;

  function choose(i) {
    if (answered) return;
    setAnswers((a) => {
      const next = [...a];
      next[current] = i;
      return next;
    });
  }

  function next() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      return;
    }
    setFinished(true);
    if (score === questions.length) confetti();
    if (lecture.quizBest == null || score > lecture.quizBest) onUpdate({ quizBest: score });
  }

  const progress = ((current + (answered ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="quiz">
      <div className="quiz-top">
        <span>
          Question {current + 1} of {questions.length}
        </span>
        <span>Score: {score}</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <h2 className="quiz-question" key={current}>
        {q.question}
      </h2>

      <div className="options">
        {q.options.map((opt, i) => {
          let cls = "option";
          if (answered) {
            if (i === q.answerIndex) cls += " correct";
            else if (i === chosen) cls += " wrong";
            else cls += " dim";
          }
          return (
            <button key={i} className={cls} onClick={() => choose(i)} disabled={answered}>
              <span className="option-letter" aria-hidden="true">
                {LETTERS[i]}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`explain ${chosen === q.answerIndex ? "good" : "bad"}`} role="status">
          <strong>{chosen === q.answerIndex ? "✓ Correct" : "✗ Not quite"}</strong>
          <p>{q.explanation}</p>
        </div>
      )}

      <div className="quiz-actions">
        <button className="btn btn-primary" onClick={next} disabled={!answered}>
          {current < questions.length - 1 ? "Next question →" : "See results"}
        </button>
      </div>
    </div>
  );
}

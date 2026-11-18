import { useEffect, useState } from "react";
import NotesPanel from "./NotesPanel";
import Flashcards from "./Flashcards";
import Quiz from "./Quiz";
import Chat from "./Chat";
import TranscriptPanel from "./TranscriptPanel";
import { formatMinutes, isTyping } from "../lib/utils";

const TABS = [
  { id: "notes", label: "Notes", icon: "📝" },
  { id: "flashcards", label: "Flashcards", icon: "🃏" },
  { id: "quiz", label: "Quiz", icon: "🎯" },
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "transcript", label: "Transcript", icon: "📄" },
];

export default function LectureView({ lecture, onUpdate }) {
  const [tab, setTab] = useState("notes");

  // Keys 1-5 switch tabs
  useEffect(() => {
    function onKey(e) {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector(".modal")) return;
      const n = Number(e.key);
      if (n >= 1 && n <= TABS.length) setTab(TABS[n - 1].id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ready = {
    notes: Boolean(lecture.notes),
    flashcards: Boolean(lecture.cards?.length),
    quiz: Boolean(lecture.quiz?.length),
    chat: Boolean(lecture.chat?.length),
  };

  // People speak ~150 words per minute, so this estimates the lecture length
  const minutes = Math.max(1, Math.round(lecture.wordCount / 150));
  const meta = [
    lecture.author,
    `${lecture.wordCount.toLocaleString()} words`,
    `≈ ${formatMinutes(minutes)} of speech`,
  ]
    .filter(Boolean)
    .join(" · ");

  function panel(id, content) {
    return (
      <div
        role="tabpanel"
        id={`panel-${id}`}
        aria-labelledby={`tab-${id}`}
        className="tab-panel"
        hidden={tab !== id}
      >
        {content}
      </div>
    );
  }

  return (
    <div className="lecture">
      <header className="lecture-header">
        {lecture.thumbnail ? (
          <a
            className="lecture-thumb"
            href={`https://www.youtube.com/watch?v=${lecture.videoId}`}
            target="_blank"
            rel="noreferrer"
            title="Watch on YouTube"
          >
            <img src={lecture.thumbnail} alt={`Thumbnail for ${lecture.title}`} />
            <span className="play" aria-hidden="true">
              ▶
            </span>
          </a>
        ) : (
          <div className="lecture-icon" aria-hidden="true">
            🎙️
          </div>
        )}
        <div className="lecture-info">
          <span className="eyebrow">
            {lecture.source === "youtube" ? "YouTube lecture" : "Uploaded recording"}
          </span>
          <h1>{lecture.title}</h1>
          <p className="muted">{meta}</p>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Study tools">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            className={`tab ${tab === t.id ? "on" : ""}`}
            onClick={() => setTab(t.id)}
            title={`${t.label} (${i + 1})`}
          >
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
            {ready[t.id] && <span className="dot" aria-label="ready" />}
          </button>
        ))}
      </nav>

      {/* All panels stay mounted so a running generation isn't lost when you switch tabs */}
      {panel("notes", <NotesPanel lecture={lecture} onUpdate={onUpdate} active={tab === "notes"} />)}
      {panel(
        "flashcards",
        <Flashcards lecture={lecture} onUpdate={onUpdate} active={tab === "flashcards"} />
      )}
      {panel("quiz", <Quiz lecture={lecture} onUpdate={onUpdate} />)}
      {panel("chat", <Chat lecture={lecture} onUpdate={onUpdate} />)}
      {panel("transcript", <TranscriptPanel lecture={lecture} />)}
    </div>
  );
}

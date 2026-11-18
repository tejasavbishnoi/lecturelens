import { useState } from "react";
import NotesPanel from "./NotesPanel";
import Flashcards from "./Flashcards";
import Quiz from "./Quiz";
import Chat from "./Chat";
import TranscriptPanel from "./TranscriptPanel";
import { formatMinutes } from "../lib/utils";

const TABS = [
  { id: "notes", label: "Notes", icon: "📝" },
  { id: "flashcards", label: "Flashcards", icon: "🃏" },
  { id: "quiz", label: "Quiz", icon: "🎯" },
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "transcript", label: "Transcript", icon: "📄" },
];

export default function LectureView({ lecture, onUpdate }) {
  const [tab, setTab] = useState("notes");

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
            <img src={lecture.thumbnail} alt="" />
            <span className="play">▶</span>
          </a>
        ) : (
          <div className="lecture-icon">🎙️</div>
        )}
        <div className="lecture-info">
          <span className="eyebrow">
            {lecture.source === "youtube" ? "YouTube lecture" : "Uploaded recording"}
          </span>
          <h1>{lecture.title}</h1>
          <p className="muted">{meta}</p>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span>
            {t.label}
            {ready[t.id] && <span className="dot" title="Ready" />}
          </button>
        ))}
      </nav>

      {/* All panels stay mounted so a running generation isn't lost when you switch tabs */}
      <div hidden={tab !== "notes"}>
        <NotesPanel lecture={lecture} onUpdate={onUpdate} />
      </div>
      <div hidden={tab !== "flashcards"}>
        <Flashcards lecture={lecture} onUpdate={onUpdate} active={tab === "flashcards"} />
      </div>
      <div hidden={tab !== "quiz"}>
        <Quiz lecture={lecture} onUpdate={onUpdate} />
      </div>
      <div hidden={tab !== "chat"}>
        <Chat lecture={lecture} onUpdate={onUpdate} />
      </div>
      <div hidden={tab !== "transcript"}>
        <TranscriptPanel lecture={lecture} />
      </div>
    </div>
  );
}

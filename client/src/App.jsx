import { useState } from "react";
import Sidebar from "./components/Sidebar";
import NewLecture from "./components/NewLecture";
import LectureView from "./components/LectureView";
import Logo from "./components/Logo";
import { loadLectures, saveLectures, newId } from "./lib/storage";
import "./App.css";

export default function App() {
  const [lectures, setLectures] = useState(loadLectures);
  const [activeId, setActiveId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const active = lectures.find((l) => l.id === activeId) || null;

  // Every change goes through here so it's also saved to the browser
  function commit(change) {
    setLectures((prev) => {
      const next = change(prev);
      if (!saveLectures(next)) console.warn("Browser storage is full; latest changes weren't saved.");
      return next;
    });
  }

  function addLecture(data) {
    const lecture = { id: newId(), createdAt: Date.now(), ...data };
    commit((prev) => [lecture, ...prev]);
    setActiveId(lecture.id);
  }

  function updateLecture(id, patch) {
    commit((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function deleteLecture(id) {
    commit((prev) => prev.filter((l) => l.id !== id));
    if (id === activeId) setActiveId(null);
  }

  return (
    <div className={`app ${menuOpen ? "menu-open" : ""}`}>
      <Sidebar
        lectures={lectures}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          setMenuOpen(false);
        }}
        onNew={() => {
          setActiveId(null);
          setMenuOpen(false);
        }}
        onDelete={deleteLecture}
      />
      <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />

      <main className="main">
        <header className="mobile-bar">
          <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <Logo />
        </header>

        {active ? (
          <LectureView
            key={active.id}
            lecture={active}
            onUpdate={(patch) => updateLecture(active.id, patch)}
          />
        ) : (
          <NewLecture onCreated={addLecture} />
        )}
      </main>
    </div>
  );
}

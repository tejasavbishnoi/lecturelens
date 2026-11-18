import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import NewLecture from "./components/NewLecture";
import LectureView from "./components/LectureView";
import Logo from "./components/Logo";
import Modal from "./components/Modal";
import ShortcutsDialog from "./components/ShortcutsDialog";
import { loadLectures, saveLectures, newId } from "./lib/storage";
import { getTheme, applyTheme } from "./lib/theme";
import { useToast } from "./lib/toast";
import { isTyping } from "./lib/utils";
import "./App.css";

export default function App() {
  const toast = useToast();
  const [lectures, setLectures] = useState(loadLectures);
  const [activeId, setActiveId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getTheme);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const warnedFull = useRef(false);

  const active = lectures.find((l) => l.id === activeId) || null;
  const dialogOpen = Boolean(pendingDelete) || showShortcuts;

  // Global shortcuts: ? = shortcuts list, N = new lecture
  useEffect(() => {
    function onKey(e) {
      if (dialogOpen || isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
      } else if (e.key.toLowerCase() === "n") {
        setActiveId(null);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialogOpen]);

  // Every change goes through here so it's also saved to the browser
  function commit(change) {
    setLectures((prev) => {
      const next = change(prev);
      if (!saveLectures(next) && !warnedFull.current) {
        warnedFull.current = true;
        setTimeout(() => toast("Browser storage is full, so new changes won't be saved", "error"), 0);
      }
      return next;
    });
  }

  function addLecture(data) {
    const lecture = { id: newId(), createdAt: Date.now(), ...data };
    commit((prev) => [lecture, ...prev]);
    setActiveId(lecture.id);
    toast("Lecture ready. Pick a tool to start");
  }

  function updateLecture(id, patch) {
    commit((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function confirmDelete() {
    const id = pendingDelete.id;
    commit((prev) => prev.filter((l) => l.id !== id));
    if (id === activeId) setActiveId(null);
    setPendingDelete(null);
    toast("Lecture deleted");
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className={`app ${menuOpen ? "menu-open" : ""}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

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
        onDelete={setPendingDelete}
        theme={theme}
        onToggleTheme={toggleTheme}
        onShowShortcuts={() => setShowShortcuts(true)}
      />
      <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />

      <main className="main" id="main" tabIndex={-1}>
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

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this lecture?"
      >
        <p className="muted">
          “{pendingDelete?.title}” and its notes, flashcards, quiz and chat will be removed from
          this browser. This can&apos;t be undone.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setPendingDelete(null)} autoFocus>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </Modal>

      <ShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}

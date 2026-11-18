import Logo from "./Logo";
import { timeAgo } from "../lib/utils";

export default function Sidebar({
  lectures,
  activeId,
  onSelect,
  onNew,
  onDelete,
  theme,
  onToggleTheme,
  onShowShortcuts,
}) {
  return (
    <aside className="sidebar" aria-label="Lecture history">
      <div className="sidebar-top">
        <Logo />
        <button className="btn btn-primary btn-block" onClick={onNew}>
          + New lecture
        </button>
      </div>

      <div className="history">
        <p className="history-label">Your lectures</p>
        {lectures.length === 0 && (
          <p className="history-empty">Lectures you open will show up here.</p>
        )}

        {lectures.map((l) => (
          <div
            key={l.id}
            className={`history-item ${l.id === activeId ? "active" : ""}`}
            onClick={() => onSelect(l.id)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(l.id)}
            role="button"
            tabIndex={0}
            aria-current={l.id === activeId ? "page" : undefined}
          >
            {l.thumbnail ? (
              <img src={l.thumbnail} alt="" className="history-thumb" />
            ) : (
              <div className="history-thumb placeholder" aria-hidden="true">
                🎙️
              </div>
            )}
            <div className="history-text">
              <span className="history-title">{l.title}</span>
              <span className="history-meta">{timeAgo(l.createdAt)}</span>
            </div>
            <button
              className="history-delete"
              aria-label={`Delete ${l.title}`}
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(l);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-foot">
        <span>Saved in this browser</span>
        <div className="foot-actions">
          <button
            className="icon-btn sm"
            onClick={onShowShortcuts}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            ⌨
          </button>
          <button
            className="icon-btn sm"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </aside>
  );
}

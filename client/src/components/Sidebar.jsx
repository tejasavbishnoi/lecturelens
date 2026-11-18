import Logo from "./Logo";
import { timeAgo } from "../lib/utils";

export default function Sidebar({ lectures, activeId, onSelect, onNew, onDelete }) {
  return (
    <aside className="sidebar">
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
          >
            {l.thumbnail ? (
              <img src={l.thumbnail} alt="" className="history-thumb" />
            ) : (
              <div className="history-thumb placeholder">🎙️</div>
            )}
            <div className="history-text">
              <span className="history-title">{l.title}</span>
              <span className="history-meta">{timeAgo(l.createdAt)}</span>
            </div>
            <button
              className="history-delete"
              aria-label="Delete lecture"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete "${l.title}"?`)) onDelete(l.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <p className="sidebar-foot">Saved in this browser</p>
    </aside>
  );
}

// Empty state shown before a feature has been generated
export default function GeneratePrompt({
  icon,
  title,
  text,
  action,
  loading,
  loadingText,
  error,
  onClick,
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h2>{title}</h2>
      <p className="muted">{text}</p>
      <button className="btn btn-primary" onClick={onClick} disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" /> {loadingText}
          </>
        ) : (
          action
        )}
      </button>
      {loading && <p className="hint">Long lectures can take up to a minute.</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

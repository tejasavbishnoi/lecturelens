// Empty state shown before a feature has been generated
export default function GeneratePrompt({ icon, title, text, action, error, onClick }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">
        {icon}
      </div>
      <h2>{title}</h2>
      <p className="muted">{text}</p>
      <button className="btn btn-primary" onClick={onClick}>
        {action}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

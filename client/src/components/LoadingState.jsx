import useRotating from "../lib/useRotating";

// Skeleton placeholder + changing status message while the AI works
export default function LoadingState({ messages, variant = "notes" }) {
  const message = useRotating(messages, true, 2600);

  return (
    <div className="loading-state" role="status" aria-live="polite">
      <p className="loading-msg">
        <span className="spinner" aria-hidden="true" />
        <span key={message} className="loading-text">
          {message}
        </span>
      </p>

      <div className={`skeleton skeleton-${variant}`} aria-hidden="true">
        {variant === "notes" && (
          <>
            <div className="sk sk-line tall w-40" />
            {[96, 88, 92, 70].map((w, i) => (
              <div key={`a${i}`} className="sk sk-line" style={{ width: `${w}%` }} />
            ))}
            <div className="sk sk-line tall gap w-30" />
            {[90, 84, 60].map((w, i) => (
              <div key={`b${i}`} className="sk sk-line" style={{ width: `${w}%` }} />
            ))}
          </>
        )}
        {variant === "cards" && <div className="sk sk-card" />}
        {variant === "quiz" && (
          <>
            <div className="sk sk-line tall w-80" />
            <div className="sk sk-option" />
            <div className="sk sk-option" />
            <div className="sk sk-option" />
            <div className="sk sk-option" />
          </>
        )}
      </div>

      <p className="hint">Long lectures can take up to a minute.</p>
    </div>
  );
}

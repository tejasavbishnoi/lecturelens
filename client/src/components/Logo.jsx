export default function Logo() {
  return (
    <div className="logo">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="13.5" cy="13.5" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M20.5 20.5 28 28" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        <path
          d="M9 12.5a5 5 0 0 1 4.5-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".6"
        />
      </svg>
      <span>LectureLens</span>
    </div>
  );
}

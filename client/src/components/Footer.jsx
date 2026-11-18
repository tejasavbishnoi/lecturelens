import { AUTHOR, GITHUB_URL } from "../config";

export default function Footer() {
  return (
    <footer className="footer">
      <span>
        Built by <strong>{AUTHOR}</strong> with React, Express and Gemini
      </span>
      <nav aria-label="Project links">
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
      </nav>
    </footer>
  );
}

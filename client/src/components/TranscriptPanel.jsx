import { useMemo, useState } from "react";
import { useToast } from "../lib/toast";
import { downloadText, slugify } from "../lib/utils";

export default function TranscriptPanel({ lecture }) {
  const toast = useToast();
  const [query, setQuery] = useState("");

  // Split the transcript around search matches so they can be highlighted
  const { parts, count } = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return { parts: [lecture.transcript], count: 0 };
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const split = lecture.transcript.split(new RegExp(`(${escaped})`, "gi"));
    return { parts: split, count: (split.length - 1) / 2 };
  }, [query, lecture.transcript]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(lecture.transcript);
      toast("Transcript copied to clipboard");
    } catch {
      toast("Couldn't copy, so try Download instead", "error");
    }
  }

  function download() {
    downloadText(`${slugify(lecture.title)}-transcript.txt`, lecture.transcript);
    toast("Transcript downloaded");
  }

  return (
    <div>
      <div className="transcript-tools">
        <input
          className="text-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the transcript…"
          aria-label="Search the transcript"
        />
        {query.trim().length >= 2 && (
          <span className="muted" role="status">
            {count} match{count === 1 ? "" : "es"}
          </span>
        )}
        <div className="spacer" />
        <button className="btn btn-ghost btn-sm" onClick={copy}>
          Copy
        </button>
        <button className="btn btn-ghost btn-sm" onClick={download}>
          Download .txt
        </button>
      </div>

      <div className="transcript-text" tabIndex={0} aria-label="Transcript">
        {parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>))}
      </div>
    </div>
  );
}

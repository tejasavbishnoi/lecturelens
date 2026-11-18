import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { postJSON } from "../lib/api";
import useAsync from "../lib/useAsync";
import { downloadText, slugify } from "../lib/utils";
import GeneratePrompt from "./GeneratePrompt";

export default function NotesPanel({ lecture, onUpdate }) {
  const { loading, error, run } = useAsync();
  const [copied, setCopied] = useState(false);

  const generate = () =>
    run(async () => {
      const data = await postJSON("/api/notes", { transcript: lecture.transcript });
      onUpdate({ notes: data.notes });
    });

  if (!lecture.notes) {
    return (
      <GeneratePrompt
        icon="📝"
        title="Study notes"
        text="A structured summary with headings, key terms and takeaways."
        action="✨ Generate notes"
        loading={loading}
        loadingText="Writing notes…"
        error={error}
        onClick={generate}
      />
    );
  }

  async function copy() {
    await navigator.clipboard.writeText(lecture.notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="panel-toolbar">
        <button className="btn btn-ghost btn-sm" onClick={copy}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() =>
            downloadText(`${slugify(lecture.title)}-notes.md`, lecture.notes, "text/markdown")
          }
        >
          Download .md
        </button>
        <button className="btn btn-ghost btn-sm" onClick={generate} disabled={loading}>
          {loading ? "Regenerating…" : "↻ Regenerate"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <article className="markdown">
        <ReactMarkdown>{lecture.notes}</ReactMarkdown>
      </article>
    </div>
  );
}

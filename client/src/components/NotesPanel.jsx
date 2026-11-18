import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { postJSON } from "../lib/api";
import useAsync from "../lib/useAsync";
import { useToast } from "../lib/toast";
import { downloadText, slugify } from "../lib/utils";
import GeneratePrompt from "./GeneratePrompt";
import LoadingState from "./LoadingState";

const STEPS = [
  "Reading the lecture…",
  "Finding the key ideas…",
  "Organizing topics…",
  "Writing your notes…",
  "Adding key takeaways…",
];

// Plain text of a React node (used to build heading ids)
function textOf(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return textOf(node.props?.children);
}

function headingId(text) {
  return `sec-${slugify(text.replace(/[*_`]/g, ""))}`;
}

function extractHeadings(markdown) {
  return [...markdown.matchAll(/^##\s+(.+)$/gm)].map((m) => {
    const text = m[1].replace(/[*_`#]/g, "").trim();
    return { text, id: headingId(text) };
  });
}

const markdownComponents = {
  h2: ({ children }) => <h2 id={headingId(textOf(children))}>{children}</h2>,
};

export default function NotesPanel({ lecture, onUpdate, active }) {
  const toast = useToast();
  const { loading, error, run } = useAsync();
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(null);

  const headings = useMemo(() => extractHeadings(lecture.notes || ""), [lecture.notes]);

  // Reading progress bar + highlight the section you're reading in the contents list
  useEffect(() => {
    if (!active || !lecture.notes) return;
    const scroller = document.querySelector(".main");
    if (!scroller) return;

    function onScroll() {
      const max = scroller.scrollHeight - scroller.clientHeight;
      setProgress(max > 0 ? scroller.scrollTop / max : 0);
      let cur = null;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top < 140) cur = h.id;
      }
      setCurrent(cur);
    }

    const raf = requestAnimationFrame(onScroll);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [active, lecture.notes, headings]);

  const generate = () =>
    run(async () => {
      const data = await postJSON("/api/notes", {
        transcript: lecture.transcript,
        language: lecture.language,
      });
      onUpdate({ notes: data.notes });
    });

  if (loading) return <LoadingState messages={STEPS} variant="notes" />;

  if (!lecture.notes) {
    return (
      <GeneratePrompt
        icon="📝"
        title="Study notes"
        text="A structured summary with headings, key terms and takeaways."
        action="✨ Generate notes"
        error={error}
        onClick={generate}
      />
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(lecture.notes);
      toast("Notes copied to clipboard");
    } catch {
      toast("Couldn't copy, so try Download instead", "error");
    }
  }

  function download() {
    downloadText(`${slugify(lecture.title)}-notes.md`, lecture.notes, "text/markdown");
    toast("Notes downloaded");
  }

  function jumpTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {active && (
        <div className="read-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
      )}

      <div className="panel-toolbar">
        <button className="btn btn-ghost btn-sm" onClick={copy}>
          Copy
        </button>
        <button className="btn btn-ghost btn-sm" onClick={download}>
          Download .md
        </button>
        <button className="btn btn-ghost btn-sm" onClick={generate}>
          ↻ Regenerate
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="notes-layout">
        <article className="markdown">
          <ReactMarkdown components={markdownComponents}>{lecture.notes}</ReactMarkdown>
        </article>

        {headings.length > 1 && (
          <nav className="toc" aria-label="Table of contents">
            <p className="toc-title">Contents</p>
            <ul>
              {headings.map((h, i) => (
                <li key={`${h.id}-${i}`}>
                  <a
                    href={`#${h.id}`}
                    className={current === h.id ? "on" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      jumpTo(h.id);
                    }}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </>
  );
}

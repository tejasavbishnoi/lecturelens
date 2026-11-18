import "dotenv/config";
import express from "express";
import cors from "cors";
import { fetchTranscript } from "youtube-transcript-plus";
import { Type } from "@google/genai";
import { getVideoId, decodeEntities } from "./utils/youtube.js";
import { generate, generateJSON } from "./utils/gemini.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ---------- Health check ----------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "LectureLens server running" });
});

// ---------- Step 2: YouTube link -> transcript ----------
app.post("/api/transcript", async (req, res) => {
  const videoId = getVideoId(req.body.url || "");
  if (!videoId) {
    return res.status(400).json({ error: "That doesn't look like a YouTube link." });
  }

  try {
    const segments = await fetchTranscript(videoId);
    const text = segments
      .map((s) => decodeEntities(s.text))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    res.json({ videoId, text, wordCount: text.split(" ").length });
  } catch (err) {
    console.error("Transcript error:", err.message);
    res.status(500).json({
      error: "Couldn't get captions for this video. Try one that has subtitles (CC).",
    });
  }
});

// ---------- Step 3: transcript -> notes ----------
app.post("/api/notes", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: "No transcript provided." });

  const system = `You are an expert teaching assistant. Turn lecture transcripts into clear,
well-organized study notes in Markdown. Use:
- A short "Summary" section (3-4 sentences) at the top
- ## headings for each main topic, in the order they were taught
- Bullet points for key ideas, **bold** for important terms
- A "Key Takeaways" section at the end (5-7 bullets)
Fix transcription errors silently. Do not invent content that isn't in the lecture.`;

  try {
    const notes = await generate(`Lecture transcript:\n\n${transcript}`, system);
    res.json({ notes });
  } catch (err) {
    console.error("Notes error:", err.message);
    res.status(500).json({ error: `AI error: ${err.message}` });
  }
});

// ---------- Step 4: transcript -> flashcards ----------
app.post("/api/flashcards", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: "No transcript provided." });

  const system = `You create study flashcards from lecture transcripts.
Make 10-15 flashcards covering the most important concepts, definitions, and facts.
- "front": a clear, specific question
- "back": a concise answer (1-3 sentences)
Only use information from the lecture. Avoid trivial or duplicate cards.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      cards: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING },
          },
          required: ["front", "back"],
        },
      },
    },
    required: ["cards"],
  };

  try {
    const data = await generateJSON(`Lecture transcript:\n\n${transcript}`, system, schema);
    res.json({ cards: data.cards });
  } catch (err) {
    console.error("Flashcards error:", err.message);
    res.status(500).json({ error: `AI error: ${err.message}` });
  }
});

// ---------- Start server ----------
const PORT = process.env.PORT || 5001;
app.listen(PORT, (err) => {
  if (err) {
    console.error("Server failed to start:", err.message);
    process.exit(1);
  }
  console.log(`Server on http://localhost:${PORT}`);
});

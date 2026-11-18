import express from "express";
import cors from "cors";
import "dotenv/config";
import { fetchTranscript } from "youtube-transcript-plus";
import { getVideoId, decodeEntities } from "./utils/youtube.js";
import { generate } from "./utils/gemini.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "LectureLens server running" });
});
app.post("/api/transcript", async (req, res) => {
  const videoId = getVideoId(req.body.url || "");
  if (!videoId) {
    return res.status(400).json({ error: "That doesn't look like a YouTube link." });
  }
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
    res.status(500).json({ error: "AI couldn't generate notes. Check your API key and try again." });
  }
});

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
import express from "express";
import cors from "cors";
import "dotenv/config";
import { fetchTranscript } from "youtube-transcript-plus";
import { getVideoId, decodeEntities } from "./utils/youtube.js";

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
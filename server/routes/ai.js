import { Router } from "express";
import multer from "multer";
import os from "node:os";
import { fetchTranscript } from "youtube-transcript-plus";
import { getVideoId, decodeEntities } from "../utils/youtube.js";
import {
  generate,
  generateJSON,
  chat,
  transcribeFile,
  transcribeYouTube,
  isBusyError,
} from "../utils/gemini.js";
import {
  NOTES_SYSTEM,
  FLASHCARDS_SYSTEM,
  FLASHCARDS_SCHEMA,
  QUIZ_SYSTEM,
  QUIZ_SCHEMA,
  chatSystem,
  withLanguage,
} from "../utils/prompts.js";

const router = Router();

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

function needTranscript(req, res) {
  if (!req.body.transcript) {
    res.status(400).json({ error: "No transcript provided." });
    return false;
  }
  return true;
}

const BUSY_MESSAGE =
  "Gemini is very busy right now (high demand on Google's side). Please try again in a minute.";

function aiError(res, label, err) {
  console.error(`${label} error:`, err.message);
  if (isBusyError(err)) return res.status(503).json({ error: BUSY_MESSAGE });
  res.status(500).json({ error: `AI error: ${err.message}` });
}

// ---------- YouTube link -> transcript + title ----------
router.post("/transcript", async (req, res) => {
  const videoId = getVideoId(req.body.url || "");
  if (!videoId) {
    return res.status(400).json({ error: "That doesn't look like a YouTube link." });
  }

  // 1) Fast path: YouTube captions
  // 2) Fallback: Gemini transcribes the video from its link (no captions needed)
  let text = "";
  let transcribedBy = "captions";
  try {
    const segments = await fetchTranscript(videoId);
    text = segments
      .map((s) => decodeEntities(s.text))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (err) {
    console.warn("Captions unavailable, using Gemini instead:", err.message);
  }

  if (!text) {
    try {
      text = (await transcribeYouTube(videoId)).replace(/\s+/g, " ").trim();
      transcribedBy = "gemini";
    } catch (err) {
      console.error("Gemini YouTube transcription error:", err.message);
      if (isBusyError(err)) return res.status(503).json({ error: BUSY_MESSAGE });
      return res.status(500).json({
        error:
          "Couldn't transcribe this video. It may be private, age-restricted, or very long " +
          "(over ~4 hours). Try another video or upload the audio instead.",
      });
    }
  }

  // Title + channel from YouTube's public oEmbed endpoint (no key needed)
  let title = "Untitled lecture";
  let author = "";
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (r.ok) {
      const meta = await r.json();
      title = meta.title || title;
      author = meta.author_name || "";
    }
  } catch {
    // title is optional
  }

  res.json({
    source: "youtube",
    videoId,
    title,
    author,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    transcript: text,
    wordCount: text.split(" ").length,
    transcribedBy,
  });
});

// ---------- Audio / video file -> transcript ----------
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  const ok = /^(audio|video)\//.test(req.file.mimetype);
  if (!ok) return res.status(400).json({ error: "Please upload an audio or video file." });

  try {
    const text = (await transcribeFile(req.file.path, req.file.mimetype))
      .replace(/\s+/g, " ")
      .trim();
    res.json({
      source: "upload",
      title: req.file.originalname.replace(/\.[^.]+$/, ""),
      author: "Uploaded recording",
      transcript: text,
      wordCount: text.split(" ").length,
    });
  } catch (err) {
    aiError(res, "Transcribe", err);
  }
});

// ---------- Notes ----------
router.post("/notes", async (req, res) => {
  if (!needTranscript(req, res)) return;
  try {
    const notes = await generate(
      `Lecture transcript:\n\n${req.body.transcript}`,
      withLanguage(NOTES_SYSTEM, req.body.language)
    );
    res.json({ notes });
  } catch (err) {
    aiError(res, "Notes", err);
  }
});

// ---------- Flashcards ----------
router.post("/flashcards", async (req, res) => {
  if (!needTranscript(req, res)) return;
  try {
    const data = await generateJSON(
      `Lecture transcript:\n\n${req.body.transcript}`,
      withLanguage(FLASHCARDS_SYSTEM, req.body.language),
      FLASHCARDS_SCHEMA
    );
    res.json({ cards: data.cards });
  } catch (err) {
    aiError(res, "Flashcards", err);
  }
});

// ---------- Quiz ----------
router.post("/quiz", async (req, res) => {
  if (!needTranscript(req, res)) return;
  try {
    const data = await generateJSON(
      `Lecture transcript:\n\n${req.body.transcript}`,
      withLanguage(QUIZ_SYSTEM, req.body.language),
      QUIZ_SCHEMA
    );
    // Safety net: drop any malformed questions
    const questions = data.questions.filter(
      (q) =>
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.answerIndex >= 0 &&
        q.answerIndex < q.options.length
    );
    res.json({ questions });
  } catch (err) {
    aiError(res, "Quiz", err);
  }
});

// ---------- Chat with the lecture ----------
router.post("/chat", async (req, res) => {
  if (!needTranscript(req, res)) return;
  const messages = req.body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No message provided." });
  }
  try {
    const reply = await chat(
      messages.slice(-20),
      withLanguage(chatSystem(req.body.transcript), req.body.language)
    );
    res.json({ reply });
  } catch (err) {
    aiError(res, "Chat", err);
  }
});

export default router;

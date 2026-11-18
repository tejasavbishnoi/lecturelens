import fs from "node:fs/promises";
import {
  GoogleGenAI,
  createPartFromUri,
  createUserContent,
} from "@google/genai";

let ai;

function getClient() {
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: "v1beta",
    });
  }
  return ai;
}

function getModel() {
  return process.env.GEMINI_MODEL || "gemini-flash-latest";
}

// Plain text answer (notes)
export async function generate(prompt, systemInstruction) {
  const response = await getClient().models.generateContent({
    model: getModel(),
    contents: prompt,
    config: { systemInstruction },
  });
  return response.text;
}

// Structured JSON answer that follows a schema (flashcards, quiz)
export async function generateJSON(prompt, systemInstruction, schema) {
  const response = await getClient().models.generateContent({
    model: getModel(),
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  return JSON.parse(response.text);
}

// Multi-turn chat. messages = [{ role: "user" | "model", text }]
export async function chat(messages, systemInstruction) {
  const contents = messages.map((m) => ({
    role: m.role === "model" ? "model" : "user",
    parts: [{ text: m.text }],
  }));

  const response = await getClient().models.generateContent({
    model: getModel(),
    contents,
    config: { systemInstruction },
  });
  return response.text;
}

// Upload an audio/video file to Gemini and get a transcript back
export async function transcribeFile(filePath, mimeType) {
  const client = getClient();
  let file = await client.files.upload({ file: filePath, config: { mimeType } });

  // Big files need a moment to process before they can be used
  const started = Date.now();
  while (file.state === "PROCESSING") {
    if (Date.now() - started > 5 * 60 * 1000) throw new Error("File processing timed out.");
    await new Promise((r) => setTimeout(r, 3000));
    file = await client.files.get({ name: file.name });
  }
  if (file.state === "FAILED") throw new Error("Gemini couldn't process this file.");

  try {
    const response = await client.models.generateContent({
      model: getModel(),
      contents: createUserContent([
        createPartFromUri(file.uri, file.mimeType),
        "Transcribe this lecture recording word for word as plain text. " +
          "Do not add timestamps, speaker labels, headings, or commentary. " +
          "Only output the transcript.",
      ]),
    });
    return response.text;
  } finally {
    // Clean up: remove the file from Gemini and from this computer
    client.files.delete({ name: file.name }).catch(() => {});
    fs.unlink(filePath).catch(() => {});
  }
}

// Fallback when YouTube blocks caption requests (common on cloud servers like Render)
// or the video has no captions: Google's servers fetch the video and Gemini transcribes it.
const TRANSCRIBE_PROMPT =
  "Transcribe this lecture word for word as plain text in the language it is spoken. " +
  "Do not add timestamps, speaker labels, headings, or commentary. Only output the transcript.";

export async function transcribeYouTube(videoId) {
  const fileUri = `https://www.youtube.com/watch?v=${videoId}`;

  const request = (videoMetadata) =>
    getClient().models.generateContent({
      model: getModel(),
      contents: [
        {
          role: "user",
          parts: [{ fileData: { fileUri }, videoMetadata }, { text: TRANSCRIBE_PROMPT }],
        },
      ],
      config: { maxOutputTokens: 65536 },
    });

  let response;
  try {
    // Audio only: far fewer tokens than video frames, so long lectures fit
    response = await request({ contentLayers: ["AUDIO"] });
  } catch (err) {
    console.warn("Audio-only transcription failed, retrying with low frame rate:", err.message);
    response = await request({ fps: 0.05 });
  }

  const text = (response.text || "").trim();
  if (!text) throw new Error("Gemini returned an empty transcript.");
  return text;
}

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

// Main model first, then a backup model if the main one is overloaded
function getModels() {
  const primary = process.env.GEMINI_MODEL || "gemini-4-hydrogen";
  const fallback = process.env.GEMINI_FALLBACK_MODEL || "gemini-4-carbon";
  return primary === fallback ? [primary] : [primary, fallback];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function statusOf(err) {
  if (typeof err?.status === "number") return err.status;
  const match = String(err?.message || "").match(/"code":\s*(\d{3})/);
  return match ? Number(match[1]) : undefined;
}

// Errors worth retrying: overloaded (503), server error (500), rate/quota limit (429)
export function isBusyError(err) {
  const status = statusOf(err);
  return (
    status === 503 ||
    status === 500 ||
    status === 429 ||
    /UNAVAILABLE|high demand|overloaded|RESOURCE_EXHAUSTED/i.test(String(err?.message))
  );
}

// Calls Gemini with automatic retries and a backup model
async function callGemini(params) {
  let lastError;

  for (const model of getModels()) {
    const delays = [0, 2000, 5000]; // try now, then after 2s, then after 5s
    for (const delay of delays) {
      if (delay) await sleep(delay);
      try {
        return await getClient().models.generateContent({ ...params, model });
      } catch (err) {
        lastError = err;
        if (!isBusyError(err)) throw err; // real errors (bad request etc.) fail immediately
        console.warn(`[gemini] ${model} busy (${statusOf(err) ?? "?"}), retrying…`);
        if (statusOf(err) === 429) break; // quota limit: retrying the same model won't help
      }
    }
    console.warn(`[gemini] ${model} still unavailable, trying the next model`);
  }

  throw lastError;
}

// Plain text answer (notes)
export async function generate(prompt, systemInstruction) {
  const response = await callGemini({ contents: prompt, config: { systemInstruction } });
  return response.text;
}

// Structured JSON answer that follows a schema (flashcards, quiz)
export async function generateJSON(prompt, systemInstruction, schema) {
  const response = await callGemini({
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
  const response = await callGemini({ contents, config: { systemInstruction } });
  return response.text;
}

const TRANSCRIBE_PROMPT =
  "Transcribe this lecture word for word as plain text in the language it is spoken. " +
  "Do not add timestamps, speaker labels, headings, or commentary. Only output the transcript.";

// Upload an audio/video file to Gemini and get a transcript back
export async function transcribeFile(filePath, mimeType) {
  const client = getClient();
  let file = await client.files.upload({ file: filePath, config: { mimeType } });

  // Big files need a moment to process before they can be used
  const started = Date.now();
  while (file.state === "PROCESSING") {
    if (Date.now() - started > 5 * 60 * 1000) throw new Error("File processing timed out.");
    await sleep(3000);
    file = await client.files.get({ name: file.name });
  }
  if (file.state === "FAILED") throw new Error("Gemini couldn't process this file.");

  try {
    const response = await callGemini({
      contents: createUserContent([createPartFromUri(file.uri, file.mimeType), TRANSCRIBE_PROMPT]),
      config: { maxOutputTokens: 65536 },
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
export async function transcribeYouTube(videoId) {
  const fileUri = `https://www.youtube.com/watch?v=${videoId}`;

  const request = (videoMetadata) =>
    callGemini({
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
    if (isBusyError(err)) throw err; // Gemini is overloaded: no point trying another format
    console.warn("Audio-only transcription not accepted, retrying with low frame rate:", err.message);
    response = await request({ fps: 0.05 });
  }

  const text = (response.text || "").trim();
  if (!text) throw new Error("Gemini returned an empty transcript.");
  return text;
}

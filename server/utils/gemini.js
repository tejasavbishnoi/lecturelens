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

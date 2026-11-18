import { GoogleGenAI } from "@google/genai";

let ai;

function getClient() {
  if (!ai) ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: "v1beta",
    });
  return ai;
}

function getModel() {
  return process.env.GEMINI_MODEL || "gemini-flash-latest";
}

// Returns plain text (used for notes)
export async function generate(prompt, systemInstruction) {
  const response = await getClient().models.generateContent({
    model: getModel(),
    contents: prompt,
    config: { systemInstruction },
  });
  return response.text;
}

// Returns structured JSON that matches the schema you give it
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
import { GoogleGenAI } from "@google/genai";

let ai;

export async function generate(prompt, systemInstruction) {
  if (!ai) ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-flash-latest",
    contents: prompt,
    config: { systemInstruction },
  });
  return response.text;
}
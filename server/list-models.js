// Run with: node list-models.js
// Prints every Gemini model your API key can use for text generation.
import "dotenv/config";

const key = process.env.GEMINI_API_KEY;
const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
  headers: { "x-goog-api-key": key },
});
const data = await res.json();
if (!res.ok) {
  console.error("Error:", JSON.stringify(data, null, 2));
  process.exit(1);
}
data.models
  .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
  .forEach((m) => console.log(m.name.replace("models/", "")));

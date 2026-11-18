// Pulls the 11-character video ID out of any YouTube link format
export function getVideoId(input) {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s; // already an ID

  try {
    const url = new URL(s);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1, 12);
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const match = url.pathname.match(/\/(shorts|embed|live)\/([\w-]{11})/);
    if (match) return match[2];
  } catch {
    // not a valid URL
  }
  return null;
}

// Captions come with HTML codes like &#39; — turn them back into normal text
export function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
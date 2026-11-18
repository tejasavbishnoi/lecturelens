// Lectures are saved in this browser (localStorage), so history survives refreshes.
const KEY = "lecturelens:lectures";

export function loadLectures() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function saveLectures(lectures) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lectures));
    return true;
  } catch {
    // Storage full (very long transcripts) — app keeps working, just not saved
    return false;
  }
}

export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

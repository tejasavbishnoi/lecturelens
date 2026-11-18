// In development Vite forwards /api to the backend (see vite.config.js).
// In production set VITE_API_URL to your deployed backend, e.g. https://lecturelens-api.onrender.com
const API_BASE = import.meta.env.VITE_API_URL || "";

async function handle(res) {
  const text = await res.text();
  if (!text) {
    throw new Error(
      res.ok ? "Server sent an empty response." : "Can't reach the server. Is it running?"
    );
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Server sent an unexpected response.");
  }

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function postJSON(path, body) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the server. Is it running?");
  }
  return handle(res);
}

export async function uploadFile(path, fieldName, file) {
  const form = new FormData();
  form.append(fieldName, file);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method: "POST", body: form });
  } catch {
    throw new Error("Can't reach the server. Is it running?");
  }
  return handle(res);
}

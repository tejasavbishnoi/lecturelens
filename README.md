# 🔍 LectureLens

**Turn any lecture into a complete study kit.** Paste a YouTube link or upload a recording, and LectureLens uses AI to generate structured notes, flashcards, a scored quiz, and a chat tutor that answers questions from the lecture itself.

<!-- Add a screenshot: save it as screenshot.png in the repo root, then uncomment the next line -->
<!-- ![LectureLens screenshot](./screenshot.png) -->

## ✨ Features

- **YouTube or audio input**: fetches captions from any YouTube video, or transcribes uploaded audio/video files (MP3, M4A, WAV, MP4) with Gemini
- **📝 AI notes**: summary, topic-by-topic sections, key terms and takeaways in Markdown, with copy and download
- **🃏 Flashcards**: 3D flip cards with keyboard shortcuts, shuffle and regenerate
- **🎯 Quiz**: 10 multiple-choice questions with instant feedback, explanations, a score screen, a review of missed answers, and best-score tracking
- **💬 Chat with the lecture**: multi-turn Q&A grounded in the transcript
- **📄 Transcript viewer**: full-text search with highlighting, copy and download
- **History**: every lecture and everything generated for it is saved in the browser
- **One-click example lectures** on the home screen, so anyone can try it instantly

### Polish
- Dark and light themes (remembered between visits)
- Skeleton loaders with step-by-step progress messages while the AI works
- Toast notifications, styled confirm dialogs, smooth tab and message transitions
- Notes have a sticky table of contents with scroll-spy and a reading progress bar
- Confetti for a perfect quiz score 🎉
- Keyboard shortcuts (press `?` to see them all)
- Accessible: semantic tabs, ARIA labels, visible focus rings, skip link, reduced-motion support
- Error boundary with a friendly recovery screen instead of a blank page
- Open Graph / Twitter cards for rich link previews
- Responsive layout for desktop and mobile

## 🛠 Tech stack

| Layer    | Tech                                                       |
| -------- | ---------------------------------------------------------- |
| Frontend | React 19, Vite, react-markdown, CSS (custom design system) |
| Backend  | Node.js, Express 5, Multer                                 |
| AI       | Google Gemini API (`@google/genai`) with structured JSON output |
| Data     | YouTube captions (`youtube-transcript-plus`), YouTube oEmbed, localStorage |

## 🏗 How it works

```
React client  ──/api──▶  Express server  ──▶  YouTube captions / Gemini Files API
                                │
                                └──▶  Gemini: notes · flashcards (JSON schema) · quiz (JSON schema) · chat
```

- The API key stays on the server and is never sent to the browser.
- Flashcards and quizzes use Gemini's **structured output** (`responseSchema`), so responses are always valid JSON.
- Long lectures (4+ hours, 30k+ words) fit in a single request thanks to Gemini's 1M-token context, so there's no chunking.
- Uploaded recordings go through the Gemini Files API and are deleted after transcription.

## 🚀 Run it locally

**Requirements:** Node.js 20+ and a free Gemini API key from [Google AI Studio](https://aistudio.google.com).

```bash
git clone https://github.com/<your-username>/lecturelens.git
cd lecturelens

# Backend
cd server
npm install
cp .env.example .env      # then paste your GEMINI_API_KEY into .env
npm run dev               # http://localhost:5001

# Frontend (in a second terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```

### Environment variables (`server/.env`)

| Variable         | Description                                   |
| ---------------- | --------------------------------------------- |
| `PORT`           | Server port (default `5001`)                  |
| `GEMINI_API_KEY` | Your Gemini API key                           |
| `GEMINI_MODEL`   | Model to use (default `gemini-4-hydrogen`)    |

Run `node list-models.js` inside `server/` to see every model your key can use.

### Frontend variables (set on Vercel when deploying)

| Variable        | Description                                              |
| --------------- | -------------------------------------------------------- |
| `VITE_API_URL`  | URL of the deployed backend, e.g. `https://xyz.onrender.com` |
| `VITE_SITE_URL` | URL of the deployed frontend (used for link previews)    |

## 📡 API

| Method | Endpoint           | Body                          | Returns                         |
| ------ | ------------------ | ----------------------------- | ------------------------------- |
| POST   | `/api/transcript`  | `{ url }`                     | title, thumbnail, transcript    |
| POST   | `/api/transcribe`  | form-data `audio` (file)      | title, transcript               |
| POST   | `/api/notes`       | `{ transcript }`              | `{ notes }` (Markdown)          |
| POST   | `/api/flashcards`  | `{ transcript }`              | `{ cards: [{ front, back }] }`  |
| POST   | `/api/quiz`        | `{ transcript }`              | `{ questions: [...] }`          |
| POST   | `/api/chat`        | `{ transcript, messages }`    | `{ reply }`                     |

## 📁 Project structure

```
lecturelens/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── components/     # Sidebar, NewLecture, LectureView, Notes, Flashcards, Quiz, Chat, Transcript
│       ├── lib/            # API helper, storage, hooks, utils
│       ├── App.jsx
│       └── App.css
└── server/                 # Express backend
    ├── routes/ai.js        # All API endpoints
    ├── utils/              # Gemini client, prompts + JSON schemas, YouTube helpers
    └── index.js
```

## 🗺 Roadmap

- [ ] User accounts and cloud sync with MongoDB
- [ ] Clickable timestamps that jump to the right moment in the video
- [ ] Spaced-repetition scheduling for flashcards
- [ ] Export notes to PDF

---

Built by **Tejasav Bishnoi**

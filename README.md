# Tomar AI System

**Tomar AI System** is a real-time, multilingual AI command center powered by the **Tomar AI Assistant** — a bilingual (English / Hindi) voice assistant with OS-level tool-calling, multi-agent switching, live camera/screen vision, and an offline fallback engine. Branding/ownership: **Vijay**.

---

## Project Overview

### What it does
- **Speech-to-speech voice assistant** — talk to Tomar in English or Hindi; it responds with real-time audio via the Gemini Live API.
- **OS control via tool calls** — Tomar can trigger shell commands, web/media actions (Google/YouTube/Spotify), and camera/screen analysis.
- **Multi-agent workspace** — switch between specialized agents (Core assistant, Red Team, Blue Team, Code Master, Automation).
- **Persistent memory** — conversation history is cached locally and agent logs are stored in MongoDB.
- **Offline mode** — when the network drops, a local Python engine (Vosk + pyttsx3) handles a subset of voice commands.

### Main features
| Feature | Detail |
|---------|--------|
| Tomar voice | Real-time bilingual (English / Hindi) speech-to-speech (Gemini native-audio) |
| Visual analysis | Camera / screen capture fed to the model on request |
| System memory | Local vault (localStorage) + MongoDB agent logs |
| OS control | Shell command tool calls routed through the backend bridge |
| Multi-agent | Core, Red Team, Blue Team, Code Master, Automation |
| Offline fallback | Local NLP command handler when internet is unstable |

### Architecture overview
```
┌─────────────────────┐        Gemini Live / Chat API
│  Frontend (Vite +   │◀──────────────────────────────────┐
│  React 19 SPA)      │                                    │
│  :3000              │──── HTTP (offline fallback) ──┐    │
└─────────────────────┘                               ▼    ▼
                                             ┌───────────────────────┐
                                             │  Backend (FastAPI)    │
                                             │  :8000                │
                                             │  offline voice engine │
                                             └───────────┬───────────┘
                                                         │ Motor (async)
                                                         ▼
                                             ┌───────────────────────┐
                                             │  MongoDB  :27017      │
                                             └───────────────────────┘
```

- The **frontend** talks directly to the Google Gemini API for live voice/chat.
- The **backend** provides the offline command engine and MongoDB-backed agent logs.
- **MongoDB** stores agent logs (`agent_logs` collection).

### Technologies used
- **Frontend:** React 19, TypeScript, Vite 6, Tailwind (CDN), `@google/genai`
- **Backend:** Python 3.12, FastAPI, Uvicorn, Motor (async MongoDB), Vosk, pyttsx3, SpeechRecognition, PyAudio
- **Database:** MongoDB 7
- **Infra:** Docker, Docker Compose

---

## Folder Structure

```
.
├── App.tsx                 # Root React component (UI, chat, live voice control)
├── index.tsx / index.html  # Vite entrypoint + HTML shell
├── constants.tsx           # Agent definitions & system prompts
├── types.ts                # Shared TypeScript types / AgentId enum
├── components/             # UI components (AgentCard, AvatarCustomizer)
├── services/
│   ├── geminiService.ts     # Gemini live/chat session + tool declarations
│   └── audioUtils.ts        # PCM encode/decode helpers
├── backend/
│   ├── main.py              # FastAPI app, offline voice engine, Mongo access
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend image
├── Dockerfile              # Frontend image
├── docker-compose.yml      # Full stack: frontend + backend + mongo
├── .dockerignore
├── .env.example            # Environment template
├── linux_setup.sh          # Native (non-Docker) installer (apt / pacman)
└── start.sh                # Native launcher (backend + frontend)
```

---

## Requirements

**With Docker (recommended):**
- Docker Engine 24+
- Docker Compose v2

**Without Docker:**
- Node.js 18+ and npm (project developed on Node 22+)
- Python 3.10+ with `venv`
- MongoDB (local instance or Atlas connection string)
- System audio libs for the offline engine: `portaudio`, `ffmpeg`, `espeak-ng`

**Always required:**
- A Google Gemini API key — https://ai.google.dev
- Environment variables (see below)

---

## Environment Setup

Copy the template and fill in real values:

```bash
cp .env.example .env
```

| Variable | Used by | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | Frontend (Vite) | Gemini API key exposed to the browser for live voice/chat. |
| `API_KEY` | Backend / legacy | Same Gemini key; set equal to `GEMINI_API_KEY`. |
| `MONGO_URI` | Backend | MongoDB connection string. Local: `mongodb://localhost:27017`. Under Docker Compose this is auto-overridden to `mongodb://mongo:27017`. |

Example `.env.example`:

```env
API_KEY=your_gemini_key_here
GEMINI_API_KEY=your_gemini_key_here
MONGO_URI=mongodb://localhost:27017
```

> ⚠️ `.env` is gitignored — never commit real keys. If a secret is ever committed, rotate it.

---

## Installation

### Quick path (Linux, native)
```bash
chmod +x linux_setup.sh
./linux_setup.sh          # auto-detects apt (Debian/Ubuntu/Kali) or pacman (Arch)
```
The script installs system deps, creates the Python venv, installs backend + frontend deps, and scaffolds `.env`.

### Manual path
```bash
# Frontend
npm install

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

---

## Running Without Docker

**Frontend:**
```bash
npm install
npm run dev          # http://localhost:3000
```

**Backend (separate terminal):**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Or both at once:**
```bash
./start.sh
```

---

## Running With Docker

Build and start the full stack (frontend + backend + MongoDB):

```bash
docker compose up --build
```

- Frontend → http://localhost:3000
- Backend  → http://localhost:8000
- MongoDB  → localhost:27017

**Stop containers:**
```bash
docker compose down          # add -v to also remove the mongo volume
```

**Rebuild after changes:**
```bash
docker compose up --build
```

**View logs:**
```bash
docker compose logs -f              # all services
docker compose logs -f backend      # one service
```

> Note: The offline voice engine needs real audio hardware, which containers don't expose — the backend API and MongoDB run fine in Docker, but live microphone/speaker features are intended for native (non-Docker) runs.

---

## API

Backend base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | Health/status check. Returns system status, version, offline-engine readiness. |
| `POST` | `/offline/execute` | Runs an offline voice command. Body: `{ "text": "check battery" }`. |
| `GET`  | `/logs/agent/{agent_id}` | Returns the 50 most recent logs for an agent from MongoDB. |

Example:
```bash
curl http://localhost:8000/
curl -X POST http://localhost:8000/offline/execute -H 'Content-Type: application/json' -d '{"text":"system load"}'
```

---

## Development Guide

- **Frontend** lives at the repo root (React/TS). Agent behavior and prompts are in `constants.tsx`; Gemini session logic is in `services/geminiService.ts`.
- **Backend** is a single FastAPI module (`backend/main.py`). Add endpoints there; keep the offline engine's command map in `OfflineController.handle_command`.
- Run `npm run build` before opening a PR to catch TypeScript/build errors.
- Keep secrets in `.env` only. Never hardcode keys or connection strings.
- Follow existing naming: the assistant is **Tomar**, the system is **Tomar AI System**, the owner brand is **Vijay**.

---

## Production Deployment

1. Set real `.env` values on the host (or inject via your orchestrator's secrets).
2. Build production assets / images:
   ```bash
   docker compose up --build -d
   ```
3. For a static frontend build (served behind a CDN/nginx instead of the Vite dev server):
   ```bash
   npm run build      # outputs to dist/
   npm run preview    # local production preview
   ```
   Note: the Gemini key is bundled into client assets at build time — front the app with your own auth/proxy if the key must stay private.
4. Point `MONGO_URI` at a managed MongoDB (e.g. Atlas) for durable storage.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `pyaudio` fails to build | Install system audio libs first: `portaudio19-dev` (apt) / `portaudio` (pacman). |
| `pyttsx3` errors on startup | Install `espeak-ng`. |
| Backend can't reach MongoDB | Check `MONGO_URI`. Under Docker it must be `mongodb://mongo:27017`. |
| Frontend has no AI responses | `GEMINI_API_KEY` missing/invalid in `.env`. Restart the dev server after editing `.env`. |
| Mic/camera not working | Grant browser permissions; on Linux add your user to `audio`/`video` groups and re-login. |
| `linux_setup.sh` fails | It supports apt and pacman only; on other distros install the deps manually. |
| Port already in use | Free ports 3000 / 8000 / 27017 or change the mappings in `docker-compose.yml`. |

---

*Tomar AI System · Vijay © 2025*

# SyncRoom

**Real-time watch sync** — one host controls playback; everyone stays in sync. No video streaming; only playback state is synced over WebSockets.

---

## Tech stack

- **Frontend:** React, Vite, TypeScript, TailwindCSS, Framer Motion, Zustand, Socket.io client
- **Backend:** Node.js, Express, Socket.io, UUID
- **Hosting:** Vercel (frontend), Render (backend) — free tiers

---

## Quick start (local)

```bash
# Backend
cd server && npm install && npm run dev

# Frontend (separate terminal)
cd client && npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Create a room, then join the same room from another tab or device.

---

## Project structure

| Path | Description |
|------|-------------|
| `client/` | React + Vite frontend |
| `server/` | Express + Socket.io backend |
| `phase1-static/` | Phase 1 static HTML/CSS reference |
| `docs/` | Architecture, phases, deployment |

See [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

---

## Features

- **Phases 1–2:** Landing page, React app, routing, host/guest UI
- **Phase 3:** Room create/join, play/pause/seek broadcast, timestamp sync
- **Phase 4:** Drift correction (every 3s), reconnection, host reassignment
- **Phase 5:** UI polish (mouse light, particle burst, gradient borders, loading skeleton)
- **Phase 6 (optional):** WebRTC data channel stub for future P2P

---

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Render (backend) and Vercel (frontend) steps.

---

## Ordered action list (beginner → deployment)

1. **Clone repo** and ensure Node.js 18+ is installed.
2. **Phase 1 (optional):** Open `phase1-static/index.html` or run `npx serve phase1-static`.
3. **Run backend:** `cd server && npm install && npm run dev` (set `CORS_ORIGIN=http://localhost:5173` in `.env`).
4. **Run frontend:** `cd client && npm install && npm run dev`; open http://localhost:5173.
5. **Test:** Create room → copy room ID → join in another tab; verify play/pause/seek sync.
6. **Deploy backend:** Render — Web Service, root `server`, build `npm install && npm run build`, start `npm start`, set `CORS_ORIGIN` after step 7.
7. **Deploy frontend:** Vercel — root `client`, set `VITE_API_URL` to Render URL.
8. **CORS:** Set Render `CORS_ORIGIN` to your Vercel URL; redeploy if needed.
9. **Final test:** Create and join room on production URL.

See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for the full step-by-step and [docs/TODO_CHECKLIST.md](docs/TODO_CHECKLIST.md) for the full checklist.

---

## License

Use and modify as you like. No copyrighted content is transmitted; only sync state.

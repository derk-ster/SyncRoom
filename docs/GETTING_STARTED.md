# SyncRoom — Ordered Action List (Beginner to Deployment)

Follow these steps in order from a clean machine to a fully deployed app.

---

## 1. Clone / create project

- Create repo (or clone existing).
- Ensure you have Node.js 18+ installed (`node -v`).

---

## 2. Phase 1 — Static page (optional; already in repo)

- Open `phase1-static/index.html` in a browser (or run `npx serve phase1-static` from repo root).
- Confirm landing layout and responsiveness.

---

## 3. Install and run backend

```bash
cd server
npm install
cp ../.env.example .env
# Edit .env: set CORS_ORIGIN=http://localhost:5173
npm run dev
```

- Leave this terminal running. You should see: `SyncRoom server listening on port 3001`.

---

## 4. Install and run frontend

```bash
cd client
npm install
# Optional: create client/.env with VITE_API_URL=http://localhost:3001
npm run dev
```

- Open **http://localhost:5173** in your browser.

---

## 5. Test locally

- Click **Create Room**. You should land on a room page with a video and host controls.
- Copy the room ID from the URL (e.g. `.../room/abc-123...`).
- Open a new tab (or another browser), go to **http://localhost:5173**, paste the room ID in **Join a room**, click **Join**.
- In the first tab (host), press Play. The second tab (guest) should play in sync. Try Pause and seek bar.

---

## 6. Deploy backend (Render)

1. Push your code to GitHub (or connect Render to your repo).
2. Render: **New → Web Service**; connect repo.
3. Set **Root Directory** to `server` (if your repo root is the SyncRoom folder).
4. **Build:** `npm install && npm run build`
5. **Start:** `npm start`
6. **Environment:** `NODE_ENV=production`, `CORS_ORIGIN=https://YOUR_VERCEL_APP.vercel.app` (you’ll set this after frontend deploy; you can update later).
7. Deploy and copy the backend URL (e.g. `https://syncroom-api.onrender.com`).

---

## 7. Deploy frontend (Vercel)

1. Vercel: **Add New → Project**; import the same repo.
2. **Root Directory:** `client`
3. **Framework:** Vite
4. **Environment variable:** `VITE_API_URL` = your Render backend URL from step 6.
5. Deploy. Copy the frontend URL (e.g. `https://syncroom.vercel.app`).

---

## 8. Wire CORS

- In Render, set **CORS_ORIGIN** to your Vercel URL (e.g. `https://syncroom.vercel.app`).
- Redeploy the backend if needed.

---

## 9. Final test

- Open the Vercel URL. Create a room.
- Open the same URL in another device or incognito; join with the room ID.
- Confirm play/pause/seek sync and that “Reconnecting…” appears and recovers if you briefly disconnect.

---

## 10. Optional next steps

- Add a custom domain (e.g. Cloudflare DNS → Vercel).
- Implement Phase 6 WebRTC for P2P sync.
- Add room URL copy button for the host to share the join link easily.

You’re done. SyncRoom is running from scratch to production.

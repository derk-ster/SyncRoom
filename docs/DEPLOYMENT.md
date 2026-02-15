# SyncRoom — Deployment Instructions

## Prerequisites

- Node.js 18+
- npm or yarn
- Accounts (free): [Vercel](https://vercel.com), [Render](https://render.com)

---

## Backend (Render.com)

1. **Create a Web Service**
   - Render Dashboard → New → Web Service
   - Connect your repo (or push `server/` only if using a monorepo; otherwise deploy the whole repo and set root to `server`).

2. **Build & start**
   - **Root Directory:** `server` (if repo root is SyncRoom; otherwise leave blank if your repo root is `server`).
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:**
     - `NODE_ENV` = `production`
     - `PORT` = assigned by Render (no need to set)
     - `CORS_ORIGIN` = your frontend URL (e.g. `https://syncroom.vercel.app`)

3. **Deploy**
   - After first deploy, note the backend URL (e.g. `https://syncroom-api.onrender.com`).

---

## Frontend (Vercel)

1. **Import project**
   - Vercel → Add New → Project → Import your repo.

2. **Configure (choose one):**

   **Option A — Root Directory = `client` (recommended)**  
   - **Root Directory:** `client`  
   - **Framework Preset:** Vite  
   - **Build Command:** `npm run build`  
   - **Output Directory:** `dist`  
   - `client/vercel.json` provides SPA rewrites.

   **Option B — Root Directory = empty (repo root)**  
   - **Root Directory:** leave empty  
   - Root `vercel.json` and `package.json` build the client and set SPA rewrites automatically.  
   - **Build Command** and **Output Directory** can stay default (overridden by root `vercel.json`).

   **Environment variable (either option):**
   - `VITE_API_URL` = your Render backend URL (e.g. `https://syncroom-api.onrender.com`)

   If you see 404, try Option B: in Vercel → Project → Settings → General, clear **Root Directory** so the repo root is used, then redeploy.

3. **Deploy**
   - Deploy. Your app will be at `https://<project>.vercel.app`.

4. **CORS**
   - Set the backend `CORS_ORIGIN` to this Vercel URL so Socket.io and API calls are allowed.

---

## Local development

**Terminal 1 — Server**

```bash
cd server
cp ../.env.example .env
# Edit .env: CORS_ORIGIN=http://localhost:5173
npm install
npm run dev
```

**Terminal 2 — Client**

```bash
cd client
# Ensure .env has VITE_API_URL=http://localhost:3001
npm install
npm run dev
```

Open `http://localhost:5173`. Create a room and join from another tab or device on the same network (use your machine’s IP for the client if testing from phone).

---

## DNS (optional, Cloudflare)

- Add a CNAME for your frontend (e.g. `syncroom.yourdomain.com` → `cname.vercel-dns.com`).
- Point backend subdomain to Render if you use a custom domain for the API.

---

## Checklist before go-live

- [ ] Backend `CORS_ORIGIN` matches frontend URL exactly (including https).
- [ ] Frontend `VITE_API_URL` points to the live backend URL.
- [ ] Socket.io connects (check browser Network tab for WebSocket).
- [ ] Create room and join from two browsers; confirm play/pause/seek sync.

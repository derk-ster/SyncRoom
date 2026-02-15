# SyncRoom — Final To-Do Checklist

Use this as an actionable checklist before considering the project “done” for a given phase or for launch.

---

## Phase 1 ✅

- [x] Create `phase1-static/index.html` with header, hero, Create/Join sections
- [x] Create `phase1-static/css/styles.css` with variables, glassmorphism, gradient bg, responsive
- [x] Verify in browser (desktop + narrow viewport)

---

## Phase 2 ✅

- [x] Scaffold Vite + React + TypeScript in `client/`
- [x] Install TailwindCSS, React Router, Zustand, Framer Motion
- [x] Implement `/` (Landing) and `/room/:roomId` (Room) routes
- [x] Create Room → navigate to `/room/create?host=1`; server creates room and redirects to `/room/:id?host=1`
- [x] Join Room → input room ID, navigate to `/room/:roomId`
- [x] Room page: host sees play/pause/seek; guest sees synced state
- [x] Zustand store for room state (roomId, isHost, playing, currentTime)

---

## Phase 3 ✅

- [x] Create `server/` with Express + Socket.io + TypeScript
- [x] In-memory room store (create, get, join, leave, playback state)
- [x] Socket events: `create-room`, `join-room`, `leave-room`, `play`, `pause`, `seek`
- [x] Client: connect Socket.io, create/join room on Room mount
- [x] Client: host emits play/pause/seek; all receive and apply with serverTime
- [x] Use a demo video URL for testing (e.g. Big Buck Bunny sample)

---

## Phase 4 ✅

- [x] Server: drift correction every 3s — broadcast `drift-correction` with current state
- [x] Client: listen for `drift-correction`, update store (smooth nudge)
- [x] Client: on socket reconnect, re-join room and fetch state
- [x] Server: on host disconnect, promote next guest to host; emit `host-changed`
- [x] Client: listen for `host-changed`, call `setHost(true)` when this socket is new host
- [x] Leave room: emit `leave-room`, cleanup store on navigate away

---

## Phase 5 ✅

- [x] Mouse-tracking light (radial gradient following cursor) on Landing
- [x] Particle burst on Create Room / Join button click (canvas)
- [x] Animated gradient border on action panels (CSS keyframes)
- [x] Loading skeleton when joining room
- [x] Animated room enter (fade + scale) with Framer Motion

---

## Phase 6 (Optional)

- [x] Add `client/src/lib/webrtc.ts` stub (types + createSyncChannel placeholder)
- [ ] Implement signaling over Socket.io (SDP/candidate exchange)
- [ ] Host: create RTCPeerConnection + RTCDataChannel; send sync messages
- [ ] Guest: accept offer, create answer, receive sync messages
- [ ] Use WebRTC when channel is open; fallback to Socket.io

---

## Pre-deployment

- [ ] Copy `.env.example` to `.env` and set `VITE_API_URL` (client) and `CORS_ORIGIN` (server)
- [ ] Backend: deploy to Render; set env vars; note backend URL
- [ ] Frontend: deploy to Vercel; set `VITE_API_URL` to backend URL; set backend `CORS_ORIGIN` to Vercel URL
- [ ] Test: create room on one device, join on another; verify play/pause/seek and reconnection

---

## Future scalability (notes)

- [ ] Redis adapter for Socket.io if running multiple server instances
- [ ] Rate limiting per room / per socket
- [ ] Optional auth (e.g. room password or invite link)
- [ ] WebRTC full implementation for lower latency where possible

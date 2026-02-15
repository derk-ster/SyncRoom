# SyncRoom — Phase-by-Phase Build Guide

## Phase 1: Static HTML/CSS Foundation

**Goal:** A responsive landing page with Create Room and Join Room, no JavaScript logic.

**Steps:**
1. Create `phase1-static/index.html` with semantic structure (header, main, form/buttons).
2. Create `phase1-static/css/styles.css` with:
   - CSS custom properties (colors, radii, shadows).
   - Glassmorphism-style panels (backdrop-filter, semi-transparent backgrounds).
   - Gradient background (subtle, modern).
   - Responsive layout (mobile-first; breakpoints for tablet/desktop).
3. Two CTAs: "Create Room" (button) and "Join Room" (input + button). Links/actions can be `#` for now.
4. Validate in browser; ensure it looks good on narrow and wide viewports.

**Deliverables:** `phase1-static/index.html`, `phase1-static/css/styles.css`.

---

## Phase 2: React + Vite + Routing

**Goal:** Convert to a React SPA with routing; landing and room page; host vs guest UI state.

**Steps:**
1. Scaffold Vite + React + TypeScript project in `client/`.
2. Install and configure: React Router, TailwindCSS, Zustand.
3. Create pages: `Landing` (from Phase 1 design), `Room` (placeholder then real UI).
4. Implement routing: `/` → Landing, `/room/:roomId` → Room.
5. Landing: "Create Room" navigates to `/room/:newRoomId` (generate UUID in client for now). "Join Room" reads room ID from input and navigates to `/room/:roomId`.
6. Room page: Detect host vs guest (e.g., query param `?host=1` when creating; otherwise guest). Show different UI (host: play/pause/seek controls; guest: "Waiting for host" or synced video placeholder).
7. Add a simple Zustand store for room state (roomId, isHost, playing, currentTime) — no backend yet.

**Deliverables:** `client/` with Vite, Tailwind, Router, Zustand, Landing, Room, basic store.

---

## Phase 3: Express + Socket.io Backend and Sync

**Goal:** Room creation and join on server; broadcast play/pause/seek; sync state with timestamp correction.

**Steps:**
1. Create `server/` with Node.js + Express + TypeScript. Entry: `server/src/index.ts`.
2. Add Socket.io to Express (CORS allowed origin from env).
3. Implement room model (in-memory): `roomId → { hostSocketId, guests: Set<socketId>, playbackState }`.
4. Socket events:
   - `create-room` → create room, set host, join socket to room, emit `room-created` with roomId.
   - `join-room` → validate room exists, add socket to room, emit `room-joined` and current `playbackState` to joiner; optionally broadcast "user joined" to others.
   - `play` / `pause` / `seek` → only from host; update server playback state; broadcast to room (including server timestamp for correction).
5. Client: Socket.io client in `client`; on connect, emit `create-room` or `join-room`; on `play`/`pause`/`seek` apply to local video element and store. Implement simple timestamp correction (store `serverTime` and use offset for applying `currentTime`).
6. Room page: Host sends play/pause/seek from video controls; guests receive and apply. Video source remains client-side (e.g., same URL or file).

**Deliverables:** `server/` with Express, Socket.io, room logic, sync events; client wired to socket and video controls.

---

## Phase 4: Latency Correction, Reconnection, Host Reassignment

**Goal:** Robust sync and resilience.

**Steps:**
1. **Latency / drift correction:** Every ~3 seconds, server broadcasts or responds with authoritative state: `currentTime`, `playing`, `serverTime`. Clients compute offset and nudge playback (smooth small seek) to correct drift.
2. **Reconnection:** On socket disconnect, client shows "Reconnecting…"; on reconnect, re-join room (join-room with same roomId) and receive full state; restore playback.
3. **Host reassignment:** If host disconnects, server detects it, promotes next socket in room to host, updates room state, broadcasts `host-changed` with new host socket id. Clients update `isHost` in store and UI.
4. **Leave room:** On "Leave" or navigate away, emit `leave-room` and clean up client state.

**Deliverables:** Drift correction interval, reconnection flow, host reassignment logic, leave-room handling.

---

## Phase 5: Advanced UI Polish

**Goal:** Premium feel: particle click effect, gradient borders, mouse-tracking light, smooth transitions.

**Steps:**
1. **Particle burst on click:** Small canvas or div-based particles on primary button clicks (e.g., Create Room, Join, Play). Use Framer Motion or a tiny canvas animation.
2. **Animated gradient borders:** Buttons and cards with rotating or flowing gradient borders (CSS + Framer Motion or CSS animation).
3. **Mouse-tracking light:** Radial gradient or spotlight that follows cursor on landing and/or room page (CSS variables updated from mouse move).
4. **Loading / skeleton:** While connecting or loading room, show skeleton or subtle loading animation instead of blank screen.
5. **Animated room join:** When entering room, short transition (e.g., fade + scale) for the room container.

**Deliverables:** All effects implemented in client; no new backend.

---

## Phase 6 (Optional): WebRTC Data Channel

**Goal:** Optional P2P sync path; fallback to Socket.io.

**Steps:**
1. Use Socket.io for signaling only: exchange SDP/candidates between peers in same room.
2. Establish WebRTC data channel host ↔ guest(s). Prefer 1 host → N guests (host sends state over data channel).
3. Sync messages over data channel: same payload as Socket.io (play, pause, seek, drift correction). If data channel is open and ready, use it; else use Socket.io.
4. Performance: throttle seek/play/pause events; batch if needed; measure RTT for correction.

**Deliverables:** Optional WebRTC path; Socket.io remains primary/fallback; same sync semantics.

---

After each phase, test in browser (and optionally on phone/tablet). Proceed to next phase only when current phase is stable and meets the requirements above.

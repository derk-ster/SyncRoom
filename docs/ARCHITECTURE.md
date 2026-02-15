# SyncRoom — High-Level Architecture Overview

## 1. System Purpose

**SyncRoom** is a real-time **playback state synchronization** platform. It does **not** stream video or audio. Each client loads their own video source (e.g., same URL or same file). Only **play**, **pause**, and **seek** commands plus **timestamp correction** are synced across participants so everyone stays in sync.

---

## 2. Core Concepts

| Concept | Description |
|--------|-------------|
| **Room** | A unique session (UUID). One host, N guests. |
| **Host** | User who controls playback. Only host can play/pause/seek. |
| **Guest** | User who receives sync events. Playback follows host. |
| **Playback state** | `{ playing, currentTime, lastSyncAt }` — synced via Socket.io. |
| **Latency correction** | Periodic round-trip time (RTT) measurement and clock drift correction. |

---

## 3. Data Flow (Simplified)

```
[Host Browser]                    [Server]                     [Guest Browsers]
     |                                |                                |
     |  play / pause / seek           |                                |
     |------------------------------>|  broadcast to room               |
     |                                |------------------------------->|
     |                                |                                | apply state
     |                                |  (optional) sync request        |
     |                                |<-------------------------------|
     |                                |  current state + serverTime     |
     |                                |------------------------------->
```

- **One-way control**: Host → Server → All (including host for consistency).
- **Bidirectional**: Guests can request full state (e.g., on join or reconnect).
- **No video bytes** ever go through the server.

---

## 4. Technology Choices

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React + Vite + TypeScript | Fast dev experience, type safety, easy deploy to Vercel. |
| State | Zustand | Lightweight, no boilerplate, good for sync state + UI state. |
| Real-time | Socket.io | Reliable, room-based broadcast, fallbacks, reconnection. |
| Backend | Node.js + Express | Same language as frontend, simple to host on Render. |
| Styling | TailwindCSS + Framer Motion | Utility-first CSS + declarative animations. |
| Hosting | Vercel (frontend) + Render (backend) | Free tiers, minimal config. |

---

## 5. Sync Logic (Critical)

- **Event-based**: On every play/pause/seek, server broadcasts `{ type, currentTime, playing, serverTime }`.
- **Timestamp correction**: Clients store `serverTime` and compare with `Date.now()` to estimate offset; used to compensate for network delay when applying `currentTime`.
- **Drift correction**: Every ~3s, server can broadcast or respond with authoritative `currentTime` + `serverTime` so clients can nudge playback and avoid long-term drift.
- **Host handoff**: If host disconnects, server promotes next available peer to host and notifies room.

---

## 6. Security and Legal

- **No copyrighted content** is transmitted. Only control signals and timestamps.
- **No auth** in initial version — room ID acts as shared secret (UUID, hard to guess).
- **CORS** and **Socket.io** origin checks on server to restrict allowed frontend origins.

---

## 7. Scalability (Future)

- **Horizontal scaling**: Socket.io with Redis adapter for multi-instance backend.
- **WebRTC data channel**: Optional P2P sync for low-latency path; Socket.io remains fallback and for signaling.
- **Rate limiting**: Per-room and per-socket to avoid abuse.

---

This document should be updated as the system evolves (e.g., WebRTC phase, auth, or new sync strategies).

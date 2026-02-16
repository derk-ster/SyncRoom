/**
 * SyncRoom backend entry.
 * Express server with Socket.io; CORS from env; room and sync handlers attached.
 */

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { generateSimpleRoomId } from './lib/roomId.js'
import { createRoomPending, getRoom } from './socket/rooms.js'
import { registerSocketHandlers } from './socket/handlers.js'
import { startDriftCorrection } from './sync/driftCorrection.js'

const PORT = Number(process.env.PORT) || 3001
const CORS_ORIGIN_RAW = (process.env.CORS_ORIGIN || 'http://localhost:5173').trim()
const CORS_ORIGINS = CORS_ORIGIN_RAW.split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean)

const app = express()
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      const normalized = origin.replace(/\/+$/, '')
      const allowed = CORS_ORIGINS.some((o) => o === normalized || o === origin)
      cb(null, allowed ? origin : false)
    },
    credentials: false,
  })
)
app.use(express.json())

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGINS.length > 0 ? CORS_ORIGINS : ['http://localhost:5173'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

registerSocketHandlers(io)
startDriftCorrection(io)

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'syncroom-api' })
})

/** Create a room via REST (e.g. to wake server on Render, then client claims via Socket.io join-room). */
app.post('/api/rooms', (_req, res) => {
  const roomId = generateSimpleRoomId()
  createRoomPending(roomId)
  res.json({ roomId })
})

/** Check if a room exists (optional wake + validation). */
app.get('/api/rooms/:roomId', (req, res) => {
  const room = getRoom(req.params.roomId)
  res.json({ exists: !!room })
})

httpServer.listen(PORT, () => {
  console.log(`SyncRoom server listening on port ${PORT}`)
  console.log(`CORS allowed origins: ${CORS_ORIGINS.join(', ') || '(none)'}`)
})

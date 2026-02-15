/**
 * SyncRoom backend entry.
 * Express server with Socket.io; CORS from env; room and sync handlers attached.
 */

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { registerSocketHandlers } from './socket/handlers.js'
import { startDriftCorrection } from './sync/driftCorrection.js'

const PORT = Number(process.env.PORT) || 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

const app = express()
app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN },
  pingTimeout: 60000,
  pingInterval: 25000,
})

registerSocketHandlers(io)
startDriftCorrection(io)

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'syncroom-api' })
})

httpServer.listen(PORT, () => {
  console.log(`SyncRoom server listening on port ${PORT}`)
})

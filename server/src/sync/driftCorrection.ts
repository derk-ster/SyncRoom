/**
 * Periodic drift correction: broadcast authoritative playback state to each room
 * so clients can nudge their local playback and stay in sync.
 */

import type { Server } from 'socket.io'
import { getRoom, getActiveRoomIds } from '../socket/rooms.js'

const DRIFT_CORRECTION_INTERVAL_MS = 3000

export function startDriftCorrection(io: Server): void {
  setInterval(() => {
    const roomIds = getActiveRoomIds()
    for (const roomId of roomIds) {
      const room = getRoom(roomId)
      if (!room) continue
      const { playback } = room
      const serverTime = Date.now()
      io.to(roomId).emit('drift-correction', {
        playing: playback.playing,
        currentTime: playback.currentTime,
        serverTime,
      })
    }
  }, DRIFT_CORRECTION_INTERVAL_MS)
}

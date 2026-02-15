/**
 * Socket.io event handlers: create-room, join-room, leave-room, play, pause, seek.
 * Only host can emit play/pause/seek; server broadcasts to entire room with serverTime for sync.
 */

import type { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  removeSocketFromAllRooms,
  setRoomPlayback,
  promoteGuestToHost,
} from './rooms.js'
import type { PlaybackState } from '../types.js'

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    socket.on('create-room', (callback?: (roomId: string) => void) => {
      const roomId = uuidv4()
      createRoom(roomId, socket.id)
      socket.join(roomId)
      if (typeof callback === 'function') callback(roomId)
    })

    socket.on('join-room', (roomId: string, callback?: (ok: boolean, state?: PlaybackState) => void) => {
      const room = getRoom(roomId)
      if (!room) {
        if (typeof callback === 'function') callback(false)
        return
      }
      joinRoom(roomId, socket.id)
      socket.join(roomId)
      if (typeof callback === 'function') callback(true, room.playback)
    })

    socket.on('leave-room', (roomId: string) => {
      const room = leaveRoom(roomId, socket.id)
      socket.leave(roomId)
      if (room) {
        io.to(roomId).emit('user-left', { socketId: socket.id })
      }
    })

    const serverTime = () => Date.now()

    socket.on('play', (currentTime: number) => {
      const roomIds = getRoomIdsForSocket(socket)
      for (const roomId of roomIds) {
        const room = getRoom(roomId)
        if (!room || room.hostSocketId !== socket.id) continue
        const st = serverTime()
        setRoomPlayback(roomId, { playing: true, currentTime, lastSyncAt: st, serverTime: st })
        io.to(roomId).emit('play', { currentTime, serverTime: st })
      }
    })

    socket.on('pause', (currentTime: number) => {
      const roomIds = getRoomIdsForSocket(socket)
      for (const roomId of roomIds) {
        const room = getRoom(roomId)
        if (!room || room.hostSocketId !== socket.id) continue
        const st = serverTime()
        setRoomPlayback(roomId, { playing: false, currentTime, lastSyncAt: st, serverTime: st })
        io.to(roomId).emit('pause', { currentTime, serverTime: st })
      }
    })

    socket.on('seek', (currentTime: number) => {
      const roomIds = getRoomIdsForSocket(socket)
      for (const roomId of roomIds) {
        const room = getRoom(roomId)
        if (!room || room.hostSocketId !== socket.id) continue
        const st = serverTime()
        setRoomPlayback(roomId, { currentTime, lastSyncAt: st, serverTime: st })
        io.to(roomId).emit('seek', { currentTime, serverTime: st })
      }
    })

    socket.on('disconnect', () => {
      const result = removeSocketFromAllRooms(socket.id)
      if (result) {
        const { room, roomId } = result
        const wasHost = room.hostSocketId === socket.id
        if (wasHost && room.guestSocketIds.size > 0) {
          const newHostId = promoteGuestToHost(roomId)
          if (newHostId) {
            io.to(roomId).emit('host-changed', { newHostSocketId: newHostId })
          }
        }
        io.to(roomId).emit('user-left', { socketId: socket.id })
      }
    })
  })
}

function getRoomIdsForSocket(socket: Socket): string[] {
  const rooms = socket.rooms
  const ids: string[] = []
  for (const r of rooms) {
    if (r !== socket.id) ids.push(r)
  }
  return ids
}

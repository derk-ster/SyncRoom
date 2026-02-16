/**
 * Socket.io event handlers: create-room, join-room, leave-room, play, pause, seek.
 * Only host can emit play/pause/seek; server broadcasts to entire room with serverTime for sync.
 */

import type { Server, Socket } from 'socket.io'
import { generateSimpleRoomId } from '../lib/roomId.js'
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  removeSocketFromAllRooms,
  setRoomPlayback,
  setRoomName,
  promoteGuestToHost,
} from './rooms.js'
import type { PlaybackState } from '../types.js'

function emitRoomParticipants(io: Server, roomId: string): void {
  const room = getRoom(roomId)
  if (room) {
    const count = room.guestSocketIds.size + 1
    io.to(roomId).emit('room-participants', { count })
  }
}

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    socket.on('create-room', (callback?: (roomId: string, participantCount?: number) => void) => {
      const roomId = generateSimpleRoomId()
      createRoom(roomId, socket.id)
      socket.join(roomId)
      if (typeof callback === 'function') callback(roomId, 1)
      emitRoomParticipants(io, roomId)
    })

    socket.on('join-room', (roomId: string, callback?: (ok: boolean, state?: PlaybackState, roomName?: string, participantCount?: number) => void) => {
      const room = getRoom(roomId)
      if (!room) {
        if (typeof callback === 'function') callback(false)
        return
      }
      joinRoom(roomId, socket.id)
      socket.join(roomId)
      const count = room.guestSocketIds.size + 1
      if (typeof callback === 'function') callback(true, room.playback, room.roomName, count)
      emitRoomParticipants(io, roomId)
    })

    socket.on('leave-room', (roomId: string) => {
      const room = leaveRoom(roomId, socket.id)
      socket.leave(roomId)
      if (room) {
        io.to(roomId).emit('user-left', { socketId: socket.id })
        emitRoomParticipants(io, roomId)
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

    socket.on('set-room-name', (roomId: string, roomName: string) => {
      const room = getRoom(roomId)
      if (!room || room.hostSocketId !== socket.id) return
      setRoomName(roomId, roomName ?? '')
      io.to(roomId).emit('room-name-changed', { roomName: room.roomName })
    })

    socket.on('get-room-guests', (roomId: string, callback?: (guestSocketIds: string[]) => void) => {
      const room = getRoom(roomId)
      if (!room || room.hostSocketId !== socket.id || typeof callback !== 'function') {
        if (typeof callback === 'function') callback([])
        return
      }
      callback(Array.from(room.guestSocketIds))
    })

    socket.on('screen-offer', (payload: { roomId: string; toSocketId: string; offer: object }) => {
      io.to(payload.toSocketId).emit('screen-offer', { fromSocketId: socket.id, roomId: payload.roomId, offer: payload.offer })
    })

    socket.on('screen-answer', (payload: { roomId: string; toSocketId: string; answer: object }) => {
      io.to(payload.toSocketId).emit('screen-answer', { fromSocketId: socket.id, roomId: payload.roomId, answer: payload.answer })
    })

    socket.on('screen-ice', (payload: { roomId: string; toSocketId: string; candidate: object }) => {
      io.to(payload.toSocketId).emit('screen-ice', { fromSocketId: socket.id, roomId: payload.roomId, candidate: payload.candidate })
    })

    socket.on('screen-share-stopped', (roomId: string) => {
      socket.to(roomId).emit('screen-share-stopped', { roomId })
    })

    socket.on('disconnect', () => {
      const result = removeSocketFromAllRooms(socket.id)
      if (result) {
        const { room, roomId } = result
        const wasHost = room.hostSocketId === socket.id
        if (wasHost) io.to(roomId).emit('screen-share-stopped', { roomId })
        if (wasHost && room.guestSocketIds.size > 0) {
          const newHostId = promoteGuestToHost(roomId)
          if (newHostId) {
            io.to(roomId).emit('host-changed', { newHostSocketId: newHostId })
          }
        }
        io.to(roomId).emit('user-left', { socketId: socket.id })
        emitRoomParticipants(io, roomId)
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

/**
 * In-memory room store.
 * Maps roomId -> RoomData. For production, consider Redis or similar for multi-instance.
 */

import type { RoomData, PlaybackState } from '../types.js'

const rooms = new Map<string, RoomData>()

const defaultPlayback = (): PlaybackState => ({
  playing: false,
  currentTime: 0,
  lastSyncAt: 0,
  serverTime: Date.now(),
})

export function createRoom(roomId: string, hostSocketId: string): RoomData {
  const room: RoomData = {
    roomId,
    hostSocketId,
    guestSocketIds: new Set(),
    playback: defaultPlayback(),
    roomName: '',
  }
  rooms.set(roomId, room)
  return room
}

/** Create a room with no host yet (for REST API). First socket to claim becomes host. */
export function createRoomPending(roomId: string): RoomData {
  const room: RoomData = {
    roomId,
    hostSocketId: '', // empty = pending claim
    guestSocketIds: new Set(),
    playback: defaultPlayback(),
    roomName: '',
  }
  rooms.set(roomId, room)
  return room
}

export function getRoom(roomId: string): RoomData | undefined {
  return rooms.get(roomId)
}

export function joinRoom(roomId: string, socketId: string): RoomData | null {
  const room = rooms.get(roomId)
  if (!room) return null
  if (room.hostSocketId === '') {
    room.hostSocketId = socketId
    return room
  }
  if (socketId === room.hostSocketId) return room
  room.guestSocketIds.add(socketId)
  return room
}

/** When the host leaves, the room is deleted and its ID can be generated again for a new room. */
export function leaveRoom(roomId: string, socketId: string): RoomData | null {
  const room = rooms.get(roomId)
  if (!room) return null
  if (room.hostSocketId && socketId === room.hostSocketId) {
    rooms.delete(roomId)
    return null
  }
  room.guestSocketIds.delete(socketId)
  return room
}

export function removeSocketFromAllRooms(socketId: string): { room: RoomData; roomId: string } | null {
  for (const [roomId, room] of rooms.entries()) {
    if (room.hostSocketId === socketId) {
      rooms.delete(roomId)
      return { room, roomId }
    }
    if (room.guestSocketIds.has(socketId)) {
      room.guestSocketIds.delete(socketId)
      return { room, roomId }
    }
  }
  return null
}

export function setRoomPlayback(roomId: string, playback: Partial<PlaybackState>): RoomData | undefined {
  const room = rooms.get(roomId)
  if (!room) return undefined
  room.playback = { ...room.playback, ...playback, serverTime: Date.now() }
  return room
}

export function getRoomPlayback(roomId: string): PlaybackState | undefined {
  return rooms.get(roomId)?.playback
}

/**
 * Promote the first guest to host when current host disconnects.
 * Returns new host socket id or null if no guests.
 */
export function promoteGuestToHost(roomId: string): string | null {
  const room = rooms.get(roomId)
  if (!room) return null
  const next = room.guestSocketIds.keys().next()
  if (next.done) return null
  const newHostId = next.value
  room.guestSocketIds.delete(newHostId)
  room.hostSocketId = newHostId
  return newHostId
}

export function getActiveRoomIds(): string[] {
  return Array.from(rooms.keys())
}

export function setRoomName(roomId: string, roomName: string): RoomData | undefined {
  const room = rooms.get(roomId)
  if (!room) return undefined
  room.roomName = roomName ?? ''
  return room
}

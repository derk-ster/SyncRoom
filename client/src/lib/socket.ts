/**
 * Socket.io client for SyncRoom.
 * Connects to backend; used by useSocket hook and Room page for create/join/sync.
 */

import { io, type Socket } from 'socket.io-client'
import { API_URL } from './constants'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket
  socket = io(API_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000,
  })
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Hook to access the shared Socket.io connection and room/sync state.
 * Room page uses this to create/join room and subscribe to play/pause/seek.
 */

import { useEffect, useCallback } from 'react'
import { connectSocket, getSocket } from '@/lib/socket'

export function useSocket() {
  useEffect(() => {
    connectSocket()
    return () => {
      // Do not disconnect on unmount; other components may use the same socket.
    }
  }, [])

  const socket = getSocket()

  const createRoom = useCallback((onCreated: (roomId: string) => void) => {
    const s = getSocket()
    if (!s) return
    s.emit('create-room', (roomId: string) => onCreated(roomId))
  }, [])

  const joinRoom = useCallback(
    (roomId: string, onJoined: (ok: boolean, playback?: { playing: boolean; currentTime: number; serverTime: number }) => void) => {
      const s = getSocket()
      if (!s) return
      s.emit('join-room', roomId, (ok: boolean, state?: { playing: boolean; currentTime: number; lastSyncAt: number; serverTime: number }) => {
        if (ok && state) onJoined(true, { playing: state.playing, currentTime: state.currentTime, serverTime: state.serverTime })
        else onJoined(ok)
      })
    },
    []
  )

  const leaveRoom = useCallback((roomId: string) => {
    const s = getSocket()
    if (s) s.emit('leave-room', roomId)
  }, [])

  const emitPlay = useCallback((currentTime: number) => {
    getSocket()?.emit('play', currentTime)
  }, [])

  const emitPause = useCallback((currentTime: number) => {
    getSocket()?.emit('pause', currentTime)
  }, [])

  const emitSeek = useCallback((currentTime: number) => {
    getSocket()?.emit('seek', currentTime)
  }, [])

  return {
    socket,
    connected: !!socket?.connected,
    createRoom,
    joinRoom,
    leaveRoom,
    emitPlay,
    emitPause,
    emitSeek,
  }
}

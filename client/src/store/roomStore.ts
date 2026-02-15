import { create } from 'zustand'

/**
 * Room-level state used across the app.
 * Phase 2: client-only (no backend). Phase 3+: synced with server.
 */
export interface RoomState {
  roomId: string | null
  isHost: boolean
  playing: boolean
  currentTime: number
  lastSyncAt: number | null
  setRoom: (roomId: string, isHost: boolean) => void
  setPlayback: (playing: boolean, currentTime: number, lastSyncAt?: number) => void
  setHost: (isHost: boolean) => void
  leaveRoom: () => void
}

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  isHost: false,
  playing: false,
  currentTime: 0,
  lastSyncAt: null,

  setRoom: (roomId, isHost) =>
    set({ roomId, isHost, playing: false, currentTime: 0, lastSyncAt: null }),

  setPlayback: (playing, currentTime, lastSyncAt) =>
    set((s) => ({
      playing,
      currentTime,
      lastSyncAt: lastSyncAt ?? s.lastSyncAt,
    })),

  setHost: (isHost) => set({ isHost }),

  leaveRoom: () =>
    set({
      roomId: null,
      isHost: false,
      playing: false,
      currentTime: 0,
      lastSyncAt: null,
    }),
}))

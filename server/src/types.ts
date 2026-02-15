/**
 * Shared types for server-side room and sync logic.
 */

export interface PlaybackState {
  playing: boolean
  currentTime: number
  lastSyncAt: number
  serverTime: number
}

export interface RoomData {
  roomId: string
  hostSocketId: string
  guestSocketIds: Set<string>
  playback: PlaybackState
  roomName: string
}

export type SyncEvent = 
  | { type: 'play'; currentTime: number; serverTime: number }
  | { type: 'pause'; currentTime: number; serverTime: number }
  | { type: 'seek'; currentTime: number; serverTime: number }
  | { type: 'state'; playback: PlaybackState }

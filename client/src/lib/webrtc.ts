/**
 * Phase 6 (Optional): WebRTC Data Channel for P2P sync.
 * Same sync semantics as Socket.io (play, pause, seek, drift-correction).
 * Use when peer connection is ready; fallback to Socket.io otherwise.
 *
 * Architecture:
 * - Signaling via Socket.io (exchange SDP/candidates).
 * - Host creates one DataChannel; guests connect to host.
 * - Messages: { type: 'play'|'pause'|'seek'|'drift-correction', payload }
 */

export type WebRTCSyncMessage =
  | { type: 'play'; currentTime: number; serverTime: number }
  | { type: 'pause'; currentTime: number; serverTime: number }
  | { type: 'seek'; currentTime: number; serverTime: number }
  | { type: 'drift-correction'; playing: boolean; currentTime: number; serverTime: number }

export function isWebRTCSupported(): boolean {
  return typeof RTCPeerConnection !== 'undefined' && typeof RTCDataChannel !== 'undefined'
}

/**
 * Stub: create peer connection and data channel.
 * Full implementation would:
 * - Create RTCPeerConnection with STUN (e.g. stun:stun.l.google.com:19302)
 * - Create RTCDataChannel for host; wait for channel on guest
 * - Send/receive WebRTCSyncMessage over the channel
 * - Fall back to Socket.io when channel is not open
 */
export function createSyncChannel(_isHost: boolean): {
  send: (msg: WebRTCSyncMessage) => void
  onMessage: (cb: (msg: WebRTCSyncMessage) => void) => () => void
  close: () => void
} {
  return {
    send: () => {},
    onMessage: () => () => {},
    close: () => {},
  }
}

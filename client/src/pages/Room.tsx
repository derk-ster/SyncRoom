import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRoomStore } from '@/store/roomStore'
import { useSocket } from '@/hooks/useSocket'
import { getSocket } from '@/lib/socket'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

/**
 * Room page: Host controls playback; Guests receive sync events.
 * Socket.io: create-room / join-room on mount; host emits play/pause/seek; all receive and apply with serverTime.
 */

const DEMO_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isHost = searchParams.get('host') === '1'
  const { setRoom, leaveRoom, playing, currentTime, setPlayback, setHost } = useRoomStore()
  const { createRoom, joinRoom, leaveRoom: socketLeaveRoom, emitPlay, emitPause, emitSeek, connected } = useSocket()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(true)
  const hasInitiallyJoined = useRef(false)

  // Set room in store and join/create via socket
  useEffect(() => {
    if (!roomId) return

    if (isHost && roomId === 'create') {
      createRoom((newRoomId) => {
        setRoom(newRoomId, true)
        setJoining(false)
        navigate(`/room/${newRoomId}?host=1`, { replace: true })
      })
      return
    }

    if (isHost) {
      hasInitiallyJoined.current = true
      setRoom(roomId, true)
      setJoining(false)
      return
    }

    if (!isHost) {
      hasInitiallyJoined.current = false
      joinRoom(roomId, (ok, playback) => {
        setJoining(false)
        hasInitiallyJoined.current = true
        if (!ok) {
          setJoinError('Room not found or invalid.')
          return
        }
        setRoom(roomId, false)
        if (playback) {
          setPlayback(playback.playing, playback.currentTime, playback.serverTime)
        }
      })
    }

    const socket = getSocket()
    const onReconnect = () => {
      if (!roomId || roomId === 'create' || !hasInitiallyJoined.current) return
      joinRoom(roomId, (ok, playback) => {
        if (ok && playback) {
          setPlayback(playback.playing, playback.currentTime, playback.serverTime)
        }
      })
    }
    socket?.on('connect', onReconnect)

    return () => {
      socket?.off('connect', onReconnect)
      if (roomId && roomId !== 'create') socketLeaveRoom(roomId)
      leaveRoom()
    }
  }, [roomId, isHost, createRoom, joinRoom, socketLeaveRoom, setRoom, leaveRoom, navigate, setPlayback])

  // Apply playback state to video element (sync from store)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (Math.abs(video.currentTime - currentTime) > 0.5) {
      video.currentTime = currentTime
    }
    if (playing) video.play().catch(() => {})
    else video.pause()
  }, [playing, currentTime])

  // Socket listeners: play, pause, seek, host-changed
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !roomId) return

    const onPlay = (payload: { currentTime: number; serverTime: number }) => {
      setPlayback(true, payload.currentTime, payload.serverTime)
    }
    const onPause = (payload: { currentTime: number; serverTime: number }) => {
      setPlayback(false, payload.currentTime, payload.serverTime)
    }
    const onSeek = (payload: { currentTime: number; serverTime: number }) => {
      setPlayback(playing, payload.currentTime, payload.serverTime)
    }

    const onDriftCorrection = (payload: { playing: boolean; currentTime: number; serverTime: number }) => {
      setPlayback(payload.playing, payload.currentTime, payload.serverTime)
    }
    const onHostChanged = (payload: { newHostSocketId: string }) => {
      setHost(socket.id === payload.newHostSocketId)
    }

    socket.on('play', onPlay)
    socket.on('pause', onPause)
    socket.on('seek', onSeek)
    socket.on('drift-correction', onDriftCorrection)
    socket.on('host-changed', onHostChanged)

    return () => {
      socket.off('play', onPlay)
      socket.off('pause', onPause)
      socket.off('seek', onSeek)
      socket.off('drift-correction', onDriftCorrection)
      socket.off('host-changed', onHostChanged)
    }
  }, [roomId, playing, setPlayback, setHost])

  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    const t = video.currentTime
    const next = !playing
    setPlayback(next, t, Date.now())
    if (next) emitPlay(t)
    else emitPause(t)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value)
    const video = videoRef.current
    if (video) video.currentTime = t
    setPlayback(playing, t, Date.now())
    emitSeek(t)
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !isHost) return
    setPlayback(!video.paused, video.currentTime)
  }

  const handleLeave = () => navigate('/')

  if (!roomId) return null

  if (joining) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sync-bg">
        <LoadingSkeleton />
      </div>
    )
  }

  if (joinError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sync-bg gap-4">
        <p className="text-red-400">{joinError}</p>
        <button type="button" onClick={() => navigate('/')} className="text-sm px-4 py-2 rounded-lg border border-white/10">
          Back home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-sync-bg">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% -20%, rgba(99, 102, 241, 0.12), transparent 50%),
            linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)
          `,
        }}
      />

      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-[var(--color-text)]">Room: {roomId}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[var(--color-text-muted)]">
            {isHost ? 'Host' : 'Guest'}
          </span>
          {isHost && (
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/room/${roomId}`
                navigator.clipboard.writeText(url).then(() => { /* optional: toast */ })
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5"
            >
              Copy room link
            </button>
          )}
          {!connected && <span className="text-xs text-amber-400">Reconnecting…</span>}
        </div>
        <button
          type="button"
          onClick={handleLeave}
          className="text-sm px-4 py-2 rounded-lg border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5 transition-colors"
        >
          Leave
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key="room-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-3xl rounded-2xl overflow-hidden bg-black/40 border border-white/10 backdrop-blur-sm"
          >
          <video
            ref={videoRef}
            className="w-full aspect-video bg-black"
            onTimeUpdate={handleTimeUpdate}
            playsInline
            controls={false}
            src={DEMO_VIDEO_URL}
          >
            Your browser does not support the video tag.
          </video>

          <div className="p-4 flex flex-col gap-4">
            {isHost ? (
              <>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    className="px-6 py-2 rounded-xl font-medium bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white"
                  >
                    {playing ? 'Pause' : 'Play'}
                  </button>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {currentTime.toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3600}
                  step={0.1}
                  value={Math.min(currentTime, 3600)}
                  onChange={handleSeek}
                  className="w-full h-2 rounded-full appearance-none bg-white/10 accent-[#6366f1]"
                />
              </>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                {playing ? 'Playing' : 'Paused'} at {currentTime.toFixed(1)}s — synced with host.
              </p>
            )}
          </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

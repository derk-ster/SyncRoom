import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRoomStore } from '@/store/roomStore'
import { useSocket } from '@/hooks/useSocket'
import { getSocket } from '@/lib/socket'
import { wakeServer } from '@/lib/api'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

/**
 * Room page: Host controls playback; Guests receive sync events.
 * Socket.io: create-room / join-room on mount; host emits play/pause/seek; all receive and apply with serverTime.
 */

const DEMO_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isHost = searchParams.get('host') === '1'
  const { setRoom, leaveRoom, playing, currentTime, lastSyncAt, roomName, setRoomName, setPlayback, setHost } = useRoomStore()
  const { createRoom, joinRoom, leaveRoom: socketLeaveRoom, emitPlay, emitPause, emitSeek, emitSetRoomName, connected } = useSocket()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(true)
  const [copied, setCopied] = useState<'link' | 'id' | null>(null)
  const [displayTime, setDisplayTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSharing, setIsSharing] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [editingRoomName, setEditingRoomName] = useState(false)
  const [roomNameInput, setRoomNameInput] = useState('')
  const [showRoomNamePlain, setShowRoomNamePlain] = useState(true)
  const [showRoomIdPlain, setShowRoomIdPlain] = useState(true)
  const [participantCount, setParticipantCount] = useState(0)
  const [joinWaitSeconds, setJoinWaitSeconds] = useState(0)
  const shareStreamRef = useRef<MediaStream | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasInitiallyJoined = useRef(false)
  const joinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const joinWaitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const joinOnConnectRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (copied === null) return
    const t = setTimeout(() => setCopied(null), 2000)
    return () => clearTimeout(t)
  }, [copied])

  // Set room in store and join/create via socket
  useEffect(() => {
    if (!roomId) return

    if (isHost && roomId === 'create') {
      createRoom((newRoomId, count) => {
        setRoom(newRoomId, true)
        if (count != null) setParticipantCount(count)
        setJoining(false)
        navigate(`/room/${newRoomId}?host=1`, { replace: true })
      })
      return
    }

    // Host claiming a room created via API, or guest joining: wake server then join via socket
    if (isHost && roomId !== 'create') {
      setJoinError(null)
      setJoinWaitSeconds(0)
      const waitInterval = setInterval(() => setJoinWaitSeconds((s) => s + 1), 1000)
      joinWaitIntervalRef.current = waitInterval
      const timeout = setTimeout(() => {
        joinWaitIntervalRef.current && clearInterval(joinWaitIntervalRef.current)
        joinWaitIntervalRef.current = null
        setJoining((prev) => {
          if (!prev) return prev
          setJoinError('Connection timed out. Check your connection and try again.')
          return false
        })
      }, 15000)
      joinTimeoutRef.current = timeout
      const clearJoinTimers = () => {
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current)
          joinTimeoutRef.current = null
        }
        if (joinWaitIntervalRef.current) {
          clearInterval(joinWaitIntervalRef.current)
          joinWaitIntervalRef.current = null
        }
      }
      const onJoined = (ok: boolean, playback?: { playing: boolean; currentTime: number; serverTime: number }, name?: string, count?: number) => {
        clearJoinTimers()
        setJoining(false)
        hasInitiallyJoined.current = true
        if (!ok) {
          setJoinError('Room not found or invalid.')
          return
        }
        setRoom(roomId, true)
        if (name !== undefined) setRoomName(name ?? '')
        if (count != null) setParticipantCount(count)
        if (playback) setPlayback(playback.playing, playback.currentTime, playback.serverTime)
      }
      const doJoin = () => joinRoom(roomId, onJoined)
      joinOnConnectRef.current = doJoin
      wakeServer().then(() => {
        const socket = getSocket()
        if (socket?.connected) doJoin()
        else socket?.once('connect', doJoin)
      })
      return
    }

    if (!isHost) {
      setJoinError(null)
      hasInitiallyJoined.current = false
      setJoinWaitSeconds(0)
      const waitInterval = setInterval(() => setJoinWaitSeconds((s) => s + 1), 1000)
      joinWaitIntervalRef.current = waitInterval
      const timeout = setTimeout(() => {
        joinWaitIntervalRef.current && clearInterval(joinWaitIntervalRef.current)
        joinWaitIntervalRef.current = null
        setJoining((prev) => {
          if (!prev) return prev
          setJoinError('Connection timed out. Check the room ID and your connection, then try again.')
          return false
        })
      }, 15000)
      joinTimeoutRef.current = timeout
      const clearJoinTimers = () => {
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current)
          joinTimeoutRef.current = null
        }
        if (joinWaitIntervalRef.current) {
          clearInterval(joinWaitIntervalRef.current)
          joinWaitIntervalRef.current = null
        }
      }
      const onJoined = (ok: boolean, playback?: { playing: boolean; currentTime: number; serverTime: number }, name?: string, count?: number) => {
        clearJoinTimers()
        setJoining(false)
        hasInitiallyJoined.current = true
        if (!ok) {
          setJoinError('Room not found or invalid.')
          return
        }
        setRoom(roomId, false)
        if (name !== undefined) setRoomName(name ?? '')
        if (count != null) setParticipantCount(count)
        if (playback) setPlayback(playback.playing, playback.currentTime, playback.serverTime)
      }
      const doJoin = () => joinRoom(roomId, onJoined)
      joinOnConnectRef.current = doJoin
      wakeServer().then(() => {
        const socket = getSocket()
        if (socket?.connected) doJoin()
        else socket?.once('connect', doJoin)
      })
    }

    const socket = getSocket()
    const onReconnect = () => {
      if (!roomId || roomId === 'create' || !hasInitiallyJoined.current) return
      joinRoom(roomId, (ok, playback, _name, count) => {
        if (ok && playback) {
          setPlayback(playback.playing, playback.currentTime, playback.serverTime)
        }
        if (count != null) setParticipantCount(count)
      })
    }
    socket?.on('connect', onReconnect)

    return () => {
      socket?.off('connect', onReconnect)
      if (joinOnConnectRef.current) {
        socket?.off('connect', joinOnConnectRef.current)
        joinOnConnectRef.current = null
      }
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current)
        joinTimeoutRef.current = null
      }
      if (joinWaitIntervalRef.current) {
        clearInterval(joinWaitIntervalRef.current)
        joinWaitIntervalRef.current = null
      }
      if (roomId && roomId !== 'create') socketLeaveRoom(roomId)
      leaveRoom()
    }
  }, [roomId, isHost, createRoom, joinRoom, socketLeaveRoom, setRoom, setRoomName, leaveRoom, navigate, setPlayback])

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

  // Live time display: host from video, guest extrapolates when playing
  useEffect(() => {
    const video = videoRef.current
    if (isHost && video) {
      const onTimeUpdate = () => setDisplayTime(video.currentTime)
      video.addEventListener('timeupdate', onTimeUpdate)
      setDisplayTime(video.currentTime)
      return () => video.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [isHost])

  useEffect(() => {
    if (isHost) return
    if (!playing || lastSyncAt == null) {
      setDisplayTime(currentTime)
      return
    }
    const interval = setInterval(() => {
      const elapsed = (Date.now() - lastSyncAt) / 1000
      setDisplayTime(currentTime + elapsed)
    }, 100)
    return () => clearInterval(interval)
  }, [isHost, playing, currentTime, lastSyncAt])

  useEffect(() => {
    setDisplayTime(currentTime)
  }, [currentTime])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onLoadedMetadata = () => setDuration(video.duration)
    video.addEventListener('loadedmetadata', onLoadedMetadata)
    if (video.duration && !Number.isNaN(video.duration)) setDuration(video.duration)
    return () => video.removeEventListener('loadedmetadata', onLoadedMetadata)
  }, [])

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
      // Host is source of truth — ignore drift correction to avoid bar jumping back (server only has last play/pause/seek time)
      if (isHost) return
      setPlayback(payload.playing, payload.currentTime, payload.serverTime)
    }
    const onHostChanged = (payload: { newHostSocketId: string }) => {
      setHost(socket.id === payload.newHostSocketId)
    }
    const onRoomNameChanged = (payload: { roomName: string }) => {
      setRoomName(payload.roomName)
    }
    const onRoomParticipants = (payload: { count: number }) => {
      setParticipantCount(payload.count)
    }

    socket.on('play', onPlay)
    socket.on('pause', onPause)
    socket.on('seek', onSeek)
    socket.on('drift-correction', onDriftCorrection)
    socket.on('host-changed', onHostChanged)
    socket.on('room-name-changed', onRoomNameChanged)
    socket.on('room-participants', onRoomParticipants)

    return () => {
      socket.off('play', onPlay)
      socket.off('pause', onPause)
      socket.off('seek', onSeek)
      socket.off('drift-correction', onDriftCorrection)
      socket.off('host-changed', onHostChanged)
      socket.off('room-name-changed', onRoomNameChanged)
      socket.off('room-participants', onRoomParticipants)
    }
  }, [roomId, playing, isHost, setPlayback, setHost, setRoomName])

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

  const handleShareScreen = async () => {
    const video = videoRef.current
    if (!video) return
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      shareStreamRef.current?.getTracks().forEach((t) => t.stop())
      shareStreamRef.current = stream
      video.srcObject = stream
      video.src = ''
      setIsSharing(true)
      await video.play()
      setPlayback(true, 0, Date.now())
      emitPlay(0)
    } catch (err) {
      console.error('Share screen failed:', err)
    }
  }

  const handleStopSharing = () => {
    const video = videoRef.current
    shareStreamRef.current?.getTracks().forEach((t) => t.stop())
    shareStreamRef.current = null
    if (video) {
      video.srcObject = null
      video.src = DEMO_VIDEO_URL
    }
    setIsSharing(false)
  }

  const handleFullscreen = () => {
    const container = containerRef.current
    if (!container) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }

  const handleVolumeToggle = () => {
    const video = videoRef.current
    if (!video) return
    if (isMuted) {
      video.muted = false
      video.volume = volume
      setIsMuted(false)
    } else {
      video.muted = true
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    const video = videoRef.current
    if (video) {
      video.volume = v
      video.muted = false
      setIsMuted(false)
    }
    setVolume(v)
  }

  const displayRoomName = (roomName.trim() || roomId) ?? ''

  const maskText = (text: string) => text.replace(/./g, '•')

  const startEditingRoomName = () => {
    if (!isHost) return
    setRoomNameInput(displayRoomName)
    setEditingRoomName(true)
  }

  const saveRoomName = () => {
    const trimmed = roomNameInput.trim()
    if (isHost && roomId && trimmed) {
      emitSetRoomName(roomId, trimmed)
      setRoomName(trimmed)
    }
    setEditingRoomName(false)
  }

  if (!roomId) return null

  if (joining) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sync-bg gap-6 p-6">
        <LoadingSkeleton />
        <p className="text-sm text-[var(--color-text-muted)]">
          Estimated wait: usually 2–5 seconds
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {joinWaitSeconds > 0 && `Waiting… ${joinWaitSeconds}s`}
        </p>
        <button
          type="button"
          onClick={() => {
            if (joinTimeoutRef.current) {
              clearTimeout(joinTimeoutRef.current)
              joinTimeoutRef.current = null
            }
            if (joinWaitIntervalRef.current) {
              clearInterval(joinWaitIntervalRef.current)
              joinWaitIntervalRef.current = null
            }
            if (joinOnConnectRef.current) {
              getSocket()?.off('connect', joinOnConnectRef.current)
              joinOnConnectRef.current = null
            }
            setJoining(false)
            navigate('/')
          }}
          className="text-sm px-4 py-2 rounded-lg border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
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

      <header className="flex items-center justify-between p-4 border-b border-white/10 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--color-text)]">Room:</span>
            {editingRoomName ? (
              <input
                type="text"
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                onBlur={saveRoomName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveRoomName()
                  if (e.key === 'Escape') setEditingRoomName(false)
                }}
                autoFocus
                className="font-semibold text-[var(--color-text)] bg-white/10 border border-white/20 rounded px-2 py-0.5 min-w-[120px] focus:outline-none focus:border-[var(--color-accent)]"
              />
            ) : (
              <span
                role="button"
                tabIndex={0}
                onClick={startEditingRoomName}
                onDoubleClick={startEditingRoomName}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEditingRoomName() }}
                className={`font-semibold text-[var(--color-text)] tabular-nums ${isHost ? 'cursor-pointer hover:underline focus:outline-none focus:underline' : ''}`}
                title={isHost ? 'Click or double-click to rename' : undefined}
              >
                {showRoomNamePlain ? displayRoomName : maskText(displayRoomName)}
              </span>
            )}
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[var(--color-text-muted)]">
            {isHost ? 'Host' : 'Guest'}
          </span>
          {isHost && (
            <motion.button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/room/${roomId}`
                navigator.clipboard.writeText(url).then(() => setCopied('link'))
              }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5"
            >
              {copied === 'link' ? 'Copied!' : 'Copy room link'}
            </motion.button>
          )}
          {!connected && <span className="text-xs text-amber-400">Reconnecting…</span>}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 shrink">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowRoomNamePlain((v) => !v)}
              className="p-1.5 rounded border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5"
              title={showRoomNamePlain ? 'Hide room name' : 'Show room name'}
            >
              {showRoomNamePlain ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowRoomIdPlain((v) => !v)}
              className="p-1.5 rounded border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5"
              title={showRoomIdPlain ? 'Hide room ID' : 'Show room ID'}
            >
              {showRoomIdPlain ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              )}
            </button>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">
            {participantCount === 1 ? '1 person' : `${participantCount} people`} in room
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium text-[var(--color-text)] tabular-nums min-w-[8ch]">
            {showRoomIdPlain ? (roomId ?? '') : maskText(roomId ?? '')}
          </span>
          <motion.button
            type="button"
            onClick={() => {
              if (roomId) navigator.clipboard.writeText(roomId).then(() => setCopied('id'))
            }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5"
          >
            {copied === 'id' ? 'Copied!' : 'Copy room ID'}
          </motion.button>
          <button
            type="button"
            onClick={handleLeave}
            className="text-sm px-4 py-2 rounded-lg border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5 transition-colors"
            title={isHost ? 'Leave and end the room for everyone' : 'Leave the room'}
          >
            {isHost ? 'Leave and cancel room' : 'Leave'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            ref={containerRef}
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
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleShareScreen}
                      disabled={isSharing}
                      className="text-sm px-4 py-2 rounded-xl border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={handlePlayPause}
                      className="px-6 py-2 rounded-xl font-medium bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white"
                    >
                      {playing ? 'Pause' : 'Play'}
                    </button>
                    <button
                      type="button"
                      onClick={handleStopSharing}
                      disabled={!isSharing}
                      className="text-sm px-4 py-2 rounded-xl border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Stop sharing
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm tabular-nums text-[var(--color-text-muted)] min-w-[4ch]">
                      {formatTime(displayTime)}{duration > 0 ? ` / ${formatTime(duration)}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={handleFullscreen}
                      className="p-2 rounded-lg border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5"
                      title="Fullscreen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleVolumeToggle}
                        className="p-2 rounded-lg border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1.5 rounded-full appearance-none bg-white/10 accent-[var(--color-accent)]"
                      />
                    </div>
                  </div>
                </div>
                {(() => {
                  const max = duration > 0 ? duration : 3600
                  const value = Math.min(currentTime, max)
                  const seekPercent = max > 0 ? (value / max) * 100 : 0
                  return (
                    <div className="relative w-full h-2 rounded-full bg-white/10">
                      <div
                        className="absolute inset-y-0 left-0 rounded-l-full bg-[#6366f1] transition-[width] duration-100"
                        style={{ width: `${seekPercent}%` }}
                        aria-hidden
                      />
                      <input
                        type="range"
                        min={0}
                        max={max}
                        step={0.1}
                        value={value}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6366f1] [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#6366f1]"
                      />
                    </div>
                  )
                })()}
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-[var(--color-text-muted)]">
                  {playing ? 'Playing' : 'Paused'} — synced with host.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm tabular-nums text-[var(--color-text-muted)]">
                    {formatTime(displayTime)}{duration > 0 ? ` / ${formatTime(duration)}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={handleFullscreen}
                    className="p-2 rounded-lg border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5"
                    title="Fullscreen"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleVolumeToggle}
                    className="p-2 rounded-lg border border-white/10 text-[var(--color-text-muted)] hover:bg-white/5"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1.5 rounded-full appearance-none bg-white/10 accent-[var(--color-accent)]"
                  />
                </div>
              </div>
            )}
          </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

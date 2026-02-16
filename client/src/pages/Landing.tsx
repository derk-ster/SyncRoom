import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MouseLight } from '@/components/effects/MouseLight'
import { useParticleBurst } from '@/components/effects/ParticleBurst'
import { FallingCircles } from '@/components/effects/FallingCircles'
import { GradientBorderCard } from '@/components/ui/GradientBorderCard'
import { createRoomViaApi } from '@/lib/api'

const FADE_IN_DURATION = 2
const STAGGER_CHILDREN = 0.12
const UNDERLINE_DURATION = 0.6
const UNDERLINE_DELAY = FADE_IN_DURATION
const SYNC_JUMP_DELAY = UNDERLINE_DELAY + UNDERLINE_DURATION
const SYNC_JUMP_DURATION = 0.4

const JOIN_ROOM_ID_KEY = 'syncroom-join-room-id'

const DESC_WORDS =
  'Create a room, share the link, and control playback from one device. No streaming—just state sync across all screens.'.split(
    /\s+/
  )

/** Single word that jumps (0 → -6 → 0) when hovered; only this word animates. */
function HoverJumpWord({ word }: { word: string }) {
  const [jump, setJump] = useState(false)
  return (
    <motion.span
      className="inline-block cursor-default whitespace-pre"
      initial={{ y: 0 }}
      animate={{ y: jump ? [0, -6, 0] : 0 }}
      transition={{
        duration: SYNC_JUMP_DURATION,
        times: jump ? [0, 0.4, 1] : undefined,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      onHoverStart={() => setJump(true)}
      onAnimationComplete={() => setJump(false)}
    >
      {word}
    </motion.span>
  )
}

/** Format room ID as XXXX-XXXX (2 groups of 4 alphanumeric chars). */
function formatRoomIdInput(raw: string): string {
  const alphanumeric = raw.replace(/\W/g, '').slice(0, 8)
  const parts: string[] = []
  for (let i = 0; i < alphanumeric.length; i += 4) {
    parts.push(alphanumeric.slice(i, i + 4))
  }
  return parts.join('-')
}

/**
 * Landing page: Create Room and Join Room.
 * Phase 5: MouseLight, particle burst on click, gradient border cards.
 */
export default function Landing() {
  const navigate = useNavigate()
  const [roomIdInput, setRoomIdInput] = useState(() => {
    try {
      return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(JOIN_ROOM_ID_KEY) ?? '' : ''
    } catch {
      return ''
    }
  })
  const { canvasRef, burst } = useParticleBurst()

  useEffect(() => {
    try {
      if (roomIdInput) sessionStorage.setItem(JOIN_ROOM_ID_KEY, roomIdInput)
      else sessionStorage.removeItem(JOIN_ROOM_ID_KEY)
    } catch {
      /* ignore */
    }
  }, [roomIdInput])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [canvasRef])

  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateRoom = async (e: React.MouseEvent) => {
    burst(e.clientX, e.clientY)
    setCreateError(null)
    setIsCreating(true)
    try {
      const roomId = await createRoomViaApi()
      navigate(`/room/${roomId}?host=1`)
    } catch (err) {
      setCreateError('Could not create room. Check your connection and try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomIdInput(formatRoomIdInput(e.target.value))
  }

  const handleJoinRoom = (e?: React.MouseEvent) => {
    const value = roomIdInput.trim()
    if (!value) return
    if (e) burst(e.clientX, e.clientY)
    navigate(`/room/${value}`)
  }

  const handleClearRoomId = () => {
    setRoomIdInput('')
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: FADE_IN_DURATION, ease: 'easeOut' }}
    >
      <div
        className="fixed inset-0 -z-10 bg-sync-bg"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% -20%, rgba(99, 102, 241, 0.15), transparent 50%),
            radial-gradient(ellipse 80% 50% at 80% 50%, rgba(139, 92, 246, 0.08), transparent 50%),
            linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)
          `,
        }}
      />
      <FallingCircles />
      <MouseLight size={420} opacity={0.35} className="z-0" />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-10"
        aria-hidden
      />

      <motion.header
        className="py-6 px-4 text-center relative z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
      >
        <a href="/" className="text-xl font-bold tracking-tight text-[var(--color-text)]">
          SyncRoom
        </a>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Watch together, in perfect sync</p>
      </motion.header>

      <main className="flex-1 px-4 py-8 max-w-[720px] w-full mx-auto relative z-10">
        <motion.section
          className="text-center mb-12"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
        >
          <div className="inline-block mb-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
              One host. Everyone in{' '}
              <motion.span
                className="inline-block"
                initial={{ y: 0 }}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  delay: SYNC_JUMP_DELAY,
                  duration: SYNC_JUMP_DURATION,
                  times: [0, 0.4, 1],
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              >
                sync
              </motion.span>
              .
            </h1>
            <motion.div
              className="h-0.5 w-full rounded-full bg-gradient-to-r from-transparent via-[#6366f1] to-transparent mt-1"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: UNDERLINE_DURATION, delay: UNDERLINE_DELAY, ease: 'easeOut' }}
              style={{ transformOrigin: 'left' }}
            />
          </div>
          <motion.p
            className="text-base text-[var(--color-text-muted)] max-w-[480px] mx-auto leading-relaxed mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {DESC_WORDS.map((word, i) => (
              <span key={i}>
                <HoverJumpWord word={word} />
                {i < DESC_WORDS.length - 1 ? ' ' : ''}
              </span>
            ))}
          </motion.p>
        </motion.section>

        <motion.section
          className={`flex flex-col sm:flex-row gap-6 items-stretch ${createError ? 'pb-10' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <motion.div
            className="flex-1 relative"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.5, ease: 'easeOut' }}
          >
            <GradientBorderCard className="h-full" innerClassName="p-6 flex flex-col justify-between h-[220px]">
            <div>
              <div className="inline-block mb-2">
                <h2 className="text-lg font-semibold">Create a room</h2>
                <motion.div
                  className="h-0.5 w-full rounded-full bg-gradient-to-r from-transparent via-[#6366f1] to-transparent mt-0.5"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: UNDERLINE_DURATION, delay: UNDERLINE_DELAY, ease: 'easeOut' }}
                  style={{ transformOrigin: 'left' }}
                />
              </div>
              <p className="text-sm text-[var(--color-text-muted)] mb-4 leading-normal">
                You'll be the host and control play, pause, and seek for everyone.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <motion.button
                type="button"
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="px-6 py-3 rounded-xl font-medium bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-[var(--color-glow)] hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:cursor-not-allowed w-full sm:w-auto disabled:opacity-70"
                animate={isCreating ? { scale: [1, 1.02, 1], opacity: [0.9, 1, 0.9] } : {}}
                transition={{ duration: 1.2, repeat: isCreating ? Infinity : 0, ease: 'easeInOut' }}
              >
                {isCreating ? 'Creating…' : 'Create Room'}
              </motion.button>
              <p className="text-sm text-[var(--color-text-muted)] leading-normal">
                This will make you the host.
              </p>
            </div>
          </GradientBorderCard>
            {createError && (
              <p
                className="absolute left-0 top-full mt-2 text-sm text-red-400 w-full sm:max-w-[min(100%,theme(maxWidth.5xl))]"
                role="alert"
              >
                {createError}
              </p>
            )}
          </motion.div>

          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.5 + STAGGER_CHILDREN, ease: 'easeOut' }}
          >
            <GradientBorderCard className="h-full" innerClassName="p-6 flex flex-col justify-between h-[220px]">
            <div>
              <div className="inline-block mb-2">
                <h2 className="text-lg font-semibold">Join a room</h2>
                <motion.div
                  className="h-0.5 w-full rounded-full bg-gradient-to-r from-transparent via-[#6366f1] to-transparent mt-0.5"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: UNDERLINE_DURATION, delay: UNDERLINE_DELAY + STAGGER_CHILDREN, ease: 'easeOut' }}
                  style={{ transformOrigin: 'left' }}
                />
              </div>
              <p className="text-sm text-[var(--color-text-muted)] mb-4 leading-normal">
                Enter the room ID your host shared with you.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-4 flex-wrap">
                <input
                  type="text"
                  value={roomIdInput}
                  onChange={handleRoomIdChange}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  className="flex-1 min-w-[160px] px-4 py-3 rounded-xl bg-black/30 border border-[var(--color-surface-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono tracking-wider"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
                <button
                  type="button"
                  onClick={handleJoinRoom}
                  className="px-6 py-3 rounded-xl font-medium bg-[var(--color-surface)] border border-[var(--color-surface-border)] text-[var(--color-text)] hover:bg-white/10 transition-colors"
                >
                  Join
                </button>
              </div>
              <button
                type="button"
                onClick={handleClearRoomId}
                className="self-start text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Delete?
              </button>
            </div>
          </GradientBorderCard>
          </motion.div>
        </motion.section>
      </main>

      <motion.footer
        className="py-6 text-center text-sm text-[var(--color-text-muted)] relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.75, ease: 'easeOut' }}
      >
        <p>SyncRoom — Real-time playback sync. No video streaming.</p>
      </motion.footer>
    </motion.div>
  )
}

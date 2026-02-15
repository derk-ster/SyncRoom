import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { MouseLight } from '@/components/effects/MouseLight'
import { useParticleBurst } from '@/components/effects/ParticleBurst'
import { GradientBorderCard } from '@/components/ui/GradientBorderCard'

/** Format room ID with a dash every 4 alphanumeric chars (XXXX-XXXX-XXXX-XXXX). */
function formatRoomIdInput(raw: string): string {
  const alphanumeric = raw.replace(/\W/g, '').slice(0, 16)
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
  const [roomIdInput, setRoomIdInput] = useState('')
  const { canvasRef, burst } = useParticleBurst()

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

  const handleCreateRoom = (e: React.MouseEvent) => {
    burst(e.clientX, e.clientY)
    navigate('/room/create?host=1')
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

  return (
    <div className="min-h-screen flex flex-col relative">
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
      <MouseLight size={420} opacity={0.35} className="z-0" />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-10"
        aria-hidden
      />

      <header className="py-6 px-4 text-center relative z-10">
        <a href="/" className="text-xl font-bold tracking-tight text-[var(--color-text)]">
          SyncRoom
        </a>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Watch together, in perfect sync</p>
      </header>

      <main className="flex-1 px-4 py-8 max-w-[720px] w-full mx-auto relative z-10">
        <section className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            One host. Everyone in sync.
          </h1>
          <p className="text-base text-[var(--color-text-muted)] max-w-[480px] mx-auto leading-relaxed">
            Create a room, share the link, and control playback from one device. No streaming—just
            state sync across all screens.
          </p>
        </section>

        <section className="flex flex-col sm:flex-row gap-6">
          <GradientBorderCard className="flex-1" innerClassName="p-8">
            <h2 className="text-lg font-semibold mb-2">Create a room</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6 leading-normal">
              You'll be the host and control play, pause, and seek for everyone.
            </p>
            <button
              type="button"
              onClick={handleCreateRoom}
              className="px-6 py-3 rounded-xl font-medium bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-[var(--color-glow)] hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Create Room
            </button>
          </GradientBorderCard>

          <GradientBorderCard className="flex-1" innerClassName="p-8">
            <h2 className="text-lg font-semibold mb-2">Join a room</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6 leading-normal">
              Enter the room ID your host shared with you.
            </p>
            <div className="flex gap-4 flex-wrap">
              <input
                type="text"
                value={roomIdInput}
                onChange={handleRoomIdChange}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                maxLength={19}
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
          </GradientBorderCard>
        </section>
      </main>

      <footer className="py-6 text-center text-sm text-[var(--color-text-muted)] relative z-10">
        <p>SyncRoom — Real-time playback sync. No video streaming.</p>
      </footer>
    </div>
  )
}

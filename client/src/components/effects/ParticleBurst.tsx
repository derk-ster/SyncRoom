/**
 * Micro particle burst on click. Uses a small canvas for performance.
 * Renders a short burst of particles that fade and spread from click position.
 */

import { useRef, useCallback } from 'react'

const PARTICLE_COUNT = 12
const PARTICLE_LIFE_MS = 600

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

export function useParticleBurst() {
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const burst = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    const colors = ['rgba(99, 102, 241, 0.9)', 'rgba(139, 92, 246, 0.9)']
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5
      const speed = 2 + Math.random() * 4
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[i % colors.length],
      })
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx
        p.y += p.vy
        p.life -= 1 / (PARTICLE_LIFE_MS / 16)
        if (p.life <= 0) return false
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
        ctx.fill()
        return true
      })
      ctx.globalAlpha = 1
      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    animate()
  }, [])

  return { canvasRef, burst }
}

/**
 * Invisible overlay that captures clicks and renders particles on a canvas.
 * Place over the area where you want the effect (e.g. landing actions).
 */
export function ParticleBurstLayer({
  onBurst,
  className = '',
}: {
  onBurst?: (x: number, y: number) => void
  className?: string
}) {
  const { canvasRef, burst } = useParticleBurst()

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      burst(e.clientX, e.clientY)
      onBurst?.(e.clientX, e.clientY)
    },
    [burst, onBurst]
  )

  return (
    <div
      className={`absolute inset-0 ${className}`}
      onClick={handleClick}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        width={typeof document !== 'undefined' ? document.documentElement.clientWidth : 800}
        height={typeof document !== 'undefined' ? document.documentElement.clientHeight : 600}
      />
    </div>
  )
}

/**
 * Wrapper for a button that triggers particle burst on click.
 */
export function ButtonWithParticles({
  children,
  onClick,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { canvasRef, burst } = useParticleBurst()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    burst(e.clientX, e.clientY)
    onClick?.(e)
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full"
        width={200}
        height={60}
      />
      <button type="button" onClick={handleClick} className={className} {...props}>
        {children}
      </button>
    </div>
  )
}

/**
 * Mouse-tracking radial gradient that follows cursor.
 * Creates a soft spotlight / glow effect for a premium feel.
 */

import { useEffect, useRef, useCallback } from 'react'

interface MouseLightProps {
  className?: string
  size?: number
  opacity?: number
}

export function MouseLight({ className = '', size = 400, opacity = 0.4 }: MouseLightProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMove = useCallback(
    (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      el.style.setProperty('--mouse-x', `${x}px`)
      el.style.setProperty('--mouse-y', `${y}px`)
    },
    []
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('mousemove', handleMove)
    return () => el.removeEventListener('mousemove', handleMove)
  }, [handleMove])

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
      style={{
        background: `radial-gradient(
          ${size}px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
          rgba(99, 102, 241, ${opacity}) 0%,
          transparent 50%
        )`,
      }}
    />
  )
}

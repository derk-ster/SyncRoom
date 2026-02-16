/**
 * Circles that spawn in the top-left and top-right areas and slowly fall.
 * Same indigo/purple as the landing gradient.
 */
import { motion } from 'framer-motion'

const FALL_COLOR = 'rgba(99, 102, 241, 0.35)'

const CIRCLE_CONFIGS: { leftPercent: number; topPercent: number; sizePx: number; duration: number; delay: number }[] = [
  { leftPercent: 5, topPercent: 2, sizePx: 24, duration: 28, delay: 0 },
  { leftPercent: 12, topPercent: 0, sizePx: 16, duration: 32, delay: 3 },
  { leftPercent: 8, topPercent: 5, sizePx: 20, duration: 26, delay: 6 },
  { leftPercent: 18, topPercent: 3, sizePx: 14, duration: 30, delay: 1 },
  { leftPercent: 3, topPercent: 8, sizePx: 18, duration: 34, delay: 4 },
  { leftPercent: 88, topPercent: 1, sizePx: 22, duration: 27, delay: 2 },
  { leftPercent: 95, topPercent: 4, sizePx: 16, duration: 31, delay: 5 },
  { leftPercent: 82, topPercent: 6, sizePx: 20, duration: 29, delay: 0 },
  { leftPercent: 92, topPercent: 3, sizePx: 14, duration: 33, delay: 4 },
  { leftPercent: 78, topPercent: 0, sizePx: 26, duration: 25, delay: 7 },
  { leftPercent: 10, topPercent: 1, sizePx: 12, duration: 35, delay: 2 },
  { leftPercent: 85, topPercent: 5, sizePx: 18, duration: 28, delay: 3 },
]

export function FallingCircles() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden>
      {CIRCLE_CONFIGS.map((cfg, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${cfg.leftPercent}%`,
            top: `${cfg.topPercent}%`,
            width: cfg.sizePx,
            height: cfg.sizePx,
            background: FALL_COLOR,
            boxShadow: `0 0 ${cfg.sizePx}px ${FALL_COLOR}`,
          }}
          initial={{ y: 0 }}
          animate={{ y: '100vh' }}
          transition={{
            duration: cfg.duration,
            delay: cfg.delay,
            repeat: Infinity,
            repeatDelay: 0,
          }}
        />
      ))}
    </div>
  )
}

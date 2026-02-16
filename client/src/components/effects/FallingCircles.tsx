/**
 * Circles that spawn in the top-left and top-right areas and slowly fall.
 * Fade in only when about to fall; blurred/soft like the center gradient.
 */
import { motion } from 'framer-motion'

const FALL_COLOR = 'rgba(99, 102, 241, 0.4)'
const FALL_GLOW = 'rgba(99, 102, 241, 0.25)'

const CIRCLE_CONFIGS: { leftPercent: number; topPercent: number; sizePx: number; blurPx: number; duration: number; delay: number }[] = [
  { leftPercent: 5, topPercent: 2, sizePx: 18, blurPx: 12, duration: 28, delay: 0 },
  { leftPercent: 12, topPercent: 0, sizePx: 42, blurPx: 20, duration: 32, delay: 3 },
  { leftPercent: 8, topPercent: 5, sizePx: 28, blurPx: 14, duration: 26, delay: 6 },
  { leftPercent: 18, topPercent: 3, sizePx: 12, blurPx: 8, duration: 30, delay: 1 },
  { leftPercent: 3, topPercent: 8, sizePx: 36, blurPx: 18, duration: 34, delay: 4 },
  { leftPercent: 88, topPercent: 1, sizePx: 24, blurPx: 12, duration: 27, delay: 2 },
  { leftPercent: 95, topPercent: 4, sizePx: 32, blurPx: 16, duration: 31, delay: 5 },
  { leftPercent: 82, topPercent: 6, sizePx: 14, blurPx: 10, duration: 29, delay: 0 },
  { leftPercent: 92, topPercent: 3, sizePx: 48, blurPx: 22, duration: 33, delay: 4 },
  { leftPercent: 78, topPercent: 0, sizePx: 22, blurPx: 11, duration: 25, delay: 7 },
  { leftPercent: 10, topPercent: 1, sizePx: 8, blurPx: 6, duration: 35, delay: 2 },
  { leftPercent: 85, topPercent: 5, sizePx: 38, blurPx: 18, duration: 28, delay: 3 },
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
            boxShadow: `0 0 ${cfg.sizePx * 1.5}px ${cfg.sizePx}px ${FALL_GLOW}`,
            filter: `blur(${cfg.blurPx}px)`,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: '100vh', opacity: 1 }}
          transition={{
            duration: cfg.duration,
            delay: cfg.delay,
            repeat: Infinity,
            repeatDelay: 0,
            opacity: { duration: 1.5, delay: cfg.delay },
          }}
        />
      ))}
    </div>
  )
}

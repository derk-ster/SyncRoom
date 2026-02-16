/**
 * Circles that spawn in the top-left and top-right areas and slowly fall.
 * Groups of 3: each circle in a group starts 0.5s after the previous; next group starts 1s after the last in the previous group finishes.
 * Fade in when about to fall; blurred/soft like the center gradient.
 */
import { motion } from 'framer-motion'

const FALL_COLOR = 'rgba(99, 102, 241, 0.4)'
const FALL_GLOW = 'rgba(99, 102, 241, 0.25)'

const FALL_DURATION_S = 26
const STAGGER_S = 0.5
const GAP_AFTER_GROUP_S = 1
const GROUP_CYCLE_S = FALL_DURATION_S + STAGGER_S * 2 + GAP_AFTER_GROUP_S // last starts at 1s, lands at 1+26=27, gap 1 → next at 28

/** Position/size per circle. Groups of 3: indices 0,1,2 = group 0; 3,4,5 = group 1; etc. */
const CIRCLE_CONFIGS: { leftPercent: number; topPercent: number; sizePx: number; blurPx: number }[] = [
  { leftPercent: 5, topPercent: 2, sizePx: 18, blurPx: 12 },
  { leftPercent: 12, topPercent: 0, sizePx: 42, blurPx: 20 },
  { leftPercent: 8, topPercent: 5, sizePx: 28, blurPx: 14 },
  { leftPercent: 18, topPercent: 3, sizePx: 12, blurPx: 8 },
  { leftPercent: 3, topPercent: 8, sizePx: 36, blurPx: 18 },
  { leftPercent: 88, topPercent: 1, sizePx: 24, blurPx: 12 },
  { leftPercent: 95, topPercent: 4, sizePx: 32, blurPx: 16 },
  { leftPercent: 82, topPercent: 6, sizePx: 14, blurPx: 10 },
  { leftPercent: 92, topPercent: 3, sizePx: 48, blurPx: 22 },
  { leftPercent: 78, topPercent: 0, sizePx: 22, blurPx: 11 },
  { leftPercent: 10, topPercent: 1, sizePx: 8, blurPx: 6 },
  { leftPercent: 85, topPercent: 5, sizePx: 38, blurPx: 18 },
]

function getDelay(groupIndex: number, indexInGroup: number): number {
  return groupIndex * GROUP_CYCLE_S + indexInGroup * STAGGER_S
}

export function FallingCircles() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden>
      {CIRCLE_CONFIGS.map((cfg, i) => {
        const groupIndex = Math.floor(i / 3)
        const indexInGroup = i % 3
        const delay = getDelay(groupIndex, indexInGroup)
        return (
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
              duration: FALL_DURATION_S,
              delay,
              repeat: Infinity,
              repeatDelay: GAP_AFTER_GROUP_S + (2 - indexInGroup) * STAGGER_S, // so next group starts 1s after this group's last lands
              opacity: { duration: 1.5, delay },
            }}
          />
        )
      })}
    </div>
  )
}

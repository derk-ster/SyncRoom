/**
 * Circles that spawn in the top-left and top-right areas and slowly fall.
 * Groups of 3: each circle in a group starts 0.5s after the previous.
 * Next group starts 5s after the previous group starts; 1s gap after a group finishes before it repeats.
 * Circles sway slightly side-to-side as they fall.
 */
import { motion } from 'framer-motion'

const FALL_COLOR = 'rgba(99, 102, 241, 0.4)'
const FALL_GLOW = 'rgba(99, 102, 241, 0.25)'

const FALL_DURATION_S = 26
const STAGGER_S = 0.5
const STAGGER_BETWEEN_GROUPS_S = 3
const GAP_AFTER_GROUP_S = 1
const CYCLE_S = FALL_DURATION_S + STAGGER_S * 2 + GAP_AFTER_GROUP_S // last in group lands at 27s, +1s gap → 28s

/** Sway keyframes in px (right, left, right, back) over the fall. */
const SWAY_PX = [0, 14, -12, 8, 0]

/** Each group has a zone (left/right) and base position; the 3 circles are spread around that base. */
const GROUP_BASES = [
  { zone: 'left' as const, leftBase: 8, topBase: 2 },
  { zone: 'right' as const, leftBase: 88, topBase: 2 },
  { zone: 'left' as const, leftBase: 14, topBase: 5 },
  { zone: 'right' as const, leftBase: 82, topBase: 4 },
]

/** Spread offset from base for each of the 3 circles in a group (left%, top%). */
const SPREAD_OFFSETS = [
  { left: 0, top: 0 },
  { left: 5, top: 3 },
  { left: -4, top: 4 },
]

/** Size/blur per circle within each group (small, medium, large). */
const CIRCLE_SIZES = [
  { sizePx: 18, blurPx: 12 },
  { sizePx: 32, blurPx: 16 },
  { sizePx: 24, blurPx: 14 },
]

/** First run: group starts every 5s; within group stagger 0.5s. */
function getDelay(groupIndex: number, indexInGroup: number): number {
  return groupIndex * STAGGER_BETWEEN_GROUPS_S + indexInGroup * STAGGER_S
}

export function FallingCircles() {
  const circles: { leftPercent: number; topPercent: number; sizePx: number; blurPx: number; groupIndex: number; indexInGroup: number }[] = []
  GROUP_BASES.forEach((base, groupIndex) => {
    SPREAD_OFFSETS.forEach((offset, indexInGroup) => {
      const sizeConfig = CIRCLE_SIZES[indexInGroup]
      circles.push({
        leftPercent: base.leftBase + offset.left,
        topPercent: base.topBase + offset.top,
        sizePx: sizeConfig.sizePx,
        blurPx: sizeConfig.blurPx,
        groupIndex,
        indexInGroup,
      })
    })
  })

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden>
      {circles.map((cfg, i) => {
        const delay = getDelay(cfg.groupIndex, cfg.indexInGroup)
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
            initial={{ y: 0, x: 0, opacity: 0 }}
            animate={{
              y: '100vh',
              x: SWAY_PX.map((px) => `${px}px`),
              opacity: 1,
            }}
            transition={{
              duration: FALL_DURATION_S,
              delay,
              repeat: Infinity,
              repeatDelay: CYCLE_S - FALL_DURATION_S,
              opacity: { duration: 1.5, delay },
              x: { duration: FALL_DURATION_S, delay },
            }}
          />
        )
      })}
    </div>
  )
}

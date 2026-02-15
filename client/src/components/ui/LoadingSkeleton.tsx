/**
 * Simple loading skeleton for room join and connection states.
 */

import { motion } from 'framer-motion'

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <motion.div
        className="w-10 h-10 rounded-full border-2 border-[var(--color-accent)] border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      <p className="text-sm text-[var(--color-text-muted)]">Joining room…</p>
    </div>
  )
}

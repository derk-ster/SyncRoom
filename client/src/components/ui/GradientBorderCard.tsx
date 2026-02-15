/**
 * Card with animated gradient border (CSS keyframes).
 * Border appears to flow for a premium look.
 */

interface GradientBorderCardProps {
  children: React.ReactNode
  className?: string
  innerClassName?: string
}

export function GradientBorderCard({ children, className = '', innerClassName = '' }: GradientBorderCardProps) {
  return (
    <div
      className={`relative rounded-[20px] p-[1px] animate-gradient-border ${className}`}
      style={{
        background: 'linear-gradient(110deg, rgba(99, 102, 241, 0.6), rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.6))',
        backgroundSize: '200% 200%',
      }}
    >
      <div
        className={`rounded-[19px] bg-[var(--color-surface)] border border-white/5 backdrop-blur-xl ${innerClassName}`}
      >
        {children}
      </div>
    </div>
  )
}

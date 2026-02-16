/**
 * Card with animated gradient border (CSS keyframes).
 * Border appears to flow for a premium look.
 * Includes a weighted under-layer (offset shadow) so the card feels grounded.
 */

interface GradientBorderCardProps {
  children: React.ReactNode
  className?: string
  innerClassName?: string
}

export function GradientBorderCard({ children, className = '', innerClassName = '' }: GradientBorderCardProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Weighted under-layer: offset down/right, darker purple than main card — visible shadow */}
      <div
        className="absolute inset-0 rounded-[20px] translate-x-1.5 translate-y-2"
        style={{ background: 'linear-gradient(135deg, rgba(49, 46, 129, 0.85), rgba(88, 28, 135, 0.8))' }}
        aria-hidden
      />
      <div
        className={`relative rounded-[20px] p-[1px] animate-gradient-border`}
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
    </div>
  )
}

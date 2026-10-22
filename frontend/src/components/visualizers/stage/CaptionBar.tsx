import { AnimatePresence, motion } from 'motion/react'
import { EventIcon } from './EventIcon'

interface CaptionBarProps {
  caption: string
  why?: string | null
  kind?: string
}

export function CaptionBar({ caption, why, kind = 'info' }: CaptionBarProps) {
  // Determine color theme for action caption based on event kind
  const normKind = kind.toLowerCase()
  let textColor = 'text-chalk'
  let chipBg = 'bg-panel-2 border-line'

  if (normKind.includes('compare')) {
    textColor = 'text-cyan'
    chipBg = 'bg-cyan/15 border-cyan/40'
  } else if (normKind.includes('swap')) {
    textColor = 'text-rust'
    chipBg = 'bg-rust/15 border-rust/40'
  } else if (normKind.includes('write')) {
    textColor = 'text-forge'
    chipBg = 'bg-forge/15 border-forge/40'
  } else if (normKind.includes('read')) {
    textColor = 'text-orchid'
    chipBg = 'bg-orchid/15 border-orchid/40'
  } else if (normKind.includes('return') || normKind.includes('done')) {
    textColor = 'text-emerald'
    chipBg = 'bg-emerald/15 border-emerald/40'
  } else if (normKind.includes('target') || normKind.includes('found')) {
    textColor = 'text-crimson'
    chipBg = 'bg-crimson/15 border-crimson/40'
  } else if (normKind.includes('exception') || normKind.includes('error')) {
    textColor = 'text-crimson'
    chipBg = 'bg-crimson/15 border-crimson/40'
  }

  return (
    <div
      className="flex items-center gap-3.5 border-t border-line bg-panel-2/95 px-4 py-3 min-h-[58px]"
      aria-live="polite"
      role="status"
    >
      {/* Icon Chip */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${chipBg} shadow-xs transition-colors`}
      >
        <EventIcon kind={kind} size={16} />
      </div>

      {/* Animated Action Text & Subtitle */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={caption}
            initial={{ opacity: 0, filter: 'blur(4px)', y: 4 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(4px)', y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex flex-col min-w-0"
          >
            <div className={`font-plate text-sm sm:text-base font-bold tracking-tight truncate ${textColor}`}>
              {caption || 'Ready to trace'}
            </div>
            {why && (
              <p className="text-2xs sm:text-xs text-muted truncate mt-0.5 leading-snug font-sans">
                {why}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

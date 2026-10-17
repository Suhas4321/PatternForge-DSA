import { ArrowRight, BookMarked, Check, Clock, Lock, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { World } from '../api/types'
import type { Citadel } from '../lib/citadels'
import { Button, DifficultyBadge } from './ui'
import { GlassSurface } from './vendor/vsrc/glass-surface'

interface WorldPreviewPopoverProps {
  world: World | null
  citadel: Citadel
  isLocked?: boolean
  onClose: () => void
  onEnterCamp: (worldId: number) => void
  onOpenGrimoire: (worldId: number) => void
}

export default function WorldPreviewPopover({
  world,
  citadel,
  isLocked = false,
  onClose,
  onEnterCamp,
  onOpenGrimoire,
}: WorldPreviewPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!world) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [world, onClose])

  if (!world) return null

  const isComingSoon = world.status === 'coming_soon' || (world.total === 0 && !world.questions?.length)
  const qs = world.questions || []

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onMouseDown={(e) => {
          if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
            onClose()
          }
        }}
      >
        <GlassSurface
          asChild
          glass={{
            scale: -64,
            chroma: 2,
            border: 0.12,
            mapBlur: 10,
            blur: 18,
            saturate: 1.25,
            fallbackBlur: 12,
          }}
        >
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role="dialog"
            aria-label={`${world.name} Preview`}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-panel/90 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl"
          >
            {/* Header: Numeral + Peak + Close */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xs font-semibold text-faint uppercase">
                    World {world.id}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-2xs font-medium border"
                    style={{
                      color: citadel.themeColor,
                      borderColor: `color-mix(in srgb, ${citadel.themeColor} 30%, transparent)`,
                      backgroundColor: `color-mix(in srgb, ${citadel.themeColor} 10%, transparent)`,
                    }}
                  >
                    Citadel {citadel.numeral}
                  </span>
                </div>
                <h2 className="mt-1 font-plate text-2xl font-bold tracking-tight text-chalk">
                  {world.name.replace(/ — .*/, '')}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close preview"
                className="rounded-full p-1.5 text-muted hover:bg-panel-2 hover:text-chalk transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tagline */}
            {world.tagline && (
              <p className="mt-1 text-sm text-muted">
                {world.tagline}
              </p>
            )}

            {/* Core Idea (2 lines) */}
            {world.core_idea && (
              <div className="mt-3 rounded-xl border border-line bg-panel-2/70 p-3">
                <span className="text-2xs font-bold uppercase tracking-wider text-faint block mb-1">
                  Core Architectural Mental Model
                </span>
                <p className="text-xs text-chalk/90 leading-relaxed line-clamp-2">
                  {world.core_idea}
                </p>
              </div>
            )}

            {/* Status Info / Reason */}
            {isComingSoon ? (
              <div className="mt-4 rounded-xl border border-dashed border-line-strong bg-panel-2/40 p-4 text-center">
                <Sparkles size={20} className="mx-auto text-faint mb-1.5" />
                <p className="text-sm font-semibold text-chalk">Lessons landing soon</p>
                <p className="text-2xs text-muted mt-0.5">
                  This altitude camp is actively under survey. Full interactive trials are deploying in the next expansion batch.
                </p>
              </div>
            ) : isLocked ? (
              <div className="mt-4 rounded-xl border border-amber/30 bg-amber/10 p-3.5 flex items-center gap-3">
                <Lock size={18} className="text-amber shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber">Camp is locked</p>
                  <p className="text-2xs text-muted">Complete earlier prerequisite worlds to unlock this altitude station.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Meta stats bar */}
                <div className="mt-4 flex items-center justify-between text-2xs text-muted border-b border-line pb-2.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock size={13} className="text-faint" />
                    <span>~12 min per lesson</span>
                  </span>
                  <span>
                    <strong className="text-chalk">{world.solved}</strong> / {world.total} solved
                  </span>
                </div>

                {/* Lesson list with solved dots */}
                <div className="mt-3 flex flex-col gap-1.5 max-h-48 overflow-y-auto no-scrollbar pr-1">
                  {qs.map((q, idx) => (
                    <div
                      key={q.slug}
                      className="flex items-center justify-between gap-2.5 rounded-lg border border-line/60 bg-panel-2/50 px-2.5 py-1.5 text-xs transition-colors hover:border-line"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Solved Dot */}
                        {q.progress.solved ? (
                          <span
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald text-surface-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            title="Solved"
                          >
                            <Check size={10} strokeWidth={3} />
                          </span>
                        ) : (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full border border-faint/80 bg-transparent ml-1 mr-1"
                            title="Not solved"
                          />
                        )}
                        <span className="font-plate font-semibold text-chalk truncate">
                          {idx + 1}. {q.title}
                        </span>
                      </div>
                      <DifficultyBadge difficulty={q.difficulty} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-line">
              <Button
                variant="outline"
                className="text-xs h-8 px-3"
                onClick={() => {
                  onClose()
                  onOpenGrimoire(world.id)
                }}
              >
                <BookMarked size={13} />
                <span>View lessons</span>
              </Button>
              <Button
                disabled={isComingSoon}
                onClick={() => {
                  onClose()
                  onEnterCamp(world.id)
                }}
                className="text-xs h-8 px-4"
                style={!isComingSoon ? {
                  backgroundColor: citadel.themeColor,
                  color: 'var(--surface-0, #090A0F)',
                } : undefined}
              >
                <span>Enter camp</span>
                <ArrowRight size={13} />
              </Button>
            </div>
          </motion.div>
        </GlassSurface>
      </div>
    </AnimatePresence>,
    document.body,
  )
}

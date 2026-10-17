import { Crown, Sparkles } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Button, ConfidenceStars, formatRelative } from './ui'

const CONFETTI_COLORS = ['#00F0FF', '#38BDF8', '#34D399', '#FBBF24', '#F8FAFC', '#F43F5E']

function Confetti({ boss }: { boss: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: boss ? 70 : 44 }, (_, i) => {
        const angle = Math.random() * Math.PI * 2
        const dist = 140 + Math.random() * 260
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist * 0.7 + 120,
          rotate: Math.random() * 540 - 270,
          color: boss && i % 2 ? '#FBBF24' : CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          w: 5 + Math.random() * 6,
          h: 3 + Math.random() * 8,
          delay: Math.random() * 0.15,
        }
      }),
    [boss],
  )
  return (
    <div className="pointer-events-none absolute top-1/2 left-1/2" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-[2px]"
          style={{ width: p.w, height: p.h, background: p.color, boxShadow: `0 0 6px ${p.color}` }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.x, y: p.y, opacity: [1, 1, 0], rotate: p.rotate, scale: 1 }}
          transition={{ duration: 1.6, delay: p.delay, ease: [0.16, 0.84, 0.44, 1] }}
        />
      ))}
    </div>
  )
}

interface Props {
  open: boolean
  title: string
  boss: boolean
  review: boolean
  confidence: number | null
  nextReviewAt: string | null
  onNext?: () => void
  onWorld: () => void
  onClose: () => void
}

/** "Pattern Forged!" celebration after the last stage (gold variant for a World Boss). */
export default function VictoryModal({ open, title, boss, review, confidence, nextReviewAt, onNext, onWorld, onClose }: Props) {
  const reduceMotion = useReducedMotion()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const heading = review ? 'Pattern re-forged' : boss ? 'World Boss defeated' : 'Pattern Forged!'
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-label={heading}
        >
          {!reduceMotion && <Confetti boss={boss} />}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className={`liquid-glass relative w-full max-w-md rounded-3xl p-7 text-center ${
              boss ? 'border-gold/50 shadow-[inset_0_1px_0_0_rgb(251_191_36/0.5),0_0_60px_-10px_rgb(251_191_36/0.6)]' : 'border-emerald-hi/40'
            }`}
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                boss ? 'bg-gold/20 text-gold' : 'bg-emerald/20 text-emerald-hi'
              } shadow-[inset_0_1px_0_0_rgb(255_255_255/0.3)]`}
            >
              {boss ? <Crown size={28} /> : <Sparkles size={26} />}
            </div>
            <h2 className={`mt-4 font-plate text-3xl font-semibold ${boss ? 'text-gold' : 'text-chalk'}`}>{heading}</h2>
            <p className="mt-1 text-muted">{title}</p>
            <div className="mt-3 flex justify-center">
              <ConfidenceStars value={confidence} />
            </div>
            {nextReviewAt && (
              <p className="mt-3 text-sm text-muted">Blind re-solve scheduled {formatRelative(nextReviewAt)}.</p>
            )}
            <div className="mt-6 flex justify-center gap-2">
              {onNext && <Button onClick={onNext}>Next trial →</Button>}
              <Button variant="glass" onClick={onWorld}>
                Back to the world
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

import { Check, Lock } from 'lucide-react'
import { motion } from 'motion/react'
import { Kbd } from '../ui'

export interface StageInfo {
  id: number
  label: string
  unlocked: boolean
  done: boolean
}

interface Props {
  stages: StageInfo[]
  current: number
  onSelect: (id: number) => void
  /** Stage that was just unlocked: its incoming connector pulses. */
  justUnlocked: number | null
}

/** Floating liquid-glass capsule: [1. Decode Story] ──► [2. Forge Parts] ──► … */
export default function AscensionBar({ stages, current, onSelect, justUnlocked }: Props) {
  return (
    <nav aria-label="Stages" className="liquid-glass inline-flex max-w-full items-center gap-0 overflow-x-auto rounded-full p-1.5">
      {stages.map((s, i) => {
        const active = s.id === current
        return (
          <div key={s.id} className="flex shrink-0 items-center">
            {i > 0 && (
              <span className="relative mx-1 h-px w-6 sm:w-10" aria-hidden="true">
                <span className={`absolute inset-0 ${s.unlocked ? 'bg-[linear-gradient(90deg,#00F0FF,#6366F1)]' : 'bg-white/10'}`} />
                {justUnlocked === s.id && (
                  <motion.span
                    className="absolute inset-y-[-3px] left-0 w-full rounded-full bg-cyan/70 blur-[3px]"
                    initial={{ scaleX: 0, opacity: 1, originX: 0 }}
                    animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
                    transition={{ duration: 1.4, repeat: 2 }}
                  />
                )}
                <span className={`absolute top-1/2 -right-1 -translate-y-1/2 text-[9px] ${s.unlocked ? 'text-indigo' : 'text-white/15'}`}>▶</span>
              </span>
            )}
            <button
              onClick={() => s.unlocked && onSelect(s.id)}
              disabled={!s.unlocked}
              aria-current={active ? 'step' : undefined}
              title={s.unlocked ? `Alt+${s.id}` : 'Locked: finish the previous stage'}
              className={`group relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                active ? 'text-white' : s.unlocked ? 'text-muted hover:text-chalk' : 'cursor-not-allowed text-faint'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="stage-pill"
                  className="absolute inset-0 rounded-full border border-cyan/40 bg-[linear-gradient(135deg,rgb(0_240_255/0.22),rgb(99_102_241/0.28))] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.35),0_0_18px_-4px_rgb(0_240_255/0.5)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span
                className={`relative flex h-5 w-5 items-center justify-center rounded-full text-2xs font-semibold ${
                  s.done ? 'bg-emerald/30 text-emerald-hi' : active ? 'bg-white/15' : 'bg-white/[0.06]'
                }`}
              >
                {s.done ? <Check size={11} /> : s.unlocked ? s.id : <Lock size={10} />}
              </span>
              <span className="relative whitespace-nowrap">
                {s.id}. {s.label}
              </span>
              {s.unlocked && (
                <span className="relative hidden opacity-0 transition-opacity group-hover:opacity-100 xl:inline-flex">
                  <Kbd keys={['Alt', String(s.id)]} />
                </span>
              )}
            </button>
          </div>
        )
      })}
    </nav>
  )
}

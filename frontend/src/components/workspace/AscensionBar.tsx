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

/** Floating capsule: [1. Decode Story] ──► [2. Forge Parts] ──► … */
export default function AscensionBar({ stages, current, onSelect, justUnlocked }: Props) {
  return (
    <nav
      aria-label="Stages"
      className="card inline-flex max-w-full items-center gap-0 overflow-x-auto rounded-full p-1.5 border border-line bg-panel/90 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {stages.map((s, i) => {
        const active = s.id === current
        return (
          <div key={s.id} className="flex shrink-0 items-center">
            {i > 0 && (
              <span className="relative mx-1 h-px w-6 sm:w-8" aria-hidden="true">
                <span
                  className={`absolute inset-0 ${
                    s.done ? 'bg-emerald' : s.unlocked ? 'bg-cyan/70' : 'bg-line-strong'
                  }`}
                />
                {justUnlocked === s.id && (
                  <motion.span
                    className="absolute inset-y-[-3px] left-0 w-full rounded-full bg-cyan/70 blur-[3px]"
                    initial={{ scaleX: 0, opacity: 1, originX: 0 }}
                    animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
                    transition={{ duration: 1.4, repeat: 2 }}
                  />
                )}
                <span
                  className={`absolute top-1/2 -right-1 -translate-y-1/2 text-caption ${
                    s.done ? 'text-emerald' : s.unlocked ? 'text-cyan' : 'text-line-strong'
                  }`}
                >
                  ▶
                </span>
              </span>
            )}
            <button
              onClick={() => s.unlocked && onSelect(s.id)}
              disabled={!s.unlocked}
              aria-current={active ? 'step' : undefined}
              title={s.unlocked ? `Alt+${s.id}` : 'Locked: complete the previous stage'}
              className={`group relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs sm:text-sm transition-all ${
                active
                  ? 'bg-chalk text-void font-bold shadow-md'
                  : s.done
                    ? 'bg-emerald text-void font-semibold shadow-sm hover:opacity-95'
                    : s.unlocked
                      ? 'border border-line bg-panel-2 text-muted hover:text-chalk'
                      : 'border border-line-strong bg-transparent text-faint opacity-60 cursor-not-allowed'
              }`}
            >
              <span
                className={`relative flex h-5 w-5 items-center justify-center rounded-full text-2xs font-semibold ${
                  s.done
                    ? 'bg-void/20 text-void'
                    : active
                      ? 'bg-void text-chalk'
                      : s.unlocked
                        ? 'bg-panel-2 text-muted border border-line'
                        : 'border border-line-strong text-faint'
                }`}
              >
                {s.done ? <Check size={12} strokeWidth={3} /> : s.unlocked ? s.id : <Lock size={10} />}
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

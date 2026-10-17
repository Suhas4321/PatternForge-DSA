import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Lock,
  Radio,
  ShieldCheck,
  Terminal,
} from 'lucide-react'
import type { StageInfo } from './AscensionBar'

export interface ChapterMeta {
  id: number
  title: string
  done: boolean
  locked: boolean
}

interface Props {
  title: string
  brickLayer?: number
  stages: StageInfo[]
  currentStage: number
  onSelectStage: (id: number) => void
  chapters: ChapterMeta[]
  activeChapter: number
  onSelectChapter: (id: number) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  accentColor?: string
  drillsCount?: number
  drillsPassed?: number[]
}

const STAGE_ICONS = {
  1: BookOpen,
  2: Cpu,
  3: Terminal,
  4: ShieldCheck,
}

const STAGE_SUB_ITEMS: Record<number, string[]> = {
  3: ['Monaco Editor', 'State Visualizer', 'Test Suite'],
  4: ['4-Line Pitch', 'Model Senior Script', 'SM-2 Confidence'],
}

export default function LeftRailStepper({
  title,
  brickLayer,
  stages,
  currentStage,
  onSelectStage,
  chapters,
  activeChapter,
  onSelectChapter,
  isCollapsed,
  onToggleCollapse,
  accentColor = 'var(--color-cyan)',
  drillsCount = 0,
  drillsPassed = [],
}: Props) {
  if (isCollapsed) {
    return (
      <aside
        aria-label="Collapsed telemetry progression rail"
        className="flex flex-col items-center py-3 px-2 rounded-2xl border border-line bg-panel/90 shadow-2xl backdrop-blur-md transition-all w-14"
      >
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-muted hover:text-chalk hover:bg-panel-2 transition-colors mb-3"
          title="Expand telemetry rail"
        >
          <ChevronRight size={15} />
        </button>

        <div className="flex flex-col items-center gap-3 w-full">
          {stages.map((s) => {
            const active = s.id === currentStage
            const Icon = STAGE_ICONS[s.id as keyof typeof STAGE_ICONS] || Terminal

            return (
              <button
                key={s.id}
                onClick={() => s.unlocked && onSelectStage(s.id)}
                disabled={!s.unlocked}
                title={`${s.id}. ${s.label} (Alt+${s.id})`}
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl text-xs transition-all ${
                  active
                    ? 'border text-chalk shadow-lg'
                    : s.done
                      ? 'border border-emerald/50 bg-emerald/15 text-emerald shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : s.unlocked
                        ? 'border border-line bg-panel-2 text-muted hover:text-chalk hover:border-line-strong'
                        : 'border border-line/40 bg-transparent text-faint opacity-40 cursor-not-allowed'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: accentColor,
                        boxShadow: `0 0 16px -2px ${accentColor}50`,
                      }
                    : undefined
                }
              >
                {active && (
                  <span
                    className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full pf-beacon"
                    style={{ backgroundColor: accentColor, ['--beacon-glow' as string]: `${accentColor}80` }}
                  />
                )}
                {s.done ? (
                  <Check size={14} strokeWidth={2.5} />
                ) : s.unlocked ? (
                  <Icon size={14} className={active ? 'text-chalk' : 'text-muted'} />
                ) : (
                  <Lock size={12} />
                )}
              </button>
            )
          })}
        </div>
      </aside>
    )
  }

  return (
    <aside
      aria-label="Telemetry progression rail"
      className="flex flex-col rounded-2xl border border-line bg-panel/90 p-3.5 shadow-2xl backdrop-blur-md text-xs w-full"
    >
      {/* Telemetry Header */}
      <div className="flex items-start justify-between gap-2 border-b border-line pb-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="flex items-center gap-1 font-mono text-2xs uppercase tracking-wider text-muted font-semibold">
              <Radio size={11} className="text-cyan animate-pulse" />
              <span>Telemetry Rail</span>
            </span>
            {brickLayer && (
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-mono font-medium border border-line bg-panel-2 text-muted">
                L{brickLayer}
              </span>
            )}
          </div>
          <h2 className="font-plate text-xs font-semibold text-chalk truncate" title={title}>
            {title}
          </h2>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-lg text-muted hover:text-chalk hover:bg-panel-2 transition-colors shrink-0"
          title="Collapse rail"
        >
          <ChevronLeft size={15} />
        </button>
      </div>

      {/* Vertical Progression Stepper */}
      <div className="relative flex flex-col gap-1.5">
        {/* Subtle connector track running down */}
        <div className="pointer-events-none absolute left-[17px] top-4 bottom-4 w-px bg-gradient-to-b from-emerald/40 via-cyan/30 to-line/40 z-0" />

        {stages.map((s) => {
          const active = s.id === currentStage
          const Icon = STAGE_ICONS[s.id as keyof typeof STAGE_ICONS] || Terminal

          return (
            <div key={s.id} className="relative z-10 flex flex-col">
              <button
                onClick={() => s.unlocked && onSelectStage(s.id)}
                disabled={!s.unlocked}
                className={`group flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs transition-all text-left ${
                  active
                    ? 'border text-chalk shadow-sm font-semibold'
                    : s.done
                      ? 'border border-emerald/40 bg-emerald/10 text-emerald hover:bg-emerald/15'
                      : s.unlocked
                        ? 'border border-transparent text-muted hover:bg-panel-2 hover:text-chalk hover:border-line'
                        : 'border border-transparent text-faint opacity-40 cursor-not-allowed'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: 'var(--color-surface-2)',
                        borderColor: accentColor,
                        boxShadow: `0 0 16px -4px ${accentColor}40`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Glowing State Beacon Icon */}
                  <span
                    className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-2xs transition-all ${
                      active
                        ? 'text-chalk'
                        : s.done
                          ? 'bg-emerald/20 text-emerald border border-emerald/50 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                          : s.unlocked
                            ? 'border border-line bg-panel-2 text-muted group-hover:border-line-strong'
                            : 'border border-line/50 text-faint bg-panel-2/30'
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor: `${accentColor}25`,
                            borderColor: accentColor,
                            boxShadow: `0 0 12px ${accentColor}60`,
                          }
                        : undefined
                    }
                  >
                    {s.done ? (
                      <Check size={12} strokeWidth={2.8} />
                    ) : s.unlocked ? (
                      <Icon size={12} style={{ color: active ? accentColor : undefined }} />
                    ) : (
                      <Lock size={10} />
                    )}
                  </span>
                  <span className={`truncate font-medium ${active ? 'text-chalk font-semibold' : ''}`}>
                    {s.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <kbd className="hidden sm:inline-flex rounded border border-line/60 bg-panel-2 px-1 py-0.5 font-mono text-2xs text-faint">
                    Alt {s.id}
                  </kbd>
                </div>
              </button>

              {/* Sub-problem tracking dots & chapter list under active Stage 1 */}
              {active && s.id === 1 && (
                <div className="relative ml-6 pl-3 border-l border-line/80 my-2 space-y-1.5">
                  <div className="flex items-center justify-between text-2xs font-mono text-faint px-1 pb-1">
                    <span>STORY CHAPTERS</span>
                    <span className="text-cyan font-bold">{activeChapter}/6</span>
                  </div>
                  {chapters.map((ch) => {
                    const isChActive = ch.id === activeChapter
                    return (
                      <button
                        key={ch.id}
                        onClick={() => !ch.locked && onSelectChapter(ch.id)}
                        disabled={ch.locked}
                        className={`flex items-center justify-between gap-2 w-full text-left py-1 text-2xs transition-all rounded-lg px-2 ${
                          isChActive
                            ? 'font-semibold text-cyan bg-cyan/15 border border-cyan/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                            : ch.done
                              ? 'text-chalk hover:text-cyan hover:bg-panel-2'
                              : ch.locked
                                ? 'text-faint opacity-50 cursor-not-allowed'
                                : 'text-muted hover:text-chalk hover:bg-panel-2'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-caption font-mono font-bold ${
                              ch.done
                                ? 'bg-emerald text-void shadow-xs'
                                : isChActive
                                  ? 'bg-cyan text-void pf-beacon'
                                  : ch.locked
                                    ? 'border border-line text-faint'
                                    : 'border border-line bg-panel-2 text-muted'
                            }`}
                          >
                            {ch.done ? <Check size={8} strokeWidth={3} /> : ch.id}
                          </span>
                          <span className="truncate">{ch.title}</span>
                        </div>
                        {isChActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan shrink-0 animate-ping" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Micro-drills sub-dots for Stage 2 */}
              {active && s.id === 2 && drillsCount > 0 && (
                <div className="relative ml-6 pl-3 border-l border-line/80 my-2 space-y-1.5">
                  <div className="flex items-center justify-between text-2xs font-mono text-faint px-1 pb-1">
                    <span>MICRO DRILLS</span>
                    <span className="text-forge font-bold">{drillsPassed.length}/{drillsCount}</span>
                  </div>
                  {Array.from({ length: drillsCount }, (_, i) => {
                    const isPassed = drillsPassed.includes(i)
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between gap-2 py-1 px-2 rounded-lg text-2xs ${
                          isPassed
                            ? 'text-emerald bg-emerald/10 border border-emerald/30'
                            : 'text-muted bg-panel-2/50 border border-line/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full font-mono text-caption ${
                              isPassed ? 'bg-emerald text-void font-bold' : 'border border-line text-faint'
                            }`}
                          >
                            {isPassed ? <Check size={8} strokeWidth={3} /> : i + 1}
                          </span>
                          <span>Part {i + 1} Drill</span>
                        </div>
                        <span className="font-mono text-2xs font-semibold">
                          {isPassed ? 'Passed' : 'Pending'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Checkpoints for Stage 3 & 4 */}
              {active && STAGE_SUB_ITEMS[s.id] && (
                <div className="relative ml-6 pl-3 border-l border-line/80 my-2 space-y-1.5">
                  <div className="flex items-center justify-between text-2xs font-mono text-faint px-1 pb-1">
                    <span>ARENA CHECKPOINTS</span>
                  </div>
                  {STAGE_SUB_ITEMS[s.id].map((sub) => (
                    <div
                      key={sub}
                      className="flex items-center gap-2 py-1 px-2 rounded-lg text-2xs text-muted bg-panel-2/40 border border-line/30"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan/70 shrink-0" />
                      <span className="truncate">{sub}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}


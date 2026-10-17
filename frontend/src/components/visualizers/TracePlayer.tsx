import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-react'
import { useEffect } from 'react'
import type { Trace } from '../../api/types'
import { formatValue } from '../../lib/trace'

const SPEEDS = [0.5, 1, 2, 4]

interface Props {
  trace: Trace
  index: number
  onIndex: (i: number) => void
  playing: boolean
  onPlaying: (p: boolean) => void
  speed: number
  onSpeed: (s: number) => void
}

export default function TracePlayer({
  trace,
  index,
  onIndex,
  playing,
  onPlaying,
  speed,
  onSpeed,
}: Props) {
  const steps = trace.steps
  const last = Math.max(0, steps.length - 1)
  const step = steps[index]

  useEffect(() => {
    if (!playing) return
    if (index >= last) {
      onPlaying(false)
      return
    }
    const t = setTimeout(() => onIndex(index + 1), 650 / speed)
    return () => clearTimeout(t)
  }, [playing, index, last, speed, onIndex, onPlaying])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.monaco-editor, input, textarea, select')) return
      if (e.key === 'ArrowRight') onIndex(Math.min(last, index + 1))
      else if (e.key === 'ArrowLeft') onIndex(Math.max(0, index - 1))
      else if (e.key === ' ') {
        e.preventDefault()
        onPlaying(!playing)
      } else return
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, last, playing, onIndex, onPlaying])

  const describe = () => {
    if (!step) return 'Ready to trace'
    if (step.event === 'call') return `call ${step.func}()`
    if (step.event === 'return')
      return `${step.func}() → ${formatValue(step.return_value, step.return_heap)}`
    if (step.event === 'exception') return `exception: ${step.exception}`
    return `line ${step.line} in ${step.func}()`
  }

  const progressPercent = steps.length > 1 ? Math.round((index / (steps.length - 1)) * 100) : 100

  const btnClass =
    'flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-panel-2 hover:text-chalk transition-colors disabled:opacity-30 disabled:pointer-events-none'

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-panel-2/70 p-2 sm:p-2.5 shadow-md w-full max-w-full">
      {/* Top Status & Telemetry Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-2xs font-mono">
        {/* Left: Execution Context */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-semibold ${
              step?.event === 'exception'
                ? 'bg-crimson/20 text-crimson border border-crimson/40'
                : step?.event === 'return'
                  ? 'bg-emerald/20 text-emerald border border-emerald/40'
                  : 'bg-cyan/15 text-cyan border border-cyan/30'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                step?.event === 'exception'
                  ? 'bg-crimson'
                  : step?.event === 'return'
                    ? 'bg-emerald'
                    : 'bg-cyan'
              } ${playing ? 'animate-ping' : ''}`}
            />
            <span className="truncate">{describe()}</span>
          </span>

          {step && step.frames.length > 1 && (
            <span className="hidden md:inline-flex items-center gap-1 text-faint">
              <span>Stack:</span>
              <span className="truncate text-muted">{step.frames.map((f) => f.func).join(' › ')}</span>
            </span>
          )}
        </div>

        {/* Right: Digital Frame Counter */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded-md border border-line bg-panel px-2 py-0.5 text-2xs">
            <span className="text-faint font-semibold uppercase">FRAME</span>
            <span className="font-bold text-chalk">
              {index + 1} <span className="text-faint font-normal">/ {steps.length}</span>
            </span>
            <span className="text-cyan font-bold">({progressPercent}%)</span>
          </div>
        </div>
      </div>

      {/* Main Transport Controls & Scrubber */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Jump First */}
        <button
          type="button"
          className={btnClass}
          onClick={() => onIndex(0)}
          disabled={index === 0}
          title="Jump to first step (Home)"
          aria-label="First step"
        >
          <ChevronFirst size={15} />
        </button>

        {/* Step Backward */}
        <button
          type="button"
          className={btnClass}
          onClick={() => onIndex(Math.max(0, index - 1))}
          disabled={index === 0}
          title="Step backward (Left Arrow)"
          aria-label="Previous step"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Glowing Play / Pause Playhead */}
        <button
          type="button"
          onClick={() => {
            if (index >= last) onIndex(0)
            onPlaying(!playing)
          }}
          className={`flex h-8 px-3 items-center justify-center gap-1.5 rounded-lg font-mono text-2xs font-bold transition-all shadow-md select-none ${
            playing
              ? 'bg-amber text-void shadow-[0_0_14px_rgba(242,184,102,0.45)]'
              : 'bg-emerald text-void hover:bg-emerald/90 shadow-[0_0_14px_rgba(16,185,129,0.45)]'
          }`}
          title="Play / Pause execution (Space)"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <>
              <Pause size={13} strokeWidth={2.8} />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play size={13} strokeWidth={2.8} className="fill-current" />
              <span>PLAY</span>
            </>
          )}
        </button>

        {/* Step Forward */}
        <button
          type="button"
          className={btnClass}
          onClick={() => onIndex(Math.min(last, index + 1))}
          disabled={index >= last}
          title="Step forward (Right Arrow)"
          aria-label="Next step"
        >
          <ChevronRight size={15} />
        </button>

        {/* Jump Last */}
        <button
          type="button"
          className={btnClass}
          onClick={() => onIndex(last)}
          disabled={index >= last}
          title="Jump to end (End)"
          aria-label="Last step"
        >
          <ChevronLast size={15} />
        </button>

        {/* Scrubber Seek-bar */}
        <div className="relative flex-1 mx-1.5 flex items-center min-w-[80px]">
          <input
            type="range"
            min={0}
            max={last}
            value={index}
            onChange={(e) => onIndex(Number(e.target.value))}
            className="w-full h-1.5 bg-panel rounded-full appearance-none cursor-pointer accent-cyan focus:outline-none"
            aria-label="Scrub through execution steps"
          />
        </div>

        {/* Speed Selector Pills */}
        <div className="flex items-center rounded-lg border border-line bg-panel p-0.5 text-2xs font-mono">
          {SPEEDS.map((s) => {
            const isSpeedActive = speed === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => onSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-caption font-semibold transition-colors ${
                  isSpeedActive
                    ? 'bg-cyan text-void shadow-xs'
                    : 'text-muted hover:text-chalk'
                }`}
                title={`Playback speed ${s}x`}
              >
                {s}×
              </button>
            )
          })}
        </div>
      </div>

      {trace.truncated && (
        <p className="text-2xs text-amber font-mono bg-amber/10 border border-amber/30 rounded-md p-1.5 mt-0.5">
          ⚠ Trace captured {steps.length} steps before truncation limit. Use smaller arguments to record entire execution.
        </p>
      )}
    </div>
  )
}

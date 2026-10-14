import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
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

export default function TracePlayer({ trace, index, onIndex, playing, onPlaying, speed, onSpeed }: Props) {
  const steps = trace.steps
  const last = steps.length - 1
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
    if (!step) return ''
    if (step.event === 'call') return `call ${step.func}()`
    if (step.event === 'return') return `${step.func}() returns ${formatValue(step.return_value, step.return_heap)}`
    if (step.event === 'exception') return `exception: ${step.exception}`
    return `line ${step.line} in ${step.func}()`
  }

  const btn = 'rounded p-1.5 text-muted hover:bg-panel-2 hover:text-chalk disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <button className={btn} onClick={() => onIndex(0)} disabled={index === 0} aria-label="First step">
          <ChevronFirst size={18} />
        </button>
        <button className={btn} onClick={() => onIndex(Math.max(0, index - 1))} disabled={index === 0} aria-label="Previous step">
          <ChevronLeft size={18} />
        </button>
        <button
          className="rounded-md bg-forge px-3 py-1.5 text-ink hover:bg-forge/90"
          onClick={() => {
            if (index >= last) onIndex(0)
            onPlaying(!playing)
          }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button className={btn} onClick={() => onIndex(Math.min(last, index + 1))} disabled={index >= last} aria-label="Next step">
          <ChevronRight size={18} />
        </button>
        <button className={btn} onClick={() => onIndex(last)} disabled={index >= last} aria-label="Last step">
          <ChevronLast size={18} />
        </button>
        <input
          type="range"
          min={0}
          max={last}
          value={index}
          onChange={(e) => onIndex(Number(e.target.value))}
          className="mx-2 h-1 flex-1 accent-forge"
          aria-label="Step"
        />
        <span className="w-20 text-right font-mono text-xs text-muted">
          {index + 1} / {steps.length}
        </span>
        <select
          value={speed}
          onChange={(e) => onSpeed(Number(e.target.value))}
          className="ml-1 rounded border border-line bg-panel px-1 py-0.5 text-xs text-muted"
          aria-label="Playback speed"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className={step?.event === 'exception' ? 'text-oxide' : 'text-chalk'}>{describe()}</span>
        {step && step.frames.length > 1 && (
          <span className="truncate font-mono text-faint">
            {step.frames.map((f) => f.func).join(' › ')}
          </span>
        )}
      </div>
      {trace.truncated && (
        <p className="text-xs text-ochre">
          Trace stopped after {steps.length} steps. Use a smaller custom input to see the whole run.
        </p>
      )}
    </div>
  )
}

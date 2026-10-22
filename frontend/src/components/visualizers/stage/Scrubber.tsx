import { useMemo } from 'react'
import type { TraceStep } from '../../../api/types'

interface ScrubberProps {
  steps: TraceStep[]
  currentIndex: number
  onSeek: (index: number) => void
}

function getStepTickColor(step: TraceStep): string {
  if (step.event === 'exception') return 'bg-crimson'
  if (step.event === 'call' || step.event === 'return') return 'bg-orchid'

  // Inspect title or func or custom state
  const desc = `${step.func} ${step.title || ''}`.toLowerCase()
  if (desc.includes('swap')) return 'bg-rust'
  if (desc.includes('write')) return 'bg-forge'
  if (desc.includes('compare')) return 'bg-cyan'

  return 'bg-line-strong'
}

export function Scrubber({ steps, currentIndex, onSeek }: ScrubberProps) {
  const lastIndex = Math.max(0, steps.length - 1)

  // Pre-calculate tick positions (downsampled if steps > 80 to prevent overcrowding)
  const ticks = useMemo(() => {
    if (steps.length <= 1) return []
    const count = steps.length
    const maxTicks = 60
    const stepInterval = Math.max(1, Math.floor(count / maxTicks))

    const list: { index: number; percent: number; color: string }[] = []
    for (let i = 0; i < count; i += stepInterval) {
      list.push({
        index: i,
        percent: (i / (count - 1)) * 100,
        color: getStepTickColor(steps[i]),
      })
    }
    // Ensure final step tick is included
    if (list[list.length - 1]?.index !== count - 1) {
      list.push({
        index: count - 1,
        percent: 100,
        color: getStepTickColor(steps[count - 1]),
      })
    }
    return list
  }, [steps])

  const progressPercent = lastIndex > 0 ? (currentIndex / lastIndex) * 100 : 0

  return (
    <div className="relative flex-1 min-w-[120px] flex items-center h-6 group">
      {/* Background Track */}
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-panel border border-line overflow-hidden pointer-events-none">
        {/* Active Progress Bar */}
        <div
          className="h-full bg-cyan/80 transition-all duration-75"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Semantic Event Ticks */}
      <div className="absolute inset-x-0 h-3 flex items-center pointer-events-none px-1">
        {ticks.map((t) => (
          <div
            key={t.index}
            className={`absolute h-2 w-0.5 rounded-full ${t.color} transition-transform ${
              Math.abs(t.index - currentIndex) <= 1 ? 'scale-y-125 brightness-125' : 'opacity-60'
            }`}
            style={{ left: `${t.percent}%` }}
          />
        ))}
      </div>

      {/* Range Input Playhead Slider */}
      <input
        type="range"
        min={0}
        max={lastIndex}
        value={currentIndex}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="relative z-10 w-full h-full opacity-0 cursor-pointer"
        aria-label="Seek execution timeline step"
      />

      {/* Visible Thumb Indicator */}
      <div
        className="absolute h-3.5 w-3.5 rounded-full bg-cyan border-2 border-void shadow-[0_0_8px_rgba(56,189,248,0.7)] pointer-events-none transition-all duration-75 -translate-x-1/2"
        style={{ left: `${progressPercent}%` }}
      />
    </div>
  )
}

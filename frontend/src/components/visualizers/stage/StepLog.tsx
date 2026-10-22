import { useEffect, useRef } from 'react'
import type { TraceStep } from '../../../api/types'
import { EventIcon } from './EventIcon'
import { formatValue } from '../../../lib/trace'

interface StepLogProps {
  steps: TraceStep[]
  currentIndex: number
  onSelectStep: (index: number) => void
  open: boolean
  onClose: () => void
}

function getStepSummary(step: TraceStep): { title: string; kind: string; detail?: string } {
  if (step.event === 'call') {
    return { title: `call ${step.func}()`, kind: 'call' }
  }
  if (step.event === 'return') {
    return {
      title: `${step.func}() → ${formatValue(step.return_value, step.return_heap)}`,
      kind: 'return',
    }
  }
  if (step.event === 'exception') {
    return { title: `exception: ${step.exception}`, kind: 'exception' }
  }

  return {
    title: `line ${step.line} in ${step.func}()`,
    kind: 'line',
  }
}

export function StepLog({ steps, currentIndex, onSelectStep, open }: StepLogProps) {
  const activeItemRef = useRef<HTMLButtonElement | null>(null)
  const listContainerRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll to current active step in log
  useEffect(() => {
    if (open && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [currentIndex, open])

  if (!open) return null

  return (
    <div className="flex flex-col border-t border-line bg-panel-2/95 backdrop-blur max-h-56 overflow-hidden transition-all duration-200">
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-line text-2xs font-mono text-muted bg-panel">
        <span className="font-semibold uppercase tracking-wider text-chalk">
          Execution Step Log ({steps.length} total)
        </span>
        <span className="text-faint">Press [L] to toggle</span>
      </div>

      <div
        ref={listContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs max-h-48"
      >
        {steps.map((st, i) => {
          const { title, kind } = getStepSummary(st)
          const isCurrent = i === currentIndex

          return (
            <button
              key={i}
              ref={isCurrent ? activeItemRef : null}
              type="button"
              onClick={() => onSelectStep(i)}
              className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                isCurrent
                  ? 'bg-cyan/20 border border-cyan/50 text-cyan font-bold shadow-xs'
                  : 'hover:bg-panel text-muted hover:text-chalk border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-faint shrink-0 w-6">#{i + 1}</span>
                <EventIcon kind={kind} size={13} className="shrink-0" />
                <span className="truncate text-2xs">{title}</span>
              </div>
              <span className="text-[10px] text-faint shrink-0">L{st.line}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

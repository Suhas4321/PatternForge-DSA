import { NumberTicker } from '../../vendor/magicui/number-ticker'

interface CountersProps {
  comparisons?: number
  swaps?: number
  writes?: number
  currentStep: number
  totalSteps: number
}

export function Counters({
  comparisons = 0,
  swaps = 0,
  writes = 0,
  currentStep,
  totalSteps,
}: CountersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1 text-2xs font-mono text-muted">
      <div className="flex items-center gap-4">
        {/* Telemetry Pills */}
        <div className="flex items-center gap-1.5" title="Total comparisons performed">
          <span className="text-faint">Comparisons:</span>
          <span className="font-semibold text-cyan">
            <NumberTicker value={comparisons} />
          </span>
        </div>

        <div className="flex items-center gap-1.5" title="Total array swaps or writes">
          <span className="text-faint">Swaps/Writes:</span>
          <span className="font-semibold text-rust">
            <NumberTicker value={swaps + writes} />
          </span>
        </div>
      </div>

      {/* Frame Position */}
      <div className="flex items-center gap-1.5">
        <span className="text-faint">Step:</span>
        <span className="font-semibold text-chalk">
          <NumberTicker value={Math.max(1, currentStep + 1)} />
        </span>
        <span className="text-faint">/</span>
        <span className="text-faint">{totalSteps}</span>
      </div>
    </div>
  )
}

import { useState } from 'react'

interface ComplexityBadgesProps {
  timeComplexity?: string
  spaceComplexity?: string
}

function parseBigO(raw?: string): { bigO: string; explanation: string } {
  if (!raw) return { bigO: '—', explanation: 'No complexity metadata' }
  const match = raw.match(/^(O\([^)]+\)|O\(1\)|O\(log\s*n\)|O\(n\)|O\(n\s*log\s*n\)|O\(n\^?2\)|O\(2\^?n\)|O\(n!\))/i)
  if (match) {
    const bigO = match[1]
    const rest = raw.slice(match[0].length).replace(/^[\s—:-]+/, '').trim()
    return { bigO, explanation: rest || raw }
  }
  const parts = raw.split(/[—:-]/)
  return {
    bigO: parts[0]?.trim() || raw,
    explanation: parts.slice(1).join(' — ').trim() || raw,
  }
}

export function ComplexityBadges({ timeComplexity, spaceComplexity }: ComplexityBadgesProps) {
  const [activeTooltip, setActiveTooltip] = useState<'time' | 'space' | null>(null)

  const timeParsed = parseBigO(timeComplexity)
  const spaceParsed = parseBigO(spaceComplexity)

  if (!timeComplexity && !spaceComplexity) return null

  return (
    <div className="flex items-center gap-2 select-none relative">
      {/* TIME Badge */}
      {timeComplexity && (
        <div
          className="relative inline-block"
          onMouseEnter={() => setActiveTooltip('time')}
          onMouseLeave={() => setActiveTooltip(null)}
          onFocus={() => setActiveTooltip('time')}
          onBlur={() => setActiveTooltip(null)}
          tabIndex={0}
          role="note"
          aria-label={`Time complexity: ${timeParsed.bigO}`}
        >
          <div className="flex items-center gap-1.5 rounded-full border border-forge/60 bg-forge/10 px-2.5 py-0.5 shadow-[0_0_12px_rgba(110,231,183,0.15)] cursor-help transition-all hover:bg-forge/15">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">
              TIME
            </span>
            <span className="text-xs font-mono font-bold text-forge">
              {timeParsed.bigO}
            </span>
          </div>

          {activeTooltip === 'time' && (
            <div className="absolute right-0 top-full mt-2 z-50 min-w-[220px] max-w-[280px] rounded-xl border border-line-strong bg-panel-2 p-2.5 text-xs text-chalk shadow-2xl backdrop-blur animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-mono uppercase text-forge font-bold mb-1">
                Reference Time Complexity
              </div>
              <p className="text-2xs text-muted leading-relaxed">
                {timeParsed.explanation || timeComplexity}
              </p>
            </div>
          )}
        </div>
      )}

      {/* SPACE Badge */}
      {spaceComplexity && (
        <div
          className="relative inline-block"
          onMouseEnter={() => setActiveTooltip('space')}
          onMouseLeave={() => setActiveTooltip(null)}
          onFocus={() => setActiveTooltip('space')}
          onBlur={() => setActiveTooltip(null)}
          tabIndex={0}
          role="note"
          aria-label={`Space complexity: ${spaceParsed.bigO}`}
        >
          <div className="flex items-center gap-1.5 rounded-full border border-cyan/60 bg-cyan/10 px-2.5 py-0.5 shadow-[0_0_12px_rgba(103,232,249,0.15)] cursor-help transition-all hover:bg-cyan/15">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">
              SPACE
            </span>
            <span className="text-xs font-mono font-bold text-cyan">
              {spaceParsed.bigO}
            </span>
          </div>

          {activeTooltip === 'space' && (
            <div className="absolute right-0 top-full mt-2 z-50 min-w-[220px] max-w-[280px] rounded-xl border border-line-strong bg-panel-2 p-2.5 text-xs text-chalk shadow-2xl backdrop-blur animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-mono uppercase text-cyan font-bold mb-1">
                Reference Space Complexity
              </div>
              <p className="text-2xs text-muted leading-relaxed">
                {spaceParsed.explanation || spaceComplexity}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

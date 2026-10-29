import ChatGPTCodeBlock from '../ChatGPTCodeBlock'
import SystemDesignAssignment from '../workspace/SystemDesignAssignment'
import { SYSTEM_DESIGN_ASSIGNMENTS } from '../../lib/systemDesignAssignments'
import { LLD_PROBLEMS } from '../../lib/systemDesignData'
import type { SelectedItem } from './SystemDesignSidebar'

interface Props {
  index: number
  onNavigate: (next: SelectedItem) => void
  completedIds: string[]
  onCompleted: (id: string) => void
}

export default function SystemDesignLldView({ index, onNavigate, completedIds, onCompleted }: Props) {
  const lld = LLD_PROBLEMS[index] ?? LLD_PROBLEMS[0]
  const isDone = completedIds.includes(lld.id)

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-line pb-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-2xs font-mono text-muted">
          <span>Module 2: Low-Level Design · System 0{index + 1} of {LLD_PROBLEMS.length}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onNavigate({ kind: 'lld', index: index - 1 })}
              className="rounded border border-line bg-panel px-2 py-0.5 text-muted hover:text-chalk hover:bg-panel-2 disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={index >= LLD_PROBLEMS.length - 1}
              onClick={() => onNavigate({ kind: 'lld', index: index + 1 })}
              className="rounded border border-line bg-panel px-2 py-0.5 text-muted hover:text-chalk hover:bg-panel-2 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
        <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
          {lld.title}
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-muted">{lld.coreChallenge}</p>
        <div className="flex flex-wrap gap-2 pt-1 font-mono text-2xs text-cyan">
          {lld.patterns.map((p) => (
            <span key={p} className="rounded bg-cyan/10 border border-cyan/25 px-2 py-0.5">{p}</span>
          ))}
        </div>
      </div>

      {/* 1. Classes & Responsibilities Table */}
      <section id="section-classes" className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-chalk">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-cyan-500/15 font-mono text-2xs text-cyan font-semibold">1</span>
          <span>Class & Interface Responsibilities (Clean Separation)</span>
        </h2>
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-line bg-panel-2 font-semibold text-muted">
                <th className="py-2.5 px-4 w-52">Class / Interface</th>
                <th className="py-2.5 px-4">Single Responsibility & Contract</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {lld.classes.map((c) => (
                <tr key={c.name}>
                  <td className="py-2.5 px-4 font-mono text-xs font-semibold text-chalk">{c.name}</td>
                  <td className="py-2.5 px-4 text-muted">{c.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Invariant & Concurrency */}
      <section id="section-invariant" className="space-y-3 pt-4 border-t border-line">
        <h2 className="flex items-center gap-2 text-base font-semibold text-chalk">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-cyan-500/15 font-mono text-2xs text-cyan font-semibold">2</span>
          <span>Core Domain Invariant & Concurrency Guarantee</span>
        </h2>
        <blockquote className="rounded-r-md border-l-[3px] border-cyan bg-panel-2 px-4 py-3 font-mono text-xs sm:text-sm leading-relaxed text-chalk shadow-xs">
          {lld.invariant}
        </blockquote>
      </section>

      {/* 3. Production Implementation */}
      <section id="section-code" className="space-y-3 pt-4 border-t border-line">
        <h2 className="flex items-center gap-2 text-base font-semibold text-chalk">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-cyan-500/20 font-mono text-2xs text-cyan">3</span>
          <span>Production Python Implementation</span>
        </h2>
        <ChatGPTCodeBlock code={lld.codeSnippet} language="python" title={`${lld.title} · Core Implementation`} />
      </section>

      {/* 4. Hands-on Lab */}
      <div id="section-lab">
        {SYSTEM_DESIGN_ASSIGNMENTS[lld.id] && (
          <SystemDesignAssignment
            key={lld.id}
            spec={SYSTEM_DESIGN_ASSIGNMENTS[lld.id]}
            stepNumber={4}
            isCompleted={isDone}
            onCompleted={onCompleted}
            onNextLesson={() => {
              if (index < LLD_PROBLEMS.length - 1) {
                onNavigate({ kind: 'lld', index: index + 1 })
              } else {
                onNavigate({ kind: 'hld', index: 0 })
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

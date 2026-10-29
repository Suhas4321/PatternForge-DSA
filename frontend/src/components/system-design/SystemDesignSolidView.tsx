import ChatGPTCodeBlock from '../ChatGPTCodeBlock'
import SystemDesignAssignment from '../workspace/SystemDesignAssignment'
import { SYSTEM_DESIGN_ASSIGNMENTS } from '../../lib/systemDesignAssignments'
import { SOLID_PLAYBOOK } from '../../lib/systemDesignData'
import type { SelectedItem } from './SystemDesignSidebar'

interface Props {
  index: number
  onNavigate: (next: SelectedItem) => void
  completedIds: string[]
  onCompleted: (id: string) => void
}

export default function SystemDesignSolidView({ index, onNavigate, completedIds, onCompleted }: Props) {
  const solid = SOLID_PLAYBOOK[index] ?? SOLID_PLAYBOOK[0]
  const isDone = completedIds.includes(`solid-${solid.letter}`)

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-line pb-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-2xs font-mono text-muted">
          <span>Module 1: OOP & SOLID · Lesson 0{index + 1} of {SOLID_PLAYBOOK.length}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onNavigate({ kind: 'solid', index: index - 1 })}
              className="rounded border border-line bg-panel px-2 py-0.5 text-muted hover:text-chalk hover:bg-panel-2 disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={index >= SOLID_PLAYBOOK.length - 1}
              onClick={() => onNavigate({ kind: 'solid', index: index + 1 })}
              className="rounded border border-line bg-panel px-2 py-0.5 text-muted hover:text-chalk hover:bg-panel-2 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
        <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
          {solid.name}
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-muted">{solid.tagline}</p>
      </div>

      {/* 1. Mental Model & Scenario */}
      <section id="section-concept" className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-chalk">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-violet-500/15 font-mono text-2xs font-semibold text-violet-600 dark:text-violet-400">1</span>
          <span>Core Mental Model & Production Code Review</span>
        </h2>
        <p className="text-sm leading-relaxed text-chalk">
          <strong className="text-chalk font-semibold">Mental Model:</strong>{' '}
          <span className="text-muted">{solid.analogy}</span>
        </p>
        <blockquote className="rounded-r-md border-l-[3px] border-violet-500 bg-panel-2 px-4 py-3 text-sm leading-relaxed text-chalk shadow-xs">
          <span className="block font-mono text-2xs uppercase tracking-wider text-violet-600 dark:text-violet-400 font-semibold mb-1">
            Production Scenario
          </span>
          {solid.companyScenario}
        </blockquote>
      </section>

      {/* 2. When to Use vs Not Use */}
      <section id="section-tradeoffs" className="space-y-3 pt-4 border-t border-line">
        <h2 className="flex items-center gap-2 text-base font-semibold text-chalk">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-violet-500/15 font-mono text-2xs font-semibold text-violet-600 dark:text-violet-400">2</span>
          <span>When to Apply vs. When NOT to Apply (YAGNI)</span>
        </h2>
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-line bg-panel-2 font-semibold text-muted">
                <th className="py-2.5 px-4 w-1/2">When to Apply {solid.letter}</th>
                <th className="py-2.5 px-4 w-1/2">When NOT to Apply (YAGNI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="py-3 px-4 align-top text-chalk">
                  <ul className="list-disc list-inside space-y-1 text-muted">
                    {solid.whenToUse.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </td>
                <td className="py-3 px-4 align-top text-chalk">
                  <ul className="list-disc list-inside space-y-1 text-muted">
                    {solid.whenNotToUse.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Before vs After ChatGPT Code Blocks */}
      <section id="section-code" className="space-y-4 pt-4 border-t border-line">
        <h2 className="flex items-center gap-2 text-base font-semibold text-chalk">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-violet-500/15 font-mono text-2xs font-semibold text-violet-600 dark:text-violet-400">3</span>
          <span>Production Python Refactor: Before vs. After</span>
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChatGPTCodeBlock code={solid.badCode} language="python" title="Before: Brittle Coupling" />
          <ChatGPTCodeBlock code={solid.goodCode} language="python" title="After: Clean Architecture Refactor" />
        </div>
      </section>

      {/* 4. Hands-on Lab */}
      <div id="section-lab">
        {SYSTEM_DESIGN_ASSIGNMENTS[`solid-${solid.letter}`] && (
          <SystemDesignAssignment
            key={`solid-${solid.letter}`}
            spec={SYSTEM_DESIGN_ASSIGNMENTS[`solid-${solid.letter}`]}
            stepNumber={4}
            isCompleted={isDone}
            onCompleted={onCompleted}
            onNextLesson={() => {
              if (index < SOLID_PLAYBOOK.length - 1) {
                onNavigate({ kind: 'solid', index: index + 1 })
              } else {
                onNavigate({ kind: 'lld', index: 0 })
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

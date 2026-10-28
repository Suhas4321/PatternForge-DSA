import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import SystemDesignAssignment from '../components/workspace/SystemDesignAssignment'
import { SYSTEM_DESIGN_ASSIGNMENTS } from '../lib/systemDesignAssignments'
import {
  HLD_PROBLEMS,
  LLD_PROBLEMS,
  SOLID_PLAYBOOK,
} from '../lib/systemDesignData'

type SelectedItem =
  | { kind: 'solid'; index: number }
  | { kind: 'lld'; index: number }
  | { kind: 'hld'; index: number }
  | null

const COMPLETED_STORAGE_KEY = 'pf_sysdesign_completed_v1'

export default function SystemDesignPage() {
  const [selected, setSelected] = useState<SelectedItem>(null)
  const [activeNodeIdx, setActiveNodeIdx] = useState(0)
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(COMPLETED_STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const markCompleted = (id: string) => {
    setCompletedIds((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      try {
        localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const openItem = (next: SelectedItem) => {
    setSelected(next)
    setActiveNodeIdx(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-[1040px] px-4 sm:px-6 py-9 w-full text-chalk">
      {/* SCREEN 1: CLEAN SYLLABUS INDEX (GeeksforGeeks / LeetCode Study Plan Table) */}
      {selected === null && (
        <div className="space-y-7">
          <div className="border-b border-line pb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-chalk transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Back to Dashboard</span>
              </Link>
              <span className="font-mono text-xs text-muted">
                {completedIds.length} / 20 Assignments Completed · Bottom-to-Top Track
              </span>
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
              System Design Track (OOP & SOLID → LLD → HLD)
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              Structured step-by-step curriculum. Study the worked example in each lesson and pass its hands-on coding assignment to complete the module.
            </p>
          </div>


          {/* MODULE 1: OOP & SOLID */}
          <section className="overflow-hidden rounded-lg border border-line bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-panel-2 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-chalk">
                  Module 1: OOP & SOLID Principles in Production
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Learn what each principle means, real company code-review scenarios, when to use it, and when NOT to use it.
                </p>
              </div>
              <span className="font-mono text-xs text-muted">{SOLID_PLAYBOOK.length} Lessons</span>
            </div>

            <div className="divide-y divide-line">
              {SOLID_PLAYBOOK.map((sp, idx) => {
                const done = completedIds.includes(`solid-${sp.letter}`)
                return (
                  <button
                    key={sp.letter}
                    type="button"
                    onClick={() => openItem({ kind: 'solid', index: idx })}
                    className="grid w-full grid-cols-1 md:grid-cols-[44px_1.4fr_1.6fr_100px_130px] items-center gap-3 px-5 py-3.5 text-left text-sm transition-colors hover:bg-panel-2"
                  >
                    <span className="font-mono text-xs text-muted">0{idx + 1}</span>
                    <span className="font-medium text-chalk">{sp.name}</span>
                    <span className="text-xs text-muted line-clamp-1">{sp.tagline}</span>
                    <span className="text-xs text-muted">Fundamental</span>
                    <span className="text-right text-xs font-medium text-chalk inline-flex items-center justify-end gap-1">
                      {done && <CheckCircle2 size={13} className="text-emerald" />}
                      <span>{done ? 'Completed →' : 'Lesson + Lab →'}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* MODULE 2: LOW-LEVEL DESIGN (LLD) */}
          <section className="overflow-hidden rounded-lg border border-line bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-panel-2 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-chalk">
                  Module 2: Low-Level Design (LLD / Machine Coding Rounds)
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  How to design clean classes, interfaces, and concurrency locks inside a single service.
                </p>
              </div>
              <span className="font-mono text-xs text-muted">{LLD_PROBLEMS.length} Problems</span>
            </div>

            <div className="divide-y divide-line">
              {LLD_PROBLEMS.map((p, idx) => {
                const done = completedIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openItem({ kind: 'lld', index: idx })}
                    className="grid w-full grid-cols-1 md:grid-cols-[44px_1.4fr_1.6fr_100px_130px] items-center gap-3 px-5 py-3.5 text-left text-sm transition-colors hover:bg-panel-2"
                  >
                    <span className="font-mono text-xs text-muted">0{idx + 1}</span>
                    <span className="font-medium text-chalk">{p.title}</span>
                    <span className="text-xs text-muted line-clamp-1">{p.patterns.join(' · ')}</span>
                    <span className="text-xs text-muted">{idx < 2 ? 'Medium' : 'Hard'}</span>
                    <span className="text-right text-xs font-medium text-chalk inline-flex items-center justify-end gap-1">
                      {done && <CheckCircle2 size={13} className="text-emerald" />}
                      <span>{done ? 'Completed →' : 'LLD + Lab →'}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* MODULE 3: HIGH-LEVEL SYSTEM DESIGN (HLD) */}
          <section className="overflow-hidden rounded-lg border border-line bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-panel-2 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-chalk">
                  Module 3: High-Level Distributed System Design (HLD)
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  From single-server failure to scaled distributed architectures with interactive hop-by-hop flow diagrams.
                </p>
              </div>
              <span className="font-mono text-xs text-muted">{HLD_PROBLEMS.length} Systems</span>
            </div>

            <div className="divide-y divide-line">
              {HLD_PROBLEMS.map((p, idx) => {
                const done = completedIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openItem({ kind: 'hld', index: idx })}
                    className="grid w-full grid-cols-1 md:grid-cols-[44px_1.4fr_1.6fr_100px_130px] items-center gap-3 px-5 py-3.5 text-left text-sm transition-colors hover:bg-panel-2"
                  >
                    <span className="font-mono text-xs text-muted">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="font-medium text-chalk">{p.title}</span>
                    <span className="text-xs text-muted line-clamp-1">
                      {p.scale.peakRps} · {p.architectureNodes.map((n) => n.label.split(' ')[0]).slice(0, 4).join(' → ')}
                    </span>
                    <span className="text-xs text-muted">{p.difficulty}</span>
                    <span className="text-right text-xs font-medium text-chalk inline-flex items-center justify-end gap-1">
                      {done && <CheckCircle2 size={13} className="text-emerald" />}
                      <span>{done ? 'Completed →' : 'HLD + Lab →'}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

        </div>
      )}

      {/* SCREEN 2A: DEDICATED ARTICLE VIEW — OOP & SOLID */}
      {selected?.kind === 'solid' && (() => {
        const solid = SOLID_PLAYBOOK[selected.index] ?? SOLID_PLAYBOOK[0]
        return (
          <div className="mx-auto max-w-[820px] space-y-0">
            <div className="border-b border-line pb-7">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => openItem(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-1.5 text-xs font-medium text-chalk hover:bg-panel-2"
                >
                  <ArrowLeft size={13} />
                  <span>Back to System Design Syllabus</span>
                </button>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    disabled={selected.index === 0}
                    onClick={() => openItem({ kind: 'solid', index: selected.index - 1 })}
                    className="rounded border border-line bg-panel px-2.5 py-1 text-muted hover:text-chalk disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    disabled={selected.index >= SOLID_PLAYBOOK.length - 1}
                    onClick={() => openItem({ kind: 'solid', index: selected.index + 1 })}
                    className="rounded border border-line bg-panel px-2.5 py-1 text-muted hover:text-chalk disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Module 1 · OOP & SOLID Principles · Lesson 0{selected.index + 1}
              </div>
              <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-chalk">{solid.name}</h1>
              <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-muted">{solid.tagline}</p>
            </div>

            <section className="border-b border-line py-7 space-y-3">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs">1</span>
                <span>Core Concept & Real Company Scenario</span>
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                <strong className="font-semibold text-chalk">Mental Model:</strong> {solid.analogy}
              </p>
              <blockquote className="rounded-r-md border-l-[3px] border-muted/60 bg-panel px-4 py-3.5 text-sm leading-relaxed text-chalk">
                <strong className="block text-xs font-mono uppercase tracking-wider text-muted mb-1">
                  Production Code Review Scenario
                </strong>
                {solid.companyScenario}
              </blockquote>
            </section>


            <section className="border-b border-line py-7 space-y-3">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs">2</span>
                <span>When to Use vs. When NOT to Use (Avoiding Over-Engineering)</span>
              </h2>
              <div className="overflow-hidden rounded-md border border-line">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-panel text-xs font-semibold text-muted">
                      <th className="py-2.5 px-4 w-1/2">When to Apply {solid.letter}</th>
                      <th className="py-2.5 px-4 w-1/2">When NOT to Apply (YAGNI)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-sm">
                    <tr>
                      <td className="py-3 px-4 align-top text-chalk">
                        <ul className="list-disc list-inside space-y-1.5 text-muted">
                          {solid.whenToUse.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 px-4 align-top text-chalk">
                        <ul className="list-disc list-inside space-y-1.5 text-muted">
                          {solid.whenNotToUse.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="py-7 space-y-4">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs">3</span>
                <span>Before vs. After Production Python Refactor</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
                    Before (Brittle Coupling / Violation)
                  </div>
                  <pre className="overflow-x-auto rounded-md border border-line bg-panel p-4 font-mono text-xs leading-relaxed text-chalk">
                    {solid.badCode}
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
                    After (Clean Production Refactor)
                  </div>
                  <pre className="overflow-x-auto rounded-md border border-line bg-panel p-4 font-mono text-xs leading-relaxed text-chalk">
                    {solid.goodCode}
                  </pre>
                </div>
              </div>
            </section>

            {SYSTEM_DESIGN_ASSIGNMENTS[`solid-${solid.letter}`] && (
              <SystemDesignAssignment
                key={`solid-${solid.letter}`}
                spec={SYSTEM_DESIGN_ASSIGNMENTS[`solid-${solid.letter}`]}
                stepNumber={4}
                isCompleted={completedIds.includes(`solid-${solid.letter}`)}
                onCompleted={markCompleted}
                onNextLesson={() => {
                  if (selected.index < SOLID_PLAYBOOK.length - 1) {
                    openItem({ kind: 'solid', index: selected.index + 1 })
                  } else {
                    openItem({ kind: 'lld', index: 0 })
                  }
                }}
              />
            )}
          </div>
        )
      })()}


      {/* SCREEN 2B: DEDICATED ARTICLE VIEW — LOW-LEVEL DESIGN (LLD) */}
      {selected?.kind === 'lld' && (() => {
        const lld = LLD_PROBLEMS[selected.index] ?? LLD_PROBLEMS[0]
        return (
          <div className="mx-auto max-w-[820px] space-y-0">
            <div className="border-b border-line pb-7">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => openItem(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-1.5 text-xs font-medium text-chalk hover:bg-panel-2"
                >
                  <ArrowLeft size={13} />
                  <span>Back to System Design Syllabus</span>
                </button>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    disabled={selected.index === 0}
                    onClick={() => openItem({ kind: 'lld', index: selected.index - 1 })}
                    className="rounded border border-line bg-panel px-2.5 py-1 text-muted hover:text-chalk disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    disabled={selected.index >= LLD_PROBLEMS.length - 1}
                    onClick={() => openItem({ kind: 'lld', index: selected.index + 1 })}
                    className="rounded border border-line bg-panel px-2.5 py-1 text-muted hover:text-chalk disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Module 2 · Low-Level Design · {lld.patterns.join(' · ')}
              </div>
              <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-chalk">{lld.title}</h1>
              <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-muted">{lld.coreChallenge}</p>
            </div>

            <section className="border-b border-line py-7 space-y-4">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs">1</span>
                <span>Class & Interface Responsibilities</span>
              </h2>
              <div className="overflow-hidden rounded-md border border-line">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-panel text-xs font-semibold text-muted">
                      <th className="py-2.5 px-4 w-56">Class / Protocol</th>
                      <th className="py-2.5 px-4">Single Responsibility & Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-sm">
                    {lld.classes.map((cls) => (
                      <tr key={cls.name}>
                        <td className="py-2.5 px-4 font-mono text-xs font-semibold text-chalk">class {cls.name}</td>
                        <td className="py-2.5 px-4 text-muted">{cls.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-b border-line py-7 space-y-3">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs">2</span>
                <span>Core Concurrency & Domain Invariant</span>
              </h2>
              <blockquote className="rounded-r-md border-l-[3px] border-muted/60 bg-panel px-4 py-3.5 font-mono text-xs leading-relaxed text-chalk">
                {lld.invariant}
              </blockquote>
            </section>

            <section className="py-7 space-y-3">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs">3</span>
                <span>Production Python Implementation</span>
              </h2>
              <pre className="overflow-x-auto rounded-md border border-line bg-panel p-4 font-mono text-xs leading-relaxed text-chalk">
                {lld.codeSnippet}
              </pre>
            </section>

            {SYSTEM_DESIGN_ASSIGNMENTS[lld.id] && (
              <SystemDesignAssignment
                key={lld.id}
                spec={SYSTEM_DESIGN_ASSIGNMENTS[lld.id]}
                stepNumber={4}
                isCompleted={completedIds.includes(lld.id)}
                onCompleted={markCompleted}
                onNextLesson={() => {
                  if (selected.index < LLD_PROBLEMS.length - 1) {
                    openItem({ kind: 'lld', index: selected.index + 1 })
                  } else {
                    openItem({ kind: 'hld', index: 0 })
                  }
                }}
              />
            )}
          </div>
        )
      })()}


      {/* SCREEN 2C: DEDICATED ARTICLE VIEW — HIGH-LEVEL SYSTEM DESIGN (HLD) */}
      {selected?.kind === 'hld' && (() => {
        const hld = HLD_PROBLEMS[selected.index] ?? HLD_PROBLEMS[0]
        return (
          <div className="mx-auto max-w-[820px] space-y-0">
            <div className="border-b border-line pb-7">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => openItem(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-1.5 text-xs font-medium text-chalk hover:bg-panel-2"
                >
                  <ArrowLeft size={13} />
                  <span>Back to System Design Syllabus</span>
                </button>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    disabled={selected.index === 0}
                    onClick={() => openItem({ kind: 'hld', index: selected.index - 1 })}
                    className="rounded border border-line bg-panel px-2.5 py-1 text-muted hover:text-chalk disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    disabled={selected.index >= HLD_PROBLEMS.length - 1}
                    onClick={() => openItem({ kind: 'hld', index: selected.index + 1 })}
                    className="rounded border border-line bg-panel px-2.5 py-1 text-muted hover:text-chalk disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Module 3 · High-Level System Design · {hld.difficulty} · {hld.companies.join(', ')}
              </div>
              <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-chalk">{hld.title}</h1>
            </div>

            {/* Section 1: Scale & Capacity Requirements Table */}
            <section className="border-b border-line py-7 space-y-4">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs">1</span>
                <span>Scale Targets & Back-of-the-Envelope Estimates</span>
              </h2>
              <div className="overflow-hidden rounded-md border border-line">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-panel text-xs font-semibold text-muted">
                      <th className="py-2.5 px-4">Daily Active Scale</th>
                      <th className="py-2.5 px-4">Peak Concurrency / RPS</th>
                      <th className="py-2.5 px-4">Latency SLA</th>
                      <th className="py-2.5 px-4">Workload Profile</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs text-chalk">{hld.scale.dau}</td>
                      <td className="py-3 px-4 font-mono text-xs text-chalk">{hld.scale.peakRps}</td>
                      <td className="py-3 px-4 font-mono text-xs text-chalk">{hld.scale.latency}</td>
                      <td className="py-3 px-4 font-mono text-xs text-muted">{hld.scale.ratio}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>


            {/* Section 2: Why the Naive Single-Server Design Fails */}
            <section className="border-b border-line py-7 space-y-3">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs">2</span>
                <span>Why a Single-Server Monolith Fails</span>
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                <strong className="font-semibold text-chalk">Naive Prototype:</strong> {hld.naiveFailure.setup}
              </p>
              <blockquote className="rounded-r-md border-l-[3px] border-muted/60 bg-panel px-4 py-3.5 text-sm leading-relaxed text-chalk space-y-2">
                <div className="font-mono text-xs uppercase tracking-wider text-muted">
                  Breaking Point: {hld.naiveFailure.breakingPoint}
                </div>
                <ul className="list-disc list-inside space-y-1 text-muted">
                  {hld.naiveFailure.crashes.map((cr, idx) => (
                    <li key={idx}>{cr}</li>
                  ))}
                </ul>
              </blockquote>
            </section>

            {/* Section 3: Scaled Architecture & Interactive Hop-by-Hop Flow */}
            <section className="border-b border-line py-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs">3</span>
                  <span>Scaled Distributed Architecture (Hop-by-Hop Request Flow)</span>
                </h2>
                <span className="font-mono text-xs text-muted">
                  Hop {activeNodeIdx + 1} of {hld.architectureNodes.length}
                </span>
              </div>

              <div className="rounded-md border border-line bg-panel p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {hld.architectureNodes.map((node, idx) => {
                    const isCurrent = activeNodeIdx === idx
                    return (
                      <div key={node.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveNodeIdx(idx)}
                          className={`flex flex-col items-start rounded-md border px-3 py-2 text-left transition-colors ${
                            isCurrent
                              ? 'border-chalk bg-panel-3 text-chalk'
                              : 'border-line bg-panel-2 text-muted hover:text-chalk'
                          }`}
                        >
                          <span className="font-mono text-[10px] uppercase text-muted">
                            0{idx + 1} · {node.metric}
                          </span>
                          <span className="text-xs font-semibold text-chalk mt-0.5">{node.label}</span>
                        </button>
                        {idx < hld.architectureNodes.length - 1 && (
                          <ArrowRight size={13} className="text-muted shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="rounded-md border border-line bg-panel-2 p-4 text-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <strong className="font-semibold text-chalk">
                      Hop 0{activeNodeIdx + 1}: {hld.architectureNodes[activeNodeIdx]?.label}
                    </strong>
                    <div className="flex gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveNodeIdx((i) => Math.max(0, i - 1))}
                        className="rounded border border-line bg-panel px-2 py-0.5 text-muted hover:text-chalk"
                      >
                        ← Prev Hop
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveNodeIdx((i) => (i + 1) % hld.architectureNodes.length)}
                        className="rounded border border-line bg-panel px-2 py-0.5 text-chalk font-medium"
                      >
                        Next Hop →
                      </button>
                    </div>
                  </div>
                  <p className="text-muted leading-relaxed">{hld.architectureNodes[activeNodeIdx]?.role}</p>
                </div>
              </div>
            </section>


            {/* Section 4: Production Failure Modes & Defenses Table */}
            <section className="border-b border-line py-7 space-y-4">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs">4</span>
                <span>Failure Modes, Bottlenecks & Resilient Defenses</span>
              </h2>
              <div className="overflow-hidden rounded-md border border-line">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-panel text-xs font-semibold text-muted">
                      <th className="py-2.5 px-4 w-48">Failure Scenario</th>
                      <th className="py-2.5 px-4">What Breaks Without Defense</th>
                      <th className="py-2.5 px-4">Production Mitigation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-sm">
                    {hld.chaosScenarios.map((cs) => (
                      <tr key={cs.id}>
                        <td className="py-3 px-4 align-top">
                          <div className="font-medium text-chalk">{cs.name}</div>
                          <div className="font-mono text-xs text-muted mt-0.5">{cs.trigger}</div>
                        </td>
                        <td className="py-3 px-4 align-top text-muted">{cs.brokenWithoutDefense}</td>
                        <td className="py-3 px-4 align-top text-chalk">{cs.defenseMechanism}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 5: How to Present This in an Interview + References */}
            <section className="py-7 space-y-5">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs">5</span>
                <span>Interview Summary & Engineering References</span>
              </h2>

              <div className="space-y-3 text-sm leading-relaxed text-muted">
                <p>
                  <strong className="font-semibold text-chalk">1. Core Architectural Thesis:</strong> "{hld.seniorPitch.hook}"
                </p>
                <p>
                  <strong className="font-semibold text-chalk">2. End-to-End Request Lifecycle:</strong> "{hld.seniorPitch.flow}"
                </p>
                <p>
                  <strong className="font-semibold text-chalk">3. Key Trade-offs:</strong> "{hld.seniorPitch.tradeoffs}"
                </p>
                <p>
                  <strong className="font-semibold text-chalk">4. Edge-Case Defense:</strong> "{hld.seniorPitch.defense}"
                </p>
              </div>

              <div className="pt-2">
                <div className="text-xs font-mono uppercase tracking-wider text-muted mb-2.5">
                  Further Reading & Engineering Blogs
                </div>
                <div className="divide-y divide-line rounded-md border border-line bg-panel">
                  {hld.references.map((ref) => (
                    <a
                      key={ref.title}
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-panel-2"
                    >
                      <div>
                        <div className="font-medium text-chalk">
                          {ref.title} <span className="font-mono text-xs text-muted">· {ref.author}</span>
                        </div>
                        <div className="text-xs text-muted mt-0.5">{ref.takeaway}</div>
                      </div>
                      <ExternalLink size={14} className="text-muted shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </section>

            {SYSTEM_DESIGN_ASSIGNMENTS[hld.id] && (
              <SystemDesignAssignment
                key={hld.id}
                spec={SYSTEM_DESIGN_ASSIGNMENTS[hld.id]}
                stepNumber={6}
                isCompleted={completedIds.includes(hld.id)}
                onCompleted={markCompleted}
                onNextLesson={
                  selected.index < HLD_PROBLEMS.length - 1
                    ? () => openItem({ kind: 'hld', index: selected.index + 1 })
                    : () => openItem(null)
                }
              />
            )}
          </div>
        )
      })()}
    </div>
  )
}



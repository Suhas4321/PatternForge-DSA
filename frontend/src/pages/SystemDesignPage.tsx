import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Sky from '../components/Sky'
import {
  HLD_PROBLEMS,
  LLD_PROBLEMS,
  SOLID_PLAYBOOK,
  type HldProblem,
} from '../lib/systemDesignData'

type PyramidLevel = 'solid' | 'lld' | 'hld'
type HldStage = 1 | 2 | 3 | 4

export default function SystemDesignPage() {
  const [level, setLevel] = useState<PyramidLevel>('hld')
  const [activeSolidIdx, setActiveSolidIdx] = useState(0)
  const [activeLldIdx, setActiveLldIdx] = useState(0)
  const [activeHldId, setActiveHldId] = useState<string>(HLD_PROBLEMS[0].id)
  const [hldStage, setHldStage] = useState<HldStage>(1)
  const [activeNodeIdx, setActiveNodeIdx] = useState(0)
  const [activeChaosIdx, setActiveChaosIdx] = useState<number>(0)

  const hld: HldProblem = HLD_PROBLEMS.find((p) => p.id === activeHldId) ?? HLD_PROBLEMS[0]
  const solid = SOLID_PLAYBOOK[activeSolidIdx] ?? SOLID_PLAYBOOK[0]
  const lld = LLD_PROBLEMS[activeLldIdx] ?? LLD_PROBLEMS[0]

  const selectHld = (id: string) => {
    setActiveHldId(id)
    setHldStage(1)
    setActiveNodeIdx(0)
    setActiveChaosIdx(0)
  }

  return (
    <div className="shell max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
      {/* Dark Sky Banner — Always crisp white text in both Light & Dark Mode */}
      <div
        data-zone="night"
        className="relative min-h-[180px] w-full overflow-hidden rounded-3xl border border-line p-6 sm:p-8 flex flex-col justify-between shadow-2xl bg-[#05070E] text-white"
      >
        <Sky variant="galaxy" accent="#A78BFA" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>All Citadels</span>
            </Link>
            <span className="font-plate text-xs font-bold uppercase tracking-wider text-violet-300">
              Citadel VII · Bottom-to-Top Architecture Studio
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-2xs font-semibold text-emerald-300 border border-emerald-400/30">
            5 SOLID · 5 LLD · 10 HLD Systems
          </span>
        </div>

        <div className="relative z-10 mt-3">
          <h1 className="font-plate text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-md">
            Interactive System Design: OOP & SOLID ➔ LLD ➔ HLD at Scale
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-3xl leading-relaxed">
            Start from single-file OOP & SOLID principles, bridge into company Low-Level Design (LLD) machine coding, and scale up to 10 High-Level Distributed Systems (HLD) with interactive Chaos Mode.
          </p>
        </div>
      </div>

      {/* Bottom-to-Top Pyramid Level Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setLevel('solid')}
          className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
            level === 'solid' ? 'border-cyan bg-cyan/10 shadow-md' : 'border-line bg-panel hover:bg-panel-2'
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan/15 text-cyan font-mono font-bold">
            L1
          </span>
          <div>
            <div className="text-2xs font-mono uppercase text-cyan font-semibold">Level 1 · Foundation</div>
            <div className="font-plate text-sm font-bold text-chalk">OOP & Practical SOLID Playbook</div>
            <div className="text-2xs text-muted">When to use vs. When NOT to use (YAGNI)</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setLevel('lld')}
          className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
            level === 'lld' ? 'border-amber bg-amber/10 shadow-md' : 'border-line bg-panel hover:bg-panel-2'
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/15 text-amber font-mono font-bold">
            L2
          </span>
          <div>
            <div className="text-2xs font-mono uppercase text-amber font-semibold">Level 2 · Machine Coding</div>
            <div className="font-plate text-sm font-bold text-chalk">5 Low-Level Design (LLD) Classics</div>
            <div className="text-2xs text-muted">Parking Lot, Splitwise, BookMyShow, Elevator</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setLevel('hld')}
          className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
            level === 'hld' ? 'border-emerald bg-emerald/10 shadow-md' : 'border-line bg-panel hover:bg-panel-2'
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald/15 text-emerald font-mono font-bold">
            L3
          </span>
          <div>
            <div className="text-2xs font-mono uppercase text-emerald font-semibold">Level 3 · Distributed Scale</div>
            <div className="font-plate text-sm font-bold text-chalk">10 High-Level Systems (HLD) + Chaos</div>
            <div className="text-2xs text-muted">1,000-User Code Runner, Rate Limiter, Uber H3</div>
          </div>
        </button>
      </div>
      {level === 'solid' && (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
          <aside className="flex flex-col gap-2 rounded-2xl border border-line bg-panel p-3 h-fit">
            <div className="px-2 py-1 text-2xs font-mono uppercase text-muted font-bold">SOLID Principles (5)</div>
            {SOLID_PLAYBOOK.map((sp, i) => (
              <button
                key={sp.letter}
                type="button"
                onClick={() => setActiveSolidIdx(i)}
                className={`flex items-center gap-2.5 rounded-xl p-2.5 text-left text-xs transition-all ${
                  activeSolidIdx === i ? 'border border-cyan/40 bg-cyan/10 text-chalk font-semibold' : 'text-muted hover:bg-panel-2 hover:text-chalk'
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan/15 font-mono font-bold text-cyan">
                  {sp.letter}
                </span>
                <span className="truncate">{sp.name.replace(/ \(.*\)/, '')}</span>
              </button>
            ))}
          </aside>

          <div className="card rounded-2xl border border-line bg-panel p-5 flex flex-col gap-4">
            <div>
              <span className="font-mono text-2xs uppercase text-cyan font-bold">Practical Company Playbook</span>
              <h2 className="font-plate text-xl font-bold text-chalk mt-0.5">{solid.name}</h2>
              <p className="text-sm text-muted mt-1">{solid.tagline}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-panel-2 p-3.5 text-xs">
                <strong className="text-cyan block mb-1">💡 Real-World Analogy</strong>
                <p className="text-chalk leading-relaxed">{solid.analogy}</p>
              </div>
              <div className="rounded-xl border border-line bg-panel-2 p-3.5 text-xs">
                <strong className="text-amber block mb-1">🏢 Real Company Bug It Fixes</strong>
                <p className="text-chalk leading-relaxed">{solid.companyScenario}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-3.5 text-xs">
                <strong className="text-emerald block mb-1.5">✅ WHEN TO USE IT (Trigger Signals)</strong>
                <ul className="list-disc list-inside space-y-1 text-chalk">
                  {solid.whenToUse.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-crimson/30 bg-crimson/5 p-3.5 text-xs">
                <strong className="text-crimson block mb-1.5">❌ WHEN NOT TO USE IT (Avoid Over-Engineering)</strong>
                <ul className="list-disc list-inside space-y-1 text-chalk">
                  {solid.whenNotToUse.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 font-mono text-xs">
              <div className="rounded-xl border border-line bg-panel-2 p-3">
                <div className="text-2xs text-crimson font-bold mb-1.5">❌ Violation (Brittle Code)</div>
                <pre className="overflow-x-auto text-chalk">{solid.badCode}</pre>
              </div>
              <div className="rounded-xl border border-line bg-panel-2 p-3">
                <div className="text-2xs text-emerald font-bold mb-1.5">✓ Clean SOLID Refactor</div>
                <pre className="overflow-x-auto text-chalk">{solid.goodCode}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
      {level === 'lld' && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          <aside className="flex flex-col gap-2 rounded-2xl border border-line bg-panel p-3 h-fit">
            <div className="px-2 py-1 text-2xs font-mono uppercase text-muted font-bold">LLD Machine Coding (5)</div>
            {LLD_PROBLEMS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveLldIdx(i)}
                className={`rounded-xl p-2.5 text-left text-xs transition-all ${
                  activeLldIdx === i ? 'border border-amber/40 bg-amber/10 text-chalk font-semibold' : 'text-muted hover:bg-panel-2 hover:text-chalk'
                }`}
              >
                {p.title}
              </button>
            ))}
          </aside>

          <div className="card rounded-2xl border border-line bg-panel p-5 flex flex-col gap-4">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {lld.patterns.map((pat) => (
                  <span key={pat} className="rounded-full border border-amber/30 bg-amber/10 px-2.5 py-0.5 font-mono text-2xs text-amber">
                    {pat}
                  </span>
                ))}
              </div>
              <h2 className="font-plate text-xl font-bold text-chalk">{lld.title}</h2>
              <p className="text-sm text-muted mt-1">{lld.coreChallenge}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {lld.classes.map((cls) => (
                <div key={cls.name} className="rounded-xl border border-line bg-panel-2 p-3 text-xs">
                  <div className="font-mono font-bold text-cyan mb-1">class {cls.name}</div>
                  <p className="text-muted">{cls.role}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-3.5 text-xs">
              <strong className="text-emerald block mb-1">🔒 Core Concurrency & Domain Invariant:</strong>
              <p className="font-mono text-chalk">{lld.invariant}</p>
            </div>

            <div className="rounded-xl border border-line bg-panel-2 p-3.5 font-mono text-xs">
              <div className="text-2xs text-muted mb-1.5">Production Python Skeleton</div>
              <pre className="overflow-x-auto text-chalk">{lld.codeSnippet}</pre>
            </div>
          </div>
        </div>
      )}
      {level === 'hld' && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          <aside className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-3 h-fit">
            {([1, 2, 3] as const).map((tierNum) => (
              <div key={tierNum} className="flex flex-col gap-1">
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald font-bold">
                  {tierNum === 1 ? 'Tier 1 · Core & DevTools' : tierNum === 2 ? 'Tier 2 · Real-Time & Cache' : 'Tier 3 · Global Scale'}
                </div>
                {HLD_PROBLEMS.filter((p) => p.tier === tierNum).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectHld(p.id)}
                    className={`rounded-xl p-2 text-left text-xs transition-all ${
                      activeHldId === p.id ? 'border border-emerald/40 bg-emerald/10 text-chalk font-semibold' : 'text-muted hover:bg-panel-2 hover:text-chalk'
                    }`}
                  >
                    <div className="line-clamp-2 leading-snug">{p.title}</div>
                  </button>
                ))}
              </div>
            ))}
          </aside>

          <div className="card rounded-2xl border border-line bg-panel p-5 flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span className="rounded-md bg-emerald/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald">
                    Tier {hld.tier} · {hld.difficulty}
                  </span>
                  {hld.companies.map((co) => (
                    <span key={co} className="rounded-md border border-line bg-panel-2 px-2 py-0.5 font-mono text-[10px] text-muted">
                      {co}
                    </span>
                  ))}
                </div>
                <h2 className="font-plate text-xl font-bold text-chalk">{hld.title}</h2>
              </div>

              <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-panel-2 p-1 text-xs">
                {[
                  { id: 1, label: '1. Scope & Math' },
                  { id: 2, label: '2. Naive Failure' },
                  { id: 3, label: '3. Flow & Chaos' },
                  { id: 4, label: '4. Senior Pitch' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setHldStage(st.id as HldStage)}
                    className={`rounded-lg px-2.5 py-1 font-medium ${
                      hldStage === st.id ? 'bg-panel-3 text-cyan font-bold border border-cyan/40' : 'text-muted hover:text-chalk'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
            {hldStage === 1 && (
              <div className="flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
                  <div className="rounded-xl border border-line bg-panel-2 p-3">
                    <div className="text-[10px] uppercase text-muted">Daily Active Users</div>
                    <div className="text-base font-bold text-chalk mt-1">{hld.scale.dau}</div>
                  </div>
                  <div className="rounded-xl border border-line bg-panel-2 p-3">
                    <div className="text-[10px] uppercase text-muted">Peak Concurrency</div>
                    <div className="text-base font-bold text-cyan mt-1">{hld.scale.peakRps}</div>
                  </div>
                  <div className="rounded-xl border border-line bg-panel-2 p-3">
                    <div className="text-[10px] uppercase text-muted">Latency SLA</div>
                    <div className="text-base font-bold text-emerald mt-1">{hld.scale.latency}</div>
                  </div>
                  <div className="rounded-xl border border-line bg-panel-2 p-3">
                    <div className="text-[10px] uppercase text-muted">Traffic Profile</div>
                    <div className="text-base font-bold text-amber mt-1">{hld.scale.ratio}</div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setHldStage(2)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cyan px-4 py-2 text-xs font-bold text-slate-950"
                  >
                    <span>Next: Watch Naive Prototype Fail</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {hldStage === 2 && (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-line bg-panel-2 p-4 text-xs">
                  <strong className="text-chalk block mb-1">1. The Naive Monolith Setup:</strong>
                  <p className="text-muted">{hld.naiveFailure.setup}</p>
                </div>
                <div className="rounded-xl border border-crimson/40 bg-crimson/10 p-4 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-crimson mb-2">
                    <AlertTriangle size={15} />
                    <span>2. The Breaking Point: {hld.naiveFailure.breakingPoint}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-chalk">
                    {hld.naiveFailure.crashes.map((cr, idx) => (
                      <li key={idx}>{cr}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setHldStage(3)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald px-4 py-2 text-xs font-bold text-slate-950"
                  >
                    <span>Next: Scaled Architecture & Chaos Simulator</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
            {hldStage === 3 && (
              <div className="flex flex-col gap-5">
                <div className="stage p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>⚡ Interactive Packet Scrubber (Click any node or Step Next)</span>
                    <span className="text-cyan">
                      Hop {activeNodeIdx + 1} of {hld.architectureNodes.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 py-4">
                    {hld.architectureNodes.map((node, idx) => {
                      const isCurrent = activeNodeIdx === idx
                      return (
                        <div key={node.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveNodeIdx(idx)}
                            className={`flex flex-col items-center justify-center rounded-2xl border p-3 w-44 text-center transition-all ${
                              isCurrent ? 'scale-105 border-white shadow-lg' : 'border-white/15 bg-[#101420] opacity-75 hover:opacity-100'
                            }`}
                            style={{
                              borderColor: isCurrent ? node.color : undefined,
                              backgroundColor: isCurrent ? `${node.color}22` : undefined,
                            }}
                          >
                            <span className="font-mono text-[10px] font-bold uppercase" style={{ color: node.color }}>
                              {node.metric}
                            </span>
                            <span className="font-plate text-xs font-bold text-white mt-1 leading-snug">
                              {node.label}
                            </span>
                          </button>
                          {idx < hld.architectureNodes.length - 1 && (
                            <ArrowRight size={15} className="text-slate-400 shrink-0" />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="rounded-xl border border-white/15 bg-[#101626] p-4 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-white text-sm">{hld.architectureNodes[activeNodeIdx]?.label}</strong>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveNodeIdx((i) => Math.max(0, i - 1))}
                          className="rounded border border-white/15 px-2 py-0.5 text-slate-300 hover:text-white"
                        >
                          ← Prev Hop
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveNodeIdx((i) => (i + 1) % hld.architectureNodes.length)}
                          className="rounded border border-cyan/40 bg-cyan/15 px-2 py-0.5 text-cyan font-semibold"
                        >
                          Next Hop →
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{hld.architectureNodes[activeNodeIdx]?.role}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber/40 bg-panel-2 p-4 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber">
                      <Zap size={14} /> Chaos Mode Injection (Stress-Test Your Design)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {hld.chaosScenarios.map((cs, i) => (
                        <button
                          key={cs.id}
                          type="button"
                          onClick={() => setActiveChaosIdx(i)}
                          className={`rounded-lg border px-2.5 py-1 text-2xs font-mono ${
                            activeChaosIdx === i ? 'border-amber bg-amber/20 text-amber font-bold' : 'border-line bg-panel text-muted hover:text-chalk'
                          }`}
                        >
                          💥 {cs.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {hld.chaosScenarios[activeChaosIdx] && (
                    <div className="grid gap-3 md:grid-cols-2 text-xs">
                      <div className="rounded-xl border border-crimson/30 bg-crimson/10 p-3">
                        <strong className="text-crimson block mb-1">Without Defense ({hld.chaosScenarios[activeChaosIdx].trigger}):</strong>
                        <p className="text-chalk">{hld.chaosScenarios[activeChaosIdx].brokenWithoutDefense}</p>
                      </div>
                      <div className="rounded-xl border border-emerald/30 bg-emerald/10 p-3">
                        <strong className="text-emerald block mb-1">✓ Resilient Defense Mechanism:</strong>
                        <p className="text-chalk">{hld.chaosScenarios[activeChaosIdx].defenseMechanism}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {hldStage === 4 && (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-cyan/30 bg-cyan/5 p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold uppercase text-cyan">
                      <ShieldCheck size={15} /> 60-Second Senior Interview Talk Track (Study Mode)
                    </span>
                    <span className="font-mono text-2xs text-muted">~130 WPM Pacing</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-line bg-panel p-3">
                      <strong className="text-cyan block mb-1">1. Hook & Core Invariant (0–15s)</strong>
                      <p className="text-chalk leading-relaxed">"{hld.seniorPitch.hook}"</p>
                    </div>
                    <div className="rounded-lg border border-line bg-panel p-3">
                      <strong className="text-emerald block mb-1">2. End-to-End Data Flow (15–40s)</strong>
                      <p className="text-chalk leading-relaxed">"{hld.seniorPitch.flow}"</p>
                    </div>
                    <div className="rounded-lg border border-line bg-panel p-3">
                      <strong className="text-amber block mb-1">3. Trade-offs & Edge Cases (40–50s)</strong>
                      <p className="text-chalk leading-relaxed">"{hld.seniorPitch.tradeoffs}"</p>
                    </div>
                    <div className="rounded-lg border border-line bg-panel p-3">
                      <strong className="text-crimson block mb-1">4. Interviewer Defense (50–60s)</strong>
                      <p className="text-chalk leading-relaxed">"{hld.seniorPitch.defense}"</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                    📚 Curated Deep-Dive Engineering References
                  </h4>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {hld.references.map((ref) => (
                      <a
                        key={ref.title}
                        href={ref.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col justify-between rounded-xl border border-line bg-panel-2 p-3 text-xs hover:border-cyan transition-colors"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 font-semibold text-chalk">
                            <span>{ref.title}</span>
                            <ExternalLink size={12} className="text-cyan shrink-0" />
                          </div>
                          <span className="text-2xs font-mono text-cyan">{ref.author}</span>
                        </div>
                        <p className="text-2xs text-muted mt-1.5">{ref.takeaway}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import { CheckCircle2, ChevronRight, Layers, Server, ShieldCheck } from 'lucide-react'
import { HLD_PROBLEMS, LLD_PROBLEMS, SOLID_PLAYBOOK } from '../../lib/systemDesignData'
import type { SelectedItem } from './SystemDesignSidebar'

interface Props {
  completedIds: string[]
  onOpenItem: (item: SelectedItem) => void
}

export default function SystemDesignSyllabusView({ completedIds, onOpenItem }: Props) {
  const groups = [
    {
      key: 'solid' as const,
      title: 'Module 1: OOP & SOLID Principles',
      icon: ShieldCheck,
      color: 'text-violet-400',
      items: SOLID_PLAYBOOK.map((s, i) => ({ id: `solid-${s.letter}`, num: `0${i + 1}`, title: s.name, subtitle: s.tagline })),
    },
    {
      key: 'lld' as const,
      title: 'Module 2: Low-Level System Design (LLD)',
      icon: Layers,
      color: 'text-cyan',
      items: LLD_PROBLEMS.map((l, i) => ({ id: l.id, num: `0${i + 1}`, title: l.title, subtitle: l.patterns.join(' · ') })),
    },
    {
      key: 'hld' as const,
      title: 'Module 3: Distributed Systems (HLD)',
      icon: Server,
      color: 'text-amber',
      items: HLD_PROBLEMS.map((h, i) => ({ id: h.id, num: String(i + 1).padStart(2, '0'), title: h.title, subtitle: `${h.scale.peakRps} · ${h.companies.join(', ')}` })),
    },
  ]

  return (
    <div className="space-y-8 pb-16">
      <div className="border-b border-line pb-6 space-y-2">
        <span className="font-mono text-2xs uppercase tracking-wider text-violet-600 dark:text-violet-400 font-semibold">
          Citadel VII · Architecture Master Syllabus
        </span>
        <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
          System Design Track: OOP/SOLID → LLD → Distributed HLD
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-muted">
          From first-principles OOP patterns to concurrent LLD and high-throughput distributed systems.
          Pass each hands-on interactive assignment to complete the module.
        </p>
      </div>

      {groups.map((g) => {
        const Icon = g.icon
        return (
          <section key={g.key} className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="flex items-center gap-2">
                <Icon size={16} className={g.color} />
                <h2 className="font-plate text-lg font-bold text-chalk">{g.title}</h2>
              </div>
              <span className="font-mono text-2xs text-muted">{g.items.length} Modules</span>
            </div>

            <div className="divide-y divide-line rounded-lg border border-line bg-panel overflow-hidden">
              {g.items.map((item, idx) => {
                const done = completedIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenItem({ kind: g.key, index: idx })}
                    className="w-full flex items-center justify-between p-3.5 text-left transition-colors hover:bg-panel-2 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-2xs text-muted">{item.num}</span>
                      <div>
                        <span className="font-medium text-chalk block">{item.title}</span>
                        <span className="text-xs text-muted line-clamp-1">{item.subtitle}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {done ? (
                        <span className="inline-flex items-center gap-1 text-emerald text-xs font-semibold">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      ) : (
                        <span className="text-xs text-muted flex items-center gap-1 hover:text-chalk">
                          Start <ChevronRight size={12} />
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

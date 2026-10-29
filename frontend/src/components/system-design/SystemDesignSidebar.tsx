import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Layers, LayoutGrid, Server, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HLD_PROBLEMS, LLD_PROBLEMS, SOLID_PLAYBOOK } from '../../lib/systemDesignData'

export type SelectedItem =
  | { kind: 'solid'; index: number }
  | { kind: 'lld'; index: number }
  | { kind: 'hld'; index: number }
  | null

interface Props {
  selected: SelectedItem
  onSelect: (item: SelectedItem) => void
  completedIds: string[]
  solvedCount: number
  totalCount: number
}

export default function SystemDesignSidebar({
  selected,
  onSelect,
  completedIds,
  solvedCount,
  totalCount,
}: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ solid: true, lld: true, hld: true })
  const toggle = (k: string) => setOpenSections((p) => ({ ...p, [k]: !p[k] }))
  const pct = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0

  const solidItems = SOLID_PLAYBOOK.map((sp, i) => ({ id: `solid-${sp.letter}`, num: `0${i + 1}`, label: sp.name.split('(')[0].trim(), tag: sp.letter }))
  const lldItems = LLD_PROBLEMS.map((l, i) => ({ id: l.id, num: `0${i + 1}`, label: l.title.replace(/^\d+\.\s*/, ''), tag: 'LLD' }))
  const hldItems = HLD_PROBLEMS.map((h, i) => ({ id: h.id, num: String(i + 1).padStart(2, '0'), label: h.title.replace(/^\d+\.\s*/, ''), tag: h.difficulty }))

  const sections = [
    { key: 'solid' as const, name: '1. OOP & SOLID', icon: ShieldCheck, color: 'text-violet-600 dark:text-violet-400', active: 'border-violet-500 bg-violet-500/10 dark:bg-violet-600/20', items: solidItems },
    { key: 'lld' as const, name: '2. Low-Level Design', icon: Layers, color: 'text-cyan', active: 'border-cyan bg-cyan/10 dark:bg-cyan-600/20', items: lldItems },
    { key: 'hld' as const, name: '3. Distributed HLD', icon: Server, color: 'text-amber', active: 'border-amber bg-amber/10 dark:bg-amber-600/20', items: hldItems },
  ]

  return (
    <aside className="w-72 shrink-0 border-r border-line bg-panel flex flex-col h-screen sticky top-0 select-none overflow-hidden">
      <div className="p-4 border-b border-line bg-panel-2 space-y-2.5">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-chalk transition-colors">
          <ArrowLeft size={13} />
          <span>Exit to Dashboard</span>
        </Link>
        <div>
          <div className="flex items-center justify-between text-2xs">
            <span className="font-plate font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Citadel VII</span>
            <span className="font-mono text-muted">{solvedCount}/{totalCount} Done ({pct}%)</span>
          </div>
          <h2 className="font-plate text-sm font-bold text-chalk mt-0.5">System Design & Architecture</h2>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-panel-3">
            <div className="h-full rounded-full bg-violet-500 dark:bg-violet-400 transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            selected === null ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30' : 'text-muted hover:bg-panel hover:text-chalk'
          }`}
        >
          <LayoutGrid size={13} />
          <span>Curriculum Overview</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2.5 text-xs">
        {sections.map((sec) => {
          const Icon = sec.icon
          const isOpen = openSections[sec.key]
          const doneCount = sec.items.filter((it) => completedIds.includes(it.id)).length

          return (
            <div key={sec.key}>
              <button
                type="button"
                onClick={() => toggle(sec.key)}
                className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted hover:text-chalk"
              >
                <div className="flex items-center gap-1.5">
                  <Icon size={13} className={sec.color} />
                  <span>{sec.name} ({doneCount}/{sec.items.length})</span>
                </div>
                {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>

              {isOpen && (
                <div className="mt-0.5 space-y-0.5">
                  {sec.items.map((it, idx) => {
                    const isSelected = selected?.kind === sec.key && selected.index === idx
                    const done = completedIds.includes(it.id)
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => onSelect({ kind: sec.key, index: idx })}
                        className={`flex w-full items-center justify-between gap-1.5 rounded px-2 py-1.5 text-left transition-colors ${
                          isSelected ? `${sec.active} text-chalk font-semibold border-l-2` : 'text-muted hover:bg-panel-2 hover:text-chalk'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-2xs text-faint">{it.num}</span>
                          <span className="truncate">{it.label}</span>
                        </div>
                        {done ? <CheckCircle2 size={12} className="text-emerald shrink-0" /> : <span className="font-mono text-[10px] text-faint shrink-0">{it.tag}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

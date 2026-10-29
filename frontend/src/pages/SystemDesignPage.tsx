import { useState } from 'react'
import SystemDesignSidebar, { type SelectedItem } from '../components/system-design/SystemDesignSidebar'
import SystemDesignSolidView from '../components/system-design/SystemDesignSolidView'
import SystemDesignLldView from '../components/system-design/SystemDesignLldView'
import SystemDesignHldView from '../components/system-design/SystemDesignHldView'
import SystemDesignSyllabusView from '../components/system-design/SystemDesignSyllabusView'
import { markSystemDesignCompleted, useSystemDesignProgress } from '../lib/systemDesignProgress'

export default function SystemDesignPage() {
  const [selected, setSelected] = useState<SelectedItem>({ kind: 'solid', index: 0 })
  const { solved, total, completedIds } = useSystemDesignProgress()

  const handleSelect = (next: SelectedItem) => {
    setSelected(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCompleted = (id: string) => {
    markSystemDesignCompleted(id)
  }

  return (
    <div className="w-full min-h-screen bg-void text-chalk flex overflow-hidden">
      {/* 1. Left Sticky Navigation Tree (FastAPI / W3Schools style) */}
      <SystemDesignSidebar
        selected={selected}
        onSelect={handleSelect}
        completedIds={completedIds}
        solvedCount={solved}
        totalCount={total}
      />

      {/* 2. Main Fluid Reading Canvas (Full Display Utilization) */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto px-6 sm:px-12 py-8">
        <div className="max-w-4xl mx-auto xl:mx-0">
          {selected === null && (
            <SystemDesignSyllabusView
              completedIds={completedIds}
              onOpenItem={handleSelect}
            />
          )}

          {selected?.kind === 'solid' && (
            <SystemDesignSolidView
              index={selected.index}
              onNavigate={handleSelect}
              completedIds={completedIds}
              onCompleted={handleCompleted}
            />
          )}

          {selected?.kind === 'lld' && (
            <SystemDesignLldView
              index={selected.index}
              onNavigate={handleSelect}
              completedIds={completedIds}
              onCompleted={handleCompleted}
            />
          )}

          {selected?.kind === 'hld' && (
            <SystemDesignHldView
              index={selected.index}
              onNavigate={handleSelect}
              completedIds={completedIds}
              onCompleted={handleCompleted}
            />
          )}
        </div>
      </main>

      {/* 3. Right Sticky "On This Page" Table of Contents (FastAPI / MkDocs style) */}
      {selected !== null && (
        <aside className="hidden 2xl:block w-60 shrink-0 border-l border-line bg-panel h-screen sticky top-0 p-5 space-y-4 select-none">
          <div className="font-mono text-2xs uppercase tracking-wider text-muted font-semibold">
            On This Page
          </div>
          <nav className="flex flex-col space-y-2 text-xs text-muted">
            {selected.kind === 'solid' && (
              <>
                <a href="#section-concept" className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors">1. Mental Model & Scenario</a>
                <a href="#section-tradeoffs" className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors">2. When to Apply vs YAGNI</a>
                <a href="#section-code" className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors">3. Before vs After Refactor</a>
                <a href="#section-lab" className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors">4. Hands-On Coding Lab</a>
              </>
            )}

            {selected.kind === 'lld' && (
              <>
                <a href="#section-classes" className="hover:text-cyan transition-colors">1. Class Responsibilities</a>
                <a href="#section-invariant" className="hover:text-cyan transition-colors">2. Domain Invariant</a>
                <a href="#section-code" className="hover:text-cyan transition-colors">3. Python Implementation</a>
                <a href="#section-lab" className="hover:text-cyan transition-colors">4. Hands-On Coding Lab</a>
              </>
            )}

            {selected.kind === 'hld' && (
              <>
                <a href="#section-scale" className="hover:text-amber transition-colors">1. Scale Targets & SLA</a>
                <a href="#section-failure" className="hover:text-amber transition-colors">2. Monolith Breaking Point</a>
                <a href="#section-architecture" className="hover:text-amber transition-colors">3. Scaled Hop Flow</a>
                <a href="#section-defenses" className="hover:text-amber transition-colors">4. Failure & Defenses</a>
                <a href="#section-interview" className="hover:text-amber transition-colors">5. Senior Pitch</a>
                <a href="#section-lab" className="hover:text-amber transition-colors">6. Hands-On Coding Lab</a>
              </>
            )}
          </nav>

          <div className="pt-4 border-t border-line text-2xs text-muted">
            <span className="block font-semibold text-chalk mb-1">Pass to Complete</span>
            Solve the hands-on lab in each lesson to track completion in Citadel VII.
          </div>
        </aside>
      )}
    </div>
  )
}


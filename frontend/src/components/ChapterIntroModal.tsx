import { ArrowRight, CheckCircle2, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Citadel } from '../lib/citadels'
import { Button } from './ui'
import { GlassSurface } from './vendor/vsrc/glass-surface'

interface ChapterIntroModalProps {
  citadel: Citadel
}

const PEAK_LEARNING_OBJECTIVES: Record<string, string[]> = {
  dsa: [
    'Master 12 algorithmic worlds from two-pointer fundamentals to multi-dimensional dynamic programming.',
    'Visualize memory allocations, pointer shifts, and recursion call-stacks at every execution step.',
    'Formulate crisp, interview-grade pitch scripts (Clarify → Brute force → Optimal trade-offs).',
  ],
  python_data: [
    'Tackle Python runtime internals: closures, late-binding closures trap, and GIL thread behavior.',
    'Vectorized DataFrames, high-performance grouping, rolling aggregations, and p95 latency analysis.',
    'Object-oriented design patterns: Strategy, Observer event buses, and robust retry backoffs.',
  ],
  sql_dbms: [
    'Execute robust ACID transactions, conditional UPDATEs, and eliminate lost updates under contention.',
    'Index optimization: dissect EXPLAIN QUERY PLAN to build high-performance composite B-tree indices.',
    'Complex analytical SQL: window frames, LAG/LEAD growth rates, CTE pipelines, and 3NF decomposition.',
  ],
  os_concurrency: [
    'Thread synchronization: mutexes, reentrant locks, semaphores, and condition variable pipelines.',
    'Race conditions and deadlock prevention under high-concurrency simulation without false flakiness.',
    'Asynchronous event loop scheduling, worker pools, and zero-downtime task orchestration.',
  ],
  backend_apis: [
    'Production-ready FastAPI architecture with strict Pydantic schemas and lifecycle dependency injection.',
    'Stateless JWT authentication, bearer token verification, and role-based access control.',
    'Idempotency keys, distributed rate-limiting middleware, and background job polling contracts.',
  ],
  ai_resume: [
    'Defend every bullet on your resume against ruthless technical interrogation and architectural probes.',
    'RAG architectures: recursive overlap chunking, vector embeddings, and cross-encoder reranking.',
    'LangGraph state machines, guardrails, fallback providers, and GEPA prompt optimization.',
  ],
}

export default function ChapterIntroModal({ citadel }: ChapterIntroModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(`pf-chapter-intro-${citadel.id}`)
      if (!seen) {
        setIsOpen(true)
      }
    } catch {
      // localStorage disabled or private browsing
    }
  }, [citadel.id])

  const handleClose = () => {
    try {
      localStorage.setItem(`pf-chapter-intro-${citadel.id}`, 'true')
    } catch {
      // noop
    }
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, citadel.id])

  if (!isOpen) return null

  const story = citadel.tagline
    ? `${citadel.tagline}. ${citadel.description}`
    : citadel.description || 'Welcome to this engineering mountain peak. Master key industry patterns.'

  const objectives = PEAK_LEARNING_OBJECTIVES[citadel.id] || [
    'Master foundational and advanced system patterns through interactive drills.',
    'Step-by-step visual feedback and deterministic testing harnesses.',
    'Real-world product company scenario preparation.',
  ]

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
        <GlassSurface
          asChild
          glass={{
            scale: -64,
            chroma: 2.5,
            border: 0.12,
            mapBlur: 12,
            blur: 18,
            saturate: 1.3,
            fallbackBlur: 14,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            role="dialog"
            aria-label={`${citadel.name} Chapter Introduction`}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-panel/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              aria-label="Close introduction"
              className="absolute right-5 top-5 rounded-full p-1.5 text-muted hover:bg-panel-2 hover:text-chalk transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{citadel.icon}</span>
              <span
                className="font-plate text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                style={{
                  color: citadel.themeColor,
                  borderColor: `color-mix(in srgb, ${citadel.themeColor} 30%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${citadel.themeColor} 10%, transparent)`,
                }}
              >
                Citadel {citadel.numeral} Expedition
              </span>
            </div>

            {/* Peak Title */}
            <h2 className="font-plate text-3xl font-bold tracking-tight text-chalk">
              {citadel.name}
            </h2>

            {/* 2-Sentence Story */}
            <p className="mt-3 text-body text-muted leading-relaxed">
              {story}
            </p>

            {/* What you will learn */}
            <div className="mt-6 rounded-2xl border border-line bg-panel-2/60 p-4">
              <h3 className="flex items-center gap-2 font-plate text-xs font-bold uppercase tracking-wider text-chalk mb-3">
                <Sparkles size={14} style={{ color: citadel.themeColor }} />
                <span>What you will forge</span>
              </h3>
              <ul className="flex flex-col gap-2.5">
                {objectives.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-chalk/90 leading-snug">
                    <CheckCircle2
                      size={15}
                      className="shrink-0 mt-0.5"
                      style={{ color: citadel.themeColor }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Begin Action */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                style={{
                  backgroundColor: citadel.themeColor,
                  color: 'var(--surface-0, #090A0F)',
                }}
              >
                <span>Begin Expedition</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </motion.div>
        </GlassSurface>
      </div>
    </AnimatePresence>,
    document.body,
  )
}

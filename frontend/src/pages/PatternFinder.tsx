import { ArrowLeft, ArrowRight, Check, Compass, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { QuestionSummary, World } from '../api/types'
import { Button, DifficultyBadge, LeetCodeLink } from '../components/ui'
import { isResult, QUESTIONS, RESULTS, type PatternResult } from '../lib/patternFinder'
import { questUrl } from '../lib/journey'

/**
 * "Which pattern is this?" Walk the decision tree from the input shape to a pattern. The path is
 * kept in the URL (?path=array.contiguous) so a result can be bookmarked or shared.
 */
export default function PatternFinder() {
  const [search, setSearch] = useSearchParams()
  const path = (search.get('path') ?? '').split('.').filter(Boolean)
  const nodeId = path.length ? path[path.length - 1] : 'start'
  const reduce = useReducedMotion()
  const [worlds, setWorlds] = useState<World[] | null>(null)

  useEffect(() => {
    api.worlds().then(setWorlds).catch(() => setWorlds([]))
  }, [])

  const go = (next: string[]) => setSearch(next.length ? { path: next.join('.') } : {}, { replace: false })
  const trail = ['start', ...path]

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header>
        <p className="flex items-center gap-2 text-sm font-medium text-indigo">
          <Compass size={16} /> Pattern Finder
        </p>
        <h1 className="mt-1 font-plate text-3xl font-semibold text-chalk">Which pattern is this problem?</h1>
        <p className="mt-2 max-w-[62ch] text-muted">
          Answer two or three questions about the problem in front of you, the same way you should reason out loud in an
          interview: input shape first, then what is being asked, then the constraint that decides it.
        </p>
      </header>

      {/* Steps so far (NN/g: show steps, not just a spinner) */}
      <ol className="flex flex-wrap items-center gap-1.5 text-xs">
        {trail.map((id, i) => {
          const last = i === trail.length - 1
          const label = isResult(id) ? RESULTS[id].pattern : i === 0 ? 'Input' : QUESTIONS[trail[i - 1]].choices.find((c) => c.next === id)?.label.split(':')[0]
          return (
            <li key={id + i} className="flex items-center gap-1.5">
              {i > 0 && <ArrowRight size={12} className="text-faint" />}
              <button
                disabled={last}
                onClick={() => go(path.slice(0, i))}
                className={`max-w-[22ch] truncate rounded-full border px-2.5 py-1 ${
                  last ? 'border-indigo/40 bg-indigo/10 font-medium text-indigo' : 'border-line bg-panel text-muted hover:text-chalk'
                }`}
                title={label}
              >
                {i === 0 ? 'Start' : label}
              </button>
            </li>
          )
        })}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={nodeId}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {isResult(nodeId) ? (
            <ResultCard result={RESULTS[nodeId]} worlds={worlds} onRestart={() => go([])} onBack={() => go(path.slice(0, -1))} />
          ) : (
            <QuestionCard id={nodeId} onPick={(next) => go([...path, next])} onBack={path.length ? () => go(path.slice(0, -1)) : undefined} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function QuestionCard({ id, onPick, onBack }: { id: string; onPick: (next: string) => void; onBack?: () => void }) {
  const q = QUESTIONS[id]
  return (
    <section className="card rounded-3xl p-6">
      <h2 className="font-plate text-xl font-semibold text-chalk">{q.prompt}</h2>
      <div className="mt-4 flex flex-col gap-2">
        {q.choices.map((c, i) => (
          <button
            key={c.label}
            onClick={() => onPick(c.next)}
            className="group flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3 text-left transition-[border-color,background-color,transform] duration-150 hover:-translate-y-px hover:border-indigo/50 hover:bg-indigo/[0.04]"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line bg-panel-2 font-mono text-2xs text-muted group-hover:border-indigo/40 group-hover:text-indigo">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] text-chalk">{c.label}</span>
              {c.hint && <span className="block text-xs text-muted">{c.hint}</span>}
            </span>
            <ArrowRight size={16} className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-indigo" />
          </button>
        ))}
      </div>
      {onBack && (
        <button onClick={onBack} className="mt-4 inline-flex items-center gap-1 text-sm text-muted hover:text-chalk">
          <ArrowLeft size={14} /> Back
        </button>
      )}
      <KeyboardPick count={q.choices.length} onPick={(i) => onPick(q.choices[i].next)} onBack={onBack} />
    </section>
  )
}

/** Number keys pick a choice, Backspace goes back. */
function KeyboardPick({ count, onPick, onBack }: { count: number; onPick: (i: number) => void; onBack?: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null
      if (t?.closest('input, textarea, select, button[role="option"]') || e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= count) onPick(n - 1)
      else if (e.key === 'Backspace' && onBack) onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, onPick, onBack])
  return (
    <p className="mt-4 text-2xs text-faint">
      Tip: press <kbd className="keycap">1</kbd>–<kbd className="keycap">{count}</kbd> to choose
      {onBack && (
        <>
          , <kbd className="keycap">⌫</kbd> to go back
        </>
      )}
      .
    </p>
  )
}

function ResultCard({ result: r, worlds, onRestart, onBack }: { result: PatternResult; worlds: World[] | null; onRestart: () => void; onBack: () => void }) {
  const navigate = useNavigate()
  const world = worlds?.find((w) => w.id === r.worldId)
  const bySlug = useMemo(() => new Map((worlds ?? []).flatMap((w) => w.questions).map((q) => [q.slug, q] as [string, QuestionSummary])), [worlds])
  return (
    <section className="card overflow-hidden rounded-3xl">
      <div className="border-b border-line p-6">
        <p className="text-sm text-muted">This is most likely</p>
        <h2 className="mt-0.5 font-plate text-3xl font-semibold text-chalk">{r.pattern}</h2>
        <p className="mt-2 max-w-[62ch] text-chalk">{r.idea}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {r.signals.map((s) => (
            <span key={s} className="rounded-full border border-indigo/25 bg-indigo/[0.07] px-2.5 py-0.5 text-xs text-indigo">
              {s}
            </span>
          ))}
        </div>
        <p className="mt-3 font-mono text-sm text-emerald">{r.complexity}</p>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
        <div className="stage m-4 rounded-2xl p-4 md:mr-2">
          <p className="mb-2 text-2xs text-muted">Template to adapt, not to memorise</p>
          <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed text-[#E2E8F0]">{r.template}</pre>
        </div>
        <div className="p-6 md:pl-4">
          <h3 className="text-sm font-semibold text-chalk">Practise it</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {r.examples.map((slug) => {
              const q = bySlug.get(slug)
              return (
                <li key={slug}>
                  <Link to={q ? questUrl(q) : `/q/${slug}`} className="group flex items-center gap-3 rounded-xl border border-line px-3 py-2 hover:border-indigo/40">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${q?.progress.solved ? 'bg-emerald/15 text-emerald' : 'bg-chalk/[0.06] text-faint'}`}
                    >
                      {q?.progress.solved ? <Check size={12} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-chalk group-hover:text-indigo">{q?.title ?? slug}</span>
                    {q && <DifficultyBadge difficulty={q.difficulty} />}
                    {q && <LeetCodeLink lc={q.lc} url={q.leetcode_url} />}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => navigate(`/world/${r.worldId}`)}>Open World {r.worldId}{world ? `: ${world.name.replace(/ — .*/, '')}` : ''}</Button>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft size={14} /> Back
            </Button>
            <Button variant="ghost" onClick={onRestart}>
              <RotateCcw size={14} /> Start over
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

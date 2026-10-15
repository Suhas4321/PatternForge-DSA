import { ArrowLeft, BookMarked, CalendarClock, Check, Crown, Lock, Swords } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { QuestionSummary, World } from '../api/types'
import {
  Button,
  ConfidenceStars,
  DifficultyBadge,
  ErrorNote,
  LeetCodeLink,
  ProgressRing,
  RustBadge,
  Spinner,
} from '../components/ui'
import { ShineBorder, Stage } from '../components/effects'
import { useGrimoire } from '../lib/grimoire'
import { questUrl, stagesDone } from '../lib/journey'

export default function WorldPage() {
  const { id } = useParams()
  const [world, setWorld] = useState<World | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setWorld(null)
    api
      .worlds()
      .then((ws) => {
        const w = ws.find((x) => String(x.id) === id)
        if (w) setWorld(w)
        else setError(`World ${id} doesn't exist.`)
      })
      .catch((e) => setError(e.message))
  }, [id])

  if (error) return <div className="mx-auto max-w-5xl p-8"><ErrorNote message={error} /></div>
  if (!world) return <div className="p-8"><Spinner /></div>
  return <WorldTrail world={world} />
}

/** The question you should work on in this world: due review → in progress → first unsolved. */
function activeIndex(qs: QuestionSummary[]) {
  const due = qs.findIndex((q) => q.progress.status === 'review_due')
  if (due >= 0) return due
  const doing = qs.findIndex((q) => q.progress.status === 'in_progress')
  if (doing >= 0) return doing
  return qs.findIndex((q) => !q.progress.solved)
}

function WorldTrail({ world }: { world: World }) {
  const navigate = useNavigate()
  const openGrimoire = useGrimoire()
  const qs = world.questions
  const active = activeIndex(qs)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      {/* World banner: zone 2 */}
      <header className="card flex flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-chalk">
            <ArrowLeft size={14} /> Journey
          </Link>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-faint">World {world.id}</span>
            <h1 className="font-plate text-3xl font-semibold text-chalk">{world.name}</h1>
            <RustBadge rust={world.rust} />
          </div>
          <p className="mt-1 text-muted italic">{world.tagline}</p>
          <p className="mt-3 max-w-[68ch] text-chalk">{world.core_idea}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {world.triggers.map((t) => (
              <span key={t} className="rounded-full border border-indigo/25 bg-indigo/[0.07] px-3 py-1 text-xs font-medium text-indigo">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {active >= 0 && (
              <Button onClick={() => navigate(questUrl(qs[active]))}>
                {qs[active].progress.status === 'new' ? 'Start the next trial →' : 'Continue Journey →'}
              </Button>
            )}
            <Button variant="outline" onClick={() => openGrimoire(world.id)}>
              <BookMarked size={15} /> Open the Grimoire
            </Button>
          </div>
        </div>
        <ProgressRing
          value={world.solved}
          total={world.total}
          size={112}
          stroke={8}
          color={world.solved === world.total ? 'var(--color-emerald)' : 'var(--color-indigo)'}
        >
          <span className="text-center">
            <span className="block font-plate text-2xl font-semibold">
              {world.solved}/{world.total}
            </span>
            <span className="block text-2xs text-muted">forged</span>
          </span>
        </ProgressRing>
      </header>

      {/* Trail: zone 3 stage with a tracing-beam spine */}
      <Stage className="px-4 py-8 sm:px-8">
        <TracingTrail qs={qs} active={active} />
      </Stage>
    </div>
  )
}

/** Vertical spine: emerald up to the last solved trial, plus a cyan beam that follows the scroll. */
function TracingTrail({ qs, active }: { qs: QuestionSummary[]; active: number }) {
  const ref = useRef<HTMLOListElement>(null)
  const dots = useRef<(HTMLSpanElement | null)[]>([])
  const [geo, setGeo] = useState({ top: 0, bottom: 0, solvedTo: 0 })
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 70%'] })
  const span = Math.max(0, geo.bottom - geo.top)
  const beam = useSpring(useTransform(scrollYProgress, [0, 1], [0, span]), { stiffness: 220, damping: 40 })

  useLayoutEffect(() => {
    const measure = () => {
      const box = ref.current?.getBoundingClientRect()
      if (!box) return
      const ys = dots.current.map((d) => (d ? d.getBoundingClientRect().top + d.offsetHeight / 2 - box.top : 0))
      let lastSolved = -1
      qs.forEach((q, i) => q.progress.solved && (lastSolved = i))
      setGeo({ top: ys[0] ?? 0, bottom: ys[ys.length - 1] ?? 0, solvedTo: lastSolved >= 0 ? ys[lastSolved] : ys[0] ?? 0 })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (ref.current) ro.observe(ref.current)
    return () => ro.disconnect()
  }, [qs])

  return (
    <ol ref={ref} className="relative flex flex-col gap-6">
      {/* spine */}
      <span aria-hidden="true" className="absolute left-[19px] w-0.5 rounded-full bg-[#2E3446]" style={{ top: geo.top, height: span }} />
      <span
        aria-hidden="true"
        className="absolute left-[19px] w-0.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34D399]"
        style={{ top: geo.top, height: Math.max(0, geo.solvedTo - geo.top) }}
      />
      {!reduce && (
        <motion.span
          aria-hidden="true"
          className="absolute left-[18px] w-1 rounded-full bg-[linear-gradient(180deg,transparent,#22D3EE_70%,#818CF8)] shadow-[0_0_12px_#22D3EE]"
          style={{ top: geo.top, height: beam }}
        />
      )}
      {qs.map((q, i) => (
        <li key={q.slug} className="relative flex items-start gap-4 sm:gap-6">
          <span
            ref={(el) => {
              dots.current[i] = el
            }}
            className={`relative z-10 mt-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs ${
              q.progress.solved
                ? 'border-emerald-400 bg-[#0F1E1A] text-emerald-300 shadow-[0_0_14px_-2px_#34D399]'
                : i === qs.length - 1
                  ? 'border-amber-400 bg-[#1F1712] text-amber-300'
                  : i === active
                    ? 'border-cyan-400 bg-[#131824] text-cyan-300 shadow-[0_0_14px_-2px_#22D3EE]'
                    : 'border-[#3D4560] bg-[#181B24] text-[#94A3B8]'
            }`}
          >
            {q.progress.solved ? <Check size={16} /> : i === qs.length - 1 ? <Swords size={15} /> : i + 1}
          </span>
          <TrailNode q={q} index={i} active={i === active} boss={i === qs.length - 1} />
        </li>
      ))}
    </ol>
  )
}

const STAGE_NAMES = ['Concept', 'Drills', 'Arena', 'Pitch'] as const

function StageDots({ q }: { q: QuestionSummary }) {
  const s = stagesDone(q.progress)
  const done = [s.concept, s.drills, s.arena, s.pitch]
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {STAGE_NAMES.map((name, i) => (
        <span key={name} className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${done[i] ? 'bg-emerald-400 shadow-[0_0_6px_#34D399]' : 'bg-[#3D4560]'}`}
            title={`${name}${done[i] ? ' done' : ''}`}
          />
          <span className={`text-2xs ${done[i] ? 'text-emerald-300' : 'text-[#94A3B8]'}`}>{name}</span>
        </span>
      ))}
    </div>
  )
}

function TrailNode({ q, index, active, boss }: { q: QuestionSummary; index: number; active: boolean; boss: boolean }) {
  const navigate = useNavigate()
  const solved = q.progress.solved
  const due = q.progress.status === 'review_due'
  const href = questUrl(q)

  const frame = solved
    ? 'border-emerald-400/60 bg-[#0F1E1A]'
    : due
      ? 'border-amber-400/70 bg-[#1F1712]'
      : active
        ? 'border-cyan-400 bg-[#131824] quest-pulse'
        : boss
          ? 'border-transparent bg-[#1A1418]'
          : 'border-[#2E3446] bg-[#181B24] hover:border-cyan-400/50'

  return (
    <div className={`relative flex-1 rounded-2xl border transition-colors ${frame} ${active ? 'p-5' : 'p-4'} ${boss ? 'mt-3' : ''}`}>
      {boss && !solved && <ShineBorder />}
      {boss && (
        <span
          className={`absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-2xs font-semibold ${
            solved ? 'border-amber-300/60 bg-[#2A2010] text-amber-300' : 'border-rose-400/60 bg-[#2A1218] text-rose-300'
          }`}
        >
          <Crown size={11} /> {solved ? 'Boss defeated' : 'Final Trial'}
        </span>
      )}
      {active && <p className="mb-0.5 text-xs font-medium text-cyan-300">{due ? 'Blind re-solve due' : 'Your current trial'}</p>}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Link to={href} className={`font-plate font-semibold text-[#F1F5F9] hover:text-cyan-300 ${active ? 'text-xl' : 'text-base'}`}>
          {q.title}
        </Link>
        <span className="font-mono text-2xs text-[#64748B]">trial {index + 1}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={q.difficulty} />
        <LeetCodeLink lc={q.lc} url={q.leetcode_url} />
        {solved && <ConfidenceStars value={q.progress.confidence} />}
        {due && !active && (
          <span className="inline-flex items-center gap-1 text-2xs text-amber-300">
            <CalendarClock size={11} /> re-solve due
          </span>
        )}
        {!q.has_content && (
          <span className="inline-flex items-center gap-1 text-2xs text-[#94A3B8]">
            <Lock size={11} /> lesson not written
          </span>
        )}
      </div>
      {active && (
        <div className="mt-3 flex flex-col gap-3">
          <StageDots q={q} />
          <Button className="self-start" onClick={() => navigate(href)}>
            {q.progress.status === 'new' ? 'Begin trial →' : 'Continue →'}
          </Button>
        </div>
      )}
      {solved && !active && (
        <Link to={`/q/${q.slug}?stage=4`} className="mt-2 inline-block text-xs text-emerald-300 hover:underline">
          Review your pitch
        </Link>
      )}
    </div>
  )
}

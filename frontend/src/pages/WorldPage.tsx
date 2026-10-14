import { ArrowLeft, BookMarked, CalendarClock, Check, Crown, Lock, Swords } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
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
import { useGrimoire } from '../lib/grimoire'
import { questUrl, stagesDone } from '../lib/journey'
import { useConnectors } from '../lib/useConnectors'

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
  const pairs = qs.slice(1).map((_, i) => [i, i + 1] as [number, number])
  const { containerRef, register, paths, size } = useConnectors<number>(pairs, [world])
  const reduceMotion = useReducedMotion()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6">
      {/* World banner */}
      <header className="liquid-glass flex flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-center">
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
              <span
                key={t}
                className="rounded-full border border-cyan/30 bg-cyan/[0.08] px-3 py-1 text-xs text-cyan shadow-[0_0_14px_-4px_rgb(0_240_255/0.6),inset_0_1px_0_0_rgb(255_255_255/0.12)]"
              >
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
            <Button variant="glass" onClick={() => openGrimoire(world.id)}>
              <BookMarked size={15} /> Open the Grimoire
            </Button>
          </div>
        </div>
        <ProgressRing
          value={world.solved}
          total={world.total}
          size={112}
          stroke={7}
          color={world.solved === world.total ? 'var(--color-emerald-hi)' : 'var(--color-cyan)'}
        >
          <span className="text-center">
            <span className="block font-plate text-2xl font-semibold">
              {world.solved}/{world.total}
            </span>
            <span className="block text-2xs text-muted">forged</span>
          </span>
        </ProgressRing>
      </header>

      {/* Stepping-stone trail */}
      <div ref={containerRef} className="relative">
        <svg className="pointer-events-none absolute inset-0" width={size.w} height={size.h} aria-hidden="true">
          {paths.map((p) => {
            const done = qs[p.from].progress.solved
            const leadsToActive = p.to === active
            return (
              <g key={p.from}>
                <path
                  d={p.d}
                  fill="none"
                  stroke={done ? 'rgb(52 211 153 / 0.55)' : 'rgb(255 255 255 / 0.1)'}
                  strokeWidth={done ? 2.5 : 2}
                  strokeDasharray={done ? undefined : '4 7'}
                  style={done ? { filter: 'drop-shadow(0 0 4px rgb(16 185 129 / 0.7))' } : undefined}
                />
                {leadsToActive && (
                  <motion.path
                    d={p.d}
                    fill="none"
                    stroke="#00F0FF"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeDasharray="8 14"
                    style={{ filter: 'drop-shadow(0 0 4px #00F0FF)' }}
                    animate={reduceMotion ? undefined : { strokeDashoffset: [0, -44] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </g>
            )
          })}
        </svg>

        <ol className="relative flex flex-col gap-10">
          {qs.map((q, i) => (
            <li key={q.slug} className={`flex ${i % 2 === 0 ? 'justify-start sm:pl-[8%]' : 'justify-end sm:pr-[8%]'}`}>
              <TrailNode
                q={q}
                index={i}
                active={i === active}
                boss={i === qs.length - 1}
                nodeRef={register(i)}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

const STAGE_NAMES = ['Concept', 'Drills', 'Arena', 'Pitch'] as const

function StageDots({ q }: { q: QuestionSummary }) {
  const s = stagesDone(q.progress)
  const done = [s.concept, s.drills, s.arena, s.pitch]
  return (
    <div className="flex items-center gap-1.5">
      {STAGE_NAMES.map((name, i) => (
        <span key={name} className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${done[i] ? 'bg-emerald-hi shadow-[0_0_6px_#34D399]' : 'bg-white/15'}`}
            title={`${name}${done[i] ? ' done' : ''}`}
          />
          <span className={`text-2xs ${done[i] ? 'text-emerald-hi' : 'text-faint'}`}>{name}</span>
        </span>
      ))}
    </div>
  )
}

function TrailNode({ q, index, active, boss, nodeRef }: {
  q: QuestionSummary
  index: number
  active: boolean
  boss: boolean
  nodeRef: (el: HTMLElement | null) => void
}) {
  const navigate = useNavigate()
  const solved = q.progress.solved
  const due = q.progress.status === 'review_due'
  const href = questUrl(q)

  const frame = boss
    ? solved
      ? 'border-gold/50 shadow-[inset_0_1px_0_0_rgb(251_191_36/0.45),0_0_30px_-6px_rgb(251_191_36/0.55)]'
      : 'border-crimson/45 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2),0_0_30px_-8px_rgb(244_63_94/0.6)]'
    : solved
      ? 'border-emerald-hi/35 shadow-[inset_0_1px_0_0_rgb(52_211_153/0.4),0_0_22px_-8px_rgb(16_185_129/0.6)]'
      : due
        ? 'border-amber/40 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2),0_0_22px_-6px_rgb(245_158_11/0.6)]'
        : active
          ? 'border-cyan/45'
          : ''

  return (
    <div
      ref={nodeRef}
      className={`liquid-glass relative rounded-2xl ${frame} ${active ? 'quest-pulse w-full max-w-md p-5' : 'w-full max-w-sm p-4'} ${
        !active && !solved && !due && !boss ? 'opacity-75 hover:opacity-100' : ''
      } transition-opacity`}
    >
      {boss && (
        <span
          className={`absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-2xs font-semibold backdrop-blur-md ${
            solved ? 'border-gold/50 bg-gold/15 text-gold' : 'border-crimson/50 bg-crimson/15 text-crimson'
          }`}
        >
          <Crown size={11} /> {solved ? 'Boss defeated' : 'Final Trial'}
        </span>
      )}
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs ${
            solved
              ? 'border-emerald-hi/50 bg-emerald/20 text-emerald-hi'
              : boss
                ? 'border-crimson/50 bg-crimson/10 text-crimson'
                : active
                  ? 'border-cyan/50 bg-cyan/10 text-cyan'
                  : 'border-white/15 text-faint'
          }`}
        >
          {solved ? <Check size={15} /> : boss ? <Swords size={14} /> : index + 1}
        </span>
        <div className="min-w-0 flex-1">
          {active && <p className="mb-0.5 text-xs text-cyan">{due ? 'Blind re-solve due' : 'Your current trial'}</p>}
          <Link to={href} className={`font-plate font-semibold text-chalk hover:text-cyan ${active ? 'text-xl' : 'text-[15px]'}`}>
            {q.title}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={q.difficulty} />
            <LeetCodeLink lc={q.lc} url={q.leetcode_url} />
            {solved && <ConfidenceStars value={q.progress.confidence} />}
            {due && !active && (
              <span className="inline-flex items-center gap-1 text-2xs text-amber">
                <CalendarClock size={11} /> re-solve due
              </span>
            )}
            {!q.has_content && (
              <span className="inline-flex items-center gap-1 text-2xs text-faint">
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
            <Link to={`/q/${q.slug}?stage=4`} className="mt-2 inline-block text-xs text-emerald-hi hover:underline">
              Review your pitch
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

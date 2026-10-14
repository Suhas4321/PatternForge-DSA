import { CalendarClock, Crown, Lock, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { ReviewQueue, World } from '../api/types'
import { Button, DifficultyBadge, ErrorNote, LeetCodeLink, ProgressRing, RUST_META, Spinner, formatRelative } from '../components/ui'
import { currentQuest, EDGES, isRusting, questUrl, rankFor, TIERS, worldState, type WorldState } from '../lib/journey'
import { useConnectors } from '../lib/useConnectors'

export default function Dashboard() {
  const [worlds, setWorlds] = useState<World[] | null>(null)
  const [review, setReview] = useState<ReviewQueue | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.worlds(), api.review()])
      .then(([w, r]) => {
        setWorlds(w)
        setReview(r)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="mx-auto max-w-6xl p-8"><ErrorNote message={error} /></div>
  if (!worlds || !review) return <div className="p-8"><Spinner /></div>

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6">
      <CommandHud worlds={worlds} review={review} />
      <Constellation worlds={worlds} />
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Command HUD: current quest, mastery, rust radar
// ------------------------------------------------------------------------------------------

function CommandHud({ worlds, review }: { worlds: World[]; review: ReviewQueue }) {
  const navigate = useNavigate()
  const quest = currentQuest(worlds)
  const all = worlds.flatMap((w) => w.questions)
  const solved = all.filter((q) => q.progress.solved).length
  const pct = Math.round((solved / all.length) * 100)
  const rank = rankFor(solved)

  const questLabel = quest?.reason === 'review' ? 'Blind re-solve due' : quest?.reason === 'continue' ? 'Pick up where you left off' : 'Current quest'

  return (
    <section className="liquid-glass grid gap-px overflow-hidden rounded-3xl lg:grid-cols-[1.35fr_1fr_1fr]">
      {/* Current quest */}
      <div className="flex flex-col gap-3 p-6">
        {quest ? (
          <>
            <p className={`flex items-center gap-1.5 text-sm ${quest.reason === 'review' ? 'text-amber' : 'text-cyan'}`}>
              {quest.reason === 'review' ? <CalendarClock size={15} /> : <Sparkles size={15} />}
              {questLabel}
            </p>
            <h1 className="font-plate text-3xl leading-tight font-semibold text-chalk">{quest.question.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <LeetCodeLink lc={quest.question.lc} url={quest.question.leetcode_url} />
              <DifficultyBadge difficulty={quest.question.difficulty} />
              <span className="text-sm text-muted">
                World {quest.question.world_id}: {worlds[quest.question.world_id - 1].name}
              </span>
            </div>
            <Button className="mt-2 self-start px-5 py-2.5 text-base" onClick={() => navigate(questUrl(quest.question))}>
              Continue Journey →
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-emerald-hi">Every lesson solved</p>
            <h1 className="font-plate text-3xl font-semibold">The whole constellation is forged</h1>
            <p className="text-muted">Keep the rust off with your scheduled blind re-solves.</p>
          </>
        )}
      </div>

      {/* Mastery */}
      <div className="flex flex-col justify-center gap-3 border-white/[0.06] p-6 lg:border-l">
        <div>
          <div className="font-plate text-4xl font-semibold">
            {solved}
            <span className="text-xl text-faint"> / {all.length}</span>
          </div>
          <p className="text-sm text-muted">Patterns forged, {pct}%</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-cyan),var(--color-indigo))] shadow-[0_0_12px_rgb(0_240_255/0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pct, solved ? 2 : 0)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Crown size={15} className="text-gold" />
          <span className="font-semibold text-chalk">{rank.title}</span>
          {rank.next && (
            <span className="text-faint">
              {rank.next.min - solved} more to {rank.next.title}
            </span>
          )}
        </div>
      </div>

      {/* Rust radar */}
      <RustRadar worlds={worlds} review={review} />
    </section>
  )
}

function RustRadar({ worlds, review }: { worlds: World[]; review: ReviewQueue }) {
  const practiced = worlds.filter((w) => w.rust !== null)
  const fresh = practiced.filter((w) => w.rust === 'fresh').length
  const freshness = practiced.length ? Math.round((fresh / practiced.length) * 100) : 100
  const oxidising = review.rusting_worlds.length
  const next = review.due[0] ?? review.upcoming[0]
  const color = freshness >= 80 ? 'var(--color-emerald-hi)' : freshness >= 50 ? 'var(--color-amber)' : 'var(--color-crimson)'
  // semicircle gauge
  const r = 42
  const arc = Math.PI * r
  return (
    <div className="flex flex-col gap-2 border-white/[0.06] p-6 lg:border-l">
      <h2 className="text-sm font-semibold text-chalk">Rust radar</h2>
      <div className="flex items-center gap-4">
        <svg width="104" height="60" viewBox="0 0 104 60" aria-hidden="true">
          <path d={`M 10 52 A ${r} ${r} 0 0 1 94 52`} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="7" strokeLinecap="round" />
          <path
            d={`M 10 52 A ${r} ${r} 0 0 1 94 52`}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={arc}
            strokeDashoffset={arc * (1 - freshness / 100)}
            style={{ filter: `drop-shadow(0 0 5px ${color})`, transition: 'stroke-dashoffset 1s ease' }}
          />
          <text x="52" y="50" textAnchor="middle" className="fill-chalk font-plate text-[17px] font-semibold">
            {freshness}%
          </text>
        </svg>
        <div className="text-sm">
          <div className="font-semibold" style={{ color }}>
            {oxidising === 0 ? 'Fresh, zero oxidation' : `${oxidising} world${oxidising > 1 ? 's' : ''} oxidising`}
          </div>
          <div className="text-xs text-muted">
            {practiced.length ? `${fresh} of ${practiced.length} practised worlds fresh` : 'Nothing has had time to rust yet'}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted">
        {next ? (
          <>
            Next blind re-solve: <span className="text-chalk">{next.title}</span>, {formatRelative(next.next_review_at)}
          </>
        ) : (
          'When you rate a solved question, its blind re-solve is scheduled in 3, 7 or 21 days. Worlds go dusty at 5 days, rusting at 10 and rusted at 21.'
        )}
      </p>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Constellation skill tree
// ------------------------------------------------------------------------------------------

const STATE_LABEL: Record<WorldState, string> = {
  mastered: 'Mastered',
  active: 'In progress',
  open: 'Next up',
  fog: 'Unexplored',
}

function Constellation({ worlds }: { worlds: World[] }) {
  const reduceMotion = useReducedMotion()
  const quest = currentQuest(worlds)
  const questWorld = quest?.question.world_id ?? null
  const byId = new Map(worlds.map((w) => [w.id, w]))
  const states = new Map(worlds.map((w) => [w.id, worldState(w, worlds, questWorld)]))
  const { containerRef, register, paths, size } = useConnectors<number>(EDGES, [worlds])

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-plate text-xl font-semibold text-chalk">The constellation</h2>
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <Legend color="var(--color-emerald-hi)" label="Mastered" />
          <Legend color="var(--color-cyan)" label="In progress" />
          <Legend color="rgb(255 255 255 / 0.4)" label="Next up" />
          <Legend color="var(--color-fog)" label="Unexplored" />
          <Legend color="var(--color-amber)" label="Rusting" />
        </div>
      </div>

      <div ref={containerRef} className="relative">
        <svg className="pointer-events-none absolute inset-0" width={size.w} height={size.h} aria-hidden="true">
          <defs>
            <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="forged" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          {paths.map((p) => {
            const parent = states.get(p.from)
            const lit = parent === 'mastered' || parent === 'active'
            return (
              <g key={`${p.from}-${p.to}`}>
                <path d={p.d} fill="none" stroke={lit ? 'rgb(255 255 255 / 0.12)' : 'rgb(255 255 255 / 0.07)'} strokeWidth={lit ? 2 : 1.5} strokeDasharray={lit ? undefined : '3 6'} />
                {lit && (
                  <motion.path
                    d={p.d}
                    fill="none"
                    stroke={parent === 'mastered' ? 'url(#forged)' : 'url(#beam)'}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray="10 16"
                    style={{ filter: `drop-shadow(0 0 4px ${parent === 'mastered' ? '#34D399' : '#00F0FF'})` }}
                    initial={{ strokeDashoffset: 0 }}
                    animate={reduceMotion ? undefined : { strokeDashoffset: -52 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </g>
            )
          })}
        </svg>

        <ol className="relative flex flex-col gap-14 py-2">
          {TIERS.map((tier, t) => (
            <li key={t} className="flex flex-wrap justify-center gap-x-10 gap-y-6 sm:justify-around">
              {tier.map((id) => (
                <WorldNode
                  key={id}
                  world={byId.get(id)!}
                  state={states.get(id)!}
                  hasQuest={questWorld === id}
                  final={id === 12}
                  nodeRef={register(id)}
                />
              ))}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

function WorldNode({ world: w, state, hasQuest, final, nodeRef }: {
  world: World
  state: WorldState
  hasQuest: boolean
  final: boolean
  nodeRef: (el: HTMLElement | null) => void
}) {
  const rusting = isRusting(w)
  const rustColor = w.rust === 'rusted' ? 'var(--color-crimson)' : 'var(--color-amber)'
  const ring =
    state === 'mastered' ? 'var(--color-emerald-hi)' : state === 'active' ? 'var(--color-cyan)' : state === 'open' ? 'rgb(255 255 255 / 0.5)' : 'var(--color-fog)'
  const frame =
    state === 'mastered'
      ? 'border-emerald-hi/40 shadow-[inset_0_1px_0_0_rgb(52_211_153/0.45),0_0_28px_-6px_rgb(16_185_129/0.55)]'
      : state === 'active'
        ? 'border-cyan/40'
        : final
          ? 'border-gold/30'
          : ''

  return (
    <Link
      ref={nodeRef}
      to={`/world/${w.id}`}
      className={`liquid-glass group relative flex w-[15rem] items-center gap-3 rounded-2xl p-3 transition-transform duration-200 hover:-translate-y-0.5 ${frame} ${
        hasQuest ? 'quest-pulse' : ''
      } ${state === 'fog' ? 'opacity-50 saturate-50 hover:opacity-80' : ''}`}
      style={rusting ? { boxShadow: `inset 0 1px 0 0 rgb(255 255 255 / 0.22), 0 0 26px -4px ${rustColor}` } : undefined}
    >
      <ProgressRing value={w.solved} total={w.total} size={46} color={ring}>
        <span className="font-plate text-sm font-semibold text-chalk">{w.id}</span>
      </ProgressRing>
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-2xs text-faint">
          {final ? 'Final citadel' : `World ${w.id}`}
          {state === 'fog' && <Lock size={10} />}
        </div>
        <div className="line-clamp-2 font-plate text-[15px] leading-tight font-semibold text-chalk">{w.name.replace(/ — .*/, '')}</div>
        <div className="mt-0.5 flex items-center gap-2 text-2xs">
          <span style={{ color: ring === 'var(--color-fog)' ? 'var(--color-faint)' : ring }}>{STATE_LABEL[state]}</span>
          <span className="text-faint">
            {w.solved}/{w.total}
          </span>
          {rusting && (
            <span className="flex items-center gap-1" style={{ color: rustColor }} title={w.rust ? RUST_META[w.rust].hint : 'Reviews due'}>
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M5 0 L4 3 L6 4.5 L3.5 7 L5 10" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              {w.due > 0 ? `${w.due} due` : 'rusting'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

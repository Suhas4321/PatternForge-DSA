import { CalendarClock, Crown, Lock, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { ReviewQueue, World } from '../api/types'
import { BorderBeam, MagicCard, NumberTicker, Stage } from '../components/effects'
import { Button, DifficultyBadge, ErrorNote, LeetCodeLink, ProgressRing, RUST_META, Spinner, formatRelative } from '../components/ui'
import { currentQuest, EDGES, isRusting, questUrl, rankFor, TIERS, worldState, type WorldState } from '../lib/journey'
import { useConnectors } from '../lib/useConnectors'
import { zoomNavigate } from '../lib/zoomTransition'

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
// Hero bento: current quest, mastery, rust radar
// ------------------------------------------------------------------------------------------

function CommandHud({ worlds, review }: { worlds: World[]; review: ReviewQueue }) {
  const navigate = useNavigate()
  const quest = currentQuest(worlds)
  const all = worlds.flatMap((w) => w.questions)
  const solved = all.filter((q) => q.progress.solved).length
  const pct = Math.round((solved / all.length) * 100)
  const rank = rankFor(solved)
  const questLabel =
    quest?.reason === 'review' ? 'Blind re-solve due' : quest?.reason === 'continue' ? 'Pick up where you left off' : 'Current quest'

  return (
    <section className="grid gap-5 lg:grid-cols-[1.45fr_1fr_1fr]">
      {/* Current quest */}
      <div className="card relative flex flex-col gap-3 rounded-3xl p-6">
        <BorderBeam />
        {quest ? (
          <>
            <p className={`flex items-center gap-1.5 text-sm font-medium ${quest.reason === 'review' ? 'text-amber' : 'text-indigo'}`}>
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
            <Button className="mt-auto self-start px-6 py-2.5 text-base" onClick={() => navigate(questUrl(quest.question))}>
              Continue Journey →
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-emerald">Every lesson solved</p>
            <h1 className="font-plate text-3xl font-semibold">The whole constellation is forged</h1>
            <p className="text-muted">Keep the rust off with your scheduled blind re-solves.</p>
          </>
        )}
      </div>

      {/* Mastery */}
      <div className="card flex items-center gap-5 rounded-3xl p-6">
        <ProgressRing value={solved} total={all.length} size={104} stroke={8} color="var(--color-indigo)">
          <span className="text-center leading-tight">
            <span className="block font-plate text-2xl font-semibold text-chalk">
              <NumberTicker value={pct} />%
            </span>
          </span>
        </ProgressRing>
        <div className="min-w-0">
          <div className="font-plate text-4xl font-semibold text-chalk">
            <NumberTicker value={solved} />
            <span className="text-xl text-faint"> / {all.length}</span>
          </div>
          <p className="text-sm text-muted">Patterns forged</p>
          <div className="mt-3 flex items-center gap-1.5 text-sm">
            <Crown size={15} className="shrink-0 text-gold" />
            <span className="font-semibold text-chalk">{rank.title}</span>
          </div>
          {rank.next && (
            <p className="text-xs text-muted">
              {rank.next.min - solved} more to {rank.next.title}
            </p>
          )}
        </div>
      </div>

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
  const color = freshness >= 80 ? 'var(--color-emerald)' : freshness >= 50 ? 'var(--color-amber)' : 'var(--color-crimson)'
  const r = 42
  const arc = Math.PI * r
  return (
    <div className="card flex flex-col gap-2 rounded-3xl p-6">
      <h2 className="text-sm font-semibold text-chalk">Rust radar</h2>
      <div className="flex items-center gap-4">
        <svg width="104" height="60" viewBox="0 0 104 60" aria-hidden="true" className="shrink-0">
          <path d={`M 10 52 A ${r} ${r} 0 0 1 94 52`} fill="none" stroke="var(--color-line)" strokeWidth="8" strokeLinecap="round" />
          <path
            d={`M 10 52 A ${r} ${r} 0 0 1 94 52`}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={arc}
            strokeDashoffset={arc * (1 - freshness / 100)}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
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
      <p className="text-xs leading-relaxed text-muted">
        {next ? (
          <>
            Next blind re-solve: <span className="font-medium text-chalk">{next.title}</span>, {formatRelative(next.next_review_at)}
          </>
        ) : (
          'Rate a solved question and its blind re-solve is scheduled in 3, 7 or 21 days. Worlds go dusty at 5 days, rusting at 10, rusted at 21.'
        )}
      </p>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Constellation: pitch-carbon planetarium stage
// ------------------------------------------------------------------------------------------

const STATE_LABEL: Record<WorldState, string> = {
  mastered: 'Mastered',
  active: 'In progress',
  open: 'Next up',
  fog: 'Unexplored',
}

const STATE_COLOR: Record<WorldState, string> = {
  mastered: '#34D399',
  active: '#22D3EE',
  open: '#A5B4FC',
  fog: '#94A3B8',
}

function Constellation({ worlds }: { worlds: World[] }) {
  const reduceMotion = useReducedMotion()
  const quest = currentQuest(worlds)
  const questWorld = quest?.question.world_id ?? null
  const byId = new Map(worlds.map((w) => [w.id, w]))
  const states = new Map(worlds.map((w) => [w.id, worldState(w, worlds, questWorld)]))
  const { containerRef, register, paths, size } = useConnectors<number>(EDGES, [worlds])
  const navigate = useNavigate()
  const [launching, setLaunching] = useState<number | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  /** Click on a world: beams race into it, the node pulses, then the world zooms open from it. */
  const launch = (id: number, el: HTMLElement) => {
    if (launching !== null) return
    setLaunching(id)
    const hasBeams = EDGES.some(([, c]) => c === id)
    timer.current = window.setTimeout(
      () => {
        const r = el.getBoundingClientRect()
        zoomNavigate(() => navigate(`/world/${id}`, { state: { world: byId.get(id) } }), {
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
        })
      },
      reduceMotion ? 0 : hasBeams ? 480 : 260,
    )
  }

  return (
    <Stage className="p-6 sm:p-8 md:p-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-plate text-2xl font-semibold text-chalk">The constellation</h2>
          <p className="text-sm text-muted">Twelve worlds, foundation to final citadel. Every world is open; the beams show the suggested route.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          {(['mastered', 'active', 'open', 'fog'] as WorldState[]).map((st) => (
            <Legend key={st} color={STATE_COLOR[st]} label={STATE_LABEL[st]} />
          ))}
          <Legend color="#F59E0B" label="Rusting" />
        </div>
      </div>

      <div ref={containerRef} className="relative">
        <svg className="pointer-events-none absolute inset-0" width={size.w} height={size.h} aria-hidden="true">
          <defs>
            <linearGradient id="beam-active" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
              <stop offset="50%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>
          {paths.map((p) => {
            const parent = states.get(p.from)
            const lit = parent === 'mastered' || parent === 'active'
            const tone = parent === 'mastered' ? '#34D399' : '#22D3EE'
            return (
              <g key={`${p.from}-${p.to}`}>
                <path d={p.d} fill="none" stroke={lit ? `${tone}66` : '#333B52'} strokeWidth={2} />
                {lit && !reduceMotion && (
                  <motion.path
                    d={p.d}
                    pathLength={1}
                    fill="none"
                    stroke={tone}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray="0.18 0.82"
                    style={{ filter: `drop-shadow(0 0 6px ${tone})` }}
                    initial={{ strokeDashoffset: 0.18 }}
                    animate={{ strokeDashoffset: -1 }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}
                  />
                )}
                {launching === p.to && !reduceMotion && (
                  <motion.path
                    d={p.d}
                    fill="none"
                    stroke="#E0FBFF"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 8px #22D3EE) drop-shadow(0 0 3px #FFFFFF)' }}
                    initial={{ pathLength: 0, opacity: 1 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
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
                  launching={launching === id}
                  onLaunch={(el) => launch(id, el)}
                  nodeRef={register(id)}
                />
              ))}
            </li>
          ))}
        </ol>
      </div>
    </Stage>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      {label}
    </span>
  )
}

const NODE_FRAME: Record<WorldState, { box: string; bg: string }> = {
  mastered: { box: 'border-emerald-400/70 shadow-[0_0_28px_-6px_rgb(16_185_129/0.6)]', bg: '#0F1E1A' },
  active: { box: 'border-cyan-400 shadow-[0_0_30px_-6px_rgb(34_211_238/0.55)]', bg: '#131824' },
  open: { box: 'border-[#3D4560] hover:border-cyan-400/60', bg: '#181B24' },
  fog: { box: 'border-[#2E3446] hover:border-cyan-400/60', bg: '#181B24' },
}

function WorldNode({ world: w, state, hasQuest, final, launching, onLaunch, nodeRef }: {
  world: World
  state: WorldState
  hasQuest: boolean
  final: boolean
  launching: boolean
  onLaunch: (el: HTMLElement) => void
  nodeRef: (el: HTMLElement | null) => void
}) {
  const rusting = isRusting(w)
  const rustColor = w.rust === 'rusted' ? '#FB7185' : '#F59E0B'
  const color = STATE_COLOR[state]
  const frame = NODE_FRAME[state]

  return (
    <Link
      ref={nodeRef}
      to={`/world/${w.id}`}
      onClick={(e) => {
        // keep ctrl/cmd/middle-click "open in new tab" working
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        e.preventDefault()
        onLaunch(e.currentTarget)
      }}
      className={`group block w-[15rem] rounded-2xl transition-[transform,box-shadow] duration-300 hover:-translate-y-1 ${hasQuest && !launching ? 'quest-pulse' : ''} ${
        launching ? 'scale-[1.06] shadow-[0_0_0_2px_#22D3EE,0_0_40px_4px_rgb(34_211_238/0.55)]' : ''
      }`}
    >
      <MagicCard
        className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${frame.box} ${final && state !== 'mastered' ? 'border-amber-400/50' : ''}`}
        style={{ backgroundColor: frame.bg, ...(rusting ? { boxShadow: `0 0 26px -4px ${rustColor}` } : {}) }}
        spotlight={state === 'active' ? 'rgb(34 211 238 / 0.16)' : 'rgb(129 140 248 / 0.12)'}
      >
        {state === 'active' && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(120px circle at 20% 0%, rgb(34 211 238 / 0.18), transparent 70%)' }}
          />
        )}
        <span className="relative">
          <ProgressRing value={w.solved} total={w.total} size={46} color={color}>
            <span className="font-plate text-sm font-semibold text-[#F1F5F9]">{w.id}</span>
          </ProgressRing>
        </span>
        <div className="relative min-w-0">
          <div className="flex items-center gap-1.5 text-2xs text-[#94A3B8]">
            {final ? 'Final citadel' : `World ${w.id}`}
            {state === 'fog' && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-[#2E3446] bg-[#0B0C10] px-1.5 text-[10px] text-[#94A3B8]">
                <Lock size={9} /> unexplored
              </span>
            )}
          </div>
          <div className="line-clamp-2 font-plate text-[15px] leading-tight font-semibold text-[#F1F5F9]">{w.name.replace(/ — .*/, '')}</div>
          <div className="mt-1 flex items-center gap-2 text-2xs">
            {state !== 'fog' && (
              <span
                className="rounded-full px-1.5 py-px font-medium"
                style={{ color, background: `${color}1f`, boxShadow: state === 'active' ? `0 0 10px -2px ${color}` : undefined }}
              >
                {STATE_LABEL[state]}
              </span>
            )}
            <span className="text-[#94A3B8]">
              {w.solved}/{w.total} solved
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
      </MagicCard>
    </Link>
  )
}

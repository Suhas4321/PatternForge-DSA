import { CalendarClock, Check, ChevronDown, Compass, Crown, Lock, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { ReviewQueue, World } from '../api/types'
import ChapterIntroModal from '../components/ChapterIntroModal'
import DailyQuestCard from '../components/DailyQuestCard'
import PracticeCard from '../components/PracticeCard'
import Sky from '../components/Sky'
import WorldPreviewPopover from '../components/WorldPreviewPopover'
import { BorderBeam, MagicCard, NumberTicker, ShineBorder } from '../components/effects'
import { Button, DifficultyBadge, ErrorNote, LeetCodeLink, ProgressRing, Skeleton, formatRelative } from '../components/ui'
import { CITADELS, getCitadel, type Citadel } from '../lib/citadels'
import { currentQuest, isRusting, questUrl, rankFor, worldState, type WorldState } from '../lib/journey'
import { useConnectors } from '../lib/useConnectors'

const PEAK_NAMES: Record<string, string> = {
  dsa: 'DSA',
  python_data: 'Python & Data',
  sql_dbms: 'SQL & DBMS',
  os_concurrency: 'OS & Async',
  backend_apis: 'FastAPI & Backend',
  ai_resume: 'GenAI & Resume',
}

function getTierAltitude(tierIdx: number, totalTiers: number): string {
  if (totalTiers <= 1) return 'Summit · 5,000m'
  if (tierIdx === 0) return 'Base Camp · 900m'
  if (tierIdx === totalTiers - 1) return 'Summit · 5,000m'
  const alt = Math.round(900 + (tierIdx / (totalTiers - 1)) * (5000 - 900))
  return `Camp ${tierIdx + 1} · ${alt.toLocaleString()}m`
}

export default function Dashboard() {
  const { citadelId } = useParams<{ citadelId?: string }>()
  const activeCitadel = getCitadel(citadelId)

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

  if (error) return <div className="shell p-8"><ErrorNote message={error} /></div>
  if (!worlds || !review)
    return (
      <div className="shell flex flex-col gap-6 py-6" role="status" aria-label="Loading your journey">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-16 rounded-xl" />
        <div className="h-[560px] rounded-3xl bg-panel/30 animate-pulse" />
      </div>
    )

  // Scope worlds to the active citadel
  const citadelWorldList = worlds.filter((w) => activeCitadel.worldIds.includes(w.id))
  const displayWorlds = citadelWorldList.length > 0 ? citadelWorldList : worlds

  const quest = currentQuest(worlds)
  const questWorld = quest?.question.world_id ?? null

  const scrollToCurrentCamp = () => {
    const candidateWorldIds = activeCitadel.worldIds
    let targetId: number | null = null
    if (questWorld && candidateWorldIds.includes(questWorld)) {
      targetId = questWorld
    } else {
      const activeWorld = displayWorlds.find((w) => worldState(w, displayWorlds, questWorld, activeCitadel.edges) === 'active')
      const openWorld = displayWorlds.find((w) => worldState(w, displayWorlds, questWorld, activeCitadel.edges) === 'open')
      targetId = activeWorld?.id ?? openWorld?.id ?? candidateWorldIds[0] ?? null
    }

    if (targetId) {
      const el = document.getElementById(`world-node-${targetId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-cyan')
        setTimeout(() => el.classList.remove('ring-2', 'ring-cyan'), 1800)
      }
    }
  }

  return (
    <div
      data-zone="night"
      className="relative min-h-screen w-full flex flex-col pb-20 overflow-x-hidden"
      style={{ backgroundColor: '#05070E', color: '#F8FAFC' }}
    >
      {/* Full-Page Lively Procedural Sky (Aurora Curtains + Nebula + Twinkling Stars + Mountain Peaks) */}
      <Sky peak={activeCitadel.id} accent={activeCitadel.themeColor} fixed />

      {/* Chapter Intro modal: shown the first time a peak is visited */}
      <ChapterIntroModal citadel={activeCitadel} />

      {/* Top Cards Section: Floating over the colorful sky */}
      <div className="shell relative z-10 flex flex-col gap-5 pt-5 w-full">
        {/* 1. Dashboard Header: Slim ~120px Row */}
        <CommandHud worlds={displayWorlds} review={review} citadel={activeCitadel} />

        {/* 2. Collapsible Activity & Practice Heatmap */}
        <details className="group rounded-2xl border border-white/12 bg-[#0D1220]/70 backdrop-blur-md transition-colors overflow-hidden shadow-xl">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white transition-colors select-none">
            <div className="flex items-center gap-2">
              <CalendarClock size={15} className="text-cyan" />
              <span>Activity & Practice Heatmap</span>
            </div>
            <ChevronDown size={14} className="transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="border-t border-white/10 p-4">
            <PracticeCard />
          </div>
        </details>

        {/* 3. Peak Switcher Ribbon */}
        <PeakSwitcherRibbon activeCitadel={activeCitadel} allWorlds={worlds} />
      </div>

      {/* 5. Full-bleed Constellation Skill Mountain over the Unified Colorful Sky */}
      <section className="relative w-full overflow-hidden mt-4">
        <div className="relative z-10 w-full">
          <Constellation worlds={displayWorlds} citadel={activeCitadel} />
        </div>
      </section>

      {/* 7. Floating Jump to Current Camp Button */}
      <button
        type="button"
        onClick={scrollToCurrentCamp}
        aria-label="Jump to current peak camp"
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full border border-line bg-panel-2/90 px-4 py-2.5 text-xs font-semibold text-chalk shadow-2xl backdrop-blur-md transition-all hover:bg-panel-3 hover:border-line-strong hover:scale-105 active:scale-95"
      >
        <Compass size={14} className="text-cyan animate-pulse" />
        <span>Jump to current peak camp</span>
      </button>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Peak Switcher Ribbon
// ------------------------------------------------------------------------------------------

function PeakSwitcherRibbon({
  activeCitadel,
  allWorlds,
}: {
  activeCitadel: Citadel
  allWorlds: World[]
}) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted">
          Engineering Citadels
        </span>
        <span className="text-2xs text-faint">
          Select peak to explore skill map
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        {CITADELS.map((cit) => {
          const isActive = cit.id === activeCitadel.id
          const citWorlds = allWorlds.filter((w) => cit.worldIds.includes(w.id))
          const questions = citWorlds.flatMap((w) => w.questions)
          const solved = questions.filter((q) => q.progress.solved).length
          const total = questions.length
          const pct = total > 0 ? Math.round((solved / total) * 100) : 0

          return (
            <button
              key={cit.id}
              onClick={() => navigate(cit.id === 'dsa' ? '/' : `/citadel/${cit.id}`)}
              className={`group relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all backdrop-blur-md ${
                isActive
                  ? 'bg-[#131B2E]/85 shadow-lg'
                  : 'border-white/10 bg-[#0D1220]/65 hover:border-white/25 hover:bg-[#131B2E]/80'
              }`}
              style={
                isActive
                  ? {
                      borderColor: cit.themeColor,
                      boxShadow: `0 0 16px -4px color-mix(in srgb, ${cit.themeColor} 40%, transparent)`,
                    }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-plate text-xs font-bold"
                      style={isActive ? { color: cit.themeColor } : undefined}
                    >
                      {cit.numeral}
                    </span>
                    <span className="font-plate text-xs font-semibold text-chalk truncate">
                      {PEAK_NAMES[cit.id] ?? cit.shortName}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-2xs text-muted shrink-0">
                  {solved}/{total}
                </span>
              </div>

              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isActive ? cit.themeColor : 'var(--color-muted)',
                  }}
                />
              </div>
            </button>
          )
        })}

        {/* Citadel VII: Interactive System Design (OOP/SOLID -> LLD -> 10 HLD) */}
        <button
          type="button"
          onClick={() => navigate('/system-design')}
          className="group relative flex flex-col justify-between rounded-xl border border-violet-400/40 bg-[#131B2E]/80 p-2.5 text-left transition-all backdrop-blur-md hover:border-violet-400 hover:bg-[#19233C]"
        >
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-plate text-xs font-bold text-violet-300">VII</span>
                <span className="font-plate text-xs font-semibold text-chalk truncate">
                  System Design
                </span>
              </div>
            </div>
            <span className="font-mono text-2xs text-violet-300 shrink-0">
              LLD+HLD
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full w-full rounded-full bg-violet-400/80" />
          </div>
        </button>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Slim Command HUD (~120px height)
// ------------------------------------------------------------------------------------------

function CommandHud({ worlds, review, citadel }: { worlds: World[]; review: ReviewQueue; citadel: Citadel }) {
  const navigate = useNavigate()
  const quest = currentQuest(worlds)
  const all = worlds.flatMap((w) => w.questions)
  const solved = all.filter((q) => q.progress.solved).length
  const pct = all.length > 0 ? Math.round((solved / all.length) * 100) : 0
  const rank = rankFor(solved)
  const questLabel =
    quest?.reason === 'review' ? 'Blind re-solve due' : quest?.reason === 'continue' ? 'Next quest' : 'Current quest'

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.35fr_1.15fr_0.85fr_0.85fr] divide-y sm:divide-y-0 lg:divide-x divide-white/10 rounded-lg border border-white/15 bg-[#0D1220]/75 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* 1. Current quest cell */}
      <div className="relative flex min-h-[112px] flex-col justify-between p-4 overflow-hidden">
        <BorderBeam />
        <div className="flex items-center justify-between gap-2">
          <p className={`flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider ${quest?.reason === 'review' ? 'text-amber' : 'text-sky-400'}`}>
            {quest?.reason === 'review' ? <CalendarClock size={13} /> : <Sparkles size={13} />}
            {questLabel}
          </p>
          <span
            className="rounded-md px-2 py-0.5 text-2xs font-plate font-bold border"
            style={{
              color: citadel.themeColor,
              borderColor: `color-mix(in srgb, ${citadel.themeColor} 30%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${citadel.themeColor} 10%, transparent)`,
            }}
          >
            Citadel {citadel.numeral}
          </span>
        </div>

        {quest ? (
          <div className="flex items-center justify-between gap-3 mt-1">
            <div className="min-w-0 flex-1">
              <h1 className="font-plate text-lg leading-snug font-semibold text-chalk line-clamp-2 break-words">
                {quest.question.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <LeetCodeLink lc={quest.question.lc} url={quest.question.leetcode_url} />
                <DifficultyBadge difficulty={quest.question.difficulty} />
                <span className="text-2xs text-muted truncate">
                  World {quest.question.world_id}
                </span>
              </div>
            </div>
            <Button
              className="shrink-0 text-xs px-3.5 py-1.5 h-8 self-center"
              onClick={() => navigate(questUrl(quest.question))}
            >
              Continue →
            </Button>
          </div>
        ) : (
          <div className="mt-1">
            <h1 className="font-plate text-base font-semibold text-chalk">{citadel.name} Mastered</h1>
            <p className="text-2xs text-muted truncate">{citadel.description}</p>
          </div>
        )}
      </div>

      {/* 2. Daily Quest cell */}
      <DailyQuestCard />

      {/* 3. Mastery & Rank cell */}
      <div className="flex min-h-[112px] items-center gap-4 p-4">
        <ProgressRing value={solved} total={all.length || 1} size={58} stroke={6} color={citadel.themeColor || "var(--accent-dsa)"}>
          <span className="font-plate text-xs font-bold text-chalk">
            <NumberTicker value={pct} />%
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <div className="font-plate text-xl font-semibold text-chalk leading-none">
            <NumberTicker value={solved} />
            <span className="text-xs text-faint"> / {all.length}</span>
          </div>
          <p className="text-xs text-muted truncate mt-1">{citadel.shortName} Mastery</p>
          <div className="mt-1 flex items-center gap-1 text-2xs text-gold">
            <Crown size={12} className="shrink-0" />
            <span className="font-semibold text-chalk">{rank.title}</span>
            {rank.next && (
              <span className="text-muted text-caption">
                ({rank.next.min - solved} to {rank.next.title})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Rust Radar cell */}
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
  const r = 26
  const arc = Math.PI * r

  return (
    <div className="flex min-h-[112px] items-center gap-3.5 p-4">
      <svg width="64" height="38" viewBox="0 0 64 38" aria-hidden="true" className="shrink-0">
        <path d="M 6 34 A 26 26 0 0 1 58 34" fill="none" stroke="var(--color-line)" strokeWidth="5" strokeLinecap="round" />
        <path
          d="M 6 34 A 26 26 0 0 1 58 34"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={arc}
          strokeDashoffset={arc * (1 - freshness / 100)}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="32" y="32" textAnchor="middle" className="fill-chalk font-plate text-xs font-semibold">
          {freshness}%
        </text>
      </svg>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold" style={{ color }}>
          {oxidising === 0 ? 'Zero oxidation' : `${oxidising} world${oxidising > 1 ? 's' : ''} oxidising`}
        </div>
        <div className="text-2xs text-muted truncate mt-0.5">
          {practiced.length ? `${fresh}/${practiced.length} worlds fresh` : 'No reviews due yet'}
        </div>
        {next && (
          <div className="text-2xs text-muted truncate mt-1">
            Next: <span className="font-medium text-chalk">{next.title}</span> ({formatRelative(next.next_review_at)})
          </div>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Constellation Mountain: Renders Bottom-to-Top with Altitude Bands (Zone 3)
// ------------------------------------------------------------------------------------------

const STATE_LABEL: Record<WorldState, string> = {
  mastered: 'Mastered',
  active: 'In progress',
  open: 'Next up',
  fog: 'Unexplored',
}

const STATE_COLOR: Record<WorldState, string> = {
  mastered: 'var(--color-emerald-hi)',
  active: 'var(--color-cyan)',
  open: 'var(--color-sky)',
  fog: 'var(--color-muted)',
}

function Constellation({ worlds, citadel }: { worlds: World[]; citadel: Citadel }) {
  const reduceMotion = useReducedMotion()
  const quest = currentQuest(worlds)
  const questWorld = quest?.question.world_id ?? null
  const byId = useMemo(() => new Map(worlds.map((w) => [w.id, w])), [worlds])
  const states = useMemo(
    () => new Map(worlds.map((w) => [w.id, worldState(w, worlds, questWorld, citadel.edges)])),
    [worlds, questWorld, citadel.edges],
  )

  const edges = citadel.edges
  // Filter tiers to include only worlds present
  const rawTiers = useMemo(
    () =>
      citadel.tiers
        .map((row) => row.filter((id) => byId.has(id)))
        .filter((row) => row.length > 0),
    [citadel.tiers, byId],
  )

  // Barycentre heuristic: sort nodes within each tier by the average index of their parents before drawing lines
  const sortedTiers = useMemo(() => {
    const parentMap = new Map<number, number[]>()
    for (const [parent, child] of edges) {
      if (!parentMap.has(child)) parentMap.set(child, [])
      parentMap.get(child)!.push(parent)
    }

    const result: number[][] = []
    for (let t = 0; t < rawTiers.length; t++) {
      const rawTier = rawTiers[t]
      if (t === 0) {
        result.push([...rawTier])
        continue
      }
      const prevTier = result[t - 1]
      const prevPos = new Map<number, number>(prevTier.map((id, idx) => [id, idx]))

      const sorted = [...rawTier].sort((a, b) => {
        const parentsA = (parentMap.get(a) || []).filter((p) => prevPos.has(p))
        const parentsB = (parentMap.get(b) || []).filter((p) => prevPos.has(p))

        const baryA =
          parentsA.length > 0
            ? parentsA.reduce((sum, p) => sum + prevPos.get(p)!, 0) / parentsA.length
            : rawTier.indexOf(a)
        const baryB =
          parentsB.length > 0
            ? parentsB.reduce((sum, p) => sum + prevPos.get(p)!, 0) / parentsB.length
            : rawTier.indexOf(b)

        if (baryA !== baryB) return baryA - baryB
        return rawTier.indexOf(a) - rawTier.indexOf(b)
      })
      result.push(sorted)
    }
    return result
  }, [rawTiers, edges])

  // Render tiers top-to-bottom starting from Tier 0 (World 1 Base Camp) so active camp is immediately in view!
  const tiersBottomToTop = sortedTiers.map((tier, originalIdx) => ({ tier, originalIdx }))

  const mapHeight = tiersBottomToTop.length * 170 + 160

  const { containerRef, register, paths, size } = useConnectors<number>(edges, [citadel.id])
  const navigate = useNavigate()
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null)
  const [launching, setLaunching] = useState<number | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const enterWorld = (id: number) => {
    setSelectedWorld(null)
    setLaunching(id)
    timer.current = window.setTimeout(
      () => {
        navigate(`/world/${id}`, { state: { world: byId.get(id) } })
      },
      reduceMotion ? 0 : 280,
    )
  }

  return (
    <section className="relative w-full flex flex-col justify-between pt-16 pb-12">
      {/* Mountain Header: Aligned to .shell */}
      <div className="shell mx-auto w-full mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{citadel.icon}</span>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: citadel.themeColor }}
            >
              Citadel {citadel.numeral} Mountain Ascent
            </span>
          </div>
          <h2 className="font-plate text-2xl font-bold text-white drop-shadow-sm">{citadel.name}</h2>
          <p className="text-sm text-slate-300">{citadel.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-300">
          {(['mastered', 'active', 'open', 'fog'] as WorldState[]).map((st) => (
            <Legend key={st} color={STATE_COLOR[st]} label={STATE_LABEL[st]} />
          ))}
          <Legend color="var(--color-amber)" label="Rusting" />
        </div>
      </div>

      {/* Full-bleed Constellation Stage Canvas: Height driven by tiers, no inner scroll */}
      <div className="relative w-full" style={{ height: `${mapHeight}px` }}>
        <div ref={containerRef} className="relative w-full h-full flex flex-col justify-around py-3">
          {/* SVG Connector Paths: solid 2px stroke behind node cards with glow & pulse beams */}
          <svg className="pointer-events-none absolute inset-0 z-0" width={size.w} height={size.h} aria-hidden="true">
            {paths.map((p) => {
              const parent = states.get(p.from)
              const parentWorld = byId.get(p.from)
              const childWorld = byId.get(p.to)
              const isLiveEdge = parentWorld?.status !== 'coming_soon' && childWorld?.status !== 'coming_soon'
              const lit = (parent === 'mastered' || parent === 'active') && isLiveEdge

              return (
                <g key={`${p.from}-${p.to}`}>
                  {lit ? (
                    <>
                      {/* Depth ambient glow halo */}
                      <path
                        d={p.d}
                        fill="none"
                        stroke={citadel.themeColor}
                        strokeOpacity={0.22}
                        strokeWidth={4.5}
                        strokeLinecap="round"
                      />
                      {/* Core solid line with soft 4px glow filter */}
                      <path
                        d={p.d}
                        fill="none"
                        stroke={citadel.themeColor}
                        strokeOpacity={0.9}
                        strokeWidth={2}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 4px ${citadel.themeColor})` }}
                      />
                      {/* Moving pulse beam */}
                      {!reduceMotion && (
                        <path
                          d={p.d}
                          fill="none"
                          stroke={citadel.themeColor}
                          strokeOpacity={0.95}
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeDasharray="16 140"
                          className="animate-pulse-beam"
                        />
                      )}
                    </>
                  ) : (
                    /* Locked connector: solid 2px stroke, var(--color-text-2) at 55%, no dash */
                    <path
                      d={p.d}
                      fill="none"
                      stroke="var(--color-text-2, #94A3B8)"
                      strokeOpacity={0.55}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  )}

                  {launching === p.to && !reduceMotion && (
                    <motion.path
                      d={p.d}
                      fill="none"
                      stroke="var(--color-cyan, #38BDF8)"
                      strokeWidth={3.5}
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 10px var(--color-cyan, #38BDF8))' }}
                      initial={{ pathLength: 0, opacity: 1 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
                    />
                  )}
                </g>
              )
            })}
          </svg>

          {/* Mountain Tiers: Rendered Bottom-to-Top (Summit at top, Base Camp at bottom) */}
          <ol className="relative z-10 flex flex-col justify-around h-full py-2 w-full">
            {tiersBottomToTop.map(({ tier, originalIdx }) => (
              <li key={originalIdx} className="relative py-2 w-full">
                {/* Altitude Elevation Line & Label styled like a topo map */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center gap-3 z-0 pl-6 pr-6">
                  <span className="font-mono text-[13px] uppercase tracking-wider text-slate-400 font-medium select-none shrink-0">
                    {getTierAltitude(originalIdx, sortedTiers.length)}
                  </span>
                  <div className="h-px flex-1 border-t border-dotted border-[rgba(255,255,255,0.14)]" />
                </div>

                {/* World Nodes in Tier: Spread across the full viewport width */}
                <div className="relative z-10 flex flex-wrap justify-evenly items-center gap-x-8 sm:gap-x-12 gap-y-4 px-6 sm:px-12 w-full max-w-full">
                  {tier.map((id) => (
                    <WorldNode
                      key={id}
                      world={byId.get(id)!}
                      citadel={citadel}
                      state={states.get(id) ?? 'fog'}
                      hasQuest={questWorld === id}
                      final={id === Math.max(...citadel.worldIds)}
                      launching={launching === id}
                      onSelect={() => setSelectedWorld(byId.get(id)!)}
                      nodeRef={register(id)}
                    />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Tap-to-Preview Popover */}
      <WorldPreviewPopover
        world={selectedWorld}
        citadel={citadel}
        isLocked={selectedWorld ? states.get(selectedWorld.id) === 'fog' : false}
        onClose={() => setSelectedWorld(null)}
        onEnterCamp={enterWorld}
        onOpenGrimoire={enterWorld}
      />
    </section>
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

function WorldNode({
  world: w,
  citadel,
  state,
  hasQuest,
  final,
  launching,
  onSelect,
  nodeRef,
}: {
  world: World
  citadel: Citadel
  state: WorldState
  hasQuest: boolean
  final: boolean
  launching: boolean
  onSelect: () => void
  nodeRef: (el: HTMLElement | null) => void
}) {
  const isComingSoon = w.status === 'coming_soon' || (w.total === 0 && !w.questions?.length)
  const isLocked = state === 'fog'
  const rusting = !isComingSoon && isRusting(w)
  const rustColor = w.rust === 'rusted' ? 'var(--color-crimson)' : 'var(--color-amber)'
  const color = isComingSoon ? 'var(--color-faint)' : STATE_COLOR[state]

  // 1px hairline border: unlocked = peak accent @ 35%, locked = border-subtle (rgba(255,255,255,0.10))
  const borderColor = isLocked || isComingSoon
    ? 'rgba(255, 255, 255, 0.10)'
    : `color-mix(in srgb, ${citadel.themeColor} 35%, transparent)`

  return (
    <div
      id={`world-node-${w.id}`}
      ref={nodeRef}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      aria-label={`World ${w.id}: ${w.name}`}
      title={isComingSoon ? 'Lessons landing soon' : isLocked ? 'Complete prerequisite worlds to unlock' : undefined}
      className={`group relative block w-[232px] cursor-pointer rounded-2xl text-left transition-[transform,box-shadow] duration-200 select-none hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
        state === 'active' && !isComingSoon ? 'shadow-[0_0_24px_-2px_rgba(34,211,238,0.45)] animate-pulse' : ''
      } ${launching ? 'scale-[1.04] ring-2 ring-cyan' : ''}`}
    >
      <MagicCard
        className="relative flex items-center gap-3 rounded-2xl p-3 transition-colors backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(13, 18, 32, 0.78)',
          border: `1px solid ${borderColor}`,
          ...(rusting ? { boxShadow: `0 0 24px -4px ${rustColor}` } : {}),
        }}
        spotlight={isComingSoon ? 'transparent' : state === 'active' ? 'rgba(34, 211, 238, 0.16)' : 'rgba(129, 140, 248, 0.12)'}
      >
        {/* Boss ShineBorder if applicable */}
        {final && state !== 'mastered' && !isComingSoon && <ShineBorder />}

        {/* State 1: Coming soon numeral */}
        {isComingSoon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong bg-panel-2 font-plate text-xs font-semibold text-faint">
            {w.id}
          </div>
        ) : state === 'mastered' ? (
          /* State 2: Mastered numeral with check and accent ring */
          <span className="relative shrink-0">
            <ProgressRing value={w.solved} total={w.total || 1} size={44} stroke={4} color="var(--color-emerald-hi)">
              <span className="font-plate text-xs font-bold text-chalk">{w.id}</span>
            </ProgressRing>
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald text-surface-0 shadow-sm"
              title="Mastered"
            >
              <Check size={10} strokeWidth={3} />
            </span>
          </span>
        ) : state === 'fog' ? (
          /* State 4: Locked (readable) */
          <span className="relative shrink-0">
            <ProgressRing value={0} total={1} size={44} stroke={4} color="rgba(255, 255, 255, 0.14)">
              <span className="font-plate text-xs font-semibold text-slate-400">{w.id}</span>
            </ProgressRing>
          </span>
        ) : (
          /* State 3 & 5: Active or Next up progress ring */
          <span className="relative shrink-0">
            <ProgressRing value={w.solved} total={w.total || 1} size={44} stroke={4} color={color}>
              <span className="font-plate text-xs font-semibold text-slate-100">{w.id}</span>
            </ProgressRing>
          </span>
        )}

        <div className="relative min-w-0 flex-1">
          {/* Header row: World number + status badge */}
          <div className="flex items-center justify-between gap-1 text-2xs text-slate-400 mb-0.5">
            <span className="font-mono text-2xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
              {final ? 'Citadel Boss' : `World ${w.id}`}
              {hasQuest && !isComingSoon && (
                <span title="Current Quest Target">
                  <Sparkles size={10} className="text-amber" />
                </span>
              )}
            </span>

            {isComingSoon ? (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-1.5 py-px text-caption text-slate-400">
                Coming soon
              </span>
            ) : isLocked ? (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.08] px-1.5 py-px text-caption font-medium text-slate-300">
                <Lock size={9} /> Locked
              </span>
            ) : state === 'mastered' ? (
              <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-caption font-semibold text-emerald bg-emerald/15 border border-emerald/30">
                Mastered
              </span>
            ) : state === 'active' ? (
              <span className="inline-flex items-center rounded-full px-1.5 py-px text-caption font-semibold text-cyan bg-cyan/15 border border-cyan/30">
                In progress
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-px text-caption font-medium text-sky bg-sky/15 border border-sky/30">
                <span className="h-1.5 w-1.5 rounded-full bg-sky" />
                Next up
              </span>
            )}
          </div>

          {/* Title: 2 lines */}
          <div className="line-clamp-2 font-plate text-xs leading-snug font-semibold text-slate-100 break-words">
            {w.name.replace(/ — .*/, '')}
          </div>

          {/* Solved stats & rust */}
          <div className="mt-1 flex items-center justify-between gap-1 text-2xs text-slate-400">
            {isComingSoon ? (
              <span className="text-slate-500 text-caption">In development</span>
            ) : (
              <>
                <span className="font-mono text-caption text-slate-400">
                  {w.solved}/{w.total} solved
                </span>
                {rusting && (
                  <span className="flex items-center gap-1 font-medium" style={{ color: rustColor }}>
                    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                      <path d="M5 0 L4 3 L6 4.5 L3.5 7 L5 10" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                    {w.due > 0 ? `${w.due} due` : 'rusting'}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </MagicCard>
    </div>
  )
}

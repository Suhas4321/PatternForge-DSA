import { CalendarClock, Check, Crown, Flag, Lock, Mountain } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { QuestionSummary, World } from '../api/types'
import { questUrl, stagesDone } from '../lib/journey'
import { ShineBorder } from './effects'
import { Button, ConfidenceStars, DifficultyBadge, LeetCodeLink } from './ui'

const SUMMIT_SPACE = 130
const BASE_SPACE = 70
const NARROW = 460 // below this: single column on the right / centered

interface Point {
  x: number
  y: number
}

/** Cubic Bézier segments of a smooth curve through points (Catmull-Rom); segment i joins i → i+1. */
function smoothSegments(pts: Point[]): string[] {
  const segs: string[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    segs.push(`C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`)
  }
  return segs
}

/** The part of the full trail between waypoints `from` and `to`, following exactly the same curve. */
function trailPart(pts: Point[], segs: string[], from: number, to: number): string {
  if (to <= from || pts.length <= 1) return ''
  return `M ${pts[from].x} ${pts[from].y} ${segs.slice(from, to).join(' ')}`
}

/** Deterministic jitter so the ridge line looks hand-drawn but never changes between renders. */
const jitter = (n: number) => Math.sin(n * 12.9898) * 0.5 + Math.sin(n * 4.1414) * 0.5

function mountainPath(w: number, h: number, peak: Point, spread: number, seed: number, steps = 26): string {
  const left: Point[] = []
  const right: Point[] = []
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    const y = peak.y + t * (h - peak.y)
    const half = spread * w * Math.sqrt(t)
    const n = t === 0 ? 0 : jitter(s + seed) * 18 * Math.min(1, t * 4)
    left.push({ x: peak.x - half + n, y })
    right.push({ x: peak.x + half - jitter(s + seed + 50) * 18 * Math.min(1, t * 4), y })
  }
  const pts = [...left.reverse(), ...right.slice(1)]
  return `M ${pts.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${w + 400} ${h} L -400 ${h} Z`
}

function altitude(i: number, n: number) {
  if (n <= 1) return 2950
  return Math.round((900 + (i / (n - 1)) * 4100) / 10) * 10
}

function campLabel(i: number, n: number) {
  if (i === n - 1) return 'Summit Camp'
  if (i === 0) return 'Base Camp'
  return `Camp ${i}`
}

export default function MountainTrail({
  qs = [],
  active,
  world,
}: {
  qs: QuestionSummary[]
  active: number
  world?: World
}) {
  const ref = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const narrow = width < NARROW
  const n = qs.length

  // Case 0: Empty world (coming_soon)
  if (n === 0) {
    return (
      <div ref={ref} className="relative flex min-h-[480px] flex-col items-center justify-between py-8 px-4">
        {/* Summit marker */}
        <div className="flex flex-col items-center gap-2 z-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-amber/60 bg-panel-2 text-amber shadow-lg">
            <Flag size={18} />
          </span>
          <div className="flex items-center gap-2 font-mono text-2xs text-faint">
            <span>Summit</span>
            <span>·</span>
            <span>5,000m</span>
          </div>
        </div>

        {/* Central calm card with world core idea */}
        <div className="card relative z-10 max-w-md rounded-2xl border border-dashed border-line-strong bg-panel/90 p-6 text-center shadow-2xl backdrop-blur-md">
          <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-panel-2 text-muted">
            <Mountain size={20} />
          </span>
          <h2 className="font-plate text-lg font-semibold text-chalk">
            {world?.name ?? 'Ascent Trail'}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {world?.core_idea || 'This engineering realm is actively under construction.'}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-2 px-3 py-1 text-2xs font-medium text-faint">
            <span>Lessons landing soon</span>
          </div>
        </div>

        {/* Base Camp marker */}
        <div className="flex flex-col items-center gap-2 z-10">
          <div className="flex items-center gap-2 font-mono text-2xs text-faint">
            <span>Base Camp</span>
            <span>·</span>
            <span>900m</span>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel-2 text-muted">
            <Mountain size={15} />
          </span>
        </div>

        {/* Faint center connector */}
        <div className="pointer-events-none absolute inset-y-12 left-1/2 -translate-x-1/2 w-px border-l border-dashed border-line/40 z-0" />
      </div>
    )
  }

  // Node positions, bottom (index 0) to top (index n-1)
  const layout = useMemo(() => {
    if (!width || n === 0) return null
    const cardW = narrow ? width - 88 : Math.min(300, Math.max(180, (width - 130 - 88) / 2))
    const heights = qs.map((_, i) => (i === active ? (narrow ? 230 : 210) : narrow ? 116 : cardW < 240 ? 122 : 104))

    // Handle 1 to 3 lessons with generous spacing
    const minHeight = n <= 3 ? 500 : 600
    const gaps = qs.slice(1).map((_, i) => (heights[i] + heights[i + 1]) / 2 + (narrow ? 28 : 36))
    const computedTotal = SUMMIT_SPACE + gaps.reduce((a, b) => a + b, 0) + BASE_SPACE + heights[0] / 2 + heights[n - 1] / 2
    const total = Math.max(minHeight, computedTotal)

    const center = width / 2
    const swing = (width - 2 * (cardW + 44)) / 2
    const pts: Point[] = []
    let y = total - BASE_SPACE - heights[0] / 2

    for (let i = 0; i < n; i++) {
      if (i > 0) y -= gaps[i - 1] ?? (total / (n + 1))
      const t = n <= 1 ? 0.5 : i / (n - 1)
      let x: number
      if (narrow) {
        x = 36
      } else if (n === 1) {
        x = center - 60
      } else if (n <= 3) {
        x = center + (i % 2 === 0 ? -1 : 1) * Math.min(swing, 120)
      } else if (i === n - 1) {
        x = center
      } else {
        x = center + (i % 2 === 0 ? -1 : 1) * swing * (1 - 0.45 * t)
      }
      pts.push({ x, y })
    }
    return { pts, heights, total, cardW }
  }, [width, narrow, qs, active, n])

  useLayoutEffect(() => {
    if (!layout || active <= 0) return
    const t = window.setTimeout(
      () => activeRef.current?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }),
      700,
    )
    return () => window.clearTimeout(t)
  }, [!!layout])

  let lastSolved = -1
  qs.forEach((q, i) => q.progress.solved && (lastSolved = i))

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ minHeight: layout?.total ?? 500 }}>
      {layout && (
        <>
          <MountainBackdrop width={width} height={layout.total} summit={layout.pts[n - 1]} narrow={narrow} />

          {/* Summit & Base Camp Markers */}
          <div
            className="absolute z-10 flex flex-col items-center gap-1.5"
            style={{ left: layout.pts[n - 1].x, top: Math.max(16, layout.pts[n - 1].y - 68), transform: 'translateX(-50%)' }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber bg-panel-2 text-amber shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <Flag size={14} />
            </span>
            <span className="font-mono text-caption text-faint">Summit 5,000m</span>
          </div>

          <div
            className="absolute z-10 flex flex-col items-center gap-1"
            style={{ left: layout.pts[0].x, top: Math.min(layout.total - 30, layout.pts[0].y + 54), transform: 'translateX(-50%)' }}
          >
            <span className="font-mono text-caption text-faint">Base Camp 900m</span>
          </div>

          <TrailPaths pts={layout.pts} lastSolved={lastSolved} active={active} reduce={!!reduce} width={width} height={layout.total} />

          {qs.map((q, i) => {
            const p = layout.pts[i]
            const boss = i === n - 1
            const cardOnRight = narrow || p.x >= width / 2
            const room = cardOnRight ? width - p.x - 44 : p.x - 44
            const cardW = narrow ? width - 82 : Math.min(boss ? 340 : 300, Math.max(layout.cardW, room))

            return (
              <div key={q.slug}>
                <Waypoint q={q} index={i} n={n} point={p} active={i === active} boss={boss} />
                <div
                  ref={i === active ? activeRef : undefined}
                  className="absolute z-10"
                  style={{
                    top: p.y,
                    width: cardW,
                    transform: 'translateY(-50%)',
                    ...(narrow
                      ? { left: p.x + 30 }
                      : cardOnRight
                        ? { left: p.x + 32 }
                        : { right: width - p.x + 32 }),
                  }}
                >
                  <TrailNode q={q} index={i} n={n} active={i === active} boss={boss} />
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

function MountainBackdrop({ width, height, summit, narrow }: { width: number; height: number; summit: Point; narrow: boolean }) {
  const peak = { x: narrow ? width * 0.5 : summit.x, y: Math.max(30, summit.y - 80) }
  const stars = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        x: ((Math.sin(i * 91.7) + 1) / 2) * width,
        y: ((Math.sin(i * 37.3) + 1) / 2) * Math.min(height * 0.35, 480),
        r: 0.6 + ((Math.sin(i * 13.1) + 1) / 2) * 1.1,
        o: 0.2 + ((Math.sin(i * 5.7) + 1) / 2) * 0.45,
      })),
    [width, height],
  )

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" width={width} height={height}>
      <defs>
        <linearGradient id="mtn-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-panel-2)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--color-void)" />
        </linearGradient>
        <linearGradient id="mtn-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-panel)" />
          <stop offset="100%" stopColor="var(--color-void)" />
        </linearGradient>
      </defs>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--color-chalk)" opacity={s.o} />
      ))}
      <path d={mountainPath(width, height, { x: width * 0.16, y: peak.y + height * 0.2 }, 0.55, 3)} fill="url(#mtn-far)" opacity={0.5} />
      <path d={mountainPath(width, height, { x: width * 0.84, y: peak.y + height * 0.18 }, 0.55, 7)} fill="url(#mtn-far)" opacity={0.5} />
      <path d={mountainPath(width, height, peak, narrow ? 0.65 : 0.75, 11)} fill="url(#mtn-near)" opacity={0.8} />
    </svg>
  )
}

function TrailPaths({
  pts,
  lastSolved,
  active,
  reduce,
  width,
  height,
}: {
  pts: Point[]
  lastSolved: number
  active: number
  reduce: boolean
  width: number
  height: number
}) {
  if (pts.length <= 1) return null
  const segs = smoothSegments(pts)
  const full = trailPart(pts, segs, 0, pts.length - 1)
  const climbed = trailPart(pts, segs, 0, lastSolved)
  const from = Math.max(0, lastSolved)
  const ahead = trailPart(pts, segs, from, active)

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" width={width} height={height}>
      {/* Dirt trail */}
      <path d={full} fill="none" stroke="var(--color-line-strong)" strokeOpacity={0.35} strokeWidth={8} strokeLinecap="round" />
      <path d={full} fill="none" stroke="var(--color-line)" strokeWidth={2.5} strokeDasharray="3 8" strokeLinecap="round" />
      {/* Climbed route */}
      {climbed && (
        <path
          d={climbed}
          fill="none"
          stroke="var(--color-emerald-hi)"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 6px var(--color-emerald))' }}
        />
      )}
      {/* Active leg to current trial */}
      {ahead && (
        <>
          <path d={ahead} fill="none" stroke="var(--color-cyan)" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
          {!reduce && (
            <motion.path
              d={ahead}
              pathLength={1}
              fill="none"
              stroke="var(--color-cyan)"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeDasharray="0.25 0.75"
              style={{ filter: 'drop-shadow(0 0 6px var(--color-cyan))' }}
              initial={{ strokeDashoffset: 0.25 }}
              animate={{ strokeDashoffset: -1 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.3 }}
            />
          )}
        </>
      )}
    </svg>
  )
}

function Waypoint({
  q,
  index,
  n,
  point,
  active,
  boss,
}: {
  q: QuestionSummary
  index: number
  n: number
  point: Point
  active: boolean
  boss: boolean
}) {
  const solved = q.progress.solved
  const size = boss ? 44 : active ? 40 : 34

  return (
    <div
      className="absolute z-20"
      style={{ left: point.x - size / 2, top: point.y - size / 2, width: size, height: size }}
    >
      {active && <span className="absolute inset-0 animate-ping rounded-full bg-cyan/30" />}
      <span
        className={`relative flex h-full w-full items-center justify-center rounded-full border-2 font-mono text-xs font-semibold ${
          solved
            ? 'border-emerald bg-panel-2 text-emerald shadow-[0_0_12px_rgba(16,185,129,0.35)]'
            : boss
              ? 'border-amber bg-panel-2 text-amber shadow-[0_0_14px_rgba(245,158,11,0.35)]'
              : active
                ? 'border-cyan bg-panel-2 text-cyan shadow-[0_0_14px_rgba(34,211,238,0.4)]'
                : 'border-line-strong bg-panel-2 text-muted'
        }`}
        title={`${campLabel(index, n)}, ${altitude(index, n).toLocaleString()}m`}
      >
        {solved ? <Check size={14} /> : boss ? <Flag size={15} /> : index === 0 ? <Mountain size={13} /> : index + 1}
      </span>
    </div>
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
            className={`h-2 w-2 rounded-full ${done[i] ? 'bg-emerald shadow-[0_0_6px_var(--color-emerald)]' : 'bg-line-strong'}`}
            title={`${name}${done[i] ? ' done' : ''}`}
          />
          <span className={`text-2xs ${done[i] ? 'text-emerald' : 'text-muted'}`}>{name}</span>
        </span>
      ))}
    </div>
  )
}

function TrailNode({
  q,
  index,
  n,
  active,
  boss,
}: {
  q: QuestionSummary
  index: number
  n: number
  active: boolean
  boss: boolean
}) {
  const navigate = useNavigate()
  const solved = q.progress.solved
  const due = q.progress.status === 'review_due'
  const href = questUrl(q)

  const frame = solved
    ? 'border-emerald/60 bg-panel-2/90'
    : due
      ? 'border-amber/70 bg-panel-2/90'
      : active
        ? 'border-cyan bg-panel-2/90 quest-pulse'
        : boss
          ? 'border-line-strong bg-panel-2/90'
          : 'border-line bg-panel/90 hover:border-cyan/50'

  return (
    <div className={`relative rounded-2xl border backdrop-blur-sm transition-colors ${frame} ${active ? 'p-3.5 sm:p-4' : 'px-3.5 py-2.5 sm:px-4 sm:py-3'}`}>
      {boss && !solved && !active && <ShineBorder />}
      {boss && (
        <span
          className={`absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold ${
            solved ? 'border-amber/60 bg-panel-2 text-amber' : 'border-crimson/60 bg-panel-2 text-crimson'
          }`}
        >
          <Crown size={11} /> {solved ? 'Summit cleared' : 'Citadel Boss'}
        </span>
      )}
      <div className={`flex flex-wrap items-center gap-x-2 text-2xs ${boss ? 'mt-0.5' : ''}`}>
        <span className={active ? 'font-medium text-cyan' : 'text-muted'}>
          {active ? (due ? 'Blind re-solve due' : 'Current trial') : campLabel(index, n)}
        </span>
        <span className="font-mono text-faint">{altitude(index, n).toLocaleString()}m</span>
      </div>
      <Link to={href} className={`block font-plate leading-snug font-semibold text-chalk hover:text-cyan ${active ? 'text-base sm:text-lg' : 'text-sm'}`}>
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
          <span className="inline-flex items-center gap-1 text-2xs text-muted">
            <Lock size={11} /> coming soon
          </span>
        )}
      </div>
      {active && (
        <div className="mt-3 flex flex-col gap-2.5">
          <StageDots q={q} />
          <Button className="self-start text-xs h-7 px-3" onClick={() => navigate(href)}>
            {q.progress.status === 'new' ? 'Begin trial →' : 'Continue →'}
          </Button>
        </div>
      )}
      {solved && !active && (
        <Link to={`/q/${q.slug}?stage=4`} className="mt-1.5 inline-block text-xs text-emerald hover:underline">
          Review pitch →
        </Link>
      )}
    </div>
  )
}

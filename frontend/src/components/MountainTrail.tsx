import { CalendarClock, Check, Crown, Flag, Lock, Mountain } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { QuestionSummary } from '../api/types'
import { questUrl, stagesDone } from '../lib/journey'
import { ShineBorder } from './effects'
import { Button, ConfidenceStars, DifficultyBadge, LeetCodeLink } from './ui'

/**
 * A world as a mountain climb: question 1 at base camp (bottom), switchbacks up the face, the
 * boss question on the summit. The climbed route glows emerald; a cyan beam runs from there to
 * your current trial.
 */

const SUMMIT_SPACE = 150 // room above the summit card for the peak and flag
const BASE_SPACE = 70
const NARROW = 460 // below this (phones): zig-zag along the left edge, every card on the right

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
  if (to <= from) return ''
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
  return Math.round((900 + (n <= 1 ? 1 : i / (n - 1)) * 4100) / 10) * 10
}

function campLabel(i: number, n: number) {
  if (i === n - 1) return 'Summit'
  if (i === 0) return 'Base camp'
  return `Camp ${i}`
}

export default function MountainTrail({ qs, active }: { qs: QuestionSummary[]; active: number }) {
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

  // Node positions, bottom (index 0) to top (index n-1). Wider screens: the trail swings between
  // two switchback columns with each card on the outside of its bend.
  const layout = useMemo(() => {
    if (!width) return null
    const cardW = narrow ? width - 108 : Math.min(300, Math.max(180, (width - 130 - 88) / 2))
    const heights = qs.map((_, i) => (i === active ? (narrow ? 230 : 210) : narrow ? 112 : cardW < 240 ? 118 : 100))
    const gaps = qs.slice(1).map((_, i) => (heights[i] + heights[i + 1]) / 2 + (narrow ? 26 : 34))
    const total = SUMMIT_SPACE + gaps.reduce((a, b) => a + b, 0) + BASE_SPACE + heights[0] / 2 + heights[n - 1] / 2
    const center = width / 2
    const swing = (width - 2 * (cardW + 44)) / 2 // distance from the centre line to a switchback column
    const pts: Point[] = []
    let y = total - BASE_SPACE - heights[0] / 2
    for (let i = 0; i < n; i++) {
      if (i > 0) y -= gaps[i - 1]
      const t = n <= 1 ? 1 : i / (n - 1)
      let x: number
      if (narrow) x = i % 2 === 0 ? 34 : 74
      else if (i === n - 1) x = center // the summit
      else x = center + (i % 2 === 0 ? -1 : 1) * swing * (1 - 0.45 * t) // switchbacks tighten near the peak
      pts.push({ x, y })
    }
    return { pts, heights, total, cardW }
  }, [width, narrow, qs, active, n])

  // Scroll to where you are on the mountain (after the zoom-in transition settles).
  useLayoutEffect(() => {
    if (!layout || active <= 0) return
    const t = window.setTimeout(() => activeRef.current?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }), 750)
    return () => window.clearTimeout(t)
    // only when the page opens, not on every resize
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!layout])

  let lastSolved = -1
  qs.forEach((q, i) => q.progress.solved && (lastSolved = i))

  return (
    <div ref={ref} className="relative" style={{ height: layout?.total ?? 600 }}>
      {layout && (
        <>
          <MountainBackdrop width={width} height={layout.total} summit={layout.pts[n - 1]} narrow={narrow} />
          <TrailPaths pts={layout.pts} lastSolved={lastSolved} active={active} reduce={!!reduce} width={width} height={layout.total} />
          {qs.map((q, i) => {
            const p = layout.pts[i]
            const boss = i === n - 1
            // cards sit on the outside of each bend, never over the trail
            const cardOnRight = narrow || p.x >= width / 2
            const room = cardOnRight ? width - p.x - 44 : p.x - 44
            const cardW = narrow ? width - p.x - 34 : Math.min(boss ? 340 : 300, Math.max(layout.cardW, room))
            return (
              <div key={q.slug}>
                <Waypoint q={q} index={i} n={n} point={p} active={i === active} boss={boss} />
                <div
                  ref={i === active ? activeRef : undefined}
                  className="absolute"
                  style={{
                    top: p.y,
                    width: cardW,
                    transform: 'translateY(-50%)',
                    ...(cardOnRight ? { left: p.x + 32 } : { right: width - p.x + 32 }),
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
  const peak = { x: narrow ? width * 0.55 : summit.x, y: summit.y - 110 }
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        x: ((Math.sin(i * 91.7) + 1) / 2) * width,
        y: ((Math.sin(i * 37.3) + 1) / 2) * Math.min(height * 0.35, 520),
        r: 0.6 + ((Math.sin(i * 13.1) + 1) / 2) * 1.1,
        o: 0.25 + ((Math.sin(i * 5.7) + 1) / 2) * 0.55,
      })),
    [width, height],
  )
  const snowDepth = 70
  const snowHalf = (narrow ? 0.62 : 0.75) * width * Math.sqrt(snowDepth / (height - peak.y))
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0" width={width} height={height}>
      <defs>
        <linearGradient id="mtn-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E2433" />
          <stop offset="100%" stopColor="#0E1118" />
        </linearGradient>
        <linearGradient id="mtn-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#262E42" />
          <stop offset="45%" stopColor="#161B27" />
          <stop offset="100%" stopColor="#0D1016" />
        </linearGradient>
        <radialGradient id="summit-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
        </radialGradient>
      </defs>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#E2E8F0" opacity={s.o} />
      ))}
      <circle cx={peak.x} cy={peak.y + 40} r={narrow ? 120 : 180} fill="url(#summit-glow)" />
      {/* far ranges */}
      <path d={mountainPath(width, height, { x: width * 0.14, y: peak.y + height * 0.22 }, 0.55, 3)} fill="url(#mtn-far)" opacity={0.8} />
      <path d={mountainPath(width, height, { x: width * 0.9, y: peak.y + height * 0.16 }, 0.6, 7)} fill="url(#mtn-far)" opacity={0.8} />
      {/* the mountain you climb */}
      <path d={mountainPath(width, height, peak, narrow ? 0.62 : 0.75, 11)} fill="url(#mtn-near)" />
      <path
        d={`M ${peak.x} ${peak.y} L ${peak.x - snowHalf} ${peak.y + snowDepth} Q ${peak.x - snowHalf * 0.4} ${peak.y + snowDepth - 16}, ${peak.x - snowHalf * 0.15} ${peak.y + snowDepth + 6} Q ${peak.x + snowHalf * 0.3} ${peak.y + snowDepth - 12}, ${peak.x + snowHalf} ${peak.y + snowDepth} Z`}
        fill="#E2E8F0"
        opacity={0.85}
      />
      {/* faint contour lines on the face */}
      {[0.32, 0.5, 0.68, 0.84].map((f) => {
        const y = peak.y + f * (height - peak.y)
        const half = (narrow ? 0.62 : 0.75) * width * Math.sqrt(f) * 0.92
        return (
          <path
            key={f}
            d={`M ${peak.x - half} ${y} Q ${peak.x} ${y - 26}, ${peak.x + half} ${y}`}
            fill="none"
            stroke="#E2E8F0"
            strokeOpacity={0.05}
            strokeWidth={1.2}
          />
        )
      })}
    </svg>
  )
}

function TrailPaths({ pts, lastSolved, active, reduce, width, height }: {
  pts: Point[]
  lastSolved: number
  active: number
  reduce: boolean
  width: number
  height: number
}) {
  const segs = smoothSegments(pts)
  const full = trailPart(pts, segs, 0, pts.length - 1)
  const climbed = trailPart(pts, segs, 0, lastSolved)
  const from = Math.max(0, lastSolved)
  const ahead = trailPart(pts, segs, from, active)
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0" width={width} height={height}>
      {/* the dirt trail */}
      <path d={full} fill="none" stroke="#0B0C10" strokeOpacity={0.6} strokeWidth={10} strokeLinecap="round" />
      <path d={full} fill="none" stroke="#475069" strokeWidth={2.5} strokeDasharray="2 9" strokeLinecap="round" />
      {/* the route you've climbed */}
      {climbed && (
        <path d={climbed} fill="none" stroke="#34D399" strokeWidth={3.5} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px #34D399)' }} />
      )}
      {/* the way to your current trial */}
      {ahead && (
        <>
          <path d={ahead} fill="none" stroke="#22D3EE" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
          {!reduce && (
            <motion.path
              d={ahead}
              pathLength={1}
              fill="none"
              stroke="#22D3EE"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeDasharray="0.25 0.75"
              style={{ filter: 'drop-shadow(0 0 6px #22D3EE)' }}
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

function Waypoint({ q, index, n, point, active, boss }: { q: QuestionSummary; index: number; n: number; point: Point; active: boolean; boss: boolean }) {
  const solved = q.progress.solved
  const size = boss ? 48 : active ? 44 : 38
  return (
    <div className="absolute z-10" style={{ left: point.x - size / 2, top: point.y - size / 2, width: size, height: size }}>
      {active && <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400/40" />}
      <span
        className={`relative flex h-full w-full items-center justify-center rounded-full border-2 font-mono text-xs ${
          solved
            ? 'border-emerald-400 bg-[#0F1E1A] text-emerald-300 shadow-[0_0_14px_-2px_#34D399]'
            : boss
              ? 'border-amber-400 bg-[#1F1712] text-amber-300 shadow-[0_0_18px_-2px_#F59E0B]'
              : active
                ? 'border-cyan-400 bg-[#131824] text-cyan-300 shadow-[0_0_16px_-2px_#22D3EE]'
                : 'border-[#3D4560] bg-[#181B24] text-[#94A3B8]'
        }`}
        title={`${campLabel(index, n)}, ${altitude(index, n).toLocaleString()} m`}
      >
        {solved ? <Check size={16} /> : boss ? <Flag size={17} /> : index === 0 ? <Mountain size={15} /> : index + 1}
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
            className={`h-2 w-2 rounded-full ${done[i] ? 'bg-emerald-400 shadow-[0_0_6px_#34D399]' : 'bg-[#3D4560]'}`}
            title={`${name}${done[i] ? ' done' : ''}`}
          />
          <span className={`text-2xs ${done[i] ? 'text-emerald-300' : 'text-[#94A3B8]'}`}>{name}</span>
        </span>
      ))}
    </div>
  )
}

function TrailNode({ q, index, n, active, boss }: { q: QuestionSummary; index: number; n: number; active: boolean; boss: boolean }) {
  const navigate = useNavigate()
  const solved = q.progress.solved
  const due = q.progress.status === 'review_due'
  const href = questUrl(q)

  const frame = solved
    ? 'border-emerald-400/60 bg-[#0F1E1A]/95'
    : due
      ? 'border-amber-400/70 bg-[#1F1712]/95'
      : active
        ? 'border-cyan-400 bg-[#131824]/95 quest-pulse'
        : boss
          ? 'border-transparent bg-[#1A1418]/95'
          : 'border-[#2E3446] bg-[#181B24]/95 hover:border-cyan-400/50'

  return (
    <div className={`relative rounded-2xl border backdrop-blur-sm transition-colors ${frame} ${active ? 'p-4' : 'px-4 py-3'}`}>
      {boss && !solved && <ShineBorder />}
      {boss && (
        <span
          className={`absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-2xs font-semibold ${
            solved ? 'border-amber-300/60 bg-[#2A2010] text-amber-300' : 'border-rose-400/60 bg-[#2A1218] text-rose-300'
          }`}
        >
          <Crown size={11} /> {solved ? 'Summit reached' : 'Final Trial'}
        </span>
      )}
      <div className={`flex flex-wrap items-center gap-x-2 text-2xs ${boss ? 'mt-1' : ''}`}>
        <span className={active ? 'font-medium text-cyan-300' : 'text-[#94A3B8]'}>
          {active ? (due ? 'Blind re-solve due' : 'You are here') : campLabel(index, n)}
        </span>
        <span className="font-mono text-[#64748B]">{altitude(index, n).toLocaleString()} m</span>
      </div>
      <Link to={href} className={`block font-plate leading-snug font-semibold text-[#F1F5F9] hover:text-cyan-300 ${active ? 'text-lg' : 'text-[15px]'}`}>
        {q.title}
      </Link>
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
        <Link to={`/q/${q.slug}?stage=4`} className="mt-1.5 inline-block text-xs text-emerald-300 hover:underline">
          Review your pitch
        </Link>
      )}
    </div>
  )
}

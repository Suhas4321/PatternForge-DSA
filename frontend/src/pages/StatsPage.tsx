import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Crosshair,
  Flame,
  Lock,
  RefreshCw,
  RotateCw,
  Shield,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { PeakStat, StatsResponse } from '../api/types'
import CountUp from '../components/vendor/react-bits/CountUp'
import { GlassSurface } from '../components/vendor/vsrc/glass-surface'
import { Skeleton } from '../components/vendor/vsrc/skeleton'

// ========================================================================================
// READINESS SCORE FORMULA:
// Weighted base mastery across 6 Citadels:
// - DSA: 30% (core algorithm foundations)
// - Python & Data: 15% (language internals & data processing)
// - SQL & DBMS: 15% (querying, storage engines, transactions)
// - OS & Concurrency: 15% (threading, race conditions, async)
// - FastAPI & Backend: 15% (APIs, auth, production architecture)
// - GenAI & Resume: 10% (vectors, RAG, agents, system defense)
//
// Base readiness = sum(peak_mastery * weight)
// Scaled by average confidence factor (0.85x to 1.1x when rated)
// Minus rust penalty: -2 points per rusting lesson, -4 points per rusted lesson (max -20)
// Final score = clamp(0, 100, round(base_readiness * conf_factor - rust_penalty))
// ========================================================================================

function getReadinessLabel(score: number): { text: string; color: string; desc: string } {
  if (score >= 85) return { text: 'Summit Ready', color: 'text-forge', desc: 'Poised for principal technical rounds' }
  if (score >= 65) return { text: 'High Ridge', color: 'text-amber', desc: 'Solid fundamentals across core tracks' }
  if (score >= 40) return { text: 'Ascending', color: 'text-sky-400', desc: 'Gaining momentum and pattern synthesis' }
  if (score >= 15) return { text: 'Base Camp', color: 'text-cyan', desc: 'Establishing footholds in core domains' }
  return { text: 'Trailhead', color: 'text-muted', desc: 'Begin your ascent through the Citadels' }
}

/** SVG Radar chart plotting 6 peaks */
function SkillRadar({ peaks }: { peaks: PeakStat[] }) {
  const size = 280
  const center = size / 2
  const radius = 95
  const count = peaks.length || 6

  // Concentric polygon points (25%, 50%, 75%, 100%)
  const levels = [0.25, 0.5, 0.75, 1.0]

  const getCoordinates = (index: number, valueRatio: number) => {
    // Angle starting from top (-90 degrees)
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2
    const x = center + radius * valueRatio * Math.cos(angle)
    const y = center + radius * valueRatio * Math.sin(angle)
    return { x, y }
  }

  // Data polygon points
  const points = peaks.map((p, idx) => {
    const ratio = Math.max(0.08, (p.mastery || 0) / 100)
    const { x, y } = getCoordinates(idx, ratio)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Background web */}
        {levels.map((lvl) => {
          const ringPoints = Array.from({ length: count }).map((_, i) => {
            const { x, y } = getCoordinates(i, lvl)
            return `${x},${y}`
          }).join(' ')
          return (
            <polygon
              key={lvl}
              points={ringPoints}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="1"
            />
          )
        })}

        {/* Axis spokes */}
        {peaks.map((p, i) => {
          const { x, y } = getCoordinates(i, 1.0)
          return (
            <line
              key={p.id}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="var(--color-line-strong)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )
        })}

        {/* Data polygon */}
        <polygon
          points={points}
          fill="color-mix(in srgb, var(--color-sky) 24%, transparent)"
          stroke="var(--color-sky)"
          strokeWidth="2"
          className="transition-all duration-700 ease-out"
        />

        {/* Peak data points */}
        {peaks.map((p, i) => {
          const ratio = Math.max(0.08, (p.mastery || 0) / 100)
          const { x, y } = getCoordinates(i, ratio)
          return (
            <circle
              key={p.id}
              cx={x}
              cy={y}
              r="4"
              fill={p.accent || 'var(--color-sky)'}
              stroke="var(--surface-0)"
              strokeWidth="1.5"
            />
          )
        })}

        {/* Outer peak labels */}
        {peaks.map((p, i) => {
          const { x, y } = getCoordinates(i, 1.25)
          return (
            <text
              key={p.id}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted font-plate text-[11px] font-semibold"
            >
              {p.short_name} ({Math.round(p.mastery)}%)
            </text>
          )
        })}
      </svg>
    </div>
  )
}

/** 20-week Heatmap Component (140 days) */
function Heatmap({ days }: { days: { date: string; count: number; level: number }[] }) {
  const levelColors = [
    'bg-surface-2 border-line/30',
    'bg-emerald-hi/25 border-emerald-hi/40 text-emerald-hi',
    'bg-emerald-hi/50 border-emerald-hi/60 text-emerald-hi',
    'bg-emerald-hi/75 border-emerald-hi/80 text-black',
    'bg-emerald-hi border-emerald-hi shadow-[0_0_8px_rgba(110,231,183,0.4)] text-black',
  ]

  const totalRuns = days.reduce((sum, d) => sum + d.count, 0)

  if (totalRuns === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Calendar size={28} className="text-muted/60 mb-2" />
        <p className="text-sm font-medium text-chalk">No expedition activity recorded yet.</p>
        <p className="text-xs text-muted max-w-sm mt-1">
          Solve your first lesson or execute code in the Arena to illuminate your 20-week activity heatmap.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[620px]">
        {days.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} submission${d.count === 1 ? '' : 's'}`}
            className={`h-3 w-3 rounded-xs border transition-transform hover:scale-125 ${levelColors[d.level] || levelColors[0]}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-2xs text-muted mt-3 pt-2 border-t border-line/50">
        <span>20 weeks ago</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {levelColors.map((cls, idx) => (
            <div key={idx} className={`h-2.5 w-2.5 rounded-xs border ${cls}`} />
          ))}
          <span>More</span>
        </div>
        <span>Today</span>
      </div>
    </div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api.stats()
      .then((data) => {
        if (active) {
          setStats(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to load telemetry data')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="shell max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="shell max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <AlertTriangle size={36} className="text-crimson mx-auto mb-3" />
        <h2 className="text-lg font-bold text-chalk mb-1">Failed to Load Expedition Log</h2>
        <p className="text-sm text-muted mb-4">{error || 'Unknown error occurred while querying stats.'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-lg bg-panel-2 px-4 py-2 text-xs font-semibold text-chalk hover:bg-panel-3"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  const readiness = getReadinessLabel(stats.readiness_score)

  return (
    <div className="shell max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* ==================================================================== */}
      {/* 1. TOP STRIP (LIQUID GLASS) */}
      {/* ==================================================================== */}
      <GlassSurface className="relative rounded-3xl border border-line p-6 shadow-2xl backdrop-blur-xl mb-8 overflow-hidden">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 items-center">
          {/* Level & XP */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-panel-2 shadow-inner">
              <Trophy size={24} className="text-amber" />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-black">
                {stats.level}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-2xs font-semibold uppercase tracking-wider text-muted">
                Ascension Rank
              </div>
              <div className="font-plate text-xl font-bold text-chalk">
                Level <CountUp to={stats.level} duration={0.8} />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{ width: `${stats.level_xp}%` }}
                  />
                </div>
                <span className="text-2xs font-mono text-muted whitespace-nowrap">
                  <CountUp to={stats.level_xp} duration={0.8} />/100 XP
                </span>
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-4 sm:border-l sm:border-line/60 sm:pl-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber/30 bg-amber/10 text-amber">
              <Flame size={24} className="fill-amber/40" />
            </div>
            <div>
              <div className="text-2xs font-semibold uppercase tracking-wider text-muted">Active Streak</div>
              <div className="font-plate text-2xl font-bold text-chalk">
                <CountUp to={stats.streak} duration={0.8} /> <span className="text-sm font-medium text-muted">days</span>
              </div>
              <div className="text-2xs text-muted">
                {stats.streak > 0 ? 'Summit rhythm unbroken' : 'Solve a lesson today to ignite flame'}
              </div>
            </div>
          </div>

          {/* Total Solved */}
          <div className="flex items-center gap-4 lg:border-l lg:border-line/60 lg:pl-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-forge/30 bg-forge/10 text-forge">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-2xs font-semibold uppercase tracking-wider text-muted">Mastery Count</div>
              <div className="font-plate text-2xl font-bold text-chalk">
                <CountUp to={stats.total_solved} duration={0.8} /> <span className="text-sm font-medium text-muted">/ {stats.total_questions}</span>
              </div>
              <div className="text-2xs text-muted">
                {Math.round((stats.total_solved / (stats.total_questions || 1)) * 100)}% overall curriculum solved
              </div>
            </div>
          </div>

          {/* Readiness Score */}
          <div className="flex items-center gap-4 lg:border-l lg:border-line/60 lg:pl-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10 text-sky-400">
              <Compass size={24} />
            </div>
            <div>
              <div className="text-2xs font-semibold uppercase tracking-wider text-muted">Readiness Score</div>
              <div className="font-plate text-2xl font-bold text-chalk flex items-center gap-1.5">
                <CountUp to={stats.readiness_score} duration={0.8} /> <span className="text-sm font-medium text-muted">/ 100</span>
                <span className={`text-xs font-bold ${readiness.color}`}>({readiness.text})</span>
              </div>
              <div className="text-2xs text-muted truncate">{readiness.desc}</div>
            </div>
          </div>
        </div>
      </GlassSurface>

      {/* ==================================================================== */}
      {/* 2. SIX PEAK RINGS */}
      {/* ==================================================================== */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-chalk">Citadel Mastery</h2>
          <span className="text-2xs text-muted">Click any peak to enter citadel map</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.peaks.map((peak) => {
            const radius = 22
            const stroke = 3.5
            const normRadius = radius - stroke * 2
            const circumference = normRadius * 2 * Math.PI
            const strokeDashoffset = circumference - (peak.mastery / 100) * circumference

            return (
              <Link
                key={peak.id}
                to={`/citadel/${peak.id}`}
                className="group relative flex flex-col items-center rounded-2xl border border-line bg-panel p-4 text-center transition-all duration-300 hover:border-line-strong hover:bg-panel-2 hover:-translate-y-1 shadow-sm"
              >
                {/* SVG Progress Ring */}
                <div className="relative mb-3 flex items-center justify-center">
                  <svg height={radius * 2} width={radius * 2} className="-rotate-90">
                    <circle
                      stroke="rgba(255, 255, 255, 0.08)"
                      fill="transparent"
                      strokeWidth={stroke}
                      r={normRadius}
                      cx={radius}
                      cy={radius}
                    />
                    <circle
                      stroke={peak.accent}
                      fill="transparent"
                      strokeWidth={stroke}
                      strokeDasharray={`${circumference} ${circumference}`}
                      style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease' }}
                      strokeLinecap="round"
                      r={normRadius}
                      cx={radius}
                      cy={radius}
                    />
                  </svg>
                  <span className="absolute text-base group-hover:scale-110 transition-transform">
                    {peak.icon}
                  </span>
                </div>

                <div className="text-2xs font-bold uppercase tracking-wider text-muted">
                  Peak {peak.numeral}
                </div>
                <div className="font-plate text-sm font-bold text-chalk group-hover:text-accent transition-colors line-clamp-1">
                  {peak.short_name}
                </div>
                <div className="mt-1 text-2xs text-muted">
                  <CountUp to={peak.solved} /> / {peak.total} ({Math.round(peak.mastery)}%)
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3, 4, 5. BENTO GRID ROW: RADAR, ACTIVITY & ACCURACY */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Radar Chart */}
        <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-plate text-base font-bold text-chalk flex items-center gap-2">
                <Compass size={16} className="text-sky-400" /> Citadel Radar
              </h3>
              <span className="text-2xs text-muted">Hexagonal Balance</span>
            </div>
            <p className="text-2xs text-muted mb-4">
              Visualizes cross-discipline breadth across algorithmic, systems, database, and AI competencies.
            </p>
          </div>
          <div className="py-2">
            <SkillRadar peaks={stats.peaks} />
          </div>
          <div className="pt-3 border-t border-line/50 text-center">
            <span className="text-2xs text-muted">
              Strongest domain: <strong className="text-chalk">{[...stats.peaks].sort((a, b) => b.mastery - a.mastery)[0]?.name || 'DSA'}</strong>
            </span>
          </div>
        </div>

        {/* 20-Week Activity Heatmap + This Week Bar Chart */}
        <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-plate text-base font-bold text-chalk flex items-center gap-2">
                <Calendar size={16} className="text-forge" /> Expedition Log
              </h3>
              <span className="text-2xs text-muted">20 Weeks (140 Days)</span>
            </div>
            <p className="text-2xs text-muted mb-4">
              Frequency of code executions, test passes, and drills completed.
            </p>
          </div>

          <Heatmap days={stats.activity_20_weeks} />

          {/* This week mini-bar breakdown */}
          <div className="mt-4 pt-3 border-t border-line/50">
            <div className="flex items-center justify-between text-2xs text-muted mb-2">
              <span>This week's daily momentum</span>
              <span className="text-chalk font-semibold">
                {stats.activity_this_week.reduce((s, w) => s + w.count, 0)} runs
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {stats.activity_this_week.map((item) => {
                const max = Math.max(1, ...stats.activity_this_week.map((w) => w.count))
                const heightPct = Math.round((item.count / max) * 100)
                return (
                  <div key={item.date} className="flex flex-col items-center gap-1">
                    <div className="h-10 w-full flex items-end justify-center rounded-xs bg-surface-2 p-0.5">
                      <div
                        className="w-full rounded-xs bg-forge transition-all duration-500"
                        style={{ height: `${Math.max(10, heightPct)}%`, opacity: item.count > 0 ? 1 : 0.2 }}
                      />
                    </div>
                    <span className="text-[10px] text-muted">{item.day}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Accuracy & Rigor */}
        <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-plate text-base font-bold text-chalk flex items-center gap-2">
                <Crosshair size={16} className="text-amber" /> Calibration & Rigor
              </h3>
              <span className="text-2xs text-muted">Accuracy Telemetry</span>
            </div>
            <p className="text-2xs text-muted mb-4">
              Measured from clean executions without trial-and-error guessing.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* First-Try Pass Rate */}
            <div className="rounded-xl border border-line bg-surface-1 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold uppercase text-muted">First-Try Pass Rate</span>
                <span className="font-plate text-lg font-bold text-chalk">
                  {stats.first_try_pass_rate !== null ? `${stats.first_try_pass_rate}%` : '—'}
                </span>
              </div>
              <p className="text-2xs text-muted mt-1 leading-relaxed">
                {stats.first_try_pass_rate !== null
                  ? 'Calculated from solutions accepted on attempt #1 without compilation lapses.'
                  : 'Tracking starts today. Submit code on your first attempt to measure your first-try pass rate.'}
              </p>
            </div>

            {/* Average Hints Used */}
            <div className="rounded-xl border border-line bg-surface-1 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold uppercase text-muted">Average Hints Per Lesson</span>
                <span className="font-plate text-lg font-bold text-chalk">
                  {stats.average_hints !== null ? stats.average_hints : '—'}
                </span>
              </div>
              <p className="text-2xs text-muted mt-1 leading-relaxed">
                {stats.average_hints !== null
                  ? 'Mean number of tiered progressive hints revealed before solving.'
                  : 'Tracking starts today. Reveal hints during practice to track your dependency index.'}
              </p>
            </div>

            {/* Average Confidence */}
            <div className="rounded-xl border border-line bg-surface-1 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold uppercase text-muted">Self-Calibration Score</span>
                <span className="font-plate text-lg font-bold text-chalk">
                  {stats.average_confidence !== null ? `${stats.average_confidence} / 3.0` : '—'}
                </span>
              </div>
              <p className="text-2xs text-muted mt-1 leading-relaxed">
                {stats.average_confidence !== null
                  ? 'Subjective mastery rating (1=Struggled, 2=Needed Hints, 3=Crushed It).'
                  : 'Tracking starts today. Rate your confidence (1–3) after solving lessons to unlock calibration data.'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-line/50 text-2xs text-muted">
            Higher calibration correlates with superior whiteboarding performance.
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6 & 7. RUST CAMPS & WEAKEST LESSONS */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Rust & Spaced Repetition Due */}
        <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-plate text-base font-bold text-chalk flex items-center gap-2">
                <RotateCw size={16} className="text-rust" /> Rust Detector & Due Reviews
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-crimson/15 px-2 py-0.5 text-[10px] font-bold text-crimson border border-crimson/30">
                  {stats.reviews_due_today} due today
                </span>
                <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-bold text-amber border border-amber/30">
                  {stats.reviews_due_this_week} this week
                </span>
              </div>
            </div>
            <p className="text-2xs text-muted mb-4">
              Memory decays without reinforcement. Camps turn dusty after 5 days, oxidising after 10, and rusted after 21.
            </p>
          </div>

          {stats.rust_camps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-surface-1 rounded-xl border border-line/50 p-4">
              <Shield size={28} className="text-forge mb-2" />
              <p className="text-xs font-semibold text-chalk">All camps are fortified and fresh.</p>
              <p className="text-2xs text-muted max-w-sm mt-1">
                No lessons are currently oxidised. Unpracticed concepts will appear here as spaced-repetition decay occurs.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {stats.rust_camps.map((camp) => (
                <div
                  key={camp.slug}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface-1 px-4 py-2.5 transition-colors hover:border-line-strong"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${camp.rust === 'rusted' ? 'bg-crimson animate-pulse' : 'bg-amber'}`} />
                      <span className="text-xs font-semibold text-chalk truncate">{camp.title}</span>
                      <span className="text-[10px] uppercase font-bold text-muted">
                        [{camp.rust}]
                      </span>
                    </div>
                    <div className="text-2xs text-muted truncate mt-0.5">
                      {camp.world_title} · Box {camp.box}
                    </div>
                  </div>
                  <Link
                    to={`/q/${camp.slug}`}
                    className="shrink-0 rounded-lg bg-panel-2 px-3 py-1.5 text-xs font-medium text-chalk border border-line hover:bg-panel-3 hover:border-line-strong transition-colors"
                  >
                    Re-climb
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5 Weakest Lessons */}
        <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-plate text-base font-bold text-chalk flex items-center gap-2">
                <AlertTriangle size={16} className="text-crimson" /> Reinforcement Targets
              </h3>
              <span className="text-2xs text-muted">5 Weakest Spots</span>
            </div>
            <p className="text-2xs text-muted mb-4">
              Lessons marked with low confidence or high attempt counts that warrant a deliberate re-climb.
            </p>
          </div>

          {stats.weakest_lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-surface-1 rounded-xl border border-line/50 p-4">
              <Sparkles size={28} className="text-amber mb-2" />
              <p className="text-xs font-semibold text-chalk">No vulnerable spots detected yet.</p>
              <p className="text-2xs text-muted max-w-sm mt-1">
                Solve more complex algorithms or rate your confidence to highlight focal points for deliberate practice.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {stats.weakest_lessons.map((lesson) => (
                <div
                  key={lesson.slug}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface-1 px-4 py-2.5 transition-colors hover:border-line-strong"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="text-xs font-semibold text-chalk truncate">{lesson.title}</div>
                    <div className="flex items-center gap-2 text-2xs text-muted mt-0.5">
                      <span>{lesson.world_title}</span>
                      <span>·</span>
                      <span>{lesson.attempts} attempt{lesson.attempts === 1 ? '' : 's'}</span>
                      {lesson.confidence && (
                        <>
                          <span>·</span>
                          <span className={lesson.confidence === 1 ? 'text-crimson font-bold' : 'text-amber'}>
                            {lesson.confidence === 1 ? 'Struggled' : 'Needed hints'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/q/${lesson.slug}`}
                    className="shrink-0 rounded-lg bg-panel-2 px-3 py-1.5 text-xs font-medium text-chalk border border-line hover:bg-panel-3 hover:border-line-strong transition-colors"
                  >
                    Re-climb
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 8. SEALS & ACHIEVEMENTS */}
      {/* ==================================================================== */}
      <div className="mb-8 rounded-2xl border border-line bg-panel p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-plate text-base font-bold text-chalk flex items-center gap-2">
              <Award size={18} className="text-reward" /> Citadel Seals & Badges
            </h3>
            <p className="text-2xs text-muted">
              Milestones etched upon your expedition banner as you conquer peaks and master foundational disciplines.
            </p>
          </div>
        </div>

        {/* 6 Citadel Seals */}
        <div className="mb-6">
          <div className="text-2xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            Citadel Seals (Conquer All Lessons in a Peak)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.seals.map((seal) => (
              <div
                key={seal.citadel_id}
                className={`flex flex-col items-center rounded-xl border p-3 text-center transition-all ${
                  seal.unlocked
                    ? 'border-accent bg-accent/5 shadow-[0_0_12px_rgba(110,231,183,0.15)]'
                    : 'border-line/60 bg-surface-1 opacity-60'
                }`}
              >
                <div
                  className="mb-1.5 text-2xl"
                  style={{ filter: seal.unlocked ? 'none' : 'grayscale(100%)' }}
                >
                  🏔️
                </div>
                <div className="font-plate text-xs font-bold text-chalk">
                  Seal {seal.numeral}
                </div>
                <div className="text-[10px] text-muted truncate w-full">
                  {seal.name.split(' ')[0]}
                </div>
                <div className="mt-1 text-[10px] font-mono text-muted">
                  {seal.unlocked ? (
                    <span className="text-forge font-bold">CLAIMED</span>
                  ) : (
                    `${seal.solved}/${seal.total}`
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 8 Achievement Badges */}
        <div>
          <div className="text-2xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            Ascension Badges
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.badges.map((badge) => (
              <div
                key={badge.id}
                className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
                  badge.unlocked
                    ? 'border-line-strong bg-surface-2'
                    : 'border-line/40 bg-surface-1 opacity-50'
                }`}
              >
                <div
                  className="text-2xl shrink-0"
                  style={{ filter: badge.unlocked ? 'none' : 'grayscale(100%)' }}
                >
                  {badge.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-plate text-xs font-bold text-chalk truncate">{badge.title}</span>
                    {!badge.unlocked && <Lock size={10} className="text-muted shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted line-clamp-2 mt-0.5 leading-snug">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 9. RECENT ACTIVITY TIMELINE */}
      {/* ==================================================================== */}
      <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-plate text-base font-bold text-chalk flex items-center gap-2">
            <Clock size={16} className="text-sky-400" /> Recent Submissions
          </h3>
          <span className="text-2xs text-muted">Last 15 Execution Events</span>
        </div>

        {stats.recent_timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-surface-1 rounded-xl border border-line/50 p-4">
            <Clock size={28} className="text-muted/60 mb-2" />
            <p className="text-xs font-semibold text-chalk">No runs recorded yet.</p>
            <p className="text-2xs text-muted max-w-sm mt-1">
              Start solving lessons or drills to build your chronological execution trail.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line/40">
            {stats.recent_timeline.map((event) => (
              <div key={event.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {event.passed ? (
                    <CheckCircle2 size={16} className="text-forge shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-crimson shrink-0" />
                  )}
                  <div className="min-w-0">
                    <Link
                      to={`/q/${event.question_slug}`}
                      className="text-xs font-semibold text-chalk hover:text-accent transition-colors truncate block"
                    >
                      {event.question_title}
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5">
                      <span className="capitalize">{event.target === 'main' ? 'Full Arena Solve' : event.target}</span>
                      <span>·</span>
                      <span>{event.passed_count}/{event.total_count} test cases passed</span>
                    </div>
                  </div>
                </div>
                <div className="text-2xs font-mono text-muted whitespace-nowrap">
                  {new Date(event.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

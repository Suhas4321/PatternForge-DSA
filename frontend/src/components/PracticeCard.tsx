import { Flame, Snowflake, Target } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { ActivityEvent } from '../api/types'
import { computeStreak, DAILY_GOAL, dayKey, heatmapWeeks } from '../lib/streak'
import { NumberTicker } from './effects'
import { ProgressRing } from './ui'

const WEEKS = 20
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Heat level 0–4 from the day's points. */
const level = (points: number, runs: number) => (runs === 0 ? 0 : points === 0 ? 1 : points < DAILY_GOAL ? 2 : points < DAILY_GOAL * 2 ? 3 : 4)
const LEVEL_BG = [
  'bg-chalk/[0.06]',
  'bg-emerald/25',
  'bg-emerald/45',
  'bg-emerald/70',
  'bg-emerald',
]

/** Streak, today's goal and a 20-week activity heatmap. */
export default function PracticeCard() {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null)
  useEffect(() => {
    api.activity().then((r) => setEvents(r.events)).catch(() => setEvents([]))
  }, [])
  const stats = useMemo(() => (events ? computeStreak(events) : null), [events])
  const weeks = useMemo(() => heatmapWeeks(WEEKS), [])
  // A month name over the first week of each month, at least three columns apart so they never collide.
  const monthLabels = useMemo(() => {
    let last = -3
    return weeks.map((col, i) => {
      const starts = col.some((d) => d.getDate() === 1)
      if (!starts || i - last < 3) return ''
      last = i
      return MONTHS[col.find((d) => d.getDate() === 1)!.getMonth()]
    })
  }, [weeks])
  const todayKey = dayKey(new Date())

  if (!stats) return <div className="card h-[188px] animate-pulse rounded-3xl" aria-label="Loading practice stats" />

  const goalDone = stats.today.points >= DAILY_GOAL
  const message = goalDone
    ? 'Daily goal done. Anything more is a bonus.'
    : stats.atRisk
      ? `Practise today to keep your ${stats.current}-day streak.`
      : stats.current === 0
        ? 'Run any code today to start a streak.'
        : 'Solve a trial or pass three drills to hit today’s goal.'

  return (
    <section className="card grid gap-6 rounded-3xl p-6 lg:grid-cols-[auto_auto_1fr] lg:items-center">
      {/* Streak */}
      <div className="flex items-center gap-4">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
            stats.current > 0 && !stats.atRisk ? 'bg-amber/15 text-amber' : 'bg-chalk/[0.06] text-faint'
          }`}
        >
          <Flame size={28} strokeWidth={2.2} />
        </span>
        <div>
          <div className="font-plate text-3xl leading-none font-semibold text-chalk">
            <NumberTicker value={stats.current} />
            <span className="ml-1.5 text-base font-medium text-muted">day streak</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>
              Best <span className="font-mono tabular-nums text-chalk">{stats.best}</span>
            </span>
            {stats.nextMilestone && (
              <span>
                Next milestone <span className="font-mono tabular-nums text-chalk">{stats.nextMilestone}</span>
              </span>
            )}
            {stats.freezesUsed > 0 && (
              <span className="inline-flex items-center gap-1 text-sky" title="One missed day a week is covered automatically">
                <Snowflake size={12} /> {stats.freezesUsed} freeze used
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Today's goal */}
      <div className="flex items-center gap-3 border-line lg:border-l lg:pl-6">
        <ProgressRing value={Math.min(stats.today.points, DAILY_GOAL)} total={DAILY_GOAL} size={56} stroke={6} color="var(--color-emerald)">
          <Target size={18} className={goalDone ? 'text-emerald' : 'text-faint'} />
        </ProgressRing>
        <div className="max-w-[16rem]">
          <div className="text-sm font-semibold text-chalk">
            Today <span className="font-mono tabular-nums">{Math.min(stats.today.points, 99)}</span>
            <span className="text-faint"> / {DAILY_GOAL} pts</span>
          </div>
          <p className="text-xs leading-snug text-muted">{message}</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="min-w-0 border-line lg:border-l lg:pl-6">
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="font-semibold text-chalk">Last {WEEKS} weeks</span>
          <span className="text-muted">
            <span className="font-mono tabular-nums text-chalk">{stats.totalDays}</span> active days
          </span>
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="inline-flex flex-col gap-1">
            <div className="flex gap-[3px] pl-0 text-caption text-faint">
              {monthLabels.map((label, i) => (
                <span key={i} className="w-[11px] overflow-visible whitespace-nowrap">
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((col, i) => (
                <div key={i} className="flex flex-col gap-[3px]">
                  {col.map((d) => {
                    const k = dayKey(d)
                    const future = d > new Date() && k !== todayKey
                    const s = stats.byDay.get(k)
                    const lv = s ? level(s.points, s.runs) : 0
                    return (
                      <span
                        key={k}
                        title={future ? '' : `${d.toDateString()}: ${s ? `${s.runs} run${s.runs === 1 ? '' : 's'}, ${s.points} pts` : 'no practice'}`}
                        className={`h-[11px] w-[11px] rounded-[3px] ${future ? 'bg-transparent' : LEVEL_BG[lv]} ${
                          k === todayKey ? 'ring-1 ring-chalk/50 ring-offset-1 ring-offset-panel' : ''
                        }`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-end gap-1 text-caption text-faint">
          Less
          {LEVEL_BG.map((c) => (
            <span key={c} className={`h-[9px] w-[9px] rounded-[2px] ${c}`} />
          ))}
          More
        </div>
      </div>
    </section>
  )
}

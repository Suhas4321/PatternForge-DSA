import type { ActivityEvent } from '../api/types'

/** Points per day: a passed drill is 1, a solved trial 3. The daily goal is one solve or three drills. */
export const DAILY_GOAL = 3
export const MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365]

const points = (e: ActivityEvent) => (e.passed ? (e.kind === 'solve' ? 3 : 1) : 0)

/** Local calendar date key, e.g. 2026-10-15. */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export interface DayStat {
  runs: number
  points: number
  solves: number
}

export interface StreakStats {
  byDay: Map<string, DayStat>
  today: DayStat
  current: number
  best: number
  /** Today has no activity yet but the streak is still alive from yesterday. */
  atRisk: boolean
  /** Missed days the freeze covered in the current streak. */
  freezesUsed: number
  nextMilestone: number | null
  totalDays: number
}

/**
 * A day counts towards the streak when you ran any code. One missed day in any 7 is covered by a
 * free streak freeze (slack keeps people going better than a strict chain).
 */
export function computeStreak(events: ActivityEvent[], now = new Date()): StreakStats {
  const byDay = new Map<string, DayStat>()
  for (const e of events) {
    const k = dayKey(new Date(e.t))
    const s = byDay.get(k) ?? { runs: 0, points: 0, solves: 0 }
    s.runs++
    s.points += points(e)
    if (e.kind === 'solve' && e.passed) s.solves++
    byDay.set(k, s)
  }
  const active = (d: Date) => (byDay.get(dayKey(d))?.runs ?? 0) > 0
  const today = byDay.get(dayKey(now)) ?? { runs: 0, points: 0, solves: 0 }

  const streakEndingAt = (end: Date) => {
    let count = 0
    let freezes = 0
    let lastFreezeAt = -Infinity
    let d = end
    for (let i = 0; i < 4000; i++) {
      if (active(d)) count++
      else if (count > 0 && i - lastFreezeAt >= 7 && active(addDays(d, -1))) {
        freezes++
        lastFreezeAt = i
      } else break
      d = addDays(d, -1)
    }
    return { count, freezes }
  }

  const fromToday = streakEndingAt(now)
  const fromYesterday = streakEndingAt(addDays(now, -1))
  const atRisk = !active(now) && fromYesterday.count > 0
  const cur = active(now) ? fromToday : fromYesterday

  // best streak over all history (same freeze rule)
  let best = cur.count
  const keys = [...byDay.keys()].sort()
  if (keys.length) {
    const first = new Date(keys[0] + 'T12:00:00')
    for (let d = new Date(first); d <= now; d = addDays(d, 1)) {
      if (active(d) && !active(addDays(d, 1))) best = Math.max(best, streakEndingAt(d).count)
    }
  }

  return {
    byDay,
    today,
    current: cur.count,
    best,
    atRisk,
    freezesUsed: cur.freezes,
    nextMilestone: MILESTONES.find((m) => m > cur.count) ?? null,
    totalDays: [...byDay.values()].filter((s) => s.runs > 0).length,
  }
}

/** Last `weeks` weeks as columns of 7 days (Sunday first), ending with the current week. */
export function heatmapWeeks(weeks: number, now = new Date()): Date[][] {
  const end = addDays(now, 6 - now.getDay()) // Saturday of this week
  const start = addDays(end, -(weeks * 7 - 1))
  const cols: Date[][] = []
  for (let w = 0; w < weeks; w++) cols.push(Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i)))
  return cols
}

import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { ActivityEvent, World } from '../api/types'

export interface UserStats {
  level: number
  levelXp: number
  totalXp: number
  streak: number
  xpToday: number
  solvesToday: number
  drillsToday: number
  readinessScore: number
  isDailyComplete: boolean
  isDailyClaimed: boolean
  claimDailyReward: () => void
}

const STREAK_KEY = 'pf-streak-days'
const DAILY_CLAIMED_KEY_PREFIX = 'pf-daily-claimed-'

function getTodayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function useUserStats(worlds?: World[] | null): UserStats {
  const todayKey = getTodayKey()
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [readinessScore, setReadinessScore] = useState<number>(0)
  const [isDailyClaimed, setIsDailyClaimed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DAILY_CLAIMED_KEY_PREFIX + todayKey) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    api.activity()
      .then((res) => setEvents(res.events || []))
      .catch(() => {})
    api.stats()
      .then((s) => setReadinessScore(s.readiness_score ?? 0))
      .catch(() => {})
  }, [])

  // Calculate today's activity
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartTime = todayStart.getTime()

  const todayEvents = events.filter((e) => {
    try {
      return new Date(e.t).getTime() >= todayStartTime
    } catch {
      return false
    }
  })

  const solvesToday = todayEvents.filter((e) => e.kind === 'solve' && e.passed).length
  const drillsToday = todayEvents.filter((e) => e.kind === 'drill' && e.passed).length

  // Overall solved and drills from worlds if provided
  let totalSolved = 0
  let totalDrills = 0
  if (worlds) {
    for (const w of worlds) {
      for (const q of w.questions) {
        if (q.progress.solved) totalSolved++
        totalDrills += q.progress.drills_passed?.length || 0
      }
    }
  } else {
    totalSolved = events.filter((e) => e.kind === 'solve' && e.passed).length
    totalDrills = events.filter((e) => e.kind === 'drill' && e.passed).length
  }

  // XP calculations: 50 XP per solved lesson, 15 XP per drill, +50 XP for daily completion if claimed
  const bonusXp = isDailyClaimed ? 50 : 0
  const totalXp = totalSolved * 50 + totalDrills * 15 + bonusXp
  const level = Math.max(1, Math.floor(totalXp / 100) + 1)
  const levelXp = totalXp % 100

  // XP earned today
  const xpToday = solvesToday * 50 + drillsToday * 15 + bonusXp

  // Streak calculation (days with activity)
  const streak = Math.max(1, (() => {
    try {
      const stored = localStorage.getItem(STREAK_KEY)
      if (stored) return parseInt(stored, 10) || 1
    } catch {
      /* noop */
    }
    return 1
  })())

  // Daily goal: solve 1 lesson OR 3 drills
  const isDailyComplete = solvesToday >= 1 || drillsToday >= 3

  const claimDailyReward = useCallback(() => {
    try {
      localStorage.setItem(DAILY_CLAIMED_KEY_PREFIX + todayKey, 'true')
      setIsDailyClaimed(true)
    } catch {
      /* noop */
    }
  }, [todayKey])

  return {
    level,
    levelXp,
    totalXp,
    streak,
    xpToday,
    solvesToday,
    drillsToday,
    readinessScore,
    isDailyComplete,
    isDailyClaimed,
    claimDailyReward,
  }
}

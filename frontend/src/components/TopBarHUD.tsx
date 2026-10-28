import { CheckCircle2, Flame } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUserStats } from '../lib/userStats'
import CountUp from './vendor/react-bits/CountUp'

export default function TopBarHUD() {
  const stats = useUserStats()

  return (
    <Link
      to="/stats"
      aria-label="User stats and level progress"
      title={`${stats.totalSolved}/${stats.totalQuestions} Solved · Level ${stats.level} (${stats.levelXp}/100 XP) · ${stats.streak} Day Streak`}
      className="hidden sm:flex items-center gap-2.5 rounded-lg border border-line bg-panel-2/90 px-2.5 py-1 text-xs transition-colors hover:border-line-strong hover:bg-panel-3"
    >
      {/* 0. Clear Solved Counter Pill */}
      <div
        className="flex items-center gap-1 rounded-md border border-emerald/30 bg-emerald/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald"
        title={`${stats.totalSolved} of ${stats.totalQuestions} total questions solved`}
      >
        <CheckCircle2 size={12} className="text-emerald shrink-0" />
        <span>{stats.totalSolved}/{stats.totalQuestions}</span>
      </div>

      <div className="h-3 w-px bg-line" />

      {/* 1. Level badge with mini XP bar */}
      <div className="flex items-center gap-1.5">
        <span className="font-plate text-xs font-bold text-chalk">
          Lvl <CountUp to={stats.level} duration={0.8} />
        </span>
        <div
          className="h-1.5 w-8 overflow-hidden rounded-full bg-line"
          title={`${stats.levelXp}/100 XP to Level ${stats.level + 1}`}
        >
          <div
            className="h-full rounded-full bg-[var(--peak-accent,#6EE7B7)] transition-all duration-500"
            style={{ width: `${stats.levelXp}%` }}
          />
        </div>
      </div>

      <div className="h-3 w-px bg-line" />

      {/* 2. Streak Flame with Number */}
      <div className="flex items-center gap-1 text-amber" title={`${stats.streak} day streak`}>
        <Flame size={14} className="fill-amber/30 text-amber" />
        <span className="font-plate text-xs font-semibold tabular-nums text-chalk">
          <CountUp to={stats.streak} duration={0.8} />
        </span>
      </div>

      <div className="h-3 w-px bg-line" />

      {/* 3. Gold Coin-style XP Today */}
      <div
        className="flex items-center gap-1 rounded-full bg-reward/10 px-2 py-0.5 border border-reward/25 text-reward text-2xs font-semibold"
        title={`${stats.xpToday} XP earned today`}
      >
        <span>🪙</span>
        <span>+<CountUp to={stats.xpToday} duration={0.8} /> XP</span>
      </div>
    </Link>
  )
}

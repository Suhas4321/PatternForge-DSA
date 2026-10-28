import { CheckCircle2, Sparkles, Target, Trophy } from 'lucide-react'
import { useState } from 'react'
import { useUserStats } from '../lib/userStats'
import confetti from 'canvas-confetti'

export default function DailyQuestCard() {
  const stats = useUserStats()
  const [claimedLocal, setClaimedLocal] = useState(false)

  const isComplete = stats.isDailyComplete
  const isClaimed = stats.isDailyClaimed || claimedLocal

  const handleClaim = () => {
    if (!isComplete || isClaimed) return
    try {
      confetti({
        zIndex: 9999,
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
      })
    } catch {
      // noop
    }
    stats.claimDailyReward()
    setClaimedLocal(true)
  }

  // Progress percentage (max of solves vs 1 or drills vs 3)
  const pct = isComplete
    ? 100
    : Math.min(
        100,
        Math.max(
          Math.round(stats.solvesToday * 100),
          Math.round((stats.drillsToday / 3) * 100),
        ),
      )

  const progressLabel = stats.solvesToday >= 1
    ? '1/1 lesson solved'
    : stats.drillsToday > 0
    ? `${stats.drillsToday}/3 drills passed`
    : '0/1 lessons · 0/3 drills'

  return (
    <div className="card flex min-h-[115px] flex-col justify-between rounded-2xl p-4 border border-white/12 bg-[#0D1220]/70 backdrop-blur-md relative overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-reward">
          <Target size={13} className="text-reward" />
          <span>Daily Quest</span>
        </p>
        <span className="flex items-center gap-1 rounded-full bg-reward/10 px-2 py-0.5 text-2xs font-semibold text-reward border border-reward/25">
          <Trophy size={11} />
          <span>+50 XP</span>
        </span>
      </div>

      {/* Goal & Progress */}
      <div className="my-1">
        <p className="font-plate text-sm font-semibold text-chalk leading-tight">
          Solve 1 lesson or 3 drills today
        </p>
        <div className="mt-2 flex items-center justify-between text-2xs text-muted mb-1">
          <span>{progressLabel}</span>
          <span className="font-mono text-chalk font-medium">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: isComplete ? 'var(--color-emerald, #10B981)' : 'var(--color-reward, #F5C451)',
            }}
          />
        </div>
      </div>

      {/* Status or Claim Button */}
      <div className="flex items-center justify-between gap-2 mt-0.5">
        {isClaimed ? (
          <span className="flex items-center gap-1 text-2xs font-semibold text-emerald">
            <CheckCircle2 size={13} />
            <span>Reward Claimed (+50 XP)</span>
          </span>
        ) : isComplete ? (
          <button
            onClick={handleClaim}
            className="flex items-center gap-1.5 rounded-full bg-reward px-3 py-1 text-2xs font-bold text-surface-0 shadow-[0_2px_12px_rgba(245,196,81,0.4)] hover:brightness-110 active:scale-95 transition-all"
          >
            <Sparkles size={12} />
            <span>Claim +50 XP</span>
          </button>
        ) : (
          <span className="text-2xs text-faint">
            In progress today
          </span>
        )}
      </div>
    </div>
  )
}

import { CheckCircle2, Flag, Trophy, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import CountUp from '../vendor/react-bits/CountUp'
import { GlassSurface } from '../vendor/vsrc/glass-surface'

export interface RewardPayload {
  xp: number
  title: string
  subtitle?: string
  isWorldComplete?: boolean
  isPeakComplete?: boolean
  citadelName?: string
  numeral?: string
  accent?: string
}

interface Props {
  reward: RewardPayload | null
  onDismiss: () => void
}

export default function XpRewardToast({ reward, onDismiss }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (reward) {
      setVisible(true)
      // Auto-dismiss standard toasts after 5 seconds if not peak complete
      if (!reward.isPeakComplete) {
        const timer = setTimeout(() => {
          setVisible(false)
          setTimeout(onDismiss, 300)
        }, 5000)
        return () => clearTimeout(timer)
      }
    } else {
      setVisible(false)
    }
  }, [reward, onDismiss])

  if (!reward || !visible) return null

  // Peak Victory Full-Screen Card
  if (reward.isPeakComplete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
        <GlassSurface className="relative w-full max-w-lg rounded-3xl border border-line p-8 text-center shadow-2xl">
          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              setVisible(false)
              setTimeout(onDismiss, 300)
            }}
            className="absolute top-4 right-4 rounded-full p-2 text-muted hover:text-chalk transition-colors"
          >
            <X size={20} />
          </button>

          {/* Animated Seal */}
          <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
            {/* Pulsing ring */}
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-25"
              style={{ backgroundColor: reward.accent || 'var(--accent)' }}
            />
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 text-4xl shadow-xl"
              style={{
                borderColor: reward.accent || 'var(--accent)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: reward.accent || 'var(--accent)',
              }}
            >
              🏔️
            </div>
          </div>

          <div className="text-2xs font-semibold tracking-widest uppercase text-muted mb-1">
            Citadel {reward.numeral} Conquered
          </div>
          <h2 className="text-2xl font-bold text-chalk mb-2">
            Seal of {reward.citadelName || 'the Citadel'} Unlocked!
          </h2>
          <p className="text-sm text-muted mb-6 leading-relaxed">
            Every route and proving ground in this mountain has been forged. You have claimed the Citadel Seal and etched your name on the summit register.
          </p>

          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-panel-2 px-5 py-2 mb-6">
            <span className="text-sm font-medium text-muted">Bonus Reward:</span>
            <span className="text-base font-bold text-accent">
              +<CountUp to={reward.xp} /> XP
            </span>
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                setVisible(false)
                setTimeout(onDismiss, 300)
              }}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Claim Seal & Return
            </button>
          </div>
        </GlassSurface>
      </div>
    )
  }

  // Floating Glass Toast for Lesson / World Solved
  return (
    <aside
      aria-label="Expedition Reward"
      className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <GlassSurface className="flex items-center gap-4 rounded-2xl border border-line/80 px-5 py-3.5 shadow-2xl backdrop-blur-xl">
        {/* Pulsing icon ring */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: reward.isWorldComplete ? 'var(--accent-glow)' : 'var(--accent)' }}
          />
          <div
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel"
            style={{ color: reward.isWorldComplete ? '#F2B866' : 'var(--accent)' }}
          >
            {reward.isWorldComplete ? (
              <Flag size={20} className="animate-bounce" />
            ) : (
              <Trophy size={20} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-chalk">{reward.title}</span>
            {reward.isWorldComplete && (
              <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                CAMP COMPLETED 🚩
              </span>
            )}
          </div>
          {reward.subtitle && <span className="text-2xs text-muted">{reward.subtitle}</span>}
          <div className="flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 size={12} className="text-accent" />
            <span className="text-xs font-bold text-accent">
              +<CountUp to={reward.xp} /> XP
            </span>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={() => {
            setVisible(false)
            setTimeout(onDismiss, 300)
          }}
          className="ml-2 rounded-lg p-1 text-muted hover:text-chalk transition-colors"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </GlassSurface>
    </aside>
  )
}

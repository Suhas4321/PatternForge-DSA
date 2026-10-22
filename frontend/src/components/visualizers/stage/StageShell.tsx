import { useState, useRef, useEffect } from 'react'
import type { TraceStep } from '../../../api/types'
import { ComplexityBadges } from './ComplexityBadges'
import { Counters } from './Counters'
import { CaptionBar } from './CaptionBar'
import { PlaybackDock } from './PlaybackDock'
import { StepLog } from './StepLog'

interface StageShellProps {
  title?: string
  description?: string
  timeComplexity?: string
  spaceComplexity?: string
  caption?: string
  why?: string | null
  kind?: string
  comparisons?: number
  swaps?: number
  writes?: number
  steps?: TraceStep[]
  currentIndex?: number
  onSeek?: (index: number) => void
  playing?: boolean
  onTogglePlay?: () => void
  onStepForward?: () => void
  onStepBackward?: () => void
  onJumpFirst?: () => void
  onJumpLast?: () => void
  speed?: number
  onSpeedChange?: (speed: number) => void
  children: React.ReactNode
}

export function StageShell({
  title = 'Algorithm Stage',
  description = 'Step-by-step state & memory transformation',
  timeComplexity,
  spaceComplexity,
  caption,
  why,
  kind = 'info',
  comparisons,
  swaps,
  writes,
  steps = [],
  currentIndex = 0,
  onSeek = () => {},
  playing = false,
  onTogglePlay = () => {},
  onStepForward = () => {},
  onStepBackward = () => {},
  onJumpFirst = () => {},
  onJumpLast = () => {},
  speed = 1,
  onSpeedChange = () => {},
  children,
}: StageShellProps) {
  const [stepLogOpen, setStepLogOpen] = useState(false)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [scaleFactor, setScaleFactor] = useState(1)

  // ResizeObserver to scale wide visualizer content on narrow mobile screens
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        if (width < 600) {
          setScaleFactor(Math.max(0.68, width / 620))
        } else {
          setScaleFactor(1)
        }
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="relative flex flex-col w-full max-w-full rounded-2xl border border-line-strong bg-panel-2/95 shadow-2xl overflow-hidden">
      {/* 1. Header Row */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-panel px-4 py-3">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan pf-beacon shrink-0" />
            <h3 className="font-plate text-sm sm:text-base font-bold tracking-tight text-chalk truncate">
              {title}
            </h3>
          </div>
          {description && (
            <p className="text-2xs text-muted truncate mt-0.5 font-sans pl-4">
              {description}
            </p>
          )}
        </div>

        {/* Complexity Badges */}
        <ComplexityBadges
          timeComplexity={timeComplexity}
          spaceComplexity={spaceComplexity}
        />
      </header>

      {/* 2. Counters Row */}
      {steps.length > 0 && (
        <div className="border-b border-line/60 bg-panel-2/60 px-4 py-1.5">
          <Counters
            comparisons={comparisons}
            swaps={swaps}
            writes={writes}
            currentStep={currentIndex}
            totalSteps={steps.length}
          />
        </div>
      )}

      {/* 3. Canvas Area: Height clamp(340px, 46vh, 560px), soft radial light, subtle grid */}
      <div
        ref={canvasRef}
        className="relative flex-1 min-h-[340px] max-h-[560px] h-[46vh] w-full overflow-x-hidden overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-void/90 via-panel-2/60 to-void/95"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 20%, color-mix(in srgb, var(--peak-accent, #6EE7B7) 6%, transparent), transparent 70%), linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 32px 32px, 32px 32px',
        }}
      >
        <div
          className="w-full h-full flex flex-col justify-center items-center transition-transform origin-top"
          style={{
            transform: scaleFactor < 1 ? `scale(${scaleFactor})` : undefined,
          }}
        >
          {children}
        </div>
      </div>

      {/* 4. Action Caption Bar directly under canvas */}
      <CaptionBar
        caption={caption || 'Ready to trace execution'}
        why={why}
        kind={kind}
      />

      {/* 5. Playback Transport Dock (Glass floating pill) */}
      {steps.length > 0 && (
        <PlaybackDock
          steps={steps}
          currentIndex={currentIndex}
          onSeek={onSeek}
          playing={playing}
          onTogglePlay={onTogglePlay}
          onStepForward={onStepForward}
          onStepBackward={onStepBackward}
          onJumpFirst={onJumpFirst}
          onJumpLast={onJumpLast}
          speed={speed}
          onSpeedChange={onSpeedChange}
          stepLogOpen={stepLogOpen}
          onToggleStepLog={() => setStepLogOpen((prev) => !prev)}
        />
      )}

      {/* 6. Step Log Drawer (Collapsible) */}
      <StepLog
        steps={steps}
        currentIndex={currentIndex}
        onSelectStep={onSeek}
        open={stepLogOpen}
        onClose={() => setStepLogOpen(false)}
      />
    </div>
  )
}

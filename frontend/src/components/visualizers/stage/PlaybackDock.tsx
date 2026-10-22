import { motion } from 'motion/react'
import type { TraceStep } from '../../../api/types'
import { Scrubber } from './Scrubber'
import { SPEEDS, type PlaybackSpeed } from './usePlayback'
import {
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ListIcon,
} from '../../vendor/lucide-animated'

interface PlaybackDockProps {
  steps: TraceStep[]
  currentIndex: number
  onSeek: (index: number) => void
  playing: boolean
  onTogglePlay: () => void
  onStepForward: () => void
  onStepBackward: () => void
  onJumpFirst: () => void
  onJumpLast: () => void
  speed: number
  onSpeedChange: (speed: number) => void
  stepLogOpen: boolean
  onToggleStepLog: () => void
}

export function PlaybackDock({
  steps,
  currentIndex,
  onSeek,
  playing,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onJumpFirst,
  onJumpLast,
  speed,
  onSpeedChange,
  stepLogOpen,
  onToggleStepLog,
}: PlaybackDockProps) {
  const lastIndex = Math.max(0, steps.length - 1)
  const isFirst = currentIndex <= 0
  const isLast = currentIndex >= lastIndex

  const btnClass =
    'flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-panel hover:text-chalk transition-all disabled:opacity-30 disabled:pointer-events-none'

  return (
    <div className="sticky bottom-2.5 z-20 mx-auto w-[96%] max-w-4xl rounded-2xl border border-line-strong bg-panel-2/90 backdrop-blur-md p-2 sm:p-2.5 shadow-2xl flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Left: Step Navigation & Play/Pause Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Jump First */}
          <button
            type="button"
            className={btnClass}
            onClick={onJumpFirst}
            disabled={isFirst}
            title="First Step (Home)"
            aria-label="First step"
          >
            <ChevronFirstIcon size={16} />
          </button>

          {/* Step Back */}
          <button
            type="button"
            className={btnClass}
            onClick={onStepBackward}
            disabled={isFirst}
            title="Previous Step (Left Arrow)"
            aria-label="Previous step"
          >
            <ChevronLeftIcon size={16} />
          </button>

          {/* 56px Big Circular Play/Pause Button with Pulse Ring */}
          <div className="relative mx-1">
            {playing && (
              <span className="absolute -inset-1 rounded-full bg-amber/30 animate-ping pointer-events-none" />
            )}
            <button
              type="button"
              onClick={onTogglePlay}
              className={`relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full font-mono text-xs font-bold transition-all shadow-lg select-none ${
                playing
                  ? 'bg-amber text-void shadow-[0_0_20px_rgba(242,184,102,0.5)] scale-95'
                  : 'bg-emerald text-void hover:bg-emerald/90 shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-105'
              }`}
              title={playing ? 'Pause (Space)' : 'Play (Space)'}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <PauseIcon size={18} /> : <PlayIcon size={18} className="ml-0.5" />}
            </button>
          </div>

          {/* Step Forward */}
          <button
            type="button"
            className={btnClass}
            onClick={onStepForward}
            disabled={isLast}
            title="Next Step (Right Arrow)"
            aria-label="Next step"
          >
            <ChevronRightIcon size={16} />
          </button>

          {/* Jump Last */}
          <button
            type="button"
            className={btnClass}
            onClick={onJumpLast}
            disabled={isLast}
            title="Last Step (End)"
            aria-label="Last step"
          >
            <ChevronLastIcon size={16} />
          </button>
        </div>

        {/* Center: Timeline Scrubber */}
        <div className="flex-1 min-w-[140px] px-1">
          <Scrubber steps={steps} currentIndex={currentIndex} onSeek={onSeek} />
        </div>

        {/* Right: Speed Segmented Control & Step Log Toggle */}
        <div className="flex items-center gap-2">
          {/* Speed Pills with sliding highlight layoutId */}
          <div className="flex items-center rounded-xl border border-line bg-panel p-0.5 font-mono text-2xs">
            {SPEEDS.map((s: PlaybackSpeed) => {
              const active = speed === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSpeedChange(s)}
                  className={`relative px-2 py-0.5 rounded-lg text-caption font-semibold transition-colors ${
                    active ? 'text-void font-bold' : 'text-muted hover:text-chalk'
                  }`}
                  title={`Speed ${s}x ([ and ] to cycle)`}
                >
                  {active && (
                    <motion.div
                      layoutId="speed-pill-highlight"
                      className="absolute inset-0 rounded-lg bg-cyan shadow-xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{s}×</span>
                </button>
              )
            })}
          </div>

          {/* Step Log Toggle */}
          <button
            type="button"
            onClick={onToggleStepLog}
            className={`flex items-center gap-1 h-8 px-2.5 rounded-xl border font-mono text-2xs transition-colors ${
              stepLogOpen
                ? 'bg-cyan/20 border-cyan/50 text-cyan font-bold'
                : 'border-line bg-panel text-muted hover:text-chalk'
            }`}
            title="Toggle Step Log (L)"
            aria-label="Toggle step log"
          >
            <ListIcon size={14} />
            <span className="hidden md:inline">Log</span>
          </button>
        </div>
      </div>
    </div>
  )
}

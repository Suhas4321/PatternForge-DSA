import { useEffect, useCallback } from 'react'
import type { Trace } from '../../../api/types'
import { getMinStepDuration } from '../../../lib/motion'

export const SPEEDS = [0.5, 1, 2, 4] as const
export type PlaybackSpeed = (typeof SPEEDS)[number]

interface UsePlaybackProps {
  trace: Trace | null
  index: number
  onIndex: (i: number) => void
  playing: boolean
  onPlaying: (p: boolean) => void
  speed: number
  onSpeed: (s: number) => void
  onToggleStepLog?: () => void
}

export function usePlayback({
  trace,
  index,
  onIndex,
  playing,
  onPlaying,
  speed,
  onSpeed,
  onToggleStepLog,
}: UsePlaybackProps) {
  const steps = trace?.steps ?? []
  const lastIndex = Math.max(0, steps.length - 1)

  const stepForward = useCallback(() => {
    onIndex(Math.min(lastIndex, index + 1))
  }, [index, lastIndex, onIndex])

  const stepBackward = useCallback(() => {
    onIndex(Math.max(0, index - 1))
  }, [index, onIndex])

  const jumpFirst = useCallback(() => {
    onIndex(0)
  }, [onIndex])

  const jumpLast = useCallback(() => {
    onIndex(lastIndex)
  }, [lastIndex, onIndex])

  const togglePlay = useCallback(() => {
    if (index >= lastIndex && !playing) {
      onIndex(0)
    }
    onPlaying(!playing)
  }, [index, lastIndex, onIndex, onPlaying, playing])

  const setSpeedCycle = useCallback(
    (direction: 'up' | 'down') => {
      const curIdx = SPEEDS.indexOf(speed as PlaybackSpeed)
      if (curIdx === -1) {
        onSpeed(1)
        return
      }
      if (direction === 'up' && curIdx < SPEEDS.length - 1) {
        onSpeed(SPEEDS[curIdx + 1])
      } else if (direction === 'down' && curIdx > 0) {
        onSpeed(SPEEDS[curIdx - 1])
      }
    },
    [speed, onSpeed]
  )

  // Timer-driven auto-stepping with safe minimum step duration
  useEffect(() => {
    if (!playing || steps.length === 0) return
    if (index >= lastIndex) {
      onPlaying(false)
      return
    }
    const delay = getMinStepDuration(speed)
    const timer = setTimeout(() => {
      onIndex(index + 1)
    }, delay)

    return () => clearTimeout(timer)
  }, [playing, index, lastIndex, speed, onIndex, onPlaying, steps.length])

  // Global keyboard shortcuts (when not focused on code editor or text input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target?.closest('.monaco-editor, input, textarea, select, [contenteditable="true"]')
      ) {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          e.preventDefault()
          stepForward()
          break
        case 'ArrowLeft':
          e.preventDefault()
          stepBackward()
          break
        case 'Home':
          e.preventDefault()
          jumpFirst()
          break
        case 'End':
          e.preventDefault()
          jumpLast()
          break
        case ']':
          e.preventDefault()
          setSpeedCycle('up')
          break
        case '[':
          e.preventDefault()
          setSpeedCycle('down')
          break
        case 'l':
        case 'L':
          e.preventDefault()
          onToggleStepLog?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    togglePlay,
    stepForward,
    stepBackward,
    jumpFirst,
    jumpLast,
    setSpeedCycle,
    onToggleStepLog,
  ])

  return {
    steps,
    lastIndex,
    stepForward,
    stepBackward,
    jumpFirst,
    jumpLast,
    togglePlay,
    setSpeedCycle,
  }
}

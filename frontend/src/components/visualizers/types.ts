import type { TraceStep, VisualizerKind, VizConfig } from '../../api/types'

/** Props every individual visualizer receives. */
export interface VisualizerProps {
  step: TraceStep
  prev?: TraceStep
  /** The whole trace, for layouts that must stay stable across steps. */
  steps: TraceStep[]
  index: number
  config: VizConfig
  /** Source code being traced (lets the DP view work out which cells a line reads). */
  code: string
  /** Precomputed semantic narration for current step */
  narration?: import('../../lib/narrator/types.ts').NarratorResult
  /** Backend line_info map */
  lineInfo?: Record<string, { text: string; kinds: string[]; subscripts: string[] }>
}

/** Props VisualizerHost receives from StageArena or StageConcept. */
export interface VisualizerHostProps extends VisualizerProps {
  kind: VisualizerKind
  title?: string
  description?: string
  timeComplexity?: string
  spaceComplexity?: string
  caption?: string
  why?: string | null
  comparisons?: number
  swaps?: number
  writes?: number
  playing?: boolean
  onTogglePlay?: () => void
  onStepForward?: () => void
  onStepBackward?: () => void
  onJumpFirst?: () => void
  onJumpLast?: () => void
  onSeek?: (index: number) => void
  speed?: number
  onSpeedChange?: (speed: number) => void
}

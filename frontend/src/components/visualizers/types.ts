import type { TraceStep, VizConfig } from '../../api/types'

/** Props every visualizer receives. */
export interface VisualizerProps {
  step: TraceStep
  prev?: TraceStep
  /** The whole trace, for layouts that must stay stable across steps. */
  steps: TraceStep[]
  index: number
  config: VizConfig
  /** Source code being traced (lets the DP view work out which cells a line reads). */
  code: string
}

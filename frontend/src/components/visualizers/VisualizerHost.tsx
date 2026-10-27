import ArrayPointerVisualizer from './ArrayPointerVisualizer'
import ConcurrencyTimelineVisualizer from './ConcurrencyTimelineVisualizer'
import DataFramePipelineVisualizer from './DataFramePipelineVisualizer'
import DPTableVisualizer from './DPTableVisualizer'
import GraphGridVisualizer from './GraphGridVisualizer'
import HTTPPacketLifecycleVisualizer from './HTTPPacketLifecycleVisualizer'
import LinkedListVisualizer from './LinkedListVisualizer'
import SQLPipelineVisualizer from './SQLPipelineVisualizer'
import StackQueueVisualizer from './StackQueueVisualizer'
import SystemBlueprintVisualizer from './SystemBlueprintVisualizer'
import TreeRecursionVisualizer from './TreeRecursionVisualizer'
import type { VisualizerHostProps } from './types'
import { StageShell } from './stage/StageShell'
import { formatValue } from '../../lib/trace'
import ErrorBoundary from '../ErrorBoundary'

/**
 * Universal host routing across all 11 system & algorithm visualizers,
 * wrapping every archetype inside the shared, responsive StageShell.
 */
export default function VisualizerHost({
  kind,
  title,
  description,
  timeComplexity,
  spaceComplexity,
  caption,
  why,
  comparisons,
  swaps,
  writes,
  playing,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onJumpFirst,
  onJumpLast,
  onSeek,
  speed,
  onSpeedChange,
  ...visualizerProps
}: VisualizerHostProps) {
  const step = visualizerProps.step

  const renderVisualizer = () => {
    switch (kind) {
      case 'sql_pipeline':
        return <SQLPipelineVisualizer {...visualizerProps} />
      case 'dataframe_pipeline':
        return <DataFramePipelineVisualizer {...visualizerProps} />
      case 'concurrency_timeline':
        return <ConcurrencyTimelineVisualizer {...visualizerProps} />
      case 'http_lifecycle':
        return <HTTPPacketLifecycleVisualizer {...visualizerProps} />
      case 'system_blueprint':
        return <SystemBlueprintVisualizer {...visualizerProps} />
      case 'stack_queue':
        return <StackQueueVisualizer {...visualizerProps} />
      case 'linked_list':
        return <LinkedListVisualizer {...visualizerProps} />
      case 'tree_recursion':
        return <TreeRecursionVisualizer {...visualizerProps} />
      case 'graph_grid':
        return <GraphGridVisualizer {...visualizerProps} />
      case 'dp_table':
        return <DPTableVisualizer {...visualizerProps} />
      case 'array_pointer':
      default:
        return <ArrayPointerVisualizer {...visualizerProps} />
    }
  }

  // Derive default action caption from trace event if no semantic caption is passed
  const activeCaption = caption || (() => {
    if (!step) return 'Ready to trace'
    if (step.event === 'call') return `call ${step.func}()`
    if (step.event === 'return')
      return `${step.func}() → ${formatValue(step.return_value, step.return_heap)}`
    if (step.event === 'exception') return `exception: ${step.exception}`
    return `line ${step.line} in ${step.func}()`
  })()

  return (
    <StageShell
      title={title || `${kind.replace(/_/g, ' ').toUpperCase()}`}
      description={description}
      timeComplexity={timeComplexity}
      spaceComplexity={spaceComplexity}
      caption={activeCaption}
      why={why}
      comparisons={comparisons}
      swaps={swaps}
      writes={writes}
      kind={step?.event || 'info'}
      steps={visualizerProps.steps}
      currentIndex={visualizerProps.index}
      onSeek={onSeek}
      playing={playing}
      onTogglePlay={onTogglePlay}
      onStepForward={onStepForward}
      onStepBackward={onStepBackward}
      onJumpFirst={onJumpFirst}
      onJumpLast={onJumpLast}
      speed={speed}
      onSpeedChange={onSpeedChange}
    >
      <ErrorBoundary fallbackTitle="Visualizer failed to render this step">
        {renderVisualizer()}
      </ErrorBoundary>
    </StageShell>
  )
}

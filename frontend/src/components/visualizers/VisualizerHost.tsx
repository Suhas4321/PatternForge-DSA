import type { VisualizerKind } from '../../api/types'
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
import type { VisualizerProps } from './types'

/** Picks the visual archetype for a question across all 11 system & algorithm visualizers, ensuring responsive scaling without overflow or clipping. */
export default function VisualizerHost({ kind, ...props }: VisualizerProps & { kind: VisualizerKind }) {
  const renderVisualizer = () => {
    switch (kind) {
      case 'sql_pipeline':
        return <SQLPipelineVisualizer {...props} />
      case 'dataframe_pipeline':
        return <DataFramePipelineVisualizer {...props} />
      case 'concurrency_timeline':
        return <ConcurrencyTimelineVisualizer {...props} />
      case 'http_lifecycle':
        return <HTTPPacketLifecycleVisualizer {...props} />
      case 'system_blueprint':
        return <SystemBlueprintVisualizer {...props} />
      case 'stack_queue':
        return <StackQueueVisualizer {...props} />
      case 'linked_list':
        return <LinkedListVisualizer {...props} />
      case 'tree_recursion':
        return <TreeRecursionVisualizer {...props} />
      case 'graph_grid':
        return <GraphGridVisualizer {...props} />
      case 'dp_table':
        return <DPTableVisualizer {...props} />
      case 'array_pointer':
      default:
        return <ArrayPointerVisualizer {...props} />
    }
  }

  return (
    <div className="w-full max-w-full overflow-x-auto overflow-y-visible py-1 no-scrollbar">
      <div className="min-w-fit w-full flex flex-col justify-center">
        {renderVisualizer()}
      </div>
    </div>
  )
}

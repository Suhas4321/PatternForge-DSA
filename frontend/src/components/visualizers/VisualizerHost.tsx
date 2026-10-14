import type { VisualizerKind } from '../../api/types'
import ArrayPointerVisualizer from './ArrayPointerVisualizer'
import DPTableVisualizer from './DPTableVisualizer'
import GraphGridVisualizer from './GraphGridVisualizer'
import LinkedListVisualizer from './LinkedListVisualizer'
import StackQueueVisualizer from './StackQueueVisualizer'
import TreeRecursionVisualizer from './TreeRecursionVisualizer'
import type { VisualizerProps } from './types'

/** Picks the visual archetype for a question (the six data-driven visualizers). */
export default function VisualizerHost({ kind, ...props }: VisualizerProps & { kind: VisualizerKind }) {
  switch (kind) {
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

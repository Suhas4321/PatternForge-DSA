import type { TraceStep, VizConfig } from '../../api/types.ts'
import { narrateArray } from './array.ts'
import { narrateStackQueue } from './stack_queue.ts'
import { narrateLinkedList } from './linked_list.ts'
import { narrateTreeRecursion } from './tree_recursion.ts'
import { narrateGraphGrid } from './graph_grid.ts'
import { narrateDPTable } from './dp_table.ts'
import type { NarratorContext, NarratorCounters, NarratorResult } from './types.ts'

export * from './types.ts'
export * from './array.ts'
export * from './stack_queue.ts'
export * from './linked_list.ts'
export * from './tree_recursion.ts'
export * from './graph_grid.ts'
export * from './dp_table.ts'

/**
 * Precomputes semantic narration for all steps in a trace in an O(N) pass.
 * Routes through the specialized narrator for the given visualizer kind
 * (stack_queue, linked_list, tree_recursion, graph_grid, dp_table, or array_pointer).
 */
export function precomputeTraceNarration(
  steps: TraceStep[],
  lineInfo?: Record<string, { text: string; kinds: string[]; subscripts: string[] }>,
  config?: VizConfig,
  kind?: string,
): NarratorResult[] {
  if (!steps || steps.length === 0) return []

  const results: NarratorResult[] = []
  let counters: NarratorCounters = { comparisons: 0, swaps: 0, writes: 0 }

  for (let i = 0; i < steps.length; i++) {
    const cur = steps[i]
    const prev = i > 0 ? steps[i - 1] : null
    const ctx: NarratorContext = {
      config,
      lineInfo,
      allSteps: steps,
      stepIndex: i,
    }

    let res: NarratorResult
    switch (kind) {
      case 'stack_queue':
        res = narrateStackQueue(cur, prev, ctx, counters)
        break
      case 'linked_list':
        res = narrateLinkedList(cur, prev, ctx, counters)
        break
      case 'tree_recursion':
        res = narrateTreeRecursion(cur, prev, ctx, counters)
        break
      case 'graph_grid':
        res = narrateGraphGrid(cur, prev, ctx, counters)
        break
      case 'dp_table':
        res = narrateDPTable(cur, prev, ctx, counters)
        break
      case 'array_pointer':
      default:
        // If no kind specified, check if another family fits better, or fall back to array
        if (config?.stacks || config?.queues) {
          res = narrateStackQueue(cur, prev, ctx, counters)
        } else if (config?.table) {
          res = narrateDPTable(cur, prev, ctx, counters)
        } else if (config?.grid || config?.graph) {
          res = narrateGraphGrid(cur, prev, ctx, counters)
        } else {
          res = narrateArray(cur, prev, ctx, counters)
        }
        break
    }

    counters = { ...res.counters }
    results.push(res)
  }

  return results
}

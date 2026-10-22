import type { TraceStep, VizConfig } from '../../api/types'

export type NarratorKind =
  | 'compare'
  | 'swap'
  | 'write'
  | 'read'
  | 'push'
  | 'pop'
  | 'enqueue'
  | 'dequeue'
  | 'call'
  | 'return'
  | 'visit'
  | 'found'
  | 'done'
  | 'init'
  | 'info'

export interface ElementHighlight {
  target: string // Identifier, e.g. "nums[2]"
  role: 'compare' | 'swap' | 'write' | 'read' | 'target' | 'done'
}

export interface StepMove {
  id: string // Stable element ID, e.g. "item-2"
  from: number // Origin index
  to: number // Destination index
}

export interface NarratorCounters {
  comparisons: number
  swaps: number
  writes: number
}

export interface NarratorResult {
  kind: NarratorKind
  caption: string // Short action title: "swap a[5], a[6]"
  why: string // Semantic rationale: "42 > 17, so elements are out of order"
  highlights: ElementHighlight[]
  counters: NarratorCounters
  moves?: StepMove[]
  comparedValues?: [unknown, unknown]
  comparedIndices?: [number, number]
  comparisonOp?: string
  sortedIndices?: number[]
  activePointers?: Record<string, number>
  activeRange?: [number, number]
  arrayName?: string
  formula?: string
  traversal?: string[]
  activeNodes?: string[]
  rewiredEdge?: { from: string; to: string | null }
  readCells?: (number | string)[]
  writeCell?: number | string
  stackOperation?: { type: 'push' | 'pop'; item: unknown; depth: number }
  queueOperation?: { type: 'enqueue' | 'dequeue'; item: unknown; length: number }
}

export interface NarratorContext {
  config?: VizConfig
  lineInfo?: Record<string, { text: string; kinds: string[]; subscripts: string[] }>
  allSteps?: TraceStep[]
  stepIndex: number
}

export function resolveLineNote(
  note: string | { caption?: string; why?: string } | undefined,
): { caption?: string; why?: string } | undefined {
  if (!note) return undefined
  if (typeof note === 'string') return { why: note }
  return note
}

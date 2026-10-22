import type { TraceStep } from '../../api/types.ts'
import type {
  ElementHighlight,
  NarratorContext,
  NarratorCounters,
  NarratorResult,
} from './types.ts'
import { resolveLineNote } from './types.ts'

function isTuple(v: unknown): v is { $tuple: unknown[] } {
  return typeof v === 'object' && v !== null && '$tuple' in v
}

function extractTuple(v: unknown): unknown[] | null {
  if (isTuple(v)) return v.$tuple
  if (Array.isArray(v)) return v
  return null
}

export function narrateGraphGrid(
  step: TraceStep,
  prev: TraceStep | null,
  ctx: NarratorContext,
  prevCounters: NarratorCounters = { comparisons: 0, swaps: 0, writes: 0 },
): NarratorResult {
  const counters: NarratorCounters = { ...prevCounters }

  const curFrame = step.frames[step.frames.length - 1]
  const prevFrame = prev?.frames[prev.frames.length - 1]
  const curLocals = curFrame?.locals || {}
  const prevLocals = prevFrame?.locals || {}

  const curLine = step.line
  const lineInfo = ctx.lineInfo?.[String(curLine)]
  const curated = resolveLineNote(ctx.config?.line_notes?.[curLine] ?? ctx.config?.line_notes?.[String(curLine)])

  const highlights: ElementHighlight[] = []

  // Check return / completion
  if (step.event === 'return') {
    return {
      kind: 'return',
      caption: `return ${JSON.stringify(step.return_value)}`,
      why: curated?.why || 'Graph/grid traversal completed.',
      highlights,
      counters,
    }
  }

  // 1. Detect Grid Cell Modification (e.g. grid[r][c] = "0" or "X")
  const lineText = lineInfo?.text || ''
  if (lineText.includes('grid[') && lineText.includes('=') && !lineText.includes('==')) {
    counters.writes++
    const r = curLocals.r ?? curLocals.row ?? curLocals.i
    const c = curLocals.c ?? curLocals.col ?? curLocals.j
    const cellCoords = r !== undefined && c !== undefined ? `(${r}, ${c})` : 'cell'
    return {
      kind: 'write',
      caption: curated?.caption || `mark cell ${cellCoords}`,
      why: curated?.why || `Updated cell ${cellCoords} to prevent revisit or record state.`,
      highlights: [{ target: `cell-${r}-${c}`, role: 'write' }],
      counters,
      writeCell: `${r},${c}`,
    }
  }

  // 2. Detect Dequeue / Visit
  const queueName = Object.keys(curLocals).find((k) => /queue|^q$|^dq$/i.test(k))
  if (queueName) {
    const curQ = ((curLocals[queueName] as any)?.$deque || curLocals[queueName]) as unknown[] | undefined
    const prevQ = ((prevLocals[queueName] as any)?.$deque || prevLocals[queueName]) as unknown[] | undefined

    if (curQ && prevQ && curQ.length < prevQ.length) {
      counters.writes++
      const popped = prevQ[0]
      const tup = extractTuple(popped)
      const coordStr = tup ? `(${tup.join(', ')})` : JSON.stringify(popped)

      return {
        kind: 'dequeue',
        caption: curated?.caption || `visit ${coordStr} from queue`,
        why: curated?.why || `Dequeued ${coordStr} to explore its unvisited neighbors.`,
        highlights: [{ target: `node-${coordStr}`, role: 'target' }],
        counters,
      }
    }

    if (curQ && prevQ && curQ.length > prevQ.length) {
      counters.writes++
      const added = curQ[curQ.length - 1]
      const tup = extractTuple(added)
      const coordStr = tup ? `(${tup.join(', ')})` : JSON.stringify(added)

      return {
        kind: 'enqueue',
        caption: curated?.caption || `enqueue neighbor ${coordStr}`,
        why: curated?.why || `Found unvisited neighbor ${coordStr}, added to BFS frontier wave.`,
        highlights: [{ target: `node-${coordStr}`, role: 'read' }],
        counters,
      }
    }
  }

  // 3. Detect Visiting a node/cell
  const r = curLocals.r ?? curLocals.row ?? curLocals.i
  const c = curLocals.c ?? curLocals.col ?? curLocals.j
  const node = curLocals.node ?? curLocals.u ?? curLocals.curr
  if (r !== undefined && c !== undefined) {
    return {
      kind: 'visit',
      caption: curated?.caption || `visit (${r}, ${c})`,
      why: curated?.why || `Examining cell (${r}, ${c}) and checking boundary/island conditions.`,
      highlights: [{ target: `cell-${r}-${c}`, role: 'target' }],
      counters,
    }
  } else if (node !== undefined) {
    return {
      kind: 'visit',
      caption: curated?.caption || `visit node ${JSON.stringify(node)}`,
      why: curated?.why || `Exploring neighbors of node ${JSON.stringify(node)}.`,
      highlights: [{ target: `node-${node}`, role: 'target' }],
      counters,
    }
  }

  // Default step
  const caption = curated?.caption || (lineInfo?.text ? lineInfo.text.trim() : `line ${curLine} in ${step.func}()`)
  const why = curated?.why || 'Advancing graph traversal.'

  return {
    kind: 'info',
    caption,
    why,
    highlights,
    counters,
  }
}

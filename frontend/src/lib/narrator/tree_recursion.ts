import type { HeapObject, TraceStep } from '../../api/types.ts'
import type {
  ElementHighlight,
  NarratorContext,
  NarratorCounters,
  NarratorResult,
} from './types.ts'
import { resolveLineNote } from './types.ts'

function isRef(v: unknown): v is { $ref: number | string } {
  return typeof v === 'object' && v !== null && '$ref' in v
}

function refId(v: unknown): string | null {
  return isRef(v) ? String(v.$ref) : null
}

function isTreeNode(o: HeapObject | undefined) {
  return !!o && 'left' in o.fields && 'right' in o.fields
}

function formatArg(v: unknown, heap: Record<string, HeapObject>): string {
  if (isRef(v)) {
    const o = heap[String(v.$ref)]
    if (o && 'val' in o.fields) return `Node(${o.fields.val})`
    return `Node(${v.$ref})`
  }
  if (v === null) return 'None'
  if (typeof v === 'object' && v && '$tuple' in v) {
    return `(${(v.$tuple as unknown[]).map((x) => formatArg(x, heap)).join(', ')})`
  }
  return JSON.stringify(v)
}

export function narrateTreeRecursion(
  step: TraceStep,
  prev: TraceStep | null,
  ctx: NarratorContext,
  prevCounters: NarratorCounters = { comparisons: 0, swaps: 0, writes: 0 },
): NarratorResult {
  const counters: NarratorCounters = { ...prevCounters }
  const curHeap = step.heap || {}
  const prevHeap = prev?.heap || {}

  const curLine = step.line
  const lineInfo = ctx.lineInfo?.[String(curLine)]
  const curated = resolveLineNote(ctx.config?.line_notes?.[curLine] ?? ctx.config?.line_notes?.[String(curLine)])

  const highlights: ElementHighlight[] = []

  // Extract call stack frames
  const innerFrame = step.frames[step.frames.length - 1]
  const argsStr = innerFrame
    ? Object.entries(innerFrame.locals)
        .filter(([k]) => k !== 'self' && (!step.params || step.params.includes(k)))
        .map(([k, v]) => `${k}=${formatArg(v, curHeap)}`)
        .join(', ')
    : ''

  // 1. Check Heap Operations (if a heap array exists)
  const locals = (innerFrame?.locals || {}) as Record<string, any>
  const heapNames = Object.keys(locals).filter(
    (n) => /heap|^pq$|^h$/i.test(n) && Array.isArray(locals[n])
  )
  if (heapNames.length > 0) {
    const hName = heapNames[0]
    const curH = (locals[hName] as unknown[]) || []
    const prevH = prev?.frames?.[prev.frames.length - 1]?.locals?.[hName] as unknown[] | undefined

    if (prevH && curH.length !== prevH.length) {
      counters.writes++
      if (curH.length > prevH.length) {
        const item = curH[curH.length - 1]
        return {
          kind: 'push',
          caption: curated?.caption || `heappush ${JSON.stringify(item)} (size ${curH.length})`,
          why: curated?.why || 'Push new element and sift-up to preserve min-heap invariant.',
          highlights: [{ target: `${hName}[${curH.length - 1}]`, role: 'write' }],
          counters,
        }
      } else {
        const popped = prevH[0]
        return {
          kind: 'pop',
          caption: curated?.caption || `heappop root ${JSON.stringify(popped)} (new size ${curH.length})`,
          why: curated?.why || 'Extracted root minimum element; sift-down replaces root.',
          highlights: [{ target: `${hName}[0]`, role: 'swap' }],
          counters,
        }
      }
    }
  }

  // 2. Check Tree Child Swaps (e.g. Invert Binary Tree: root.left, root.right = root.right, root.left)
  for (const [id, curObj] of Object.entries(curHeap)) {
    const prevObj = prevHeap[id]
    if (isTreeNode(curObj) && isTreeNode(prevObj)) {
      const curL = refId(curObj.fields.left)
      const curR = refId(curObj.fields.right)
      const prevL = refId(prevObj.fields.left)
      const prevR = refId(prevObj.fields.right)
      if (curL === prevR && curR === prevL && curL !== prevL) {
        counters.swaps++
        highlights.push({ target: `node-${id}`, role: 'swap' })
        return {
          kind: 'swap',
          caption: curated?.caption || `swap left ↔ right of Node(${curObj.fields.val})`,
          why: curated?.why || 'Swapped left and right child pointers to invert tree at this node.',
          highlights,
          counters,
        }
      }
    }
  }

  // 3. Call Event
  if (step.event === 'call') {
    counters.writes++
    return {
      kind: 'call',
      caption: curated?.caption || `call ${step.func}(${argsStr})`,
      why: curated?.why || `Recursing into ${step.func} with frame depth ${step.frames.length}.`,
      highlights,
      counters,
    }
  }

  // 4. Return Event
  if (step.event === 'return') {
    const retVal = formatArg(step.return_value, curHeap)
    return {
      kind: 'return',
      caption: curated?.caption || `${step.func}() → ${retVal}`,
      why: curated?.why || `Returned ${retVal} back to calling frame.`,
      highlights,
      counters,
    }
  }

  // 5. Line check: base case or comparison
  const lineText = lineInfo?.text || ''
  if (lineText.includes('if not root') || lineText.includes('if root is None') || lineText.includes('if not node')) {
    const isNull = !innerFrame?.locals.root && !innerFrame?.locals.node
    return {
      kind: 'info',
      caption: curated?.caption || `base case: ${isNull ? 'null node (return 0 / None)' : 'valid node'}`,
      why: curated?.why || (isNull ? 'Hit null boundary; terminate recursion and backtrack.' : 'Node exists; continue traversing.'),
      highlights,
      counters,
    }
  }

  if (lineInfo?.kinds?.includes('compare')) {
    counters.comparisons++
    return {
      kind: 'compare',
      caption: curated?.caption || lineText.trim(),
      why: curated?.why || 'Evaluating recursive branching condition.',
      highlights,
      counters,
    }
  }

  // Default step
  const caption = curated?.caption || (lineInfo?.text ? lineInfo.text.trim() : `line ${curLine} in ${step.func}()`)
  const why = curated?.why || `Executing tree traversal at depth ${step.depth}.`

  return {
    kind: 'info',
    caption,
    why,
    highlights,
    counters,
  }
}

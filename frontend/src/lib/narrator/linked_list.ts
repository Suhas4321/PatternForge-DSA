import type { TraceStep } from '../../api/types.ts'
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

export function narrateLinkedList(
  step: TraceStep,
  prev: TraceStep | null,
  ctx: NarratorContext,
  prevCounters: NarratorCounters = { comparisons: 0, swaps: 0, writes: 0 },
): NarratorResult {
  const counters: NarratorCounters = { ...prevCounters }
  const curHeap = step.heap || {}
  const prevHeap = prev?.heap || {}

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
    const retRef = refId(step.return_value)
    const retLabel = retRef && curHeap[retRef] ? `Node(${curHeap[retRef].fields.val})` : String(step.return_value)
    return {
      kind: 'return',
      caption: `return ${retLabel}`,
      why: curated?.why || 'Completed list traversal / transformation.',
      highlights,
      counters,
    }
  }

  // 1. Detect Rewired Edges (curr.next changed)
  for (const [id, curObj] of Object.entries(curHeap)) {
    const prevObj = prevHeap[id]
    if (prevObj && 'next' in curObj.fields && 'next' in prevObj.fields) {
      const curNext = refId(curObj.fields.next)
      const prevNext = refId(prevObj.fields.next)
      if (curNext !== prevNext) {
        counters.writes++
        const fromVal = curObj.fields.val !== undefined ? curObj.fields.val : id
        const toVal = curNext && curHeap[curNext] ? curHeap[curNext].fields.val : 'None'

        // Determine variable names pointing to from and to
        const fromVar = Object.keys(curLocals).find((k) => refId(curLocals[k]) === id) || `node(${fromVal})`
        const toVar = curNext ? (Object.keys(curLocals).find((k) => refId(curLocals[k]) === curNext) || `node(${toVal})`) : 'None'

        const caption = curated?.caption || `${fromVar}.next = ${toVar}`
        const why = curated?.why || `Rewired node (${fromVal}) pointer to target (${toVal}).`

        highlights.push({ target: `node-${id}`, role: 'swap' })
        if (curNext) highlights.push({ target: `node-${curNext}`, role: 'target' })

        return {
          kind: 'swap',
          caption,
          why,
          highlights,
          counters,
          rewiredEdge: { from: id, to: curNext },
        }
      }
    }
  }

  // 2. Detect Comparison (e.g. l1.val < l2.val)
  const lineText = lineInfo?.text || ''
  if (lineInfo?.kinds?.includes('compare') || lineText.includes('.val <') || lineText.includes('.val >') || lineText.includes('.val <=')) {
    counters.comparisons++
    highlights.push({ target: 'compare', role: 'compare' })

    const caption = curated?.caption || (lineText.trim() || 'compare node values')
    const why = curated?.why || 'Comparing node values to determine traversal or merge order.'

    return {
      kind: 'compare',
      caption,
      why,
      highlights,
      counters,
    }
  }

  // 3. Detect Pointer Advance (curr = curr.next, prev = curr)
  for (const [k, curV] of Object.entries(curLocals)) {
    const prevV = prevLocals[k]
    const curRef = refId(curV)
    const prevRef = refId(prevV)
    if (curRef !== prevRef && (k === 'curr' || k === 'prev' || k === 'slow' || k === 'fast' || k === 'head' || k === 'node')) {
      const targetVal = curRef && curHeap[curRef] ? curHeap[curRef].fields.val : 'None'
      const caption = curated?.caption || (lineText.trim() || `${k} = ${k}.next`)
      const why = curated?.why || `Advanced ${k} pointer forward to ${targetVal !== 'None' ? `node with value ${targetVal}` : 'None'}.`

      if (curRef) highlights.push({ target: `node-${curRef}`, role: 'target' })

      return {
        kind: 'write',
        caption,
        why,
        highlights,
        counters,
      }
    }
  }

  // Default step
  const caption = curated?.caption || (lineInfo?.text ? lineInfo.text.trim() : `line ${curLine} in ${step.func}()`)
  const why = curated?.why || 'Executing linked list step.'

  return {
    kind: 'info',
    caption,
    why,
    highlights,
    counters,
  }
}

import type { TraceStep, TraceValue } from '../../api/types.ts'
import {
  resolveLineNote,
  type ElementHighlight,
  type NarratorContext,
  type NarratorCounters,
  type NarratorResult,
  type StepMove,
} from './types.ts'

function extractRawValue(tv: TraceValue | undefined): unknown {
  if (tv === undefined) return undefined
  if (tv === null || typeof tv === 'number' || typeof tv === 'string' || typeof tv === 'boolean') {
    return tv
  }
  if (Array.isArray(tv)) {
    return tv.map(extractRawValue)
  }
  if (typeof tv === 'object') {
    if ('$repr' in tv) return tv.$repr
    if ('$inf' in tv) return tv.$inf > 0 ? Infinity : -Infinity
    if ('$nan' in tv) return NaN
    if ('$tuple' in tv) return (tv.$tuple as TraceValue[]).map(extractRawValue)
  }
  return String(tv)
}

function getLocals(step: TraceStep | null): Record<string, unknown> {
  if (!step || !step.frames || step.frames.length === 0) return {}
  const rawLocals = step.frames[step.frames.length - 1].locals
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rawLocals)) {
    result[k] = extractRawValue(v)
  }
  return result
}

const COMMON_ARRAY_NAMES = ['nums', 'arr', 'height', 'numbers', 'candidates', 'intervals', 'elements']
const COMMON_POINTER_NAMES = ['i', 'j', 'k', 'l', 'r', 'left', 'right', 'low', 'high', 'mid', 'start', 'end', 'curr', 'prev']

export function narrateArray(
  step: TraceStep,
  prev: TraceStep | null,
  ctx: NarratorContext,
  prevCounters: NarratorCounters = { comparisons: 0, swaps: 0, writes: 0 },
): NarratorResult {
  const counters: NarratorCounters = { ...prevCounters }
  const curLocals = getLocals(step)
  const prevLocals = getLocals(prev)

  // Find array name and contents
  let arrayName = ctx.config?.arrays?.[0]
  if (!arrayName || !Array.isArray(curLocals[arrayName])) {
    for (const cand of COMMON_ARRAY_NAMES) {
      if (Array.isArray(curLocals[cand])) {
        arrayName = cand
        break
      }
    }
  }
  if (!arrayName) {
    for (const [k, v] of Object.entries(curLocals)) {
      if (Array.isArray(v)) {
        arrayName = k
        break
      }
    }
  }

  const curArr = (arrayName && Array.isArray(curLocals[arrayName]) ? curLocals[arrayName] : []) as unknown[]
  const prevArr = (arrayName && Array.isArray(prevLocals[arrayName]) ? prevLocals[arrayName] : null) as unknown[] | null

  // Extract active pointers
  const activePointers: Record<string, number> = {}
  const pointerKeys = ctx.config?.pointers || COMMON_POINTER_NAMES
  for (const p of pointerKeys) {
    const val = curLocals[p]
    if (typeof val === 'number' && Number.isInteger(val) && val >= 0 && val < curArr.length) {
      activePointers[p] = val
    }
  }

  // Active range / window
  let activeRange: [number, number] | undefined
  if (ctx.config?.window && ctx.config.window.length === 2) {
    const [wStart, wEnd] = ctx.config.window
    const s = curLocals[wStart]
    const e = curLocals[wEnd]
    if (typeof s === 'number' && typeof e === 'number' && s >= 0 && e >= s) {
      activeRange = [s, e]
    }
  } else if (activePointers.left !== undefined && activePointers.right !== undefined) {
    activeRange = [activePointers.left, activePointers.right]
  } else if (activePointers.l !== undefined && activePointers.r !== undefined) {
    activeRange = [activePointers.l, activePointers.r]
  } else if (activePointers.low !== undefined && activePointers.high !== undefined) {
    activeRange = [activePointers.low, activePointers.high]
  }

  // Check line info and line notes
  const lineInfo = ctx.lineInfo?.[String(step.line)]
  const lineText = lineInfo?.text || ''
  const lineKinds = lineInfo?.kinds || []
  const resolvedNote = resolveLineNote(ctx.config?.line_notes?.[step.line] ?? ctx.config?.line_notes?.[String(step.line)])
  const lineNote = resolvedNote?.why

  // 1. DONE / RETURN EVENT
  if (step.event === 'return') {
    return {
      kind: 'done',
      caption: 'Execution complete',
      why: lineNote || 'All algorithm passes finished; result verified',
      highlights: curArr.map((_, idx) => ({ target: `${arrayName}[${idx}]`, role: 'done' })),
      counters,
      sortedIndices: curArr.map((_, i) => i),
      activePointers,
      activeRange,
      arrayName,
    }
  }

  // 2. DETECT SWAP
  // A swap occurred if:
  // - lineKinds contains 'swap', or
  // - prevArr and curArr have same elements with exactly two indices swapped, or
  // - lineText matches a tuple swap pattern
  const isSwapLine =
    lineKinds.includes('swap') ||
    /(\w+)\[(.*)\],\s*(\w+)\[(.*)\]\s*=\s*\3\[\4\],\s*\1\[\2\]/.test(lineText)

  let swappedIndices: [number, number] | null = null

  if (prevArr && prevArr.length === curArr.length && prevArr.length > 1) {
    const diffs: number[] = []
    for (let i = 0; i < curArr.length; i++) {
      if (curArr[i] !== prevArr[i]) {
        diffs.push(i)
      }
    }
    if (diffs.length === 2) {
      const [i1, i2] = diffs
      if (curArr[i1] === prevArr[i2] && curArr[i2] === prevArr[i1]) {
        swappedIndices = [i1, i2]
      }
    }
  }

  // If focus indices are given on a swap line
  if (isSwapLine && !swappedIndices) {
    if (step.focus && step.focus.length === 2) {
      swappedIndices = [step.focus[0], step.focus[1]]
    } else if (activePointers.j !== undefined) {
      swappedIndices = [activePointers.j, activePointers.j + 1]
    }
  }

  if (swappedIndices) {
    const [i1, i2] = swappedIndices
    counters.swaps += 1
    const v1 = curArr[i1]
    const v2 = curArr[i2]
    const moves: StepMove[] = [
      { id: `item-${i2}`, from: i2, to: i1 },
      { id: `item-${i1}`, from: i1, to: i2 },
    ]
    const highlights: ElementHighlight[] = [
      { target: `${arrayName}[${i1}]`, role: 'swap' },
      { target: `${arrayName}[${i2}]`, role: 'swap' },
    ]

    return {
      kind: 'swap',
      caption: `Swap ${arrayName}[${i1}] and ${arrayName}[${i2}]`,
      why: lineNote || `${v2} was greater than ${v1}; swapped to restore ascending order`,
      highlights,
      counters,
      moves,
      comparedIndices: [i1, i2],
      comparedValues: [v2, v1],
      activePointers,
      activeRange,
      arrayName,
    }
  }

  // 3. DETECT COMPARISON
  // A comparison happens if:
  // - lineKinds contains 'compare', or
  // - lineText contains '>', '<', '==', '!=', '>=', '<='
  const isCompareLine =
    lineKinds.includes('compare') ||
    /\bif\b.*([<>]=?|==|!=)/.test(lineText)

  if (isCompareLine) {
    let cmpIndices: [number, number] | null = null
    if (step.focus && step.focus.length >= 2) {
      cmpIndices = [step.focus[0], step.focus[1]]
    } else if (activePointers.j !== undefined && activePointers.j + 1 < curArr.length) {
      cmpIndices = [activePointers.j, activePointers.j + 1]
    } else if (activePointers.l !== undefined && activePointers.r !== undefined) {
      cmpIndices = [activePointers.l, activePointers.r]
    } else if (activePointers.left !== undefined && activePointers.right !== undefined) {
      cmpIndices = [activePointers.left, activePointers.right]
    } else if (activePointers.mid !== undefined) {
      cmpIndices = [activePointers.mid, activePointers.mid]
    }

    if (cmpIndices) {
      const [i1, i2] = cmpIndices
      counters.comparisons += 1
      const val1 = curArr[i1]
      const val2 = curArr[i2]
      let op = '>'
      if (lineText.includes('>=')) op = '>='
      else if (lineText.includes('>')) op = '>'
      else if (lineText.includes('<=')) op = '<='
      else if (lineText.includes('<')) op = '<'
      else if (lineText.includes('==')) op = '=='
      else if (lineText.includes('!=')) op = '!='

      let whyText = lineNote
      if (!whyText) {
        if (typeof val1 === 'number' && typeof val2 === 'number') {
          const outcome =
            op === '>' ? val1 > val2 :
            op === '<' ? val1 < val2 :
            op === '>=' ? val1 >= val2 :
            op === '<=' ? val1 <= val2 :
            op === '==' ? val1 === val2 : val1 !== val2
          whyText = `${val1} ${op} ${val2} is ${outcome ? 'True — out of order' : 'False — correctly ordered'}`
        } else {
          whyText = `Comparing elements at index ${i1} and ${i2}`
        }
      }

      const highlights: ElementHighlight[] = [
        { target: `${arrayName}[${i1}]`, role: 'compare' },
        { target: `${arrayName}[${i2}]`, role: 'compare' },
      ]

      return {
        kind: 'compare',
        caption: `Compare ${arrayName}[${i1}] (${val1}) and ${arrayName}[${i2}] (${val2})`,
        why: whyText,
        highlights,
        counters,
        comparedIndices: [i1, i2],
        comparedValues: [val1, val2],
        comparisonOp: op,
        activePointers,
        activeRange,
        arrayName,
      }
    }
  }

  // 4. DETECT WRITE / MUTATION
  if (prevArr && prevArr.length === curArr.length) {
    const diffs: number[] = []
    for (let i = 0; i < curArr.length; i++) {
      if (curArr[i] !== prevArr[i]) diffs.push(i)
    }
    if (diffs.length === 1) {
      const idx = diffs[0]
      counters.writes += 1
      return {
        kind: 'write',
        caption: `Set ${arrayName}[${idx}] = ${curArr[idx]}`,
        why: lineNote || `Element at index ${idx} updated from ${prevArr[idx]} to ${curArr[idx]}`,
        highlights: [{ target: `${arrayName}[${idx}]`, role: 'write' }],
        counters,
        activePointers,
        activeRange,
        arrayName,
      }
    }
  }

  // 5. DETECT POINTER ADVANCEMENT
  for (const p of Object.keys(activePointers)) {
    const curP = activePointers[p]
    const prevP = prevLocals[p]
    if (typeof prevP === 'number' && prevP !== curP) {
      return {
        kind: 'info',
        caption: `Advance pointer ${p} to index ${curP}`,
        why: lineNote || `Index ${p} now references ${arrayName}[${curP}] = ${curArr[curP]}`,
        highlights: [{ target: `${arrayName}[${curP}]`, role: 'target' }],
        counters,
        activePointers,
        activeRange,
        arrayName,
      }
    }
  }

  // 6. DEFAULT FALLBACK
  return {
    kind: 'info',
    caption: lineText || `Line ${step.line} in ${step.func}()`,
    why: lineNote || '',
    highlights: [],
    counters,
    activePointers,
    activeRange,
    arrayName,
  }
}

import type { TraceStep } from '../../api/types.ts'
import type {
  ElementHighlight,
  NarratorContext,
  NarratorCounters,
  NarratorResult,
} from './types.ts'
import { resolveLineNote } from './types.ts'

function asCells(v: unknown): unknown[] | null {
  if (Array.isArray(v)) return v
  return null
}

export function narrateDPTable(
  step: TraceStep,
  _prev: TraceStep | null,
  ctx: NarratorContext,
  prevCounters: NarratorCounters = { comparisons: 0, swaps: 0, writes: 0 },
): NarratorResult {
  const counters: NarratorCounters = { ...prevCounters }

  const curFrame = step.frames[step.frames.length - 1]
  const curLocals = curFrame?.locals || {}

  const curLine = step.line
  const lineInfo = ctx.lineInfo?.[String(curLine)]
  const curated = resolveLineNote(ctx.config?.line_notes?.[curLine] ?? ctx.config?.line_notes?.[String(curLine)])

  const highlights: ElementHighlight[] = []

  // Identify DP table name
  const tableName =
    (ctx.config?.table as string | undefined) ||
    ['dp', 'table', 'memo', 'cache', 'f'].find((n) => Array.isArray(curLocals[n])) ||
    'dp'

  const curTable = asCells(curLocals[tableName])

  // Check return / completion
  if (step.event === 'return') {
    return {
      kind: 'return',
      caption: `return ${JSON.stringify(step.return_value)}`,
      why: curated?.why || `Dynamic programming table filled; returning optimal solution.`,
      highlights,
      counters,
    }
  }

  // Detect DP cell write (1D or 2D)
  const lineText = lineInfo?.text || ''
  const isAssign = lineText.includes(`${tableName}[`) && lineText.includes('=') && !lineText.includes('==')

  if (isAssign) {
    counters.writes++
    const iVal = curLocals.i as number | undefined
    const jVal = curLocals.j as number | undefined

    let cellKey = iVal !== undefined ? (jVal !== undefined ? `${iVal},${jVal}` : `${iVal}`) : 'cell'
    let formula = ''
    const readCells: (number | string)[] = []

    if (iVal !== undefined && Array.isArray(curTable)) {
      const writtenVal = curTable[iVal]
      // Check Climbing Stairs / Fibonacci formula: dp[i - 1] + dp[i - 2]
      if (lineText.includes('dp[i - 1]') && lineText.includes('dp[i - 2]')) {
        const v1 = curTable[iVal - 1]
        const v2 = curTable[iVal - 2]
        readCells.push(iVal - 1, iVal - 2)
        formula = `dp[${iVal}] = dp[${iVal - 1}] + dp[${iVal - 2}] = ${v1} + ${v2} = ${writtenVal}`
      } else if (lineText.includes('min(') || lineText.includes('max(')) {
        counters.comparisons++
        formula = `dp[${cellKey}] = ${JSON.stringify(writtenVal)} (via optimal recurrence)`
      } else {
        formula = `dp[${cellKey}] = ${JSON.stringify(writtenVal)}`
      }

      const caption = curated?.caption || formula || `set dp[${cellKey}] = ${JSON.stringify(writtenVal)}`
      const why = curated?.why || `Substituted previous subproblems to compute optimal state for dp[${cellKey}].`

      highlights.push({ target: `${tableName}[${cellKey}]`, role: 'write' })
      for (const r of readCells) {
        highlights.push({ target: `${tableName}[${r}]`, role: 'read' })
      }

      return {
        kind: 'write',
        caption,
        why,
        formula,
        readCells,
        writeCell: cellKey,
        highlights,
        counters,
      }
    }
  }

  // Comparison
  if (lineInfo?.kinds?.includes('compare')) {
    counters.comparisons++
    return {
      kind: 'compare',
      caption: curated?.caption || lineText.trim(),
      why: curated?.why || 'Comparing subproblem values to find min / max cost.',
      highlights,
      counters,
    }
  }

  // Default step
  const caption = curated?.caption || (lineInfo?.text ? lineInfo.text.trim() : `line ${curLine} in ${step.func}()`)
  const why = curated?.why || 'Transitioning DP state.'

  return {
    kind: 'info',
    caption,
    why,
    highlights,
    counters,
  }
}

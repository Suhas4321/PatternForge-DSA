import type { TraceStep, TraceValue } from '../../api/types.ts'
import type {
  ElementHighlight,
  NarratorContext,
  NarratorCounters,
  NarratorResult,
} from './types.ts'
import { resolveLineNote } from './types.ts'

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
    if ('$deque' in tv) return (tv.$deque as TraceValue[]).map(extractRawValue)
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

const STACK_REGEX = /stack|^stk$|^st$/i
const QUEUE_REGEX = /queue|^q$|^dq$/i

export function narrateStackQueue(
  step: TraceStep,
  prev: TraceStep | null,
  ctx: NarratorContext,
  prevCounters: NarratorCounters = { comparisons: 0, swaps: 0, writes: 0 },
): NarratorResult {
  const counters: NarratorCounters = { ...prevCounters }
  const curLocals = getLocals(step)
  const prevLocals = getLocals(prev)

  // Identify stacks and queues
  const configuredStacks = (ctx.config?.stacks as string[] | undefined) ?? []
  const configuredQueues = (ctx.config?.queues as string[] | undefined) ?? []

  let stackName = configuredStacks.find((n) => Array.isArray(curLocals[n]))
  let queueName = configuredQueues.find((n) => Array.isArray(curLocals[n]))

  if (!stackName) {
    for (const [k, v] of Object.entries(curLocals)) {
      if (Array.isArray(v) && STACK_REGEX.test(k)) {
        stackName = k
        break
      }
    }
  }

  if (!queueName) {
    for (const [k, v] of Object.entries(curLocals)) {
      if (Array.isArray(v) && QUEUE_REGEX.test(k)) {
        queueName = k
        break
      }
    }
  }

  // Fallback: any list named 'stack' or the first list if visualizer is stack_queue
  if (!stackName && !queueName) {
    for (const [k, v] of Object.entries(curLocals)) {
      if (Array.isArray(v) && k !== 'self' && !k.startsWith('_')) {
        stackName = k
        break
      }
    }
  }

  const primaryName = stackName || queueName || 'stack'
  const isQueue = Boolean(queueName && !stackName)
  const curArr = (curLocals[primaryName] as unknown[]) || []
  const prevArr = (prevLocals[primaryName] as unknown[]) || []

  const curLine = step.line
  const lineInfo = ctx.lineInfo?.[String(curLine)]
  const curated = resolveLineNote(ctx.config?.line_notes?.[curLine] ?? ctx.config?.line_notes?.[String(curLine)])

  const highlights: ElementHighlight[] = []

  // Check return / completion
  if (step.event === 'return') {
    return {
      kind: 'return',
      caption: `return ${JSON.stringify(extractRawValue(step.return_value))}`,
      why: curated?.why || 'Function finished executing and returned result.',
      highlights,
      counters,
      stackOperation: undefined,
    }
  }

  // Detect Push / Enqueue
  if (curArr.length > prevArr.length) {
    counters.writes++
    const pushedVal = curArr[curArr.length - 1]
    const kind = isQueue ? 'enqueue' : 'push'
    highlights.push({ target: `${primaryName}[${curArr.length - 1}]`, role: 'write' })

    const formattedVal = JSON.stringify(pushedVal)
    const caption = curated?.caption || (isQueue
      ? `enqueue ${formattedVal} (${primaryName} size ${curArr.length})`
      : `push ${formattedVal} (${primaryName} size ${curArr.length})`)

    let why = curated?.why || ''
    if (!why) {
      if (lineInfo?.text?.includes('append')) {
        why = `Added ${formattedVal} to the ${isQueue ? 'rear of queue' : 'top of stack'}.`
      } else {
        why = `Pushed element ${formattedVal} (new size: ${curArr.length}).`
      }
    }

    return {
      kind,
      caption,
      why,
      highlights,
      counters,
      stackOperation: isQueue ? undefined : { type: 'push', item: pushedVal, depth: curArr.length },
      queueOperation: isQueue ? { type: 'enqueue', item: pushedVal, length: curArr.length } : undefined,
    }
  }

  // Detect Pop / Dequeue
  if (curArr.length < prevArr.length) {
    counters.writes++
    const poppedVal = prevArr[prevArr.length - 1]
    const kind = isQueue ? 'dequeue' : 'pop'
    const formattedVal = JSON.stringify(poppedVal)

    const caption = curated?.caption || (isQueue
      ? `dequeue ${formattedVal} (${primaryName} size ${curArr.length})`
      : `pop ${formattedVal} (${primaryName} size ${curArr.length})`)

    let why = curated?.why || ''
    if (!why) {
      // Check if monotonic stack rationale applies
      const lineText = lineInfo?.text || ''
      if (lineText.includes('>') || lineText.includes('<') || lineText.includes('pop')) {
        why = `${formattedVal} was popped from top of stack because the invariant is maintained.`
      } else {
        why = `Removed ${formattedVal} from the top of the stack.`
      }
    }

    return {
      kind,
      caption,
      why,
      highlights,
      counters,
      stackOperation: isQueue ? undefined : { type: 'pop', item: poppedVal, depth: curArr.length },
      queueOperation: isQueue ? { type: 'dequeue', item: poppedVal, length: curArr.length } : undefined,
    }
  }

  // Check top comparison / peek
  const lineText = lineInfo?.text || ''
  if (lineText.includes('[-1]') || lineText.includes('.top()') || lineInfo?.kinds?.includes('compare')) {
    counters.comparisons++
    const topVal = curArr.length > 0 ? curArr[curArr.length - 1] : undefined
    highlights.push({ target: `${primaryName}[${curArr.length - 1}]`, role: 'compare' })

    const caption = curated?.caption || `inspect top ${primaryName}[-1] = ${JSON.stringify(topVal)}`
    const why = curated?.why || `Comparing current element with top of stack (${JSON.stringify(topVal)}).`

    return {
      kind: 'compare',
      caption,
      why,
      highlights,
      counters,
      comparedValues: [topVal, undefined],
    }
  }

  // Default step
  const caption = curated?.caption || (lineInfo?.text ? lineInfo.text.trim() : `line ${curLine} in ${step.func}()`)
  const why = curated?.why || (curArr.length > 0 ? `${primaryName} size is ${curArr.length}, top is ${JSON.stringify(curArr[curArr.length - 1])}.` : `${primaryName} is empty.`)

  return {
    kind: 'info',
    caption,
    why,
    highlights,
    counters,
  }
}

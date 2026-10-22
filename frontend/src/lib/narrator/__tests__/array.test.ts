import type { TraceStep } from '../../../api/types.ts'
import { narrateArray } from '../array.ts'
import { precomputeTraceNarration } from '../index.ts'
import type { NarratorContext, NarratorCounters } from '../types.ts'

const assert = {
  equal: (a: unknown, b: unknown) => {
    if (a !== b) throw new Error(`Assertion failed: ${a} !== ${b}`)
  },
  deepEqual: (a: unknown, b: unknown) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`Assertion failed: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`)
  },
  ok: (val: unknown) => {
    if (!val) throw new Error(`Assertion failed: ${val} is not truthy`)
  },
}

function makeStep(line: number, locals: Record<string, unknown>, event: 'line' | 'return' | 'call' = 'line', focus?: number[]): TraceStep {
  return {
    event,
    line,
    func: 'bubbleSort',
    depth: 1,
    frames: [
      {
        id: 1,
        func: 'bubbleSort',
        line,
        locals: locals as any,
      },
    ],
    heap: {},
    focus,
  }
}

console.log('Running Narrator Unit Tests (11 test cases)...')

const initialCounters: NarratorCounters = { comparisons: 0, swaps: 0, writes: 0 }

// Case 1: Detect compare
{
  const step = makeStep(6, { nums: [5, 3, 8], j: 0 }, 'line', [0, 1])
  const ctx: NarratorContext = {
    lineInfo: { '6': { text: 'if nums[j] > nums[j + 1]:', kinds: ['compare'], subscripts: ['nums[j]', 'nums[j + 1]'] } },
    stepIndex: 1,
  }
  const res = narrateArray(step, null, ctx, initialCounters)
  assert.equal(res.kind, 'compare')
  assert.equal(res.counters.comparisons, 1)
  assert.deepEqual(res.comparedIndices, [0, 1])
  assert.deepEqual(res.comparedValues, [5, 3])
  assert.ok(res.caption.includes('Compare nums[0] (5) and nums[1] (3)'))
  console.log('✔ Case 1: Detect compare passed')
}

// Case 2: Detect swap
{
  const prev = makeStep(6, { nums: [5, 3, 8], j: 0 })
  const step = makeStep(7, { nums: [3, 5, 8], j: 0 }, 'line', [0, 1])
  const ctx: NarratorContext = {
    lineInfo: { '7': { text: 'nums[j], nums[j + 1] = nums[j + 1], nums[j]', kinds: ['swap'], subscripts: ['nums[j]', 'nums[j + 1]'] } },
    stepIndex: 2,
  }
  const res = narrateArray(step, prev, ctx, { comparisons: 1, swaps: 0, writes: 0 })
  assert.equal(res.kind, 'swap')
  assert.equal(res.counters.swaps, 1)
  assert.deepEqual(res.comparedIndices, [0, 1])
  assert.deepEqual(res.moves?.length, 2)
  console.log('✔ Case 2: Detect swap passed')
}

// Case 3: Swap with duplicate values in array [4, 2, 2, 1]
{
  const prev = makeStep(6, { nums: [4, 2, 2, 1], j: 2 })
  const step = makeStep(7, { nums: [4, 2, 1, 2], j: 2 }, 'line', [2, 3])
  const ctx: NarratorContext = {
    lineInfo: { '7': { text: 'nums[j], nums[j + 1] = nums[j + 1], nums[j]', kinds: ['swap'], subscripts: ['nums[j]', 'nums[j + 1]'] } },
    stepIndex: 3,
  }
  const res = narrateArray(step, prev, ctx, initialCounters)
  assert.equal(res.kind, 'swap')
  assert.equal(res.counters.swaps, 1)
  assert.deepEqual(res.comparedIndices, [2, 3])
  console.log('✔ Case 3: Swap with duplicates passed')
}

// Case 4: Detect pointer advance
{
  const prev = makeStep(5, { nums: [3, 5, 8], j: 0 })
  const step = makeStep(5, { nums: [3, 5, 8], j: 1 })
  const ctx: NarratorContext = { stepIndex: 3 }
  const res = narrateArray(step, prev, ctx, initialCounters)
  assert.ok(res.caption.includes('Advance pointer j to index 1'))
  console.log('✔ Case 4: Pointer advance passed')
}

// Case 5: Detect single write
{
  const prev = makeStep(10, { nums: [1, 2, 3] })
  const step = makeStep(11, { nums: [1, 99, 3] })
  const ctx: NarratorContext = { stepIndex: 4 }
  const res = narrateArray(step, prev, ctx, initialCounters)
  assert.equal(res.kind, 'write')
  assert.equal(res.counters.writes, 1)
  assert.ok(res.caption.includes('Set nums[1] = 99'))
  console.log('✔ Case 5: Write detection passed')
}

// Case 6: Two pointer comparison (l and r)
{
  const step = makeStep(4, { numbers: [2, 7, 11, 15], l: 0, r: 3 }, 'line', [0, 3])
  const ctx: NarratorContext = {
    lineInfo: { '4': { text: 'if numbers[l] + numbers[r] == target:', kinds: ['compare'], subscripts: ['numbers[l]', 'numbers[r]'] } },
    config: { arrays: ['numbers'], pointers: ['l', 'r'] },
    stepIndex: 1,
  }
  const res = narrateArray(step, null, ctx, initialCounters)
  assert.equal(res.kind, 'compare')
  assert.deepEqual(res.comparedIndices, [0, 3])
  console.log('✔ Case 6: Two pointer comparison passed')
}

// Case 7: Sliding window active range
{
  const step = makeStep(8, { nums: [1, 3, -1, -3, 5], left: 1, right: 3 })
  const ctx: NarratorContext = {
    config: { window: ['left', 'right'] },
    stepIndex: 5,
  }
  const res = narrateArray(step, null, ctx, initialCounters)
  assert.deepEqual(res.activeRange, [1, 3])
  console.log('✔ Case 7: Window range detection passed')
}

// Case 8: YAML line_notes overrides generated why
{
  const step = makeStep(7, { nums: [3, 5, 8], j: 0 }, 'line', [0, 1])
  const customNote = 'Left is bigger than right, so bubble rightward.'
  const ctx: NarratorContext = {
    config: { line_notes: { 7: customNote } },
    lineInfo: { '7': { text: 'nums[j], nums[j + 1] = nums[j + 1], nums[j]', kinds: ['swap'], subscripts: [] } },
    stepIndex: 2,
  }
  const res = narrateArray(step, null, ctx, initialCounters)
  assert.equal(res.why, customNote)
  console.log('✔ Case 8: YAML line_notes override passed')
}

// Case 9: Return / done event
{
  const step = makeStep(12, { nums: [1, 2, 3, 4] }, 'return')
  const ctx: NarratorContext = { stepIndex: 10 }
  const res = narrateArray(step, null, ctx, initialCounters)
  assert.equal(res.kind, 'done')
  assert.equal(res.sortedIndices?.length, 4)
  console.log('✔ Case 9: Done event passed')
}

// Case 10: Fallback info for generic statement
{
  const step = makeStep(3, { n: 4 }, 'line')
  const ctx: NarratorContext = {
    lineInfo: { '3': { text: 'n = len(nums)', kinds: [], subscripts: [] } },
    stepIndex: 1,
  }
  const res = narrateArray(step, null, ctx, initialCounters)
  assert.equal(res.kind, 'info')
  assert.equal(res.caption, 'n = len(nums)')
  console.log('✔ Case 10: Generic fallback passed')
}

// Case 11: Precompute full trace accumulates telemetry counters
{
  const steps = [
    makeStep(1, { nums: [5, 1, 4] }),
    makeStep(6, { nums: [5, 1, 4], j: 0 }, 'line', [0, 1]), // compare 1
    makeStep(7, { nums: [1, 5, 4], j: 0 }, 'line', [0, 1]), // swap 1
    makeStep(6, { nums: [1, 5, 4], j: 1 }, 'line', [1, 2]), // compare 2
    makeStep(7, { nums: [1, 4, 5], j: 1 }, 'line', [1, 2]), // swap 2
    makeStep(8, { nums: [1, 4, 5] }, 'return'),             // done
  ]
  const lineInfo = {
    '6': { text: 'if nums[j] > nums[j + 1]:', kinds: ['compare'], subscripts: [] },
    '7': { text: 'nums[j], nums[j + 1] = nums[j + 1], nums[j]', kinds: ['swap'], subscripts: [] },
  }
  const traceResults = precomputeTraceNarration(steps, lineInfo)
  assert.equal(traceResults.length, 6)
  assert.equal(traceResults[0].counters.comparisons, 0)
  assert.equal(traceResults[1].counters.comparisons, 1)
  assert.equal(traceResults[2].counters.swaps, 1)
  assert.equal(traceResults[3].counters.comparisons, 2)
  assert.equal(traceResults[4].counters.swaps, 2)
  assert.equal(traceResults[5].kind, 'done')
  console.log('✔ Case 11: Cumulative trace precomputation passed')
}

console.log('All 11 Narrator Unit Tests Passed Successfully!')

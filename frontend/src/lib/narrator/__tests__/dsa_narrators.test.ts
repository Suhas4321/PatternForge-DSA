import type { TraceStep } from '../../../api/types.ts'
import {
  precomputeTraceNarration,
  narrateStackQueue,
  narrateLinkedList,
  narrateTreeRecursion,
  narrateGraphGrid,
  narrateDPTable,
} from '../index.ts'
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

function makeStep(
  line: number,
  locals: Record<string, unknown>,
  event: 'line' | 'return' | 'call' = 'line',
  heap: Record<string, any> = {},
): TraceStep {
  return {
    event,
    line,
    func: 'solve',
    depth: 1,
    frames: [
      {
        id: 1,
        func: 'solve',
        line,
        locals: locals as any,
      },
    ],
    heap,
  }
}

console.log('Running DSA Narrator Unit Tests (10 test cases)...')

const initialCounters: NarratorCounters = { comparisons: 0, swaps: 0, writes: 0 }

// 1. Stack Push
{
  const prev = makeStep(2, { stack: [10, 20] })
  const cur = makeStep(3, { stack: [10, 20, 73] })
  const ctx: NarratorContext = {
    lineInfo: { '3': { text: 'stack.append(73)', kinds: ['call'], subscripts: [] } },
    stepIndex: 1,
  }
  const res = narrateStackQueue(cur, prev, ctx, initialCounters)
  assert.equal(res.kind, 'push')
  assert.equal(res.counters.writes, 1)
  assert.ok(res.caption.includes('push 73'))
  assert.ok(res.caption.includes('stack size 3'))
  assert.equal(res.stackOperation?.type, 'push')
  assert.equal(res.stackOperation?.depth, 3)
  console.log('✔ Case 1: Stack push passed')
}

// 2. Stack Pop (Monotonic)
{
  const prev = makeStep(4, { stack: [10, 72] })
  const cur = makeStep(5, { stack: [10] })
  const ctx: NarratorContext = {
    lineInfo: { '5': { text: 'stack.pop()', kinds: ['call'], subscripts: [] } },
    stepIndex: 2,
  }
  const res = narrateStackQueue(cur, prev, ctx, initialCounters)
  assert.equal(res.kind, 'pop')
  assert.equal(res.counters.writes, 1)
  assert.ok(res.caption.includes('pop 72'))
  assert.equal(res.stackOperation?.type, 'pop')
  console.log('✔ Case 2: Stack pop passed')
}

// 3. Linked List Rewiring (curr.next = prev)
{
  const prevHeap = {
    '1': { type: 'ListNode', fields: { val: 1, next: { $ref: 2 } } },
    '2': { type: 'ListNode', fields: { val: 2, next: { $ref: 3 } } },
  }
  const curHeap = {
    '1': { type: 'ListNode', fields: { val: 1, next: null } },
    '2': { type: 'ListNode', fields: { val: 2, next: { $ref: 3 } } },
  }
  const prev = makeStep(4, { curr: { $ref: 1 }, prev: null }, 'line', prevHeap)
  const cur = makeStep(5, { curr: { $ref: 1 }, prev: null }, 'line', curHeap)
  const ctx: NarratorContext = {
    lineInfo: { '5': { text: 'curr.next = prev', kinds: [], subscripts: [] } },
    stepIndex: 3,
  }
  const res = narrateLinkedList(cur, prev, ctx, initialCounters)
  assert.equal(res.kind, 'swap')
  assert.equal(res.counters.writes, 1)
  assert.ok(res.caption.includes('.next ='))
  assert.deepEqual(res.rewiredEdge, { from: '1', to: null })
  console.log('✔ Case 3: Linked list edge rewiring passed')
}

// 4. Linked List Pointer Advance (curr = next_node)
{
  const heap = {
    '1': { type: 'ListNode', fields: { val: 1, next: { $ref: 2 } } },
    '2': { type: 'ListNode', fields: { val: 2, next: null } },
  }
  const prev = makeStep(6, { curr: { $ref: 1 } }, 'line', heap)
  const cur = makeStep(7, { curr: { $ref: 2 } }, 'line', heap)
  const ctx: NarratorContext = {
    lineInfo: { '7': { text: 'curr = next_node', kinds: [], subscripts: [] } },
    stepIndex: 4,
  }
  const res = narrateLinkedList(cur, prev, ctx, initialCounters)
  assert.equal(res.kind, 'write')
  assert.ok(res.caption.includes('curr ='))
  console.log('✔ Case 4: Linked list pointer advance passed')
}

// 5. Tree Recursion Call and Return
{
  const stepCall = makeStep(3, { root: { $ref: 1 } }, 'call')
  const ctx: NarratorContext = { stepIndex: 5 }
  const resCall = narrateTreeRecursion(stepCall, null, ctx, initialCounters)
  assert.equal(resCall.kind, 'call')
  assert.ok(resCall.caption.includes('call solve'))

  const stepRet = makeStep(8, { root: { $ref: 1 } }, 'return')
  stepRet.return_value = 3
  const resRet = narrateTreeRecursion(stepRet, null, ctx, initialCounters)
  assert.equal(resRet.kind, 'return')
  assert.ok(resRet.caption.includes('→ 3'))
  console.log('✔ Case 5: Tree recursion call & return passed')
}

// 6. Tree Child Swap (Invert Tree)
{
  const prevHeap = {
    '1': { type: 'TreeNode', fields: { val: 4, left: { $ref: 2 }, right: { $ref: 7 } } },
  }
  const curHeap = {
    '1': { type: 'TreeNode', fields: { val: 4, left: { $ref: 7 }, right: { $ref: 2 } } },
  }
  const prev = makeStep(4, { root: { $ref: 1 } }, 'line', prevHeap)
  const cur = makeStep(5, { root: { $ref: 1 } }, 'line', curHeap)
  const ctx: NarratorContext = {
    lineInfo: { '5': { text: 'root.left, root.right = root.right, root.left', kinds: [], subscripts: [] } },
    stepIndex: 6,
  }
  const res = narrateTreeRecursion(cur, prev, ctx, initialCounters)
  assert.equal(res.kind, 'swap')
  assert.equal(res.counters.swaps, 1)
  assert.ok(res.caption.includes('swap left ↔ right of Node(4)'))
  console.log('✔ Case 6: Tree child swap passed')
}

// 7. Graph Grid Cell Mark
{
  const prev = makeStep(10, { r: 1, c: 2, grid: [['1', '1'], ['1', '1']] })
  const cur = makeStep(11, { r: 1, c: 2, grid: [['1', '1'], ['1', '0']] })
  const ctx: NarratorContext = {
    lineInfo: { '11': { text: 'grid[r][c] = "0"', kinds: [], subscripts: ['grid[r][c]'] } },
    stepIndex: 7,
  }
  const res = narrateGraphGrid(cur, prev, ctx, initialCounters)
  assert.equal(res.kind, 'write')
  assert.ok(res.caption.includes('mark cell (1, 2)'))
  assert.equal(res.writeCell, '1,2')
  console.log('✔ Case 7: Graph grid cell mark passed')
}

// 8. Graph BFS Queue Enqueue / Dequeue
{
  const prev = makeStep(12, { q: { $deque: [{ $tuple: [0, 0] }] } })
  const cur = makeStep(13, { q: { $deque: [{ $tuple: [0, 0] }, { $tuple: [0, 1] }] } })
  const ctx: NarratorContext = {
    lineInfo: { '13': { text: 'q.append((nr, nc))', kinds: [], subscripts: [] } },
    stepIndex: 8,
  }
  const res = narrateGraphGrid(cur, prev, ctx, initialCounters)
  assert.equal(res.kind, 'enqueue')
  assert.ok(res.caption.includes('enqueue neighbor (0, 1)'))
  console.log('✔ Case 8: Graph BFS enqueue passed')
}

// 9. DP Table Formula Substitution
{
  const prev = makeStep(5, { i: 5, dp: [0, 1, 2, 3, 5, 0] })
  const cur = makeStep(6, { i: 5, dp: [0, 1, 2, 3, 5, 8] })
  const ctx: NarratorContext = {
    lineInfo: { '6': { text: 'dp[i] = dp[i - 1] + dp[i - 2]', kinds: [], subscripts: ['dp[i]', 'dp[i - 1]', 'dp[i - 2]'] } },
    stepIndex: 9,
  }
  const res = narrateDPTable(cur, prev, ctx, initialCounters)
  assert.equal(res.kind, 'write')
  assert.equal(res.formula, 'dp[5] = dp[4] + dp[3] = 5 + 3 = 8')
  assert.deepEqual(res.readCells, [4, 3])
  assert.equal(res.writeCell, '5')
  console.log('✔ Case 9: DP table formula substitution passed')
}

// 10. Trace-wide precomputation routing
{
  const steps = [
    makeStep(1, { stack: [] }),
    makeStep(2, { stack: [5] }),
    makeStep(3, { stack: [5, 12] }),
  ]
  const lineInfo = {
    '1': { text: 'stack = []', kinds: [], subscripts: [] },
    '2': { text: 'stack.append(5)', kinds: ['call'], subscripts: [] },
    '3': { text: 'stack.append(12)', kinds: ['call'], subscripts: [] },
  }
  const results = precomputeTraceNarration(steps, lineInfo, undefined, 'stack_queue')
  assert.equal(results.length, 3)
  assert.equal(results[1].kind, 'push')
  assert.equal(results[1].counters.writes, 1)
  assert.equal(results[2].kind, 'push')
  assert.equal(results[2].counters.writes, 2)
  console.log('✔ Case 10: precomputeTraceNarration routing passed')
}

console.log('All 10 DSA Narrator Unit Tests passed successfully!')

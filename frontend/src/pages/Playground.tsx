import { Play } from 'lucide-react'
import { useState } from 'react'
import type { RunError, Trace, VisualizerKind } from '../api/types'
import CodeEditor from '../components/CodeEditor'
import { Button, ErrorNote } from '../components/ui'
import TracePlayer from '../components/visualizers/TracePlayer'
import VisualizerHost from '../components/visualizers/VisualizerHost'

const KINDS: { kind: VisualizerKind; label: string }[] = [
  { kind: 'array_pointer', label: 'Array and pointers' },
  { kind: 'stack_queue', label: 'Stack and queue' },
  { kind: 'linked_list', label: 'Linked list' },
  { kind: 'tree_recursion', label: 'Tree and recursion' },
  { kind: 'graph_grid', label: 'Graph and grid' },
  { kind: 'dp_table', label: 'DP table' },
]

const TYPES = ['any', 'ListNode', 'ListNode[]', 'ListNodeCycle', 'RandomListNode', 'TreeNode', 'TreeNodeRef', 'TreeNodeVal', 'GraphNode']

interface Preset {
  name: string
  kind: VisualizerKind
  code: string
  args: string
  types: string
  returns: string
}

const PRESETS: Preset[] = [
  {
    name: 'Reverse a linked list',
    kind: 'linked_list',
    code: `class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev, cur = None, head
        while cur:
            nxt = cur.next
            cur.next = prev
            prev, cur = cur, nxt
        return prev
`,
    args: '[[1, 2, 3, 4, 5]]',
    types: 'ListNode',
    returns: 'ListNode',
  },
  {
    name: 'Invert a binary tree',
    kind: 'tree_recursion',
    code: `class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if root is None:
            return None
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root
`,
    args: '[[4, 2, 7, 1, 3, 6, 9]]',
    types: 'TreeNode',
    returns: 'TreeNode',
  },
  {
    name: 'Subsets (backtracking)',
    kind: 'tree_recursion',
    code: `class Solution:
    def subsets(self, nums: List[int]) -> List[List[int]]:
        res, path = [], []
        def dfs(i):
            if i == len(nums):
                res.append(path[:])
                return
            path.append(nums[i])
            dfs(i + 1)
            path.pop()
            dfs(i + 1)
        dfs(0)
        return res
`,
    args: '[[1, 2, 3]]',
    types: 'any',
    returns: 'any',
  },
  {
    name: 'Number of islands',
    kind: 'graph_grid',
    code: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        rows, cols = len(grid), len(grid[0])
        count = 0
        def sink(r, c):
            if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1":
                return
            grid[r][c] = "0"
            sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1)
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == "1":
                    count += 1
                    sink(r, c)
        return count
`,
    args: '[[["1","1","0","0"],["1","0","0","1"],["0","0","1","1"]]]',
    types: 'any',
    returns: 'any',
  },
  {
    name: 'Course schedule (topological sort)',
    kind: 'graph_grid',
    code: `class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        adj = [[] for _ in range(numCourses)]
        indegree = [0] * numCourses
        for a, b in prerequisites:
            adj[b].append(a)
            indegree[a] += 1
        queue = deque(i for i in range(numCourses) if indegree[i] == 0)
        done = 0
        while queue:
            node = queue.popleft()
            done += 1
            for nxt in adj[node]:
                indegree[nxt] -= 1
                if indegree[nxt] == 0:
                    queue.append(nxt)
        return done == numCourses
`,
    args: '[4, [[1, 0], [2, 0], [3, 1], [3, 2]]]',
    types: 'any',
    returns: 'any',
  },
  {
    name: 'House robber (1D DP)',
    kind: 'dp_table',
    code: `class Solution:
    def rob(self, nums: List[int]) -> int:
        n = len(nums)
        dp = [0] * (n + 1)
        dp[1] = nums[0]
        for i in range(2, n + 1):
            dp[i] = max(dp[i - 1], dp[i - 2] + nums[i - 1])
        return dp[n]
`,
    args: '[[2, 7, 9, 3, 1]]',
    types: 'any',
    returns: 'any',
  },
  {
    name: 'Longest common subsequence (2D DP)',
    kind: 'dp_table',
    code: `class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        m, n = len(text1), len(text2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if text1[i - 1] == text2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                else:
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
        return dp[m][n]
`,
    args: '["abcde", "ace"]',
    types: 'any',
    returns: 'any',
  },
  {
    name: 'Next greater element (monotonic stack)',
    kind: 'stack_queue',
    code: `class Solution:
    def nextGreater(self, nums: List[int]) -> List[int]:
        res = [-1] * len(nums)
        stack = []
        for i, x in enumerate(nums):
            while stack and nums[stack[-1]] < x:
                res[stack.pop()] = x
            stack.append(i)
        return res
`,
    args: '[[2, 1, 2, 4, 3]]',
    types: 'any',
    returns: 'any',
  },
  {
    name: 'Longest substring without repeats (sliding window)',
    kind: 'array_pointer',
    code: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        seen = set()
        l = best = 0
        for r, ch in enumerate(s):
            while ch in seen:
                seen.remove(s[l])
                l += 1
            seen.add(ch)
            best = max(best, r - l + 1)
        return best
`,
    args: '["abcabcbb"]',
    types: 'any',
    returns: 'any',
  },
]

const detectName = (code: string) => /def\s+(\w+)\s*\(\s*self/.exec(code)?.[1] ?? ''

export default function Playground() {
  const [preset, setPreset] = useState(0)
  const [kind, setKind] = useState<VisualizerKind>(PRESETS[0].kind)
  const [code, setCode] = useState(PRESETS[0].code)
  const [args, setArgs] = useState(PRESETS[0].args)
  const [types, setTypes] = useState(PRESETS[0].types)
  const [returns, setReturns] = useState(PRESETS[0].returns)
  const [trace, setTrace] = useState<Trace | null>(null)
  const [output, setOutput] = useState<{ value: unknown; error: RunError | null; stdout: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [tracedCode, setTracedCode] = useState('')

  const load = (i: number) => {
    const p = PRESETS[i]
    setPreset(i)
    setKind(p.kind)
    setCode(p.code)
    setArgs(p.args)
    setTypes(p.types)
    setReturns(p.returns)
    setTrace(null)
    setOutput(null)
  }

  const run = async () => {
    setError(null)
    let parsed: unknown
    try {
      parsed = JSON.parse(args)
      if (!Array.isArray(parsed)) throw new Error()
    } catch {
      setError('Arguments must be a JSON list, one entry per parameter, e.g. [[1, 2, 3], 4]')
      return
    }
    const name = detectName(code)
    if (!name) {
      setError('Write your solution as a method inside class Solution, like on LeetCode.')
      return
    }
    setRunning(true)
    setPlaying(false)
    try {
      const res = await fetch('/api/playground/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          function_name: name,
          args: parsed,
          arg_types: types.split(',').map((t) => t.trim()).filter(Boolean),
          returns,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(typeof body.detail === 'string' ? body.detail : 'Check the argument types.')
      if (body.compile_error) {
        setError(`${body.compile_error.type} on line ${body.compile_error.line}: ${body.compile_error.message}`)
        setTrace(null)
        return
      }
      setTrace(body.trace)
      setTracedCode(code)
      setOutput({ value: body.output, error: body.error ?? body.fatal_error, stdout: body.stdout })
      setIndex(0)
      setPlaying(!!body.trace?.steps.length)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRunning(false)
    }
  }

  const steps = trace?.steps ?? []
  const step = steps[Math.min(index, steps.length - 1)]

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-plate text-2xl font-semibold">Playground</h1>
          <p className="text-sm text-muted">Paste any LeetCode-style solution, give it an input, and watch it run.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          Start from
          <select
            value={preset}
            onChange={(e) => load(Number(e.target.value))}
            className="rounded-md border border-line bg-panel px-2 py-1.5 text-chalk"
          >
            {PRESETS.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="stage flex min-h-[30rem] flex-col overflow-hidden rounded-3xl">
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
            <h3 className="text-sm font-semibold">Visualizer</h3>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as VisualizerKind)}
              className="rounded border border-line bg-ink px-2 py-1 text-xs text-chalk"
              aria-label="Visualizer"
            >
              {KINDS.map((k) => (
                <option key={k.kind} value={k.kind}>
                  {k.label}
                </option>
              ))}
            </select>
          </header>
          <div className="drafting flex-1 overflow-auto p-5">
            {step ? (
              <VisualizerHost kind={kind} step={step} prev={steps[index - 1]} steps={steps} index={index} config={{}} code={tracedCode} />
            ) : (
              <p className="text-sm text-muted">Run the code to see it here.</p>
            )}
          </div>
          {trace && steps.length > 0 && (
            <div className="border-t border-line px-4 py-3">
              <TracePlayer
                trace={trace}
                index={Math.min(index, steps.length - 1)}
                onIndex={setIndex}
                playing={playing}
                onPlaying={setPlaying}
                speed={speed}
                onSpeed={setSpeed}
              />
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="stage h-[22rem] overflow-hidden rounded-3xl">
            <CodeEditor value={code} onChange={setCode} traceLine={step && step.event !== 'call' ? step.line : null} onRun={run} />
          </div>
          <label className="flex flex-col gap-1 text-sm text-muted">
            Arguments (JSON list, one per parameter)
            <input
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              className="rounded-md border border-line bg-ink px-3 py-1.5 font-mono text-xs text-chalk"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm text-muted">
              Parameter types, comma separated
              <input
                value={types}
                onChange={(e) => setTypes(e.target.value)}
                placeholder="any, ListNode, TreeNode…"
                className="rounded-md border border-line bg-ink px-3 py-1.5 font-mono text-xs text-chalk"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-muted">
              Return type
              <select
                value={returns}
                onChange={(e) => setReturns(e.target.value)}
                className="rounded-md border border-line bg-ink px-2 py-1.5 text-xs text-chalk"
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={run} disabled={running}>
              <Play size={15} /> {running ? 'Running' : 'Run and visualize'}
            </Button>
            <span className="text-xs text-faint">Lists, trees and graphs use LeetCode's input formats.</span>
          </div>
          {error && <ErrorNote message={error} />}
          {output && (
            <div className="card rounded-xl p-3 font-mono text-xs">
              {output.error ? (
                <span className="text-oxide">
                  {output.error.type}
                  {output.error.line ? ` (line ${output.error.line})` : ''}: {output.error.message}
                </span>
              ) : (
                <span>
                  <span className="font-sans text-muted">Returned </span>
                  {JSON.stringify(output.value)}
                </span>
              )}
              {output.stdout && <pre className="mt-2 whitespace-pre-wrap text-muted">{output.stdout}</pre>}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

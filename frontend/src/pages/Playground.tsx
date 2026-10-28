import { ArrowLeft, Play } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { RunError, Trace, VisualizerKind } from '../api/types'
import CodeEditor from '../components/CodeEditor'
import { ThemeToggle } from '../components/effects'
import { Button, ErrorNote } from '../components/ui'
import VisualizerHost from '../components/visualizers/VisualizerHost'
import ResizableSplit from '../components/workspace/ResizableSplit'
import { precomputeTraceNarration } from '../lib/narrator/index.ts'

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
      const raw = await res.text()
      let body: {
        detail?: unknown
        compile_error?: RunError | null
        fatal_error?: RunError | null
        error?: RunError | null
        output?: unknown
        stdout?: string
        trace?: Trace | null
      } | null = null
      try {
        body = raw ? JSON.parse(raw) : null
      } catch {
        throw new Error(
          res.ok
            ? 'Backend returned an invalid JSON response.'
            : `Backend error (${res.status} ${res.statusText}): ${raw.slice(0, 200) || 'Check that the backend is running on port 8010.'}`,
        )
      }
      if (!res.ok || !body) {
        throw new Error(typeof body?.detail === 'string' ? body.detail : 'Check the argument types.')
      }
      if (body.compile_error) {
        setError(`${body.compile_error.type} on line ${body.compile_error.line}: ${body.compile_error.message}`)
        setTrace(null)
        return
      }
      setTrace(body.trace ?? null)
      setTracedCode(code)
      setOutput({ value: body.output, error: body.error ?? body.fatal_error ?? null, stdout: body.stdout ?? '' })
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

  const narrations = useMemo(() => {
    if (!trace?.steps || trace.steps.length === 0) return []
    return precomputeTraceNarration(trace.steps, trace.line_info, undefined, kind)
  }, [trace, kind])
  const currentNarration = narrations[index]

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-void text-chalk">
      {/* 44px Fullscreen IDE Top Bar */}
      <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-line bg-panel px-3 select-none">
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            className="flex items-center gap-1 rounded-lg border border-line bg-panel-2 px-2.5 py-1 text-xs font-medium text-muted hover:text-chalk"
          >
            <ArrowLeft size={13} />
            <span>Home</span>
          </Link>
          <h1 className="font-plate text-sm font-bold text-chalk sm:text-base">Playground</h1>
          <select
            value={preset}
            onChange={(e) => load(Number(e.target.value))}
            className="rounded-lg border border-line bg-panel-2 px-2 py-1 text-xs text-chalk"
            aria-label="Preset"
          >
            {PRESETS.map((p, i) => (
              <option key={p.name} value={i}>
                Preset: {p.name}
              </option>
            ))}
          </select>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as VisualizerKind)}
            className="hidden rounded-lg border border-line bg-panel-2 px-2 py-1 text-xs text-chalk sm:block"
            aria-label="Visualizer"
          >
            {KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                Visualizer: {k.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button className="h-7 px-3 text-xs font-semibold" onClick={run} disabled={running}>
            <Play size={13} />
            <span>{running ? 'Running…' : 'Run & Visualize'}</span>
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <ResizableSplit
          direction="horizontal"
          initialPrimaryPct={48}
          minPrimaryPct={25}
          maxPrimaryPct={75}
          storageKey="pf-pg-split-x"
          first={
            <div className="flex h-full w-full flex-col overflow-hidden bg-panel p-2">
              <VisualizerHost
                kind={kind}
                title={KINDS.find((k) => k.kind === kind)?.label || 'Playground Visualizer'}
                description="Interactive Custom Code Execution"
                caption={currentNarration?.caption}
                why={currentNarration?.why}
                comparisons={currentNarration?.counters.comparisons}
                swaps={currentNarration?.counters.swaps}
                writes={currentNarration?.counters.writes}
                narration={currentNarration}
                lineInfo={trace?.line_info}
                step={
                  step || {
                    event: 'line',
                    line: 1,
                    func: 'ready',
                    depth: 0,
                    frames: [],
                    heap: {},
                  }
                }
                prev={steps[index - 1]}
                steps={steps}
                index={index}
                config={{}}
                code={tracedCode || code}
                playing={playing}
                onTogglePlay={() => setPlaying(!playing)}
                onStepForward={() => setIndex(Math.min(steps.length - 1, index + 1))}
                onStepBackward={() => setIndex(Math.max(0, index - 1))}
                onJumpFirst={() => setIndex(0)}
                onJumpLast={() => setIndex(Math.max(0, steps.length - 1))}
                onSeek={setIndex}
                speed={speed}
                onSpeedChange={setSpeed}
              />
            </div>
          }
          second={
            <ResizableSplit
              direction="vertical"
              initialPrimaryPct={68}
              minPrimaryPct={30}
              maxPrimaryPct={88}
              storageKey="pf-pg-split-y"
              first={
                <div className="h-full w-full overflow-hidden">
                  <CodeEditor
                    value={code}
                    onChange={setCode}
                    traceLine={step && step.event !== 'call' ? step.line : null}
                    onRun={run}
                    step={step}
                    prevStep={steps[index - 1]}
                  />
                </div>
              }
              second={
                <div className="flex h-full w-full flex-col gap-3 overflow-y-auto bg-panel p-3.5 text-xs">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                    <label className="flex flex-col gap-1 text-muted">
                      <span>Arguments (JSON list, one per parameter)</span>
                      <input
                        value={args}
                        onChange={(e) => setArgs(e.target.value)}
                        className="rounded-lg border border-line bg-void px-3 py-1.5 font-mono text-xs text-chalk"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-muted">
                      <span>Parameter types</span>
                      <input
                        value={types}
                        onChange={(e) => setTypes(e.target.value)}
                        placeholder="any, ListNode, TreeNode…"
                        className="rounded-lg border border-line bg-void px-3 py-1.5 font-mono text-xs text-chalk"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-muted">
                      <span>Return type</span>
                      <select
                        value={returns}
                        onChange={(e) => setReturns(e.target.value)}
                        className="rounded-lg border border-line bg-void px-2 py-1.5 font-mono text-xs text-chalk"
                      >
                        {TYPES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {error && <ErrorNote message={error} />}
                  {output && (
                    <div className="rounded-xl border border-line bg-void p-3 font-mono text-xs">
                      {output.error ? (
                        <span className="text-crimson">
                          {output.error.type}
                          {output.error.line ? ` (line ${output.error.line})` : ''}: {output.error.message}
                        </span>
                      ) : (
                        <span>
                          <span className="font-sans text-muted">Returned: </span>
                          <span className="font-bold text-emerald">{JSON.stringify(output.value)}</span>
                        </span>
                      )}
                      {output.stdout && <pre className="mt-2 whitespace-pre-wrap text-muted">{output.stdout}</pre>}
                    </div>
                  )}
                </div>
              }
            />
          }
        />
      </div>
    </div>
  )
}

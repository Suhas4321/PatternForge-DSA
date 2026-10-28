import { ArrowRight } from 'lucide-react'
import type { QuestionDetail, TraceStep } from '../../api/types'
import type { NarratorResult } from '../../lib/narrator/types'
import { Markdown } from '../ui'
import VisualizerHost from '../visualizers/VisualizerHost'

interface DsPrimerInfo {
  dsName: string
  whatIsIt: string
  memoryModel: string
  pythonSyntax: { op: string; code: string; cost: string }[]
  howToKnowComplexity: string
}

const WORLD_DS_PRIMERS: Record<number, DsPrimerInfo> = {
  1: {
    dsName: 'Array (`list`), Hash Set (`set`) & Hash Map (`dict`)',
    whatIsIt:
      'An Array (`list`) stores items in contiguous slots indexed `0..N-1` (fast by index, slow `O(N)` to search by value). A Hash Map (`dict`) or Set (`set`) uses a hash function `hash(key) % buckets` to jump straight to the slot in `O(1)` average time.',
    memoryModel:
      'Instead of re-scanning the left side of the array with a second loop (`O(N²)`), a `dict` or `set` acts as instant O(1) memory of everything you have seen so far (`value -> index` or `value -> frequency_count`).',
    pythonSyntax: [
      { op: 'Create Hash Map / Set', code: 'seen = {}   # or set()', cost: 'O(1)' },
      { op: 'Check if key exists', code: 'if target in seen:', cost: 'O(1) avg' },
      { op: 'Tally frequency count', code: 'count[ch] = count.get(ch, 0) + 1', cost: 'O(1) avg' },
      { op: 'Iterate index + value', code: 'for i, x in enumerate(nums):', cost: 'O(N) total' },
    ],
    howToKnowComplexity:
      'Count the loops and operations: 1 single `for` loop over `N` elements × `O(1)` dict lookup per element = `O(N)` Time. Storing up to `N` keys in `dict` = `O(N)` Space (or `O(1)` if bounded to 26 lowercase letters `a-z`).',
  },
  2: {
    dsName: 'Two Pointers (`left`, `right`) on Contiguous Arrays',
    whatIsIt:
      'Two integer index variables (`l = 0, r = len(nums) - 1` or `slow = 0, fast = 0`) that walk through a single array in coordinated steps without allocating extra memory.',
    memoryModel:
      'When an array is sorted, comparing `nums[l] + nums[r]` against `target` lets you eliminate an entire row/column of pairs in `O(1)` time by moving `l += 1` (to increase sum) or `r -= 1` (to decrease sum).',
    pythonSyntax: [
      { op: 'Init converging pointers', code: 'l, r = 0, len(nums) - 1', cost: 'O(1) space' },
      { op: 'Converge inward', code: 'while l < r: ... l += 1 / r -= 1', cost: 'O(N) time' },
      { op: 'In-place swap', code: 'nums[l], nums[r] = nums[r], nums[l]', cost: 'O(1)' },
    ],
    howToKnowComplexity:
      'At every step, either `l` increases or `r` decreases. They can take at most `N` steps total before meeting (`l == r`), so Time is strictly `O(N)` and extra Space is `O(1)` (just 2 integer variables).',
  },
  3: {
    dsName: 'Sliding Window (`[l..r]` Subarray + Frequency State)',
    whatIsIt:
      'A dynamic subarray `[l..r]` that expands right (`r += 1`) to include new elements and shrinks from the left (`l += 1`) only when the window constraint is violated.',
    memoryModel:
      'Avoids recomputing subarray sums or character counts from scratch. Updating the window costs `O(1)` when `r` enters and `O(1)` when `l` leaves.',
    pythonSyntax: [
      { op: 'Expand right pointer', code: 'for r, x in enumerate(nums):', cost: 'O(N)' },
      { op: 'Shrink while invalid', code: 'while invalid_window: l += 1', cost: 'Amortized O(1)' },
      { op: 'Window length', code: 'best = max(best, r - l + 1)', cost: 'O(1)' },
    ],
    howToKnowComplexity:
      'Even though there is a `while` loop inside a `for` loop, `l` only moves forward from `0` to `N` across the entire run. Total steps = `N` expansions + at most `N` shrinks = `2N` = `O(N)` Time!',
  },
  4: {
    dsName: 'Stack (`list` LIFO) & Monotonic Stack',
    whatIsIt:
      'A Stack is a Last-In, First-Out (LIFO) list where `append(x)` and `pop()` happen at the top (`stack[-1]`) in O(1) time. A Monotonic Stack keeps its elements sorted (strictly increasing or decreasing) by popping elements that violate the order when a new item arrives.',
    memoryModel:
      'Used whenever you need the "next greater", "next smaller", or "nearest matching bracket" to your left/right. The moment an item is popped by `nums[i]`, you have discovered its exact boundary!',
    pythonSyntax: [
      { op: 'Push / Peek / Pop', code: 'stack.append(i); top = stack[-1]; stack.pop()', cost: 'O(1)' },
      { op: 'Monotonic pop loop', code: 'while stack and nums[stack[-1]] < x: idx = stack.pop()', cost: 'Amortized O(1)' },
    ],
    howToKnowComplexity:
      'Each index is pushed onto the stack once and popped at most once. `N` pushes + `<= N` pops = `2N` operations = `O(N)` Time and `O(N)` Space!',
  },
  5: {
    dsName: 'Binary Search (`[lo..hi]` Halving on Index or Answer Space)',
    whatIsIt:
      'Any monotonic condition (`False, False, ..., True, True`) allows you to check the midpoint `mid = (lo + hi) // 2` and discard half of the remaining search space in O(1) time.',
    memoryModel:
      'Works both on sorted arrays AND on "Binary Search on the Answer" (where `lo..hi` are candidate speeds/capacities `1..max(piles)` and `feasible(mid)` is an O(N) check).',
    pythonSyntax: [
      { op: 'Midpoint calculation', code: 'mid = (lo + hi) // 2', cost: 'O(1)' },
      { op: 'First-True boundary', code: 'if feasible(mid): hi = mid else: lo = mid + 1', cost: 'O(log M) steps' },
    ],
    howToKnowComplexity:
      'Halving a range of size `M` takes `log₂(M)` steps (for `10^9`, only ~30 steps!). Multiplying by the work per step (`O(1)` index check or `O(N)` feasibility scan) gives `O(log N)` or `O(N log M)` Time.',
  },
}

const DEFAULT_PRIMER: DsPrimerInfo = {
  dsName: 'Core Algorithmic Data Structure & State Invariant',
  whatIsIt:
    'Every optimal algorithm replaces redundant brute-force scanning with a structured state container (Hash Map, Stack, Heap, Linked List, Tree, Graph, or DP Table) that answers lookups or transitions in O(1) or O(log N) time.',
  memoryModel:
    'Look at the constraint N first: if N >= 10^4, O(N²) nested loops will exceed 10^8 operations and Time Limit Exceed (TLE). You must maintain an invariant that processes each element a constant number of times.',
  pythonSyntax: [
    { op: 'Deque (O(1) Queue/Stack)', code: 'q = deque([start]); q.popleft()', cost: 'O(1)' },
    { op: 'Min-Heap (Priority Queue)', code: 'heapq.heappush(h, x); heapq.heappop(h)', cost: 'O(log N)' },
    { op: 'Hash Map default list', code: 'graph = defaultdict(list)', cost: 'O(1)' },
  ],
  howToKnowComplexity:
    'Time Complexity = (Number of distinct states/nodes visited) × (Work done per state). Space Complexity = Maximum number of items stored in your auxiliary data structure + recursion call stack depth.',
}
interface Props {
  question: QuestionDetail
  steps: TraceStep[]
  stepIndex: number
  onSeek: (i: number) => void
  playing: boolean
  onTogglePlay: () => void
  onStepForward: () => void
  onStepBackward: () => void
  onJumpFirst: () => void
  onJumpLast: () => void
  speed: number
  onSpeedChange: (s: number) => void
  narration?: NarratorResult
  onProceedToCode: () => void
}

export default function DataStructurePrimer({
  question,
  steps,
  stepIndex,
  onSeek,
  playing,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onJumpFirst,
  onJumpLast,
  speed,
  onSpeedChange,
  narration,
  onProceedToCode,
}: Props) {
  const content = question.content!
  const primer = WORLD_DS_PRIMERS[question.world_id] ?? DEFAULT_PRIMER

  return (
    <div className="mx-auto max-w-[820px] px-6 py-10 text-chalk">
      {/* Top Editorial Header */}
      <div className="border-b border-line pb-7">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            Data Structure & Concept Guide · World {question.world_id}: {question.world_name}
          </span>

          <button
            type="button"
            onClick={onProceedToCode}
            className="inline-flex items-center gap-1.5 rounded-md bg-chalk px-3 py-1.5 text-xs font-semibold text-void hover:opacity-90"
          >
            <span>Open Code Terminal</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
          {primer.dsName.replace(/`/g, '')}
        </h1>
        <p className="mt-2.5 text-sm sm:text-[15px] leading-relaxed text-muted">
          {primer.whatIsIt.replace(/`/g, '')}
        </p>
      </div>

      {/* Section 1: Core Data Structure & Python Operations Table */}
      <section className="border-b border-line py-7 space-y-4">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs font-semibold text-chalk">
            1
          </span>
          <span>Python Data Structure Operations & Time Cost</span>
        </h2>

        <p className="text-sm leading-relaxed text-muted">
          {primer.memoryModel.replace(/`/g, '')}
        </p>

        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-panel text-xs font-semibold text-muted">
                <th className="py-2.5 px-4 w-52">Operation</th>
                <th className="py-2.5 px-4">Python Idiom</th>
                <th className="py-2.5 px-4 w-28 text-right">Time Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-sm">
              {primer.pythonSyntax.map((s) => (
                <tr key={s.op}>
                  <td className="py-2.5 px-4 font-medium text-chalk">{s.op}</td>
                  <td className="py-2.5 px-4 font-mono text-xs text-muted">
                    <code className="rounded border border-line bg-panel-2 px-1.5 py-0.5 text-chalk">
                      {s.code}
                    </code>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-xs text-chalk">{s.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Why Brute Force Fails & How to Read Constraints */}
      <section className="border-b border-line py-7 space-y-4">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs font-semibold text-chalk">
            2
          </span>
          <span>Why Brute Force Fails & How We Derive Complexity</span>
        </h2>

        <div className="space-y-2 text-sm leading-relaxed text-muted">
          <p>
            <strong className="font-semibold text-chalk">
              Brute Force Bottleneck ({content.concept.brute_force_complexity}):
            </strong>{' '}
            {content.concept.brute_force}
          </p>
          <p>
            <strong className="font-semibold text-chalk">How We Know the Complexity:</strong>{' '}
            {primer.howToKnowComplexity.replace(/`/g, '')}
          </p>
        </div>

        <blockquote className="rounded-r-md border-l-[3px] border-muted/60 bg-panel px-4 py-3.5 text-sm leading-relaxed text-chalk">
          <strong className="block text-xs font-mono uppercase tracking-wider text-muted mb-1">
            Key Insight ({question.patterns.join(' · ')})
          </strong>
          <Markdown>{content.concept.key_insight}</Markdown>
        </blockquote>

        {/* Clean Monochrome Constraints & Production Context Table */}
        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-panel text-xs font-semibold text-muted">
                <th className="py-2.5 px-4 w-56">Input Constraints</th>
                <th className="py-2.5 px-4 w-48">Target Complexity</th>
                <th className="py-2.5 px-4">Production Engineering Application</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-sm">
              <tr>
                <td className="py-3 px-4 font-mono text-xs text-chalk align-top">
                  <ul className="space-y-1">
                    {content.statement.constraints.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-chalk align-top space-y-1.5">
                  <div>
                    <span className="text-muted">Time: </span>
                    <code className="rounded border border-line bg-panel-2 px-1.5 py-0.5">
                      {content.solution.time.split(' — ')[0]}
                    </code>
                  </div>
                  <div>
                    <span className="text-muted">Space: </span>
                    <code className="rounded border border-line bg-panel-2 px-1.5 py-0.5">
                      {content.solution.space.split(' — ')[0]}
                    </code>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted text-xs leading-relaxed align-top">
                  <Markdown>{content.concept.real_world}</Markdown>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Full-Width Interactive Step-by-Step Visual Walkthrough */}
      <section className="py-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-chalk">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-panel-3 font-mono text-xs font-semibold text-chalk">
              3
            </span>
            <span>Interactive Step-by-Step Visual Walkthrough</span>
          </h2>
          <span className="font-mono text-xs text-muted">
            Step through how {primer.dsName.split('(')[0].trim()} processes the demo input
          </span>
        </div>

        <div className="stage overflow-hidden rounded-md border border-line">
          <VisualizerHost
            kind={question.visualizer}
            title={content.viz?.title || `${question.title} · Step-by-Step Visual Demo`}
            timeComplexity={content.viz?.complexity?.time || content.solution.time.split(' — ')[0]}
            spaceComplexity={content.viz?.complexity?.space || content.solution.space.split(' — ')[0]}
            step={steps[stepIndex] ?? { event: 'line', line: 1, func: content.function.name, depth: 0, frames: [], heap: {} }}
            prev={stepIndex > 0 ? steps[stepIndex - 1] : undefined}
            steps={steps}
            index={stepIndex}
            config={content.viz || {}}
            code={content.solution.code}
            narration={narration}
            caption={narration?.caption}
            why={narration?.why}
            comparisons={narration?.counters.comparisons}
            swaps={narration?.counters.swaps}
            writes={narration?.counters.writes}
            playing={playing}
            onTogglePlay={onTogglePlay}
            onStepForward={onStepForward}
            onStepBackward={onStepBackward}
            onJumpFirst={onJumpFirst}
            onJumpLast={onJumpLast}
            onSeek={onSeek}
            speed={speed}
            onSpeedChange={onSpeedChange}
          />
        </div>
      </section>
    </div>
  )
}


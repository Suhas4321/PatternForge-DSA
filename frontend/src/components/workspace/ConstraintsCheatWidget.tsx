import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  ExternalLink,
  Layers,
  Maximize2,
  Play,
  Sliders,
  Sparkles,
  Video,
  X,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'

interface ConstraintTier {
  limit: string
  limitDisplay: string
  timeComplexity: string
  spaceComplexity: string
  timeBadgeClass: string
  spaceBadgeClass: string
  category: 'Exponential' | 'Cubic' | 'Quadratic' | 'Linearithmic' | 'Sub-Linear'
  techniques: string
  description: string
  matcher: (raw: string) => boolean
}

const HARDWARE_TIERS: ConstraintTier[] = [
  {
    limit: 'N ≤ 10',
    limitDisplay: 'N ≤ 10',
    timeComplexity: 'O(N!) or O(2ᴺ)',
    spaceComplexity: 'O(N) stack',
    timeBadgeClass: 'border-crimson/50 bg-crimson/15 text-crimson shadow-[0_0_10px_rgba(251,113,133,0.3)]',
    spaceBadgeClass: 'border-amber/40 bg-amber/15 text-amber',
    category: 'Exponential',
    techniques: 'Backtracking, Permutations, Subsets',
    description: 'Max ~3.6M ops. Permutations or power sets acceptable.',
    matcher: (raw) => /N\s*≤\s*10(?!\d)/i.test(raw) || /length\s*≤\s*10(?!\d)/i.test(raw),
  },
  {
    limit: 'N ≤ 20',
    limitDisplay: 'N ≤ 20',
    timeComplexity: 'O(2ᴺ)',
    spaceComplexity: 'O(2ᴺ) or O(N)',
    timeBadgeClass: 'border-oxide/50 bg-oxide/15 text-oxide shadow-[0_0_10px_rgba(251,113,133,0.25)]',
    spaceBadgeClass: 'border-amber/40 bg-amber/15 text-amber',
    category: 'Exponential',
    techniques: 'Bitmask DP, Recursive DFS with Memoization',
    description: '2²⁰ ≈ 1.05×10⁶ ops. Bitmask state space fits in CPU cache.',
    matcher: (raw) => /N\s*≤\s*20(?!\d)/i.test(raw) || /length\s*≤\s*20(?!\d)/i.test(raw),
  },
  {
    limit: 'N ≤ 500',
    limitDisplay: 'N ≤ 500',
    timeComplexity: 'O(N³)',
    spaceComplexity: 'O(N²) or O(N)',
    timeBadgeClass: 'border-rust/50 bg-rust/15 text-rust shadow-[0_0_10px_rgba(251,146,60,0.25)]',
    spaceBadgeClass: 'border-sky-500/40 bg-sky-500/15 text-sky-400',
    category: 'Cubic',
    techniques: 'Floyd-Warshall, 3D Dynamic Programming',
    description: '500³ = 1.25×10⁸ ops. Upper limit for triple nested loops.',
    matcher: (raw) => /N\s*≤\s*500/i.test(raw) || /length\s*≤\s*500/i.test(raw),
  },
  {
    limit: 'N ≤ 5,000',
    limitDisplay: 'N ≤ 5,000',
    timeComplexity: 'O(N²)',
    spaceComplexity: 'O(N) or O(1)',
    timeBadgeClass: 'border-amber/50 bg-amber/15 text-amber shadow-[0_0_10px_rgba(242,184,102,0.25)]',
    spaceBadgeClass: 'border-cyan/40 bg-cyan/15 text-cyan',
    category: 'Quadratic',
    techniques: 'Nested Loops, 2D DP, All-Pairs Comparison',
    description: '5,000² = 2.5×10⁷ ops. Safe under 1.0s limit; fails on N > 10⁴.',
    matcher: (raw) => /N\s*≤\s*5,?000/i.test(raw) || /length\s*≤\s*5,?000/i.test(raw) || /N\s*≤\s*1000/i.test(raw),
  },
  {
    limit: 'N ≤ 10⁵ (or 2×10⁴)',
    limitDisplay: 'N ≤ 10⁵',
    timeComplexity: 'O(N log N) / O(N)',
    spaceComplexity: 'O(N) or O(1)',
    timeBadgeClass: 'border-cyan/50 bg-cyan/15 text-cyan shadow-[0_0_12px_rgba(56,189,248,0.35)]',
    spaceBadgeClass: 'border-emerald/40 bg-emerald/15 text-emerald',
    category: 'Linearithmic',
    techniques: 'Two Pointers, Sliding Window, Prefix Sum + Map, Sort',
    description: '10⁵ log₂(10⁵) ≈ 1.7×10⁶ ops. Optimal LeetCode target bracket.',
    matcher: (raw) => /10[\^⁴45⁵]|100,?000|2\s*[×x*]\s*10|20,?000/i.test(raw),
  },
  {
    limit: 'N ≥ 10⁹',
    limitDisplay: 'N ≥ 10⁹',
    timeComplexity: 'O(log N) or O(1)',
    spaceComplexity: 'O(1)',
    timeBadgeClass: 'border-emerald/50 bg-emerald/15 text-emerald-hi shadow-[0_0_12px_rgba(16,185,129,0.35)]',
    spaceBadgeClass: 'border-emerald/40 bg-emerald/15 text-emerald',
    category: 'Sub-Linear',
    techniques: 'Binary Search, Math Formulae, Bitwise Hacks',
    description: 'log₂(10⁹) ≈ 30 ops. Single-iteration or logarithmic search.',
    matcher: (raw) => /10[\^⁹9]|1,?000,?000,?000/i.test(raw),
  },
]

interface GrowthTier {
  complexity: string
  title: string
  subtitle: string
  colorBadge: string
  glowBorder: string
  scaleRule: string
  doublingEffect: string
  realWorld: string
  exampleCode: string
  opsAt1M: string
  timeAt1M: string
  statusAt1M: 'Instant' | 'Lightning' | 'Fair' | 'TLE Crash'
}

const GROWTH_TIERS: GrowthTier[] = [
  {
    complexity: 'O(1)',
    title: 'Instant / Constant',
    subtitle: "Data size doesn't matter at all.",
    colorBadge: 'border-emerald/50 bg-emerald/15 text-emerald',
    glowBorder: 'border-emerald/40 hover:border-emerald',
    scaleRule: '1 item or 10,000,000 items finish in the exact same time.',
    doublingEffect: 'Data × 2 → +0 steps (Zero extra time added)',
    realWorld: 'Dictionary/Hash map lookup, array index access (arr[0]), stack push/pop.',
    exampleCode: 'return hash_map.get(key) // Direct memory address offset',
    opsAt1M: '1 op',
    timeAt1M: '< 0.001 ms',
    statusAt1M: 'Instant',
  },
  {
    complexity: 'O(log n)',
    title: 'Lightning Fast / Logarithmic',
    subtitle: 'Halves the problem search space at every single step.',
    colorBadge: 'border-cyan/50 bg-cyan/15 text-cyan',
    glowBorder: 'border-cyan/40 hover:border-cyan',
    scaleRule: 'Doubling data adds just 1 single step!',
    doublingEffect: 'Data × 2 → +1 step (Logarithmic growth)',
    realWorld: 'Binary Search in sorted arrays, looking up words in a dictionary, balanced BST search.',
    exampleCode: 'while left <= right: mid = (left + right) // 2',
    opsAt1M: '≈ 20 ops',
    timeAt1M: '< 0.001 ms',
    statusAt1M: 'Lightning',
  },
  {
    complexity: 'O(n)',
    title: 'Fair / Linear',
    subtitle: 'One loop through the data. Data × 10 = Time × 10.',
    colorBadge: 'border-sky-500/50 bg-sky-500/15 text-sky-400',
    glowBorder: 'border-sky-500/40 hover:border-sky-500',
    scaleRule: 'Touches each item once in a single smooth sweep.',
    doublingEffect: 'Data × 10 → Time × 10 (Strict linear proportionality)',
    realWorld: 'Standard for loop, counting character frequencies, sliding window, two-pointer scan.',
    exampleCode: 'for num in nums: current_sum += num',
    opsAt1M: '1,000,000 ops',
    timeAt1M: '≈ 10 ms',
    statusAt1M: 'Fair',
  },
  {
    complexity: 'O(n²)',
    title: 'Slow / Quadratic',
    subtitle: 'Loop inside a loop. Avoid if possible! Data × 10 = Time × 100.',
    colorBadge: 'border-amber/50 bg-amber/15 text-amber',
    glowBorder: 'border-amber/40 hover:border-amber',
    scaleRule: 'Compares every element against every other element.',
    doublingEffect: 'Data × 10 → Time × 100 (Explosive quadratic blowup)',
    realWorld: 'Nested for loops, bubble sort, naive all-pairs distance comparison.',
    exampleCode: 'for i in range(n): for j in range(n): compare(i, j)',
    opsAt1M: '1,000,000,000,000 ops (10¹²)',
    timeAt1M: '≈ 2.7 Hours',
    statusAt1M: 'TLE Crash',
  },
]

interface RuleOfThumb {
  constraint: string
  constraintDisplay: string
  targetBigO: string
  verdict: string
  ruleExplanation: string
  techniques: string[]
  badgeClass: string
  isMatched: boolean
}

export default function ConstraintsCheatWidget({ constraints = [] }: { constraints?: string[] }) {
  const [activeTab, setActiveTab] = useState<'growth' | 'rules' | 'hardware'>('growth')
  const [isVideoDrawerOpen, setIsVideoDrawerOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [simulatedN, setSimulatedN] = useState<number>(100_000)

  const rawText = constraints.join(' ')

  // Deduce constraint match
  const activeHardwareIndex = useMemo(() => {
    const idx = HARDWARE_TIERS.findIndex((t) => t.matcher(rawText))
    return idx !== -1 ? idx : 4 // Default to O(N log N) / O(N)
  }, [rawText])

  const targetHardwareTier = HARDWARE_TIERS[activeHardwareIndex]

  // Detect which of the 3 Rule-of-Thumb brackets matches the question
  const matchedRuleIndex = useMemo(() => {
    if (/N\s*≤\s*(10|15|20)(?!\d)/i.test(rawText) || /length\s*≤\s*(10|15|20)(?!\d)/i.test(rawText)) {
      return 2 // N <= 20
    }
    if (
      /N\s*≤\s*(500|1,?000|2,?000|3,?000|5,?000)(?!\d)/i.test(rawText) ||
      /length\s*≤\s*(500|1,?000|2,?000|3,?000|5,?000)(?!\d)/i.test(rawText)
    ) {
      return 1 // N <= 10^3
    }
    return 0 // N <= 10^7 / 10^5 (standard)
  }, [rawText])

  const rulesOfThumb: RuleOfThumb[] = [
    {
      constraint: 'N ≤ 10⁷ (or 10⁵)',
      constraintDisplay: 'If N ≤ 10⁷',
      targetBigO: 'Needs O(N) or O(N log N)',
      verdict: 'Strictly Linear / Fast Sort. Any nested loop will TLE!',
      ruleExplanation:
        'Standard LeetCode bracket. Benchmark computers execute ~10⁸ ops/sec. A single pass takes ~10ms. A nested loop (10⁵ × 10⁵ = 10¹⁰ ops) takes 100 seconds and crashes with Time Limit Exceeded (TLE).',
      techniques: ['Hash Map (Lookup in O(1))', 'Two Pointers (Monotonic)', 'Sliding Window', 'O(N log N) Sorting'],
      badgeClass: 'border-cyan/50 bg-cyan/15 text-cyan',
      isMatched: matchedRuleIndex === 0,
    },
    {
      constraint: 'N ≤ 10³ (1,000)',
      constraintDisplay: 'If N ≤ 10³',
      targetBigO: 'O(N²) is acceptable',
      verdict: 'Quadratic is safe. Nested loops are completely fine.',
      ruleExplanation:
        'When N ≤ 1,000, an O(N²) nested loop performs only 1,000 × 1,000 = 1,000,000 (10⁶) operations. This finishes effortlessly in ~10 milliseconds (well below the 10⁸ ops/sec hardware ceiling).',
      techniques: ['Nested Loops (for i, for j)', '2D Dynamic Programming', 'Matrix Traversal', 'All-Pairs Checking'],
      badgeClass: 'border-amber/50 bg-amber/15 text-amber',
      isMatched: matchedRuleIndex === 1,
    },
    {
      constraint: 'N ≤ 20',
      constraintDisplay: 'If N ≤ 20',
      targetBigO: 'O(2ᴺ) or O(N!) Backtracking',
      verdict: 'Exponential allowed. Explore all combinations/subsets.',
      ruleExplanation:
        'When N ≤ 20, 2²⁰ ≈ 1,048,576 operations. Because the input size is so tiny, the interviewer expects you to explore every combination using recursion, backtracking, or bitmask states.',
      techniques: ['DFS Backtracking', 'Generating Permutations/Subsets', 'Recursive Search + Memo', 'Bitmask DP'],
      badgeClass: 'border-crimson/50 bg-crimson/15 text-crimson',
      isMatched: matchedRuleIndex === 2,
    },
  ]

  // Calculate live operations for simulator
  const simOps = useMemo(() => {
    const n = simulatedN
    return {
      o1: { ops: '1 op', time: '< 0.001 ms', status: 'Instant' },
      ologn: {
        ops: `${Math.ceil(Math.log2(Math.max(2, n)))} ops`,
        time: '< 0.001 ms',
        status: 'Lightning',
      },
      on: {
        ops: `${n.toLocaleString()} ops`,
        time: `${(n / 100_000).toFixed(2)} ms`,
        status: n > 10_000_000 ? 'Warning' : 'Fast',
      },
      on2: {
        ops: `${(n * n).toLocaleString()} ops`,
        time: n <= 1000 ? `${((n * n) / 100_000).toFixed(1)} ms` : `${((n * n) / 100_000_000).toFixed(1)} sec (TLE!)`,
        status: n <= 1000 ? 'Safe' : 'TLE Crash',
      },
    }
  }, [simulatedN])

  return (
    <div className="pf-telemetry-panel rounded-2xl p-4 sm:p-5 text-xs text-muted w-full font-mono border border-line bg-panel shadow-sm">
      {/* 1. Header & Live Telemetry Bound */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3.5 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan/40 bg-cyan/15 text-cyan shadow-[0_0_12px_rgba(56,189,248,0.3)]">
            <Cpu size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-plate text-xs font-bold uppercase tracking-wider text-chalk">
                Growth & Scale Guide
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald/50 bg-emerald/10 px-2 py-0.5 text-caption font-semibold text-emerald">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald pf-beacon" />
                <span>10⁸ ops/sec clock</span>
              </span>
            </div>
            <p className="font-sans text-2xs text-faint">
              Plain-English Big-O intuition & hardware thresholds before you write code.
            </p>
          </div>
        </div>

        {/* Video Tutorial Trigger Button & Target Match */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVideoDrawerOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-2xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all hover:scale-[1.02] shadow-[0_0_12px_rgba(244,63,94,0.15)]"
            title="Watch CS Dojo 10-minute Big-O tutorial"
          >
            <Play size={12} className="fill-current text-rose-400" />
            <span>Watch 10-Min Primer</span>
            {isVideoDrawerOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-2xs text-cyan">
            <Sparkles size={12} className="animate-pulse" />
            <span className="text-faint font-sans">TARGET:</span>
            <strong className="text-chalk font-mono font-bold">{targetHardwareTier.timeComplexity}</strong>
          </div>
        </div>
      </div>

      {/* 2. Embedded Video Learning Drawer ("Watch & Understand") */}
      {isVideoDrawerOpen && (
        <div className="mb-4 rounded-2xl border border-rose-500/30 bg-panel-2/90 p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                <Video size={13} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-plate text-xs font-bold text-chalk">
                    CS Dojo: Introduction to Big O Notation
                  </h5>
                  <span className="rounded-full bg-line/60 px-2 py-0.5 text-caption font-mono text-faint">
                    10:35 mins
                  </span>
                </div>
                <p className="font-sans text-2xs text-muted">
                  Clear visual guide to time complexity by YK Sugishita (Ex-Google Software Engineer).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 text-2xs text-muted hover:text-chalk px-2 py-1 rounded-md hover:bg-line/30 transition-colors"
                title="Expand to theater modal"
              >
                <Maximize2 size={12} />
                <span>Theater Mode</span>
              </button>
              <a
                href="https://www.youtube.com/watch?v=mV3wrLBbuuE"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-2xs text-cyan hover:underline px-2 py-1"
                title="Open directly on YouTube"
              >
                <span>YouTube</span>
                <ExternalLink size={12} />
              </a>
              <button
                onClick={() => setIsVideoDrawerOpen(false)}
                className="p-1 text-faint hover:text-chalk rounded-md hover:bg-line/30"
                title="Close video drawer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Embedded YouTube Iframe (Inline Player) */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-surface-0 shadow-inner">
            <iframe
              src="https://www.youtube-nocookie.com/embed/mV3wrLBbuuE?rel=0"
              title="CS Dojo: Introduction to Big O Notation"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Key Takeaways Bar */}
          <div className="mt-3 grid gap-2 sm:grid-cols-3 font-sans text-2xs text-muted border-t border-line/40 pt-2.5">
            <div className="flex items-start gap-1.5">
              <span className="text-cyan font-bold">•</span>
              <span>
                <strong className="text-chalk">Input Growth Rate:</strong> Big-O measures how operations scale as N → ∞, not stopwatch seconds.
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-amber font-bold">•</span>
              <span>
                <strong className="text-chalk">Drop Constants:</strong> O(2n + 5) simplifies to O(n) because 2x is negligible compared to n².
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald font-bold">•</span>
              <span>
                <strong className="text-chalk">10⁸ Ops Limit:</strong> A loop over 10⁵ items is ~10ms, but a nested loop is 100 seconds (TLE).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-line pb-2 mb-3 font-sans">
        <button
          onClick={() => setActiveTab('growth')}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'growth'
              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-xs'
              : 'text-muted hover:text-chalk hover:bg-panel-2'
          }`}
        >
          <Sparkles size={13} />
          <span>Plain English Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'rules'
              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-xs'
              : 'text-muted hover:text-chalk hover:bg-panel-2'
          }`}
        >
          <Zap size={13} />
          <span>Rule of Thumb (N Size)</span>
          <span className="ml-1 rounded-full bg-cyan/20 px-1.5 py-0.2 text-caption text-cyan font-mono font-bold">
            Matched
          </span>
        </button>

        <button
          onClick={() => setActiveTab('hardware')}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'hardware'
              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-xs'
              : 'text-muted hover:text-chalk hover:bg-panel-2'
          }`}
        >
          <Layers size={13} />
          <span>Hardware Limits</span>
        </button>
      </div>

      {/* 4. Tab 1: Plain English Growth & Scale Guide */}
      {activeTab === 'growth' && (
        <div className="space-y-3">
          {/* 4 Core Plain-English Growth Cards */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {GROWTH_TIERS.map((tier) => (
              <div
                key={tier.complexity}
                className={`flex flex-col justify-between rounded-xl border p-3 bg-panel-2/50 transition-all ${tier.glowBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 font-mono text-xs font-bold ${tier.colorBadge}`}>
                      {tier.complexity}
                    </span>
                    <span className="font-plate text-xs font-bold text-chalk truncate">
                      {tier.title}
                    </span>
                  </div>

                  <p className="font-sans text-xs text-chalk/90 font-medium leading-snug mb-2">
                    {tier.subtitle}
                  </p>

                  <div className="space-y-1 text-2xs font-sans text-muted">
                    <div className="flex items-start gap-1.5">
                      <span className="text-cyan font-mono shrink-0">Rule:</span>
                      <span>{tier.scaleRule}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber font-mono shrink-0">Scale:</span>
                      <span className="text-chalk/80 font-mono text-caption">{tier.doublingEffect}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-line/40 text-2xs font-sans">
                  <div className="text-faint line-clamp-1 mb-1">
                    <strong className="text-chalk font-mono font-normal">Examples: </strong>
                    {tier.realWorld}
                  </div>
                  <code className="block rounded-lg bg-surface-0 px-2 py-1 font-mono text-caption text-sky-300 truncate border border-line/50">
                    {tier.exampleCode}
                  </code>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Data Scale Simulator */}
          <div className="rounded-xl border border-line bg-panel-2/60 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sliders size={13} className="text-cyan" />
                <span className="font-plate text-xs font-bold text-chalk">
                  Interactive Scale Simulator: What happens when N grows?
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-2xs text-faint font-sans mr-1">Preset N:</span>
                {[10, 1_000, 100_000, 1_000_000].map((nVal) => (
                  <button
                    key={nVal}
                    onClick={() => setSimulatedN(nVal)}
                    className={`rounded-lg px-2 py-0.5 font-mono text-caption font-semibold transition-colors ${
                      simulatedN === nVal
                        ? 'bg-cyan text-slate-950 font-bold'
                        : 'bg-surface-0 text-muted hover:text-chalk border border-line'
                    }`}
                  >
                    {nVal >= 1_000_000 ? '10⁶' : nVal >= 100_000 ? '10⁵' : nVal >= 1000 ? '10³' : '10'}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Comparison Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs font-mono">
              <div className="rounded-lg bg-surface-0 border border-line/60 p-2">
                <div className="text-faint">O(1) Constant</div>
                <div className="text-emerald font-bold mt-0.5">{simOps.o1.ops}</div>
                <div className="text-caption text-faint">{simOps.o1.time}</div>
              </div>

              <div className="rounded-lg bg-surface-0 border border-line/60 p-2">
                <div className="text-faint">O(log n) Fast</div>
                <div className="text-cyan font-bold mt-0.5">{simOps.ologn.ops}</div>
                <div className="text-caption text-faint">{simOps.ologn.time}</div>
              </div>

              <div className="rounded-lg bg-surface-0 border border-line/60 p-2">
                <div className="text-faint">O(n) Linear</div>
                <div className="text-sky-400 font-bold mt-0.5">{simOps.on.ops}</div>
                <div className="text-caption text-faint">{simOps.on.time}</div>
              </div>

              <div className={`rounded-lg bg-surface-0 border p-2 ${simulatedN > 1000 ? 'border-crimson/50 bg-crimson/[0.05]' : 'border-line/60'}`}>
                <div className="text-faint">O(n²) Quadratic</div>
                <div className={simulatedN > 1000 ? 'text-crimson font-bold mt-0.5' : 'text-amber font-bold mt-0.5'}>
                  {simOps.on2.ops}
                </div>
                <div className={simulatedN > 1000 ? 'text-crimson font-semibold text-caption' : 'text-caption text-faint'}>
                  {simOps.on2.time}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Rule of Thumb (N Size Mapping) */}
      {activeTab === 'rules' && (
        <div className="space-y-2.5">
          {rulesOfThumb.map((rule) => (
            <div
              key={rule.constraint}
              className={`relative flex flex-col gap-2 rounded-xl border p-3.5 transition-all ${
                rule.isMatched
                  ? 'border-cyan/60 bg-cyan/10 text-chalk shadow-[0_0_24px_-4px_rgba(56,189,248,0.25)] ring-1 ring-cyan/40'
                  : 'border-line/60 bg-panel-2/40 text-muted opacity-85 hover:border-line hover:opacity-100'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 font-mono text-xs font-bold ${rule.badgeClass}`}
                  >
                    {rule.constraintDisplay}
                  </span>
                  <span className="font-plate text-xs font-bold text-chalk">
                    → {rule.targetBigO}
                  </span>
                </div>

                {rule.isMatched && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/50 bg-cyan/20 px-2.5 py-0.5 font-mono text-2xs font-bold text-cyan uppercase tracking-wider">
                    <CheckCircle2 size={12} className="text-cyan" />
                    Matched Current Question
                  </span>
                )}
              </div>

              <div className="font-sans text-xs text-chalk/90 font-medium">
                {rule.verdict}
              </div>

              <p className="font-sans text-2xs text-muted leading-relaxed">
                {rule.ruleExplanation}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-line/40 font-sans text-2xs">
                <span className="text-faint font-mono">Applicable Tools:</span>
                {rule.techniques.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-line bg-surface-0 px-2 py-0.5 font-mono text-caption text-chalk/80"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. Tab 3: Detailed Hardware Tiers Matrix */}
      {activeTab === 'hardware' && (
        <div className="space-y-2">
          {HARDWARE_TIERS.map((tier, idx) => {
            const isTarget = idx === activeHardwareIndex
            return (
              <div
                key={tier.limit}
                className={`relative flex flex-col gap-2 rounded-xl border p-3 transition-all ${
                  isTarget
                    ? 'border-cyan/60 bg-cyan/10 text-chalk shadow-[0_0_24px_-4px_rgba(56,189,248,0.25)] ring-1 ring-cyan/40'
                    : 'border-line/60 bg-panel-2/40 text-muted opacity-80 hover:border-line hover:opacity-100'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex items-center rounded-lg border px-2 py-0.5 font-mono text-2xs font-bold ${
                        isTarget ? 'border-cyan bg-cyan/20 text-cyan shadow-sm' : 'border-line bg-panel text-faint'
                      }`}
                    >
                      {tier.limitDisplay}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 font-mono text-xs font-bold ${tier.timeBadgeClass}`}
                    >
                      <Zap size={11} />
                      <span>TIME: {tier.timeComplexity}</span>
                    </span>

                    <span
                      className={`inline-flex items-center rounded-lg border px-2 py-0.5 font-mono text-2xs font-semibold ${tier.spaceBadgeClass}`}
                    >
                      SPACE: {tier.spaceComplexity}
                    </span>
                  </div>

                  {isTarget && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan/40 bg-cyan/20 px-2.5 py-0.5 font-mono text-2xs font-bold text-cyan uppercase tracking-wider">
                      <CheckCircle2 size={11} className="text-cyan" />
                      Active Question Bound
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 font-sans text-2xs text-muted border-t border-line/40 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-faint font-mono">Techniques:</span>
                    <span className={isTarget ? 'text-chalk font-medium' : 'text-muted'}>
                      {tier.techniques}
                    </span>
                  </div>
                  <span className="font-mono text-faint text-caption">
                    {tier.description}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 7. Bottom Invariant Bar */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/70 bg-panel-2/60 p-2.5 font-sans text-2xs text-muted">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-cyan shrink-0" />
          <span>
            <strong className="text-chalk">Algorithmic Invariant:</strong> At 10⁸ ops/sec, an algorithm taking{' '}
            <code className="text-cyan font-mono">{targetHardwareTier.timeComplexity}</code> executes within{' '}
            <span className="text-emerald font-semibold">&lt; 150 milliseconds</span>.
          </span>
        </div>
      </div>

      {/* 8. Full Theater Modal for Video Tutorial */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-3xl border border-line bg-panel p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                  <Video size={16} />
                </span>
                <div>
                  <h3 className="font-plate text-sm font-bold text-chalk">
                    CS Dojo: Introduction to Big O Notation
                  </h3>
                  <p className="font-sans text-2xs text-muted">
                    Full video breakdown without leaving your problem workspace.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://www.youtube.com/watch?v=mV3wrLBbuuE"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-line bg-panel-2 px-3 py-1.5 text-xs text-cyan hover:text-white transition-colors"
                >
                  <span>Open on YouTube</span>
                  <ExternalLink size={13} />
                </a>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-line p-1.5 text-muted hover:text-chalk hover:bg-panel-2 transition-colors"
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-surface-0 shadow-2xl">
              <iframe
                src="https://www.youtube-nocookie.com/embed/mV3wrLBbuuE?autoplay=1&rel=0"
                title="CS Dojo: Introduction to Big O Notation"
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-sans text-muted bg-panel-2/50 p-3 rounded-xl border border-line/50">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-cyan" />
                <span>Duration: 10 minutes 35 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber" />
                <span>Key takeaway: If N ≤ 10⁵, nested loops will fail LeetCode judge.</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full bg-cyan px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan/90 transition-all"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

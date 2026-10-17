'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Compass,
  CornerDownLeft,
  Flame,
  HelpCircle,
  Lightbulb,
  LockKeyhole,
  Moon,
  Play,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Sun,
  Timer,
  Trophy,
  X,
  XCircle,
  Zap,
} from 'lucide-react'

// ------------------------------------------------------------------------------------------
// Deterministic Session & Practice Model
// ------------------------------------------------------------------------------------------

export type SessionState = 'idle' | 'ready' | 'running' | 'incorrect' | 'correct' | 'explanation' | 'completed'
export type ConfidenceLevel = 'needs-practice' | 'solid' | 'mastered'

interface TestCase {
  id: number
  input: string
  expected: number
  description: string
  isEdgeCase?: boolean
}

const TEST_CASES: TestCase[] = [
  { id: 1, input: 'abcabcbb', expected: 3, description: 'Standard repeating pattern ("abc")' },
  { id: 2, input: 'bbbbb', expected: 1, description: 'All identical characters ("b")' },
  { id: 3, input: 'pwwkew', expected: 3, description: 'Subsequence vs substring distinction ("wke")' },
  { id: 4, input: '', expected: 0, description: 'Empty string edge case', isEdgeCase: true },
  { id: 5, input: 'abba', expected: 2, description: 'Left pointer backward regression trap', isEdgeCase: true },
]

const STARTER_CODE = `def length_of_longest_substring(s: str) -> int:
    """
    Given a string s, find the length of the longest substring
    without repeating characters using a sliding window.
    """
    char_map = {}
    left = 0
    max_len = 0
    
    for right, ch in enumerate(s):
        # TODO: If ch seen and inside current window, adjust left pointer
        if ch in char_map and char_map[ch] >= left:
            left = char_map[ch] + 1
        
        char_map[ch] = right
        max_len = max(max_len, right - left + 1)
        
    return max_len
`

const BUGGY_STARTER = `def length_of_longest_substring(s: str) -> int:
    char_map = {}
    left = 0
    max_len = 0
    
    for right, ch in enumerate(s):
        # BUG: Missing the check: char_map[ch] >= left
        # This will fail on input "abba" because left jumps backwards!
        if ch in char_map:
            left = char_map[ch] + 1
            
        char_map[ch] = right
        max_len = max(max_len, right - left + 1)
        
    return max_len
`

const HINTS = [
  {
    step: 1,
    title: 'The Window Invariant',
    text: 'Every character inside the window s[left:right+1] must be distinct. Expand right greedily. When a duplicate is detected, contract left until uniqueness is restored.',
  },
  {
    step: 2,
    title: 'The Direct Jump Optimization',
    text: 'Instead of incrementing left by 1 in a while loop, store each character’s last seen index in a dictionary. When a duplicate appears, jump left directly to char_map[ch] + 1.',
  },
  {
    step: 3,
    title: 'The "abba" Regression Trap',
    text: 'Watch out: if char_map[ch] is behind your current left pointer, jumping to it would slide left backwards! Always ensure left = max(left, char_map[ch] + 1) or check char_map[ch] >= left.',
  },
]

const NODES = [
  { x: 13, y: 73, label: 'Base Camp', sub: 'Arrays & Hashing', state: 'done', color: '#10b981' },
  { x: 30, y: 55, label: 'Signal Ridge', sub: 'Two Pointers', state: 'done', color: '#10b981' },
  { x: 47, y: 66, label: 'Pattern Pass', sub: 'Sliding Window', state: 'active', color: '#06b6d4' },
  { x: 64, y: 39, label: 'Graph Gate', sub: 'BFS & DFS', state: 'locked', color: '#8b5cf6' },
  { x: 80, y: 23, label: 'The Summit', sub: 'World Boss', state: 'locked', color: '#f59e0b' },
]

// ------------------------------------------------------------------------------------------
// Subcomponents
// ------------------------------------------------------------------------------------------

function ProgressRing({ value, color = '#10b981', size = 52 }: { value: number; color?: string; size?: number }) {
  const r = (size - 7) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-stone-200 dark:text-zinc-800" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold mono">{value}%</span>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Flame
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: tone }}>
        <Icon size={15} />
      </span>
      <div>
        <p className="text-[10px] uppercase tracking-[.16em] text-stone-500 dark:text-zinc-400">{label}</p>
        <p className="mono text-[13px] font-bold">{value}</p>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------
// Main Page & Practice Flow
// ------------------------------------------------------------------------------------------

export default function Home() {
  const [dark, setDark] = useState(true)
  const [activeNode, setActiveNode] = useState('Pattern Pass')
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [sessionState, setSessionState] = useState<SessionState>('ready')
  const [userCode, setUserCode] = useState(STARTER_CODE)
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null)
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null)
  const [executionDetails, setExecutionDetails] = useState<{
    failedCase?: TestCase
    actualResult?: number
    message?: string
  } | null>(null)

  const editorRef = useRef<HTMLTextAreaElement>(null)

  // Sync dark mode class to html element
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      document.documentElement.dataset.theme = 'carbon-dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.dataset.theme = 'paper'
    }
  }, [dark])

  // Keyboard shortcut: Escape closes modal, Cmd+Enter runs tests
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sessionModalOpen) {
        setSessionModalOpen(false)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && sessionModalOpen && sessionState !== 'running') {
        e.preventDefault()
        runCodeEvaluation()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sessionModalOpen, sessionState, userCode])

  // Realistic Evaluation Engine
  const runCodeEvaluation = () => {
    setSessionState('running')
    setExecutionDetails(null)

    // Simulate realistic execution delay for feedback clarity
    setTimeout(() => {
      const code = userCode.trim()

      // Detection heuristic for the common 'abba' regression bug
      const hasRegressionGuard = code.includes('char_map[ch] >= left') || code.includes('max(left, char_map[ch] + 1)') || code.includes('char_map[ch] >= l')

      if (!code.includes('for ') || !code.includes('max_len')) {
        setSessionState('incorrect')
        setExecutionDetails({
          failedCase: TEST_CASES[0],
          actualResult: 0,
          message: 'Syntax/Contract Error: Implementation must maintain a loop over the string and return max_len.',
        })
        return
      }

      if (!hasRegressionGuard) {
        // Specifically catches the "abba" backward left pointer trap
        setSessionState('incorrect')
        setExecutionDetails({
          failedCase: TEST_CASES[4], // s = "abba"
          actualResult: 3,
          message:
            'Invariant Violation on "abba": When the second "a" is reached, "a" was in char_map at index 0. Without checking if char_map[ch] >= left, your left pointer slipped backward from index 2 to index 1, yielding length 3 instead of 2.',
        })
        return
      }

      // Passed all test cases!
      setSessionState('correct')
    }, 600)
  }

  const handleResetCode = () => {
    setUserCode(STARTER_CODE)
    setSessionState('ready')
    setExecutionDetails(null)
  }

  const handleInjectBuggyCode = () => {
    setUserCode(BUGGY_STARTER)
    setSessionState('ready')
    setExecutionDetails(null)
  }

  return (
    <main className={dark ? 'min-h-screen bg-[#09090b] text-[#f4f4f5]' : 'min-h-screen bg-[#f3f2ec] text-[#141413] shell-grid'}>
      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        
        {/* 1. Header HUD */}
        <header className="sticky top-4 z-20 mb-7 flex items-center justify-between rounded-2xl border border-stone-200/90 bg-white/80 px-4 py-3 shadow-[0_8px_30px_-12px_rgba(20,20,19,.12)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/85">
          <div className="flex items-center gap-4">
            <div className="grid size-9 place-items-center rounded-xl bg-[#141413] text-white shadow-lg dark:bg-zinc-800">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-tight">PatternForge</p>
              <p className="mono text-[9px] uppercase tracking-[.2em] text-stone-500 dark:text-zinc-400">engineering mastery</p>
            </div>
            <div className="hidden h-7 w-px bg-stone-200 dark:bg-zinc-800 sm:block" />
            <button
              aria-label="Current Citadel: Citadel I Foundations"
              className="hidden items-center gap-2 rounded-lg border border-stone-200 bg-[#faf9f5] px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200 sm:flex"
            >
              <span className="size-2 rounded-full bg-[#06b6d4] shadow-[0_0_10px_#06b6d4]" />
              Citadel I: Foundations <ChevronDown size={13} />
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden items-center gap-5 md:flex">
              <Stat icon={Flame} label="streak" value="12 days" tone="#f59e0b" />
              <Stat icon={Zap} label="total xp" value="8,420" tone="#8b5cf6" />
            </div>
            <button
              aria-label="Search questions (Command K)"
              className="hidden items-center gap-2 rounded-lg border border-stone-200 bg-[#faf9f5] px-3 py-1.5 text-xs text-stone-500 transition hover:text-stone-800 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:text-zinc-200 md:flex"
            >
              <Search size={14} />
              <span>Search</span>
              <kbd className="rounded border border-stone-300 bg-white px-1.5 py-0.5 text-[10px] font-mono dark:border-zinc-700 dark:bg-zinc-900">⌘ K</kbd>
            </button>
            <button
              aria-label={dark ? 'Switch to paper light' : 'Switch to carbon dark'}
              onClick={() => setDark(!dark)}
              className="grid size-9 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-50 active:scale-[.96] dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div className="size-8 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400 p-[2px]">
              <div className="grid size-full place-items-center rounded-full bg-white text-[10px] font-bold text-stone-800 dark:bg-zinc-900 dark:text-zinc-200">
                SD
              </div>
            </div>
          </div>
        </header>

        {/* 2. Welcome & Focus Intent Banner */}
        <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono mb-1.5 text-[10px] uppercase tracking-[.24em] text-stone-500 dark:text-zinc-400">
              Thursday · October 17, 2026
            </p>
            <h1 className="text-3xl font-bold tracking-[-.04em] sm:text-4xl">
              Good morning, Suhas.
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
              Today&apos;s objective: Master the sliding window invariant under duplicate collisions.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:text-amber-400">
            <Flame size={14} className="fill-amber-500" />
            <span>12 Day Streak</span>
            <span className="ml-1 rounded-full border border-amber-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-stone-700 dark:border-amber-800 dark:bg-zinc-900 dark:text-zinc-300">
              +1 freeze protected
            </span>
          </div>
        </section>

        {/* 3. Hero Learning Grid: Interactive Today's Session + Mastery Signals */}
        <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          
          {/* Main Active Quest / Retrieval Launchpad */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[#0b0c10] p-6 text-white shadow-xl dot-grid"
          >
            <div className="flex items-start justify-between">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300">
                Today&apos;s Focus Session · 12 Min
              </span>
              <span className="mono text-[11px] text-zinc-400">LeetCode #3 · Medium</span>
            </div>

            <div className="mt-5 max-w-lg">
              <p className="mono text-[10px] uppercase tracking-[.2em] text-[#9296a5]">Pattern: Sliding Window</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Longest Substring Without Repeating Characters
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-300">
                Train your mental invariant: dynamically expand the right boundary, track last-seen indices, and guarantee the left pointer never slips backwards.
              </p>
            </div>

            {/* Micro-learning checklist */}
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-emerald-400">
                <Check size={13} /> Pattern Signal Recognized
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
                <Code2 size={13} /> Active Coding Arena
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-zinc-400">
                <Timer size={13} /> Spaced Interval (+3d)
              </span>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSessionModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-[#10b981] px-5 py-3 text-sm font-bold text-[#071b14] shadow-lg shadow-emerald-500/20 transition-all hover:bg-[#059669] hover:text-white active:scale-[.97]"
              >
                <Play size={16} fill="currentColor" />
                <span>Enter Practice Arena</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => {
                  setSessionModalOpen(true)
                  setActiveHintIndex(0)
                }}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-700"
              >
                <Lightbulb size={15} className="text-amber-400" />
                <span>Review Clues</span>
              </button>
              <span className="mono ml-auto hidden text-xs text-amber-400 sm:inline">
                +240 XP · 2.4x streak multiplier
              </span>
            </div>

            {/* Decorative background radar circles */}
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-10 size-52 rounded-full border border-cyan-500/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 -right-2 size-32 rounded-full border border-cyan-500/15" />
          </motion.div>

          {/* Right Column: Spaced Repetition & Learning Health */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            
            {/* Spaced Review & Weak-Pattern Radar */}
            <div className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-[0_4px_20px_-2px_rgba(20,20,19,.06)] dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="mono text-[10px] uppercase tracking-[.18em] text-stone-500 dark:text-zinc-400">Spaced Review Queue</p>
                  <h3 className="mt-1 font-bold text-stone-900 dark:text-white">Retention Health: 84%</h3>
                </div>
                <Sparkles size={16} className="text-cyan-500" />
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <HelpCircle size={14} /> Weak Spot Identified
                    </span>
                    <span className="mono text-[10px] text-amber-700 dark:text-amber-400">Last: 60%</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-600 dark:text-zinc-300">
                    Sliding Window Invariant: Contracting left pointer without backwards regressions.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-stone-200/80 bg-stone-50 p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-800/50">
                  <div>
                    <p className="font-semibold text-stone-800 dark:text-zinc-200">Next Scheduled Interleaving</p>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-400">Monotonic Stack (Daily Temperatures)</p>
                  </div>
                  <span className="mono rounded-md bg-stone-200/70 px-2 py-0.5 text-[10px] font-bold dark:bg-zinc-700">Tomorrow</span>
                </div>
              </div>
            </div>

            {/* Citadel Skill Coverage */}
            <div className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-[0_4px_20px_-2px_rgba(20,20,19,.06)] dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-center justify-between">
                <p className="mono text-[10px] uppercase tracking-[.18em] text-stone-500 dark:text-zinc-400">Foundations Mastery</p>
                <Trophy size={16} className="text-amber-500" />
              </div>
              <div className="flex items-center gap-4">
                <ProgressRing value={68} color="#8b5cf6" size={62} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">32</span>
                    <span className="text-xs text-stone-500 dark:text-zinc-400">/ 48 trials completed</span>
                  </div>
                  <div className="mt-2.5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-600 dark:text-zinc-300">Arrays & Hashing</span>
                      <span className="mono font-semibold text-emerald-600 dark:text-emerald-400">100%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-100 dark:bg-zinc-800">
                      <div className="h-full w-full rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-600 dark:text-zinc-300">Two Pointers & Window</span>
                      <span className="mono font-semibold text-cyan-600 dark:text-cyan-400">62%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-100 dark:bg-zinc-800">
                      <div className="h-full w-[62%] rounded-full bg-cyan-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4. Interactive Ascent Constellation Map */}
        <section className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-3xl border border-[#1e2028] bg-[#0b0c10] p-6 text-white dot-grid">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="mono text-[10px] uppercase tracking-[.2em] text-[#9296a5]">The Constellation</p>
                <h2 className="mt-1 text-xl font-bold">Your Ascent Trail · Citadel I</h2>
              </div>
              <span className="rounded-lg border border-[#2c303b] px-3 py-1.5 text-xs text-[#b7bac5]">
                Trial 3 of 5 Unlocked
              </span>
            </div>

            <div className="relative h-[270px] overflow-hidden rounded-2xl border border-[#1e2028] bg-[#0e1016]">
              <svg className="absolute inset-0 size-full" preserveAspectRatio="none">
                <path d="M 13% 73% L 30% 55% L 47% 66% L 64% 39% L 80% 23%" fill="none" stroke="#24303a" strokeWidth="2" strokeDasharray="5 6" />
                <path d="M 13% 73% L 30% 55% L 47% 66%" fill="none" stroke="#06b6d4" strokeOpacity=".8" strokeWidth="2.5" />
              </svg>
              {NODES.map((n) => (
                <button
                  key={n.label}
                  onClick={() => {
                    setActiveNode(n.label)
                    if (n.label === 'Pattern Pass') {
                      setSessionModalOpen(true)
                    }
                  }}
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                  aria-label={`${n.label}: ${n.sub} (${n.state})`}
                  className="group absolute -translate-x-1/2 -translate-y-1/2 text-left"
                >
                  <span
                    className={`grid size-9 place-items-center rounded-full border-2 transition-all ${
                      activeNode === n.label ? 'scale-125 shadow-[0_0_24px_currentColor]' : 'group-hover:scale-110'
                    }`}
                    style={{ borderColor: n.color, color: n.color, background: '#0e1016' }}
                  >
                    {n.state === 'locked' ? (
                      <LockKeyhole size={13} />
                    ) : n.state === 'done' ? (
                      <Check size={15} />
                    ) : (
                      <span className="size-2.5 rounded-full bg-current animate-pulse" />
                    )}
                  </span>
                  <span className="absolute left-1/2 top-11 w-32 -translate-x-1/2 text-center pointer-events-none">
                    <b className="block text-[11px] font-semibold text-zinc-100">{n.label}</b>
                    <small className="block text-[9px] text-[#7b8190]">{n.sub}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Consistency & Streak Slack */}
          <div className="rounded-3xl border border-stone-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex justify-between">
              <div>
                <p className="mono text-[10px] uppercase tracking-[.2em] text-stone-500 dark:text-zinc-400">Activity</p>
                <h3 className="mt-1 text-xl font-bold text-stone-900 dark:text-white">Quiet Consistency</h3>
              </div>
              <span className="mono text-xs font-semibold text-[#10b981]">+18% this week</span>
            </div>

            {/* 70-day practice matrix */}
            <div className="grid grid-cols-10 gap-1.5" aria-label="Practice activity heatmap">
              {Array.from({ length: 70 }, (_, i) => (
                <span
                  key={i}
                  className={`aspect-square rounded-[3px] transition-colors ${
                    i % 11 === 0
                      ? 'bg-stone-200 dark:bg-zinc-800'
                      : i % 7 === 0
                      ? 'bg-emerald-300 dark:bg-emerald-800'
                      : i % 4 === 0
                      ? 'bg-emerald-500 dark:bg-emerald-500'
                      : 'bg-emerald-100 dark:bg-emerald-950'
                  }`}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400">
              <span>10 weeks ago</span>
              <span>Today</span>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-[#f7f6f2] p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <Flame size={17} />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900 dark:text-white">Streak Freeze Charged</p>
                <p className="text-[11px] text-stone-600 dark:text-zinc-400">Forgiving slack prevents habit disruption.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Ascension Trail Quick Switcher */}
        <section className="mt-6 rounded-3xl border border-stone-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mono text-[10px] uppercase tracking-[.2em] text-stone-500 dark:text-zinc-400">Ascension Trail</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 dark:text-white">Citadel I · Foundations Route</h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">Current trial: Sliding Window & Invariant Bounds</p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                6,240 XP earned
              </span>
              <span className="rounded-full bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-700 dark:text-violet-400">
                Level 08
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-2 custom-scroll">
            {[
              { title: 'Arrays & Hashing', state: 'done', count: '10 drills' },
              { title: 'Two Pointers', state: 'done', count: '8 drills' },
              { title: 'Sliding Window', state: 'active', count: 'Live trial' },
              { title: 'Binary Search', state: 'locked', count: '10 drills' },
              { title: 'Linked Lists', state: 'locked', count: '9 drills' },
              { title: 'Trees & BFS', state: 'locked', count: '14 drills' },
            ].map((item, i) => (
              <button
                key={item.title}
                onClick={() => {
                  if (item.state === 'active') setSessionModalOpen(true)
                }}
                className={`min-w-[160px] rounded-2xl border p-4 text-left transition-all ${
                  item.state === 'active'
                    ? 'border-cyan-400 bg-cyan-50/80 shadow-[0_0_0_3px_rgba(6,182,212,.12)] dark:border-cyan-500/60 dark:bg-cyan-950/20'
                    : item.state === 'done'
                    ? 'border-stone-200 bg-[#faf9f5] dark:border-zinc-800 dark:bg-zinc-800/40'
                    : 'border-stone-200/60 bg-stone-50/60 opacity-60 dark:border-zinc-800/60 dark:bg-zinc-900/40'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className={`grid size-7 place-items-center rounded-full text-[11px] font-bold ${
                      item.state === 'done'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : item.state === 'active'
                        ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                        : 'bg-stone-200 text-stone-500 dark:bg-zinc-800 dark:text-zinc-500'
                    }`}
                  >
                    {item.state === 'done' ? <Check size={13} /> : i + 1}
                  </span>
                  {item.state === 'active' && (
                    <span className="mono text-[10px] font-bold tracking-wider text-cyan-600 dark:text-cyan-400">ACTIVE</span>
                  )}
                </div>
                <p className="text-sm font-bold text-stone-900 dark:text-white">{item.title}</p>
                <p className="mt-1 text-[11px] text-stone-500 dark:text-zinc-400">{item.count}</p>
              </button>
            ))}
          </div>
        </section>

      </div>

      {/* ------------------------------------------------------------------------------------ */}
      {/* 6. Focused Practice Arena Modal (Real Retrieval Practice Flow) */}
      {/* ------------------------------------------------------------------------------------ */}
      <AnimatePresence>
        {sessionModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Practice Arena: Longest Substring Without Repeating Characters"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSessionModalOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative flex h-[92vh] max-h-[880px] w-full max-w-[1240px] flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-[#0e1017] text-white shadow-2xl"
            >
              
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between border-b border-zinc-800/90 bg-[#12151e] px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <Code2 size={15} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-zinc-100">Longest Substring Without Repeating Characters</h2>
                      <span className="mono rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">LeetCode #3</span>
                    </div>
                    <p className="mono text-[10px] text-zinc-400">Sliding Window · Python3 Runtime</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetCode}
                    title="Reset to starter code"
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                  >
                    <RotateCcw size={13} />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                  <button
                    onClick={handleInjectBuggyCode}
                    title="Load buggy code to test error detection"
                    className="hidden sm:flex items-center gap-1.5 rounded-lg border border-amber-600/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-300 transition hover:bg-amber-500/20"
                  >
                    <span>Test Bug Scenario</span>
                  </button>
                  <button
                    onClick={() => setSessionModalOpen(false)}
                    aria-label="Close practice modal (Escape)"
                    className="grid size-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body: Split view of Problem/Hints on Left, Code & Output on Right */}
              <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[400px_1fr]">
                
                {/* Left Panel: Context, Invariants & Hints */}
                <div className="flex flex-col border-b border-zinc-800 bg-[#10131b] p-5 overflow-y-auto custom-scroll lg:border-b-0 lg:border-r">
                  
                  {/* Objective & Signal */}
                  <div className="mb-5">
                    <span className="mono text-[10px] uppercase tracking-wider text-cyan-400 font-bold">Concept Objective</span>
                    <h3 className="mt-1 text-base font-bold text-white">Maintain the Unique Invariant</h3>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                      Expand the window right pointer greedily. When encountering a character that exists inside the current window, contract the left pointer past its previous index.
                    </p>
                  </div>

                  {/* Pattern Clues Box */}
                  <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <p className="mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pattern Triggers</p>
                    <ul className="mt-2 space-y-1.5 text-xs text-zinc-300">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        <span>Contiguous substring search with distinct element constraint.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        <span>State: <code className="mono rounded bg-zinc-800 px-1 text-[11px] text-cyan-200">char_map[char] = index</code></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        <span>Jump condition: <code className="mono rounded bg-zinc-800 px-1 text-[11px] text-cyan-200">left = max(left, last_idx + 1)</code></span>
                      </li>
                    </ul>
                  </div>

                  {/* Progressive Hints Accordion */}
                  <div className="mt-auto pt-4 border-t border-zinc-800/80">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="mono text-[10px] uppercase font-bold tracking-wider text-amber-400">Progressive Hints</span>
                      <span className="text-[11px] text-zinc-400">3 available</span>
                    </div>

                    <div className="space-y-2">
                      {HINTS.map((hint, idx) => {
                        const isOpen = activeHintIndex === idx
                        return (
                          <div key={hint.step} className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                            <button
                              onClick={() => setActiveHintIndex(isOpen ? null : idx)}
                              className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-zinc-200 hover:bg-zinc-800/50"
                            >
                              <span className="flex items-center gap-2">
                                <span className="mono text-[10px] text-amber-400 font-bold">#{hint.step}</span>
                                <span>{hint.title}</span>
                              </span>
                              <ChevronRight size={13} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                            </button>
                            {isOpen && (
                              <div className="border-t border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5 text-xs leading-relaxed text-zinc-300">
                                {hint.text}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                </div>

                {/* Right Panel: Code Workspace + Test Runner Console */}
                <div className="flex flex-col bg-[#0b0c10] overflow-hidden">
                  
                  {/* Editor Header */}
                  <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/50 px-4 py-2 text-xs">
                    <span className="mono text-[11px] text-zinc-400">solution.py</span>
                    <span className="mono text-[11px] text-zinc-500">⌘+Enter to Run</span>
                  </div>

                  {/* Code Editor Textarea */}
                  <div className="relative flex-1 p-3">
                    <textarea
                      ref={editorRef}
                      value={userCode}
                      onChange={(e) => setUserCode(e.target.value)}
                      spellCheck={false}
                      aria-label="Python code implementation"
                      className="size-full resize-none rounded-xl border border-zinc-800/60 bg-[#090a0f] p-4 font-mono text-[13px] leading-6 text-zinc-100 outline-none focus:border-cyan-500/80 custom-scroll"
                    />
                  </div>

                  {/* Test Cases & Evaluation Tray */}
                  <div className="border-t border-zinc-800 bg-[#0e1118] p-4">
                    
                    {/* Status Feedback Banner */}
                    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {sessionState === 'running' && (
                          <span className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                            <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
                            Evaluating test suite...
                          </span>
                        )}
                        {sessionState === 'correct' && (
                          <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                            <CheckCircle2 size={16} /> All 5 Test Cases Passed! Invariant verified.
                          </span>
                        )}
                        {sessionState === 'incorrect' && (
                          <span className="flex items-center gap-2 text-xs font-bold text-rose-400">
                            <XCircle size={16} /> Verification Failed
                          </span>
                        )}
                        {sessionState === 'ready' && (
                          <span className="text-xs text-zinc-400">Click &quot;Run Test Suite&quot; to verify your sliding window invariant.</span>
                        )}
                      </div>

                      {/* Run Action Button */}
                      <button
                        onClick={runCodeEvaluation}
                        disabled={sessionState === 'running'}
                        className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-black shadow-md shadow-cyan-500/20 transition-all hover:bg-cyan-400 active:scale-[.97] disabled:opacity-50"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>{sessionState === 'running' ? 'Checking...' : 'Run Test Suite'}</span>
                        <CornerDownLeft size={13} />
                      </button>
                    </div>

                    {/* Feedback Explanation Message (when failed) */}
                    {sessionState === 'incorrect' && executionDetails?.message && (
                      <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                        <p className="font-semibold">{executionDetails.message}</p>
                      </div>
                    )}

                    {/* Test Case Badges */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {TEST_CASES.map((tc) => {
                        const isFailed = sessionState === 'incorrect' && executionDetails?.failedCase?.id === tc.id
                        const isPassed = sessionState === 'correct'
                        return (
                          <div
                            key={tc.id}
                            className={`rounded-xl border p-2 text-left transition-colors ${
                              isFailed
                                ? 'border-rose-500 bg-rose-500/10 text-rose-200'
                                : isPassed
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                : 'border-zinc-800 bg-zinc-900/60 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="mono text-[10px] text-zinc-400">Test {tc.id}</span>
                              {isPassed ? (
                                <Check size={12} className="text-emerald-400" />
                              ) : isFailed ? (
                                <X size={12} className="text-rose-400" />
                              ) : null}
                            </div>
                            <p className="mono mt-1 text-[11px] font-semibold truncate">&quot;{tc.input}&quot;</p>
                            <p className="mono text-[10px] text-zinc-400">Exp: {tc.expected}</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Completion Summary & Spaced Confidence Drawer */}
                    {sessionState === 'correct' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-emerald-300">Session Objective Complete</p>
                            <p className="text-[11px] text-zinc-300">
                              Time Complexity: <code className="mono text-emerald-400">O(N)</code> · Space: <code className="mono text-emerald-400">O(min(N, M))</code>
                            </p>
                          </div>

                          {/* Confidence Rating */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-300">Rate Retention:</span>
                            {(['needs-practice', 'solid', 'mastered'] as ConfidenceLevel[]).map((lvl) => (
                              <button
                                key={lvl}
                                onClick={() => setConfidence(lvl)}
                                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize transition ${
                                  confidence === lvl
                                    ? 'border-emerald-400 bg-emerald-500 text-black'
                                    : 'border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                                }`}
                              >
                                {lvl.replace('-', ' ')}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              setSessionModalOpen(false)
                              setSessionState('completed')
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-black hover:bg-emerald-400"
                          >
                            <span>Save & Next Trial</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}

                  </div>

                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  )
}

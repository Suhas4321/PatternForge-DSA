import {
  Bot,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Columns2,
  Cpu,
  Eye,
  FileText,
  Mic,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import type { Pitch, Progress, QuestionDetail } from '../../api/types'
import { useCoachStatus } from '../../lib/useCoach'
import { Button, LeetCodeLink, Markdown, formatRelative } from '../ui'

const FIELDS: {
  key: keyof Omit<Pitch, 'updated_at'>
  stepNum: number
  label: string
  sublabel: string
  placeholder: string
  guidance: string
}[] = [
  {
    key: 'brute_force',
    stepNum: 1,
    label: 'Brute Force & Algorithmic Bottleneck',
    sublabel: 'Identify the naive approach and explain why it violates the time budget',
    placeholder: 'Two nested loops scanning every pair: O(N²) time, which exceeds 10⁸ ops for N > 5,000…',
    guidance: 'State the naive solution clearly so the interviewer knows you understand the baseline.',
  },
  {
    key: 'trigger',
    stepNum: 2,
    label: 'The Trigger Signal Spotted',
    sublabel: 'Pinpoint the exact phrasing or constraint that unlocked the pattern',
    placeholder: '"Find pair summing to target in unsorted array" → Direct signal for complement lookup via Hash Map…',
    guidance: 'Mention the exact trigger word from the problem statement.',
  },
  {
    key: 'intuition',
    stepNum: 3,
    label: 'Optimal 60-Second Spoken Intuition',
    sublabel: 'Explain the core idea out loud as if speaking directly to a Staff Engineer',
    placeholder: 'Maintain a hash table of visited values. For each number x, check if (target - x) was already seen in O(1)…',
    guidance: 'Keep it to 2 concise sentences. Focus on the core invariant.',
  },
  {
    key: 'complexity',
    stepNum: 4,
    label: 'Space & Time Complexity Invariants',
    sublabel: 'State the exact bounds and justify them using hardware memory and loop invariants',
    placeholder: 'O(N) time for a single pass through the array; O(N) space in the worst case to store complements in the hash map.',
    guidance: 'Always justify both time and space without waiting to be asked.',
  },
]

const CONFIDENCE_LEVELS = [
  {
    value: 1,
    label: 'Struggled',
    sub: 'Severe difficulty / blanked',
    intervalDays: 3,
    badgeClass: 'border-crimson/50 bg-crimson/15 text-crimson hover:bg-crimson/25',
    activeClass: 'border-crimson bg-crimson/20 text-crimson shadow-[0_0_16px_rgba(251,113,133,0.35)] ring-1 ring-crimson',
  },
  {
    value: 2,
    label: 'Needed Hints',
    sub: 'Required hint / hesitation',
    intervalDays: 7,
    badgeClass: 'border-oxide/50 bg-oxide/15 text-oxide hover:bg-oxide/25',
    activeClass: 'border-oxide bg-oxide/20 text-oxide shadow-[0_0_16px_rgba(251,113,133,0.3)] ring-1 ring-oxide',
  },
  {
    value: 3,
    label: 'Moderate',
    sub: 'Solved with slight friction',
    intervalDays: 21,
    badgeClass: 'border-amber/50 bg-amber/15 text-amber hover:bg-amber/25',
    activeClass: 'border-amber bg-amber/20 text-amber shadow-[0_0_16px_rgba(242,184,102,0.35)] ring-1 ring-amber',
  },
  {
    value: 4,
    label: 'Confident',
    sub: 'Clean solve & crisp pitch',
    intervalDays: 42,
    badgeClass: 'border-cyan/50 bg-cyan/15 text-cyan hover:bg-cyan/25',
    activeClass: 'border-cyan bg-cyan/20 text-cyan shadow-[0_0_16px_rgba(103,232,249,0.35)] ring-1 ring-cyan',
  },
  {
    value: 5,
    label: 'Mastered',
    sub: 'Flawless recall & optimal code',
    intervalDays: 84,
    badgeClass: 'border-emerald/50 bg-emerald/15 text-emerald hover:bg-emerald/25',
    activeClass: 'border-emerald bg-emerald/20 text-emerald shadow-[0_0_16px_rgba(16,185,129,0.35)] ring-1 ring-emerald',
  },
]

const leetcodeUrl = (title: string) =>
  `https://leetcode.com/problems/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}/`

interface Props {
  question: QuestionDetail
  progress: Progress
  onProgress: (p: Progress) => void
}

export default function StagePitch({ question, progress, onProgress }: Props) {
  const content = question.content!
  const [pitch, setPitch] = useState<Pitch>(question.pitch)
  const [saved, setSaved] = useState(true)
  const [viewMode, setViewMode] = useState<'sideBySide' | 'teleprompter' | 'seniorOnly'>('seniorOnly')
  const [showSolution, setShowSolution] = useState(false)
  const firstRender = useRef(true)
  const coach = useCoachStatus()
  const [polish, setPolish] = useState<{ text: string | null; error: string | null } | null>(null)
  const [polishing, setPolishing] = useState(false)

  const polishPitch = async () => {
    setPolishing(true)
    try {
      const r = await api.askCoach(question.slug, {
        mode: 'pitch',
        code: question.drafts.main ?? '',
        pitch,
      })
      setPolish({ text: r.reply, error: r.error })
    } catch (e) {
      setPolish({ text: null, error: (e as Error).message })
    } finally {
      setPolishing(false)
    }
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    setSaved(false)
    const t = setTimeout(async () => {
      await api.savePitch(question.slug, pitch)
      setSaved(true)
    }, 700)
    return () => clearTimeout(t)
  }, [pitch, question.slug])

  const filledCount = FIELDS.filter((f) => pitch[f.key].trim().length > 0).length
  const totalWords = FIELDS.reduce((sum, f) => sum + pitch[f.key].trim().split(/\s+/).filter(Boolean).length, 0)
  const estimatedSeconds = Math.round((totalWords / 130) * 60) // ~130 words per minute conversational pace

  // 60-Second Spoken Rehearsal Countdown Timer
  const [timerSec, setTimerSec] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)

  useEffect(() => {
    if (!timerRunning) return
    if (timerSec <= 0) {
      setTimerRunning(false)
      return
    }
    const id = window.setTimeout(() => setTimerSec((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [timerRunning, timerSec])

  const rate = async (confidence: number) => {
    onProgress(await api.rate(question.slug, confidence))
  }

  const isUnlockedForRating = progress.solved || progress.studied_solution

  return (
    <div className="flex flex-col gap-6 max-w-full">
      {/* Telemetry Stage 4 Header Strip */}
      <div className="pf-glass-panel rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border border-line shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-forge/40 bg-forge/15 text-forge shadow-[0_0_14px_rgba(110,231,183,0.3)]">
            <Mic size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-plate text-base font-bold text-chalk">
                Interview Defense & Executive Speech Studio
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-forge/40 bg-forge/10 px-2 py-0.5 text-2xs font-mono font-semibold text-forge">
                <span className="h-1.5 w-1.5 rounded-full bg-forge pf-beacon" />
                60-Second Verbal Spoken Drill
              </span>
            </div>
            <p className="text-xs text-muted">
              Speak your explanation out loud. Senior interviewers evaluate verbal structure, trade-offs, and pacing.
            </p>
          </div>
        </div>

        {/* View mode toggle: Study Mode (Default) vs Delivery Practice */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center rounded-xl border border-line bg-panel p-1">
            <button
              type="button"
              onClick={() => setViewMode('seniorOnly')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'seniorOnly'
                  ? 'bg-cyan/20 text-cyan font-bold border border-cyan/40 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <ShieldCheck size={13} />
              <span>📖 Study Mode (Senior Script)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('teleprompter')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'teleprompter'
                  ? 'bg-cyan/20 text-cyan font-bold border border-cyan/40 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <FileText size={13} />
              <span>🎙️ Delivery Practice</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sideBySide')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'sideBySide'
                  ? 'bg-cyan/20 text-cyan font-bold border border-cyan/40 shadow-xs'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              <Columns2 size={13} />
              <span>Side-by-Side</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live 60-Second Spoken Rehearsal Timer & 4-Point Staff Interviewer Rubric Bar */}
      <div className="card rounded-2xl border border-line bg-panel p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-panel-2 px-3 py-1.5 font-mono text-xs">
            <Clock size={14} className={timerRunning ? 'text-amber animate-pulse' : 'text-cyan'} />
            <span className="font-bold text-chalk tabular-nums">
              00:{String(timerSec).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => {
                if (timerSec === 0) setTimerSec(60)
                setTimerRunning((r) => !r)
              }}
              className="ml-1 rounded-md bg-cyan/15 border border-cyan/30 px-2 py-0.5 text-2xs font-bold text-cyan hover:bg-cyan/25 transition-colors"
            >
              {timerRunning ? 'Pause' : timerSec < 60 && timerSec > 0 ? 'Resume' : 'Start 60s Drill'}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false)
                setTimerSec(60)
              }}
              className="p-1 text-muted hover:text-chalk transition-colors"
              title="Reset 60s timer"
            >
              <RotateCcw size={12} />
            </button>
          </div>
          <span className="text-2xs text-muted font-mono">
            Pacing Budget: <strong className="text-chalk">110–130 words</strong> (~60s at 130 WPM)
          </span>
        </div>

        {/* 3-Zone Pacing Teleprompter Rhythm Tracker */}
        <div className="flex flex-wrap items-center gap-2 text-2xs font-mono">
          <span
            className={`rounded-lg border px-2.5 py-1 transition-all ${
              timerRunning && timerSec > 45
                ? 'border-cyan bg-cyan/20 text-cyan font-bold'
                : 'border-line bg-panel-2 text-muted'
            }`}
          >
            0–15s: Hook & Invariant
          </span>
          <span
            className={`rounded-lg border px-2.5 py-1 transition-all ${
              timerRunning && timerSec <= 45 && timerSec > 20
                ? 'border-emerald bg-emerald/20 text-emerald font-bold'
                : 'border-line bg-panel-2 text-muted'
            }`}
          >
            15–40s: Algorithmic Flow
          </span>
          <span
            className={`rounded-lg border px-2.5 py-1 transition-all ${
              timerRunning && timerSec <= 20 && timerSec > 0
                ? 'border-amber bg-amber/20 text-amber font-bold'
                : 'border-line bg-panel-2 text-muted'
            }`}
          >
            40–60s: Trade-offs & Defense
          </span>
        </div>
      </div>

      {/* Main Pitch Studio Grid */}
      <div
        className={`grid gap-6 ${
          viewMode === 'sideBySide' ? 'grid-cols-1 xl:grid-cols-12' : 'grid-cols-1'
        }`}
      >
        {/* Left Column: Teleprompter Pitch Field */}
        {(viewMode === 'sideBySide' || viewMode === 'teleprompter') && (
          <div className={viewMode === 'sideBySide' ? 'xl:col-span-6 flex flex-col gap-4' : 'flex flex-col gap-4'}>
            <div className="pf-glass-panel rounded-2xl border border-line p-5 shadow-2xl flex flex-col gap-5">
              {/* Teleprompter Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="font-plate text-sm font-bold uppercase tracking-wider text-chalk">
                    Your 4-Line Verbal Script
                  </span>
                  <span className="font-mono text-2xs px-2 py-0.5 rounded-full border border-line bg-panel-2 text-cyan">
                    {filledCount} / 4 Sections Complete
                  </span>
                </div>

                <div className="flex items-center gap-3 text-2xs font-mono">
                  {/* Pacing Telemetry */}
                  <span className="flex items-center gap-1.5 text-muted">
                    <Clock size={12} className="text-cyan" />
                    <span className="text-chalk font-semibold">{totalWords} words</span>
                    <span className="text-faint">(~{estimatedSeconds}s spoken)</span>
                  </span>

                  {/* Auto-save status */}
                  <span
                    className={`flex items-center gap-1 font-semibold ${
                      saved ? 'text-emerald' : 'text-amber animate-pulse'
                    }`}
                  >
                    {saved ? <Check size={12} strokeWidth={3} /> : <RotateCcw size={12} className="animate-spin" />}
                    <span>{saved ? 'Saved to Grimoire' : 'Saving draft…'}</span>
                  </span>
                </div>
              </div>

              {/* 4 Line Input Teleprompter Fields */}
              <div className="space-y-4">
                {FIELDS.map((f) => {
                  const val = pitch[f.key]
                  const hasContent = val.trim().length > 0
                  return (
                    <div
                      key={f.key}
                      className={`rounded-xl border p-3.5 transition-all ${
                        hasContent
                          ? 'border-line-strong bg-panel-2/90 shadow-xs'
                          : 'border-line/70 bg-panel-2/40'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-chalk cursor-pointer">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md border border-cyan/40 bg-cyan/15 font-mono text-2xs font-bold text-cyan">
                            {f.stepNum}
                          </span>
                          <span>{f.label}</span>
                        </label>
                        <span className="hidden sm:inline font-sans text-caption text-faint italic">
                          {f.guidance}
                        </span>
                      </div>

                      <p className="text-2xs text-muted mb-2 font-sans">{f.sublabel}</p>

                      <textarea
                        rows={2}
                        value={val}
                        placeholder={f.placeholder}
                        onChange={(e) => setPitch({ ...pitch, [f.key]: e.target.value })}
                        className="w-full resize-y rounded-lg border border-line bg-ink/90 px-3 py-2 font-sans text-xs leading-relaxed text-chalk placeholder:text-faint focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan/30"
                      />
                    </div>
                  )
                })}
              </div>

              {/* Pacing Advice footer */}
              <div className="rounded-xl border border-line/70 bg-panel-2/50 p-3 text-2xs text-muted flex items-start gap-2.5">
                <Sparkles size={14} className="text-amber shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-chalk">Senior Engineer Rule of Thumb:</strong> Aim for 40 to 65 total words. Explain the baseline brute-force, why it breaks at the problem constraint, your trigger recognition, and the optimal complexity in one smooth breath.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Model Senior Script Diff & Architectural Trade-offs */}
        {(viewMode === 'sideBySide' || viewMode === 'seniorOnly') && (
          <div className={viewMode === 'sideBySide' ? 'xl:col-span-6 flex flex-col gap-4' : 'flex flex-col gap-4'}>
            <div className="pf-glass-panel rounded-2xl border border-line p-5 shadow-2xl flex flex-col gap-5">
              {/* Senior Script Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md border border-cyan/40 bg-cyan/15 text-cyan">
                    <ShieldCheck size={14} />
                  </div>
                  <span className="font-plate text-sm font-bold uppercase tracking-wider text-chalk">
                    Senior Engineer Model Script Diff
                  </span>
                </div>

                {coach?.enabled && (
                  <Button
                    variant="glass"
                    onClick={polishPitch}
                    disabled={polishing || filledCount === 0}
                    className="h-7 text-xs px-2.5 border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
                  >
                    <Bot size={13} className="mr-1 text-cyan" />
                    <span>{polishing ? 'Analyzing pitch…' : 'Polish My Pitch (AI)'}</span>
                  </Button>
                )}
              </div>

              {/* Coach Feedback Box if activated */}
              {polish && (
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.05] p-4 text-xs">
                  <div className="mb-2 flex items-center gap-1.5 font-mono text-2xs font-semibold text-cyan">
                    <Bot size={13} />
                    <span>STAFF COACH CRITIQUE {coach?.model ? `(${coach.model})` : ''}</span>
                  </div>
                  {polish.text ? (
                    <div className="prose-forge text-chalk text-xs leading-relaxed">
                      <Markdown>{polish.text}</Markdown>
                    </div>
                  ) : (
                    <p className="text-muted">{polish.error} Standard model comparison rendered below.</p>
                  )}
                </div>
              )}

              {/* Architectural Trade-offs Callouts */}
              <div className="rounded-xl border border-line/80 bg-panel-2/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xs uppercase tracking-wider text-faint font-semibold">
                    Key Architectural Trade-offs to Articulate
                  </span>
                  <span className="font-mono text-2xs text-cyan font-bold">4 Verified Invariants</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs font-mono">
                  <div className="rounded-lg border border-line bg-panel p-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald shrink-0" />
                    <span className="text-muted">Time Bound:</span>
                    <strong className="text-chalk">{content.solution.time}</strong>
                  </div>
                  <div className="rounded-lg border border-line bg-panel p-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan shrink-0" />
                    <span className="text-muted">Space Bound:</span>
                    <strong className="text-chalk">{content.solution.space}</strong>
                  </div>
                  <div className="rounded-lg border border-line bg-panel p-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber shrink-0" />
                    <span className="text-muted">Brute-Force:</span>
                    <strong className="text-chalk truncate">{content.pitch_script.split('\n')[0]?.slice(0, 22) || 'O(N²) quadratic'}…</strong>
                  </div>
                  <div className="rounded-lg border border-line bg-panel p-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-forge shrink-0" />
                    <span className="text-muted">Core Primitive:</span>
                    <strong className="text-chalk">{question.patterns[0] || 'Optimal State'}</strong>
                  </div>
                </div>
              </div>

              {/* Spoken Senior Script Breakdown */}
              <div className="rounded-xl border border-line bg-panel p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <h4 className="font-mono text-2xs uppercase tracking-wider text-faint font-semibold">
                    Target Spoken Formulation
                  </h4>
                  <span className="text-2xs font-mono text-emerald font-semibold">Senior Baseline</span>
                </div>

                <div className="prose-forge text-xs leading-relaxed text-chalk space-y-2 font-sans">
                  <Markdown>{content.pitch_script}</Markdown>
                </div>
              </div>

              {/* Pitch Comparison Insight */}
              <div className="rounded-xl border border-line/60 bg-panel-2/40 p-3 text-2xs text-muted flex items-center gap-2">
                <Radio size={13} className="text-cyan shrink-0" />
                <span>
                  Comparing your pitch against the model script trains you to speak without defensive rambling or hedging.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spaced Repetition & Confidence Rating Studio */}
      <div className="pf-glass-panel rounded-2xl border border-line p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan/40 bg-cyan/15 text-cyan shadow-sm">
              <CalendarClock size={15} />
            </div>
            <div>
              <h4 className="font-plate text-sm font-bold text-chalk">
                SM-2 Spaced Repetition & Confidence Rating
              </h4>
              <p className="text-2xs text-muted">
                Select your recall confidence to schedule this problem's next blind re-solve and prevent knowledge decay.
              </p>
            </div>
          </div>

          {progress.next_review_at && (
            <div className="flex items-center gap-2 font-mono text-2xs rounded-lg border border-line bg-panel px-3 py-1 text-muted">
              <Calendar size={12} className="text-cyan" />
              <span>Next Review:</span>
              <strong className="text-chalk font-semibold">
                {formatRelative(progress.next_review_at)}
              </strong>
              <span className="text-faint">
                ({new Date(progress.next_review_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })})
              </span>
            </div>
          )}
        </div>

        {/* 5 Confidence Rating Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {CONFIDENCE_LEVELS.map((lvl) => {
            const isSelected = progress.confidence === lvl.value
            return (
              <button
                key={lvl.value}
                type="button"
                onClick={() => rate(lvl.value)}
                disabled={!isUnlockedForRating}
                title={
                  isUnlockedForRating
                    ? `Rate ${lvl.label}: next review in ${lvl.intervalDays} days`
                    : 'Solve or study solution before rating'
                }
                className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? lvl.activeClass
                    : `${lvl.badgeClass} opacity-85 hover:opacity-100`
                } ${!isUnlockedForRating ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-2xs font-bold uppercase tracking-wider">
                    {lvl.value}. {lvl.label}
                  </span>
                  {isSelected && <CheckCircle2 size={13} className="shrink-0" />}
                </div>

                <span className="text-2xs text-muted font-sans line-clamp-1">{lvl.sub}</span>

                <div className="mt-1 flex items-center gap-1 font-mono text-caption text-faint">
                  <Clock size={10} />
                  <span>+{lvl.intervalDays} days</span>
                </div>
              </button>
            )
          })}
        </div>

        {!isUnlockedForRating && (
          <p className="text-2xs text-faint italic font-mono">
            Solve the Arena problem or inspect the reference solution to unlock confidence rating.
          </p>
        )}
      </div>

      {/* Bottom Accordion: Reference Solution & LeetCode Twist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Reference Solution Accordion */}
        <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 border-b border-line pb-2.5">
            <div className="flex items-center gap-2">
              <Cpu size={15} className="text-cyan" />
              <h4 className="font-plate text-xs font-bold uppercase tracking-wider text-chalk">
                Optimal Reference Solution
              </h4>
            </div>
            <button
              type="button"
              className="text-2xs font-semibold text-cyan hover:underline flex items-center gap-1"
              onClick={() => setShowSolution(!showSolution)}
            >
              <Eye size={12} />
              <span>{showSolution ? 'Hide Code' : 'Show Code'}</span>
            </button>
          </div>

          {showSolution ? (
            <div className="flex flex-col gap-3">
              <pre className="overflow-x-auto rounded-xl border border-line bg-ink p-3 font-mono text-xs leading-relaxed text-chalk max-h-[300px]">
                {content.solution.code}
              </pre>
              <div className="prose-forge text-xs text-muted leading-relaxed">
                <Markdown>{content.solution.explanation}</Markdown>
              </div>
              <div className="flex items-center gap-4 text-2xs font-mono border-t border-line/60 pt-2 text-muted">
                <span>Time: <strong className="text-chalk">{content.solution.time}</strong></span>
                <span>Space: <strong className="text-chalk">{content.solution.space}</strong></span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted">
              Review your working code first. The reference solution is available to compare idioms and space optimizations.
            </p>
          )}
        </div>

        {/* Transfer Twist Challenge */}
        <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-amber" />
                <h4 className="font-plate text-xs font-bold uppercase tracking-wider text-chalk">
                  Transfer Twist: Same Pattern, New Wrapper
                </h4>
              </div>
              <LeetCodeLink lc={content.twist.lc} url={leetcodeUrl(content.twist.title)} showLabel />
            </div>

            <div className="space-y-2">
              <h5 className="font-plate text-sm font-semibold text-chalk">{content.twist.title}</h5>
              <div className="prose-forge text-xs text-muted leading-relaxed">
                <Markdown>{content.twist.why}</Markdown>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line/60 bg-panel-2/50 p-2.5 text-2xs text-faint">
            Solve this twist on LeetCode without hints to prove the mental model has permanently transferred.
          </div>
        </div>
      </div>
    </div>
  )
}

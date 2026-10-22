import {
  AlertTriangle,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Columns2,
  Copy,
  Database,
  FileCode,
  LayoutGrid,
  Lightbulb,
  Maximize2,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../api/client'
import type { Progress, QuestionDetail, RunResult, TestCase } from '../../api/types'
import { precomputeTraceNarration } from '../../lib/narrator/index.ts'
import { useCoachStatus } from '../../lib/useCoach'
import { useDraft } from '../../lib/useDraft'
import CodeEditor from '../CodeEditor'
import RunResults from '../RunResults'
import { Button, ErrorNote, Kbd, Markdown } from '../ui'
import { usePlayback } from '../visualizers/stage/usePlayback'
import VisualizerHost from '../visualizers/VisualizerHost'
import { ShimmerButton } from '../vendor/magicui/shimmer-button'
import { PlayIcon } from '../vendor/lucide-animated'
import OrbitRing from './OrbitRing'
import XpRewardToast, { type RewardPayload } from './XpRewardToast'

interface Props {
  question: QuestionDetail
  progress: Progress
  blind: boolean
  onProgress: (p: Progress) => void
  onContinue: () => void
}

type ArenaLayout = 'split' | 'stacked' | 'focus'

const DEFAULT_STACKED_VIZ: Set<string> = new Set([
  'sql_pipeline',
  'dataframe_pipeline',
  'concurrency_timeline',
  'http_lifecycle',
  'system_blueprint',
])

function getDefaultLayout(viz: string): ArenaLayout {
  return DEFAULT_STACKED_VIZ.has(viz) ? 'stacked' : 'split'
}

function getStoredLayout(viz: string): ArenaLayout {
  try {
    const saved = localStorage.getItem(`pf-arena-layout-${viz}`)
    if (saved === 'split' || saved === 'stacked' || saved === 'focus') return saved
  } catch {
    /* private mode fallback */
  }
  return getDefaultLayout(viz)
}

export default function StageArena({ question, progress, blind, onProgress, onContinue }: Props) {
  const content = question.content!
  const initial = blind ? content.starter_code : (question.drafts.main ?? content.starter_code)
  const [code, setCode] = useDraft(question.slug, 'main', initial)
  const [result, setResult] = useState<RunResult | null>(null)
  const [resultTests, setResultTests] = useState<TestCase[]>(content.tests)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reward, setReward] = useState<RewardPayload | null>(null)
  const [shakeFailed, setShakeFailed] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Layout selection & persistence
  const [userLayout, setUserLayout] = useState<ArenaLayout>(() => getStoredLayout(question.visualizer))
  const [isSmallScreen, setIsSmallScreen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false))

  useEffect(() => {
    const onResize = () => setIsSmallScreen(window.innerWidth < 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const saveLayout = (layout: ArenaLayout) => {
    setUserLayout(layout)
    try {
      localStorage.setItem(`pf-arena-layout-${question.visualizer}`, layout)
    } catch {
      /* ignore storage failure */
    }
  }

  const effectiveLayout: ArenaLayout = isSmallScreen ? 'stacked' : userLayout

  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const [hintsShown, setHintsShown] = useState(blind ? 0 : progress.hints_used)
  const [customInput, setCustomInput] = useState('')
  const [tracedCode, setTracedCode] = useState('')
  const coach = useCoachStatus()
  const [coachReply, setCoachReply] = useState<{ text: string | null; error: string | null } | null>(null)
  const [asking, setAsking] = useState(false)

  const askCoach = async () => {
    setAsking(true)
    try {
      const r = await api.askCoach(question.slug, { mode: 'hint', code })
      setCoachReply({ text: r.reply, error: r.error })
      if (!r.reply && hintsShown < 3) setHintsShown(hintsShown + 1)
    } catch (e) {
      setCoachReply({ text: null, error: (e as Error).message })
    } finally {
      setAsking(false)
    }
  }

  // Problem Spec collapsible toggle state (default open so user always sees the question)
  const [isProblemOpen, setIsProblemOpen] = useState(() => {
    try {
      const s = localStorage.getItem('pf-arena-problem-open')
      if (s !== null) return s === 'true'
    } catch {
      /* noop */
    }
    return true
  })

  const toggleProblemOpen = useCallback(() => {
    setIsProblemOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem('pf-arena-problem-open', String(next))
      } catch {
        /* noop */
      }
      return next
    })
  }, [])

  // Alt+P toggles Problem Statement & Spec
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        toggleProblemOpen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleProblemOpen])

  const run = useCallback(
    async (opts: { traceIndex?: number; custom?: unknown; codeOverride?: string } = {}) => {
      const codeToRun = opts.codeOverride ?? code
      setRunning(true)
      setError(null)
      setPlaying(false)
      try {
        const r = await api.run(question.slug, {
          code: codeToRun,
          target: 'main',
          visualize: true,
          trace_test_index: opts.traceIndex,
          custom_args: opts.custom,
        })
        setResult(r)
        setTracedCode(codeToRun)
        setResultTests(r.custom ? [{ args: opts.custom, expected: r.results[0]?.expected, note: 'Your custom input' }] : content.tests)
        onProgress(r.progress)
        setStepIndex(0)
        setPlaying(!!r.trace?.steps.length)

        const allPassed = r.results.length > 0 && r.results.every((res) => res.passed) && !r.compile_error
        if (allPassed) {
          const isReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
          if (!isReducedMotion) {
            confetti({
              particleCount: 75,
              spread: 70,
              origin: { y: 0.6 },
            })
          }
          setReward({
            xp: 50,
            title: progress.solved ? 'Lesson Re-climbed!' : 'Lesson Solved!',
            subtitle: question.title,
          })
        } else {
          setShakeFailed(true)
          setTimeout(() => setShakeFailed(false), 450)
        }
      } catch (e) {
        setError((e as Error).message)
        setShakeFailed(true)
        setTimeout(() => setShakeFailed(false), 450)
      } finally {
        setRunning(false)
      }
    },
    [code, question.slug, question.title, content.tests, onProgress, progress.solved],
  )

  const handleAssembleSolution = useCallback(() => {
    if (!content.solution?.code) return
    setCode(content.solution.code)
    setError(null)
    run({ codeOverride: content.solution.code })
  }, [content.solution?.code, run, setCode])

  const drillCount = content.drills?.length ?? 0
  const hasCompletedDrills = progress.drills_passed.length >= drillCount && drillCount > 0
  const isStarterCode =
    code === content.starter_code ||
    code.trim().endsWith('pass') ||
    code.trim().endsWith('see')
  const showAssembleBanner = !blind && hasCompletedDrills && isStarterCode && Boolean(content.solution?.code)

  // Auto-trace on mount if valid code is present, or auto-assemble if user completed drills with blank/starter code
  const hasMountedRef = useRef(false)
  useEffect(() => {
    if (hasMountedRef.current) return
    hasMountedRef.current = true

    const isStarterOrEmpty =
      !code ||
      code === content.starter_code ||
      code.trim().endsWith('pass')

    if (!blind && hasCompletedDrills && isStarterOrEmpty && content.solution?.code) {
      setCode(content.solution.code)
      run({ codeOverride: content.solution.code })
    } else if (
      code &&
      code !== content.starter_code &&
      !code.trim().endsWith('pass') &&
      !code.trim().endsWith('see')
    ) {
      run({ codeOverride: code })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runCustom = () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(customInput)
    } catch {
      setError('Custom input must be JSON: a list of arguments, e.g. [[2, 7, 11, 15], 9]')
      return
    }
    run({ custom: parsed })
  }

  const revealHint = async () => {
    const n = hintsShown + 1
    setHintsShown(n)
    if (!blind) {
      try {
        onProgress(await api.patchProgress(question.slug, { hints_used: n }))
      } catch {
        /* informational */
      }
    }
  }

  const trace = result?.trace
  const steps = trace?.steps ?? []
  const step = steps[stepIndex]

  const firstFailed = result?.results.findIndex((r) => !r.passed) ?? -1
  const errorLine = result?.compile_error?.line ?? (firstFailed >= 0 ? null : null)

  const playback = usePlayback({
    trace: trace ?? null,
    index: stepIndex,
    onIndex: setStepIndex,
    playing,
    onPlaying: setPlaying,
    speed,
    onSpeed: setSpeed,
  })

  // Precompute trace-wide semantic narration for O(1) synchronized playback & telemetry
  const narrations = useMemo(() => {
    if (!trace?.steps || trace.steps.length === 0) return []
    return precomputeTraceNarration(trace.steps, trace.line_info, content.viz, question.visualizer)
  }, [trace, content.viz, question.visualizer])

  const currentNarration = narrations[stepIndex]

  // ----------------------------------------------------------------------------------------
  // Visualizer Section with Universal StageShell Architecture
  // ----------------------------------------------------------------------------------------
  const visualizerSection = (
    <section className="flex flex-col w-full min-h-[420px]">
      <VisualizerHost
        kind={question.visualizer}
        title={content.viz?.title || question.title}
        description={question.world_name ? `${question.world_name} · ${question.patterns.join(', ')}` : undefined}
        timeComplexity={content.viz?.complexity?.time || content.solution?.time}
        spaceComplexity={content.viz?.complexity?.space || content.solution?.space}
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
        prev={steps[stepIndex - 1]}
        steps={steps}
        index={stepIndex}
        config={content.viz}
        code={tracedCode || code}
        playing={playing}
        onTogglePlay={playback.togglePlay}
        onStepForward={playback.stepForward}
        onStepBackward={playback.stepBackward}
        onJumpFirst={playback.jumpFirst}
        onJumpLast={playback.jumpLast}
        onSeek={setStepIndex}
        speed={speed}
        onSpeedChange={setSpeed}
      />
      {trace?.error && !steps.length && <ErrorNote message={`${trace.error.type}: ${trace.error.message}`} />}
    </section>
  )

  // ----------------------------------------------------------------------------------------
  // Editor Section (Wrapped in .pf-glass-panel with VS Code / Linear Header & Floating Toolbar)
  // ----------------------------------------------------------------------------------------
  const editorSection = (
    <section className="flex flex-col gap-3">
      {/* Assemble from Drills Alert Banner (shown when user passed drills but has starter or incomplete code) */}
      {showAssembleBanner && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald/30 bg-emerald/[0.08] px-3.5 py-2.5 text-xs text-chalk shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={15} className="text-emerald shrink-0" />
            <span className="text-2xs sm:text-xs">
              You forged <strong>{progress.drills_passed.length} of {drillCount} parts</strong> in Stage 2! Load the assembled solution into the editor to trace it immediately.
            </span>
          </div>
          <button
            type="button"
            onClick={handleAssembleSolution}
            className="flex items-center gap-1.5 rounded-lg bg-emerald hover:bg-emerald-hi px-3 py-1 font-mono text-2xs font-bold text-void transition-colors shadow-xs shrink-0"
          >
            <Zap size={12} className="fill-current text-void" />
            <span>Assemble & Trace</span>
          </button>
        </div>
      )}

      <div
        className={`pf-glass-panel min-h-[380px] h-[440px] overflow-hidden rounded-2xl border border-line shadow-2xl flex flex-col transition-all duration-300 ${
          shakeFailed ? 'animate-shake pulse-red' : ''
        }`}
      >
        {/* Top Header Bar (Active File Tab, Language Badge, Runtime Status) */}
        <div className="flex flex-wrap items-center justify-between border-b border-line bg-panel-2/90 px-3.5 py-2 gap-2 text-xs">
          {/* Active File Tab & Runtime Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-panel px-2.5 py-1 text-chalk shadow-xs">
              {question.runner_type === 'sql_sqlite' ? (
                <Database size={13} className="text-cyan shrink-0" />
              ) : (
                <FileCode size={13} className="text-amber shrink-0" />
              )}
              <span className="font-mono text-2xs font-semibold">
                {question.runner_type === 'sql_sqlite' ? 'solution.sql' : 'solution.py'}
              </span>
              {code !== content.starter_code && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber" title="Unsaved changes in draft" />
              )}
            </div>

            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-2xs text-muted border border-line bg-panel-2/60">
              {question.runner_type === 'sql_sqlite' ? 'SQL · SQLite' : 'Python 3.11 Sandboxed'}
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 text-caption text-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald pf-beacon" />
              <span>128MB RAM · 3.0s Limit</span>
            </span>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {content.solution?.code && (
              <button
                type="button"
                onClick={handleAssembleSolution}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-2xs font-semibold text-emerald bg-emerald/10 hover:bg-emerald/20 transition-colors border border-emerald/30 shadow-xs"
                title="Assemble canonical solution from drills"
              >
                <Sparkles size={12} className="text-emerald" />
                <span>Assemble Solution</span>
              </button>
            )}

            <button
              type="button"
              onClick={copyCode}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-2xs text-muted hover:text-chalk hover:bg-panel transition-colors border border-transparent hover:border-line"
              title="Copy solution code"
            >
              {copied ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCode(content.starter_code)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-2xs text-muted hover:text-chalk hover:bg-panel transition-colors border border-transparent hover:border-line"
              title="Reset to starter code"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>

            {/* View Layout Controls (Split, Stacked) */}
            <div className="hidden lg:flex items-center rounded-lg border border-line bg-panel p-0.5 text-2xs">
              <button
                type="button"
                onClick={() => saveLayout('split')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  effectiveLayout === 'split' ? 'bg-cyan/20 text-cyan font-semibold' : 'text-faint hover:text-muted'
                }`}
                title="Split View"
              >
                <Columns2 size={12} />
              </button>
              <button
                type="button"
                onClick={() => saveLayout('stacked')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  effectiveLayout === 'stacked' ? 'bg-cyan/20 text-cyan font-semibold' : 'text-faint hover:text-muted'
                }`}
                title="Stacked View"
              >
                <LayoutGrid size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Monaco Editor Canvas */}
        <div className="flex-1 min-h-0 w-full">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={question.runner_type === 'sql_sqlite' ? 'sql' : 'python'}
            traceLine={step && step.event !== 'call' ? step.line : null}
            errorLine={errorLine}
            onRun={() => run()}
            step={step}
            prevStep={steps[stepIndex - 1]}
          />
        </div>

        {/* Bottom Editor Toolbar with Primary Action & Floating Keyboard Shortcut Badges */}
        <div className="flex flex-wrap items-center justify-between border-t border-line bg-panel-2/90 px-3.5 py-2.5 gap-2">
          <div className="flex items-center gap-2">
            <ShimmerButton
              onClick={() => run()}
              disabled={running}
              background="var(--peak-accent, #6EE7B7)"
              shimmerColor="#FFFFFF"
              className="h-8 text-xs px-4 flex items-center gap-2 font-mono font-bold text-void shadow-[0_0_16px_rgba(110,231,183,0.35)]"
            >
              {running ? <OrbitRing size={13} /> : <PlayIcon size={14} className="fill-current text-void" />}
              <span>{running ? 'Tracing…' : 'Run & Trace'}</span>
            </ShimmerButton>

            {/* Floating Keyboard Shortcut Badges */}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-2xs font-mono text-muted bg-panel px-2.5 py-1 rounded-md border border-line shadow-xs">
              <Kbd keys={['Ctrl', 'Enter']} />
              <span className="text-faint">to run / submit</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-2xs font-mono text-faint">
            <span className="hidden md:flex items-center gap-1">
              <Kbd keys={['←', '→']} /> step
            </span>
            <span className="hidden md:flex items-center gap-1">
              <Kbd keys={['Space']} /> play/pause
            </span>
          </div>
        </div>
      </div>

      {/* Custom Arguments Input Bar */}
      <div className="flex gap-2">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && customInput && runCustom()}
          placeholder={`Custom JSON args, e.g. ${JSON.stringify(content.tests[0]?.args ?? [])}`}
          className="min-w-0 flex-1 rounded-lg border border-line bg-panel-2/80 px-3 py-1.5 font-mono text-xs text-chalk placeholder:text-faint focus:border-cyan focus:outline-none"
          aria-label="Custom input as JSON arguments"
        />
        <Button variant="outline" onClick={runCustom} disabled={!customInput || running} className="h-8 text-xs px-3 shrink-0">
          Trace custom
        </Button>
      </div>
    </section>
  )

  // ----------------------------------------------------------------------------------------
  // Test Results Section
  // ----------------------------------------------------------------------------------------
  const resultsSection = (
    <section className="card rounded-2xl border border-line p-4">
      {error && <ErrorNote message={error} />}
      {content.solution?.code && (error || result?.compile_error || (result && !result.passed) || (trace?.error && !steps.length)) && (
        <div className="mb-3 mt-1 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber/30 bg-amber/10 p-3 text-xs text-amber shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={15} className="shrink-0 text-amber" />
            <span className="text-2xs sm:text-xs">
              Execution encountered an error. Load the verified solution assembled from your Stage 2 drills to fix it immediately.
            </span>
          </div>
          <button
            type="button"
            onClick={handleAssembleSolution}
            className="flex items-center gap-1.5 rounded-lg bg-amber/20 hover:bg-amber/30 px-3 py-1 font-mono text-2xs font-bold text-chalk border border-amber/40 transition-colors shrink-0 shadow-xs"
          >
            <Sparkles size={12} className="text-amber" />
            <span>Fix with Assembled Solution</span>
          </button>
        </div>
      )}
      {result ? (
        <>
          <RunResults
            result={result}
            tests={resultTests}
            spec={content.function}
            tracedIndex={result.custom ? null : (trace?.test_index ?? null)}
            onVisualize={(i: number) => run({ traceIndex: i })}
          />
          {result.passed && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <span className="text-xs font-semibold text-emerald">
                All test assertions verified! Proceed to Interview Defense.
              </span>
              <Button onClick={onContinue} className="h-8 text-xs px-4">
                Stage 4: Pitch Defense →
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-xs text-muted py-6">
          Execute code with test assertions to view execution metrics and trace steps.
        </div>
      )}
    </section>
  )

  // ----------------------------------------------------------------------------------------
  // Hints and AI Coach Section
  // ----------------------------------------------------------------------------------------
  const hintsSection = (
    <div className="flex flex-col gap-3">
      {content.hints.length > 0 && (
        <section className="card rounded-2xl border border-line p-4">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-chalk">
              <Lightbulb size={13} className="text-amber" />
              <span>Step-by-Step Hints</span>
            </h4>
            {hintsShown < content.hints.length && (
              <Button variant="ghost" className="h-7 text-xs px-2" onClick={revealHint}>
                Reveal hint {hintsShown + 1}
              </Button>
            )}
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {content.hints.slice(0, hintsShown).map((h, i) => (
              <div key={i} className="rounded-xl border border-line bg-panel-2 p-3 text-xs text-muted">
                <span className="font-semibold text-chalk">Hint {i + 1}: </span>
                <span>{h}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {coach?.enabled && (
        <section className="card rounded-2xl border border-line p-4">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-chalk">
              <Bot size={13} className="text-cyan" />
              <span>AI Engineering Coach</span>
            </h4>
            <Button variant="ghost" className="h-7 text-xs px-2" onClick={askCoach} disabled={asking}>
              {asking ? 'Thinking…' : 'Ask for a hint'}
            </Button>
          </div>
          {coachReply?.text && (
            <div className="mt-2 rounded-xl border border-line bg-panel-2 p-3 text-xs text-chalk">
              <Markdown>{coachReply.text}</Markdown>
            </div>
          )}
        </section>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Arena Top Toolbar: Title, Blind Notice, and Layout Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="font-plate text-base font-semibold text-chalk">
            Visualizer Sandbox
          </h2>
          <span className="rounded-full border border-line bg-panel-2 px-2 py-0.5 font-mono text-2xs text-muted">
            {question.visualizer}
          </span>
          {blind && (
            <span className="rounded-full border border-amber/30 bg-amber/10 px-2 py-0.5 text-2xs font-semibold text-amber">
              Blind Re-Solve Mode
            </span>
          )}
        </div>

        {/* Layout Mode Switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-line bg-panel-2 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => saveLayout('split')}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              effectiveLayout === 'split' ? 'bg-panel text-chalk shadow-sm' : 'text-muted hover:text-chalk'
            }`}
            title="Side-by-side split view"
          >
            <Columns2 size={12} />
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            type="button"
            onClick={() => saveLayout('stacked')}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              effectiveLayout === 'stacked' ? 'bg-panel text-chalk shadow-sm' : 'text-muted hover:text-chalk'
            }`}
            title="Stacked full-width visualizer view"
          >
            <LayoutGrid size={12} />
            <span className="hidden sm:inline">Stacked</span>
          </button>
          <button
            type="button"
            onClick={() => saveLayout('focus')}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              effectiveLayout === 'focus' ? 'bg-panel text-chalk shadow-sm' : 'text-muted hover:text-chalk'
            }`}
            title="Focus on editor"
          >
            <Maximize2 size={12} />
            <span className="hidden sm:inline">Focus</span>
          </button>
        </div>
      </div>

      {/* Problem Statement & Spec Panel */}
      {content.statement && (
        <div className="pf-glass-panel rounded-2xl border border-line overflow-hidden transition-all duration-300 shadow-md">
          <button
            type="button"
            onClick={toggleProblemOpen}
            className="w-full flex items-center justify-between px-4 py-3 bg-panel-2/90 hover:bg-panel transition-colors text-left"
            aria-expanded={isProblemOpen}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan/40 bg-cyan/10 text-cyan shadow-xs">
                <BookOpen size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-plate text-sm font-semibold text-chalk">
                    {question.title}
                  </span>
                  <span className="rounded-full border border-line bg-panel px-2 py-0.5 text-2xs font-mono text-muted">
                    #{question.lc}
                  </span>
                  <span className="rounded-full border border-emerald/30 bg-emerald/10 px-2 py-0.5 text-2xs font-semibold text-emerald">
                    {question.difficulty}
                  </span>
                  <span className="rounded-full border border-line bg-panel-2 px-2 py-0.5 font-mono text-2xs text-muted">
                    Target: {content.solution?.time || 'O(N)'} time · {content.solution?.space || 'O(N)'} space
                  </span>
                </div>
                {!isProblemOpen && (
                  <p className="text-2xs text-muted truncate mt-0.5">
                    {content.statement.clean.replace(/\n+/g, ' ')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-xs text-muted ml-3">
              <span className="hidden sm:inline-flex items-center gap-1 font-mono text-2xs text-faint">
                <Kbd keys={['Alt', 'P']} /> toggle
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-cyan hover:text-cyan-hi transition-colors">
                <span>{isProblemOpen ? 'Hide Problem' : 'View Problem & Examples'}</span>
                {isProblemOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </span>
            </div>
          </button>

          {isProblemOpen && (
            <div className="border-t border-line bg-void/70 p-4 sm:p-5 flex flex-col gap-4">
              {/* Problem Description */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-mono uppercase tracking-wider font-semibold text-faint">
                    Problem Description
                  </span>
                  {content.function?.returns && (
                    <span className="text-2xs font-mono text-muted">
                      Returns: <code className="text-cyan font-semibold">{content.function.returns}</code>
                    </span>
                  )}
                </div>
                <div className="text-xs text-chalk leading-relaxed prose prose-invert max-w-none">
                  <Markdown>{content.statement.clean}</Markdown>
                </div>
              </div>

              {/* Examples Grid */}
              {content.statement.examples && content.statement.examples.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-2xs font-mono uppercase tracking-wider font-semibold text-faint">
                    Examples
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {content.statement.examples.slice(0, 3).map((ex, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-line bg-panel-2/80 p-3 flex flex-col gap-1.5 text-xs shadow-xs"
                      >
                        <div className="flex items-center justify-between border-b border-line/60 pb-1">
                          <span className="font-mono text-2xs font-bold text-cyan">
                            Example {i + 1}
                          </span>
                        </div>
                        <div className="font-mono text-2xs bg-void/80 rounded-md p-1.5 border border-line">
                          <span className="text-muted">Input: </span>
                          <span className="text-chalk">{ex.input}</span>
                        </div>
                        <div className="font-mono text-2xs bg-void/80 rounded-md p-1.5 border border-line">
                          <span className="text-muted">Output: </span>
                          <span className="text-emerald font-semibold">{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <p className="text-2xs text-muted italic mt-0.5 leading-normal">
                            {ex.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Constraints and Targets Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60 text-2xs">
                {content.statement.constraints && content.statement.constraints.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-faint uppercase tracking-wider">Constraints:</span>
                    {content.statement.constraints.map((c, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-muted shadow-2xs"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 font-mono text-muted ml-auto">
                  <div className="flex items-center gap-1">
                    <span className="text-faint">Optimal:</span>
                    <span className="text-cyan font-bold">{content.solution?.time || 'O(N)'}</span>
                    <span className="text-faint">time</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <span className="text-cyan font-bold">{content.solution?.space || 'O(N)'}</span>
                    <span className="text-faint">space</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Render Selected Layout Structure */}
      {effectiveLayout === 'split' ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[58fr_42fr]">
            {visualizerSection}
            {editorSection}
          </div>
          <div className="grid gap-4 xl:grid-cols-[58fr_42fr]">
            {resultsSection}
            {hintsSection}
          </div>
        </>
      ) : effectiveLayout === 'stacked' ? (
        <>
          {visualizerSection}
          <div className="grid gap-4 lg:grid-cols-2">
            {editorSection}
            <div className="flex flex-col gap-4">
              {resultsSection}
              {hintsSection}
            </div>
          </div>
        </>
      ) : (
        /* Focus layout */
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {editorSection}
            <div className="flex flex-col gap-4">
              {resultsSection}
              {hintsSection}
            </div>
          </div>
          {visualizerSection}
        </>
      )}

      {/* Reward notification toast */}
      <XpRewardToast reward={reward} onDismiss={() => setReward(null)} />
    </div>
  )
}

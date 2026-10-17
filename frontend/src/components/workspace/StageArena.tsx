import {
  Bot,
  Check,
  Columns2,
  Copy,
  Database,
  FileCode,
  LayoutGrid,
  Lightbulb,
  Maximize2,
  Play,
  RotateCcw,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Progress, QuestionDetail, RunResult, TestCase } from '../../api/types'
import { useCoachStatus } from '../../lib/useCoach'
import { useDraft } from '../../lib/useDraft'
import CodeEditor from '../CodeEditor'
import RunResults from '../RunResults'
import { Button, ErrorNote, Kbd, Markdown } from '../ui'
import TracePlayer from '../visualizers/TracePlayer'
import VisualizerHost from '../visualizers/VisualizerHost'
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

  const run = useCallback(
    async (opts: { traceIndex?: number; custom?: unknown } = {}) => {
      setRunning(true)
      setError(null)
      setPlaying(false)
      try {
        const r = await api.run(question.slug, {
          code,
          target: 'main',
          visualize: true,
          trace_test_index: opts.traceIndex,
          custom_args: opts.custom,
        })
        setResult(r)
        setTracedCode(code)
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

  // ----------------------------------------------------------------------------------------
  // Visualizer Section with Pinned Playback Controls
  // ----------------------------------------------------------------------------------------
  // ----------------------------------------------------------------------------------------
  // Visualizer Section with Professional Transport Controls
  // ----------------------------------------------------------------------------------------
  const visualizerSection = (
    <section className="pf-glass-panel flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-line shadow-2xl">
      {/* Pinned Playback Header */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between border-b border-line bg-panel-2/95 backdrop-blur px-3.5 py-2.5 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan pf-beacon shrink-0" />
            <span className="font-plate text-xs font-bold uppercase tracking-wider text-chalk">
              State & Memory Visualizer
            </span>
          </div>
          {trace && !result?.custom && (
            <span className="font-mono text-2xs text-muted truncate border border-line/60 bg-panel px-2 py-0.5 rounded-md">
              Test {trace.test_index + 1} ({steps.length} frames)
            </span>
          )}
          {result?.custom && (
            <span className="font-mono text-2xs text-cyan border border-cyan/40 bg-cyan/15 px-2 py-0.5 rounded-md">
              Custom Execution Trace
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-2xs text-faint font-mono">
          <span className="hidden sm:inline">Archetype:</span>
          <span className="rounded border border-line/50 bg-panel px-1.5 py-0.5 text-muted uppercase">
            {question.visualizer.replace(/_/g, ' ')}
          </span>
        </div>
      </header>

      {/* Embedded TracePlayer transport bar */}
      {trace && steps.length > 0 && (
        <div className="border-b border-line bg-panel/60 p-2 sm:p-2.5">
          <TracePlayer
            trace={trace}
            index={Math.min(stepIndex, steps.length - 1)}
            onIndex={setStepIndex}
            playing={playing}
            onPlaying={setPlaying}
            speed={speed}
            onSpeed={setSpeed}
          />
        </div>
      )}

      {/* Internal Scrollable Canvas Container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-5 max-w-full">
        <div className="inline-block min-w-full">
          {step ? (
            <VisualizerHost
              kind={question.visualizer}
              step={step}
              prev={steps[stepIndex - 1]}
              steps={steps}
              index={stepIndex}
              config={content.viz}
              code={tracedCode}
            />
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center text-sm text-muted">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-panel-2/50 text-cyan mb-3 shadow-md">
                <Play size={20} className="fill-cyan/20 ml-0.5" />
              </div>
              <p className="max-w-md leading-relaxed px-4 text-xs font-mono">
                Press <strong className="text-chalk font-semibold">Ctrl + Enter</strong> to execute your code and record the step-by-step memory, stack, or database state.
              </p>
            </div>
          )}
          {trace?.error && !steps.length && <ErrorNote message={`${trace.error.type}: ${trace.error.message}`} />}
        </div>
      </div>
    </section>
  )

  // ----------------------------------------------------------------------------------------
  // Editor Section (Wrapped in .pf-glass-panel with VS Code / Linear Header & Floating Toolbar)
  // ----------------------------------------------------------------------------------------
  const editorSection = (
    <section className="flex flex-col gap-3">
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
          />
        </div>

        {/* Bottom Editor Toolbar with Primary Action & Floating Keyboard Shortcut Badges */}
        <div className="flex flex-wrap items-center justify-between border-t border-line bg-panel-2/90 px-3.5 py-2.5 gap-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => run()}
              disabled={running}
              className="h-8 text-xs px-4 flex items-center gap-2 bg-forge text-void hover:bg-forge/90 font-semibold shadow-[0_0_16px_rgba(110,231,183,0.35)]"
            >
              {running ? <OrbitRing size={13} /> : <Play size={13} className="fill-current" />}
              <span>{running ? 'Running...' : 'Run & Trace'}</span>
            </Button>

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

      {/* Render Selected Layout Structure */}
      {effectiveLayout === 'split' ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            {visualizerSection}
            {editorSection}
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
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

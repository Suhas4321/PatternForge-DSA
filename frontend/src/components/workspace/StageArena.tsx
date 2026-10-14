import { BookOpen, Bot, Lightbulb, Play, RotateCcw } from 'lucide-react'
import { useCallback, useState } from 'react'
import { api } from '../../api/client'
import type { Progress, QuestionDetail, RunResult, TestCase } from '../../api/types'
import { useCoachStatus } from '../../lib/useCoach'
import { useDraft } from '../../lib/useDraft'
import CodeEditor from '../CodeEditor'
import RunResults from '../RunResults'
import { Button, ErrorNote, Kbd, Markdown } from '../ui'
import TracePlayer from '../visualizers/TracePlayer'
import VisualizerHost from '../visualizers/VisualizerHost'

interface Props {
  question: QuestionDetail
  progress: Progress
  blind: boolean
  onProgress: (p: Progress) => void
  onContinue: () => void
}

export default function StageArena({ question, progress, blind, onProgress, onContinue }: Props) {
  const content = question.content!
  const initial = blind ? content.starter_code : (question.drafts.main ?? content.starter_code)
  const [code, setCode] = useDraft(question.slug, 'main', initial)
  const [result, setResult] = useState<RunResult | null>(null)
  const [resultTests, setResultTests] = useState<TestCase[]>(content.tests)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      if (!r.reply && hintsShown < 3) setHintsShown(hintsShown + 1) // fall back to the next built-in hint
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
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setRunning(false)
      }
    },
    [code, question.slug, content.tests, onProgress],
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
        /* hint count is informational */
      }
    }
  }

  const studySolution = async () => {
    onProgress(await api.patchProgress(question.slug, { studied_solution: true }))
    onContinue()
  }

  const trace = result?.trace
  const steps = trace?.steps ?? []
  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const errorLine =
    result?.compile_error?.line ?? result?.results.find((r) => r.error?.line)?.error?.line ?? trace?.error?.line ?? null

  return (
    <div className="flex flex-col gap-4">
      {blind && (
        <div className="rounded-md border border-sky/30 bg-sky/5 px-4 py-2 text-sm text-sky">
          Blind re-solve: starter code only, no hints. Solve it from memory of the pattern, not the code.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Visualizer */}
        <section className="flex min-h-[28rem] flex-col rounded-xl border border-line bg-panel">
          <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h3 className="text-sm font-semibold">Visualizer</h3>
            {trace && !result?.custom && (
              <span className="text-xs text-muted">Tracing test {trace.test_index + 1}</span>
            )}
            {result?.custom && <span className="text-xs text-muted">Tracing your custom input</span>}
          </header>
          <div className="drafting flex-1 overflow-auto p-5">
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
              <div className="flex h-full items-center justify-center text-center text-sm text-muted">
                <p className="max-w-xs">
                  Run your code to watch it execute line by line. Every pointer, map and variable comes from your
                  own code, not a canned animation.
                </p>
              </div>
            )}
            {trace?.error && !steps.length && <ErrorNote message={`${trace.error.type}: ${trace.error.message}`} />}
          </div>
          {trace && steps.length > 0 && (
            <div className="border-t border-line px-4 py-3">
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
        </section>

        {/* Editor */}
        <section className="flex flex-col gap-3">
          <div className="h-[28rem] overflow-hidden rounded-xl border border-line">
            <CodeEditor
              value={code}
              onChange={setCode}
              traceLine={step && step.event !== 'call' ? step.line : null}
              errorLine={errorLine}
              onRun={() => run()}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => run()} disabled={running}>
              <Play size={15} /> {running ? 'Running' : 'Run and visualize'}
            </Button>
            <Button variant="ghost" onClick={() => setCode(content.starter_code)} title="Reset to starter code">
              <RotateCcw size={15} /> Reset
            </Button>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-faint">
              <span className="flex items-center gap-1"><Kbd keys={['Ctrl', 'Enter']} /> run</span>
              <span className="flex items-center gap-1"><Kbd keys={['←', '→']} /> step</span>
              <span className="flex items-center gap-1"><Kbd keys={['Space']} /> play</span>
            </span>
          </div>
          <div className="flex gap-2">
            <input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && customInput && runCustom()}
              placeholder={`Your own input, e.g. ${JSON.stringify(content.tests[0].args)}`}
              className="min-w-0 flex-1 rounded-md border border-line bg-ink px-3 py-1.5 font-mono text-xs text-chalk placeholder:text-faint"
              aria-label="Custom input as JSON arguments"
            />
            <Button variant="outline" onClick={runCustom} disabled={!customInput || running}>
              Visualize my input
            </Button>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-line bg-panel p-4">
          {error && <ErrorNote message={error} />}
          {result ? (
            <>
              <RunResults
                result={result}
                tests={resultTests}
                spec={content.function}
                tracedIndex={result.custom ? null : (trace?.test_index ?? null)}
                onVisualize={(i) => run({ traceIndex: i })}
              />
              {result.passed && !result.custom && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-verdigris/40 bg-verdigris/10 px-4 py-3">
                  <span className="text-sm text-chalk">Solved. Now practise saying it out loud.</span>
                  <Button onClick={onContinue}>Open the pitch studio</Button>
                </div>
              )}
            </>
          ) : (
            !error && <p className="text-sm text-muted">Test results appear here after you run your code.</p>
          )}
        </section>

        {!blind && (
          <section className="rounded-xl border border-line bg-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Socratic hints</h3>
              <span className="text-xs text-muted">{hintsShown} of 3 used</span>
            </div>
            <ol className="flex flex-col gap-2">
              {content.hints.slice(0, hintsShown).map((h, i) => (
                <li key={i} className="rounded-md border border-ochre/30 bg-ochre/5 px-3 py-2 text-sm">
                  <div className="mb-1 text-xs text-ochre">
                    {['Pattern intuition', 'State transition', 'Pseudocode blueprint'][i]}
                  </div>
                  {i === 2 ? (
                    <pre className="font-mono text-xs whitespace-pre-wrap text-chalk">{h}</pre>
                  ) : (
                    <Markdown>{h}</Markdown>
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-3 flex flex-wrap gap-2">
              {hintsShown < 3 && (
                <Button variant="outline" onClick={revealHint}>
                  <Lightbulb size={15} /> {hintsShown === 0 ? 'Get a nudge' : 'Next hint'}
                </Button>
              )}
              {coach?.enabled && (
                <Button variant="glass" onClick={askCoach} disabled={asking}>
                  <Bot size={15} /> {asking ? 'Coach is reading your code' : 'Ask Socratic Coach'}
                </Button>
              )}
              {!progress.solved && (
                <Button variant="ghost" onClick={studySolution}>
                  <BookOpen size={15} /> Study the optimal solution
                </Button>
              )}
            </div>
            {coachReply && (
              <div className="mt-3 rounded-lg border border-indigo/30 bg-indigo/[0.06] px-3 py-2.5 text-sm">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-sky">
                  <Bot size={13} /> Socratic coach{coach?.model ? `, ${coach.model}` : ''}
                </div>
                {coachReply.text ? (
                  <Markdown>{coachReply.text}</Markdown>
                ) : (
                  <p className="text-muted">
                    {coachReply.error} The next built-in hint is shown above instead.
                  </p>
                )}
              </div>
            )}
            {coach && !coach.enabled && (
              <p className="mt-3 text-2xs text-faint">
                The AI coach is off. Add AI_BASE_URL + AI_API_KEY (Snowflake Cortex or any OpenAI-compatible API) or
                GEMINI_API_KEY to backend/.env to turn it on. These built-in hints work offline.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

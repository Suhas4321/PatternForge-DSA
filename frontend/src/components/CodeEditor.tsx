import Editor, { type OnMount } from '@monaco-editor/react'
import { useEffect, useRef, useState, useMemo } from 'react'
import { monaco, getMonacoTheme } from '../lib/monaco'
import { useTheme } from './effects'
import type { TraceStep } from '../api/types'
import { formatValue, visibleLocals, changedNames } from '../lib/trace'
import { Code2, Variable, Cpu } from 'lucide-react'
import MemoryStage from './visualizers/memory/MemoryStage'

type IEditor = Parameters<OnMount>[0]

interface Props {
  value: string
  onChange?: (value: string) => void
  language?: string
  height?: string | number
  readOnly?: boolean
  /** Line the trace is currently on (highlighted in amber/cyan). */
  traceLine?: number | null
  /** Line of the last error (highlighted in red). */
  errorLine?: number | null
  onRun?: () => void
  step?: TraceStep
  prevStep?: TraceStep
}

export default function CodeEditor({
  value,
  onChange,
  language = 'python',
  height = '100%',
  readOnly,
  traceLine,
  errorLine,
  onRun,
  step,
  prevStep,
}: Props) {
  const [activeTab, setActiveTab] = useState<'code' | 'variables' | 'memory'>('code')
  const [resolvedTheme] = useTheme()
  const monacoTheme = getMonacoTheme(resolvedTheme)
  const editorRef = useRef<IEditor | null>(null)
  const decorations = useRef<ReturnType<IEditor['createDecorationsCollection']> | null>(null)
  const runRef = useRef(onRun)
  useEffect(() => {
    runRef.current = onRun
  }, [onRun])

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor
    decorations.current = editor.createDecorationsCollection()
    // Ctrl/Cmd+Enter runs the code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current?.())
  }

  // Highlight line in Monaco and scroll to viewport
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !decorations.current) return
    const items = []
    if (traceLine) {
      items.push({
        range: new monaco.Range(traceLine, 1, traceLine, 1),
        options: { isWholeLine: true, className: 'trace-line-highlight' },
      })
      editor.revealLineInCenterIfOutsideViewport(traceLine)
    }
    if (errorLine && errorLine !== traceLine) {
      items.push({
        range: new monaco.Range(errorLine, 1, errorLine, 1),
        options: { isWholeLine: true, className: 'error-line-highlight' },
      })
    }
    decorations.current.set(items)
  }, [traceLine, errorLine])

  // Extract visible variables and changed variable names
  const locals = useMemo(() => visibleLocals(step), [step])
  const changedVars = useMemo(() => changedNames(prevStep, step), [prevStep, step])

  // Extract inline value hints for the current line
  const inlineHints = useMemo(() => {
    if (!step || !traceLine) return ''
    const entries = Object.entries(locals)
      .filter(([name]) => name !== 'self')
      .slice(0, 3)
      .map(([name, sv]) => `${name} = ${formatValue(sv.value, step.heap, 1)}`)
    return entries.join('  ·  ')
  }, [step, traceLine, locals])

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden bg-void">
      {/* Top Tabs Row: [Code] [Variables] [Memory] */}
      <div className="flex items-center justify-between border-b border-line bg-panel-2/95 px-3 py-1.5 text-xs font-mono select-none">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-semibold transition-colors ${
              activeTab === 'code'
                ? 'bg-panel border border-line-strong text-chalk shadow-xs'
                : 'text-muted hover:text-chalk'
            }`}
          >
            <Code2 size={13} className="text-cyan" />
            <span>Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variables')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-semibold transition-colors ${
              activeTab === 'variables'
                ? 'bg-panel border border-line-strong text-chalk shadow-xs'
                : 'text-muted hover:text-chalk'
            }`}
          >
            <Variable size={13} className="text-amber" />
            <span>Variables</span>
            {Object.keys(locals).length > 0 && (
              <span className="ml-1 rounded bg-amber/20 px-1 py-0.2 text-[10px] text-amber font-bold">
                {Object.keys(locals).length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-semibold transition-colors ${
              activeTab === 'memory'
                ? 'bg-panel border border-line-strong text-chalk shadow-xs'
                : 'text-muted hover:text-chalk'
            }`}
          >
            <Cpu size={13} className="text-orchid" />
            <span>Memory</span>
            {step && Object.keys(step.heap).length > 0 && (
              <span className="ml-1 rounded bg-orchid/20 px-1 py-0.2 text-[10px] text-orchid font-bold">
                {Object.keys(step.heap).length}
              </span>
            )}
          </button>
        </div>

        {/* Floating Line Chip */}
        {traceLine && activeTab === 'code' && (
          <div className="flex items-center gap-1 rounded-full border border-cyan/40 bg-cyan/15 px-2 py-0.5 text-[11px] font-mono font-bold text-cyan animate-in fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
            <span>Line {traceLine}</span>
          </div>
        )}
      </div>

      {/* Editor or Inspector Body */}
      <div className="relative flex-1 min-h-0 w-full">
        {activeTab === 'code' && (
          <>
            <Editor
              height={height}
              language={language}
              theme={monacoTheme}
              value={value}
              onChange={(v) => onChange?.(v ?? '')}
              onMount={handleMount}
              loading={<div className="p-4 text-sm text-muted">Loading editor</div>}
              options={{
                readOnly,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                lineHeight: 21,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                tabSize: 4,
                insertSpaces: true,
                renderLineHighlight: 'line',
                padding: { top: 12, bottom: 28 },
                automaticLayout: true,
                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                fixedOverflowWidgets: true,
              }}
            />

            {/* Inline Value Hints Footer Bar */}
            {inlineHints && (
              <div className="absolute bottom-0 inset-x-0 border-t border-line/60 bg-panel/90 backdrop-blur px-3 py-1 font-mono text-2xs text-muted truncate z-10">
                <span className="text-faint font-semibold uppercase mr-1.5">Values:</span>
                <span className="text-chalk">{inlineHints}</span>
              </div>
            )}
          </>
        )}

        {/* Variables Inspector Tab */}
        {activeTab === 'variables' && (
          <div className="h-full overflow-y-auto p-4 font-mono text-xs space-y-2">
            <div className="text-2xs font-semibold uppercase tracking-wider text-faint mb-2">
              Scope Variables at Step {step ? `(Frame: ${step.func})` : '—'}
            </div>
            {Object.keys(locals).length === 0 ? (
              <p className="text-muted text-xs italic">No variables in scope yet. Run your code to trace.</p>
            ) : (
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
                {Object.entries(locals).map(([name, sv]) => {
                  const isChanged = changedVars.has(name)
                  return (
                    <div key={name} className="contents">
                      <span className="text-muted font-bold">{name}</span>
                      <div
                        className={`rounded px-2 py-1 text-chalk transition-all ${
                          isChanged ? 'bg-cyan/25 border border-cyan/50 text-cyan font-bold' : 'bg-panel-2'
                        }`}
                      >
                        {formatValue(sv.value, step?.heap)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Memory View Tab (Python Tutor Stack -> Heap DAG) */}
        {activeTab === 'memory' && <MemoryStage step={step} prevStep={prevStep} />}
      </div>
    </div>
  )
}

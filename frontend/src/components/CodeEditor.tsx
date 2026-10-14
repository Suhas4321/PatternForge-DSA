import Editor, { type OnMount } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import { monaco } from '../lib/monaco'

type IEditor = Parameters<OnMount>[0]

interface Props {
  value: string
  onChange?: (value: string) => void
  height?: string | number
  readOnly?: boolean
  /** Line the trace is currently on (highlighted in amber). */
  traceLine?: number | null
  /** Line of the last error (highlighted in red). */
  errorLine?: number | null
  onRun?: () => void
}

export default function CodeEditor({ value, onChange, height = '100%', readOnly, traceLine, errorLine, onRun }: Props) {
  const editorRef = useRef<IEditor | null>(null)
  const decorations = useRef<ReturnType<IEditor['createDecorationsCollection']> | null>(null)
  const runRef = useRef(onRun)
  runRef.current = onRun

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor
    decorations.current = editor.createDecorationsCollection()
    // Ctrl/Cmd+Enter runs the code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current?.())
  }

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

  return (
    <Editor
      height={height}
      language="python"
      theme="forge"
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
        padding: { top: 12, bottom: 12 },
        automaticLayout: true,
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        fixedOverflowWidgets: true,
      }}
    />
  )
}

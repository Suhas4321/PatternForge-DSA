// Bundle Monaco locally (no CDN) so the editor works offline. Only Python and Java syntax are
// registered to keep the bundle small.
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/editor/editor.api'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import 'monaco-editor/languages/definitions/python/register'
import 'monaco-editor/languages/definitions/java/register'

self.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
}

monaco.editor.defineTheme('forge', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '5B6280', fontStyle: 'italic' },
    { token: 'keyword', foreground: '00F0FF' },
    { token: 'string', foreground: '6EE7B7' },
    { token: 'number', foreground: 'C084FC' },
  ],
  colors: {
    'editor.background': '#0A0C13',
    'editor.lineHighlightBackground': '#10131E',
    'editorLineNumber.foreground': '#3B4256',
    'editorLineNumber.activeForeground': '#A3AAC2',
    'editorGutter.background': '#0A0C13',
    'editor.selectionBackground': '#1E2A4A',
    'editorIndentGuide.background1': '#161A28',
  },
})

loader.config({ monaco })

export { monaco }

// Dev-only handle so the browser console (and automated checks) can drive the editor.
if (import.meta.env.DEV) {
  ;(window as unknown as { __monaco: typeof monaco }).__monaco = monaco
}

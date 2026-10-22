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

// 1. Dark Theme — "Night Expedition" (Nebula Plum surfaces with neon syntax)
monaco.editor.defineTheme('forge-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '74698E', fontStyle: 'italic' },
    { token: 'keyword', foreground: '67E8F9', fontStyle: 'bold' },
    { token: 'string', foreground: '6EE7B7' },
    { token: 'number', foreground: 'F2B866' },
    { token: 'type', foreground: 'A78BFA' },
    { token: 'identifier', foreground: 'EDE9F6' },
    { token: 'delimiter', foreground: 'A89FC0' },
    { token: 'operator', foreground: '67E8F9' },
  ],
  colors: {
    'editor.background': '#0D0A14',
    'editor.lineHighlightBackground': '#16111F',
    'editorLineNumber.foreground': '#74698E',
    'editorLineNumber.activeForeground': '#EDE9F6',
    'editorGutter.background': '#0D0A14',
    'editor.selectionBackground': '#2A2140',
    'editorIndentGuide.background1': '#1F1830',
    'editorIndentGuide.activeBackground1': '#2A2140',
    'editorCursor.foreground': '#6EE7B7',
    'editorBracketMatch.background': '#2A2140',
    'editorBracketMatch.border': '#67E8F9',
  },
})

// 2. Light Theme — "Alpine Morning" (Crisp White / Warm Ivory with jewel-toned syntax >= 4.5:1)
monaco.editor.defineTheme('forge-light', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '8B859E', fontStyle: 'italic' },
    { token: 'keyword', foreground: '0E7490', fontStyle: 'bold' },
    { token: 'string', foreground: '047857' },
    { token: 'number', foreground: 'B45309' },
    { token: 'type', foreground: '6D28D9' },
    { token: 'identifier', foreground: '1E1B2E' },
    { token: 'delimiter', foreground: '5B5670' },
    { token: 'operator', foreground: '0E7490' },
  ],
  colors: {
    'editor.background': '#FFFFFF',
    'editor.lineHighlightBackground': '#F7F4EF',
    'editorLineNumber.foreground': '#8B859E',
    'editorLineNumber.activeForeground': '#1E1B2E',
    'editorGutter.background': '#FFFFFF',
    'editor.selectionBackground': '#E8E2D8',
    'editorIndentGuide.background1': '#F1EDE6',
    'editorIndentGuide.activeBackground1': '#E8E2D8',
    'editorCursor.foreground': '#047857',
    'editorBracketMatch.background': '#F1EDE6',
    'editorBracketMatch.border': '#0E7490',
  },
})

// Legacy alias pointing to dark theme
monaco.editor.defineTheme('forge', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '74698E', fontStyle: 'italic' },
    { token: 'keyword', foreground: '67E8F9', fontStyle: 'bold' },
    { token: 'string', foreground: '6EE7B7' },
    { token: 'number', foreground: 'F2B866' },
  ],
  colors: {
    'editor.background': '#0D0A14',
    'editor.lineHighlightBackground': '#16111F',
    'editorLineNumber.foreground': '#74698E',
    'editorLineNumber.activeForeground': '#EDE9F6',
    'editorGutter.background': '#0D0A14',
    'editor.selectionBackground': '#2A2140',
    'editorIndentGuide.background1': '#1F1830',
  },
})

loader.config({ monaco })

/** Resolves current Monaco theme name based on theme preference or resolved dataset attribute */
export function getMonacoTheme(theme?: string): 'forge-dark' | 'forge-light' {
  if (theme === 'light' || theme === 'paper' || theme === 'studio-contrast') return 'forge-light'
  if (theme === 'dark' || theme === 'carbon-dark') return 'forge-dark'
  if (typeof document !== 'undefined') {
    const docTheme = document.documentElement.dataset.theme
    if (docTheme === 'light' || docTheme === 'paper' || docTheme === 'studio-contrast') return 'forge-light'
  }
  return 'forge-dark'
}

// Dynamic synchronization for all live Monaco instances
if (typeof window !== 'undefined') {
  const syncTheme = () => {
    const t = getMonacoTheme()
    monaco.editor.setTheme(t)
  }
  window.addEventListener('pf-theme-changed', syncTheme)
  if (typeof MutationObserver !== 'undefined' && document.documentElement) {
    const obs = new MutationObserver(syncTheme)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  }
  // Initial sync
  syncTheme()
}

export { monaco }

// Dev-only handle so the browser console (and automated checks) can drive the editor.
if (import.meta.env.DEV) {
  ;(window as unknown as { __monaco: typeof monaco }).__monaco = monaco
}

import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { QuestionContent } from '../../api/types'

type MdNode = { type: string; value?: string; children?: MdNode[]; data?: { hName?: string } }

/** remark plugin: wraps trigger keywords in <mark> so they stand out in the clean statement. */
function highlightTriggers(keywords: string[]) {
  const escaped = keywords.filter(Boolean).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = escaped.length ? new RegExp(`(${escaped.join('|')})`, 'gi') : null
  const walk = (node: MdNode) => {
    if (!re || !node.children) return
    const next: MdNode[] = []
    for (const child of node.children) {
      if (child.type === 'text' && child.value) {
        child.value.split(re).forEach((part, i) => {
          if (!part) return
          next.push(
            i % 2 === 1
              ? { type: 'mark', data: { hName: 'mark' }, children: [{ type: 'text', value: part }] }
              : { type: 'text', value: part },
          )
        })
      } else {
        if (child.type !== 'inlineCode' && child.type !== 'code') walk(child)
        next.push(child)
      }
    }
    node.children = next
  }
  return () => (tree: MdNode) => walk(tree)
}

export default function ProblemStatement({ content }: { content: QuestionContent }) {
  const [mode, setMode] = useState<'clean' | 'story'>('story')
  const st = content.statement
  const plugins = useMemo(() => [remarkGfm, highlightTriggers(st.trigger_keywords)], [st.trigger_keywords])

  return (
    <div>
      <div className="mb-4 inline-flex rounded-md border border-line p-0.5 text-sm" role="tablist">
        {(
          [
            ['story', 'OA story'],
            ['clean', 'LeetCode core'],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded px-3 py-1 ${mode === m ? 'bg-panel-2 text-chalk' : 'text-muted hover:text-chalk'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="prose-forge">
        {mode === 'story' ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{st.oa_story}</ReactMarkdown>
        ) : (
          <ReactMarkdown remarkPlugins={plugins}>{st.clean}</ReactMarkdown>
        )}
      </div>
      {mode === 'story' && (
        <p className="mt-3 text-xs text-faint">
          Strip the story away: what is actually being asked? Switch to LeetCode core to check yourself.
        </p>
      )}
      {mode === 'clean' && (
        <p className="mt-3 text-xs text-faint">Highlighted phrases are the trigger words that point to the pattern.</p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {st.examples.map((ex, i) => (
          <div key={i} className="rounded-md border border-line bg-ink/50 px-3 py-2 font-mono text-xs">
            <div>
              <span className="font-sans text-muted">Input </span>
              {ex.input}
            </div>
            <div>
              <span className="font-sans text-muted">Output </span>
              {ex.output}
            </div>
            {ex.explanation && <div className="mt-1 font-sans text-muted">{ex.explanation}</div>}
          </div>
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-1 font-mono text-xs text-muted">
        {st.constraints.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </div>
  )
}

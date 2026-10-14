import { Bot, CalendarClock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import type { Pitch, Progress, QuestionDetail } from '../../api/types'
import { useCoachStatus } from '../../lib/useCoach'
import { Button, LeetCodeLink, Markdown, Panel, formatRelative } from '../ui'

const FIELDS: { key: keyof Omit<Pitch, 'updated_at'>; label: string; placeholder: string }[] = [
  { key: 'brute_force', label: 'Brute force, and why it is too slow', placeholder: 'Two nested loops over every pair: O(N²)…' },
  { key: 'trigger', label: 'The trigger I spotted', placeholder: '"Return indices" on unsorted data, so…' },
  { key: 'intuition', label: 'The optimal idea in two plain sentences', placeholder: 'For each x I already know what I need…' },
  { key: 'complexity', label: 'Exact time and space complexity, and why', placeholder: 'O(N) time because… O(N) space because…' },
]

const CONFIDENCE = [
  { value: 1, label: 'Struggled', detail: 'Review in 3 days' },
  { value: 2, label: 'Needed hints', detail: 'Review in 7 days' },
  { value: 3, label: 'Crushed it', detail: 'Review in 21 days' },
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
  const [showScript, setShowScript] = useState(Boolean(question.pitch.updated_at))
  const [showSolution, setShowSolution] = useState(false)
  const firstRender = useRef(true)
  const coach = useCoachStatus()
  const [polish, setPolish] = useState<{ text: string | null; error: string | null } | null>(null)
  const [polishing, setPolishing] = useState(false)

  const polishPitch = async () => {
    setPolishing(true)
    try {
      const r = await api.askCoach(question.slug, { mode: 'pitch', code: question.drafts.main ?? '', pitch })
      setPolish({ text: r.reply, error: r.error })
      if (!r.reply) setShowScript(true)
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

  const filled = FIELDS.filter((f) => pitch[f.key].trim().length > 0).length

  const rate = async (confidence: number) => {
    onProgress(await api.rate(question.slug, confidence))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Your 4-line interview pitch" aside={<span className="text-xs text-faint">{saved ? 'Saved' : 'Saving'}</span>}>
          <div className="flex flex-col gap-4">
            {FIELDS.map((f, i) => (
              <label key={f.key} className="flex flex-col gap-1.5">
                <span className="text-sm text-chalk">
                  {i + 1}. {f.label}
                </span>
                <textarea
                  rows={2}
                  value={pitch[f.key]}
                  placeholder={f.placeholder}
                  onChange={(e) => setPitch({ ...pitch, [f.key]: e.target.value })}
                  className="resize-y rounded-md border border-line bg-ink px-3 py-2 text-sm text-chalk placeholder:text-faint focus:border-forge focus:outline-none"
                />
              </label>
            ))}
          </div>
        </Panel>

        <Panel
          title="How a senior engineer would say it"
          aside={
            coach?.enabled ? (
              <Button variant="glass" className="px-2.5 py-1 text-xs" onClick={polishPitch} disabled={polishing || filled === 0}>
                <Bot size={13} /> {polishing ? 'Polishing' : 'Polish My Pitch'}
              </Button>
            ) : null
          }
        >
          {polish && (
            <div className="mb-4 rounded-lg border border-indigo/30 bg-indigo/[0.06] px-3 py-2.5 text-sm">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-sky">
                <Bot size={13} /> Coach feedback on your pitch{coach?.model ? `, ${coach.model}` : ''}
              </div>
              {polish.text ? (
                <Markdown>{polish.text}</Markdown>
              ) : (
                <p className="text-muted">{polish.error} Here is the built-in model script instead.</p>
              )}
            </div>
          )}
          {showScript ? (
            <Markdown className="text-sm leading-relaxed">{content.pitch_script}</Markdown>
          ) : (
            <div className="flex flex-col items-start gap-3 text-sm text-muted">
              <p>Write your own version first. Comparing after you've tried is what makes the explanation stick.</p>
              <Button variant="outline" onClick={() => setShowScript(true)} disabled={filled < 2}>
                Compare with the model script
              </Button>
              {filled < 2 && <span className="text-xs text-faint">Fill in at least two lines to unlock.</span>}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Optimal solution"
        aside={
          <button className="text-xs text-sky hover:underline" onClick={() => setShowSolution(!showSolution)}>
            {showSolution ? 'Hide' : 'Show'}
          </button>
        }
      >
        {showSolution ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <pre className="overflow-x-auto rounded-md border border-line bg-ink p-3 font-mono text-xs leading-relaxed text-chalk">
              {content.solution.code}
            </pre>
            <div className="flex flex-col gap-3 text-sm">
              <Markdown>{content.solution.explanation}</Markdown>
              <dl className="grid grid-cols-[4rem_1fr] gap-1 font-mono text-xs">
                <dt className="text-muted">Time</dt>
                <dd>{content.solution.time}</dd>
                <dt className="text-muted">Space</dt>
                <dd>{content.solution.space}</dd>
              </dl>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Compare the reference with your own code once you've written your pitch.</p>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="The twist: same pattern, new wrapper">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <LeetCodeLink lc={content.twist.lc} url={leetcodeUrl(content.twist.title)} />
              <span className="font-semibold text-chalk">{content.twist.title}</span>
            </div>
            <Markdown className="text-sm text-muted">{content.twist.why}</Markdown>
            <p className="text-xs text-faint">No drills, no hints. Solve it on LeetCode to prove the pattern transferred.</p>
          </div>
        </Panel>

        <Panel title="How confident are you?">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              {CONFIDENCE.map((c) => (
                <button
                  key={c.value}
                  onClick={() => rate(c.value)}
                  disabled={!(progress.solved || progress.studied_solution)}
                  className={`rounded-md border px-3 py-2 text-left transition-colors disabled:opacity-40 ${
                    progress.confidence === c.value ? 'border-forge bg-forge/10' : 'border-line hover:border-muted'
                  }`}
                >
                  <span className="block text-sm text-chalk">{c.label}</span>
                  <span className="block text-xs text-muted">{c.detail}</span>
                </button>
              ))}
            </div>
            {progress.next_review_at && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <CalendarClock size={15} className="text-sky" />
                Next blind re-solve {formatRelative(progress.next_review_at)}
              </p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}

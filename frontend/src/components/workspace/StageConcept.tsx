import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Progress, QuestionContent } from '../../api/types'
import { Button, Markdown, Panel } from '../ui'
import ProblemStatement from './ProblemStatement'
import Quiz from './Quiz'

interface Props {
  slug: string
  content: QuestionContent
  progress: Progress
  onProgress: (p: Progress) => void
  onPassed: () => void
}

export default function StageConcept({ slug, content, progress, onProgress, onPassed }: Props) {
  const [constraintOk, setConstraintOk] = useState(progress.quiz_passed)
  const [patternOk, setPatternOk] = useState(progress.quiz_passed)
  const c = content.concept

  // Both quizzes right: record it now so the next stage unlocks immediately.
  useEffect(() => {
    if (constraintOk && patternOk && !progress.quiz_passed) {
      api.patchProgress(slug, { concept_done: true, quiz_passed: true }).then(onProgress).catch(() => {})
    }
  }, [constraintOk, patternOk, progress.quiz_passed, slug, onProgress])

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Panel title="The problem">
        <ProblemStatement content={content} />
      </Panel>

      <div className="flex flex-col gap-5">
        <Panel title="Why this pattern exists">
          <dl className="flex flex-col gap-4 text-sm">
            <div>
              <dt className="mb-1 font-semibold text-chalk">What it solves</dt>
              <dd className="text-muted">
                <Markdown>{c.problem_it_solves}</Markdown>
              </dd>
            </div>
            <div>
              <dt className="mb-1 font-semibold text-chalk">Why brute force fails</dt>
              <dd className="text-muted">
                <Markdown>{c.brute_force}</Markdown>
                <p className="mt-1 font-mono text-xs text-oxide">{c.brute_force_complexity}</p>
              </dd>
            </div>
            <div className="rounded-md border-l-2 border-forge bg-forge/5 py-2 pr-2 pl-3">
              <dt className="mb-1 font-semibold text-forge">The key insight</dt>
              <dd className="text-chalk">
                <Markdown>{c.key_insight}</Markdown>
              </dd>
            </div>
            <div>
              <dt className="mb-1 font-semibold text-chalk">Where you'll see it in real systems</dt>
              <dd className="text-muted">
                <Markdown>{c.real_world}</Markdown>
              </dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel title="Before you code: read the signals" className="lg:col-span-2">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="mb-2 text-sm text-muted">1. What do the constraints allow?</h4>
            <Quiz quiz={content.constraint_quiz} solved={progress.quiz_passed} onSolved={() => setConstraintOk(true)} />
          </div>
          <div className={constraintOk ? '' : 'pointer-events-none opacity-35'} aria-disabled={!constraintOk}>
            <h4 className="mb-2 text-sm text-muted">2. Which pattern fits?</h4>
            <Quiz quiz={content.pattern_quiz} solved={progress.quiz_passed} onSolved={() => setPatternOk(true)} />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={onPassed} disabled={!(constraintOk && patternOk)}>
            {content.drills.length ? 'Start the micro-drills' : 'Open the arena'}
          </Button>
          {!(constraintOk && patternOk) && <span className="text-xs text-faint">Answer both to continue.</span>}
        </div>
      </Panel>
    </div>
  )
}

import { ArrowLeft, BookMarked } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { QuestionSummary, World } from '../api/types'
import MountainTrail from '../components/MountainTrail'
import { Stage } from '../components/effects'
import { Button, ErrorNote, ProgressRing, RustBadge, Spinner } from '../components/ui'
import { useGrimoire } from '../lib/grimoire'
import { questUrl } from '../lib/journey'

export default function WorldPage() {
  const { id } = useParams()
  // The constellation passes the world along so the zoom transition reveals the real page at once.
  const passed = (useLocation().state as { world?: World } | null)?.world
  const [world, setWorld] = useState<World | null>(passed && String(passed.id) === id ? passed : null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setWorld((w) => (w && String(w.id) === id ? w : null))
    api
      .worlds()
      .then((ws) => {
        const w = ws.find((x) => String(x.id) === id)
        if (w) setWorld(w)
        else setError(`World ${id} doesn't exist.`)
      })
      .catch((e) => setError(e.message))
  }, [id])

  if (error) return <div className="mx-auto max-w-5xl p-8"><ErrorNote message={error} /></div>
  if (!world) return <div className="p-8"><Spinner /></div>
  return <WorldTrail world={world} />
}

/** The question you should work on in this world: due review → in progress → first unsolved. */
function activeIndex(qs: QuestionSummary[]) {
  const due = qs.findIndex((q) => q.progress.status === 'review_due')
  if (due >= 0) return due
  const doing = qs.findIndex((q) => q.progress.status === 'in_progress')
  if (doing >= 0) return doing
  return qs.findIndex((q) => !q.progress.solved)
}

function WorldTrail({ world }: { world: World }) {
  const navigate = useNavigate()
  const openGrimoire = useGrimoire()
  const qs = world.questions
  const active = activeIndex(qs)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      {/* World banner: zone 2 */}
      <header className="card flex flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-chalk">
            <ArrowLeft size={14} /> Journey
          </Link>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-faint">World {world.id}</span>
            <h1 className="font-plate text-3xl font-semibold text-chalk">{world.name}</h1>
            <RustBadge rust={world.rust} />
          </div>
          <p className="mt-1 text-muted italic">{world.tagline}</p>
          <p className="mt-3 max-w-[68ch] text-chalk">{world.core_idea}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {world.triggers.map((t) => (
              <span key={t} className="rounded-full border border-indigo/25 bg-indigo/[0.07] px-3 py-1 text-xs font-medium text-indigo">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {active >= 0 && (
              <Button onClick={() => navigate(questUrl(qs[active]))}>
                {qs[active].progress.status === 'new' ? 'Start the next trial →' : 'Continue Journey →'}
              </Button>
            )}
            <Button variant="outline" onClick={() => openGrimoire(world.id)}>
              <BookMarked size={15} /> Open the Grimoire
            </Button>
          </div>
        </div>
        <ProgressRing
          value={world.solved}
          total={world.total}
          size={112}
          stroke={8}
          color={world.solved === world.total ? 'var(--color-emerald)' : 'var(--color-indigo)'}
        >
          <span className="text-center">
            <span className="block font-plate text-2xl font-semibold">
              {world.solved}/{world.total}
            </span>
            <span className="block text-2xs text-muted">forged</span>
          </span>
        </ProgressRing>
      </header>

      {/* The climb: zone 3 stage, base camp at the bottom, the boss on the summit */}
      <Stage className="px-3 py-4 sm:px-6" dots={false}>
        <MountainTrail qs={qs} active={active} />
      </Stage>
    </div>
  )
}


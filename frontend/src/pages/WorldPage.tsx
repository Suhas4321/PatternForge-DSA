import { ArrowLeft, BookMarked, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { QuestionSummary, World } from '../api/types'
import MountainTrail from '../components/MountainTrail'
import Sky from '../components/Sky'
import { Stage } from '../components/effects'
import { Button, ErrorNote, ProgressRing, RustBadge, Skeleton } from '../components/ui'
import { citadelForWorld } from '../lib/citadels'
import { useGrimoire } from '../lib/grimoire'
import { questUrl } from '../lib/journey'

export default function WorldPage() {
  const { id } = useParams()
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

  if (error) return <div className="shell p-8"><ErrorNote message={error} /></div>
  if (!world)
    return (
      <div className="shell flex flex-col gap-6 py-6" role="status" aria-label="Loading the world">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="stage h-[600px] rounded-3xl" />
      </div>
    )
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
  const qs = world.questions || []
  const active = activeIndex(qs)
  const citadel = citadelForWorld(world.id)
  const isComingSoon = world.status === 'coming_soon' || qs.length === 0

  return (
    <div className="shell flex flex-col gap-5 py-5">
      {/* Compact World header (Zone 2, ~160px desktop height) */}
      <header className="card flex flex-col justify-between gap-4 rounded-2xl p-4 sm:p-5 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <Link
            to={citadel.id === 'dsa' ? '/' : `/citadel/${citadel.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-chalk"
          >
            <ArrowLeft size={13} />
            <span>Citadel {citadel.numeral}: {citadel.shortName}</span>
          </Link>

          <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
            <span className="font-mono text-xs text-faint">World {world.id}</span>
            <h1 className="font-plate text-2xl font-semibold text-chalk truncate">
              {world.name}
            </h1>
            {world.rust && <RustBadge rust={world.rust} />}
            {isComingSoon && (
              <span className="rounded-full border border-line bg-panel-2 px-2 py-0.5 text-2xs font-medium text-faint">
                Coming soon
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-muted truncate max-w-2xl">{world.tagline}</p>

          {world.triggers && world.triggers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 max-h-12 overflow-hidden">
              {world.triggers.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-line bg-panel-2 px-2 py-0.5 text-caption font-medium text-chalk"
                  style={{ borderColor: `color-mix(in srgb, ${citadel.themeColor} 30%, transparent)` }}
                >
                  {t}
                </span>
              ))}
              {world.triggers.length > 5 && (
                <span className="text-caption text-faint self-center">
                  +{world.triggers.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right side: Progress ring and action buttons */}
        <div className="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-line">
          {!isComingSoon && (
            <ProgressRing
              value={world.solved}
              total={world.total || 1}
              size={64}
              stroke={6}
              color={world.solved === world.total ? 'var(--color-emerald)' : citadel.themeColor}
            >
              <span className="text-center">
                <span className="block font-plate text-sm font-semibold text-chalk">
                  {world.solved}/{world.total}
                </span>
              </span>
            </ProgressRing>
          )}

          <div className="flex flex-col gap-1.5">
            {!isComingSoon && active >= 0 && (
              <Button
                className="h-8 px-3 text-xs"
                onClick={() => navigate(questUrl(qs[active]))}
              >
                <Sparkles size={13} />
                <span>{qs[active].progress.status === 'new' ? 'Start trial →' : 'Continue →'}</span>
              </Button>
            )}
            <Button
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={() => openGrimoire(world.id)}
            >
              <BookMarked size={13} />
              <span>Grimoire</span>
            </Button>
          </div>
        </div>
      </header>

      {/* The climb: zone 3 stage */}
      <Stage className="relative overflow-hidden px-3 py-6 sm:px-6" dots={false}>
        <Sky variant="aurora" accent={citadel.themeColor} />
        <MountainTrail qs={qs} active={active} world={world} />
      </Stage>
    </div>
  )
}

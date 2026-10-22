import { LayoutGroup } from 'motion/react'
import { visibleLocals } from '../../lib/trace'
import type { VisualizerProps } from './types'
import { ArrayRow, buildArrays, SidePanels } from './parts'
import { Scene3D } from './three-d'

export default function ArrayPointerVisualizer({
  step,
  prev,
  config,
  narration,
}: VisualizerProps) {
  const locals = visibleLocals(step)
  const prevLocals = visibleLocals(prev)
  const { models, pointerNames } = buildArrays(locals, prevLocals, config)
  const shown = new Set([...models.map((m) => m.name), ...pointerNames])

  // Determine if primary array can use the 3D Block Stage (Hero Reel effect)
  const primaryModel = models[0]
  const use3D =
    config?.style !== 'flat' &&
    primaryModel &&
    primaryModel.cells.length > 0 &&
    primaryModel.cells.length <= 24

  return (
    <div className="w-full h-full flex flex-col justify-between">
      {models.length === 0 && (
        <div className="flex items-center justify-center h-48 text-sm text-muted">
          No arrays in scope at this step.
        </div>
      )}

      {/* Hero 3D Block Stage for arrays with N <= 24 */}
      {use3D && (
        <div className="w-full flex-1 min-h-[260px] flex items-center justify-center">
          <Scene3D
            items={primaryModel.cells}
            narration={narration}
            style={config?.style || 'bars'}
          />
        </div>
      )}

      {/* Fallback to 2D flat bars if N > 24, or for remaining secondary arrays */}
      <LayoutGroup>
        <div className="flex flex-col gap-4">
          {models
            .filter((_, idx) => !use3D || idx > 0)
            .map((m) => (
              <ArrayRow key={m.name} model={m} heap={step.heap} />
            ))}

          {/* Side panels for extra variables, watch values, or hash maps */}
          <SidePanels
            locals={locals}
            prevLocals={prevLocals}
            heap={step.heap}
            config={config}
            exclude={shown}
          />
        </div>
      </LayoutGroup>
    </div>
  )
}

import { LayoutGroup } from 'motion/react'
import { visibleLocals } from '../../lib/trace'
import type { VisualizerProps } from './types'
import { ArrayRow, buildArrays, SidePanels } from './parts'


export default function ArrayPointerVisualizer({ step, prev, config }: VisualizerProps) {
  const locals = visibleLocals(step)
  const prevLocals = visibleLocals(prev)
  const { models, pointerNames } = buildArrays(locals, prevLocals, config)
  const shown = new Set([...models.map((m) => m.name), ...pointerNames])

  return (
    <LayoutGroup>
      <div className="flex flex-col gap-5">
        {models.length === 0 && <p className="text-sm text-muted">No arrays in scope at this step.</p>}
        {models.map((m) => (
          <ArrayRow key={m.name} model={m} heap={step.heap} />
        ))}
        <SidePanels locals={locals} prevLocals={prevLocals} heap={step.heap} config={config} exclude={shown} />
      </div>
    </LayoutGroup>
  )
}

import React from 'react'

interface Floor3DProps {
  width: number
  length: number
  itemCount: number
  itemWidth?: number
  gap?: number
}

export const Floor3D: React.FC<Floor3DProps> = ({
  width,
  length = 140,
  itemCount,
  itemWidth = 44,
  gap = 14,
}) => {
  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{
        width: `${width}px`,
        height: `${length}px`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Contact shadow on bottom plane */}
      <div
        className="absolute inset-0 rounded-2xl bg-black/30 dark:bg-black/60 blur-xl"
        style={{ transform: 'translateZ(-28px)' }}
      />

      {/* Top face of floor plate */}
      <div
        className="absolute inset-0 rounded-xl border border-line bg-gradient-to-b from-panel to-panel-2/80 backdrop-blur-md"
        style={{
          boxShadow: 'var(--card-highlight), var(--card-shadow)',
        }}
      >
        {/* Subtle floor grid markings */}
        <div
          className="absolute inset-0 opacity-25 rounded-xl"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--line-strong) 1px, transparent 1px), linear-gradient(to bottom, var(--line-strong) 1px, transparent 1px)',
            backgroundSize: `${itemWidth + gap}px 24px`,
            backgroundPosition: 'center center',
          }}
        />

        {/* Index tags printed on the floor in front of boxes */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center">
          <div
            className="flex items-center justify-center"
            style={{ gap: `${gap}px` }}
          >
            {Array.from({ length: itemCount }).map((_, idx) => (
              <div
                key={idx}
                className="font-mono text-[11px] font-semibold text-muted text-center select-none"
                style={{ width: `${itemWidth}px` }}
              >
                {idx}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Front edge face of floor slab */}
      <div
        className="absolute left-0 right-0 bottom-0 h-[18px] rounded-b-xl border-b border-x border-line bg-panel-3/90 shadow-md"
        style={{
          transformOrigin: 'bottom',
          transform: 'rotateX(-90deg)',
        }}
      />
    </div>
  )
}

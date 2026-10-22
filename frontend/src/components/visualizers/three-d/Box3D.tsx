import React from 'react'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'

export interface Box3DProps {
  id: string
  value: unknown
  index?: number
  height?: number
  width?: number
  depth?: number
  role?: 'compare' | 'swap' | 'write' | 'read' | 'target' | 'done' | 'default'
  isSwapping?: boolean
  swapDirection?: 'forward' | 'backward'
  reduceMotion?: boolean
}

export const Box3D: React.FC<Box3DProps> = ({
  value,
  height = 54,
  width = 44,
  depth = 44,
  role = 'default',
  isSwapping = false,
  swapDirection,
  reduceMotion = false,
}) => {
  // Determine color theme based on role
  let frontBg = 'bg-panel-2'
  let frontBorder = 'border-line-strong'
  let topBg = 'bg-panel'
  let rightBg = 'bg-panel-3'
  let textColor = 'text-chalk'
  let glowStyle = ''

  if (role === 'compare') {
    frontBg = 'bg-[var(--viz-compare)]/85'
    frontBorder = 'border-[var(--viz-compare)]'
    topBg = 'bg-[var(--viz-compare)]'
    rightBg = 'bg-[var(--viz-compare)]/70'
    textColor = 'text-white font-bold'
    glowStyle = 'var(--viz-glow-compare)'
  } else if (role === 'swap') {
    frontBg = 'bg-[var(--viz-swap)]/85'
    frontBorder = 'border-[var(--viz-swap)]'
    topBg = 'bg-[var(--viz-swap)]'
    rightBg = 'bg-[var(--viz-swap)]/70'
    textColor = 'text-white font-bold'
    glowStyle = 'var(--viz-glow-swap)'
  } else if (role === 'done') {
    frontBg = 'bg-[var(--viz-done)]/85'
    frontBorder = 'border-[var(--viz-done)]'
    topBg = 'bg-[var(--viz-done)]'
    rightBg = 'bg-[var(--viz-done)]/70'
    textColor = 'text-white font-bold'
    glowStyle = 'var(--viz-glow-done)'
  } else if (role === 'write' || role === 'target') {
    frontBg = 'bg-[var(--viz-write)]/85'
    frontBorder = 'border-[var(--viz-write)]'
    topBg = 'bg-[var(--viz-write)]'
    rightBg = 'bg-[var(--viz-write)]/70'
    textColor = 'text-white font-bold'
    glowStyle = 'var(--viz-glow-write)'
  } else if (role === 'read') {
    frontBg = 'bg-[var(--viz-read)]/85'
    frontBorder = 'border-[var(--viz-read)]'
    topBg = 'bg-[var(--viz-read)]'
    rightBg = 'bg-[var(--viz-read)]/70'
    textColor = 'text-white font-bold'
    glowStyle = '0 0 16px rgba(109, 40, 217, 0.35)'
  }

  // Motion physics configuration
  const liftZ = reduceMotion ? 0 : isSwapping ? 38 : role === 'compare' ? 12 : 0
  const arcY = reduceMotion
    ? 0
    : isSwapping
      ? swapDirection === 'forward'
        ? -20
        : 20
      : 0

  return (
    <motion.div
      layout={!reduceMotion}
      transition={{
        type: 'spring',
        damping: 24,
        stiffness: 280,
      }}
      className="relative select-none"
      style={{
        width: `${width}px`,
        height: `${depth}px`,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        animate={{
          z: liftZ,
          y: arcY,
          scaleY: isSwapping && !reduceMotion ? [1, 0.94, 1] : 1,
        }}
        transition={{
          duration: isSwapping ? 0.38 : 0.22,
          ease: 'easeOut',
        }}
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: glowStyle ? glowStyle : undefined,
        }}
      >
        {/* Dynamic floor contact shadow under the box */}
        <div
          className="absolute inset-0 rounded-md bg-black/30 dark:bg-black/60 blur-md transition-all duration-300"
          style={{
            transform: `translateZ(${-liftZ}px)`,
            opacity: isSwapping ? 0.25 : 0.6,
            transformOrigin: 'center center',
          }}
        />

        {/* TOP FACE (Contains number value and optional checkmark) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center rounded-sm border border-line-strong font-mono font-bold shadow-inner ${topBg} ${textColor}`}
          style={{
            transform: `translateZ(${height}px)`,
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25)',
          }}
        >
          {/* Text counter-rotated slightly to sit crisp against isometric perspective */}
          <div
            className="flex items-center justify-center gap-0.5 text-[13px] tracking-tight font-extrabold"
            style={{ transform: 'rotateZ(14deg)' }}
          >
            {role === 'done' && <Check className="w-3.5 h-3.5 mr-0.5 text-emerald-100 stroke-[3]" />}
            <span>{String(value ?? '')}</span>
          </div>
        </div>

        {/* FRONT FACE (Faces viewer) */}
        <div
          className={`absolute left-0 right-0 bottom-0 rounded-b-sm border-x border-b ${frontBorder} ${frontBg} shadow-md`}
          style={{
            height: `${height}px`,
            transformOrigin: 'bottom center',
            transform: 'rotateX(-90deg)',
          }}
        >
          {/* Subtle vertical reflection highlight */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/30 pointer-events-none" />
        </div>

        {/* RIGHT FACE (Shaded tone for ambient occlusion depth) */}
        <div
          className={`absolute top-0 bottom-0 right-0 border-r border-t border-black/30 ${rightBg}`}
          style={{
            width: `${height}px`,
            transformOrigin: 'right center',
            transform: 'rotateY(90deg) rotateX(90deg)',
          }}
        >
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
        </div>
      </motion.div>
    </motion.div>
  )
}

import React from 'react'
import { motion } from 'motion/react'

interface WispProps {
  name: string
  index: number
  itemWidth?: number
  gap?: number
  color?: string
  offsetY?: number
  reduceMotion?: boolean
}

const POINTER_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  i: { bg: 'bg-cyan-500', border: 'border-cyan-300', text: 'text-cyan-950', glow: 'rgba(6,182,212,0.6)' },
  j: { bg: 'bg-amber-500', border: 'border-amber-300', text: 'text-amber-950', glow: 'rgba(245,158,11,0.6)' },
  k: { bg: 'bg-violet-500', border: 'border-violet-300', text: 'text-violet-950', glow: 'rgba(139,92,246,0.6)' },
  l: { bg: 'bg-emerald-500', border: 'border-emerald-300', text: 'text-emerald-950', glow: 'rgba(16,185,129,0.6)' },
  r: { bg: 'bg-rose-500', border: 'border-rose-300', text: 'text-rose-950', glow: 'rgba(239,68,68,0.6)' },
  left: { bg: 'bg-emerald-500', border: 'border-emerald-300', text: 'text-emerald-950', glow: 'rgba(16,185,129,0.6)' },
  right: { bg: 'bg-rose-500', border: 'border-rose-300', text: 'text-rose-950', glow: 'rgba(239,68,68,0.6)' },
  mid: { bg: 'bg-indigo-500', border: 'border-indigo-300', text: 'text-indigo-950', glow: 'rgba(99,102,241,0.6)' },
}

export const Wisp: React.FC<WispProps> = ({
  name,
  index,
  itemWidth = 44,
  gap = 14,
  offsetY = 0,
  reduceMotion = false,
}) => {
  const scheme = POINTER_COLORS[name] || {
    bg: 'bg-sky-500',
    border: 'border-sky-300',
    text: 'text-sky-950',
    glow: 'rgba(14,165,233,0.6)',
  }

  // Calculate horizontal X coordinate based on index
  const x = index * (itemWidth + gap) + itemWidth / 2

  return (
    <motion.div
      layout={!reduceMotion}
      transition={{
        type: 'spring',
        damping: 24,
        stiffness: 240,
      }}
      className="absolute top-0 pointer-events-none"
      style={{
        left: `${x}px`,
        transform: 'translateX(-50%) translateZ(80px)',
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [-3, 3, -3] }}
        transition={reduceMotion ? undefined : { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        className="flex flex-col items-center justify-center -translate-y-full pb-1"
        style={{ transform: `translateY(${offsetY}px)` }}
      >
        {/* Pointer Name Flag Pill */}
        <div
          className={`px-2 py-0.5 rounded-full border text-[11px] font-mono font-extrabold shadow-lg ${scheme.bg} ${scheme.border} ${scheme.text}`}
          style={{
            boxShadow: `0 0 12px ${scheme.glow}`,
            transform: 'rotateZ(14deg)',
          }}
        >
          {name}
        </div>

        {/* Floating Orb Bead */}
        <div
          className={`w-3.5 h-3.5 rounded-full border-2 mt-0.5 ${scheme.bg} ${scheme.border} shadow-md`}
          style={{
            boxShadow: `0 0 16px ${scheme.glow}`,
          }}
        />

        {/* Laser locator beam pointing down to box */}
        <div
          className="w-0.5 h-4 opacity-50 bg-gradient-to-b from-white to-transparent"
        />
      </motion.div>
    </motion.div>
  )
}

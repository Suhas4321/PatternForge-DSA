import React from 'react'
import { motion } from 'motion/react'

interface CompareBeamProps {
  fromIndex: number
  toIndex: number
  fromValue: unknown
  toValue: unknown
  op?: string
  itemWidth?: number
  gap?: number
  reduceMotion?: boolean
}

export const CompareBeam: React.FC<CompareBeamProps> = ({
  fromIndex,
  toIndex,
  fromValue,
  toValue,
  op = '>',
  itemWidth = 44,
  gap = 14,
  reduceMotion = false,
}) => {
  const minIdx = Math.min(fromIndex, toIndex)
  const maxIdx = Math.max(fromIndex, toIndex)

  const startX = minIdx * (itemWidth + gap) + itemWidth / 2
  const endX = maxIdx * (itemWidth + gap) + itemWidth / 2
  const width = Math.max(28, endX - startX)
  const centerX = startX + width / 2

  // Evaluate comparison boolean
  let resultBool: boolean | null = null
  if (typeof fromValue === 'number' && typeof toValue === 'number') {
    if (op === '>') resultBool = fromValue > toValue
    else if (op === '<') resultBool = fromValue < toValue
    else if (op === '>=') resultBool = fromValue >= toValue
    else if (op === '<=') resultBool = fromValue <= toValue
    else if (op === '==') resultBool = fromValue === toValue
    else if (op === '!=') resultBool = fromValue !== toValue
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="absolute top-0 pointer-events-none"
      style={{
        left: `${centerX}px`,
        transform: 'translateX(-50%) translateZ(95px)',
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="flex flex-col items-center justify-center -translate-y-full pb-2">
        {/* Comparison Evaluation Chip */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-bold shadow-xl backdrop-blur-md ${
            resultBool === true
              ? 'bg-rose-950/90 border-rose-500/80 text-rose-200'
              : resultBool === false
                ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200'
                : 'bg-amber-950/90 border-amber-500/80 text-amber-200'
          }`}
          style={{
            transform: 'rotateZ(14deg)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          }}
        >
          <span>{String(fromValue ?? '')}</span>
          <span className="font-extrabold text-amber-300">{op}</span>
          <span>{String(toValue ?? '')}</span>
          {resultBool !== null && (
            <span
              className={`text-[9px] uppercase px-1 rounded font-extrabold ml-1 ${
                resultBool ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/30 text-emerald-300'
              }`}
            >
              {resultBool ? 'Swap' : 'OK'}
            </span>
          )}
        </div>

        {/* Arching Connection Bracket Bar */}
        <div
          className="h-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 opacity-80 mt-1 shadow-md"
          style={{ width: `${width}px` }}
        />
      </div>
    </motion.div>
  )
}

import React, { useMemo } from 'react'
import { motion } from 'motion/react'
import type { NarratorResult } from '../../../lib/narrator/types.ts'
import { Box3D } from './Box3D.tsx'
import { CompareBeam } from './CompareBeam.tsx'
import { Floor3D } from './Floor3D.tsx'
import { RangePlate } from './RangePlate.tsx'
import { Wisp } from './Wisp.tsx'

export interface Scene3DProps {
  items: unknown[]
  narration?: NarratorResult
  style?: 'bars' | 'cubes' | 'flat'
  reduceMotion?: boolean
}

export const Scene3D: React.FC<Scene3DProps> = ({
  items = [],
  narration,
  style = 'bars',
  reduceMotion = false,
}) => {
  const n = items.length

  // Calculate box dimensions and scaling
  const itemWidth = n <= 8 ? 48 : n <= 14 ? 40 : 32
  const itemGap = n <= 8 ? 16 : n <= 14 ? 10 : 8
  const totalArrayWidth = n * itemWidth + Math.max(0, n - 1) * itemGap
  const floorWidth = Math.max(totalArrayWidth + 64, 300)
  const floorLength = 160

  // Calculate height scaling (bars vs uniform cubes)
  const numericValues = items.filter((x): x is number => typeof x === 'number')
  const isAllNumbers = numericValues.length === items.length && items.length > 0
  const maxVal = isAllNumbers ? Math.max(...numericValues, 1) : 10
  const minVal = isAllNumbers ? Math.min(...numericValues, 0) : 0

  // Map highlights and moves from narrator
  const highlightMap = useMemo(() => {
    const map = new Map<number, 'compare' | 'swap' | 'write' | 'read' | 'target' | 'done'>()
    if (narration?.highlights) {
      for (const h of narration.highlights) {
        // extract index from "nums[i]"
        const match = /\[(\d+)\]/.exec(h.target)
        if (match) {
          map.set(Number(match[1]), h.role)
        }
      }
    }
    if (narration?.sortedIndices) {
      for (const idx of narration.sortedIndices) {
        map.set(idx, 'done')
      }
    }
    return map
  }, [narration])

  // Swapping indices
  const isSwapping = narration?.kind === 'swap'
  const swappedA = narration?.comparedIndices?.[0]
  const swappedB = narration?.comparedIndices?.[1]

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
      style={{
        perspective: '1100px',
        perspectiveOrigin: '50% 45%',
      }}
    >
      {/* 3D World Container */}
      <motion.div
        className="relative flex items-center justify-center"
        style={{
          width: `${totalArrayWidth}px`,
          height: `${itemWidth}px`,
          transformStyle: 'preserve-3d',
          transform: 'rotateX(52deg) rotateZ(-14deg)',
        }}
      >
        {/* Floor Slab Platform */}
        <Floor3D
          width={floorWidth}
          length={floorLength}
          itemCount={n}
          itemWidth={itemWidth}
          gap={itemGap}
        />

        {/* Sliding Window / Range Plate */}
        {narration?.activeRange && (
          <RangePlate
            startIndex={narration.activeRange[0]}
            endIndex={narration.activeRange[1]}
            itemWidth={itemWidth}
            gap={itemGap}
            reduceMotion={reduceMotion}
          />
        )}

        {/* Array Elements / 3D Boxes */}
        <div
          className="flex items-center justify-center relative"
          style={{
            gap: `${itemGap}px`,
            transformStyle: 'preserve-3d',
          }}
        >
          {items.map((val, idx) => {
            const role = highlightMap.get(idx) || 'default'

            // Height computation: proportional bar if style === 'bars', else cube
            let boxHeight = 52
            if (style === 'bars' && isAllNumbers && maxVal > minVal) {
              const numVal = typeof val === 'number' ? val : 0
              const normalized = (numVal - minVal) / (maxVal - minVal)
              boxHeight = Math.round(36 + normalized * 120)
            }

            const itemIsSwapping = isSwapping && (idx === swappedA || idx === swappedB)
            const swapDirection =
              itemIsSwapping && swappedA !== undefined && swappedB !== undefined
                ? idx === Math.min(swappedA, swappedB)
                  ? 'forward'
                  : 'backward'
                : undefined

            return (
              <Box3D
                key={`box-${idx}`}
                id={`box-${idx}`}
                value={val}
                index={idx}
                height={boxHeight}
                width={itemWidth}
                depth={itemWidth}
                role={role}
                isSwapping={itemIsSwapping}
                swapDirection={swapDirection}
                reduceMotion={reduceMotion}
              />
            )
          })}
        </div>

        {/* Comparison Beam & Evaluator Chip */}
        {narration?.kind === 'compare' &&
          narration.comparedIndices &&
          narration.comparedIndices.length === 2 && (
            <CompareBeam
              fromIndex={narration.comparedIndices[0]}
              toIndex={narration.comparedIndices[1]}
              fromValue={narration.comparedValues?.[0]}
              toValue={narration.comparedValues?.[1]}
              op={narration.comparisonOp || '>'}
              itemWidth={itemWidth}
              gap={itemGap}
              reduceMotion={reduceMotion}
            />
          )}

        {/* Floating Pointer Wisps (i, j, left, right, etc.) */}
        {narration?.activePointers &&
          Object.entries(narration.activePointers).map(([name, idx]) => (
            <Wisp
              key={`wisp-${name}`}
              name={name}
              index={idx}
              itemWidth={itemWidth}
              gap={itemGap}
              reduceMotion={reduceMotion}
            />
          ))}
      </motion.div>
    </div>
  )
}

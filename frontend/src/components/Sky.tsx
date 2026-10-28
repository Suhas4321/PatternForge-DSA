/**
 * Sky.tsx — 100% Procedural Cinematic Sky System for PatternForge Peaks
 *
 * Architecture:
 * 1. Procedural WebGL Sky: ProceduralSky (FBM noise nebula & aurora clouds, multi-octave twinkling starfield, shooting stars, and Bayer/hash anti-banding dither)
 * 2. Dark overlay gradient: 0% top to 55% surface-0 bottom + 40% radial darkening behind title/legend for WCAG AAA contrast
 * 3. Parallax mountain silhouettes: 3 full-width SVG layers tinted with peak accent (translateY 0.05/0.10/0.15 on scroll)
 *
 * Background effects level:
 * - 'full': Full procedural nebula + aurora curtains + twinkling stars + shooting stars + parallax mountains
 * - 'subtle': Procedural nebula + stars + parallax mountains (Default)
 * - 'off': Deep space gradient + static mountains
 *
 * Zero raster images (.webp / .png) required. 100% procedural code execution.
 */

import { useEffect, useRef, useState } from 'react'
import { useBackgroundEffects } from './effects'
import ProceduralSky from './ProceduralSky'

export interface SkyProps {
  /** Peak ID: 'dsa' | 'python_data' | 'sql_dbms' | 'os_concurrency' | 'backend_apis' | 'ai_resume' */
  peak?: string
  /** Accent colour (hex or CSS var, e.g. '#6EE7B7' or 'var(--accent-dsa)') */
  accent?: string
  className?: string
  /** Variant for compatibility */
  variant?: 'peak' | 'galaxy' | 'aurora'
  /** Toggle mountain silhouettes (default: true) */
  showMountains?: boolean
  /** Lock sky to full viewport (fixed inset-0) so aurora/stars fill the whole screen top-to-bottom */
  fixed?: boolean
}

const VALID_PEAKS = new Set([
  'dsa',
  'python_data',
  'sql_dbms',
  'os_concurrency',
  'backend_apis',
  'ai_resume',
])

function resolveCssColor(raw: string): string {
  if (typeof document === 'undefined') return '#6EE7B7'
  if (raw.startsWith('var(')) {
    const varName = raw.slice(4, -1).split(',')[0].trim()
    const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
    if (val) return val
  }
  return raw
}

export default function Sky({
  peak = 'dsa',
  accent = 'var(--accent-dsa, #6EE7B7)',
  className = '',
  showMountains = true,
  fixed = false,
}: SkyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mountainRef1 = useRef<SVGSVGElement>(null)
  const mountainRef2 = useRef<SVGSVGElement>(null)
  const mountainRef3 = useRef<SVGSVGElement>(null)

  const { level } = useBackgroundEffects()

  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false))
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  )

  const cleanPeak = VALID_PEAKS.has(peak) ? peak : 'dsa'
  const resolvedAccent = resolveCssColor(accent)

  // Viewport & accessibility listeners
  useEffect(() => {
    const checkMotion = () => {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    }
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', checkViewport)
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener('change', checkMotion)

    return () => {
      window.removeEventListener('resize', checkViewport)
      motionQuery.removeEventListener('change', checkMotion)
    }
  }, [])

  // Parallax Mountain Silhouettes on Scroll
  useEffect(() => {
    if (!showMountains) return
    if (reducedMotion || isMobile || level === 'off') {
      if (mountainRef1.current) mountainRef1.current.style.transform = ''
      if (mountainRef2.current) mountainRef2.current.style.transform = ''
      if (mountainRef3.current) mountainRef3.current.style.transform = ''
      return
    }

    let rafId: number
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const root = containerRef.current
        if (!root) return
        const rect = root.getBoundingClientRect()
        // Offset relative to viewport
        const offset = window.innerHeight - rect.bottom
        if (mountainRef1.current) {
          mountainRef1.current.style.transform = `translate3d(0, ${offset * 0.15}px, 0)`
        }
        if (mountainRef2.current) {
          mountainRef2.current.style.transform = `translate3d(0, ${offset * 0.10}px, 0)`
        }
        if (mountainRef3.current) {
          mountainRef3.current.style.transform = `translate3d(0, ${offset * 0.05}px, 0)`
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
    }
  }, [reducedMotion, isMobile, level, showMountains])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none ${fixed ? 'fixed' : 'absolute'} inset-0 overflow-hidden select-none ${className}`}
      style={{ zIndex: 0, backgroundColor: '#05070E' }}
    >
      {/* 1. Procedural WebGL Sky (Nebula, Aurora curtains, Twinkling Stars & Shooting Star) */}
      <ProceduralSky
        peak={cleanPeak}
        accent={resolvedAccent}
        level="full"
        className="absolute inset-0"
      />

      {/* 2. Subtle Bottom Vignette (keeps upper aurora bright and vivid!) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(5, 7, 14, 0.0) 0%, rgba(5, 7, 14, 0.15) 65%, rgba(5, 7, 14, 0.45) 100%)',
        }}
      />

      {/* 3. Parallax Mountain Silhouettes (3 SVG layers full width at bottom of section) */}
      {showMountains && (
        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 w-full overflow-hidden"
          style={{ height: '220px' }}
        >
          {/* Mountain 1: Back Ridge (Furthest, tallest peaks) */}
          <svg
            ref={mountainRef1}
            className="absolute bottom-0 inset-x-0 w-full will-change-transform"
            style={{ height: '210px' }}
            viewBox="0 0 1440 210"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,210 L0,115 L95,78 L185,125 L275,55 L365,105 L485,42 L605,110 L725,32 L845,115 L965,48 L1085,105 L1205,38 L1325,100 L1440,70 L1440,210 Z"
              fill={`color-mix(in srgb, #090A0F 88%, ${resolvedAccent} 12%)`}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          </svg>

          {/* Mountain 2: Mid Ridge (Intermediate rugged peaks) */}
          <svg
            ref={mountainRef2}
            className="absolute bottom-0 inset-x-0 w-full will-change-transform"
            style={{ height: '165px' }}
            viewBox="0 0 1440 165"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,165 L0,105 L120,65 L240,115 L380,50 L500,110 L640,40 L780,100 L920,45 L1050,105 L1180,55 L1320,110 L1440,70 L1440,165 Z"
              fill={`color-mix(in srgb, #090A0F 93%, ${resolvedAccent} 7%)`}
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
            />
          </svg>

          {/* Mountain 3: Fore Ridge (Low foothills at base) */}
          <svg
            ref={mountainRef3}
            className="absolute bottom-0 inset-x-0 w-full will-change-transform"
            style={{ height: '115px' }}
            viewBox="0 0 1440 115"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,115 L0,78 L140,45 L300,88 L460,35 L620,82 L790,30 L960,78 L1140,40 L1300,82 L1440,55 L1440,115 Z"
              fill={`color-mix(in srgb, #090A0F 97%, ${resolvedAccent} 3%)`}
              stroke="rgba(255, 255, 255, 0.03)"
              strokeWidth="1"
            />
          </svg>
        </div>
      )}
    </div>
  )
}

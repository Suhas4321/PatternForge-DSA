import React, { useEffect, useRef } from 'react'

export interface ProceduralSkyProps {
  /** Citadel peak identifier: 'dsa' | 'python_data' | 'sql_dbms' | 'os_concurrency' | 'backend_apis' | 'ai_resume' */
  peak?: string
  /** Peak accent color hex (e.g. '#6EE7B7' for DSA, '#38BDF8' for AI Resume) */
  accent?: string
  /** Background effect detail: 'off' | 'subtle' | 'full' */
  level?: 'off' | 'subtle' | 'full'
  className?: string
}

/** Default fallback palette mapped to PatternForge Citadel Peaks */
const PEAK_ACCENTS: Record<string, string> = {
  dsa: '#6EE7B7', // Emerald Aurora
  python_data: '#FBBF24', // Solar Amber
  sql_dbms: '#818CF8', // Indigo Nebula
  os_concurrency: '#F472B6', // Plasma Rose
  backend_apis: '#A78BFA', // Quantum Violet
  ai_resume: '#38BDF8', // Cyber Cyan
}

/** Deterministic spatial seed offset per peak so each domain shifts the cosmos slightly */
const PEAK_SEEDS: Record<string, number> = {
  dsa: 0.0,
  python_data: 17.3,
  sql_dbms: 34.7,
  os_concurrency: 52.1,
  backend_apis: 69.5,
  ai_resume: 88.2,
}

/** Parse Hex or CSS RGB string into normalized [r, g, b] floats (0..1) */
function parseColorToNormalizedRgb(
  input: string | undefined,
  fallbackHex: string,
): [number, number, number] {
  let str = (input || fallbackHex).trim()

  // Resolve CSS variable if passed e.g. "var(--peak-accent)"
  if (typeof window !== 'undefined' && str.startsWith('var(')) {
    const varName = str.slice(4, -1).split(',')[0].trim()
    const resolved = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim()
    if (resolved) str = resolved
    else str = fallbackHex
  }

  if (str.startsWith('#')) {
    let hex = str.slice(1)
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('')
    }
    const num = parseInt(hex, 16)
    if (!Number.isNaN(num)) {
      return [
        ((num >> 16) & 255) / 255,
        ((num >> 8) & 255) / 255,
        (num & 255) / 255,
      ]
    }
  }

  return [0.431, 0.906, 0.718] // #6EE7B7 fallback
}

// ============================================================================
// GLSL SHADERS (Single Fullscreen Triangle - Zero Geometry Overhead)
// ============================================================================

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_accent;
  uniform float u_level; // 1.0 = subtle, 2.0 = full
  uniform float u_seed;

  // --- Fast Procedural Hash Functions (Zero Textures) ---
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
  }

  // --- 2D Value Noise & 3-Octave Rotated FBM ---
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash12(i + vec2(0.0, 0.0)), hash12(i + vec2(1.0, 0.0)), u.x),
      mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);

  float fbm3(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    v += a * noise(p); p = ROT * p * 2.02 + vec2(13.1, 7.7); a *= 0.5;
    v += a * noise(p); p = ROT * p * 2.03 + vec2(5.3, 19.4); a *= 0.5;
    v += a * noise(p);
    return v;
  }

  // --- Starfield Layer Generator ---
  float starLayer(vec2 p, float cellScale, float densityThreshold, float isMedium, float t) {
    vec2 grid = p * cellScale;
    vec2 id = floor(grid);
    vec2 gv = fract(grid) - 0.5;

    vec2 rnd = hash22(id + u_seed * 0.17);
    if (rnd.x < densityThreshold) return 0.0;

    // Sub-cell jitter
    vec2 offset = (rnd - 0.5) * 0.72;
    vec2 d = gv - offset;
    float dist = length(d);

    // Crisp pinpoint vs soft pulsing star
    float radius = mix(0.045, 0.095, isMedium);
    float core = smoothstep(radius, 0.0, dist);
    core = pow(core, mix(2.2, 1.5, isMedium));

    // Sinusoidal twinkle phase for medium stars
    float phase = rnd.y * 6.2831853 + id.x * 1.13;
    float speed = 1.2 + fract(rnd.x * 43.7) * 2.4;
    float twinkle = mix(
      0.85,
      0.45 + 0.55 * sin(t * speed + phase),
      isMedium
    );

    // Subtle cross-flare on the brightest medium stars
    float flare = 0.0;
    if (isMedium > 0.5 && rnd.x > 0.996) {
      float fx = max(0.0, 1.0 - abs(d.x * 28.0)) * max(0.0, 1.0 - abs(d.y * 6.0));
      float fy = max(0.0, 1.0 - abs(d.y * 28.0)) * max(0.0, 1.0 - abs(d.x * 6.0));
      flare = (fx + fy) * 0.35 * twinkle;
    }

    return (core * twinkle) + flare;
  }

  // --- Rare Cosmic Glimmer (Shooting Star every 8-14s) ---
  vec3 shootingStar(vec2 uv, float t, vec3 accent) {
    float cyclePeriod = 11.0; // Average 11s window (8s-14s jittered per cycle)
    float cycleId = floor(t / cyclePeriod);
    float localT = mod(t, cyclePeriod);

    float r1 = hash12(vec2(cycleId, 1.23 + u_seed));
    float r2 = hash12(vec2(cycleId, 4.56 + u_seed));
    float r3 = hash12(vec2(cycleId, 7.89 + u_seed));

    // Randomize trigger delay inside window (keeps intervals between 8 and 14s)
    float triggerStart = 1.5 + r1 * 6.0;
    float duration = 0.75;
    float progress = (localT - triggerStart) / duration;

    if (progress <= 0.0 || progress >= 1.0) return vec3(0.0);

    // Trajectory setup in upper-mid sky
    vec2 startPos = vec2((r2 - 0.5) * 1.2, 0.15 + r3 * 0.35);
    float angle = -0.45 - r1 * 0.35; // Downward diagonal
    vec2 dir = vec2(cos(angle), sin(angle));

    float travelDist = 0.85;
    float tailLen = 0.24;
    vec2 headPos = startPos + dir * (progress * travelDist);
    vec2 tailPos = headPos - dir * tailLen;

    // Project fragment onto segment [tailPos -> headPos]
    vec2 pa = uv - tailPos;
    vec2 ba = headPos - tailPos;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float dist = length(pa - ba * h);

    // Core thickness & gradient tail fade
    float thickness = smoothstep(0.0035, 0.0, dist);
    float tailGradient = pow(h, 2.5);
    float envelope = sin(progress * 3.14159265); // Smooth fade in/out

    float intensity = thickness * tailGradient * envelope;
    vec3 streakColor = mix(accent, vec3(1.0), h * 0.75);
    return streakColor * intensity * 1.35;
  }

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = fragCoord / u_resolution.xy;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 p = (fragCoord - 0.5 * u_resolution.xy) / u_resolution.y;

    // 1. DEEP SPACE VOID (#05070E to #090A15)
    vec3 voidBottom = vec3(0.0196, 0.0275, 0.0549); // #05070E
    vec3 voidTop    = vec3(0.0353, 0.0392, 0.0824); // #090A15
    float radialVignette = length(p * vec2(0.65, 0.95));
    vec3 col = mix(voidTop, voidBottom, clamp(uv.y * 0.85 + radialVignette * 0.35, 0.0, 1.0));

    // Detail scaler: subtle (0.75x intensity) vs full (1.25x intensity)
    float detailWeight = mix(0.75, 1.25, clamp(u_level - 1.0, 0.0, 1.0));

    // 2. NEBULA & AURORA CLOUDS (3-Octave FBM)
    vec2 seedShift = vec2(u_seed * 0.31, u_seed * 0.19);
    vec2 nebulaCoord = p * 1.3 + seedShift + vec2(u_time * 0.015, -u_time * 0.008);
    float n1 = fbm3(nebulaCoord);
    float n2 = fbm3(nebulaCoord * 1.6 - vec2(n1 * 0.65, u_time * 0.02));
    float nebulaMask = smoothstep(0.32, 0.78, n2);

    // Aurora Curtain Ribbons (undulating upper-sky waves across the view)
    vec2 auroraDomain = vec2(p.x * 1.25 + seedShift.x, p.y * 1.8 - 0.1);
    float waveWarp = fbm3(vec2(auroraDomain.x * 1.2 + u_time * 0.035, u_time * 0.02));
    float ribbonDist = abs(auroraDomain.y + (waveWarp - 0.5) * 0.65);
    float auroraBand = smoothstep(0.55, 0.0, ribbonDist);

    // Vertical striations inside the aurora curtain
    float curtainRays = fbm3(vec2(auroraDomain.x * 4.5 - u_time * 0.025, auroraDomain.y * 1.4));
    float aurora = auroraBand * smoothstep(0.20, 0.75, curtainRays);

    // Deep-space cosmic chromatic color mix (lively aurora + dual-tone nebula)
    vec3 secondaryAurora = vec3(0.38, 0.45, 0.98); // vibrant indigo-violet complement
    vec3 cyanGlow = vec3(0.15, 0.82, 0.96);
    vec3 deepTint = mix(secondaryAurora, u_accent, 0.55);
    col += deepTint * nebulaMask * 0.52 * detailWeight;
    col += mix(u_accent, cyanGlow, 0.35) * aurora * 0.72 * detailWeight;

    // Upper-canopy aurora glow so top of screen is rich and colorful
    float topCanopy = smoothstep(0.15, 0.95, uv.y) * smoothstep(0.25, 0.85, n1);
    col += mix(secondaryAurora, u_accent, uv.x) * topCanopy * 0.38 * detailWeight;

    // 3. PROCEDURAL MULTI-OCTAVE STARFIELD
    // Layer A: Crisp 1px pinpoint micro-stars
    float micro = starLayer(p, 52.0, 0.965, 0.0, u_time);
    col += mix(vec3(0.85, 0.92, 1.0), u_accent, 0.30) * micro * 0.95;

    // Layer B: Pulsing medium stars with sinusoidal twinkle
    float medium = starLayer(p + vec2(19.4, 7.2), 22.0, 0.982, 1.0, u_time);
    col += mix(vec3(0.95, 0.98, 1.0), u_accent, 0.50) * medium * 1.40 * detailWeight;

    // 4. RARE COSMIC GLIMMER (Only active in 'full' mode and when motion is active)
    if (u_level > 1.5 && u_time > 0.0) {
      col += shootingStar(p, u_time, u_accent);
    }

    // 5. ANTI-BANDING SUBTLE NOISE DITHER (Eliminates 8-bit dark monitor banding)
    // Triangular PDF dither [-1/255, +1/255]
    float ditherA = hash12(fragCoord + fract(u_time * 0.37) * 100.0);
    float ditherB = hash12(fragCoord + vec2(13.7, 29.3) + fract(u_time * 0.71) * 100.0);
    float tpdfDither = (ditherA + ditherB - 1.0) / 255.0;
    col += vec3(tpdfDither);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`

// ============================================================================
// REACT 19 COMPONENT
// ============================================================================

export const ProceduralSky: React.FC<ProceduralSkyProps> = ({
  peak = 'dsa',
  accent,
  level = 'full',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Store reactive targets in a ref so prop updates smoothly interpolate in the RAF loop
  // without tearing down and recompiling the WebGL context.
  const targetStateRef = useRef({
    accentRgb: parseColorToNormalizedRgb(
      accent,
      PEAK_ACCENTS[peak] || PEAK_ACCENTS.dsa,
    ),
    seed: PEAK_SEEDS[peak] ?? 0.0,
    levelNum: level === 'subtle' ? 1.0 : 2.0,
  })

  useEffect(() => {
    const fallbackHex = PEAK_ACCENTS[peak] || PEAK_ACCENTS.dsa
    targetStateRef.current.accentRgb = parseColorToNormalizedRgb(
      accent,
      fallbackHex,
    )
    targetStateRef.current.seed = PEAK_SEEDS[peak] ?? 0.0
    targetStateRef.current.levelNum = level === 'subtle' ? 1.0 : 2.0
  }, [peak, accent, level])

  useEffect(() => {
    if (level === 'off') return

    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    })

    if (!gl) return

    // Compile shader utility
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('ProceduralSky shader error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('ProceduralSky link error:', gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)

    // Single fullscreen triangle covering [-1, 1] clip space
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )

    const posLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uAccent = gl.getUniformLocation(program, 'u_accent')
    const uLevel = gl.getUniformLocation(program, 'u_level')
    const uSeed = gl.getUniformLocation(program, 'u_seed')

    // Interpolated runtime state for silky peak transitions
    const currentAccent: [number, number, number] = [
      ...targetStateRef.current.accentRgb,
    ]
    let currentSeed = targetStateRef.current.seed
    let currentLevel = targetStateRef.current.levelNum

    // Lifecycle & Accessibility flags
    let rafId = 0
    let isIntersecting = true
    let isTabHidden = document.hidden
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let prefersReducedMotion = motionQuery.matches
    let isSmallScreen = window.innerWidth < 768

    let lastFrameTimestamp = performance.now()
    let accumulatedTime = 0

    // Resize & Clamped DPR (Max 2.0)
    const updateSize = () => {
      isSmallScreen = window.innerWidth < 768
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      const width = Math.max(1, Math.floor(rect.width * dpr))
      const height = Math.max(1, Math.floor(rect.height * dpr))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
    }

    const drawFrame = (timestamp: number) => {
      rafId = 0
      const dt = Math.min((timestamp - lastFrameTimestamp) * 0.001, 0.1)
      lastFrameTimestamp = timestamp

      const isStaticFreeze = prefersReducedMotion || isSmallScreen
      if (isStaticFreeze) {
        accumulatedTime = 0.0 // Strict rule: freeze animation time to 0
      } else {
        accumulatedTime += dt
      }

      // Smoothly lerp accent color & seed when switching Citadel Peaks
      const target = targetStateRef.current
      const lerpFactor = isStaticFreeze ? 1.0 : Math.min(1.0, dt * 4.5)
      currentAccent[0] += (target.accentRgb[0] - currentAccent[0]) * lerpFactor
      currentAccent[1] += (target.accentRgb[1] - currentAccent[1]) * lerpFactor
      currentAccent[2] += (target.accentRgb[2] - currentAccent[2]) * lerpFactor
      currentSeed += (target.seed - currentSeed) * lerpFactor
      currentLevel += (target.levelNum - currentLevel) * lerpFactor

      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform1f(uTime, accumulatedTime)
      gl.uniform3f(
        uAccent,
        currentAccent[0],
        currentAccent[1],
        currentAccent[2],
      )
      gl.uniform1f(uLevel, currentLevel)
      gl.uniform1f(uSeed, currentSeed)

      gl.drawArrays(gl.TRIANGLES, 0, 3)

      // Only schedule continuous frames if visible, tab active, and not static-frozen
      if (isIntersecting && !isTabHidden && !isStaticFreeze) {
        rafId = requestAnimationFrame(drawFrame)
      }
    }

    const scheduleRender = () => {
      if (rafId === 0 && isIntersecting && !isTabHidden) {
        lastFrameTimestamp = performance.now()
        rafId = requestAnimationFrame(drawFrame)
      }
    }

    const stopRender = () => {
      if (rafId !== 0) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
    }

    // Initial sizing and paint
    updateSize()
    drawFrame(performance.now())

    // 1. ResizeObserver for responsive container changes & < 768px freeze
    const resizeObserver = new ResizeObserver(() => {
      updateSize()
      drawFrame(performance.now())
      scheduleRender()
    })
    resizeObserver.observe(canvas)

    // 2. IntersectionObserver to pause GPU work when scrolled offscreen
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        isIntersecting = entry ? entry.isIntersecting : true
        if (isIntersecting) scheduleRender()
        else stopRender()
      },
      { threshold: 0.01 },
    )
    intersectionObserver.observe(canvas)

    // 3. Page Visibility API to pause when browser tab is backgrounded
    const handleVisibilityChange = () => {
      isTabHidden = document.hidden
      if (!isTabHidden) scheduleRender()
      else stopRender()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 4. Reduced Motion listener
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches
      drawFrame(performance.now())
      if (!prefersReducedMotion) scheduleRender()
      else stopRender()
    }
    motionQuery.addEventListener('change', handleMotionChange)

    return () => {
      stopRender()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      motionQuery.removeEventListener('change', handleMotionChange)

      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }, [level])

  // Trigger a single repaint if props change while frozen in static mode (<768px or reduced motion)
  useEffect(() => {
    if (level === 'off') return
    const isFrozen =
      window.innerWidth < 768 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isFrozen && canvasRef.current) {
      window.dispatchEvent(new Event('resize'))
    }
  }, [peak, accent, level])

  // Static CSS fallback when level === 'off'
  if (level === 'off') {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#090A15] to-[#05070E] ${className}`}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full block bg-[#05070E] ${className}`}
    />
  )
}

export default ProceduralSky

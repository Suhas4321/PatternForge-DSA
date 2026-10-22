# PatternForge — Visualizer Master Design Specification (VISUALIZER_DESIGN.md)

**Document Status:** Approved Architecture Spec (Phase V0)  
**Target Platform:** Desktop-First Web Application (1280px–1920px primary, responsive to 768px tablet & 390px mobile)  
**Rendering Stack:** React 19, Vite, Tailwind CSS v4, `motion` (Motion / Framer Motion), Monaco Editor, CSS 3D Transforms  
**Safety & Compliance:** Strict MIT licensing, zero third-party copyright assets, full `prefers-reduced-motion` support  

---

## 1. Architectural Vision & Core Principles

The target visualizer experience turns static line tracing into an interactive, spatial algorithmic theater. As inspired by VisuAlgo, Python Tutor, Algorithm Visualizer, and high-production algorithmic animation reels, every execution frame simultaneously binds five dimensions of feedback in strict synchrony:
1. **The Code:** Monaco editor with an animated left-bar line decoration, floating line pill, and variable inline-hints.
2. **The Spatial Stage:** An isometric 3D/2D platform where data structures physically lift, swap, and compare with real geometry and lighting.
3. **The Semantic Narrator:** A plain-English explanation bar answering both **WHAT** happened (*"swap a[5], a[6]"*) and **WHY** (*"8 > 1, so elements are inverted"*).
4. **Complexity Badges & Telemetry:** Outlined pill badges for Time and Space complexity, paired with live comparison and swap counters.
5. **Timeline & Scrubber Dock:** A glass transport bar with color-coded semantic tick marks mapping out the rhythm of the algorithm.

```
+---------------------------------------------------------------------------------------------------------+
|                                  PATTERNFORGE WORKSPACE ARENA (1440px)                                  |
+------------------------------------------------------------------+--------------------------------------+
| STAGE SHELL (58% width)                                          | CODE & INSPECTOR (42% width)         |
| +--------------------------------------------------------------+ | +----------------------------------+ |
| | HEADER: Two Sum II · O(n) TIME · O(1) SPACE                  | | | [solution.py] Python 3.11        | |
| | COUNTERS: 14 comparisons · 3 swaps · Step 8 / 24             | | +----------------------------------+ |
| +--------------------------------------------------------------+ | | 1  class Solution:               | |
| | CANVAS (clamp 340px to 560px)                                | | | 2      def twoSum(nums, target): | |
| |                                                              | | | 3          l, r = 0, len(nums)-1 | |
| |       [Wisp: left]                 [Wisp: right]             | | | 4  -->     while l < r:          | |
| |        (3D Cube)                    (3D Cube)                | | | 5              s = nums[l]+nums[r]| |
| |      +----------+                 +----------+               | | | 6              if s == target:   | |
| |     /    2     /|                /    15    /|               | | | 7                  return [l, r] | |
| |    +----------+ |    Compare     +----------+ |               | | +----------------------------------+ |
| |    |  #67E8F9 | | <-----------> |  #67E8F9 | |               | | | Tabs: [Variables] [Memory]       | |
| |    |          |/   "2 + 15=17"   |          |/               | | |   l: 0     nums[l]: 2            | |
| |    +----------+                  +----------+                | | |   r: 3     nums[r]: 15           | |
| |   ============================================= (Floor)      | | |   s: 17    target: 9             | |
| +--------------------------------------------------------------+ | +----------------------------------+ |
| | CAPTION: Compare nums[0] + nums[3] = 17                      | | TEST RESULTS                       | |
| | WHY: Sum 17 is greater than target 9, so decrement right ptr | | [Passed: 7/7] runtime: 12ms        | |
| +--------------------------------------------------------------+ |                                      |
| | PLAYBACK DOCK: [|<] [<] [PLAY] [>] [>|] ===[|]=== 1x [Step]  | |                                      |
| +--------------------------------------------------------------+ +--------------------------------------+
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Layout Geometry & Responsive System

### Responsive Breakpoints & Sizing Rules
- **Desktop (>= 1280px up to 1920px):** Split grid: `58%` Visual Stage Shell, `42%` Code Editor + Test Results.
- **Laptop / Small Desktop (1024px – 1279px):** Split grid: `52%` Visual Stage, `48%` Code Panel, or user-selected stacked layout via layout toggle.
- **Tablet (768px – 1023px):** Stacked full-width layout: Visual Stage pinned on top, Code Editor below.
- **Mobile (390px – 767px):** Full-width stacked view. Fixed pixel widths on cards/canvases are strictly prohibited.
  - The canvas container uses `ResizeObserver` + CSS `scale()` / SVG `viewBox` coordinates to scale the visual scene proportionally down to fit `100vw - 32px` without causing any horizontal document scroll.

### Height Constraints
- Visualizer Canvas area: `height: clamp(340px, 46vh, 560px);`
- Playback Dock: Pinned as a glass floating pill at the bottom edge of the Stage card (`position: sticky; bottom: 12px; z-index: 20;`).

---

## 3. Semantic Design Tokens (`--viz-*`)

All visualizer cues must adhere to the design token system. Colors are never hardcoded as hex values in `.tsx` files; they are referenced through CSS variables or theme classes. Furthermore, color is **never the sole indicator of state**: an accompanying icon, textual label, or geometric transform must always reinforce the action.

```css
@theme {
  --color-viz-compare: #67E8F9; /* Cyan - Comparison, pointer inspection, reading */
  --color-viz-swap:    #FB923C; /* Ember - Physical position swap, displacement */
  --color-viz-write:   #6EE7B7; /* Mint - Cell value write, assignment, mutation */
  --color-viz-read:    #A78BFA; /* Violet - Hash map lookup, subscript read */
  --color-viz-target:  #FB7185; /* Coral - Search target match, needle hit, conflict */
  --color-viz-done:    #34D399; /* Emerald - Sorted partition, verified assertion */
  --color-viz-idle:    #212631; /* Surface-3 - Unfocused, baseline structure */
}

:root {
  --viz-compare: #67E8F9;
  --viz-swap:    #FB923C;
  --viz-write:   #6EE7B7;
  --viz-read:    #A78BFA;
  --viz-target:  #FB7185;
  --viz-done:    #34D399;
  --viz-idle:    var(--surface-3, #212631);

  /* Element glow radius: applied only to active elements on current frame */
  --viz-glow-compare: 0 0 16px rgba(103, 232, 249, 0.35);
  --viz-glow-swap:    0 0 18px rgba(251, 146, 60, 0.40);
  --viz-glow-write:   0 0 16px rgba(110, 231, 183, 0.35);
  --viz-glow-target:  0 0 16px rgba(251, 113, 133, 0.40);
  --viz-glow-done:    0 0 16px rgba(52, 211, 153, 0.35);
}
```

### Visual & Event Icon Mappings
| State | Token | Accent Hex | Reinforcing Symbol | Visual Transform |
| :--- | :--- | :--- | :--- | :--- |
| **Compare** | `--viz-compare` | `#67E8F9` | `Brackets` `[ ]` or `Scale` | `translateZ(10px)` + Cyan glow + Compare Beam |
| **Swap** | `--viz-swap` | `#FB923C` | `ArrowLeftRight` `⇄` | `translateZ(36px)` + Parabolic arc cross + Ember glow |
| **Write** | `--viz-write` | `#6EE7B7` | `ArrowDownToLine` `⤓` | Color flash pulse + Mint border |
| **Read** | `--viz-read` | `#A78BFA` | `Eye` | Violet border ring |
| **Target** | `--viz-target` | `#FB7185` | `Crosshair` `⌖` | Pulsing Coral halo |
| **Done** | `--viz-done` | `#34D399` | `CheckCheck` `✓✓` | Light sweep across face + Emerald settling |

---

## 4. Motion Presets & Accessibility Contract

Defined centrally in `frontend/src/lib/motion.ts`:

```ts
export const motionPresets = {
  spring: {
    snappy: { type: 'spring', stiffness: 420, damping: 32, mass: 1 },
    soft:   { type: 'spring', stiffness: 220, damping: 26, mass: 1 },
    bounce: { type: 'spring', stiffness: 300, damping: 18, mass: 0.8 },
  },
  ease: {
    out: [0.2, 0.8, 0.2, 1],
    inOut: [0.4, 0, 0.2, 1],
  },
  duration: {
    fast: 0.15,
    normal: 0.22,
    deliberate: 0.36,
    swap: 0.42,
  },
} as const
```

### Motion Safety Rules
1. **Hardware Acceleration:** Animate only `transform` and `opacity`. Never animate `width`, `height`, `margin`, or `left`/`top` offsets for element motion.
2. **Reduced Motion:** If `window.matchMedia('(prefers-reduced-motion: reduce)').matches`:
   - Disable all 3D arc jumps, wisp floating, and confetti.
   - Elements change position instantly (`duration: 0`).
   - Use simple color-border flashes to signal compare and swap.
3. **Playback Speed Synchronization:**
   - Default step delay: `650ms / speed`.
   - **Minimum Step Duration Rule:** `stepDelay = Math.max(650 / speed, animationDuration + 80ms)`. This ensures that at 2x or 4x speed, a 420ms swap arc is never abruptly truncated midway.

---

## 5. The Narrator Engine Contract

The Narrator engine (`frontend/src/lib/narrator/`) is a deterministic pure function executed on each frame. It decodes the low-level trace diff and Python source line into human educational context.

```ts
export type NarratorKind =
  | 'compare'
  | 'swap'
  | 'write'
  | 'read'
  | 'push'
  | 'pop'
  | 'enqueue'
  | 'dequeue'
  | 'call'
  | 'return'
  | 'visit'
  | 'found'
  | 'done'
  | 'init'
  | 'info'

export interface ElementHighlight {
  target: string // Identifier, e.g. "nums[2]"
  role: 'compare' | 'swap' | 'write' | 'read' | 'target' | 'done'
}

export interface StepMove {
  id: string   // Persistent element ID
  from: number // Origin index
  to: number   // Destination index
}

export interface NarratorResult {
  kind: NarratorKind
  caption: string // Short action title: "swap a[5], a[6]"
  why: string     // Semantic rationale: "8 > 1, so elements are out of order"
  highlights: ElementHighlight[]
  counters: {
    comparisons: number
    swaps: number
    writes: number
  }
  moves?: StepMove[]
}
```

### Rules of Operation
- **Deterministic:** Pure calculation based solely on `(curStep, prevStep, context)`. No external network, AI calls, or non-deterministic timers.
- **Precomputed Cumulative Telemetry:** Comparisons, swaps, and mutations are precomputed in an initial $O(N)$ pass over `steps` when the trace loads, caching counter values for instant $O(1)$ scrubbing.
- **Source Tokenization:** Inspects the current line text using regex / token matching:
  - Python tuple swap: `(\w+)\[(.*)\],\s*(\w+)\[(.*)\]\s*=\s*\1\[\4\],\s*\1\[\2\]`
  - Comparisons: `if\s+.*([<>]=?|==|!=).*:`
  - Heap operations: `heappop|heappush`
- **YAML Override:** If the question YAML contains `viz.line_notes[line]`, that hand-written note takes precedence as the `why` explanation.
- **Safe Fallback:** If pattern match confidence is low, returns `kind: 'info'`, `caption: "line N in func()"`, and leaves `why` blank.

---

## 6. CSS 3D Block Stage Specification (Pure CSS 3D)

Rather than introducing WebGL/Three.js, the 3D effect is rendered using standard CSS 3D transforms (`transform-style: preserve-3d; perspective: 1100px;`). This guarantees zero canvas overhead, perfectly crisp typography at any DPI, and full DOM/React accessibility.

```
                  Top Face: Value Number (#F8FAFC)
                     +-------------------+
                    /                   /|
                   /      nums[i]      / |
                  /        "42"       /  | Right Face: Shadowed Tone
                 +-------------------+   |   (Darker 20%)
                 |                   |   +
                 |    Front Face     |  /
                 |   Accent Color    | /
                 |                   |/
                 +-------------------+
                 Index Tag on Floor: "0"
```

### 3D Coordinate Space & Geometry
- **Scene Camera:**
  ```css
  .stage-3d-viewport {
    perspective: 1100px;
    perspective-origin: 50% 35%;
  }
  .stage-3d-world {
    transform-style: preserve-3d;
    transform: rotateX(52deg) rotateZ(-14deg);
    transition: transform 0.4s ease-out;
  }
  ```
- **Box Construction:** Each bar/cube consists of 3 visible faces created with absolute positioning:
  - **Top Face:** Counter-rotated so the text sits facing the learner upright: `transform: rotateX(-90deg) translateZ(0px) rotateY(180deg)`.
  - **Front Face:** Base accent color with border.
  - **Right Face:** Darkened shade (30% darker) for ambient occlusion depth.
- **Box Dimensions:**
  - Standard cubes: `44px x 44px x 44px`.
  - Sorting bars: Height proportional to value: `height = clamp(32px, (val / maxVal) * 160px, 200px)`.
- **Floor Slab:** A floating platform with a subtle grid pattern and a soft radial shadow beneath it (`box-shadow: 0 32px 64px -16px rgba(0,0,0,0.6)`).

### Swap Animation Physics
1. **Lift (0ms – 120ms):** Both boxes lift along the Z axis (`translateZ(36px)`). Their floor contact shadows blur and fade to 20% opacity.
2. **Glide (120ms – 340ms):** The two boxes cross trajectories along a parabolic arc. Box A arches slightly toward the foreground (`translateY(-24px)`), while Box B arches toward the background (`translateY(+24px)`), preventing geometric clipping.
3. **Drop & Settle (340ms – 420ms):** Boxes descend back to `translateZ(0px)` with a slight elastic squash (`scaleY(0.95)` to `scaleY(1.0)`). A brief circular ripple ring flashes on the floor plate.

### Pointer Wisps (Character Replacement)
Instead of a copyrighted mascot, pointers (`i`, `j`, `left`, `right`, `mid`) are represented by **Wisps**: glowing energetic orbs floating `28px` above their target cube.
- Each wisp has a subtle levitation loop (`animate={{ y: [-3, 3, -3] }}`) and a flag label indicating the variable name.
- Wisps glide between array indices using `spring.soft`.

---

## 7. Vendor Component Sources, Licensing & Installation

All external components are standard MIT-licensed implementations. Per Rule 2, they will be copied into `frontend/src/components/vendor/<library>/` with original license headers preserved, modifying only imports and design token styling.

### Component Manifest & Registry Verification
| Component | Source / Registry | Verified Endpoint | License | Project Destination |
| :--- | :--- | :--- | :--- | :--- |
| **Shimmer Button** | Magic UI | `https://magicui.design/r/shimmer-button.json` (HTTP 200) | MIT | `frontend/src/components/vendor/magicui/shimmer-button.tsx` |
| **Interactive Hover Button** | Magic UI | `https://magicui.design/r/interactive-hover-button.json` (HTTP 200) | MIT | `frontend/src/components/vendor/magicui/interactive-hover-button.tsx` |
| **Number Ticker** | Magic UI | `https://magicui.design/r/number-ticker.json` (HTTP 200) | MIT | `frontend/src/components/vendor/magicui/number-ticker.tsx` |
| **Animated List** | Magic UI | `https://magicui.design/r/animated-list.json` (HTTP 200) | MIT | `frontend/src/components/vendor/magicui/animated-list.tsx` |
| **Animated Beam** | Magic UI | `https://magicui.design/r/animated-beam.json` (HTTP 200) | MIT | `frontend/src/components/vendor/magicui/animated-beam.tsx` |
| **Confetti** | Magic UI | `https://magicui.design/r/confetti.json` (HTTP 200) | MIT | `frontend/src/components/vendor/magicui/confetti.tsx` |
| **Border Beam** | Magic UI | `https://magicui.design/r/border-beam.json` (HTTP 200) | MIT | `frontend/src/components/vendor/magicui/border-beam.tsx` |
| **Animated Play Icon** | Lucide Animated | `https://lucide-animated.com/r/play.json` (HTTP 200) | MIT | `frontend/src/components/vendor/lucide-animated/play.tsx` |
| **Animated Pause Icon** | Lucide Animated | `https://lucide-animated.com/r/pause.json` (HTTP 200) | MIT | `frontend/src/components/vendor/lucide-animated/pause.tsx` |
| **Animated Check Icon** | Lucide Animated | `https://lucide-animated.com/r/check.json` (HTTP 200) | MIT | `frontend/src/components/vendor/lucide-animated/check.tsx` |
| **Animated Rotate-CCW** | Lucide Animated | `https://lucide-animated.com/r/rotate-ccw.json` (HTTP 200) | MIT | `frontend/src/components/vendor/lucide-animated/rotate-ccw.tsx` |
| **Animated Sparkles** | Lucide Animated | `https://lucide-animated.com/r/sparkles.json` (HTTP 200) | MIT | `frontend/src/components/vendor/lucide-animated/sparkles.tsx` |
| **Animated Gauge** | Lucide Animated | `https://lucide-animated.com/r/gauge.json` (HTTP 200) | MIT | `frontend/src/components/vendor/lucide-animated/gauge.tsx` |
| **Animated Chevron Left/Right** | Lucide Animated | `https://lucide-animated.com/r/chevron-left.json` (HTTP 200) | MIT | `frontend/src/components/vendor/lucide-animated/chevron.tsx` |

*Note on Unregistered Icons:* Icons not found on `lucide-animated.com` (`list`, `chevron-last`, `skip-forward`, `skip-back`) will use the corresponding static icons from `lucide-react`.

---

## 8. Multi-Phase Implementation & File Plan

### Phase V0 — Investigation and Design Specification (Current)
- `docs/VISUALIZER_DESIGN.md` (this file)
- Reference investigation & URL accessibility report
- Vendor component registry verification

### Phase V1 — Universal Stage Shell, Dock, Captions & Code Panel
*Applies to all 11 visualizers without rewriting their internals.*
- **New Files:**
  - `frontend/src/lib/motion.ts`: Central motion and spring configurations.
  - `frontend/src/components/visualizers/stage/StageShell.tsx`: Unified container card with header and badges.
  - `frontend/src/components/visualizers/stage/ComplexityBadges.tsx`: Reference Time & Space badges with hover tooltips.
  - `frontend/src/components/visualizers/stage/Counters.tsx`: Live comparison/swap counter pills.
  - `frontend/src/components/visualizers/stage/CaptionBar.tsx`: Dual-line action & explanation bar with blur-fade transitions.
  - `frontend/src/components/visualizers/stage/PlaybackDock.tsx`: Floating glass transport dock.
  - `frontend/src/components/visualizers/stage/Scrubber.tsx`: Semantic tick-colored timeline seek bar.
  - `frontend/src/components/visualizers/stage/StepLog.tsx`: VisuAlgo-style collapsible commentary log.
  - `frontend/src/components/visualizers/stage/EventIcon.tsx`: Contextual badge icon per action kind.
  - `frontend/src/components/visualizers/stage/usePlayback.ts`: Extracted playback controller hook.
  - `frontend/src/components/vendor/magicui/*` & `lucide-animated/*`: Cloned vendor assets.
- **Modified Files:**
  - `frontend/src/index.css`: Add `--viz-*` tokens and `.stage-shell` utility classes.
  - `frontend/src/components/visualizers/VisualizerHost.tsx`: Wrap all 11 visualizers inside `StageShell`.
  - `frontend/src/components/CodeEditor.tsx`: Add sliding 3px left bar decoration, line chip, and inline value hints.
  - `frontend/src/components/workspace/StageArena.tsx`: Integrate StageShell, updated CodeEditor, and responsive 58/42 desktop layout.

### Phase V2 — Narrator Engine + 3D Block Stage for Arrays (Hero Reel Effect)
- **New Files:**
  - `frontend/src/lib/narrator/types.ts`: Narrator contracts.
  - `frontend/src/lib/narrator/index.ts`: Central dispatcher and counter calculator.
  - `frontend/src/lib/narrator/array.ts`: Array, two-pointer, and sorting narrator rules.
  - `frontend/src/lib/narrator/__tests__/array.test.ts`: Deterministic unit tests.
  - `frontend/src/components/visualizers/three-d/Scene3D.tsx`: Viewport and camera wrapper.
  - `frontend/src/components/visualizers/three-d/Floor3D.tsx`: Floor slab with coordinate markings.
  - `frontend/src/components/visualizers/three-d/Box3D.tsx`: 3-face isometric cube/bar.
  - `frontend/src/components/visualizers/three-d/Wisp.tsx`: Floating pointer orb.
  - `frontend/src/components/visualizers/three-d/CompareBeam.tsx`: Connection bracket with comparison evaluation chip.
  - `frontend/src/components/visualizers/three-d/RangePlate.tsx`: Glass bracket hovering over sliding windows.
  - `content/questions/01-arrays-hashing/bubble-sort.yaml`: New hero demo question.
- **Modified Files:**
  - `backend/app/runner/harness.py`: Safe AST `line_info` extraction (subscript patterns, focus indices).
  - `backend/app/content_schema.py`: Support optional `viz.complexity`, `viz.line_notes`, and `viz.style`.
  - `frontend/src/components/visualizers/ArrayPointerVisualizer.tsx`: Delegate to `Scene3D` for arrays with $N \le 24$.
  - 10 core array questions YAML: Add curated `viz.line_notes`.

### Phase V3 — DSA Visualizers Upgrade (Linked List, Tree, Graph, DP, Stack)
- **New Files:**
  - `frontend/src/lib/narrator/stack.ts`: Push/pop monotonic condition narrator.
  - `frontend/src/lib/narrator/linkedlist.ts`: Pointer rewiring narrator.
  - `frontend/src/lib/narrator/tree.ts`: Traversal and recursion narrator.
  - `frontend/src/lib/narrator/graph.ts`: BFS/DFS frontier narrator.
  - `frontend/src/lib/narrator/dp.ts`: Recurrence equation narrator.
- **Modified Files:**
  - `frontend/src/components/visualizers/StackQueueVisualizer.tsx`: Inset glass tube with 3D drop/lift physics.
  - `frontend/src/components/visualizers/LinkedListVisualizer.tsx`: Dynamic node repositioning and path length rewiring.
  - `frontend/src/components/visualizers/TreeRecursionVisualizer.tsx`: Responsive tree scaling and call stack panel.
  - `frontend/src/components/visualizers/GraphGridVisualizer.tsx`: BFS wave propagation rings and collision-free graph layout.
  - `frontend/src/components/visualizers/DPTableVisualizer.tsx`: Mathematical formula evaluation bar (`dp[i] = dp[i-1] + ...`).

### Phase V4 — Python Memory & Scope View (Python Tutor Style)
- **New Files:**
  - `frontend/src/lib/narrator/memory.ts`: Aliasing and reference narration.
  - `frontend/src/components/visualizers/memory/MemoryStage.tsx`: Dual-column Frames & Heap visualizer.
  - `frontend/src/components/visualizers/memory/ReferenceArrow.tsx`: Animated SVG curved pointers linking variables to heap cards.
- **Modified Files:**
  - `frontend/src/components/CodeEditor.tsx`: Add "Memory" tab to view frames and object references.

### Phase V5 — Storyboard Engine for OS, Concurrency & Networking
- **New Files:**
  - `frontend/src/components/visualizers/storyboard/StoryboardHost.tsx`: Data-driven storyboard engine.
  - `frontend/src/components/visualizers/storyboard/renderers/LaneRenderer.tsx`: Thread/Process CPU timeline.
  - `frontend/src/components/visualizers/storyboard/renderers/PacketRenderer.tsx`: Traveling network packet tokens.
  - `frontend/src/components/visualizers/storyboard/renderers/GanttRenderer.tsx`: CPU scheduling chart.
  - Curriculum Networking & OS storyboards (P0 content).
- **Modified Files:**
  - `ConcurrencyTimelineVisualizer.tsx`, `HTTPPacketLifecycleVisualizer.tsx`: Refactor to use StoryboardHost.

### Phase V6 — Concept Demos, Sound FX & Production Polish
- **New Files:**
  - `frontend/src/lib/audio.ts`: Web Audio API synthetic micro-ticks.
- **Modified Files:**
  - `backend/app/routers/questions.py`: Add `/api/questions/{slug}/demo-trace` endpoint.
  - `frontend/src/components/workspace/StageConcept.tsx`: Embed auto-looping demo traces.
  - `frontend/package.json`: Prune unused dependencies (`ogl`).

---

## 9. Performance Budget & Resource Allocations

| Metric | Target Budget | Enforcement Mechanism |
| :--- | :--- | :--- |
| **3D Box DOM Count** | $\le 72$ nodes ($24 \text{ boxes} \times 3 \text{ faces}$) | Arrays with $N > 24$ automatically fall back to 2D flat bars. |
| **Animation Frame Time** | $< 16.6\text{ms}$ ($60\text{fps}$) | CSS 3D uses GPU-composited `transform` and `opacity`. No layout thrashing. |
| **Max Trace Length** | $\le 1,500$ steps | Enforced by `backend/app/runner/harness.py` via `TraceLimit`. |
| **Array Element Cap** | $\le 200$ elements | Truncated by `Snapshotter` with `{"$more": count}`. |
| **Telemetry Computation** | $< 5\text{ms}$ on trace load | Single-pass $O(N)$ linear precomputation cached in memory. |
| **Mobile Horizontal Scroll** | $0\text{px}$ overflow | Top-level containers enforce `overflow-x: hidden` with SVG/canvas scaling. |

---

## 10. Critical Review & Risk Flags

1. **Risk: Backend AST Extraction Overhead**  
   *Assessment:* Running Python's `ast.parse()` on every execution line could introduce latency if executed inside `sys.settrace`.  
   *Mitigation:* `ast.parse()` will be executed **once** per submission at compile time, creating a static dictionary of `line -> metadata`. The runtime tracer simply performs an $O(1)$ dictionary lookup.

2. **Risk: Mobile 3D Perspective Distortions**  
   *Assessment:* On 390px screens, a 52-degree isometric tilt can cause outer elements to clip the edge of the viewport.  
   *Mitigation:* On screens $< 768\text{px}$, reduce the tilt angle (`rotateX(30deg) rotateZ(0deg)`) or seamlessly fall back to an enhanced 2D card stack.

3. **Risk: Web Audio Autoplay Policy**  
   *Assessment:* Browsers block Web Audio contexts until the user interacts with the page.  
   *Mitigation:* Sound FX will default to **OFF**, initializing the audio context only upon explicit user activation via the settings toggle.

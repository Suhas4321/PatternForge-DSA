# PatternForge design references

The design language is locked to this document. Read it before changing colours, surfaces or the
shared components in `src/components/ui.tsx` and `src/components/effects.tsx`.

## 1. Colour and surface architecture

**Palette system:** [tweakcn](https://tweakcn.com/). A hybrid of the `claude` palette (warm stone and
ivory, for reading surfaces) and `modern minimal` (pitch-carbon `#0B0C10`, for interactive stages).

**Contrast verification:** [Realtime Colors](https://www.realtimecolors.com/) and
[Radix Themes colour](https://www.radix-ui.com/themes/docs/theme/color).

### The three zones

Every surface belongs to exactly one zone. Never put zone-2 content directly on zone 3 or the reverse
without a frame.

| Zone | Used for | `studio-contrast` (default) | `carbon-dark` |
|---|---|---|---|
| 1. Page shell | `body` | Warm stone `#F3F2EC`, `#E4E2D8` dot texture | Pure carbon `#09090B` |
| 2. Reading cards | Current quest, mastery, Rust Radar, problem statement, concept, quizzes, results, hints, pitch, Grimoire | Ivory `#FFFFFF`, border `#E2E0D6`, shadow `0 4px 20px -2px rgba(20,20,19,0.06)`, text `#141413` / `#575653` | Zinc `#18181C`, border `#2E2E36`, text `#FAFAFA` / `#A1A1AA` |
| 3. Theater stages | Constellation map, world trail, visualizer canvas, Monaco editors | Pitch carbon `#0B0C10` in a `rounded-3xl` frame (`#1E2028`), dot pattern `rgba(255,255,255,0.08)` | Pitch black `#000000`, frame `#27272A`, faint inner glow |

Inside a stage, cards and nodes use elevated slate `#181B24` with border `#2E3446`, title `#F1F5F9`
and subtitle `#94A3B8`. Unexplored nodes are never faded to near-invisible.

Inline code and example boxes in zone 2 use recessed sand `#F7F6F2`, border `#E5E3DC`, text `#1E293B`
(studio mode).

### How it is implemented

- Colour tokens are CSS variables (`--color-panel`, `--color-chalk`, `--color-line`, ...) declared in
  `@theme` in `src/index.css`. Tailwind v4 utilities read them through `var()`, so redefining a token
  on a subtree re-themes everything inside it.
- `html[data-theme="studio-contrast" | "carbon-dark"]` sets the zone 1 and zone 2 tokens.
- The `.stage` class resets the tokens to their zone 3 values for its subtree, so a visualizer or
  constellation looks identical in both modes and always has bright accents.
- Accent tokens (`cyan`, `emerald`, `amber`, `crimson`, `sky`) are darker in studio-contrast zone 2
  (for AA contrast on ivory) and bright inside stages and in carbon-dark.
- Translucent overlays use `chalk/<opacity>` (the text colour), never `white/<opacity>`, so hover
  states and tracks stay visible on both light and dark surfaces.

## 2. Component patterns

Implemented natively in React 19, Tailwind v4 and `motion`. No extra component libraries.

| Pattern | References | Where |
|---|---|---|
| Floating pill navbar, theme switcher | [Aceternity floating dock](https://ui.aceternity.com/components/floating-dock), [Magic UI animated theme toggler](https://magicui.design/docs/components/animated-theme-toggler) | `App.tsx`, `ThemeToggle` |
| Hero bento cards, border beam, gauges, number ticker | [Bento grid](https://magicui.design/docs/components/bento-grid), [border beam](https://magicui.design/docs/components/border-beam), [animated circular progress bar](https://magicui.design/docs/components/animated-circular-progress-bar), [number ticker](https://magicui.design/docs/components/number-ticker) | `Dashboard.tsx` top zone |
| Recessed constellation stage, dot pattern, animated beams, magic card | [Dot pattern](https://magicui.design/docs/components/dot-pattern), [animated beam](https://magicui.design/docs/components/animated-beam), [magic card](https://magicui.design/docs/components/magic-card) | `Dashboard.tsx` map zone |
| Winding question trail, boss node | [Aceternity tracing beam](https://ui.aceternity.com/components/tracing-beam), [Magic UI shine border](https://magicui.design/docs/components/shine-border) | `WorldPage.tsx` |
| Stage completion celebration | [Magic UI confetti](https://magicui.design/docs/components/confetti) | `QuestionPage.tsx` via `VictoryModal` |

Shared building blocks live in `src/components/effects.tsx`: `BorderBeam`, `ShineBorder`,
`DotPattern`, `NumberTicker`, `MagicCard` and `Stage` (the zone 3 frame).

## 3. Rules

- Accent colour in a zone 2 card: use the token (`text-cyan`, `bg-emerald/10`), never a raw hex, so
  studio mode gets the dark AA variant.
- Raw hex is allowed only inside a `.stage` (visualizer SVGs, constellation beams).
- Primary actions are solid pills (indigo, or emerald for "complete" actions) with white text and a
  hover lift. Secondary actions are outlined.
- Glass blur is reserved for the floating navbar and the stage capsule. Reading cards are solid.
- Motion respects `prefers-reduced-motion`.

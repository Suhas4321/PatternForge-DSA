# PatternForge DSA — Master Transformation Plan (`PLAN.md`)

> **Document Role:** Living Architecture, Principal UI/UX Design System & Execution Roadmap  
> **Repository Root:** `/home/suhas/Desktop/DSA`  
> **Audit Baseline:** 193/193 YAML Lessons Validated (`scripts/validate_content.py`) · 30/30 Backend Pytest Passed · Frontend `tsc -b` Clean · `oxlint` Failing on Baseline (2 Rules-of-Hooks Errors, 47 Warnings)

---

## 1. Executive Health Scorecard

### 1.1 Automated Suite & Hygiene Telemetry
| Check / Subsystem | Command / Target | Baseline Result | Target Health |
| :--- | :--- | :--- | :---: |
| **Curriculum & Test Execution** | `backend/.venv/bin/python scripts/validate_content.py` | `193 checked, 0 failed, 0 without content yet` (116 DSA in Worlds 1–12 + 77 Systems/SQL/Python/AI in Worlds 13–38) | **98 / 100** |
| **Backend Pytest Suite** | `backend/.venv/bin/pytest backend/tests -q` | `30 passed` (Adding sandbox security, demo-trace, and subprocess isolation tests) | **96 / 100** |
| **TypeScript Typecheck** | `cd frontend && npx tsc -b --noEmit` | `0 errors` | **100 / 100** |
| **Frontend Linter (`oxlint`)** | `cd frontend && npm run lint` | Baseline: `2 errors` (conditional Hooks in `MountainTrail.tsx`), `47 warnings` -> Target: `0 errors, 0 warnings` | **100 / 100** |
| **UI/UX & Cognitive Ergonomics** | `frontend/src/` | Progressive disclosure, dynamic Chapter 5 pattern intelligence, Stage 1 live demo traces, Error Boundaries, Memory DAG | **96 / 100** |
| **Sandbox & Runner Security** | `backend/app/runner/` | AST security gate, restricted `SAFE_BUILTINS`, `RLIMIT_NPROC`, process-group cleanup, subprocess isolation for `practical_runner.py` | **95 / 100** |

---

### 1.2 Broken Elements, Bugs & Performance Bottlenecks Identified

#### A. Frontend Bugs & Render Thrashing
1. **React 19 Rules-of-Hooks Crash in `/home/suhas/Desktop/DSA/frontend/src/components/MountainTrail.tsx` (Lines 96, 146, 182)**
   - `MountainTrail` performs an early return `if (n === 0) return (...)` on line 96 **before** calling `useMemo` (line 146) and `useLayoutEffect` (line 182). Navigating between an empty/coming-soon world and a populated world violates React's hook-order invariant and causes `oxlint` to fail with 2 fatal errors.
2. **Hardcoded "Subarray Sum Equals K" Explanation Shown on ALL 193 Questions (`/home/suhas/Desktop/DSA/frontend/src/components/workspace/ChapterRightPanel.tsx:200-210`)**
   - In Chapter 5 (`activeChapter === 5`), the Context & Intelligence right rail renders a hardcoded block: *"Why Hash Map? We want `sum(i..j) = k`. Since `sum(i..j) = P[j] - P[i-1]`..."* regardless of which question is open.
3. **Missing React Error Boundaries (`/home/suhas/Desktop/DSA/frontend/src/main.tsx` & `/home/suhas/Desktop/DSA/frontend/src/components/visualizers/VisualizerHost.tsx`)**
   - Zero `ErrorBoundary` components exist. A malformed custom trace frame or WebGL context error crashes the entire React tree.
4. **Stage 1 Concept Visualizer Inert on All 116 DSA Questions (`/home/suhas/Desktop/DSA/frontend/src/components/workspace/StageConcept.tsx:783-814`)**
   - `StageConcept.tsx` only renders `VisualizerHost` if `content.concept_trace` is present. In Worlds 1–12, **0 of 116** questions have `concept_trace`, leaving Stage 1 without a live algorithm preview.
5. **Monaco Editor Missing SQL Tokenizer & Stubbed Memory Tab (`/home/suhas/Desktop/DSA/frontend/src/lib/monaco.ts:6-7`, `/home/suhas/Desktop/DSA/frontend/src/components/CodeEditor.tsx:224-252`)**
   - `monaco.ts` only registers `python` and `java` syntax definitions; SQL queries in Citadel III lack syntax highlighting.
   - `CodeEditor.tsx` Tab 3 (`activeTab === 'memory'`) is an unfinished stub (`"Phase V4 Engine"`) dumping raw `JSON.stringify(obj.fields, null, 2)`.
6. **Grimoire World Selector Hardcoded to 12 Worlds (`/home/suhas/Desktop/DSA/frontend/src/components/WorldCheatSheet.tsx:10-13, 84-93`)**
   - `WORLD_NAMES` only lists 12 worlds, breaking the selector when opened from Worlds 13–38.
7. **Tree Layout Jitter & Dead Dependencies (`/home/suhas/Desktop/DSA/frontend/src/components/visualizers/TreeRecursionVisualizer.tsx:58`, `/home/suhas/Desktop/DSA/frontend/package.json`)**
   - `DataTree` calls `layoutTrees([step])` instead of stabilizing node positions across `steps`, causing horizontal jitter during tree mutations (`invert-binary-tree`).
   - `gsap`, `@types/gsap`, and `ogl` are unused in `frontend/package.json`.

#### B. Backend & Sandbox Vulnerabilities
1. **In-Process `exec()` in `/home/suhas/Desktop/DSA/backend/app/runner/practical_runner.py:139-221`**
   - `run_practical()` executes user code inside the FastAPI worker process without subprocess isolation, timeout, or memory caps, and mutates `sys.stdout` directly.
2. **Unrestricted `__builtins__` & Missing `RLIMIT_NPROC` in `/home/suhas/Desktop/DSA/backend/app/runner/harness.py:622-623` & `python_runner.py:32-48`**
   - `make_namespace()` exposes full `__builtins__`, allowing `import os, sys, subprocess, socket` or `sys.settrace(None)`.
   - `python_runner.py` lacks `RLIMIT_NPROC` and process-group `os.killpg` cleanup on timeout.
3. **Synchronous Full-Table Backup Dump (`/home/suhas/Desktop/DSA/backend/app/services/backup_manager.py:53-86`)**
   - `auto_dump(session)` serializes every historical submission row synchronously on every `/run` request.


---

## 2. Design Tokens & Aesthetic Spec

Inspired by **Linear** (luminance-driven surface hierarchy, 1px hairline borders), **Apple macOS / iOS Liquid Glass** (multi-layer optical stack with top specular rim), and **Vercel / Raycast** (high-contrast typography and keyboard-first HUDs).

### 2.1 Cosmic Void & Surface Hierarchy Tokens (`frontend/src/index.css`)
| Token Name | Dark Mode (`Night Expedition`) | Light Mode (`Alpine Morning`) | Usage & Ergonomic Role |
| :--- | :--- | :--- | :--- |
| `--surface-0` (`bg-void`) | `#090D16` (Deep Cosmic Void) | `#F4F3EE` (Warm Architectural Stone) | Root page canvas layered with radial ambient nebula glow (`rgba(30, 27, 75, 0.35)` indigo + `rgba(14, 116, 144, 0.14)` cyan) |
| `--surface-1` (`bg-panel`) | `#0F1624` (Elevated Slate Card) | `#FFFFFF` (Crisp Pure Ivory) | Primary reading cards, problem statements, concept drawers, Grimoire sheets |
| `--surface-2` (`bg-panel-2` / `bg-ink`) | `#161F33` (Recessed Well / Input) | `#F8F7F3` (Recessed Sand Well) | Code wells, example input/output blocks, inactive pill tracks, table headers |
| `--surface-3` (`bg-panel-3`) | `#1E2942` (Interactive Hover / Active) | `#EDEBE4` (Warm Stone Hover) | Selected tabs, active list items, hover states, badge backgrounds |
| `--stage-surface` (`.stage`) | `#070A12` (Framed Pitch Carbon) | `#090D16` (Framed Pitch Carbon) | Always-dark theater frame for Constellation Map, Visualizer Stage, and Monaco Editor |

### 2.2 WCAG AA/AAA Text & Semantic Accent Tokens
| Token | Dark Hex (Contrast on `--surface-1`) | Light Hex (Contrast on `--surface-1`) | Role |
| :--- | :--- | :--- | :--- |
| `--text-1` (`text-chalk`) | `#F1F5F9` (**15.4 : 1** AAA) | `#111827` (**16.8 : 1** AAA) | Primary headings, problem body copy, active code |
| `--text-2` (`text-muted`) | `#94A3B8` (**6.8 : 1** AA+) | `#475569` (**7.2 : 1** AAA) | Secondary descriptions, explanations, inactive tabs |
| `--text-3` (`text-faint`) | `#64748B` (**4.5 : 1** AA) | `#64748B` (**4.8 : 1** AA) | Line numbers, keyboard shortcut hints, timestamps |
| `--accent-dsa` (`text-emerald`) | `#34D399` (Mint Nebula) | `#047857` (Deep Emerald) | Passed tests, solved nodes, optimal complexity badges |
| `--accent-cyan` (`text-cyan`) | `#38BDF8` (Stellar Cyan) | `#0369A1` (Ocean Cyan) | Active pointers, current trace line, primary focus ring |
| `--accent-indigo` (`text-indigo`) | `#818CF8` (Linear Indigo) | `#4F46E5` (Royal Indigo) | Primary interactive CTA pills, stage progression beams |
| `--accent-amber` (`text-amber`) | `#FBBF24` (Solar Gold) | `#B45309` (Warm Ochre) | Trigger word chips, dusty review warnings, XP rewards |
| `--accent-crimson` (`text-crimson`)| `#FB7185` (Nova Rose) | `#BE123C` (Crimson Alert) | Runtime errors, rusted camps, World Boss emblems |

### 2.3 Restrained Liquid Glass & Specular Border Formulas
```css
/* Tier-1 Floating HUD & Navigation Glass (.pf-liquid-glass) */
.pf-liquid-glass {
  background: rgba(15, 23, 42, 0.68);
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.14),
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.03),
    0 12px 32px -8px rgba(2, 6, 23, 0.65);
}
```

### 2.4 Typography Scale
- **UI & Long-Form Reading (`--font-sans`)**: `'IBM Plex Sans'` (400, 500, 600), line-height `1.65`, `65ch–68ch` reading measure.
- **Display & Telemetry Plates (`--font-plate`)**: `'IBM Plex Sans Condensed'` (600), tight tracking (`-0.02em`).
- **Code, Complexity & AST Traces (`--font-mono`)**: `'JetBrains Mono'` (400, 600), `tabular-nums`.

---

## 3. Component Refactor Blueprint

| File Path | Action | Architectural & UX Responsibility |
| :--- | :---: | :--- |
| `/home/suhas/Desktop/DSA/frontend/src/components/ErrorBoundary.tsx` | **CREATE** | Graceful panel-level and route-level React 19 Error Boundary with "Reset Visualizer / Reload Workspace" recovery action. |
| `/home/suhas/Desktop/DSA/frontend/src/components/visualizers/memory/MemoryStage.tsx` | **CREATE** | Interactive Python Tutor-style **Stack Frames -> Heap Objects SVG Inspector** replacing the raw JSON stub in `CodeEditor.tsx`. |
| `/home/suhas/Desktop/DSA/frontend/src/components/MountainTrail.tsx` | **REFACTOR** | Fix the 2 fatal `oxlint` conditional Hook errors (`useMemo`, `useLayoutEffect`) and stabilize layout rendering. |
| `/home/suhas/Desktop/DSA/frontend/src/components/workspace/ChapterRightPanel.tsx` | **REFACTOR** | Remove hardcoded "Subarray Sum Equals K" text in Chapter 5; dynamically bind `content.concept.key_insight`, `brute_force_complexity`, and interactive Trigger Word chips. |
| `/home/suhas/Desktop/DSA/frontend/src/components/workspace/StageConcept.tsx` | **REFACTOR** | Wire `/api/questions/{slug}/demo-trace` so all 116 DSA lessons render an interactive step-by-step pattern preview in Stage 1 Chapter 6. |
| `/home/suhas/Desktop/DSA/frontend/src/components/workspace/StageDrills.tsx` | **REFACTOR** | Enable optional mini-trace visualization (`visualize: true`) and inline test diffing on micro-drills. |
| `/home/suhas/Desktop/DSA/frontend/src/components/workspace/StageArena.tsx` | **REFACTOR** | Wrap `VisualizerHost` in `ErrorBoundary` and streamline layout controls. |
| `/home/suhas/Desktop/DSA/frontend/src/components/workspace/StagePitch.tsx` | **REFACTOR** | Add **60-Second Spoken Pitch Timer** and real-time **4-Point Rubric Validator** (Brute Force, Trigger, Invariant, Complexity). |
| `/home/suhas/Desktop/DSA/frontend/src/components/CodeEditor.tsx` & `src/lib/monaco.ts` | **REFACTOR** | Register SQL language syntax in Monaco and mount `MemoryStage` in the Memory tab. |
| `/home/suhas/Desktop/DSA/frontend/src/components/visualizers/TreeRecursionVisualizer.tsx` | **REFACTOR** | Stabilize tree node $(x, y)$ coordinates across the full trace (`layoutTrees(steps)`) and add native **`TrieNode`** rendering. |
| `/home/suhas/Desktop/DSA/frontend/src/components/WorldCheatSheet.tsx` | **REFACTOR** | Dynamic 38-world selector, World Boss Trophy unlock banner, and clean `@media print` A4 stylesheet. |
| `/home/suhas/Desktop/DSA/backend/app/runner/harness.py` & `python_runner.py` | **REFACTOR** | Static AST security gate, restricted `SAFE_BUILTINS`, `RLIMIT_NOFILE`, and process-group `os.killpg` cleanup on timeout. |
| `/home/suhas/Desktop/DSA/backend/app/runner/practical_runner.py` & `sql_runner.py` | **REFACTOR** | Subprocess isolation with timeout/memory limits for `practical_runner.py` and `sqlite3.set_authorizer` for `sql_runner.py`. |

---

## 4. 4-Stage Learning UX Redesign

1. **Stage 1 — Decode Story & Pattern Trigger (`StageConcept.tsx` + `ChapterRightPanel.tsx`)**:
   - **Progressive Disclosure**: Chapter stepper guides the learner through OA Story vs. Clean Statement $\rightarrow$ Trigger Word Hunter $\rightarrow$ Constraint Hardware Calculator $\rightarrow$ Pattern Quiz $\rightarrow$ Interactive Mechanism Demo (`demo-trace`).
   - **Dynamic Context Rail**: Right panel adapts to the active chapter and displays the exact pattern deduction logic for the current problem.
2. **Stage 2 — Atomic Micro-Drills (`StageDrills.tsx`)**:
   - **3 Runnable Building Blocks (`setup`, `core`, `edge`)**: Each drill isolates a 4–8 line sub-skill with instant test feedback and optional trace inspection before unlocking the full Arena.
3. **Stage 3 — Visualizer Arena (`StageArena.tsx` + `VisualizerHost.tsx` + `CodeEditor.tsx`)**:
   - **5-Way Synchronized Feedback**: Monaco active line highlight + inline variable hint bar, 3D/SVG spatial stage, semantic narrator (`WHAT` + `WHY`), complexity/comparison counters, and scrubber dock with keyboard transport (`Space`, `←`, `→`, `[`, `]`).
   - **Python Tutor Memory DAG (`MemoryStage.tsx`)**: Interactive stack-frame-to-heap object cards with reference badges.
4. **Stage 4 — Interview Pitch Studio (`StagePitch.tsx`)**:
   - **60-Second Spoken Rehearsal Timer** + **4-Point Rubric Checker** verifying that the learner's pitch covers Brute Force, Trigger Signal, Core Invariant, and Time/Space Complexity before locking in their spaced-repetition interval.

---

## 5. Gamification & User Story Architecture

1. **The Constellation Progression (`Dashboard.tsx` & `MountainTrail.tsx`)**:
   - Worlds map from **Base Camp (900m)** to **Summit (5,000m)** with 4 visual states (`fog`, `open`, `active`, `mastered`).
   - **World Boss**: The final trial of each world features a crimson/gold `ShineBorder`; defeating it triggers the Boss `VictoryModal` and unlocks the world's Grimoire Trophy.
2. **Spaced Repetition & Interview Readiness Score (`IRS 0–100`)**:
   - Weighted mastery across Citadels scaled by confidence and penalized by oxidation (`dusty` at 5d, `rusting` at 10d, `rusted` at 21d).
   - Surfaced directly in `TopBarHUD.tsx` and `/stats` (`StatsPage.tsx`).
3. **The Grimoire Trophy (`WorldCheatSheet.tsx`)**:
   - Compiles the learner's own 4-line pitches, trigger keywords, and passing code into a printable A4 revision sheet per world.

---

## 6. Execution Checklist (Phase 1 to Phase 5)

### Phase 1: Critical Bug Fixes, Linter Zero & Sandbox Security
- [x] **1.1** Write `/home/suhas/Desktop/DSA/PLAN.md` to the repository root.
- [x] **1.2** Fix the 2 fatal React Rules-of-Hooks errors in `/home/suhas/Desktop/DSA/frontend/src/components/MountainTrail.tsx` and resolve `oxlint` warnings.
- [x] **1.3** Harden `/home/suhas/Desktop/DSA/backend/app/runner/harness.py` and `python_runner.py` with AST security validation, `SAFE_BUILTINS`, `RLIMIT_NOFILE`, and `os.killpg` timeout cleanup.
- [x] **1.4** Isolate `/home/suhas/Desktop/DSA/backend/app/runner/practical_runner.py` in a subprocess and add `sqlite3.set_authorizer` in `sql_runner.py`.
- [x] **1.5** Optimize `/home/suhas/Desktop/DSA/backend/app/services/backup_manager.py` and `main.py` (portable SQLAlchemy column inspection + capped submission history in backups).

### Phase 2: Design System Tokens, Error Boundaries & Monaco/Memory Upgrade
- [x] **2.1** Create `/home/suhas/Desktop/DSA/frontend/src/components/ErrorBoundary.tsx` and wrap route outlets and `VisualizerHost`.
- [x] **2.2** Refine cosmic void tokens (`#090D16` / `#0F1624`), `.pf-liquid-glass`, and `@media print` rules in `/home/suhas/Desktop/DSA/frontend/src/index.css`.
- [x] **2.3** Register SQL language highlighting in `/home/suhas/Desktop/DSA/frontend/src/lib/monaco.ts` and prune dead packages (`gsap`, `@types/gsap`, `ogl`).
- [x] **2.4** Build `/home/suhas/Desktop/DSA/frontend/src/components/visualizers/memory/MemoryStage.tsx` and wire it into `CodeEditor.tsx`'s `"Memory"` tab.

### Phase 3: 4-Stage Learning Flow & Progressive Disclosure Overhaul
- [x] **3.1** Fix `/home/suhas/Desktop/DSA/frontend/src/components/workspace/ChapterRightPanel.tsx` so Chapter 5 dynamically renders the current question's `key_insight`, `trigger_keywords`, and complexity deduction.
- [x] **3.2** Add `/api/questions/{slug}/demo-trace` in `/home/suhas/Desktop/DSA/backend/app/routers/questions.py` and wire `api.demoTrace` in `frontend/src/api/client.ts`.
- [x] **3.3** Upgrade `/home/suhas/Desktop/DSA/frontend/src/components/workspace/StageDrills.tsx` and `StageArena.tsx` with ErrorBoundary protection and SQL/Python language support.
- [x] **3.4** Verify `/home/suhas/Desktop/DSA/frontend/src/components/workspace/StagePitch.tsx` 60-second verbal drill and confidence rating flow.

### Phase 4: Visualizer Archetype Upgrades & Pattern Finder Enrichment
- [x] **4.1** Stabilize tree node layout across full traces in `/home/suhas/Desktop/DSA/frontend/src/components/visualizers/TreeRecursionVisualizer.tsx` (`layoutTrees(steps)`).
- [x] **4.2** Expand `/home/suhas/Desktop/DSA/frontend/src/lib/patternFinder.ts` with Trie and Monotonic Deque decision paths.

### Phase 5: Gamification Loop, Grimoire Trophy & End-to-End Verification
- [x] **5.1** Upgrade `WorldCheatSheet.tsx` to support all 38 worlds dynamically with solved/total progress indicators.
- [x] **5.2** Run full verification: `scripts/validate_content.py`, `pytest backend/tests`, `npx tsc -b --noEmit`, `npm run lint`, and `npm run build`.

---

## 7. Immediate First Step

1. **`/home/suhas/Desktop/DSA/frontend/src/components/MountainTrail.tsx`** — Fix the 2 fatal React Rules-of-Hooks errors (`useMemo` and `useLayoutEffect` called after conditional return).
2. **`/home/suhas/Desktop/DSA/frontend/src/components/workspace/ChapterRightPanel.tsx` & `/home/suhas/Desktop/DSA/frontend/src/lib/monaco.ts`** — Replace hardcoded "Subarray Sum Equals K" text in Chapter 5 with dynamic per-question pattern deduction, and register SQL syntax highlighting in Monaco.
3. **`/home/suhas/Desktop/DSA/backend/app/runner/harness.py` & `/home/suhas/Desktop/DSA/backend/app/runner/practical_runner.py`** — Enforce static AST security validation + `SAFE_BUILTINS`, add `RLIMIT_NOFILE` + process-group cleanup, and isolate `practical_runner.py` in a subprocess.



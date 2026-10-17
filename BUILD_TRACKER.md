# PatternForge DSA — Build Tracker

Spec: [docs/SPEC.md](docs/SPEC.md) · Curriculum index: [content/curriculum.json](content/curriculum.json) ·
Lesson authoring: [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)

Rules: one milestone at a time · every milestone ends runnable and validated · no `TODO` placeholders ·
content is validated by `scripts/validate_content.py` (reference solutions must pass their own tests).

## Milestone 1 — Foundation
- [x] Spec locked (`docs/SPEC.md`), 115-question index with corrections (`content/curriculum.json`)
- [x] Backend skeleton: FastAPI app, config, SQLite/Supabase switch via `DATABASE_URL`
- [x] DB models: worlds, questions, progress, pitch notes, drafts, submissions
- [x] Content loader: upsert curriculum + per-question YAML content files into DB on startup
- [x] Backup manager: auto-dump user data to `backend/backups/user_data.json`, dump/restore API, auto-restore on a fresh DB
- [x] API: worlds (with progress + rust), question detail, progress/stage updates, review queue

## Milestone 2 — Code runner & tracer
- [x] Subprocess harness with per-test timeout + memory limits, LeetCode-style `class Solution`
- [x] Arg/return types: primitives, `ListNode`, `ListNode[]`, `ListNodeCycle`, `RandomListNode`, `TreeNode`,
      `TreeNodeRef`/`TreeNodeVal`, `GraphNode`, design classes (op sequences), deep-copy checks
- [x] Compare modes: exact, unordered, unordered-nested, float, in-place
- [x] `sys.settrace` tracer → JSON steps (line, all frames' locals, heap of node objects, call params, returns)
- [x] `scripts/validate_content.py`
- [x] Backend tests (20)

## Milestone 3 — Frontend core
- [x] Vite + React + TS + Tailwind v4 + Motion + Monaco (bundled locally, lazy-loaded)
- [x] Dashboard, world pages, LeetCode bridge (logo + number + link)
- [x] 4-stage workspace (Concept → Drills → Arena → Pitch) with stage gating
- [x] Trace player (play/pause/prev/next/speed, keyboard), editor line highlight synced to the trace
- [x] Backup dump/restore menu, Playground (trace any code with any visualizer)

## Milestones 4–10 — Curriculum & visualizers
- [x] All 115 lessons written and validated (12 worlds), unique twist problem per lesson
- [x] `ArrayPointerVisualizer` (worlds 1, 2, 3, 5, 11)
- [x] `StackQueueVisualizer` (world 4)
- [x] `LinkedListVisualizer` (world 6): stable layout, next/prev/random arrows, `layout: current` for LRU
- [x] `TreeRecursionVisualizer` (worlds 7, 8, 9): per-step tree layout, heaps as trees, recursion call tree
- [x] `GraphGridVisualizer` (world 10, Word Search): grids, node-link graphs, weighted edges, clone clusters
- [x] `DPTableVisualizer` (world 12): 1D/2D tables, write/read cells derived from the current line
- [x] Shared visualizer parts: array rows, map/variable panels, one queue conveyor

## Milestone 11 — Extras
- [x] Pattern Grimoire: per-world printable revision sheet (triggers, complexity cheat-codes, your pitches + code)
- [x] Optional AI Socratic coach (`/api/questions/{slug}/ask-coach`): any OpenAI-compatible endpoint
      (Snowflake Cortex) or Gemini; falls back to built-in hints and model scripts with no key
- [ ] Java runner (`javac`/`java`): waiting for a JDK on this machine

## Milestone 12 — Obsidian Liquid Glass journey
- [x] Design system: void canvas + dot grid + aurora, solid reading surfaces, liquid-glass utility, glass buttons, keycaps
- [x] Journey dashboard: command HUD (current quest, mastery + rank, always-on Rust Radar), 12-world constellation
- [x] World trail: winding stepping stones, active trial card with stage dots, World Boss node
- [x] Ascension capsule (fluid active pill, unlock pulse, "Advance to Stage" button, Alt+1–4)
- [x] Victory modal with confetti ("Pattern Forged!", gold World Boss variant)
- [x] Responsive down to mobile, reduced motion respected

## Milestone 13 — 3-zone contrast system
- [x] `frontend/DESIGN_REFERENCES.md`: palette, zones, component references, rules
- [x] Token system: stone page / ivory cards / pitch-carbon `.stage`, accent tokens tuned per zone
- [x] Theme polarity toggle (`studio-contrast` default, `carbon-dark`), persisted, circular reveal, no flash
- [x] Dashboard: 3 bento cards (border beam, number ticker, circular progress) + carbon constellation stage
- [x] World page: carbon trail with tracing-beam spine, shine-border World Boss
- [x] Question page and Playground: ivory reading cards, carbon visualizer and editor stages, solid stage pill

## Milestone 14 — Research-driven product upgrades
- [x] Practice card: day streak with a weekly streak freeze, daily goal (1 solve or 3 drills), 20-week heatmap (`/api/activity`)
- [x] Pattern Finder (`/finder`): decision tree from input shape → ask → constraint to one of 20 patterns, with template and lessons
- [x] Command palette (Ctrl+K or `/`): search 115 questions by title, #number or pattern, worlds and actions
- [x] Loading skeletons, 404 page, Pattern Finder link beside the Stage 1 pattern quiz

---

# PatternForge 6-Citadel Engineering Expansion Roadmap

## Phase A: DESIGN_AND_CURRICULUM_PLAN.md + 3-Zone High-Contrast UI Overhaul
- [x] Create `DESIGN_AND_CURRICULUM_PLAN.md` with all reference links and architecture specs
- [x] Overhaul `frontend/src/index.css`, `App.tsx`, `Dashboard.tsx`, `WorldPage.tsx`, `QuestionPage.tsx`, and `Playground.tsx` to implement the 3-Zone Contrast System (`studio-contrast` Warm Stone `#F3F2EC` + Crisp Ivory `#FFFFFF` cards + Framed Pitch-Carbon `#0B0C10` Constellation/Visualizer stages, plus `carbon-dark` toggle)
- [x] Brighten all unexplored Constellation nodes and SVG connector beams, split Dashboard hero into 3 Bento cards, and add the 6-Citadel Switcher in `App.tsx`

## Phase B: Multi-Citadel Backend Schema + sql_sqlite & python_practical Runners
- [x] Add `citadel_id`, `brick_layer`, and `runner_type` (`python_trace`, `python_practical`, `sql_sqlite`) support to backend models, `curriculum.json`, and `POST /api/questions/{slug}/run`
- [x] Implement the in-memory `sqlite3` runner (with intermediate query step capture) and practical Python runner (`pandas`, XML, JSON, concurrency)
- [x] Extend `scripts/validate_content.py` so every SQL lesson and practical Python lesson is automatically tested and validated

## Phase C: The 5 New Interactive System Visualizers
- [x] Build and wire up `SQLPipelineVisualizer.tsx`, `DataFramePipelineVisualizer.tsx`, `ConcurrencyTimelineVisualizer.tsx`, `HTTPPacketLifecycleVisualizer.tsx`, and `SystemBlueprintVisualizer.tsx` inside `frontend/src/components/visualizers/` and `VisualizerHost.tsx`
- [x] Ensure Stage 1 (`StageConcept.tsx`) renders the interactive `concept_trace` visualizer directly inside the lesson so the user learns every concept visually before coding

## Phase D: Curriculum Hydration — Citadel II (Python, OOP, Design Patterns, Files & Pandas — Worlds 13–16)
- [x] Create and validate all YAML lessons for Worlds 13, 14, 15, and 16 with rich animations, 3 micro-drills per brick, practical coding tests, and interview pitch scripts

## Phase E: Curriculum Hydration — Citadel III (SQL & DBMS — Worlds 17–18)
- [x] Create and validate all YAML lessons for World 17 (Storage, B-Tree Indexes, Composite Left-Prefix, Triggers, Normalization, ACID, SQLAlchemy N+1) and World 18 (10 Live SQL Query Arena bricks including 2nd Highest Salary, Department Top N with `DENSE_RANK`, Joins, Self-Joins, Duplicates, CTEs, `LAG/LEAD`, Pivots, and Streaks)

## Phase F: Curriculum Hydration — Citadels IV, V & VI (OS/Concurrency, FastAPI/HTTP/Auth, GenAI & /resume-grill — Worlds 19–21)
- [x] Create and validate all YAML lessons for Worlds 19, 20, and 21 (12 new lessons created; all 154 curriculum lessons validated)
- [x] Build the dedicated `/resume-grill` interactive page defending every bullet on Suhas's resume (8 deep-dive technical cards + live verification sandboxes)
- [x] Run `scripts/validate_content.py` across the entire curriculum (154/154 passed), run backend test suite (26/26 passed), and frontend build check (clean build in 3.08s)

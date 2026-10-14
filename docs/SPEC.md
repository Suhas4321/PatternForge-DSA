# PatternForge DSA — Product Spec

Personal, anti-rote-memorization DSA trainer for Indian / Bengaluru SDE-1 interviews
(Online Assessments + face-to-face rounds). Built for one user, runs locally on Ubuntu.

**Core problem it solves:** memorizing solutions and blanking when the story wrapper changes.
The app teaches the *trigger signal* of a pattern and the *micro-skills* inside a solution
before asking for the full solution, then makes you explain it like an interview.

---

## 1. Learning flow (every question)

### Stage 1 — Concept & Pattern Trigger ("Why & Where")
- What problem the pattern solves, why brute force fails, real-world backend use
  (LRU cache in Redis, B-tree indexes, rate limiters, priority task queues…).
- Problem view toggle: **Indian OA Story Mode** (Bengaluru-style corporate story wrapper)
  vs **Clean LeetCode Core Mode** (bare statement, trigger keywords highlighted).
- **LeetCode bridge:** LeetCode logo, `#number`, difficulty badge, direct link.
- **Constraint Cheat-Code widget:** user reads N and picks the max allowed complexity.
  - N ≤ 20 → backtracking / bitmask, N ≤ 10³ → O(N²), N ≥ 10⁵ → O(N) / O(N log N).
- **Pattern quiz:** pick which pattern applies and why (gate before the editor unlocks).

### Stage 2 — Atomic Micro-Drills ("Bits & Parts")
- 3 drills, 4–8 lines each, each is a tiny runnable function with its own tests:
  1. Setup state / data-structure init & traversal loop
  2. Core condition / pointer movement / state transition
  3. Edge cases & result extraction
- Passing all 3 unlocks Stage 3. (Easy questions may skip straight to Stage 3.)

### Stage 3 — Full Arena + Live Visualizer + Socratic Coach
- Split screen: visualizer canvas (left), Monaco editor (right). Python mandatory, Java later.
- **Run & Visualize:** user's own code runs against tests; `sys.settrace` records variable
  states per line; visualizer plays them back (Play / Pause / Prev / Next / speed).
- **Socratic hints drawer:** 3 progressive hints, never spoilers
  (1: pattern intuition, 2: state transition, 3: pseudocode blueprint).

### Stage 4 — Interview Pitch Studio & Spaced Repetition
- Unlocks after passing tests (or "Study Optimal Solution").
- 4-line pitch form: brute force & why slow · trigger spotted · optimal idea in plain
  English · exact time & space complexity.
- Model senior-engineer spoken script shown side by side (how to say it out loud).
- **Twist problem** suggestion (variation, no scaffolding).
- Confidence rating: 1 = Struggled → review in 3 days, 2 = Needed hints → 7 days,
  3 = Crushed it → 21 days.

### Cross-cutting features
- **Rust Detector:** each world turns green → yellow → red at 5 / 10 / 21 days since last
  practice, unless a blind re-solve is passed.
- **Pattern cheat-sheet auto-builder:** per world, compile the user's pitches + key drills
  into a one-page 10-minute revision sheet.
- **Backups:** curriculum lives in git as YAML files; user data (progress, pitches, drafts,
  submissions) auto-dumped to `backend/backups/user_data.json`, with dump/restore buttons.

---

## 2. Architecture

| Layer | Choice |
|---|---|
| Backend | Python 3.11+ (dev machine: 3.14), FastAPI, SQLAlchemy 2, Pydantic v2 |
| DB | SQLite by default (`backend/patternforge.db`); Supabase Postgres via `DATABASE_URL` in `.env` |
| Runner | Python subprocess + `sys.settrace` tracer, timeout + rlimits. No Docker. Java (`javac`/`java`) later |
| Frontend | React + TypeScript + Vite + Tailwind + Motion (Framer Motion) + Lucide + Monaco (bundled locally, works offline) |
| AI coach | Optional. Static hints/scripts ship in content. Any OpenAI-compatible endpoint (Gemini, Snowflake Cortex, …) can be plugged in via `.env` |

**Content is data, engine is code.** Each question is one YAML file under
`content/questions/<NN-world>/<slug>.yaml` (YAML so code blocks stay readable). `content/curriculum.json` is the master index of
all 115 questions (metadata only); deep content is added world by world. The backend upserts
content files into the DB on startup. `scripts/validate_content.py` runs every reference
solution and drill solution against its tests, so content is guaranteed correct.

**6 reusable visualizers** (render from trace JSON + a per-question `viz` config, never
per-question animation code):
1. `ArrayPointerVisualizer` — array boxes, named pointers, `[L..R]` window, hash map / set panel
2. `StackQueueVisualizer` — vertical stack / monotonic stack, horizontal queue
3. `LinkedListVisualizer` — nodes with `next`/`prev` arrows, slow/fast, re-wiring
4. `TreeRecursionVisualizer` — binary trees, heaps, recursion call trees
5. `GraphGridVisualizer` — 2D grids (flood fill) and node-edge graphs
6. `DPTableVisualizer` — 1D/2D dp tables, dependency cells highlighted

---

## 3. Curriculum — 115 questions, 12 worlds (Easy → Medium → Hard inside each world)

Source of truth: `content/curriculum.json`. Corrections vs the original Gemini list:
- `#23 Merge k Sorted Lists` was in both World 6 and World 8 → kept in Heaps; World 6 gets
  `#25 Reverse Nodes in k-Group`.
- `#253 Meeting Rooms II` is LeetCode Premium → replaced by `#452 Minimum Number of Arrows to
  Burst Balloons` (same interval-sweep pattern; "Minimum Platforms" is covered as its twist).
- `#72 Edit Distance` is Medium on LeetCode, not Hard.
- Every world re-sorted strictly by difficulty.

| # | World | Qs | Visualizer(s) |
|---|---|---|---|
| 1 | Arrays & Hashing | 10 | ArrayPointer |
| 2 | Two Pointers | 8 | ArrayPointer |
| 3 | Sliding Window | 8 | ArrayPointer |
| 4 | Stack & Monotonic Stack | 8 | StackQueue |
| 5 | Binary Search & BS on Answer | 10 | ArrayPointer |
| 6 | Linked Lists | 9 | LinkedList |
| 7 | Trees — BFS & DFS | 12 | TreeRecursion |
| 8 | Heaps / Priority Queue | 7 | TreeRecursion |
| 9 | Backtracking & Recursion | 8 | TreeRecursion, GraphGrid |
| 10 | Graphs — BFS, DFS, Topo, Shortest Path | 12 | GraphGrid |
| 11 | Greedy & Intervals | 9 | ArrayPointer |
| 12 | 1D & 2D DP | 14 | DPTable |

---

## 4. Build milestones

See `BUILD_TRACKER.md`. Strategy: one complete vertical slice first (World 1 fully playable
end to end with the ArrayPointer visualizer), then add visualizers and worlds in batches.
Rule: no `TODO` placeholders — every milestone ends runnable and validated.

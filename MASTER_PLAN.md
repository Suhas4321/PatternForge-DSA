# ApexCaliber / PatternForge DSA — Architectural & UI Master Plan (`MASTER_PLAN.md`)

> **Branch:** `feat/shadcn-system-design-overhaul`  
> **Core Mission:** Eliminate "AI curved-rectangle box slop", introduce a 3-Step Pedagogical Question Flow (*1. Learn DS & Pattern* -> *2. Code in Fullscreen Terminal* -> *3. Structured Interview Answer Guide*), and launch Citadel VII (Interactive System Design: OOP/SOLID -> LLD -> HLD).

---

## 1. Shortlisted UI Component & Live Preview Report

| Current Project Section & File Path | Current UI Problem ("AI Box Slop") | Shortlisted Replacement Component / Block | Exact Live Preview URL (Clickable) | Exact CLI / Registry Install Command | Why It Fits Our Architecture |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Top Navbar & Search** (`frontend/src/App.tsx`, `CommandPalette.tsx`) | Floating pills / basic search input | Shadcn `NavigationMenu` + `Command` (`cmdk`) Modal | https://ui.shadcn.com/docs/components/command & https://ui.shadcn.com/docs/components/navigation-menu | `npx shadcn@latest add command navigation-menu badge` | Flush edge-to-edge `h-12` bar with instant `Ctrl+K` modal search |
| **Top 4 HUD Stat Cards** (`frontend/src/pages/Dashboard.tsx`) | 4 separate floating curved rectangles with empty dark space | Connected 4-Column Architectural Hairline Strip + Shadcn `Chart` Sparkline & `Progress` | https://ui.shadcn.com/docs/components/chart & https://ui.shadcn.com/blocks | `npx shadcn@latest add chart progress tooltip` | Eliminates floating box clutter using `divide-x divide-white/[0.08]` + memory decay sparkline |
| **7 Engineering Citadels Row** (`frontend/src/pages/Dashboard.tsx`) | Text-only dark rectangles that all look identical | Aceternity `Bento Grid` Pattern (Top 56px SVG Graphic Header + Clean Text Footer) | https://ui.aceternity.com/components/bento-grid | `npx shadcn@latest add https://ui.aceternity.com/registry/bento-grid.json` | Adds custom SVG micro-illustrations on top of each track card (`I DSA` to `VII System Design`) |
| **Citadel Boss Card & Active World Node** (`Dashboard.tsx`, `MountainTrail.tsx`) | Plain bordered rectangle; starts at locked `5,000m SUMMIT` | Magic UI `Border Beam` + `Magic Card` Spotlight + Shadcn `HoverCard` + Auto-Center on `World 1` | https://magicui.design/docs/components/border-beam & https://ui.shadcn.com/docs/components/hover-card | `npx shadcn@latest add hover-card` + `npx shadcn@latest add https://magicui.design/r/border-beam` | Gives World Boss an animated glowing beam and centers viewport on active camp (`World 1`) |
| **Activity Heatmap & Collapsible Drawers** (`PracticeCard.tsx`, `WorldCheatSheet.tsx`) | Full-width rounded rectangle bar | Shadcn `Collapsible` + `Sheet` + `Tabs` | https://ui.shadcn.com/docs/components/collapsible & https://ui.shadcn.com/docs/components/sheet | `npx shadcn@latest add collapsible sheet tabs` | Smooth progressive disclosure without cluttering the viewport |
| **Split-Pane Coding Terminal** (`QuestionPage.tsx`, `ResizableSplit.tsx`) | Stuffed `StagePitch` (2-column grid) into a narrow 45% left panel | Shadcn `Resizable` Split-Pane Layout + Dedicated 3-Step Full-Width Flow | https://ui.shadcn.com/docs/components/resizable | `npx shadcn@latest add resizable` | Keeps the Coding Terminal focused on `Problem + Visualizer + Editor + Console`, while `Learn DS` and `Interview Guide` get full-screen space |

---

## 2. Anti-"AI Curved Rectangle" Design System Rules

1. **No Box-in-a-Box Slop**: Never place a `rounded-2xl border` card inside another bordered box.
2. **Use Full-Bleed Hairline Grids (`1px`)**: Separate dashboard metrics and sections using continuous edge-to-edge `1px solid rgba(255,255,255,0.08)` hairlines (`divide-x`, `divide-y`, `border-b`) instead of floating rounded islands.
3. **Sharpen Radii**: Use `rounded-md` (`6px`) for buttons/badges/inputs and `rounded-lg` (`8px`) for elevated cards.
4. **Skill Tree Viewport Fix**: Auto-center or render the Constellation skill tree starting from the user's active camp (`World 1 — Base Camp · 900m`) on initial load instead of starting at the locked `5,000m SUMMIT`.

---

## 3. 3-Step Question Pedagogical Flow (`/q/:slug`)

1. **Step 1 — `1. Learn DS & Pattern` (Full-Screen Primer Before Coding)**:
   - Explains **which Data Structure** this problem uses (`Array`, `Hash Map / Python dict`, `Set`, `Two Pointers`, `Sliding Window`, `Stack`, `Binary Search`, `Linked List`, `Tree`, `Heap`, `Graph`, `DP Table`), how it works in memory, and its exact Python syntax.
   - Explains **How to Know Time & Space Complexity from Constraints** ($N \le 10^5 \implies O(N)$ or $O(N \log N)$).
2. **Step 2 — `2. Code in Terminal` (100vh LeetCode Draggable Split-Pane IDE)**:
   - Left pane: `Description` | `Visualizer` | `Hints`.
   - Right pane: Top = Full-height **Monaco Editor** (`Code` | `Variables` | `Memory`); Bottom = Collapsible `Testcase` | `Test Result` console.
3. **Step 3 — `3. Interview Answer Guide` (Full-Screen Structured Playbook — Zero Empty Blanks!)**:
   - **No empty fill-in-the-blank textboxes.**
   - **Section 1: Clarifying Questions to Ask First** (Exact 3 questions to ask the interviewer before coding).
   - **Section 2: Step-by-Step Spoken Answer** (*1. Baseline Brute Force*, *2. Trigger Signal & Data Structure Choice*, *3. Optimal Walkthrough*).
   - **Section 3: How to Deduce Time & Space Complexity** (Step-by-step derivation of why time is $O(\dots)$ and space is $O(\dots)$).
   - **Section 4: Optimal Reference Code + Follow-Up Twist + 1-Click Confidence Rating (`3d` / `7d` / `21d`)**.

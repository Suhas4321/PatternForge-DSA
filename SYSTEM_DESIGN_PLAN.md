# System Design, LLD, OOP & SOLID Master Plan (`SYSTEM_DESIGN_PLAN.md`)

> **Document Role:** Living Blueprint for the Study & Articulation Studio + Bottom-to-Top System Design Track  
> **Repository Root:** `/home/suhas/Desktop/DSA`

---

## 1. Current Codebase Audit & Root-Cause Resolutions

| Subsystem / File | Audit Finding | Resolution Implemented |
| :--- | :--- | :--- |
| **`App.tsx` & `MoreMenu.tsx`** | `<GlassSurface>` applied `overflow-hidden` to `<header>`, clipping the `...` dropdown menu. | Added `!overflow-visible` to `<header>` and converted `MoreMenu` to a high-contrast `z-[100]` surface. |
| **`userStats.ts` & `TopBarHUD.tsx`** | Counted duplicate test runs in `/api/activity` as separate solves (`Lvl 13` for 2 solved problems) and showed cryptic `IRS 0`. | Deduplicated solved slugs (`serverSolved` / `Set`), fixed `Lvl` calculation, and replaced `IRS 0` with `Solved X/193`. |
| **`effects.tsx` (`ThemeToggle`)** | 3-way `Auto -> Light -> Dark` cycle caused a no-op click when OS theme matched current theme. | Simplified to a 1-click 2-way toggle (`☀️ Light` $\leftrightarrow$ `🌙 Dark`). |
| **`index.css` & `ResumeGrill.tsx`** | Light mode set `--color-chalk` to black (`#1E1B2E`) even inside dark `<Sky />` banners and `.stage` containers. | Scoped `.stage, [data-zone='night']` in `index.css` to always enforce crisp white/silver text (`#F8FAFC` / `#CBD5E1`) on dark surfaces. |
| **`ResumeGrill.tsx` & `StagePitch.tsx`** | Forced users into an empty text box before showing the Senior Spoken Script. | Switched default to **Study Mode** (4-Card Senior Exemplar + 60s Pacing Teleprompter `0–15s`, `15–40s`, `40–60s`) with optional **Delivery Practice Mode**. |

---

## 2. Bottom-to-Top System Design Pyramid (Inside Engineering Citadels)

1. **Level 0 & 1 — OOP Bedrock & Practical SOLID Playbook**:
   - **Composition over Inheritance**: Why LEGO-brick composition beats fragile class hierarchies.
   - **S · O · L · I · D in Production**: Real company code-review triggers, analogies, **When to Use**, and **When NOT to Use (YAGNI / Anti-Overengineering)**.
2. **Level 2 — Low-Level Design (LLD / Machine Coding — 5 Problems)**:
   - `lld-01-parking-lot`: Multi-Floor Parking Lot & EV Strategy Pricing
   - `lld-02-splitwise`: Expense Sharing & Min-Max Heap Debt Simplification
   - `lld-03-bookmyshow`: Seat Locking with State Pattern & Optimistic Concurrency (`version` / Redis TTL)
   - `lld-04-elevator`: Smart Elevator State Machine & SCAN Scheduling
   - `lld-05-notification-router`: SOLID Notification Router (ISP + Decorator + DIP)
3. **Level 3 — High-Level Distributed System Design (HLD — 10 Problems Across 3 Tiers)**:
   - **Tier 1 (Core Fundamentals)**:
     1. `sys-01-code-execution`: **Remote Code Execution Sandbox (LeetCode / Judge0 — 1,000+ Concurrent Runs)** *(Flagship)*
     2. `sys-02-rate-limiter`: Distributed Rate Limiter (Token Bucket / Sliding Window / Redis Atomic Lua)
     3. `sys-03-url-shortener`: Scalable URL Shortener + Real-Time Click Analytics (Base62 / Cache-Aside / Kafka)
   - **Tier 2 (Real-Time & Data Flow)**:
     4. `sys-04-collab-doc`: Real-Time Collaborative Document / Whiteboard (WebSockets / OT vs. CRDT)
     5. `sys-05-notification-engine`: High-Throughput Notification Service (Priority Queues `P0 OTP` vs `P2 Promo` / Idempotency)
     6. `sys-06-distributed-cache`: Distributed In-Memory Cache (Consistent Hashing Ring / Single-Flight)
     7. `sys-07-realtime-chat`: Global Real-Time Chat & Presence System (WhatsApp / Slack / Heartbeat Leases)
   - **Tier 3 (Large-Scale Distributed & Transactional)**:
     8. `sys-08-video-streaming`: Video Ingestion & Adaptive Bitrate Streaming (YouTube / Netflix / DAG Transcoding / HLS CDN)
     9. `sys-09-geospatial-matching`: Geospatial Driver-Rider Matching Engine (Uber H3 Hexagons / Quadtrees)
     10. `sys-10-payment-ledger`: Idempotent Payment Processing & Double-Entry Ledger (Stripe Saga / Transactional Outbox)

---

## 3. Flagship Case Study: 1,000-User Remote Code Execution Engine (`sys-01-code-execution`)

- **Stage 1 (Scope & Back-of-the-Envelope Math)**: 1M DAU, 1,000 concurrent contest submissions/sec, `<25ms` API ingestion (`HTTP 202`), `<2.0s` P95 execution turnaround, strict isolation (`256MB` RAM, `32` PIDs, `--net=none`).
- **Stage 2 (The Naive Monolith Failure)**: Single server running `subprocess.run` $\rightarrow$ 1,000 concurrent runs consume `50GB` RAM (OOM Killer), block all worker threads (Nginx `504`), and expose host OS to `while True:` / `os.fork()`.
- **Stage 3 (Scaled Architecture & Chaos Simulator)**:
  - **Flow**: Client $\rightarrow$ API Gateway (`HTTP 202`) $\rightarrow$ SHA-256 Dedup Cache $\rightarrow$ Redis Streams Queue $\rightarrow$ Ephemeral Cgroup v2 / `isolate` Sandbox Workers $\rightarrow$ Redis Pub/Sub $\rightarrow$ SSE Live Push.
  - **Chaos Modes**: (A) Infinite Loop (`SIGKILL` watchdog timer), (B) Fork Bomb (`pids.max=32`), (C) Worker Node Crash (`XPENDING` visibility timeout reclaim + DLQ).
- **Stage 4 (Senior 60s Pitch & Curated References)**:
  - 4-card Senior Pitch script (124 words) + links to ByteByteGo, Judge0 (`isolate`), Arpit Bhayani, Hussein Nasser, and System Design Primer.

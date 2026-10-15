# PatternForge DSA

A personal DSA trainer built to stop memorising solutions. Every question goes through four stages:

1. **Concept**: why the pattern exists, an Indian OA story vs the clean LeetCode statement (trigger
   words highlighted), and two quick quizzes on constraints and pattern choice.
2. **Micro-drills**: three tiny functions, each training one piece of the solution.
3. **Arena**: write the full solution in a real editor; your own code is traced line by line and
   animated in the visualizer. Socratic hints never give the answer away.
4. **Pitch**: write your 4-line interview explanation, compare it with a senior engineer's spoken
   script, rate your confidence, and get scheduled for a blind re-solve (3 / 7 / 21 days).

115 questions across 12 worlds, easy to hard, each linked to LeetCode. The Journey page maps the worlds
as a constellation; each world is a trail of trials ending in a World Boss. The **Grimoire** compiles a
printable 10-minute revision sheet per world from your own pitches and working code, and the
**Playground** traces any solution you paste. See [docs/SPEC.md](docs/SPEC.md) and
[BUILD_TRACKER.md](BUILD_TRACKER.md).

## Run it

Needs Python 3.11+ and Node 20+. The first run installs everything.

```bash
./run.sh
```

Then open http://127.0.0.1:8010. For hot reload while changing the app itself, use `./run.sh dev`
and open http://127.0.0.1:5173.

```bash
./run.sh test
```

runs the backend tests and validates every lesson (each reference solution must pass its own tests).

## Your data

- Progress, pitches and drafts live in `backend/patternforge.db` (SQLite) and are copied to
  `backend/backups/user_data.json` after every change. If the database is ever lost, the next start
  restores it from that file automatically. Use the **Backup** menu to back up or restore by hand.
- To use Supabase instead of SQLite, copy `backend/.env.example` to `backend/.env`, set
  `DATABASE_URL`, and `backend/.venv/bin/pip install -r backend/requirements-postgres.txt`.
- Your code runs in a separate Python process with time and memory limits. That protects the app
  from infinite loops, but it is not a security sandbox: only run code you wrote.

## Optional AI coach

Without any key, the arena uses each lesson's three built-in Socratic hints and the pitch studio shows
the model interview script. To add a live coach ("Ask Socratic Coach" and "Polish My Pitch"), put one of
these in `backend/.env` and restart:

```bash
# Snowflake Cortex (or any OpenAI-compatible API)
AI_BASE_URL=https://<account-identifier>.snowflakecomputing.com/api/v2/cortex/v1
AI_API_KEY=<programmatic access token>
AI_MODEL=<model name>
# or Gemini
GEMINI_API_KEY=<key from aistudio.google.com>
```

The coach reads your current code and the first failing test, and is instructed never to hand over a
full solution.

## Themes

The sun/moon button in the top bar switches between **studio contrast** (warm stone and ivory, the
default) and **carbon dark**. Maps, visualizers and editors stay on pitch-carbon stages in both. The
design rules are in [frontend/DESIGN_REFERENCES.md](frontend/DESIGN_REFERENCES.md).

## Keyboard

`Ctrl+Enter` runs code, `Alt+1`–`Alt+4` switch between unlocked stages, `←`/`→` step through a trace and
`Space` plays or pauses it.

## Adding lessons

Lessons are YAML files in `content/questions/`. Follow [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md),
then run `backend/.venv/bin/python scripts/validate_content.py <slug>`.

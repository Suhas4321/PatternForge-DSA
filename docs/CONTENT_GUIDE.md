# Writing a question lesson

Each question is one YAML file: `content/questions/<NN-world-slug>/<slug>.yaml`, where the folder and
slug come from `content/curriculum.json`. The reference example is
[`01-arrays-hashing/two-sum.yaml`](../content/questions/01-arrays-hashing/two-sum.yaml): copy its
structure exactly.

Validate after every file (from the project root):

```bash
backend/.venv/bin/python scripts/validate_content.py <slug>
```

The validator runs the reference solution, brute force, and every drill solution against their tests,
checks the starter code compiles, and checks the trigger keywords appear in the clean statement. A
file is done only when it prints `ok` with no warnings.

## Fields

| Field | What goes in it |
|---|---|
| `slug`, `lc` | Must match `curriculum.json` exactly |
| `concept.problem_it_solves` | The underlying question the pattern answers, in plain words (2–3 sentences) |
| `concept.brute_force` | The naive approach and *why* it wastes work |
| `concept.brute_force_complexity` | e.g. `O(N²) time, O(1) space — 10⁵ elements means 10¹⁰ steps.` |
| `concept.key_insight` | The one flip in thinking that makes the optimal solution obvious |
| `concept.real_world` | Where this exact idea runs in real backend systems (2–3 sentences) |
| `statement.clean` | Faithful LeetCode-style statement in markdown, in your own words |
| `statement.oa_story` | The same problem wrapped in a 2-paragraph Indian OA story with a **bold fictional company header** (e.g. SwiftCart, PayLoop, KiranaKart, RideMitra). Same inputs/outputs, but the data-structure signal must be hidden in the story the way real OAs do it |
| `statement.trigger_keywords` | 2–4 short phrases that must appear **verbatim** (case-insensitive) in `statement.clean` |
| `statement.examples` | 2–3 examples (`input`, `output`, `explanation`) |
| `statement.constraints` | LeetCode constraints, written like `"1 <= nums.length <= 10^5"` |
| `constraint_quiz` | "Given N, what complexity must you aim for?" 4 options, `answer` is the 0-based index, explanation says why each wrong option fails |
| `pattern_quiz` | "Which pattern fits?" 4 plausible options, explanation ties the trigger words to the pattern |
| `function` | How the harness calls code (see below) |
| `starter_code` | `class Solution:` + the exact LeetCode method signature with type hints + body `pass` |
| `tests` | 6–9 cases: the LeetCode examples, then edge cases (empty/single element, duplicates, negatives, all same, answer at the ends, extremes). Each tricky case gets a short `note` |
| `visualize_test` | Index of the test the visualizer traces by default: pick one small and illustrative (5–8 elements) |
| `drills` | Exactly 3, `skill` = `setup`, `core`, `edge` in that order (see below) |
| `hints` | Exactly 3: (1) pattern intuition as a question, (2) the state transition, (3) a pseudocode blueprint as a literal block (`|`) — never runnable Python |
| `solution.code` | Clean optimal Python with a few short comments, LeetCode signature |
| `solution.explanation` | Why it works, including the subtle ordering/edge-case decision |
| `solution.time` / `space` | e.g. `O(N) — one pass, O(1) average per hash lookup` |
| `solution.brute_force_code` | Optional naive solution; must still pass all tests, so keep test inputs small enough |
| `pitch_script` | Five bold-labelled paragraphs: **(Clarify)**, **(Brute force)**, **(Trigger)**, **(Optimal)**, **(Complexity)**, written as speech, in quotes, as a calm senior engineer would say it in a Bengaluru face-to-face round |
| `twist.lc`, `twist.title` | A *different* LeetCode problem using the same pattern with a twist. `title` must be the **exact** LeetCode title (the URL is built from it) |
| `twist.why` | What changes and how the template adapts |
| `viz` | Visualizer hints, using the variable names from `solution.code` (see below) |

## `function`

```yaml
function:
  name: twoSum                 # method on class Solution (or the class name for kind: design)
  params: [{name: nums}, {name: target}]
  returns: any                 # or ListNode / TreeNode / ... for linked structures
  compare: exact               # exact | unordered | unordered_nested | float
  inplace_arg: 0               # only for "modify nums in-place" problems: compare nums after the call
```

- Use `compare: unordered` when "return the answer in any order" applies to a flat list, and
  `unordered_nested` for lists of groups (Group Anagrams) or lists of combinations.
- If several answers are valid and no compare mode captures that, design the tests so the answer is unique.
- Never return a dict from a drill or solution; return lists (JSON object keys become strings).
- Param types: `ListNode` (`[1,2,3]`), `ListNode[]` (`[[1,4],[2,3]]`), `ListNodeCycle`
  (`{values: [...], pos: 1}`, pos -1 for no cycle), `RandomListNode` (`[[7, null], [13, 0]]`),
  `TreeNode` (level order with `null`), `TreeNodeRef` (a value; the harness passes the node with that
  value inside the first `TreeNode` argument, e.g. LCA's `p`/`q`), `GraphNode` (1-indexed adjacency list).
- Return types: the same, plus `TreeNodeVal` (compare the returned node by its `.val`, e.g. LCA).
  Returning `ListNode`/`TreeNode`/`GraphNode`/`RandomListNode` serialises back to the input format, and
  deep-copy problems fail automatically if they return original nodes.
- Design problems (`kind: design`): test `args` is `{ops: [...], args: [[...], ...]}` and `expected`
  is the list of return values (`null` for the constructor and void methods).

## Drills

Each drill is a tiny, separately runnable function that isolates one micro-skill of the full solution.
4–8 lines of solution, 3–5 tests, its own unique method name, `pass` in the starter body.

1. `setup`: initialise the state / data structure and write the traversal loop.
2. `core`: the key condition, pointer move or state transition.
3. `edge`: the edge case or result extraction that people get wrong.

`goal` is one sentence naming the micro-skill. `instructions` explain the task *and why it matters for
the full problem*. `hint` is one nudge, not the answer.

## `viz`

```yaml
viz:
  arrays: [nums]          # lists/strings drawn as boxes; first one gets the pointers
  pointers: [l, r, i]     # int variables drawn as arrows; "j:t" puts j on array t
  window: [l, r]          # optional: highlight nums[l..r] (sliding window / search range);
                          # `window: null` turns the auto-detected range off
  maps: [seen]            # dict / set / Counter variables shown as a key-value panel
  watch: [best, total]    # scalars to list first in the variables panel
  # stack_queue visualizer only:
  stacks: [stack]                       # lists drawn as a vertical stack (top = end of list)
  queues: [queue]                       # deques / lists drawn as a horizontal queue (front = left)
  stack_values: {stack: temperatures}   # the stack holds indices: also show temperatures[index]
```

```yaml
viz:
  # linked_list visualizer: draws every node object with a `next` field (and `prev`/`random`
  # arrows), labels the variables pointing at each node. Nothing is required.
  layout: current          # optional: re-layout each step by current list order (LRU cache)

  # tree_recursion visualizer: draws TreeNode trees (the current call's node is highlighted),
  # heapq lists as binary trees, and otherwise the recursion call tree of a backtracking helper.
  heaps: [heap]            # lists to draw as binary heaps (names containing "heap" are auto-detected)

  # graph_grid visualizer
  grid: grid               # 2D list drawn as a coloured grid (auto: first list of lists)
  cell: [r, c]             # variables giving the current cell (auto: r/c, row/col, i/j, x/y)
  graph: adj               # adjacency list (list of lists or dict) drawn as a node-link graph
  edges: times             # or an edge list [[u, v], ...] / [[u, v, w], ...] when there is no adj
  visited: [visited]       # sets/lists of visited nodes or (r, c) cells, highlighted
  node: node               # variable holding the current node
  dist: dist               # list/dict shown as a label under each node (Dijkstra, BFS levels)

  # dp_table visualizer: draws the dp list (1D) or list of lists (2D); the cell written on the
  # current line is green, cells the line reads (dp[i-1], dp[i][j-1]...) are blue.
  table: dp                # auto: a variable named dp / memo / table
  row_labels: text1        # optional: string/list whose items label the rows
  col_labels: text2        # optional: labels for the columns (1D tables use col_labels)
  label_offset: 1          # dp index i corresponds to label i - 1 (the usual "empty prefix" row)
```

For design problems, instance attributes are available as `self.<name>` (e.g. `stacks: [self.stack]`).

Only reference variables that exist in `solution.code`. The visualizer also auto-detects common
names (`i`, `j`, `l`, `r`, `left`, `right`, `lo`, `hi`, `mid`…), so learners' own code still renders.

## YAML gotchas

- In flow style (`{args: ..., note: ...}`), quote any value containing a comma.
- Quote any string containing `: `, `#`, or starting with `[`, `{`, `*`, `&`, `!`, `|`, `>`, `'`, `"`, `%`, `@`.
- Use `true` / `false` / `null` for JSON booleans and None.
- Use `|` for code and multi-line markdown, `>-` for long single paragraphs.
- Indent code blocks consistently with 4 spaces inside the block.

## Quality bar

- Write for someone who keeps blanking in interviews: explain *why*, never just *what*.
- Every claim about complexity must be exact.
- OA stories use fictional company names; `real_world` may mention real companies and systems.
- No placeholders, no "TODO", no "similar to above".

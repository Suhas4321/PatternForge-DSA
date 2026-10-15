/**
 * Pattern Finder: a decision tree from "what does the problem look like?" to a pattern, the way
 * you should reason in an interview. Results point at worlds and real lessons in the curriculum.
 */

export interface Choice {
  label: string
  hint?: string
  next: string // a question id or a result id
}

export interface Question {
  id: string
  prompt: string
  choices: Choice[]
}

export interface PatternResult {
  id: string
  pattern: string
  worldId: number
  signals: string[]
  idea: string
  complexity: string
  template: string
  examples: string[] // question slugs
}

export const QUESTIONS: Record<string, Question> = {
  start: {
    id: 'start',
    prompt: 'What is the main input?',
    choices: [
      { label: 'An array or a string', next: 'array' },
      { label: 'A linked list', next: 'linked-list' },
      { label: 'A binary tree or BST', next: 'tree' },
      { label: 'A grid, a graph, or a list of edges / prerequisites', next: 'graph' },
    ],
  },
  array: {
    id: 'array',
    prompt: 'What is the question really asking for?',
    choices: [
      { label: 'Every combination, subset, permutation or placement', hint: 'and N is small, about 20 or less', next: 'backtracking' },
      { label: 'The number of ways, or the min / max cost, built from a choice at each step', next: 'dp' },
      { label: 'The k-th largest / smallest, the top K, or a running median', next: 'heap' },
      { label: 'Intervals, meetings or overlapping ranges', next: 'intervals' },
      { label: 'The next greater / smaller element, matching brackets, or evaluating an expression', next: 'stack' },
      { label: 'Something about a contiguous subarray or substring', next: 'contiguous' },
      { label: 'A pair or triplet that hits a target, or an in-place rearrangement', next: 'pair' },
      { label: 'A position, or the smallest value that makes a condition true', next: 'search' },
      { label: 'Counting, duplicates, grouping, “have I seen this before?”', next: 'hashing' },
      { label: 'The best move step by step: reach the end, assign, maximise a running sum', next: 'greedy' },
    ],
  },
  contiguous: {
    id: 'contiguous',
    prompt: 'What decides whether a window is valid?',
    choices: [
      {
        label: 'Its contents: at most K distinct / zeros, no repeats, a fixed size K',
        hint: 'growing the window can only make it “more invalid”',
        next: 'sliding-window',
      },
      { label: 'Its sum must equal exactly K, and values can be negative', next: 'prefix-sum' },
    ],
  },
  pair: {
    id: 'pair',
    prompt: 'Is the array sorted, or can you sort it without losing what you must return?',
    choices: [
      { label: 'Yes, it is sorted (or sorting is fine)', next: 'two-pointers' },
      { label: 'No, and I have to return the original indices', next: 'hashing' },
    ],
  },
  search: {
    id: 'search',
    prompt: 'Where is the monotonic order?',
    choices: [
      { label: 'In the array itself: it is sorted, maybe rotated', next: 'bs-array' },
      { label: 'In the answer: “can it be done with X?” flips from no to yes as X grows', hint: 'speed, capacity, days, max load', next: 'bs-answer' },
    ],
  },
  tree: {
    id: 'tree',
    prompt: 'What do you need from the tree?',
    choices: [
      { label: 'Something per level: level order, right side view, level averages', next: 'tree-bfs' },
      { label: 'A value built from the children: height, diameter, balance, max path sum', next: 'tree-dfs-up' },
      { label: 'A check that depends on the ancestors: BST bounds, max on the path so far', next: 'tree-dfs-down' },
    ],
  },
  graph: {
    id: 'graph',
    prompt: 'What does the question want?',
    choices: [
      { label: 'Count or fill connected regions: islands, provinces, flood fill', next: 'graph-components' },
      { label: 'The fewest steps / minutes, every move costs the same', next: 'graph-bfs' },
      { label: 'An order that respects prerequisites, or whether one exists', next: 'topo' },
      { label: 'The cheapest path when edges have different weights', next: 'dijkstra' },
    ],
  },
}

export const RESULTS: Record<string, PatternResult> = {
  hashing: {
    id: 'hashing',
    pattern: 'Hash map / hash set',
    worldId: 1,
    signals: ['“have I seen it before?”', 'pair that sums to X on unsorted data', 'group by / count'],
    idea: 'Trade memory for speed: remember what you have passed so each lookup is O(1) instead of a rescan.',
    complexity: 'O(N) time, O(N) space',
    template: 'seen = {}\nfor i, x in enumerate(nums):\n    if target - x in seen: ...\n    seen[x] = i',
    examples: ['two-sum', 'contains-duplicate', 'group-anagrams'],
  },
  'prefix-sum': {
    id: 'prefix-sum',
    pattern: 'Prefix sums + hash map',
    worldId: 1,
    signals: ['subarray sum equals K', 'negative numbers allowed', 'count of subarrays'],
    idea: 'sum(i..j) = prefix[j] − prefix[i−1]. Count earlier prefixes equal to prefix − K as you go.',
    complexity: 'O(N) time, O(N) space',
    template: 'count = {0: 1}; prefix = 0\nfor x in nums:\n    prefix += x\n    ans += count.get(prefix - k, 0)\n    count[prefix] = count.get(prefix, 0) + 1',
    examples: ['subarray-sum-equals-k', 'product-of-array-except-self'],
  },
  'two-pointers': {
    id: 'two-pointers',
    pattern: 'Two pointers',
    worldId: 2,
    signals: ['sorted array', 'pair / triplet with a target', 'in-place', 'palindrome'],
    idea: 'On sorted data each comparison safely discards one end, so the search space shrinks every step.',
    complexity: 'O(N) time (O(N log N) if you sort first), O(1) space',
    template: 'l, r = 0, len(nums) - 1\nwhile l < r:\n    s = nums[l] + nums[r]\n    if s == target: ...\n    elif s < target: l += 1\n    else: r -= 1',
    examples: ['two-sum-ii-input-array-is-sorted', '3sum', 'container-with-most-water'],
  },
  'sliding-window': {
    id: 'sliding-window',
    pattern: 'Sliding window',
    worldId: 3,
    signals: ['contiguous subarray / substring', 'longest / shortest', 'at most K', 'without repeating'],
    idea: 'Grow the right end, shrink the left end while the window is invalid, record the answer when valid.',
    complexity: 'O(N) time: each index enters and leaves once',
    template: 'l = 0\nfor r, x in enumerate(s):\n    add(x)\n    while invalid():\n        remove(s[l]); l += 1\n    best = max(best, r - l + 1)',
    examples: ['longest-substring-without-repeating-characters', 'max-consecutive-ones-iii', 'minimum-window-substring'],
  },
  stack: {
    id: 'stack',
    pattern: 'Stack / monotonic stack',
    worldId: 4,
    signals: ['next greater / smaller', 'matching brackets', 'evaluate expression', 'collapse adjacent'],
    idea: 'Keep the unresolved items on a stack; a new item resolves (pops) everything it beats.',
    complexity: 'O(N) time: each item is pushed and popped once',
    template: 'stack = []\nfor i, x in enumerate(nums):\n    while stack and nums[stack[-1]] < x:\n        j = stack.pop(); ans[j] = i - j\n    stack.append(i)',
    examples: ['valid-parentheses', 'daily-temperatures', 'largest-rectangle-in-histogram'],
  },
  'bs-array': {
    id: 'bs-array',
    pattern: 'Binary search on the array',
    worldId: 5,
    signals: ['sorted', 'O(log N) required', 'rotated', 'first / last position'],
    idea: 'Keep the answer inside [lo, hi] and throw away the half that cannot contain it.',
    complexity: 'O(log N) time, O(1) space',
    template: 'lo, hi = 0, len(nums) - 1\nwhile lo <= hi:\n    mid = (lo + hi) // 2\n    if nums[mid] == target: return mid\n    if nums[mid] < target: lo = mid + 1\n    else: hi = mid - 1',
    examples: ['binary-search', 'search-in-rotated-sorted-array', 'find-first-and-last-position-of-element-in-sorted-array'],
  },
  'bs-answer': {
    id: 'bs-answer',
    pattern: 'Binary search on the answer',
    worldId: 5,
    signals: ['minimise the maximum', 'minimum speed / capacity / days', '“at least” / “at most” feasibility'],
    idea: 'Search the answer range for the first value where a greedy feasible(x) check turns true.',
    complexity: 'O(N log range) time',
    template: 'lo, hi = smallest, largest\nwhile lo < hi:\n    mid = (lo + hi) // 2\n    if feasible(mid): hi = mid\n    else: lo = mid + 1\nreturn lo',
    examples: ['koko-eating-bananas', 'capacity-to-ship-packages-within-d-days', 'split-array-largest-sum'],
  },
  'linked-list': {
    id: 'linked-list',
    pattern: 'Pointer manipulation (dummy head, slow/fast)',
    worldId: 6,
    signals: ['reverse', 'cycle', 'middle', 'n-th from the end', 'O(1) extra space'],
    idea: 'Save next before rewiring, use a dummy head to remove edge cases, slow/fast for middles and cycles.',
    complexity: 'O(N) time, O(1) space',
    template: 'prev, cur = None, head\nwhile cur:\n    nxt = cur.next\n    cur.next = prev\n    prev, cur = cur, nxt',
    examples: ['reverse-linked-list', 'linked-list-cycle', 'merge-two-sorted-lists'],
  },
  'tree-bfs': {
    id: 'tree-bfs',
    pattern: 'Tree BFS, level by level',
    worldId: 7,
    signals: ['level order', 'right / left side view', 'per-level values', 'minimum depth'],
    idea: 'Process the queue one level at a time: the queue length at the start of a round is that level.',
    complexity: 'O(N) time, O(width) space',
    template: 'queue = deque([root])\nwhile queue:\n    for _ in range(len(queue)):\n        node = queue.popleft()\n        ...\n        queue.extend(children)',
    examples: ['binary-tree-level-order-traversal', 'binary-tree-right-side-view'],
  },
  'tree-dfs-up': {
    id: 'tree-dfs-up',
    pattern: 'Tree DFS returning values up',
    worldId: 7,
    signals: ['height / depth', 'diameter', 'balanced', 'path sum through a node'],
    idea: 'Decide what each call returns for its subtree, handle None, combine the two children.',
    complexity: 'O(N) time, O(height) stack',
    template: 'def dfs(node):\n    if not node: return 0\n    l, r = dfs(node.left), dfs(node.right)\n    best = max(best, l + r)  # answer through this node\n    return 1 + max(l, r)     # what the parent needs',
    examples: ['maximum-depth-of-binary-tree', 'diameter-of-binary-tree', 'binary-tree-maximum-path-sum'],
  },
  'tree-dfs-down': {
    id: 'tree-dfs-down',
    pattern: 'Tree DFS passing state down',
    worldId: 7,
    signals: ['valid BST', 'max on the path so far', 'depends on ancestors'],
    idea: 'Carry the constraint from the ancestors (bounds, max so far) into each recursive call.',
    complexity: 'O(N) time, O(height) stack',
    template: 'def dfs(node, low, high):\n    if not node: return True\n    if not low < node.val < high: return False\n    return dfs(node.left, low, node.val) and dfs(node.right, node.val, high)',
    examples: ['validate-binary-search-tree', 'count-good-nodes-in-binary-tree'],
  },
  heap: {
    id: 'heap',
    pattern: 'Heap / priority queue',
    worldId: 8,
    signals: ['k-th largest / smallest', 'top K', 'k closest', 'streaming median', 'merge K sorted'],
    idea: 'A size-K heap keeps the best K seen so far; its root is the answer. Two heaps give a running median.',
    complexity: 'O(N log K) time, O(K) space',
    template: 'heap = []\nfor x in nums:\n    heapq.heappush(heap, x)\n    if len(heap) > k: heapq.heappop(heap)\nreturn heap[0]',
    examples: ['kth-largest-element-in-an-array', 'k-closest-points-to-origin', 'find-median-from-data-stream'],
  },
  backtracking: {
    id: 'backtracking',
    pattern: 'Backtracking',
    worldId: 9,
    signals: ['all combinations / subsets / permutations', 'N ≤ 20', 'place N items', 'partition into'],
    idea: 'Choose, explore, un-choose. Prune branches that can no longer succeed.',
    complexity: 'Exponential: O(2^N) subsets, O(N!) permutations',
    template: 'def dfs(i):\n    if done: res.append(path[:]); return\n    for choice in options(i):\n        path.append(choice)\n        dfs(next_i)\n        path.pop()',
    examples: ['subsets', 'permutations', 'combination-sum'],
  },
  'graph-components': {
    id: 'graph-components',
    pattern: 'Graph DFS / connected components',
    worldId: 10,
    signals: ['islands', 'connected regions', 'provinces', 'flood fill'],
    idea: 'A grid is a graph. Scan every cell; each unvisited land cell starts a DFS that marks its whole region.',
    complexity: 'O(rows × cols) or O(V + E)',
    template: 'def sink(r, c):\n    if out of bounds or grid[r][c] != "1": return\n    grid[r][c] = "0"\n    for dr, dc in dirs: sink(r + dr, c + dc)',
    examples: ['number-of-islands', 'number-of-provinces', 'max-area-of-island'],
  },
  'graph-bfs': {
    id: 'graph-bfs',
    pattern: 'BFS for shortest steps (multi-source)',
    worldId: 10,
    signals: ['minimum minutes / steps', 'spread', 'unweighted', 'transform one word at a time'],
    idea: 'BFS visits nodes in order of distance, so the first time you reach something is the fewest steps.',
    complexity: 'O(V + E)',
    template: 'queue = deque(sources); steps = 0\nwhile queue:\n    for _ in range(len(queue)):\n        node = queue.popleft()\n        for nb in neighbours(node): ...\n    steps += 1',
    examples: ['rotting-oranges', 'word-ladder'],
  },
  topo: {
    id: 'topo',
    pattern: 'Topological sort (Kahn’s algorithm)',
    worldId: 10,
    signals: ['prerequisites', 'order of tasks / courses / builds', 'detect a cycle'],
    idea: 'Repeatedly take nodes with no remaining prerequisites; if some are never freed, there is a cycle.',
    complexity: 'O(V + E)',
    template: 'queue = deque(n for n in nodes if indegree[n] == 0)\nwhile queue:\n    n = queue.popleft(); order.append(n)\n    for nxt in adj[n]:\n        indegree[nxt] -= 1\n        if indegree[nxt] == 0: queue.append(nxt)',
    examples: ['course-schedule', 'course-schedule-ii'],
  },
  dijkstra: {
    id: 'dijkstra',
    pattern: 'Dijkstra (weighted shortest path)',
    worldId: 10,
    signals: ['weighted edges', 'cheapest / fastest path', 'network delay'],
    idea: 'Always expand the closest unfinished node from a min-heap; skip stale heap entries.',
    complexity: 'O(E log V)',
    template: 'dist = {src: 0}; heap = [(0, src)]\nwhile heap:\n    d, u = heapq.heappop(heap)\n    if d > dist[u]: continue\n    for v, w in adj[u]:\n        if d + w < dist.get(v, inf):\n            dist[v] = d + w; heapq.heappush(heap, (d + w, v))',
    examples: ['network-delay-time', 'cheapest-flights-within-k-stops'],
  },
  intervals: {
    id: 'intervals',
    pattern: 'Intervals: sort, then sweep',
    worldId: 11,
    signals: ['merge overlapping', 'meetings', 'minimum removals / arrows', 'insert a range'],
    idea: 'Sort by start to merge; sort by end to keep the most non-overlapping or place the fewest points.',
    complexity: 'O(N log N) time',
    template: 'intervals.sort()\nmerged = [intervals[0]]\nfor s, e in intervals[1:]:\n    if s <= merged[-1][1]: merged[-1][1] = max(merged[-1][1], e)\n    else: merged.append([s, e])',
    examples: ['merge-intervals', 'non-overlapping-intervals', 'insert-interval'],
  },
  greedy: {
    id: 'greedy',
    pattern: 'Greedy',
    worldId: 11,
    signals: ['can you reach the end', 'maximum subarray', 'assign to satisfy most', 'one pass, local best'],
    idea: 'Make the locally best choice and be ready to explain why it never hurts (the exchange argument).',
    complexity: 'Usually O(N) or O(N log N)',
    template: 'farthest = 0\nfor i, jump in enumerate(nums):\n    if i > farthest: return False\n    farthest = max(farthest, i + jump)\nreturn True',
    examples: ['jump-game', 'maximum-subarray', 'gas-station'],
  },
  dp: {
    id: 'dp',
    pattern: 'Dynamic programming',
    worldId: 12,
    signals: ['number of ways', 'minimum / maximum cost', 'take it or skip it', 'longest subsequence'],
    idea: 'Define dp[i] in words, build it from smaller states by thinking about the last choice, fill in order.',
    complexity: 'O(states × choices)',
    template: 'dp = [0] * (n + 1)\ndp[0] = base\nfor i in range(1, n + 1):\n    dp[i] = best_of(dp[i - 1], dp[i - 2] + ...)\nreturn dp[n]',
    examples: ['climbing-stairs', 'coin-change', 'longest-common-subsequence'],
  },
}

export const isResult = (id: string) => id in RESULTS

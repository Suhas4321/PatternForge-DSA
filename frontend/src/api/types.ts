export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type Rust = 'fresh' | 'dusty' | 'rusting' | 'rusted' | null
export type Status = 'new' | 'in_progress' | 'solved' | 'review_due'
export type VisualizerKind =
  | 'array_pointer'
  | 'stack_queue'
  | 'linked_list'
  | 'tree_recursion'
  | 'graph_grid'
  | 'dp_table'

export interface Progress {
  concept_done: boolean
  quiz_passed: boolean
  drills_passed: number[]
  solved: boolean
  studied_solution: boolean
  solved_at: string | null
  attempts: number
  hints_used: number
  confidence: number | null
  review_count: number
  last_practiced_at: string | null
  next_review_at: string | null
  status: Status
  rust: Rust
}

export interface QuestionSummary {
  slug: string
  lc: number
  title: string
  difficulty: Difficulty
  world_id: number
  position: number
  visualizer: VisualizerKind
  patterns: string[]
  has_content: boolean
  leetcode_url: string
  progress: Progress
}

export interface World {
  id: number
  slug: string
  name: string
  tagline: string
  core_idea: string
  triggers: string[]
  total: number
  with_content: number
  solved: number
  due: number
  rust: Rust
  last_practiced_at: string | null
  questions: QuestionSummary[]
}

export interface FunctionSpec {
  kind: 'function' | 'design'
  name: string
  params: { name: string; type: string }[]
  returns: string
  compare: string
  inplace_arg: number | null
}

export interface TestCase {
  args: unknown
  expected: unknown
  note: string
}

export interface Drill {
  title: string
  skill: 'setup' | 'core' | 'edge'
  goal: string
  instructions: string
  function: FunctionSpec
  starter_code: string
  tests: TestCase[]
  solution: string
  hint: string
}

export interface Quiz {
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

export interface QuestionContent {
  slug: string
  lc: number
  concept: {
    problem_it_solves: string
    brute_force: string
    brute_force_complexity: string
    key_insight: string
    real_world: string
  }
  statement: {
    clean: string
    oa_story: string
    trigger_keywords: string[]
    examples: { input: string; output: string; explanation: string }[]
    constraints: string[]
  }
  constraint_quiz: Quiz
  pattern_quiz: Quiz
  function: FunctionSpec
  starter_code: string
  tests: TestCase[]
  visualize_test: number
  drills: Drill[]
  hints: string[]
  solution: { code: string; explanation: string; time: string; space: string; brute_force_code: string }
  pitch_script: string
  twist: { lc: number; title: string; why: string }
  viz: VizConfig
}

export interface VizConfig {
  arrays?: string[]
  pointers?: string[]
  window?: [string, string] | null
  maps?: string[]
  watch?: string[]
  [key: string]: unknown
}

export interface Pitch {
  brute_force: string
  trigger: string
  intuition: string
  complexity: string
  updated_at?: string | null
}

export interface QuestionDetail extends QuestionSummary {
  world_name: string
  world_total: number
  content: QuestionContent | null
  pitch: Pitch
  drafts: Record<string, string>
  prev_slug: string | null
  next_slug: string | null
}

export interface RunError {
  type: string
  message: string
  line: number | null
}

export interface TestResult {
  index: number
  passed: boolean
  expected: unknown
  actual: unknown
  error: RunError | null
  stdout: string
  runtime_ms: number
}

// ---- Trace (see backend/app/runner/harness.py) ----

export type TraceValue =
  | null
  | boolean
  | number
  | string
  | TraceValue[]
  | { $ref: number }
  | { $dict: [TraceValue, TraceValue][]; $kind?: string; $more?: number }
  | { $set: TraceValue[] }
  | { $tuple: TraceValue[] }
  | { $deque: TraceValue[] }
  | { $inf: 1 | -1 }
  | { $nan: true }
  | { $more: number }
  | { $repr: string }

export interface HeapObject {
  type: string
  fields: Record<string, TraceValue>
}

export interface TraceFrame {
  id: number
  func: string
  line: number
  locals: Record<string, TraceValue>
}

export interface TraceStep {
  event: 'call' | 'line' | 'return' | 'exception'
  line: number
  func: string
  depth: number
  frames: TraceFrame[]
  heap: Record<string, HeapObject>
  return_value?: TraceValue
  return_heap?: Record<string, HeapObject>
  exception?: string
  /** On call events: the function's parameter names (excludes closure variables). */
  params?: string[]
}

export interface Trace {
  test_index: number
  steps: TraceStep[]
  truncated: boolean
  error: RunError | null
}

export interface RunResult {
  target: string
  passed: boolean
  passed_count: number
  total_count: number
  compile_error: RunError | null
  fatal_error: RunError | null
  results: TestResult[]
  trace: Trace | null
  progress: Progress
  custom: boolean
}

export interface ReviewItem {
  slug: string
  lc: number
  title: string
  difficulty: Difficulty
  world_id: number
  world_name: string
  confidence: number | null
  next_review_at: string | null
  overdue_days: number
}

export interface ReviewQueue {
  due: ReviewItem[]
  upcoming: ReviewItem[]
  rusting_worlds: { world_id: number; world_name: string; rust: Rust; last_practiced_at: string | null }[]
}

// ---- AI coach & cheat-sheet ----

export interface CoachStatus {
  enabled: boolean
  provider: string | null
  model: string | null
}

export interface CoachReply {
  enabled: boolean
  reply: string | null
  error: string | null
  fallback_hints: string[]
  fallback_script: string
}

export interface CheatSheet {
  world_id: number
  name: string
  tagline: string
  core_idea: string
  triggers: string[]
  patterns: {
    slug: string
    lc: number
    title: string
    difficulty: Difficulty
    patterns: string[]
    trigger_keywords: string[]
    key_insight: string
    time: string
    space: string
  }[]
  solved: {
    slug: string
    lc: number
    title: string
    difficulty: Difficulty
    confidence: number | null
    pitch: Pitch
    code: string
    code_source: 'passing_submission' | 'draft' | 'reference'
    time: string
    space: string
  }[]
}

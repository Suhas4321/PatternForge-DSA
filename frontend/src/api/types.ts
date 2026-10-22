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
  | 'sql_pipeline'
  | 'dataframe_pipeline'
  | 'concurrency_timeline'
  | 'http_lifecycle'
  | 'system_blueprint'

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
  citadel_id?: string
  brick_layer?: number
  runner_type?: string
  visualizer: VisualizerKind
  patterns: string[]
  has_content: boolean
  leetcode_url: string
  progress: Progress
}

export interface World {
  id: number
  slug: string
  citadel_id?: string
  status?: 'live' | 'coming_soon'
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
  citadel_id?: string
  brick_layer?: number
  runner_type?: string
  concept_trace?: any
  visual_demo?: any
  schema_sql?: string
  seed_sql?: string
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
  title?: string
  complexity?: { time?: string; space?: string }
  line_notes?: Record<number | string, string | { caption?: string; why?: string }>
  style?: 'bars' | 'cubes' | 'flat'
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
  event: 'call' | 'line' | 'return' | 'exception' | 'pipeline_step'
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
  sql_state?: any
  df_state?: any
  concurrency_state?: any
  http_state?: any
  blueprint_state?: any
  title?: string
  description?: string
  focus?: number[]
}

export interface Trace {
  test_index: number
  steps: TraceStep[]
  line_info?: Record<string, {
    text: string
    kinds: string[]
    subscripts: string[]
  }>
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

export interface ActivityEvent {
  t: string
  kind: 'solve' | 'drill'
  passed: boolean
  slug: string
}

export interface PeakStat {
  id: string
  name: string
  short_name: string
  numeral: string
  accent: string
  icon: string
  solved: number
  total: number
  mastery: number
}

export interface RustCamp {
  slug: string
  title: string
  world_slug: string
  world_title: string
  citadel_id: string
  rust: 'rusting' | 'rusted'
  box: number
  next_review_at: string | null
  last_practiced_at: string | null
}

export interface WeakestLesson {
  slug: string
  title: string
  world_slug: string
  world_title: string
  citadel_id: string
  confidence: number | null
  attempts: number
  solved: boolean
}

export interface ActivityDay {
  date: string
  count: number
  level: number
}

export interface ThisWeekDay {
  day: string
  date: string
  count: number
}

export interface WorldMastery {
  slug: string
  order: number
  title: string
  citadel_id: string
  solved: number
  total: number
  mastery: number
}

export interface TimelineEvent {
  id: number
  question_slug: string
  question_title: string
  target: string
  passed: boolean
  passed_count: number
  total_count: number
  created_at: string
}

export interface CitadelSeal {
  citadel_id: string
  numeral: string
  name: string
  accent: string
  unlocked: boolean
  solved: number
  total: number
}

export interface AchievementBadge {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
}

export interface StatsResponse {
  level: number
  xp: number
  level_xp: number
  streak: number
  total_solved: number
  total_questions: number
  readiness_score: number
  peaks: PeakStat[]
  first_try_pass_rate: number | null
  average_hints: number | null
  average_confidence: number | null
  rust_camps: RustCamp[]
  reviews_due_today: number
  reviews_due_this_week: number
  weakest_lessons: WeakestLesson[]
  activity_20_weeks: ActivityDay[]
  activity_this_week: ThisWeekDay[]
  world_mastery: WorldMastery[]
  recent_timeline: TimelineEvent[]
  seals: CitadelSeal[]
  badges: AchievementBadge[]
}


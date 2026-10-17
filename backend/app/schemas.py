from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ProgressOut(BaseModel):
    concept_done: bool = False
    quiz_passed: bool = False
    drills_passed: list[int] = Field(default_factory=list)
    solved: bool = False
    studied_solution: bool = False
    solved_at: datetime | None = None
    attempts: int = 0
    hints_used: int = 0
    confidence: int | None = None
    first_try_pass: bool | None = None
    time_spent_seconds: int | None = None
    review_count: int = 0
    last_practiced_at: datetime | None = None
    next_review_at: datetime | None = None
    status: Literal["new", "in_progress", "solved", "review_due"] = "new"
    rust: str | None = None


class QuestionSummary(BaseModel):
    slug: str
    lc: int
    title: str
    difficulty: str
    world_id: int
    position: int
    citadel_id: str = "dsa"
    brick_layer: int = 1
    runner_type: str = "python_trace"
    visualizer: str
    patterns: list[str]
    has_content: bool
    leetcode_url: str
    progress: ProgressOut


class WorldOut(BaseModel):
    id: int
    slug: str
    citadel_id: str = "dsa"
    status: str = "live"
    name: str
    tagline: str
    core_idea: str
    triggers: list[str]
    total: int
    with_content: int
    solved: int
    due: int
    rust: str | None
    last_practiced_at: datetime | None
    questions: list[QuestionSummary]


class PitchIn(BaseModel):
    brute_force: str = ""
    trigger: str = ""
    intuition: str = ""
    complexity: str = ""


class PitchOut(PitchIn):
    updated_at: datetime | None = None


class QuestionDetail(QuestionSummary):
    world_name: str
    world_total: int
    content: dict[str, Any] | None
    pitch: PitchOut
    drafts: dict[str, str]
    prev_slug: str | None
    next_slug: str | None


class ProgressPatch(BaseModel):
    concept_done: bool | None = None
    quiz_passed: bool | None = None
    studied_solution: bool | None = None
    hints_used: int | None = Field(default=None, ge=0, le=10)


class ConfidenceIn(BaseModel):
    confidence: int = Field(ge=1, le=5)


class DraftIn(BaseModel):
    target: str = Field(pattern=r"^(main|drill:[0-2])$")
    code: str = Field(max_length=50_000)


class RunIn(BaseModel):
    code: str = Field(max_length=50_000)
    target: str = Field(default="main", pattern=r"^(main|drill:[0-2])$")
    language: Literal["python", "sql", "java"] = "python"
    visualize: bool = True
    trace_test_index: int | None = None
    # Run the visualizer on your own input; expected output comes from the reference solution.
    custom_args: list[Any] | dict[str, Any] | None = None


class RunOut(BaseModel):
    target: str
    passed: bool
    passed_count: int
    total_count: int
    compile_error: dict[str, Any] | None
    fatal_error: dict[str, Any] | None = None
    results: list[dict[str, Any]]
    trace: dict[str, Any] | None
    progress: ProgressOut
    custom: bool = False


class ReviewItem(BaseModel):
    slug: str
    lc: int
    title: str
    difficulty: str
    world_id: int
    world_name: str
    confidence: int | None
    next_review_at: datetime | None
    overdue_days: float


class ReviewOut(BaseModel):
    due: list[ReviewItem]
    upcoming: list[ReviewItem]
    rusting_worlds: list[dict[str, Any]]


class CoachIn(BaseModel):
    mode: Literal["hint", "pitch"]
    code: str = Field(default="", max_length=50_000)
    pitch: PitchIn | None = None


class CoachOut(BaseModel):
    enabled: bool
    reply: str | None = None
    error: str | None = None
    # Always included so the UI can fall back without a second request.
    fallback_hints: list[str]
    fallback_script: str


class CheatSheetPattern(BaseModel):
    slug: str
    lc: int
    title: str
    difficulty: str
    patterns: list[str]
    trigger_keywords: list[str]
    key_insight: str
    time: str
    space: str


class CheatSheetSolved(BaseModel):
    slug: str
    lc: int
    title: str
    difficulty: str
    confidence: int | None
    pitch: PitchOut
    code: str
    code_source: Literal["passing_submission", "draft", "reference"]
    time: str
    space: str


class CheatSheetOut(BaseModel):
    world_id: int
    name: str
    tagline: str
    core_idea: str
    triggers: list[str]
    patterns: list[CheatSheetPattern]
    solved: list[CheatSheetSolved]

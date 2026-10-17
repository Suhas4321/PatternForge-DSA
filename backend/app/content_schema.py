"""Schema for per-question content files (content/questions/<NN-world>/<slug>.yaml).

Every content file is validated against these models when the backend loads content and by
scripts/validate_content.py, which additionally executes the reference solutions.
"""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

# Argument / return types understood by the runner harness. "any" means plain JSON values.
ValueType = Literal[
    "any",
    "ListNode",  # [1,2,3] <-> linked list
    "ListNode[]",  # [[1,4],[2,3]] <-> list of linked lists
    "ListNodeCycle",  # {"values": [3,2,0,-4], "pos": 1} -> linked list whose tail links to index pos
    "RandomListNode",  # [[7,null],[13,0]] <-> list with random pointers (LeetCode 138 format)
    "TreeNode",  # level-order [3,9,20,null,null,15,7] <-> binary tree
    "TreeNodeRef",  # a value -> the node with that value inside the (first) TreeNode argument
    "TreeNodeVal",  # return type: the returned node is compared by its .val
    "GraphNode",  # adjacency list [[2,4],[1,3],...] (1-indexed, LeetCode 133 format) <-> graph
]

CompareMode = Literal[
    "exact",
    "unordered",  # order of the top-level list doesn't matter
    "unordered_nested",  # order of the outer list and of every inner list doesn't matter
    "float",  # numbers compared with 1e-5 tolerance
]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Param(Strict):
    name: str
    type: ValueType = "any"


class FunctionSpec(Strict):
    """How the harness calls user code.

    kind="function": calls Solution().<name>(*args).
    kind="design": instantiates class <name> and replays an operation sequence (Min Stack, LRU...).
    """

    kind: Literal["function", "design"] = "function"
    name: str
    params: list[Param] = Field(default_factory=list)
    returns: ValueType = "any"
    compare: CompareMode = "exact"
    # For in-place problems (Move Zeroes, Sort Colors...): compare this argument after the call
    # instead of the return value.
    inplace_arg: int | None = None


class TestCase(Strict):
    # function kind: positional args. design kind: {"ops": [...], "args": [[...], ...]}.
    args: Any
    expected: Any
    note: str = ""


class Drill(Strict):
    title: str
    skill: Literal["setup", "core", "edge"]
    goal: str  # which micro-skill this trains, one sentence
    instructions: str  # markdown
    function: FunctionSpec
    starter_code: str
    tests: list[TestCase] = Field(min_length=1)
    solution: str
    hint: str


class Concept(Strict):
    problem_it_solves: str
    brute_force: str
    brute_force_complexity: str
    key_insight: str
    real_world: str


class Example(Strict):
    input: str
    output: str
    explanation: str = ""


class Statement(Strict):
    clean: str  # markdown, LeetCode-style
    oa_story: str  # markdown, Indian OA style story wrapper
    trigger_keywords: list[str] = Field(min_length=1)
    examples: list[Example] = Field(min_length=1)
    constraints: list[str] = Field(min_length=1)


class Quiz(Strict):
    prompt: str
    options: list[str] = Field(min_length=2)
    answer: int
    explanation: str

    @model_validator(mode="after")
    def _answer_in_range(self):
        if not 0 <= self.answer < len(self.options):
            raise ValueError(f"quiz answer {self.answer} out of range")
        return self


class Solution(Strict):
    code: str
    explanation: str  # markdown
    time: str
    space: str
    brute_force_code: str = ""


class Twist(Strict):
    lc: int
    title: str
    why: str  # what changes and how the template adapts


class QuestionContent(Strict):
    slug: str
    lc: int
    concept: Concept
    statement: Statement
    constraint_quiz: Quiz
    pattern_quiz: Quiz
    function: FunctionSpec
    starter_code: str
    tests: list[TestCase] = Field(min_length=3)
    visualize_test: int = 0  # which test case the visualizer traces by default
    drills: list[Drill] = Field(default_factory=list, max_length=3)
    hints: list[str] = Field(min_length=3, max_length=3)
    solution: Solution
    pitch_script: str  # markdown, what to say out loud in the interview
    twist: Twist
    viz: dict[str, Any] = Field(default_factory=dict)  # visualizer config hints
    citadel_id: str | None = None
    brick_layer: int | None = None
    runner_type: str | None = None
    schema_sql: str | None = None
    seed_sql: str | None = None
    concept_trace: dict[str, Any] | None = None
    visual_demo: dict[str, Any] | None = None

    @model_validator(mode="after")
    def _visualize_test_in_range(self):
        if not 0 <= self.visualize_test < len(self.tests):
            raise ValueError("visualize_test out of range")
        return self

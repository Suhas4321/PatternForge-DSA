from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import Draft, PitchNote, Progress, Question, Submission, World, utcnow
from app.runner.dispatcher import dispatch_run
from app.runner.python_runner import run_python
from app.schemas import (
    CoachIn,
    CoachOut,
    ConfidenceIn,
    DraftIn,
    PitchIn,
    PitchOut,
    ProgressOut,
    ProgressPatch,
    QuestionDetail,
    RunIn,
    RunOut,
)
from app.services import ai_coach
from app.services.backup_manager import auto_dump
from app.services.progress_service import get_or_create_progress, progress_out, question_summary
from app.services.spaced_repetition import next_review_interval

router = APIRouter(prefix="/api/questions", tags=["questions"])


def _question(session: Session, slug: str) -> Question:
    question = session.get(Question, slug)
    if question is None:
        raise HTTPException(404, f"unknown question {slug!r}")
    return question


def _content(question: Question) -> dict:
    if question.content is None:
        raise HTTPException(409, f"{question.title} has no deep content yet")
    return question.content


@router.get("/{slug}", response_model=QuestionDetail)
def get_question(slug: str, session: Session = Depends(get_session)):
    question = _question(session, slug)
    now = utcnow()
    ordered = session.scalars(select(Question.slug).order_by(Question.world_id, Question.position)).all()
    idx = ordered.index(slug)
    pitch = session.get(PitchNote, slug)
    drafts = {d.target: d.code for d in session.scalars(select(Draft).where(Draft.question_slug == slug))}
    summary = question_summary(question, session.get(Progress, slug), now)
    world = session.get(World, question.world_id)
    return QuestionDetail(
        **summary.model_dump(),
        world_name=world.name,
        world_total=len(world.questions),
        content=question.content,
        pitch=PitchOut.model_validate(pitch, from_attributes=True) if pitch else PitchOut(),
        drafts=drafts,
        prev_slug=ordered[idx - 1] if idx > 0 else None,
        next_slug=ordered[idx + 1] if idx + 1 < len(ordered) else None,
    )


def _target_spec(content: dict, target: str) -> tuple[dict, list[dict], str, int]:
    """Returns (function spec, tests, reference solution, default trace index) for a target."""
    if target == "main":
        return content["function"], content["tests"], content["solution"]["code"], content["visualize_test"]
    i = int(target.split(":")[1])
    drills = content.get("drills", [])
    if i >= len(drills):
        raise HTTPException(404, f"drill {i} does not exist")
    d = drills[i]
    return d["function"], d["tests"], d["solution"], 0


def _save_draft(session: Session, slug: str, target: str, code: str) -> None:
    draft = session.get(Draft, (slug, target)) or Draft(question_slug=slug, target=target)
    draft.code = code
    session.add(draft)


@router.post("/{slug}/run", response_model=RunOut)
def run_code(slug: str, body: RunIn, session: Session = Depends(get_session)):
    question = _question(session, slug)
    content = _content(question)
    spec, tests, reference, default_trace = _target_spec(content, body.target)
    runner_type = question.runner_type or content.get("runner_type", "python_trace")

    if body.custom_args is not None:
        # Custom input: get the expected output by running the reference solution first.
        ref = dispatch_run(
            runner_type=runner_type,
            code=reference,
            content=content,
            spec=spec,
            tests=[{"args": body.custom_args, "expected": None}],
            reference_code=reference,
            visualize=False,
        )
        first = ref["results"][0] if ref["results"] else None
        if ref.get("compile_error") or first is None or first["error"]:
            err = (first or {}).get("error") or ref.get("compile_error") or {}
            raise HTTPException(400, f"invalid custom input: {err.get('message', 'reference solution failed')}")
        tests = [{"args": body.custom_args, "expected": first["actual"]}]
        trace_index = 0
    else:
        trace_index = body.trace_test_index if body.trace_test_index is not None else default_trace

    result = dispatch_run(
        runner_type=runner_type,
        code=body.code,
        content=content,
        spec=spec,
        tests=tests,
        reference_code=reference,
        trace_test_index=trace_index,
        visualize=body.visualize,
    )
    results = result["results"]
    passed_count = sum(r["passed"] for r in results)
    passed = result["compile_error"] is None and passed_count == len(results) and bool(results)

    _save_draft(session, slug, body.target, body.code)
    progress = get_or_create_progress(session, slug)
    if body.custom_args is None:
        session.add(Submission(
            question_slug=slug, target=body.target, language=body.language, code=body.code,
            passed=passed, passed_count=passed_count, total_count=len(results),
        ))
        if body.target == "main":
            if getattr(progress, "first_try_pass", None) is None and not progress.solved:
                progress.first_try_pass = passed and (progress.attempts or 0) == 0
            progress.attempts = (progress.attempts or 0) + 1
            if passed:
                now = utcnow()
                if not progress.solved:
                    progress.solved_at = now
                progress.solved = True
                progress.last_practiced_at = now
        elif passed:
            i = int(body.target.split(":")[1])
            progress.drills_passed = sorted(set(progress.drills_passed or []) | {i})
    session.commit()
    auto_dump(session)

    return RunOut(
        target=body.target, passed=passed, passed_count=passed_count, total_count=len(results),
        compile_error=result["compile_error"], fatal_error=result.get("fatal_error"),
        results=results, trace=result["trace"], progress=progress_out(progress),
        custom=body.custom_args is not None,
    )


@router.put("/{slug}/draft", status_code=204)
def save_draft(slug: str, body: DraftIn, session: Session = Depends(get_session)):
    _question(session, slug)
    _save_draft(session, slug, body.target, body.code)
    session.commit()


@router.patch("/{slug}/progress", response_model=ProgressOut)
def patch_progress(slug: str, body: ProgressPatch, session: Session = Depends(get_session)):
    _question(session, slug)
    progress = get_or_create_progress(session, slug)
    for field, value in body.model_dump(exclude_none=True).items():
        if field == "hints_used":
            value = max(progress.hints_used or 0, value)
        setattr(progress, field, value)
    session.commit()
    auto_dump(session)
    return progress_out(progress)


@router.post("/{slug}/confidence", response_model=ProgressOut)
def rate_confidence(slug: str, body: ConfidenceIn, session: Session = Depends(get_session)):
    _question(session, slug)
    progress = get_or_create_progress(session, slug)
    if not (progress.solved or progress.studied_solution):
        raise HTTPException(409, "solve the question (or study the solution) before rating it")
    is_review = progress.confidence is not None
    if is_review:
        progress.review_count = (progress.review_count or 0) + 1
    now = utcnow()
    progress.confidence = body.confidence
    progress.last_practiced_at = now
    progress.next_review_at = now + next_review_interval(body.confidence, progress.review_count or 0)
    session.commit()
    auto_dump(session)
    return progress_out(progress)


@router.put("/{slug}/pitch", response_model=PitchOut)
def save_pitch(slug: str, body: PitchIn, session: Session = Depends(get_session)):
    _question(session, slug)
    pitch = session.get(PitchNote, slug) or PitchNote(question_slug=slug)
    for field, value in body.model_dump().items():
        setattr(pitch, field, value)
    session.add(pitch)
    session.commit()
    auto_dump(session)
    return PitchOut.model_validate(pitch, from_attributes=True)


def _latest_main_code(session: Session, slug: str) -> str:
    """The learner's most recent passing solution, else their latest draft."""
    passing = session.scalars(
        select(Submission)
        .where(Submission.question_slug == slug, Submission.target == "main", Submission.passed)
        .order_by(Submission.created_at.desc())
    ).first()
    if passing:
        return passing.code
    draft = session.get(Draft, (slug, "main"))
    return draft.code if draft else ""


def _first_failure(content: dict, code: str) -> str:
    """One-paragraph summary of how the learner's code currently does on the tests."""
    if not code.strip():
        return "The learner hasn't written any code yet."
    result = run_python(code, content["function"], content["tests"])
    if result.get("compile_error"):
        e = result["compile_error"]
        return f"It doesn't compile: {e['type']} on line {e.get('line')}: {e['message']}"
    if result.get("fatal_error"):
        return f"It crashed: {result['fatal_error']['message']}"
    for r in result["results"]:
        if not r["passed"]:
            args = content["tests"][r["index"]]["args"]
            if r["error"]:
                return (f"Test {r['index'] + 1} with input {args} raised {r['error']['type']} "
                        f"on line {r['error'].get('line')}: {r['error']['message']}")
            return f"Test {r['index'] + 1} with input {args}: expected {r['expected']}, got {r['actual']}."
    return f"All {len(result['results'])} tests pass. The learner wants to understand or improve it."


@router.post("/{slug}/ask-coach", response_model=CoachOut)
def ask_coach(slug: str, body: CoachIn, session: Session = Depends(get_session)):
    question = _question(session, slug)
    content = _content(question)
    out = CoachOut(enabled=ai_coach.provider() is not None,
                   fallback_hints=content["hints"], fallback_script=content["pitch_script"])
    if not out.enabled:
        return out
    try:
        if body.mode == "hint":
            prompt = ai_coach.hint_prompt(content, question.title, body.code, _first_failure(content, body.code))
            out.reply = ai_coach.ask(ai_coach.HINT_SYSTEM, prompt)
        else:
            pitch = (body.pitch or PitchIn()).model_dump()
            code = _latest_main_code(session, slug) or body.code
            out.reply = ai_coach.ask(ai_coach.PITCH_SYSTEM, ai_coach.pitch_prompt(content, question.title, code, pitch))
    except ai_coach.CoachError as exc:
        out.error = str(exc)
    return out

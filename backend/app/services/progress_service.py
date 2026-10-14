from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Progress, Question, utcnow
from app.schemas import ProgressOut, QuestionSummary
from app.services.spaced_repetition import rust_level


def leetcode_url(question: Question) -> str:
    return f"https://leetcode.com/problems/{question.slug}/"


def get_or_create_progress(session: Session, slug: str) -> Progress:
    progress = session.get(Progress, slug)
    if progress is None:
        progress = Progress(question_slug=slug, drills_passed=[])
        session.add(progress)
    return progress


def progress_out(progress: Progress | None, now: datetime | None = None) -> ProgressOut:
    if progress is None:
        return ProgressOut()
    now = now or utcnow()
    if progress.next_review_at is not None and progress.next_review_at <= now:
        status = "review_due"
    elif progress.solved:
        status = "solved"
    elif progress.concept_done or progress.drills_passed or progress.attempts:
        status = "in_progress"
    else:
        status = "new"
    return ProgressOut(
        concept_done=progress.concept_done,
        quiz_passed=progress.quiz_passed,
        drills_passed=sorted(progress.drills_passed or []),
        solved=progress.solved,
        studied_solution=progress.studied_solution,
        solved_at=progress.solved_at,
        attempts=progress.attempts,
        hints_used=progress.hints_used,
        confidence=progress.confidence,
        review_count=progress.review_count,
        last_practiced_at=progress.last_practiced_at,
        next_review_at=progress.next_review_at,
        status=status,
        rust=rust_level(progress.last_practiced_at, now) if progress.solved else None,
    )


def question_summary(question: Question, progress: Progress | None, now: datetime) -> QuestionSummary:
    return QuestionSummary(
        slug=question.slug,
        lc=question.lc,
        title=question.title,
        difficulty=question.difficulty,
        world_id=question.world_id,
        position=question.position,
        visualizer=question.visualizer,
        patterns=question.patterns,
        has_content=question.content is not None,
        leetcode_url=leetcode_url(question),
        progress=progress_out(progress, now),
    )

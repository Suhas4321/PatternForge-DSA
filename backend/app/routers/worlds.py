from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db import get_session
from app.models import Draft, PitchNote, Progress, Question, Submission, World, utcnow
from app.schemas import (
    CheatSheetOut,
    CheatSheetPattern,
    CheatSheetSolved,
    PitchOut,
    ReviewItem,
    ReviewOut,
    WorldOut,
)
from app.services import ai_coach
from app.services.progress_service import question_summary
from app.services.spaced_repetition import rust_level

router = APIRouter(prefix="/api", tags=["worlds"])


@router.get("/worlds", response_model=list[WorldOut])
def list_worlds(citadel_id: str | None = None, session: Session = Depends(get_session)):
    now = utcnow()
    stmt = select(World).options(selectinload(World.questions)).order_by(World.id)
    if citadel_id:
        stmt = stmt.where(World.citadel_id == citadel_id)
    worlds = session.scalars(stmt).all()
    progress = {p.question_slug: p for p in session.scalars(select(Progress))}

    out = []
    for w in worlds:
        summaries = [question_summary(q, progress.get(q.slug), now) for q in w.questions]
        practiced = [
            progress[q.slug].last_practiced_at
            for q in w.questions
            if q.slug in progress and progress[q.slug].solved and progress[q.slug].last_practiced_at
        ]
        last = max(practiced) if practiced else None
        out.append(
            WorldOut(
                id=w.id, slug=w.slug, citadel_id=w.citadel_id, status=getattr(w, "status", "live"),
                name=w.name, tagline=w.tagline, core_idea=w.core_idea,
                triggers=w.triggers,
                total=len(summaries),
                with_content=sum(s.has_content for s in summaries),
                solved=sum(s.progress.solved for s in summaries),
                due=sum(s.progress.status == "review_due" for s in summaries),
                rust=rust_level(last, now),
                last_practiced_at=last,
                questions=summaries,
            )
        )
    return out


@router.get("/review", response_model=ReviewOut)
def review_queue(session: Session = Depends(get_session)):
    now = utcnow()
    rows = session.execute(
        select(Progress, Question, World)
        .join(Question, Question.slug == Progress.question_slug)
        .join(World, World.id == Question.world_id)
        .where(Progress.next_review_at.is_not(None))
        .order_by(Progress.next_review_at)
    ).all()

    due, upcoming = [], []
    for p, q, w in rows:
        item = ReviewItem(
            slug=q.slug, lc=q.lc, title=q.title, difficulty=q.difficulty, world_id=w.id,
            world_name=w.name, confidence=p.confidence, next_review_at=p.next_review_at,
            overdue_days=round((now - p.next_review_at).total_seconds() / 86400, 1),
        )
        (due if p.next_review_at <= now else upcoming).append(item)

    rusting = [
        {"world_id": w.id, "world_name": w.name, "rust": w.rust, "last_practiced_at": w.last_practiced_at}
        for w in list_worlds(citadel_id=None, session=session)
        if w.rust in ("dusty", "rusting", "rusted")
    ]
    return ReviewOut(due=due, upcoming=upcoming[:10], rusting_worlds=rusting)


@router.get("/worlds/{world_id}/cheatsheet", response_model=CheatSheetOut)
def world_cheatsheet(world_id: int, session: Session = Depends(get_session)):
    """10-minute revision sheet: every pattern's triggers and complexity, plus the learner's own
    pitches and working code for each question they've solved or studied."""
    world = session.get(World, world_id)
    if world is None:
        raise HTTPException(404, f"unknown world {world_id}")
    patterns, solved = [], []
    for q in world.questions:
        if q.content is None:
            continue
        c = q.content
        patterns.append(CheatSheetPattern(
            slug=q.slug, lc=q.lc, title=q.title, difficulty=q.difficulty, patterns=q.patterns,
            trigger_keywords=c["statement"]["trigger_keywords"], key_insight=c["concept"]["key_insight"],
            time=c["solution"]["time"], space=c["solution"]["space"],
        ))
        progress = session.get(Progress, q.slug)
        if not progress or not (progress.solved or progress.studied_solution):
            continue
        passing = session.scalars(
            select(Submission)
            .where(Submission.question_slug == q.slug, Submission.target == "main", Submission.passed)
            .order_by(Submission.created_at.desc())
        ).first()
        draft = session.get(Draft, (q.slug, "main"))
        if passing:
            code, source = passing.code, "passing_submission"
        elif draft and draft.code.strip():
            code, source = draft.code, "draft"
        else:
            code, source = c["solution"]["code"], "reference"
        pitch = session.get(PitchNote, q.slug)
        solved.append(CheatSheetSolved(
            slug=q.slug, lc=q.lc, title=q.title, difficulty=q.difficulty, confidence=progress.confidence,
            pitch=PitchOut.model_validate(pitch, from_attributes=True) if pitch else PitchOut(),
            code=code, code_source=source, time=c["solution"]["time"], space=c["solution"]["space"],
        ))
    return CheatSheetOut(
        world_id=world.id, name=world.name, tagline=world.tagline, core_idea=world.core_idea,
        triggers=world.triggers, patterns=patterns, solved=solved,
    )


@router.get("/coach/status")
def coach_status():
    return ai_coach.status()


@router.get("/activity")
def activity(days: int = 371, session: Session = Depends(get_session)):
    """Every code run in the last `days` days (UTC timestamps), for streaks and the heatmap.
    The client buckets them by its own local date."""
    since = utcnow() - timedelta(days=days)
    rows = session.execute(
        select(Submission.created_at, Submission.target, Submission.passed, Submission.question_slug)
        .where(Submission.created_at >= since)
        .order_by(Submission.created_at)
    ).all()
    return {
        "events": [
            {"t": t.isoformat() + "Z", "kind": "solve" if target == "main" else "drill", "passed": passed, "slug": slug}
            for t, target, passed, slug in rows
        ]
    }

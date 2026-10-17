from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def utcnow() -> datetime:
    """Naive UTC timestamp (SQLite has no timezone support, so we store naive UTC everywhere)."""
    return datetime.now(UTC).replace(tzinfo=None)


class World(Base):
    __tablename__ = "worlds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True)
    citadel_id: Mapped[str] = mapped_column(String(32), default="dsa")
    status: Mapped[str] = mapped_column(String(32), default="live")
    name: Mapped[str] = mapped_column(String(128))
    tagline: Mapped[str] = mapped_column(Text, default="")
    core_idea: Mapped[str] = mapped_column(Text, default="")
    triggers: Mapped[list] = mapped_column(JSON, default=list)

    questions: Mapped[list["Question"]] = relationship(
        back_populates="world", order_by="Question.position"
    )


class Question(Base):
    __tablename__ = "questions"

    slug: Mapped[str] = mapped_column(String(128), primary_key=True)
    lc: Mapped[int] = mapped_column(Integer, index=True)
    title: Mapped[str] = mapped_column(String(256))
    difficulty: Mapped[str] = mapped_column(String(16))
    world_id: Mapped[int] = mapped_column(ForeignKey("worlds.id"))
    position: Mapped[int] = mapped_column(Integer)
    citadel_id: Mapped[str] = mapped_column(String(32), default="dsa")
    brick_layer: Mapped[int] = mapped_column(Integer, default=1)
    runner_type: Mapped[str] = mapped_column(String(32), default="python_trace")
    visualizer: Mapped[str] = mapped_column(String(32))
    patterns: Mapped[list] = mapped_column(JSON, default=list)
    # Deep content (statement, drills, tests, hints, ...). Null until the world is seeded.
    content: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    world: Mapped[World] = relationship(back_populates="questions")


class Progress(Base):
    __tablename__ = "progress"

    question_slug: Mapped[str] = mapped_column(ForeignKey("questions.slug"), primary_key=True)
    concept_done: Mapped[bool] = mapped_column(Boolean, default=False)
    quiz_passed: Mapped[bool] = mapped_column(Boolean, default=False)
    drills_passed: Mapped[list] = mapped_column(JSON, default=list)
    solved: Mapped[bool] = mapped_column(Boolean, default=False)
    studied_solution: Mapped[bool] = mapped_column(Boolean, default=False)
    solved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    hints_used: Mapped[int] = mapped_column(Integer, default=0)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    first_try_pass: Mapped[bool | None] = mapped_column(Boolean, nullable=True, default=None)
    time_spent_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    last_practiced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    next_review_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class PitchNote(Base):
    __tablename__ = "pitch_notes"

    question_slug: Mapped[str] = mapped_column(ForeignKey("questions.slug"), primary_key=True)
    brute_force: Mapped[str] = mapped_column(Text, default="")
    trigger: Mapped[str] = mapped_column(Text, default="")
    intuition: Mapped[str] = mapped_column(Text, default="")
    complexity: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class Draft(Base):
    """Latest code the user typed for a target ('main' or 'drill:<n>')."""

    __tablename__ = "drafts"

    question_slug: Mapped[str] = mapped_column(ForeignKey("questions.slug"), primary_key=True)
    target: Mapped[str] = mapped_column(String(32), primary_key=True)
    language: Mapped[str] = mapped_column(String(16), default="python")
    code: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    question_slug: Mapped[str] = mapped_column(ForeignKey("questions.slug"), index=True)
    target: Mapped[str] = mapped_column(String(32))
    language: Mapped[str] = mapped_column(String(16), default="python")
    code: Mapped[str] = mapped_column(Text)
    passed: Mapped[bool] = mapped_column(Boolean)
    passed_count: Mapped[int] = mapped_column(Integer)
    total_count: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

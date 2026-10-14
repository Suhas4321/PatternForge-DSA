"""Loads content/curriculum.json and per-question YAML content files into the database.

Content files in git are the source of truth for the curriculum; the DB copy is refreshed on
every startup, so editing a YAML file and restarting the backend is all it takes to update a
question.
"""

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path

import yaml
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.content_schema import QuestionContent
from app.models import Question, World

log = logging.getLogger(__name__)


def world_dir_name(world_id: int, world_slug: str) -> str:
    return f"{world_id:02d}-{world_slug}"


def content_path(content_dir: Path, world_id: int, world_slug: str, slug: str) -> Path:
    return content_dir / "questions" / world_dir_name(world_id, world_slug) / f"{slug}.yaml"


def load_curriculum(content_dir: Path) -> dict:
    return json.loads((content_dir / "curriculum.json").read_text())


def read_question_content(path: Path, slug: str, lc: int) -> QuestionContent:
    try:
        data = yaml.safe_load(path.read_text())
    except yaml.YAMLError as exc:
        raise ValueError(f"{path.name}: invalid YAML: {exc}") from exc
    content = QuestionContent.model_validate(data)
    if content.slug != slug or content.lc != lc:
        raise ValueError(f"{path}: slug/lc mismatch with curriculum ({content.slug}/{content.lc})")
    return content


@dataclass
class LoadReport:
    worlds: int = 0
    questions: int = 0
    with_content: int = 0
    errors: list[str] = field(default_factory=list)


def sync_content(session: Session, content_dir: Path) -> LoadReport:
    report = LoadReport()
    curriculum = load_curriculum(content_dir)

    for w in curriculum["worlds"]:
        world = session.get(World, w["id"]) or World(id=w["id"])
        world.slug = w["slug"]
        world.name = w["name"]
        world.tagline = w["tagline"]
        world.core_idea = w["core_idea"]
        world.triggers = w["triggers"]
        session.add(world)
        report.worlds += 1

        for position, q in enumerate(w["questions"]):
            question = session.get(Question, q["slug"]) or Question(slug=q["slug"])
            question.lc = q["lc"]
            question.title = q["title"]
            question.difficulty = q["difficulty"]
            question.world_id = w["id"]
            question.position = position
            question.visualizer = q["visualizer"]
            question.patterns = q["patterns"]

            path = content_path(content_dir, w["id"], w["slug"], q["slug"])
            question.content = None
            if path.exists():
                try:
                    question.content = read_question_content(path, q["slug"], q["lc"]).model_dump()
                    report.with_content += 1
                except (ValidationError, ValueError) as exc:
                    report.errors.append(f"{path.relative_to(content_dir)}: {exc}")
            session.add(question)
            report.questions += 1

    session.commit()
    for err in report.errors:
        log.error("content error: %s", err)
    log.info(
        "content synced: %d worlds, %d questions, %d with deep content",
        report.worlds, report.questions, report.with_content,
    )
    return report

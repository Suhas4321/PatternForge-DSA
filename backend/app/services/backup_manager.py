"""Dump / restore of user data (progress, pitch notes, drafts, submissions) as JSON.

The curriculum itself lives in content/ (in git), so a backup only needs what *you* created.
Auto-dump runs after every write so a paused Supabase project or a deleted SQLite file never
loses data. Restore replaces all user data with the dump's contents.
"""

import json
import logging
import os
import tempfile
from datetime import datetime
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Draft, PitchNote, Progress, Question, Submission, utcnow

log = logging.getLogger(__name__)

BACKUP_FILE = "user_data.json"
FORMAT_VERSION = 1
USER_TABLES = {
    "progress": Progress,
    "pitch_notes": PitchNote,
    "drafts": Draft,
    "submissions": Submission,
}


def _row_to_dict(row) -> dict:
    out = {}
    for col in row.__table__.columns:
        value = getattr(row, col.name)
        out[col.name] = value.isoformat() if isinstance(value, datetime) else value
    return out


def _dict_to_row(model, data: dict):
    kwargs = {}
    for col in model.__table__.columns:
        if col.name not in data:
            continue
        value = data[col.name]
        if value is not None and col.type.python_type is datetime:
            value = datetime.fromisoformat(value)
        kwargs[col.name] = value
    return model(**kwargs)


MAX_BACKUP_SUBMISSIONS = 500


def export_user_data(session: Session) -> dict:
    tables_out: dict[str, list[dict]] = {}
    for name, model in USER_TABLES.items():
        if name == "submissions":
            # Keep the most recent submissions plus at least all passing submissions up to MAX_BACKUP_SUBMISSIONS
            stmt = select(Submission).order_by(Submission.id.desc()).limit(MAX_BACKUP_SUBMISSIONS)
            rows = list(reversed(session.scalars(stmt).all()))
            tables_out[name] = [_row_to_dict(r) for r in rows]
        else:
            tables_out[name] = [_row_to_dict(r) for r in session.scalars(select(model))]
    return {
        "format_version": FORMAT_VERSION,
        "exported_at": utcnow().isoformat(),
        "tables": tables_out,
    }


def backup_path(backup_dir: Path | None = None) -> Path:
    return (backup_dir or settings.backup_dir) / BACKUP_FILE


def dump_to_file(session: Session, backup_dir: Path | None = None) -> Path:
    path = backup_path(backup_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    data = export_user_data(session)
    # Write atomically so a crash mid-write never corrupts the last good backup.
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".user_data.", suffix=".tmp")
    with os.fdopen(fd, "w") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp, path)
    return path


def auto_dump(session: Session) -> None:
    if not settings.auto_backup:
        return
    try:
        dump_to_file(session)
    except OSError:
        log.exception("auto-backup failed")


def import_user_data(session: Session, data: dict) -> dict[str, int]:
    if data.get("format_version") != FORMAT_VERSION:
        raise ValueError(f"unsupported backup format_version {data.get('format_version')!r}")
    tables = data.get("tables", {})
    known_slugs = set(session.scalars(select(Question.slug)))

    counts: dict[str, int] = {}
    # Delete children first (all reference questions only, so order among them doesn't matter).
    for model in USER_TABLES.values():
        session.execute(delete(model))
    for name, model in USER_TABLES.items():
        rows = [r for r in tables.get(name, []) if r.get("question_slug") in known_slugs]
        for r in rows:
            session.add(_dict_to_row(model, r))
        counts[name] = len(rows)
    session.commit()
    return counts


def restore_from_file(session: Session, backup_dir: Path | None = None) -> dict[str, int]:
    path = backup_path(backup_dir)
    if not path.exists():
        raise FileNotFoundError(str(path))
    return import_user_data(session, json.loads(path.read_text()))

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_session
from app.services import backup_manager

router = APIRouter(prefix="/api/backup", tags=["backup"])


@router.get("/status")
def backup_status():
    path = backup_manager.backup_path()
    if not path.exists():
        return {"path": str(path), "exists": False, "modified_at": None, "size_bytes": 0}
    stat = path.stat()
    return {
        "path": str(path),
        "exists": True,
        "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="seconds"),
        "size_bytes": stat.st_size,
    }


@router.post("/dump")
def dump(session: Session = Depends(get_session)):
    path = backup_manager.dump_to_file(session)
    return {"path": str(path), **backup_status()}


@router.post("/restore")
def restore(session: Session = Depends(get_session)):
    try:
        counts = backup_manager.restore_from_file(session)
    except FileNotFoundError as exc:
        raise HTTPException(404, f"no backup file at {exc}") from exc
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return {"restored": counts}

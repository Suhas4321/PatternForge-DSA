import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select

from app.config import PROJECT_DIR, settings
from app.db import Base, SessionLocal, engine
from app.models import Progress
from app.routers import backup, playground, questions, stats, worlds
from app.services import backup_manager
from app.services.content_loader import sync_content

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("patternforge")

FRONTEND_DIST = PROJECT_DIR / "frontend" / "dist"


def startup() -> None:
    Base.metadata.create_all(engine)
    try:
        with engine.connect() as conn:
            cursor = conn.exec_driver_sql("PRAGMA table_info(progress)")
            cols = {row[1] for row in cursor.fetchall()}
            if "first_try_pass" not in cols:
                conn.exec_driver_sql("ALTER TABLE progress ADD COLUMN first_try_pass BOOLEAN")
            if "time_spent_seconds" not in cols:
                conn.exec_driver_sql("ALTER TABLE progress ADD COLUMN time_spent_seconds INTEGER")
            conn.commit()
    except Exception as e:
        log.warning("Column migration check: %s", e)
    with SessionLocal() as session:
        sync_content(session, settings.content_dir)
        # Fresh database (new machine, deleted SQLite file, switched to Supabase) but a backup
        # exists: bring user data back automatically. Otherwise refresh the backup.
        has_progress = session.scalar(select(func.count()).select_from(Progress)) > 0
        if not has_progress and backup_manager.backup_path().exists():
            counts = backup_manager.restore_from_file(session)
            log.info("restored user data from backup: %s", counts)
        elif has_progress:
            backup_manager.auto_dump(session)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    startup()
    yield


app = FastAPI(title="PatternForge DSA", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(worlds.router)
app.include_router(questions.router)
app.include_router(stats.router)
app.include_router(backup.router)
app.include_router(playground.router)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/content/reload")
def reload_content():
    """Re-read content/ without restarting the server (handy while editing question files)."""
    with SessionLocal() as session:
        report = sync_content(session, settings.content_dir)
    return {"worlds": report.worlds, "questions": report.questions,
            "with_content": report.with_content, "errors": report.errors}


# Serve the built frontend (npm run build) from the same server when it exists.
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(404)
        candidate = FRONTEND_DIST / path
        if path and candidate.is_file() and FRONTEND_DIST in candidate.resolve().parents:
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")

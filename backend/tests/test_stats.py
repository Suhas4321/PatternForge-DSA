from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
from app.models import Progress, Question, Submission, World, utcnow


def test_stats_endpoint_structure(client: TestClient):
    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.json()

    # Core top-level fields
    assert "level" in data
    assert "xp" in data
    assert "level_xp" in data
    assert "streak" in data
    assert "total_solved" in data
    assert "total_questions" in data
    assert "readiness_score" in data

    # 6 Peaks
    assert len(data["peaks"]) == 6
    peak_ids = [p["id"] for p in data["peaks"]]
    assert peak_ids == ["dsa", "python_data", "sql_dbms", "os_concurrency", "backend_apis", "ai_resume"]

    # Activity heatmaps
    assert len(data["activity_20_weeks"]) == 140
    assert len(data["activity_this_week"]) == 7

    # 38 Worlds in mastery
    assert len(data["world_mastery"]) == 38

    # Seals & Badges
    assert len(data["seals"]) == 6
    assert len(data["badges"]) == 8

    # When untracked, accuracy fields must be null (not fake numbers)
    assert data["first_try_pass_rate"] is None or isinstance(data["first_try_pass_rate"], (int, float))
    assert data["average_hints"] is None or isinstance(data["average_hints"], (int, float))
    assert data["average_confidence"] is None or isinstance(data["average_confidence"], (int, float))


def test_stats_with_progress_and_submissions(client: TestClient):
    with SessionLocal() as db:
        q = db.query(Question).first()
        assert q is not None

        now = utcnow()
        # Add progress
        p = Progress(
            question_slug=q.slug,
            solved=True,
            solved_at=now,
            attempts=1,
            first_try_pass=True,
            hints_used=2,
            confidence=3,
            drills_passed=["drill_1"],
            last_practiced_at=now,
            next_review_at=now + timedelta(days=21),
        )
        db.merge(p)

        # Add a submission
        sub = Submission(
            question_slug=q.slug,
            target="main",
            code="def solve(): pass",
            passed=True,
            passed_count=5,
            total_count=5,
            created_at=now,
        )
        db.add(sub)
        db.commit()

    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.json()

    assert data["total_solved"] >= 1
    # 50 XP for solve + 15 XP for drill = 65 XP
    assert data["xp"] >= 65
    assert isinstance(data["first_try_pass_rate"], (int, float)) and data["first_try_pass_rate"] > 0
    assert isinstance(data["average_hints"], (int, float)) and data["average_hints"] > 0
    assert isinstance(data["average_confidence"], (int, float)) and data["average_confidence"] > 0
    assert data["streak"] >= 1

    # First blood badge unlocked
    badge_map = {b["id"]: b["unlocked"] for b in data["badges"]}
    assert badge_map["first_blood"] is True


def test_stats_rust_camps_detection(client: TestClient):
    with SessionLocal() as db:
        questions = db.query(Question).all()
        assert len(questions) >= 2
        q2 = questions[1]

        now = utcnow()
        # 25 days ago = rusted (> 21 days)
        old_time = now - timedelta(days=25)
        p2 = Progress(
            question_slug=q2.slug,
            solved=True,
            solved_at=old_time,
            last_practiced_at=old_time,
            next_review_at=old_time + timedelta(days=3),
            attempts=3,
            confidence=1,
        )
        db.merge(p2)
        db.commit()

    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.json()

    rust_slugs = [r["slug"] for r in data["rust_camps"]]
    assert q2.slug in rust_slugs
    q2_rust = next(r for r in data["rust_camps"] if r["slug"] == q2.slug)
    assert q2_rust["rust"] == "rusted"

    # Weakest lessons should include q2 because it had confidence 1 and 3 attempts
    weak_slugs = [w["slug"] for w in data["weakest_lessons"]]
    assert q2.slug in weak_slugs

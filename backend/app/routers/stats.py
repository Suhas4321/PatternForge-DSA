"""Aggregated stats router for /stats ('Expedition Log').

Provides single-call telemetry across all peaks, worlds, spaced-repetition schedules,
accuracy metrics, activity heatmaps, seals, and achievements.
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import Progress, Question, Submission, World, utcnow
from app.services.spaced_repetition import rust_level

router = APIRouter(prefix="/api/stats", tags=["stats"])

CITADEL_CONFIG = [
    {
        "id": "dsa",
        "name": "Data Structures & Algorithms",
        "short_name": "DSA",
        "numeral": "I",
        "accent": "#6EE7B7",
        "icon": "⚔️",
        "weight": 0.30,
    },
    {
        "id": "python_data",
        "name": "Python & Data Engineering",
        "short_name": "Python",
        "numeral": "II",
        "accent": "#F2B866",
        "icon": "🐍",
        "weight": 0.15,
    },
    {
        "id": "sql_dbms",
        "name": "SQL & Storage Internals",
        "short_name": "SQL",
        "numeral": "III",
        "accent": "#67E8F9",
        "icon": "🗄️",
        "weight": 0.15,
    },
    {
        "id": "os_concurrency",
        "name": "OS & Concurrency",
        "short_name": "OS",
        "numeral": "IV",
        "accent": "#FB923C",
        "icon": "⚡",
        "weight": 0.15,
    },
    {
        "id": "backend_apis",
        "name": "FastAPI & Production Systems",
        "short_name": "Backend",
        "numeral": "V",
        "accent": "#FB7185",
        "icon": "🌐",
        "weight": 0.15,
    },
    {
        "id": "ai_resume",
        "name": "GenAI & Systems Defense",
        "short_name": "AI",
        "numeral": "VI",
        "accent": "#A78BFA",
        "icon": "🧠",
        "weight": 0.10,
    },
]


def calculate_streak(active_dates: set[str], today_str: str) -> int:
    """Calculate current consecutive-day streak.
    If active today or yesterday, count backwards. Otherwise 0.
    """
    if not active_dates:
        return 0

    today = datetime.strptime(today_str, "%Y-%m-%d").date()
    yesterday = today - timedelta(days=1)
    yesterday_str = yesterday.strftime("%Y-%m-%d")

    if today_str in active_dates:
        curr = today
    elif yesterday_str in active_dates:
        curr = yesterday
    else:
        return 0

    streak = 0
    while curr.strftime("%Y-%m-%d") in active_dates:
        streak += 1
        curr -= timedelta(days=1)
    return streak


@router.get("")
def get_stats(session: Session = Depends(get_session)):
    now = utcnow()
    today_date = now.date()
    today_str = today_date.strftime("%Y-%m-%d")

    # 1. Fetch all questions and worlds
    questions = session.execute(select(Question)).scalars().all()
    worlds = session.execute(select(World).order_by(World.id)).scalars().all()
    progress_rows = session.execute(select(Progress)).scalars().all()
    progress_by_slug = {p.question_slug: p for p in progress_rows}

    world_by_id = {w.id: w for w in worlds}
    world_by_slug = {w.slug: w for w in worlds}

    # 2. Total solved, drills, and XP calculations
    total_questions = len(questions)
    total_solved = 0
    total_drills = 0
    first_try_passes = 0
    first_try_tracked_count = 0
    hints_sum = 0
    hints_tracked_count = 0
    confidence_sum = 0
    confidence_count = 0
    rust_camps = []
    reviews_due_today = 0
    reviews_due_this_week = 0

    today_end = now + timedelta(days=1)
    week_end = now + timedelta(days=7)

    solved_per_citadel = defaultdict(int)
    total_per_citadel = defaultdict(int)
    distinct_citadels_solved = set()

    for q in questions:
        c_id = q.citadel_id or "dsa"
        total_per_citadel[c_id] += 1
        p = progress_by_slug.get(q.slug)

        if p and p.solved:
            total_solved += 1
            solved_per_citadel[c_id] += 1
            distinct_citadels_solved.add(c_id)

            # First try pass
            if p.first_try_pass is not None:
                first_try_tracked_count += 1
                if p.first_try_pass:
                    first_try_passes += 1
            elif p.attempts is not None and p.attempts > 0:
                first_try_tracked_count += 1
                if p.attempts == 1:
                    first_try_passes += 1

            # Rust check
            r_level = rust_level(p.last_practiced_at, now)
            if r_level in ("rusting", "rusted"):
                w = world_by_id.get(q.world_id)
                rust_camps.append({
                    "slug": q.slug,
                    "title": q.title,
                    "world_slug": w.slug if w else "",
                    "world_title": w.name if w else "",
                    "citadel_id": c_id,
                    "rust": r_level,
                    "box": p.review_count,
                    "next_review_at": p.next_review_at.isoformat() + "Z" if p.next_review_at else None,
                    "last_practiced_at": p.last_practiced_at.isoformat() + "Z" if p.last_practiced_at else None,
                })

            # Reviews due
            if p.next_review_at:
                if p.next_review_at <= today_end:
                    reviews_due_today += 1
                if p.next_review_at <= week_end:
                    reviews_due_this_week += 1

        if p:
            if p.drills_passed:
                total_drills += len(p.drills_passed)

            # Hints used
            if p.hints_used is not None and p.hints_used > 0:
                hints_sum += p.hints_used
                hints_tracked_count += 1

            # Confidence rating
            if p.confidence is not None and p.confidence > 0:
                confidence_sum += p.confidence
                confidence_count += 1

    # Total XP: 50 XP per solved lesson, 15 XP per drill
    total_xp = (total_solved * 50) + (total_drills * 15)
    level = max(1, (total_xp // 100) + 1)
    level_xp = total_xp % 100

    # 3. Accuracy metrics (None if untracked, prompting 'Tracking starts today')
    first_try_pass_rate = (
        round((first_try_passes / first_try_tracked_count) * 100, 1)
        if first_try_tracked_count > 0
        else None
    )
    average_hints = (
        round(hints_sum / hints_tracked_count, 1)
        if hints_tracked_count > 0
        else None
    )
    average_confidence = (
        round(confidence_sum / confidence_count, 1)
        if confidence_count > 0
        else None
    )

    # 4. Peaks summary & Readiness Score
    peaks_data = []
    base_readiness = 0.0

    for cfg in CITADEL_CONFIG:
        cid = cfg["id"]
        c_solved = solved_per_citadel[cid]
        c_total = total_per_citadel[cid]
        mastery = round((c_solved / c_total * 100), 1) if c_total > 0 else 0.0
        base_readiness += mastery * cfg["weight"]

        peaks_data.append({
            "id": cid,
            "name": cfg["name"],
            "short_name": cfg["short_name"],
            "numeral": cfg["numeral"],
            "accent": cfg["accent"],
            "icon": cfg["icon"],
            "solved": c_solved,
            "total": c_total,
            "mastery": mastery,
        })

    # READINESS SCORE FORMULA:
    # Weighted base mastery across 6 citadels:
    # DSA (30%), Python (15%), SQL (15%), OS (15%), Backend (15%), GenAI (10%).
    # Multiplied by confidence scaling factor (0.85x to 1.1x when rated).
    # Rust penalty: -2 points per rusting question, -4 points per rusted question (max -20).
    # Clamped between 0 and 100.
    conf_factor = 1.0
    if average_confidence is not None:
        conf_factor = 0.85 + (average_confidence - 1.0) * 0.125  # 1.0 -> 0.85, 2.0 -> 0.975, 3.0 -> 1.10

    rust_penalty = 0
    for r in rust_camps:
        rust_penalty += 4 if r["rust"] == "rusted" else 2
    rust_penalty = min(20, rust_penalty)

    readiness_score = int(max(0, min(100, round((base_readiness * conf_factor) - rust_penalty))))

    # 5. Weakest Lessons (up to 5)
    # Ranked by: un-solved with attempts > 0 first, then lowest confidence, then most attempts
    attempted_candidates = []
    for q in questions:
        p = progress_by_slug.get(q.slug)
        if not p or (p.attempts == 0 and not p.studied_solution and p.confidence is None):
            continue

        w = world_by_id.get(q.world_id)
        # Score priority (lower score = weaker)
        # un-solved with attempts -> score = 0 + (1 / attempts)
        # confidence 1 -> score = 10 + attempts
        # confidence 2 -> score = 20 + attempts
        # confidence 3 -> score = 30 + attempts
        if not p.solved:
            urgency = 0 - (p.attempts or 1)
        else:
            conf = p.confidence or 2
            urgency = (conf * 10) - (p.attempts or 0)

        attempted_candidates.append({
            "slug": q.slug,
            "title": q.title,
            "world_slug": w.slug if w else "",
            "world_title": w.name if w else "",
            "citadel_id": q.citadel_id or "dsa",
            "confidence": p.confidence,
            "attempts": p.attempts or 0,
            "solved": bool(p.solved),
            "_urgency": urgency,
        })

    attempted_candidates.sort(key=lambda x: x["_urgency"])
    weakest_lessons = [
        {
            "slug": c["slug"],
            "title": c["title"],
            "world_slug": c["world_slug"],
            "world_title": c["world_title"],
            "citadel_id": c["citadel_id"],
            "confidence": c["confidence"],
            "attempts": c["attempts"],
            "solved": c["solved"],
        }
        for c in attempted_candidates[:5]
    ]

    # 6. Activity for past 20 weeks (140 days) & this week (7 days) + Streak
    submissions = session.execute(
        select(Submission.id, Submission.created_at, Submission.passed, Submission.target, Submission.question_slug, Submission.passed_count, Submission.total_count)
        .order_by(desc(Submission.created_at))
    ).all()

    # Collect submission counts per day
    day_counts = defaultdict(int)
    active_dates = set()

    # Also count progress practiced/solved timestamps
    for p in progress_rows:
        if p.last_practiced_at:
            d_str = p.last_practiced_at.strftime("%Y-%m-%d")
            active_dates.add(d_str)
        if p.solved_at:
            d_str = p.solved_at.strftime("%Y-%m-%d")
            active_dates.add(d_str)

    for sub_id, created_at, passed, target, qslug, p_count, t_count in submissions:
        d_str = created_at.strftime("%Y-%m-%d")
        day_counts[d_str] += 1
        active_dates.add(d_str)

    streak = calculate_streak(active_dates, today_str)

    # 140 days heatmap (20 weeks)
    activity_20_weeks = []
    start_date = today_date - timedelta(days=139)
    for i in range(140):
        curr_d = start_date + timedelta(days=i)
        d_str = curr_d.strftime("%Y-%m-%d")
        count = day_counts[d_str]
        # Level 0..4 shading
        if count == 0:
            lvl = 0
        elif count <= 2:
            lvl = 1
        elif count <= 5:
            lvl = 2
        elif count <= 8:
            lvl = 3
        else:
            lvl = 4

        activity_20_weeks.append({
            "date": d_str,
            "count": count,
            "level": lvl,
        })

    # Last 7 days activity
    activity_this_week = []
    week_start_date = today_date - timedelta(days=6)
    for i in range(7):
        curr_d = week_start_date + timedelta(days=i)
        d_str = curr_d.strftime("%Y-%m-%d")
        activity_this_week.append({
            "day": curr_d.strftime("%a"),
            "date": d_str,
            "count": day_counts[d_str],
        })

    # 7. World mastery breakdown
    questions_per_world = defaultdict(list)
    for q in questions:
        questions_per_world[q.world_id].append(q)

    world_mastery = []
    for w in worlds:
        w_qs = questions_per_world.get(w.id, [])
        w_total = len(w_qs)
        w_solved = sum(1 for q in w_qs if progress_by_slug.get(q.slug) and progress_by_slug[q.slug].solved)
        w_mastery = round((w_solved / w_total * 100), 1) if w_total > 0 else 0.0
        world_mastery.append({
            "slug": w.slug,
            "order": w.id,
            "title": w.name,
            "citadel_id": w.citadel_id or "dsa",
            "solved": w_solved,
            "total": w_total,
            "mastery": w_mastery,
        })

    # 8. Recent timeline (last 15 submission events)
    recent_timeline = []
    question_by_slug = {q.slug: q for q in questions}
    for sub_id, created_at, passed, target, qslug, p_count, t_count in submissions[:15]:
        q = question_by_slug.get(qslug)
        recent_timeline.append({
            "id": sub_id,
            "question_slug": qslug,
            "question_title": q.title if q else qslug,
            "target": target,
            "passed": passed,
            "passed_count": p_count,
            "total_count": t_count,
            "created_at": created_at.isoformat() + "Z",
        })

    # 9. Seals (6 Citadel masteries)
    seals = []
    for cfg in CITADEL_CONFIG:
        cid = cfg["id"]
        c_solved = solved_per_citadel[cid]
        c_total = total_per_citadel[cid]
        is_unlocked = c_solved >= c_total and c_total > 0
        seals.append({
            "citadel_id": cid,
            "numeral": cfg["numeral"],
            "name": cfg["name"],
            "accent": cfg["accent"],
            "unlocked": is_unlocked,
            "solved": c_solved,
            "total": c_total,
        })

    # 10. Badges (8 achievements)
    badges = [
        {
            "id": "first_blood",
            "title": "First Summit",
            "description": "Solve your first lesson anywhere in the Citadels.",
            "icon": "🚩",
            "unlocked": total_solved >= 1,
        },
        {
            "id": "streak_3",
            "title": "Flame Keeper",
            "description": "Maintain a 3-day active practice streak.",
            "icon": "🔥",
            "unlocked": streak >= 3,
        },
        {
            "id": "streak_7",
            "title": "Unstoppable",
            "description": "Maintain a 7-day active practice streak.",
            "icon": "⚡",
            "unlocked": streak >= 7,
        },
        {
            "id": "drill_master",
            "title": "Drill Sergeant",
            "description": "Pass 10 code and concept drills.",
            "icon": "🎯",
            "unlocked": total_drills >= 10,
        },
        {
            "id": "polymath",
            "title": "Polymath",
            "description": "Solve at least one lesson across 3 different Peaks.",
            "icon": "🌐",
            "unlocked": len(distinct_citadels_solved) >= 3,
        },
        {
            "id": "perfectionist",
            "title": "Flawless Ascent",
            "description": "Solve 5 lessons on your very first try.",
            "icon": "💎",
            "unlocked": first_try_passes >= 5,
        },
        {
            "id": "rust_buster",
            "title": "Rust Buster",
            "description": "Complete a spaced-repetition review on an oxidised camp.",
            "icon": "🛡️",
            "unlocked": any(p.review_count > 0 for p in progress_rows),
        },
        {
            "id": "grandmaster",
            "title": "Grand Explorer",
            "description": "Achieve a Readiness Score of 50 or higher.",
            "icon": "👑",
            "unlocked": readiness_score >= 50,
        },
    ]

    return {
        "level": level,
        "xp": total_xp,
        "level_xp": level_xp,
        "streak": streak,
        "total_solved": total_solved,
        "total_questions": total_questions,
        "readiness_score": readiness_score,
        "peaks": peaks_data,
        "first_try_pass_rate": first_try_pass_rate,
        "average_hints": average_hints,
        "average_confidence": average_confidence,
        "rust_camps": rust_camps,
        "reviews_due_today": reviews_due_today,
        "reviews_due_this_week": reviews_due_this_week,
        "weakest_lessons": weakest_lessons,
        "activity_20_weeks": activity_20_weeks,
        "activity_this_week": activity_this_week,
        "world_mastery": world_mastery,
        "recent_timeline": recent_timeline,
        "seals": seals,
        "badges": badges,
    }

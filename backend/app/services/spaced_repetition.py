"""Review scheduling and the Rust Detector.

Confidence after a solve: 1 = Struggled -> review in 3 days, 2 = Needed hints -> 7 days,
3 = Crushed it -> 21 days (then 42, 84 on later confident reviews).

Rust levels by days since last practice: fresh < 5 <= dusty < 10 <= rusting < 21 <= rusted.
"""

from datetime import datetime, timedelta

BASE_INTERVAL_DAYS = {1: 3, 2: 7, 3: 21}
RUST_THRESHOLDS = [(21, "rusted"), (10, "rusting"), (5, "dusty")]


def next_review_interval(confidence: int, review_count: int) -> timedelta:
    if confidence not in BASE_INTERVAL_DAYS:
        raise ValueError("confidence must be 1, 2 or 3")
    days = BASE_INTERVAL_DAYS[confidence]
    if confidence == 3:
        days *= 2 ** min(review_count, 2)
    return timedelta(days=days)


def rust_level(last_practiced_at: datetime | None, now: datetime) -> str | None:
    """None means never practiced (nothing to rust)."""
    if last_practiced_at is None:
        return None
    age_days = (now - last_practiced_at).total_seconds() / 86400
    for threshold, level in RUST_THRESHOLDS:
        if age_days >= threshold:
            return level
    return "fresh"

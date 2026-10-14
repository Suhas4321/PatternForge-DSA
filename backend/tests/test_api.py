import json
from datetime import timedelta

from app.services.spaced_repetition import next_review_interval, rust_level
from app.models import utcnow

SOLUTION = (
    "class Solution:\n"
    "    def twoSum(self, nums, target):\n"
    "        seen = {}\n"
    "        for i, x in enumerate(nums):\n"
    "            if target - x in seen:\n"
    "                return [seen[target - x], i]\n"
    "            seen[x] = i\n"
)


def test_worlds_index_has_all_115(client):
    worlds = client.get("/api/worlds").json()
    assert len(worlds) == 12
    assert sum(w["total"] for w in worlds) == 115
    two_sum = next(q for q in worlds[0]["questions"] if q["slug"] == "two-sum")
    assert two_sum["has_content"]
    assert two_sum["leetcode_url"] == "https://leetcode.com/problems/two-sum/"


def test_question_detail_and_neighbours(client):
    q = client.get("/api/questions/two-sum").json()
    assert q["lc"] == 1 and q["content"]["function"]["name"] == "twoSum"
    assert q["prev_slug"] == "valid-anagram" and q["next_slug"] == "majority-element"
    assert client.get("/api/questions/nope").status_code == 404


def test_question_without_content_cannot_run(client):
    from app.db import SessionLocal
    from app.models import Question

    with SessionLocal() as s:
        q = s.get(Question, "edit-distance")
        saved, q.content = q.content, None
        s.commit()
    try:
        assert client.post("/api/questions/edit-distance/run", json={"code": "x"}).status_code == 409
    finally:
        with SessionLocal() as s:
            s.get(Question, "edit-distance").content = saved
            s.commit()


def test_full_learning_flow(client, backup_dir):
    assert client.post("/api/questions/two-sum/confidence", json={"confidence": 3}).status_code == 409

    p = client.patch("/api/questions/two-sum/progress", json={"concept_done": True, "quiz_passed": True}).json()
    assert p["status"] == "in_progress"

    drill = client.get("/api/questions/two-sum").json()["content"]["drills"][1]["solution"]
    r = client.post("/api/questions/two-sum/run", json={"code": drill, "target": "drill:1"}).json()
    assert r["passed"] and r["progress"]["drills_passed"] == [1]

    bad = client.post("/api/questions/two-sum/run", json={"code": SOLUTION.replace("[seen[target - x], i]", "[i]")}).json()
    assert not bad["passed"] and bad["progress"]["attempts"] == 1

    good = client.post("/api/questions/two-sum/run", json={"code": SOLUTION}).json()
    assert good["passed"] and good["passed_count"] == good["total_count"]
    assert good["trace"]["steps"]
    assert good["progress"]["solved"] and good["progress"]["status"] == "solved"

    rated = client.post("/api/questions/two-sum/confidence", json={"confidence": 1}).json()
    assert rated["confidence"] == 1 and rated["next_review_at"]

    pitch = client.put("/api/questions/two-sum/pitch", json={"brute_force": "two loops O(N^2)"}).json()
    assert pitch["brute_force"] == "two loops O(N^2)"

    detail = client.get("/api/questions/two-sum").json()
    assert detail["drafts"]["main"] == SOLUTION
    assert detail["pitch"]["brute_force"] == "two loops O(N^2)"

    world1 = client.get("/api/worlds").json()[0]
    assert world1["solved"] == 1 and world1["rust"] == "fresh"

    # auto-backup written after every change
    dump = json.loads((backup_dir / "user_data.json").read_text())
    assert any(p["question_slug"] == "two-sum" and p["solved"] for p in dump["tables"]["progress"])
    assert any(p["brute_force"] == "two loops O(N^2)" for p in dump["tables"]["pitch_notes"])


def test_custom_input_uses_reference_solution_for_expected(client):
    r = client.post("/api/questions/two-sum/run",
                    json={"code": SOLUTION, "custom_args": [[5, 1, 4], 9]}).json()
    assert r["custom"] and r["passed"] and r["results"][0]["expected"] == [0, 2]
    assert client.post("/api/questions/two-sum/run", json={"code": SOLUTION, "custom_args": "oops"}).status_code == 422
    # well-formed but nonsensical input: the reference solution itself crashes on it
    bad = client.post("/api/questions/two-sum/run", json={"code": SOLUTION, "custom_args": [[1, 2], "x"]})
    assert bad.status_code == 400 and "invalid custom input" in bad.json()["detail"]


def test_backup_restore_roundtrip(client):
    assert client.post("/api/backup/dump").status_code == 200
    client.put("/api/questions/two-sum/pitch", json={"brute_force": "changed after dump"})
    # the auto-dump overwrote the file, so restore brings back the latest state
    restored = client.post("/api/backup/restore").json()["restored"]
    assert restored["progress"] >= 1
    assert client.get("/api/questions/two-sum").json()["pitch"]["brute_force"] == "changed after dump"


def test_spaced_repetition_rules():
    assert next_review_interval(1, 0) == timedelta(days=3)
    assert next_review_interval(2, 5) == timedelta(days=7)
    assert next_review_interval(3, 0) == timedelta(days=21)
    assert next_review_interval(3, 1) == timedelta(days=42)
    assert next_review_interval(3, 9) == timedelta(days=84)
    now = utcnow()
    assert rust_level(None, now) is None
    assert rust_level(now - timedelta(days=4), now) == "fresh"
    assert rust_level(now - timedelta(days=6), now) == "dusty"
    assert rust_level(now - timedelta(days=12), now) == "rusting"
    assert rust_level(now - timedelta(days=30), now) == "rusted"

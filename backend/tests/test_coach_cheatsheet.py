import httpx

from app.config import settings
from app.services import ai_coach

BROKEN = "class Solution:\n    def twoSum(self, nums, target):\n        return [0, 0]\n"


def test_coach_falls_back_without_a_key(client, monkeypatch):
    monkeypatch.setattr(settings, "ai_base_url", "")
    monkeypatch.setattr(settings, "ai_api_key", "")
    monkeypatch.setattr(settings, "gemini_api_key", "")
    assert client.get("/api/coach/status").json() == {"enabled": False, "provider": None, "model": None}
    r = client.post("/api/questions/two-sum/ask-coach", json={"mode": "hint", "code": BROKEN}).json()
    assert r["enabled"] is False and r["reply"] is None
    assert len(r["fallback_hints"]) == 3 and "(Clarify)" in r["fallback_script"]


def test_coach_uses_openai_compatible_endpoint(client, monkeypatch):
    monkeypatch.setattr(settings, "ai_base_url", "https://acct.snowflakecomputing.com/api/v2/cortex/v1/")
    monkeypatch.setattr(settings, "ai_api_key", "pat-123")
    monkeypatch.setattr(settings, "ai_model", "claude-sonnet-4-5")
    seen = {}

    def fake_post(url, headers, json, timeout):
        seen.update(url=url, auth=headers["Authorization"], body=json)
        return httpx.Response(200, json={"choices": [{"message": {"content": "Look at line 3."}}]})

    monkeypatch.setattr(ai_coach.httpx, "post", fake_post)
    r = client.post("/api/questions/two-sum/ask-coach", json={"mode": "hint", "code": BROKEN}).json()
    assert r["enabled"] and r["reply"] == "Look at line 3."
    assert seen["url"] == "https://acct.snowflakecomputing.com/api/v2/cortex/v1/chat/completions"
    assert seen["auth"] == "Bearer pat-123" and seen["body"]["model"] == "claude-sonnet-4-5"
    user_prompt = seen["body"]["messages"][1]["content"]
    assert "expected [0, 1], got [0, 0]" in user_prompt  # the failing test is included
    assert "  3 |" in user_prompt  # code is line-numbered


def test_coach_reports_provider_errors_and_keeps_fallback(client, monkeypatch):
    monkeypatch.setattr(settings, "ai_base_url", "")
    monkeypatch.setattr(settings, "gemini_api_key", "g-key")
    monkeypatch.setattr(ai_coach.httpx, "post", lambda *a, **k: httpx.Response(429, text="quota"))
    r = client.post("/api/questions/two-sum/ask-coach",
                    json={"mode": "pitch", "code": BROKEN, "pitch": {"brute_force": "two loops"}}).json()
    assert r["enabled"] and r["reply"] is None and "429" in r["error"]
    assert r["fallback_script"]


def test_cheatsheet_lists_patterns_and_solved_pitches(client):
    sheet = client.get("/api/worlds/1/cheatsheet").json()
    assert sheet["name"] == "Arrays & Hashing" and len(sheet["patterns"]) == 10
    assert all(p["time"] and p["trigger_keywords"] for p in sheet["patterns"])
    # test_api solved two-sum earlier in this session, with a pitch and a passing submission
    solved = {s["slug"]: s for s in sheet["solved"]}
    assert "two-sum" in solved and solved["two-sum"]["code_source"] == "passing_submission"
    assert client.get("/api/worlds/99/cheatsheet").status_code == 404


def test_activity_feed_lists_runs(client):
    events = client.get("/api/activity").json()["events"]
    assert events and all(e["t"].endswith("Z") and e["kind"] in ("solve", "drill") for e in events)
    assert any(e["kind"] == "solve" and e["passed"] and e["slug"] == "two-sum" for e in events)

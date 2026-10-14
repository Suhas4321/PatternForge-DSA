"""Optional AI Socratic coach over any OpenAI-compatible chat completions API.

Provider resolution:
  1. AI_BASE_URL + AI_API_KEY (+ AI_MODEL): any OpenAI-compatible endpoint, e.g. the Snowflake
     Cortex REST API (https://<account>.snowflakecomputing.com/api/v2/cortex/v1).
  2. GEMINI_API_KEY: Google's OpenAI-compatible Gemini endpoint.
  3. Nothing configured: the coach is disabled and callers fall back to the lesson's built-in
     Socratic hints and model interview script.

The coach is told never to hand over a full solution: it points at the learner's own code and
asks guiding questions.
"""

from dataclasses import dataclass

import httpx

from app.config import settings

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai"


class CoachError(Exception):
    pass


@dataclass
class Provider:
    name: str
    base_url: str
    api_key: str
    model: str


def provider() -> Provider | None:
    if settings.ai_base_url and settings.ai_api_key:
        return Provider("openai-compatible", settings.ai_base_url.rstrip("/"), settings.ai_api_key, settings.ai_model)
    if settings.gemini_api_key:
        return Provider("gemini", GEMINI_BASE_URL, settings.gemini_api_key, settings.gemini_model)
    return None


def status() -> dict:
    p = provider()
    return {"enabled": p is not None, "provider": p.name if p else None, "model": p.model if p else None}


HINT_SYSTEM = """You are a Socratic DSA interview coach for a learner preparing for Indian SDE-1 \
interviews. You are given the problem, the intended pattern, the learner's current code (with line \
numbers) and the first failing test.

Rules:
- NEVER write the full solution, and never more than 2 lines of code in total.
- Point at a specific line or decision in THEIR code, then ask one or two guiding questions that lead \
them to discover the bug or the missing idea themselves.
- If their approach is the wrong pattern entirely, say which constraint or trigger phrase should have \
pointed them elsewhere, without giving the algorithm away.
- Be warm, direct and brief: at most 120 words. Plain text, no headings."""

PITCH_SYSTEM = """You are a senior engineer coaching a candidate for a face-to-face DSA round in \
Bengaluru. The candidate solved the problem and wrote a 4-line pitch (brute force, trigger, optimal \
intuition, complexity). Using their pitch and their actual code:
1. In 2-4 bullet points, fix weak spots: vague or wrong complexity reasoning, missing edge cases, \
missing clarifying questions, or claims their code doesn't support.
2. Then write a 60-second spoken script (first person, natural speech, about 150 words) that explains \
THEIR approach the way a calm senior engineer would say it out loud while typing.
Use short markdown: a bullet list, then a line '**60-second script**' followed by the script."""


def _numbered(code: str) -> str:
    return "\n".join(f"{i + 1:>3} | {line}" for i, line in enumerate(code.splitlines()))


def hint_prompt(content: dict, title: str, code: str, failure: str) -> str:
    return f"""Problem: {title}
{content['statement']['clean']}

Intended pattern / key insight (do not state it outright unless the learner is on the wrong pattern):
{content['concept']['key_insight']}

Reference solution, for your understanding only. NEVER reveal or paraphrase it line by line:
{content['solution']['code']}

Learner's current code:
{_numbered(code)}

Result of running it:
{failure}"""


def pitch_prompt(content: dict, title: str, code: str, pitch: dict) -> str:
    return f"""Problem: {title}
{content['statement']['clean']}

Candidate's code:
{code}

Candidate's 4-line pitch:
1. Brute force: {pitch.get('brute_force') or '(empty)'}
2. Trigger: {pitch.get('trigger') or '(empty)'}
3. Optimal intuition: {pitch.get('intuition') or '(empty)'}
4. Complexity: {pitch.get('complexity') or '(empty)'}

Reference complexity: time {content['solution']['time']}; space {content['solution']['space']}"""


def ask(system: str, user: str) -> str:
    p = provider()
    if p is None:
        raise CoachError("No AI provider is configured.")
    body: dict = {
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "temperature": 0.4,
    }
    if p.model:
        body["model"] = p.model
    try:
        resp = httpx.post(
            f"{p.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {p.api_key}", "Content-Type": "application/json"},
            json=body,
            timeout=settings.ai_timeout_seconds,
        )
    except httpx.HTTPError as exc:
        raise CoachError(f"Couldn't reach the AI provider ({type(exc).__name__}).") from exc
    if resp.status_code >= 400:
        detail = resp.text[:300].strip()
        raise CoachError(f"The AI provider returned {resp.status_code}: {detail}")
    try:
        return resp.json()["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, ValueError) as exc:
        raise CoachError("The AI provider sent a response in an unexpected format.") from exc

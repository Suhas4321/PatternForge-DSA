#!/usr/bin/env python3
"""Validates question content files: schema, curriculum match, and *execution*.

For every content file it checks that:
  - the file matches the schema and its slug/lc match content/curriculum.json
  - the reference solution (and brute force, if given) passes every test
  - every drill's reference solution passes that drill's tests
  - the starter code compiles
  - trigger keywords actually appear in the clean statement (warning only)

Usage (from the project root):
  backend/.venv/bin/python scripts/validate_content.py            # everything
  backend/.venv/bin/python scripts/validate_content.py --world 1  # one world
  backend/.venv/bin/python scripts/validate_content.py two-sum    # specific questions
"""

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from pydantic import ValidationError  # noqa: E402

from app.content_schema import QuestionContent  # noqa: E402
from app.runner.python_runner import run_python  # noqa: E402
from app.services.content_loader import content_path, load_curriculum, read_question_content  # noqa: E402


def check_solution(label: str, code: str, function: dict, tests: list[dict]) -> list[str]:
    result = run_python(code, function, tests)
    if result.get("compile_error"):
        return [f"{label}: compile error {result['compile_error']}"]
    problems = []
    for r in result["results"]:
        if not r["passed"]:
            detail = r["error"] or {"expected": r["expected"], "actual": r["actual"]}
            problems.append(f"{label}: test {r['index']} failed: {detail}")
    return problems


def validate(content: QuestionContent) -> tuple[list[str], list[str]]:
    errors, warnings = [], []
    fn = content.function.model_dump()
    tests = [t.model_dump() for t in content.tests]

    errors += check_solution("solution", content.solution.code, fn, tests)
    if content.solution.brute_force_code:
        errors += check_solution("brute_force", content.solution.brute_force_code, fn, tests)

    starter = run_python(content.starter_code, fn, tests[:1])
    if starter.get("compile_error"):
        errors.append(f"starter_code does not compile: {starter['compile_error']}")

    for i, drill in enumerate(content.drills):
        d_fn = drill.function.model_dump()
        d_tests = [t.model_dump() for t in drill.tests]
        errors += check_solution(f"drill {i} solution", drill.solution, d_fn, d_tests)
        d_starter = run_python(drill.starter_code, d_fn, d_tests[:1])
        if d_starter.get("compile_error"):
            errors.append(f"drill {i} starter_code does not compile: {d_starter['compile_error']}")

    clean = content.statement.clean.lower()
    for kw in content.statement.trigger_keywords:
        if kw.lower() not in clean:
            warnings.append(f"trigger keyword {kw!r} not found in clean statement")
    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("slugs", nargs="*")
    parser.add_argument("--world", type=int)
    args = parser.parse_args()

    curriculum = load_curriculum(ROOT / "content")
    checked = failed = missing = 0
    for w in curriculum["worlds"]:
        if args.world and w["id"] != args.world:
            continue
        for q in w["questions"]:
            if args.slugs and q["slug"] not in args.slugs:
                continue
            path = content_path(ROOT / "content", w["id"], w["slug"], q["slug"])
            if not path.exists():
                missing += 1
                continue
            checked += 1
            try:
                content = read_question_content(path, q["slug"], q["lc"])
            except (ValidationError, ValueError) as exc:
                failed += 1
                print(f"FAIL {q['slug']}: schema\n  {exc}")
                continue
            errors, warnings = validate(content)
            status = "FAIL" if errors else "ok  "
            failed += bool(errors)
            print(f"{status} W{w['id']:02d} #{q['lc']:<5} {q['slug']}")
            for e in errors:
                print(f"    error: {e}")
            for wmsg in warnings:
                print(f"    warn:  {wmsg}")

    print(f"\n{checked} checked, {failed} failed, {missing} without content yet")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

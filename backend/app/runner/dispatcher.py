"""Unified execution dispatcher routing requests to the appropriate engine:
- "python_trace": sys.settrace step-by-step memory and stack execution (DSA)
- "python_practical": Real Python runtime for Pandas, XML, Asyncio, Threading
- "sql_sqlite": In-memory SQLite relational engine with intermediate table state capture
"""

from __future__ import annotations

from typing import Any

from app.runner.practical_runner import run_practical
from app.runner.python_runner import run_python
from app.runner.sql_runner import run_sql


def dispatch_run(
    runner_type: str,
    code: str,
    content: dict[str, Any],
    spec: dict[str, Any],
    tests: list[dict[str, Any]],
    reference_code: str = "",
    trace_test_index: int | None = None,
    visualize: bool = True,
) -> dict[str, Any]:
    if runner_type == "sql_sqlite":
        schema_sql = content.get("schema_sql", "")
        seed_sql = content.get("seed_sql", "")
        return run_sql(
            code=code,
            schema_sql=schema_sql,
            seed_sql=seed_sql,
            tests=tests,
            reference_sql=reference_code,
            visualize=visualize,
        )

    if runner_type == "python_practical":
        return run_practical(
            code=code,
            function=spec,
            tests=tests,
            trace_test_index=trace_test_index if visualize else None,
        )

    # Default to python_trace runner
    return run_python(
        code=code,
        function=spec,
        tests=tests,
        trace_test_index=trace_test_index if visualize else None,
    )

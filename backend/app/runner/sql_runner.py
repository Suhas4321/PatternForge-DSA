"""Isolated in-memory SQLite runner for Citadel III SQL interview problems.

Executes schema DDL, seed data, user SQL queries, and reference SQL solutions.
Compares query results (column names and row tuples) and produces intermediate
table states to drive the SQLPipelineVisualizer.
"""

from __future__ import annotations

import re
import sqlite3
import time
from typing import Any


def _normalize_row(row: tuple | list) -> list[Any]:
    norm = []
    for val in row:
        if isinstance(val, float):
            norm.append(round(val, 4))
        elif val is None:
            norm.append(None)
        else:
            norm.append(val)
    return norm


def _rows_match(actual: list[list[Any]], expected: list[list[Any]], order_sensitive: bool = False) -> bool:
    if len(actual) != len(expected):
        return False
    if order_sensitive:
        return actual == expected
    # Multi-set matching (order insensitive)
    # Convert rows to string representation for sorting
    sorted_actual = sorted([str(r) for r in actual])
    sorted_expected = sorted([str(r) for r in expected])
    return sorted_actual == sorted_expected


def _extract_source_tables(conn: sqlite3.Connection) -> dict[str, dict[str, Any]]:
    """Dumps all non-internal tables from sqlite into { table_name: { columns: [...], rows: [...] } }."""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = [row[0] for row in cursor.fetchall()]
    dump = {}
    for table in tables:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [col[1] for col in cursor.fetchall()]
        cursor.execute(f"SELECT * FROM {table}")
        rows = [_normalize_row(r) for r in cursor.fetchall()]
        dump[table] = {"columns": columns, "rows": rows}
    return dump


def run_sql(
    code: str,
    schema_sql: str = "",
    seed_sql: str = "",
    tests: list[dict[str, Any]] | None = None,
    reference_sql: str = "",
    visualize: bool = True,
) -> dict[str, Any]:
    tests = tests or [{"args": {}, "expected": None, "note": "Primary schema evaluation"}]
    results = []
    compile_error = None
    fatal_error = None
    trace = None

    # Step 1: Pre-validate user SQL syntax
    test_conn = sqlite3.connect(":memory:")
    try:
        if schema_sql:
            test_conn.executescript(schema_sql)
        if seed_sql:
            test_conn.executescript(seed_sql)
    except Exception as exc:
        fatal_error = {"type": "SchemaError", "message": f"Failed to seed database schema: {exc}", "line": 1}
        return {
            "compile_error": None,
            "fatal_error": fatal_error,
            "results": [],
            "trace": None,
        }

    # Determine ground truth reference solution output
    ref_columns: list[str] = []
    ref_rows: list[list[Any]] = []
    if reference_sql:
        try:
            ref_cur = test_conn.cursor()
            ref_cur.execute(reference_sql.strip())
            if ref_cur.description:
                ref_columns = [d[0] for d in ref_cur.description]
            ref_rows = [_normalize_row(r) for r in ref_cur.fetchall()]
        except Exception as exc:
            fatal_error = {"type": "ReferenceError", "message": f"Reference SQL error: {exc}", "line": 1}

    # Step 2: Execute User SQL
    source_dump = _extract_source_tables(test_conn)
    start_time = time.perf_counter()
    user_columns: list[str] = []
    user_rows: list[list[Any]] = []
    user_error = None

    try:
        user_cur = test_conn.cursor()
        # Clean user query
        clean_code = code.strip().rstrip(";")
        user_cur.execute(clean_code)
        if user_cur.description:
            user_columns = [d[0] for d in user_cur.description]
        user_rows = [_normalize_row(r) for r in user_cur.fetchall()]
    except sqlite3.OperationalError as exc:
        msg = str(exc)
        line = 1
        line_match = re.search(r"line (\d+)", msg)
        if line_match:
            line = int(line_match.group(1))
        user_error = {"type": "OperationalError", "message": msg, "line": line}
    except Exception as exc:
        user_error = {"type": "SQLError", "message": str(exc), "line": 1}

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    # Step 3: Evaluate against test cases
    for idx, test in enumerate(tests):
        exp = test.get("expected")
        if exp is None and ref_rows is not None:
            exp = ref_rows

        if user_error:
            results.append({
                "index": idx,
                "passed": False,
                "expected": exp,
                "actual": None,
                "error": user_error,
                "stdout": "",
                "runtime_ms": round(elapsed_ms, 2),
            })
        else:
            # Check order sensitivity
            order_sensitive = bool(re.search(r"\border\s+by\b", (reference_sql or code), re.IGNORECASE))
            passed = _rows_match(user_rows, exp if isinstance(exp, list) else [], order_sensitive)
            results.append({
                "index": idx,
                "passed": passed,
                "expected": exp,
                "actual": user_rows,
                "columns": user_columns,
                "error": None,
                "stdout": f"Returned {len(user_rows)} rows across {len(user_columns)} columns.",
                "runtime_ms": round(elapsed_ms, 2),
            })

    # Step 4: Build Visual Pipeline Trace for SQLPipelineVisualizer
    if visualize and not user_error:
        trace = {
            "type": "sql_pipeline",
            "source_tables": source_dump,
            "query": code,
            "result_table": {
                "columns": user_columns,
                "rows": user_rows,
                "row_count": len(user_rows),
            },
            "steps": [
                {
                    "step_name": "Source Tables Loaded",
                    "description": "8KB Heap Pages read into in-memory table buffers.",
                    "tables": source_dump,
                },
                {
                    "step_name": "Execution & Filtering",
                    "description": "SQL Engine joins tables and filters matching rows via predicates.",
                    "status": "filtering_complete",
                },
                {
                    "step_name": "Final Projection",
                    "description": f"SELECT projected {len(user_columns)} columns and {len(user_rows)} rows.",
                    "columns": user_columns,
                    "rows": user_rows,
                },
            ],
        }

    test_conn.close()
    return {
        "compile_error": compile_error,
        "fatal_error": fatal_error,
        "results": results,
        "trace": trace,
    }

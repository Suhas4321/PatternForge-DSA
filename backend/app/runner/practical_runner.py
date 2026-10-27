"""Practical Python Runner for Citadels II, IV, V, and VI.

Executes real Python code involving Pandas DataFrames, XML DOM trees, JSON parsing,
asyncio coroutines, multithreading locks, and custom OOP classes inside an isolated
subprocess with resource limits and AST security validation.
"""

from __future__ import annotations

import ast
import asyncio
import io
import json
import os
import resource
import signal
import subprocess
import sys
import tempfile
import time
import traceback
from pathlib import Path
from typing import Any

PRACTICAL_FORBIDDEN_MODULES = frozenset({
    "subprocess", "socket", "shutil", "ctypes", "pty", "fcntl",
    "urllib", "http", "webbrowser", "ftplib", "telnetlib", "resource",
})

PRACTICAL_FORBIDDEN_BUILTINS = frozenset({
    "open", "eval", "exec", "compile", "input", "breakpoint",
})

PRACTICAL_FORBIDDEN_DUNDERS = frozenset({
    "__subclasses__", "__globals__", "__builtins__", "__code__", "__closure__",
})


def _validate_practical_ast(code: str) -> dict[str, Any] | None:
    try:
        tree = ast.parse(code, "<user_code>")
    except SyntaxError:
        return None
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                root = alias.name.split(".")[0]
                if root in PRACTICAL_FORBIDDEN_MODULES:
                    return {
                        "type": "SecurityError",
                        "message": f"Import of module '{root}' is not allowed in the sandbox",
                        "line": getattr(node, "lineno", 1),
                    }
        elif isinstance(node, ast.ImportFrom):
            root = (node.module or "").split(".")[0]
            if root in PRACTICAL_FORBIDDEN_MODULES:
                return {
                    "type": "SecurityError",
                    "message": f"Import from module '{root}' is not allowed in the sandbox",
                    "line": getattr(node, "lineno", 1),
                }
        elif isinstance(node, ast.Attribute) and node.attr in PRACTICAL_FORBIDDEN_DUNDERS:
            return {
                "type": "SecurityError",
                "message": f"Access to restricted attribute '{node.attr}' is not allowed",
                "line": getattr(node, "lineno", 1),
            }
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in PRACTICAL_FORBIDDEN_BUILTINS:
                return {
                    "type": "SecurityError",
                    "message": f"Call to restricted builtin '{node.func.id}()' is not allowed",
                    "line": getattr(node, "lineno", 1),
                }
    return None


def _serialize_practical_val(val: Any) -> Any:
    # Pandas DataFrame serialization
    if hasattr(val, "to_dict") and hasattr(val, "columns"):
        try:
            return {
                "__type__": "dataframe",
                "columns": list(val.columns),
                "shape": list(val.shape),
                "data": val.fillna("NaN").to_dict(orient="records"),
            }
        except Exception:
            return str(val)

    # Pandas Series serialization
    if hasattr(val, "to_dict") and hasattr(val, "index") and not hasattr(val, "columns"):
        try:
            return {
                "__type__": "series",
                "index": [str(i) for i in val.index],
                "data": [None if str(v) == "nan" else v for v in val.tolist()],
            }
        except Exception:
            return str(val)

    # XML ElementTree serialization
    if hasattr(val, "tag") and hasattr(val, "attrib"):
        return {
            "__type__": "xml_element",
            "tag": val.tag,
            "attrib": dict(val.attrib),
            "text": (val.text or "").strip(),
            "child_count": len(list(val)),
        }

    # Standard JSON serializable primitives
    if isinstance(val, (int, float, str, bool, type(None))):
        return val
    if isinstance(val, (list, tuple)):
        return [_serialize_practical_val(x) for x in val]
    if isinstance(val, dict):
        return {str(k): _serialize_practical_val(v) for k, v in val.items()}

    return str(val)


def _compare_practical(actual: Any, expected: Any) -> bool:
    if expected is None:
        return True

    # If both are DataFrame dicts
    if isinstance(actual, dict) and actual.get("__type__") == "dataframe":
        if isinstance(expected, dict) and expected.get("__type__") == "dataframe":
            return actual["columns"] == expected["columns"] and actual["data"] == expected["data"]
        if isinstance(expected, list):
            return actual["data"] == expected

    # If both are list of dicts
    if isinstance(actual, list) and isinstance(expected, list):
        if len(actual) != len(expected):
            return False
        return actual == expected

    if isinstance(actual, float) and isinstance(expected, (int, float)):
        return abs(actual - expected) < 1e-4

    return actual == expected


def _run_practical_worker(
    code: str,
    function: dict[str, Any],
    tests: list[dict[str, Any]],
    trace_test_index: int | None = None,
) -> dict[str, Any]:
    ast_err = _validate_practical_ast(code)
    if ast_err is not None:
        return {
            "compile_error": ast_err,
            "fatal_error": None,
            "results": [],
            "trace": None,
        }

    func_name = function.get("name", "solve")
    results = []
    compile_error = None
    fatal_error = None
    trace = None

    # Environment sandbox with preloaded data science & concurrency modules
    sandbox_globals: dict[str, Any] = {
        "__name__": "__main__",
        "__doc__": None,
    }

    # Inject standard and data engineering libraries
    try:
        import pandas as pd
        import numpy as np
        sandbox_globals["pd"] = pd
        sandbox_globals["np"] = np
    except ImportError:
        pass

    try:
        import xml.etree.ElementTree as ET
        sandbox_globals["ET"] = ET
    except ImportError:
        pass

    import concurrent.futures
    import functools
    import math
    import os
    import re
    import threading

    sandbox_globals.update({
        "io": io,
        "json": json,
        "asyncio": asyncio,
        "threading": threading,
        "concurrent": concurrent,
        "functools": functools,
        "math": math,
        "re": re,
    })

    # Compile user code
    try:
        compiled = compile(code, "<user_code>", "exec")
        exec(compiled, sandbox_globals)
    except SyntaxError as exc:
        compile_error = {
            "type": "SyntaxError",
            "message": exc.msg,
            "line": exc.lineno,
            "offset": exc.offset,
        }
        return {
            "compile_error": compile_error,
            "fatal_error": None,
            "results": [],
            "trace": None,
        }
    except Exception as exc:
        fatal_error = {
            "type": type(exc).__name__,
            "message": str(exc),
            "line": None,
        }
        return {
            "compile_error": None,
            "fatal_error": fatal_error,
            "results": [],
            "trace": None,
        }

    # Locate executable function or class
    target_callable = None
    if func_name in sandbox_globals:
        target_callable = sandbox_globals[func_name]
    elif "Solution" in sandbox_globals:
        sol_class = sandbox_globals["Solution"]
        sol_inst = sol_class()
        if hasattr(sol_inst, func_name):
            target_callable = getattr(sol_inst, func_name)

    if target_callable is None:
        compile_error = {
            "type": "AttributeError",
            "message": f"Could not find function '{func_name}' or class Solution.{func_name}",
            "line": 1,
        }
        return {
            "compile_error": compile_error,
            "fatal_error": None,
            "results": [],
            "trace": None,
        }

    # Run tests
    for idx, test in enumerate(tests):
        raw_args = test.get("args", [])
        expected = test.get("expected")
        if not isinstance(raw_args, (list, tuple)):
            raw_args = [raw_args]

        stdout_capture = io.StringIO()
        old_stdout = sys.stdout
        sys.stdout = stdout_capture

        start_time = time.perf_counter()
        call_error = None
        actual = None

        try:
            import inspect
            if inspect.iscoroutinefunction(target_callable):
                actual = asyncio.run(target_callable(*raw_args))
            else:
                actual = target_callable(*raw_args)
        except Exception as exc:
            tb = traceback.format_exc()
            call_error = {
                "type": type(exc).__name__,
                "message": str(exc),
                "traceback": tb,
            }
        finally:
            sys.stdout = old_stdout

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        serialized_actual = _serialize_practical_val(actual)
        passed = False
        if not call_error:
            passed = _compare_practical(serialized_actual, expected)

        results.append({
            "index": idx,
            "passed": passed,
            "expected": expected,
            "actual": serialized_actual,
            "error": call_error,
            "stdout": stdout_capture.getvalue(),
            "runtime_ms": round(elapsed_ms, 2),
        })

    # Visualizer Trace Synthesis
    if results and not compile_error:
        first_actual = results[0].get("actual")
        if isinstance(first_actual, dict) and first_actual.get("__type__") == "dataframe":
            trace = {
                "type": "dataframe_pipeline",
                "dataframe": first_actual,
                "step_count": 3,
                "timeline": [
                    {"step": 0, "name": "Raw Ingestion", "data": first_actual.get("data", [])[:5]},
                    {"step": 1, "name": "Transformation Applied", "data": first_actual.get("data", [])[:5]},
                    {"step": 2, "name": "Final Aggregation", "data": first_actual.get("data", [])[:5]},
                ],
            }
        else:
            trace = {
                "type": "practical_execution",
                "summary": f"Executed {len(results)} test cases in practical runtime.",
                "status": "success" if all(r["passed"] for r in results) else "tests_failed",
            }

    return {
        "compile_error": None,
        "fatal_error": None,
        "results": results,
        "trace": trace,
    }


def _practical_limits(memory_mb: int, cpu_seconds: int):
    def apply():
        # Note: pandas/numpy load shared libraries, so give generous virtual address headroom (2GB)
        mem = max(memory_mb, 2048) * 1024 * 1024
        if sys.platform != "darwin" and hasattr(resource, "RLIMIT_AS"):
            try:
                resource.setrlimit(resource.RLIMIT_AS, (mem, mem))
            except (ValueError, OSError):
                pass
        if hasattr(resource, "RLIMIT_CPU"):
            try:
                resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds + 1))
            except (ValueError, OSError):
                pass
        try:
            os.setsid()
        except OSError:
            pass

    return apply


def _kill_proc_group(proc: subprocess.Popen) -> None:
    try:
        os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
    except (ProcessLookupError, PermissionError, OSError):
        try:
            proc.kill()
        except OSError:
            pass


def run_practical(
    code: str,
    function: dict[str, Any],
    tests: list[dict[str, Any]],
    trace_test_index: int | None = None,
    timeout_seconds: float = 6.0,
) -> dict[str, Any]:
    ast_err = _validate_practical_ast(code)
    if ast_err is not None:
        return {
            "compile_error": ast_err,
            "fatal_error": None,
            "results": [],
            "trace": None,
        }

    payload = {
        "code": code,
        "function": function,
        "tests": tests,
        "trace_test_index": trace_test_index,
    }

    with tempfile.TemporaryDirectory(prefix="pf-prac-") as tmp:
        payload_path = Path(tmp) / "payload.json"
        result_path = Path(tmp) / "result.json"
        payload_path.write_text(json.dumps(payload))
        proc: subprocess.Popen | None = None
        try:
            proc = subprocess.Popen(
                [sys.executable, str(Path(__file__).resolve()), str(payload_path), str(result_path)],
                cwd=tmp,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                preexec_fn=_practical_limits(2048, int(timeout_seconds) + 2),
            )
            _, stderr_text = proc.communicate(timeout=timeout_seconds)
        except subprocess.TimeoutExpired:
            if proc is not None:
                _kill_proc_group(proc)
                proc.wait(timeout=1.0)
            return {
                "compile_error": None,
                "fatal_error": {"type": "TimeLimitExceeded", "message": "Practical execution timed out.", "line": None},
                "results": [
                    {
                        "index": i,
                        "passed": False,
                        "expected": t.get("expected"),
                        "actual": None,
                        "error": {"type": "TimeLimitExceeded", "message": "Execution timed out.", "line": None},
                        "stdout": "",
                        "runtime_ms": 0,
                    }
                    for i, t in enumerate(tests)
                ],
                "trace": None,
            }
        except subprocess.SubprocessError as exc:
            if proc is not None:
                _kill_proc_group(proc)
            return {
                "compile_error": None,
                "fatal_error": {"type": "RunnerError", "message": str(exc), "line": None},
                "results": [],
                "trace": None,
            }
        finally:
            if proc is not None and proc.poll() is None:
                _kill_proc_group(proc)

        if not result_path.exists():
            detail = (stderr_text or "").strip().splitlines()
            msg = detail[-1] if detail else "Practical worker exited unexpectedly"
            return {
                "compile_error": None,
                "fatal_error": {"type": "RunnerError", "message": msg, "line": None},
                "results": [],
                "trace": None,
            }
        return json.loads(result_path.read_text())


if __name__ == "__main__":
    p_in, p_out = sys.argv[1], sys.argv[2]
    req = json.loads(Path(p_in).read_text())
    out = _run_practical_worker(
        code=req["code"],
        function=req["function"],
        tests=req["tests"],
        trace_test_index=req.get("trace_test_index"),
    )
    Path(p_out).write_text(json.dumps(out))

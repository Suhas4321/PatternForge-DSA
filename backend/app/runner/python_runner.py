"""Runs user Python code in a separate process via harness.py.

Isolation is resource-based (timeout, memory/CPU rlimits, isolated interpreter, temp working
dir). It is NOT a security sandbox: it's meant for running your own code on your own machine.
"""

import json
import os
import resource
import subprocess
import sys
import tempfile
from pathlib import Path

from app.config import settings

HARNESS = Path(__file__).with_name("harness.py")
PER_TEST_TIMEOUT = 2.0


class RunnerError(Exception):
    pass


def _limits(memory_mb: int, cpu_seconds: int):
    def apply():
        mem = memory_mb * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_AS, (mem, mem))
        resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds + 1))
        resource.setrlimit(resource.RLIMIT_FSIZE, (50 * 1024 * 1024,) * 2)
        os.setsid()

    return apply


def run_python(
    code: str,
    function: dict,
    tests: list[dict],
    trace_test_index: int | None = None,
    max_steps: int | None = None,
) -> dict:
    payload = {
        "code": code,
        "function": function,
        "tests": tests,
        "per_test_timeout": PER_TEST_TIMEOUT,
        "trace": None
        if trace_test_index is None
        else {"test_index": trace_test_index, "max_steps": max_steps or settings.trace_max_steps},
    }
    # Each test gets its own alarm inside the harness; this is the outer safety net.
    wall_timeout = PER_TEST_TIMEOUT * (len(tests) + 3) + 2
    wall_timeout = max(wall_timeout, settings.run_timeout_seconds)

    with tempfile.TemporaryDirectory(prefix="pf-run-") as tmp:
        payload_path = Path(tmp) / "payload.json"
        result_path = Path(tmp) / "result.json"
        payload_path.write_text(json.dumps(payload))
        try:
            proc = subprocess.run(
                [sys.executable, "-I", str(HARNESS), str(payload_path), str(result_path)],
                cwd=tmp,
                env={"PATH": "/usr/bin:/bin", "PYTHONHASHSEED": "0", "PYTHONIOENCODING": "utf-8"},
                capture_output=True,
                text=True,
                timeout=wall_timeout,
                preexec_fn=_limits(settings.run_memory_mb, int(wall_timeout) + 1),
            )
        except subprocess.TimeoutExpired:
            return _fatal(tests, "TimeLimitExceeded", "Your code took too long to run.")

        if not result_path.exists():
            stderr = (proc.stderr or "").strip().splitlines()
            if proc.returncode < 0 or "MemoryError" in (proc.stderr or ""):
                return _fatal(tests, "MemoryLimitExceeded" if "MemoryError" in (proc.stderr or "")
                              else "Crashed", stderr[-1] if stderr else f"signal {-proc.returncode}")
            raise RunnerError(f"harness failed (exit {proc.returncode}): {proc.stderr[-2000:]}")
        return json.loads(result_path.read_text())


def _fatal(tests: list[dict], kind: str, message: str) -> dict:
    return {
        "compile_error": None,
        "fatal_error": {"type": kind, "message": message, "line": None},
        "results": [
            {"index": i, "passed": False, "expected": t["expected"], "actual": None,
             "error": {"type": kind, "message": message, "line": None}, "stdout": "", "runtime_ms": 0}
            for i, t in enumerate(tests)
        ],
        "trace": None,
    }

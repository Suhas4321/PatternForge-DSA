"""Runs user Python code in a separate process via harness.py.

Isolation is resource-based (timeout, memory/CPU rlimits, isolated interpreter, temp working
dir). It is NOT a security sandbox: it's meant for running your own code on your own machine.
"""

import json
import os
import resource
import signal
import subprocess
import sys
import tempfile
from pathlib import Path

from app.config import settings

HARNESS = Path(__file__).with_name("harness.py")
PER_TEST_TIMEOUT = 2.0


class RunnerError(Exception):
    pass


def _set_rlimit(limit: int, value: tuple[int, int]) -> None:
    try:
        resource.setrlimit(limit, value)
    except (ValueError, OSError):
        pass


def _limits(memory_mb: int, cpu_seconds: int):
    def apply():
        mem = memory_mb * 1024 * 1024
        # On macOS (darwin), RLIMIT_AS either fails with ValueError/EINVAL or starves dyld's
        # multi-GB shared cache mapping before the Python interpreter can start.
        if sys.platform != "darwin" and hasattr(resource, "RLIMIT_AS"):
            _set_rlimit(resource.RLIMIT_AS, (mem, mem))
        if hasattr(resource, "RLIMIT_CPU"):
            _set_rlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds + 1))
        if hasattr(resource, "RLIMIT_FSIZE"):
            _set_rlimit(resource.RLIMIT_FSIZE, (50 * 1024 * 1024,) * 2)
        if hasattr(resource, "RLIMIT_NOFILE"):
            _set_rlimit(resource.RLIMIT_NOFILE, (64, 64))
        try:
            os.setsid()
        except OSError:
            pass

    return apply


def _kill_process_group(proc: subprocess.Popen) -> None:
    try:
        os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
    except (ProcessLookupError, PermissionError, OSError):
        try:
            proc.kill()
        except OSError:
            pass


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
        proc: subprocess.Popen | None = None
        try:
            proc = subprocess.Popen(
                [sys.executable, "-I", str(HARNESS), str(payload_path), str(result_path)],
                cwd=tmp,
                env={"PATH": "/usr/bin:/bin", "PYTHONHASHSEED": "0", "PYTHONIOENCODING": "utf-8"},
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                preexec_fn=_limits(settings.run_memory_mb, int(wall_timeout) + 1),
            )
            _, stderr_text = proc.communicate(timeout=wall_timeout)
        except subprocess.TimeoutExpired:
            if proc is not None:
                _kill_process_group(proc)
                proc.wait(timeout=1.0)
            return _fatal(tests, "TimeLimitExceeded", "Your code took too long to run.")
        except subprocess.SubprocessError as exc:
            if proc is not None:
                _kill_process_group(proc)
            return _fatal(tests, "RunnerError", f"Failed to start code runner: {exc}")
        finally:
            if proc is not None and proc.poll() is None:
                _kill_process_group(proc)

        if not result_path.exists():
            stderr = (stderr_text or "").strip().splitlines()
            if proc.returncode < 0 or "MemoryError" in (stderr_text or ""):
                return _fatal(tests, "MemoryLimitExceeded" if "MemoryError" in (stderr_text or "")
                              else "Crashed", stderr[-1] if stderr else f"signal {-proc.returncode}")
            detail = stderr[-1] if stderr else f"exit {proc.returncode}"
            return _fatal(tests, "RunnerError", f"Code runner failed ({detail})")
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

"""Playground: trace and visualize any code on any input, outside the curriculum."""

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.content_schema import ValueType
from app.runner.python_runner import run_python

router = APIRouter(prefix="/api/playground", tags=["playground"])


class PlaygroundIn(BaseModel):
    code: str = Field(max_length=50_000)
    function_name: str = Field(min_length=1, max_length=100)
    args: list[Any] = Field(default_factory=list)
    arg_types: list[ValueType] = Field(default_factory=list)
    returns: ValueType = "any"


@router.post("/run")
def run_playground(body: PlaygroundIn):
    params = [
        {"name": f"arg{i}", "type": body.arg_types[i] if i < len(body.arg_types) else "any"}
        for i in range(len(body.args))
    ]
    spec = {"name": body.function_name, "params": params, "returns": body.returns}
    result = run_python(body.code, spec, [{"args": body.args, "expected": None}], trace_test_index=0)
    first = result["results"][0] if result["results"] else None
    return {
        "compile_error": result.get("compile_error"),
        "fatal_error": result.get("fatal_error"),
        "output": first["actual"] if first else None,
        "error": first["error"] if first else None,
        "stdout": first["stdout"] if first else "",
        "trace": result["trace"],
    }

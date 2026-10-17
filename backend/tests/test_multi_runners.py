from app.runner.practical_runner import run_practical
from app.runner.sql_runner import run_sql
from app.runner.dispatcher import dispatch_run


def test_sql_runner_basic():
    schema = """
    CREATE TABLE employees (id INT PRIMARY KEY, name TEXT, salary INT, dept_id INT);
    """
    seed = """
    INSERT INTO employees VALUES (1, 'Alice', 95000, 10);
    INSERT INTO employees VALUES (2, 'Bob', 120000, 10);
    INSERT INTO employees VALUES (3, 'Charlie', 110000, 20);
    """
    user_sql = "SELECT name, salary FROM employees WHERE salary > 100000 ORDER BY salary DESC"
    ref_sql = "SELECT name, salary FROM employees WHERE salary > 100000 ORDER BY salary DESC"

    res = run_sql(
        code=user_sql,
        schema_sql=schema,
        seed_sql=seed,
        reference_sql=ref_sql,
        visualize=True,
    )

    assert res["compile_error"] is None
    assert res["fatal_error"] is None
    assert len(res["results"]) == 1
    assert res["results"][0]["passed"] is True
    assert res["results"][0]["actual"] == [["Bob", 120000], ["Charlie", 110000]]
    assert res["trace"] is not None
    assert res["trace"]["type"] == "sql_pipeline"
    assert "employees" in res["trace"]["source_tables"]


def test_sql_runner_syntax_error():
    schema = "CREATE TABLE t (x INT);"
    res = run_sql(
        code="SELECT * FORM t",  # typo FORM
        schema_sql=schema,
        seed_sql="INSERT INTO t VALUES (1);",
        reference_sql="SELECT * FROM t",
    )
    assert len(res["results"]) == 1
    assert res["results"][0]["passed"] is False
    assert res["results"][0]["error"] is not None
    assert "OperationalError" in res["results"][0]["error"]["type"]


def test_practical_runner_pandas():
    code = """
import pandas as pd

class Solution:
    def filter_slow_runs(self, records: list) -> list:
        df = pd.DataFrame(records)
        slow = df[df['latency'] > 500]
        return slow.to_dict(orient='records')
"""
    function_spec = {"name": "filter_slow_runs"}
    tests = [
        {
            "args": [[
                {"run_id": 1, "latency": 250},
                {"run_id": 2, "latency": 620},
                {"run_id": 3, "latency": 800},
            ]],
            "expected": [
                {"run_id": 2, "latency": 620},
                {"run_id": 3, "latency": 800},
            ],
        }
    ]

    res = run_practical(code, function_spec, tests)
    assert res["compile_error"] is None
    assert res["fatal_error"] is None
    assert len(res["results"]) == 1
    assert res["results"][0]["passed"] is True


def test_practical_runner_asyncio():
    code = """
import asyncio

class Solution:
    async def fetch_count(self, n: int) -> int:
        await asyncio.sleep(0.01)
        return n * 2
"""
    function_spec = {"name": "fetch_count"}
    tests = [{"args": [5], "expected": 10}]

    res = run_practical(code, function_spec, tests)
    assert res["compile_error"] is None
    assert res["results"][0]["passed"] is True
    assert res["results"][0]["actual"] == 10


def test_dispatcher_routing():
    res = dispatch_run(
        runner_type="sql_sqlite",
        code="SELECT 1 as num",
        content={"schema_sql": "", "seed_sql": ""},
        spec={},
        tests=[{"args": {}, "expected": [[1]]}],
        reference_code="SELECT 1 as num",
    )
    assert res["results"][0]["passed"] is True

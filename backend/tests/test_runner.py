from app.runner.python_runner import run_python

TWO_SUM = {"name": "twoSum", "params": [{"name": "nums"}, {"name": "target"}], "compare": "unordered"}


def test_passes_and_traces():
    code = (
        "class Solution:\n"
        "    def twoSum(self, nums, target):\n"
        "        seen = {}\n"
        "        for i, x in enumerate(nums):\n"
        "            if target - x in seen:\n"
        "                return [seen[target - x], i]\n"
        "            seen[x] = i\n"
    )
    r = run_python(code, TWO_SUM, [{"args": [[2, 7, 11, 15], 9], "expected": [1, 0]}], trace_test_index=0)
    assert r["results"][0]["passed"]  # unordered comparison
    steps = r["trace"]["steps"]
    assert steps[0]["event"] == "call" and steps[-1]["event"] == "return"
    assert steps[-1]["return_value"] == [0, 1]
    line_steps = [s for s in steps if s["event"] == "line"]
    assert any(s["frames"][-1]["locals"].get("seen") == {"$dict": [[2, 0]]} for s in line_steps)


def test_wrong_answer_and_runtime_error():
    code = "class Solution:\n    def twoSum(self, nums, target):\n        return nums[99]\n"
    r = run_python(code, TWO_SUM, [{"args": [[1, 2], 3], "expected": [0, 1]}])
    err = r["results"][0]["error"]
    assert err["type"] == "IndexError" and err["line"] == 3


def test_syntax_error_reports_line():
    r = run_python("class Solution:\n    def twoSum(self, nums, target)\n", TWO_SUM, [{"args": [[1], 1], "expected": []}])
    assert r["compile_error"]["type"] == "SyntaxError"
    assert r["compile_error"]["line"] == 2


def test_infinite_loop_times_out_without_killing_other_tests():
    code = (
        "class Solution:\n"
        "    def f(self, n):\n"
        "        try:\n"
        "            while n == 1: pass\n"
        "        except Exception:\n"
        "            return 'swallowed'\n"
        "        return n\n"
    )
    spec = {"name": "f", "params": [{"name": "n"}]}
    r = run_python(code, spec, [{"args": [1], "expected": 1}, {"args": [2], "expected": 2}])
    assert r["results"][0]["error"]["type"] == "TimeLimitExceeded"
    assert r["results"][1]["passed"]


def test_stdout_is_captured_per_test():
    code = "class Solution:\n    def f(self, n):\n        print('hi', n)\n        return n\n"
    r = run_python(code, {"name": "f", "params": [{"name": "n"}]}, [{"args": [5], "expected": 5}])
    assert r["results"][0]["stdout"] == "hi 5\n"


def test_linked_list_and_tree_types():
    rev = (
        "class Solution:\n"
        "    def reverseList(self, head):\n"
        "        prev = None\n"
        "        while head:\n"
        "            head.next, prev, head = prev, head, head.next\n"
        "        return prev\n"
    )
    spec = {"name": "reverseList", "params": [{"name": "head", "type": "ListNode"}], "returns": "ListNode"}
    r = run_python(rev, spec, [{"args": [[1, 2, 3]], "expected": [3, 2, 1]}, {"args": [[]], "expected": []}])
    assert all(x["passed"] for x in r["results"])

    inv = (
        "class Solution:\n"
        "    def invertTree(self, root):\n"
        "        if root:\n"
        "            root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)\n"
        "        return root\n"
    )
    spec = {"name": "invertTree", "params": [{"name": "root", "type": "TreeNode"}], "returns": "TreeNode"}
    r = run_python(inv, spec, [{"args": [[4, 2, 7, 1, 3, 6, 9]], "expected": [4, 7, 2, 9, 6, 3, 1]}], trace_test_index=0)
    assert r["results"][0]["passed"]
    assert sum(s["event"] == "call" for s in r["trace"]["steps"]) == 15  # 7 nodes + 8 None children


def test_inplace_and_design():
    code = (
        "class Solution:\n"
        "    def moveZeroes(self, nums):\n"
        "        w = 0\n"
        "        for x in nums:\n"
        "            if x:\n"
        "                nums[w] = x; w += 1\n"
        "        nums[w:] = [0] * (len(nums) - w)\n"
    )
    spec = {"name": "moveZeroes", "params": [{"name": "nums"}], "inplace_arg": 0}
    assert run_python(code, spec, [{"args": [[0, 1, 0, 3]], "expected": [1, 3, 0, 0]}])["results"][0]["passed"]

    stack = (
        "class MinStack:\n"
        "    def __init__(self): self.s = []\n"
        "    def push(self, v): self.s.append((v, min(v, self.s[-1][1]) if self.s else v))\n"
        "    def pop(self): self.s.pop()\n"
        "    def top(self): return self.s[-1][0]\n"
        "    def getMin(self): return self.s[-1][1]\n"
    )
    test = {"args": {"ops": ["MinStack", "push", "push", "getMin", "pop", "getMin"],
                     "args": [[], [2], [1], [], [], []]},
            "expected": [None, None, None, 1, None, 2]}
    assert run_python(stack, {"kind": "design", "name": "MinStack"}, [test])["results"][0]["passed"]


def test_deep_copy_check_for_graph_clone():
    cheat = "class Solution:\n    def cloneGraph(self, node):\n        return node\n"
    spec = {"name": "cloneGraph", "params": [{"name": "node", "type": "GraphNode"}], "returns": "GraphNode"}
    r = run_python(cheat, spec, [{"args": [[[2], [1]]], "expected": [[2], [1]]}])
    assert "deep copy" in r["results"][0]["error"]["message"]


def test_infinity_is_json_safe_in_trace():
    code = "class Solution:\n    def f(self):\n        best = float('inf')\n        return 1\n"
    r = run_python(code, {"name": "f"}, [{"args": [], "expected": 1}], trace_test_index=0)
    assert any(s["frames"][-1]["locals"].get("best") == {"$inf": 1} for s in r["trace"]["steps"] if s["frames"])


def test_sandbox_blocks_forbidden_imports_and_builtins():
    bad_import = "import os\nclass Solution:\n    def f(self):\n        return 1\n"
    r1 = run_python(bad_import, {"name": "f"}, [{"args": [], "expected": 1}])
    assert r1["compile_error"] is not None
    assert r1["compile_error"]["type"] == "SecurityError"

    bad_open = "class Solution:\n    def f(self):\n        return open('/etc/passwd').read()\n"
    r2 = run_python(bad_open, {"name": "f"}, [{"args": [], "expected": 1}])
    assert r2["compile_error"] is not None
    assert r2["compile_error"]["type"] == "SecurityError"

    bad_dunder = "class Solution:\n    def f(self):\n        return ().__class__.__bases__[0].__subclasses__()\n"
    r3 = run_python(bad_dunder, {"name": "f"}, [{"args": [], "expected": 1}])
    assert r3["compile_error"] is not None
    assert r3["compile_error"]["type"] == "SecurityError"


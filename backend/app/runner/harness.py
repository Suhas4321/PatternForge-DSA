"""Standalone execution harness. Runs in a separate Python process (never imported by the app).

Usage: python -I harness.py <payload.json> <result.json>

Payload: {"code", "function", "tests", "per_test_timeout", "trace": {"test_index", "max_steps"} | null}
Result:  {"compile_error", "results": [...], "trace": {...} | null}

Writes its result to a file rather than stdout so that anything the user's code prints can't
corrupt the result.
"""

import ast
import bisect
import collections
import copy
import functools
import heapq
import io
import itertools
import json
import math
import operator
import random
import re
import signal
import string
import sys
import time
import traceback
import typing
from contextlib import redirect_stderr, redirect_stdout

SOLUTION_FILE = "<solution>"
STDOUT_LIMIT = 4000
LIST_LIMIT = 200
DICT_LIMIT = 100
HEAP_NODE_LIMIT = 300
FLOAT_TOL = 1e-5


# ---------------------------------------------------------------------------------------------
# LeetCode data structures
# ---------------------------------------------------------------------------------------------


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

    def __repr__(self):
        return f"ListNode({self.val})"


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

    def __repr__(self):
        return f"TreeNode({self.val})"


class RandomNode:
    """LeetCode 138's `Node`."""

    def __init__(self, x=0, next=None, random=None):
        self.val = int(x)
        self.next = next
        self.random = random

    def __repr__(self):
        return f"Node({self.val})"


class GraphNode:
    """LeetCode 133's `Node`."""

    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []

    def __repr__(self):
        return f"Node({self.val})"


class TestTimeout(BaseException):
    """BaseException so a user's `except Exception:` can't swallow the time limit."""


# ---------------------------------------------------------------------------------------------
# Value conversion (JSON <-> Python structures)
# ---------------------------------------------------------------------------------------------


def build_list(values):
    dummy = ListNode()
    cur = dummy
    for v in values:
        cur.next = ListNode(v)
        cur = cur.next
    return dummy.next


def list_to_json(head, limit=10_000):
    out = []
    seen = set()
    while head is not None:
        if id(head) in seen or len(out) >= limit:
            raise ValueError("returned linked list contains a cycle")
        seen.add(id(head))
        out.append(head.val)
        head = head.next
    return out


def build_cycle_list(spec):
    nodes = [ListNode(v) for v in spec["values"]]
    for a, b in zip(nodes, nodes[1:]):
        a.next = b
    pos = spec.get("pos", -1)
    if nodes and pos is not None and pos >= 0:
        nodes[-1].next = nodes[pos]
    return nodes[0] if nodes else None


def build_random_list(pairs):
    nodes = [RandomNode(v) for v, _ in pairs]
    for i, (_, r) in enumerate(pairs):
        if i + 1 < len(nodes):
            nodes[i].next = nodes[i + 1]
        nodes[i].random = nodes[r] if r is not None else None
    return nodes[0] if nodes else None


def random_list_to_json(head, original_ids):
    nodes = []
    index = {}
    cur = head
    while cur is not None:
        if id(cur) in index or len(nodes) > 10_000:
            raise ValueError("returned list contains a cycle")
        if id(cur) in original_ids:
            raise ValueError("returned list reuses original nodes; it must be a deep copy")
        index[id(cur)] = len(nodes)
        nodes.append(cur)
        cur = cur.next
    out = []
    for n in nodes:
        if n.random is not None and id(n.random) not in index:
            raise ValueError("a random pointer points outside the copied list")
        out.append([n.val, index[id(n.random)] if n.random is not None else None])
    return out


def build_tree(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue = collections.deque([root])
    i = 1
    while queue and i < len(values):
        node = queue.popleft()
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i])
            queue.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            queue.append(node.right)
        i += 1
    return root


def tree_to_json(root):
    if root is None:
        return []
    out = []
    queue = collections.deque([root])
    seen = set()
    while queue:
        node = queue.popleft()
        if node is None:
            out.append(None)
            continue
        if id(node) in seen:
            raise ValueError("returned tree contains a cycle")
        seen.add(id(node))
        out.append(node.val)
        queue.append(node.left)
        queue.append(node.right)
    while out and out[-1] is None:
        out.pop()
    return out


def build_graph(adjacency):
    if not adjacency:
        return None
    nodes = [GraphNode(i + 1) for i in range(len(adjacency))]
    for i, neigh in enumerate(adjacency):
        nodes[i].neighbors = [nodes[j - 1] for j in neigh]
    return nodes[0]


def graph_nodes(start):
    seen = {}
    stack = [start] if start is not None else []
    while stack:
        n = stack.pop()
        if id(n) in seen:
            continue
        seen[id(n)] = n
        stack.extend(n.neighbors)
    return seen


def graph_to_json(start, original_ids):
    if start is None:
        return []
    nodes = graph_nodes(start)
    if any(i in original_ids for i in nodes):
        raise ValueError("returned graph reuses original nodes; it must be a deep copy")
    by_val = {n.val: n for n in nodes.values()}
    return [sorted(nb.val for nb in by_val[v].neighbors) for v in range(1, len(by_val) + 1)]


def find_tree_node(root, val):
    """The node with this value in the tree (LeetCode passes p/q as nodes inside root)."""
    stack = [root]
    while stack:
        node = stack.pop()
        if node is None:
            continue
        if node.val == val:
            return node
        stack.extend((node.left, node.right))
    return None


def to_python(value, type_name):
    if type_name == "ListNode":
        return build_list(value)
    if type_name == "ListNode[]":
        return [build_list(v) for v in value]
    if type_name == "ListNodeCycle":
        return build_cycle_list(value)
    if type_name == "RandomListNode":
        return build_random_list(value)
    if type_name == "TreeNode":
        return build_tree(value)
    if type_name == "GraphNode":
        return build_graph(value)
    return value


def originals_of(args, params):
    """ids of input nodes, used to verify deep-copy problems don't return the originals."""
    ids = set()
    for arg, p in zip(args, params):
        if p.get("type") == "GraphNode" and arg is not None:
            ids.update(graph_nodes(arg))
        elif p.get("type") == "RandomListNode":
            cur = arg
            while cur is not None and id(cur) not in ids:
                ids.add(id(cur))
                cur = cur.next
    return ids


def to_json_value(value, type_name="any", original_ids=frozenset()):
    if type_name == "ListNode":
        return list_to_json(value)
    if type_name == "ListNode[]":
        return [list_to_json(v) for v in value]
    if type_name == "RandomListNode":
        return random_list_to_json(value, original_ids)
    if type_name == "TreeNode":
        return tree_to_json(value)
    if type_name == "TreeNodeVal":
        return value.val if value is not None else None
    if type_name == "GraphNode":
        return graph_to_json(value, original_ids)
    return plain(value)


def plain(value):
    """Best-effort conversion of an arbitrary return value to JSON-compatible data."""
    if value is None or isinstance(value, (bool, int, str)):
        return value
    if isinstance(value, float):
        if math.isinf(value) or math.isnan(value):
            return str(value)
        return value
    if isinstance(value, (list, tuple, collections.deque)):
        return [plain(v) for v in value]
    if isinstance(value, (set, frozenset)):
        items = [plain(v) for v in value]
        try:
            return sorted(items)
        except TypeError:
            return items
    if isinstance(value, dict):
        return {str(k): plain(v) for k, v in value.items()}
    if isinstance(value, ListNode):
        return list_to_json(value)
    if isinstance(value, TreeNode):
        return tree_to_json(value)
    return repr(value)


# ---------------------------------------------------------------------------------------------
# Comparison
# ---------------------------------------------------------------------------------------------


def _sort_key(v):
    return json.dumps(v, sort_keys=True)


def floats_close(a, b):
    if isinstance(a, bool) or isinstance(b, bool):
        return a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return math.isclose(a, b, rel_tol=FLOAT_TOL, abs_tol=FLOAT_TOL)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(floats_close(x, y) for x, y in zip(a, b))
    return a == b


def matches(actual, expected, mode):
    if mode == "float":
        return floats_close(actual, expected)
    if mode == "unordered":
        if not isinstance(actual, list) or not isinstance(expected, list):
            return actual == expected
        return sorted(actual, key=_sort_key) == sorted(expected, key=_sort_key)
    if mode == "unordered_nested":
        if not isinstance(actual, list) or not isinstance(expected, list):
            return actual == expected

        def norm(outer):
            inner = [sorted(x, key=_sort_key) if isinstance(x, list) else x for x in outer]
            return sorted(inner, key=_sort_key)

        return norm(actual) == norm(expected)
    return actual == expected


# ---------------------------------------------------------------------------------------------
# Tracing (sys.settrace) -> JSON steps for the visualizers
# ---------------------------------------------------------------------------------------------

SKIP_FRAMES = {"<genexpr>", "<lambda>", "<listcomp>", "<dictcomp>", "<setcomp>"}


class TraceLimit(BaseException):
    """Raised when the step budget is used up; BaseException for the same reason as TestTimeout."""


class Snapshotter:
    """Serializes locals. Objects with attributes (ListNode, TreeNode, user classes) go into a
    per-step heap and are referenced by stable ids, so the frontend can draw pointers."""

    def __init__(self):
        self._ids = {}
        self._keepalive = []

    def ref_id(self, obj):
        key = id(obj)
        if key not in self._ids:
            self._ids[key] = len(self._ids) + 1
            self._keepalive.append(obj)  # prevent id reuse after garbage collection
        return self._ids[key]

    def value(self, v, heap, depth=0):
        if v is None or isinstance(v, (bool, int, str)):
            return v
        if isinstance(v, float):
            if math.isinf(v):
                return {"$inf": 1 if v > 0 else -1}
            if math.isnan(v):
                return {"$nan": True}
            return v
        if depth > 6:
            return {"$repr": "…"}
        if isinstance(v, list):
            out = [self.value(x, heap, depth + 1) for x in v[:LIST_LIMIT]]
            if len(v) > LIST_LIMIT:
                out.append({"$more": len(v) - LIST_LIMIT})
            return out
        if isinstance(v, tuple):
            return {"$tuple": [self.value(x, heap, depth + 1) for x in v[:LIST_LIMIT]]}
        if isinstance(v, collections.deque):
            return {"$deque": [self.value(x, heap, depth + 1) for x in list(v)[:LIST_LIMIT]]}
        if isinstance(v, (set, frozenset)):
            items = list(v)
            try:
                items.sort()
            except TypeError:
                pass
            return {"$set": [self.value(x, heap, depth + 1) for x in items[:LIST_LIMIT]]}
        if isinstance(v, dict):
            items = list(v.items())[:DICT_LIMIT]
            kind = type(v).__name__
            return {
                "$dict": [[self.value(k, heap, depth + 1), self.value(x, heap, depth + 1)] for k, x in items],
                **({"$kind": kind} if kind != "dict" else {}),
                **({"$more": len(v) - DICT_LIMIT} if len(v) > DICT_LIMIT else {}),
            }
        if hasattr(v, "__dict__") and not callable(v):
            self._add_to_heap(v, heap)
            return {"$ref": self.ref_id(v)}
        return {"$repr": repr(v)[:80]}

    def _add_to_heap(self, root, heap):
        stack = [root]
        while stack:
            obj = stack.pop()
            rid = self.ref_id(obj)
            if str(rid) in heap or len(heap) >= HEAP_NODE_LIMIT:
                continue
            fields = {}
            heap[str(rid)] = {"type": type(obj).__name__, "fields": fields}
            for name, val in vars(obj).items():
                if name.startswith("__"):
                    continue
                if hasattr(val, "__dict__") and not callable(val):
                    stack.append(val)
                    fields[name] = {"$ref": self.ref_id(val)}
                elif isinstance(val, list) and any(hasattr(x, "__dict__") and not callable(x) for x in val):
                    refs = []
                    for x in val[:LIST_LIMIT]:
                        if hasattr(x, "__dict__") and not callable(x):
                            stack.append(x)
                            refs.append({"$ref": self.ref_id(x)})
                        else:
                            refs.append(self.value(x, heap))
                    fields[name] = refs
                else:
                    fields[name] = self.value(val, heap, 1)

    def locals_of(self, frame, heap):
        out = {}
        for name, v in frame.f_locals.items():
            if name.startswith("__") or callable(v) or isinstance(v, type(sys)):
                continue
            if name == "self" and hasattr(v, "__dict__") and not vars(v):
                continue  # empty Solution instance carries no information
            out[name] = self.value(v, heap)
        return out


class CodeAnalyzer:
    def __init__(self, code: str):
        self.code_lines = code.splitlines()
        self.line_info = {}
        self.slice_nodes_by_line = {}
        self._analyze(code)

    def _analyze(self, code: str):
        if not code:
            return
        try:
            tree = ast.parse(code)
        except Exception:
            return

        type_names = {"list", "dict", "tuple", "set", "Optional", "Union", "Any", "Callable"}

        for node in ast.walk(tree):
            if not hasattr(node, "lineno"):
                continue
            line = node.lineno
            if line not in self.line_info:
                text = self.code_lines[line - 1].strip() if 0 < line <= len(self.code_lines) else ""
                self.line_info[line] = {"text": text, "kinds": set(), "subscripts": []}
                self.slice_nodes_by_line[line] = []

            info = self.line_info[line]

            if isinstance(node, ast.Compare):
                info["kinds"].add("compare")
            elif isinstance(node, ast.Return):
                info["kinds"].add("return")
            elif isinstance(node, ast.Assign):
                if len(node.targets) == 1 and isinstance(node.targets[0], ast.Tuple) and isinstance(node.value, ast.Tuple):
                    if len(node.targets[0].elts) == len(node.value.elts):
                        info["kinds"].add("swap")
                if any(isinstance(t, ast.Subscript) for t in node.targets):
                    info["kinds"].add("write")
            elif isinstance(node, ast.AugAssign):
                info["kinds"].add("write")
            elif isinstance(node, ast.Call):
                func_name = ""
                if isinstance(node.func, ast.Name):
                    func_name = node.func.id
                elif isinstance(node.func, ast.Attribute):
                    func_name = node.func.attr
                if func_name in ("append", "pop", "push", "heappush", "heappop", "enqueue", "dequeue"):
                    info["kinds"].add(func_name)

            if isinstance(node, ast.Subscript):
                if isinstance(node.value, ast.Name) and node.value.id in type_names:
                    continue
                try:
                    s_str = ast.unparse(node)
                except Exception:
                    s_str = ""
                if s_str and s_str not in info["subscripts"]:
                    info["subscripts"].append(s_str)
                    self.slice_nodes_by_line[line].append(node.slice)

    def resolve_focus(self, line: int, f_locals: dict):
        slices = self.slice_nodes_by_line.get(line, [])
        if not slices:
            return []
        focus = []
        for s in slices:
            val = self._eval_whitelist(s, f_locals)
            if isinstance(val, int) and 0 <= val < 1000 and val not in focus:
                focus.append(val)
        return focus[:6]

    def _eval_whitelist(self, node, f_locals):
        if isinstance(node, ast.Constant):
            if isinstance(node.value, int):
                return node.value
        elif isinstance(node, ast.Name):
            val = f_locals.get(node.id)
            if isinstance(val, int):
                return val
        elif isinstance(node, ast.BinOp):
            l = self._eval_whitelist(node.left, f_locals)
            r = self._eval_whitelist(node.right, f_locals)
            if l is not None and r is not None:
                if isinstance(node.op, ast.Add): return l + r
                elif isinstance(node.op, ast.Sub): return l - r
                elif isinstance(node.op, ast.Mult): return l * r
                elif isinstance(node.op, ast.FloorDiv) and r != 0: return l // r
                elif isinstance(node.op, ast.Mod) and r != 0: return l % r
        elif isinstance(node, ast.UnaryOp):
            op = self._eval_whitelist(node.operand, f_locals)
            if op is not None:
                if isinstance(node.op, ast.USub): return -op
                elif isinstance(node.op, ast.UAdd): return op
        return None

    def line_info_for_json(self):
        return {
            str(line): {
                "text": data["text"],
                "kinds": sorted(list(data["kinds"])),
                "subscripts": data["subscripts"][:10],
            }
            for line, data in sorted(self.line_info.items())
        }


class Tracer:
    def __init__(self, max_steps, code=""):
        self.max_steps = max_steps
        self.steps = []
        self.frames = []  # stack of (frame_obj, frame_id)
        self.next_frame_id = 1
        self.snap = Snapshotter()
        self.truncated = False
        self.analyzer = CodeAnalyzer(code)

    def _record(self, event, frame, extra=None):
        if len(self.steps) >= self.max_steps:
            self.truncated = True
            raise TraceLimit()
        heap = {}
        frames = [
            {"id": fid, "func": f.f_code.co_name, "line": f.f_lineno, "locals": self.snap.locals_of(f, heap)}
            for f, fid in self.frames
        ]
        step = {"event": event, "line": frame.f_lineno, "func": frame.f_code.co_name,
                "depth": len(self.frames), "frames": frames, "heap": heap}
        if extra:
            step.update(extra)
        self.steps.append(step)

    def global_trace(self, frame, event, arg):
        if event != "call" or frame.f_code.co_filename != SOLUTION_FILE:
            return None
        if frame.f_code.co_name in SKIP_FRAMES:
            return None
        self.frames.append((frame, self.next_frame_id))
        self.next_frame_id += 1
        code = frame.f_code
        n_params = code.co_argcount + code.co_kwonlyargcount
        self._record("call", frame, {"params": list(code.co_varnames[:n_params])})
        return self.local_trace

    def local_trace(self, frame, event, arg):
        if event == "line":
            extra = {}
            focus = self.analyzer.resolve_focus(frame.f_lineno, frame.f_locals)
            if focus:
                extra["focus"] = focus
            self._record("line", frame, extra if extra else None)
        elif event == "return":
            heap = {}
            self._record("return", frame, {"return_value": self.snap.value(arg, heap), "return_heap": heap})
            if self.frames and self.frames[-1][0] is frame:
                self.frames.pop()
        elif event == "exception":
            exc_type, exc, _ = arg
            if exc_type not in (TraceLimit, TestTimeout):
                self._record("exception", frame, {"exception": f"{exc_type.__name__}: {exc}"})
        return self.local_trace


# ---------------------------------------------------------------------------------------------
# Execution
# ---------------------------------------------------------------------------------------------


def make_namespace(function_spec):
    ns = {"__name__": "__solution__", "__builtins__": __builtins__}
    for name in typing.__all__:
        ns[name] = getattr(typing, name)
    ns.update({
        "collections": collections, "deque": collections.deque, "defaultdict": collections.defaultdict,
        "Counter": collections.Counter, "OrderedDict": collections.OrderedDict,
        "heapq": heapq, "math": math, "bisect": bisect, "itertools": itertools, "functools": functools,
        "lru_cache": functools.lru_cache, "cache": functools.cache, "reduce": functools.reduce,
        "string": string, "re": re, "random": random, "operator": operator,
        "inf": math.inf, "ListNode": ListNode, "TreeNode": TreeNode,
    })
    types = {p.get("type") for p in function_spec.get("params", [])} | {function_spec.get("returns")}
    if "GraphNode" in types:
        ns["Node"] = GraphNode
    elif "RandomListNode" in types:
        ns["Node"] = RandomNode
    return ns


def error_info(exc, tb=None):
    line = None
    for frame_summary in traceback.extract_tb(tb or exc.__traceback__):
        if frame_summary.filename == SOLUTION_FILE:
            line = frame_summary.lineno
    if isinstance(exc, SyntaxError) and exc.filename == SOLUTION_FILE:
        line = exc.lineno
    if isinstance(exc, TestTimeout):
        return {"type": "TimeLimitExceeded", "message": "Time limit exceeded (infinite loop or too slow?)", "line": line}
    if isinstance(exc, MemoryError):
        return {"type": "MemoryLimitExceeded", "message": "Memory limit exceeded", "line": line}
    return {"type": type(exc).__name__, "message": str(exc), "line": line}


def _alarm(_signum, _frame):
    raise TestTimeout()


def call_once(ns, spec, test_args, tracer=None):
    """Runs one test case. Returns (actual_json, stdout)."""
    out = io.StringIO()
    with redirect_stdout(out), redirect_stderr(out):
        if spec.get("kind", "function") == "design":
            cls = ns.get(spec["name"])
            if cls is None:
                raise NameError(f"class {spec['name']} is not defined")
            ops, op_args = test_args["ops"], copy.deepcopy(test_args["args"])
            results = []
            if tracer:
                sys.settrace(tracer.global_trace)
            try:
                obj = cls(*op_args[0])
                results.append(None)
                for op, a in zip(ops[1:], op_args[1:]):
                    results.append(plain(getattr(obj, op)(*a)))
            finally:
                sys.settrace(None)
            actual = results
        else:
            sol_cls = ns.get("Solution")
            if sol_cls is None:
                raise NameError("class Solution is not defined")
            method = getattr(sol_cls(), spec["name"], None)
            if method is None:
                raise NameError(f"Solution.{spec['name']} is not defined")
            params = spec.get("params", [])
            args = [to_python(copy.deepcopy(a), p.get("type", "any")) for a, p in zip(test_args, params)]
            args += copy.deepcopy(test_args[len(params):])
            tree = next((a for a, p in zip(args, params) if p.get("type") == "TreeNode"), None)
            for i, p in enumerate(params):
                if p.get("type") == "TreeNodeRef":
                    args[i] = find_tree_node(tree, args[i])
            originals = originals_of(args, params)
            if tracer:
                sys.settrace(tracer.global_trace)
            try:
                ret = method(*args)
            finally:
                sys.settrace(None)
            if spec.get("inplace_arg") is not None:
                idx = spec["inplace_arg"]
                actual = to_json_value(args[idx], params[idx].get("type", "any") if idx < len(params) else "any")
            else:
                actual = to_json_value(ret, spec.get("returns", "any"), originals)
    return actual, out.getvalue()[:STDOUT_LIMIT]


def run(payload):
    code = payload["code"]
    spec = payload["function"]
    tests = payload["tests"]
    per_test_timeout = float(payload.get("per_test_timeout", 2.0))
    result = {"compile_error": None, "results": [], "trace": None}

    try:
        compiled = compile(code, SOLUTION_FILE, "exec")
    except SyntaxError as exc:
        result["compile_error"] = error_info(exc)
        return result

    ns = make_namespace(spec)
    try:
        with redirect_stdout(io.StringIO()):
            exec(compiled, ns)
    except Exception as exc:  # noqa: BLE001 - report any definition-time error to the user
        result["compile_error"] = error_info(exc)
        return result

    signal.signal(signal.SIGALRM, _alarm)
    for i, test in enumerate(tests):
        entry = {"index": i, "passed": False, "expected": test["expected"], "actual": None,
                 "error": None, "stdout": "", "runtime_ms": 0}
        start = time.perf_counter()
        signal.setitimer(signal.ITIMER_REAL, per_test_timeout)
        try:
            actual, stdout = call_once(ns, spec, test["args"])
            entry["actual"], entry["stdout"] = actual, stdout
            entry["passed"] = matches(actual, test["expected"], spec.get("compare", "exact"))
        except (Exception, RecursionError, TestTimeout) as exc:  # noqa: BLE001
            entry["error"] = error_info(exc)
        finally:
            signal.setitimer(signal.ITIMER_REAL, 0)
        entry["runtime_ms"] = round((time.perf_counter() - start) * 1000, 2)
        result["results"].append(entry)

    trace_cfg = payload.get("trace")
    if trace_cfg is not None and tests:
        idx = trace_cfg.get("test_index", 0)
        idx = idx if 0 <= idx < len(tests) else 0
        tracer = Tracer(int(trace_cfg.get("max_steps", 1500)), code=payload.get("code", ""))
        trace = {
            "test_index": idx,
            "steps": tracer.steps,
            "line_info": tracer.analyzer.line_info_for_json(),
            "truncated": False,
            "error": None,
        }
        signal.setitimer(signal.ITIMER_REAL, per_test_timeout * 3)
        try:
            call_once(ns, spec, tests[idx]["args"], tracer)
        except TraceLimit:
            pass
        except (Exception, RecursionError, TestTimeout) as exc:  # noqa: BLE001
            trace["error"] = error_info(exc)
        finally:
            signal.setitimer(signal.ITIMER_REAL, 0)
            sys.settrace(None)
        trace["truncated"] = tracer.truncated
        result["trace"] = trace

    return result


def main():
    payload_path, result_path = sys.argv[1], sys.argv[2]
    with open(payload_path) as f:
        payload = json.load(f)
    sys.setrecursionlimit(5000)
    result = run(payload)
    with open(result_path, "w") as f:
        json.dump(result, f, default=repr)


if __name__ == "__main__":
    main()

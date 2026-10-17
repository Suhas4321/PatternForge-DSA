"""Data definitions for Batch 4B — Peak V (Backend APIs)."""

LESSONS_4B = []

# ==========================================
# W32: FastAPI & Pydantic (3 lessons)
# ==========================================

LESSONS_4B.append({
    "dir": "32-fastapi-pydantic",
    "world_id": 32,
    "slug": "pydantic-payload-validator",
    "lc": 9511,
    "citadel_id": "backend_apis",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Pydantic Schema Validation & HTTP 422",
    "patterns": ["schema-validation", "http-422", "pydantic"],
    "visualizer": "http_lifecycle",
    "data": {
        "slug": "pydantic-payload-validator",
        "lc": 9511,
        "citadel_id": "backend_apis",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How does FastAPI prevent corrupt or malformed client payloads from crashing backend services? FastAPI uses Pydantic to validate request bodies against Python type annotations and field constraints before business logic runs. When a payload is missing required fields, has invalid types, or violates constraints, the framework rejects it with HTTP 422 Unprocessable Entity and detailed error locators.",
            "brute_force": "Writing manual `if not data.get('x'): return 400` checks in every route handler, leading to inconsistent error responses and runtime bugs.",
            "brute_force_complexity": "High developer toil and brittle validation logic.",
            "key_insight": "A declarative schema definition validates field presence, data type, and boundary constraints in a single pass, returning structured 422 error objects.",
            "real_world": "FastAPI request body validation, Stripe API parameter verification, and JSON schema gateway filters.",
        },
        "statement": {
            "clean": """Implement a Pydantic-style schema validation engine for incoming API request bodies:
`validate_payload(schema: dict, payload: dict) -> dict`.

Input:
- `schema`: dictionary mapping field names to rules:
  `{"type": "str" | "int" | "float" | "bool", "required": bool, "min": optional_num, "max": optional_num}`.
- `payload`: dictionary of client-submitted JSON data.

Validation Rules:
1. Missing Fields:
   - If a field is `required: True` in `schema` but not in `payload`:
     error: `{"loc": ["body", field], "msg": "Field required", "type": "missing"}`.
2. Type Mismatch:
   - If present, verify data types:
     - `"bool"`: must be `isinstance(val, bool)`.
     - `"int"`: must be `isinstance(val, int)` and `not isinstance(val, bool)` (in Python bool is an int subclass).
     - `"float"`: must be `isinstance(val, (int, float))` and `not isinstance(val, bool)`.
     - `"str"`: must be `isinstance(val, str)`.
   - On type failure:
     error: `{"loc": ["body", field], "msg": f"Input should be a valid {expected_type}", "type": f"{expected_type}_type"}`.
3. Constraint Bounds:
   - If `min` is specified and `val < min`:
     error: `{"loc": ["body", field], "msg": f"Input should be greater than or equal to {min}", "type": "greater_than_equal"}`.
   - If `max` is specified and `val > max`:
     error: `{"loc": ["body", field], "msg": f"Input should be less than or equal to {max}", "type": "less_than_equal"}`.

Output Format:
- If errors exist:
  return `{"status_code": 422, "detail": errors, "valid": False}`.
- If no errors:
  return `{"status_code": 200, "data": payload, "valid": True}`.""",
            "oa_story": """**UrbanFix Service Booking — Request Validation Failure**

UrbanFix customers booking home maintenance entered string values for technician counts and negative quantities for spare parts. The legacy Flask API crashed with unhandled 500 exceptions, polluting Sentry alert logs.

The team migrated the booking endpoint to FastAPI. Implement this Pydantic-style validation engine to reject invalid payloads with clean HTTP 422 Unprocessable Entity responses before database queries execute.""",
            "trigger_keywords": ["pydantic-style schema validation", "validate_payload", "status_code"],
            "examples": [
                {
                    "input": 'schema = {"name": {"type": "str", "required": True}, "age": {"type": "int", "required": True, "min": 18}}, payload = {"name": "Aarav", "age": 16}',
                    "output": '{"status_code": 422, "detail": [{"loc": ["body", "age"], "msg": "Input should be greater than or equal to 18", "type": "greater_than_equal"}], "valid": False}',
                    "explanation": "Age 16 violates the min constraint of 18, returning HTTP 422.",
                },
                {
                    "input": 'schema = {"name": {"type": "str", "required": True}}, payload = {"name": "Priya"}',
                    "output": '{"status_code": 200, "data": {"name": "Priya"}, "valid": True}',
                    "explanation": "Payload passes all schema rules, returning HTTP 200.",
                },
            ],
            "constraints": [
                "0 <= len(schema) <= 50",
                "0 <= len(payload) <= 50",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why does FastAPI return HTTP 422 Unprocessable Entity instead of HTTP 400 Bad Request for schema errors?",
            "options": [
                "422 signifies the JSON syntax is well-formed, but the semantic data violates model domain constraints",
                "422 is faster to serialize over HTTP/2",
                "HTTP 400 is not supported in Python",
                "422 instructs browsers to automatically reload the page",
            ],
            "answer": 0,
            "explanation": "RFC 4918 / RFC 9110 define 422 Unprocessable Entity for requests that are syntactically correct JSON but contain semantic validation or business constraint errors.",
        },
        "pattern_quiz": {
            "prompt": "Why is `isinstance(val, bool)` a critical check when validating integer types in Python?",
            "options": [
                "In Python, bool is a subclass of int (True == 1, False == 0), so isinstance(True, int) returns True without explicit checking",
                "Python booleans occupy 64 bits",
                "Integer types cannot be serialized to JSON",
                "Pydantic prohibits boolean fields",
            ],
            "answer": 0,
            "explanation": "Because `bool` inherits from `int` in Python, validating `isinstance(True, int)` evaluates to True. Validators must guard against bool inputs when expecting integer numbers.",
        },
        "function": {
            "name": "validate_payload",
            "params": [{"name": "schema"}, {"name": "payload"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def validate_payload(self, schema: dict, payload: dict) -> dict:
        pass
""",
        "tests": [
            {
                "args": [
                    {"name": {"type": "str", "required": True}, "age": {"type": "int", "required": True, "min": 18}},
                    {"name": "Aarav", "age": 16}
                ],
                "expected": {
                    "status_code": 422,
                    "detail": [{"loc": ["body", "age"], "msg": "Input should be greater than or equal to 18", "type": "greater_than_equal"}],
                    "valid": False,
                },
                "note": "Min age constraint failure",
            },
            {
                "args": [
                    {"email": {"type": "str", "required": True}},
                    {}
                ],
                "expected": {
                    "status_code": 422,
                    "detail": [{"loc": ["body", "email"], "msg": "Field required", "type": "missing"}],
                    "valid": False,
                },
                "note": "Missing required field",
            },
            {
                "args": [
                    {"active": {"type": "bool", "required": True}},
                    {"active": "yes"}
                ],
                "expected": {
                    "status_code": 422,
                    "detail": [{"loc": ["body", "active"], "msg": "Input should be a valid boolean", "type": "bool_type"}],
                    "valid": False,
                },
                "note": "Type mismatch for boolean",
            },
            {
                "args": [
                    {"title": {"type": "str", "required": True}},
                    {"title": "Senior Engineer"}
                ],
                "expected": {
                    "status_code": 200,
                    "data": {"title": "Senior Engineer"},
                    "valid": True,
                },
                "note": "Valid payload passes",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Check missing required field",
                "goal": "Identify if a required field is missing from payload.",
                "instructions": "Return `True` if `required and field not in payload`, else `False`.",
                "function": {"name": "drill_is_missing", "params": [{"name": "field"}, {"name": "required"}, {"name": "payload"}]},
                "starter_code": """class Solution:
    def drill_is_missing(self, field: str, required: bool, payload: dict) -> bool:
        pass
""",
                "tests": [
                    {"args": ["email", True, {}], "expected": True},
                    {"args": ["email", True, {"email": "test@test.com"}], "expected": False},
                ],
                "solution": """class Solution:
    def drill_is_missing(self, field: str, required: bool, payload: dict) -> bool:
        return required and (field not in payload)
""",
                "hint": "Check `required and (field not in payload)`.",
            },
            {
                "skill": "core",
                "title": "Validate strict integer type",
                "goal": "Verify value is integer and not boolean.",
                "instructions": "Return `True` if `isinstance(val, int) and not isinstance(val, bool)`.",
                "function": {"name": "drill_strict_int", "params": [{"name": "val"}]},
                "starter_code": """class Solution:
    def drill_strict_int(self, val: any) -> bool:
        pass
""",
                "tests": [
                    {"args": [42], "expected": True},
                    {"args": [True], "expected": False},
                    {"args": ["42"], "expected": False},
                ],
                "solution": """class Solution:
    def drill_strict_int(self, val: any) -> bool:
        return isinstance(val, int) and not isinstance(val, bool)
""",
                "hint": "Return `isinstance(val, int) and not isinstance(val, bool)`.",
            },
            {
                "skill": "edge",
                "title": "Format 422 error object",
                "goal": "Build standard Pydantic error dictionary.",
                "instructions": "Return `{'loc': ['body', field], 'msg': msg, 'type': err_type}`.",
                "function": {"name": "drill_err_dict", "params": [{"name": "field"}, {"name": "msg"}, {"name": "err_type"}]},
                "starter_code": """class Solution:
    def drill_err_dict(self, field: str, msg: str, err_type: str) -> dict:
        pass
""",
                "tests": [
                    {"args": ["age", "Too young", "value_error"], "expected": {"loc": ["body", "age"], "msg": "Too young", "type": "value_error"}},
                ],
                "solution": """class Solution:
    def drill_err_dict(self, field: str, msg: str, err_type: str) -> dict:
        return {"loc": ["body", field], "msg": msg, "type": err_type}
""",
                "hint": "Construct the dictionary with loc, msg, and type.",
            },
        ],
        "hints": [
            "Iterate through `schema.items()`. First check if required fields are present in payload.",
            "Verify type matching strictly, taking special care that booleans are not treated as ints.",
            """| # Pseudocode Blueprint
| errors = []
| for field, rules in schema.items():
|     if field not in payload:
|         if rules.required: errors.append(missing_error)
|     else:
|         val = payload[field]
|         if not valid_type(val, rules.type): errors.append(type_error)
|         if min and val < min: errors.append(min_error)
|         if max and val > max: errors.append(max_error)
| if errors: return 422, errors, False
| return 200, payload, True""",
        ],
        "solution": {
            "code": """class Solution:
    def validate_payload(self, schema: dict, payload: dict) -> dict:
        errors = []
        type_map = {"str": str, "int": int, "float": (int, float), "bool": bool}

        for field, rules in schema.items():
            if field not in payload:
                if rules.get("required", False):
                    errors.append({"loc": ["body", field], "msg": "Field required", "type": "missing"})
                continue

            val = payload[field]
            expected_type_name = rules.get("type", "str")
            expected_type = type_map.get(expected_type_name, str)

            if expected_type_name == "bool" and not isinstance(val, bool):
                errors.append({"loc": ["body", field], "msg": "Input should be a valid boolean", "type": "bool_type"})
                continue
            elif expected_type_name == "int" and (isinstance(val, bool) or not isinstance(val, int)):
                errors.append({"loc": ["body", field], "msg": "Input should be a valid integer", "type": "int_type"})
                continue
            elif not isinstance(val, expected_type):
                errors.append({"loc": ["body", field], "msg": f"Input should be a valid {expected_type_name}", "type": f"{expected_type_name}_type"})
                continue

            min_val = rules.get("min")
            max_val = rules.get("max")
            if min_val is not None and val < min_val:
                errors.append({"loc": ["body", field], "msg": f"Input should be greater than or equal to {min_val}", "type": "greater_than_equal"})
            if max_val is not None and val > max_val:
                errors.append({"loc": ["body", field], "msg": f"Input should be less than or equal to {max_val}", "type": "less_than_equal"})

        if errors:
            return {"status_code": 422, "detail": errors, "valid": False}
        return {"status_code": 200, "data": payload, "valid": True}
""",
            "explanation": "Iterating through the schema rules validates field presence, enforces strict type checking (guarding against Python's bool-is-int inheritance), and checks numeric boundaries. Accumulating all errors into an HTTP 422 payload provides granular client feedback in a single round-trip.",
            "time": "O(S) where S is the number of schema fields",
            "space": "O(E) for the accumulated errors list",
        },
        "pitch_script": """**(Clarify)** "We need to build a schema validation engine that checks payload presence, strict types, and boundary constraints, returning an HTTP 422 response with detailed locators on failure."

**(Brute force)** "Scattering ad-hoc `if-else` assertions in handler functions leads to unhandled 500 crashes and fragmented error formats."

**(Trigger)** "Validating request bodies against declarative field rules and returning HTTP 422 signals Pydantic-style model validation."

**(Optimal)** "We iterate through the schema. If a required field is missing, we append a missing error. If present, we strictly validate types, guarding against Python treating booleans as integers. We check min and max constraints. If any errors occurred, we return 422 with the details list; otherwise 200 with the clean data."

**(Complexity)** "Executes in O(S) time where S is schema size and O(E) space for errors." """,
        "twist": {
            "lc": 9512,
            "title": "FastAPI Dependency Injection Graph Resolver",
            "why": "Once the request body is validated, FastAPI uses `Depends()` to resolve the dependency injection graph (DB sessions, auth tokens, cache connections).",
        },
        "viz": {
            "title": "Pydantic Schema Validation Flow",
            "type": "http_lifecycle",
        },
    },
})

LESSONS_4B.append({
    "dir": "32-fastapi-pydantic",
    "world_id": 32,
    "slug": "dependency-injection-resolver",
    "lc": 9512,
    "citadel_id": "backend_apis",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "FastAPI Dependency Injection Resolver",
    "patterns": ["dependency-injection", "dag-resolution", "ioc", "caching"],
    "visualizer": "http_lifecycle",
    "data": {
        "slug": "dependency-injection-resolver",
        "lc": 9512,
        "citadel_id": "backend_apis",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How does FastAPI instantiate complex request contexts without instantiating duplicate database sessions or re-verifying auth tokens multiple times in a single request? FastAPI's `Depends()` framework models dependencies as a Directed Acyclic Graph (DAG). It resolves sub-dependencies in topological post-order and caches resolved instances within the request scope.",
            "brute_force": "Instantiating database connections inside every helper function, exhausting connection pools.",
            "brute_force_complexity": "O(N) connection allocations per API request.",
            "key_insight": "Topological post-order depth-first traversal resolves child dependencies first, while a request-scoped cache returns existing instances on duplicate references.",
            "real_world": "FastAPI `Depends(get_db)` session scoping, NestJS dependency injection, and Spring Boot request-scoped beans.",
        },
        "statement": {
            "clean": """Implement a dependency injection graph resolver modeling FastAPI's `Depends()` mechanism:
`resolve_dependencies(endpoint: str, dependency_graph: dict[str, list[str]], providers: dict[str, str]) -> dict`.

Inputs:
- `endpoint`: name of the root endpoint function to resolve.
- `dependency_graph`: dictionary mapping each function name to its list of direct dependencies (e.g. `{"checkout": ["get_auth", "get_db"]}`).
- `providers`: dictionary mapping dependency function names to their mock returned value (e.g. `{"get_db": "session_pgsql_1"}`).

Rules:
1. Post-order DFS Resolution:
   - For any node, resolve all of its dependencies first before appending the node itself to `resolution_order`.
2. Request-Scope Caching:
   - Maintain `resolved_values = {}` mapping node name to its resolved provider value.
   - If a dependency node is already in `resolved_values`, do NOT re-resolve it or re-visit its sub-dependencies. Increment `cached_hits` by 1 and return.
   - If a node is not in `providers`, fallback to `f"mock_{node}"`.

Return a dictionary containing:
- `"resolution_order"`: `list[str]` (exact order nodes were resolved)
- `"resolved_values"`: `dict[str, str]` (mapping of node to provider value)
- `"cached_hits"`: `int` (number of times a cached dependency was reused)""",
            "oa_story": """**KiranaKart Checkout Pipeline — Duplicate DB Session Leak**

KiranaKart's checkout endpoint called `get_current_user`, `get_wallet_balance`, and `validate_cart`. Each function independently called `get_db()`, creating 3 separate PostgreSQL database connections per user checkout. Under flash-sale concurrency, PgBouncer ran out of server connections.

Implement this dependency graph resolver to prove how FastAPI's request-scoped dependency cache reuses single instances across shared dependency sub-trees.""",
            "trigger_keywords": ["dependency injection graph resolver", "resolve_dependencies", "cached_hits"],
            "examples": [
                {
                    "input": 'endpoint = "checkout_endpoint", dependency_graph = {"checkout_endpoint": ["get_auth", "get_db"], "get_auth": ["get_db"], "get_db": []}, providers = {"get_db": "session_pgsql_1", "get_auth": "user_id_42"}',
                    "output": '{"resolution_order": ["get_db", "get_auth", "checkout_endpoint"], "resolved_values": {"get_db": "session_pgsql_1", "get_auth": "user_id_42", "checkout_endpoint": "mock_checkout_endpoint"}, "cached_hits": 1}',
                    "explanation": "`get_db` is resolved once for `get_auth`. When `checkout_endpoint` requests `get_db`, it reuses the cached value (1 cache hit).",
                },
            ],
            "constraints": [
                "1 <= len(dependency_graph) <= 100",
                "Graph is a guaranteed Directed Acyclic Graph (DAG)",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why must dependencies be resolved in topological post-order rather than pre-order?",
            "options": [
                "Because a parent function cannot execute until all of its argument dependencies are already instantiated",
                "Because pre-order requires multi-threading",
                "Because post-order reduces memory allocation by 50%",
                "Because HTTP headers arrive after the request body",
            ],
            "answer": 0,
            "explanation": "If function `A` depends on `B` and `C`, `B` and `C` must be fully instantiated and evaluated so their return values can be passed into `A`.",
        },
        "pattern_quiz": {
            "prompt": "What design pattern does FastAPI's Depends() implement?",
            "options": [
                "Inversion of Control (IoC) / Dependency Injection",
                "Abstract Factory without parameters",
                "Observer Pattern with publish-subscribe",
                "Decorator Pattern for route registering",
            ],
            "answer": 0,
            "explanation": "Dependency Injection inverts control: rather than functions instantiating their own resources, the framework injects them from an external configuration.",
        },
        "function": {
            "name": "resolve_dependencies",
            "params": [{"name": "endpoint"}, {"name": "dependency_graph"}, {"name": "providers"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def resolve_dependencies(self, endpoint: str, dependency_graph: dict[str, list[str]], providers: dict[str, str]) -> dict:
        pass
""",
        "tests": [
            {
                "args": [
                    "checkout_endpoint",
                    {"checkout_endpoint": ["get_auth", "get_db"], "get_auth": ["get_db"], "get_db": []},
                    {"get_db": "session_pgsql_1", "get_auth": "user_id_42"}
                ],
                "expected": {
                    "resolution_order": ["get_db", "get_auth", "checkout_endpoint"],
                    "resolved_values": {"get_db": "session_pgsql_1", "get_auth": "user_id_42", "checkout_endpoint": "mock_checkout_endpoint"},
                    "cached_hits": 1,
                },
                "note": "Diamond dependency sharing DB session",
            },
            {
                "args": [
                    "root",
                    {"root": ["a", "b"], "a": [], "b": []},
                    {"a": "val_a", "b": "val_b"}
                ],
                "expected": {
                    "resolution_order": ["a", "b", "root"],
                    "resolved_values": {"a": "val_a", "b": "val_b", "root": "mock_root"},
                    "cached_hits": 0,
                },
                "note": "Independent sub-dependencies with zero hits",
            },
            {
                "args": [
                    "leaf",
                    {"leaf": []},
                    {"leaf": "leaf_val"}
                ],
                "expected": {
                    "resolution_order": ["leaf"],
                    "resolved_values": {"leaf": "leaf_val"},
                    "cached_hits": 0,
                },
                "note": "Single leaf endpoint",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Check resolved cache",
                "goal": "Verify if dependency is already cached.",
                "instructions": "Return `True` if `node in cache`, else `False`.",
                "function": {"name": "drill_is_cached", "params": [{"name": "cache"}, {"name": "node"}]},
                "starter_code": """class Solution:
    def drill_is_cached(self, cache: dict, node: str) -> bool:
        pass
""",
                "tests": [
                    {"args": [{"get_db": "db1"}, "get_db"], "expected": True},
                    {"args": [{}, "get_auth"], "expected": False},
                ],
                "solution": """class Solution:
    def drill_is_cached(self, cache: dict, node: str) -> bool:
        return node in cache
""",
                "hint": "Return `node in cache`.",
            },
            {
                "skill": "core",
                "title": "Post-order recursive visit",
                "goal": "Visit children before adding parent to order.",
                "instructions": "Append all dependencies to order before appending parent.",
                "function": {"name": "drill_post_order", "params": [{"name": "node"}, {"name": "graph"}]},
                "starter_code": """class Solution:
    def drill_post_order(self, node: str, graph: dict) -> list[str]:
        pass
""",
                "tests": [
                    {"args": ["a", {"a": ["b"], "b": []}], "expected": ["b", "a"]},
                ],
                "solution": """class Solution:
    def drill_post_order(self, node: str, graph: dict) -> list[str]:
        order = []
        for dep in graph.get(node, []):
            order.append(dep)
        order.append(node)
        return order
""",
                "hint": "Iterate dependencies, append them, then append node.",
            },
            {
                "skill": "edge",
                "title": "Get provider fallback",
                "goal": "Return provider value or default mock string.",
                "instructions": "Return `providers.get(node, f'mock_{node}')`.",
                "function": {"name": "drill_provider_val", "params": [{"name": "providers"}, {"name": "node"}]},
                "starter_code": """class Solution:
    def drill_provider_val(self, providers: dict, node: str) -> str:
        pass
""",
                "tests": [
                    {"args": [{"a": "real_a"}, "a"], "expected": "real_a"},
                    {"args": [{}, "b"], "expected": "mock_b"},
                ],
                "solution": """class Solution:
    def drill_provider_val(self, providers: dict, node: str) -> str:
        return providers.get(node, f"mock_{node}")
""",
                "hint": "Use providers.get with mock fallback.",
            },
        ],
        "hints": [
            "Use a recursive DFS helper function `resolve(node)`.",
            "If `node in resolved_values`: increment `cached_hits` and return immediately.",
            """| # Pseudocode Blueprint
| def resolve(node):
|     if node in resolved: cached_hits += 1; return
|     for dep in graph.get(node, []): resolve(dep)
|     order.append(node)
|     resolved[node] = providers.get(node, f"mock_{node}")
| resolve(endpoint)
| return order, resolved, cached_hits""",
        ],
        "solution": {
            "code": """class Solution:
    def resolve_dependencies(self, endpoint: str, dependency_graph: dict[str, list[str]], providers: dict[str, str]) -> dict:
        resolution_order: list[str] = []
        resolved_values: dict[str, str] = {}
        cached_hits = 0

        def resolve(node: str):
            nonlocal cached_hits
            if node in resolved_values:
                cached_hits += 1
                return
            for dep in dependency_graph.get(node, []):
                resolve(dep)
            resolution_order.append(node)
            resolved_values[node] = providers.get(node, f"mock_{node}")

        resolve(endpoint)
        return {
            "resolution_order": resolution_order,
            "resolved_values": resolved_values,
            "cached_hits": cached_hits,
        }
""",
            "explanation": "A recursive post-order traversal traverses child dependencies first, ensuring dependencies are fully resolved before their dependents execute. Caching resolved values in `resolved_values` ensures shared dependencies like database connections are instantiated exactly once per request.",
            "time": "O(V + E) where V is dependency nodes and E is dependency edges",
            "space": "O(V) for the resolved values cache and recursion stack",
        },
        "pitch_script": """**(Clarify)** "We need to resolve a dependency DAG for a FastAPI endpoint, ordering resolutions in topological post-order and caching shared dependencies."

**(Brute force)** "Instantiating dependencies eagerly without a cache creates duplicate database connections and repeats authentication computations."

**(Trigger)** "Resolving a hierarchy of dependent components with sub-tree sharing triggers topological post-order traversal with memoization."

**(Optimal)** "We define a recursive resolver. If a node is already in the resolution cache, we increment cached hits and return immediately. Otherwise, we recursively resolve each dependency before appending the current node to the resolution order and caching its value."

**(Complexity)** "Executes in O(V + E) time and O(V) space." """,
        "twist": {
            "lc": 9513,
            "title": "Sync vs Async Def Event Loop Starvation Simulation",
            "why": "Once dependencies are injected, route handler throughput depends heavily on whether `def` or `async def` is chosen when executing blocking operations.",
        },
        "viz": {
            "title": "Dependency Injection DAG Resolution",
            "type": "http_lifecycle",
        },
    },
})

LESSONS_4B.append({
    "dir": "32-fastapi-pydantic",
    "world_id": 32,
    "slug": "sync-vs-async-handler-throughput",
    "lc": 9513,
    "citadel_id": "backend_apis",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Sync vs Async Def Event Loop Starvation",
    "patterns": ["event-loop", "blocking-io", "threadpool-offload", "throughput"],
    "visualizer": "http_lifecycle",
    "data": {
        "slug": "sync-vs-async-handler-throughput",
        "lc": 9513,
        "citadel_id": "backend_apis",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "Why does calling `time.sleep()` or synchronous `requests.get()` inside an `async def` FastAPI route freeze all other concurrent users? In Python's `asyncio`, the event loop runs on a single OS thread. When an `async def` route executes a synchronous blocking call without `await`, the event loop cannot switch tasks, starving all incoming requests. In contrast, declaring standard `def` prompts FastAPI to offload execution to an external threadpool (`anyio.to_thread`).",
            "brute_force": "Declaring every FastAPI route as `async def` without checking if internal database drivers or SDKs are truly non-blocking.",
            "brute_force_complexity": "Total event loop freeze and complete API downtime under concurrent traffic.",
            "key_insight": "Simulating throughput across N requests reveals that sync `def` runs in parallel batches bounded by threadpool workers, whereas blocking `async def` completely serializes.",
            "real_world": "FastAPI production incident post-mortems involving synchronous Boto3 AWS SDK calls inside async endpoints.",
        },
        "statement": {
            "clean": """Implement an event loop throughput model comparing sync `def` vs blocking `async def`:
`simulate_handler_throughput(handler_type: str, requests_count: int, blocking_time_ms: int, threadpool_workers: int = 4) -> dict`.

Inputs:
- `handler_type`: `"sync_def"` or `"async_def_blocking"`.
- `requests_count`: total concurrent incoming requests.
- `blocking_time_ms`: duration of a synchronous blocking call (e.g. synchronous DB query or legacy API call).
- `threadpool_workers`: size of the external worker threadpool (default 4).

Execution Models:
1. `"sync_def"` (FastAPI Threadpool Offload):
   - FastAPI automatically routes regular `def` endpoints to an external threadpool.
   - Requests execute concurrently up to `threadpool_workers`:
     `batches = math.ceil(requests_count / threadpool_workers)`
     `total_time_ms = batches * blocking_time_ms`
   - The asyncio event loop remains free: `event_loop_starved = False`.
2. `"async_def_blocking"` (Single Event Loop Thread Blocked):
   - The blocking call executes directly on the single event loop thread.
   - All requests are completely serialized:
     `total_time_ms = requests_count * blocking_time_ms`
   - If `requests_count > 1`, `event_loop_starved = True`.

Throughput Calculation:
- `throughput_req_per_sec = round(requests_count / (total_time_ms / 1000.0), 2)` (or `0.0` if `total_time_ms == 0`).

Return a dictionary containing:
- `"handler_type"`: `str`
- `"requests_count"`: `int`
- `"total_time_ms"`: `int`
- `"event_loop_starved"`: `bool`
- `"throughput_req_per_sec"`: `float`""",
            "oa_story": """**Drizz Analytics API — The Async Def Outage**

Drizz engineers rewrote their reporting microservice with FastAPI, slapping `async def` on every endpoint for 'high performance'. Inside the endpoint, they called a legacy synchronous Snowflake SDK query that took 200ms.

During an automated marketing blast of 100 requests, the entire API stopped responding to health checks. Kubernetes liveness probes timed out, triggering cascading pod restarts. Implement this model to understand why blocking calls inside async def destroys throughput.""",
            "trigger_keywords": ["event loop throughput model", "simulate_handler_throughput", "event_loop_starved"],
            "examples": [
                {
                    "input": 'handler_type = "async_def_blocking", requests_count = 10, blocking_time_ms = 100, threadpool_workers = 4',
                    "output": '{"handler_type": "async_def_blocking", "requests_count": 10, "total_time_ms": 1000, "event_loop_starved": True, "throughput_req_per_sec": 10.0}',
                    "explanation": "Event loop is blocked: 10 requests * 100ms = 1000ms. Throughput is 10 req/s.",
                },
                {
                    "input": 'handler_type = "sync_def", requests_count = 10, blocking_time_ms = 100, threadpool_workers = 4',
                    "output": '{"handler_type": "sync_def", "requests_count": 10, "total_time_ms": 300, "event_loop_starved": False, "throughput_req_per_sec": 33.33}',
                    "explanation": "Offloaded to 4 threads: ceil(10/4) = 3 batches * 100ms = 300ms. Throughput is 33.33 req/s.",
                },
            ],
            "constraints": [
                "0 <= requests_count <= 10000",
                "1 <= blocking_time_ms <= 5000",
                "1 <= threadpool_workers <= 64",
            ],
        },
        "constraint_quiz": {
            "prompt": "What does FastAPI do under the hood when you declare a route as regular `def` instead of `async def`?",
            "options": [
                "It automatically offloads execution to an external threadpool using `anyio.to_thread.run_sync` so the event loop is never blocked",
                "It converts Python bytecode to C++ machine code",
                "It downgrades the HTTP protocol to HTTP/1.0",
                "It rejects the request with HTTP 500",
            ],
            "answer": 0,
            "explanation": "FastAPI recognizes standard `def` routes and executes them in a worker threadpool, preserving the main event loop for other asynchronous tasks.",
        },
        "pattern_quiz": {
            "prompt": "When should an engineer strictly use `async def` in FastAPI?",
            "options": [
                "Only when the endpoint uses genuinely asynchronous non-blocking libraries with `await` (e.g. `httpx`, `asyncpg`)",
                "Always, because async is modern",
                "Only for GET requests",
                "Only when the database is SQLite",
            ],
            "answer": 0,
            "explanation": "An endpoint should only be `async def` if every I/O operation inside it is genuinely non-blocking and awaited. Blocking calls inside `async def` starve the event loop.",
        },
        "function": {
            "name": "simulate_handler_throughput",
            "params": [{"name": "handler_type"}, {"name": "requests_count"}, {"name": "blocking_time_ms"}, {"name": "threadpool_workers"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def simulate_handler_throughput(self, handler_type: str, requests_count: int, blocking_time_ms: int, threadpool_workers: int = 4) -> dict:
        pass
""",
        "tests": [
            {
                "args": ["async_def_blocking", 10, 100, 4],
                "expected": {"handler_type": "async_def_blocking", "requests_count": 10, "total_time_ms": 1000, "event_loop_starved": True, "throughput_req_per_sec": 10.0},
                "note": "Blocking async def serializes",
            },
            {
                "args": ["sync_def", 10, 100, 4],
                "expected": {"handler_type": "sync_def", "requests_count": 10, "total_time_ms": 300, "event_loop_starved": False, "throughput_req_per_sec": 33.33},
                "note": "Sync def offloaded to threadpool",
            },
            {
                "args": ["sync_def", 0, 100, 4],
                "expected": {"handler_type": "sync_def", "requests_count": 0, "total_time_ms": 0, "event_loop_starved": False, "throughput_req_per_sec": 0.0},
                "note": "Zero requests",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Compute threadpool batch count",
                "goal": "Calculate ceil(requests / workers).",
                "instructions": "Return `math.ceil(reqs / workers)` if reqs > 0 else 0.",
                "function": {"name": "drill_batch_count", "params": [{"name": "reqs"}, {"name": "workers"}]},
                "starter_code": """class Solution:
    def drill_batch_count(self, reqs: int, workers: int) -> int:
        pass
""",
                "tests": [
                    {"args": [10, 4], "expected": 3},
                    {"args": [8, 4], "expected": 2},
                ],
                "solution": """import math

class Solution:
    def drill_batch_count(self, reqs: int, workers: int) -> int:
        return math.ceil(reqs / workers) if reqs > 0 else 0
""",
                "hint": "Use math.ceil(reqs / workers).",
            },
            {
                "skill": "core",
                "title": "Calculate serialized async time",
                "goal": "Multiply requests count by blocking time.",
                "instructions": "Return `reqs * blocking_ms`.",
                "function": {"name": "drill_async_time", "params": [{"name": "reqs"}, {"name": "blocking_ms"}]},
                "starter_code": """class Solution:
    def drill_async_time(self, reqs: int, blocking_ms: int) -> int:
        pass
""",
                "tests": [
                    {"args": [5, 100], "expected": 500},
                ],
                "solution": """class Solution:
    def drill_async_time(self, reqs: int, blocking_ms: int) -> int:
        return reqs * blocking_ms
""",
                "hint": "Multiply reqs by blocking_ms.",
            },
            {
                "skill": "edge",
                "title": "Calculate requests per second",
                "goal": "Compute RPS rounded to 2 decimal places.",
                "instructions": "Return `round(reqs / (ms / 1000.0), 2)` if ms > 0 else 0.0.",
                "function": {"name": "drill_rps", "params": [{"name": "reqs"}, {"name": "ms"}]},
                "starter_code": """class Solution:
    def drill_rps(self, reqs: int, ms: int) -> float:
        pass
""",
                "tests": [
                    {"args": [10, 300], "expected": 33.33},
                    {"args": [0, 0], "expected": 0.0},
                ],
                "solution": """class Solution:
    def drill_rps(self, reqs: int, ms: int) -> float:
        return round(reqs / (ms / 1000.0), 2) if ms > 0 else 0.0
""",
                "hint": "Convert ms to seconds and divide reqs.",
            },
        ],
        "hints": [
            "If `handler_type == 'sync_def'`, use `math.ceil(requests_count / threadpool_workers) * blocking_time_ms`.",
            "If `handler_type == 'async_def_blocking'`, execution is fully serialized (`requests_count * blocking_time_ms`).",
            """| # Pseudocode Blueprint
| if handler_type == "sync_def":
|     batches = ceil(reqs / workers)
|     total_ms = batches * blocking_ms
|     starved = False
| else:
|     total_ms = reqs * blocking_ms
|     starved = reqs > 1
| rps = round(reqs / (total_ms / 1000.0), 2)
| return total_ms, starved, rps""",
        ],
        "solution": {
            "code": """import math

class Solution:
    def simulate_handler_throughput(self, handler_type: str, requests_count: int, blocking_time_ms: int, threadpool_workers: int = 4) -> dict:
        if handler_type == "sync_def":
            batches = math.ceil(requests_count / threadpool_workers) if requests_count > 0 else 0
            total_time_ms = batches * blocking_time_ms
            starved = False
        else:
            total_time_ms = requests_count * blocking_time_ms
            starved = requests_count > 1

        rps = round((requests_count / (total_time_ms / 1000.0)), 2) if total_time_ms > 0 else 0.0
        return {
            "handler_type": handler_type,
            "requests_count": requests_count,
            "total_time_ms": total_time_ms,
            "event_loop_starved": starved,
            "throughput_req_per_sec": rps,
        }
""",
            "explanation": "FastAPI routes regular `def` endpoints to a multi-threaded pool, executing blocking calls in parallel batches across threads. An `async def` endpoint runs directly on the single-threaded event loop; any synchronous blocking call monopolizes the thread and starves all concurrent requests.",
            "time": "O(1) arithmetic calculation",
            "space": "O(1) dictionary response",
        },
        "pitch_script": """**(Clarify)** "We need to model the latency and throughput of synchronous `def` versus blocking `async def` endpoints in FastAPI under concurrent traffic."

**(Brute force)** "Using `async def` everywhere causes synchronous I/O or CPU operations to monopolize the single event loop thread, causing full system lockups."

**(Trigger)** "Comparing single-threaded event loop starvation against threadpool batch processing signals a web concurrency model."

**(Optimal)** "For `sync_def`, FastAPI offloads requests to a threadpool, completing in `ceil(N / workers) * blocking_time`. For `async_def_blocking`, all requests are strictly serialized (`N * blocking_time`). Throughput is computed as requests divided by total wall-clock seconds."

**(Complexity)** "Executes in O(1) time and space." """,
        "twist": {
            "lc": 9505,
            "title": "HTTP Method Idempotency & Idempotency-Key Deduplication",
            "why": "When requests take time to execute, clients retry. Implementing idempotency keys prevents duplicate billing and order creation.",
        },
        "viz": {
            "title": "Event Loop vs Threadpool Concurrency",
            "type": "http_lifecycle",
        },
    },
})

# ==========================================
# W20: HTTP & Status Codes (add 2 lessons)
# ==========================================

LESSONS_4B.append({
    "dir": "20-backend-fastapi",
    "world_id": 20,
    "slug": "idempotency-key-store",
    "lc": 9505,
    "citadel_id": "backend_apis",
    "brick_layer": 1,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "HTTP Idempotency Key Store",
    "patterns": ["idempotency", "deduplication", "http-methods"],
    "visualizer": "http_lifecycle",
    "data": {
        "slug": "idempotency-key-store",
        "lc": 9505,
        "citadel_id": "backend_apis",
        "brick_layer": 1,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "When a network drop occurs right after a customer clicks 'Pay Rs 5,000', the client retries the request. How does a payment gateway ensure the customer is charged exactly once? In HTTP RFC 9110, GET, PUT, and DELETE are idempotent by definition. Non-idempotent methods (POST, PATCH) use an `Idempotency-Key` header. If a key is presented again with the exact same payload, the server returns the cached response with HTTP 200 without re-executing the charge.",
            "brute_force": "Processing every incoming POST request unconditionally, causing duplicate financial debits and double-ordered inventory.",
            "brute_force_complexity": "Critical data corruption and revenue loss.",
            "key_insight": "Map idempotency keys to their original request payload and response. Identical retries return cached responses, payload mismatches trigger 422 conflicts, and first-time keys execute and return 201 Created.",
            "real_world": "Stripe `Idempotency-Key` header, Razorpay order deduplication, and AWS API Gateway request caching.",
        },
        "statement": {
            "clean": """Implement an HTTP request handler with an idempotency key store:
`handle_idempotent_request(method: str, idempotency_key: str | None, payload: dict, store: dict) -> dict`.

Inputs:
- `method`: HTTP method string (e.g. `"GET"`, `"POST"`, `"PUT"`).
- `idempotency_key`: optional string header value, or `None`.
- `payload`: client request payload dictionary.
- `store`: in-memory storage dictionary tracking processed keys.

Protocol Rules:
1. Idempotent Methods (`GET`, `HEAD`, `PUT`, `DELETE`):
   - Inherently idempotent: return `{"status_code": 200, "cached": False, "idempotent": True, "response": {"action": f"{method}_success"}}`.
2. Non-Idempotent Methods (`POST`, `PATCH`):
   - Missing Header: if `not idempotency_key`, return `{"status_code": 400, "cached": False, "idempotent": False, "error": "Missing Idempotency-Key header"}`.
   - Key Exists in Store:
     - If `store[key]["payload"] == payload`: return `{"status_code": 200, "cached": True, "idempotent": True, "response": store[key]["response"]}`.
     - If `store[key]["payload"] != payload`: return `{"status_code": 422, "cached": False, "idempotent": False, "error": "Idempotency key payload mismatch conflict"}`.
   - New Key:
     - Generate response: `{"order_id": f"ORD_{idempotency_key[:6]}", "status": "CONFIRMED"}`.
     - Save to store: `store[idempotency_key] = {"payload": payload, "response": response}`.
     - Return `{"status_code": 201, "cached": False, "idempotent": True, "response": response}`.
3. Unsupported Methods: return `{"status_code": 405, "cached": False, "idempotent": False, "error": "Method Not Allowed"}`.""",
            "oa_story": """**PayLoop Merchant Checkout — Double Charge Disaster**

During a mobile app network glitch, a PayLoop customer's UPI payment timed out. The user tapped 'Retry' 3 times in 4 seconds. The backend processed 3 separate debit transactions of Rs 2,500 each, triggering customer complaints and regulatory fines.

The engineering lead mandated idempotency keys on all payment endpoints. Implement this idempotency store to prevent duplicate transactions on network retries.""",
            "trigger_keywords": ["idempotency key store", "handle_idempotent_request", "idempotency_key"],
            "examples": [
                {
                    "input": 'method = "POST", idempotency_key = "key_abc_123", payload = {"amount": 500}, store = {}',
                    "output": '{"status_code": 201, "cached": False, "idempotent": True, "response": {"order_id": "ORD_key_ab", "status": "CONFIRMED"}}',
                    "explanation": "First request creates the order and caches the response under the key.",
                },
                {
                    "input": 'method = "POST", idempotency_key = "key_abc_123", payload = {"amount": 500}, store = {"key_abc_123": {"payload": {"amount": 500}, "response": {"order_id": "ORD_key_ab", "status": "CONFIRMED"}}}',
                    "output": '{"status_code": 200, "cached": True, "idempotent": True, "response": {"order_id": "ORD_key_ab", "status": "CONFIRMED"}}',
                    "explanation": "Repeated request with identical payload returns cached response with HTTP 200.",
                },
            ],
            "constraints": [
                "method is a valid HTTP verb",
                "store is a mutable dictionary",
            ],
        },
        "constraint_quiz": {
            "prompt": "According to RFC 9110, which HTTP methods are idempotent by specification?",
            "options": [
                "GET, HEAD, PUT, DELETE",
                "POST, PATCH, CONNECT",
                "Only GET",
                "All HTTP methods are idempotent",
            ],
            "answer": 0,
            "explanation": "RFC 9110 defines GET, HEAD, PUT, and DELETE as idempotent, meaning making multiple identical requests has the same intended effect as making one single request.",
        },
        "pattern_quiz": {
            "prompt": "What should an API return if a client sends an existing Idempotency-Key with a different payload body?",
            "options": [
                "HTTP 422 Unprocessable Entity or HTTP 409 Conflict indicating a payload mismatch for that key",
                "HTTP 200 with the original payload",
                "HTTP 500 Internal Server Error",
                "HTTP 301 Moved Permanently",
            ],
            "answer": 0,
            "explanation": "Reusing an idempotency key with conflicting payload parameters represents a client bug or race condition and must be rejected with 422 or 409.",
        },
        "function": {
            "name": "handle_idempotent_request",
            "params": [{"name": "method"}, {"name": "idempotency_key"}, {"name": "payload"}, {"name": "store"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def handle_idempotent_request(self, method: str, idempotency_key: str | None, payload: dict, store: dict) -> dict:
        pass
""",
        "tests": [
            {
                "args": ["POST", "key_abc_123", {"amount": 500}, {}],
                "expected": {"status_code": 201, "cached": False, "idempotent": True, "response": {"order_id": "ORD_key_ab", "status": "CONFIRMED"}},
                "note": "New transaction created",
            },
            {
                "args": [
                    "POST", "key_abc_123", {"amount": 500},
                    {"key_abc_123": {"payload": {"amount": 500}, "response": {"order_id": "ORD_key_ab", "status": "CONFIRMED"}}}
                ],
                "expected": {"status_code": 200, "cached": True, "idempotent": True, "response": {"order_id": "ORD_key_ab", "status": "CONFIRMED"}},
                "note": "Cached response replay",
            },
            {
                "args": [
                    "POST", "key_abc_123", {"amount": 999},
                    {"key_abc_123": {"payload": {"amount": 500}, "response": {"order_id": "ORD_key_ab", "status": "CONFIRMED"}}}
                ],
                "expected": {"status_code": 422, "cached": False, "idempotent": False, "error": "Idempotency key payload mismatch conflict"},
                "note": "Payload mismatch conflict",
            },
            {
                "args": ["POST", None, {"amount": 100}, {}],
                "expected": {"status_code": 400, "cached": False, "idempotent": False, "error": "Missing Idempotency-Key header"},
                "note": "Missing key header",
            },
            {
                "args": ["GET", None, {}, {}],
                "expected": {"status_code": 200, "cached": False, "idempotent": True, "response": {"action": "GET_success"}},
                "note": "Inherent idempotent method",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Check method idempotency",
                "goal": "Verify if an HTTP method is inherently idempotent.",
                "instructions": "Return `True` if method is in GET, HEAD, PUT, DELETE.",
                "function": {"name": "drill_is_idempotent_verb", "params": [{"name": "method"}]},
                "starter_code": """class Solution:
    def drill_is_idempotent_verb(self, method: str) -> bool:
        pass
""",
                "tests": [
                    {"args": ["GET"], "expected": True},
                    {"args": ["POST"], "expected": False},
                ],
                "solution": """class Solution:
    def drill_is_idempotent_verb(self, method: str) -> bool:
        return method.upper() in ["GET", "HEAD", "PUT", "DELETE"]
""",
                "hint": "Check `method.upper() in ['GET', 'HEAD', 'PUT', 'DELETE']`.",
            },
            {
                "skill": "core",
                "title": "Detect payload conflict",
                "goal": "Compare incoming payload with stored payload.",
                "instructions": "Return `True` if stored != incoming, else `False`.",
                "function": {"name": "drill_is_mismatch", "params": [{"name": "stored"}, {"name": "incoming"}]},
                "starter_code": """class Solution:
    def drill_is_mismatch(self, stored: dict, incoming: dict) -> bool:
        pass
""",
                "tests": [
                    {"args": [{"a": 1}, {"a": 2}], "expected": True},
                    {"args": [{"a": 1}, {"a": 1}], "expected": False},
                ],
                "solution": """class Solution:
    def drill_is_mismatch(self, stored: dict, incoming: dict) -> bool:
        return stored != incoming
""",
                "hint": "Return stored != incoming.",
            },
            {
                "skill": "edge",
                "title": "Cache new order response",
                "goal": "Write payload and response to key store.",
                "instructions": "Set `store[key] = {'payload': payload, 'response': resp}` and return `store`.",
                "function": {"name": "drill_save_key", "params": [{"name": "store"}, {"name": "key"}, {"name": "payload"}, {"name": "resp"}]},
                "starter_code": """class Solution:
    def drill_save_key(self, store: dict, key: str, payload: dict, resp: dict) -> dict:
        pass
""",
                "tests": [
                    {"args": [{}, "k1", {"x": 1}, {"ok": True}], "expected": {"k1": {"payload": {"x": 1}, "response": {"ok": True}}}},
                ],
                "solution": """class Solution:
    def drill_save_key(self, store: dict, key: str, payload: dict, resp: dict) -> dict:
        store[key] = {"payload": payload, "response": resp}
        return store
""",
                "hint": "Assign to store[key].",
            },
        ],
        "hints": [
            "Check inherently idempotent methods (`GET`, `PUT`, `DELETE`) first.",
            "For `POST`/`PATCH`, check for `None` key, then lookup in `store` to compare payloads.",
            """| # Pseudocode Blueprint
| if method in [GET, HEAD, PUT, DELETE]: return 200, idempotent = True
| if not key: return 400 missing header
| if key in store:
|     if store[key].payload == payload: return 200, cached = True
|     else: return 422 conflict
| resp = {"order_id": ...}
| store[key] = {payload, resp}
| return 201, cached = False""",
        ],
        "solution": {
            "code": """class Solution:
    def handle_idempotent_request(self, method: str, idempotency_key: str | None, payload: dict, store: dict) -> dict:
        method = method.upper()
        if method in ["GET", "HEAD", "PUT", "DELETE"]:
            return {
                "status_code": 200,
                "cached": False,
                "idempotent": True,
                "response": {"action": f"{method}_success"},
            }

        if method in ["POST", "PATCH"]:
            if not idempotency_key:
                return {
                    "status_code": 400,
                    "cached": False,
                    "idempotent": False,
                    "error": "Missing Idempotency-Key header",
                }

            if idempotency_key in store:
                entry = store[idempotency_key]
                if entry["payload"] == payload:
                    return {
                        "status_code": 200,
                        "cached": True,
                        "idempotent": True,
                        "response": entry["response"],
                    }
                else:
                    return {
                        "status_code": 422,
                        "cached": False,
                        "idempotent": False,
                        "error": "Idempotency key payload mismatch conflict",
                    }

            created_response = {"order_id": f"ORD_{idempotency_key[:6]}", "status": "CONFIRMED"}
            store[idempotency_key] = {"payload": payload, "response": created_response}
            return {
                "status_code": 201,
                "cached": False,
                "idempotent": True,
                "response": created_response,
            }

        return {"status_code": 405, "cached": False, "idempotent": False, "error": "Method Not Allowed"}
""",
            "explanation": "Idempotent HTTP methods return immediately without side effects. For mutating requests, checking the idempotency key in an atomic store enables safe deduplication: identical requests return the cached HTTP 200 response, conflicting payloads are rejected with HTTP 422, and first-time requests commit with HTTP 201.",
            "time": "O(1) dictionary key lookup and payload comparison",
            "space": "O(K) where K is the number of stored idempotency keys",
        },
        "pitch_script": """**(Clarify)** "We need to design an idempotency store that safely executes non-idempotent HTTP methods (POST, PATCH) while replaying cached responses on identical retries."

**(Brute force)** "Executing every request directly causes double charges and duplicate resource creation when network retries occur."

**(Trigger)** "Distinguishing HTTP method idempotency and matching Idempotency-Key headers signals an idempotent request router."

**(Optimal)** "GET, PUT, and DELETE return immediately as inherently idempotent. For POST and PATCH, we require an Idempotency-Key header. If the key exists with an identical payload, we return the cached response with 200 OK. If the payload differs, we reject with 422 Unprocessable Entity. A new key records the transaction and returns 201 Created."

**(Complexity)** "Executes in O(1) time and O(K) storage space." """,
        "twist": {
            "lc": 9506,
            "title": "CORS Preflight OPTIONS Decision Engine",
            "why": "Before a browser sends cross-origin requests with custom headers like Idempotency-Key, it issues an HTTP OPTIONS preflight check.",
        },
        "viz": {
            "title": "Idempotency Key Deduplication Lifecycle",
            "type": "http_lifecycle",
        },
    },
})

LESSONS_4B.append({
    "dir": "20-backend-fastapi",
    "world_id": 20,
    "slug": "cors-preflight-evaluator",
    "lc": 9506,
    "citadel_id": "backend_apis",
    "brick_layer": 1,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "CORS Preflight OPTIONS Decision Engine",
    "patterns": ["cors", "preflight-options", "security-headers", "http-security"],
    "visualizer": "http_lifecycle",
    "data": {
        "slug": "cors-preflight-evaluator",
        "lc": 9506,
        "citadel_id": "backend_apis",
        "brick_layer": 1,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "Why does a browser block web applications from querying APIs on another domain until a special OPTIONS request succeeds? Cross-Origin Resource Sharing (CORS) protects users from malicious sites reading private intranet or API data. For non-simple requests (custom headers like `Authorization` or methods like `PUT`/`DELETE`), browsers send an HTTP `OPTIONS` preflight request. The server must explicitly declare allowed origins, methods, and headers.",
            "brute_force": "Blindly setting `Access-Control-Allow-Origin: *` on production authenticated APIs, exposing cookies and sensitive data to CSRF attacks.",
            "brute_force_complexity": "Severe browser security vulnerability.",
            "key_insight": "Evaluating the Origin, Method, and non-simple Headers against strict server policies returns HTTP 204 No Content with `Access-Control-*` headers or appropriate 4xx rejections.",
            "real_world": "FastAPI `CORSMiddleware`, AWS API Gateway CORS policies, and Cloudflare egress security headers.",
        },
        "statement": {
            "clean": """Implement a CORS preflight options decision engine for cross-origin browser security:
`evaluate_cors_preflight(origin: str, method: str, headers: list[str], allowed_origins: list[str], allowed_methods: list[str], allowed_headers: list[str]) -> dict`.

Inputs:
- `origin`: client request `Origin` header (e.g. `"https://app.payloop.in"`).
- `method`: requested `Access-Control-Request-Method` (e.g. `"POST"`).
- `headers`: list of requested `Access-Control-Request-Headers` (e.g. `["Authorization", "Content-Type"]`).
- `allowed_origins`, `allowed_methods`, `allowed_headers`: server whitelist policies.

Rules:
1. Origin Validation:
   - If `origin not in allowed_origins` and `"*"` not in `allowed_origins`:
     return `{"allowed": False, "status_code": 403, "headers": {}}`.
2. Method Validation:
   - If `method.upper()` not in `[m.upper() for m in allowed_methods]`:
     return `{"allowed": False, "status_code": 405, "headers": {}}`.
3. Header Validation:
   - Case-insensitive check: all requested `headers` must be in `allowed_headers` OR belong to standard simple headers (`"content-type"`, `"accept"`, `"origin"`).
   - If any requested header is disallowed:
     return `{"allowed": False, "status_code": 400, "headers": {}}`.
4. Success (CORS Preflight Approved):
   - Return HTTP 204 No Content with response headers:
     - `"Access-Control-Allow-Origin"`: `origin` (or `"*"` if wildcard allowed)
     - `"Access-Control-Allow-Methods"`: comma-separated `allowed_methods`
     - `"Access-Control-Allow-Headers"`: comma-separated `allowed_headers`
     - `"Access-Control-Max-Age"`: `"86400"`
   - Result: `{"allowed": True, "status_code": 204, "headers": resp_headers}`.""",
            "oa_story": """**PayLoop Merchant Dashboard — CORS Preflight Failure**

PayLoop launched a merchant analytics portal hosted on `https://portal.payloop.in` calling API backend `https://api.payloop.in`. In Chrome, API requests failed instantly with console errors: 'No Access-Control-Allow-Origin header is present on the requested resource'.

The security team refused to open wildcards (`*`). Implement this CORS preflight engine to evaluate origins, methods, and headers securely, returning HTTP 204 preflight approvals.""",
            "trigger_keywords": ["cors preflight options decision engine", "evaluate_cors_preflight", "Access-Control-Allow-Origin"],
            "examples": [
                {
                    "input": 'origin = "https://payloop.in", method = "POST", headers = ["Authorization", "Content-Type"], allowed_origins = ["https://payloop.in"], allowed_methods = ["GET", "POST", "OPTIONS"], allowed_headers = ["Authorization", "Content-Type"]',
                    "output": '{"allowed": True, "status_code": 204, "headers": {"Access-Control-Allow-Origin": "https://payloop.in", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "86400"}}',
                    "explanation": "Origin, method, and headers match allowed policies, yielding HTTP 204 preflight approval.",
                },
                {
                    "input": 'origin = "https://malicious-site.com", method = "POST", headers = [], allowed_origins = ["https://payloop.in"], allowed_methods = ["GET", "POST"], allowed_headers = []',
                    "output": '{"allowed": False, "status_code": 403, "headers": {}}',
                    "explanation": "Untrusted origin rejected with HTTP 403 Forbidden.",
                },
            ],
            "constraints": [
                "1 <= len(allowed_origins) <= 50",
                "1 <= len(allowed_methods) <= 10",
            ],
        },
        "constraint_quiz": {
            "prompt": "What HTTP status code is typically returned by servers for a successful CORS preflight OPTIONS request?",
            "options": [
                "204 No Content (or 200 OK)",
                "301 Moved Permanently",
                "404 Not Found",
                "503 Service Unavailable",
            ],
            "answer": 0,
            "explanation": "A preflight OPTIONS request is a metadata check that requires no response body, so servers respond with HTTP 204 No Content (or 200 OK) containing CORS headers.",
        },
        "pattern_quiz": {
            "prompt": "What is the purpose of the `Access-Control-Max-Age` header in a CORS preflight response?",
            "options": [
                "It specifies how many seconds the browser can cache the preflight result before needing to send another OPTIONS check",
                "It sets the maximum lifetime of user login sessions",
                "It controls database cache TTLs",
                "It sets the SSL certificate validity period",
            ],
            "answer": 0,
            "explanation": "`Access-Control-Max-Age` caches the preflight decision in the browser, eliminating the round-trip latency of OPTIONS checks for subsequent requests within that window.",
        },
        "function": {
            "name": "evaluate_cors_preflight",
            "params": [{"name": "origin"}, {"name": "method"}, {"name": "headers"}, {"name": "allowed_origins"}, {"name": "allowed_methods"}, {"name": "allowed_headers"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def evaluate_cors_preflight(self, origin: str, method: str, headers: list[str], allowed_origins: list[str], allowed_methods: list[str], allowed_headers: list[str]) -> dict:
        pass
""",
        "tests": [
            {
                "args": [
                    "https://payloop.in", "POST", ["Authorization", "Content-Type"],
                    ["https://payloop.in"], ["GET", "POST", "OPTIONS"], ["Authorization", "Content-Type"]
                ],
                "expected": {
                    "allowed": True,
                    "status_code": 204,
                    "headers": {
                        "Access-Control-Allow-Origin": "https://payloop.in",
                        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                        "Access-Control-Allow-Headers": "Authorization, Content-Type",
                        "Access-Control-Max-Age": "86400",
                    },
                },
                "note": "Successful preflight",
            },
            {
                "args": [
                    "https://attacker.com", "POST", [],
                    ["https://payloop.in"], ["GET", "POST"], []
                ],
                "expected": {"allowed": False, "status_code": 403, "headers": {}},
                "note": "Untrusted origin rejected",
            },
            {
                "args": [
                    "https://payloop.in", "DELETE", [],
                    ["https://payloop.in"], ["GET", "POST"], []
                ],
                "expected": {"allowed": False, "status_code": 405, "headers": {}},
                "note": "Method not allowed",
            },
            {
                "args": [
                    "https://payloop.in", "POST", ["X-Secret-Header"],
                    ["https://payloop.in"], ["POST"], ["Authorization"]
                ],
                "expected": {"allowed": False, "status_code": 400, "headers": {}},
                "note": "Disallowed custom header",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Validate request origin",
                "goal": "Check if origin matches whitelist or wildcard.",
                "instructions": "Return `True` if `origin in allowed or '*' in allowed`.",
                "function": {"name": "drill_check_origin", "params": [{"name": "origin"}, {"name": "allowed"}]},
                "starter_code": """class Solution:
    def drill_check_origin(self, origin: str, allowed: list[str]) -> bool:
        pass
""",
                "tests": [
                    {"args": ["https://app.com", ["https://app.com"]], "expected": True},
                    {"args": ["https://evil.com", ["https://app.com"]], "expected": False},
                ],
                "solution": """class Solution:
    def drill_check_origin(self, origin: str, allowed: list[str]) -> bool:
        return origin in allowed or "*" in allowed
""",
                "hint": "Check `origin in allowed or '*' in allowed`.",
            },
            {
                "skill": "core",
                "title": "Verify non-simple headers",
                "goal": "Confirm all requested headers are in allowed set or simple list.",
                "instructions": "Check case-insensitively against allowed headers plus simple defaults.",
                "function": {"name": "drill_check_headers", "params": [{"name": "headers"}, {"name": "allowed"}]},
                "starter_code": """class Solution:
    def drill_check_headers(self, headers: list[str], allowed: list[str]) -> bool:
        pass
""",
                "tests": [
                    {"args": [["Authorization"], ["authorization"]], "expected": True},
                    {"args": [["X-Custom"], ["authorization"]], "expected": False},
                ],
                "solution": """class Solution:
    def drill_check_headers(self, headers: list[str], allowed: list[str]) -> bool:
        safe = {h.lower() for h in allowed} | {"content-type", "accept", "origin"}
        return all(h.lower() in safe for h in headers)
""",
                "hint": "Convert to lower case and check subset.",
            },
            {
                "skill": "edge",
                "title": "Construct CORS 204 headers",
                "goal": "Build preflight response headers dictionary.",
                "instructions": "Format Access-Control headers with comma separated methods and headers.",
                "function": {"name": "drill_cors_dict", "params": [{"name": "origin"}, {"name": "methods"}, {"name": "headers"}]},
                "starter_code": """class Solution:
    def drill_cors_dict(self, origin: str, methods: list[str], headers: list[str]) -> dict:
        pass
""",
                "tests": [
                    {"args": ["https://a.com", ["GET", "POST"], ["Auth"]], "expected": {
                        "Access-Control-Allow-Origin": "https://a.com",
                        "Access-Control-Allow-Methods": "GET, POST",
                        "Access-Control-Allow-Headers": "Auth",
                        "Access-Control-Max-Age": "86400",
                    }},
                ],
                "solution": """class Solution:
    def drill_cors_dict(self, origin: str, methods: list[str], headers: list[str]) -> dict:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": ", ".join(methods),
            "Access-Control-Allow-Headers": ", ".join(headers),
            "Access-Control-Max-Age": "86400",
        }
""",
                "hint": "Join with comma and space.",
            },
        ],
        "hints": [
            "Validate origin against `allowed_origins` and `*`.",
            "Verify method case-insensitively, then verify requested headers.",
            """| # Pseudocode Blueprint
| if origin not in allowed and "*" not in allowed: return False, 403
| if method.upper() not in [m.upper() for m in allowed_methods]: return False, 405
| safe = {h.lower() for h in allowed_headers} | {content-type, accept, origin}
| if any(h.lower() not in safe for h in headers): return False, 400
| return True, 204, {Access-Control headers}""",
        ],
        "solution": {
            "code": """class Solution:
    def evaluate_cors_preflight(self, origin: str, method: str, headers: list[str], allowed_origins: list[str], allowed_methods: list[str], allowed_headers: list[str]) -> dict:
        if origin not in allowed_origins and "*" not in allowed_origins:
            return {"allowed": False, "status_code": 403, "headers": {}}

        if method.upper() not in [m.upper() for m in allowed_methods]:
            return {"allowed": False, "status_code": 405, "headers": {}}

        allowed_h_lower = {h.lower() for h in allowed_headers} | {"content-type", "accept", "origin"}
        for h in headers:
            if h.lower() not in allowed_h_lower:
                return {"allowed": False, "status_code": 400, "headers": {}}

        resp_headers = {
            "Access-Control-Allow-Origin": origin if "*" not in allowed_origins else "*",
            "Access-Control-Allow-Methods": ", ".join(allowed_methods),
            "Access-Control-Allow-Headers": ", ".join(allowed_headers),
            "Access-Control-Max-Age": "86400",
        }
        return {"allowed": True, "status_code": 204, "headers": resp_headers}
""",
            "explanation": "Validating the preflight request verifies the origin against the allowed whitelist (returning 403 on mismatch), confirms the HTTP method (405 on unsupported verbs), and checks non-simple headers (400 on unpermitted headers). On approval, it returns HTTP 204 with complete `Access-Control-*` headers.",
            "time": "O(H) where H is the count of requested headers",
            "space": "O(1) returned dictionary",
        },
        "pitch_script": """**(Clarify)** "We need to evaluate a browser CORS preflight OPTIONS request by checking Origin, Method, and Headers against security policies and returning 204 No Content with appropriate headers."

**(Brute force)** "Using wildcard `*` origins on authenticated endpoints permits malicious third-party websites to make unauthorized authenticated requests on behalf of users."

**(Trigger)** "Evaluating preflight request parameters against security policies signals an HTTP OPTIONS decision engine."

**(Optimal)** "We validate Origin against the whitelist (rejecting with 403), check the method against allowed verbs (rejecting with 405), and check non-simple headers against allowed headers (rejecting with 400). If valid, we return HTTP 204 with `Access-Control-Allow-Origin`, `-Methods`, `-Headers`, and a 24-hour `-Max-Age` cache."

**(Complexity)** "Executes in O(H) time and O(1) space." """,
        "twist": {
            "lc": 9521,
            "title": "HMAC-SHA256 Stateless Token Signer & Verifier",
            "why": "Once the CORS preflight passes, the browser submits the actual request carrying an `Authorization: Bearer <JWT>` header.",
        },
        "viz": {
            "title": "CORS Preflight HTTP OPTIONS Cycle",
            "type": "http_lifecycle",
        },
    },
})

# ==========================================
# W31: Auth & Security (add 2 lessons)
# ==========================================

LESSONS_4B.append({
    "dir": "31-auth-security",
    "world_id": 31,
    "slug": "hmac-signed-jwt-engine",
    "lc": 9521,
    "citadel_id": "backend_apis",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "HMAC-SHA256 Stateless Token Engine",
    "patterns": ["stateless-auth", "hmac-sha256", "token-expiration", "security"],
    "visualizer": "http_lifecycle",
    "data": {
        "slug": "hmac-signed-jwt-engine",
        "lc": 9521,
        "citadel_id": "backend_apis",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How can distributed microservices verify client authentication and role permissions without making a database query on every HTTP request? JSON Web Tokens (JWT) enable stateless authentication. The server encodes user claims into base64 JSON and appends an HMAC-SHA256 digital signature computed with a shared secret. Any service holding the secret can verify the signature and check expiration in microseconds without database lookups.",
            "brute_force": "Storing session tokens in a central database and issuing SQL queries on every single API request, bottlenecking database IOPS.",
            "brute_force_complexity": "O(1) database queries per request that exhaust connection pools under heavy load.",
            "key_insight": "A signed token consists of `base64_payload.hmac_signature`. Verifying recomputes the HMAC using constant-time comparison (`hmac.compare_digest`), guarding against timing attacks and tampering.",
            "real_world": "OAuth 2.0 Bearer tokens, GitHub webhook verification, and microservice service-to-service JWT authentication.",
        },
        "statement": {
            "clean": """Implement an HMAC-SHA256 stateless token signer and verifier:
`sign_and_verify_token(action: str, payload_or_token: any, secret: str, current_time: int) -> dict`.

Actions:
1. `"SIGN"`:
   - `payload_or_token` is a dictionary (e.g. `{"sub": "u1", "role": "admin", "exp": 1700000100}`).
   - Serialize payload to JSON with sorted keys and compact separators: `json.dumps(payload, separators=(",", ":"), sort_keys=True)`.
   - Base64-encode the JSON using URL-safe base64, stripping trailing padding (`=`): `b64_payload`.
   - Compute HMAC-SHA256 signature using `secret`: `hmac.new(secret.encode(), b64_payload.encode(), hashlib.sha256).hexdigest()`.
   - Return token format: `f"{b64_payload}.{sig}"`.
   - Output: `{"token": token, "success": True}`.
2. `"VERIFY"`:
   - `payload_or_token` is a token string `b64_payload.sig`.
   - If not exactly two dot-separated parts: return `{"valid": False, "error": "malformed_token"}`.
   - Recompute expected HMAC-SHA256 signature from `b64_payload` and `secret`.
   - Use `hmac.compare_digest(sig, expected_sig)`. If mismatch: return `{"valid": False, "error": "invalid_signature"}`.
   - Decode URL-safe base64 payload and parse JSON (adding back padding if necessary).
   - Check expiration: if `"exp"` in payload and `current_time > payload["exp"]`:
     return `{"valid": False, "error": "token_expired"}`.
   - If signature and expiration valid: return `{"valid": True, "payload": payload}`.""",
            "oa_story": """**PayLoop Merchant Auth — Token Tampering Vulnerability**

During a security audit, ethical hackers altered their JWT payload from `{"role": "merchant"}` to `{"role": "admin"}`. Because an insecure microservice decoded the base64 payload without verifying the HMAC cryptographic signature, the hacker gained full admin privileges.

Implement this HMAC-SHA256 token engine with strict signature verification and expiration checking to secure PayLoop APIs against token forgery.""",
            "trigger_keywords": ["stateless token signer", "sign_and_verify_token", "invalid_signature"],
            "examples": [
                {
                    "input": 'action = "SIGN", payload_or_token = {"sub": "u_99", "role": "admin", "exp": 1700000100}, secret = "sec_key", current_time = 1700000000',
                    "output": '{"token": "eyJleHAiOjE3MDAwMDAxMDAsInJvbGUiOiJhZG1pbiIsInN1YiI6InVfOTkifQ.d0c24c2d33454477c7f766e4a64fbbbc64cb3e390c5040ffb344754580bfb9f5", "success": True}',
                    "explanation": "Generates URL-safe base64 payload joined with HMAC-SHA256 signature hex.",
                },
                {
                    "input": 'action = "VERIFY", payload_or_token = "eyJleHAiOjE3MDAwMDAxMDAsInJvbGUiOiJhZG1pbiIsInN1YiI6InVfOTkifQ.d0c24c2d33454477c7f766e4a64fbbbc64cb3e390c5040ffb344754580bfb9f5", secret = "sec_key", current_time = 1700000050',
                    "output": '{"valid": True, "payload": {"exp": 1700000100, "role": "admin", "sub": "u_99"}}',
                    "explanation": "Signature matches and current_time (1700000050) <= exp (1700000100), token valid.",
                },
            ],
            "constraints": [
                "secret is non-empty string",
                "current_time >= 0",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why must token signature verification use `hmac.compare_digest` instead of standard `==` string equality?",
            "options": [
                "To prevent timing attacks: standard string equality short-circuits on the first mismatched byte, leaking information about the expected signature",
                "`==` does not work on hexadecimal strings",
                "Python deprecated `==` for security tokens",
                "`hmac.compare_digest` automatically decodes base64",
            ],
            "answer": 0,
            "explanation": "Constant-time comparison executes in identical time regardless of where bytes differ, preventing side-channel timing attacks that could deduce the valid signature byte-by-byte.",
        },
        "pattern_quiz": {
            "prompt": "What makes JWT stateless compared to traditional session IDs?",
            "options": [
                "The token itself contains user identity and expiry claims cryptographically protected by the signature, requiring zero server database lookups",
                "JWTs run only on serverless platforms",
                "JWTs are automatically stored in hardware chips",
                "JWTs do not require a secret key",
            ],
            "answer": 0,
            "explanation": "Because claims are carried within the token and validated mathematically via the HMAC signature, backend servers require no shared session cache.",
        },
        "function": {
            "name": "sign_and_verify_token",
            "params": [{"name": "action"}, {"name": "payload_or_token"}, {"name": "secret"}, {"name": "current_time"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def sign_and_verify_token(self, action: str, payload_or_token: any, secret: str, current_time: int) -> dict:
        pass
""",
        "tests": [
            {
                "args": ["SIGN", {"exp": 1700000100, "role": "admin", "sub": "u_99"}, "secret123", 1700000000],
                "expected": {
                    "token": "eyJleHAiOjE3MDAwMDAxMDAsInJvbGUiOiJhZG1pbiIsInN1YiI6InVfOTkifQ.25417ea85988ab8116fba97500c6262d599ef9fed13a282b296eb9ea4687685f",
                    "success": True,
                },
                "note": "Deterministic sign",
            },
            {
                "args": ["VERIFY", "eyJleHAiOjE3MDAwMDAxMDAsInJvbGUiOiJhZG1pbiIsInN1YiI6InVfOTkifQ.25417ea85988ab8116fba97500c6262d599ef9fed13a282b296eb9ea4687685f", "secret123", 1700000050],
                "expected": {
                    "valid": True,
                    "payload": {"exp": 1700000100, "role": "admin", "sub": "u_99"},
                },
                "note": "Successful verification before expiry",
            },
            {
                "args": ["VERIFY", "eyJleHAiOjE3MDAwMDAxMDAsInJvbGUiOiJhZG1pbiIsInN1YiI6InVfOTkifQ.25417ea85988ab8116fba97500c6262d599ef9fed13a282b296eb9ea4687685f", "secret123", 1700000200],
                "expected": {
                    "valid": False,
                    "error": "token_expired",
                },
                "note": "Expired token rejected",
            },
            {
                "args": ["VERIFY", "eyJleHAiOjE3MDAwMDAxMDAsInJvbGUiOiJhZG1pbiIsInN1YiI6InVfOTkifQ.bad_signature", "secret123", 1700000050],
                "expected": {
                    "valid": False,
                    "error": "invalid_signature",
                },
                "note": "Tampered signature rejected",
            },
            {
                "args": ["VERIFY", "not_a_dot_token", "secret123", 1700000050],
                "expected": {
                    "valid": False,
                    "error": "malformed_token",
                },
                "note": "Malformed token structure",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Compute HMAC SHA256 hex",
                "goal": "Generate signature from payload string and secret.",
                "instructions": "Return `hmac.new(secret.encode(), text.encode(), hashlib.sha256).hexdigest()`.",
                "function": {"name": "drill_hmac_hex", "params": [{"name": "text"}, {"name": "secret"}]},
                "starter_code": """class Solution:
    def drill_hmac_hex(self, text: str, secret: str) -> str:
        pass
""",
                "tests": [
                    {"args": ["payload_test", "sec"], "expected": "2b6a5f8bd60ac0c8d3d6c5d1b1cba06b3e046a909ab9a73dfde88b3632473982"},
                ],
                "solution": """import hashlib
import hmac

class Solution:
    def drill_hmac_hex(self, text: str, secret: str) -> str:
        return hmac.new(secret.encode(), text.encode(), hashlib.sha256).hexdigest()
""",
                "hint": "Use hmac.new with hashlib.sha256 and hexdigest().",
            },
            {
                "skill": "core",
                "title": "Constant time signature comparison",
                "goal": "Compare signatures securely.",
                "instructions": "Return `hmac.compare_digest(sig1, sig2)`.",
                "function": {"name": "drill_compare_sig", "params": [{"name": "sig1"}, {"name": "sig2"}]},
                "starter_code": """class Solution:
    def drill_compare_sig(self, sig1: str, sig2: str) -> bool:
        pass
""",
                "tests": [
                    {"args": ["abc", "abc"], "expected": True},
                    {"args": ["abc", "xyz"], "expected": False},
                ],
                "solution": """import hmac

class Solution:
    def drill_compare_sig(self, sig1: str, sig2: str) -> bool:
        return hmac.compare_digest(sig1, sig2)
""",
                "hint": "Use `hmac.compare_digest`.",
            },
            {
                "skill": "edge",
                "title": "Check token expiration",
                "goal": "Detect if current timestamp exceeds expiry.",
                "instructions": "Return `True` if `exp is not None and now > exp`.",
                "function": {"name": "drill_is_expired", "params": [{"name": "exp"}, {"name": "now"}]},
                "starter_code": """class Solution:
    def drill_is_expired(self, exp: int, now: int) -> bool:
        pass
""",
                "tests": [
                    {"args": [100, 150], "expected": True},
                    {"args": [100, 50], "expected": False},
                ],
                "solution": """class Solution:
    def drill_is_expired(self, exp: int, now: int) -> bool:
        return exp is not None and now > exp
""",
                "hint": "Compare now > exp.",
            },
        ],
        "hints": [
            "Use `base64.urlsafe_b64encode` and strip trailing `=` for URL-safe transmission.",
            "In VERIFY, split on `.` to extract `b64_payload` and `sig`, recompute expected HMAC, and use `hmac.compare_digest`.",
            """| # Pseudocode Blueprint
| if action == "SIGN":
|     b64 = b64encode(dumps(payload)).rstrip("=")
|     sig = hmac_sha256(secret, b64)
|     return f"{b64}.{sig}"
| elif action == "VERIFY":
|     parts = token.split(".")
|     if len(parts) != 2: return malformed
|     if not compare_digest(sig, hmac_sha256(secret, b64)): return invalid_sig
|     payload = loads(b64decode(b64))
|     if current_time > payload.exp: return expired
|     return valid, payload""",
        ],
        "solution": {
            "code": """import base64
import hashlib
import hmac
import json

class Solution:
    def sign_and_verify_token(self, action: str, payload_or_token: any, secret: str, current_time: int) -> dict:
        if action == "SIGN":
            payload_json = json.dumps(payload_or_token, separators=(",", ":"), sort_keys=True)
            b64_payload = base64.urlsafe_b64encode(payload_json.encode()).decode().rstrip("=")
            sig = hmac.new(secret.encode(), b64_payload.encode(), hashlib.sha256).hexdigest()
            token = f"{b64_payload}.{sig}"
            return {"token": token, "success": True}

        elif action == "VERIFY":
            token = str(payload_or_token)
            parts = token.split(".")
            if len(parts) != 2:
                return {"valid": False, "error": "malformed_token"}
            b64_payload, sig = parts
            expected_sig = hmac.new(secret.encode(), b64_payload.encode(), hashlib.sha256).hexdigest()
            if not hmac.compare_digest(sig, expected_sig):
                return {"valid": False, "error": "invalid_signature"}

            padded = b64_payload + "=" * (-len(b64_payload) % 4)
            try:
                raw_json = base64.urlsafe_b64decode(padded.encode()).decode()
                payload = json.loads(raw_json)
            except Exception:
                return {"valid": False, "error": "corrupted_payload"}

            exp = payload.get("exp")
            if exp is not None and current_time > exp:
                return {"valid": False, "error": "token_expired"}

            return {"valid": True, "payload": payload}
""",
            "explanation": "Signing bundles JSON payload data into URL-safe base64 and binds it with an HMAC-SHA256 signature. Verification recalculates the signature and compares it in constant time with `hmac.compare_digest` to prevent timing attacks, followed by checking the expiration timestamp.",
            "time": "O(M) where M is payload JSON length",
            "space": "O(M) for encoded token string",
        },
        "pitch_script": """**(Clarify)** "We need to build a stateless authentication token engine that issues HMAC-SHA256 signed tokens and verifies signatures and expiration without database calls."

**(Brute force)** "Validating tokens by checking a database table defeats the purpose of stateless authentication and creates database bottlenecks."

**(Trigger)** "Creating cryptographically signed payloads with tamper detection signals HMAC-SHA256 token signing."

**(Optimal)** "For SIGN, we encode sorted JSON into URL-safe base64 and generate an HMAC-SHA256 hex signature. For VERIFY, we split into payload and signature, recompute the expected signature, and compare using `hmac.compare_digest` to eliminate timing attacks. If the signature matches and current time does not exceed `exp`, the token is valid."

**(Complexity)** "Executes in O(M) time and O(M) space for payload length M." """,
        "twist": {
            "lc": 9522,
            "title": "Refresh Token Rotation with Replay Attack Detection",
            "why": "Stateless access tokens are short-lived. Long-lived refresh tokens require rotation with reuse detection to mitigate token theft.",
        },
        "viz": {
            "title": "HMAC-SHA256 Stateless Token Cycle",
            "type": "http_lifecycle",
        },
    },
})

LESSONS_4B.append({
    "dir": "31-auth-security",
    "world_id": 31,
    "slug": "refresh-token-rotation-reuse",
    "lc": 9522,
    "citadel_id": "backend_apis",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Refresh Token Rotation with Replay Detection",
    "patterns": ["token-rotation", "replay-detection", "session-revocation", "oauth2"],
    "visualizer": "http_lifecycle",
    "data": {
        "slug": "refresh-token-rotation-reuse",
        "lc": 9522,
        "citadel_id": "backend_apis",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "If an attacker steals a client's long-lived refresh token from browser localStorage, how does the auth server prevent ongoing unauthorized access? In OAuth 2.0 Refresh Token Rotation (RTR), every time a refresh token is used to issue a new access token, the old refresh token is invalidated and a single-use replacement is returned. If an attacker attempts to replay a previously used refresh token, the server immediately detects Token Reuse — revoking the entire user session.",
            "brute_force": "Reusing static refresh tokens for 30 days without rotation, allowing compromised tokens to access accounts undetected.",
            "brute_force_complexity": "Indefinite account compromise until manual password reset.",
            "key_insight": "Maintain an active token and a history of used tokens in the session record. If a presented token appears in `used_tokens`, a replay attack is underway: mark the entire session revoked immediately.",
            "real_world": "Auth0 Refresh Token Rotation, Supabase auth token rotation, and Google OAuth 2.0 token revocation.",
        },
        "statement": {
            "clean": """Implement an OAuth 2.0 refresh token rotation engine with replay attack detection:
`rotate_refresh_token(presented_token: str, sessions_db: dict) -> dict`.

Input:
- `presented_token`: refresh token string submitted by client.
- `sessions_db`: mutable dictionary representing the user's session record:
  `{"session_id": str, "active_token": str, "used_tokens": list[str], "revoked": bool}`.

Rotation Protocol:
1. Revocation Check:
   - If `sessions_db.get("revoked")` is True:
     return `{"success": False, "error": "session_revoked", "status_code": 401}`.
2. Replay Attack Detection (Token Reuse):
   - If `presented_token` in `sessions_db["used_tokens"]`:
     A previously spent token was re-submitted!
     Set `sessions_db["revoked"] = True` immediately to protect the user.
     return `{"success": False, "error": "token_reuse_detected", "session_revoked": True, "status_code": 401}`.
3. Token Validation:
   - If `presented_token != sessions_db.get("active_token")`:
     return `{"success": False, "error": "token_not_found", "status_code": 404}`.
4. Token Rotation (Success):
   - Move `presented_token` into `used_tokens`: `sessions_db["used_tokens"].append(presented_token)`.
   - Issue new single-use refresh token: `new_active = f"rt_rot_{len(sessions_db['used_tokens'])}_{presented_token[-4:]}"`.
   - Update active token: `sessions_db["active_token"] = new_active`.
   - Issue new access token: `new_access = f"at_user_gen_{len(sessions_db['used_tokens'])}"`.
   - Return `{"success": True, "new_access_token": new_access, "new_refresh_token": new_active, "status_code": 200}`.""",
            "oa_story": """**BharatPay Merchant Portal — Token Hijacking Incident**

A merchant's laptop was infected with malware that extracted cached refresh tokens from Chrome application storage. Days later, the attacker presented a spent refresh token to the auth service.

Because the legacy system lacked rotation tracking, it reissued access tokens to the hacker. Implement this Refresh Token Rotation engine to detect token reuse and immediately revoke compromised sessions.""",
            "trigger_keywords": ["refresh token rotation engine", "rotate_refresh_token", "token_reuse_detected"],
            "examples": [
                {
                    "input": 'presented_token = "rt_init_1001", sessions_db = {"session_id": "s_1", "active_token": "rt_init_1001", "used_tokens": [], "revoked": False}',
                    "output": '{"success": True, "new_access_token": "at_user_gen_1", "new_refresh_token": "rt_rot_1_1001", "status_code": 200}',
                    "explanation": "Valid token exchange: issues new access and refresh tokens, archiving old token.",
                },
                {
                    "input": 'presented_token = "rt_init_1001", sessions_db = {"session_id": "s_1", "active_token": "rt_rot_1_1001", "used_tokens": ["rt_init_1001"], "revoked": False}',
                    "output": '{"success": False, "error": "token_reuse_detected", "session_revoked": True, "status_code": 401}',
                    "explanation": "Token reuse detected! The session is immediately revoked.",
                },
            ],
            "constraints": [
                "presented_token is non-empty string",
                "sessions_db contains session_id, active_token, used_tokens, revoked",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why does OAuth 2.0 mandate revoking the entire session when a previously used refresh token is presented?",
            "options": [
                "Because either the legitimate user or an attacker is holding a duplicated token, indicating token leakage across the network",
                "Because refresh tokens consume excessive server RAM",
                "Because Python dictionaries cannot store more than 10 tokens",
                "To force users to update their browser version",
            ],
            "answer": 0,
            "explanation": "Under Refresh Token Rotation, every token is single-use. If an already-spent token is submitted, either the legitimate client or an eavesdropper is out-of-sync due to theft, requiring immediate revocation.",
        },
        "pattern_quiz": {
            "prompt": "What is the recommended lifespan combination for Access Tokens vs Refresh Tokens?",
            "options": [
                "Short-lived Access Tokens (10-15 minutes) and long-lived rotated Refresh Tokens (7-30 days)",
                "Equal lifespans of 24 hours each",
                "Long-lived Access Tokens (30 days) and short-lived Refresh Tokens (10 minutes)",
                "No expiration on either token",
            ],
            "answer": 0,
            "explanation": "Short-lived access tokens limit exposure if leaked in memory, while rotated refresh tokens allow seamless background renewal without prompting the user for credentials.",
        },
        "function": {
            "name": "rotate_refresh_token",
            "params": [{"name": "presented_token"}, {"name": "sessions_db"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def rotate_refresh_token(self, presented_token: str, sessions_db: dict) -> dict:
        pass
""",
        "tests": [
            {
                "args": [
                    "rt_init_1001",
                    {"session_id": "s_1", "active_token": "rt_init_1001", "used_tokens": [], "revoked": False}
                ],
                "expected": {
                    "success": True,
                    "new_access_token": "at_user_gen_1",
                    "new_refresh_token": "rt_rot_1_1001",
                    "status_code": 200,
                },
                "note": "First rotation successful",
            },
            {
                "args": [
                    "rt_init_1001",
                    {"session_id": "s_1", "active_token": "rt_rot_1_1001", "used_tokens": ["rt_init_1001"], "revoked": False}
                ],
                "expected": {
                    "success": False,
                    "error": "token_reuse_detected",
                    "session_revoked": True,
                    "status_code": 401,
                },
                "note": "Replay attack detected and revoked",
            },
            {
                "args": [
                    "rt_new_token",
                    {"session_id": "s_1", "active_token": "rt_rot_1_1001", "used_tokens": ["rt_init_1001"], "revoked": True}
                ],
                "expected": {
                    "success": False,
                    "error": "session_revoked",
                    "status_code": 401,
                },
                "note": "Already revoked session rejected",
            },
            {
                "args": [
                    "rt_unknown",
                    {"session_id": "s_1", "active_token": "rt_rot_1_1001", "used_tokens": ["rt_init_1001"], "revoked": False}
                ],
                "expected": {
                    "success": False,
                    "error": "token_not_found",
                    "status_code": 404,
                },
                "note": "Unknown token rejected",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Check if session is revoked",
                "goal": "Verify revocation flag in session record.",
                "instructions": "Return `bool(sessions_db.get('revoked', False))`.",
                "function": {"name": "drill_check_revoked", "params": [{"name": "sessions_db"}]},
                "starter_code": """class Solution:
    def drill_check_revoked(self, sessions_db: dict) -> bool:
        pass
""",
                "tests": [
                    {"args": [{"revoked": True}], "expected": True},
                    {"args": [{"revoked": False}], "expected": False},
                ],
                "solution": """class Solution:
    def drill_check_revoked(self, sessions_db: dict) -> bool:
        return bool(sessions_db.get("revoked", False))
""",
                "hint": "Return `bool(sessions_db.get('revoked', False))`.",
            },
            {
                "skill": "core",
                "title": "Detect token reuse",
                "goal": "Check if presented token is in used_tokens history.",
                "instructions": "Return `token in sessions_db.get('used_tokens', [])`.",
                "function": {"name": "drill_is_reused", "params": [{"name": "token"}, {"name": "sessions_db"}]},
                "starter_code": """class Solution:
    def drill_is_reused(self, token: str, sessions_db: dict) -> bool:
        pass
""",
                "tests": [
                    {"args": ["t1", {"used_tokens": ["t1", "t0"]}], "expected": True},
                    {"args": ["t2", {"used_tokens": ["t1", "t0"]}], "expected": False},
                ],
                "solution": """class Solution:
    def drill_is_reused(self, token: str, sessions_db: dict) -> bool:
        return token in sessions_db.get("used_tokens", [])
""",
                "hint": "Check `token in used_tokens`.",
            },
            {
                "skill": "edge",
                "title": "Generate rotated token pair",
                "goal": "Format new access and refresh token strings.",
                "instructions": "Return `[new_access, new_refresh]` based on count and token suffix.",
                "function": {"name": "drill_new_tokens", "params": [{"name": "count"}, {"name": "suffix"}]},
                "starter_code": """class Solution:
    def drill_new_tokens(self, count: int, suffix: str) -> list[str]:
        pass
""",
                "tests": [
                    {"args": [1, "1001"], "expected": ["at_user_gen_1", "rt_rot_1_1001"]},
                ],
                "solution": """class Solution:
    def drill_new_tokens(self, count: int, suffix: str) -> list[str]:
        return [f"at_user_gen_{count}", f"rt_rot_{count}_{suffix}"]
""",
                "hint": "Format strings using count and suffix.",
            },
        ],
        "hints": [
            "Check `sessions_db['revoked']` first; if True, return 401.",
            "Check if `presented_token in sessions_db['used_tokens']`. If so, set `sessions_db['revoked'] = True` and return 401 token_reuse_detected.",
            """| # Pseudocode Blueprint
| if sessions_db.revoked: return 401 session_revoked
| if presented_token in sessions_db.used_tokens:
|     sessions_db.revoked = True
|     return 401 token_reuse_detected
| if presented_token != sessions_db.active_token:
|     return 404 token_not_found
| sessions_db.used_tokens.append(presented_token)
| new_active = f"rt_rot_{len(used)}_{presented_token[-4:]}"
| sessions_db.active_token = new_active
| return 200, new_access, new_active""",
        ],
        "solution": {
            "code": """class Solution:
    def rotate_refresh_token(self, presented_token: str, sessions_db: dict) -> dict:
        if sessions_db.get("revoked", False):
            return {"success": False, "error": "session_revoked", "status_code": 401}

        used = sessions_db.setdefault("used_tokens", [])
        if presented_token in used:
            sessions_db["revoked"] = True
            return {"success": False, "error": "token_reuse_detected", "session_revoked": True, "status_code": 401}

        active = sessions_db.get("active_token")
        if presented_token != active:
            return {"success": False, "error": "token_not_found", "status_code": 404}

        used.append(presented_token)
        new_active = f"rt_rot_{len(used)}_{presented_token[-4:]}"
        sessions_db["active_token"] = new_active
        new_access = f"at_user_gen_{len(used)}"

        return {
            "success": True,
            "new_access_token": new_access,
            "new_refresh_token": new_active,
            "status_code": 200,
        }
""",
            "explanation": "Refresh Token Rotation guarantees that each refresh token can only be exchanged once. If a token in the `used_tokens` history is presented again, a replay attack has occurred. Setting `revoked = True` invalidates the entire session immediately, protecting the account.",
            "time": "O(U) where U is the count of used tokens in the session",
            "space": "O(1) updates to session dictionary",
        },
        "pitch_script": """**(Clarify)** "We need to simulate OAuth 2.0 Refresh Token Rotation, issuing single-use replacement tokens and revoking the session if a used token is replayed."

**(Brute force)** "Static refresh tokens without rotation allow intercepted credentials to maintain indefinite access to user accounts."

**(Trigger)** "Tracking single-use token lifecycle and detecting reuse signals OAuth 2.0 Refresh Token Rotation."

**(Optimal)** "We verify that the session is not revoked. If the presented token is found in the `used_tokens` list, we detect token reuse and immediately revoke the session with HTTP 401. If the token matches the active token, we archive it into `used_tokens`, issue a fresh access and refresh token pair, and return 200 OK."

**(Complexity)** "Executes in O(U) time to check token history and O(1) space." """,
        "twist": {
            "lc": 9531,
            "title": "HTTP 202 Accepted Asynchronous Job Polling with Exponential Backoff",
            "why": "Long-running auth or payment batch exports cannot be returned in a single response; the server returns 202 Accepted while clients poll.",
        },
        "viz": {
            "title": "OAuth 2.0 Token Rotation & Reuse Detection",
            "type": "http_lifecycle",
        },
    },
})

# ==========================================
# W33: Async Jobs & Polling (add 1 lesson)
# ==========================================

LESSONS_4B.append({
    "dir": "33-async-jobs-polling",
    "world_id": 33,
    "slug": "http-202-polling-backoff",
    "lc": 9531,
    "citadel_id": "backend_apis",
    "brick_layer": 3,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "HTTP 202 Polling with Exponential Backoff",
    "patterns": ["async-jobs", "http-202", "exponential-backoff", "polling"],
    "visualizer": "http_lifecycle",
    "data": {
        "slug": "http-202-polling-backoff",
        "lc": 9531,
        "citadel_id": "backend_apis",
        "brick_layer": 3,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "Why must long-running background tasks (PDF generation, bulk CSV exports, ML inference) respond with HTTP 202 Accepted instead of keeping the connection open? HTTP connections through reverse proxies (Nginx, ALB) time out after 60 seconds (HTTP 504 Gateway Timeout). The server acknowledges task ingestion with `202 Accepted` and returns a job status URL. The client polls the status using exponential backoff to minimize database load.",
            "brute_force": "Holding HTTP sockets open for 5 minutes, leading to proxy gateway timeouts and dropped client connections.",
            "brute_force_complexity": "High socket resource exhaustion and fragile network connections.",
            "key_insight": "Simulating a polling loop that queries status at increasing intervals (`min(int(interval * multiplier), max_interval)`) models real-world backoff without polling stampedes.",
            "real_world": "AWS S3 batch export status polling, OpenAI fine-tuning job status checks, and Stripe bulk transfer jobs.",
        },
        "statement": {
            "clean": """Implement an HTTP 202 polling loop with exponential backoff for asynchronous jobs:
`simulate_job_polling(job_timeline: dict, initial_interval_ms: int, backoff_multiplier: float, max_interval_ms: int, max_attempts: int) -> dict`.

Inputs:
- `job_timeline`: dictionary mapping elapsed simulation time `ms` (as int or str) to job status (`"PENDING"`, `"PROCESSING"`, `"SUCCESS"`, or `"FAILED"`).
- `initial_interval_ms`: initial delay before the next poll.
- `backoff_multiplier`: factor to increase interval after non-terminal poll (e.g. `1.5`).
- `max_interval_ms`: ceiling cap on polling interval.
- `max_attempts`: maximum poll iterations before timing out.

Polling Simulation Rules:
1. Start at `current_time = 0`, `interval = initial_interval_ms`, `attempts = 0`.
2. Loop while `attempts < max_attempts`:
   - Increment `attempts += 1`.
   - Query job status at `current_time`: lookup the latest milestone in `job_timeline` whose time is `<= current_time`. If none, status is `"PENDING"`.
   - If status is `"SUCCESS"` or `"FAILED"`:
     return `{"completed": True, "status": status, "attempts": attempts, "total_time_ms": current_time}`.
   - If status is `"PENDING"` or `"PROCESSING"`:
     Advance time: `current_time += interval`.
     Update interval: `interval = min(int(interval * backoff_multiplier), max_interval_ms)`.
3. If loop exits after exhausting `max_attempts`:
   return `{"completed": False, "status": "TIMEOUT", "attempts": attempts, "total_time_ms": current_time}`.""",
            "oa_story": """**SwiftCart GST Invoice Generator — Polling Thundering Herd**

SwiftCart generated monthly tax invoices for 200,000 sellers. When sellers clicked 'Generate Report', the client frontend polled `/api/v1/jobs/{id}` every 100 milliseconds in a tight `while` loop. 200,000 clients polling 10 times a second flooded PostgreSQL with 2 million queries per second, crashing the database.

Implement this exponential backoff polling simulator to ensure client SDKs back off exponentially and cap polling frequency.""",
            "trigger_keywords": ["http 202 polling loop", "simulate_job_polling", "max_interval_ms"],
            "examples": [
                {
                    "input": 'job_timeline = {"0": "PENDING", "300": "PROCESSING", "700": "SUCCESS"}, initial_interval_ms = 200, backoff_multiplier = 1.5, max_interval_ms = 1000, max_attempts = 10',
                    "output": '{"completed": True, "status": "SUCCESS", "attempts": 4, "total_time_ms": 950}',
                    "explanation": "Poll 1 at 0ms (PENDING, next +200ms -> 200ms). Poll 2 at 200ms (PENDING, next +300ms -> 500ms). Poll 3 at 500ms (PROCESSING, next +450ms -> 950ms). Poll 4 at 950ms sees SUCCESS. Completed in 4 attempts.",
                },
                {
                    "input": 'job_timeline = {"0": "PENDING"}, initial_interval_ms = 100, backoff_multiplier = 2.0, max_interval_ms = 500, max_attempts = 3',
                    "output": '{"completed": False, "status": "TIMEOUT", "attempts": 3, "total_time_ms": 700}',
                    "explanation": "Job never finishes. Polls at 0, 100, 300, advancing to 700ms and timing out after 3 attempts.",
                },
            ],
            "constraints": [
                "1 <= max_attempts <= 100",
                "1 <= initial_interval_ms <= 10000",
                "1.0 <= backoff_multiplier <= 5.0",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why should background job status polling use exponential backoff rather than fixed 100ms intervals?",
            "options": [
                "To reduce database and API gateway load as the job takes longer, preventing a polling stampede ('thundering herd')",
                "To speed up job processing in Celery workers",
                "Because HTTP does not allow fixed intervals",
                "Exponential backoff is required by HTTPS encryption",
            ],
            "answer": 0,
            "explanation": "If thousands of clients poll at fixed high frequencies, they overwhelm backend databases. Exponential backoff increases delay as time passes, dramatically reducing request volume.",
        },
        "pattern_quiz": {
            "prompt": "What HTTP response header should a server return with HTTP 202 Accepted to instruct the client where to poll for status?",
            "options": [
                "`Location: /api/jobs/{job_id}`",
                "`Content-Encoding: gzip`",
                "`Set-Cookie: user_id`",
                "`Server: nginx`",
            ],
            "answer": 0,
            "explanation": "RFC 9110 states that an HTTP 202 Accepted response SHOULD return a `Location` header pointing to a status monitor resource where the job progress can be inspected.",
        },
        "function": {
            "name": "simulate_job_polling",
            "params": [{"name": "job_timeline"}, {"name": "initial_interval_ms"}, {"name": "backoff_multiplier"}, {"name": "max_interval_ms"}, {"name": "max_attempts"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def simulate_job_polling(self, job_timeline: dict, initial_interval_ms: int, backoff_multiplier: float, max_interval_ms: int, max_attempts: int) -> dict:
        pass
""",
        "tests": [
            {
                "args": [
                    {"0": "PENDING", "300": "PROCESSING", "700": "SUCCESS"},
                    200, 1.5, 1000, 10
                ],
                "expected": {"completed": True, "status": "SUCCESS", "attempts": 4, "total_time_ms": 950},
                "note": "Job succeeds on 4th poll",
            },
            {
                "args": [
                    {"0": "PENDING", "200": "FAILED"},
                    100, 2.0, 500, 5
                ],
                "expected": {"completed": True, "status": "FAILED", "attempts": 3, "total_time_ms": 300},
                "note": "Job fails on 3rd poll (time 300)",
            },
            {
                "args": [
                    {"0": "PENDING"},
                    100, 2.0, 500, 3
                ],
                "expected": {"completed": False, "status": "TIMEOUT", "attempts": 3, "total_time_ms": 700},
                "note": "Job times out after max attempts",
            },
            {
                "args": [
                    {"0": "SUCCESS"},
                    100, 2.0, 500, 5
                ],
                "expected": {"completed": True, "status": "SUCCESS", "attempts": 1, "total_time_ms": 0},
                "note": "Immediate completion at time 0",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Calculate backoff interval",
                "goal": "Compute next interval capped at max_interval.",
                "instructions": "Return `min(int(interval * mult), max_interval)`.",
                "function": {"name": "drill_next_interval", "params": [{"name": "interval"}, {"name": "mult"}, {"name": "max_interval"}]},
                "starter_code": """class Solution:
    def drill_next_interval(self, interval: int, mult: float, max_interval: int) -> int:
        pass
""",
                "tests": [
                    {"args": [200, 1.5, 1000], "expected": 300},
                    {"args": [800, 2.0, 1000], "expected": 1000},
                ],
                "solution": """class Solution:
    def drill_next_interval(self, interval: int, mult: float, max_interval: int) -> int:
        return min(int(interval * mult), max_interval)
""",
                "hint": "Multiply interval by mult, convert to int, and take min with max_interval.",
            },
            {
                "skill": "core",
                "title": "Get timeline status",
                "goal": "Lookup latest milestone state <= current_time.",
                "instructions": "Find the highest milestone time <= current_time and return its status.",
                "function": {"name": "drill_get_status", "params": [{"name": "timeline"}, {"name": "current_time"}]},
                "starter_code": """class Solution:
    def drill_get_status(self, timeline: dict, current_time: int) -> str:
        pass
""",
                "tests": [
                    {"args": [{"0": "PENDING", "500": "SUCCESS"}, 600], "expected": "SUCCESS"},
                    {"args": [{"0": "PENDING", "500": "SUCCESS"}, 200], "expected": "PENDING"},
                ],
                "solution": """class Solution:
    def drill_get_status(self, timeline: dict, current_time: int) -> str:
        status = "PENDING"
        for k in sorted(int(x) for x in timeline.keys()):
            if k <= current_time:
                status = timeline.get(str(k), timeline.get(k))
            else:
                break
        return status
""",
                "hint": "Iterate sorted milestone times.",
            },
            {
                "skill": "edge",
                "title": "Check terminal status",
                "goal": "Return True if status is SUCCESS or FAILED.",
                "instructions": "Return `status in ('SUCCESS', 'FAILED')`.",
                "function": {"name": "drill_is_terminal", "params": [{"name": "status"}]},
                "starter_code": """class Solution:
    def drill_is_terminal(self, status: str) -> bool:
        pass
""",
                "tests": [
                    {"args": ["SUCCESS"], "expected": True},
                    {"args": ["PROCESSING"], "expected": False},
                ],
                "solution": """class Solution:
    def drill_is_terminal(self, status: str) -> bool:
        return status in ("SUCCESS", "FAILED")
""",
                "hint": "Check status in ('SUCCESS', 'FAILED').",
            },
        ],
        "hints": [
            "Sort timeline milestones by integer timestamp.",
            "In each attempt, lookup the status for `current_time`. If terminal, return immediately; otherwise add interval and multiply interval by backoff factor.",
            """| # Pseudocode Blueprint
| current_time = 0, interval = initial_interval, attempts = 0
| while attempts < max_attempts:
|     attempts += 1
|     st = lookup_status(current_time)
|     if st in ["SUCCESS", "FAILED"]: return True, st, attempts, current_time
|     current_time += interval
|     interval = min(int(interval * multiplier), max_interval)
| return False, "TIMEOUT", attempts, current_time""",
        ],
        "solution": {
            "code": """class Solution:
    def simulate_job_polling(self, job_timeline: dict, initial_interval_ms: int, backoff_multiplier: float, max_interval_ms: int, max_attempts: int) -> dict:
        current_time = 0
        interval = initial_interval_ms
        attempts = 0
        sorted_milestones = sorted(int(k) for k in job_timeline.keys())

        def get_status(t: int) -> str:
            current_status = "PENDING"
            for m in sorted_milestones:
                if m <= t:
                    current_status = job_timeline.get(str(m), job_timeline.get(m))
                else:
                    break
            return current_status

        while attempts < max_attempts:
            attempts += 1
            st = get_status(current_time)
            if st in ["SUCCESS", "FAILED"]:
                return {
                    "completed": True,
                    "status": st,
                    "attempts": attempts,
                    "total_time_ms": current_time,
                }
            current_time += interval
            interval = min(int(interval * backoff_multiplier), max_interval_ms)

        return {
            "completed": False,
            "status": "TIMEOUT",
            "attempts": attempts,
            "total_time_ms": current_time,
        }
""",
            "explanation": "Simulating the polling client tracks time progression and polls status at each interval. Multiplying the interval by the backoff multiplier while capping at `max_interval_ms` prevents client polling storms while ensuring timely detection of terminal states.",
            "time": "O(A * M) where A is max_attempts and M is milestone count",
            "space": "O(M) for sorted timeline milestones",
        },
        "pitch_script": """**(Clarify)** "We need to simulate an asynchronous job polling loop with exponential backoff and a maximum interval cap, checking status progression until a terminal state or timeout occurs."

**(Brute force)** "Polling in a tight fixed-interval loop floods backend services with millions of unnecessary database queries."

**(Trigger)** "Tracking long-running job status transitions using expanding time intervals signals exponential backoff polling."

**(Optimal)** "We start at time 0. For each attempt, we lookup the latest status on the timeline. If the job reached SUCCESS or FAILED, we return completion immediately. Otherwise, we increment time by the current interval and scale the interval by the multiplier, capped by `max_interval_ms`."

**(Complexity)** "Executes in O(A * M) time for A attempts and M milestones with O(M) space." """,
        "twist": {
            "lc": 9504,
            "title": "Redis Sliding Window Rate Limiter",
            "why": "To protect polling endpoints from rogue clients that ignore backoff rules, backends deploy Redis sliding window rate limiters.",
        },
        "viz": {
            "title": "HTTP 202 Accepted Polling Timeline",
            "type": "http_lifecycle",
        },
    },
})

print(f"Loaded {len(LESSONS_4B)} lessons for Batch 4B.")

"""Data definitions for Batch 4A — Peak IV (OS & Concurrency)."""

LESSONS_4A = []

# ==========================================
# W26: Concurrency vs Parallelism & Race Conditions (3 lessons)
# ==========================================

LESSONS_4A.append({
    "dir": "26-concurrency-race-conditions",
    "world_id": 26,
    "slug": "deterministic-interleaving-counter",
    "lc": 9411,
    "citadel_id": "os_concurrency",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Deterministic Interleaving Counter",
    "patterns": ["race-condition", "interleaving-schedule", "shared-memory"],
    "visualizer": "concurrency_timeline",
    "data": {
        "slug": "deterministic-interleaving-counter",
        "lc": 9411,
        "citadel_id": "os_concurrency",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "Why do concurrent increments on a shared counter yield a final value smaller than total operations? An increment is non-atomic: it decomposes into loading memory into a CPU register, adding 1, and storing back. When OS thread preemption interleaves these steps across threads, stale reads cause silent lost updates.",
            "brute_force": "Running concurrent threads without synchronization and hoping the operating system scheduler never switches threads mid-instruction.",
            "brute_force_complexity": "O(N) operations, but non-deterministic data corruption and lost updates.",
            "key_insight": "Tracing an exact sequence of READ, ADD, and WRITE steps with thread-local registers deterministically exposes how preemption produces lost updates.",
            "real_world": "Flash-sale inventory counters, distributed analytics click streams, and un-fenced in-memory cache updates.",
        },
        "statement": {
            "clean": """Implement an interleaving simulator to model thread preemption and lost updates on a shared counter:
`simulate_interleaving(steps: list[list[str]]) -> dict`.

Each step is a list `[thread_id, operation]` executed in exact order according to a deterministic schedule:
- `"READ"`: The thread reads the global `counter` into its local register `reg[thread_id]`.
- `"ADD"`: The thread increments its local register: `reg[thread_id] += 1`.
- `"WRITE"`: The thread writes its local register back to the global `counter`: `counter = reg[thread_id]`.

Track:
1. The final value of `counter` (initially `0`).
2. The total number of `"WRITE"` operations executed across all threads (`total_writes`).
3. The count of lost updates (`lost_updates = total_writes - counter`).

Return a dictionary containing:
- `"final_counter"`: `int`
- `"total_writes"`: `int`
- `"lost_updates"`: `int`
- `"race_detected"`: `bool` (`True` if `lost_updates > 0`, else `False`)""",
            "oa_story": """**KiranaKart Flash-Sale Inventory Reconciliation Post-Mortem**

During the Bengaluru Diwali Mega Sale, KiranaKart customers ordered 10,000 units of cold-pressed oil in 3 seconds. The backend order counter registered only 7,420 units sold, while physical warehouse stocks were completely exhausted.

The audit team proved that unsynchronized Go routines executed concurrent read-modify-write operations on the shared cache. Implement this interleaving simulator to model how OS thread context-switches produce lost updates under a deterministic schedule.""",
            "trigger_keywords": ["interleaving simulator", "lost updates", "deterministic schedule"],
            "examples": [
                {
                    "input": 'steps = [["T1", "READ"], ["T1", "ADD"], ["T1", "WRITE"], ["T2", "READ"], ["T2", "ADD"], ["T2", "WRITE"]]',
                    "output": '{"final_counter": 2, "total_writes": 2, "lost_updates": 0, "race_detected": False}',
                    "explanation": "Threads execute sequentially with no interleaving, so 0 lost updates occur.",
                },
                {
                    "input": 'steps = [["T1", "READ"], ["T2", "READ"], ["T1", "ADD"], ["T2", "ADD"], ["T1", "WRITE"], ["T2", "WRITE"]]',
                    "output": '{"final_counter": 1, "total_writes": 2, "lost_updates": 1, "race_detected": True}',
                    "explanation": "Both threads read 0 before either wrote. Both write 1, losing 1 increment.",
                },
            ],
            "constraints": [
                "0 <= len(steps) <= 1000",
                "Each operation is one of 'READ', 'ADD', 'WRITE'",
            ],
        },
        "constraint_quiz": {
            "prompt": "What is the computational complexity to simulate N scheduled thread steps using register hash maps?",
            "options": [
                "O(N) time and O(T) space where T is unique threads",
                "O(N^2) time due to nested thread scheduling",
                "O(1) time because hardware registers are fast",
                "O(2^N) time simulating all possible interleavings",
            ],
            "answer": 0,
            "explanation": "A single linear pass processes each step in O(1) time using a dictionary for thread registers, taking O(N) time and O(T) space.",
        },
        "pattern_quiz": {
            "prompt": "Under what condition does a lost update occur in this read-modify-write model?",
            "options": [
                "When Thread B writes a value computed from a READ that occurred before Thread A committed its WRITE",
                "When Thread A and Thread B have different thread IDs",
                "When the counter value exceeds 100",
                "When a thread reads from an empty register",
            ],
            "answer": 0,
            "explanation": "If Thread B reads before Thread A's updated write is committed, Thread B's subsequent write overwrites and clobbers Thread A's addition.",
        },
        "function": {
            "name": "simulate_interleaving",
            "params": [{"name": "steps"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def simulate_interleaving(self, steps: list[list[str]]) -> dict:
        pass
""",
        "tests": [
            {
                "args": [[["T1", "READ"], ["T1", "ADD"], ["T1", "WRITE"], ["T2", "READ"], ["T2", "ADD"], ["T2", "WRITE"]]],
                "expected": {"final_counter": 2, "total_writes": 2, "lost_updates": 0, "race_detected": False},
                "note": "Sequential execution without preemption",
            },
            {
                "args": [[["T1", "READ"], ["T2", "READ"], ["T1", "ADD"], ["T2", "ADD"], ["T1", "WRITE"], ["T2", "WRITE"]]],
                "expected": {"final_counter": 1, "total_writes": 2, "lost_updates": 1, "race_detected": True},
                "note": "Interleaved preemption losing one write",
            },
            {
                "args": [[
                    ["T1", "READ"], ["T2", "READ"], ["T3", "READ"],
                    ["T1", "ADD"], ["T2", "ADD"], ["T3", "ADD"],
                    ["T1", "WRITE"], ["T2", "WRITE"], ["T3", "WRITE"]
                ]],
                "expected": {"final_counter": 1, "total_writes": 3, "lost_updates": 2, "race_detected": True},
                "note": "Three threads all reading stale zero",
            },
            {
                "args": [[]],
                "expected": {"final_counter": 0, "total_writes": 0, "lost_updates": 0, "race_detected": False},
                "note": "Empty schedule edge case",
            },
        ],
        "visualize_test": 1,
        "drills": [
            {
                "skill": "setup",
                "title": "Initialize and read shared counter",
                "goal": "Read current counter into thread local register.",
                "instructions": "Assign the shared counter value into `registers[thread_id]` and return `registers`.",
                "function": {"name": "drill_read", "params": [{"name": "registers"}, {"name": "thread_id"}, {"name": "counter"}]},
                "starter_code": """class Solution:
    def drill_read(self, registers: dict, thread_id: str, counter: int) -> dict:
        pass
""",
                "tests": [
                    {"args": [{}, "T1", 5], "expected": {"T1": 5}},
                    {"args": [{"T1": 2}, "T2", 10], "expected": {"T1": 2, "T2": 10}},
                ],
                "solution": """class Solution:
    def drill_read(self, registers: dict, thread_id: str, counter: int) -> dict:
        registers[thread_id] = counter
        return registers
""",
                "hint": "Assign `registers[thread_id] = counter` and return `registers`.",
            },
            {
                "skill": "core",
                "title": "Increment register and write back",
                "goal": "Simulate ADD and WRITE operations for a thread.",
                "instructions": "Increment `registers[thread_id]` by 1, update `counter = registers[thread_id]`, and return `(counter, registers)`.",
                "function": {"name": "drill_add_write", "params": [{"name": "registers"}, {"name": "thread_id"}]},
                "starter_code": """class Solution:
    def drill_add_write(self, registers: dict, thread_id: str) -> list:
        pass
""",
                "tests": [
                    {"args": [{"T1": 0}, "T1"], "expected": [1, {"T1": 1}]},
                    {"args": [{"T1": 5}, "T1"], "expected": [6, {"T1": 6}]},
                ],
                "solution": """class Solution:
    def drill_add_write(self, registers: dict, thread_id: str) -> list:
        registers[thread_id] = registers.get(thread_id, 0) + 1
        counter = registers[thread_id]
        return [counter, registers]
""",
                "hint": "Increment the register, set counter equal to it, and return a 2-element list `[counter, registers]`.",
            },
            {
                "skill": "edge",
                "title": "Calculate lost updates count",
                "goal": "Detect race conditions by comparing total writes with final counter.",
                "instructions": "Return `total_writes - final_counter`.",
                "function": {"name": "drill_calc_lost", "params": [{"name": "total_writes"}, {"name": "final_counter"}]},
                "starter_code": """class Solution:
    def drill_calc_lost(self, total_writes: int, final_counter: int) -> int:
        pass
""",
                "tests": [
                    {"args": [5, 3], "expected": 2},
                    {"args": [4, 4], "expected": 0},
                ],
                "solution": """class Solution:
    def drill_calc_lost(self, total_writes: int, final_counter: int) -> int:
        return total_writes - final_counter
""",
                "hint": "Subtract final_counter from total_writes.",
            },
        ],
        "hints": [
            "Maintain a dictionary `registers = {}` mapping each thread ID to its local working value.",
            "When op is 'READ', copy the global counter to `registers[t]`. When 'ADD', increment `registers[t]`. When 'WRITE', commit `counter = registers[t]`.",
            """| # Pseudocode Blueprint
| counter = 0, registers = {}, writes = 0
| for thread_id, op in steps:
|     if op == "READ": registers[thread_id] = counter
|     elif op == "ADD": registers[thread_id] += 1
|     elif op == "WRITE": counter = registers[thread_id]; writes += 1
| return writes - counter lost updates""",
        ],
        "solution": {
            "code": """class Solution:
    def simulate_interleaving(self, steps: list[list[str]]) -> dict:
        counter = 0
        registers: dict[str, int] = {}
        total_writes = 0

        for thread_id, op in steps:
            if op == "READ":
                registers[thread_id] = counter
            elif op == "ADD":
                registers[thread_id] = registers.get(thread_id, 0) + 1
            elif op == "WRITE":
                counter = registers.get(thread_id, 0)
                total_writes += 1

        lost = total_writes - counter
        return {
            "final_counter": counter,
            "total_writes": total_writes,
            "lost_updates": lost,
            "race_detected": lost > 0,
        }
""",
            "explanation": "By decoupling the read and write phases across threads with per-thread registers, the simulation faithfully replicates hardware CPU register preemption. When multiple threads execute READ before any thread commits its WRITE, they both write back the same incremented value, causing lost updates.",
            "time": "O(N) where N is the number of steps in the schedule",
            "space": "O(T) where T is the number of unique threads",
        },
        "pitch_script": """**(Clarify)** "We need to simulate thread execution on a shared counter across an explicit schedule of READ, ADD, and WRITE steps to identify lost updates and race conditions."

**(Brute force)** "Running real multi-threaded code with `time.sleep()` yields non-deterministic timing that cannot be tested reliably across different CPU architectures."

**(Trigger)** "The problem provides an explicit sequence of steps with thread IDs, which triggers an event-driven state simulation using thread-local registers."

**(Optimal)** "We iterate through the steps linearly. A dictionary maintains each thread's register state. When a thread executes READ, it snapshots the global counter. On ADD, it increments its register. On WRITE, it writes its register to the global counter and increments the write tally. Lost updates equal total writes minus final counter."

**(Complexity)** "Executes in O(N) time across N steps and O(T) space for T thread registers." """,
        "twist": {
            "lc": 9412,
            "title": "Mutex-Protected Atomic Counter Simulation",
            "why": "Wrapping the READ-ADD-WRITE sequence inside ACQUIRE and RELEASE locks guarantees mutual exclusion and eliminates lost updates.",
        },
        "viz": {
            "title": "Deterministic Interleaving Timeline",
            "type": "concurrency_timeline",
        },
    },
})

LESSONS_4A.append({
    "dir": "26-concurrency-race-conditions",
    "world_id": 26,
    "slug": "mutex-protected-counter",
    "lc": 9412,
    "citadel_id": "os_concurrency",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Mutex-Protected Atomic Counter",
    "patterns": ["mutex-lock", "critical-section", "concurrency"],
    "visualizer": "concurrency_timeline",
    "data": {
        "slug": "mutex-protected-counter",
        "lc": 9412,
        "citadel_id": "os_concurrency",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How does a mutual exclusion lock (Mutex) eliminate race conditions and guarantee atomic updates? By requiring threads to acquire a lock before entering the critical section and release it upon exit, the OS guarantees that only one thread executes the read-modify-write cycle at any given moment.",
            "brute_force": "Relying on cooperative yielding or hoping operations complete before context switches occur.",
            "brute_force_complexity": "O(1) syntax, but silent data corruption in multi-core environments.",
            "key_insight": "A mutex tracks a single owner thread. Any thread attempting an operation without holding the lock causes an unprotected operation violation, while acquire attempts on a held lock are blocked.",
            "real_world": "Thread-safe connection pooling, banking balance transfers, and shared metrics counters in production services.",
        },
        "statement": {
            "clean": """Implement a mutex-protected counter to verify mutual exclusion over critical sections:
`simulate_locked_counter(steps: list[list[str]]) -> dict`.

Each step is a list `[thread_id, operation]` where operation is one of `"ACQUIRE"`, `"RELEASE"`, `"READ"`, `"ADD"`, `"WRITE"`.

Rules:
1. `lock_holder` is initially `None`.
2. `"ACQUIRE"`:
   - If `lock_holder is None`: `lock_holder = thread_id`.
   - If `lock_holder != thread_id`: the thread is blocked, increment `blocked_acquires`.
3. `"RELEASE"`:
   - If `lock_holder == thread_id`: release the lock (`lock_holder = None`).
4. `"READ"`, `"ADD"`, `"WRITE"`:
   - If `lock_holder != thread_id`: the thread attempted unprotected operations outside a held lock, increment `unprotected_operations`.
   - If `lock_holder == thread_id`: execute the operation safely using thread-local registers and shared counter.

Return a dictionary containing:
- `"final_counter"`: `int`
- `"total_writes"`: `int`
- `"unprotected_operations"`: `int`
- `"blocked_acquires"`: `int`
- `"safe_execution"`: `bool` (`True` if `unprotected_operations == 0` and `blocked_acquires == 0`)""",
            "oa_story": """**PayLoop Wallet Transfer Engine — Concurrency Audit**

During high-throughput UPI transactions, PayLoop engineers noticed balance discrepancies when multiple services credited the same merchant wallet simultaneously. A junior developer forgot to wrap the balance calculation inside a mutex lock.

Implement this lock-verified execution engine to prove that properly acquiring and releasing mutexes enforces safe critical section execution with zero unprotected operations.""",
            "trigger_keywords": ["mutex-protected counter", "unprotected operations", "blocked_acquires"],
            "examples": [
                {
                    "input": 'steps = [["T1", "ACQUIRE"], ["T1", "READ"], ["T1", "ADD"], ["T1", "WRITE"], ["T1", "RELEASE"], ["T2", "ACQUIRE"], ["T2", "READ"], ["T2", "ADD"], ["T2", "WRITE"], ["T2", "RELEASE"]]',
                    "output": '{"final_counter": 2, "total_writes": 2, "unprotected_operations": 0, "blocked_acquires": 0, "safe_execution": True}',
                    "explanation": "Both threads acquire and release properly, yielding 0 violations.",
                },
                {
                    "input": 'steps = [["T1", "READ"], ["T1", "WRITE"]]',
                    "output": '{"final_counter": 0, "total_writes": 0, "unprotected_operations": 2, "blocked_acquires": 0, "safe_execution": False}',
                    "explanation": "Operations executed without acquiring lock count as unprotected operations.",
                },
            ],
            "constraints": [
                "0 <= len(steps) <= 1000",
                "Operations are strictly ACQUIRE, RELEASE, READ, ADD, WRITE",
            ],
        },
        "constraint_quiz": {
            "prompt": "What happens if a thread tries to acquire a mutex that is already held by another thread?",
            "options": [
                "The thread is blocked from entering the critical section until the holder releases the lock",
                "The operating system terminates the process with SIGSEGV",
                "The lock is automatically cloned into a distributed semaphore",
                "The second thread executes in parallel without waiting",
            ],
            "answer": 0,
            "explanation": "Mutual exclusion specifies that an acquired mutex blocks any subsequent thread until released by the current holder.",
        },
        "pattern_quiz": {
            "prompt": "What constitutes an 'unprotected operation' in this critical section simulation?",
            "options": [
                "A READ, ADD, or WRITE operation executed by a thread that does not currently hold the mutex",
                "An ACQUIRE called when the lock is free",
                "A RELEASE called by the lock holder",
                "Reading a counter whose value is 0",
            ],
            "answer": 0,
            "explanation": "A critical section operation is unprotected whenever it executes without the executing thread holding the mutex.",
        },
        "function": {
            "name": "simulate_locked_counter",
            "params": [{"name": "steps"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def simulate_locked_counter(self, steps: list[list[str]]) -> dict:
        pass
""",
        "tests": [
            {
                "args": [[
                    ["T1", "ACQUIRE"], ["T1", "READ"], ["T1", "ADD"], ["T1", "WRITE"], ["T1", "RELEASE"],
                    ["T2", "ACQUIRE"], ["T2", "READ"], ["T2", "ADD"], ["T2", "WRITE"], ["T2", "RELEASE"]
                ]],
                "expected": {"final_counter": 2, "total_writes": 2, "unprotected_operations": 0, "blocked_acquires": 0, "safe_execution": True},
                "note": "Fully synchronized execution",
            },
            {
                "args": [[
                    ["T1", "ACQUIRE"], ["T2", "ACQUIRE"], ["T1", "READ"], ["T1", "ADD"], ["T1", "WRITE"], ["T1", "RELEASE"]
                ]],
                "expected": {"final_counter": 1, "total_writes": 1, "unprotected_operations": 0, "blocked_acquires": 1, "safe_execution": False},
                "note": "Blocked acquire detected",
            },
            {
                "args": [[
                    ["T1", "READ"], ["T1", "ADD"], ["T1", "WRITE"]
                ]],
                "expected": {"final_counter": 0, "total_writes": 0, "unprotected_operations": 3, "blocked_acquires": 0, "safe_execution": False},
                "note": "Unprotected operations outside lock",
            },
            {
                "args": [[]],
                "expected": {"final_counter": 0, "total_writes": 0, "unprotected_operations": 0, "blocked_acquires": 0, "safe_execution": True},
                "note": "Empty schedule",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Lock acquire and release",
                "goal": "Track the single lock holder thread.",
                "instructions": "If action is 'ACQUIRE' and holder is None, set holder to thread_id. If 'RELEASE' and holder matches thread_id, set holder to None. Return holder.",
                "function": {"name": "drill_mutex_toggle", "params": [{"name": "holder"}, {"name": "thread_id"}, {"name": "action"}]},
                "starter_code": """class Solution:
    def drill_mutex_toggle(self, holder: str, thread_id: str, action: str) -> str:
        pass
""",
                "tests": [
                    {"args": [None, "T1", "ACQUIRE"], "expected": "T1"},
                    {"args": ["T1", "T1", "RELEASE"], "expected": None},
                ],
                "solution": """class Solution:
    def drill_mutex_toggle(self, holder: str, thread_id: str, action: str) -> str:
        if action == "ACQUIRE" and holder is None:
            return thread_id
        if action == "RELEASE" and holder == thread_id:
            return None
        return holder
""",
                "hint": "Check action string and update holder accordingly.",
            },
            {
                "skill": "core",
                "title": "Check lock ownership",
                "goal": "Verify whether current thread owns the lock.",
                "instructions": "Return `True` if `holder == thread_id`, else `False`.",
                "function": {"name": "drill_is_holder", "params": [{"name": "holder"}, {"name": "thread_id"}]},
                "starter_code": """class Solution:
    def drill_is_holder(self, holder: str, thread_id: str) -> bool:
        pass
""",
                "tests": [
                    {"args": ["T1", "T1"], "expected": True},
                    {"args": ["T1", "T2"], "expected": False},
                    {"args": [None, "T1"], "expected": False},
                ],
                "solution": """class Solution:
    def drill_is_holder(self, holder: str, thread_id: str) -> bool:
        return holder == thread_id
""",
                "hint": "Return `holder == thread_id`.",
            },
            {
                "skill": "edge",
                "title": "Assess execution safety",
                "goal": "Confirm no blocked acquires or unprotected ops occurred.",
                "instructions": "Return `True` if `unprotected == 0 and blocked == 0`, else `False`.",
                "function": {"name": "drill_check_safe", "params": [{"name": "unprotected"}, {"name": "blocked"}]},
                "starter_code": """class Solution:
    def drill_check_safe(self, unprotected: int, blocked: int) -> bool:
        pass
""",
                "tests": [
                    {"args": [0, 0], "expected": True},
                    {"args": [1, 0], "expected": False},
                    {"args": [0, 2], "expected": False},
                ],
                "solution": """class Solution:
    def drill_check_safe(self, unprotected: int, blocked: int) -> bool:
        return unprotected == 0 and blocked == 0
""",
                "hint": "Return True only when both counts are 0.",
            },
        ],
        "hints": [
            "Track `lock_holder` initialized to `None`.",
            "Only permit READ, ADD, and WRITE if `lock_holder == thread_id`. Otherwise increment `unprotected_operations`.",
            """| # Pseudocode Blueprint
| lock_holder = None, counter = 0
| for thread_id, op in steps:
|     if op == "ACQUIRE":
|         if lock_holder is None: lock_holder = thread_id
|         elif lock_holder != thread_id: blocked += 1
|     elif op == "RELEASE":
|         if lock_holder == thread_id: lock_holder = None
|     elif lock_holder != thread_id: unprotected += 1
|     else: execute read/add/write""",
        ],
        "solution": {
            "code": """class Solution:
    def simulate_locked_counter(self, steps: list[list[str]]) -> dict:
        counter = 0
        registers: dict[str, int] = {}
        lock_holder = None
        total_writes = 0
        unprotected_ops = 0
        blocked_acquires = 0

        for thread_id, op in steps:
            if op == "ACQUIRE":
                if lock_holder is None:
                    lock_holder = thread_id
                elif lock_holder != thread_id:
                    blocked_acquires += 1
            elif op == "RELEASE":
                if lock_holder == thread_id:
                    lock_holder = None
            else:
                if lock_holder != thread_id:
                    unprotected_ops += 1
                else:
                    if op == "READ":
                        registers[thread_id] = counter
                    elif op == "ADD":
                        registers[thread_id] = registers.get(thread_id, 0) + 1
                    elif op == "WRITE":
                        counter = registers.get(thread_id, 0)
                        total_writes += 1

        return {
            "final_counter": counter,
            "total_writes": total_writes,
            "unprotected_operations": unprotected_ops,
            "blocked_acquires": blocked_acquires,
            "safe_execution": unprotected_ops == 0 and blocked_acquires == 0,
        }
""",
            "explanation": "A Mutex enforces mutual exclusion over the critical section. Any thread attempting to read or write without acquiring the lock triggers an unprotected operation violation, while acquire requests while the lock is held register as blocked acquires.",
            "time": "O(N) where N is the total number of operations",
            "space": "O(T) for registers and lock state",
        },
        "pitch_script": """**(Clarify)** "We need to simulate a mutex lock guarding shared counter increments, detecting any unprotected critical section access and blocked acquire attempts."

**(Brute force)** "Allowing threads to execute read-modify-write steps freely leads to data corruption under context switches."

**(Trigger)** "The problem introduces ACQUIRE and RELEASE lifecycle events alongside memory mutations, signaling a mutual exclusion state simulator."

**(Optimal)** "We track `lock_holder`. During ACQUIRE, if the lock is held by another thread, we record a blocked acquire. If memory operations occur without holding the lock, we record an unprotected operation. Otherwise, we execute the increment cleanly."

**(Complexity)** "Runs in O(N) time with O(T) space for thread registers." """,
        "twist": {
            "lc": 9421,
            "title": "Bounded Semaphore Permit Management",
            "why": "A mutex allows only 1 holder; a semaphore expands this to N permits with a FIFO waiting queue and bounded release limits.",
        },
        "viz": {
            "title": "Mutex Lock Critical Section Timeline",
            "type": "concurrency_timeline",
        },
    },
})

LESSONS_4A.append({
    "dir": "26-concurrency-race-conditions",
    "world_id": 26,
    "slug": "concurrency-vs-parallelism-cores",
    "lc": 9413,
    "citadel_id": "os_concurrency",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Concurrency vs Parallelism Multi-Core Model",
    "patterns": ["concurrency-vs-parallelism", "multi-core", "task-scheduling"],
    "visualizer": "concurrency_timeline",
    "data": {
        "slug": "concurrency-vs-parallelism-cores",
        "lc": 9413,
        "citadel_id": "os_concurrency",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "What is the concrete difference in execution latency between running tasks concurrently on 1 CPU core versus in parallel across N CPU cores? Concurrency on 1 core serializes CPU execution while adding context-switch penalties. Parallelism across multiple physical cores executes tasks simultaneously, bounded by the longest task duration and load balancing.",
            "brute_force": "Assuming adding 4 cores automatically makes any program 4x faster without accounting for task granularity or context-switch overhead.",
            "brute_force_complexity": "Flawed mental model ignoring Amdahl's law and scheduling costs.",
            "key_insight": "Simulating task scheduling on 1 core (sum of durations plus context switches) versus N cores (greedy priority queue scheduling) computes the true speedup factor.",
            "real_world": "Kubernetes pod CPU limit sizing, threadpool sizing for background video transcoders, and Celery worker allocation.",
        },
        "statement": {
            "clean": """Implement an execution time model to compare concurrency vs parallelism across CPU cores:
`model_execution_time(tasks: list[dict], cores: int, context_switch_ms: int) -> dict`.

Each task has `{"id": str, "duration_ms": int}`.

Rules:
1. If `tasks` is empty, return:
   `{"single_core_time_ms": 0, "multi_core_time_ms": 0, "speedup": 1.0, "is_parallel_faster": False}`.
2. Single-Core Time (Concurrency on 1 core):
   - All tasks run serially on 1 core: sum of all `duration_ms`.
   - Each task transition after the first incurs `context_switch_ms` overhead: `(len(tasks) - 1) * context_switch_ms`.
   - `single_core_time_ms = sum(durations) + (len(tasks) - 1) * context_switch_ms`.
3. Multi-Core Time (Parallelism across `cores` cores):
   - Schedule tasks greedily across `cores` cores using a min-heap tracking each core's finish time.
   - For a core running its $k$-th task ($k > 1$), add `context_switch_ms` before running that task.
   - `multi_core_time_ms` is the maximum completion time among all cores.
4. Calculate:
   - `speedup = round(single_core_time_ms / multi_core_time_ms, 2)` (or `1.0` if multi-core time is 0).
   - `is_parallel_faster = multi_core_time_ms < single_core_time_ms`.

Return the results dictionary.""",
            "oa_story": """**RideMitra Dispatch Optimization — Core Allocation Benchmark**

During peak Bengaluru traffic hours, RideMitra dispatches route calculation jobs. The DevOps team debated whether upgrading microservice worker instances from 1 vCPU to 4 vCPU justifies the cloud cost.

Implement this concurrency vs parallelism execution time model to calculate the empirical speedup and scheduling overhead across varying task workloads.""",
            "trigger_keywords": ["concurrency vs parallelism", "execution time model", "single_core_time_ms"],
            "examples": [
                {
                    "input": 'tasks = [{"id": "1", "duration_ms": 100}, {"id": "2", "duration_ms": 100}, {"id": "3", "duration_ms": 100}, {"id": "4", "duration_ms": 100}], cores = 4, context_switch_ms = 10',
                    "output": '{"single_core_time_ms": 430, "multi_core_time_ms": 100, "speedup": 4.3, "is_parallel_faster": True}',
                    "explanation": "Single core takes 400 + 3*10 = 430ms. 4 cores run tasks in parallel with 0 switches on distinct cores, taking 100ms. Speedup is 4.3x.",
                },
            ],
            "constraints": [
                "0 <= len(tasks) <= 500",
                "1 <= cores <= 64",
                "0 <= context_switch_ms <= 100",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why can speedup exceed the number of cores (e.g. 4.3x on 4 cores) in this model?",
            "options": [
                "Because parallel execution avoids the context switch overhead that penalizes single-core task switching",
                "Because multi-core CPUs overclock automatically",
                "Because Python doubles bytecode interpretation speed on 4 cores",
                "Because memory caches double in bandwidth",
            ],
            "answer": 0,
            "explanation": "Single-core execution suffers context-switch penalties between every task, whereas distributing tasks evenly across available cores eliminates those switches.",
        },
        "pattern_quiz": {
            "prompt": "What data structure greedily schedules tasks to the earliest available CPU core in O(log C) time per task?",
            "options": [
                "Min-Heap priority queue storing (finish_time, task_count, core_id)",
                "Hash map without ordering",
                "Doubly-linked list without pointers",
                "Fixed circular array with linear scanning",
            ],
            "answer": 0,
            "explanation": "A min-heap always pops the core with the earliest availability in O(log C) time.",
        },
        "function": {
            "name": "model_execution_time",
            "params": [{"name": "tasks"}, {"name": "cores"}, {"name": "context_switch_ms"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def model_execution_time(self, tasks: list[dict], cores: int, context_switch_ms: int) -> dict:
        pass
""",
        "tests": [
            {
                "args": [
                    [{"id": "1", "duration_ms": 100}, {"id": "2", "duration_ms": 100}, {"id": "3", "duration_ms": 100}, {"id": "4", "duration_ms": 100}],
                    4, 10
                ],
                "expected": {"single_core_time_ms": 430, "multi_core_time_ms": 100, "speedup": 4.3, "is_parallel_faster": True},
                "note": "4 tasks across 4 cores",
            },
            {
                "args": [
                    [{"id": "1", "duration_ms": 50}, {"id": "2", "duration_ms": 50}],
                    1, 5
                ],
                "expected": {"single_core_time_ms": 105, "multi_core_time_ms": 105, "speedup": 1.0, "is_parallel_faster": False},
                "note": "1 core equivalent execution",
            },
            {
                "args": [[], 4, 10],
                "expected": {"single_core_time_ms": 0, "multi_core_time_ms": 0, "speedup": 1.0, "is_parallel_faster": False},
                "note": "Empty tasks list",
            },
            {
                "args": [
                    [{"id": "1", "duration_ms": 200}, {"id": "2", "duration_ms": 100}, {"id": "3", "duration_ms": 300}],
                    2, 20
                ],
                "expected": {"single_core_time_ms": 640, "multi_core_time_ms": 420, "speedup": 1.52, "is_parallel_faster": True},
                "note": "Heterogeneous durations on 2 cores",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Calculate single core time",
                "goal": "Compute sum of durations plus context switch penalties.",
                "instructions": "Return sum of durations plus `(len(durations) - 1) * switch_ms` if durations not empty, else 0.",
                "function": {"name": "drill_single_core", "params": [{"name": "durations"}, {"name": "switch_ms"}]},
                "starter_code": """class Solution:
    def drill_single_core(self, durations: list[int], switch_ms: int) -> int:
        pass
""",
                "tests": [
                    {"args": [[100, 200], 10], "expected": 310},
                    {"args": [[50], 10], "expected": 50},
                    {"args": [[], 10], "expected": 0},
                ],
                "solution": """class Solution:
    def drill_single_core(self, durations: list[int], switch_ms: int) -> int:
        if not durations:
            return 0
        return sum(durations) + (len(durations) - 1) * switch_ms
""",
                "hint": "Sum the durations and add `(len - 1) * switch_ms`.",
            },
            {
                "skill": "core",
                "title": "Min-heap core scheduling",
                "goal": "Assign task to core with smallest current finish time.",
                "instructions": "Pop earliest core from heap, add task duration and switch penalty (if task count > 0), push back.",
                "function": {"name": "drill_assign_task", "params": [{"name": "current_time"}, {"name": "count"}, {"name": "duration"}, {"name": "switch_ms"}]},
                "starter_code": """class Solution:
    def drill_assign_task(self, current_time: int, count: int, duration: int, switch_ms: int) -> list:
        pass
""",
                "tests": [
                    {"args": [0, 0, 100, 10], "expected": [100, 1]},
                    {"args": [100, 1, 100, 10], "expected": [210, 2]},
                ],
                "solution": """class Solution:
    def drill_assign_task(self, current_time: int, count: int, duration: int, switch_ms: int) -> list:
        extra = switch_ms if count > 0 else 0
        return [current_time + extra + duration, count + 1]
""",
                "hint": "Add extra switch penalty only when count > 0.",
            },
            {
                "skill": "edge",
                "title": "Compute speedup factor",
                "goal": "Calculate speedup rounded to 2 decimal places.",
                "instructions": "Return `round(t1 / t2, 2)` if t2 > 0 else 1.0.",
                "function": {"name": "drill_speedup", "params": [{"name": "t1"}, {"name": "t2"}]},
                "starter_code": """class Solution:
    def drill_speedup(self, t1: int, t2: int) -> float:
        pass
""",
                "tests": [
                    {"args": [430, 100], "expected": 4.3},
                    {"args": [100, 100], "expected": 1.0},
                ],
                "solution": """class Solution:
    def drill_speedup(self, t1: int, t2: int) -> float:
        return round(t1 / t2, 2) if t2 > 0 else 1.0
""",
                "hint": "Divide t1 by t2 and round to 2 decimals.",
            },
        ],
        "hints": [
            "Handle empty tasks list first.",
            "Use `heapq` with tuples `(current_time, task_count, core_id)` initialized to 0 for all cores.",
            """| # Pseudocode Blueprint
| if not tasks: return 0, 0, 1.0, False
| single_time = sum(durations) + (N - 1) * switch_ms
| pq = [(0, 0, core_id) for core_id in range(cores)]
| for task in tasks:
|     t, count, cid = heappop(pq)
|     new_t = t + (switch_ms if count > 0 else 0) + task.duration
|     heappush(pq, (new_t, count + 1, cid))
| multi_time = max(item[0] for item in pq)
| return single_time, multi_time, speedup""",
        ],
        "solution": {
            "code": """import heapq

class Solution:
    def model_execution_time(self, tasks: list[dict], cores: int, context_switch_ms: int) -> dict:
        if not tasks:
            return {
                "single_core_time_ms": 0,
                "multi_core_time_ms": 0,
                "speedup": 1.0,
                "is_parallel_faster": False,
            }

        total_duration = sum(t["duration_ms"] for t in tasks)
        single_core_time = total_duration + (len(tasks) - 1) * context_switch_ms

        pq = [(0, 0, i) for i in range(cores)]
        for t in tasks:
            curr_t, count, core_id = heapq.heappop(pq)
            extra_switch = context_switch_ms if count > 0 else 0
            new_t = curr_t + extra_switch + t["duration_ms"]
            heapq.heappush(pq, (new_t, count + 1, core_id))

        multi_core_time = max(item[0] for item in pq)
        speedup = round(single_core_time / multi_core_time, 2) if multi_core_time > 0 else 1.0

        return {
            "single_core_time_ms": single_core_time,
            "multi_core_time_ms": multi_core_time,
            "speedup": speedup,
            "is_parallel_faster": multi_core_time < single_core_time,
        }
""",
            "explanation": "On a single core, all tasks are serialized and suffer context-switch latency between every switch. On multiple cores, tasks are dispatched greedily to the earliest available core using a min-heap, enabling genuine parallel execution and reducing wall-clock runtime.",
            "time": "O(N log C) where N is task count and C is number of cores",
            "space": "O(C) for the min-heap priority queue",
        },
        "pitch_script": """**(Clarify)** "We need to model the wall-clock execution time of a task list on 1 core versus N cores, incorporating context switch penalties."

**(Brute force)** "Assuming an ideal linear speedup (T_single / N) ignores task imbalances and scheduling overheads."

**(Trigger)** "Distributing tasks across multiple worker cores signals a greedy min-heap priority queue scheduler."

**(Optimal)** "Single core execution is the sum of task durations plus context switches. For multi-core scheduling, a min-heap tracks the earliest free core, assigning the next task and adding context-switch overhead only if that core already ran a task. The final time is the maximum core completion time."

**(Complexity)** "Takes O(N log C) time and O(C) space for C cores." """,
        "twist": {
            "lc": 9406,
            "title": "Thread vs Process Context Switch Overhead Model",
            "why": "Context switching between threads shares address space, while switching between processes requires expensive TLB and page-table flushes.",
        },
        "viz": {
            "title": "Concurrency vs Parallelism Timeline",
            "type": "concurrency_timeline",
        },
    },
})

# ==========================================
# W27: Locks, Semaphores & Deadlocks (3 lessons)
# ==========================================

LESSONS_4A.append({
    "dir": "27-locks-deadlocks",
    "world_id": 27,
    "slug": "bounded-semaphore-simulator",
    "lc": 9421,
    "citadel_id": "os_concurrency",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Bounded Semaphore Permit Management",
    "patterns": ["semaphore", "permit-pool", "synchronization"],
    "visualizer": "concurrency_timeline",
    "data": {
        "slug": "bounded-semaphore-simulator",
        "lc": 9421,
        "citadel_id": "os_concurrency",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How do distributed pools prevent runaway resource consumption without dropping connections? A counting semaphore maintains a pool of permits. When permits reach zero, callers wait in a queue until a permit is released. A *bounded* semaphore prevents bugs where calling release() excessively inflates the permit count beyond initial capacity.",
            "brute_force": "Spawning unbounded threads or connections, causing socket exhaustion and database OOM crashes.",
            "brute_force_complexity": "O(1) allocation that crashes servers under sudden traffic spikes.",
            "key_insight": "A bounded semaphore simulation maintains `available_permits <= capacity`, a FIFO queue of waiting threads, and counts overflow errors when release exceeds capacity.",
            "real_world": "PostgreSQL connection pooling in PgBouncer, rate limiters, and threadpool worker dispatchers.",
        },
        "statement": {
            "clean": """Implement a bounded semaphore simulation for resource permit management:
`simulate_bounded_semaphore(capacity: int, operations: list[list[str]]) -> dict`.

Each operation is a list `[thread_id, action]` where `action` is either `"ACQUIRE"` or `"RELEASE"`.

Rules:
1. `available_permits` is initially `capacity`.
2. `granted` is a list of thread IDs currently holding permits.
3. `waiting` is a FIFO queue of thread IDs waiting for permits.
4. When `action == "ACQUIRE"`:
   - If `available_permits > 0`: decrement `available_permits`, append `thread_id` to `granted`.
   - If `available_permits == 0`: append `thread_id` to `waiting`.
5. When `action == "RELEASE"`:
   - If `available_permits >= capacity` and `len(waiting) == 0`: increment `overflow_errors` (cannot release beyond capacity).
   - Otherwise:
     - If `thread_id in granted`: remove `thread_id` from `granted`.
     - If `waiting` is not empty: pop the first thread from `waiting` and append to `granted`.
     - If `waiting` is empty: increment `available_permits`.

Return a dictionary containing:
- `"available_permits"`: `int`
- `"granted"`: `list[str]`
- `"waiting"`: `list[str]`
- `"overflow_errors"`: `int`""",
            "oa_story": """**BharatPay Database Connection Pool — Permit Leak Post-Mortem**

During UPI festive payments, BharatPay's payment gateway experienced microservice latency spikes. An engineer discovered that buggy error-recovery code was calling `semaphore.release()` in a finally block even when the connection was never acquired, leaking permits.

Implement this bounded semaphore simulator to enforce permit bounds and catch release overflow bugs in connection pools.""",
            "trigger_keywords": ["bounded semaphore simulation", "permit management", "available_permits"],
            "examples": [
                {
                    "input": 'capacity = 2, operations = [["T1", "ACQUIRE"], ["T2", "ACQUIRE"], ["T3", "ACQUIRE"], ["T1", "RELEASE"]]',
                    "output": '{"available_permits": 0, "granted": ["T2", "T3"], "waiting": [], "overflow_errors": 0}',
                    "explanation": "T1 releases its permit, which is immediately handed over to waiting thread T3.",
                },
                {
                    "input": 'capacity = 1, operations = [["T1", "RELEASE"]]',
                    "output": '{"available_permits": 1, "granted": [], "waiting": [], "overflow_errors": 1}',
                    "explanation": "Releasing when permits already equal capacity triggers an overflow error.",
                },
            ],
            "constraints": [
                "1 <= capacity <= 100",
                "0 <= len(operations) <= 500",
                "Actions are strictly 'ACQUIRE' or 'RELEASE'",
            ],
        },
        "constraint_quiz": {
            "prompt": "What distinguishes a BoundedSemaphore from a standard Semaphore in Python?",
            "options": [
                "BoundedSemaphore raises a ValueError if release() increments the permit counter above initial capacity",
                "BoundedSemaphore runs only on Linux operating systems",
                "BoundedSemaphore allocates memory in kernel space",
                "BoundedSemaphore can only hold 1 permit",
            ],
            "answer": 0,
            "explanation": "A BoundedSemaphore checks that its value does not exceed its initial value upon release, guarding against accidental permit leaks.",
        },
        "pattern_quiz": {
            "prompt": "What data structure maintains fair, first-come-first-served (FCFS) permit assignment for blocked threads?",
            "options": [
                "FIFO Queue (list with pop(0) or collections.deque)",
                "LIFO Stack",
                "Unordered set",
                "Max-heap ordered by thread name",
            ],
            "answer": 0,
            "explanation": "A FIFO queue grants permits to threads in the exact order they attempted to acquire.",
        },
        "function": {
            "name": "simulate_bounded_semaphore",
            "params": [{"name": "capacity"}, {"name": "operations"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def simulate_bounded_semaphore(self, capacity: int, operations: list[list[str]]) -> dict:
        pass
""",
        "tests": [
            {
                "args": [2, [["T1", "ACQUIRE"], ["T2", "ACQUIRE"], ["T3", "ACQUIRE"], ["T1", "RELEASE"]]],
                "expected": {"available_permits": 0, "granted": ["T2", "T3"], "waiting": [], "overflow_errors": 0},
                "note": "Permit handed directly to waiting thread",
            },
            {
                "args": [1, [["T1", "RELEASE"]]],
                "expected": {"available_permits": 1, "granted": [], "waiting": [], "overflow_errors": 1},
                "note": "Overflow on redundant release",
            },
            {
                "args": [3, [["T1", "ACQUIRE"], ["T2", "ACQUIRE"]]],
                "expected": {"available_permits": 1, "granted": ["T1", "T2"], "waiting": [], "overflow_errors": 0},
                "note": "Partial capacity acquired",
            },
            {
                "args": [1, []],
                "expected": {"available_permits": 1, "granted": [], "waiting": [], "overflow_errors": 0},
                "note": "Empty operations",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Check permit availability",
                "goal": "Determine if acquire succeeds immediately.",
                "instructions": "Return `True` if `available > 0`, else `False`.",
                "function": {"name": "drill_can_acquire", "params": [{"name": "available"}]},
                "starter_code": """class Solution:
    def drill_can_acquire(self, available: int) -> bool:
        pass
""",
                "tests": [
                    {"args": [2], "expected": True},
                    {"args": [0], "expected": False},
                ],
                "solution": """class Solution:
    def drill_can_acquire(self, available: int) -> bool:
        return available > 0
""",
                "hint": "Return available > 0.",
            },
            {
                "skill": "core",
                "title": "Hand off permit to waiting queue",
                "goal": "Transfer permit from released thread to head of waiting queue.",
                "instructions": "Pop the first thread from `waiting` and append to `granted`. Return `[granted, waiting]`.",
                "function": {"name": "drill_handoff", "params": [{"name": "granted"}, {"name": "waiting"}]},
                "starter_code": """class Solution:
    def drill_handoff(self, granted: list, waiting: list) -> list:
        pass
""",
                "tests": [
                    {"args": [["T1"], ["T2", "T3"]], "expected": [["T1", "T2"], ["T3"]]},
                ],
                "solution": """class Solution:
    def drill_handoff(self, granted: list, waiting: list) -> list:
        if waiting:
            granted.append(waiting.pop(0))
        return [granted, waiting]
""",
                "hint": "Pop index 0 from waiting and append to granted.",
            },
            {
                "skill": "edge",
                "title": "Detect permit overflow",
                "goal": "Check if release exceeds capacity.",
                "instructions": "Return `True` if `available >= capacity and len(waiting) == 0`, else `False`.",
                "function": {"name": "drill_is_overflow", "params": [{"name": "available"}, {"name": "capacity"}, {"name": "waiting"}]},
                "starter_code": """class Solution:
    def drill_is_overflow(self, available: int, capacity: int, waiting: list) -> bool:
        pass
""",
                "tests": [
                    {"args": [2, 2, []], "expected": True},
                    {"args": [1, 2, []], "expected": False},
                    {"args": [2, 2, ["T1"]], "expected": False},
                ],
                "solution": """class Solution:
    def drill_is_overflow(self, available: int, capacity: int, waiting: list) -> bool:
        return available >= capacity and len(waiting) == 0
""",
                "hint": "Check if available >= capacity when waiting is empty.",
            },
        ],
        "hints": [
            "Initialize `available = capacity`, `granted = []`, `waiting = []`, and `overflow_errors = 0`.",
            "When releasing, if a thread is waiting, directly transfer the permit to it without incrementing `available`.",
            """| # Pseudocode Blueprint
| available = capacity, granted = [], waiting = []
| for t, op in operations:
|     if op == "ACQUIRE":
|         if available > 0: available -= 1; granted.append(t)
|         else: waiting.append(t)
|     elif op == "RELEASE":
|         if available >= capacity and not waiting: overflow += 1
|         else:
|             if t in granted: granted.remove(t)
|             if waiting: granted.append(waiting.pop(0))
|             else: available += 1""",
        ],
        "solution": {
            "code": """class Solution:
    def simulate_bounded_semaphore(self, capacity: int, operations: list[list[str]]) -> dict:
        available = capacity
        granted = []
        waiting = []
        overflow_errors = 0

        for thread_id, op in operations:
            if op == "ACQUIRE":
                if available > 0:
                    available -= 1
                    granted.append(thread_id)
                else:
                    waiting.append(thread_id)
            elif op == "RELEASE":
                if available >= capacity and not waiting:
                    overflow_errors += 1
                else:
                    if thread_id in granted:
                        granted.remove(thread_id)
                    if waiting:
                        next_t = waiting.pop(0)
                        granted.append(next_t)
                    else:
                        available += 1

        return {
            "available_permits": available,
            "granted": granted,
            "waiting": waiting,
            "overflow_errors": overflow_errors,
        }
""",
            "explanation": "A bounded semaphore guarantees that permits never exceed the initial capacity. When a thread releases a permit while others are waiting in the queue, the permit is directly transferred to the next waiting thread, maintaining constant permit volume.",
            "time": "O(N) where N is the number of operations",
            "space": "O(capacity + waiting_threads) for tracking permits and queue",
        },
        "pitch_script": """**(Clarify)** "We need to simulate a bounded semaphore with capacity limits, tracking granted threads, a FIFO waiting queue, and overflow errors."

**(Brute force)** "An unbounded semaphore increments its permit counter indefinitely on release(), hiding bugs where release is invoked without a matching acquire."

**(Trigger)** "Tracking a fixed capacity of permits with blocked threads entering a waiting list indicates a bounded semaphore simulator."

**(Optimal)** "We maintain available permits and a waiting queue. On ACQUIRE, we grant immediately if available > 0, else queue. On RELEASE, if already at capacity with an empty queue, we record an overflow error. Otherwise, we pop from the waiting queue to grant the next thread or restore the permit."

**(Complexity)** "Runs in O(N) time with O(C + W) space for granted and waiting queues." """,
        "twist": {
            "lc": 9422,
            "title": "Resource Allocation Graph Deadlock Detection",
            "why": "When multiple threads hold some resources and wait for others held by peers, they can form a circular wait cycle causing a permanent deadlock.",
        },
        "viz": {
            "title": "Bounded Semaphore Timeline",
            "type": "concurrency_timeline",
        },
    },
})

LESSONS_4A.append({
    "dir": "27-locks-deadlocks",
    "world_id": 27,
    "slug": "deadlock-cycle-detector",
    "lc": 9422,
    "citadel_id": "os_concurrency",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Hard",
    "title": "Resource Allocation Graph Deadlock Detection",
    "patterns": ["deadlock-detection", "cycle-detection", "graph-dfs"],
    "visualizer": "concurrency_timeline",
    "data": {
        "slug": "deadlock-cycle-detector",
        "lc": 9422,
        "citadel_id": "os_concurrency",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How do operating systems and database engines detect when a set of concurrent processes are frozen in an unrecoverable deadlock? According to Coffman's conditions, deadlock occurs when there is Circular Wait. In a Wait-For Graph (WFG), a directed edge T_A -> T_B exists if T_A is waiting for a lock held by T_B. A directed cycle in this graph is both necessary and sufficient for deadlock.",
            "brute_force": "Letting hung threads block indefinitely until customer requests time out.",
            "brute_force_complexity": "System starvation and thread pool exhaustion.",
            "key_insight": "Construct a Wait-For Graph from lock allocations and pending requests, then run 3-color DFS to detect directed cycles.",
            "real_world": "PostgreSQL `deadlock_timeout` background detection worker, MySQL InnoDB lock table cycle detection, and OS kernel thread monitors.",
        },
        "statement": {
            "clean": """Implement an OS wait-for graph cycle detector to identify deadlock situations:
`detect_deadlock(allocations: dict[str, str], requests: list[list[str]]) -> dict`.

Inputs:
- `allocations`: `{lock_id: thread_id}` specifying which thread currently holds each lock.
- `requests`: `[[thread_id, lock_id], ...]` listing threads waiting to acquire specific locks.

Wait-For Graph Construction:
- If `thread_A` requests `lock_id`, and `allocations[lock_id] == thread_B` (where `thread_A != thread_B`):
  there is a directed edge: `thread_A -> thread_B` (Thread A is waiting for Thread B).

Deadlock Detection:
- Run 3-color DFS cycle detection (0: unvisited, 1: currently visiting in recursion stack, 2: fully visited).
- Search starting from lexicographically sorted thread IDs.
- If a cycle is detected, record the cycle path (e.g. `["T1", "T2", "T1"]`) and the sorted unique list of `deadlocked_threads`.

Return a dictionary containing:
- `"has_deadlock"`: `bool`
- `"cycle"`: `list[str]` (empty if no cycle)
- `"deadlocked_threads"`: `list[str]` (empty if no cycle)""",
            "oa_story": """**Swiggy Delivery Matcher — Lock Inversion Incident**

During peak lunch hour, Swiggy's delivery assignment service froze completely. Thread 1 held the Delivery Partner lock and requested the Order lock. Simultaneously, Thread 2 held the Order lock and requested the Delivery Partner lock.

Neither thread could progress, freezing order dispatch across Bengaluru. Implement this Resource Allocation Graph cycle detector to diagnose deadlocks before system hangs occur.""",
            "trigger_keywords": ["wait-for graph", "detect_deadlock", "deadlocked_threads"],
            "examples": [
                {
                    "input": 'allocations = {"L1": "T1", "L2": "T2"}, requests = [["T1", "L2"], ["T2", "L1"]]',
                    "output": '{"has_deadlock": True, "cycle": ["T1", "T2", "T1"], "deadlocked_threads": ["T1", "T2"]}',
                    "explanation": "T1 waits for T2, and T2 waits for T1, creating a circular wait cycle.",
                },
                {
                    "input": 'allocations = {"L1": "T1", "L2": "T2"}, requests = [["T1", "L3"], ["T2", "L1"]]',
                    "output": '{"has_deadlock": False, "cycle": [], "deadlocked_threads": []}',
                    "explanation": "No cycle exists since L3 is unallocated.",
                },
            ],
            "constraints": [
                "0 <= len(allocations) <= 500",
                "0 <= len(requests) <= 500",
            ],
        },
        "constraint_quiz": {
            "prompt": "What graph condition indicates a deadlock in a single-unit resource allocation graph?",
            "options": [
                "A directed cycle in the Wait-For Graph",
                "An undirected path connecting any two nodes",
                "A node with degree greater than 2",
                "A bipartite coloring mismatch",
            ],
            "answer": 0,
            "explanation": "In single-unit resource systems, a directed cycle in the Wait-For Graph is both necessary and sufficient for deadlock.",
        },
        "pattern_quiz": {
            "prompt": "How does 3-color DFS identify directed graph cycles without false positives?",
            "options": [
                "A back-edge to a node currently marked with Color 1 (in current recursion stack) proves a directed cycle",
                "Any edge to a Color 2 node proves a cycle",
                "Counting total visited nodes exceeding edge count",
                "Sorting node IDs alphabetically",
            ],
            "answer": 0,
            "explanation": "Gray (color 1) nodes represent ancestors on the current recursion call stack. Re-encountering a gray node confirms a directed cycle.",
        },
        "function": {
            "name": "detect_deadlock",
            "params": [{"name": "allocations"}, {"name": "requests"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def detect_deadlock(self, allocations: dict[str, str], requests: list[list[str]]) -> dict:
        pass
""",
        "tests": [
            {
                "args": [{"L1": "T1", "L2": "T2"}, [["T1", "L2"], ["T2", "L1"]]],
                "expected": {"has_deadlock": True, "cycle": ["T1", "T2", "T1"], "deadlocked_threads": ["T1", "T2"]},
                "note": "Classic two-thread deadlock",
            },
            {
                "args": [{"L1": "T1", "L2": "T2"}, [["T1", "L3"], ["T2", "L1"]]],
                "expected": {"has_deadlock": False, "cycle": [], "deadlocked_threads": []},
                "note": "No deadlock DAG",
            },
            {
                "args": [{"L1": "T1", "L2": "T2", "L3": "T3"}, [["T1", "L2"], ["T2", "L3"], ["T3", "L1"]]],
                "expected": {"has_deadlock": True, "cycle": ["T1", "T2", "T3", "T1"], "deadlocked_threads": ["T1", "T2", "T3"]},
                "note": "Three-thread circular wait",
            },
            {
                "args": [{}, []],
                "expected": {"has_deadlock": False, "cycle": [], "deadlocked_threads": []},
                "note": "Empty graph",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Build wait-for edge",
                "goal": "Map requester to lock holder.",
                "instructions": "If `lock in allocations` and `allocations[lock] != requester`, return `(requester, allocations[lock])`, else None.",
                "function": {"name": "drill_make_edge", "params": [{"name": "requester"}, {"name": "lock"}, {"name": "allocations"}]},
                "starter_code": """class Solution:
    def drill_make_edge(self, requester: str, lock: str, allocations: dict) -> list:
        pass
""",
                "tests": [
                    {"args": ["T1", "L2", {"L2": "T2"}], "expected": ["T1", "T2"]},
                    {"args": ["T1", "L1", {"L1": "T1"}], "expected": None},
                ],
                "solution": """class Solution:
    def drill_make_edge(self, requester: str, lock: str, allocations: dict) -> list:
        if lock in allocations and allocations[lock] != requester:
            return [requester, allocations[lock]]
        return None
""",
                "hint": "Check if lock in allocations and not owned by requester.",
            },
            {
                "skill": "core",
                "title": "Detect back-edge in DFS",
                "goal": "Identify when neighbor is currently in recursion stack.",
                "instructions": "Return `True` if `color.get(neighbor) == 1`, else `False`.",
                "function": {"name": "drill_is_back_edge", "params": [{"name": "color"}, {"name": "neighbor"}]},
                "starter_code": """class Solution:
    def drill_is_back_edge(self, color: dict, neighbor: str) -> bool:
        pass
""",
                "tests": [
                    {"args": [{"T1": 1}, "T1"], "expected": True},
                    {"args": [{"T1": 2}, "T1"], "expected": False},
                ],
                "solution": """class Solution:
    def drill_is_back_edge(self, color: dict, neighbor: str) -> bool:
        return color.get(neighbor) == 1
""",
                "hint": "Check if color is 1.",
            },
            {
                "skill": "edge",
                "title": "Extract cycle members",
                "goal": "Return sorted unique thread IDs in the detected cycle.",
                "instructions": "Return sorted unique elements of `cycle[:-1]` if cycle else `[]`.",
                "function": {"name": "drill_cycle_members", "params": [{"name": "cycle"}]},
                "starter_code": """class Solution:
    def drill_cycle_members(self, cycle: list) -> list:
        pass
""",
                "tests": [
                    {"args": [["T1", "T2", "T1"]], "expected": ["T1", "T2"]},
                    {"args": [[]], "expected": []},
                ],
                "solution": """class Solution:
    def drill_cycle_members(self, cycle: list) -> list:
        return sorted(set(cycle[:-1])) if cycle else []
""",
                "hint": "Slice `cycle[:-1]`, take set, sort.",
            },
        ],
        "hints": [
            "Construct directed adjacency list `adj` mapping waiting threads to holding threads.",
            "Use 3-color DFS: 0=unvisited, 1=in stack, 2=visited. Reaching color 1 reveals the cycle.",
            """| # Pseudocode Blueprint
| build adj: for t, lock in requests: if lock in alloc: adj[t].append(alloc[lock])
| run 3-color DFS from sorted threads
| if neighbor color == 1: cycle found!
| return has_deadlock, cycle, sorted(deadlocked_threads)""",
        ],
        "solution": {
            "code": """class Solution:
    def detect_deadlock(self, allocations: dict[str, str], requests: list[list[str]]) -> dict:
        adj: dict[str, list[str]] = {}
        all_threads = set(allocations.values())
        for t, lock in requests:
            all_threads.add(t)
            if lock in allocations:
                holder = allocations[lock]
                if holder != t:
                    adj.setdefault(t, []).append(holder)

        color: dict[str, int] = {}
        cycle_found: list[str] = []

        def dfs(u: str, path: list[str]):
            nonlocal cycle_found
            color[u] = 1
            path.append(u)
            for v in adj.get(u, []):
                if cycle_found:
                    return
                if color.get(v, 0) == 1:
                    idx = path.index(v)
                    cycle_found = path[idx:] + [v]
                    return
                elif color.get(v, 0) == 0:
                    dfs(v, path)
            path.pop()
            color[u] = 2

        for t in sorted(all_threads):
            if color.get(t, 0) == 0 and not cycle_found:
                dfs(t, [])

        deadlocked = sorted(set(cycle_found[:-1])) if cycle_found else []
        return {
            "has_deadlock": len(cycle_found) > 0,
            "cycle": cycle_found,
            "deadlocked_threads": deadlocked,
        }
""",
            "explanation": "Constructing the Wait-For Graph by linking requesters to lock holders models resource dependencies. Running a 3-color Depth-First Search reliably isolates directed circular dependencies without false positives from non-cyclical shared nodes.",
            "time": "O(V + E) where V is threads and E is resource dependencies",
            "space": "O(V + E) for the adjacency list and recursion stack",
        },
        "pitch_script": """**(Clarify)** "We need to construct a Wait-For Graph from lock allocations and pending requests and detect any circular wait deadlock cycles."

**(Brute force)** "Scanning random pairs of threads misses multi-party cycles (e.g. T1 -> T2 -> T3 -> T1)."

**(Trigger)** "Resource allocation dependencies mapped to directed graph cycles signals a Wait-For Graph with 3-color cycle detection."

**(Optimal)** "We build a directed graph where each edge points from a waiting thread to the thread holding the requested lock. We perform 3-color DFS (white/gray/black). When an edge points to an active gray ancestor on the call stack, we slice the cycle path and identify the deadlocked threads."

**(Complexity)** "Executes in O(V + E) time and O(V + E) space." """,
        "twist": {
            "lc": 9423,
            "title": "Hierarchical Lock Acquisition Ordering",
            "why": "Rather than detecting deadlocks after they occur, enforcing a strict global total ordering on lock acquisition mathematically prevents circular wait.",
        },
        "viz": {
            "title": "Wait-For Graph Deadlock Detection",
            "type": "concurrency_timeline",
        },
    },
})

LESSONS_4A.append({
    "dir": "27-locks-deadlocks",
    "world_id": 27,
    "slug": "hierarchical-lock-order-resolver",
    "lc": 9423,
    "citadel_id": "os_concurrency",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Hierarchical Lock Order Resolver",
    "patterns": ["lock-hierarchy", "deadlock-prevention", "dijkstra-ordering"],
    "visualizer": "concurrency_timeline",
    "data": {
        "slug": "hierarchical-lock-order-resolver",
        "lc": 9423,
        "citadel_id": "os_concurrency",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How can engineers mathematically guarantee that multi-threaded code will never deadlock, without needing runtime deadlock detectors? Havender and Dijkstra proved that by defining a global strict partial order on all lock identifiers (e.g. L1 < L2 < L3) and mandating that all threads acquire locks in strictly ascending order, Circular Wait becomes topologically impossible.",
            "brute_force": "Acquiring locks in arbitrary order and relying on timeout-based retries, causing lock thrashing.",
            "brute_force_complexity": "O(1) code complexity, but prone to high-contention livelock.",
            "key_insight": "Sorting each thread's lock requests according to canonical lexicographical hierarchy resolves order inversions and guarantees deadlock freedom.",
            "real_world": "Linux VFS inode lock hierarchies, database multi-table transaction locks, and Java/C++ mutex guidelines.",
        },
        "statement": {
            "clean": """Implement a hierarchical lock ordering optimizer to prevent deadlocks:
`resolve_lock_order(thread_requests: dict[str, list[str]]) -> dict`.

Input:
- `thread_requests`: dictionary mapping `thread_id` to its list of requested `lock_id`s in acquisition order (e.g., `{"T1": ["L2", "L1"]}`).

Rules:
1. Define the canonical global lock hierarchy as alphabetical order: `L1 < L2 < L3 ...`.
2. Count inversions: for each thread, count every pair `(locks[i], locks[j])` where `i < j` but `locks[i] > locks[j]`.
3. Sort each thread's lock list into canonical ascending order: `sorted(locks)`.
4. With all threads acquiring locks in ascending order, circular wait is mathematically eliminated.

Return a dictionary containing:
- `"reordered_requests"`: `dict[str, list[str]]`
- `"inversions_fixed"`: `int` (total inversions corrected across all threads)
- `"is_deadlock_free"`: `bool` (always `True` after sorting)""",
            "oa_story": """**Flipkart Inventory Multi-Warehouse Allocator — Lock Reversal Fix**

During Big Billion Days, Flipkart workers fulfilling orders spanning multiple regional warehouses acquired warehouse inventory locks in random order. Service A acquired Mumbai before Bengaluru, while Service B acquired Bengaluru before Mumbai, triggering deadlock.

Implement this lock order resolver to enforce canonical lock ordering across all checkout services.""",
            "trigger_keywords": ["hierarchical lock ordering", "inversions_fixed", "resolve_lock_order"],
            "examples": [
                {
                    "input": 'thread_requests = {"T1": ["L2", "L1"], "T2": ["L1", "L3", "L2"]}',
                    "output": '{"reordered_requests": {"T1": ["L1", "L2"], "T2": ["L1", "L2", "L3"]}, "inversions_fixed": 2, "is_deadlock_free": True}',
                    "explanation": "T1 had 1 inversion (L2 > L1). T2 had 1 inversion (L3 > L2). Total 2 inversions fixed.",
                },
            ],
            "constraints": [
                "0 <= len(thread_requests) <= 100",
                "0 <= len(locks) <= 100 per thread",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why does acquiring locks in a consistent global order guarantee deadlock prevention?",
            "options": [
                "It eliminates the Coffman 'Circular Wait' condition because dependency edges can only point in one direction",
                "It eliminates Mutual Exclusion so locks can be shared",
                "It disables preemption across CPU cores",
                "It speeds up lock acquisition to 0 nanoseconds",
            ],
            "answer": 0,
            "explanation": "If all threads acquire locks according to a strict total order, the resource allocation graph is topologically sorted and cannot contain a directed cycle.",
        },
        "pattern_quiz": {
            "prompt": "How do you count inversions in an array of lock identifiers?",
            "options": [
                "Count pairs (i, j) where i < j and locks[i] > locks[j]",
                "Count the number of duplicate lock strings",
                "Subtract length from capacity",
                "Sum the ASCII values of lock characters",
            ],
            "answer": 0,
            "explanation": "An inversion is an out-of-order pair where an earlier index holds a value greater than a later index.",
        },
        "function": {
            "name": "resolve_lock_order",
            "params": [{"name": "thread_requests"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def resolve_lock_order(self, thread_requests: dict[str, list[str]]) -> dict:
        pass
""",
        "tests": [
            {
                "args": [{"T1": ["L2", "L1"], "T2": ["L1", "L3", "L2"]}],
                "expected": {
                    "reordered_requests": {"T1": ["L1", "L2"], "T2": ["L1", "L2", "L3"]},
                    "inversions_fixed": 2,
                    "is_deadlock_free": True,
                },
                "note": "Standard lock reordering",
            },
            {
                "args": [{"T1": ["L1", "L2"], "T2": ["L1", "L2"]}],
                "expected": {
                    "reordered_requests": {"T1": ["L1", "L2"], "T2": ["L1", "L2"]},
                    "inversions_fixed": 0,
                    "is_deadlock_free": True,
                },
                "note": "Already sorted requests",
            },
            {
                "args": [{}],
                "expected": {
                    "reordered_requests": {},
                    "inversions_fixed": 0,
                    "is_deadlock_free": True,
                },
                "note": "Empty request map",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Count lock inversions in a list",
                "goal": "Count pairs where locks[i] > locks[j] for i < j.",
                "instructions": "Iterate all pairs (i, j) with i < j and count occurrences where locks[i] > locks[j].",
                "function": {"name": "drill_count_inv", "params": [{"name": "locks"}]},
                "starter_code": """class Solution:
    def drill_count_inv(self, locks: list[str]) -> int:
        pass
""",
                "tests": [
                    {"args": [["L2", "L1"]], "expected": 1},
                    {"args": [["L1", "L2", "L3"]], "expected": 0},
                ],
                "solution": """class Solution:
    def drill_count_inv(self, locks: list[str]) -> int:
        inv = 0
        for i in range(len(locks)):
            for j in range(i + 1, len(locks)):
                if locks[i] > locks[j]:
                    inv += 1
        return inv
""",
                "hint": "Use nested loops to check locks[i] > locks[j].",
            },
            {
                "skill": "core",
                "title": "Sort lock sequence",
                "goal": "Return sorted copy of locks.",
                "instructions": "Return `sorted(locks)`.",
                "function": {"name": "drill_sort_locks", "params": [{"name": "locks"}]},
                "starter_code": """class Solution:
    def drill_sort_locks(self, locks: list[str]) -> list[str]:
        pass
""",
                "tests": [
                    {"args": [["L3", "L1", "L2"]], "expected": ["L1", "L2", "L3"]},
                ],
                "solution": """class Solution:
    def drill_sort_locks(self, locks: list[str]) -> list[str]:
        return sorted(locks)
""",
                "hint": "Return sorted(locks).",
            },
            {
                "skill": "edge",
                "title": "Validate deadlock freedom",
                "goal": "Confirm all lists in dictionary are sorted.",
                "instructions": "Return `True` if for every list `l`, `l == sorted(l)`.",
                "function": {"name": "drill_all_sorted", "params": [{"name": "reqs"}]},
                "starter_code": """class Solution:
    def drill_all_sorted(self, reqs: dict) -> bool:
        pass
""",
                "tests": [
                    {"args": [{"T1": ["L1", "L2"]}], "expected": True},
                    {"args": [{"T1": ["L2", "L1"]}], "expected": False},
                ],
                "solution": """class Solution:
    def drill_all_sorted(self, reqs: dict) -> bool:
        return all(l == sorted(l) for l in reqs.values())
""",
                "hint": "Check `all(l == sorted(l) for l in reqs.values())`.",
            },
        ],
        "hints": [
            "Iterate through `thread_requests.items()`.",
            "For each thread, count out-of-order pairs and store `sorted(locks)`.",
            """| # Pseudocode Blueprint
| reordered = {}, total_inversions = 0
| for t, locks in thread_requests.items():
|     for i in range(len(locks)):
|         for j in range(i+1, len(locks)):
|             if locks[i] > locks[j]: total_inversions += 1
|     reordered[t] = sorted(locks)
| return reordered, total_inversions, True""",
        ],
        "solution": {
            "code": """class Solution:
    def resolve_lock_order(self, thread_requests: dict[str, list[str]]) -> dict:
        reordered: dict[str, list[str]] = {}
        inversions = 0
        for thread_id, locks in thread_requests.items():
            for i in range(len(locks)):
                for j in range(i + 1, len(locks)):
                    if locks[i] > locks[j]:
                        inversions += 1
            reordered[thread_id] = sorted(locks)

        return {
            "reordered_requests": reordered,
            "inversions_fixed": inversions,
            "is_deadlock_free": True,
        }
""",
            "explanation": "Enforcing a global lock acquisition hierarchy by sorting each thread's requested lock list guarantees that locks are acquired in strictly monotonic order. This breaks Coffman's circular wait condition, mathematically eliminating deadlocks.",
            "time": "O(T * K^2) where T is threads and K is locks per thread",
            "space": "O(T * K) for the reordered requests dictionary",
        },
        "pitch_script": """**(Clarify)** "We need to reorder each thread's lock acquisition sequence according to a canonical global hierarchy to eliminate deadlocks and count fixed inversions."

**(Brute force)** "Relying on deadlock detection after threads freeze incurs high recovery latency and aborts transactions."

**(Trigger)** "Fixing inverted lock sequences across concurrent threads triggers hierarchical lock ordering."

**(Optimal)** "We iterate through each thread's requested locks. We count inversions where an earlier lock is lexicographically greater than a later lock, and store the sorted list. Because every thread acquires locks in strictly increasing order, the Wait-For Graph is a DAG with zero cycles."

**(Complexity)** "Executes in O(T * K^2) time to detect inversions and O(T * K) space." """,
        "twist": {
            "lc": 9405,
            "title": "Thread Shared Heap vs Process Copy-on-Write Memory",
            "why": "Threads require locks because they share memory; processes avoid shared memory races by running in isolated address spaces.",
        },
        "viz": {
            "title": "Hierarchical Lock Ordering Timeline",
            "type": "concurrency_timeline",
        },
    },
})

# ==========================================
# W19: Processes & Threads (add 2 lessons)
# ==========================================

LESSONS_4A.append({
    "dir": "19-os-concurrency",
    "world_id": 19,
    "slug": "memory-isolation-threads-vs-processes",
    "lc": 9405,
    "citadel_id": "os_concurrency",
    "brick_layer": 1,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Thread Shared Heap vs Process Memory Isolation",
    "patterns": ["shared-heap", "copy-on-write", "virtual-memory"],
    "visualizer": "concurrency_timeline",
    "data": {
        "slug": "memory-isolation-threads-vs-processes",
        "lc": 9405,
        "citadel_id": "os_concurrency",
        "brick_layer": 1,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "Why do threads mutate each other's state while child processes do not affect their parent? In the OS virtual memory architecture, threads within a process share the exact same address space (Heap, Data, BSS segments). Processes, created via `fork()`, receive isolated page tables with Copy-on-Write (CoW). A mutation by a process creates a private memory page, leaving the parent untouched.",
            "brute_force": "Assuming processes share memory like threads and wondering why child process state changes vanish in the parent process.",
            "brute_force_complexity": "Fundamental misunderstanding of OS process address spaces.",
            "key_insight": "Simulating thread execution applies all mutations to one shared dictionary, whereas process execution applies mutations to isolated deep copies.",
            "real_world": "Gunicorn / Uvicorn worker process isolation vs Celery thread worker memory leaks.",
        },
        "statement": {
            "clean": """Implement a memory isolation simulator comparing threads vs processes:
`simulate_memory_isolation(initial_state: dict, thread_mutations: list[dict], process_mutations: list[dict]) -> dict`.

Input:
- `initial_state`: baseline key-value dictionary.
- `thread_mutations`: list of `{"key": str, "val": any}` applied by concurrent threads.
- `process_mutations`: list of `{"key": str, "val": any}` applied by spawned processes.

Rules:
1. Thread Model (Shared Heap):
   - Threads operate on a single shared memory state initialized as a copy of `initial_state`.
   - Apply all `thread_mutations` sequentially to this shared state.
2. Process Model (Copy-on-Write Virtual Memory Isolation):
   - Each process receives an isolated copy of `initial_state`.
   - Apply each process mutation to its own isolated copy.
3. Verification:
   - `isolation_verified` is `True` if every process isolated state is distinct from the thread shared state (or if no process mutations).

Return a dictionary containing:
- `"thread_shared_memory"`: `dict`
- `"process_isolated_memories"`: `list[dict]`
- `"isolation_verified"`: `bool`""",
            "oa_story": """**Zepto Dark-Store Cache Worker — Fork vs Thread Inconsistency**

Zepto backend services spawned worker routines to update dark-store inventory caches. When running under multi-processing, inventory updates were missing in the parent server, but under multi-threading, workers silently corrupted each other's session state.

Implement this memory isolation simulator to teach engineers how the OS kernel manages thread heap sharing versus process virtual memory isolation.""",
            "trigger_keywords": ["memory isolation", "simulate_memory_isolation", "thread_shared_memory"],
            "examples": [
                {
                    "input": 'initial_state = {"count": 0}, thread_mutations = [{"key": "count", "val": 1}], process_mutations = [{"key": "count", "val": 99}]',
                    "output": '{"thread_shared_memory": {"count": 1}, "process_isolated_memories": [{"count": 99}], "isolation_verified": True}',
                    "explanation": "Threads share memory, while the process receives an isolated copy.",
                },
            ],
            "constraints": [
                "0 <= len(initial_state) <= 50",
                "0 <= len(thread_mutations) <= 100",
                "0 <= len(process_mutations) <= 100",
            ],
        },
        "constraint_quiz": {
            "prompt": "What OS mechanism ensures a child process initially shares memory pages with the parent without duplicating RAM until a write occurs?",
            "options": [
                "Copy-on-Write (CoW) page fault handling",
                "Hardware Mutex register locking",
                "CPython Global Interpreter Lock",
                "Direct Memory Access (DMA) channel transfer",
            ],
            "answer": 0,
            "explanation": "Copy-on-Write marks shared pages read-only; when either process writes, the MMU triggers a page fault and duplicates only that 4KB page.",
        },
        "pattern_quiz": {
            "prompt": "Why do threads share variables without needing IPC (Inter-Process Communication)?",
            "options": [
                "All threads in a process share the same virtual memory page directory and Heap segment",
                "Threads use network sockets internally",
                "The kernel copies thread data every clock cycle",
                "Threads have no memory registers",
            ],
            "answer": 0,
            "explanation": "Threads created via `clone()` or `pthread_create()` share the same page tables, giving them direct access to the same heap address space.",
        },
        "function": {
            "name": "simulate_memory_isolation",
            "params": [{"name": "initial_state"}, {"name": "thread_mutations"}, {"name": "process_mutations"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def simulate_memory_isolation(self, initial_state: dict, thread_mutations: list[dict], process_mutations: list[dict]) -> dict:
        pass
""",
        "tests": [
            {
                "args": [
                    {"session": "INIT", "count": 0},
                    [{"key": "count", "val": 1}, {"key": "session", "val": "THREAD_ACTIVE"}],
                    [{"key": "count", "val": 99}, {"key": "session", "val": "PROC_B"}]
                ],
                "expected": {
                    "thread_shared_memory": {"session": "THREAD_ACTIVE", "count": 1},
                    "process_isolated_memories": [{"session": "INIT", "count": 99}, {"session": "PROC_B", "count": 0}],
                    "isolation_verified": True,
                },
                "note": "Standard thread sharing vs process isolation",
            },
            {
                "args": [
                    {"val": 10},
                    [],
                    [{"key": "val", "val": 20}]
                ],
                "expected": {
                    "thread_shared_memory": {"val": 10},
                    "process_isolated_memories": [{"val": 20}],
                    "isolation_verified": True,
                },
                "note": "Process mutations only",
            },
            {
                "args": [
                    {"status": "READY"},
                    [{"key": "status", "val": "DONE"}],
                    []
                ],
                "expected": {
                    "thread_shared_memory": {"status": "DONE"},
                    "process_isolated_memories": [],
                    "isolation_verified": True,
                },
                "note": "Thread mutations only",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Deep copy dictionary state",
                "goal": "Create independent memory clone of a dictionary.",
                "instructions": "Return a deep copy of `d` using `copy.deepcopy`.",
                "function": {"name": "drill_clone_dict", "params": [{"name": "d"}]},
                "starter_code": """class Solution:
    def drill_clone_dict(self, d: dict) -> dict:
        pass
""",
                "tests": [
                    {"args": [{"a": 1, "b": 2}], "expected": {"a": 1, "b": 2}},
                ],
                "solution": """import copy

class Solution:
    def drill_clone_dict(self, d: dict) -> dict:
        return copy.deepcopy(d)
""",
                "hint": "Use copy.deepcopy(d).",
            },
            {
                "skill": "core",
                "title": "Apply mutations to dictionary",
                "goal": "Mutate dictionary keys in-place.",
                "instructions": "For each item in mutations, set `d[item['key']] = item['val']` and return `d`.",
                "function": {"name": "drill_apply_muts", "params": [{"name": "d"}, {"name": "muts"}]},
                "starter_code": """class Solution:
    def drill_apply_muts(self, d: dict, muts: list[dict]) -> dict:
        pass
""",
                "tests": [
                    {"args": [{"x": 0}, [{"key": "x", "val": 5}]], "expected": {"x": 5}},
                ],
                "solution": """class Solution:
    def drill_apply_muts(self, d: dict, muts: list[dict]) -> dict:
        for m in muts:
            d[m["key"]] = m["val"]
        return d
""",
                "hint": "Loop through muts and update keys.",
            },
            {
                "skill": "edge",
                "title": "Verify memory isolation",
                "goal": "Check that process copies differ from shared memory.",
                "instructions": "Return True if all copies differ from shared, or if copies is empty.",
                "function": {"name": "drill_check_iso", "params": [{"name": "shared"}, {"name": "copies"}]},
                "starter_code": """class Solution:
    def drill_check_iso(self, shared: dict, copies: list[dict]) -> bool:
        pass
""",
                "tests": [
                    {"args": [{"a": 1}, [{"a": 2}]], "expected": True},
                    {"args": [{"a": 1}, [{"a": 1}]], "expected": False},
                ],
                "solution": """class Solution:
    def drill_check_iso(self, shared: dict, copies: list[dict]) -> bool:
        return all(p != shared for p in copies) if copies else True
""",
                "hint": "Check `all(p != shared for p in copies)`.",
            },
        ],
        "hints": [
            "Use `copy.deepcopy` to replicate OS Copy-on-Write page duplication.",
            "Apply thread mutations onto one shared dictionary, and process mutations onto separate clones.",
            """| # Pseudocode Blueprint
| thread_shared = deepcopy(initial_state)
| for m in thread_mutations: thread_shared[m.key] = m.val
| process_copies = []
| for m in process_mutations:
|     p_copy = deepcopy(initial_state)
|     p_copy[m.key] = m.val
|     process_copies.append(p_copy)
| return thread_shared, process_copies, verified""",
        ],
        "solution": {
            "code": """import copy

class Solution:
    def simulate_memory_isolation(self, initial_state: dict, thread_mutations: list[dict], process_mutations: list[dict]) -> dict:
        thread_shared = copy.deepcopy(initial_state)
        for mut in thread_mutations:
            thread_shared[mut["key"]] = mut["val"]

        process_copies = []
        for mut in process_mutations:
            p_copy = copy.deepcopy(initial_state)
            p_copy[mut["key"]] = mut["val"]
            process_copies.append(p_copy)

        return {
            "thread_shared_memory": thread_shared,
            "process_isolated_memories": process_copies,
            "isolation_verified": all(p != thread_shared for p in process_copies) if process_copies else True,
        }
""",
            "explanation": "Threads share heap memory within the same process address space, causing all thread mutations to accumulate in the shared dictionary. Processes run in isolated virtual memory address spaces, so mutations apply only to each process's private Copy-on-Write page copy.",
            "time": "O(T + P * M) where T is thread mutations, P is process mutations, and M is state size",
            "space": "O(P * M) for the isolated process memory snapshots",
        },
        "pitch_script": """**(Clarify)** "We need to simulate memory mutation behaviors between OS threads that share a heap versus OS processes that operate on isolated Copy-on-Write memory."

**(Brute force)** "Confusing process isolation with thread heap sharing leads to non-deterministic race conditions or lost process state in production."

**(Trigger)** "Simulating thread memory sharing alongside process snapshotting signals virtual address space modeling."

**(Optimal)** "We initialize a single shared state for threads and apply all thread mutations sequentially. For processes, we deep-copy the initial state for each process, applying mutations in isolation. We verify that process states do not bleed into the thread heap."

**(Complexity)** "Executes in O(T + P * M) time and O(P * M) space." """,
        "twist": {
            "lc": 9406,
            "title": "Context-Switch Cost Model Comparison",
            "why": "Process memory isolation comes with a trade-off: process context switches require flushing the TLB and page directory, which is much more expensive than a thread context switch.",
        },
        "viz": {
            "title": "Thread vs Process Memory Map",
            "type": "concurrency_timeline",
        },
    },
})

LESSONS_4A.append({
    "dir": "19-os-concurrency",
    "world_id": 19,
    "slug": "context-switch-cost-model",
    "lc": 9406,
    "citadel_id": "os_concurrency",
    "brick_layer": 1,
    "runner_type": "python_practical",
    "difficulty": "Easy",
    "title": "Thread vs Process Context Switch Cost Model",
    "patterns": ["context-switch", "tlb-flush", "cache-miss"],
    "visualizer": "concurrency_timeline",
    "data": {
        "slug": "context-switch-cost-model",
        "lc": 9406,
        "citadel_id": "os_concurrency",
        "brick_layer": 1,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "Why is an OS thread context switch an order of magnitude faster than a process context switch? A thread switch only saves and restores general-purpose registers, program counter, and stack pointer. A process switch must additionally swap the Page Table Base Register (CR3 in x86), flush the Translation Lookaside Buffer (TLB), and invalidate L1/L2 CPU caches, inducing expensive memory misses.",
            "brute_force": "Assuming threads and processes have identical CPU scheduling costs.",
            "brute_force_complexity": "Flawed architectural assumption leading to CPU throttling.",
            "key_insight": "Modeling the CPU register save latency, TLB flush overhead, and cache penalty quantifies the exact microsecond divergence between thread and process switching.",
            "real_world": "Sizing Nginx worker processes vs Golang goroutines vs Python Celery prefork workers.",
        },
        "statement": {
            "clean": """Implement an OS context switch cost model to compare thread vs process switching overhead:
`compare_context_switch_costs(switches: int, switch_type: str, cache_miss_rate: float) -> dict`.

Hardware Benchmark Constants:
- Thread Switch:
  - Base register save/restore: `1200` ns
  - TLB flush: `0` ns (threads share address space)
  - Cache penalty: `int(cache_miss_rate * 3000)` ns
- Process Switch:
  - Base register save/restore: `3500` ns
  - TLB flush: `4500` ns (address space change requires TLB invalidation)
  - Cache penalty: `int(cache_miss_rate * 12000)` ns

Formulas:
1. `overhead_per_switch_ns = base_ns + tlb_ns + cache_ns`
2. `total_latency_ns = overhead_per_switch_ns * switches`
3. `total_latency_ms = round(total_latency_ns / 1_000_000, 4)`

Return a dictionary containing:
- `"switch_type"`: `str` (`"thread"` or `"process"`)
- `"switches"`: `int`
- `"overhead_per_switch_ns"`: `int`
- `"total_latency_ns"`: `int`
- `"total_latency_ms"`: `float`""",
            "oa_story": """**Ola Fleet Tracking Gateway — Worker Architecture Benchmark**

Ola's vehicle telematics cluster handles 50,000 location pings per second. The platform team evaluated whether to run worker tasks using multi-processing vs multi-threading. The profiling team observed high CPU kernel time during process context switches.

Implement this context switch cost model to quantify the exact latency impact of TLB flushes and CPU cache misses.""",
            "trigger_keywords": ["context switch cost model", "compare_context_switch_costs", "total_latency_ms"],
            "examples": [
                {
                    "input": 'switches = 1000, switch_type = "process", cache_miss_rate = 0.5',
                    "output": '{"switch_type": "process", "switches": 1000, "overhead_per_switch_ns": 14000, "total_latency_ns": 14000000, "total_latency_ms": 14.0}',
                    "explanation": "Process switch takes 3500 base + 4500 TLB + 6000 cache = 14000ns per switch. 1000 switches = 14.0ms.",
                },
                {
                    "input": 'switches = 1000, switch_type = "thread", cache_miss_rate = 0.5',
                    "output": '{"switch_type": "thread", "switches": 1000, "overhead_per_switch_ns": 2700, "total_latency_ns": 2700000, "total_latency_ms": 2.7}',
                    "explanation": "Thread switch takes 1200 base + 0 TLB + 1500 cache = 2700ns. 1000 switches = 2.7ms (over 5x faster).",
                },
            ],
            "constraints": [
                "0 <= switches <= 1_000_000",
                "switch_type in ('thread', 'process')",
                "0.0 <= cache_miss_rate <= 1.0",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why does a process context switch invalidate the Translation Lookaside Buffer (TLB)?",
            "options": [
                "Because virtual addresses map to completely different physical frames in different process address spaces",
                "Because the CPU resets its clock frequency during process switching",
                "Because TLB memory is cleared on every timer interrupt",
                "Because threads do not use virtual memory",
            ],
            "answer": 0,
            "explanation": "Each process has its own page tables. Virtual address 0x00400000 in Process A points to different physical RAM than the same address in Process B, requiring the TLB cache to be flushed.",
        },
        "pattern_quiz": {
            "prompt": "What primary hardware components are saved during a lightweight thread context switch?",
            "options": [
                "General purpose CPU registers, Program Counter (PC), and Stack Pointer (SP)",
                "Entire 4GB RAM address space",
                "Disk swap partitions",
                "GPU framebuffers",
            ],
            "answer": 0,
            "explanation": "A thread switch only needs to preserve the CPU execution context (registers, PC, SP) since heap and address spaces are already shared.",
        },
        "function": {
            "name": "compare_context_switch_costs",
            "params": [{"name": "switches"}, {"name": "switch_type"}, {"name": "cache_miss_rate"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def compare_context_switch_costs(self, switches: int, switch_type: str, cache_miss_rate: float) -> dict:
        pass
""",
        "tests": [
            {
                "args": [1000, "process", 0.5],
                "expected": {"switch_type": "process", "switches": 1000, "overhead_per_switch_ns": 14000, "total_latency_ns": 14000000, "total_latency_ms": 14.0},
                "note": "Process switch benchmark",
            },
            {
                "args": [1000, "thread", 0.5],
                "expected": {"switch_type": "thread", "switches": 1000, "overhead_per_switch_ns": 2700, "total_latency_ns": 2700000, "total_latency_ms": 2.7},
                "note": "Thread switch benchmark",
            },
            {
                "args": [0, "thread", 0.0],
                "expected": {"switch_type": "thread", "switches": 0, "overhead_per_switch_ns": 1200, "total_latency_ns": 0, "total_latency_ms": 0.0},
                "note": "Zero switches edge case",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Select base constants",
                "goal": "Choose base and TLB latency according to switch type.",
                "instructions": "Return `(1200, 0)` for thread, `(3500, 4500)` for process.",
                "function": {"name": "drill_get_base", "params": [{"name": "switch_type"}]},
                "starter_code": """class Solution:
    def drill_get_base(self, switch_type: str) -> list[int]:
        pass
""",
                "tests": [
                    {"args": ["thread"], "expected": [1200, 0]},
                    {"args": ["process"], "expected": [3500, 4500]},
                ],
                "solution": """class Solution:
    def drill_get_base(self, switch_type: str) -> list[int]:
        return [1200, 0] if switch_type == "thread" else [3500, 4500]
""",
                "hint": "Check switch_type string.",
            },
            {
                "skill": "core",
                "title": "Calculate per-switch overhead",
                "goal": "Compute total nanoseconds per switch.",
                "instructions": "Return `base + tlb + int(rate * mult)`.",
                "function": {"name": "drill_calc_overhead", "params": [{"name": "base"}, {"name": "tlb"}, {"name": "rate"}, {"name": "mult"}]},
                "starter_code": """class Solution:
    def drill_calc_overhead(self, base: int, tlb: int, rate: float, mult: int) -> int:
        pass
""",
                "tests": [
                    {"args": [1200, 0, 0.5, 3000], "expected": 2700},
                    {"args": [3500, 4500, 0.5, 12000], "expected": 14000},
                ],
                "solution": """class Solution:
    def drill_calc_overhead(self, base: int, tlb: int, rate: float, mult: int) -> int:
        return base + tlb + int(rate * mult)
""",
                "hint": "Sum base, tlb, and int(rate * mult).",
            },
            {
                "skill": "edge",
                "title": "Convert ns to ms",
                "goal": "Convert nanoseconds to milliseconds rounded to 4 decimals.",
                "instructions": "Return `round(ns / 1_000_000, 4)`.",
                "function": {"name": "drill_ns_to_ms", "params": [{"name": "ns"}]},
                "starter_code": """class Solution:
    def drill_ns_to_ms(self, ns: int) -> float:
        pass
""",
                "tests": [
                    {"args": [14000000], "expected": 14.0},
                    {"args": [2700000], "expected": 2.7},
                ],
                "solution": """class Solution:
    def drill_ns_to_ms(self, ns: int) -> float:
        return round(ns / 1_000_000, 4)
""",
                "hint": "Divide by 1_000_000 and round to 4 decimals.",
            },
        ],
        "hints": [
            "Check whether `switch_type == 'thread'` or `'process'` to choose base and TLB constants.",
            "Multiply overhead per switch by total switches, then divide by 1,000,000 to get milliseconds.",
            """| # Pseudocode Blueprint
| if switch_type == "thread":
|     base = 1200, tlb = 0, cache = int(rate * 3000)
| else:
|     base = 3500, tlb = 4500, cache = int(rate * 12000)
| overhead = base + tlb + cache
| total_ns = overhead * switches
| return total_ns, round(total_ns / 1e6, 4)""",
        ],
        "solution": {
            "code": """class Solution:
    def compare_context_switch_costs(self, switches: int, switch_type: str, cache_miss_rate: float) -> dict:
        if switch_type == "thread":
            base_ns = 1200
            tlb_ns = 0
            cache_ns = int(cache_miss_rate * 3000)
        else:
            base_ns = 3500
            tlb_ns = 4500
            cache_ns = int(cache_miss_rate * 12000)

        overhead_per_switch = base_ns + tlb_ns + cache_ns
        total_ns = overhead_per_switch * switches
        total_ms = round(total_ns / 1_000_000, 4)

        return {
            "switch_type": switch_type,
            "switches": switches,
            "overhead_per_switch_ns": overhead_per_switch,
            "total_latency_ns": total_ns,
            "total_latency_ms": total_ms,
        }
""",
            "explanation": "Threads share virtual memory page tables, so thread switching incurs zero TLB flush penalty and minimal cache disturbance. Process switching invalidates the CPU TLB and forces high cache miss penalties, making process context switches 5x to 10x more expensive.",
            "time": "O(1) arithmetic calculation",
            "space": "O(1) returned dictionary",
        },
        "pitch_script": """**(Clarify)** "We need to calculate the context switch latency overhead for threads versus processes based on base register swaps, TLB flushes, and cache miss rates."

**(Brute force)** "Treating thread and process scheduling costs identically leads to poor architectural sizing in high-concurrency systems."

**(Trigger)** "Quantifying context switch penalties based on hardware cache misses and TLB invalidation signals an OS latency model."

**(Optimal)** "For threads, base latency is 1200ns with 0ns TLB cost and low cache penalty. For processes, changing address space requires a 4500ns TLB flush and 4x cache miss penalty. Multiplying by switch count yields exact microsecond and millisecond figures."

**(Complexity)** "Executes in O(1) time and space." """,
        "twist": {
            "lc": 9425,
            "title": "Workload Pool Optimizer: ThreadPool vs ProcessPool",
            "why": "Because process switches have higher overhead, CPU-bound workloads require process pools to bypass the GIL, while IO workloads benefit from lightweight thread pools.",
        },
        "viz": {
            "title": "Context Switch Latency Model",
            "type": "concurrency_timeline",
        },
    },
})

# ==========================================
# W28: GIL & Pools (add 1 lesson)
# ==========================================

LESSONS_4A.append({
    "dir": "28-gil-thread-pools",
    "world_id": 28,
    "slug": "thread-vs-process-pool-advisor",
    "lc": 9425,
    "citadel_id": "os_concurrency",
    "brick_layer": 3,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "ThreadPool vs ProcessPool Workload Advisor",
    "patterns": ["gil-contention", "threadpool", "processpool", "pool-optimization"],
    "visualizer": "concurrency_timeline",
    "data": {
        "slug": "thread-vs-process-pool-advisor",
        "lc": 9425,
        "citadel_id": "os_concurrency",
        "brick_layer": 3,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "When should a Python backend use `ThreadPoolExecutor` versus `ProcessPoolExecutor`? In CPython, the Global Interpreter Lock (GIL) prevents multiple threads from executing Python bytecode in parallel. For CPU-bound tasks, multithreading performs *slower* than single-threaded execution due to GIL lock thrashing! However, I/O-bound tasks release the GIL during network/disk wait. Process pools bypass the GIL across physical cores at the cost of IPC serialization overhead.",
            "brute_force": "Throwing ThreadPoolExecutor at heavy image processing or cryptography tasks, causing CPU execution to serialize under the GIL.",
            "brute_force_complexity": "O(N) CPU tasks running 100% serialized under GIL contention.",
            "key_insight": "Calculate the CPU workload ratio. If CPU tasks dominate and process parallel execution beats threadpool serialization (accounting for IPC overhead), recommend ProcessPoolExecutor.",
            "real_world": "FastAPI background worker pool sizing, ML batch prediction dispatchers, and web scraping pipelines.",
        },
        "statement": {
            "clean": """Implement a workload pool optimizer to recommend ThreadPoolExecutor vs ProcessPoolExecutor:
`recommend_pool_strategy(tasks: list[dict], cpu_cores: int) -> dict`.

Each task has `{"name": str, "type": "CPU" | "IO", "duration_ms": int}`.

Workload Execution Model:
1. `total_cpu_ms = sum(t["duration_ms"] for t in tasks if t["type"] == "CPU")`.
2. `total_io_ms = sum(t["duration_ms"] for t in tasks if t["type"] == "IO")`.
3. `max_io_ms = max((t["duration_ms"] for t in tasks if t["type"] == "IO"), default=0)`.
4. `max_cpu_ms = max((t["duration_ms"] for t in tasks if t["type"] == "CPU"), default=0)`.
5. `cpu_ratio = round(total_cpu_ms / (total_cpu_ms + total_io_ms), 2)` if tasks else `0.0`.

Performance Estimates:
- `ThreadPoolExecutor`:
  - Due to the GIL, all CPU tasks execute serially: `total_cpu_ms`.
  - IO tasks execute concurrently: `max_io_ms`.
  - `thread_pool_time = total_cpu_ms + max_io_ms`.
- `ProcessPoolExecutor`:
  - CPU tasks run in parallel across `cpu_cores`: `max(math.ceil(total_cpu_ms / cpu_cores), max_cpu_ms)`.
  - IO tasks overlap: `max_io_ms`.
  - Inter-Process Communication (IPC) serialization penalty: `len(tasks) * 5` ms.
  - `process_pool_time = max(math.ceil(total_cpu_ms / cpu_cores), max_cpu_ms) + max_io_ms + (len(tasks) * 5)`.

Decision:
- If `process_pool_time < thread_pool_time`: recommend `"ProcessPoolExecutor"` with `gil_bottleneck_detected = True`.
- Otherwise: recommend `"ThreadPoolExecutor"` with `gil_bottleneck_detected = False`.

Return a dictionary containing:
- `"recommended_pool"`: `str`
- `"estimated_time_ms"`: `int`
- `"gil_bottleneck_detected"`: `bool`
- `"cpu_ratio"`: `float`""",
            "oa_story": """**BlinkFast OCR Document Extraction — Pool Bottleneck**

BlinkFast receipt scanning pipeline ground to a halt during the Diwali shopping weekend. Developers dispatched 100 concurrent OCR image resizing tasks using Python's `ThreadPoolExecutor`. Instead of speeding up on a 16-core server, CPU usage pegged at 100% on a single core due to GIL lock contention.

Implement this pool advisor to automatically route CPU-heavy workloads to ProcessPoolExecutor and IO workloads to ThreadPoolExecutor.""",
            "trigger_keywords": ["workload pool optimizer", "recommend_pool_strategy", "gil_bottleneck_detected"],
            "examples": [
                {
                    "input": 'tasks = [{"name": "t1", "type": "CPU", "duration_ms": 400}, {"name": "t2", "type": "CPU", "duration_ms": 400}, {"name": "t3", "type": "IO", "duration_ms": 50}], cpu_cores = 4',
                    "output": '{"recommended_pool": "ProcessPoolExecutor", "estimated_time_ms": 465, "gil_bottleneck_detected": True, "cpu_ratio": 0.94}',
                    "explanation": "CPU tasks take 800ms under ThreadPool GIL. ProcessPool completes in 400 + 50 + 15 = 465ms.",
                },
                {
                    "input": 'tasks = [{"name": "t1", "type": "IO", "duration_ms": 200}, {"name": "t2", "type": "IO", "duration_ms": 300}], cpu_cores = 4',
                    "output": '{"recommended_pool": "ThreadPoolExecutor", "estimated_time_ms": 300, "gil_bottleneck_detected": False, "cpu_ratio": 0.0}',
                    "explanation": "Pure IO workload has zero GIL contention; ThreadPool avoids process IPC overhead.",
                },
            ],
            "constraints": [
                "0 <= len(tasks) <= 1000",
                "1 <= cpu_cores <= 64",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why does multi-threaded CPU-bound code in CPython fail to utilize multiple CPU cores?",
            "options": [
                "The Global Interpreter Lock (GIL) serializes execution of Python bytecode to protect memory management and reference counts",
                "Operating system kernels refuse to allocate threads to Python",
                "CPython disables hyper-threading at compile time",
                "Multi-threading requires root permissions",
            ],
            "answer": 0,
            "explanation": "The GIL is a mutual exclusion lock held by the interpreter thread to protect reference count modifications, ensuring only one native thread runs Python bytecode at a time.",
        },
        "pattern_quiz": {
            "prompt": "Why is ProcessPoolExecutor not always superior to ThreadPoolExecutor?",
            "options": [
                "Process creation and IPC argument serialization (pickling) introduce noticeable latency overhead",
                "Process pools cannot access local disk storage",
                "Processes cannot make HTTP requests",
                "Process pools crash if CPU usage exceeds 50%",
            ],
            "answer": 0,
            "explanation": "ProcessPoolExecutor must pickle function arguments and return values across pipe sockets, introducing IPC latency that makes it slower for lightweight or IO tasks.",
        },
        "function": {
            "name": "recommend_pool_strategy",
            "params": [{"name": "tasks"}, {"name": "cpu_cores"}],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """class Solution:
    def recommend_pool_strategy(self, tasks: list[dict], cpu_cores: int) -> dict:
        pass
""",
        "tests": [
            {
                "args": [
                    [{"name": "t1", "type": "CPU", "duration_ms": 400}, {"name": "t2", "type": "CPU", "duration_ms": 400}, {"name": "t3", "type": "IO", "duration_ms": 50}],
                    4
                ],
                "expected": {"recommended_pool": "ProcessPoolExecutor", "estimated_time_ms": 465, "gil_bottleneck_detected": True, "cpu_ratio": 0.94},
                "note": "Heavy CPU tasks benefit from ProcessPool",
            },
            {
                "args": [
                    [{"name": "t1", "type": "IO", "duration_ms": 200}, {"name": "t2", "type": "IO", "duration_ms": 300}],
                    4
                ],
                "expected": {"recommended_pool": "ThreadPoolExecutor", "estimated_time_ms": 300, "gil_bottleneck_detected": False, "cpu_ratio": 0.0},
                "note": "IO tasks benefit from ThreadPool",
            },
            {
                "args": [[], 4],
                "expected": {"recommended_pool": "ThreadPoolExecutor", "estimated_time_ms": 0, "gil_bottleneck_detected": False, "cpu_ratio": 0.0},
                "note": "Empty tasks",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Partition workload types",
                "goal": "Separate tasks into CPU and IO lists.",
                "instructions": "Return `[cpu_tasks, io_tasks]`.",
                "function": {"name": "drill_split_workload", "params": [{"name": "tasks"}]},
                "starter_code": """class Solution:
    def drill_split_workload(self, tasks: list[dict]) -> list:
        pass
""",
                "tests": [
                    {"args": [[{"type": "CPU"}, {"type": "IO"}]], "expected": [[{"type": "CPU"}], [{"type": "IO"}]]},
                ],
                "solution": """class Solution:
    def drill_split_workload(self, tasks: list[dict]) -> list:
        return [[t for t in tasks if t.get("type") == "CPU"], [t for t in tasks if t.get("type") == "IO"]]
""",
                "hint": "Use list comprehensions on `t.get('type')`.",
            },
            {
                "skill": "core",
                "title": "Calculate thread vs process times",
                "goal": "Compute latency estimates for both pools.",
                "instructions": "Return `[thread_time, process_time]`.",
                "function": {"name": "drill_pool_times", "params": [{"name": "cpu_ms"}, {"name": "io_ms"}, {"name": "cores"}, {"name": "n_tasks"}]},
                "starter_code": """class Solution:
    def drill_pool_times(self, cpu_ms: int, io_ms: int, cores: int, n_tasks: int) -> list[int]:
        pass
""",
                "tests": [
                    {"args": [800, 50, 4, 3], "expected": [850, 265]},
                ],
                "solution": """import math

class Solution:
    def drill_pool_times(self, cpu_ms: int, io_ms: int, cores: int, n_tasks: int) -> list[int]:
        thread_t = cpu_ms + io_ms
        proc_t = math.ceil(cpu_ms / cores) + io_ms + (n_tasks * 5)
        return [thread_t, proc_t]
""",
                "hint": "Calculate `cpu + io` for thread, and `ceil(cpu/cores) + io + n*5` for process.",
            },
            {
                "skill": "edge",
                "title": "Compute CPU workload ratio",
                "goal": "Calculate fraction of time spent in CPU tasks.",
                "instructions": "Return `round(cpu_ms / total_ms, 2)` if total_ms > 0 else 0.0.",
                "function": {"name": "drill_cpu_ratio", "params": [{"name": "cpu_ms"}, {"name": "total_ms"}]},
                "starter_code": """class Solution:
    def drill_cpu_ratio(self, cpu_ms: int, total_ms: int) -> float:
        pass
""",
                "tests": [
                    {"args": [800, 850], "expected": 0.94},
                    {"args": [0, 300], "expected": 0.0},
                ],
                "solution": """class Solution:
    def drill_cpu_ratio(self, cpu_ms: int, total_ms: int) -> float:
        return round(cpu_ms / total_ms, 2) if total_ms > 0 else 0.0
""",
                "hint": "Divide cpu_ms by total_ms and round to 2 decimals.",
            },
        ],
        "hints": [
            "Sum CPU task durations and find maximum IO duration.",
            "Compare `thread_pool_time` (GIL serializes CPU) against `process_pool_time` (parallel CPU plus IPC penalty).",
            """| # Pseudocode Blueprint
| thread_time = total_cpu_ms + max_io_ms
| proc_time = max(ceil(total_cpu_ms / cores), max_cpu_ms) + max_io_ms + (len(tasks) * 5)
| if proc_time < thread_time: recommend ProcessPoolExecutor, gil = True
| else: recommend ThreadPoolExecutor, gil = False""",
        ],
        "solution": {
            "code": """import math

class Solution:
    def recommend_pool_strategy(self, tasks: list[dict], cpu_cores: int) -> dict:
        cpu_tasks = [t for t in tasks if t.get("type") == "CPU"]
        io_tasks = [t for t in tasks if t.get("type") == "IO"]

        total_cpu_ms = sum(t["duration_ms"] for t in cpu_tasks)
        total_io_ms = sum(t["duration_ms"] for t in io_tasks)
        max_io_ms = max((t["duration_ms"] for t in io_tasks), default=0)
        max_cpu_ms = max((t["duration_ms"] for t in cpu_tasks), default=0)

        total_duration = total_cpu_ms + total_io_ms
        cpu_ratio = round(total_cpu_ms / total_duration, 2) if total_duration > 0 else 0.0

        thread_pool_time = total_cpu_ms + max_io_ms
        ipc_overhead = len(tasks) * 5
        process_pool_time = max(math.ceil(total_cpu_ms / cpu_cores), max_cpu_ms) + max_io_ms + ipc_overhead

        if process_pool_time < thread_pool_time:
            recommended = "ProcessPoolExecutor"
            est_time = process_pool_time
            gil_bottleneck = True
        else:
            recommended = "ThreadPoolExecutor"
            est_time = thread_pool_time
            gil_bottleneck = False

        return {
            "recommended_pool": recommended,
            "estimated_time_ms": est_time,
            "gil_bottleneck_detected": gil_bottleneck,
            "cpu_ratio": cpu_ratio,
        }
""",
            "explanation": "For CPU-bound tasks, the Python GIL forces ThreadPoolExecutor to run serially. ProcessPoolExecutor bypasses the GIL across available CPU cores, outperforming threads whenever the parallel speedup outweighs the IPC serialization penalty.",
            "time": "O(N) where N is the number of tasks",
            "space": "O(N) for partitioned task lists",
        },
        "pitch_script": """**(Clarify)** "We need to analyze a list of CPU and IO tasks to recommend whether ThreadPoolExecutor or ProcessPoolExecutor will achieve lower overall wall-clock execution time."

**(Brute force)** "Using ThreadPoolExecutor for all tasks causes CPU-bound workloads to serialize under CPython's Global Interpreter Lock."

**(Trigger)** "Comparing GIL serialization against multi-process core distribution and IPC penalties signals a workload pool optimization model."

**(Optimal)** "We partition tasks into CPU and IO. In ThreadPoolExecutor, CPU tasks serialize (sum) while IO overlaps (max). In ProcessPoolExecutor, CPU tasks run in parallel across CPU cores bounded by ceil(total_cpu / cores) and max task duration, plus a 5ms IPC serialization penalty. We pick the pool with the minimum estimated completion time."

**(Complexity)** "Runs in O(N) time and O(N) space." """,
        "twist": {
            "lc": 9513,
            "title": "Sync vs Async Def Event Loop Starvation Simulation",
            "why": "In FastAPI, calling a synchronous blocking function inside an async def endpoint starves the single event loop, requiring threadpool offloading.",
        },
        "viz": {
            "title": "ThreadPool vs ProcessPool Allocation",
            "type": "concurrency_timeline",
        },
    },
})

print(f"Loaded {len(LESSONS_4A)} lessons for Batch 4A.")

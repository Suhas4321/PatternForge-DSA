"""Data definitions for Batch 4D (GenAI & Resume) and Batch 4E (Python & Data)."""

null = None
true = True
false = False

LESSONS_4D_4E = []

# ==============================================================================
# BATCH 4D — PEAK VI (GenAI & Resume)
# ==============================================================================

# ------------------------------------------------------------------------------
# W36: Agents & LangGraph (3 lessons)
# ------------------------------------------------------------------------------

# Lesson 1: agent-state-machine-graph
LESSONS_4D_4E.append({
    "dir": "36-agents-langgraph",
    "world_id": 36,
    "slug": "agent-state-machine-graph",
    "lc": 9631,
    "citadel_id": "ai_resume",
    "brick_layer": 5,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "StateGraph Finite State Machine with Conditional Routing",
    "patterns": ["state-machine", "conditional-edges", "graph-orchestration", "agentic-workflow"],
    "visualizer": "system_blueprint",
    "data": {
        "slug": "agent-state-machine-graph",
        "lc": 9631,
        "citadel_id": "ai_resume",
        "brick_layer": 5,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How do agentic orchestration frameworks like LangGraph and CrewAI coordinate multi-step LLM workflows without fragile if-else spaghetti? By modeling execution as a directed cyclic StateGraph, shared state dictionaries flow through node functions, while conditional routing edges dynamically inspect output state to steer control flow or terminate safely.",
            "brute_force": "Hardcoded sequential script execution that cannot handle non-linear branching, human-in-the-loop validation, or cyclical agent retries.",
            "brute_force_complexity": "O(N) rigid script execution that breaks on unpredictable LLM outputs.",
            "key_insight": "Separating state mutation (nodes) from control routing (conditional edges) allows deterministic testing of agent workflows with strict step budgets.",
            "real_world": "LangGraph multi-agent customer support routers, Drizz autonomous mobile test agents, and LangChain graph executors.",
        },
        "statement": {
            "clean": """Implement a finite state machine workflow engine with nodes and conditional edges:
`run_state_graph(self, initial_state: dict, max_steps: int = 10) -> dict`.

The workflow models an agentic customer support router across 4 nodes:
- `'classifier'`: Inspects `state['query']`.
  - If query contains `'refund'` (case-insensitive), set `state['intent'] = 'billing'`.
  - If query contains `'reset'` (case-insensitive), set `state['intent'] = 'auth'`.
  - Otherwise, set `state['intent'] = 'general'`.
  - Append `'classified'` to `state['log']`.
- `'billing_agent'`: Appends `'billing_resolved'` to `state['log']`, sets `state['resolved'] = True`.
- `'auth_agent'`: Appends `'auth_resolved'` to `state['log']`, sets `state['resolved'] = True`.
- `'general_agent'`: Appends `'general_resolved'` to `state['log']`, sets `state['resolved'] = True`.

Conditional Edge Rules:
1. Start node is `'classifier'`.
2. After `'classifier'`:
   - If `state['intent'] == 'billing'` -> route to `'billing_agent'`.
   - If `state['intent'] == 'auth'` -> route to `'auth_agent'`.
   - If `state['intent'] == 'general'` -> route to `'general_agent'`.
3. After any agent node (`billing_agent`, `auth_agent`, `general_agent`) -> route to `'__end__'`.

Termination & Guard:
- Stop execution when current node is `'__end__'` or when steps executed reaches `max_steps`.
- Return a dictionary:
  `{'final_state': state, 'visited_nodes': visited_nodes, 'status': 'completed' | 'max_steps_exceeded'}`.""",
            "oa_story": """**PayLoop Agent Platform — Autonomous Support Escalation Engine**

During a major UPI network disruption, PayLoop's customer support inbox was flooded with 200,000 queries an hour ranging from urgent refund requests to PIN resets. Monolithic script bots crashed under unpredictable prompt variations.

The AI platform team redesigned the pipeline as a LangGraph cyclic state machine. Nodes encapsulate deterministic task execution while conditional edges dynamically branch based on classified intents. Implement this state graph runner to route queries reliably.""",
            "trigger_keywords": ["state machine workflow engine", "conditional edges", "visited_nodes"],
            "examples": [
                {
                    "input": "initial_state = {'query': 'I need a refund on order 123', 'log': []}, max_steps = 10",
                    "output": "{'final_state': {'query': 'I need a refund on order 123', 'log': ['classified', 'billing_resolved'], 'intent': 'billing', 'resolved': True}, 'visited_nodes': ['classifier', 'billing_agent'], 'status': 'completed'}",
                    "explanation": "Classifier routes to billing_agent which marks resolved and transitions to __end__."
                },
                {
                    "input": "initial_state = {'query': 'Please reset my password', 'log': []}, max_steps = 10",
                    "output": "{'final_state': {'query': 'Please reset my password', 'log': ['classified', 'auth_resolved'], 'intent': 'auth', 'resolved': True}, 'visited_nodes': ['classifier', 'auth_agent'], 'status': 'completed'}",
                    "explanation": "Classifier routes to auth_agent which resolves the authentication intent."
                }
            ],
            "constraints": [
                "1 <= max_steps <= 100",
                "query is a non-empty string",
                "log is initially an empty or populated list",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why must an agentic StateGraph enforce an explicit max_steps execution guard?",
            "options": [
                "To prevent infinite execution loops caused by cyclic agent critique and reflection edges",
                "To reduce the size of the Python bytecode",
                "To force all node functions to run asynchronously",
                "Because Python dictionaries can only hold 10 keys"
            ],
            "answer": 0,
            "explanation": "Agent graphs frequently contain cycles (e.g. generator -> critic -> generator). A max_steps guard prevents infinite loops and uncontrolled API cost blowouts if an agent fails to converge."
        },
        "pattern_quiz": {
            "prompt": "In LangGraph and StateGraph architectures, what is the primary role of a conditional edge?",
            "options": [
                "Dynamically inspect current state values and return the string identifier of the next node to execute",
                "Directly serialize state to disk as a JSON file",
                "Compile Python functions into C extensions",
                "Encrypt customer database queries"
            ],
            "answer": 0,
            "explanation": "Conditional routing edges are pure functions that read the state dictionary and return the destination node ID, decoupling execution logic from workflow topology."
        },
        "function": {
            "name": "run_state_graph",
            "params": [
                {"name": "initial_state", "type": "any"},
                {"name": "max_steps", "type": "any"}
            ],
            "returns": "any"
        },
        "starter_code": """class Solution:
    def run_state_graph(self, initial_state: dict, max_steps: int = 10) -> dict:
        pass
""",
        "tests": [
            {
                "args": [{"query": "I need a refund on order 123", "log": []}, 10],
                "expected": {
                    "final_state": {"query": "I need a refund on order 123", "log": ["classified", "billing_resolved"], "intent": "billing", "resolved": True},
                    "visited_nodes": ["classifier", "billing_agent"],
                    "status": "completed",
                },
                "note": "Refund query routes to billing agent"
            },
            {
                "args": [{"query": "Please reset my password", "log": []}, 10],
                "expected": {
                    "final_state": {"query": "Please reset my password", "log": ["classified", "auth_resolved"], "intent": "auth", "resolved": True},
                    "visited_nodes": ["classifier", "auth_agent"],
                    "status": "completed",
                },
                "note": "Reset query routes to auth agent"
            },
            {
                "args": [{"query": "What is your office address?", "log": []}, 10],
                "expected": {
                    "final_state": {"query": "What is your office address?", "log": ["classified", "general_resolved"], "intent": "general", "resolved": True},
                    "visited_nodes": ["classifier", "general_agent"],
                    "status": "completed",
                },
                "note": "General query routes to general agent"
            },
            {
                "args": [{"query": "refund", "log": []}, 1],
                "expected": {
                    "final_state": {"query": "refund", "log": ["classified"], "intent": "billing"},
                    "visited_nodes": ["classifier"],
                    "status": "max_steps_exceeded",
                },
                "note": "Step limit cuts off execution before billing agent node runs"
            }
        ],
        "visualize_test": 0,
        "drills": [
            {
                "title": "Classify User Intent",
                "skill": "setup",
                "goal": "Extract intent string based on query keyword matching.",
                "instructions": "Return 'billing' if 'refund' in query.lower(), 'auth' if 'reset' in query.lower(), else 'general'.",
                "function": {
                    "name": "classify_intent",
                    "params": [{"name": "query", "type": "any"}]
                },
                "starter_code": """class Solution:
    def classify_intent(self, query: str) -> str:
        pass
""",
                "tests": [
                    {"args": ["Need a refund"], "expected": "billing"},
                    {"args": ["Reset my PIN"], "expected": "auth"},
                    {"args": ["Hello bot"], "expected": "general"}
                ],
                "solution": """class Solution:
    def classify_intent(self, query: str) -> str:
        q = query.lower()
        if "refund" in q:
            return "billing"
        if "reset" in q:
            return "auth"
        return "general"
""",
                "hint": "Check query.lower() for keywords 'refund' and 'reset'."
            },
            {
                "title": "Conditional Edge Routing",
                "skill": "core",
                "goal": "Map intent string to destination node ID.",
                "instructions": "Return 'billing_agent' for 'billing', 'auth_agent' for 'auth', and 'general_agent' for 'general'.",
                "function": {
                    "name": "route_edge",
                    "params": [{"name": "intent", "type": "any"}]
                },
                "starter_code": """class Solution:
    def route_edge(self, intent: str) -> str:
        pass
""",
                "tests": [
                    {"args": ["billing"], "expected": "billing_agent"},
                    {"args": ["auth"], "expected": "auth_agent"},
                    {"args": ["general"], "expected": "general_agent"}
                ],
                "solution": """class Solution:
    def route_edge(self, intent: str) -> str:
        if intent == "billing":
            return "billing_agent"
        if intent == "auth":
            return "auth_agent"
        return "general_agent"
""",
                "hint": "Match intent against agent node names."
            },
            {
                "title": "Check Step Budget",
                "skill": "edge",
                "goal": "Evaluate whether step budget has been exhausted.",
                "instructions": "Return True if steps >= max_steps, otherwise False.",
                "function": {
                    "name": "is_budget_exhausted",
                    "params": [{"name": "steps", "type": "any"}, {"name": "max_steps", "type": "any"}]
                },
                "starter_code": """class Solution:
    def is_budget_exhausted(self, steps: int, max_steps: int) -> bool:
        pass
""",
                "tests": [
                    {"args": [10, 10], "expected": True},
                    {"args": [3, 10], "expected": False}
                ],
                "solution": """class Solution:
    def is_budget_exhausted(self, steps: int, max_steps: int) -> bool:
        return steps >= max_steps
""",
                "hint": "Return steps >= max_steps."
            }
        ],
        "hints": [
            "Initialize state copy and start at node 'classifier'.",
            "In each step, record current_node into visited_nodes and increment step counter.",
            "Inspect state intent to pick next node, or transition to '__end__' after agent execution."
        ],
        "solution": {
            "code": """class Solution:
    def run_state_graph(self, initial_state: dict, max_steps: int = 10) -> dict:
        state = dict(initial_state)
        state["log"] = list(state.get("log", []))
        visited_nodes = []
        current_node = "classifier"
        steps = 0
        
        while current_node != "__end__" and steps < max_steps:
            visited_nodes.append(current_node)
            steps += 1
            
            if current_node == "classifier":
                q = state.get("query", "").lower()
                if "refund" in q:
                    state["intent"] = "billing"
                elif "reset" in q:
                    state["intent"] = "auth"
                else:
                    state["intent"] = "general"
                state["log"].append("classified")
                
                # Conditional edge routing
                if state["intent"] == "billing":
                    current_node = "billing_agent"
                elif state["intent"] == "auth":
                    current_node = "auth_agent"
                else:
                    current_node = "general_agent"
            elif current_node == "billing_agent":
                state["log"].append("billing_resolved")
                state["resolved"] = True
                current_node = "__end__"
            elif current_node == "auth_agent":
                state["log"].append("auth_resolved")
                state["resolved"] = True
                current_node = "__end__"
            elif current_node == "general_agent":
                state["log"].append("general_resolved")
                state["resolved"] = True
                current_node = "__end__"
                
        status = "completed" if current_node == "__end__" else "max_steps_exceeded"
        return {
            "final_state": state,
            "visited_nodes": visited_nodes,
            "status": status,
        }
""",
            "explanation": "The graph executor cleanly separates node state mutation from conditional edge transitions. By checking the step budget at each iteration, it prevents infinite execution loops.",
            "time": "O(S) where S is the number of executed steps (bounded by max_steps)",
            "space": "O(S + N) for state log and visited nodes trail",
        },
        "pitch_script": """**(Clarify)** "We are implementing an agentic StateGraph finite state machine where a shared state dictionary transitions across nodes via conditional routing edges."

**(Basement Insight)** "Without formal state machines, agent code quickly degrades into deeply nested try-catch if-else blocks. Modeling workflows as graphs provides deterministic replay, step budgeting, and explicit state handoffs."

**(Solution)** "We start at the classifier node to categorize query intent. A conditional routing edge inspects this intent and directs execution to the appropriate specialist agent node, which mutates the state and routes to __end__. A max_steps guard stops rogue loops."

**(Complexity)** "Executes in O(S) time and O(S) space bounded by max_steps."
""",
        "twist": {
            "lc": 9632,
            "title": "Autonomous Tool-Calling Loop with ReAct Cycle",
            "why": "Instead of pre-defined graph edges, empower an LLM node to dynamically generate tool calls that feed observation state back into the graph."
        },
        "viz": {
            "title": "StateGraph Multi-Agent Routing Topology"
        }
    }
})

# Lesson 2: agent-tool-calling-loop
LESSONS_4D_4E.append({
    "dir": "36-agents-langgraph",
    "world_id": 36,
    "slug": "agent-tool-calling-loop",
    "lc": 9632,
    "citadel_id": "ai_resume",
    "brick_layer": 5,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Autonomous Tool-Calling Loop with Max-Steps Guard",
    "patterns": ["react-loop", "tool-calling", "safety-guard", "agent-runtime"],
    "visualizer": "system_blueprint",
    "data": {
        "slug": "agent-tool-calling-loop",
        "lc": 9632,
        "citadel_id": "ai_resume",
        "brick_layer": 5,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How do AI agents interact with external APIs, search engines, and calculators autonomously without freezing in infinite loops? The ReAct (Reason + Act) loop executes iterative cycles of Thought -> Tool Call -> Observation -> Answer. A hard max-steps guard is essential in production to halt runaway loops when the model repeats queries.",
            "brute_force": "Unconstrained while True loops that call external APIs continuously until token budgets or cloud billing thresholds collapse.",
            "brute_force_complexity": "Unbounded O(infinity) API invocations during reasoning failures.",
            "key_insight": "Instrumenting each iteration step with an execution trace and bounding execution with a max-steps guard ensures deterministic termination and full observability.",
            "real_world": "OpenAI Function Calling loops, LangChain ReAct agents, and Anthropic Tool Use SDK.",
        },
        "statement": {
            "clean": """Implement an agentic tool-calling loop with a max-steps guard:
`execute_tool_loop(self, user_query: str, mock_llm_steps: list[dict], max_steps: int = 5) -> dict`.

Inputs:
- `user_query`: initial user prompt string
- `mock_llm_steps`: list of decision dicts emitted by the model at each reasoning step:
  - Tool Call: `{'type': 'tool', 'tool_name': 'calculator' | 'search', 'tool_arg': '...'}`
  - Final Answer: `{'type': 'finish', 'answer': '...'}`
- `max_steps`: maximum allowable execution steps (`max_steps >= 1`)

Built-in Tool Handlers:
- `'calculator'`: If `tool_arg == '12 * 8'` returns `'96'`. If `tool_arg == '100 - 45'` returns `'55'`. Otherwise returns string length `str(len(tool_arg))`.
- `'search'`: If `'order_status'` in `tool_arg`, returns `'Shipped: arriving tomorrow'`. If `'inventory'` in `tool_arg`, returns `'In Stock (14 units)'`. Otherwise returns `'No results found'`.

Execution Logic:
1. Maintain `trace`: list of step logs: `{'step': step_idx, 'action': action_dict, 'observation': obs_str}`.
2. Iterate through `mock_llm_steps` up to `max_steps`:
   - If `action['type'] == 'finish'`: record step with `observation: None`, set `status = 'completed'`, and return immediately.
   - If `action['type'] == 'tool'`: dispatch tool to get `observation`, append to `trace`, and proceed.
3. If loop finishes without reaching a `'finish'` action or hits `max_steps`:
   set `status = 'max_steps_exceeded'` and `final_answer = None`.

Return dict:
`{'status': status, 'final_answer': final_answer, 'steps_executed': step_idx, 'trace': trace}`.""",
            "oa_story": """**Drizz Mobile AI — Autonomous App Interaction Loop**

Drizz's mobile testing agent translates natural language user stories into UI actions (tap, type, swipe) by inspecting device XML hierarchies. During automated regression runs on e-commerce apps, ambiguous search bars caused the agent to repeatedly trigger inventory queries without reaching the checkout assertion.

The platform architect mandated that all agent tool runners enforce a deterministic tool-calling loop with a max-steps guard and structured execution telemetry. Implement this loop engine.""",
            "trigger_keywords": ["tool-calling loop with a max-steps guard", "mock_llm_steps", "steps_executed"],
            "examples": [
                {
                    "input": "user_query = 'What is 12 * 8?', mock_llm_steps = [{'type': 'tool', 'tool_name': 'calculator', 'tool_arg': '12 * 8'}, {'type': 'finish', 'answer': 'The answer is 96.'}], max_steps = 5",
                    "output": "{'status': 'completed', 'final_answer': 'The answer is 96.', 'steps_executed': 2, 'trace': [{'step': 1, 'action': {'type': 'tool', 'tool_name': 'calculator', 'tool_arg': '12 * 8'}, 'observation': '96'}, {'step': 2, 'action': {'type': 'finish', 'answer': 'The answer is 96.'}, 'observation': None}]}",
                    "explanation": "Calculates 12 * 8 on step 1 and finishes on step 2 with status completed."
                }
            ],
            "constraints": [
                "1 <= max_steps <= 20",
                "0 <= len(mock_llm_steps) <= 50",
            ],
        },
        "constraint_quiz": {
            "prompt": "What primary vulnerability does a max-steps guard mitigate in LLM tool execution loops?",
            "options": [
                "Runaway recursion and infinite API cost consumption when the model hallucinates repeating tool calls",
                "Python syntax errors in user prompts",
                "Operating system thread deadlocks",
                "Buffer overflows in the database driver"
            ],
            "answer": 0,
            "explanation": "If a tool's observation does not satisfy the model, the model may repeatedly emit identical tool calls. The max_steps guard forcibly terminates execution before costs escalate."
        },
        "pattern_quiz": {
            "prompt": "What are the core stages of the ReAct agent design pattern?",
            "options": [
                "Thought (reasoning), Action (tool call), and Observation (environment feedback)",
                "Compile, Link, and Execute",
                "Map, Shuffle, and Reduce",
                "Prepare, Commit, and Rollback"
            ],
            "answer": 0,
            "explanation": "ReAct stands for Reason + Act, alternating internal chain-of-thought generation with external environment observations."
        },
        "function": {
            "name": "execute_tool_loop",
            "params": [
                {"name": "user_query", "type": "any"},
                {"name": "mock_llm_steps", "type": "any"},
                {"name": "max_steps", "type": "any"}
            ],
            "returns": "any"
        },
        "starter_code": """class Solution:
    def execute_tool_loop(self, user_query: str, mock_llm_steps: list[dict], max_steps: int = 5) -> dict:
        pass
""",
        "tests": [
            {
                "args": [
                    "What is 12 * 8?",
                    [
                        {"type": "tool", "tool_name": "calculator", "tool_arg": "12 * 8"},
                        {"type": "finish", "answer": "The answer is 96."}
                    ],
                    5
                ],
                "expected": {
                    "status": "completed",
                    "final_answer": "The answer is 96.",
                    "steps_executed": 2,
                    "trace": [
                        {"step": 1, "action": {"type": "tool", "tool_name": "calculator", "tool_arg": "12 * 8"}, "observation": "96"},
                        {"step": 2, "action": {"type": "finish", "answer": "The answer is 96."}, "observation": None}
                    ]
                },
                "note": "Tool execution followed by final answer"
            },
            {
                "args": [
                    "Hi",
                    [{"type": "finish", "answer": "Hello!"}],
                    5
                ],
                "expected": {
                    "status": "completed",
                    "final_answer": "Hello!",
                    "steps_executed": 1,
                    "trace": [
                        {"step": 1, "action": {"type": "finish", "answer": "Hello!"}, "observation": None}
                    ]
                },
                "note": "Direct finish without tools"
            },
            {
                "args": [
                    "Check stock",
                    [{"type": "tool", "tool_name": "search", "tool_arg": "inventory"}],
                    1
                ],
                "expected": {
                    "status": "max_steps_exceeded",
                    "final_answer": None,
                    "steps_executed": 1,
                    "trace": [
                        {"step": 1, "action": {"type": "tool", "tool_name": "search", "tool_arg": "inventory"}, "observation": "In Stock (14 units)"}
                    ]
                },
                "note": "Max steps halts execution when answer not provided"
            }
        ],
        "visualize_test": 0,
        "drills": [
            {
                "title": "Dispatch Tool Call",
                "skill": "setup",
                "goal": "Execute calculator or search tool logic.",
                "instructions": "Return '96' for calculator '12 * 8', 'In Stock (14 units)' for search 'inventory', else 'No results found'.",
                "function": {
                    "name": "dispatch_tool",
                    "params": [{"name": "name", "type": "any"}, {"name": "arg", "type": "any"}]
                },
                "starter_code": """class Solution:
    def dispatch_tool(self, name: str, arg: str) -> str:
        pass
""",
                "tests": [
                    {"args": ["calculator", "12 * 8"], "expected": "96"},
                    {"args": ["search", "inventory"], "expected": "In Stock (14 units)"},
                    {"args": ["search", "unknown"], "expected": "No results found"}
                ],
                "solution": """class Solution:
    def dispatch_tool(self, name: str, arg: str) -> str:
        if name == "calculator" and arg == "12 * 8":
            return "96"
        if name == "search" and "inventory" in arg:
            return "In Stock (14 units)"
        return "No results found"
""",
                "hint": "Check tool name and argument strings."
            },
            {
                "title": "Record Trace Step",
                "skill": "core",
                "goal": "Build step dictionary for execution telemetry.",
                "instructions": "Return dict with keys 'step', 'action', 'observation'.",
                "function": {
                    "name": "make_trace_record",
                    "params": [{"name": "step", "type": "any"}, {"name": "action", "type": "any"}, {"name": "obs", "type": "any"}]
                },
                "starter_code": """class Solution:
    def make_trace_record(self, step: int, action: dict, obs: str) -> dict:
        pass
""",
                "tests": [
                    {"args": [1, {"type": "tool"}, "96"], "expected": {"step": 1, "action": {"type": "tool"}, "observation": "96"}}
                ],
                "solution": """class Solution:
    def make_trace_record(self, step: int, action: dict, obs: str) -> dict:
        return {"step": step, "action": action, "observation": obs}
""",
                "hint": "Construct a dict with step, action, and observation."
            },
            {
                "title": "Evaluate Finish Action",
                "skill": "edge",
                "goal": "Determine if current model decision concludes execution.",
                "instructions": "Return True if action.get('type') == 'finish' else False.",
                "function": {
                    "name": "is_finish",
                    "params": [{"name": "action", "type": "any"}]
                },
                "starter_code": """class Solution:
    def is_finish(self, action: dict) -> bool:
        pass
""",
                "tests": [
                    {"args": [{"type": "finish"}], "expected": True},
                    {"args": [{"type": "tool"}], "expected": False}
                ],
                "solution": """class Solution:
    def is_finish(self, action: dict) -> bool:
        return action.get("type") == "finish"
""",
                "hint": "Check action['type'] == 'finish'."
            }
        ],
        "hints": [
            "Loop over mock_llm_steps while tracking step_idx < max_steps.",
            "If action['type'] == 'finish', record observation None, set status completed, and break.",
            "If action['type'] == 'tool', invoke the corresponding tool to retrieve observation."
        ],
        "solution": {
            "code": """class Solution:
    def execute_tool_loop(self, user_query: str, mock_llm_steps: list[dict], max_steps: int = 5) -> dict:
        trace = []
        step_idx = 0
        final_answer = None
        status = "max_steps_exceeded"
        
        for action in mock_llm_steps:
            if step_idx >= max_steps:
                break
            step_idx += 1
            act_type = action.get("type")
            
            if act_type == "finish":
                final_answer = action.get("answer")
                trace.append({
                    "step": step_idx,
                    "action": action,
                    "observation": None,
                })
                status = "completed"
                break
            elif act_type == "tool":
                tool_name = action.get("tool_name")
                tool_arg = action.get("tool_arg", "")
                obs = "No results found"
                if tool_name == "calculator":
                    if tool_arg == "12 * 8":
                        obs = "96"
                    elif tool_arg == "100 - 45":
                        obs = "55"
                    else:
                        obs = str(len(tool_arg))
                elif tool_name == "search":
                    if "order_status" in tool_arg:
                        obs = "Shipped: arriving tomorrow"
                    elif "inventory" in tool_arg:
                        obs = "In Stock (14 units)"
                    else:
                        obs = "No results found"
                trace.append({
                    "step": step_idx,
                    "action": action,
                    "observation": obs,
                })
        return {
            "status": status,
            "final_answer": final_answer,
            "steps_executed": step_idx,
            "trace": trace,
        }
""",
            "explanation": "Iterates through model decisions, dispatching tools and collecting observations into an audit trace until a finish action is encountered or max_steps is reached.",
            "time": "O(K) where K is the number of executed steps (bounded by max_steps)",
            "space": "O(K) for storing trace history",
        },
        "pitch_script": """**(Clarify)** "We are implementing a ReAct agent execution loop that parses model decisions, dispatches tools, and terminates either on final answer or upon exceeding max_steps."

**(Basement Insight)** "Without strict iteration caps, reasoning failures or contradictory tool outputs trap agents in infinite loops. A max-steps guard guarantees predictable cloud costs and deterministic timeout behavior."

**(Solution)** "We process each decision step sequentially. If the model emits a tool call, we run the tool and log the observation. When a finish action is emitted, we record the final answer and halt immediately. If the budget expires first, we flag max_steps_exceeded."

**(Complexity)** "Executes in O(K) time and O(K) space bounded by max_steps."
""",
        "twist": {
            "lc": 9633,
            "title": "Multi-Provider LLM Gateway with Fallback Routing",
            "why": "When tool execution encounters rate limits or upstream provider outages, dynamically route queries to a fallback provider."
        },
        "viz": {
            "title": "Autonomous ReAct Tool-Calling Sequence"
        }
    }
})

# Lesson 3: llm-provider-fallback-router
LESSONS_4D_4E.append({
    "dir": "36-agents-langgraph",
    "world_id": 36,
    "slug": "llm-provider-fallback-router",
    "lc": 9633,
    "citadel_id": "ai_resume",
    "brick_layer": 5,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Multi-Provider Gateway with Exponential Retry and Fallback Routing",
    "patterns": ["fallback-routing", "retry-backoff", "multi-provider", "gateway-resilience"],
    "visualizer": "system_blueprint",
    "data": {
        "slug": "llm-provider-fallback-router",
        "lc": 9633,
        "citadel_id": "ai_resume",
        "brick_layer": 5,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How do production AI applications maintain 99.99% uptime when upstream LLM APIs suffer rate limits (429), capacity overload (503), or network timeouts? A resilient gateway attempts the primary provider with retries, and upon repeated failure, automatically falls back to an alternate provider (e.g., Anthropic -> Gemini or OpenAI -> Local Llama).",
            "brute_force": "Failing user requests immediately upon receiving a single 429 or 503 response from the primary vendor.",
            "brute_force_complexity": "High error rates during upstream provider brownouts.",
            "key_insight": "Layering retry attempts on the primary provider with an automatic secondary fallback trigger isolates applications from single-vendor outages.",
            "real_world": "Portkey AI Gateway, LiteLLM proxy, and enterprise LangChain multi-provider routers.",
        },
        "statement": {
            "clean": """Implement a multi-provider gateway with retry and fallback routing:
`route_request(self, prompt: str, primary_provider: str, secondary_provider: str, mock_responses: dict, max_retries: int = 2) -> dict`.

Inputs:
- `prompt`: request string
- `primary_provider`: name of primary LLM vendor (e.g. `'anthropic'`)
- `secondary_provider`: name of fallback LLM vendor (e.g. `'gemini'`)
- `mock_responses`: dict mapping provider name to a list of sequential response dicts:
  `{'status_code': int, 'text': str | None, 'error': str | None}`
- `max_retries`: maximum retry attempts on primary provider (`max_retries >= 0`). Total attempts allowed on primary is `1 + max_retries`.

Routing Rules:
1. Attempt `primary_provider` up to `1 + max_retries` times.
2. If primary returns `status_code == 200`:
   return immediately:
   `{'status': 'success', 'provider_used': primary_provider, 'attempts': total_attempts, 'response': text, 'fallback_triggered': False}`.
3. If primary fails across all attempts (all non-200 status codes):
   trigger fallback to `secondary_provider`.
4. Attempt `secondary_provider` (1 attempt).
   - If secondary succeeds (`status_code == 200`):
     return:
     `{'status': 'success', 'provider_used': secondary_provider, 'attempts': total_attempts, 'response': text, 'fallback_triggered': True}`.
   - If secondary also fails (non-200):
     return:
     `{'status': 'failed', 'provider_used': None, 'attempts': total_attempts, 'response': None, 'fallback_triggered': True}`.""",
            "oa_story": """**KiranaKart AI Catalog — High-Availability LLM Ingestion Gateway**

During grocery inventory onboarding, KiranaKart's catalog enrichment pipeline sent 500,000 product descriptions to Anthropic Claude for attribute extraction. Periodic 429 rate limits caused batch jobs to fail, halting supplier listings.

The infra team implemented an automated gateway: transient 429s trigger retries on the primary model, while persistent 503 outages seamlessly fall back to Google Gemini. Implement this gateway routing logic.""",
            "trigger_keywords": ["multi-provider gateway with retry and fallback routing", "mock_responses", "fallback_triggered"],
            "examples": [
                {
                    "input": "prompt = 'Translate hello', primary = 'anthropic', secondary = 'gemini', mock_responses = {'anthropic': [{'status_code': 200, 'text': 'Bonjour'}]}, max_retries = 2",
                    "output": "{'status': 'success', 'provider_used': 'anthropic', 'attempts': 1, 'response': 'Bonjour', 'fallback_triggered': False}",
                    "explanation": "Primary succeeds on attempt 1 with zero retries."
                },
                {
                    "input": "prompt = 'Analyze text', primary = 'anthropic', secondary = 'gemini', mock_responses = {'anthropic': [{'status_code': 503}, {'status_code': 503}, {'status_code': 503}], 'gemini': [{'status_code': 200, 'text': 'Summary'}]}, max_retries = 2",
                    "output": "{'status': 'success', 'provider_used': 'gemini', 'attempts': 4, 'response': 'Summary', 'fallback_triggered': True}",
                    "explanation": "Primary fails 3 times (1 initial + 2 retries), triggering fallback to Gemini which succeeds."
                }
            ],
            "constraints": [
                "0 <= max_retries <= 5",
                "mock_responses contains list of dicts with status_code",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why should an LLM gateway fail over to a secondary provider only after exhausting primary retries?",
            "options": [
                "To preserve quality consistency and negotiated prompt optimizations on the primary model before accepting potential behavioral discrepancies on a secondary model",
                "Because secondary models are always free of charge",
                "To avoid running Python garbage collection",
                "Because DNS resolution takes 5 minutes per provider"
            ],
            "answer": 0,
            "explanation": "Different LLMs exhibit subtle prompt sensitivities and output formats. Retrying the primary model first preserves consistency; falling back is reserved for actual vendor outages."
        },
        "pattern_quiz": {
            "prompt": "Which resilience pattern describes switching to an alternative provider when the primary provider encounters repeated errors?",
            "options": [
                "Fallback / Hedged Request pattern",
                "Singleton pattern",
                "Flyweight pattern",
                "Two-Phase Commit pattern"
            ],
            "answer": 0,
            "explanation": "The Fallback pattern gracefully degrades or reroutes failed upstream operations to a standby provider."
        },
        "function": {
            "name": "route_request",
            "params": [
                {"name": "prompt", "type": "any"},
                {"name": "primary_provider", "type": "any"},
                {"name": "secondary_provider", "type": "any"},
                {"name": "mock_responses", "type": "any"},
                {"name": "max_retries", "type": "any"}
            ],
            "returns": "any"
        },
        "starter_code": """class Solution:
    def route_request(self, prompt: str, primary_provider: str, secondary_provider: str, mock_responses: dict, max_retries: int = 2) -> dict:
        pass
""",
        "tests": [
            {
                "args": [
                    "Translate hello",
                    "anthropic",
                    "gemini",
                    {"anthropic": [{"status_code": 200, "text": "Bonjour"}]},
                    2
                ],
                "expected": {
                    "status": "success",
                    "provider_used": "anthropic",
                    "attempts": 1,
                    "response": "Bonjour",
                    "fallback_triggered": False,
                },
                "note": "Primary succeeds on first attempt"
            },
            {
                "args": [
                    "Summarize report",
                    "anthropic",
                    "gemini",
                    {"anthropic": [{"status_code": 429}, {"status_code": 200, "text": "Summary"}]},
                    2
                ],
                "expected": {
                    "status": "success",
                    "provider_used": "anthropic",
                    "attempts": 2,
                    "response": "Summary",
                    "fallback_triggered": False,
                },
                "note": "Primary retries after 429 and succeeds"
            },
            {
                "args": [
                    "Code review",
                    "anthropic",
                    "gemini",
                    {
                        "anthropic": [{"status_code": 503}, {"status_code": 503}, {"status_code": 503}],
                        "gemini": [{"status_code": 200, "text": "Looks good"}]
                    },
                    2
                ],
                "expected": {
                    "status": "success",
                    "provider_used": "gemini",
                    "attempts": 4,
                    "response": "Looks good",
                    "fallback_triggered": True,
                },
                "note": "Primary exhausted after 3 attempts, secondary succeeds"
            },
            {
                "args": [
                    "Draft email",
                    "anthropic",
                    "gemini",
                    {"anthropic": [{"status_code": 500}, {"status_code": 500}], "gemini": [{"status_code": 500}]},
                    1
                ],
                "expected": {
                    "status": "failed",
                    "provider_used": None,
                    "attempts": 3,
                    "response": None,
                    "fallback_triggered": True,
                },
                "note": "Both primary and secondary fail"
            }
        ],
        "visualize_test": 0,
        "drills": [
            {
                "title": "Evaluate HTTP Status",
                "skill": "setup",
                "goal": "Check if upstream response is successful.",
                "instructions": "Return True if resp.get('status_code') == 200 else False.",
                "function": {
                    "name": "is_success",
                    "params": [{"name": "resp", "type": "any"}]
                },
                "starter_code": """class Solution:
    def is_success(self, resp: dict) -> bool:
        pass
""",
                "tests": [
                    {"args": [{"status_code": 200}], "expected": True},
                    {"args": [{"status_code": 429}], "expected": False}
                ],
                "solution": """class Solution:
    def is_success(self, resp: dict) -> bool:
        return resp.get("status_code") == 200
""",
                "hint": "Check if status_code equals 200."
            },
            {
                "title": "Calculate Maximum Primary Attempts",
                "skill": "core",
                "goal": "Compute total primary attempt budget.",
                "instructions": "Return 1 + max_retries.",
                "function": {
                    "name": "calc_attempts",
                    "params": [{"name": "max_retries", "type": "any"}]
                },
                "starter_code": """class Solution:
    def calc_attempts(self, max_retries: int) -> int:
        pass
""",
                "tests": [
                    {"args": [2], "expected": 3},
                    {"args": [0], "expected": 1}
                ],
                "solution": """class Solution:
    def calc_attempts(self, max_retries: int) -> int:
        return 1 + max_retries
""",
                "hint": "Return 1 + max_retries."
            },
            {
                "title": "Construct Gateway Response",
                "skill": "edge",
                "goal": "Format standardized gateway response dictionary.",
                "instructions": "Return dict with status, provider_used, attempts, response, fallback_triggered.",
                "function": {
                    "name": "build_gateway_result",
                    "params": [
                        {"name": "status", "type": "any"},
                        {"name": "provider", "type": "any"},
                        {"name": "attempts", "type": "any"},
                        {"name": "text", "type": "any"},
                        {"name": "fallback", "type": "any"}
                    ]
                },
                "starter_code": """class Solution:
    def build_gateway_result(self, status: str, provider: str, attempts: int, text: str, fallback: bool) -> dict:
        pass
""",
                "tests": [
                    {"args": ["success", "openai", 1, "hi", False], "expected": {"status": "success", "provider_used": "openai", "attempts": 1, "response": "hi", "fallback_triggered": False}}
                ],
                "solution": """class Solution:
    def build_gateway_result(self, status: str, provider: str, attempts: int, text: str, fallback: bool) -> dict:
        return {
            "status": status,
            "provider_used": provider,
            "attempts": attempts,
            "response": text,
            "fallback_triggered": fallback,
        }
""",
                "hint": "Assemble the 5 gateway response keys."
            }
        ],
        "hints": [
            "Calculate max primary attempts as 1 + max_retries.",
            "Iterate through primary responses; return immediately if status_code == 200.",
            "If all primary attempts fail, attempt secondary once and format fallback_triggered = True."
        ],
        "solution": {
            "code": """class Solution:
    def route_request(self, prompt: str, primary_provider: str, secondary_provider: str, mock_responses: dict, max_retries: int = 2) -> dict:
        total_attempts = 0
        primary_list = mock_responses.get(primary_provider, [])
        secondary_list = mock_responses.get(secondary_provider, [])
        
        # Primary attempts (1 initial + up to max_retries)
        max_primary = 1 + max_retries
        for i in range(max_primary):
            total_attempts += 1
            resp = primary_list[i] if i < len(primary_list) else {"status_code": 500, "error": "No response"}
            if resp.get("status_code") == 200:
                return {
                    "status": "success",
                    "provider_used": primary_provider,
                    "attempts": total_attempts,
                    "response": resp.get("text"),
                    "fallback_triggered": False,
                }
        
        # Fallback to secondary
        total_attempts += 1
        sec_resp = secondary_list[0] if len(secondary_list) > 0 else {"status_code": 500, "error": "No response"}
        if sec_resp.get("status_code") == 200:
            return {
                "status": "success",
                "provider_used": secondary_provider,
                "attempts": total_attempts,
                "response": sec_resp.get("text"),
                "fallback_triggered": True,
            }
        
        return {
            "status": "failed",
            "provider_used": None,
            "attempts": total_attempts,
            "response": None,
            "fallback_triggered": True,
        }
""",
            "explanation": "Executes bounded retries on the primary vendor before falling back to the backup provider, returning a normalized response payload.",
            "time": "O(R) where R is max_retries (typically <= 5 attempts)",
            "space": "O(1) constant memory for tracking attempt counters",
        },
        "pitch_script": """**(Clarify)** "We need to design a multi-provider gateway routing engine that retries the primary LLM vendor upon failure and falls back to a secondary provider if retries are exhausted."

**(Basement Insight)** "Relying on a single AI provider invites downtime whenever rate limits or capacity constraints trigger 429 or 503 errors. A multi-vendor routing gateway provides immediate failover protection."

**(Solution)** "We attempt the primary model up to 1 + max_retries times. If any call succeeds with 200 OK, we return. If all primary attempts fail, we immediately dispatch the request to the secondary provider."

**(Complexity)** "Executes in O(R) time bounded by retries, using O(1) space."
""",
        "twist": {
            "lc": 9602,
            "title": "Reciprocal Rank Fusion Hybrid Search",
            "why": "Once the LLM gateway succeeds, fuse sparse and dense search outputs to supply accurate context for retrieval-augmented generation."
        },
        "viz": {
            "title": "Resilient Multi-Provider LLM Gateway Architecture"
        }
    }
})

# ------------------------------------------------------------------------------
# W35: Vector DBs & RAG (add 2 lessons)
# ------------------------------------------------------------------------------

# Lesson 4: rag-text-chunker-with-overlap
LESSONS_4D_4E.append({
    "dir": "35-vector-dbs-rag",
    "world_id": 35,
    "slug": "rag-text-chunker-with-overlap",
    "lc": 9606,
    "citadel_id": "ai_resume",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Easy",
    "title": "Sliding Window Document Text Chunker with Token Overlap and Metadata",
    "patterns": ["sliding-window", "chunking", "rag-ingestion", "metadata-enrichment"],
    "visualizer": "system_blueprint",
    "data": {
        "slug": "rag-text-chunker-with-overlap",
        "lc": 9606,
        "citadel_id": "ai_resume",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "Why do naive sentence splits ruin RAG retrieval quality? If an embedding model has an 8192-token context limit, splitting documents into fixed non-overlapping chunks frequently severs sentences in half, stranding subjects from verbs across chunk boundaries. Sliding window chunking with character or token overlap guarantees semantic continuity.",
            "brute_force": "Arbitrary non-overlapping string slicing that cuts critical definitions in half, producing orphaned phrases with degraded embedding fidelity.",
            "brute_force_complexity": "Loss of semantic context at boundary cut points.",
            "key_insight": "Advancing chunk start positions by (chunk_size - chunk_overlap) ensures that facts located near boundaries appear completely in at least one retrieved chunk.",
            "real_world": "LangChain CharacterTextSplitter, LlamaIndex TokenChunker, and WisdomBot aerospace document ingestion pipeline.",
        },
        "statement": {
            "clean": """Implement a deterministic text chunker with sliding window overlap and metadata:
`chunk_document(self, doc_id: str, text: str, chunk_size: int, chunk_overlap: int) -> list[dict]`.

Given:
- `doc_id`: unique document identifier string
- `text`: document text string
- `chunk_size`: maximum characters per chunk (`chunk_size >= 1`)
- `chunk_overlap`: character overlap between consecutive chunks (`0 <= chunk_overlap < chunk_size`)

Chunking Rules:
1. If `text` is empty, return `[]`.
2. If `chunk_size <= 0` or `chunk_overlap < 0` or `chunk_overlap >= chunk_size`, return `[]`.
3. The step advance between consecutive chunk start positions is `step = chunk_size - chunk_overlap`.
4. Iterate `start` from `0` with increment `step`:
   - `end = min(start + chunk_size, len(text))`
   - `chunk_str = text[start:end]`
   - `chunk_id = f'{doc_id}_c{chunk_index}'` (0-indexed `chunk_index`)
   - Metadata payload:
     `{'chunk_id': chunk_id, 'doc_id': doc_id, 'chunk_index': chunk_index, 'start_char': start, 'end_char': end, 'char_count': len(chunk_str), 'text': chunk_str}`
   - If `end >= len(text)`, stop iteration.
5. Return list of chunk metadata dictionaries.""",
            "oa_story": """**WisdomBot Knowledge Base — Technical Manual Ingestion Pipeline**

WisdomBot's enterprise RAG pipeline ingests 500-page aircraft maintenance manuals. Early pilots suffered retrieval failures when technician prompts searched for valve torque specs: the specification number was on line 50 and the torque value on line 51, split squarely across non-overlapping chunk boundaries.

The search engineering team added sliding window chunking with an overlap buffer and coordinate metadata (`start_char`, `end_char`). Implement this deterministic text chunker.""",
            "trigger_keywords": ["deterministic text chunker with sliding window overlap", "chunk_document", "chunk_id"],
            "examples": [
                {
                    "input": "doc_id = 'doc_001', text = 'abcdefghijklmnopqrstuvwxyz', chunk_size = 10, chunk_overlap = 3",
                    "output": "[{'chunk_id': 'doc_001_c0', 'doc_id': 'doc_001', 'chunk_index': 0, 'start_char': 0, 'end_char': 10, 'char_count': 10, 'text': 'abcdefghij'}, {'chunk_id': 'doc_001_c1', 'doc_id': 'doc_001', 'chunk_index': 1, 'start_char': 7, 'end_char': 17, 'char_count': 10, 'text': 'hijklmnopq'}, {'chunk_id': 'doc_001_c2', 'doc_id': 'doc_001', 'chunk_index': 2, 'start_char': 14, 'end_char': 24, 'char_count': 10, 'text': 'opqrstuvwx'}, {'chunk_id': 'doc_001_c3', 'doc_id': 'doc_001', 'chunk_index': 3, 'start_char': 21, 'end_char': 26, 'char_count': 5, 'text': 'vwxyz'}]",
                    "explanation": "Chunks advance with step 10 - 3 = 7 characters until end of string."
                }
            ],
            "constraints": [
                "0 <= len(text) <= 10^5",
                "1 <= chunk_size <= 2000",
                "0 <= chunk_overlap < chunk_size",
            ],
        },
        "constraint_quiz": {
            "prompt": "What happens if chunk_overlap is equal to or greater than chunk_size?",
            "options": [
                "The step size becomes zero or negative, creating an infinite loop that produces infinite identical chunks",
                "The text is automatically translated to Spanish",
                "The embedding model doubles its vector dimensions",
                "The database automatically creates a B-Tree index"
            ],
            "answer": 0,
            "explanation": "Because step = chunk_size - chunk_overlap, if overlap >= size, step <= 0, causing the sliding window pointer to stall or move backwards forever."
        },
        "pattern_quiz": {
            "prompt": "Why do production RAG pipelines inject start_char and end_char coordinate metadata into every chunk?",
            "options": [
                "To enable accurate UI passage highlighting and exact quote verification in the source document viewer",
                "To compress the text using Huffman encoding",
                "To convert ASCII strings to Unicode UTF-32",
                "To sort the chunks alphabetically"
            ],
            "answer": 0,
            "explanation": "Recording exact character offsets allows frontend interfaces (like PDF viewers) to highlight the exact grounding passage supporting an LLM answer."
        },
        "function": {
            "name": "chunk_document",
            "params": [
                {"name": "doc_id", "type": "any"},
                {"name": "text", "type": "any"},
                {"name": "chunk_size", "type": "any"},
                {"name": "chunk_overlap", "type": "any"}
            ],
            "returns": "any"
        },
        "starter_code": """class Solution:
    def chunk_document(self, doc_id: str, text: str, chunk_size: int, chunk_overlap: int) -> list[dict]:
        pass
""",
        "tests": [
            {
                "args": ["doc_001", "abcdefghijklmnopqrstuvwxyz", 10, 3],
                "expected": [
                    {"chunk_id": "doc_001_c0", "doc_id": "doc_001", "chunk_index": 0, "start_char": 0, "end_char": 10, "char_count": 10, "text": "abcdefghij"},
                    {"chunk_id": "doc_001_c1", "doc_id": "doc_001", "chunk_index": 1, "start_char": 7, "end_char": 17, "char_count": 10, "text": "hijklmnopq"},
                    {"chunk_id": "doc_001_c2", "doc_id": "doc_001", "chunk_index": 2, "start_char": 14, "end_char": 24, "char_count": 10, "text": "opqrstuvwx"},
                    {"chunk_id": "doc_001_c3", "doc_id": "doc_001", "chunk_index": 3, "start_char": 21, "end_char": 26, "char_count": 5, "text": "vwxyz"},
                ],
                "note": "Standard alphabet split with 3 character overlap"
            },
            {
                "args": ["doc_002", "hello world", 20, 5],
                "expected": [
                    {"chunk_id": "doc_002_c0", "doc_id": "doc_002", "chunk_index": 0, "start_char": 0, "end_char": 11, "char_count": 11, "text": "hello world"},
                ],
                "note": "Text shorter than chunk_size yields single chunk"
            },
            {
                "args": ["doc_003", "", 10, 2],
                "expected": [],
                "note": "Empty text returns empty list"
            }
        ],
        "visualize_test": 0,
        "drills": [
            {
                "title": "Compute Advance Step",
                "skill": "setup",
                "goal": "Calculate sliding step increment.",
                "instructions": "Return size - overlap.",
                "function": {
                    "name": "calc_step",
                    "params": [{"name": "size", "type": "any"}, {"name": "overlap", "type": "any"}]
                },
                "starter_code": """class Solution:
    def calc_step(self, size: int, overlap: int) -> int:
        pass
""",
                "tests": [
                    {"args": [10, 3], "expected": 7},
                    {"args": [20, 5], "expected": 15}
                ],
                "solution": """class Solution:
    def calc_step(self, size: int, overlap: int) -> int:
        return size - overlap
""",
                "hint": "Return size - overlap."
            },
            {
                "title": "Slice Substring",
                "skill": "core",
                "goal": "Extract bounded character slice.",
                "instructions": "Return text[start:min(start + size, len(text))].",
                "function": {
                    "name": "slice_text",
                    "params": [{"name": "text", "type": "any"}, {"name": "start", "type": "any"}, {"name": "size", "type": "any"}]
                },
                "starter_code": """class Solution:
    def slice_text(self, text: str, start: int, size: int) -> str:
        pass
""",
                "tests": [
                    {"args": ["abcdef", 0, 4], "expected": "abcd"},
                    {"args": ["abcdef", 4, 4], "expected": "ef"}
                ],
                "solution": """class Solution:
    def slice_text(self, text: str, start: int, size: int) -> str:
        return text[start:min(start + size, len(text))]
""",
                "hint": "Slice from start to min(start + size, len(text))."
            },
            {
                "title": "Format Chunk Metadata",
                "skill": "edge",
                "goal": "Assemble dictionary representation of chunk.",
                "instructions": "Return dict with chunk_id, doc_id, chunk_index, start_char, end_char, char_count, text.",
                "function": {
                    "name": "make_chunk_dict",
                    "params": [
                        {"name": "doc_id", "type": "any"},
                        {"name": "idx", "type": "any"},
                        {"name": "start", "type": "any"},
                        {"name": "end", "type": "any"},
                        {"name": "chunk_str", "type": "any"}
                    ]
                },
                "starter_code": """class Solution:
    def make_chunk_dict(self, doc_id: str, idx: int, start: int, end: int, chunk_str: str) -> dict:
        pass
""",
                "tests": [
                    {"args": ["d1", 0, 0, 5, "hello"], "expected": {"chunk_id": "d1_c0", "doc_id": "d1", "chunk_index": 0, "start_char": 0, "end_char": 5, "char_count": 5, "text": "hello"}}
                ],
                "solution": """class Solution:
    def make_chunk_dict(self, doc_id: str, idx: int, start: int, end: int, chunk_str: str) -> dict:
        return {
            "chunk_id": f"{doc_id}_c{idx}",
            "doc_id": doc_id,
            "chunk_index": idx,
            "start_char": start,
            "end_char": end,
            "char_count": len(chunk_str),
            "text": chunk_str,
        }
""",
                "hint": "Build the metadata dict."
            }
        ],
        "hints": [
            "Check validation boundaries: if overlap >= chunk_size or text is empty, return [].",
            "Use step = chunk_size - chunk_overlap to advance the pointer.",
            "Slice text[start:min(start + chunk_size, len(text))] and break when end reaches len(text)."
        ],
        "solution": {
            "code": """class Solution:
    def chunk_document(self, doc_id: str, text: str, chunk_size: int, chunk_overlap: int) -> list[dict]:
        if not text:
            return []
        if chunk_size <= 0 or chunk_overlap < 0 or chunk_overlap >= chunk_size:
            return []
            
        step = chunk_size - chunk_overlap
        chunks = []
        chunk_idx = 0
        start = 0
        n = len(text)
        
        while start < n:
            end = min(start + chunk_size, n)
            chunk_str = text[start:end]
            chunks.append({
                "chunk_id": f"{doc_id}_c{chunk_idx}",
                "doc_id": doc_id,
                "chunk_index": chunk_idx,
                "start_char": start,
                "end_char": end,
                "char_count": len(chunk_str),
                "text": chunk_str,
            })
            if end >= n:
                break
            start += step
            chunk_idx += 1
            
        return chunks
""",
            "explanation": "Advances start by step = chunk_size - chunk_overlap, generating structured metadata chunks while preventing semantic truncation.",
            "time": "O(N) where N is the character length of the text",
            "space": "O(N) to store chunk strings and metadata",
        },
        "pitch_script": """**(Clarify)** "We need to implement a deterministic sliding-window text chunker for RAG document ingestion that emits chunk metadata with configurable overlap."

**(Basement Insight)** "Arbitrary document chunking severs sentences and separates entities from their relational context. Overlapping chunks ensure that boundaries maintain semantic continuity."

**(Solution)** "We validate input parameters, compute the step advance as `chunk_size - chunk_overlap`, and slice the text incrementally until the entire document is processed, tagging each chunk with unique coordinates."

**(Complexity)** "Runs in O(N) linear time and space proportional to document length."
""",
        "twist": {
            "lc": 9607,
            "title": "Cross-Encoder Passage Reranker Stage",
            "why": "Once document chunks are indexed and retrieved by vector search, use a cross-encoder to rescore candidate passages."
        },
        "viz": {
            "title": "Sliding Window Document Chunking Pipeline"
        }
    }
})

# Lesson 5: rag-cross-encoder-reranker
LESSONS_4D_4E.append({
    "dir": "35-vector-dbs-rag",
    "world_id": 35,
    "slug": "rag-cross-encoder-reranker",
    "lc": 9607,
    "citadel_id": "ai_resume",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Deterministic Cross-Encoder Candidate Reranker by Query-Passage Relevance",
    "patterns": ["cross-encoder", "reranking", "lexical-coverage", "rag-ranking"],
    "visualizer": "system_blueprint",
    "data": {
        "slug": "rag-cross-encoder-reranker",
        "lc": 9607,
        "citadel_id": "ai_resume",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "Why is initial vector search often insufficient for precision enterprise RAG? Bi-encoder vector search encodes query and documents independently into fixed-length vectors, losing fine-grained cross-token interactions. A cross-encoder performs joint cross-attention over [CLS] query [SEP] passage, modeling exact term coverage and phrase bonuses to rescore candidates accurately.",
            "brute_force": "Running heavy cross-encoder neural networks across all 10,000,000 documents in the database for every single user query.",
            "brute_force_complexity": "O(N * L^2) full self-attention across the entire corpus causing multi-second latency.",
            "key_insight": "Two-stage retrieval: use fast bi-encoder ANN vector search to retrieve the top-50 candidates, then run cross-encoder scoring on only those 50 passages.",
            "real_world": "Cohere Rerank API, BGE-Reranker-Large, and WisdomBot aerospace document reranking stage.",
        },
        "statement": {
            "clean": """Implement a deterministic cross-encoder candidate reranker:
`rerank_passages(self, query: str, candidates: list[dict], top_k: int = 3) -> list[dict]`.

Given:
- `query`: search query string
- `candidates`: list of candidate document dictionaries:
  `{'doc_id': str, 'text': str, 'biencoder_score': float}`
- `top_k`: maximum number of reranked passages to return

Cross-Encoder Scoring Formula:
1. Tokenize `query` into lowercase alphanumeric words: `q_words = set(re.findall(r'\\w+', query.lower().strip()))`.
2. For each candidate document:
   - Tokenize `doc['text']` into lowercase words: `d_words = re.findall(r'\\w+', doc['text'].lower())`.
   - Lexical coverage ratio:
     `coverage = len(q_words.intersection(set(d_words))) / max(len(q_words), 1)`.
   - Exact phrase bonus:
     `phrase_bonus = 1.0 if query.lower().strip() in doc['text'].lower() else 0.0`.
   - Bi-encoder score:
     `bi_score = float(doc.get('biencoder_score', 0.0))`.
   - Cross-encoder composite score:
     `cross_score = round((0.5 * coverage) + (0.3 * phrase_bonus) + (0.2 * bi_score), 4)`.
3. Sort candidates:
   - Primary: `cross_score` descending
   - Secondary (tie-breaker): `doc_id` alphabetically ascending
4. Take the top `min(top_k, len(candidates))` candidates and assign 1-indexed `'rank'` (1, 2, ...).
5. Return list of dicts: `[{'doc_id': doc_id, 'cross_score': cross_score, 'rank': rank}, ...]`.""",
            "oa_story": """**WisdomBot Search Service — Two-Stage Neural Retrieval Pipeline**

During aerospace engine diagnostics, technicians searched for exact error strings like `HPT vane burn through inspection`. While bi-encoder vector embeddings retrieved general turbine blade manuals, they scored passages describing unrelated compressor components higher than the exact vane inspection procedure.

The search team deployed a lightweight cross-encoder reranker to jointly score the top-50 retrieved candidates using lexical coverage and exact phrase match boosts. Implement this reranker.""",
            "trigger_keywords": ["deterministic cross-encoder candidate reranker", "rerank_passages", "biencoder_score"],
            "examples": [
                {
                    "input": "query = 'fast vector search', candidates = [{'doc_id': 'docA', 'text': 'Fast vector search with HNSW indexes', 'biencoder_score': 0.8}, {'doc_id': 'docB', 'text': 'General search algorithms in databases', 'biencoder_score': 0.9}], top_k = 2",
                    "output": "[{'doc_id': 'docA', 'cross_score': 0.96, 'rank': 1}, {'doc_id': 'docB', 'cross_score': 0.3467, 'rank': 2}]",
                    "explanation": "docA contains the exact phrase 'fast vector search' and full keyword coverage, surpassing docB's higher bi-encoder score."
                }
            ],
            "constraints": [
                "0 <= len(candidates) <= 200",
                "1 <= top_k <= 50",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why is a Cross-Encoder typically used as a reranker rather than the first-stage retriever?",
            "options": [
                "Because computing full cross-attention over query-document token pairs for millions of documents is computationally prohibitive",
                "Because Cross-Encoders can only run on CPU, not GPU",
                "Because Cross-Encoders do not support English text",
                "Because Vector databases forbid Cross-Encoders by law"
            ],
            "answer": 0,
            "explanation": "Bi-encoders pre-compute document vectors offline, allowing fast O(log N) ANN index scans. Cross-encoders require computing O(L^2) attention dynamically for every query-document pair, restricting their use to small top-k candidate sets."
        },
        "pattern_quiz": {
            "prompt": "What key architectural distinction separates Bi-Encoders from Cross-Encoders?",
            "options": [
                "Bi-Encoders encode query and document in separate forward passes; Cross-Encoders concatenate query and document into a single forward pass with full cross-attention",
                "Bi-Encoders use 2 layers; Cross-Encoders use 100 layers",
                "Bi-Encoders only process numbers; Cross-Encoders only process words",
                "Bi-Encoders run on client mobile devices only"
            ],
            "answer": 0,
            "explanation": "Bi-encoders output separate embedding vectors for dot-product comparison. Cross-encoders concatenate `[CLS] Query [SEP] Passage` so every token directly attends to every other token."
        },
        "function": {
            "name": "rerank_passages",
            "params": [
                {"name": "query", "type": "any"},
                {"name": "candidates", "type": "any"},
                {"name": "top_k", "type": "any"}
            ],
            "returns": "any"
        },
        "starter_code": """class Solution:
    def rerank_passages(self, query: str, candidates: list[dict], top_k: int = 3) -> list[dict]:
        pass
""",
        "tests": [
            {
                "args": [
                    "fast vector search",
                    [
                        {"doc_id": "docA", "text": "Fast vector search with HNSW indexes", "biencoder_score": 0.8},
                        {"doc_id": "docB", "text": "General search algorithms in databases", "biencoder_score": 0.9},
                        {"doc_id": "docC", "text": "Python vector embeddings tutorial", "biencoder_score": 0.75},
                    ],
                    2
                ],
                "expected": [
                    {"doc_id": "docA", "cross_score": 0.96, "rank": 1},
                    {"doc_id": "docB", "cross_score": 0.3467, "rank": 2},
                ],
                "note": "Exact phrase match and high coverage ranks docA first"
            },
            {
                "args": ["database", [], 3],
                "expected": [],
                "note": "Empty candidates edge case"
            },
            {
                "args": [
                    "neural search",
                    [
                        {"doc_id": "doc1", "text": "Neural search pipelines", "biencoder_score": 0.5}
                    ],
                    1
                ],
                "expected": [
                    {"doc_id": "doc1", "cross_score": 0.9, "rank": 1}
                ],
                "note": "Single matching passage with full coverage and phrase bonus"
            }
        ],
        "visualize_test": 0,
        "drills": [
            {
                "title": "Extract Lowercase Tokens",
                "skill": "setup",
                "goal": "Tokenize text into sorted unique lowercase words.",
                "instructions": "Return sorted(list(set(re.findall(r'\\w+', s.lower())))).",
                "function": {
                    "name": "extract_tokens",
                    "params": [{"name": "s", "type": "any"}]
                },
                "starter_code": """class Solution:
    def extract_tokens(self, s: str) -> list:
        pass
""",
                "tests": [
                    {"args": ["Fast vector search!"], "expected": ["fast", "search", "vector"]}
                ],
                "solution": """import re
class Solution:
    def extract_tokens(self, s: str) -> list:
        return sorted(list(set(re.findall(r'\\w+', s.lower()))))
""",
                "hint": "Use sorted(list(set(re.findall(r'\\w+', s.lower()))))."
            },
            {
                "title": "Calculate Lexical Coverage",
                "skill": "core",
                "goal": "Compute fraction of query words present in document.",
                "instructions": "Return len(set(q_words) & set(d_words)) / max(len(q_words), 1).",
                "function": {
                    "name": "calc_coverage",
                    "params": [{"name": "q_words", "type": "any"}, {"name": "d_words", "type": "any"}]
                },
                "starter_code": """class Solution:
    def calc_coverage(self, q_words: list, d_words: list) -> float:
        pass
""",
                "tests": [
                    {"args": [["a", "b"], ["a", "c"]], "expected": 0.5}
                ],
                "solution": """class Solution:
    def calc_coverage(self, q_words: list, d_words: list) -> float:
        return len(set(q_words) & set(d_words)) / max(len(q_words), 1)
""",
                "hint": "Divide intersection size of sets by query word count."
            },
            {
                "title": "Sort and Rank Top Candidates",
                "skill": "edge",
                "goal": "Sort by -score, id and assign 1-based ranks.",
                "instructions": "Sort items and assign item['rank'] = i + 1.",
                "function": {
                    "name": "rank_top_k",
                    "params": [{"name": "items", "type": "any"}, {"name": "k", "type": "any"}]
                },
                "starter_code": """class Solution:
    def rank_top_k(self, items: list, k: int) -> list:
        pass
""",
                "tests": [
                    {"args": [[{"doc_id": "b", "score": 0.8}, {"doc_id": "a", "score": 0.9}], 1], "expected": [{"doc_id": "a", "score": 0.9, "rank": 1}]}
                ],
                "solution": """class Solution:
    def rank_top_k(self, items: list, k: int) -> list:
        items.sort(key=lambda x: (-x["score"], x["doc_id"]))
        top = items[:k]
        for idx, item in enumerate(top):
            item["rank"] = idx + 1
        return top
""",
                "hint": "Sort by (-score, doc_id) and iterate to set rank."
            }
        ],
        "hints": [
            "Tokenize query words using regex \\w+.",
            "Compute coverage as len(q_words & d_words) / len(q_words).",
            "Calculate cross_score = round(0.5 * coverage + 0.3 * phrase_bonus + 0.2 * bi_score, 4)."
        ],
        "solution": {
            "code": """import re

class Solution:
    def rerank_passages(self, query: str, candidates: list[dict], top_k: int = 3) -> list[dict]:
        if not candidates:
            return []
        q_clean = query.lower().strip()
        q_words = set(re.findall(r'\\w+', q_clean))
        
        scored = []
        for doc in candidates:
            d_id = doc["doc_id"]
            d_text = doc["text"]
            d_words = re.findall(r'\\w+', d_text.lower())
            
            # Coverage
            matched = q_words.intersection(set(d_words))
            coverage = len(matched) / max(len(q_words), 1)
            
            # Phrase bonus
            phrase_bonus = 1.0 if q_clean in d_text.lower() else 0.0
            
            # Bi-encoder score
            bi_score = float(doc.get("biencoder_score", 0.0))
            
            cross_score = round((0.5 * coverage) + (0.3 * phrase_bonus) + (0.2 * bi_score), 4)
            scored.append({
                "doc_id": d_id,
                "cross_score": cross_score,
            })
            
        # Sort desc by cross_score, tie-break doc_id asc
        scored.sort(key=lambda x: (-x["cross_score"], x["doc_id"]))
        
        top = scored[:top_k]
        for idx, item in enumerate(top):
            item["rank"] = idx + 1
            
        return top
""",
            "explanation": "Calculates composite relevance combining keyword coverage, exact phrase bonus, and prior bi-encoder signal, outputting ranked passages.",
            "time": "O(C * L + C log C) where C is candidate count and L is average passage length",
            "space": "O(C) for scored results",
        },
        "pitch_script": """**(Clarify)** "We need to rerank candidate passages retrieved by vector search using a deterministic cross-encoder scoring formula that rewards lexical coverage and exact phrase matches."

**(Basement Insight)** "Bi-encoders decouple query and passage encoding, creating semantic blind spots for exact phrasing and terminology. A cross-encoder reranking stage evaluates joint interactions to surface the most relevant text."

**(Solution)** "We extract word sets from the query and each passage. We compute the coverage ratio, check for exact substring matches, and combine them with the prior bi-encoder score, sorting by cross-encoder score descending."

**(Complexity)** "Runs in O(C * L + C log C) time and O(C) space."
""",
        "twist": {
            "lc": 9605,
            "title": "Vector Nearest Neighbors with Cosine vs Dot Product",
            "why": "Explore how vector normalization enables replacing expensive cosine similarity with simple dot products in vector indexes."
        },
        "viz": {
            "title": "Two-Stage Retrieval & Cross-Encoder Architecture"
        }
    }
})

# ------------------------------------------------------------------------------
# W21: Embeddings (add 1 lesson)
# ------------------------------------------------------------------------------

# Lesson 6: embeddings-top-k-nearest-neighbors
LESSONS_4D_4E.append({
    "dir": "21-ai-resume-defense",
    "world_id": 21,
    "slug": "embeddings-top-k-nearest-neighbors",
    "lc": 9605,
    "citadel_id": "ai_resume",
    "brick_layer": 1,
    "runner_type": "python_practical",
    "difficulty": "Easy",
    "title": "Vector Nearest Neighbors Search Comparing Cosine Similarity and Dot Product",
    "patterns": ["vector-search", "cosine-similarity", "dot-product", "l2-normalization"],
    "visualizer": "system_blueprint",
    "data": {
        "slug": "embeddings-top-k-nearest-neighbors",
        "lc": 9605,
        "citadel_id": "ai_resume",
        "brick_layer": 1,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "Why do high-scale vector databases (Pinecone, Milvus, Qdrant) require embedding vectors to be L2-normalized upon ingestion? Cosine similarity requires computing vector magnitudes ||u|| and ||v|| using square roots on every distance calculation. If vectors are unit length (||u|| = 1), cosine similarity identically equals the dot product (u . v), saving billions of CPU/GPU square-root operations per second.",
            "brute_force": "Re-calculating square roots and vector norms for millions of vector comparisons during real-time query serving.",
            "brute_force_complexity": "O(D) arithmetic operations with expensive sqrt overhead per vector comparison.",
            "key_insight": "Pre-normalizing vectors to unit length converts cosine similarity into a pure dot product: cos(u, v) = u . v.",
            "real_world": "Pinecone index metric selection, OpenAI text-embedding-3 normalization, and Milvus vector search engine.",
        },
        "statement": {
            "clean": """Implement vector nearest neighbors search comparing cosine similarity and dot product:
`find_nearest_neighbors(self, query_vector: list[float], candidates: list[dict], k: int = 3, metric: str = 'cosine') -> list[dict]`.

Given:
- `query_vector`: list of float embedding dimensions
- `candidates`: list of candidate dicts: `{'id': str, 'vector': list[float]}`
- `k`: number of nearest neighbors to retrieve (`k >= 1`)
- `metric`: `'cosine'` or `'dot_product'`

Distance Metrics:
- Dot Product: `sum(u_i * v_i)`
- L2 Norm: `sqrt(sum(v_i^2))`
- Cosine Similarity: `dot(u, v) / (norm(u) * norm(v))` (if either norm is `0.0`, return `0.0`).
- If `metric == 'cosine'`: compute cosine similarity.
- If `metric == 'dot_product'`: compute dot product.
- Round similarity score to 5 decimal places: `round(score, 5)`.

Ordering Rules:
1. Sort candidates:
   - Primary: `score` descending
   - Secondary (tie-breaker): `id` alphabetically ascending
2. Return top `min(k, len(candidates))` candidates: `[{'id': id, 'score': score}, ...]`.
3. If `candidates` is empty, return `[]`.""",
            "oa_story": """**OlaCabs Rider Matching — Geospatial Driver Embedding Search**

OlaCabs uses learned driver-rider spatial embeddings to match premium airport pickups in Bengaluru. The latency SLA for dispatching ride offers is under 5 milliseconds.

The engineering lead discovered that computing cosine similarity with vector magnitude square roots accounted for 40% of matching latency. By verifying when dot product matches cosine similarity under normalized vectors, the cluster doubled search throughput. Implement this comparative vector search module.""",
            "trigger_keywords": ["vector nearest neighbors search comparing cosine similarity and dot product", "find_nearest_neighbors", "query_vector"],
            "examples": [
                {
                    "input": "query_vector = [1.0, 0.0], candidates = [{'id': 'v1', 'vector': [1.0, 0.0]}, {'id': 'v2', 'vector': [0.0, 1.0]}], k = 2, metric = 'cosine'",
                    "output": "[{'id': 'v1', 'score': 1.0}, {'id': 'v2', 'score': 0.0}]",
                    "explanation": "v1 is parallel to query with cosine similarity 1.0; v2 is orthogonal with similarity 0.0."
                }
            ],
            "constraints": [
                "0 <= len(candidates) <= 500",
                "1 <= len(query_vector) <= 1536",
                "metric in ['cosine', 'dot_product']",
            ],
        },
        "constraint_quiz": {
            "prompt": "Under what condition is dot product mathematically identical to cosine similarity?",
            "options": [
                "When both vectors have an L2 norm equal to 1.0 (unit length / L2-normalized)",
                "When all vector components are positive integers",
                "When the vector dimensionality is exactly 128",
                "When the metric is run on an Apple Silicon M-series chip"
            ],
            "answer": 0,
            "explanation": "Because cos(u, v) = (u . v) / (||u|| * ||v||), when ||u|| = 1 and ||v|| = 1, the denominator equals 1 and cos(u, v) = u . v."
        },
        "pattern_quiz": {
            "prompt": "Why is dot product computationally faster than cosine similarity on modern hardware?",
            "options": [
                "It requires only multiply-accumulate (MAC) SIMD instructions without square root or division operations",
                "It bypasses the L1 cache",
                "It uses quantum computing gates",
                "It does not require floating point numbers"
            ],
            "answer": 0,
            "explanation": "Dot products map directly to hardware Fused Multiply-Add (FMA) vector instructions, avoiding non-linear square root and division bottlenecks."
        },
        "function": {
            "name": "find_nearest_neighbors",
            "params": [
                {"name": "query_vector", "type": "any"},
                {"name": "candidates", "type": "any"},
                {"name": "k", "type": "any"},
                {"name": "metric", "type": "any"}
            ],
            "returns": "any"
        },
        "starter_code": """class Solution:
    def find_nearest_neighbors(self, query_vector: list[float], candidates: list[dict], k: int = 3, metric: str = "cosine") -> list[dict]:
        pass
""",
        "tests": [
            {
                "args": [
                    [1.0, 0.0],
                    [
                        {"id": "v1", "vector": [1.0, 0.0]},
                        {"id": "v2", "vector": [0.0, 1.0]},
                        {"id": "v3", "vector": [0.70711, 0.70711]},
                    ],
                    2,
                    "cosine"
                ],
                "expected": [
                    {"id": "v1", "score": 1.0},
                    {"id": "v3", "score": 0.70711},
                ],
                "note": "Cosine similarity ranking"
            },
            {
                "args": [
                    [1.0, 1.0],
                    [
                        {"id": "vA", "vector": [2.0, 2.0]},
                        {"id": "vB", "vector": [0.0, 1.0]},
                    ],
                    2,
                    "dot_product"
                ],
                "expected": [
                    {"id": "vA", "score": 4.0},
                    {"id": "vB", "score": 1.0},
                ],
                "note": "Dot product metric calculation"
            },
            {
                "args": [[1.0], [], 3, "cosine"],
                "expected": [],
                "note": "Empty candidates edge case"
            }
        ],
        "visualize_test": 0,
        "drills": [
            {
                "title": "Compute Dot Product",
                "skill": "setup",
                "goal": "Calculate sum of element-wise products.",
                "instructions": "Return sum(x * y for x, y in zip(u, v)).",
                "function": {
                    "name": "calc_dot",
                    "params": [{"name": "u", "type": "any"}, {"name": "v", "type": "any"}]
                },
                "starter_code": """class Solution:
    def calc_dot(self, u: list, v: list) -> float:
        pass
""",
                "tests": [
                    {"args": [[1.0, 2.0], [3.0, 4.0]], "expected": 11.0}
                ],
                "solution": """class Solution:
    def calc_dot(self, u: list, v: list) -> float:
        return sum(x * y for x, y in zip(u, v))
""",
                "hint": "Use sum with zip."
            },
            {
                "title": "Compute L2 Norm",
                "skill": "core",
                "goal": "Calculate Euclidean magnitude of vector.",
                "instructions": "Return math.sqrt(sum(x * x for x in v)).",
                "function": {
                    "name": "calc_norm",
                    "params": [{"name": "v", "type": "any"}]
                },
                "starter_code": """class Solution:
    def calc_norm(self, v: list) -> float:
        pass
""",
                "tests": [
                    {"args": [[3.0, 4.0]], "expected": 5.0}
                ],
                "solution": """import math
class Solution:
    def calc_norm(self, v: list) -> float:
        return math.sqrt(sum(x * x for x in v))
""",
                "hint": "Return math.sqrt of sum of squares."
            },
            {
                "title": "Compute Cosine Similarity",
                "skill": "edge",
                "goal": "Safely compute cosine similarity avoiding division by zero.",
                "instructions": "Return dot / (norm_u * norm_v) if norm_u * norm_v > 0 else 0.0.",
                "function": {
                    "name": "calc_cosine",
                    "params": [{"name": "dot", "type": "any"}, {"name": "nu", "type": "any"}, {"name": "nv", "type": "any"}]
                },
                "starter_code": """class Solution:
    def calc_cosine(self, dot: float, nu: float, nv: float) -> float:
        pass
""",
                "tests": [
                    {"args": [5.0, 2.0, 5.0], "expected": 0.5},
                    {"args": [0.0, 0.0, 5.0], "expected": 0.0}
                ],
                "solution": """class Solution:
    def calc_cosine(self, dot: float, nu: float, nv: float) -> float:
        denom = nu * nv
        return (dot / denom) if denom > 0 else 0.0
""",
                "hint": "Check if nu * nv > 0."
            }
        ],
        "hints": [
            "Compute query norm if metric == 'cosine'.",
            "Iterate candidates, computing dot product and optionally candidate norm.",
            "Sort by (-score, id) and slice top k."
        ],
        "solution": {
            "code": """import math

class Solution:
    def find_nearest_neighbors(self, query_vector: list[float], candidates: list[dict], k: int = 3, metric: str = "cosine") -> list[dict]:
        if not candidates:
            return []
            
        def dot(u, v):
            return sum(x * y for x, y in zip(u, v))
            
        def norm(v):
            return math.sqrt(sum(x * x for x in v))
            
        q_norm = norm(query_vector)
        scored = []
        
        for cand in candidates:
            c_id = cand["id"]
            c_vec = cand["vector"]
            d = dot(query_vector, c_vec)
            
            if metric == "cosine":
                c_norm = norm(c_vec)
                denom = q_norm * c_norm
                score = (d / denom) if denom > 0 else 0.0
            else:
                score = d
                
            scored.append({
                "id": c_id,
                "score": round(score, 5),
            })
            
        scored.sort(key=lambda x: (-x["score"], x["id"]))
        return scored[:k]
""",
            "explanation": "Calculates cosine or dot product distance for each candidate, returning top-k nearest vector neighbors sorted by similarity score.",
            "time": "O(N * D + N log N) where N is candidate count and D is vector dimension",
            "space": "O(N) for candidate scores",
        },
        "pitch_script": """**(Clarify)** "We need to perform vector nearest neighbor retrieval, supporting both cosine similarity and dot product metrics with tie-breaking."

**(Basement Insight)** "Computing cosine similarity on every search requires square root operations to calculate vector norms. Normalizing vectors at ingestion converts cosine similarity to a pure dot product, enabling SIMD hardware acceleration."

**(Solution)** "We compute the dot product and optionally vector norms depending on the requested metric. We round the similarity score and return the top-k highest scoring candidates."

**(Complexity)** "Runs in O(N * D) time and O(N) space."
""",
        "twist": {
            "lc": 9608,
            "title": "GEPA Evolutionary Prompt Optimizer with Elitism",
            "why": "Combine vector similarity evaluation with evolutionary search to optimize prompt templates automatically."
        },
        "viz": {
            "title": "Vector Similarity Metric Geometric Comparison"
        }
    }
})

# ------------------------------------------------------------------------------
# W37: GEPA (add 1 lesson)
# ------------------------------------------------------------------------------

# Lesson 7: gepa-genetic-crossover-elitism
LESSONS_4D_4E.append({
    "dir": "37-gepa-prompt-optimization",
    "world_id": 37,
    "slug": "gepa-genetic-crossover-elitism",
    "lc": 9608,
    "citadel_id": "ai_resume",
    "brick_layer": 4,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Genetic Prompt Optimization with Elitism, Crossover, and Mutation",
    "patterns": ["genetic-algorithm", "prompt-optimization", "elitism", "evolutionary-search"],
    "visualizer": "system_blueprint",
    "data": {
        "slug": "gepa-genetic-crossover-elitism",
        "lc": 9608,
        "citadel_id": "ai_resume",
        "brick_layer": 4,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How do AI engineers discover optimal prompt templates without spending dozens of hours manually tweaking words? Genetic Pareto Optimization (GEPA) treats prompts as evolutionary individuals. High-performing instructions cross over to produce offspring, while elitism preserves top candidates and mutations introduce creative exploration.",
            "brute_force": "Manual trial-and-error prompt engineering with human inspection of thousands of LLM completions.",
            "brute_force_complexity": "High human engineering overhead with non-replicable prompt quality.",
            "key_insight": "Simulating biological selection (elitism preserves best prompts, crossover combines successful role and instruction pairs) systematically navigates the discrete prompt search space.",
            "real_world": "GEPA/LLEGO automated prompt optimization engine (achieving 66% API cost reduction in production), DSPy teleprompters, and Microsoft Promptbreeder.",
        },
        "statement": {
            "clean": """Implement one generation of genetic prompt optimization with elitism, crossover, and mutation:
`evolve_prompt_generation(self, population: list[dict], elite_k: int = 2, crossover_pairs: list[list[int]] = None, mutation_rules: list[dict] = None) -> list[dict]`.

Given:
- `population`: list of candidate prompt dicts:
  `{'id': str, 'role': str, 'instruction': str, 'fitness': float}`
- `elite_k`: number of top individuals to preserve via elitism (`elite_k >= 0`)
- `crossover_pairs`: list of index pairs `[parent1_idx, parent2_idx]` into the sorted population
- `mutation_rules`: list of mutation action dicts:
  `{'target_id': str, 'mutation_type': 'append_constraint' | 'replace_role', 'value': str}`

Evolutionary Lifecycle:
1. Sort `population` descending by `fitness` (tie-breaker: `id` alphabetically ascending).
2. Elitism: Directly copy the top `elite_k` individuals into the new generation.
3. Crossover: For each `[p1_idx, p2_idx]` in `crossover_pairs` (where indices reference the sorted population):
   - Parent 1 is `sorted_pop[p1_idx]`, Parent 2 is `sorted_pop[p2_idx]`.
   - Child prompt:
     `{'id': f'child_{p1[\"id\"]}_{p2[\"id\"]}', 'role': p1['role'], 'instruction': p2['instruction'], 'fitness': round((p1['fitness'] + p2['fitness']) / 2.0, 2)}`
   - Append child to the new generation.
4. Mutation: For each rule in `mutation_rules`:
   - Locate the individual in the new generation with `id == target_id`.
   - If `mutation_type == 'append_constraint'`:
     append `f' Constraint: {value}'` to its `instruction`.
   - If `mutation_type == 'replace_role'`:
     replace its `role` with `value`.
   - Deduct `0.05` from its `fitness` (mutation cost) rounded to 2 decimal places: `round(fitness - 0.05, 2)`.
5. Return the new generation list of candidate prompt dicts.""",
            "oa_story": """**GEPA Prompt Optimizer — Autonomous LLM Instruction Evolution**

In production at scale, manual prompt engineering could not keep up with model updates and token cost constraints. The GEPA engine was built to automatically evolve prompt architectures through evolutionary hyper-parameter search.

By combining the top 2 elite system instructions with crossover mutations, GEPA discovered compact prompts that reduced API token usage by 66% while improving accuracy. Implement one generation of this evolutionary prompt engine.""",
            "trigger_keywords": ["genetic prompt optimization with elitism, crossover, and mutation", "evolve_prompt_generation", "crossover_pairs"],
            "examples": [
                {
                    "input": "population = [{'id': 'p1', 'role': 'Dev', 'instruction': 'Write Python', 'fitness': 0.90}, {'id': 'p2', 'role': 'Arch', 'instruction': 'Optimize code', 'fitness': 0.80}], elite_k = 2, crossover_pairs = [[0, 1]], mutation_rules = []",
                    "output": "[{'id': 'p1', 'role': 'Dev', 'instruction': 'Write Python', 'fitness': 0.90}, {'id': 'p2', 'role': 'Arch', 'instruction': 'Optimize code', 'fitness': 0.80}, {'id': 'child_p1_p2', 'role': 'Dev', 'instruction': 'Optimize code', 'fitness': 0.85}]",
                    "explanation": "Elites p1 and p2 are preserved; child combines role from p1 and instruction from p2."
                }
            ],
            "constraints": [
                "0 <= len(population) <= 100",
                "0 <= elite_k <= len(population)",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why is elitism essential in genetic prompt optimization algorithms?",
            "options": [
                "It guarantees that the highest-fitness prompt discovered so far is never lost across generations due to destructive mutations",
                "It increases the learning rate of the LLM",
                "It deletes low-performing prompts from disk immediately",
                "It ensures prompts always have fewer than 10 words"
            ],
            "answer": 0,
            "explanation": "Without elitism, random crossover or deleterious mutations might degrade the best prompt discovered in earlier iterations."
        },
        "pattern_quiz": {
            "prompt": "In evolutionary prompt synthesis, what does the crossover operator correspond to?",
            "options": [
                "Synthesizing a new prompt by combining modular components (e.g. system persona from Prompt A and few-shot examples from Prompt B)",
                "Translating prompts between Python and C++",
                "Sorting prompts by length",
                "Encrypting prompts with RSA keys"
            ],
            "answer": 0,
            "explanation": "Crossover takes high-performing building blocks from two fit parent prompts and blends them into an offspring prompt."
        },
        "function": {
            "name": "evolve_prompt_generation",
            "params": [
                {"name": "population", "type": "any"},
                {"name": "elite_k", "type": "any"},
                {"name": "crossover_pairs", "type": "any"},
                {"name": "mutation_rules", "type": "any"}
            ],
            "returns": "any"
        },
        "starter_code": """class Solution:
    def evolve_prompt_generation(self, population: list[dict], elite_k: int = 2, crossover_pairs: list[list[int]] = None, mutation_rules: list[dict] = None) -> list[dict]:
        pass
""",
        "tests": [
            {
                "args": [
                    [
                        {"id": "p1", "role": "Expert Dev", "instruction": "Write clean Python", "fitness": 0.90},
                        {"id": "p2", "role": "Senior Architect", "instruction": "Optimize for memory", "fitness": 0.80},
                        {"id": "p3", "role": "Junior Dev", "instruction": "Add comments", "fitness": 0.50},
                    ],
                    2,
                    [[0, 1]],
                    [{"target_id": "child_p1_p2", "mutation_type": "append_constraint", "value": "Be concise"}]
                ],
                "expected": [
                    {"id": "p1", "role": "Expert Dev", "instruction": "Write clean Python", "fitness": 0.90},
                    {"id": "p2", "role": "Senior Architect", "instruction": "Optimize for memory", "fitness": 0.80},
                    {"id": "child_p1_p2", "role": "Expert Dev", "instruction": "Optimize for memory Constraint: Be concise", "fitness": 0.80},
                ],
                "note": "Elitism, crossover and mutation pipeline"
            },
            {
                "args": [
                    [{"id": "pA", "role": "Bot", "instruction": "Reply", "fitness": 0.70}],
                    1,
                    [],
                    []
                ],
                "expected": [
                    {"id": "pA", "role": "Bot", "instruction": "Reply", "fitness": 0.70}
                ],
                "note": "Single individual preserved via elitism"
            },
            {
                "args": [
                    [
                        {"id": "p1", "role": "Writer", "instruction": "Draft", "fitness": 0.85},
                        {"id": "p2", "role": "Editor", "instruction": "Revise", "fitness": 0.75},
                    ],
                    1,
                    [[0, 1]],
                    []
                ],
                "expected": [
                    {"id": "p1", "role": "Writer", "instruction": "Draft", "fitness": 0.85},
                    {"id": "child_p1_p2", "role": "Writer", "instruction": "Revise", "fitness": 0.80},
                ],
                "note": "Crossover without mutation rules"
            }
        ],
        "visualize_test": 0,
        "drills": [
            {
                "title": "Select Top Elites",
                "skill": "setup",
                "goal": "Preserve top k individuals by fitness.",
                "instructions": "Sort by -fitness, id and return top k.",
                "function": {
                    "name": "get_elites",
                    "params": [{"name": "pop", "type": "any"}, {"name": "k", "type": "any"}]
                },
                "starter_code": """class Solution:
    def get_elites(self, pop: list, k: int) -> list:
        pass
""",
                "tests": [
                    {"args": [[{"id": "b", "fitness": 0.8}, {"id": "a", "fitness": 0.9}], 1], "expected": [{"id": "a", "fitness": 0.9}]}
                ],
                "solution": """class Solution:
    def get_elites(self, pop: list, k: int) -> list:
        return sorted(pop, key=lambda x: (-x["fitness"], x["id"]))[:k]
""",
                "hint": "Sort by -fitness, id."
            },
            {
                "title": "Combine Parent Instructions",
                "skill": "core",
                "goal": "Cross over role from p1 and instruction from p2.",
                "instructions": "Return dict with id, role p1, instruction p2, avg fitness.",
                "function": {
                    "name": "combine_parents",
                    "params": [{"name": "p1", "type": "any"}, {"name": "p2", "type": "any"}]
                },
                "starter_code": """class Solution:
    def combine_parents(self, p1: dict, p2: dict) -> dict:
        pass
""",
                "tests": [
                    {"args": [{"id": "a", "role": "r1", "instruction": "i1", "fitness": 0.8}, {"id": "b", "role": "r2", "instruction": "i2", "fitness": 0.6}], "expected": {"id": "child_a_b", "role": "r1", "instruction": "i2", "fitness": 0.7}}
                ],
                "solution": """class Solution:
    def combine_parents(self, p1: dict, p2: dict) -> dict:
        return {
            "id": f"child_{p1['id']}_{p2['id']}",
            "role": p1["role"],
            "instruction": p2["instruction"],
            "fitness": round((p1["fitness"] + p2["fitness"]) / 2.0, 2),
        }
""",
                "hint": "Take role from p1 and instruction from p2."
            },
            {
                "title": "Apply Mutation Cost",
                "skill": "edge",
                "goal": "Adjust fitness after mutation operation.",
                "instructions": "Return round(fitness - 0.05, 2).",
                "function": {
                    "name": "deduct_mutation_cost",
                    "params": [{"name": "fitness", "type": "any"}]
                },
                "starter_code": """class Solution:
    def deduct_mutation_cost(self, fitness: float) -> float:
        pass
""",
                "tests": [
                    {"args": [0.85], "expected": 0.80}
                ],
                "solution": """class Solution:
    def deduct_mutation_cost(self, fitness: float) -> float:
        return round(fitness - 0.05, 2)
""",
                "hint": "Subtract 0.05 and round to 2 decimals."
            }
        ],
        "hints": [
            "Sort population by fitness descending with id tie-breaker.",
            "Copy top elite_k individuals to next_gen.",
            "Iterate crossover pairs to construct children, then apply mutation rules."
        ],
        "solution": {
            "code": """class Solution:
    def evolve_prompt_generation(self, population: list[dict], elite_k: int = 2, crossover_pairs: list[list[int]] = None, mutation_rules: list[dict] = None) -> list[dict]:
        if not population:
            return []
            
        sorted_pop = sorted(population, key=lambda x: (-x["fitness"], x["id"]))
        next_gen = []
        
        # 1. Elitism
        elites = [dict(p) for p in sorted_pop[:elite_k]]
        next_gen.extend(elites)
        
        # 2. Crossover
        crossover_pairs = crossover_pairs or []
        for pair in crossover_pairs:
            p1_idx, p2_idx = pair[0], pair[1]
            p1 = sorted_pop[p1_idx]
            p2 = sorted_pop[p2_idx]
            child = {
                "id": f"child_{p1['id']}_{p2['id']}",
                "role": p1["role"],
                "instruction": p2["instruction"],
                "fitness": round((p1["fitness"] + p2["fitness"]) / 2.0, 2),
            }
            next_gen.append(child)
            
        # 3. Mutation
        mutation_rules = mutation_rules or []
        for rule in mutation_rules:
            t_id = rule.get("target_id")
            m_type = rule.get("mutation_type")
            val = rule.get("value", "")
            for ind in next_gen:
                if ind["id"] == t_id:
                    if m_type == "append_constraint":
                        ind["instruction"] = f"{ind['instruction']} Constraint: {val}"
                    elif m_type == "replace_role":
                        ind["role"] = val
                    ind["fitness"] = round(ind["fitness"] - 0.05, 2)
                    break
                    
        return next_gen
""",
            "explanation": "Executes one evolutionary generation combining elitist selection, instruction crossover, and semantic mutations.",
            "time": "O(P log P + C + M) where P is population, C is crossovers, M is mutations",
            "space": "O(P) for next generation population",
        },
        "pitch_script": """**(Clarify)** "We need to implement one discrete generation of genetic prompt optimization using elitism, prompt component crossover, and targeted mutations."

**(Basement Insight)** "Finding effective prompt variations manually is slow and un-reproducible. Genetic algorithms treat prompts as modular genomes, systematically recombining high-performing instructions while protecting top candidates."

**(Solution)** "We sort prompts by fitness. We carry over the top elite candidates, generate offspring by crossing over parent roles and instructions, and apply semantic mutations with calibrated cost penalties."

**(Complexity)** "Executes in O(P log P) time dominated by sorting, using O(P) space."
""",
        "twist": {
            "lc": 9604,
            "title": "Interactive Resume Defense Scenario Engine",
            "why": "Take the prompt optimization principles and build an interactive interview simulator that grills system design decisions."
        },
        "viz": {
            "title": "GEPA Evolutionary Prompt Optimization Architecture"
        }
    }
})

# ==============================================================================
# BATCH 4E — PEAK II (Python & Data)
# ==============================================================================

# ------------------------------------------------------------------------------
# W13: Python Internals (add 2 lessons)
# ------------------------------------------------------------------------------

# Lesson 8: python-closures-late-binding
LESSONS_4D_4E.append({
    "dir": "13-python-internals",
    "world_id": 13,
    "slug": "python-closures-late-binding",
    "lc": 9205,
    "citadel_id": "python_data",
    "brick_layer": 1,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Python Closures and the Late Binding Variable Trap",
    "patterns": ["closures", "lexical-scoping", "late-binding", "default-arguments"],
    "visualizer": "system_blueprint",
    "data": {
        "slug": "python-closures-late-binding",
        "lc": 9205,
        "citadel_id": "python_data",
        "brick_layer": 1,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "Why do closures defined inside Python loops frequently produce identical, unexpected values? In Python, closures bind variable names, not values, at function definition time. When the returned function finally executes, it resolves the variable in the enclosing scope where it has already reached the loop's final iteration value. Fixing this requires binding the variable early using default arguments or an enclosing factory function.",
            "brute_force": "Writing [lambda x: x * m for m in multipliers] and wondering why every multiplier function multiplies by the final element.",
            "brute_force_complexity": "Silent logic bugs across dynamically registered callback handlers.",
            "key_insight": "Default arguments are evaluated at function definition time, freezing the current loop value into the closure's local scope: lambda x, factor=m: x * factor.",
            "real_world": "UI button click handler registration, Flask/FastAPI dynamic endpoint generation, and Airflow dynamic DAG task generation.",
        },
        "statement": {
            "clean": """Demonstrate and resolve the Python closure late binding trap:
`evaluate_closure_binding(self, multipliers: list[int], value: int, method: str) -> list[int]`.

Given:
- `multipliers`: list of integer factors (e.g. `[1, 2, 3]`)
- `value`: input integer to evaluate
- `method`: closure creation strategy:
  - `'late_binding'`: standard loop closures `[lambda x: x * m for m in multipliers]`. Due to late binding, every closure looks up `m` at execution time, which equals `multipliers[-1]`. Returns `[value * multipliers[-1]] * len(multipliers)`.
  - `'default_arg'`: early binding via default arguments `[lambda x, factor=m: x * factor for m in multipliers]`. Each closure preserves its respective factor.
  - `'factory_function'`: early binding using an enclosing helper function:
    ```python
    def make_multiplier(factor):
        return lambda x: x * factor
    funcs = [make_multiplier(m) for m in multipliers]
    ```

Rules:
1. If `multipliers` is empty, return `[]`.
2. Apply each function in `funcs` to `value`.
3. Return list of evaluated integer results: `[f(value) for f in funcs]`.""",
            "oa_story": """**RideMitra Pricing Engine — Fare Surge Multiplier Registry**

RideMitra's dynamic pricing microservice dynamically registers surge pricing tiers based on traffic density: `[1.2x, 1.5x, 2.0x, 3.0x]`. A junior backend engineer generated discount calculator callbacks inside a list comprehension.

During the Bengaluru monsoon rush, all riders were unexpectedly billed the maximum 3.0x surge tier, even in low-demand suburbs, because Python closures bound the surge variable late. Implement this diagnostic module to demonstrate and fix the late binding trap.""",
            "trigger_keywords": ["Python closure late binding trap", "evaluate_closure_binding", "late_binding"],
            "examples": [
                {
                    "input": "multipliers = [1, 2, 3], value = 10, method = 'late_binding'",
                    "output": "[30, 30, 30]",
                    "explanation": "Because m ends at 3, all closures multiply value 10 by 3."
                },
                {
                    "input": "multipliers = [1, 2, 3], value = 10, method = 'default_arg'",
                    "output": "[10, 20, 30]",
                    "explanation": "Default argument captures factor at definition time: 10*1, 10*2, 10*3."
                }
            ],
            "constraints": [
                "0 <= len(multipliers) <= 100",
                "method in ['late_binding', 'default_arg', 'factory_function']",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why does lambda x, factor=m: x * factor avoid the closure late binding trap?",
            "options": [
                "Because default argument values are evaluated and bound to the function object at definition time, not execution time",
                "Because default arguments run in a separate C thread",
                "Because Python converts default arguments into global constants",
                "Because lambdas with default arguments are compiled to WebAssembly"
            ],
            "answer": 0,
            "explanation": "In Python, default parameter expressions are evaluated when the def/lambda statement executes, binding the snapshot value to __defaults__."
        },
        "pattern_quiz": {
            "prompt": "How does an enclosing factory function solve the late binding trap without using default arguments?",
            "options": [
                "Calling make_multiplier(m) creates a distinct new local scope (frame) where m is preserved in the closure's __closure__ cell",
                "It writes the value to a temporary SQLite database",
                "It deletes the variable from the global scope",
                "It forces Python to use call-by-reference"
            ],
            "answer": 0,
            "explanation": "Each invocation of the factory creates a unique enclosing stack frame whose local variables are captured as an immutable cell object."
        },
        "function": {
            "name": "evaluate_closure_binding",
            "params": [
                {"name": "multipliers", "type": "any"},
                {"name": "value", "type": "any"},
                {"name": "method", "type": "any"}
            ],
            "returns": "any"
        },
        "starter_code": """class Solution:
    def evaluate_closure_binding(self, multipliers: list[int], value: int, method: str) -> list[int]:
        pass
""",
        "tests": [
            {
                "args": [[1, 2, 3], 10, "late_binding"],
                "expected": [30, 30, 30],
                "note": "Late binding multiplies by final value 3"
            },
            {
                "args": [[1, 2, 3], 10, "default_arg"],
                "expected": [10, 20, 30],
                "note": "Default argument captures respective factors"
            },
            {
                "args": [[2, 5], 4, "factory_function"],
                "expected": [8, 20],
                "note": "Factory function captures respective factors"
            },
            {
                "args": [[], 10, "default_arg"],
                "expected": [],
                "note": "Empty multipliers edge case"
            }
        ],
        "visualize_test": 0,
        "drills": [
            {
                "title": "Build Buggy Closures",
                "skill": "setup",
                "goal": "Construct closures demonstrating late binding.",
                "instructions": "Return [lambda x: x * m for m in multipliers].",
                "function": {
                    "name": "make_late_closures",
                    "params": [{"name": "multipliers", "type": "any"}]
                },
                "starter_code": """class Solution:
    def make_late_closures(self, multipliers: list) -> list:
        pass
""",
                "tests": [
                    {"args": [[1, 2]], "expected": [4, 4]}
                ],
                "solution": """class Solution:
    def make_late_closures(self, multipliers: list) -> list:
        funcs = [lambda x: x * m for m in multipliers]
        return [f(2) for f in funcs]
""",
                "hint": "Create list comprehension with lambda x: x * m."
            },
            {
                "title": "Early Binding via Default Arg",
                "skill": "core",
                "goal": "Capture loop variable in default argument.",
                "instructions": "Return [lambda x, factor=m: x * factor for m in multipliers].",
                "function": {
                    "name": "make_early_closures",
                    "params": [{"name": "multipliers", "type": "any"}]
                },
                "starter_code": """class Solution:
    def make_early_closures(self, multipliers: list) -> list:
        pass
""",
                "tests": [
                    {"args": [[1, 2]], "expected": [2, 4]}
                ],
                "solution": """class Solution:
    def make_early_closures(self, multipliers: list) -> list:
        funcs = [lambda x, factor=m: x * factor for m in multipliers]
        return [f(2) for f in funcs]
""",
                "hint": "Use factor=m in lambda parameters."
            },
            {
                "title": "Early Binding via Factory",
                "skill": "edge",
                "goal": "Capture loop variable using helper function scope.",
                "instructions": "Return list of closures created via factory helper.",
                "function": {
                    "name": "make_factory_closures",
                    "params": [{"name": "multipliers", "type": "any"}]
                },
                "starter_code": """class Solution:
    def make_factory_closures(self, multipliers: list) -> list:
        pass
""",
                "tests": [
                    {"args": [[3, 5]], "expected": [6, 10]}
                ],
                "solution": """class Solution:
    def make_factory_closures(self, multipliers: list) -> list:
        def factory(f):
            return lambda x: x * f
        funcs = [factory(m) for m in multipliers]
        return [f(2) for f in funcs]
""",
                "hint": "Define a factory function returning lambda x: x * f."
            }
        ],
        "hints": [
            "If method == 'late_binding', use [lambda x: x * m for m in multipliers].",
            "If method == 'default_arg', freeze with [lambda x, factor=m: x * factor for m in multipliers].",
            "If method == 'factory_function', use an enclosing def factory(f): return lambda x: x * f."
        ],
        "solution": {
            "code": """class Solution:
    def evaluate_closure_binding(self, multipliers: list[int], value: int, method: str) -> list[int]:
        if not multipliers:
            return []
            
        if method == "late_binding":
            funcs = [lambda x: x * m for m in multipliers]
        elif method == "default_arg":
            funcs = [lambda x, factor=m: x * factor for m in multipliers]
        elif method == "factory_function":
            def make_multiplier(f):
                return lambda x: x * f
            funcs = [make_multiplier(m) for m in multipliers]
        else:
            return []
            
        return [f(value) for f in funcs]
""",
            "explanation": "Exposes how Python scopes closures by reference to enclosing frames, and demonstrates early-binding remedies using default parameters and factory closures.",
            "time": "O(N) where N is the length of multipliers",
            "space": "O(N) to store closure references and results",
        },
        "pitch_script": """**(Clarify)** "We need to demonstrate how closures capture variable references in Python loops, contrasting late binding against early binding via default arguments and factory functions."

**(Basement Insight)** "Python functions capture variable names in closures rather than copying their values. When executed after the loop finishes, all lambdas look up the same final loop variable."

**(Solution)** "We implement all three strategies: the standard late-binding loop, default parameter binding where values freeze at definition time, and factory functions that allocate separate stack frames."

**(Complexity)** "Executes in O(N) time and O(N) space."
""",
        "twist": {
            "lc": 9206,
            "title": "Deterministic Exponential Backoff Retry Decorator",
            "why": "Combine closure function wrapping with decorators to implement robust exponential backoff."
        },
        "viz": {
            "title": "Python Scope Resolution & Closure Binding Cells"
        }
    }
})

# Lesson 9: retry-backoff-injected-sleep
LESSONS_4D_4E.append({
    "dir": "13-python-internals",
    "world_id": 13,
    "slug": "retry-backoff-injected-sleep",
    "lc": 9206,
    "citadel_id": "python_data",
    "brick_layer": 1,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Exponential Backoff Retry Decorator with Injected Sleep Function",
    "patterns": ["decorators", "retry-backoff", "dependency-injection", "closures"],
    "visualizer": "system_blueprint",
    "data": {
        "slug": "retry-backoff-injected-sleep",
        "lc": 9206,
        "citadel_id": "python_data",
        "brick_layer": 1,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How do distributed backend systems handle intermittent network hiccups without blocking unit tests for seconds or minutes? An exponential backoff retry decorator retries failed operations with escalating delays (1s, 2s, 4s). Injecting a mock sleep function allows unit tests to execute instantaneously and verify the exact delay sequence deterministically.",
            "brute_force": "Hardcoding time.sleep() directly inside business logic, making automated unit tests painfully slow and flaky.",
            "brute_force_complexity": "High test execution time with non-deterministic test flakiness.",
            "key_insight": "Dependency injection of the sleep function makes time-dependent retry policies 100% deterministic and instantaneous to test.",
            "real_world": "Tenacity library in Python, Stripe API SDK retries, and AWS boto3 client retry configurations.",
        },
        "statement": {
            "clean": """Implement a deterministic retry decorator with exponential backoff and injected sleep:
`execute_retry_workflow(self, failures_before_success: int, max_attempts: int, initial_delay: float, backoff_factor: float) -> dict`.

Inputs:
- `failures_before_success`: number of failures before the target operation succeeds (`failures_before_success >= 0`)
- `max_attempts`: maximum attempts allowed (`max_attempts >= 1`)
- `initial_delay`: initial sleep duration in seconds (e.g. `1.0`)
- `backoff_factor`: multiplication factor applied per retry (e.g. `2.0`)

Execution Rules:
1. Maintain an injected `sleep_log` list to record sleep durations without blocking:
   `def injected_sleep(duration): sleep_log.append(round(duration, 2))`
2. Track attempts starting at `attempts = 0` and `current_delay = initial_delay`.
3. In each attempt:
   - Increment `attempts += 1`.
   - If `attempts <= failures_before_success`:
     - The operation fails.
     - If `attempts < max_attempts`, call `injected_sleep(current_delay)` and update `current_delay *= backoff_factor`.
   - If `attempts > failures_before_success`:
     - The operation succeeds: set `success = True`, `result = 'Success'`, and break.
4. If attempts reach `max_attempts` without succeeding:
   - Set `success = False` and `result = None`.
5. Return dict:
   `{'success': success, 'attempts': attempts, 'delays': sleep_log, 'result': result}`.""",
            "oa_story": """**PayLoop Payment Switch — Flaky Bank Gateway Retry Handler**

During peak bank clearing hours, partner bank webhooks threw transient HTTP 503 errors. PayLoop engineers implemented an exponential backoff decorator to retry failed settlements. However, running integration tests with real `time.sleep` slowed the CI/CD pipeline from 3 minutes to 45 minutes.

The Principal Engineer instructed the team to refactor the retry decorator to accept an injected sleep function. Implement this deterministic retry workflow.""",
            "trigger_keywords": ["retry decorator with exponential backoff and injected sleep", "execute_retry_workflow", "failures_before_success"],
            "examples": [
                {
                    "input": "failures_before_success = 0, max_attempts = 3, initial_delay = 1.0, backoff_factor = 2.0",
                    "output": "{'success': True, 'attempts': 1, 'delays': [], 'result': 'Success'}",
                    "explanation": "Operation succeeds on first attempt with 0 sleep calls."
                },
                {
                    "input": "failures_before_success = 2, max_attempts = 3, initial_delay = 1.0, backoff_factor = 2.0",
                    "output": "{'success': True, 'attempts': 3, 'delays': [1.0, 2.0], 'result': 'Success'}",
                    "explanation": "Operation fails twice, sleeps 1.0s and 2.0s, and succeeds on 3rd attempt."
                }
            ],
            "constraints": [
                "0 <= failures_before_success <= 10",
                "1 <= max_attempts <= 10",
                "initial_delay > 0",
                "backoff_factor >= 1.0",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why should sleep functions be injected into retry decorators rather than imported directly as time.sleep?",
            "options": [
                "To enable deterministic testing of retry delays in milliseconds without introducing real wall-clock delays in CI test suites",
                "Because time.sleep is deprecated in Python 3.12",
                "To avoid running out of RAM",
                "To allow the function to run on microcontrollers"
            ],
            "answer": 0,
            "explanation": "Injecting sleep decouples time simulation from real time, allowing tests to run instantly while recording the exact sequence of backoff durations."
        },
        "pattern_quiz": {
            "prompt": "What formula defines standard exponential backoff delay at retry attempt k (0-indexed)?",
            "options": [
                "delay = initial_delay * (backoff_factor ** k)",
                "delay = initial_delay + k",
                "delay = initial_delay / (k + 1)",
                "delay = initial_delay ** (k + 1)"
            ],
            "answer": 0,
            "explanation": "Exponential backoff multiplies the initial delay by the backoff factor raised to the power of the retry count (e.g. 1s, 2s, 4s, 8s)."
        },
        "function": {
            "name": "execute_retry_workflow",
            "params": [
                {"name": "failures_before_success", "type": "any"},
                {"name": "max_attempts", "type": "any"},
                {"name": "initial_delay", "type": "any"},
                {"name": "backoff_factor", "type": "any"}
            ],
            "returns": "any"
        },
        "starter_code": """class Solution:
    def execute_retry_workflow(self, failures_before_success: int, max_attempts: int, initial_delay: float, backoff_factor: float) -> dict:
        pass
""",
        "tests": [
            {
                "args": [0, 3, 1.0, 2.0],
                "expected": {
                    "success": True,
                    "attempts": 1,
                    "delays": [],
                    "result": "Success"
                },
                "note": "Immediate success on attempt 1"
            },
            {
                "args": [2, 3, 1.0, 2.0],
                "expected": {
                    "success": True,
                    "attempts": 3,
                    "delays": [1.0, 2.0],
                    "result": "Success"
                },
                "note": "Success on final retry after 2 backoff delays"
            },
            {
                "args": [5, 2, 0.5, 3.0],
                "expected": {
                    "success": False,
                    "attempts": 2,
                    "delays": [0.5],
                    "result": None
                },
                "note": "Exhausted retries yields failure"
            }
        ],
        "visualize_test": 0,
        "drills": [
            {
                "title": "Calculate Next Delay",
                "skill": "setup",
                "goal": "Multiply current delay by backoff factor.",
                "instructions": "Return current_delay * factor.",
                "function": {
                    "name": "multiply_delay",
                    "params": [{"name": "delay", "type": "any"}, {"name": "factor", "type": "any"}]
                },
                "starter_code": """class Solution:
    def multiply_delay(self, delay: float, factor: float) -> float:
        pass
""",
                "tests": [
                    {"args": [1.0, 2.0], "expected": 2.0},
                    {"args": [2.0, 2.0], "expected": 4.0}
                ],
                "solution": """class Solution:
    def multiply_delay(self, delay: float, factor: float) -> float:
        return delay * factor
""",
                "hint": "Return delay * factor."
            },
            {
                "title": "Log Injected Sleep Duration",
                "skill": "core",
                "goal": "Record rounded sleep duration into log list.",
                "instructions": "Append round(duration, 2) to log list.",
                "function": {
                    "name": "log_sleep",
                    "params": [{"name": "log", "type": "any"}, {"name": "duration", "type": "any"}]
                },
                "starter_code": """class Solution:
    def log_sleep(self, log: list, duration: float) -> list:
        pass
""",
                "tests": [
                    {"args": [[], 1.234], "expected": [1.23]}
                ],
                "solution": """class Solution:
    def log_sleep(self, log: list, duration: float) -> list:
        log.append(round(duration, 2))
        return log
""",
                "hint": "log.append(round(duration, 2))."
            },
            {
                "title": "Evaluate Retry Eligibility",
                "skill": "edge",
                "goal": "Check whether further attempts remain.",
                "instructions": "Return True if attempts < max_attempts else False.",
                "function": {
                    "name": "can_retry",
                    "params": [{"name": "attempts", "type": "any"}, {"name": "max_attempts", "type": "any"}]
                },
                "starter_code": """class Solution:
    def can_retry(self, attempts: int, max_attempts: int) -> bool:
        pass
""",
                "tests": [
                    {"args": [1, 3], "expected": True},
                    {"args": [3, 3], "expected": False}
                ],
                "solution": """class Solution:
    def can_retry(self, attempts: int, max_attempts: int) -> bool:
        return attempts < max_attempts
""",
                "hint": "Check attempts < max_attempts."
            }
        ],
        "hints": [
            "Initialize sleep_log = [] and current_delay = initial_delay.",
            "Loop while attempts < max_attempts.",
            "If attempts <= failures_before_success and attempts < max_attempts, sleep and scale delay."
        ],
        "solution": {
            "code": """class Solution:
    def execute_retry_workflow(self, failures_before_success: int, max_attempts: int, initial_delay: float, backoff_factor: float) -> dict:
        sleep_log = []
        def injected_sleep(duration):
            sleep_log.append(round(duration, 2))
            
        attempts = 0
        current_delay = initial_delay
        success = False
        result = None
        
        while attempts < max_attempts:
            attempts += 1
            if attempts <= failures_before_success:
                # Operation failed
                if attempts < max_attempts:
                    injected_sleep(current_delay)
                    current_delay *= backoff_factor
            else:
                success = True
                result = "Success"
                break
                
        return {
            "success": success,
            "attempts": attempts,
            "delays": sleep_log,
            "result": result,
        }
""",
            "explanation": "Executes exponential backoff retry logic with zero wall-clock delay by recording backoff intervals via an injected sleep function.",
            "time": "O(A) where A is max_attempts (bounded, typically <= 10)",
            "space": "O(A) to store the sleep delay log",
        },
        "pitch_script": """**(Clarify)** "We need to implement an exponential backoff retry workflow with an injected sleep function that records delay intervals deterministically."

**(Basement Insight)** "Coupling retry logic to system wall-clock sleep severely penalizes CI test speed. Injecting the sleep dependency allows instant verification of delay progressions."

**(Solution)** "We track execution attempts. Each failure logs the current delay and scales it by the backoff factor until max_attempts is reached or the operation succeeds."

**(Complexity)** "Executes in O(A) bounded iterations and O(A) space."
""",
        "twist": {
            "lc": 9215,
            "title": "Strategy Pattern for Multiple LLM Inference Providers",
            "why": "Once retry policies are established, structure model providers using the Strategy pattern to decouple inference implementations."
        },
        "viz": {
            "title": "Exponential Backoff Interval Progression"
        }
    }
})

# ------------------------------------------------------------------------------
# W14: OOP Patterns (add 2 lessons)
# ------------------------------------------------------------------------------

# Lesson 10: oop-llm-provider-strategy
LESSONS_4D_4E.append({
    "dir": "14-oop-patterns",
    "world_id": 14,
    "slug": "oop-llm-provider-strategy",
    "lc": 9215,
    "citadel_id": "python_data",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Easy",
    "title": "Strategy Design Pattern for Multi-Model LLM Inference Providers",
    "patterns": ["strategy-pattern", "object-oriented-design", "open-closed-principle", "llm-provider"],
    "visualizer": "system_blueprint",
    "data": {
        "slug": "oop-llm-provider-strategy",
        "lc": 9215,
        "citadel_id": "python_data",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How do enterprise AI backends support multiple LLM vendors (OpenAI, Anthropic, Ollama) without cluttering every API endpoint with massive if-elif-else statements? The Strategy pattern defines a common interface for model execution. Concrete strategy classes encapsulate vendor-specific payloads, while a context gateway dynamically dispatches calls at runtime following the Open-Closed Principle.",
            "brute_force": "Scattering vendor-specific payload logic throughout route handlers, making adding new models risky and messy.",
            "brute_force_complexity": "High code coupling that violates SOLID design principles.",
            "key_insight": "Encapsulating model invocation behind a uniform generate() strategy method allows swapping providers with zero client code modification.",
            "real_world": "LangChain ChatModel abstraction, LiteLLM client routing, and Amazon Bedrock multi-model SDK.",
        },
        "statement": {
            "clean": """Implement the Strategy design pattern for multiple LLM inference providers:
`dispatch_llm_strategy(self, provider: str, prompt: str, model_config: dict = None) -> dict`.

Abstract Strategy Interface:
- `LLMProviderStrategy(ABC)` with `@abstractmethod def generate(self, prompt: str, config: dict) -> dict`.

Concrete Strategy Classes:
1. `OpenAIStrategy`:
   - `model = config.get('model', 'gpt-4o')`
   - `tokens = len(prompt.split()) + 20`
   - Returns: `{'provider': 'openai', 'model': model, 'tokens': tokens, 'response': f'OpenAI: {prompt}'}`
2. `AnthropicStrategy`:
   - `model = config.get('model', 'claude-3-5-sonnet')`
   - `tokens = len(prompt.split()) + 25`
   - Returns: `{'provider': 'anthropic', 'model': model, 'tokens': tokens, 'response': f'Anthropic: {prompt}'}`
3. `OllamaStrategy`:
   - `model = config.get('model', 'llama3')`
   - `tokens = len(prompt.split()) + 15`
   - Returns: `{'provider': 'ollama', 'model': model, 'tokens': tokens, 'response': f'Ollama: {prompt}'}`

Dispatcher Context:
- Look up provider (case-insensitive) in strategy registry.
- If provider is not recognized, return `{'error': f'Unsupported provider: {provider}'}`.
- Otherwise, execute the matching strategy's `generate(prompt, config)` and return its dictionary.""",
            "oa_story": """**SwiftCart Customer Assistant — Multi-Model AI Routing Hub**

SwiftCart's customer chat backend uses OpenAI for real-time recommendations, Anthropic Claude for dispute resolution, and on-premise Ollama for internal employee queries. The early prototype used a 500-line `if vendor == 'openai'` dispatcher that broke whenever parameter names differed.

The staff engineer instructed the team to refactor the inference tier using the Gang of Four Strategy pattern. Implement this extensible LLM provider strategy dispatcher.""",
            "trigger_keywords": ["Strategy design pattern for multiple LLM inference providers", "dispatch_llm_strategy", "OpenAIStrategy"],
            "examples": [
                {
                    "input": "provider = 'openai', prompt = 'Analyze sentiment', model_config = {'model': 'gpt-4o-mini'}",
                    "output": "{'provider': 'openai', 'model': 'gpt-4o-mini', 'tokens': 22, 'response': 'OpenAI: Analyze sentiment'}",
                    "explanation": "OpenAI strategy formats tokens (2 words + 20) and returns standardized payload."
                }
            ],
            "constraints": [
                "provider is a string",
                "prompt is a non-empty string",
            ],
        },
        "constraint_quiz": {
            "prompt": "Which SOLID design principle does the Strategy pattern directly satisfy?",
            "options": [
                "Open-Closed Principle: software entities should be open for extension (adding new strategies), but closed for modification (existing context remains untouched)",
                "Single Responsibility Principle only",
                "Liskov Substitution Principle only",
                "Interface Segregation Principle only"
            ],
            "answer": 0,
            "explanation": "New model providers can be introduced simply by creating a new Strategy class without editing the dispatcher or calling code."
        },
        "pattern_quiz": {
            "prompt": "What role does the context class play in the Strategy pattern?",
            "options": [
                "It maintains a reference to a Strategy object and delegates the algorithmic task to it",
                "It compiles the code to machine instructions",
                "It handles database migrations",
                "It creates thread pools"
            ],
            "answer": 0,
            "explanation": "The context interacts with the client and delegates computation to the active Strategy implementation."
        },
        "function": {
            "name": "dispatch_llm_strategy",
            "params": [
                {"name": "provider", "type": "any"},
                {"name": "prompt", "type": "any"},
                {"name": "model_config", "type": "any"}
            ],
            "returns": "any"
        },
        "starter_code": """class Solution:
    def dispatch_llm_strategy(self, provider: str, prompt: str, model_config: dict = None) -> dict:
        pass
""",
        "tests": [
            {
                "args": ["openai", "Analyze sentiment", {"model": "gpt-4o-mini"}],
                "expected": {
                    "provider": "openai",
                    "model": "gpt-4o-mini",
                    "tokens": 22,
                    "response": "OpenAI: Analyze sentiment",
                },
                "note": "OpenAI strategy execution"
            },
            {
                "args": ["anthropic", "Draft query", {}],
                "expected": {
                    "provider": "anthropic",
                    "model": "claude-3-5-sonnet",
                    "tokens": 27,
                    "response": "Anthropic: Draft query",
                },
                "note": "Anthropic strategy default model execution"
            },
            {
                "args": ["ollama", "Summarize text", {"model": "mistral"}],
                "expected": {
                    "provider": "ollama",
                    "model": "mistral",
                    "tokens": 17,
                    "response": "Ollama: Summarize text",
                },
                "note": "Ollama strategy execution"
            },
            {
                "args": ["unknown_ai", "test", {}],
                "expected": {"error": "Unsupported provider: unknown_ai"},
                "note": "Unsupported provider error guard"
            }
        ],
        "visualize_test": 0,
        "drills": [
            {
                "title": "Strategy Token Counter",
                "skill": "setup",
                "goal": "Calculate mock token estimate.",
                "instructions": "Return len(prompt.split()) + overhead.",
                "function": {
                    "name": "calc_tokens",
                    "params": [{"name": "prompt", "type": "any"}, {"name": "overhead", "type": "any"}]
                },
                "starter_code": """class Solution:
    def calc_tokens(self, prompt: str, overhead: int) -> int:
        pass
""",
                "tests": [
                    {"args": ["hello world", 20], "expected": 22}
                ],
                "solution": """class Solution:
    def calc_tokens(self, prompt: str, overhead: int) -> int:
        return len(prompt.split()) + overhead
""",
                "hint": "Return len(prompt.split()) + overhead."
            },
            {
                "title": "Lookup Provider Strategy",
                "skill": "core",
                "goal": "Fetch strategy from dictionary by name.",
                "instructions": "Return registry.get(name.lower()).",
                "function": {
                    "name": "get_strategy",
                    "params": [{"name": "registry", "type": "any"}, {"name": "name", "type": "any"}]
                },
                "starter_code": """class Solution:
    def get_strategy(self, registry: dict, name: str) -> any:
        pass
""",
                "tests": [
                    {"args": [{"openai": "OpenAIObj"}, "OPENAI"], "expected": "OpenAIObj"}
                ],
                "solution": """class Solution:
    def get_strategy(self, registry: dict, name: str) -> any:
        return registry.get(name.lower())
""",
                "hint": "Use registry.get(name.lower())."
            },
            {
                "title": "Format Strategy Result",
                "skill": "edge",
                "goal": "Build standard inference response dictionary.",
                "instructions": "Return dict with provider, model, tokens, response.",
                "function": {
                    "name": "format_strategy_resp",
                    "params": [{"name": "p", "type": "any"}, {"name": "m", "type": "any"}, {"name": "t", "type": "any"}, {"name": "r", "type": "any"}]
                },
                "starter_code": """class Solution:
    def format_strategy_resp(self, p: str, m: str, t: int, r: str) -> dict:
        pass
""",
                "tests": [
                    {"args": ["openai", "gpt-4o", 25, "resp"], "expected": {"provider": "openai", "model": "gpt-4o", "tokens": 25, "response": "resp"}}
                ],
                "solution": """class Solution:
    def format_strategy_resp(self, p: str, m: str, t: int, r: str) -> dict:
        return {"provider": p, "model": m, "tokens": t, "response": r}
""",
                "hint": "Return dict with the 4 keys."
            }
        ],
        "hints": [
            "Define concrete strategy classes implementing generate(prompt, config).",
            "Store strategy instances in a dictionary keyed by lowercase provider name.",
            "If provider not in dict, return {'error': f'Unsupported provider: {provider}'}."
        ],
        "solution": {
            "code": """from abc import ABC, abstractmethod

class LLMProviderStrategy(ABC):
    @abstractmethod
    def generate(self, prompt: str, config: dict) -> dict:
        pass

class OpenAIStrategy(LLMProviderStrategy):
    def generate(self, prompt: str, config: dict) -> dict:
        model = config.get("model", "gpt-4o")
        return {
            "provider": "openai",
            "model": model,
            "tokens": len(prompt.split()) + 20,
            "response": f"OpenAI: {prompt}",
        }

class AnthropicStrategy(LLMProviderStrategy):
    def generate(self, prompt: str, config: dict) -> dict:
        model = config.get("model", "claude-3-5-sonnet")
        return {
            "provider": "anthropic",
            "model": model,
            "tokens": len(prompt.split()) + 25,
            "response": f"Anthropic: {prompt}",
        }

class OllamaStrategy(LLMProviderStrategy):
    def generate(self, prompt: str, config: dict) -> dict:
        model = config.get("model", "llama3")
        return {
            "provider": "ollama",
            "model": model,
            "tokens": len(prompt.split()) + 15,
            "response": f"Ollama: {prompt}",
        }

class Solution:
    def dispatch_llm_strategy(self, provider: str, prompt: str, model_config: dict = None) -> dict:
        config = model_config or {}
        strategies = {
            "openai": OpenAIStrategy(),
            "anthropic": AnthropicStrategy(),
            "ollama": OllamaStrategy(),
        }
        strat = strategies.get(provider.lower())
        if not strat:
            return {"error": f"Unsupported provider: {provider}"}
        return strat.generate(prompt, config)
""",
            "explanation": "Decouples provider-specific request formats into isolated Strategy classes behind a uniform generate() interface.",
            "time": "O(W) where W is the word count of the prompt",
            "space": "O(1) constant auxiliary space",
        },
        "pitch_script": """**(Clarify)** "We need to structure an LLM inference dispatcher using the Strategy design pattern to support multiple AI vendors."

**(Basement Insight)** "Embedding provider-specific logic directly in controllers violates the Open-Closed Principle. The Strategy pattern encapsulates each vendor into its own class behind a common contract."

**(Solution)** "We define an abstract base strategy with a generate method. Concrete classes implement OpenAI, Anthropic, and Ollama execution. A dictionary dispatcher resolves the provider at runtime."

**(Complexity)** "Executes in O(W) time for string tokenization and O(1) space."
""",
        "twist": {
            "lc": 9216,
            "title": "Observer Pattern Decoupled Event Bus",
            "why": "Once the LLM strategy completes, notify multiple downstream monitoring and billing services via an Observer event bus."
        },
        "viz": {
            "title": "Strategy Pattern Class Diagram & Dispatch Flow"
        }
    }
})

# Lesson 11: oop-observer-event-bus
LESSONS_4D_4E.append({
    "dir": "14-oop-patterns",
    "world_id": 14,
    "slug": "oop-observer-event-bus",
    "lc": 9216,
    "citadel_id": "python_data",
    "brick_layer": 2,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Observer Design Pattern In-Memory Event Bus",
    "patterns": ["observer-pattern", "pub-sub", "event-driven", "object-oriented-design"],
    "visualizer": "system_blueprint",
    "data": {
        "slug": "oop-observer-event-bus",
        "lc": 9216,
        "citadel_id": "python_data",
        "brick_layer": 2,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How do backend architectures decouple order placement from side effects (sending email, updating inventory, alerting fraud detection) without tight class coupling? The Observer pattern (Publish-Subscribe) maintains a registry of listeners per event type. When an event is published, all subscribed observers are notified in sequence without the publisher needing to know their identities.",
            "brute_force": "The order service directly calling EmailService.send(), InventoryService.reserve(), and AnalyticsService.log() synchronously.",
            "brute_force_complexity": "Tight coupling where modifying or adding a side effect requires altering the core order service.",
            "key_insight": "Inverting dependency: the event bus maintains the observer registry so publishers remain completely unaware of consumers.",
            "real_world": "Django signals, Node.js EventEmitter, and microservice message brokers like Kafka and RabbitMQ.",
        },
        "statement": {
            "clean": """Implement the Observer design pattern event bus:
`simulate_event_pipeline(self, operations: list[dict]) -> list[dict]`.

EventBus Specifications:
- `subscribe(event_type: str, listener_id: str)`: registers a listener for an event type. If already subscribed, do not add duplicates.
- `unsubscribe(event_type: str, listener_id: str)`: removes listener from that event type if present.
- `publish(event_type: str, payload: dict) -> list[dict]`: notifies all current listeners registered for `event_type` in chronological registration order. For each listener, records a delivery receipt:
  `{'event_type': event_type, 'listener_id': listener_id, 'payload': payload}`.

Operations List:
- Input is a list of sequential action dicts:
  - `{'action': 'subscribe', 'event_type': '...', 'listener_id': '...'}`
  - `{'action': 'unsubscribe', 'event_type': '...', 'listener_id': '...'}`
  - `{'action': 'publish', 'event_type': '...', 'payload': {...}}`

Return Value:
- Return the list of all delivery receipts produced across all `'publish'` operations in chronological order.""",
            "oa_story": """**KiranaKart Checkout Engine — Decoupled Event Notification Bus**

Whenever a KiranaKart customer places an order, multiple downstream systems must react: warehouse inventory reservation, push notification dispatch, loyalty coin crediting, and fraud evaluation. Earlier code invoked all these services directly inside the checkout endpoint. If the push notification service stalled, checkout transactions timed out.

The platform team decoupled checkout using an in-memory Observer event bus. Implement this pub-sub event bus.""",
            "trigger_keywords": ["Observer design pattern event bus", "simulate_event_pipeline", "listener_id"],
            "examples": [
                {
                    "input": "operations = [{'action': 'subscribe', 'event_type': 'order_created', 'listener_id': 'email'}, {'action': 'publish', 'event_type': 'order_created', 'payload': {'id': 1}}]",
                    "output": "[{'event_type': 'order_created', 'listener_id': 'email', 'payload': {'id': 1}}]",
                    "explanation": "Event published to the single registered listener email."
                }
            ],
            "constraints": [
                "0 <= len(operations) <= 100",
                "action in ['subscribe', 'unsubscribe', 'publish']",
            ],
        },
        "constraint_quiz": {
            "prompt": "What major design benefit does the Observer pattern provide to distributed systems?",
            "options": [
                "Loose coupling: publishers emit events without knowing how many or which observers exist",
                "Guaranteed zero network latency",
                "Automatic database compression",
                "Elimination of all exception handling"
            ],
            "answer": 0,
            "explanation": "Publishers and subscribers remain mutually independent. Observers can be added, removed, or scaled dynamically without altering the publisher."
        },
        "pattern_quiz": {
            "prompt": "What data structure typically represents the observer registry inside an EventBus?",
            "options": [
                "A dictionary mapping event types (keys) to lists or sets of registered listeners (values)",
                "A binary search tree of integers",
                "A circular linked list of file descriptors",
                "A fixed-size byte array"
            ],
            "answer": 0,
            "explanation": "A hash map of event_type -> list of listeners allows O(1) lookup of interested listeners upon event publication."
        },
        "function": {
            "name": "simulate_event_pipeline",
            "params": [
                {"name": "operations", "type": "any"}
            ],
            "returns": "any"
        },
        "starter_code": """class Solution:
    def simulate_event_pipeline(self, operations: list[dict]) -> list[dict]:
        pass
""",
        "tests": [
            {
                "args": [
                    [
                        {"action": "subscribe", "event_type": "order_created", "listener_id": "email_service"},
                        {"action": "subscribe", "event_type": "order_created", "listener_id": "analytics_tracker"},
                        {"action": "publish", "event_type": "order_created", "payload": {"order_id": 101, "total": 450}},
                    ]
                ],
                "expected": [
                    {"event_type": "order_created", "listener_id": "email_service", "payload": {"order_id": 101, "total": 450}},
                    {"event_type": "order_created", "listener_id": "analytics_tracker", "payload": {"order_id": 101, "total": 450}},
                ],
                "note": "Subscribe multiple listeners and publish"
            },
            {
                "args": [
                    [
                        {"action": "subscribe", "event_type": "user_signup", "listener_id": "welcome_email"},
                        {"action": "unsubscribe", "event_type": "user_signup", "listener_id": "welcome_email"},
                        {"action": "publish", "event_type": "user_signup", "payload": {"user": "aarav"}},
                    ]
                ],
                "expected": [],
                "note": "Unsubscribe listener before publish yields empty deliveries"
            },
            {
                "args": [
                    [
                        {"action": "publish", "event_type": "metric_flush", "payload": {"count": 10}},
                    ]
                ],
                "expected": [],
                "note": "Publishing with no registered subscribers produces no receipts"
            }
        ],
        "visualize_test": 0,
        "drills": [
            {
                "title": "Register Subscriber",
                "skill": "setup",
                "goal": "Add listener to list without duplicates.",
                "instructions": "If listener not in listeners, append it.",
                "function": {
                    "name": "add_listener",
                    "params": [{"name": "listeners", "type": "any"}, {"name": "listener", "type": "any"}]
                },
                "starter_code": """class Solution:
    def add_listener(self, listeners: list, listener: str) -> list:
        pass
""",
                "tests": [
                    {"args": [["a"], "b"], "expected": ["a", "b"]},
                    {"args": [["a"], "a"], "expected": ["a"]}
                ],
                "solution": """class Solution:
    def add_listener(self, listeners: list, listener: str) -> list:
        if listener not in listeners:
            listeners.append(listener)
        return listeners
""",
                "hint": "Check if listener not in listeners."
            },
            {
                "title": "Dispatch Event to Listeners",
                "skill": "core",
                "goal": "Generate delivery notifications for all listeners.",
                "instructions": "Return list of dicts with event_type, listener_id, payload.",
                "function": {
                    "name": "notify_all",
                    "params": [{"name": "listeners", "type": "any"}, {"name": "ev", "type": "any"}, {"name": "payload", "type": "any"}]
                },
                "starter_code": """class Solution:
    def notify_all(self, listeners: list, ev: str, payload: dict) -> list:
        pass
""",
                "tests": [
                    {"args": [["l1"], "ev1", {"x": 1}], "expected": [{"event_type": "ev1", "listener_id": "l1", "payload": {"x": 1}}]}
                ],
                "solution": """class Solution:
    def notify_all(self, listeners: list, ev: str, payload: dict) -> list:
        return [{"event_type": ev, "listener_id": l, "payload": payload} for l in listeners]
""",
                "hint": "List comprehension over listeners."
            },
            {
                "title": "Unsubscribe Listener",
                "skill": "edge",
                "goal": "Safely remove listener from list.",
                "instructions": "Return [l for l in listeners if l != target].",
                "function": {
                    "name": "remove_listener",
                    "params": [{"name": "listeners", "type": "any"}, {"name": "target", "type": "any"}]
                },
                "starter_code": """class Solution:
    def remove_listener(self, listeners: list, target: str) -> list:
        pass
""",
                "tests": [
                    {"args": [["a", "b"], "a"], "expected": ["b"]}
                ],
                "solution": """class Solution:
    def remove_listener(self, listeners: list, target: str) -> list:
        return [l for l in listeners if l != target]
""",
                "hint": "Filter out target listener."
            }
        ],
        "hints": [
            "Maintain self.subscribers = {} mapping event_type to list of listener_ids.",
            "On subscribe, append listener if not present; on unsubscribe, filter out listener.",
            "On publish, generate notification receipts for each subscriber and accumulate them."
        ],
        "solution": {
            "code": """class EventBus:
    def __init__(self):
        self.subscribers = {}
        
    def subscribe(self, event_type: str, listener_id: str):
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        if listener_id not in self.subscribers[event_type]:
            self.subscribers[event_type].append(listener_id)
            
    def unsubscribe(self, event_type: str, listener_id: str):
        if event_type in self.subscribers:
            self.subscribers[event_type] = [l for l in self.subscribers[event_type] if l != listener_id]
            
    def publish(self, event_type: str, payload: dict) -> list[dict]:
        notifications = []
        listeners = self.subscribers.get(event_type, [])
        for listener in listeners:
            notifications.append({
                "event_type": event_type,
                "listener_id": listener,
                "payload": payload,
            })
        return notifications

class Solution:
    def simulate_event_pipeline(self, operations: list[dict]) -> list[dict]:
        bus = EventBus()
        all_notifications = []
        
        for op in operations:
            action = op.get("action")
            ev_type = op.get("event_type")
            if action == "subscribe":
                bus.subscribe(ev_type, op.get("listener_id"))
            elif action == "unsubscribe":
                bus.unsubscribe(ev_type, op.get("listener_id"))
            elif action == "publish":
                notes = bus.publish(ev_type, op.get("payload", {}))
                all_notifications.extend(notes)
                
        return all_notifications
""",
            "explanation": "Implements an in-memory Observer event bus managing dynamic subscriptions and chronological notification delivery.",
            "time": "O(N * L) where N is operations count and L is average subscriber count",
            "space": "O(S + D) for subscriber registry and delivery logs",
        },
        "pitch_script": """**(Clarify)** "We need to implement the Observer design pattern via an in-memory EventBus that manages event subscriptions and generates delivery notifications on publish."

**(Basement Insight)** "Directly wiring producers to consumers creates brittle coupling. The Observer pattern isolates producers, allowing independent subscriber registration."

**(Solution)** "We track subscriptions in an event map. When publish is called, we broadcast the payload to all registered listeners and log the delivery receipt."

**(Complexity)** "Executes in O(N * L) time and O(S + D) space."
""",
        "twist": {
            "lc": 9225,
            "title": "Safe Nested JSON Path Resolver Without KeyError",
            "why": "Once events are received, extract deeply nested payload properties safely without KeyError exceptions."
        },
        "viz": {
            "title": "Observer Pattern Pub-Sub Event Bus Architecture"
        }
    }
})

# ------------------------------------------------------------------------------
# W15: File Processing (add 1 lesson)
# ------------------------------------------------------------------------------

# Lesson 12: safe-nested-json-resolver
LESSONS_4D_4E.append({
    "dir": "15-file-processing",
    "world_id": 15,
    "slug": "safe-nested-json-resolver",
    "lc": 9225,
    "citadel_id": "python_data",
    "brick_layer": 3,
    "runner_type": "python_practical",
    "difficulty": "Easy",
    "title": "Safe Nested JSON Path Resolver Without KeyError or IndexError",
    "patterns": ["json-parsing", "path-traversal", "defensive-programming", "safe-navigation"],
    "visualizer": "system_blueprint",
    "data": {
        "slug": "safe-nested-json-resolver",
        "lc": 9225,
        "citadel_id": "python_data",
        "brick_layer": 3,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "How do backend data ingestion pipelines extract values from deeply nested third-party JSON payloads without crashing on KeyError, IndexError, or TypeError? In production API payloads, intermediate objects are frequently None or missing (e.g. data['user']['billing']['address']['city'] raises KeyError when billing is absent). A safe path resolver navigates dot-delimited paths with default fallback.",
            "brute_force": "Writing deeply nested try-except KeyError blocks around every dictionary lookup across ETL scripts.",
            "brute_force_complexity": "Bloated boilerplate code that obscures business transformation logic.",
            "key_insight": "Tokenizing dot-delimited path expressions and stepping iteratively through dicts and list indices safely returns the default value upon any navigation failure.",
            "real_world": "Lodash _.get in JavaScript, Glom in Python, and Kafka event stream payload transformations.",
        },
        "statement": {
            "clean": """Implement safe nested JSON navigation without KeyError or IndexError:
`safe_resolve_path(self, data: dict | list, path: str, default: any = None) -> any`.

Inputs:
- `data`: arbitrary nested dictionary or list
- `path`: dot-delimited path string, supporting dictionary keys and list index numbers (e.g. `'user.profile.address.city'`, `'orders.0.items.1.name'`)
- `default`: value returned if any key or index is missing or non-traversable (default `None`)

Navigation Rules:
1. If `path` is empty string `''`, return `data`.
2. Split `path` by `'.'` to extract `tokens`.
3. Iterate through `tokens`:
   - If current target is a `dict`:
     - If `token` in `target`: advance `current = target[token]`.
     - Otherwise: return `default`.
   - If current target is a `list`:
     - If `token.isdigit()`:
       `idx = int(token)`
       - If `0 <= idx < len(target)`: advance `current = target[idx]`.
       - Otherwise: return `default`.
     - Otherwise: return `default`.
   - If current target is neither `dict` nor `list` (e.g. `None`, `int`, `str`), and more tokens remain:
     return `default`.
4. Return the resolved final value.""",
            "oa_story": """**PayLoop Merchant Webhook — Polymorphic JSON Telemetry Extractor**

PayLoop receives settlement webhooks from 40 different partner banks across India. Each bank formats payload trees slightly differently: some place terminal coordinates at `event.payload.merchant.terminal_id`, while others omit the `merchant` block entirely when settlements are aborted.

Hardcoded dict lookups triggered frequent `KeyError: 'merchant'` unhandled exceptions in the ingestion worker. The platform team built a safe JSON path resolver to extract fields with fallback defaults. Implement this resolver.""",
            "trigger_keywords": ["safe nested JSON navigation without KeyError", "safe_resolve_path", "tokens"],
            "examples": [
                {
                    "input": "data = {'user': {'profile': {'address': {'city': 'Bengaluru'}}}}, path = 'user.profile.address.city', default = 'N/A'",
                    "output": "'Bengaluru'",
                    "explanation": "Traverses 4 nested dictionary levels to retrieve city."
                },
                {
                    "input": "data = {'items': [{'id': 'item1'}, {'id': 'item2'}]}, path = 'items.1.id', default = None",
                    "output": "'item2'",
                    "explanation": "Traverses list index 1 and dictionary key id."
                }
            ],
            "constraints": [
                "path is a string of dot-separated alphanumeric tokens",
                "default can be any value",
            ],
        },
        "constraint_quiz": {
            "prompt": "What should the safe path resolver return if an intermediate value in the path is None?",
            "options": [
                "The default value, because None is neither a dict nor a list and cannot be traversed further",
                "Raise an unhandled TypeError",
                "Return an empty dictionary",
                "Convert None into string 'null'"
            ],
            "answer": 0,
            "explanation": "When an intermediate node is None, attempting key or index lookups would crash with TypeError; returning default provides safe defensive navigation."
        },
        "pattern_quiz": {
            "prompt": "Which common utility function in standard web libraries implements this exact safe navigation pattern?",
            "options": [
                "Lodash _.get() in JavaScript and dict.get chained traversal in Python",
                "Binary search",
                "Quicksort partition",
                "Dijkstra's shortest path"
            ],
            "answer": 0,
            "explanation": "Lodash _.get(object, path, defaultValue) is the classic JavaScript pattern for safe deep object navigation."
        },
        "function": {
            "name": "safe_resolve_path",
            "params": [
                {"name": "data", "type": "any"},
                {"name": "path", "type": "any"},
                {"name": "default", "type": "any"}
            ],
            "returns": "any"
        },
        "starter_code": """class Solution:
    def safe_resolve_path(self, data: dict | list, path: str, default: any = None) -> any:
        pass
""",
        "tests": [
            {
                "args": [{"user": {"profile": {"address": {"city": "Bengaluru"}}}}, "user.profile.address.city", "N/A"],
                "expected": "Bengaluru",
                "note": "Deep dictionary traversal"
            },
            {
                "args": [{"items": [{"id": "item1"}, {"id": "item2"}]}, "items.1.id", None],
                "expected": "item2",
                "note": "Combined list indexing and dict access"
            },
            {
                "args": [{"user": {"name": "Priya"}}, "user.settings.theme", "dark"],
                "expected": "dark",
                "note": "Missing key returns default"
            },
            {
                "args": [{"users": ["Aarav"]}, "users.5.email", "not_found"],
                "expected": "not_found",
                "note": "Out of range list index returns default"
            }
        ],
        "visualize_test": 0,
        "drills": [
            {
                "title": "Split Path Tokens",
                "skill": "setup",
                "goal": "Split string by dot delimiter.",
                "instructions": "Return path.split('.') if path else [].",
                "function": {
                    "name": "parse_tokens",
                    "params": [{"name": "path", "type": "any"}]
                },
                "starter_code": """class Solution:
    def parse_tokens(self, path: str) -> list:
        pass
""",
                "tests": [
                    {"args": ["a.b.c"], "expected": ["a", "b", "c"]},
                    {"args": [""], "expected": []}
                ],
                "solution": """class Solution:
    def parse_tokens(self, path: str) -> list:
        return path.split(".") if path else []
""",
                "hint": "path.split('.') if path else []."
            },
            {
                "title": "Traverse Dictionary Token",
                "skill": "core",
                "goal": "Safely advance one dict level.",
                "instructions": "Return d[token] if isinstance(d, dict) and token in d else default.",
                "function": {
                    "name": "step_dict",
                    "params": [{"name": "d", "type": "any"}, {"name": "token", "type": "any"}, {"name": "default", "type": "any"}]
                },
                "starter_code": """class Solution:
    def step_dict(self, d: dict, token: str, default: any) -> any:
        pass
""",
                "tests": [
                    {"args": [{"a": 1}, "a", None], "expected": 1},
                    {"args": [{"a": 1}, "b", "missing"], "expected": "missing"}
                ],
                "solution": """class Solution:
    def step_dict(self, d: dict, token: str, default: any) -> any:
        return d[token] if isinstance(d, dict) and token in d else default
""",
                "hint": "Check token in d."
            },
            {
                "title": "Traverse List Index",
                "skill": "edge",
                "goal": "Safely advance list index.",
                "instructions": "If token isdigit and 0 <= int(token) < len(lst), return lst[int(token)] else default.",
                "function": {
                    "name": "step_list",
                    "params": [{"name": "lst", "type": "any"}, {"name": "token", "type": "any"}, {"name": "default", "type": "any"}]
                },
                "starter_code": """class Solution:
    def step_list(self, lst: list, token: str, default: any) -> any:
        pass
""",
                "tests": [
                    {"args": [["x", "y"], "1", None], "expected": "y"},
                    {"args": [["x", "y"], "5", "out"], "expected": "out"}
                ],
                "solution": """class Solution:
    def step_list(self, lst: list, token: str, default: any) -> any:
        if isinstance(lst, list) and token.isdigit():
            idx = int(token)
            if 0 <= idx < len(lst):
                return lst[idx]
        return default
""",
                "hint": "Verify token.isdigit() and bound checks."
            }
        ],
        "hints": [
            "Return data immediately if path is empty.",
            "Iterate tokens from path.split('.').",
            "Handle isinstance(current, dict) and isinstance(current, list); return default on lookup failure."
        ],
        "solution": {
            "code": """class Solution:
    def safe_resolve_path(self, data: dict | list, path: str, default: any = None) -> any:
        if not path:
            return data
            
        tokens = path.split(".")
        current = data
        
        for token in tokens:
            if isinstance(current, dict):
                if token in current:
                    current = current[token]
                else:
                    return default
            elif isinstance(current, list):
                if token.isdigit():
                    idx = int(token)
                    if 0 <= idx < len(current):
                        current = current[idx]
                    else:
                        return default
                else:
                    return default
            else:
                return default
                
        return current
""",
            "explanation": "Traverses nested collections iteratively, checking types and bounds at every step to prevent KeyError or IndexError crashes.",
            "time": "O(T) where T is the number of tokens in the path",
            "space": "O(T) to store parsed path tokens",
        },
        "pitch_script": """**(Clarify)** "We need to safely navigate deep nested JSON trees supporting dot-separated dictionary keys and list index tokens with fallback defaults."

**(Basement Insight)** "Relying on direct dictionary indexing crashes when payloads are sparse or irregular. A robust path resolver traverses step-by-step with defensive type and boundary checks."

**(Solution)** "We split the path on dots and advance through dicts or lists sequentially. If a key is missing or index out of range, we return the default value safely."

**(Complexity)** "Executes in O(T) time where T is token depth, using O(T) space."
""",
        "twist": {
            "lc": 9236,
            "title": "Pandas Merge and GroupBy P95 Latency Aggregation",
            "why": "Once individual telemetry events are parsed, aggregate high-cardinality metrics in Pandas across model providers."
        },
        "viz": {
            "title": "Nested JSON Path Traversal & Fallback Tree"
        }
    }
})

# ------------------------------------------------------------------------------
# W16: Practical Pandas (add 1 lesson)
# ------------------------------------------------------------------------------

# Lesson 13: pandas-merge-groupby-p95-latency
LESSONS_4D_4E.append({
    "dir": "16-practical-pandas",
    "world_id": 16,
    "slug": "pandas-merge-groupby-p95-latency",
    "lc": 9236,
    "citadel_id": "python_data",
    "brick_layer": 4,
    "runner_type": "python_practical",
    "difficulty": "Medium",
    "title": "Pandas Relational Merge and GroupBy P95 Tail Latency Aggregation",
    "patterns": ["pandas", "merge", "groupby", "quantile-p95", "data-analytics"],
    "visualizer": "dataframe_pipeline",
    "data": {
        "slug": "pandas-merge-groupby-p95-latency",
        "lc": 9236,
        "citadel_id": "python_data",
        "brick_layer": 4,
        "runner_type": "python_practical",
        "concept": {
            "problem_it_solves": "Why do average response times hide critical production service slowdowns? In LLM inference serving, 95% of queries may complete in 200ms while the slowest 5% stall for 12 seconds due to queue queuing and model timeouts. Mean metrics completely mask this tail latency. Production telemetry analysis requires calculating the 95th percentile (P95) latency per model provider using Pandas relational joins and group-by quantiles.",
            "brute_force": "Writing custom Python nested loops with sorting to manually compute quantiles across disparate relational lists.",
            "brute_force_complexity": "High memory consumption and slow non-vectorized Python execution.",
            "key_insight": "Combining pd.merge with groupby(['model_name', 'provider']).apply(quantile(0.95)) computes vectorized statistical percentiles at C-speed.",
            "real_world": "Datadog APM metrics, Langfuse LLM observability dashboards, and Arize AI model monitoring.",
        },
        "statement": {
            "clean": """Implement Pandas relational merge and group-by percentile latency aggregation:
`compute_model_p95_latencies(self, requests_data: list[dict], models_data: list[dict]) -> list[dict]`.

Inputs:
- `requests_data`: list of inference request records:
  `[{'request_id': str, 'model_id': str, 'latency_ms': float}, ...]`
- `models_data`: list of model metadata records:
  `[{'model_id': str, 'model_name': str, 'provider': str}, ...]`

Analytics Workflow:
1. If either `requests_data` or `models_data` is empty, return `[]`.
2. Convert records into Pandas DataFrames `req_df` and `mod_df`.
3. Perform an inner merge on `'model_id'`. If merged result is empty, return `[]`.
4. Group by `['model_name', 'provider']`.
5. Aggregate metrics for each group:
   - `'request_count'`: total request count (`int`)
   - `'p95_latency'`: 95th percentile of `latency_ms` using `quantile(0.95)`, rounded to 2 decimal places (`float`)
   - `'mean_latency'`: average of `latency_ms`, rounded to 2 decimal places (`float`)
6. Sort result DataFrame:
   - Primary: `'p95_latency'` descending
   - Secondary (tie-breaker): `'model_name'` alphabetically ascending
7. Return records as list of dicts:
   `[{'model_name': ..., 'provider': ..., 'request_count': ..., 'p95_latency': ..., 'mean_latency': ...}, ...]`.""",
            "oa_story": """**Drizz Vision AI — Mobile Farm Inference Latency Analytics**

Drizz runs automated mobile device test suites backed by multiple vision LLMs (Claude-Sonnet, GPT-4o, and Gemini Flash). During automated test bursts across 100 Android devices in Bengaluru, users reported intermittent UI assertion timeouts.

While average latency showed 185ms, P95 tail latency exceeded 2,400ms on specific models due to GPU cold starts. The infrastructure engineer wrote a Pandas pipeline to merge request telemetry with model metadata and calculate P95 latencies. Implement this analytical pipeline.""",
            "trigger_keywords": ["Pandas relational merge and group-by percentile latency aggregation", "compute_model_p95_latencies", "requests_data"],
            "examples": [
                {
                    "input": "requests_data = [{'request_id': 'r1', 'model_id': 'm1', 'latency_ms': 120.0}, {'request_id': 'r2', 'model_id': 'm1', 'latency_ms': 250.0}], models_data = [{'model_id': 'm1', 'model_name': 'Claude-Sonnet', 'provider': 'Anthropic'}]",
                    "output": "[{'model_name': 'Claude-Sonnet', 'provider': 'Anthropic', 'request_count': 2, 'p95_latency': 243.5, 'mean_latency': 185.0}]",
                    "explanation": "Calculates 2 requests, 95th percentile 243.5ms, and mean 185.0ms."
                }
            ],
            "constraints": [
                "0 <= len(requests_data) <= 10^4",
                "0 <= len(models_data) <= 100",
                "latency_ms > 0",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why is P95 latency a better reliability metric than mean latency for web APIs?",
            "options": [
                "Mean latency averages out extreme spikes; P95 directly measures the degraded experience encountered by the slowest 5% of requests",
                "P95 latency is always smaller than the mean",
                "P95 can only be calculated on binary numbers",
                "P95 requires zero RAM"
            ],
            "answer": 0,
            "explanation": "Mean metrics are skewed by normal fast responses. Percentiles (P95/P99) expose real-world tail latencies caused by garbage collection, throttling, or cold starts."
        },
        "pattern_quiz": {
            "prompt": "In Pandas, which method computes arbitrary percentile thresholds on a Series or GroupBy object?",
            "options": [
                ".quantile(q) where q is between 0.0 and 1.0 (e.g. 0.95 for P95)",
                ".percentile()",
                ".median_high()",
                ".sample_tail()"
            ],
            "answer": 0,
            "explanation": "pd.Series.quantile(0.95) computes the 95th percentile value using linear interpolation."
        },
        "function": {
            "name": "compute_model_p95_latencies",
            "params": [
                {"name": "requests_data", "type": "any"},
                {"name": "models_data", "type": "any"}
            ],
            "returns": "any"
        },
        "starter_code": """class Solution:
    def compute_model_p95_latencies(self, requests_data: list[dict], models_data: list[dict]) -> list[dict]:
        pass
""",
        "tests": [
            {
                "args": [
                    [
                        {"request_id": "r1", "model_id": "m1", "latency_ms": 120.0},
                        {"request_id": "r2", "model_id": "m1", "latency_ms": 250.0},
                        {"request_id": "r3", "model_id": "m2", "latency_ms": 80.0},
                        {"request_id": "r4", "model_id": "m2", "latency_ms": 95.0},
                    ],
                    [
                        {"model_id": "m1", "model_name": "Claude-Sonnet", "provider": "Anthropic"},
                        {"model_id": "m2", "model_name": "GPT-4o", "provider": "OpenAI"},
                    ]
                ],
                "expected": [
                    {"model_name": "Claude-Sonnet", "provider": "Anthropic", "request_count": 2, "p95_latency": 243.5, "mean_latency": 185.0},
                    {"model_name": "GPT-4o", "provider": "OpenAI", "request_count": 2, "p95_latency": 94.25, "mean_latency": 87.5},
                ],
                "note": "Multi-model merge and P95 aggregation"
            },
            {
                "args": [[], [{"model_id": "m1", "model_name": "GPT", "provider": "OpenAI"}]],
                "expected": [],
                "note": "Empty requests returns empty list"
            },
            {
                "args": [
                    [
                        {"request_id": "r1", "model_id": "m1", "latency_ms": 100.0},
                    ],
                    [
                        {"model_id": "m1", "model_name": "Llama-3", "provider": "Meta"},
                    ]
                ],
                "expected": [
                    {"model_name": "Llama-3", "provider": "Meta", "request_count": 1, "p95_latency": 100.0, "mean_latency": 100.0},
                ],
                "note": "Single request computes exact latency as P95 and mean"
            }
        ],
        "visualize_test": 0,
        "drills": [
            {
                "title": "Inner Merge DataFrames",
                "skill": "setup",
                "goal": "Join two record lists on model_id key.",
                "instructions": "Convert lists to DataFrames, merge on 'model_id', and return records.",
                "function": {
                    "name": "merge_frames",
                    "params": [{"name": "df1", "type": "any"}, {"name": "df2", "type": "any"}]
                },
                "starter_code": """import pandas as pd
class Solution:
    def merge_frames(self, df1: list, df2: list) -> list:
        pass
""",
                "tests": [
                    {"args": [[{"model_id": "m1", "val": 10}], [{"model_id": "m1", "name": "M1"}]], "expected": [{"model_id": "m1", "val": 10, "name": "M1"}]}
                ],
                "solution": """import pandas as pd
class Solution:
    def merge_frames(self, df1: list, df2: list) -> list:
        d1 = pd.DataFrame(df1)
        d2 = pd.DataFrame(df2)
        merged = pd.merge(d1, d2, on="model_id", how="inner")
        return merged.to_dict(orient="records")
""",
                "hint": "Convert to DataFrames, pd.merge on model_id, return to_dict('records')."
            },
            {
                "title": "Compute Series Quantile",
                "skill": "core",
                "goal": "Calculate 95th percentile of numeric series.",
                "instructions": "Return round(float(series.quantile(0.95)), 2).",
                "function": {
                    "name": "calc_p95",
                    "params": [{"name": "vals", "type": "any"}]
                },
                "starter_code": """import pandas as pd
class Solution:
    def calc_p95(self, vals: list) -> float:
        pass
""",
                "tests": [
                    {"args": [[100.0, 200.0]], "expected": 195.0}
                ],
                "solution": """import pandas as pd
class Solution:
    def calc_p95(self, vals: list) -> float:
        return round(float(pd.Series(vals).quantile(0.95)), 2)
""",
                "hint": "Use pd.Series(vals).quantile(0.95)."
            },
            {
                "title": "Sort Aggregated DataFrame",
                "skill": "edge",
                "goal": "Sort by p95_latency descending, model_name ascending.",
                "instructions": "Use sort_values(by=['p95_latency', 'model_name'], ascending=[False, True]).",
                "function": {
                    "name": "sort_metrics",
                    "params": [{"name": "records", "type": "any"}]
                },
                "starter_code": """import pandas as pd
class Solution:
    def sort_metrics(self, records: list) -> list:
        pass
""",
                "tests": [
                    {"args": [[{"model_name": "B", "p95_latency": 100.0}, {"model_name": "A", "p95_latency": 200.0}]], "expected": [{"model_name": "A", "p95_latency": 200.0}, {"model_name": "B", "p95_latency": 100.0}]}
                ],
                "solution": """import pandas as pd
class Solution:
    def sort_metrics(self, records: list) -> list:
        df = pd.DataFrame(records)
        df.sort_values(by=["p95_latency", "model_name"], ascending=[False, True], inplace=True)
        return df.to_dict(orient="records")
""",
                "hint": "Sort by p95_latency desc, model_name asc."
            }
        ],
        "hints": [
            "Check for empty inputs and return [] immediately.",
            "Convert to DataFrames and merge on 'model_id'.",
            "Group by ['model_name', 'provider'] and compute count, quantile(0.95), and mean."
        ],
        "solution": {
            "code": """import pandas as pd

class Solution:
    def compute_model_p95_latencies(self, requests_data: list[dict], models_data: list[dict]) -> list[dict]:
        if not requests_data or not models_data:
            return []
            
        req_df = pd.DataFrame(requests_data)
        mod_df = pd.DataFrame(models_data)
        
        merged = pd.merge(req_df, mod_df, on="model_id", how="inner")
        if merged.empty:
            return []
            
        def agg_stats(group):
            return pd.Series({
                "request_count": int(len(group)),
                "p95_latency": round(float(group["latency_ms"].quantile(0.95)), 2),
                "mean_latency": round(float(group["latency_ms"].mean()), 2),
            })
            
        grouped = merged.groupby(["model_name", "provider"], as_index=False).apply(agg_stats)
        grouped.sort_values(by=["p95_latency", "model_name"], ascending=[False, True], inplace=True)
        
        result = []
        for _, row in grouped.iterrows():
            result.append({
                "model_name": str(row["model_name"]),
                "provider": str(row["provider"]),
                "request_count": int(row["request_count"]),
                "p95_latency": float(row["p95_latency"]),
                "mean_latency": float(row["mean_latency"]),
            })
        return result
""",
            "explanation": "Merges request telemetry with metadata in Pandas, grouping by model and provider to compute statistical tail latency percentiles.",
            "time": "O(N + M + G log G) where N is requests, M is models, and G is grouped models",
            "space": "O(N + M) for dataframes and grouped aggregations",
        },
        "pitch_script": """**(Clarify)** "We need to analyze AI inference request telemetry by merging it with model metadata and calculating P95 tail latency along with average and volume metrics."

**(Basement Insight)** "Average latency masks severe tail latency degradation. Grouping requests and computing quantile(0.95) exposes the experience of the slowest 5% of users."

**(Solution)** "We load requests and models into Pandas DataFrames, inner-merge on model_id, and group by model_name and provider. We calculate count, P95 quantile, and mean, sorting by P95 descending."

**(Complexity)** "Executes in O(N + M) vectorized time and O(N + M) space."
""",
        "twist": {
            "lc": 9235,
            "title": "Pandas Dense Ranking and Window Rolling Averages",
            "why": "Instead of static aggregations, calculate rolling 1-hour window quantiles over time-series telemetry streams."
        },
        "viz": {
            "title": "Pandas Relational Merge & P95 Quantile Grouping Pipeline"
        }
    }
})

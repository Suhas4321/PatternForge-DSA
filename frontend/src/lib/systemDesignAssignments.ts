export interface AssignmentTestCase {
  label: string
  args: unknown[]
  expected: unknown
}

export interface SystemDesignAssignmentSpec {
  id: string
  workedExampleTitle: string
  workedExampleExplanation: string
  workedExampleCode: string
  scenarioTitle: string
  scenarioPrompt: string
  functionName: string
  starterCode: string
  solutionCode: string
  hint: string
  testCases: AssignmentTestCase[]
}

export const SYSTEM_DESIGN_ASSIGNMENTS: Record<string, SystemDesignAssignmentSpec> = {
  'solid-S': {
    id: 'solid-S',
    workedExampleTitle: 'Scenario 1 (Worked Example): Splitting a God OrderService',
    workedExampleExplanation:
      'In Scenario 1, OrderService previously mixed cart tax calculation, SQL persistence, and email formatting in one method. We separate pure calculation (calculate_subtotal) from formatting (format_receipt) so each function has a single reason to change.',
    workedExampleCode: `def calculate_subtotal(prices: list[int], tax_pct: int) -> int:
    base = sum(prices)
    return base + (base * tax_pct) // 100

def format_receipt(customer: str, total: int) -> str:
    return f"Receipt for {customer}: {total}"

def process_order(customer: str, prices: list[int], tax_pct: int) -> str:
    total = calculate_subtotal(prices, tax_pct)
    return format_receipt(customer, total)`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Refactor Employee Payroll Pipeline (SRP)',
    scenarioPrompt:
      'Apply the exact same Single Responsibility pattern to an employee payroll pipeline. Complete `filter_billable_hours(hours)` (keep only hours > 0) and `compute_payout(hours, hourly_rate)` so `generate_payslip(name, hours, hourly_rate)` delegates to both helpers instead of mixing filtering, math, and string formatting.',
    functionName: 'generate_payslip',
    starterCode: `def filter_billable_hours(hours: list[int]) -> list[int]:
    # TODO: Return only positive hours (h > 0)
    pass

def compute_payout(valid_hours: list[int], hourly_rate: int) -> int:
    # TODO: Return sum of valid_hours multiplied by hourly_rate
    pass

def generate_payslip(name: str, hours: list[int], hourly_rate: int) -> str:
    valid = filter_billable_hours(hours)
    total = compute_payout(valid, hourly_rate)
    return f"{name}: \${total}"
`,
    solutionCode: `def filter_billable_hours(hours: list[int]) -> list[int]:
    return [h for h in hours if h > 0]

def compute_payout(valid_hours: list[int], hourly_rate: int) -> int:
    return sum(valid_hours) * hourly_rate

def generate_payslip(name: str, hours: list[int], hourly_rate: int) -> str:
    valid = filter_billable_hours(hours)
    total = compute_payout(valid, hourly_rate)
    return f"{name}: \${total}"
`,
    hint: 'Use `[h for h in hours if h > 0]` in `filter_billable_hours` and `sum(valid_hours) * hourly_rate` in `compute_payout`.',
    testCases: [
      { label: 'Standard week with negative adjustment', args: ['Alice', [8, 0, -2, 6, 8], 50], expected: 'Alice: $1100' },
      { label: 'All zero/negative hours', args: ['Bob', [0, -5], 40], expected: 'Bob: $0' },
      { label: 'Single overtime day', args: ['Cara', [10], 75], expected: 'Cara: $750' },
    ],
  },

  'solid-O': {
    id: 'solid-O',
    workedExampleTitle: 'Scenario 1 (Worked Example): Payment Gateway Strategy Registry',
    workedExampleExplanation:
      'Instead of modifying an `if/elif` chain every time a new payment gateway is added, we register each gateway calculation in a dictionary (`FEES_REGISTRY`) and look it up by key.',
    workedExampleCode: `FEES_REGISTRY = {
    "stripe": lambda amount: amount + 30,
    "razorpay": lambda amount: amount + (amount * 2) // 100,
}

def charge_with_fee(provider: str, amount: int) -> int:
    strategy = FEES_REGISTRY.get(provider)
    if not strategy:
        raise ValueError(f"Unknown provider: {provider}")
    return strategy(amount)`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Shipping Cost Strategy Registry (OCP)',
    scenarioPrompt:
      'Apply the Open/Closed Principle to a shipping cost calculator. Add the missing `"express"` (`weight * 15 + 100`) and `"drone"` (`weight * 25 + 250`) entries into `SHIPPING_STRATEGIES`, and complete `calculate_shipping(method, weight)` to look up the strategy from `SHIPPING_STRATEGIES` (returning `-1` if the method is not registered).',
    functionName: 'calculate_shipping',
    starterCode: `SHIPPING_STRATEGIES = {
    "standard": lambda weight: weight * 5 + 20,
    # TODO: Register "express" (weight * 15 + 100)
    # TODO: Register "drone" (weight * 25 + 250)
}

def calculate_shipping(method: str, weight: int) -> int:
    # TODO: Look up method in SHIPPING_STRATEGIES and call it, or return -1 if missing
    pass
`,
    solutionCode: `SHIPPING_STRATEGIES = {
    "standard": lambda weight: weight * 5 + 20,
    "express": lambda weight: weight * 15 + 100,
    "drone": lambda weight: weight * 25 + 250,
}

def calculate_shipping(method: str, weight: int) -> int:
    fn = SHIPPING_STRATEGIES.get(method)
    return fn(weight) if fn else -1
`,
    hint: 'Add `"express"` and `"drone"` lambdas to `SHIPPING_STRATEGIES`, then use `SHIPPING_STRATEGIES.get(method)`.',
    testCases: [
      { label: 'Standard shipping (10kg)', args: ['standard', 10], expected: 70 },
      { label: 'Express shipping (4kg)', args: ['express', 4], expected: 160 },
      { label: 'Drone shipping (2kg)', args: ['drone', 2], expected: 300 },
      { label: 'Unknown shipping method', args: ['teleport', 5], expected: -1 },
    ],
  },

  'solid-L': {
    id: 'solid-L',
    workedExampleTitle: 'Scenario 1 (Worked Example): Separating Read-Only vs. Writable Storage',
    workedExampleExplanation:
      'In Scenario 1, a ReadOnlyArchive subclass threw NotImplementedError inside a cleanup loop. We fix LSP by filtering or typing only writable stores (`store.get("writable") == True`) before calling delete.',
    workedExampleCode: `def purge_expired_keys(stores: list[dict], key: str) -> list[str]:
    deleted_from = []
    for store in stores:
        if store.get("writable", False):
            deleted_from.append(store["name"])
    return deleted_from`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Safe Refund Processor Across Payment Channels (LSP)',
    scenarioPrompt:
      'Apply Liskov Substitution so our batch refund processor never crashes on non-refundable gift cards. Given a list of `payments` (`[{"id": "p1", "amount": 50, "refundable": True}, ...]`), return the total refunded amount for only those payments where `"refundable"` is `True` and `"amount" > 0`.',
    functionName: 'process_batch_refunds',
    starterCode: `def process_batch_refunds(payments: list[dict]) -> int:
    # TODO: Sum "amount" only for payments that have payment.get("refundable") == True and amount > 0
    pass
`,
    solutionCode: `def process_batch_refunds(payments: list[dict]) -> int:
    total = 0
    for p in payments:
        if p.get("refundable") and p.get("amount", 0) > 0:
            total += p["amount"]
    return total
`,
    hint: 'Loop through `payments` and check `if p.get("refundable") and p.get("amount", 0) > 0:` before adding `p["amount"]`.',
    testCases: [
      {
        label: 'Mixed card and non-refundable voucher',
        args: [[{ id: 'p1', amount: 120, refundable: true }, { id: 'p2', amount: 50, refundable: false }, { id: 'p3', amount: 80, refundable: true }]],
        expected: 200,
      },
      {
        label: 'All non-refundable gift cards',
        args: [[{ id: 'g1', amount: 100, refundable: false }]],
        expected: 0,
      },
    ],
  },

  'solid-I': {
    id: 'solid-I',
    workedExampleTitle: 'Scenario 1 (Worked Example): Role-Segregated Notification Capabilities',
    workedExampleExplanation:
      'Instead of forcing SMS clients to implement `attach_pdf()`, we check focused capability flags (`"sms"`, `"pdf"`) and dispatch only the supported payload.',
    workedExampleCode: `def dispatch_alert(channel: dict, text: str) -> str:
    caps = set(channel.get("capabilities", []))
    if "sms" in caps:
        return f"SMS->{channel['target']}:{text}"
    return "UNSUPPORTED"`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Segregated Smart-Device Capabilities (ISP)',
    scenarioPrompt:
      'Given a list of `devices` (`[{"name": "LaserJet", "caps": ["print"]}, {"name": "OfficePro", "caps": ["print", "scan", "fax"]}]`) and a required `capability` (e.g. `"scan"`), return a list of device names that support that specific capability without forcing every device to implement all capabilities.',
    functionName: 'find_capable_devices',
    starterCode: `def find_capable_devices(devices: list[dict], capability: str) -> list[str]:
    # TODO: Return a list of device["name"] where capability is in device["caps"]
    pass
`,
    solutionCode: `def find_capable_devices(devices: list[dict], capability: str) -> list[str]:
    return [d["name"] for d in devices if capability in d.get("caps", [])]
`,
    hint: 'Use a list comprehension: `[d["name"] for d in devices if capability in d.get("caps", [])]`.',
    testCases: [
      {
        label: 'Filter devices that can scan',
        args: [[{ name: 'HomeInkjet', caps: ['print'] }, { name: 'OfficePro', caps: ['print', 'scan'] }, { name: 'DocScanner', caps: ['scan'] }], 'scan'],
        expected: ['OfficePro', 'DocScanner'],
      },
      {
        label: 'Filter devices that can fax',
        args: [[{ name: 'HomeInkjet', caps: ['print'] }], 'fax'],
        expected: [],
      },
    ],
  },

  'solid-D': {
    id: 'solid-D',
    workedExampleTitle: 'Scenario 1 (Worked Example): Injecting Exchange-Rate Lookup for Deterministic Tests',
    workedExampleExplanation:
      'Instead of calling a live HTTP forex API inside `convert_usd()`, we pass `rates_table` as an explicit dependency so unit tests run in 0.1ms offline.',
    workedExampleCode: `def convert_usd(amount: int, currency: str, rates_table: dict[str, int]) -> int:
    rate = rates_table.get(currency, 1)
    return amount * rate`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Dependency-Injected Feature Flag Evaluator (DIP)',
    scenarioPrompt:
      'Instead of hardcoding a production Redis call inside `is_feature_enabled()`, accept an injected `flag_store` dictionary (`{"dark_mode": True, "beta_ai": False}`) and a `default_val` boolean. Return the flag value from `flag_store` if present, otherwise `default_val`.',
    functionName: 'is_feature_enabled',
    starterCode: `def is_feature_enabled(feature_name: str, flag_store: dict[str, bool], default_val: bool) -> bool:
    # TODO: Read feature_name from the injected flag_store dict, falling back to default_val
    pass
`,
    solutionCode: `def is_feature_enabled(feature_name: str, flag_store: dict[str, bool], default_val: bool) -> bool:
    return bool(flag_store.get(feature_name, default_val))
`,
    hint: 'Use `flag_store.get(feature_name, default_val)`.',
    testCases: [
      { label: 'Enabled flag in injected store', args: ['dark_mode', { dark_mode: true, beta_ai: false }, false], expected: true },
      { label: 'Disabled flag in injected store', args: ['beta_ai', { dark_mode: true, beta_ai: false }, true], expected: false },
      { label: 'Missing flag falls back to default', args: ['new_checkout', { dark_mode: true }, true], expected: true },
    ],
  },

  'lld-01-parking-lot': {
    id: 'lld-01-parking-lot',
    workedExampleTitle: 'Scenario 1 (Worked Example): Nearest Free Spot Allocation',
    workedExampleExplanation:
      'In Scenario 1, the parking allocator scans spots on a floor in ID order and claims the first free spot matching the vehicle type.',
    workedExampleCode: `def claim_spot(spots: list[dict], vehicle_type: str) -> str:
    for spot in spots:
        if spot["type"] == vehicle_type and spot["free"]:
            spot["free"] = False
            return spot["id"]
    return "FULL"`,
    scenarioTitle: 'Scenario 2 (Your Assignment): EV Charger & Tiered Parking Fee Calculator',
    scenarioPrompt:
      'Complete `allocate_and_quote(spots, vehicle_type, hours)` which finds the first spot where `spot["type"] == vehicle_type` and `spot["free"] == True`, and returns `"<spot_id>:<total_fee>"` where `total_fee = hours * spot["rate"]`. If no matching spot is free, return `"LOT_FULL"`.',
    functionName: 'allocate_and_quote',
    starterCode: `def allocate_and_quote(spots: list[dict], vehicle_type: str, hours: int) -> str:
    # TODO: Find first spot with spot["type"] == vehicle_type and spot["free"] == True
    # Return f"{spot['id']}:{hours * spot['rate']}" or "LOT_FULL"
    pass
`,
    solutionCode: `def allocate_and_quote(spots: list[dict], vehicle_type: str, hours: int) -> str:
    for spot in spots:
        if spot.get("type") == vehicle_type and spot.get("free"):
            return f"{spot['id']}:{hours * spot['rate']}"
    return "LOT_FULL"
`,
    hint: 'Loop over `spots`, check `spot["type"] == vehicle_type and spot["free"]`, and return `f"{spot[\'id\']}:{hours * spot[\'rate\']}"`.',
    testCases: [
      {
        label: 'Assign first free EV spot for 3 hours',
        args: [[{ id: 'F1-01', type: 'EV', free: false, rate: 40 }, { id: 'F1-02', type: 'EV', free: true, rate: 40 }], 'EV', 3],
        expected: 'F1-02:120',
      },
      {
        label: 'No free SUV spots available',
        args: [[{ id: 'F1-01', type: 'CAR', free: true, rate: 20 }], 'SUV', 2],
        expected: 'LOT_FULL',
      },
    ],
  },

  'lld-02-splitwise': {
    id: 'lld-02-splitwise',
    workedExampleTitle: 'Scenario 1 (Worked Example): Equal Split Net Balance Ledger',
    workedExampleExplanation:
      'In Scenario 1, when a payer pays `amount` split equally among `members`, the payer is credited `+amount` and each member is debited `-amount // len(members)`.',
    workedExampleCode: `def record_equal_expense(payer: str, amount: int, members: list[str]) -> dict[str, int]:
    share = amount // len(members)
    net = {m: 0 for m in members}
    net[payer] = net.get(payer, 0) + amount
    for m in members:
        net[m] -= share
    return net`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Compute Net Balances Across Multiple Group Expenses',
    scenarioPrompt:
      'Given a list of direct IOUs `transactions` where each item is `[lender, borrower, amount]` (meaning `lender` paid `amount` on behalf of `borrower`), return a dictionary mapping each person to their net balance (`+` if owed money overall, `-` if they owe money), excluding anyone whose final net balance is `0`.',
    functionName: 'compute_net_balances',
    starterCode: `def compute_net_balances(transactions: list[list]) -> dict[str, int]:
    # TODO: Add +amount to lender and -amount to borrower, then return non-zero balances
    pass
`,
    solutionCode: `def compute_net_balances(transactions: list[list]) -> dict[str, int]:
    bal: dict[str, int] = {}
    for lender, borrower, amt in transactions:
        bal[lender] = bal.get(lender, 0) + amt
        bal[borrower] = bal.get(borrower, 0) - amt
    return {k: v for k, v in bal.items() if v != 0}
`,
    hint: 'Accumulate `bal[lender] += amt` and `bal[borrower] -= amt`, then filter `{k: v for k, v in bal.items() if v != 0}`.',
    testCases: [
      {
        label: 'Circular debt that cancels Bob out',
        args: [[['Alice', 'Bob', 50], ['Bob', 'Charlie', 50]]],
        expected: { Alice: 50, Charlie: -50 },
      },
      {
        label: 'Two expenses between Alice and Bob',
        args: [[['Alice', 'Bob', 100], ['Bob', 'Alice', 30]]],
        expected: { Alice: 70, Bob: -70 },
      },
    ],
  },

  'lld-03-bookmyshow': {
    id: 'lld-03-bookmyshow',
    workedExampleTitle: 'Scenario 1 (Worked Example): Optimistic Concurrency Seat Version Check',
    workedExampleExplanation:
      'To prevent two users from booking Seat A12 simultaneously, we check that the seat status is `"AVAILABLE"` AND its `version == expected_version` before incrementing the version.',
    workedExampleCode: `def cas_seat_lock(seat: dict, expected_version: int) -> bool:
    if seat["status"] != "AVAILABLE" or seat["version"] != expected_version:
        return False
    seat["status"] = "HELD"
    seat["version"] += 1
    return True`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Atomic Seat Hold with TTL Expiration Check',
    scenarioPrompt:
      'Complete `try_hold_seat(seat, request_version, now_sec)`: a seat can be held if (`seat["status"] == "AVAILABLE"` OR (`seat["status"] == "HELD"` and `now_sec >= seat["expires_at"]`)) AND `seat["version"] == request_version`. If valid, return `{"status": "HELD", "version": seat["version"] + 1, "expires_at": now_sec + 300}`; otherwise return `{"status": "CONFLICT", "version": seat["version"], "expires_at": seat["expires_at"]}`.',
    functionName: 'try_hold_seat',
    starterCode: `def try_hold_seat(seat: dict, request_version: int, now_sec: int) -> dict:
    # TODO: Check version match and whether seat is AVAILABLE or expired HELD (now_sec >= seat["expires_at"])
    pass
`,
    solutionCode: `def try_hold_seat(seat: dict, request_version: int, now_sec: int) -> dict:
    can_claim = seat["status"] == "AVAILABLE" or (
        seat["status"] == "HELD" and now_sec >= seat["expires_at"]
    )
    if can_claim and seat["version"] == request_version:
        return {"status": "HELD", "version": seat["version"] + 1, "expires_at": now_sec + 300}
    return {"status": "CONFLICT", "version": seat["version"], "expires_at": seat["expires_at"]}
`,
    hint: 'Check `can_claim and seat["version"] == request_version`, then return the new dict with `version + 1` and `now_sec + 300`.',
    testCases: [
      {
        label: 'Claim available seat with matching version',
        args: [{ status: 'AVAILABLE', version: 1, expires_at: 0 }, 1, 1000],
        expected: { status: 'HELD', version: 2, expires_at: 1300 },
      },
      {
        label: 'Stale version causes conflict',
        args: [{ status: 'AVAILABLE', version: 2, expires_at: 0 }, 1, 1000],
        expected: { status: 'CONFLICT', version: 2, expires_at: 0 },
      },
      {
        label: 'Expired hold can be reclaimed',
        args: [{ status: 'HELD', version: 4, expires_at: 900 }, 4, 1000],
        expected: { status: 'HELD', version: 5, expires_at: 1300 },
      },
    ],
  },

  'lld-04-elevator': {
    id: 'lld-04-elevator',
    workedExampleTitle: 'Scenario 1 (Worked Example): LOOK Elevator Direction Sweep',
    workedExampleExplanation:
      'An UP-moving elevator visits all requested floors `>= current_floor` in ascending order before reversing down to visit lower floors in descending order.',
    workedExampleCode: `def sweep_up_then_down(current_floor: int, requests: list[int]) -> list[int]:
    up = sorted([f for f in requests if f >= current_floor])
    down = sorted([f for f in requests if f < current_floor], reverse=True)
    return up + down`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Select Best Elevator Car for a Hall Call',
    scenarioPrompt:
      'Given `cars` (`[{"id": "E1", "floor": 2, "idle": True}, ...]`) and a `target_floor`, return the `"id"` of the closest available car (`car["idle"] == True`) with minimum `abs(car["floor"] - target_floor)`. If no car is idle, return `"WAIT"`.',
    functionName: 'dispatch_closest_idle_car',
    starterCode: `def dispatch_closest_idle_car(cars: list[dict], target_floor: int) -> str:
    # TODO: Filter idle cars and return the id of the car with minimum abs(car["floor"] - target_floor), or "WAIT"
    pass
`,
    solutionCode: `def dispatch_closest_idle_car(cars: list[dict], target_floor: int) -> str:
    idle_cars = [c for c in cars if c.get("idle")]
    if not idle_cars:
        return "WAIT"
    best = min(idle_cars, key=lambda c: abs(c["floor"] - target_floor))
    return best["id"]
`,
    hint: 'Filter `idle_cars = [c for c in cars if c.get("idle")]` and use `min(idle_cars, key=lambda c: abs(c["floor"] - target_floor))["id"]`.',
    testCases: [
      {
        label: 'Pick closest idle elevator car',
        args: [[{ id: 'E1', floor: 1, idle: true }, { id: 'E2', floor: 8, idle: false }, { id: 'E3', floor: 6, idle: true }], 7],
        expected: 'E3',
      },
      {
        label: 'All cars busy returns WAIT',
        args: [[{ id: 'E1', floor: 4, idle: false }], 4],
        expected: 'WAIT',
      },
    ],
  },

  'lld-05-notification-router': {
    id: 'lld-05-notification-router',
    workedExampleTitle: 'Scenario 1 (Worked Example): Retry Wrapper with Fallback Channel',
    workedExampleExplanation:
      'A retry decorator attempts the primary channel up to `max_attempts` times before routing the message to a fallback channel.',
    workedExampleCode: `def send_with_fallback(outcomes: list[str], fallback: str) -> str:
    for i, status in enumerate(outcomes):
        if status == "OK":
            return f"SENT_ON_ATTEMPT_{i + 1}"
    return f"FALLBACK:{fallback}"`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Exponential Backoff Schedule Generator',
    scenarioPrompt:
      'Given `max_retries` (e.g. `4`), `base_delay` (e.g. `2`), and `cap_delay` (e.g. `10`), return the list of retry wait times `[min(cap_delay, base_delay * (2 ** i)) for i in range(max_retries)]`.',
    functionName: 'compute_backoff_schedule',
    starterCode: `def compute_backoff_schedule(max_retries: int, base_delay: int, cap_delay: int) -> list[int]:
    # TODO: Return [min(cap_delay, base_delay * (2 ** i)) for i in range(max_retries)]
    pass
`,
    solutionCode: `def compute_backoff_schedule(max_retries: int, base_delay: int, cap_delay: int) -> list[int]:
    return [min(cap_delay, base_delay * (2 ** i)) for i in range(max_retries)]
`,
    hint: 'Use `[min(cap_delay, base_delay * (2 ** i)) for i in range(max_retries)]`.',
    testCases: [
      { label: '4 retries with base 2s capped at 10s', args: [4, 2, 10], expected: [2, 4, 8, 10] },
      { label: '3 retries with base 1s capped at 30s', args: [3, 1, 30], expected: [1, 2, 4] },
    ],
  },

  'sys-01-code-execution': {
    id: 'sys-01-code-execution',
    workedExampleTitle: 'Scenario 1 (Worked Example): Submission Deduplication Cache Key',
    workedExampleExplanation:
      'Before enqueuing a heavy sandbox container run, the API Gateway strips trailing whitespace and builds a deterministic cache key `<problem_id>:<lang>:<normalized_code>` to serve cached verdicts in 2ms.',
    workedExampleCode: `def make_dedup_key(problem_id: str, lang: str, code: str) -> str:
    cleaned = "\\n".join(line.strip() for line in code.strip().splitlines() if line.strip())
    return f"{problem_id}:{lang}:{len(cleaned)}:{cleaned[:16]}"`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Worker Queue Backpressure & Admission Control',
    scenarioPrompt:
      'When 1,000 users click Run during a contest, the API Gateway must reject non-contest traffic if queue depth exceeds `max_queue_size`. Implement `admit_submission(queue_depth, max_queue_size, is_contest_user)`: return `"ENQUEUED"` if `queue_depth < max_queue_size` OR (`is_contest_user == True` and `queue_depth < max_queue_size * 2`), otherwise return `"HTTP_429_BUSY"`.',
    functionName: 'admit_submission',
    starterCode: `def admit_submission(queue_depth: int, max_queue_size: int, is_contest_user: bool) -> str:
    # TODO: Return "ENQUEUED" if within capacity (or contest user within 2x capacity), else "HTTP_429_BUSY"
    pass
`,
    solutionCode: `def admit_submission(queue_depth: int, max_queue_size: int, is_contest_user: bool) -> str:
    limit = max_queue_size * 2 if is_contest_user else max_queue_size
    return "ENQUEUED" if queue_depth < limit else "HTTP_429_BUSY"
`,
    hint: 'Compute `limit = max_queue_size * 2 if is_contest_user else max_queue_size` and check `queue_depth < limit`.',
    testCases: [
      { label: 'Normal queue load admits regular user', args: [400, 1000, false], expected: 'ENQUEUED' },
      { label: 'Spike above 1000 throttles practice user', args: [1200, 1000, false], expected: 'HTTP_429_BUSY' },
      { label: 'Priority reserve admits active contest user', args: [1200, 1000, true], expected: 'ENQUEUED' },
    ],
  },

  'sys-02-rate-limiter': {
    id: 'sys-02-rate-limiter',
    workedExampleTitle: 'Scenario 1 (Worked Example): Fixed-Window Counter Check',
    workedExampleExplanation:
      'A fixed-window rate limiter buckets timestamps by `now_sec // window_sec` and increments the counter for the current window.',
    workedExampleCode: `def fixed_window_allow(count_in_window: int, limit: int) -> bool:
    return count_in_window + 1 <= limit`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Token Bucket Refill & Consume Algorithm',
    scenarioPrompt:
      'Implement the core Redis Lua Token Bucket math in `token_bucket_step(tokens, elapsed_sec, refill_rate, capacity, cost)`: first refill the bucket (`tokens = min(capacity, tokens + elapsed_sec * refill_rate)`). If `tokens >= cost`, deduct `cost` and return `[True, tokens - cost]`; otherwise return `[False, tokens]`.',
    functionName: 'token_bucket_step',
    starterCode: `def token_bucket_step(tokens: int, elapsed_sec: int, refill_rate: int, capacity: int, cost: int) -> list:
    # TODO: 1. Refill tokens up to capacity: min(capacity, tokens + elapsed_sec * refill_rate)
    # TODO: 2. If tokens >= cost, return [True, tokens - cost], else [False, tokens]
    pass
`,
    solutionCode: `def token_bucket_step(tokens: int, elapsed_sec: int, refill_rate: int, capacity: int, cost: int) -> list:
    refilled = min(capacity, tokens + elapsed_sec * refill_rate)
    if refilled >= cost:
        return [True, refilled - cost]
    return [False, refilled]
`,
    hint: 'First compute `refilled = min(capacity, tokens + elapsed_sec * refill_rate)`, then compare `refilled >= cost`.',
    testCases: [
      { label: 'Refills 4 tokens (capped at 10) and consumes 1', args: [5, 2, 2, 10, 1], expected: [true, 8] },
      { label: 'Empty bucket with 0s elapsed rejects burst', args: [0, 0, 2, 10, 1], expected: [false, 0] },
      { label: 'Refill caps at bucket capacity (10)', args: [8, 5, 3, 10, 4], expected: [true, 6] },
    ],
  },

  'sys-03-url-shortener': {
    id: 'sys-03-url-shortener',
    workedExampleTitle: 'Scenario 1 (Worked Example): Base62 ID Encoder for Short URLs',
    workedExampleExplanation:
      'In Scenario 1, a 64-bit Snowflake ID is converted into a compact Base62 slug (`0-9a-zA-Z`) by repeatedly taking `num % 62` and `num //= 62`.',
    workedExampleCode: `ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
def encode_base62(num: int) -> str:
    if num == 0: return "0"
    chars = []
    while num > 0:
        chars.append(ALPHABET[num % 62])
        num //= 62
    return "".join(reversed(chars))`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Cache-Aside Short URL Resolver',
    scenarioPrompt:
      'Implement the read-path Cache-Aside lookup in `resolve_short_url(slug, redis_cache, db_table)`: if `slug` is in `redis_cache`, return `["CACHE_HIT", redis_cache[slug]]`. Otherwise look up `slug` in `db_table`: if found, return `["CACHE_MISS_DB_HIT", db_table[slug]]`, or `["HTTP_404", ""]` if missing from both.',
    functionName: 'resolve_short_url',
    starterCode: `def resolve_short_url(slug: str, redis_cache: dict[str, str], db_table: dict[str, str]) -> list[str]:
    # TODO: Check redis_cache first ("CACHE_HIT"), then db_table ("CACHE_MISS_DB_HIT"), else ["HTTP_404", ""]
    pass
`,
    solutionCode: `def resolve_short_url(slug: str, redis_cache: dict[str, str], db_table: dict[str, str]) -> list[str]:
    if slug in redis_cache:
        return ["CACHE_HIT", redis_cache[slug]]
    if slug in db_table:
        return ["CACHE_MISS_DB_HIT", db_table[slug]]
    return ["HTTP_404", ""]
`,
    hint: 'Check `if slug in redis_cache:` first, then `if slug in db_table:`, else return `["HTTP_404", ""]`.',
    testCases: [
      { label: 'Hot link served from Redis cache', args: ['abc12', { abc12: 'https://example.com' }, {}], expected: ['CACHE_HIT', 'https://example.com'] },
      { label: 'Cold link falls back to DB', args: ['xyz99', {}, { xyz99: 'https://docs.io' }], expected: ['CACHE_MISS_DB_HIT', 'https://docs.io'] },
      { label: 'Unknown slug returns 404', args: ['none', {}, {}], expected: ['HTTP_404', ''] },
    ],
  },

  'sys-04-collab-doc': {
    id: 'sys-04-collab-doc',
    workedExampleTitle: 'Scenario 1 (Worked Example): Last-Write-Wins (LWW) Register Conflict Resolution',
    workedExampleExplanation:
      'When two clients concurrently edit a property, a Last-Write-Wins CRDT compares `(timestamp, client_id)` tuples so every replica converges to the exact same state.',
    workedExampleCode: `def lww_merge(cur_val: str, cur_ts: int, new_val: str, new_ts: int) -> list:
    if new_ts >= cur_ts:
        return [new_val, new_ts]
    return [cur_val, cur_ts]`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Operational Transform (OT) Index Shift on Concurrent Insert',
    scenarioPrompt:
      'User A wants to insert a character at `my_pos`. Before User A\'s edit arrives, User B inserts `inserted_len` characters at `other_pos`. Complete `transform_insert_index(my_pos, other_pos, inserted_len)`: if `other_pos <= my_pos`, shift `my_pos` right by `+ inserted_len`; otherwise keep `my_pos` unchanged.',
    functionName: 'transform_insert_index',
    starterCode: `def transform_insert_index(my_pos: int, other_pos: int, inserted_len: int) -> int:
    # TODO: Shift my_pos by +inserted_len if other_pos <= my_pos
    pass
`,
    solutionCode: `def transform_insert_index(my_pos: int, other_pos: int, inserted_len: int) -> int:
    return my_pos + inserted_len if other_pos <= my_pos else my_pos
`,
    hint: 'Return `my_pos + inserted_len if other_pos <= my_pos else my_pos`.',
    testCases: [
      { label: 'Insert before cursor shifts cursor right', args: [10, 4, 3], expected: 13 },
      { label: 'Insert after cursor leaves position unchanged', args: [10, 15, 5], expected: 10 },
      { label: 'Insert at exact same index shifts right', args: [7, 7, 2], expected: 9 },
    ],
  },

  'sys-05-notification-engine': {
    id: 'sys-05-notification-engine',
    workedExampleTitle: 'Scenario 1 (Worked Example): Idempotent Notification Deduplication',
    workedExampleExplanation:
      'Because Kafka guarantees at-least-once delivery, workers check a `seen_event_ids` set before calling Twilio so a retried message never sends duplicate SMS texts.',
    workedExampleCode: `def filter_unique_events(event_ids: list[str]) -> list[str]:
    seen, out = set(), []
    for eid in event_ids:
        if eid not in seen:
            seen.add(eid)
            out.append(eid)
    return out`,
    scenarioTitle: 'Scenario 2 (Your Assignment): P0 (OTP) vs. P1 (Order) vs. P2 (Promo) Priority Queue Drainer',
    scenarioPrompt:
      'During a 10M marketing blast, 2FA OTPs must never wait behind promo messages. Given `messages` (`[{"id": "m1", "priority": "P2"}, {"id": "m2", "priority": "P0"}]`), return the list of message `"id"`s ordered strictly by priority tier (`"P0"` first, then `"P1"`, then `"P2"`), preserving arrival order within each tier.',
    functionName: 'drain_by_priority',
    starterCode: `def drain_by_priority(messages: list[dict]) -> list[str]:
    # TODO: Group message IDs into P0, P1, P2 buckets and return P0 + P1 + P2
    pass
`,
    solutionCode: `def drain_by_priority(messages: list[dict]) -> list[str]:
    p0 = [m["id"] for m in messages if m.get("priority") == "P0"]
    p1 = [m["id"] for m in messages if m.get("priority") == "P1"]
    p2 = [m["id"] for m in messages if m.get("priority") == "P2"]
    return p0 + p1 + p2
`,
    hint: 'Collect `p0`, `p1`, and `p2` lists using list comprehensions and return `p0 + p1 + p2`.',
    testCases: [
      {
        label: 'OTPs jump ahead of marketing promos',
        args: [[{ id: 'promo1', priority: 'P2' }, { id: 'otp1', priority: 'P0' }, { id: 'order1', priority: 'P1' }, { id: 'otp2', priority: 'P0' }]],
        expected: ['otp1', 'otp2', 'order1', 'promo1'],
      },
    ],
  },

  'sys-06-distributed-cache': {
    id: 'sys-06-distributed-cache',
    workedExampleTitle: 'Scenario 1 (Worked Example): Why Modulo Hashing Fails When a Node Dies',
    workedExampleExplanation:
      'With `hash % N`, changing `N` from 4 to 3 remaps ~75% of all cache keys simultaneously. Consistent Hashing places nodes on a ring `[0..1000)` and routes each key to the first node clockwise (`pos >= key_hash`), wrapping around to `ring[0]`.',
    workedExampleCode: `import bisect
def find_ring_owner(ring_positions: list[int], key_hash: int) -> int:
    idx = bisect.bisect_left(ring_positions, key_hash)
    return ring_positions[0] if idx == len(ring_positions) else ring_positions[idx]`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Consistent Hashing Ring Lookup with Wrap-Around',
    scenarioPrompt:
      'Given a sorted list of virtual node positions `ring_nodes` (`[{"pos": 100, "node": "cache-A"}, {"pos": 500, "node": "cache-B"}, ...]`) and an integer `key_hash`, return the `"node"` name of the first entry where `entry["pos"] >= key_hash`. If `key_hash` is greater than all positions on the ring, wrap around and return `ring_nodes[0]["node"]`.',
    functionName: 'route_consistent_hash',
    starterCode: `def route_consistent_hash(ring_nodes: list[dict], key_hash: int) -> str:
    # TODO: Return the first node with entry["pos"] >= key_hash, or wrap around to ring_nodes[0]["node"]
    pass
`,
    solutionCode: `def route_consistent_hash(ring_nodes: list[dict], key_hash: int) -> str:
    for entry in ring_nodes:
        if entry["pos"] >= key_hash:
            return entry["node"]
    return ring_nodes[0]["node"]
`,
    hint: 'Loop over `ring_nodes`: `if entry["pos"] >= key_hash: return entry["node"]`. After the loop, return `ring_nodes[0]["node"]`.',
    testCases: [
      {
        label: 'Key lands between 100 and 500 -> routes clockwise to cache-B',
        args: [[{ pos: 100, node: 'cache-A' }, { pos: 500, node: 'cache-B' }, { pos: 900, node: 'cache-C' }], 350],
        expected: 'cache-B',
      },
      {
        label: 'Key after 900 wraps around to first node on ring (cache-A)',
        args: [[{ pos: 100, node: 'cache-A' }, { pos: 500, node: 'cache-B' }, { pos: 900, node: 'cache-C' }], 950],
        expected: 'cache-A',
      },
    ],
  },

  'sys-07-realtime-chat': {
    id: 'sys-07-realtime-chat',
    workedExampleTitle: 'Scenario 1 (Worked Example): Per-Conversation Monotonic Sequence Ordering',
    workedExampleExplanation:
      'Network packets arrive out of order, so clients sort incoming chat messages by `msg["seq_id"]` before rendering.',
    workedExampleCode: `def order_messages(messages: list[dict]) -> list[str]:
    return [m["text"] for m in sorted(messages, key=lambda m: m["seq_id"])]`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Heartbeat TTL Online Presence Filter',
    scenarioPrompt:
      'In WhatsApp/Slack, a user is shown as `"ONLINE"` only if their last heartbeat arrived within `ttl_sec` of `now_sec`. Complete `get_online_users(heartbeats, now_sec, ttl_sec)` where `heartbeats` is `{"alice": 980, "bob": 920}`: return a sorted list of usernames where `now_sec - last_seen <= ttl_sec`.',
    functionName: 'get_online_users',
    starterCode: `def get_online_users(heartbeats: dict[str, int], now_sec: int, ttl_sec: int) -> list[str]:
    # TODO: Return sorted list of users where (now_sec - last_seen) <= ttl_sec
    pass
`,
    solutionCode: `def get_online_users(heartbeats: dict[str, int], now_sec: int, ttl_sec: int) -> list[str]:
    return sorted([user for user, ts in heartbeats.items() if now_sec - ts <= ttl_sec])
`,
    hint: 'Use `sorted([user for user, ts in heartbeats.items() if now_sec - ts <= ttl_sec])`.',
    testCases: [
      {
        label: 'Filter active heartbeats within 30s TTL',
        args: [{ alice: 985, bob: 940, charlie: 970 }, 1000, 30],
        expected: ['alice', 'charlie'],
      },
      {
        label: 'All heartbeats expired',
        args: [{ alice: 800 }, 1000, 30],
        expected: [],
      },
    ],
  },

  'sys-08-video-streaming': {
    id: 'sys-08-video-streaming',
    workedExampleTitle: 'Scenario 1 (Worked Example): Video Segment Chunking Calculator',
    workedExampleExplanation:
      'Raw video uploads are split into fixed 4-second GOP chunks so worker pods can transcode segments in parallel.',
    workedExampleCode: `import math
def count_segments(duration_sec: int, chunk_sec: int = 4) -> int:
    return math.ceil(duration_sec / chunk_sec)`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Adaptive Bitrate (ABR) Quality Selector',
    scenarioPrompt:
      'An HLS video player measures the user\'s current network bandwidth (`bandwidth_kbps`) and applies an 80% safety margin (`safe_kbps = (bandwidth_kbps * 80) // 100`). Given `renditions` (`[{"label": "360p", "kbps": 800}, {"label": "720p", "kbps": 2500}, {"label": "1080p", "kbps": 5000}]`), return the `"label"` of the highest-bitrate rendition whose `"kbps" <= safe_kbps`. If none fit, return the lowest rendition\'s label (`renditions[0]["label"]`).',
    functionName: 'select_abr_rendition',
    starterCode: `def select_abr_rendition(renditions: list[dict], bandwidth_kbps: int) -> str:
    # TODO: Compute safe_kbps = (bandwidth_kbps * 80) // 100 and pick highest rendition with kbps <= safe_kbps
    pass
`,
    solutionCode: `def select_abr_rendition(renditions: list[dict], bandwidth_kbps: int) -> str:
    safe = (bandwidth_kbps * 80) // 100
    chosen = renditions[0]["label"]
    for r in renditions:
        if r["kbps"] <= safe:
            chosen = r["label"]
    return chosen
`,
    hint: 'Compute `safe = (bandwidth_kbps * 80) // 100`, loop through `renditions`, and update `chosen = r["label"]` whenever `r["kbps"] <= safe`.',
    testCases: [
      {
        label: '4000 kbps bandwidth (3200 safe) selects 720p',
        args: [[{ label: '360p', kbps: 800 }, { label: '720p', kbps: 2500 }, { label: '1080p', kbps: 5000 }], 4000],
        expected: '720p',
      },
      {
        label: '7000 kbps bandwidth (5600 safe) selects 1080p',
        args: [[{ label: '360p', kbps: 800 }, { label: '720p', kbps: 2500 }, { label: '1080p', kbps: 5000 }], 7000],
        expected: '1080p',
      },
      {
        label: 'Poor 500 kbps bandwidth falls back to 360p',
        args: [[{ label: '360p', kbps: 800 }, { label: '720p', kbps: 2500 }], 500],
        expected: '360p',
      },
    ],
  },

  'sys-09-geospatial-matching': {
    id: 'sys-09-geospatial-matching',
    workedExampleTitle: 'Scenario 1 (Worked Example): Manhattan Grid Cell Distance Filter',
    workedExampleExplanation:
      'Instead of computing expensive trigonometry across 1M drivers, Uber first filters drivers in nearby H3 cells and ranks candidates by estimated arrival time.',
    workedExampleCode: `def filter_nearby_cells(drivers: list[dict], allowed_cells: list[str]) -> list[str]:
    cell_set = set(allowed_cells)
    return [d["id"] for d in drivers if d["cell"] in cell_set]`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Match Available Driver with Lowest ETA in H3 Ring',
    scenarioPrompt:
      'Given `drivers` (`[{"id": "D1", "cell": "8928308280fffff", "available": True, "eta_min": 4}, ...]`) and `search_cells` (list of H3 cell IDs around the rider), return the `"id"` of the driver who is `"available" == True`, whose `"cell"` is in `search_cells`, and who has the minimum `"eta_min"`. If no driver matches, return `"NO_DRIVER"`.',
    functionName: 'match_best_driver',
    starterCode: `def match_best_driver(drivers: list[dict], search_cells: list[str]) -> str:
    # TODO: Filter drivers that are available and inside search_cells, then return id with min eta_min (or "NO_DRIVER")
    pass
`,
    solutionCode: `def match_best_driver(drivers: list[dict], search_cells: list[str]) -> str:
    allowed = set(search_cells)
    candidates = [
        d for d in drivers if d.get("available") and d.get("cell") in allowed
    ]
    if not candidates:
        return "NO_DRIVER"
    best = min(candidates, key=lambda d: d["eta_min"])
    return best["id"]
`,
    hint: 'Filter `candidates = [d for d in drivers if d.get("available") and d.get("cell") in set(search_cells)]`, then use `min(candidates, key=lambda d: d["eta_min"])["id"]`.',
    testCases: [
      {
        label: 'Matches available driver in neighboring H3 cell with lowest ETA',
        args: [
          [
            { id: 'D1', cell: 'cell_A', available: true, eta_min: 6 },
            { id: 'D2', cell: 'cell_B', available: true, eta_min: 3 },
            { id: 'D3', cell: 'cell_B', available: false, eta_min: 1 },
          ],
          ['cell_A', 'cell_B'],
        ],
        expected: 'D2',
      },
      {
        label: 'No available driver in nearby cells',
        args: [[{ id: 'D1', cell: 'cell_Z', available: true, eta_min: 2 }], ['cell_A']],
        expected: 'NO_DRIVER',
      },
    ],
  },

  'sys-10-payment-ledger': {
    id: 'sys-10-payment-ledger',
    workedExampleTitle: 'Scenario 1 (Worked Example): Double-Entry Zero-Sum Verification',
    workedExampleExplanation:
      'In a double-entry ledger, every payment records a debit (`-amount`) and a credit (`+amount`). An invariant check rejects any journal batch whose entries do not sum to exactly `0`.',
    workedExampleCode: `def is_balanced_journal(entries: list[int]) -> bool:
    return len(entries) >= 2 and sum(entries) == 0`,
    scenarioTitle: 'Scenario 2 (Your Assignment): Idempotency-Key Payment State Machine',
    scenarioPrompt:
      'When a mobile client retries `POST /charge` with an `idem_key`, Stripe checks the idempotency store (`ledger_store`): if `idem_key` already exists in `ledger_store`, return `["CACHED_RECEIPT", ledger_store[idem_key]]` without charging again. Otherwise, if `balance >= amount`, return `["CHARGED_NEW", balance - amount]`, else return `["INSUFFICIENT_FUNDS", balance]`.',
    functionName: 'process_idempotent_charge',
    starterCode: `def process_idempotent_charge(idem_key: str, amount: int, balance: int, ledger_store: dict) -> list:
    # TODO: 1. If idem_key in ledger_store, return ["CACHED_RECEIPT", ledger_store[idem_key]]
    # TODO: 2. If balance >= amount, return ["CHARGED_NEW", balance - amount], else ["INSUFFICIENT_FUNDS", balance]
    pass
`,
    solutionCode: `def process_idempotent_charge(idem_key: str, amount: int, balance: int, ledger_store: dict) -> list:
    if idem_key in ledger_store:
        return ["CACHED_RECEIPT", ledger_store[idem_key]]
    if balance >= amount:
        return ["CHARGED_NEW", balance - amount]
    return ["INSUFFICIENT_FUNDS", balance]
`,
    hint: 'Check `if idem_key in ledger_store:` first, then `if balance >= amount:`.',
    testCases: [
      { label: 'First charge deducts balance', args: ['key_101', 250, 1000, {}], expected: ['CHARGED_NEW', 750] },
      { label: 'Duplicate network retry returns cached receipt without double-charging', args: ['key_101', 250, 750, { key_101: 750 }], expected: ['CACHED_RECEIPT', 750] },
      { label: 'Insufficient balance rejected safely', args: ['key_102', 500, 200, {}], expected: ['INSUFFICIENT_FUNDS', 200] },
    ],
  },
}









export interface SolidPrinciple {
  letter: string
  name: string
  tagline: string
  analogy: string
  companyScenario: string
  whenToUse: string[]
  whenNotToUse: string[]
  badCode: string
  goodCode: string
}

export interface LldProblem {
  id: string
  title: string
  patterns: string[]
  coreChallenge: string
  classes: { name: string; role: string }[]
  invariant: string
  codeSnippet: string
}

export interface HldProblem {
  id: string
  tier: 1 | 2 | 3
  title: string
  difficulty: 'Medium' | 'Hard'
  companies: string[]
  scale: { dau: string; peakRps: string; latency: string; ratio: string }
  naiveFailure: {
    setup: string
    breakingPoint: string
    crashes: string[]
  }
  architectureNodes: { id: string; label: string; role: string; metric: string; color: string }[]
  chaosScenarios: {
    id: string
    name: string
    trigger: string
    brokenWithoutDefense: string
    defenseMechanism: string
  }[]
  seniorPitch: {
    hook: string
    flow: string
    tradeoffs: string
    defense: string
  }
  references: { title: string; author: string; url: string; takeaway: string }[]
}

export const SOLID_PLAYBOOK: SolidPrinciple[] = [
  {
    letter: 'S',
    name: 'Single Responsibility Principle (SRP)',
    tagline: 'A module should have one reason to change (one team/actor who owns it).',
    analogy: 'Restaurant Kitchen: The Chef cooks, the Cashier bills, and the Rider delivers. If one person does all three, a menu tweak breaks the cash register.',
    companyScenario: 'A 900-line OrderService God Class validates carts, charges Stripe, runs SQL INSERTs, and sends SendGrid emails. When Finance updates tax rounding, they accidentally break email retries.',
    whenToUse: [
      'When two different teams (e.g. Billing vs. Notifications) keep editing the same class.',
      'When unit-testing business logic requires mocking 6 unrelated services.',
    ],
    whenNotToUse: [
      'Do NOT split a cohesive 40-line function into 8 tiny 5-line classes where engineers must jump across 8 files.',
    ],
    badCode: `class OrderService:\n    def checkout(self, cart):\n        # Charge Stripe + SQL INSERT + SendGrid SMTP`,
    goodCode: `class CheckoutOrchestrator:\n    def __init__(self, payment: PaymentGateway, repo: OrderRepo, mailer: Mailer):\n        self.payment, self.repo, self.mailer = payment, repo, mailer`,
  },
  {
    letter: 'O',
    name: 'Open / Closed Principle (OCP)',
    tagline: 'Open for extension (new behavior), closed for modification (do not edit tested core code).',
    analogy: 'USB-C Port: You do not solder the motherboard to plug in a new monitor or SSD—you build a device that fits the port (Strategy Pattern).',
    companyScenario: 'A payment router has if/elif chains for stripe, razorpay, paypal across 10 files. Adding UPI requires editing tested checkout code right before a flash sale.',
    whenToUse: ['When you hit >= 3 variants of an algorithm/provider (Payment gateways, LLM providers, Pricing rules).'],
    whenNotToUse: ['Rule of Three (YAGNI): Do NOT build an abstract plugin registry on Day 1 when you only have 1 implementation.'],
    badCode: `def pay(kind, amt):\n    if kind == "stripe": ...\n    elif kind == "razorpay": ...`,
    goodCode: `REGISTRY = {"stripe": StripeStrategy(), "razorpay": RazorpayStrategy()}\ndef pay(kind: str, amt: int):\n    return REGISTRY[kind].charge(amt)`,
  },
  {
    letter: 'L',
    name: 'Liskov Substitution Principle (LSP)',
    tagline: 'Subclasses must honor the parent contract without throwing unexpected errors.',
    analogy: 'Universal Wall Socket: Any 240V plug must work safely without needing a secret switch for one specific brand.',
    companyScenario: 'CloudStorage has .upload() and .delete(). AuditArchiveStorage(CloudStorage) raises NotImplementedError on .delete(), crashing a nightly cleanup loop at 2 AM.',
    whenToUse: ['Whenever designing base classes or interfaces consumed by polymorphic loops.'],
    whenNotToUse: ['Never inherit from a class just to reuse 5 lines of helper code if your subclass disables parent methods (use Composition!).'],
    badCode: `class ReadOnlyStore(Storage):\n    def delete(self, key): raise NotImplementedError()`,
    goodCode: `class ReadableStore(Protocol):\n    def get(self, key: str) -> bytes: ...\nclass WritableStore(ReadableStore, Protocol):\n    def delete(self, key: str) -> None: ...`,
  },
  {
    letter: 'I',
    name: 'Interface Segregation Principle (ISP)',
    tagline: 'Clients should not be forced to implement methods they do not use.',
    analogy: 'Separate Breakfast, Dinner, and Drinks menus instead of forcing an espresso kiosk to stock 50 steak ingredients.',
    companyScenario: 'A fat NotificationClient interface requires send_text(), attach_pdf(), and register_push_token(). Adding TwilioSMS forces dummy attach_pdf() stubs.',
    whenToUse: ['When implementing an interface forces you to write `pass` or `return None` for irrelevant methods.'],
    whenNotToUse: ['Do not split cohesive 2-method interfaces (like `get`/`set` on a Cache) into single-method micro-interfaces.'],
    badCode: `class Notifier(ABC):\n    @abstractmethod def send_sms(self): ...\n    @abstractmethod def attach_pdf(self): ...`,
    goodCode: `class TextSender(Protocol):\n    def send_text(self, to: str, msg: str) -> None: ...`,
  },
  {
    letter: 'D',
    name: 'Dependency Inversion Principle (DIP)',
    tagline: 'High-level business logic should depend on abstractions, not hardcoded low-level SDKs.',
    analogy: 'A desk lamp plugs into a standard wall outlet; it is not wired directly into a coal or solar power plant.',
    companyScenario: 'RAGService instantiates PineconeClient(api_key="prod") inside __init__. Unit tests on CI fail because they cannot swap in an in-memory fake.',
    whenToUse: ['Always inject external I/O boundaries (Database, Redis, HTTP API, LLM SDK, Clock) via __init__.'],
    whenNotToUse: ['Do NOT inject pure stateless helpers (json.dumps, math.sqrt)—call them directly.'],
    badCode: `class BillingService:\n    def __init__(self): self.stripe = StripeSDK("sk_live_...")`,
    goodCode: `class BillingService:\n    def __init__(self, gateway: PaymentGateway): self.gateway = gateway`,
  },
]
export const LLD_PROBLEMS: LldProblem[] = [
  {
    id: 'lld-01-parking-lot',
    title: '1. Multi-Floor Parking Lot & EV Charging Billing',
    patterns: ['Factory Pattern', 'Strategy Pattern (Pricing)', 'Per-Floor Thread Lock'],
    coreChallenge: 'Assign nearest available spot for Bike/Car/Truck/EV concurrently without double-booking when 2 cars enter at the same millisecond.',
    classes: [
      { name: 'ParkingLot', role: 'Orchestrates floors, entry/exit gates, and active Ticket registry.' },
      { name: 'ParkingSpot', role: 'Holds spot_id, vehicle_type, is_free, and atomic lock.' },
      { name: 'PricingStrategy (ABC)', role: 'HourlyPricing, WeekendSurgePricing, EVKilowattPricing.' },
    ],
    invariant: 'Lock per floor/spot-type bucket (not a single global lock) so Car entry on Floor 1 never blocks Bike entry on Floor 2.',
    codeSnippet: `class PricingStrategy(Protocol):\n    def calculate(self, hours: float, kwh: float = 0) -> float: ...`,
  },
  {
    id: 'lld-02-splitwise',
    title: '2. Splitwise Group Expense & Debt Simplifier',
    patterns: ['Strategy Pattern (Equal / Exact / Percent Split)', 'Min-Max Heap Debt Settlement'],
    coreChallenge: 'Validate split rules cleanly and minimize total wire transfers among N friends from O(N²) edges down to at most N-1 transactions.',
    classes: [
      { name: 'SplitValidator (Strategy)', role: 'Verifies sum(splits) == total_amount and percentages == 100%.' },
      { name: 'DebtSimplifier', role: 'Greedily matches max creditor with max debtor using two heaps in O(V log V).' },
    ],
    invariant: 'Conservation of money: sum of all net user balances in any group must strictly equal 0 after every expense.',
    codeSnippet: `creditors = [(-amt, u) for u, amt in balances.items() if amt > 0]\ndebtors = [(amt, u) for u, amt in balances.items() if amt < 0]`,
  },
  {
    id: 'lld-03-bookmyshow',
    title: '3. BookMyShow Movie Seat Locking Engine',
    patterns: ['State Pattern (Available -> Held -> Booked)', 'Optimistic Concurrency / Redis TTL'],
    coreChallenge: 'Hold selected seats for 5 minutes during payment checkout without deadlocking or allowing two users to book Seat A12.',
    classes: [
      { name: 'SeatLockManager', role: 'Uses Redis SET NX EX 300 or DB version column to grant 5-min exclusive hold.' },
      { name: 'BookingState (State)', role: 'Transitions Created -> PaymentPending -> Confirmed / Expired.' },
    ],
    invariant: 'UPDATE show_seats SET status="HELD", version=version+1 WHERE seat_id=:id AND status="AVAILABLE" AND version=:v.',
    codeSnippet: `def hold_seat(redis_conn, show_id: str, seat_id: str, user_id: str) -> bool:\n    return bool(redis_conn.set(f"lock:{show_id}:{seat_id}", user_id, nx=True, ex=300))`,
  },
  {
    id: 'lld-04-elevator',
    title: '4. Smart Multi-Elevator Dispatcher (SCAN / LOOK)',
    patterns: ['State Pattern (MovingUp / MovingDown / Idle)', 'Observer Pattern', 'LOOK Scheduling'],
    coreChallenge: 'Avoid starvation and minimize wait time by serving all requests in the current travel direction before reversing.',
    classes: [
      { name: 'ElevatorCar', role: 'Maintains up_stops (min-heap) and down_stops (max-heap).' },
      { name: 'DispatchStrategy', role: 'Scores each car by distance + direction alignment.' },
    ],
    invariant: 'An UP-moving elevator services all requested floors >= current_floor in ascending order before flipping state to DOWN.',
    codeSnippet: `if self.direction == "UP" and self.up_heap:\n    return heapq.heappop(self.up_heap)`,
  },
  {
    id: 'lld-05-notification-router',
    title: '5. Pluggable Notification & Retry Router (SOLID Showcase)',
    patterns: ['ISP', 'DIP', 'Decorator Pattern (Retry + RateLimit)', 'Factory'],
    coreChallenge: 'Send OTPs and alerts across Email, SMS, and Push with composable retry backoff without modifying channel classes.',
    classes: [
      { name: 'NotificationSender (Protocol)', role: 'Focused send(recipient, payload) interface.' },
      { name: 'RetryDecorator', role: 'Wraps any NotificationSender with exponential backoff.' },
    ],
    invariant: 'Decorators wrap the same interface they implement, allowing Retry(RateLimit(TwilioSender())) composition.',
    codeSnippet: `class RetrySender:\n    def __init__(self, inner: Sender, retries: int = 3):\n        self.inner, self.retries = inner, retries`,
  },
]
export const HLD_PROBLEMS: HldProblem[] = [
  {
    id: 'sys-01-code-execution',
    tier: 1,
    title: '1. Remote Code Execution Sandbox (LeetCode / Judge0 — 1,000+ Concurrent Runs)',
    difficulty: 'Medium',
    companies: ['Google', 'Uber', 'HackerRank', 'Amazon'],
    scale: { dau: '1,000,000', peakRps: '1,000 runs/sec (Contest Spike)', latency: '< 25ms API (HTTP 202) · < 2.0s Verdict', ratio: '1:10 Heavy Compute' },
    naiveFailure: {
      setup: 'Single FastAPI web server executes `subprocess.run(["python3", "solution.py"])` synchronously inside the HTTP handler.',
      breakingPoint: '1,000 contest participants click Run simultaneously at 8:00 PM.',
      crashes: [
        'Memory OOM Crash: 1,000 × 50MB Python interpreters = 50GB RAM spike; Linux OOM Killer terminates the web server.',
        'Gateway Timeout (504): 1,000 blocked HTTP workers starve the event loop; Nginx drops connections after 30s.',
        'Host Takeover: Untrusted user code runs `while True: os.fork()` or reads environment secrets.',
      ],
    },
    architectureNodes: [
      { id: 'client', label: '1,000+ Contest Clients', role: 'Submits code via POST /runs and listens for live verdict via SSE stream.', metric: '1,000 RPS', color: '#38BDF8' },
      { id: 'gateway', label: 'Stateless API Gateway', role: 'Validates payload, checks SHA-256 dedup cache, enqueues job, returns 202 Accepted.', metric: '12ms (HTTP 202)', color: '#34D399' },
      { id: 'cache', label: 'Redis Dedup & Pub/Sub', role: 'Caches identical (problem_id, lang, code_hash) verdicts & broadcasts SSE events.', metric: '22% Cache Hit', color: '#FBBF24' },
      { id: 'queue', label: 'Redis Streams / RabbitMQ', role: 'Buffers 1,000+ burst jobs with consumer-group visibility timeouts & DLQ.', metric: 'Zero Dropped Jobs', color: '#818CF8' },
      { id: 'workers', label: 'Cgroup v2 / isolate Workers', role: 'Pulls 1 job per CPU core; runs inside network-disabled Linux namespace (pids.max=32, memory.max=256M).', metric: 'Isolated Sandbox', color: '#FB7185' },
    ],
    chaosScenarios: [
      {
        id: 'loop',
        name: 'Chaos 1: User Submits `while True: pass`',
        trigger: 'Infinite CPU loop inside user submission.',
        brokenWithoutDefense: 'Worker thread spins at 100% CPU forever; eventually all worker slots permanently freeze.',
        defenseMechanism: 'Per-sandbox hardware watchdog (`SIGALRM` / `ITIMER_REAL` + cgroup `cpu.max`) issues `SIGKILL` to the process group at 2.0s and returns `TimeLimitExceeded`.',
      },
      {
        id: 'fork',
        name: 'Chaos 2: Fork Bomb `while True: os.fork()`',
        trigger: 'Exponential process creation attempting to exhaust host PID table.',
        brokenWithoutDefense: 'Host OS runs out of PIDs in <150ms; SSH and container daemon crash.',
        defenseMechanism: 'Linux cgroups v2 `pids.max = 32` (`RLIMIT_NPROC`) + seccomp-bpf syscall filter immediately blocks `clone`/`fork` beyond 32 processes.',
      },
      {
        id: 'crash',
        name: 'Chaos 3: Worker Node Loses Power Mid-Run',
        trigger: 'Spot instance termination while grading Job #4092.',
        brokenWithoutDefense: 'User spinner hangs in `RUNNING` state forever.',
        defenseMechanism: 'Redis Streams `XPENDING` visibility lease (10s): unacknowledged job is reclaimed by a healthy worker (max 2 retries, then Dead-Letter Queue).',
      },
    ],
    seniorPitch: {
      hook: 'We decouple untrusted code execution from the HTTP API using an asynchronous Redis Streams job queue and ephemeral cgroup-isolated worker sandboxes—guaranteeing <20ms API ingestion latency even during a 1,000-user contest spike.',
      flow: 'When a user clicks Run, the API gateway checks a SHA-256 submission cache, writes a PENDING state, enqueues the job, and returns HTTP 202 Accepted. Stateless workers pull jobs at bounded concurrency, execute inside a network-disabled Linux namespace with strict CPU/RAM/PID cgroups, and publish results over Redis Pub/Sub to an SSE gateway.',
      tradeoffs: 'This trades a ~120ms queue-hop overhead for 100% API availability; we cap PIDs at 32 via RLIMIT_NPROC to kill fork bombs and use SSE instead of polling to eliminate 2,000 wasted status RPS.',
      defense: 'We rejected synchronous in-process execution because 1,000 concurrent runs would exhaust worker threads, trigger 504 Gateway Timeouts, and allow one OOM or malicious import to crash the web tier.',
    },
    references: [
      { title: 'ByteByteGo — How Does LeetCode Execute Code Safely?', author: 'Alex Xu', url: 'https://blog.bytebytego.com/', takeaway: 'Visualizing queue decoupling and isolated sandbox worker pools.' },
      { title: 'Judge0 Architecture & IOI isolate Sandbox', author: 'Herman Zvonimir Došilović', url: 'https://github.com/judge0/judge0', takeaway: 'Production open-source code execution using Linux namespaces and cgroups.' },
      { title: 'Hussein Nasser — SSE vs WebSockets vs Long Polling', author: 'Hussein Nasser', url: 'https://www.youtube.com/@hnasr', takeaway: 'Why Server-Sent Events (SSE) + Pub/Sub beats polling for one-way job status streams.' },
    ],
  },
  {
    id: 'sys-02-rate-limiter',
    tier: 1,
    title: '2. Scalable Distributed Rate Limiter (Token Bucket / Sliding Window)',
    difficulty: 'Medium',
    companies: ['Stripe', 'Cloudflare', 'Atlassian', 'Uber'],
    scale: { dau: '50,000,000', peakRps: '100,000 checks/sec', latency: '< 2ms per check', ratio: '1:1 Atomic Read-Write' },
    naiveFailure: {
      setup: 'In-memory Python dict counter per web server instance.',
      breakingPoint: '10 load-balanced servers receive burst traffic from a scraper bot.',
      crashes: [
        'Inconsistent State: Bot gets 10x the allowed quota across 10 servers.',
        'Race Condition: Concurrent GET then INCR in Redis allows 50 requests through a 10-req limit.',
      ],
    },
    architectureNodes: [
      { id: 'client', label: 'API Clients', role: 'Sends HTTP requests with API key / IP.', metric: '100k RPS', color: '#38BDF8' },
      { id: 'edge', label: 'API Gateway Middleware', role: 'Executes atomic Redis Lua script before hitting app controllers.', metric: '< 1.5ms RTT', color: '#34D399' },
      { id: 'redis', label: 'Redis Cluster (Lua EVAL)', role: 'Atomically refills token bucket & decrements tokens in single thread.', metric: 'Atomic 1-Hop', color: '#FBBF24' },
    ],
    chaosScenarios: [
      {
        id: 'race',
        name: 'Chaos 1: 100 Parallel Requests at T=0.001s',
        trigger: 'Concurrent threads read `tokens = 1` simultaneously.',
        brokenWithoutDefense: 'All 100 threads pass the check before any write completes.',
        defenseMechanism: 'Single Redis Lua script (`EVAL`) runs atomically on Redis single-threaded event loop.',
      },
      {
        id: 'outage',
        name: 'Chaos 2: Redis Cluster Node Outage',
        trigger: 'Cache network partition.',
        brokenWithoutDefense: 'Gateway throws 500 error and blocks 100% of legitimate paying customers.',
        defenseMechanism: 'Fail-Open circuit breaker falls back to a local in-memory Token Bucket per gateway pod.',
      },
    ],
    seniorPitch: {
      hook: 'We enforce distributed rate limiting at the API Gateway using a Redis-backed Token Bucket executed inside a single atomic Lua script—delivering sub-2ms overhead at 100k RPS.',
      flow: 'On each request, the gateway hashes the user key to a Redis shard and invokes an EVAL Lua script that calculates elapsed time since last_refill, adds accrued tokens up to capacity, and decrements 1 token or returns HTTP 429 with Retry-After.',
      tradeoffs: 'Token Bucket supports legitimate short bursts while bounding average rate; executing in Lua eliminates GET/SET race conditions and cuts network round-trips to 1.',
      defense: 'We avoided Fixed Window counters due to the 2x boundary spike problem at minute edges, and avoided Sliding Window Logs because storing every timestamp in a sorted set consumes O(N) memory.',
    },
    references: [
      { title: 'Stripe Engineering — Scaling Rate Limiters with Redis', author: 'Stripe Eng', url: 'https://stripe.com/blog/rate-limiters', takeaway: 'Production Token Bucket and load-shedding strategies.' },
    ],
  },
  {
    id: 'sys-03-url-shortener',
    tier: 1,
    title: '3. Scalable URL Shortener with Real-Time Click Analytics (TinyURL / Bitly)',
    difficulty: 'Medium',
    companies: ['Atlassian', 'Amazon', 'Microsoft', 'Flipkart'],
    scale: { dau: '100,000,000', peakRps: '50,000 redirects/sec', latency: '< 10ms redirect', ratio: '100:1 Read-Heavy' },
    naiveFailure: {
      setup: 'Random 7-char string + synchronous SQL `UPDATE urls SET clicks = clicks + 1` on every redirect.',
      breakingPoint: 'A celebrity tweets a short link; 50,000 users click it in 1 second.',
      crashes: [
        'Row Lock Contention: 50,000 concurrent UPDATEs on the same row lock PostgreSQL.',
        '301 Redirect Trap: Using 301 Moved Permanently causes browsers to cache the redirect locally, blinding analytics.',
      ],
    },
    architectureNodes: [
      { id: 'keygen', label: 'Snowflake / Range ID Server', role: 'Generates collision-free 64-bit integer encoded in Base62 (7 chars = 3.5T URLs).', metric: 'Zero Collisions', color: '#818CF8' },
      { id: 'cache', label: 'Redis Cache-Aside', role: 'Serves 99% of hot short_code -> long_url lookups in <2ms with HTTP 302.', metric: '99% Hit Rate', color: '#34D399' },
      { id: 'stream', label: 'Kafka -> ClickHouse Analytics', role: 'Asynchronously batches click events so redirects never wait on DB writes.', metric: 'Async Analytics', color: '#FBBF24' },
    ],
    chaosScenarios: [
      {
        id: 'stampede',
        name: 'Chaos 1: Viral Link Cache Expiry Stampede',
        trigger: 'Hot key TTL expires while 20,000 requests are in flight.',
        brokenWithoutDefense: '20,000 cache misses hit PostgreSQL simultaneously.',
        defenseMechanism: 'Single-Flight request coalescing + logical TTL extension on hot keys.',
      },
    ],
    seniorPitch: {
      hook: 'With a 100:1 read-to-write ratio, we decouple ultra-fast HTTP 302 redirects (via Redis Cache-Aside and Base62 Snowflake IDs) from asynchronous click analytics (via Kafka and ClickHouse).',
      flow: 'On write, a range-allocated counter generates a unique integer encoded in Base62. On read, the gateway looks up the short code in Redis, immediately returns 302 Found, and fires a non-blocking click event to Kafka.',
      tradeoffs: 'We intentionally use HTTP 302 (Temporary) instead of 301 (Permanent) when analytics are enabled so browsers do not bypass our tracking gateway.',
      defense: 'We rejected MD5/SHA truncation because collision-resolution DB retries degrade write latency as the table fills up.',
    },
    references: [
      { title: 'System Design Primer — Designing Pastebin & Bitly', author: 'Donne Martin', url: 'https://github.com/donnemartin/system-design-primer', takeaway: 'Base62 math, Cache-Aside, and 301 vs 302 trade-offs.' },
    ],
  },
  {
    id: 'sys-04-collab-doc',
    tier: 2,
    title: '4. Real-Time Collaborative Document / Whiteboard (Google Docs / Excalidraw)',
    difficulty: 'Hard',
    companies: ['Google', 'Figma', 'Notion', 'Atlassian'],
    scale: { dau: '20,000,000', peakRps: '500,000 WebSocket ops/sec', latency: '< 50ms keystroke sync', ratio: '1:1 Bidirectional Stream' },
    naiveFailure: {
      setup: 'Clients POST the entire document JSON every 2 seconds (`Last-Write-Wins`).',
      breakingPoint: 'Two users type on the same paragraph simultaneously.',
      crashes: ['Lost Updates: User B overwrites User A paragraph.', 'Bandwidth Explosion: Sending 2MB JSON on every keystroke.'],
    },
    architectureNodes: [
      { id: 'ws', label: 'Stateful WebSocket Gateway', role: 'Maintains persistent TCP connections grouped by document_id.', metric: '< 30ms Hop', color: '#38BDF8' },
      { id: 'crdt', label: 'OT / CRDT Engine', role: 'Merges character-level delta operations commutatively without locks.', metric: 'Conflict-Free', color: '#34D399' },
      { id: 'snap', label: 'Operation Log + S3 Snapshots', role: 'Appends deltas to WAL and compacts full snapshots every 100 ops.', metric: 'Fast Replay', color: '#818CF8' },
    ],
    chaosScenarios: [
      {
        id: 'concurrent',
        name: 'Chaos 1: Simultaneous Insert at Index 10',
        trigger: 'User A inserts "X" at index 10 while User B deletes index 8.',
        brokenWithoutDefense: 'User A character lands at wrong offset, corrupting document text.',
        defenseMechanism: 'Operational Transformation (OT) shifts index 10 -> 9, or CRDT assigns immutable fractional Lamport IDs.',
      },
    ],
    seniorPitch: {
      hook: 'We replace full-document overwrites with a WebSocket delta-streaming architecture powered by CRDTs (Conflict-Free Replicated Data Types) and periodic snapshot compaction.',
      flow: 'Keystrokes emit tiny character operations over WebSockets to a room gateway, which broadcasts via Redis Pub/Sub and appends to an append-only op-log compacted into S3 snapshots.',
      tradeoffs: 'CRDTs add per-character metadata memory overhead in exchange for peer-to-peer offline resilience and lock-free eventual consistency.',
      defense: 'Pessimistic section locking ruins real-time UX, and Last-Write-Wins silently drops concurrent edits.',
    },
    references: [
      { title: 'Figma Engineering — How Figma Multiplayer Technology Works', author: 'Evan Wallace', url: 'https://www.figma.com/blog/how-figmas-multiplayer-technology-works/', takeaway: 'Pragmatic CRDTs and WebSocket room architecture.' },
    ],
  },
  {
    id: 'sys-05-notification-engine',
    tier: 2,
    title: '5. High-Throughput Multi-Channel Notification Service (OTP / Push / Email)',
    difficulty: 'Medium',
    companies: ['Uber', 'Razorpay', 'Swiggy', 'Amazon'],
    scale: { dau: '100,000,000', peakRps: '200,000 notifications/sec', latency: 'P0 OTP < 1s · P2 Promo < 5m', ratio: '1:50 Fan-Out' },
    naiveFailure: {
      setup: 'Single FIFO queue shared by Marketing blasts and 2FA Login OTPs.',
      breakingPoint: 'Marketing enqueues 10 million festival push notifications at 6:00 PM.',
      crashes: ['Head-of-Line Blocking: Login OTP SMS sits behind 10M promo messages for 45 minutes.', 'Duplicate Retries: Timeout retry sends 3 duplicate SMS charges.'],
    },
    architectureNodes: [
      { id: 'idem', label: 'Idempotency & Preference Gate', role: 'Deduplicates notification_id in Redis and checks user opt-out settings.', metric: 'Zero Duplicates', color: '#34D399' },
      { id: 'queues', label: 'Isolated Priority Queues (P0/P1/P2)', role: 'Physically separates P0_OTP, P1_ORDER, and P2_MARKETING Kafka topics.', metric: 'OTP < 800ms', color: '#38BDF8' },
      { id: 'workers', label: 'Channel Workers + DLQ', role: 'Dispatches to Twilio/FCM/SES with exponential backoff + jitter.', metric: '99.99% Delivery', color: '#FBBF24' },
    ],
    chaosScenarios: [
      {
        id: 'promo',
        name: 'Chaos 1: 10M Marketing Blast During Peak Checkout',
        trigger: 'Bulk campaign floods ingestion API.',
        brokenWithoutDefense: 'OTP login codes time out, locking users out of the app.',
        defenseMechanism: 'Strict physical queue isolation: P0_OTP has dedicated worker pods that never read from P2_MARKETING.',
      },
    ],
    seniorPitch: {
      hook: 'We guarantee sub-second delivery for critical 2FA OTPs even during 10-million-user marketing blasts by physically isolating priority queues (P0/P1/P2) behind an idempotent ingestion gateway.',
      flow: 'Requests pass through a Redis idempotency check and user-preference cache, route to priority-specific Kafka topics, and are consumed by channel-specific workers with exponential backoff and Dead-Letter Queues.',
      tradeoffs: 'At-least-once queue delivery requires strict idempotency keys at the worker boundary to prevent duplicate SMS billing.',
      defense: 'Synchronous 3rd-party Twilio/SendGrid calls inside checkout APIs cause cascading latency spikes whenever an external vendor degrades.',
    },
    references: [
      { title: 'ByteByteGo — Notification System Design', author: 'Alex Xu', url: 'https://blog.bytebytego.com/', takeaway: 'Priority queue isolation, deduplication, and retry pipelines.' },
    ],
  },
  {
    id: 'sys-06-distributed-cache',
    tier: 2,
    title: '6. Distributed In-Memory Cache Cluster (Consistent Hashing / Single-Flight)',
    difficulty: 'Hard',
    companies: ['Amazon', 'Netflix', 'Meta', 'Uber'],
    scale: { dau: '80,000,000', peakRps: '500,000 ops/sec', latency: '< 1ms P99', ratio: '95:5 Read-Heavy' },
    naiveFailure: {
      setup: 'Modulo sharding `node = hash(key) % N` across 10 cache servers.',
      breakingPoint: '1 of the 10 cache nodes crashes during peak traffic.',
      crashes: ['90% Key Remap Stampede: `hash(key) % 9` invalidates 90% of all keys simultaneously, crushing PostgreSQL.'],
    },
    architectureNodes: [
      { id: 'ring', label: 'Consistent Hashing Ring (vnodes)', role: 'Maps each physical server to 150 virtual nodes on a 0..2^32 ring; node failure remaps only 1/N keys.', metric: 'Only 10% Remap', color: '#38BDF8' },
      { id: 'lru', label: 'Doubly-Linked List + HashMap Shard', role: 'Maintains O(1) get/put with LRU eviction and randomized TTL jitter.', metric: 'O(1) Eviction', color: '#34D399' },
      { id: 'sf', label: 'Single-Flight Coalescer', role: 'Coalesces 1,000 concurrent misses on a hot key into a single DB query.', metric: 'Zero DB Stampede', color: '#FBBF24' },
    ],
    chaosScenarios: [
      {
        id: 'node_down',
        name: 'Chaos 1: Cache Node #4 Crashes',
        trigger: 'Hardware failure removes 1 of 10 nodes.',
        brokenWithoutDefense: 'Modulo hashing remaps 90% of keys, causing a Thundering Herd DB outage.',
        defenseMechanism: 'Consistent Hashing Ring shifts only the keys on Node #4 arcs (~10%) to clockwise neighbors.',
      },
    ],
    seniorPitch: {
      hook: 'We partition our in-memory cache using a Consistent Hashing Ring with 150 virtual nodes per physical host, paired with Single-Flight request coalescing to prevent Thundering Herd database outages.',
      flow: 'Clients route keys clockwise on a 32-bit MurmurHash ring; each shard stores entries in an O(1) HashMap + Doubly-Linked List for LRU eviction with +/-10% TTL jitter.',
      tradeoffs: 'Virtual nodes balance key skew across heterogeneous hardware while bounding node-failure key migration to exactly 1/N.',
      defense: 'Modulo `hash(k) % N` sharding is fatal in production because any autoscaling or node crash invalidates almost the entire keyspace.',
    },
    references: [
      { title: 'Arpit Bhayani — Consistent Hashing & Virtual Nodes', author: 'Arpit Bhayani', url: 'https://www.youtube.com/@AsliEngineering', takeaway: 'Mathematical proof of 1/N key movement and virtual node distribution.' },
    ],
  },
  {
    id: 'sys-07-realtime-chat',
    tier: 2,
    title: '7. Global Real-Time Chat & Presence Engine (WhatsApp / Slack)',
    difficulty: 'Hard',
    companies: ['Meta', 'Slack', 'Discord', 'Microsoft'],
    scale: { dau: '150,000,000', peakRps: '1,000,000 msgs/sec', latency: '< 80ms delivery', ratio: '1:3 Group Fan-Out' },
    naiveFailure: {
      setup: 'Clients poll SQL every 3 seconds for new messages and "Online" status.',
      breakingPoint: '10M online users generate 3.3M SQL queries/sec even when nobody is typing.',
      crashes: ['Presence Polling Storm: Heartbeat UPDATEs lock the users table.', 'Unordered Delivery: Messages arrive out of sequence across devices.'],
    },
    architectureNodes: [
      { id: 'ws', label: 'WebSocket Connection Mesh', role: 'Holds stateful user sockets and maps user_id -> gateway_pod in Redis.', metric: '1M Persistent Conns', color: '#38BDF8' },
      { id: 'router', label: 'Chat Router & Snowflake Sequencer', role: 'Assigns monotonic per-channel message_id and routes to recipient gateway.', metric: 'Strict Ordering', color: '#34D399' },
      { id: 'store', label: 'Wide-Column Store (Cassandra/Scylla)', role: 'Partition key `(channel_id, bucket)` + clustering key `message_id` for fast history.', metric: 'High Write Throughput', color: '#818CF8' },
    ],
    chaosScenarios: [
      {
        id: 'presence',
        name: 'Chaos 1: 100k Users Close App Simultaneously',
        trigger: 'Mass disconnect after live event.',
        brokenWithoutDefense: 'Broadcasting "Offline" to 500 friends × 100k users = 50M fan-out storm.',
        defenseMechanism: 'Lazy Presence Subscription + 30s Redis TTL heartbeat keys (only push status to active open chat windows).',
      },
    ],
    seniorPitch: {
      hook: 'We separate stateful WebSocket connection termination from stateless message routing, persisting chat history in wide-column time-bucketed partitions (Cassandra/ScyllaDB).',
      flow: 'When User A sends a message, their WebSocket gateway assigns a monotonic Snowflake ID, writes to ScyllaDB, looks up User B gateway pod in Redis, and pushes the frame in <50ms (or falls back to APNs/FCM push if offline).',
      tradeoffs: 'Wide-column partitioning by `(channel_id, time_bucket)` prevents unbounded partition growth in active Slack channels while keeping recent message pagination single-seek.',
      defense: 'Relational B-Tree indexes degrade under 1M random message inserts/sec, and eager presence fan-out collapses on large groups.',
    },
    references: [
      { title: 'Discord Engineering — How Discord Stores Trillions of Messages', author: 'Discord Eng', url: 'https://discord.com/blog/how-discord-stores-trillions-of-messages', takeaway: 'Migrating from Cassandra to ScyllaDB with request coalescing.' },
    ],
  },
  {
    id: 'sys-08-video-streaming',
    tier: 3,
    title: '8. Video Ingestion & Adaptive Bitrate Streaming (YouTube / Netflix)',
    difficulty: 'Hard',
    companies: ['Netflix', 'Google', 'Hotstar', 'Amazon'],
    scale: { dau: '200,000,000', peakRps: '50 Tbps Edge Egress', latency: '< 400ms startup', ratio: '1000:1 Read/Stream' },
    naiveFailure: {
      setup: 'Upload raw 4GB MP4 to web server and stream the same file to all devices.',
      breakingPoint: 'Mobile users on 3G buffer endlessly while 4GB uploads crash web server memory.',
      crashes: ['Upload OOM: Buffering multi-GB video in web RAM.', 'Zero Adaptive Bitrate: No 360p/720p/1080p segment switching.'],
    },
    architectureNodes: [
      { id: 's3', label: 'Pre-Signed Multipart S3 Upload', role: 'Client uploads 5MB chunks directly to Object Storage with resumable ETags.', metric: 'Zero Web RAM Used', color: '#38BDF8' },
      { id: 'dag', label: 'DAG Chunking & FFmpeg Workers', role: 'Splits video into GOPs, transcodes 360p..4K in parallel, generates HLS .m3u8 manifest.', metric: 'Parallel Transcode', color: '#FBBF24' },
      { id: 'cdn', label: 'Global Edge CDN (OpenConnect)', role: 'Caches 4-second .ts/.m4s video segments at ISP edge POPs.', metric: '98% Edge Offload', color: '#34D399' },
    ],
    chaosScenarios: [
      {
        id: 'network_drop',
        name: 'Chaos 1: User Enters Elevator (Bandwidth Drops 50Mbps -> 1Mbps)',
        trigger: 'Sudden mobile network degradation mid-playback.',
        brokenWithoutDefense: 'Video freezes with a spinning loader.',
        defenseMechanism: 'HLS/DASH client player reads `.m3u8` master manifest and seamlessly requests the next 4-second chunk at 360p instead of 4K.',
      },
    ],
    seniorPitch: {
      hook: 'We offload raw video ingestion via resumable S3 pre-signed multipart uploads, process videos through a parallel DAG transcoding pipeline, and serve 4-second Adaptive Bitrate (HLS/DASH) segments from Edge CDNs.',
      flow: 'Uploaded video is split at keyframe boundaries into independent chunks, transcoded concurrently across worker pools into multiple resolutions/codecs, and packaged with an .m3u8 manifest so client players dynamically adapt quality to network bandwidth.',
      tradeoffs: 'Pre-transcoding into 6 resolution tiers increases storage cost by ~3x but guarantees stall-free playback and 98% CDN cache hit rates.',
      defense: 'Streaming monolithic MP4 files from origin servers saturates datacenter egress and cannot adapt to fluctuating mobile bandwidth.',
    },
    references: [
      { title: 'Netflix TechBlog — Open Connect & Adaptive Streaming', author: 'Netflix Eng', url: 'https://netflixtechblog.com/', takeaway: 'DAG video encoding and ISP edge caching.' },
    ],
  },
  {
    id: 'sys-09-geospatial-matching',
    tier: 3,
    title: '9. Geospatial Driver-Rider Matching Engine (Uber H3 / Quadtrees)',
    difficulty: 'Hard',
    companies: ['Uber', 'Ola', 'Swiggy', 'DoorDash'],
    scale: { dau: '30,000,000', peakRps: '250,000 GPS pings/sec', latency: '< 150ms match', ratio: 'Write-Heavy GPS Stream' },
    naiveFailure: {
      setup: 'SQL `SELECT * FROM drivers WHERE lat BETWEEN ... AND lng BETWEEN ...` on every ride request.',
      breakingPoint: '1,000,000 active drivers emit GPS pings every 4 seconds (250k writes/sec).',
      crashes: ['B-Tree Index Thrashing: Constant lat/lng UPDATEs lock SQL indexes; 2D range scans take 4+ seconds.'],
    },
    architectureNodes: [
      { id: 'loc', label: 'Location Ingestion Gateway', role: 'Receives 250k GPS pings/sec and maps (lat, lng) to Uber H3 Hexagon ID.', metric: 'O(1) Hex Lookup', color: '#38BDF8' },
      { id: 'h3', label: 'In-Memory H3 Spatial Index', role: 'Stores active drivers per H3 cell in Redis; k-ring expansion finds nearest drivers in <5ms.', metric: 'Uniform Ring Search', color: '#34D399' },
      { id: 'match', label: 'Dispatch & Distributed Lock', role: 'Acquires 15s atomic driver lock (`SET NX EX 15`) so 2 riders never get the same cab.', metric: 'Zero Double-Dispatch', color: '#FBBF24' },
    ],
    chaosScenarios: [
      {
        id: 'double',
        name: 'Chaos 1: Two Riders Request Cab at Same Airport Terminal',
        trigger: 'Concurrent match workers pick Driver #882 as closest.',
        brokenWithoutDefense: 'Both riders are assigned Driver #882.',
        defenseMechanism: 'Atomic Redis lock `SET driver_lock:882 rider_id NX EX 15` ensures only one dispatch wins while the other picks the 2nd closest driver.',
      },
    ],
    seniorPitch: {
      hook: 'To handle 250,000 GPS writes/sec and sub-100ms proximity search, we index moving drivers in memory using Uber H3 hexagonal cells paired with atomic distributed dispatch locks.',
      flow: 'Driver pings update their current H3 cell in an in-memory spatial store; when a rider requests a trip, we query the origin H3 cell and expand outward in k-rings, ranking candidates by road ETA and locking the winning driver via Redis SET NX.',
      tradeoffs: 'H3 hexagons have equidistant neighbors (unlike rectangular Geohashes with distortion at cell edges), making radial ring expansion and surge-pricing aggregation uniform.',
      defense: 'Traditional SQL B-Trees cannot sustain 250k spatial coordinate updates/sec without severe index fragmentation and lock contention.',
    },
    references: [
      { title: 'Uber Engineering — H3: Uber Hexagonal Hierarchical Spatial Index', author: 'Uber Eng', url: 'https://www.uber.com/blog/h3/', takeaway: 'Why hexagonal spatial indexing beats rectangular grids and SQL range scans.' },
    ],
  },
  {
    id: 'sys-10-payment-ledger',
    tier: 3,
    title: '10. Idempotent Payment Processing & Double-Entry Ledger (Stripe / Razorpay)',
    difficulty: 'Hard',
    companies: ['Stripe', 'Razorpay', 'PhonePe', 'PayPal'],
    scale: { dau: '50,000,000', peakRps: '25,000 txns/sec', latency: '< 300ms commit', ratio: '100% ACID Strict Consistency' },
    naiveFailure: {
      setup: 'API calls bank gateway and then updates SQL balance without idempotency keys or outbox.',
      breakingPoint: 'User taps "Pay ₹5,000" twice on a flaky train network, or pod crashes right after bank charge.',
      crashes: ['Double Charge: Customer billed ₹10,000.', 'Ghost Charge: Bank debited money, but order DB shows UNPAID.'],
    },
    architectureNodes: [
      { id: 'idem', label: 'Idempotency-Key Lock Store', role: 'Atomically records client `Idempotency-Key`; returns cached receipt on network retries.', metric: 'Exactly-Once Semantics', color: '#34D399' },
      { id: 'ledger', label: 'Immutable Double-Entry Ledger', role: 'Append-only debit/credit journal rows where sum(entries) == 0; never uses mutable UPDATE balance.', metric: '100% Auditable', color: '#38BDF8' },
      { id: 'outbox', label: 'Transactional Outbox & Saga', role: 'Commits ledger entry + outbox event in 1 ACID txn; orchestrates compensating refunds on failure.', metric: 'Zero Lost Events', color: '#FBBF24' },
    ],
    chaosScenarios: [
      {
        id: 'retry',
        name: 'Chaos 1: Mobile App Retries POST /pay 3 Times on Timeout',
        trigger: 'Network packet drop on HTTP response.',
        brokenWithoutDefense: 'Customer credit card is charged 3 times.',
        defenseMechanism: 'Client sends `Idempotency-Key: uuid`; server acquires atomic DB/Redis lock on key and replays the original transaction result.',
      },
    ],
    seniorPitch: {
      hook: 'Financial systems prioritize strict consistency and zero double-charges using client-generated Idempotency Keys, an immutable append-only Double-Entry Ledger, and the Transactional Outbox pattern.',
      flow: 'Every payment request locks on its Idempotency-Key, executes PSP authorization, and writes balanced debit/credit rows plus an Outbox event in a single ACID transaction, with a nightly reconciliation pipeline verifying bank settlement files.',
      tradeoffs: 'We trade raw write throughput for serializable ACID guarantees on ledger rows and use Saga compensating transactions (automated refunds) when downstream fulfillment fails.',
      defense: 'Mutable `UPDATE accounts SET balance = balance - 100` destroys audit trails and cannot be reconciled when partial failures occur.',
    },
    references: [
      { title: 'Stripe Blog — Designing Robust and Predictable APIs with Idempotency', author: 'Brandur Leach (Stripe)', url: 'https://stripe.com/blog/idempotency', takeaway: 'Atomic idempotency keys, recovery points, and double-entry ledgers.' },
      { title: 'Martin Kleppmann — Designing Data-Intensive Applications (DDIA)', author: 'Martin Kleppmann', url: 'https://dataintensive.net/', takeaway: 'Transactions, serializability, and exactly-once semantics.' },
    ],
  },
]


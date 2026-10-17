"""Data definitions for Batch 4C — Peak III (SQL Mastery & DBMS Internals)."""

null = None
true = True
false = False

LESSONS_4C = []

# ==========================================
# W25: Transactions & ACID (3 lessons)
# ==========================================

LESSONS_4C.append({
    "dir": "25-transactions-acid",
    "world_id": 25,
    "slug": "sql-acid-money-transfer",
    "lc": 9321,
    "citadel_id": "sql_dbms",
    "brick_layer": 4,
    "runner_type": "sql_sqlite",
    "difficulty": "Medium",
    "title": "ACID Atomic Money Transfer & Rollback",
    "patterns": ["transactions", "acid-atomicity", "conditional-case"],
    "visualizer": "sql_pipeline",
    "data": {
        "slug": "sql-acid-money-transfer",
        "lc": 9321,
        "citadel_id": "sql_dbms",
        "brick_layer": 4,
        "runner_type": "sql_sqlite",
        "concept": {
            "problem_it_solves": "How do banking database systems guarantee that a money transfer between two accounts never debits the sender without crediting the receiver? Under ACID Atomicity ('all-or-nothing'), a transaction must either complete all operations or abort completely. If the sender's account has insufficient funds, the transaction rolls back, leaving all balances unchanged.",
            "brute_force": "Executing two separate un-fenced UPDATE statements across network calls without transaction boundaries, risking balance loss if the network crashes between queries.",
            "brute_force_complexity": "Severe data corruption and phantom money loss.",
            "key_insight": "A transaction evaluates preconditions atomically: if the sender balance check passes, both balances adjust; otherwise, neither balance changes and the transaction reports a rollback.",
            "real_world": "UPI peer-to-peer transfers, Stripe wallet payouts, and banking ledger debits.",
        },
        "statement": {
            "clean": """Write a SQL query to simulate an atomic money transfer transaction between accounts:
Transfer `200` units from Account `1` (`Aarav`) to Account `2` (`Priya`).

Table schema:
```sql
CREATE TABLE Accounts (
    id INTEGER PRIMARY KEY,
    owner TEXT,
    balance INTEGER
);
```

Transaction Rules:
1. Verify whether Account `1` has at least `200` units: `(SELECT balance FROM Accounts WHERE id = 1) >= 200`.
2. If sufficient funds exist, the transaction COMMITS:
   - Account `1` balance decreases by `200`.
   - Account `2` balance increases by `200`.
   - Status column is `'COMMITTED'`.
3. If insufficient funds exist, the transaction ROLLS BACK:
   - All account balances remain unchanged.
   - Status column is `'ROLLEDBACK'`.

Return columns: `id`, `owner`, `balance`, `status` ordered by `id` ascending.""",
            "oa_story": """**PayLoop Core Banking Engine — Uncommitted Ledger Recovery**

During peak UPI transaction hours, network drops between PayLoop's switch and partner bank servers severed connections midway through wallet debits. Because legacy scripts lacked atomic rollback checks, sender balances were debited but receiver accounts never received funds.

Implement this SQL transaction simulation to model how ACID atomicity enforces all-or-nothing balance transfers and preserves ledger consistency.""",
            "trigger_keywords": ["atomic money transfer transaction", "Accounts", "ROLLEDBACK"],
            "examples": [
                {
                    "input": "Accounts: [(1, 'Aarav', 1000), (2, 'Priya', 500)], transfer 200 from 1 to 2",
                    "output": "[(1, 'Aarav', 800, 'COMMITTED'), (2, 'Priya', 700, 'COMMITTED')]",
                    "explanation": "Aarav has 1000 >= 200, so transfer commits: Aarav becomes 800, Priya becomes 700.",
                },
            ],
            "constraints": [
                "Accounts table contains between 2 and 1000 rows",
                "balance >= 0",
            ],
        },
        "constraint_quiz": {
            "prompt": "What does the 'A' (Atomicity) in ACID guarantee during a multi-row database transaction?",
            "options": [
                "Either all SQL modifications in the transaction succeed and commit, or all are completely undone (rolled back)",
                "Transactions execute on only one CPU core",
                "Transactions run in zero nanoseconds",
                "Data is compressed using gzip",
            ],
            "answer": 0,
            "explanation": "Atomicity ensures all-or-nothing execution: if any statement in the transaction fails or aborts, all prior changes made within the transaction are rolled back.",
        },
        "pattern_quiz": {
            "prompt": "How does a SQL CASE statement simulate conditional transaction execution in a single query?",
            "options": [
                "By checking the subquery predicate `(SELECT balance FROM Accounts WHERE id = 1) >= 200` inside the CASE expression",
                "By creating an asynchronous thread in SQLite",
                "By dropping the table on error",
                "By converting integer balances to floating-point numbers",
            ],
            "answer": 0,
            "explanation": "Evaluating the sender balance check in the outer CASE branch determines whether to apply the balance shift or keep the original balance untouched.",
        },
        "schema_sql": """CREATE TABLE Accounts (
    id INTEGER PRIMARY KEY,
    owner TEXT,
    balance INTEGER
);""",
        "seed_sql": """INSERT INTO Accounts VALUES
    (1, 'Aarav', 1000),
    (2, 'Priya', 500),
    (3, 'Vikram', 300);""",
        "function": {
            "name": "execute_sql",
            "params": [],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """-- Write your SQL query below to simulate atomic transfer of 200 from id 1 to id 2
SELECT
    id,
    owner,
    balance,
    'COMMITTED' AS status
FROM Accounts
ORDER BY id;
""",
        "tests": [
            {
                "args": [],
                "expected": [
                    [1, "Aarav", 800, "COMMITTED"],
                    [2, "Priya", 700, "COMMITTED"],
                    [3, "Vikram", 300, "COMMITTED"],
                ],
                "note": "Successful transfer committed",
            },
            {
                "args": [],
                "expected": null,
                "note": "Reference verification",
            },
            {
                "args": [],
                "expected": null,
                "note": "Consistency check",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Check sender balance threshold",
                "goal": "Write scalar subquery checking if balance is >= 200.",
                "instructions": "Select `(SELECT balance FROM Accounts WHERE id = 1) >= 200 AS can_transfer;`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT (SELECT balance FROM Accounts WHERE id = 1) >= 200 AS can_transfer;
""",
                "tests": [{"args": [], "expected": [[1]]}],
                "solution": """SELECT (SELECT balance FROM Accounts WHERE id = 1) >= 200 AS can_transfer;
""",
                "hint": "Use a scalar subquery against Accounts.",
            },
            {
                "skill": "core",
                "title": "Apply conditional balance adjustment",
                "goal": "Adjust balance only if sender has sufficient funds.",
                "instructions": "Write CASE statement updating id 1 by -200 and id 2 by +200.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT id, CASE WHEN id = 1 THEN balance - 200 WHEN id = 2 THEN balance + 200 ELSE balance END AS balance FROM Accounts ORDER BY id;
""",
                "tests": [{"args": [], "expected": [[1, 800], [2, 700], [3, 300]]}],
                "solution": """SELECT id, CASE WHEN id = 1 THEN balance - 200 WHEN id = 2 THEN balance + 200 ELSE balance END AS balance FROM Accounts ORDER BY id;
""",
                "hint": "Use CASE WHEN id = 1 ... WHEN id = 2 ... ELSE balance END.",
            },
            {
                "skill": "edge",
                "title": "Set status flag",
                "goal": "Output COMMITTED or ROLLEDBACK based on check.",
                "instructions": "Return status string based on balance check.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT CASE WHEN (SELECT balance FROM Accounts WHERE id = 1) >= 200 THEN 'COMMITTED' ELSE 'ROLLEDBACK' END AS status;
""",
                "tests": [{"args": [], "expected": [["COMMITTED"]]}],
                "solution": """SELECT CASE WHEN (SELECT balance FROM Accounts WHERE id = 1) >= 200 THEN 'COMMITTED' ELSE 'ROLLEDBACK' END AS status;
""",
                "hint": "Return COMMITTED or ROLLEDBACK.",
            },
        ],
        "hints": [
            "Use `(SELECT balance FROM Accounts WHERE id = 1) >= 200` to test if Account 1 has sufficient funds.",
            "In the `balance` expression, wrap the id checks inside a condition that tests the sender balance.",
            """| # Pseudocode Blueprint
| SELECT id, owner,
|   CASE WHEN sender_balance >= 200 THEN
|       CASE WHEN id = 1 THEN balance - 200
|            WHEN id = 2 THEN balance + 200
|            ELSE balance END
|   ELSE balance END AS balance,
|   CASE WHEN sender_balance >= 200 THEN 'COMMITTED' ELSE 'ROLLEDBACK' END AS status
| FROM Accounts ORDER BY id;""",
        ],
        "solution": {
            "code": """SELECT
    id,
    owner,
    CASE
        WHEN (SELECT balance FROM Accounts WHERE id = 1) >= 200 THEN
            CASE
                WHEN id = 1 THEN balance - 200
                WHEN id = 2 THEN balance + 200
                ELSE balance
            END
        ELSE balance
    END AS balance,
    CASE
        WHEN (SELECT balance FROM Accounts WHERE id = 1) >= 200 THEN 'COMMITTED'
        ELSE 'ROLLEDBACK'
    END AS status
FROM Accounts
ORDER BY id;
""",
            "explanation": "The query checks the precondition: Account 1 must have at least 200 units. If true, Account 1 is decremented by 200 and Account 2 is incremented by 200, outputting 'COMMITTED'. If Account 1 has less than 200, balances remain untouched and status reports 'ROLLEDBACK', simulating atomic all-or-nothing execution.",
            "time": "O(N) single scan of Accounts table",
            "space": "O(1) memory overhead",
        },
        "pitch_script": """**(Clarify)** "We need to simulate an atomic bank transfer of 200 units from Account 1 to Account 2, committing if the sender has sufficient funds, or rolling back without mutating balances if funds are insufficient."

**(Brute force)** "Executing separate UPDATE statements without an atomic check risks negative balances or orphaned debits if a crash occurs between statements."

**(Trigger)** "Simulating all-or-nothing transfer preconditions with a status outcome signals ACID atomicity modeling."

**(Optimal)** "We evaluate `(SELECT balance FROM Accounts WHERE id = 1) >= 200`. In the balance column, if sufficient funds exist, we subtract 200 from id 1 and add 200 to id 2. Otherwise, we leave the balance unchanged. The status column similarly reports COMMITTED or ROLLEDBACK."

**(Complexity)** "Executes in O(N) time with O(1) space." """,
        "twist": {
            "lc": 9322,
            "title": "Optimistic Locking & Lost Update Prevention",
            "why": "Once atomicity is guaranteed, concurrent transactions updating the same row require optimistic locking to prevent lost updates.",
        },
        "viz": {
            "title": "ACID Transaction State Pipeline",
            "type": "sql_pipeline",
        },
    },
})

LESSONS_4C.append({
    "dir": "25-transactions-acid",
    "world_id": 25,
    "slug": "sql-lost-update-optimistic-lock",
    "lc": 9322,
    "citadel_id": "sql_dbms",
    "brick_layer": 4,
    "runner_type": "sql_sqlite",
    "difficulty": "Medium",
    "title": "Optimistic Locking & Lost Update Prevention",
    "patterns": ["lost-update", "optimistic-locking", "concurrency-control"],
    "visualizer": "sql_pipeline",
    "data": {
        "slug": "sql-lost-update-optimistic-lock",
        "lc": 9322,
        "citadel_id": "sql_dbms",
        "brick_layer": 4,
        "runner_type": "sql_sqlite",
        "concept": {
            "problem_it_solves": "When two concurrent transactions read the same inventory item at stock = 10, both subtract 1 and write stock = 9 back, losing one update! Optimistic Concurrency Control (OCC) solves this by appending a `version` column to the record. When updating, the client specifies the version it read (`WHERE id = 1 AND version = client_version`). If another transaction incremented the version first, the update affects 0 rows, preventing the lost update.",
            "brute_force": "Pessimistic table locking (`LOCK TABLES Inventory WRITE`), serializing all reads and crippling database throughput.",
            "brute_force_complexity": "High lock contention and severe latency bottlenecks under concurrent traffic.",
            "key_insight": "Checking `client_version = current_version` verifies that no intervening transaction modified the row since it was read, allowing safe commits while rejecting stale versions.",
            "real_world": "E-commerce checkout stock decrements, flight seat reservation, and Google Docs collaborative editing.",
        },
        "statement": {
            "clean": """Write a SQL query to simulate optimistic locking and lost update detection on inventory purchase orders.

Table schemas:
```sql
CREATE TABLE Inventory (
    id INTEGER PRIMARY KEY,
    product TEXT,
    stock INTEGER,
    version INTEGER
);

CREATE TABLE PurchaseOrders (
    order_id INTEGER PRIMARY KEY,
    product_id INTEGER,
    quantity INTEGER,
    client_version INTEGER
);
```

Evaluation Rules:
1. Join `PurchaseOrders po` with `Inventory i` on `po.product_id = i.id`.
2. Compare `po.client_version` against `i.version`:
   - If `po.client_version = i.version`: update is safe, `outcome = 'SUCCESS_COMMITTED'`.
   - If `po.client_version != i.version`: lost update collision detected, `outcome = 'REJECTED_STALE_VERSION'`.
3. Return columns:
   - `order_id`
   - `product`
   - `quantity`
   - `client_version`
   - `current_version`: aliased from `i.version`
   - `outcome`

Order by `po.order_id` ascending.""",
            "oa_story": """**KiranaKart Flash Sale — Concurrency Collision Audit**

During a 60-second flash sale for 10 flagship smartphones, 5,000 customers checked out simultaneously. Two users both submitted order forms showing stock version 1. The database processed both requests, selling 11 units when only 10 existed in the warehouse.

Implement this optimistic locking query to reject stale versions and prove how version-checked updates prevent lost updates under concurrency.""",
            "trigger_keywords": ["optimistic locking and lost update", "Inventory", "PurchaseOrders"],
            "examples": [
                {
                    "input": "Inventory: [(1, 'Laptop', 10, 1)]; PurchaseOrders: [(101, 1, 1, 1), (102, 1, 1, 2)]",
                    "output": "[(101, 'Laptop', 1, 1, 1, 'SUCCESS_COMMITTED'), (102, 'Laptop', 1, 1, 2, 'REJECTED_STALE_VERSION')]",
                    "explanation": "Order 101 matches current version 1 (committed). Order 102 expects version 2 when current is 1 (rejected).",
                },
            ],
            "constraints": [
                "1 <= len(Inventory) <= 1000",
                "1 <= len(PurchaseOrders) <= 1000",
            ],
        },
        "constraint_quiz": {
            "prompt": "How does Optimistic Concurrency Control (OCC) prevent the Lost Update anomaly without holding long database locks?",
            "options": [
                "By verifying that the row's version number in the database has not changed since the client read it",
                "By forcing all database clients to disconnect during writes",
                "By making the database read-only",
                "By using Redis instead of SQL",
            ],
            "answer": 0,
            "explanation": "Optimistic locking checks `WHERE id = ? AND version = ?`. If another transaction already committed and bumped the version, the update affects 0 rows, signaling a collision.",
        },
        "pattern_quiz": {
            "prompt": "When is Optimistic Locking preferred over Pessimistic Locking (`SELECT FOR UPDATE`)?",
            "options": [
                "When read operations far outnumber write operations and lock conflicts are infrequent",
                "When write conflicts occur on 99% of transactions",
                "Only when tables have fewer than 10 rows",
                "When tables lack primary keys",
            ],
            "answer": 0,
            "explanation": "Optimistic locking avoids locking overhead during reads, making it ideal for high-read, low-contention workloads.",
        },
        "schema_sql": """CREATE TABLE Inventory (
    id INTEGER PRIMARY KEY,
    product TEXT,
    stock INTEGER,
    version INTEGER
);

CREATE TABLE PurchaseOrders (
    order_id INTEGER PRIMARY KEY,
    product_id INTEGER,
    quantity INTEGER,
    client_version INTEGER
);""",
        "seed_sql": """INSERT INTO Inventory VALUES
    (1, 'Laptop', 10, 1),
    (2, 'Monitor', 5, 2);

INSERT INTO PurchaseOrders VALUES
    (101, 1, 1, 1),
    (102, 1, 2, 0),
    (103, 2, 1, 2);""",
        "function": {
            "name": "execute_sql",
            "params": [],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """-- Write your SQL query below to evaluate purchase orders against inventory version
SELECT
    po.order_id,
    i.product,
    po.quantity,
    po.client_version,
    i.version AS current_version,
    'SUCCESS_COMMITTED' AS outcome
FROM PurchaseOrders po
JOIN Inventory i ON po.product_id = i.id
ORDER BY po.order_id;
""",
        "tests": [
            {
                "args": [],
                "expected": [
                    [101, "Laptop", 1, 1, 1, "SUCCESS_COMMITTED"],
                    [102, "Laptop", 2, 0, 1, "REJECTED_STALE_VERSION"],
                    [103, "Monitor", 1, 2, 2, "SUCCESS_COMMITTED"],
                ],
                "note": "Version match committed, stale version rejected",
            },
            {
                "args": [],
                "expected": null,
                "note": "Reference verification",
            },
            {
                "args": [],
                "expected": null,
                "note": "Consistency check",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Join purchase orders with inventory",
                "goal": "Join orders to inventory on product_id.",
                "instructions": "Select `po.order_id, i.product FROM PurchaseOrders po JOIN Inventory i ON po.product_id = i.id ORDER BY po.order_id;`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT po.order_id, i.product FROM PurchaseOrders po JOIN Inventory i ON po.product_id = i.id ORDER BY po.order_id;
""",
                "tests": [{"args": [], "expected": [[101, "Laptop"], [102, "Laptop"], [103, "Monitor"]]}],
                "solution": """SELECT po.order_id, i.product FROM PurchaseOrders po JOIN Inventory i ON po.product_id = i.id ORDER BY po.order_id;
""",
                "hint": "Join on po.product_id = i.id.",
            },
            {
                "skill": "core",
                "title": "Evaluate version match outcome",
                "goal": "Output SUCCESS_COMMITTED or REJECTED_STALE_VERSION.",
                "instructions": "Write CASE comparing `po.client_version = i.version`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT po.order_id, CASE WHEN po.client_version = i.version THEN 'SUCCESS_COMMITTED' ELSE 'REJECTED_STALE_VERSION' END AS outcome FROM PurchaseOrders po JOIN Inventory i ON po.product_id = i.id ORDER BY po.order_id;
""",
                "tests": [{"args": [], "expected": [[101, "SUCCESS_COMMITTED"], [102, "REJECTED_STALE_VERSION"], [103, "SUCCESS_COMMITTED"]]}],
                "solution": """SELECT po.order_id, CASE WHEN po.client_version = i.version THEN 'SUCCESS_COMMITTED' ELSE 'REJECTED_STALE_VERSION' END AS outcome FROM PurchaseOrders po JOIN Inventory i ON po.product_id = i.id ORDER BY po.order_id;
""",
                "hint": "Use CASE WHEN po.client_version = i.version.",
            },
            {
                "skill": "edge",
                "title": "Alias current version column",
                "goal": "Alias `i.version AS current_version`.",
                "instructions": "Select order_id and `i.version AS current_version`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT po.order_id, i.version AS current_version FROM PurchaseOrders po JOIN Inventory i ON po.product_id = i.id ORDER BY po.order_id;
""",
                "tests": [{"args": [], "expected": [[101, 1], [102, 1], [103, 2]]}],
                "solution": """SELECT po.order_id, i.version AS current_version FROM PurchaseOrders po JOIN Inventory i ON po.product_id = i.id ORDER BY po.order_id;
""",
                "hint": "Alias `i.version AS current_version`.",
            },
        ],
        "hints": [
            "Join `PurchaseOrders po` to `Inventory i` on `po.product_id = i.id`.",
            "Use a CASE statement: `WHEN po.client_version = i.version THEN 'SUCCESS_COMMITTED' ELSE 'REJECTED_STALE_VERSION'`.",
            """| # Pseudocode Blueprint
| SELECT po.order_id, i.product, po.quantity, po.client_version,
|        i.version AS current_version,
|        CASE WHEN po.client_version = i.version THEN 'SUCCESS_COMMITTED'
|             ELSE 'REJECTED_STALE_VERSION' END AS outcome
| FROM PurchaseOrders po JOIN Inventory i ON po.product_id = i.id
| ORDER BY po.order_id;""",
        ],
        "solution": {
            "code": """SELECT
    po.order_id,
    i.product,
    po.quantity,
    po.client_version,
    i.version AS current_version,
    CASE
        WHEN po.client_version = i.version THEN 'SUCCESS_COMMITTED'
        ELSE 'REJECTED_STALE_VERSION'
    END AS outcome
FROM PurchaseOrders po
JOIN Inventory i ON po.product_id = i.id
ORDER BY po.order_id;
""",
            "explanation": "Joining the purchase orders with the inventory records compares the client's cached version against the live row version. Orders matching the current database version commit safely, while orders carrying stale versions are flagged as concurrency conflicts, preventing lost updates.",
            "time": "O(P + I) hash join",
            "space": "O(I) for in-memory inventory hash table",
        },
        "pitch_script": """**(Clarify)** "We need to evaluate incoming purchase orders against live inventory versions to identify which orders commit safely versus which collide due to stale version numbers."

**(Brute force)** "Blindly updating stock without version checks causes lost updates where concurrent writes clobber each other."

**(Trigger)** "Comparing expected client version with current database version signals Optimistic Concurrency Control (OCC)."

**(Optimal)** "We join PurchaseOrders with Inventory on product_id. We check `po.client_version = i.version`. Matching versions receive 'SUCCESS_COMMITTED', while mismatched versions receive 'REJECTED_STALE_VERSION'. We project the order details and order by order_id."

**(Complexity)** "Executes in O(P + I) time and O(I) space." """,
        "twist": {
            "lc": 9323,
            "title": "Preventing N+1 Queries with Relational Aggregation Join",
            "why": "Optimistic locking protects write concurrency; on read paths, replacing N+1 query loops with relational joins prevents database saturation.",
        },
        "viz": {
            "title": "Optimistic Locking Version Pipeline",
            "type": "sql_pipeline",
        },
    },
})

LESSONS_4C.append({
    "dir": "25-transactions-acid",
    "world_id": 25,
    "slug": "sql-prevent-n-plus-one-join",
    "lc": 9323,
    "citadel_id": "sql_dbms",
    "brick_layer": 4,
    "runner_type": "sql_sqlite",
    "difficulty": "Medium",
    "title": "Eliminate N+1 Queries with Relational Aggregation",
    "patterns": ["n-plus-one", "left-join", "group-by", "aggregation"],
    "visualizer": "sql_pipeline",
    "data": {
        "slug": "sql-prevent-n-plus-one-join",
        "lc": 9323,
        "citadel_id": "sql_dbms",
        "brick_layer": 4,
        "runner_type": "sql_sqlite",
        "concept": {
            "problem_it_solves": "Why do ORM-driven applications crawl under production traffic? The N+1 query antipattern occurs when code executes 1 query to fetch N parent records (e.g. Users), and then executes N subsequent queries inside a loop to fetch each user's orders. Replacing this loop with a single `LEFT JOIN` and `GROUP BY` collapses N+1 network roundtrips into 1 set-based relational query.",
            "brute_force": "Looping over 1,000 users in Python/Node.js and executing 1,000 separate `SELECT * FROM Orders WHERE user_id = ?` queries, overwhelming the database.",
            "brute_force_complexity": "O(N) network roundtrips and high connection pool contention.",
            "key_insight": "A `LEFT JOIN Orders ON Users.id = Orders.user_id` with `GROUP BY Users.id` aggregates total orders, spending, and latest order dates for all users in a single query.",
            "real_world": "Django `select_related`/`prefetch_related`, Hibernate `@BatchSize`, and GraphQL DataLoader batching.",
        },
        "statement": {
            "clean": """Write a single SQL query to prevent N+1 query loops by aggregating user order statistics in one relational pass.

Table schemas:
```sql
CREATE TABLE Users (
    id INTEGER PRIMARY KEY,
    name TEXT
);

CREATE TABLE Orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    amount INTEGER,
    order_date TEXT
);
```

Compute for each user:
- `user_id`: user's id
- `name`: user's name
- `total_orders`: count of orders placed (`COUNT(o.id)` — must be `0` for users with no orders)
- `total_spent`: sum of order amounts (`COALESCE(SUM(o.amount), 0)`)
- `latest_order_date`: latest order date, or `'NO_ORDERS'` if none (`COALESCE(MAX(o.order_date), 'NO_ORDERS')`)

Order by `user_id` ascending.""",
            "oa_story": """**SwiftCart Merchant Dashboard — API Timeout Post-Mortem**

SwiftCart's seller dashboard took 14 seconds to load for merchants with 500 customers. APM profiling revealed the Ruby on Rails backend was executing 501 separate SQL queries: 1 to load customers, and 500 separate queries to count each customer's orders.

Rewrite this inefficient loop into a single relational JOIN with GROUP BY aggregation to load all customer analytics in a single round-trip.""",
            "trigger_keywords": ["prevent n+1 query loops", "Users", "Orders"],
            "examples": [
                {
                    "input": "Users: [(1, 'Aarav'), (2, 'Priya'), (3, 'Vikram')]; Orders: [(10, 1, 500, '2026-01-01'), (11, 1, 700, '2026-01-15'), (12, 2, 300, '2026-02-01')]",
                    "output": "[(1, 'Aarav', 2, 1200, '2026-01-15'), (2, 'Priya', 1, 300, '2026-02-01'), (3, 'Vikram', 0, 0, 'NO_ORDERS')]",
                    "explanation": "Aarav has 2 orders totaling 1200. Priya has 1 order of 300. Vikram has 0 orders.",
                },
            ],
            "constraints": [
                "1 <= len(Users) <= 1000",
                "0 <= len(Orders) <= 5000",
            ],
        },
        "constraint_quiz": {
            "prompt": "Why does the N+1 query problem severely degrade web application performance?",
            "options": [
                "Because executing N individual queries incurs N separate database round-trip network latencies, connection checkout overhead, and query parsing overhead",
                "Because SQL engines only permit 10 queries per hour",
                "Because N queries delete table indexes",
                "Because Python limits SQL execution to 1 query per second",
            ],
            "answer": 0,
            "explanation": "Even if each query takes only 2ms, executing 500 separate queries adds 1,000ms of cumulative network latency and connection pool serialization.",
        },
        "pattern_quiz": {
            "prompt": "Why must `LEFT JOIN` be used instead of `INNER JOIN` when eliminating N+1 loops across parent-child tables?",
            "options": [
                "To prevent parent records that have zero child records (e.g. users who placed no orders) from being excluded from the result",
                "Because LEFT JOIN runs faster than INNER JOIN",
                "Because SQLite does not support INNER JOIN with GROUP BY",
                "To automatically generate primary keys",
            ],
            "answer": 0,
            "explanation": "An INNER JOIN drops any user with 0 orders. A LEFT JOIN preserves all users, allowing COUNT(o.id) to evaluate to 0 for inactive users.",
        },
        "schema_sql": """CREATE TABLE Users (
    id INTEGER PRIMARY KEY,
    name TEXT
);

CREATE TABLE Orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    amount INTEGER,
    order_date TEXT
);""",
        "seed_sql": """INSERT INTO Users VALUES
    (1, 'Aarav'),
    (2, 'Priya'),
    (3, 'Vikram');

INSERT INTO Orders VALUES
    (10, 1, 500, '2026-01-01'),
    (11, 1, 700, '2026-01-15'),
    (12, 2, 300, '2026-02-01');""",
        "function": {
            "name": "execute_sql",
            "params": [],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """-- Write your SQL query below to aggregate user orders in a single pass
SELECT
    u.id AS user_id,
    u.name,
    COUNT(o.id) AS total_orders,
    0 AS total_spent,
    'NO_ORDERS' AS latest_order_date
FROM Users u
LEFT JOIN Orders o ON u.id = o.user_id
GROUP BY u.id, u.name
ORDER BY u.id;
""",
        "tests": [
            {
                "args": [],
                "expected": [
                    [1, "Aarav", 2, 1200, "2026-01-15"],
                    [2, "Priya", 1, 300, "2026-02-01"],
                    [3, "Vikram", 0, 0, "NO_ORDERS"],
                ],
                "note": "Aggregated user statistics with zero-order user preserved",
            },
            {
                "args": [],
                "expected": null,
                "note": "Reference verification",
            },
            {
                "args": [],
                "expected": null,
                "note": "Consistency check",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Left join users and orders",
                "goal": "Join users with orders preserving orphan users.",
                "instructions": "Select `u.id, u.name, o.id AS order_id FROM Users u LEFT JOIN Orders o ON u.id = o.user_id ORDER BY u.id;`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT u.id, u.name, o.id AS order_id FROM Users u LEFT JOIN Orders o ON u.id = o.user_id ORDER BY u.id;
""",
                "tests": [{"args": [], "expected": [[1, "Aarav", 10], [1, "Aarav", 11], [2, "Priya", 12], [3, "Vikram", None]]}],
                "solution": """SELECT u.id, u.name, o.id AS order_id FROM Users u LEFT JOIN Orders o ON u.id = o.user_id ORDER BY u.id;
""",
                "hint": "Use `LEFT JOIN Orders o ON u.id = o.user_id`.",
            },
            {
                "skill": "core",
                "title": "Group by user and count orders",
                "goal": "Count matching orders per user.",
                "instructions": "Group by user id and select `COUNT(o.id)`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT u.id, COUNT(o.id) AS total_orders FROM Users u LEFT JOIN Orders o ON u.id = o.user_id GROUP BY u.id ORDER BY u.id;
""",
                "tests": [{"args": [], "expected": [[1, 2], [2, 1], [3, 0]]}],
                "solution": """SELECT u.id, COUNT(o.id) AS total_orders FROM Users u LEFT JOIN Orders o ON u.id = o.user_id GROUP BY u.id ORDER BY u.id;
""",
                "hint": "Use `COUNT(o.id)` and `GROUP BY u.id`.",
            },
            {
                "skill": "edge",
                "title": "Coalesce null aggregations",
                "goal": "Handle users with 0 orders with COALESCE.",
                "instructions": "Use `COALESCE(SUM(o.amount), 0)` and `COALESCE(MAX(o.order_date), 'NO_ORDERS')`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT u.id, COALESCE(SUM(o.amount), 0) AS spent, COALESCE(MAX(o.order_date), 'NO_ORDERS') AS latest FROM Users u LEFT JOIN Orders o ON u.id = o.user_id GROUP BY u.id ORDER BY u.id;
""",
                "tests": [{"args": [], "expected": [[1, 1200, "2026-01-15"], [2, 300, "2026-02-01"], [3, 0, "NO_ORDERS"]]}],
                "solution": """SELECT u.id, COALESCE(SUM(o.amount), 0) AS spent, COALESCE(MAX(o.order_date), 'NO_ORDERS') AS latest FROM Users u LEFT JOIN Orders o ON u.id = o.user_id GROUP BY u.id ORDER BY u.id;
""",
                "hint": "Use COALESCE on SUM and MAX.",
            },
        ],
        "hints": [
            "Use `LEFT JOIN Orders o ON u.id = o.user_id` so users without orders are not dropped.",
            "Group by `u.id, u.name` and use `COUNT(o.id)` (not `COUNT(*)`, which would count 1 for NULL rows).",
            """| # Pseudocode Blueprint
| SELECT u.id AS user_id, u.name,
|        COUNT(o.id) AS total_orders,
|        COALESCE(SUM(o.amount), 0) AS total_spent,
|        COALESCE(MAX(o.order_date), 'NO_ORDERS') AS latest_order_date
| FROM Users u LEFT JOIN Orders o ON u.id = o.user_id
| GROUP BY u.id, u.name
| ORDER BY u.id;""",
        ],
        "solution": {
            "code": """SELECT
    u.id AS user_id,
    u.name,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(o.amount), 0) AS total_spent,
    COALESCE(MAX(o.order_date), 'NO_ORDERS') AS latest_order_date
FROM Users u
LEFT JOIN Orders o ON u.id = o.user_id
GROUP BY u.id, u.name
ORDER BY u.id;
""",
            "explanation": "A single LEFT JOIN links all orders to their parent users. Grouping by user id aggregates order counts, total spending, and latest order dates in a single query pass. Using COALESCE provides default values for users who have placed zero orders, preventing NULL display bugs.",
            "time": "O(U + O) using hash/merge join and group aggregation",
            "space": "O(U) for grouping hash table",
        },
        "pitch_script": """**(Clarify)** "We need to eliminate N+1 query loops by aggregating each user's total orders, cumulative spending, and latest order date in a single relational query."

**(Brute force)** "Fetching users and then issuing a separate SELECT query in a loop for each user creates hundreds of network roundtrips, causing API timeouts."

**(Trigger)** "Aggregating child metrics per parent entity in a single query signals a LEFT JOIN with GROUP BY."

**(Optimal)** "We execute `FROM Users u LEFT JOIN Orders o ON u.id = o.user_id`. We group by user id and name. We compute `COUNT(o.id)` so users with no orders show 0, and wrap `SUM` and `MAX` in `COALESCE` to default to 0 and 'NO_ORDERS' respectively."

**(Complexity)** "Executes in O(U + O) time and O(U) space." """,
        "twist": {
            "lc": 9305,
            "title": "3NF Database Decomposition & Lossless Join Verification",
            "why": "Once queries are consolidated, normalizing underlying relational tables into 3NF prevents data update anomalies.",
        },
        "viz": {
            "title": "N+1 Elimination Relational Pipeline",
            "type": "sql_pipeline",
        },
    },
})

# ==========================================
# W23: Normalization & Views (add 2 lessons)
# ==========================================

LESSONS_4C.append({
    "dir": "23-normalization-views",
    "world_id": 23,
    "slug": "sql-decompose-3nf-lossless-join",
    "lc": 9305,
    "citadel_id": "sql_dbms",
    "brick_layer": 2,
    "runner_type": "sql_sqlite",
    "difficulty": "Medium",
    "title": "3NF Decomposition & Lossless Join Verification",
    "patterns": ["3nf-normalization", "lossless-join", "schema-design"],
    "visualizer": "sql_pipeline",
    "data": {
        "slug": "sql-decompose-3nf-lossless-join",
        "lc": 9305,
        "citadel_id": "sql_dbms",
        "brick_layer": 2,
        "runner_type": "sql_sqlite",
        "concept": {
            "problem_it_solves": "Why does storing customer addresses and product prices repeatedly inside an order item row cause data corruption? In an unnormalized flat table, updating a product price requires updating thousands of historical rows, risking inconsistent data. Decomposing into Third Normal Form (3NF) isolates distinct entities (Customers, Products, OrderItems), removing transitive dependencies and guaranteeing the Lossless Join property.",
            "brute_force": "Keeping a single wide table with 40 columns, leading to update anomalies, deletion anomalies, and severe storage bloat.",
            "brute_force_complexity": "O(N) redundant data storage and prone to data inconsistency.",
            "key_insight": "A 3NF decomposition is validated by performing an INNER JOIN across the normalized tables. If the joined output reconstructs the exact original line items without spurious tuples, the decomposition is mathematically lossless.",
            "real_world": "Relational schema design for ERPs, e-commerce order databases, and microservice domain entities.",
        },
        "statement": {
            "clean": """Write a SQL query to verify a 3NF database decomposition by reconstructing order line items through a lossless join.

Normalized Table Schemas:
```sql
CREATE TABLE Customers (
    customer_id INTEGER PRIMARY KEY,
    customer_name TEXT,
    customer_email TEXT
);

CREATE TABLE Products (
    product_id INTEGER PRIMARY KEY,
    product_name TEXT,
    category TEXT,
    price INTEGER
);

CREATE TABLE OrderItems (
    order_id INTEGER,
    customer_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY(order_id, product_id)
);
```

Task:
Reconstruct the complete order item records by joining `OrderItems`, `Customers`, and `Products`.

Return columns:
- `order_id`: from `OrderItems`
- `customer_name`: from `Customers`
- `product_name`: from `Products`
- `price`: unit price from `Products`
- `quantity`: order quantity from `OrderItems`
- `item_total`: computed as `price * quantity`

Order by `order_id` ascending, then `product_name` ascending.""",
            "oa_story": """**BlinkFast Inventory Architecture — Normalization Migration**

BlinkFast's quick-commerce orders were initially dumped into a single denormalized table. When brand names were updated, old orders retained stale manufacturer names, creating tax reporting discrepancies.

The database architect decomposed the schema into 3NF (`Customers`, `Products`, and `OrderItems`). Write the verification query to prove that joining these normalized tables losslessly reconstructs complete order details.""",
            "trigger_keywords": ["3nf database decomposition", "OrderItems", "lossless join"],
            "examples": [
                {
                    "input": "OrderItems: [(1001, 1, 101, 1), (1001, 1, 102, 2)]; Customers: [(1, 'Aarav')]; Products: [(101, 'Headphones', 4000), (102, 'Keyboard', 3000)]",
                    "output": "[(1001, 'Aarav', 'Headphones', 4000, 1, 4000), (1001, 'Aarav', 'Keyboard', 3000, 2, 6000)]",
                    "explanation": "3NF normalized tables join losslessly to reconstruct line item totals.",
                },
            ],
            "constraints": [
                "Primary keys are strictly enforced",
                "Foreign keys match valid parent entity IDs",
            ],
        },
        "constraint_quiz": {
            "prompt": "What mathematical property ensures that decomposing a table into multiple normalized tables does not lose information or introduce phantom rows?",
            "options": [
                "Lossless-Join Property (Lossless Decomposition)",
                "B-Tree index rebalancing",
                "ACID Durability",
                "UTF-8 character collation",
            ],
            "answer": 0,
            "explanation": "A decomposition is lossless if and only if natural joining the decomposed tables produces exactly the original relation with no missing or spurious records.",
        },
        "pattern_quiz": {
            "prompt": "What functional dependency defines Third Normal Form (3NF)?",
            "options": [
                "Every non-key attribute must be non-transitively dependent on the primary key ('The key, the whole key, and nothing but the key, so help me Codd')",
                "All column names must start with a vowel",
                "Every table must have exactly 3 columns",
                "Tables must be stored in separate database files",
            ],
            "answer": 0,
            "explanation": "3NF requires a table to be in 2NF with no transitive dependencies: non-key columns cannot depend on other non-key columns.",
        },
        "schema_sql": """CREATE TABLE Customers (
    customer_id INTEGER PRIMARY KEY,
    customer_name TEXT,
    customer_email TEXT
);

CREATE TABLE Products (
    product_id INTEGER PRIMARY KEY,
    product_name TEXT,
    category TEXT,
    price INTEGER
);

CREATE TABLE OrderItems (
    order_id INTEGER,
    customer_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY(order_id, product_id)
);""",
        "seed_sql": """INSERT INTO Customers VALUES
    (1, 'Aarav', 'aarav@tech.in'),
    (2, 'Priya', 'priya@tech.in');

INSERT INTO Products VALUES
    (101, 'Noise-Cancelling Headphones', 'Audio', 4000),
    (102, 'Mechanical Keyboard', 'Hardware', 3000);

INSERT INTO OrderItems VALUES
    (1001, 1, 101, 1),
    (1001, 1, 102, 2),
    (1002, 2, 101, 1);""",
        "function": {
            "name": "execute_sql",
            "params": [],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """-- Write your SQL query below to verify lossless join reconstruction
SELECT
    oi.order_id,
    c.customer_name,
    p.product_name,
    p.price,
    oi.quantity,
    (p.price * oi.quantity) AS item_total
FROM OrderItems oi
JOIN Customers c ON oi.customer_id = c.customer_id
JOIN Products p ON oi.product_id = p.product_id
ORDER BY oi.order_id, p.product_name;
""",
        "tests": [
            {
                "args": [],
                "expected": [
                    [1001, "Aarav", "Mechanical Keyboard", 3000, 2, 6000],
                    [1001, "Aarav", "Noise-Cancelling Headphones", 4000, 1, 4000],
                    [1002, "Priya", "Noise-Cancelling Headphones", 4000, 1, 4000],
                ],
                "note": "Reconstructed 3NF order details",
            },
            {
                "args": [],
                "expected": null,
                "note": "Reference verification",
            },
            {
                "args": [],
                "expected": null,
                "note": "Consistency check",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Join OrderItems with Customers",
                "goal": "Join OrderItems to Customers on customer_id.",
                "instructions": "Select `oi.order_id, c.customer_name FROM OrderItems oi JOIN Customers c ON oi.customer_id = c.customer_id ORDER BY oi.order_id;`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT oi.order_id, c.customer_name FROM OrderItems oi JOIN Customers c ON oi.customer_id = c.customer_id ORDER BY oi.order_id;
""",
                "tests": [{"args": [], "expected": [[1001, "Aarav"], [1001, "Aarav"], [1002, "Priya"]]}],
                "solution": """SELECT oi.order_id, c.customer_name FROM OrderItems oi JOIN Customers c ON oi.customer_id = c.customer_id ORDER BY oi.order_id;
""",
                "hint": "Join on customer_id.",
            },
            {
                "skill": "core",
                "title": "Join with Products and compute item total",
                "goal": "Multiply price by quantity.",
                "instructions": "Select `p.product_name, (p.price * oi.quantity) AS item_total FROM OrderItems oi JOIN Products p ON oi.product_id = p.product_id ORDER BY p.product_name;`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT p.product_name, (p.price * oi.quantity) AS item_total FROM OrderItems oi JOIN Products p ON oi.product_id = p.product_id ORDER BY p.product_name;
""",
                "tests": [{"args": [], "expected": [["Mechanical Keyboard", 6000], ["Noise-Cancelling Headphones", 4000], ["Noise-Cancelling Headphones", 4000]]}],
                "solution": """SELECT p.product_name, (p.price * oi.quantity) AS item_total FROM OrderItems oi JOIN Products p ON oi.product_id = p.product_id ORDER BY p.product_name;
""",
                "hint": "Multiply price by quantity.",
            },
            {
                "skill": "edge",
                "title": "Order by order_id and product_name",
                "goal": "Apply deterministic two-column ordering.",
                "instructions": "Add `ORDER BY oi.order_id, p.product_name;`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT oi.order_id, p.product_name FROM OrderItems oi JOIN Products p ON oi.product_id = p.product_id ORDER BY oi.order_id, p.product_name;
""",
                "tests": [{"args": [], "expected": [[1001, "Mechanical Keyboard"], [1001, "Noise-Cancelling Headphones"], [1002, "Noise-Cancelling Headphones"]]}],
                "solution": """SELECT oi.order_id, p.product_name FROM OrderItems oi JOIN Products p ON oi.product_id = p.product_id ORDER BY oi.order_id, p.product_name;
""",
                "hint": "Order by order_id, product_name.",
            },
        ],
        "hints": [
            "Join `OrderItems oi` with `Customers c` on `oi.customer_id = c.customer_id`.",
            "Join with `Products p` on `oi.product_id = p.product_id` and compute `p.price * oi.quantity AS item_total`.",
            """| # Pseudocode Blueprint
| SELECT oi.order_id, c.customer_name, p.product_name, p.price, oi.quantity,
|        (p.price * oi.quantity) AS item_total
| FROM OrderItems oi
| JOIN Customers c ON oi.customer_id = c.customer_id
| JOIN Products p ON oi.product_id = p.product_id
| ORDER BY oi.order_id, p.product_name;""",
        ],
        "solution": {
            "code": """SELECT
    oi.order_id,
    c.customer_name,
    p.product_name,
    p.price,
    oi.quantity,
    (p.price * oi.quantity) AS item_total
FROM OrderItems oi
JOIN Customers c ON oi.customer_id = c.customer_id
JOIN Products p ON oi.product_id = p.product_id
ORDER BY oi.order_id, p.product_name;
""",
            "explanation": "Joining the normalized entities across their foreign keys reconstructs the original order line items without data loss or spurious combinations. This verifies the Lossless Join property of Third Normal Form (3NF) while ensuring zero redundant customer or product data is stored in OrderItems.",
            "time": "O(O + C + P) linear hash join",
            "space": "O(C + P) for in-memory entity lookup tables",
        },
        "pitch_script": """**(Clarify)** "We need to verify that our 3NF decomposition of customer and product entities reconstructs the complete order details losslessly."

**(Brute force)** "Storing customer contact information and product descriptions repeatedly in every order line item creates update and deletion anomalies."

**(Trigger)** "Reconstructing normalized entities across primary-foreign key relationships signals a lossless join verification query."

**(Optimal)** "We start from the bridge table `OrderItems oi`. We join `Customers c` on `customer_id` and `Products p` on `product_id`. We compute `p.price * oi.quantity` as item total and order by order_id and product_name."

**(Complexity)** "Executes in O(O + C + P) time with O(C + P) space." """,
        "twist": {
            "lc": 9306,
            "title": "Database View & Audit Trigger Verification",
            "why": "Once tables are normalized, creating views provides clean virtual abstractions, and triggers automate compliance auditing.",
        },
        "viz": {
            "title": "3NF Lossless Join Pipeline",
            "type": "sql_pipeline",
        },
    },
})

LESSONS_4C.append({
    "dir": "23-normalization-views",
    "world_id": 23,
    "slug": "sql-view-and-audit-trigger",
    "lc": 9306,
    "citadel_id": "sql_dbms",
    "brick_layer": 2,
    "runner_type": "sql_sqlite",
    "difficulty": "Medium",
    "title": "Database View & Audit Trigger Verification",
    "patterns": ["views", "triggers", "audit-logging", "compliance"],
    "visualizer": "sql_pipeline",
    "data": {
        "slug": "sql-view-and-audit-trigger",
        "lc": 9306,
        "citadel_id": "sql_dbms",
        "brick_layer": 2,
        "runner_type": "sql_sqlite",
        "concept": {
            "problem_it_solves": "How can an engineering platform track sensitive salary adjustments without relying on application-level code that might be bypassed? Database triggers execute automatically inside the DBMS engine whenever an UPDATE fires, recording OLD and NEW values to an append-only audit table. Concurrently, SQL Views provide aggregated or security-filtered lenses over underlying tables without altering physical storage.",
            "brute_force": "Relying on developers to write manual audit log insertions in application backend handlers.",
            "brute_force_complexity": "Vulnerable to bypass via direct DB connections and human oversight.",
            "key_insight": "Database triggers run atomically within the transaction context of the UPDATE. Querying summary views alongside audit tables verifies that updates reflect in aggregations while preserving immutable audit logs.",
            "real_world": "SOX financial audit compliance, employee compensation tracking, and healthcare data access auditing.",
        },
        "statement": {
            "clean": """Write a SQL query to inspect a database view and audit trigger log after an employee salary update.

Database Objects (configured in schema):
```sql
CREATE TABLE Employees (
    id INTEGER PRIMARY KEY,
    name TEXT,
    department TEXT,
    salary INTEGER
);

CREATE TABLE SalaryAuditLog (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_id INTEGER,
    old_salary INTEGER,
    new_salary INTEGER
);

CREATE TRIGGER trg_salary_update AFTER UPDATE OF salary ON Employees
BEGIN
    INSERT INTO SalaryAuditLog (emp_id, old_salary, new_salary)
    VALUES (OLD.id, OLD.salary, NEW.salary);
END;

CREATE VIEW DepartmentSalarySummary AS
SELECT department, COUNT(*) AS emp_count, AVG(salary) AS avg_salary
FROM Employees
GROUP BY department;
```

Task:
Query the `DepartmentSalarySummary` view joined with `Employees` and `SalaryAuditLog` to inspect the updated department metrics and the audit log entry.

Return columns:
- `department`: from `DepartmentSalarySummary`
- `emp_count`: from `DepartmentSalarySummary`
- `avg_salary`: `ROUND(v.avg_salary, 2)` from `DepartmentSalarySummary`
- `emp_id`: from `SalaryAuditLog`
- `old_salary`: from `SalaryAuditLog`
- `new_salary`: from `SalaryAuditLog`

Order by `department` ascending, then `log_id` ascending.""",
            "oa_story": """**PayLoop Payroll Compliance — Automated Audit Trail**

During an internal financial audit, PayLoop discovered that an unauthorized manager changed an engineer's salary directly in production using the database CLI, bypassing application logging.

To enforce SOX compliance, the database architect implemented database-level triggers and summary views. Query the view and audit log to verify that the salary modification was captured.""",
            "trigger_keywords": ["database view and audit trigger", "DepartmentSalarySummary", "SalaryAuditLog"],
            "examples": [
                {
                    "input": "Employees updated: Aarav from 80000 to 90000 in Engineering",
                    "output": "[('Engineering', 2, 105000.0, 1, 80000, 90000)]",
                    "explanation": "Audit trigger logged old salary 80000 and new salary 90000; view shows updated average salary 105000.",
                },
            ],
            "constraints": [
                "Trigger executes automatically on salary updates",
                "DepartmentSalarySummary updates dynamically",
            ],
        },
        "constraint_quiz": {
            "prompt": "When does an `AFTER UPDATE OF salary` trigger execute in SQLite?",
            "options": [
                "Automatically inside the database engine immediately after a row's salary column is modified",
                "Only when invoked explicitly by a cron job",
                "Before the query parser executes",
                "Once every 24 hours at midnight",
            ],
            "answer": 0,
            "explanation": "An AFTER UPDATE trigger fires automatically as part of the transaction when the specified column is modified, capturing `OLD` and `NEW` row values.",
        },
        "pattern_quiz": {
            "prompt": "What is the primary architectural benefit of a SQL View?",
            "options": [
                "It provides a reusable, virtual query abstraction that encapsulates complex joins or aggregations without duplicating underlying storage",
                "It compresses table columns on disk",
                "It converts SQL tables into NoSQL collections",
                "It disables table locking",
            ],
            "answer": 0,
            "explanation": "A View is a stored query that presents dynamic data as if it were a physical table, simplifying reporting and enforcing security boundaries.",
        },
        "schema_sql": """CREATE TABLE Employees (
    id INTEGER PRIMARY KEY,
    name TEXT,
    department TEXT,
    salary INTEGER
);

CREATE TABLE SalaryAuditLog (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_id INTEGER,
    old_salary INTEGER,
    new_salary INTEGER
);

CREATE TRIGGER trg_salary_update AFTER UPDATE OF salary ON Employees
BEGIN
    INSERT INTO SalaryAuditLog (emp_id, old_salary, new_salary)
    VALUES (OLD.id, OLD.salary, NEW.salary);
END;

CREATE VIEW DepartmentSalarySummary AS
SELECT department, COUNT(*) AS emp_count, AVG(salary) AS avg_salary
FROM Employees
GROUP BY department;""",
        "seed_sql": """INSERT INTO Employees VALUES
    (1, 'Aarav', 'Engineering', 80000),
    (2, 'Vikram', 'Engineering', 120000),
    (3, 'Priya', 'Product', 90000);

UPDATE Employees SET salary = 90000 WHERE id = 1;""",
        "function": {
            "name": "execute_sql",
            "params": [],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """-- Write your SQL query below to inspect DepartmentSalarySummary and SalaryAuditLog
SELECT
    v.department,
    v.emp_count,
    ROUND(v.avg_salary, 2) AS avg_salary,
    l.emp_id,
    l.old_salary,
    l.new_salary
FROM DepartmentSalarySummary v
JOIN Employees e ON v.department = e.department
JOIN SalaryAuditLog l ON e.id = l.emp_id
ORDER BY v.department, l.log_id;
""",
        "tests": [
            {
                "args": [],
                "expected": [
                    ["Engineering", 2, 105000.0, 1, 80000, 90000],
                ],
                "note": "Audit log and updated department view",
            },
            {
                "args": [],
                "expected": null,
                "note": "Reference verification",
            },
            {
                "args": [],
                "expected": null,
                "note": "Consistency check",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Query DepartmentSalarySummary view",
                "goal": "Select department and avg salary from view.",
                "instructions": "Select `department, emp_count, ROUND(avg_salary, 2) AS avg_salary FROM DepartmentSalarySummary ORDER BY department;`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT department, emp_count, ROUND(avg_salary, 2) AS avg_salary FROM DepartmentSalarySummary ORDER BY department;
""",
                "tests": [{"args": [], "expected": [["Engineering", 2, 105000.0], ["Product", 1, 90000.0]]}],
                "solution": """SELECT department, emp_count, ROUND(avg_salary, 2) AS avg_salary FROM DepartmentSalarySummary ORDER BY department;
""",
                "hint": "Query DepartmentSalarySummary directly.",
            },
            {
                "skill": "core",
                "title": "Query SalaryAuditLog entries",
                "goal": "Inspect logged old and new salary.",
                "instructions": "Select `emp_id, old_salary, new_salary FROM SalaryAuditLog;`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT emp_id, old_salary, new_salary FROM SalaryAuditLog;
""",
                "tests": [{"args": [], "expected": [[1, 80000, 90000]]}],
                "solution": """SELECT emp_id, old_salary, new_salary FROM SalaryAuditLog;
""",
                "hint": "Query SalaryAuditLog.",
            },
            {
                "skill": "edge",
                "title": "Join view with audit log",
                "goal": "Link department summary with employee audit log.",
                "instructions": "Join DepartmentSalarySummary with Employees and SalaryAuditLog.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT v.department, l.emp_id FROM DepartmentSalarySummary v JOIN Employees e ON v.department = e.department JOIN SalaryAuditLog l ON e.id = l.emp_id;
""",
                "tests": [{"args": [], "expected": [["Engineering", 1]]}],
                "solution": """SELECT v.department, l.emp_id FROM DepartmentSalarySummary v JOIN Employees e ON v.department = e.department JOIN SalaryAuditLog l ON e.id = l.emp_id;
""",
                "hint": "Join through Employees.",
            },
        ],
        "hints": [
            "Select from `DepartmentSalarySummary v`.",
            "Join `Employees e ON v.department = e.department` and `SalaryAuditLog l ON e.id = l.emp_id`.",
            """| # Pseudocode Blueprint
| SELECT v.department, v.emp_count, ROUND(v.avg_salary, 2) AS avg_salary,
|        l.emp_id, l.old_salary, l.new_salary
| FROM DepartmentSalarySummary v
| JOIN Employees e ON v.department = e.department
| JOIN SalaryAuditLog l ON e.id = l.emp_id
| ORDER BY v.department, l.log_id;""",
        ],
        "solution": {
            "code": """SELECT
    v.department,
    v.emp_count,
    ROUND(v.avg_salary, 2) AS avg_salary,
    l.emp_id,
    l.old_salary,
    l.new_salary
FROM DepartmentSalarySummary v
JOIN Employees e ON v.department = e.department
JOIN SalaryAuditLog l ON e.id = l.emp_id
ORDER BY v.department, l.log_id;
""",
            "explanation": "The trigger automatically records previous and updated salary values into `SalaryAuditLog` during the UPDATE statement. Joining the view with the audit log confirms that the view dynamically computes the updated department average while the audit table stores an immutable log of the modification.",
            "time": "O(E + L) join over filtered employees",
            "space": "O(1) memory overhead",
        },
        "pitch_script": """**(Clarify)** "We need to query a dynamic summary view joined with an audit log table populated by an internal database trigger."

**(Brute force)** "Relying on application-level logging risks unlogged changes when database records are modified via admin consoles or background maintenance scripts."

**(Trigger)** "Verifying automated trigger history alongside virtual aggregations signals database view and audit trigger verification."

**(Optimal)** "We select from `DepartmentSalarySummary v`, joining `Employees e` on department and `SalaryAuditLog l` on employee id. We format the average salary with `ROUND(..., 2)` and project the old and new salaries captured by the trigger."

**(Complexity)** "Executes in O(E + L) time and O(1) space." """,
        "twist": {
            "lc": 9307,
            "title": "EXPLAIN QUERY PLAN & Composite Index Evaluation",
            "why": "Once views and triggers are configured, complex queries over large tables require composite B-Tree indexes to remain performant.",
        },
        "viz": {
            "title": "View & Trigger Audit Pipeline",
            "type": "sql_pipeline",
        },
    },
})

# ==========================================
# W22: Indexing (add 1 lesson)
# ==========================================

LESSONS_4C.append({
    "dir": "22-indexing",
    "world_id": 22,
    "slug": "sql-explain-composite-index",
    "lc": 9307,
    "citadel_id": "sql_dbms",
    "brick_layer": 2,
    "runner_type": "sql_sqlite",
    "difficulty": "Medium",
    "title": "EXPLAIN QUERY PLAN Composite Index Evaluation",
    "patterns": ["explain-query-plan", "composite-index", "left-prefix", "b-tree"],
    "visualizer": "sql_pipeline",
    "data": {
        "slug": "sql-explain-composite-index",
        "lc": 9307,
        "citadel_id": "sql_dbms",
        "brick_layer": 2,
        "runner_type": "sql_sqlite",
        "concept": {
            "problem_it_solves": "How do database administrators prove whether the query optimizer actually uses an index or falls back to an expensive full table scan? The `EXPLAIN QUERY PLAN` prefix reveals the execution engine's physical strategy: `SCAN TABLE` (O(N) sequential page scan) vs `SEARCH TABLE USING INDEX` (O(log N) B-Tree binary search). For composite indexes, the optimizer requires predicates matching the index's leading left-prefix columns.",
            "brute_force": "Guessing index usage and blindly adding single-column indexes, multiplying write overhead without improving query speed.",
            "brute_force_complexity": "Unnecessary index write amplification and slow query execution.",
            "key_insight": "Running `EXPLAIN QUERY PLAN` outputs the exact access path. A composite index `(user_id, status, created_at)` enables logarithmic index lookup when equality filters match `user_id` and `status`.",
            "real_world": "PostgreSQL `EXPLAIN ANALYZE`, MySQL `EXPLAIN`, and SQLite query performance tuning.",
        },
        "statement": {
            "clean": """Write a SQL query using `EXPLAIN QUERY PLAN` to determine which composite index the SQLite optimizer selects for a filtered, sorted transaction query.

Table schema and indexes:
```sql
CREATE TABLE Transactions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    status TEXT,
    created_at TEXT,
    amount INTEGER
);

CREATE INDEX idx_user_status_date ON Transactions (user_id, status, created_at);
CREATE INDEX idx_date_amount ON Transactions (created_at, amount);
```

Target Query to Evaluate:
```sql
SELECT * FROM Transactions
WHERE user_id = 42 AND status = 'COMPLETED'
ORDER BY created_at;
```

Task:
Execute `EXPLAIN QUERY PLAN` on the target query above to inspect the optimizer's access path.

Return the query plan result.""",
            "oa_story": """**UrbanFix Payment History — Slow Query Diagnostic**

UrbanFix users opening their order history experienced 8-second page loads. The query fetched transactions for a specific `user_id` with `status = 'COMPLETED'`, ordered by date. Two composite indexes existed, but developers were unsure which one the optimizer was picking.

Use `EXPLAIN QUERY PLAN` to inspect the query execution path and prove whether the optimizer leverages the composite left-prefix B-Tree index.""",
            "trigger_keywords": ["EXPLAIN QUERY PLAN", "idx_user_status_date", "Transactions"],
            "examples": [
                {
                    "input": "Target query: SELECT * FROM Transactions WHERE user_id = 42 AND status = 'COMPLETED' ORDER BY created_at",
                    "output": "[(4, 0, 0, 'SEARCH Transactions USING INDEX idx_user_status_date (user_id=? AND status=?)')]",
                    "explanation": "Optimizer uses idx_user_status_date using equality filters on leading columns.",
                },
            ],
            "constraints": [
                "Index idx_user_status_date is present on (user_id, status, created_at)",
                "Index idx_date_amount is present on (created_at, amount)",
            ],
        },
        "constraint_quiz": {
            "prompt": "What does `SEARCH TABLE ... USING INDEX` signify in an `EXPLAIN QUERY PLAN` output compared to `SCAN TABLE`?",
            "options": [
                "`SEARCH` uses a B-Tree index to jump directly to matching rows in O(log N) time, whereas `SCAN` reads every page in the table in O(N) time",
                "`SEARCH` is used only for text columns",
                "`SCAN` is faster than `SEARCH`",
                "`SEARCH` deletes rows after reading them",
            ],
            "answer": 0,
            "explanation": "In SQLite, `SEARCH TABLE` indicates an indexed B-Tree point lookup or range seek, whereas `SCAN TABLE` indicates an unindexed full table scan.",
        },
        "pattern_quiz": {
            "prompt": "Why did the optimizer pick `idx_user_status_date (user_id, status, created_at)` instead of `idx_date_amount (created_at, amount)`?",
            "options": [
                "Because the query filters by `user_id` and `status`, satisfying the left-prefix rule for `idx_user_status_date` and allowing index-ordered retrieval",
                "Because idx_user_status_date has a longer name",
                "Because idx_date_amount is corrupted",
                "Because amount is an integer",
            ],
            "answer": 0,
            "explanation": "A composite B-Tree index can only be used if the query predicates constrain the leading columns (left prefix) of the index.",
        },
        "schema_sql": """CREATE TABLE Transactions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    status TEXT,
    created_at TEXT,
    amount INTEGER
);

CREATE INDEX idx_user_status_date ON Transactions (user_id, status, created_at);
CREATE INDEX idx_date_amount ON Transactions (created_at, amount);""",
        "seed_sql": """INSERT INTO Transactions VALUES
    (1, 42, 'COMPLETED', '2026-01-01', 500),
    (2, 42, 'PENDING', '2026-01-02', 300),
    (3, 99, 'COMPLETED', '2026-01-03', 1000);""",
        "function": {
            "name": "execute_sql",
            "params": [],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """-- Write your EXPLAIN QUERY PLAN statement below
EXPLAIN QUERY PLAN
SELECT * FROM Transactions
WHERE user_id = 42 AND status = 'COMPLETED'
ORDER BY created_at;
""",
        "tests": [
            {
                "args": [],
                "expected": [
                    [4, 0, 0, "SEARCH Transactions USING INDEX idx_user_status_date (user_id=? AND status=?)"],
                ],
                "note": "Optimizer selects idx_user_status_date",
            },
            {
                "args": [],
                "expected": null,
                "note": "Reference verification",
            },
            {
                "args": [],
                "expected": null,
                "note": "Consistency check",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Select with equality filter",
                "goal": "Write target query without explain prefix.",
                "instructions": "Select `* FROM Transactions WHERE user_id = 42 AND status = 'COMPLETED' ORDER BY created_at;`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT id, user_id, status FROM Transactions WHERE user_id = 42 AND status = 'COMPLETED' ORDER BY created_at;
""",
                "tests": [{"args": [], "expected": [[1, 42, "COMPLETED"]]}],
                "solution": """SELECT id, user_id, status FROM Transactions WHERE user_id = 42 AND status = 'COMPLETED' ORDER BY created_at;
""",
                "hint": "Filter by user_id = 42 AND status = 'COMPLETED'.",
            },
            {
                "skill": "core",
                "title": "Add EXPLAIN QUERY PLAN prefix",
                "goal": "Prepend EXPLAIN QUERY PLAN to inspect index choice.",
                "instructions": "Prepend `EXPLAIN QUERY PLAN` to the target SELECT query.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """EXPLAIN QUERY PLAN SELECT id FROM Transactions WHERE user_id = 42 AND status = 'COMPLETED' ORDER BY created_at;
""",
                "tests": [{"args": [], "expected": null}],
                "solution": """EXPLAIN QUERY PLAN SELECT id FROM Transactions WHERE user_id = 42 AND status = 'COMPLETED' ORDER BY created_at;
""",
                "hint": "Prepend EXPLAIN QUERY PLAN.",
            },
            {
                "skill": "edge",
                "title": "Verify index name in plan",
                "goal": "Confirm idx_user_status_date appears in detail.",
                "instructions": "Run explain query plan on full SELECT.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """EXPLAIN QUERY PLAN SELECT * FROM Transactions WHERE user_id = 42 AND status = 'COMPLETED' ORDER BY created_at;
""",
                "tests": [{"args": [], "expected": null}],
                "solution": """EXPLAIN QUERY PLAN SELECT * FROM Transactions WHERE user_id = 42 AND status = 'COMPLETED' ORDER BY created_at;
""",
                "hint": "Execute full EXPLAIN QUERY PLAN query.",
            },
        ],
        "hints": [
            "Write `EXPLAIN QUERY PLAN` before the `SELECT` query.",
            "The query filters `WHERE user_id = 42 AND status = 'COMPLETED'` and orders by `created_at`.",
            """| # Pseudocode Blueprint
| EXPLAIN QUERY PLAN
| SELECT * FROM Transactions
| WHERE user_id = 42 AND status = 'COMPLETED'
| ORDER BY created_at;""",
        ],
        "solution": {
            "code": """EXPLAIN QUERY PLAN
SELECT * FROM Transactions
WHERE user_id = 42 AND status = 'COMPLETED'
ORDER BY created_at;
""",
            "explanation": "The optimizer selects `idx_user_status_date` because the equality conditions match the first two columns of the composite index (`user_id` and `status`). Since the third column is `created_at`, the index directly satisfies the `ORDER BY created_at` clause without requiring an in-memory temporary sort B-Tree.",
            "time": "O(1) plan inspection",
            "space": "O(1) memory overhead",
        },
        "pitch_script": """**(Clarify)** "We need to run `EXPLAIN QUERY PLAN` on a filtered and sorted query to prove whether the optimizer leverages the composite index."

**(Brute force)** "Assuming an index is used without verifying the execution plan often masks silent full table scans in production."

**(Trigger)** "Diagnosing index access paths and verifying left-prefix matching signals EXPLAIN QUERY PLAN."

**(Optimal)** "We prepend `EXPLAIN QUERY PLAN` to the query. The output confirms that SQLite selects `idx_user_status_date (user_id=? AND status=?)`, proving that the B-Tree handles both filtering and sorting in logarithmic time."

**(Complexity)** "Executes in O(1) plan inspection time and space." """,
        "twist": {
            "lc": 9317,
            "title": "Running Total & Month-over-Month Growth with LAG",
            "why": "Indexed tables enable high-speed reads; analytical reporting queries leverage window functions over these indexed columns.",
        },
        "viz": {
            "title": "EXPLAIN QUERY PLAN Index Search",
            "type": "sql_pipeline",
        },
    },
})

# ==========================================
# W24: Analytical SQL Arena (add 2 lessons)
# ==========================================

LESSONS_4C.append({
    "dir": "24-analytical-sql",
    "world_id": 24,
    "slug": "sql-running-total-mom-lag",
    "lc": 9317,
    "citadel_id": "sql_dbms",
    "brick_layer": 3,
    "runner_type": "sql_sqlite",
    "difficulty": "Medium",
    "title": "Running Total & Month-over-Month Growth with LAG",
    "patterns": ["window-functions", "running-total", "lag", "financial-metrics"],
    "visualizer": "sql_pipeline",
    "data": {
        "slug": "sql-running-total-mom-lag",
        "lc": 9317,
        "citadel_id": "sql_dbms",
        "brick_layer": 3,
        "runner_type": "sql_sqlite",
        "concept": {
            "problem_it_solves": "How do financial analytics platforms calculate cumulative annual revenue and month-over-month (MoM) growth rates in a single SQL query? Window functions (`SUM() OVER (...)` and `LAG() OVER (...)`) compute running totals and inspect previous row values across ordered time intervals without self-joins or nested loops.",
            "brute_force": "Self-joining a sales table with itself on `t1.month = t2.month + 1`, resulting in quadratic O(N^2) complexity.",
            "brute_force_complexity": "O(N^2) Cartesian join that chokes on time-series data.",
            "key_insight": "`LAG(revenue, 1) OVER (ORDER BY month)` accesses the previous month's revenue in O(1) time during the window scan, enabling direct MoM percentage growth calculation.",
            "real_world": "SaaS Gross Merchandise Value (GMV) dashboards, Stripe financial reports, and e-commerce growth metrics.",
        },
        "statement": {
            "clean": """Write an analytical SQL query to calculate running total and month-over-month (MoM) revenue growth.

Table schema:
```sql
CREATE TABLE MonthlyRevenue (
    month TEXT PRIMARY KEY,
    revenue INTEGER
);
```

Compute for each month:
- `month`: calendar month string (e.g. `'2026-01'`)
- `revenue`: revenue for that month
- `running_total`: cumulative sum of revenue up to and including current month (`SUM(revenue) OVER (ORDER BY month)`)
- `prev_month_revenue`: revenue from preceding month (`LAG(revenue, 1) OVER (ORDER BY month)`), or `NULL` for the first month
- `mom_growth_pct`: percentage growth calculated as:
  `ROUND(((revenue - prev_month_revenue) * 100.0 / prev_month_revenue), 2)`, or `NULL` for the first month

Order by `month` ascending.""",
            "oa_story": """**SwiftCart Finance Analytics — Executive Revenue Dashboard**

SwiftCart's Chief Financial Officer requested an automated monthly revenue report showing cumulative GMV and month-over-month growth rates to present to board investors. The existing spreadsheet was prone to manual formula mistakes.

Write an analytical window SQL query using `SUM() OVER ()` and `LAG()` to generate the financial metrics directly from the database in a single query.""",
            "trigger_keywords": ["running total and month-over-month", "MonthlyRevenue", "mom_growth_pct"],
            "examples": [
                {
                    "input": "MonthlyRevenue: [('2026-01', 10000), ('2026-02', 12000)]",
                    "output": "[('2026-01', 10000, 10000, None, None), ('2026-02', 12000, 22000, 10000, 20.0)]",
                    "explanation": "Month 1 has running total 10000, prev None, MoM None. Month 2 has running total 22000, prev 10000, MoM 20.0%.",
                },
            ],
            "constraints": [
                "1 <= len(MonthlyRevenue) <= 120",
                "month format is YYYY-MM",
                "revenue >= 0",
            ],
        },
        "constraint_quiz": {
            "prompt": "What does `LAG(col, 1) OVER (ORDER BY date)` return for the very first row in an ordered partition?",
            "options": [
                "`NULL` (or None in Python), because there is no preceding row",
                "`0`",
                "The current row value",
                "An SQL exception is thrown",
            ],
            "answer": 0,
            "explanation": "By default, LAG returns NULL when the offset extends beyond the window frame boundary before the first row.",
        },
        "pattern_quiz": {
            "prompt": "Why does multiplying by `100.0` before division in SQL prevent silent zero-value results?",
            "options": [
                "In SQL integer arithmetic, `(12000 - 10000) / 10000` performs integer division yielding `0`; multiplying by `100.0` forces float arithmetic",
                "To format the number as a string",
                "Because SQL requires all percentages to be over 100",
                "To invert negative percentages",
            ],
            "answer": 0,
            "explanation": "Dividing two integers in SQLite truncates the decimal remainder to 0. Multiplying by 100.0 promotes the numerator to a floating-point number.",
        },
        "schema_sql": """CREATE TABLE MonthlyRevenue (
    month TEXT PRIMARY KEY,
    revenue INTEGER
);""",
        "seed_sql": """INSERT INTO MonthlyRevenue VALUES
    ('2026-01', 10000),
    ('2026-02', 12000),
    ('2026-03', 15000),
    ('2026-04', 13500);""",
        "function": {
            "name": "execute_sql",
            "params": [],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """-- Write your SQL query below to compute running total and MoM growth with LAG
SELECT
    month,
    revenue,
    SUM(revenue) OVER (ORDER BY month) AS running_total,
    LAG(revenue, 1) OVER (ORDER BY month) AS prev_month_revenue,
    NULL AS mom_growth_pct
FROM MonthlyRevenue
ORDER BY month;
""",
        "tests": [
            {
                "args": [],
                "expected": [
                    ["2026-01", 10000, 10000, None, None],
                    ["2026-02", 12000, 22000, 10000, 20.0],
                    ["2026-03", 15000, 37000, 12000, 25.0],
                    ["2026-04", 13500, 50500, 15000, -10.0],
                ],
                "note": "4-month financial running total and MoM growth",
            },
            {
                "args": [],
                "expected": null,
                "note": "Reference verification",
            },
            {
                "args": [],
                "expected": null,
                "note": "Consistency check",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Compute cumulative running total",
                "goal": "Use SUM(revenue) OVER (ORDER BY month).",
                "instructions": "Select `month, SUM(revenue) OVER (ORDER BY month) AS running_total FROM MonthlyRevenue ORDER BY month;`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT month, SUM(revenue) OVER (ORDER BY month) AS running_total FROM MonthlyRevenue ORDER BY month;
""",
                "tests": [{"args": [], "expected": [["2026-01", 10000], ["2026-02", 22000], ["2026-03", 37000], ["2026-04", 50500]]}],
                "solution": """SELECT month, SUM(revenue) OVER (ORDER BY month) AS running_total FROM MonthlyRevenue ORDER BY month;
""",
                "hint": "Use `SUM(revenue) OVER (ORDER BY month)`.",
            },
            {
                "skill": "core",
                "title": "Fetch previous row with LAG",
                "goal": "Use LAG(revenue, 1) OVER (ORDER BY month).",
                "instructions": "Select `month, LAG(revenue, 1) OVER (ORDER BY month) AS prev FROM MonthlyRevenue ORDER BY month;`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT month, LAG(revenue, 1) OVER (ORDER BY month) AS prev FROM MonthlyRevenue ORDER BY month;
""",
                "tests": [{"args": [], "expected": [["2026-01", None], ["2026-02", 10000], ["2026-03", 12000], ["2026-04", 15000]]}],
                "solution": """SELECT month, LAG(revenue, 1) OVER (ORDER BY month) AS prev FROM MonthlyRevenue ORDER BY month;
""",
                "hint": "Use `LAG(revenue, 1) OVER (ORDER BY month)`.",
            },
            {
                "skill": "edge",
                "title": "Compute percentage growth",
                "goal": "Calculate float percentage rounded to 2 decimals.",
                "instructions": "Calculate `ROUND(((revenue - prev) * 100.0 / prev), 2)`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT month, ROUND(((revenue - LAG(revenue, 1) OVER (ORDER BY month)) * 100.0 / LAG(revenue, 1) OVER (ORDER BY month)), 2) AS mom_growth_pct FROM MonthlyRevenue ORDER BY month;
""",
                "tests": [{"args": [], "expected": [["2026-01", None], ["2026-02", 20.0], ["2026-03", 25.0], ["2026-04", -10.0]]}],
                "solution": """SELECT month, ROUND(((revenue - LAG(revenue, 1) OVER (ORDER BY month)) * 100.0 / LAG(revenue, 1) OVER (ORDER BY month)), 2) AS mom_growth_pct FROM MonthlyRevenue ORDER BY month;
""",
                "hint": "Use 100.0 to prevent integer truncation.",
            },
        ],
        "hints": [
            "Use `SUM(revenue) OVER (ORDER BY month)` to calculate the cumulative running total.",
            "Use `LAG(revenue, 1) OVER (ORDER BY month)` to look back at the previous month's value.",
            """| # Pseudocode Blueprint
| SELECT
|     month,
|     revenue,
|     SUM(revenue) OVER (ORDER BY month) AS running_total,
|     LAG(revenue, 1) OVER (ORDER BY month) AS prev_month_revenue,
|     ROUND(((revenue - LAG(revenue, 1) OVER (ORDER BY month)) * 100.0 /
|            LAG(revenue, 1) OVER (ORDER BY month)), 2) AS mom_growth_pct
| FROM MonthlyRevenue
| ORDER BY month;""",
        ],
        "solution": {
            "code": """SELECT
    month,
    revenue,
    SUM(revenue) OVER (ORDER BY month) AS running_total,
    LAG(revenue, 1) OVER (ORDER BY month) AS prev_month_revenue,
    ROUND(((revenue - LAG(revenue, 1) OVER (ORDER BY month)) * 100.0 / LAG(revenue, 1) OVER (ORDER BY month)), 2) AS mom_growth_pct
FROM MonthlyRevenue
ORDER BY month;
""",
            "explanation": "Window functions evaluate running aggregates in a single sequential pass. `SUM() OVER (ORDER BY month)` aggregates all prior rows to compute cumulative revenue. `LAG(revenue, 1) OVER (ORDER BY month)` retrieves the previous row's value, enabling direct calculation of month-over-month growth with float precision.",
            "time": "O(N log N) sorting by month",
            "space": "O(N) for window frame evaluation",
        },
        "pitch_script": """**(Clarify)** "We need to calculate cumulative running totals and month-over-month revenue growth percentage for each calendar month."

**(Brute force)** "Self-joining the table on date offsets requires O(N^2) time and fails when dates have gaps."

**(Trigger)** "Calculating cumulative sums and referencing prior time periods signals window functions: `SUM() OVER ()` and `LAG()`."

**(Optimal)** "We select `month` and `revenue`. We compute `SUM(revenue) OVER (ORDER BY month)` for running totals. We use `LAG(revenue, 1) OVER (ORDER BY month)` to fetch the prior month, and compute percentage growth with `ROUND(((revenue - prev) * 100.0 / prev), 2)`. The first month safely evaluates to NULL."

**(Complexity)** "Executes in O(N log N) time and O(N) space." """,
        "twist": {
            "lc": 9318,
            "title": "Purge Duplicate Rows Keeping Lowest Identifier",
            "why": "After analyzing aggregate metrics, data cleaning queries like purging duplicate contact rows ensure data quality.",
        },
        "viz": {
            "title": "Analytical Window Revenue Pipeline",
            "type": "sql_pipeline",
        },
    },
})

LESSONS_4C.append({
    "dir": "24-analytical-sql",
    "world_id": 24,
    "slug": "sql-delete-duplicate-emails",
    "lc": 9318,
    "citadel_id": "sql_dbms",
    "brick_layer": 3,
    "runner_type": "sql_sqlite",
    "difficulty": "Medium",
    "title": "Purge Duplicate Rows Keeping Lowest Identifier",
    "patterns": ["deduplication", "group-by", "subquery-filter", "data-cleaning"],
    "visualizer": "sql_pipeline",
    "data": {
        "slug": "sql-delete-duplicate-emails",
        "lc": 9318,
        "citadel_id": "sql_dbms",
        "brick_layer": 3,
        "runner_type": "sql_sqlite",
        "concept": {
            "problem_it_solves": "When an application bug inserts duplicate user or contact rows with identical emails, how do data engineers identify and purge the redundant duplicate rows while keeping the original account? In SQL, grouping by the unique key (email) finds the minimum `id` (`SELECT MIN(id) FROM Contacts GROUP BY email`). Any record whose `id` is NOT in that minimum set is a redundant duplicate to be purged.",
            "brute_force": "Exporting the entire table into Python, deduplicating with a dictionary, dropping the table, and re-importing all rows.",
            "brute_force_complexity": "Severe downtime, table locks, and memory exhaustion.",
            "key_insight": "A subquery with `MIN(id) GROUP BY email` identifies the single survivor for each duplicate group. Filtering with `id NOT IN (...)` isolates the exact rows to delete.",
            "real_world": "LeetCode 196 (Delete Duplicate Emails), CRM customer deduplication, and database cleanup scripts.",
        },
        "statement": {
            "clean": """Write a SQL query to identify and isolate duplicate contact records that should be purged, keeping only the entry with the lowest id.

Table schema:
```sql
CREATE TABLE Contacts (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT
);
```

Task:
Identify all rows that have a duplicate `email` and whose `id` is NOT the minimum `id` for that email address.

Return columns: `id`, `name`, `email` ordered by `id` ascending.""",
            "oa_story": """**KiranaKart Customer CRM — Duplicate Account Purge**

A buggy mobile app signup screen allowed users to repeatedly click 'Submit', creating multiple account entries with the identical email address under different user IDs.

The CRM team needs to clean up the database by identifying all duplicate customer rows that should be purged, preserving only the original account with the lowest ID. Write the SQL query to locate these redundant rows.""",
            "trigger_keywords": ["isolate duplicate contact records", "Contacts", "lowest id"],
            "examples": [
                {
                    "input": "Contacts: [(1, 'Aarav', 'a@test.in'), (2, 'Priya', 'p@test.in'), (3, 'Aarav Dup', 'a@test.in')]",
                    "output": "[(3, 'Aarav Dup', 'a@test.in')]",
                    "explanation": "Email 'a@test.in' has IDs 1 and 3. ID 1 is the lowest, so ID 3 is the duplicate to be purged.",
                },
            ],
            "constraints": [
                "1 <= len(Contacts) <= 1000",
                "id is a unique integer primary key",
            ],
        },
        "constraint_quiz": {
            "prompt": "How does `WHERE id NOT IN (SELECT MIN(id) FROM Contacts GROUP BY email)` identify duplicate rows?",
            "options": [
                "`MIN(id) GROUP BY email` returns the earliest ID for each email; any row whose ID is NOT in this set is a duplicate",
                "It deletes all rows whose email contains '@'",
                "It sorts the table by name",
                "It counts the number of letters in each email",
            ],
            "answer": 0,
            "explanation": "Because MIN(id) per email picks the single original record, any row with a higher ID for that email is excluded from the subquery and caught by NOT IN.",
        },
        "pattern_quiz": {
            "prompt": "What window function alternative can also identify duplicate rows keeping the lowest id?",
            "options": [
                "`ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn ... WHERE rn > 1`",
                "`DENSE_RANK() OVER (ORDER BY id)`",
                "`NTILE(4) OVER ()`",
                "`LEAD(email) OVER ()`",
            ],
            "answer": 0,
            "explanation": "Assigning row numbers partitioned by email assigns 1 to the lowest id; filtering for `rn > 1` isolates all duplicates.",
        },
        "schema_sql": """CREATE TABLE Contacts (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT
);""",
        "seed_sql": """INSERT INTO Contacts VALUES
    (1, 'Aarav Sharma', 'aarav@payloop.in'),
    (2, 'Priya Patel', 'priya@payloop.in'),
    (3, 'Aarav Duplicate', 'aarav@payloop.in'),
    (4, 'Aarav Triplicate', 'aarav@payloop.in'),
    (5, 'Vikram Singh', 'vikram@payloop.in');""",
        "function": {
            "name": "execute_sql",
            "params": [],
            "returns": "any",
            "compare": "exact",
        },
        "starter_code": """-- Write your SQL query below to identify duplicate contacts keeping lowest id
SELECT
    id,
    name,
    email
FROM Contacts
WHERE id NOT IN (
    SELECT MIN(id)
    FROM Contacts
    GROUP BY email
)
ORDER BY id;
""",
        "tests": [
            {
                "args": [],
                "expected": [
                    [3, "Aarav Duplicate", "aarav@payloop.in"],
                    [4, "Aarav Triplicate", "aarav@payloop.in"],
                ],
                "note": "Rows 3 and 4 are duplicates of row 1",
            },
            {
                "args": [],
                "expected": null,
                "note": "Reference verification",
            },
            {
                "args": [],
                "expected": null,
                "note": "Consistency check",
            },
        ],
        "visualize_test": 0,
        "drills": [
            {
                "skill": "setup",
                "title": "Find minimum id per email",
                "goal": "Group by email and select MIN(id).",
                "instructions": "Select `MIN(id) AS min_id, email FROM Contacts GROUP BY email ORDER BY min_id;`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT MIN(id) AS min_id, email FROM Contacts GROUP BY email ORDER BY min_id;
""",
                "tests": [{"args": [], "expected": [[1, "aarav@payloop.in"], [2, "priya@payloop.in"], [5, "vikram@payloop.in"]]}],
                "solution": """SELECT MIN(id) AS min_id, email FROM Contacts GROUP BY email ORDER BY min_id;
""",
                "hint": "Use `SELECT MIN(id) FROM Contacts GROUP BY email`.",
            },
            {
                "skill": "core",
                "title": "Filter with NOT IN subquery",
                "goal": "Filter IDs not present in minimum ID list.",
                "instructions": "Filter `WHERE id NOT IN (SELECT MIN(id) FROM Contacts GROUP BY email)`.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT id FROM Contacts WHERE id NOT IN (SELECT MIN(id) FROM Contacts GROUP BY email) ORDER BY id;
""",
                "tests": [{"args": [], "expected": [[3], [4]]}],
                "solution": """SELECT id FROM Contacts WHERE id NOT IN (SELECT MIN(id) FROM Contacts GROUP BY email) ORDER BY id;
""",
                "hint": "Use `WHERE id NOT IN (SELECT MIN(id) FROM Contacts GROUP BY email)`.",
            },
            {
                "skill": "edge",
                "title": "Select full contact row",
                "goal": "Project id, name, and email for duplicates.",
                "instructions": "Select `id, name, email` ordered by id.",
                "function": {"name": "execute_sql", "params": []},
                "starter_code": """SELECT id, name, email FROM Contacts WHERE id NOT IN (SELECT MIN(id) FROM Contacts GROUP BY email) ORDER BY id;
""",
                "tests": [{"args": [], "expected": [[3, "Aarav Duplicate", "aarav@payloop.in"], [4, "Aarav Triplicate", "aarav@payloop.in"]]}],
                "solution": """SELECT id, name, email FROM Contacts WHERE id NOT IN (SELECT MIN(id) FROM Contacts GROUP BY email) ORDER BY id;
""",
                "hint": "Project `id, name, email`.",
            },
        ],
        "hints": [
            "Use a subquery to find the surviving minimum id for each email: `SELECT MIN(id) FROM Contacts GROUP BY email`.",
            "Filter the outer table `WHERE id NOT IN (...)` to isolate all redundant rows.",
            """| # Pseudocode Blueprint
| SELECT id, name, email
| FROM Contacts
| WHERE id NOT IN (
|     SELECT MIN(id)
|     FROM Contacts
|     GROUP BY email
| )
| ORDER BY id;""",
        ],
        "solution": {
            "code": """SELECT
    id,
    name,
    email
FROM Contacts
WHERE id NOT IN (
    SELECT MIN(id)
    FROM Contacts
    GROUP BY email
)
ORDER BY id;
""",
            "explanation": "Grouping by email finds the earliest identifier for each contact record. Filtering with `id NOT IN (SELECT MIN(id) ...)` isolates all subsequent duplicate entries with identical emails, allowing safe inspection or purging while preserving the original row.",
            "time": "O(N) with index on email",
            "space": "O(U) for distinct email set",
        },
        "pitch_script": """**(Clarify)** "We need to identify all duplicate contact records sharing the same email address, preserving only the original account with the lowest id."

**(Brute force)** "Scanning the table with pairwise self-joins takes O(N^2) time and produces duplicate match pairings."

**(Trigger)** "Selecting surviving records by minimum key and filtering the rest signals a `MIN(id) GROUP BY` subquery."

**(Optimal)** "We find the survivor for each email using `SELECT MIN(id) FROM Contacts GROUP BY email`. In the outer query, any row whose `id` is NOT in that minimum set is a duplicate. We select `id, name, email` and order by id."

**(Complexity)** "Executes in O(N) time with an index on email and O(U) space." """,
        "twist": {
            "lc": 9315,
            "title": "Consecutive Available Seats Window Island Problem",
            "why": "Rather than finding duplicate gaps, consecutive seating problems use window functions to identify contiguous island blocks.",
        },
        "viz": {
            "title": "Deduplication Selection Pipeline",
            "type": "sql_pipeline",
        },
    },
})

print(f"Loaded {len(LESSONS_4C)} lessons for Batch 4C.")

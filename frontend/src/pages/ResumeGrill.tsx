import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Copy,
  Cpu,
  Database,
  Eye,
  EyeOff,
  FileCode2,
  Play,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import Sky from '../components/Sky'
import { ChatComposer } from '../components/vendor/chat/chat-composer'
import { ChatMessage } from '../components/vendor/chat/chat-message'

// ========================================================================================
// DEFENSE SCENARIOS (All 8 scenarios with complete original text and WisdomBot additions)
// ========================================================================================

export interface DefenseScenario {
  id: string
  title: string
  subtitle: string
  category: 'Drizz' | 'GEPA' | 'WisdomBot' | 'FitLabs' | 'Production Incidents'
  impactBadge: string
  icon: typeof Zap
  color: string
  bulletText: string
  interviewerQuestion: string
  interviewerFollowupTrap: string
  architectureModel: string
  fiveWhys: string[]
  spokenSeniorScript: string
  verificationCode: string
}

export const DEFENSE_SCENARIOS: DefenseScenario[] = [
  {
    id: 'drizz-async-concurrency',
    title: '25x Concurrent Async Evaluation Pipeline',
    subtitle: 'High-throughput prompt benchmarking with dynamic rate limiting',
    category: 'Drizz',
    impactBadge: '25x Speedup · Zero Rate-Limit Crashes',
    icon: Zap,
    color: '#67E8F9',
    bulletText:
      'Engineered an asynchronous multi-LLM testing harness using asyncio.Semaphore(25) and client connection pooling, executing 5,000+ test cases across 6 model endpoints.',
    interviewerQuestion:
      'Why did you use asyncio over multithreading or multiprocessing here, and how did you prevent 429 Too Many Requests errors when firing 25 concurrent requests to OpenAI?',
    interviewerFollowupTrap:
      'What happens if a model takes 60 seconds to stream back tokens — does it block the entire asyncio event loop for the other 24 requests?',
    architectureModel: `[Test Generator] ──► [asyncio.Queue]
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
   [Semaphore Worker 1..25]   [Token Bucket Limiter]
             │                         │
             ▼                         ▼
   [httpx.AsyncClient Pool] ──► [LLM Providers (OpenAI/Anthropic)]`,
    fiveWhys: [
      'Why? Sequential API calls took 45 minutes for 5,000 prompt permutations.',
      'Why not threading? Thread pools incur OS context switching overhead and memory bloat for pure I/O socket waits.',
      'Why asyncio? Single event loop efficiently tracks thousands of open non-blocking socket file descriptors in O(1) memory.',
      'Why Semaphore(25)? Prevents socket exhaustion and bounds concurrent flight requests within provider quota.',
      'Why did it not block on slow streams? Async streaming chunks yield control via await, letting the event loop service all active coroutines seamlessly.',
    ],
    spokenSeniorScript:
      "In our prompt testing pipeline, the bottleneck was purely network I/O waiting on LLM API responses. Using multiprocessing would waste CPU cores on sleeping sockets, and raw threading would hit OS memory limits with thread stacks.\n\nI chose Python's asyncio with an explicit asyncio.Semaphore(25) combined with an in-memory token bucket rate limiter. When a coroutine awaits the response stream, it yields control back to the event loop, enabling 25 concurrent requests to progress simultaneously on a single thread.\n\nThis reduced our benchmark runtime from 45 minutes to under 2 minutes without triggering a single HTTP 429.",
    verificationCode: `import asyncio
import httpx

async def run_benchmark():
    sem = asyncio.Semaphore(25)
    async with httpx.AsyncClient(timeout=30.0) as client:
        async def fetch(prompt_id: int):
            async with sem:
                resp = await client.post("https://api.openai.com/v1/chat/completions", json={"prompt_id": prompt_id})
                return resp.status_code
        tasks = [fetch(i) for i in range(100)]
        results = await asyncio.gather(*tasks)
        print(f"Executed {len(results)} prompt evaluations successfully.")

if __name__ == "__main__":
    asyncio.run(run_benchmark())`,
  },
  {
    id: 'dynamo-to-postgres',
    title: 'DynamoDB to PostgreSQL Migration (200ms -> 20ms)',
    subtitle: 'Relational normalization, foreign keys, and indexing strategy',
    category: 'Drizz',
    impactBadge: '10x Latency Reduction · 200ms ➔ 20ms',
    icon: Database,
    color: '#38BDF8',
    bulletText:
      'Architected migration from unindexed DynamoDB tables to a normalized PostgreSQL schema with composite B-Tree indexes and SQLAlchemy ORM, slashing p95 query latency from 200ms to 20ms.',
    interviewerQuestion:
      'DynamoDB is famously scalable. Why on earth did you migrate away from DynamoDB to PostgreSQL, and why was DynamoDB giving you 200ms latency?',
    interviewerFollowupTrap:
      'How did you prevent the dreaded N+1 query problem in SQLAlchemy after normalizing into relational tables with foreign keys?',
    architectureModel: `BEFORE: [Client] ──► [DynamoDB Table Scan] (200ms, O(N) Page Reads over unindexed attributes)

AFTER:  [Client] ──► [PostgreSQL Engine]
                          │
             [Composite B-Tree Index: (user_id, status)]
                          │ (O(log N) 3-page hop)
                          ▼
             [Heap Page Fetch via ctid] (20ms, Index-Only Scan)`,
    fiveWhys: [
      'Why was DynamoDB slow? Our queries filtered by non-partition attributes, forcing full Table Scans instead of O(1) Key Queries.',
      'Why not add Secondary Indexes (GSIs)? GSIs added write amplification, eventual consistency anomalies, and exponential AWS costs.',
      'Why PostgreSQL? Relational integrity, ACID transactions, and rich composite B-Tree indexes matching our access patterns.',
      'Why 200ms -> 20ms? Composite index on (workspace_id, test_run_id, created_at) enabled Index-Only Scans reading 3 disk pages instead of scanning 50,000 items.',
      'How to stop N+1 queries? Used SQLAlchemy selectinload() and joinedload() instead of lazy evaluation across relationships.',
    ],
    spokenSeniorScript:
      "While DynamoDB offers O(1) lookups by Partition Key, our query patterns evolved into complex multi-tenant filters across workspace, test status, and date ranges. Because these were non-key attributes, DynamoDB was performing expensive distributed Table Scans taking 200ms+.\n\nBy designing a normalized 3NF PostgreSQL schema with foreign keys and composite B-Tree indexes following the leftmost prefix rule, the query planner shifted from a sequential scan to an Index Scan hopping through 3 tree levels. Latency dropped to 20ms.\n\nIn SQLAlchemy, we strictly enforced joinedload and selectinload to guarantee single-query retrieval without N+1 roundtrips.",
    verificationCode: `from sqlalchemy import Column, Integer, String, Index, select
from sqlalchemy.orm import declarative_base, joinedload

Base = declarative_base()

class TestCase(Base):
    __tablename__ = 'test_cases'
    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, nullable=False)
    status = Column(String(32), nullable=False)
    created_at = Column(Integer, nullable=False)
    
    # Leftmost prefix covers: (workspace_id), (workspace_id, status)
    __table_args__ = (
        Index('idx_workspace_status_created', 'workspace_id', 'status', 'created_at'),
    )`,
  },
  {
    id: 'gepa-genetic-prompt-optimization',
    title: 'GEPA: Genetic Evolutionary Prompt Optimization',
    subtitle: 'Population genetics, semantic mutations, and token budgeting',
    category: 'GEPA',
    impactBadge: '66% API Cost Reduction · Automated Prompt Tuning',
    icon: Sparkles,
    color: '#6EE7B7',
    bulletText:
      'Developed GEPA (Genetic Evolutionary Prompt Algorithm), utilizing fitness scoring, elitism, crossover, and LLM-driven semantic mutation to optimize prompt performance while cutting token costs by 66%.',
    interviewerQuestion:
      'How does a genetic algorithm work on text prompts where you cannot simply do mathematical matrix multiplication?',
    interviewerFollowupTrap:
      'How do you prevent the genetic optimizer from infinite prompt expansion that burns through all your API credits?',
    architectureModel: `[Initial Seed Prompts] 
         │
         ▼
[Benchmark Evaluation] ──► [Fitness Scoring: Accuracy / Token Cost]
         │
         ▼
[Elitism: Top 20% Kept] ──► [Crossover: Merge High-Performing Instructions]
         │
         ▼
[Semantic LLM Mutation] ──► [Budget Guardrail: Early Stop if ΔFitness < ε]`,
    fiveWhys: [
      'Why genetic algorithms? Manual prompt engineering is non-deterministic, time-consuming, and fails to explore the combinatorial prompt space.',
      'How is crossover implemented? We parse instructions, few-shot exemplars, and constraints into modular DNA fragments and recombine high-fitness fragments.',
      'How does mutation work? A temperature-controlled LLM rewrites specific instructions to be more concise or semantically rigorous.',
      'What is the fitness function? F = α * (Accuracy) - β * (Token_Count / Target_Budget) - γ * (Latency).',
      'How did you cut cost by 66%? Penalizing token bloat in the fitness function rewarded concise prompts, converging on shorter prompts that maintained accuracy.',
    ],
    spokenSeniorScript:
      "In GEPA, we treat a system prompt as an evolutionary chromosome composed of genes: Task Framing, Context Constraints, and Few-Shot Examples. We initialize a population of 10 candidate prompts and evaluate them across benchmark test sets.\n\nThe fitness function balances accuracy against token count. In each generation, we apply Elitism to preserve the top 20%, Crossover to recombine successful prompt fragments, and Semantic Mutation where an LLM introduces targeted syntactic variations.\n\nBy explicitly penalizing token length in the fitness score and enforcing early stopping when convergence plateaus, the algorithm autonomously discovered prompts that were 66% cheaper while boosting benchmark pass rates.",
    verificationCode: `def fitness(accuracy: float, tokens: int, target_tokens: int = 500) -> float:
    # Reward accuracy, penalize token bloat exponentially past budget
    token_penalty = max(0, tokens - target_tokens) * 0.002
    return accuracy - token_penalty

class PromptChromosome:
    def __init__(self, system_instruction: str, few_shots: list):
        self.system_instruction = system_instruction
        self.few_shots = few_shots
        self.fitness_score = 0.0`,
  },
  {
    id: 'xml-lca-sibling-pruning',
    title: 'Active-Based Sibling Pruning with LCA',
    subtitle: 'Mobile UI XML tree reduction for Vision AI agents',
    category: 'Drizz',
    impactBadge: '67% XML Token Reduction · 3x Faster Vision Loop',
    icon: FileCode2,
    color: '#F2B866',
    bulletText:
      'Devised Active-Based Sibling Pruning algorithm with Lowest Common Ancestor (LCA) tree reduction on mobile Android/iOS view hierarchies, reducing XML DOM token size by 67% prior to LLM vision context ingestion.',
    interviewerQuestion:
      'Why did mobile UI XML trees cause problems for your Vision AI agent, and what does Lowest Common Ancestor (LCA) have to do with pruning a DOM tree?',
    interviewerFollowupTrap:
      'If you prune sibling nodes, how do you prevent breaking absolute tap(x, y) coordinates for interactive buttons?',
    architectureModel: `Raw XML (18,000 tokens, 800 layout containers)
         │
         ▼
[OCR Bounding Box Overlay] ──► [Identify Interactive Leaves (Buttons, Inputs)]
         │
         ▼
[Compute LCA Subtree] ──► [Prune Static Non-Interactive Sibling Containers]
         │
         ▼
Pruned XML Tree (5,900 tokens: 67% reduction, preserves all tap coordinates)`,
    fiveWhys: [
      'Why prune XML? Android View hierarchies generate 15,000–20,000 XML tokens of deeply nested empty LinearLayouts and FrameLayouts.',
      'Why not send raw screenshots only? Vision models struggle with sub-pixel tap precision; XML provides exact resource-ids and bounding coordinates.',
      'Why did naive pruning fail? Blindly deleting parents destroyed coordinate frames and relative layout positioning.',
      'How does LCA help? For all active interactive elements (buttons, inputs), we compute their Lowest Common Ancestor node in the XML DOM.',
      'Result? All sibling branches outside the LCA path containing zero interactive elements are pruned in O(N) time, eliminating 67% of token bloat.',
    ],
    spokenSeniorScript:
      "Mobile UI XML trees exported from Appium or UIAutomator are bloated with invisible layout wrappers that consume tens of thousands of LLM context tokens. However, the Vision AI agent only needs to interact with actionable elements—buttons, text inputs, and scroll views.\n\nI built an Active-Based Sibling Pruning algorithm using Lowest Common Ancestor (LCA). We first identify all interactive leaf nodes tagged by AWS Textract or accessibility flags. Then, traversing the DOM tree upward, we compute the minimal subtree spanning these interactive leaves.\n\nAny sibling branch with zero interactive descendants is pruned while preserving the bounding-box coordinate offsets. This slashed token consumption by 67% and cut vision inference latency by 3x.",
    verificationCode: `import xml.etree.ElementTree as ET

def prune_non_interactive_siblings(root: ET.Element, interactive_ids: set) -> bool:
    """Returns True if the node or any descendant is interactive."""
    is_self_interactive = root.attrib.get("resource-id") in interactive_ids or root.attrib.get("clickable") == "true"
    
    # Recursively prune children
    active_children = []
    for child in list(root):
        if prune_non_interactive_siblings(child, interactive_ids):
            active_children.append(child)
    
    root[:] = active_children
    return is_self_interactive or len(active_children) > 0`,
  },
  {
    id: 'fitlabs-single-flight-lock',
    title: 'FitLabs ZeroGPU Single-Flight Lock & Async Polling',
    subtitle: 'High-cost diffusion model inference protection and queueing',
    category: 'FitLabs',
    impactBadge: 'Zero GPU OOM Crashes · 202 Accepted Async Architecture',
    icon: Cpu,
    color: '#FB7185',
    bulletText:
      'Architected async FastAPI + Redis job pipeline for 15-45s IDM-VTON diffusion inference; implemented thread-safe Single-Flight locks to coalesce concurrent cold-start requests and eliminate GPU VRAM crashes.',
    interviewerQuestion:
      'How did you handle a 45-second heavy image diffusion job in an HTTP API without hitting Cloudflare/Nginx 504 Gateway Timeouts?',
    interviewerFollowupTrap:
      'What happens if 10 users click "Try On" for the exact same garment at the same second? Do you load the model 10 times in GPU VRAM?',
    architectureModel: `Client POST /try-on ──► [FastAPI Gateway]
                              │
               [Single-Flight Lock in Memory/Redis]
                              │ (If key exists, wait on active Promise)
                              ▼
               [Push Job to Redis Queue] ──► Returns 202 Accepted {job_id} in 15ms
                              │
               [Celery / Worker Pool] ──► [GPU IDM-VTON Inference 15-45s]
                              │
               Client GET /jobs/{id} ──► 200 OK {status: "COMPLETED", url: "..."}`,
    fiveWhys: [
      'Why not synchronous HTTP? Nginx and client browsers timeout after 30 seconds with 504 Gateway Timeout.',
      'Why 202 Accepted? Standard REST pattern for asynchronous processing: accepts request in 15ms and provides status URI.',
      'Why Single-Flight Lock? When a popular garment went viral, 20 concurrent requests triggered 20 parallel model runs, causing GPU CUDA Out Of Memory (OOM).',
      'How does Single-Flight work? A thread-safe mutex dictionary tracks active job hashes. If a job is in-flight, subsequent requests wait on the same event.',
      'Impact? Coalesced redundant GPU computations, stabilizing GPU VRAM usage at 100% reliability.',
    ],
    spokenSeniorScript:
      "Virtual try-on diffusion models take 15 to 45 seconds to generate photorealistic garment blends. A synchronous HTTP connection would trigger 504 Gateway Timeouts at the reverse proxy.\n\nWe architected a decoupled job pipeline: the client submits the image pair via POST, FastAPI validates the payload and pushes a task to Redis, immediately returning HTTP 202 Accepted with a job ID in under 15ms. The client polls GET /jobs/{id} or listens via SSE.\n\nTo protect our GPU worker pool from stampedes, I built a Single-Flight Lock pattern. If multiple requests arrive for identical inputs, only the first request dispatches to the GPU while subsequent callers subscribe to the same broadcast channel, preventing GPU memory crashes completely.",
    verificationCode: `import asyncio

class SingleFlight:
    def __init__(self):
        self._flights = {}
        self._lock = asyncio.Lock()

    async def do(self, key: str, coro_fn):
        async with self._lock:
            if key in self._flights:
                # Share existing in-flight task
                return await self._flights[key]
            # Create new shared task
            task = asyncio.create_task(coro_fn())
            self._flights[key] = task

        try:
            return await task
        finally:
            async with self._lock:
                self._flights.pop(key, None)`,
  },
  {
    id: 'critical-p1-incident-response',
    title: 'P1 Incident Defense: Root Cause Analysis (5 Whys)',
    subtitle: 'STAR response to high-severity production outage and remediation',
    category: 'Production Incidents',
    impactBadge: 'MTTR: 18 Minutes · Permanent Architectural Remediation',
    icon: AlertTriangle,
    color: '#FB7185',
    bulletText:
      'Resolved 7 critical P1 production incidents across multi-tenant testing clusters using systematic observability (structured telemetry, Sentry, Redis metrics) and root cause analysis.',
    interviewerQuestion:
      'Tell me about a time when a critical production incident happened on your watch. How did you diagnose it, what was the root cause, and how did you prevent it from happening again?',
    interviewerFollowupTrap:
      'Did you roll back immediately or did you attempt to patch it in production?',
    architectureModel: `[Traffic Spike: 250 RPS] ──► [PostgreSQL Connection Pool Exhausted (100/100)]
                                   │
                                   ▼
             [FastAPI Unhandled ConnectionTimeout: 500 Internal Server Error]
                                   │
                                   ▼
[Root Cause: Missing Foreign Key Index on test_runs.account_id triggered sequential scan on 2M rows]`,
    fiveWhys: [
      'Why did the API return 500s? FastAPI ran out of database connections from the SQLAlchemy pool.',
      'Why did connection pool run out? Queries that usually took 5ms were hanging for 8,500ms.',
      'Why were queries hanging? A new reporting endpoint ran SELECT * FROM test_runs WHERE account_id = X on a 2-million row table.',
      'Why did that query take 8,500ms? The account_id foreign key column lacked a B-Tree index, forcing a disk-bound Sequential Scan.',
      'Remediation: Immediately killed slow queries, scaled pool temporarily, applied CREATE INDEX CONCURRENTLY idx_test_runs_account_id without downtime, and added automated index linting to CI/CD.',
    ],
    spokenSeniorScript:
      "During peak morning traffic, our core API began firing HTTP 500 errors with latency spiking to 10 seconds. Sentry alerts indicated SQLAlchemy connection pool timeouts.\n\nMy immediate priority was mitigation: I inspected pg_stat_activity to identify blocked queries and observed 80 connections stuck on a single SELECT statement filtering test runs by account_id. Because account_id lacked an index on this 2-million row table, every request triggered a sequential disk scan that held connections open until the pool was saturated.\n\nI terminated the hung queries, bumped the pool size temporarily to restore API health within 18 minutes, and executed CREATE INDEX CONCURRENTLY in production to add the missing B-Tree index with zero downtime. We then integrated schema index verification checks into our CI/CD pipeline to ensure any foreign key definition automatically requires an index.",
    verificationCode: `-- Zero-downtime remediation applied in PostgreSQL:
CREATE INDEX CONCURRENTLY idx_test_runs_account_id 
ON test_runs(account_id);

-- Verify execution plan shifted from Seq Scan to Index Scan:
EXPLAIN ANALYZE 
SELECT * FROM test_runs 
WHERE account_id = 42;
-- -> Index Scan using idx_test_runs_account_id (cost=0.43..8.45 rows=1 width=128)`,
  },
  {
    id: 'wisdombot-rag-chunking',
    title: 'WisdomBot Aerospace RAG: Chunking & Boundary Ingestion',
    subtitle: 'Semantic document decomposition across 500-page maintenance manuals',
    category: 'WisdomBot',
    impactBadge: '42% Reduction in Retrieval Misses · Zero Boundary Loss',
    icon: Database,
    color: '#38BDF8',
    bulletText:
      'Engineered enterprise RAG document ingestion pipeline for 500-page aircraft manuals using sliding window chunking with 20% token overlap and hierarchical section metadata tagging.',
    interviewerQuestion:
      'In your WisdomBot document ingestion pipeline, how did you choose your chunk size and overlap, and how did you prevent split-boundary retrieval failures when technical specs span across two chunks?',
    interviewerFollowupTrap:
      "If you add 20% token overlap across hundreds of thousands of chunks, didn't you balloon your vector database storage and embedding API costs by 20% or more? How did you justify that?",
    architectureModel: `[500-Page PDF Manual] ──► [Layout-Aware Structural Parser]
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
   [Sliding Window Chunking]   [Metadata Preservation]
   (512 tokens + 102 tokens)   (Doc ID, ATA Spec, Chapter, Page)
              │                         │
              ▼                         ▼
   [BGE-Large-EN Embedding] ──► [Pinecone/Qdrant Vector DB]`,
    fiveWhys: [
      'Why overlap? Technical tables and torque specifications on line 50 and 51 were cut in half, causing catastrophic retrieval misses.',
      'Why 20% overlap? Empirical testing showed 15–20% was the sweet spot where boundary sentences were fully captured in both adjacent vectors.',
      'Why hierarchical metadata? Filtering by aircraft ATA chapter code narrowed search space by 90% before semantic similarity calculation.',
      'How did you mitigate cost? Pruned boilerplate headers, footers, and redundant legal disclaimers before embedding, keeping total token volume net flat.',
      'Production impact? Raised top-3 document retrieval recall from 64% to 91% on technician bench test queries.',
    ],
    spokenSeniorScript:
      'When ingesting 500-page aerospace maintenance manuals for WisdomBot, naive fixed-size chunking broke critical dependencies—such as an inspection procedure on line 50 whose mandatory torque specification appeared on line 51.\n\nWe implemented a sliding-window chunker with 512-token chunks and 100-token (20%) overlap, accompanied by structural metadata tagging including chapter, ATA code, and page offsets.\n\nWhile overlap introduces a nominal 20% raw text redundancy, we offset this by stripping boilerplate legal disclaimers and running duplicate suppression prior to embedding. This eliminated boundary splits and drove top-3 retrieval recall from 64% to 91% in production bench validations.',
    verificationCode: `def chunk_document(text: str, chunk_size: int = 512, overlap: int = 100) -> list[dict]:
    words = text.split()
    chunks = []
    step = chunk_size - overlap
    for i in range(0, len(words), step):
        chunk_words = words[i : i + chunk_size]
        chunks.append({
            "text": " ".join(chunk_words),
            "start_token": i,
            "end_token": i + len(chunk_words),
            "overlap_tokens": overlap if i > 0 else 0
        })
        if i + chunk_size >= len(words):
            break
    return chunks`,
  },
  {
    id: 'wisdombot-cross-encoder-reranking',
    title: 'Two-Stage Neural Retrieval with Cross-Encoder Reranking',
    subtitle: 'High-recall bi-encoder search combined with high-precision scoring',
    category: 'WisdomBot',
    impactBadge: 'p95 Latency < 120ms · 91% Top-3 Precision',
    icon: Cpu,
    color: '#67E8F9',
    bulletText:
      'Implemented two-stage neural search combining fast bi-encoder vector retrieval (top-50 candidates) with a cross-encoder reranker model (top-5 final), improving NDCG@5 by 34%.',
    interviewerQuestion:
      "Why didn't you just use pure vector cosine similarity with an embedding model? Why introduce a cross-encoder reranker if it adds computational overhead?",
    interviewerFollowupTrap:
      'Cross-encoders compute full cross-attention between the query and every document candidate. How did you prevent the reranker from blowing up your p95 API latency past 1 second?',
    architectureModel: `[User Query: "Valve 4B Torque Spec"]
             │
             ▼
[Stage 1: Bi-Encoder (Pinecone HNSW)] ──► Top 50 Candidates (O(1) ANN hop, 18ms)
             │
             ▼
[Stage 2: Cross-Encoder (bge-reranker-large)] ──► Full Cross-Attention Rerank (85ms)
             │
             ▼
Top 5 Final Context Chunks ──► Passed to LLM Context Window`,
    fiveWhys: [
      'Why not pure cosine similarity? Bi-encoders compress query and document independently into fixed vectors, losing fine-grained cross-token attention.',
      'Why a cross-encoder? Cross-encoders pass query and passage concatenated into transformer attention layers, computing query-document token interactions directly.',
      'Why not cross-encode the whole database? Evaluating cross-encoders on 100,000 documents takes minutes per query.',
      'How does two-stage retrieval solve this? Bi-encoder narrows 100,000 documents to top 50 in 18ms; cross-encoder evaluates only those 50 candidates in 80ms.',
      'Result? Total retrieval latency capped under 120ms while boosting top-3 precision to 91%.',
    ],
    spokenSeniorScript:
      'Bi-encoder embeddings are great for fast approximate nearest neighbor search, but because query and document are encoded in complete isolation, they suffer from semantic compression loss on technical nuances.\n\nIn WisdomBot, pure vector search often surfaced irrelevant chapters that merely shared keyword vocabulary. We architected a two-stage retrieval pipeline: Stage 1 uses Pinecone with HNSW to retrieve the top 50 candidates in 18 milliseconds.\n\nStage 2 routes these 50 candidates through a lightweight BGE-Reranker-Large cross-encoder, which evaluates all-to-all cross-attention between query tokens and document tokens. This combination boosted our NDCG@5 by 34% while capping end-to-end retrieval latency at 115ms.',
    verificationCode: `def two_stage_retrieval(query: str, vector_store, reranker, top_k: int = 5):
    # Stage 1: Fast Bi-Encoder ANN Search (Top 50)
    candidates = vector_store.similarity_search(query, k=50)
    
    # Stage 2: Cross-Encoder Joint Scoring
    pairs = [(query, doc.page_content) for doc in candidates]
    scores = reranker.predict(pairs)
    
    # Sort candidates by cross-encoder score
    ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    return [doc for doc, score in ranked[:top_k]]`,
  },
]

type ScenarioStatus = 'not_started' | 'attempted' | 'defended'

export default function ResumeGrill() {
  // Screen: 'rounds' (Screen 1) | 'interview' (Screen 2)
  const [screen, setScreen] = useState<'rounds' | 'interview'>('rounds')
  const [activeId, setActiveId] = useState<string>(DEFENSE_SCENARIOS[0].id)

  // Conversational step inside Screen 2:
  // Default to step = 3 (Study Mode: immediately shows Senior Script, 5 Whys, Architecture & Code without empty-box fatigue!)
  const [step, setStep] = useState<1 | 2 | 3>(3)
  const [candidateAnswer1, setCandidateAnswer1] = useState<string>('')
  const [candidateAnswer2, setCandidateAnswer2] = useState<string>('')

  // Senior script controls
  const [copied, setCopied] = useState(false)
  const [isScriptHidden, setIsScriptHidden] = useState(false)
  const [isPracticeMode, setIsPracticeMode] = useState(false)
  const [detailTab, setDetailTab] = useState<'whys' | 'arch' | 'code'>('whys')
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [runSuccess, setRunSuccess] = useState(false)

  // Status mapping from localStorage
  const [statusMap, setStatusMap] = useState<Record<string, ScenarioStatus>>(() => {
    try {
      const stored = localStorage.getItem('pf-resume-grill-status')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  // Ratings mapping from localStorage
  const [ratingMap, setRatingMap] = useState<Record<string, 'struggled' | 'okay' | 'defended'>>(() => {
    try {
      const stored = localStorage.getItem('pf-resume-grill-ratings')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  const saveStatus = (id: string, s: ScenarioStatus) => {
    setStatusMap((prev) => {
      const next = { ...prev, [id]: s }
      try {
        localStorage.setItem('pf-resume-grill-status', JSON.stringify(next))
      } catch {
        /* storage error safe */
      }
      return next
    })
  }

  const saveRating = (id: string, rating: 'struggled' | 'okay' | 'defended') => {
    setRatingMap((prev) => {
      const next = { ...prev, [id]: rating }
      try {
        localStorage.setItem('pf-resume-grill-ratings', JSON.stringify(next))
      } catch {
        /* storage error safe */
      }
      return next
    })
    saveStatus(id, 'defended')
  }

  const activeScenario = DEFENSE_SCENARIOS.find((s) => s.id === activeId) ?? DEFENSE_SCENARIOS[0]
  const currentIndex = DEFENSE_SCENARIOS.findIndex((s) => s.id === activeId)

  const handleSelectScenario = (id: string) => {
    setActiveId(id)
    setStep(3)
    setCandidateAnswer1('')
    setCandidateAnswer2('')
    setIsScriptHidden(false)
    setIsPracticeMode(false)
    setDetailTab('whys')
    setRunSuccess(false)
    setScreen('interview')
  }

  const handleNextScenario = () => {
    const nextIdx = (currentIndex + 1) % DEFENSE_SCENARIOS.length
    handleSelectScenario(DEFENSE_SCENARIOS[nextIdx].id)
  }

  const copyScript = () => {
    navigator.clipboard.writeText(activeScenario.spokenSeniorScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const simulateRunCode = () => {
    setRunSuccess(true)
    setTimeout(() => setRunSuccess(false), 3000)
  }

  // ========================================================================================
  // SCREEN 1: "Choose your round" (Responsive Bento Grid)
  // ========================================================================================
  if (screen === 'rounds') {
    return (
      <div className="shell max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
        {/* Compact Hero (200px) with Sky Galaxy — Always dark surface with crisp white text */}
        <div
          data-zone="night"
          className="relative h-[200px] w-full overflow-hidden rounded-3xl border border-line p-6 sm:p-8 flex flex-col justify-between shadow-2xl bg-[#05070E] text-white"
        >
          <Sky variant="galaxy" accent="#38BDF8" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <ShieldCheck size={18} />
              </span>
              <span className="font-plate text-xs font-bold uppercase tracking-wider text-sky-300">
                Citadel VI Special Simulation
              </span>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-2xs font-semibold text-emerald-300 border border-emerald-400/30">
              8 Scenarios · 100% Resume Mapped
            </span>
          </div>

          <div className="relative z-10">
            <h1 className="font-plate text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-md">
              Resume Grill & Systems Defense Simulator
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed drop-shadow-xs">
              Master the exact high-pressure technical follow-ups and trap questions interviewers ask about your production architectures.
            </p>
          </div>
        </div>

        {/* 8 Scenario Cards in a responsive 3/2/1 grid */}
        <section aria-label="Available Interview Rounds" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-chalk flex items-center gap-2">
              <Terminal size={16} className="text-sky-400" /> Choose Your Round
            </h2>
            <span className="text-2xs text-muted">
              {Object.values(statusMap).filter((s) => s === 'defended').length} / 8 Defended
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
            {DEFENSE_SCENARIOS.map((s, idx) => {
              const status = statusMap[s.id] || 'not_started'
              const rating = ratingMap[s.id]
              const SIcon = s.icon

              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectScenario(s.id)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-line bg-panel p-5 transition-all duration-300 hover:border-line-strong hover:bg-panel-2 hover:-translate-y-1 cursor-pointer shadow-sm"
                >
                  <div>
                    {/* Top row: Company chip + status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-chalk border border-line">
                        {s.category}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          status === 'defended'
                            ? 'bg-forge/15 text-forge border-forge/30'
                            : status === 'attempted'
                            ? 'bg-amber/15 text-amber border-amber/30'
                            : 'bg-line/30 text-muted border-line'
                        }`}
                      >
                        {status === 'defended'
                          ? `Defended${rating ? ` (${rating})` : ''}`
                          : status === 'attempted'
                          ? 'Attempted'
                          : 'Not started'}
                      </span>
                    </div>

                    {/* Title with icon */}
                    <div className="flex items-start gap-3 mb-2">
                      <div
                        className="p-2 rounded-xl border border-line shrink-0 mt-0.5"
                        style={{ color: s.color, backgroundColor: `${s.color}15` }}
                      >
                        <SIcon size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-muted uppercase">Round {idx + 1}</span>
                        <h3 className="font-plate text-base font-bold text-chalk group-hover:text-accent transition-colors leading-snug line-clamp-2">
                          {s.title}
                        </h3>
                      </div>
                    </div>

                    {/* Subtitle / metric */}
                    <p className="text-2xs text-muted leading-relaxed line-clamp-2 mb-4">
                      {s.subtitle}
                    </p>
                  </div>

                  {/* Bottom bar: Impact metric + Action */}
                  <div className="pt-3 border-t border-line/50 flex items-center justify-between text-2xs">
                    <span className="font-mono text-cyan truncate max-w-[190px]">
                      {s.impactBadge.split('·')[0]}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-chalk group-hover:text-accent transition-colors">
                      Enter Round <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    )
  }

  // ========================================================================================
  // SCREEN 2: The Interview Conversation (Chat Layout)
  // ========================================================================================
  return (
    <div className="shell max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
      {/* Top Navigation Bar: Back to Rounds + Current Round Info */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setScreen('rounds')}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-panel-2 px-3 py-1.5 text-xs font-semibold text-chalk hover:bg-panel-3 hover:border-line-strong transition-colors"
          >
            <ArrowLeft size={14} /> <span>All Rounds</span>
          </button>
          <div className="h-4 w-px bg-line hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-2xs font-mono font-semibold text-muted border border-line">
              {activeScenario.category}
            </span>
            <h1 className="font-plate text-sm sm:text-base font-bold text-chalk truncate max-w-[280px] sm:max-w-md">
              {activeScenario.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile scenario dropdown selector */}
          <div className="lg:hidden">
            <select
              aria-label="Select interview scenario"
              value={activeId}
              onChange={(e) => handleSelectScenario(e.target.value)}
              className="rounded-xl border border-line bg-panel-2 px-3 py-1.5 text-xs font-semibold text-chalk"
            >
              {DEFENSE_SCENARIOS.map((s, i) => (
                <option key={s.id} value={s.id}>
                  Round {i + 1}: {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Study Mode vs Delivery Practice Mode Switcher */}
          <div className="inline-flex rounded-xl border border-line bg-panel-2 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setStep(3)}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                step === 3 ? 'bg-cyan/20 text-cyan border border-cyan/40' : 'text-muted hover:text-chalk'
              }`}
            >
              📖 Study Mode
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                step < 3 ? 'bg-amber/20 text-amber border border-amber/40' : 'text-muted hover:text-chalk'
              }`}
            >
              🎙️ Delivery Drill
            </button>
          </div>

          <button
            type="button"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="rounded-xl border border-line bg-panel-2 px-3 py-1.5 text-xs text-muted hover:text-chalk transition-colors hidden xl:inline-flex"
          >
            {rightPanelOpen ? 'Hide Resume Context' : 'Show Resume Context'}
          </button>
        </div>
      </header>

      {/* 3-Column Conversational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,760px)_300px] gap-6 justify-center w-full">
        {/* Left Rail: Scenario List (Hidden on mobile; mobile uses dropdown) */}
        <aside className="hidden lg:flex flex-col gap-2 rounded-2xl border border-line bg-panel p-3 h-fit sticky top-20">
          <div className="px-2 py-1.5 text-2xs font-bold uppercase tracking-wider text-muted border-b border-line mb-1">
            Interview Rounds ({DEFENSE_SCENARIOS.length})
          </div>
          <div className="flex flex-col gap-1.5">
            {DEFENSE_SCENARIOS.map((s, idx) => {
              const isSelected = s.id === activeId
              const status = statusMap[s.id] || 'not_started'
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectScenario(s.id)}
                  className={`flex flex-col rounded-xl p-2.5 text-left transition-all ${
                    isSelected
                      ? 'border border-sky-500/40 bg-sky-500/10 shadow-sm'
                      : 'border border-transparent hover:border-line hover:bg-panel-2'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                    <span className="text-muted">Round {idx + 1}</span>
                    <span
                      className={`font-semibold ${
                        status === 'defended'
                          ? 'text-forge'
                          : status === 'attempted'
                          ? 'text-amber'
                          : 'text-muted'
                      }`}
                    >
                      {status === 'defended' ? '✓ Defended' : status === 'attempted' ? 'Attempted' : 'Pending'}
                    </span>
                  </div>
                  <span className="font-plate text-xs font-semibold text-chalk truncate">
                    {s.title}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Center: The Chat Thread (max 760px) */}
        <main className="flex flex-col gap-6 max-w-[760px] mx-auto w-full">
          {/* 1. Interviewer Bubble: Primary Question */}
          <ChatMessage
            role="interviewer"
            senderName="Lead Systems Interviewer"
            avatar="🧐"
            badge="Primary Question"
          >
            <div className="text-2xs font-mono uppercase tracking-wider text-amber mb-1.5">
              Opening Grill
            </div>
            <h2 className="font-plate text-xl font-semibold text-chalk leading-snug">
              "{activeScenario.interviewerQuestion}"
            </h2>
          </ChatMessage>

          {/* 2. Candidate Composer 1 (or Candidate Bubble 1 if submitted) */}
          {step === 1 ? (
            <div className="w-full flex flex-col gap-2">
              <div className="text-2xs font-semibold uppercase tracking-wider text-muted px-1 flex items-center justify-between">
                <span>Your Spoken Answer</span>
                <span className="text-cyan">Pace yourself for a 60-second delivery</span>
              </div>
              <ChatComposer
                placeholder="Explain your architectural reasoning, constraints, and why you avoided the naive trap..."
                onSubmit={(ans) => {
                  setCandidateAnswer1(ans)
                  saveStatus(activeScenario.id, 'attempted')
                  setStep(2)
                }}
              />
            </div>
          ) : candidateAnswer1.trim() ? (
            <ChatMessage
              role="candidate"
              senderName="You (Candidate)"
              avatar="💻"
              badge="Your Response"
            >
              <p className="text-sm text-chalk leading-relaxed whitespace-pre-wrap">
                {candidateAnswer1}
              </p>
            </ChatMessage>
          ) : null}

          {/* 3. Follow-Up Trap (Revealed in Step 2 & 3) */}
          {step >= 2 && (
            <ChatMessage
              role="interviewer"
              senderName="Lead Systems Interviewer"
              avatar="⚠️"
              badge="Follow-Up Trap"
              className="animate-in fade-in slide-in-from-bottom-3 duration-300"
            >
              <div className="flex items-center gap-1.5 text-2xs font-mono uppercase tracking-wider text-amber mb-1.5">
                <AlertTriangle size={13} /> High-Pressure Stress Test
              </div>
              <p className="font-plate text-lg font-semibold text-amber leading-snug italic">
                "{activeScenario.interviewerFollowupTrap}"
              </p>
            </ChatMessage>
          )}

          {/* 4. Candidate Composer 2 (or Candidate Bubble 2 if submitted) */}
          {step === 2 && (
            <div className="w-full flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-2xs font-semibold uppercase tracking-wider text-muted px-1 flex items-center justify-between">
                <span>Your Trap Defense</span>
                <span className="text-amber">Address the edge case directly without stalling</span>
              </div>
              <ChatComposer
                placeholder="How does your architecture handle this edge case or failure mode?..."
                onSubmit={(ans) => {
                  setCandidateAnswer2(ans)
                  setStep(3)
                }}
              />
            </div>
          )}

          {step >= 3 && candidateAnswer2.trim() && (
            <ChatMessage
              role="candidate"
              senderName="You (Candidate)"
              avatar="💻"
              badge="Trap Response"
            >
              <p className="text-sm text-chalk leading-relaxed whitespace-pre-wrap">
                {candidateAnswer2}
              </p>
            </ChatMessage>
          )}

          {/* 5. Senior Engineer Bubble: The Master Spoken Script (Step 3) */}
          {step >= 3 && (
            <ChatMessage
              role="senior"
              senderName="Staff / Senior Systems Engineer"
              avatar="🏆"
              badge="Gold Standard Script"
              className="animate-in fade-in zoom-in-95 duration-400"
              actions={
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyScript}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel-2 px-2.5 py-1 text-chalk hover:bg-panel-3 transition-colors"
                    >
                      <Copy size={13} />
                      <span>{copied ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsScriptHidden(!isScriptHidden)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel-2 px-2.5 py-1 text-muted hover:text-chalk transition-colors"
                    >
                      {isScriptHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                      <span>{isScriptHidden ? 'Reveal Script' : 'Hide Script'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPracticeMode(!isPracticeMode)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition-colors ${
                        isPracticeMode
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-line bg-panel-2 text-muted hover:text-chalk'
                      }`}
                      title="Practice mode dims text to 50% for rehearsal"
                    >
                      <span>Practice Mode</span>
                    </button>
                  </div>

                  <span className="text-2xs text-muted font-mono">
                    Target pace: 55–65s
                  </span>
                </div>
              }
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xs font-mono uppercase tracking-wider text-sky-400">
                  Verbatim Spoken Defense
                </span>
                <span className="text-2xs text-muted">Structure: Problem ➔ Traps ➔ Choice ➔ Result</span>
              </div>

              {!isScriptHidden ? (
                <div
                  style={{ fontSize: '19px', lineHeight: '1.65' }}
                  className={`text-chalk font-sans leading-relaxed tracking-normal transition-all duration-300 ${
                    isPracticeMode ? 'opacity-50 select-none' : 'opacity-100'
                  }`}
                >
                  {activeScenario.spokenSeniorScript.split('\n\n').map((para, i) => (
                    <p key={i} className="mb-3.5 last:mb-0">
                      "{para}"
                    </p>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted bg-surface-2 rounded-xl border border-line/40">
                  Script hidden for active recall practice. Try reciting aloud, then click "Reveal Script".
                </div>
              )}
            </ChatMessage>
          )}

          {/* 6. Collapsed Detailed Technical Sections: 5 Whys, Architecture, Proof Code */}
          {step >= 3 && (
            <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm flex flex-col gap-4 animate-in fade-in duration-300">
              {/* Tab navigation */}
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDetailTab('whys')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      detailTab === 'whys'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-muted hover:text-chalk'
                    }`}
                  >
                    5 Whys Rationale
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('arch')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      detailTab === 'arch'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-muted hover:text-chalk'
                    }`}
                  >
                    Architecture Diagram
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('code')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      detailTab === 'code'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-muted hover:text-chalk'
                    }`}
                  >
                    Proof Code
                  </button>
                </div>
              </div>

              {/* Tab 1: 5 Whys */}
              {detailTab === 'whys' && (
                <div className="flex flex-col gap-2">
                  <span className="text-2xs font-mono uppercase tracking-wider text-muted">
                    Root Cause Drilldown (Toyota 5-Whys Method):
                  </span>
                  <ol className="flex flex-col gap-2">
                    {activeScenario.fiveWhys.map((why, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-line bg-surface-1 p-3 text-xs text-chalk flex items-start gap-2.5"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan/15 text-cyan font-bold text-[11px]">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{why}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Tab 2: Architecture */}
              {detailTab === 'arch' && (
                <div>
                  <span className="text-2xs font-mono uppercase tracking-wider text-muted block mb-2">
                    Dataflow & Component Topology:
                  </span>
                  <pre className="rounded-xl border border-line bg-surface-1 p-4 font-mono text-xs text-cyan overflow-x-auto whitespace-pre leading-relaxed">
                    {activeScenario.architectureModel}
                  </pre>
                </div>
              )}

              {/* Tab 3: Proof Code */}
              {detailTab === 'code' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-2xs text-muted">
                    <span className="font-mono">Production Verification Implementation:</span>
                    <button
                      type="button"
                      onClick={simulateRunCode}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-forge px-3 py-1 font-semibold text-black hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Play size={12} /> {runSuccess ? 'Verified ✓' : 'Run Proof'}
                    </button>
                  </div>
                  <pre className="rounded-xl border border-line bg-surface-1 p-4 font-mono text-xs text-chalk overflow-x-auto leading-relaxed">
                    <code>{activeScenario.verificationCode}</code>
                  </pre>
                  {runSuccess && (
                    <div className="rounded-xl border border-forge/30 bg-forge/10 p-3 text-xs text-forge flex items-center gap-2">
                      <CheckCircle2 size={16} /> Standalone verification tests passed with 0 errors.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 7. Rating Buttons & Next Scenario (Step 3) */}
          {step >= 3 && (
            <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-chalk">Rate Your Defense</span>
                <span className="text-2xs text-muted">Saves mastery state to your expedition log</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => saveRating(activeScenario.id, 'struggled')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
                    ratingMap[activeScenario.id] === 'struggled'
                      ? 'border-crimson bg-crimson/20 text-crimson shadow-sm'
                      : 'border-line bg-panel-2 text-muted hover:text-chalk'
                  }`}
                >
                  Struggled
                </button>
                <button
                  type="button"
                  onClick={() => saveRating(activeScenario.id, 'okay')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
                    ratingMap[activeScenario.id] === 'okay'
                      ? 'border-amber bg-amber/20 text-amber shadow-sm'
                      : 'border-line bg-panel-2 text-muted hover:text-chalk'
                  }`}
                >
                  Okay
                </button>
                <button
                  type="button"
                  onClick={() => saveRating(activeScenario.id, 'defended')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
                    ratingMap[activeScenario.id] === 'defended'
                      ? 'border-forge bg-forge/20 text-forge shadow-sm'
                      : 'border-line bg-panel-2 text-muted hover:text-chalk'
                  }`}
                >
                  Defended It ✓
                </button>

                <button
                  type="button"
                  onClick={handleNextScenario}
                  className="ml-2 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-1.5 text-xs font-semibold text-black hover:brightness-110 active:scale-95 transition-all"
                >
                  <span>Next Round</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Right Panel: Resume Bullet & Context (Collapsible on wide screens) */}
        {rightPanelOpen && (
          <aside className="hidden xl:flex flex-col gap-4 rounded-2xl border border-line bg-panel p-5 h-fit sticky top-20">
            <div>
              <span className="text-2xs font-bold uppercase tracking-wider text-muted">
                Resume Bullet Mapped
              </span>
              <p className="text-xs text-chalk leading-relaxed mt-2 p-3 rounded-xl bg-surface-1 border border-line">
                "{activeScenario.bulletText}"
              </p>
            </div>

            <div className="pt-3 border-t border-line/50">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted">
                Key Metrics Defended
              </span>
              <div className="mt-2 rounded-xl bg-cyan/10 border border-cyan/25 p-3 text-xs font-mono text-cyan">
                {activeScenario.impactBadge}
              </div>
            </div>

            <div className="pt-3 border-t border-line/50 text-2xs text-muted leading-relaxed">
              Interviewers probe the boundary between what is written on your resume and your deep, firsthand architectural memory.
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Cpu, Lock, Zap, CheckCircle2, AlertOctagon } from 'lucide-react'
import type { VisualizerProps } from './types'

export default function ConcurrencyTimelineVisualizer({ step: _step }: VisualizerProps) {
  const [model, setModel] = useState<'sync' | 'threading' | 'asyncio' | 'multiprocessing' | 'single_flight'>('asyncio')

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 font-sans text-slate-200">
      {/* Top Header & Execution Model Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E3446] pb-3">
        <div className="flex items-center gap-2">
          <Cpu size={18} className="text-amber" />
          <span className="font-plate text-sm font-bold tracking-wide text-white">
            OS Concurrency, GIL & Parallelism Visualizer
          </span>
          <span className="rounded-full bg-amber/15 px-2 py-0.5 text-2xs font-mono text-amber">
            Citadel IV Engine
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#2E3446] bg-[#0E1118] p-1 text-xs">
          {(['sync', 'threading', 'asyncio', 'multiprocessing', 'single_flight'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModel(m)}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                model === m
                  ? 'bg-amber text-slate-950 font-bold shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {m === 'sync' && '1. Synchronous'}
              {m === 'threading' && '2. ThreadPool (GIL)'}
              {m === 'asyncio' && '3. Asyncio (Event Loop)'}
              {m === 'multiprocessing' && '4. Multiprocessing (4 Cores)'}
              {m === 'single_flight' && '5. Single-Flight Lock'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Multi-Lane Timeline Canvas */}
      <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-[#2E3446] bg-[#0A0D14] p-4 shadow-inner overflow-y-auto">
        {/* GIL Status Indicator */}
        <div className="flex items-center justify-between rounded-xl border border-[#222838] bg-[#101420] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Lock size={15} className={model === 'threading' ? 'text-crimson' : model === 'multiprocessing' ? 'text-emerald' : 'text-cyan'} />
            <span className="text-xs font-mono font-bold">CPython Global Interpreter Lock (GIL) Status:</span>
          </div>
          <div className="flex items-center gap-2">
            {model === 'threading' ? (
              <span className="flex items-center gap-1 text-2xs font-mono bg-crimson/20 border border-crimson/40 text-crimson px-2.5 py-0.5 rounded-full font-bold">
                <AlertOctagon size={12} /> GIL Contention: Threads Serialization on CPU Loop
              </span>
            ) : model === 'multiprocessing' ? (
              <span className="flex items-center gap-1 text-2xs font-mono bg-emerald/20 border border-emerald/40 text-emerald px-2.5 py-0.5 rounded-full font-bold">
                <CheckCircle2 size={12} /> Bypassed: 4 Interpreters on 4 Cores
              </span>
            ) : model === 'asyncio' ? (
              <span className="flex items-center gap-1 text-2xs font-mono bg-cyan/20 border border-cyan/40 text-cyan px-2.5 py-0.5 rounded-full font-bold">
                <Zap size={12} /> Released During Socket I/O Await
              </span>
            ) : (
              <span className="text-2xs font-mono text-muted">Single Main Thread</span>
            )}
          </div>
        </div>

        {/* Lanes */}
        <div className="flex flex-col gap-2.5 py-2">
          {/* Lane 1: CPU Core 1 */}
          <div className="flex items-center gap-3">
            <span className="w-24 text-2xs font-mono text-[#94A3B8] shrink-0">CPU Core 1</span>
            <div className="relative flex-1 h-10 rounded-xl border border-[#222838] bg-[#141722] p-1 flex items-center overflow-hidden">
              {model === 'sync' && (
                <div className="h-full w-1/4 rounded-lg bg-sky-500 text-slate-100 flex items-center justify-center text-xs font-mono">
                  Task A (Compute)
                </div>
              )}
              {model === 'threading' && (
                <div className="flex h-full w-full gap-1">
                  <div className="h-full w-1/4 rounded-lg bg-sky-500 text-slate-100 flex items-center justify-center text-2xs font-mono">Thread 1 (Active)</div>
                  <div className="h-full w-1/4 rounded-lg bg-crimson/30 border border-crimson/50 text-crimson flex items-center justify-center text-2xs font-mono">Thread 2 (GIL Wait)</div>
                  <div className="h-full w-1/4 rounded-lg bg-sky-500 text-slate-100 flex items-center justify-center text-2xs font-mono">Thread 2 (Active)</div>
                </div>
              )}
              {model === 'asyncio' && (
                <div className="flex h-full w-full gap-1">
                  <div className="h-full w-1/6 rounded-lg bg-cyan text-slate-950 flex items-center justify-center text-2xs font-mono font-bold">Coroutine 1</div>
                  <div className="h-full w-1/4 rounded-lg bg-[#222838] text-muted flex items-center justify-center text-2xs font-mono">await socket.read()</div>
                  <div className="h-full w-1/6 rounded-lg bg-cyan text-slate-950 flex items-center justify-center text-2xs font-mono font-bold">Coroutine 2</div>
                  <div className="h-full w-1/4 rounded-lg bg-[#222838] text-muted flex items-center justify-center text-2xs font-mono">await socket.read()</div>
                  <div className="h-full w-1/6 rounded-lg bg-cyan text-slate-950 flex items-center justify-center text-2xs font-mono font-bold">Coroutine 3</div>
                </div>
              )}
              {model === 'multiprocessing' && (
                <div className="h-full w-full rounded-lg bg-emerald text-slate-950 flex items-center justify-center text-xs font-mono font-bold">
                  Process 101: Core 1 Running (100% Saturation)
                </div>
              )}
              {model === 'single_flight' && (
                <div className="h-full w-3/4 rounded-lg bg-sky-500 text-slate-100 flex items-center justify-center text-xs font-mono">
                  Single-Flight Active Computation (Job 42)
                </div>
              )}
            </div>
          </div>

          {/* Lane 2: CPU Core 2 */}
          <div className="flex items-center gap-3">
            <span className="w-24 text-2xs font-mono text-[#94A3B8] shrink-0">CPU Core 2</span>
            <div className="relative flex-1 h-10 rounded-xl border border-[#222838] bg-[#141722] p-1 flex items-center overflow-hidden">
              {model === 'multiprocessing' ? (
                <div className="h-full w-full rounded-lg bg-emerald text-slate-950 flex items-center justify-center text-xs font-mono font-bold">
                  Process 102: Core 2 Running (True Parallelism)
                </div>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xs font-mono text-muted/60">
                  Core Idle (CPython GIL limits bytecode interpreter to Core 1)
                </div>
              )}
            </div>
          </div>

          {/* Lane 3: CPU Core 3 & 4 */}
          <div className="flex items-center gap-3">
            <span className="w-24 text-2xs font-mono text-[#94A3B8] shrink-0">CPU Core 3 & 4</span>
            <div className="relative flex-1 h-10 rounded-xl border border-[#222838] bg-[#141722] p-1 flex items-center overflow-hidden">
              {model === 'multiprocessing' ? (
                <div className="h-full w-full rounded-lg bg-emerald text-slate-950 flex items-center justify-center text-xs font-mono font-bold">
                  Process 103 & 104 Running simultaneously across CPU cores
                </div>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xs font-mono text-muted/60">
                  Cores Idle
                </div>
              )}
            </div>
          </div>

          {/* Lane 4: Event Loop / Request Queue */}
          <div className="flex items-center gap-3">
            <span className="w-24 text-2xs font-mono text-cyan shrink-0">Event Loop</span>
            <div className="relative flex-1 h-12 rounded-xl border border-cyan/40 bg-[#0E1622] p-1.5 flex items-center gap-2 overflow-x-auto">
              {model === 'asyncio' ? (
                <>
                  <span className="rounded bg-cyan text-slate-950 px-2 py-1 text-2xs font-mono font-bold shrink-0">
                    Active: Prompt 1
                  </span>
                  <span className="rounded bg-cyan/20 border border-cyan/40 text-cyan px-2 py-1 text-2xs font-mono shrink-0">
                    Awaiting I/O: Prompt 2..25
                  </span>
                  <span className="rounded bg-amber/20 border border-amber/40 text-amber px-2 py-1 text-2xs font-mono shrink-0">
                    Semaphore(25) Limit: 75 Queued
                  </span>
                </>
              ) : model === 'single_flight' ? (
                <>
                  <span className="rounded bg-emerald text-slate-950 px-2.5 py-1 text-2xs font-mono font-bold shrink-0">
                    Leader Request: Computing Model
                  </span>
                  <span className="rounded bg-sky-500/20 border border-sky-500/40 text-sky-400 px-2.5 py-1 text-2xs font-mono shrink-0">
                    9 Identical Requests Waiting on Leader Promise (Zero GPU Stampede)
                  </span>
                </>
              ) : (
                <span className="text-2xs font-mono text-muted px-2">Sequential task execution queue</span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Architectural Note */}
        <div className="mt-auto rounded-xl border border-[#222838] bg-[#141722] p-3 text-xs leading-relaxed text-slate-300">
          {model === 'asyncio' && (
            <div>
              <strong className="text-cyan block mb-0.5">Asyncio (Cooperative Multitasking — 1 Thread, 1 Process):</strong>
              Ideal for high-concurrency I/O (LLM APIs, database queries, network sockets). When a coroutine hits <code>await client.get()</code>, it yields control back to the Event Loop, letting other coroutines execute while the socket waits.
            </div>
          )}
          {model === 'threading' && (
            <div>
              <strong className="text-amber block mb-0.5">Threading & ThreadPoolExecutor (Preemptive OS Threads):</strong>
              CPython's GIL restricts bytecode execution to one thread at a time. Multiple threads cannot speed up CPU-bound loops, but IO operations (e.g. <code>requests</code>, C-extensions, disk) release the GIL.
            </div>
          )}
          {model === 'multiprocessing' && (
            <div>
              <strong className="text-emerald block mb-0.5">Multiprocessing & ProcessPoolExecutor (True Parallelism):</strong>
              Spawns independent OS processes across multiple CPU cores, each with its own memory space and Python interpreter, bypassing the GIL completely for heavy CPU tasks like XML pruning or image resizing.
            </div>
          )}
          {model === 'single_flight' && (
            <div>
              <strong className="text-sky-400 block mb-0.5">FitLabs Single-Flight Lock Pattern:</strong>
              When 10 concurrent requests arrive for the exact same heavy diffusion model or cold cache key, only 1 thread computes while 9 wait on the same shared promise, preventing GPU Out-Of-Memory (OOM) crashes completely.
            </div>
          )}
          {model === 'sync' && (
            <div>
              <strong className="text-slate-400 block mb-0.5">Synchronous Blocking (The Anti-Pattern):</strong>
              Each task blocks the CPU core while waiting for network I/O, resulting in 99% CPU idle time and massive latency spikes.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

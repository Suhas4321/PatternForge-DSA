import { useState } from 'react'
import { Database, Table, Layers, Sparkles, HardDrive, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import type { VisualizerProps } from './types'

export default function SQLPipelineVisualizer({ step }: VisualizerProps) {
  const [mode, setMode] = useState<'pipeline' | 'storage'>('pipeline')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  // Extract SQL state from step or fallback demo
  const sqlState = step.sql_state || (step.frames?.[0]?.locals?.sql_state as any) || {
    source_tables: {
      employees: {
        columns: ['emp_id', 'name', 'dept_id', 'salary'],
        rows: [
          [101, 'Alex Rivera', 1, 95000],
          [102, 'Priya Sharma', 1, 120000],
          [103, 'David Kim', 2, 85000],
          [104, 'Siddharth Rao', 1, 120000],
          [105, 'Elena Rostova', 2, 110000],
        ],
      },
      departments: {
        columns: ['dept_id', 'dept_name', 'location'],
        rows: [
          [1, 'AI Systems', 'Bengaluru'],
          [2, 'Cloud Core', 'San Francisco'],
        ],
      },
    },
    active_stage: 'window_ranking',
    ranked_rows: [
      { emp_id: 102, name: 'Priya Sharma', salary: 120000, dense_rank: 1, tag: 'rank-1' },
      { emp_id: 104, name: 'Siddharth Rao', salary: 120000, dense_rank: 1, tag: 'rank-1-tie' },
      { emp_id: 101, name: 'Alex Rivera', salary: 95000, dense_rank: 2, tag: 'rank-2 (2nd Highest!)' },
    ],
    result_columns: ['name', 'salary', 'dense_rank'],
    result_rows: [
      ['Alex Rivera', 95000, 2],
    ],
  }

  const sourceTables = sqlState.source_tables || {}
  const tableNames = Object.keys(sourceTables)
  const currentTable = selectedTable && sourceTables[selectedTable] ? selectedTable : tableNames[0] || 'employees'
  const activeTableData = sourceTables[currentTable]

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 font-sans text-slate-200">
      {/* Top Controller Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E3446] pb-3">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-cyan" />
          <span className="font-plate text-sm font-bold tracking-wide text-white">
            SQL & Relational Engine Visualizer
          </span>
          <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-2xs font-mono text-cyan">
            SQLite :memory:
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-[#2E3446] bg-[#0E1118] p-1">
          <button
            onClick={() => setMode('pipeline')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === 'pipeline' ? 'bg-cyan text-slate-950 font-semibold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Layers size={13} /> Query Pipeline
          </button>
          <button
            onClick={() => setMode('storage')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === 'storage' ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HardDrive size={13} /> 8KB Pages vs B-Tree
          </button>
        </div>
      </div>

      {mode === 'pipeline' ? (
        /* Query Pipeline View */
        <div className="grid flex-1 gap-4 overflow-y-auto lg:grid-cols-[1fr_1.1fr]">
          {/* Left Column: Source Tables & FROM/JOIN View */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#2E3446] bg-[#0E1118] p-3.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8]">
                <Table size={14} className="text-cyan" /> 1. FROM & JOIN Source Tables
              </span>
              <div className="flex gap-1">
                {tableNames.map((tbl) => (
                  <button
                    key={tbl}
                    onClick={() => setSelectedTable(tbl)}
                    className={`rounded-lg px-2 py-0.5 text-2xs font-mono transition-colors ${
                      currentTable === tbl ? 'bg-cyan/20 border border-cyan/40 text-cyan' : 'bg-[#181B24] text-[#94A3B8]'
                    }`}
                  >
                    {tbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Display */}
            {activeTableData && (
              <div className="overflow-x-auto rounded-xl border border-[#222838] bg-[#0B0C10]">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#222838] bg-[#141722] text-[#94A3B8]">
                      {activeTableData.columns.map((col: string) => (
                        <th key={col} className="px-3 py-2 font-medium">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTableData.rows.map((row: any[], rIdx: number) => (
                      <tr key={rIdx} className="border-b border-[#181B24] hover:bg-cyan/[0.04] transition-colors">
                        {row.map((val: any, cIdx: number) => (
                          <td key={cIdx} className="px-3 py-1.5 text-slate-300">
                            {val === null ? <span className="text-amber italic">NULL</span> : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SQL Execution Order Stepper */}
            <div className="mt-auto rounded-xl border border-[#222838] bg-[#141722] p-2.5 text-2xs text-[#94A3B8]">
              <span className="font-semibold text-white block mb-1">True Database Engine Execution Order:</span>
              <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono">
                <span className="rounded bg-cyan/20 text-cyan px-1.5 py-0.5 font-bold">1. FROM/JOIN</span>
                <span>➔</span>
                <span className="rounded bg-sky-500/20 text-sky-400 px-1.5 py-0.5">2. WHERE</span>
                <span>➔</span>
                <span className="rounded bg-amber/20 text-amber px-1.5 py-0.5">3. GROUP BY</span>
                <span>➔</span>
                <span className="rounded bg-slate-800 text-slate-200 border border-white/[0.08] px-1.5 py-0.5">4. HAVING</span>
                <span>➔</span>
                <span className="rounded bg-emerald/20 text-emerald px-1.5 py-0.5 font-bold">5. SELECT</span>
                <span>➔</span>
                <span className="rounded bg-slate-800 text-slate-300 px-1.5 py-0.5">6. ORDER BY</span>
              </div>
            </div>
          </div>

          {/* Right Column: Execution Stage & Results */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#2E3446] bg-[#0E1118] p-3.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald">
                <Sparkles size={14} /> 2. Aggregations, DENSE_RANK() & Output
              </span>
              <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-2xs text-emerald font-mono">
                Active Projection
              </span>
            </div>

            {/* DENSE_RANK Window Showcase */}
            {sqlState.ranked_rows && (
              <div className="flex flex-col gap-1.5">
                <span className="text-2xs font-mono text-[#94A3B8]">
                  Window Partition & Dense Rank Evaluation:
                </span>
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[140px]">
                  {sqlState.ranked_rows.map((row: any, idx: number) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-mono border transition-all ${
                        row.dense_rank === 2
                          ? 'border-emerald/60 bg-emerald/[0.12] shadow-sm'
                          : 'border-[#222838] bg-[#141722]'
                      }`}
                    >
                      <span className="text-slate-200">{row.name} (${row.salary?.toLocaleString()})</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-2xs ${
                          row.dense_rank === 2 ? 'bg-emerald text-slate-950' : 'bg-[#222838] text-[#94A3B8]'
                        }`}>
                          DENSE_RANK: {row.dense_rank}
                        </span>
                        {row.tag && <span className="text-2xs text-emerald font-sans font-medium">{row.tag}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final Query Output Table */}
            <div className="mt-2 flex flex-col gap-1.5">
              <span className="text-2xs font-mono text-cyan">
                Final Result Set (SELECT projection):
              </span>
              <div className="overflow-x-auto rounded-xl border border-cyan/30 bg-[#0B0C10]">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#222838] bg-[#141722] text-cyan font-bold">
                      {(sqlState.result_columns || ['Result']).map((col: string) => (
                        <th key={col} className="px-3 py-2">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(sqlState.result_rows || []).map((row: any[], rIdx: number) => (
                      <tr key={rIdx} className="border-b border-[#181B24] bg-cyan/[0.06]">
                        {row.map((val: any, cIdx: number) => (
                          <td key={cIdx} className="px-3 py-2 text-white font-semibold">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Storage & B-Tree Mode: 8KB Heap Pages vs B-Tree Traversal */
        <div className="grid flex-1 gap-4 overflow-y-auto lg:grid-cols-2">
          {/* Left: Sequential Table Scan (Red) */}
          <div className="flex flex-col gap-3 rounded-2xl border border-crimson/30 bg-[#160B0E] p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-crimson">
                <XCircle size={15} /> Unindexed: Full Table Scan (200ms)
              </span>
              <span className="text-2xs font-mono text-crimson bg-crimson/15 px-2 py-0.5 rounded-full">
                O(N) Disk I/O
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Without an index, the database engine must sequentially read every 8KB heap page from disk into memory buffer pool to evaluate the WHERE predicate.
            </p>
            <div className="grid grid-cols-4 gap-2 py-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((page) => (
                <div key={page} className="flex flex-col items-center justify-center rounded-xl border border-crimson/40 bg-crimson/[0.08] p-2.5 text-center">
                  <span className="text-2xs font-mono font-bold text-crimson">Page #{page}</span>
                  <span className="text-[10px] text-muted">8KB Heap</span>
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-crimson animate-pulse" />
                </div>
              ))}
            </div>
            <div className="mt-auto rounded-xl border border-crimson/25 bg-crimson/[0.05] p-2.5 text-2xs text-crimson">
              Scanned 50,000 rows across 625 disk pages ➔ Latency: <strong>214ms</strong>
            </div>
          </div>

          {/* Right: B-Tree Index Scan (Emerald) */}
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald/30 bg-[#0A1612] p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald">
                <CheckCircle2 size={15} /> B-Tree Index Hop (20ms)
              </span>
              <span className="text-2xs font-mono text-emerald bg-emerald/15 px-2 py-0.5 rounded-full">
                O(log N) 3 Page Hops
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              With a B-Tree index on (dept_id, salary), the engine traverses sorted index nodes in 3 hops directly to the matching row pointer (ctid).
            </p>
            <div className="flex flex-col items-center gap-2 py-2">
              {/* Root */}
              <div className="rounded-xl border border-emerald/50 bg-emerald/[0.12] px-4 py-1.5 text-center text-xs font-mono text-emerald font-bold">
                [Root Page: salary &lt; 100k | ≥ 100k]
              </div>
              <ArrowRight size={14} className="rotate-90 text-emerald" />
              {/* Internal */}
              <div className="rounded-xl border border-emerald/50 bg-emerald/[0.12] px-4 py-1.5 text-center text-xs font-mono text-emerald font-bold">
                [Branch Page: 100k..120k]
              </div>
              <ArrowRight size={14} className="rotate-90 text-emerald" />
              {/* Leaf */}
              <div className="rounded-xl border border-emerald/60 bg-emerald text-slate-950 px-4 py-1.5 text-center text-xs font-mono font-bold shadow-md">
                [Leaf Page: ctid (14, 2) ➔ Row 102]
              </div>
            </div>
            <div className="mt-auto rounded-xl border border-emerald/25 bg-emerald/[0.05] p-2.5 text-2xs text-emerald">
              Hops: 3 Pages (Root ➔ Branch ➔ Leaf) ➔ Latency: <strong>18ms</strong> (10x faster!)
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

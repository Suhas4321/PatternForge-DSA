import { useState } from 'react'
import { FileSpreadsheet, GitBranch, Layers, AlertCircle, CheckCircle2, Split, Filter } from 'lucide-react'
import type { VisualizerProps } from './types'

export default function DataFramePipelineVisualizer({ step }: VisualizerProps) {
  const [tab, setTab] = useState<'dataframe' | 'xml_pruning' | 'memory'>('dataframe')

  const dfState = step.df_state || {
    title: 'Pandas DataFrame Transformation',
    raw_shape: [5, 4],
    cleaned_shape: [4, 4],
    columns: ['test_run_id', 'device', 'latency_ms', 'status'],
    rows: [
      { test_run_id: 1001, device: 'Pixel 8', latency_ms: 320, status: 'PASS', is_nan: false, is_filtered: false },
      { test_run_id: 1002, device: 'Galaxy S23', latency_ms: 680, status: 'FAIL', is_nan: false, is_filtered: true },
      { test_run_id: 1003, device: null, latency_ms: null, status: 'TIMEOUT', is_nan: true, is_filtered: false },
      { test_run_id: 1004, device: 'Pixel 8', latency_ms: 180, status: 'PASS', is_nan: false, is_filtered: false },
      { test_run_id: 1005, device: 'iPhone 15', latency_ms: 850, status: 'FAIL', is_nan: false, is_filtered: true },
    ],
    grouped_aggregations: [
      { device: 'Pixel 8', run_count: 2, avg_latency: 250.0, p95_latency: 306.0, success_rate: '100%' },
      { device: 'Galaxy S23', run_count: 1, avg_latency: 680.0, p95_latency: 680.0, success_rate: '0%' },
      { device: 'iPhone 15', run_count: 1, avg_latency: 850.0, p95_latency: 850.0, success_rate: '0%' },
    ],
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 font-sans text-slate-200">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E3446] pb-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-emerald" />
          <span className="font-plate text-sm font-bold tracking-wide text-white">
            DataFrame, XML & Memory Visualizer
          </span>
          <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-2xs font-mono text-emerald">
            Citadel II Engine
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-[#2E3446] bg-[#0E1118] p-1">
          <button
            onClick={() => setTab('dataframe')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === 'dataframe' ? 'bg-emerald text-slate-950 font-semibold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Layers size={13} /> Pandas Pipeline
          </button>
          <button
            onClick={() => setTab('xml_pruning')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === 'xml_pruning' ? 'bg-amber text-slate-950 font-semibold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <GitBranch size={13} /> XML LCA Pruning (67%)
          </button>
          <button
            onClick={() => setTab('memory')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === 'memory' ? 'bg-cyan text-slate-950 font-semibold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Split size={13} /> Stack vs Heap Memory
          </button>
        </div>
      </div>

      {tab === 'dataframe' && (
        <div className="grid flex-1 gap-4 overflow-y-auto lg:grid-cols-[1.1fr_1fr]">
          {/* Left: Input Table with NaN & Filtering Highlights */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#2E3446] bg-[#0E1118] p-3.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8]">
                <Filter size={14} className="text-cyan" /> 1. Input DataFrame (.dropna & .loc filter)
              </span>
              <span className="rounded-full bg-[#181B24] border border-[#2E3446] px-2 py-0.5 text-2xs font-mono text-muted">
                Shape: 5 rows × 4 cols
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#222838] bg-[#0B0C10]">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#222838] bg-[#141722] text-[#94A3B8]">
                    {dfState.columns.map((col: string) => (
                      <th key={col} className="px-3 py-2 font-medium">{col}</th>
                    ))}
                    <th className="px-3 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dfState.rows.map((row: any, idx: number) => (
                    <tr
                      key={idx}
                      className={`border-b border-[#181B24] transition-colors ${
                        row.is_nan
                          ? 'bg-crimson/[0.12] border-l-2 border-l-crimson'
                          : row.is_filtered
                          ? 'bg-amber/[0.08] border-l-2 border-l-amber'
                          : 'hover:bg-slate-800/20'
                      }`}
                    >
                      <td className="px-3 py-2">{row.test_run_id}</td>
                      <td className="px-3 py-2">
                        {row.device === null ? <span className="text-crimson font-bold italic">NaN</span> : row.device}
                      </td>
                      <td className="px-3 py-2">
                        {row.latency_ms === null ? <span className="text-crimson font-bold italic">NaN</span> : `${row.latency_ms}ms`}
                      </td>
                      <td className="px-3 py-2">{row.status}</td>
                      <td className="px-3 py-2 text-right">
                        {row.is_nan ? (
                          <span className="rounded bg-crimson/20 text-crimson text-[10px] px-1.5 py-0.5 font-bold">Dropped NaN</span>
                        ) : row.is_filtered ? (
                          <span className="rounded bg-amber/20 text-amber text-[10px] px-1.5 py-0.5 font-bold">Latency &gt; 500ms</span>
                        ) : (
                          <span className="text-emerald text-[10px]">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-auto flex items-center gap-3 text-2xs text-[#94A3B8] rounded-xl border border-[#222838] bg-[#141722] p-2.5">
              <span className="flex items-center gap-1 text-crimson">
                <AlertCircle size={12} /> Red: Null/Corrupted row dropped by .dropna()
              </span>
              <span className="flex items-center gap-1 text-amber">
                <CheckCircle2 size={12} /> Amber: Filtered via df.loc[df['latency_ms'] &gt; 500]
              </span>
            </div>
          </div>

          {/* Right: GroupBy & Aggregations */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#2E3446] bg-[#0E1118] p-3.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald">
                <Layers size={14} /> 2. Split-Apply-Combine: .groupby('device').agg()
              </span>
              <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-2xs text-emerald font-mono">
                Aggregated Leaderboard
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-emerald/30 bg-[#0B0C10]">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#222838] bg-[#141722] text-emerald font-bold">
                    <th className="px-3 py-2">Device</th>
                    <th className="px-3 py-2">Runs</th>
                    <th className="px-3 py-2">Avg Latency</th>
                    <th className="px-3 py-2">p95 Latency</th>
                    <th className="px-3 py-2">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {dfState.grouped_aggregations.map((row: any, idx: number) => (
                    <tr key={idx} className="border-b border-[#181B24] hover:bg-emerald/[0.04]">
                      <td className="px-3 py-2 font-bold text-white">{row.device}</td>
                      <td className="px-3 py-2">{row.run_count}</td>
                      <td className="px-3 py-2">{row.avg_latency}ms</td>
                      <td className="px-3 py-2">{row.p95_latency}ms</td>
                      <td className="px-3 py-2 font-bold text-emerald">{row.success_rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-auto rounded-xl border border-emerald/20 bg-emerald/[0.05] p-3 text-2xs text-slate-300">
              <span className="font-bold text-emerald block mb-1">Vectorized Pandas Operations:</span>
              <span>Computed simultaneous count, mean, and quantile(0.95) using a single C-extension vectorized pass—100x faster than iterrows() loops.</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'xml_pruning' && (
        <div className="grid flex-1 gap-4 overflow-y-auto lg:grid-cols-2">
          {/* Left: Bloated Mobile XML View */}
          <div className="flex flex-col gap-3 rounded-2xl border border-amber/30 bg-[#161208] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber">
                Raw Appium/UIAutomator XML (18,000 tokens)
              </span>
              <span className="rounded-full bg-amber/20 text-amber text-2xs px-2 py-0.5 font-mono">
                High Bloat
              </span>
            </div>
            <div className="flex flex-col gap-1.5 font-mono text-xs overflow-y-auto max-h-[300px]">
              <div className="p-2 rounded-lg bg-black/40 text-slate-400">&lt;hierarchy rotation="0"&gt;</div>
              <div className="pl-4 p-2 rounded-lg bg-black/40 text-slate-400">&lt;android.widget.FrameLayout&gt;</div>
              <div className="pl-8 p-2 rounded-lg bg-black/40 text-slate-400">&lt;android.widget.LinearLayout&gt;</div>
              <div className="pl-12 p-2 rounded-lg bg-crimson/20 border border-crimson/40 text-crimson">
                &lt;android.view.View bounds="[0,0][1080,240]" /&gt; ➔ Non-interactive Decor (PRUNED)
              </div>
              <div className="pl-12 p-2 rounded-lg bg-emerald/20 border border-emerald/50 text-emerald font-bold">
                &lt;android.widget.Button resource-id="login_btn" bounds="[100,500][980,620]" clickable="true" /&gt;
              </div>
              <div className="pl-12 p-2 rounded-lg bg-crimson/20 border border-crimson/40 text-crimson">
                &lt;android.widget.Space /&gt; ➔ Spacer (PRUNED)
              </div>
            </div>
            <div className="mt-auto text-2xs text-amber border-t border-amber/20 pt-2">
              67% of nodes are passive layout wrappers with zero click/scroll listeners.
            </div>
          </div>

          {/* Right: Pruned LCA Tree */}
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald/30 bg-[#091610] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald">
                Active-Based Sibling Pruned Tree (5,900 tokens)
              </span>
              <span className="rounded-full bg-emerald/20 text-emerald text-2xs px-2 py-0.5 font-mono">
                67% Token Reduction
              </span>
            </div>
            <div className="flex flex-col gap-1.5 font-mono text-xs overflow-y-auto max-h-[300px]">
              <div className="p-2 rounded-lg bg-black/40 text-slate-300">&lt;hierarchy&gt;</div>
              <div className="pl-4 p-2 rounded-lg bg-black/40 text-slate-300">
                &lt;android.widget.LinearLayout bounds="[0,0][1080,1920]"&gt;
              </div>
              <div className="pl-8 p-2 rounded-lg bg-emerald/25 border border-emerald/60 text-emerald font-bold">
                &lt;android.widget.Button resource-id="login_btn" bounds="[100,500][980,620]" /&gt;
              </div>
              <div className="pl-8 p-2 rounded-lg bg-emerald/25 border border-emerald/60 text-emerald font-bold">
                &lt;android.widget.EditText resource-id="password_input" bounds="[100,700][980,820]" /&gt;
              </div>
            </div>
            <div className="mt-auto text-2xs text-emerald border-t border-emerald/20 pt-2">
              Preserved 100% of actionable tap/swipe coordinates while cutting LLM vision token cost by 67%.
            </div>
          </div>
        </div>
      )}

      {tab === 'memory' && (
        <div className="grid flex-1 gap-4 overflow-y-auto lg:grid-cols-2">
          {/* Stack Pointers */}
          <div className="flex flex-col gap-3 rounded-2xl border border-cyan/30 bg-[#08131A] p-4">
            <span className="text-xs font-bold text-cyan">Call Stack (Local Variable Pointers)</span>
            <div className="flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-cyan/40 bg-cyan/[0.08]">
                <span>def append_item(x, target=[]):</span>
                <span className="text-amber text-2xs">Shared Default Pointer!</span>
              </div>
              <div className="p-2.5 rounded-xl border border-[#222838] bg-[#0E1118]">
                stack_var: <strong className="text-white">a</strong> ➔ points to 0x7FFF9A10
              </div>
              <div className="p-2.5 rounded-xl border border-[#222838] bg-[#0E1118]">
                stack_var: <strong className="text-white">b</strong> ➔ points to 0x7FFF9A10 (Identical PyObject!)
              </div>
            </div>
            <div className="mt-auto text-2xs text-cyan border-t border-cyan/20 pt-2">
              Why 'a is b' returns True: both variables point to the same list object allocated once at module import.
            </div>
          </div>

          {/* Heap Objects */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-panel-2 p-4">
            <span className="text-xs font-bold text-slate-200">Heap Memory (PyObject Structures)</span>
            <div className="rounded-xl border border-white/[0.08] bg-surface-0 p-3 font-mono text-xs text-slate-300">
              <div className="text-slate-100 font-bold mb-1">Heap Address: 0x7FFF9A10</div>
              <div>ob_refcnt: <strong>2</strong></div>
              <div>ob_type: &lt;class 'list'&gt;</div>
              <div>ob_item: [1, 2, 3]</div>
            </div>
            <div className="mt-auto text-2xs text-slate-400 border-t border-white/[0.08] pt-2">
              copy.deepcopy() allocates an entirely new PyObject at a distinct heap address, preventing shared mutable state bugs.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

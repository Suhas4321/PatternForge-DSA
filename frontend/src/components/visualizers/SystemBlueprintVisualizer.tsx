import { useState } from 'react'
import { Network, Sparkles, ArrowRight, Dna, Box } from 'lucide-react'
import type { VisualizerProps } from './types'

export default function SystemBlueprintVisualizer({ step: _step }: VisualizerProps) {
  const [pipelineMode, setPipelineMode] = useState<'rag' | 'gepa' | 'factory'>('rag')
  const [activeStep, setActiveStep] = useState(0)

  const RAG_STEPS = [
    { name: 'PDF/Doc Chunking', role: 'Splits messy PDFs into 512-token semantic chunks with 10% overlap + page metadata.', color: '#22D3EE' },
    { name: 'Embedding Model', role: 'Transforms text chunks into 768-dimensional dense vectors (SentenceTransformers / text-embedding-3).', color: '#38BDF8' },
    { name: 'Vector DB (ChromaDB / Pinecone)', role: 'Hierarchical Navigable Small World (HNSW) graph index performs sub-linear ANN vector search.', color: '#60A5FA' },
    { name: 'Hybrid Search (RRF)', role: 'Reciprocal Rank Fusion merges BM25 keyword matches (for exact IDs/acronyms) + dense vectors.', color: '#F59E0B' },
    { name: 'Cross-Encoder Reranker', role: 'Jointly scores (query, chunk) pairs to eliminate irrelevant context and prevent hallucination.', color: '#34D399' },
    { name: 'LLM Generation', role: 'Injects top-K reranked evidence chunks into system prompt for grounded factual response.', color: '#10B981' },
  ]

  const GEPA_STEPS = [
    { name: 'Population Init', role: 'Seeds 10 initial prompt variants from baseline instruction.', color: '#F59E0B' },
    { name: 'Benchmark Fitness', role: 'Evaluates candidates on test suite: Fitness = Accuracy - 0.002 * Excess_Tokens.', color: '#22D3EE' },
    { name: 'Elitism Selection', role: 'Preserves the top 20% highest-performing prompts untouched.', color: '#34D399' },
    { name: 'Instruction Crossover', role: 'Recombines high-performing reasoning instructions and few-shot examples.', color: '#38BDF8' },
    { name: 'Semantic Mutation', role: 'LLM mutates specific guidelines for conciseness (achieving 66% token reduction).', color: '#10B981' },
  ]

  const FACTORY_STEPS = [
    { name: 'LLMProviderFactory', role: 'Central factory class reading runtime configuration string.', color: '#22D3EE' },
    { name: 'OpenAIClient', role: 'Concrete implementation wrapping chat completions & structured tool calling.', color: '#10B981' },
    { name: 'ClaudeClient', role: 'Concrete implementation implementing Anthropic messages API.', color: '#F59E0B' },
    { name: 'GeminiClient', role: 'Concrete implementation calling Google Vertex/Gemini multimodal endpoints.', color: '#38BDF8' },
  ]

  const stepsList = pipelineMode === 'rag' ? RAG_STEPS : pipelineMode === 'gepa' ? GEPA_STEPS : FACTORY_STEPS

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 font-sans text-slate-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E3446] pb-3">
        <div className="flex items-center gap-2">
          <Network size={18} className="text-cyan" />
          <span className="font-plate text-sm font-bold tracking-wide text-white">
            System Architecture & Pipeline Blueprint
          </span>
          <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-2xs font-mono text-cyan">
            Interactive Node Graph
          </span>
        </div>

        {/* Blueprint Selector */}
        <div className="flex items-center gap-1 rounded-xl border border-[#2E3446] bg-[#0E1118] p-1 text-xs">
          <button
            onClick={() => { setPipelineMode('rag'); setActiveStep(0); }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
              pipelineMode === 'rag' ? 'bg-cyan text-slate-950 font-bold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Sparkles size={13} /> Production RAG
          </button>
          <button
            onClick={() => { setPipelineMode('gepa'); setActiveStep(0); }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
              pipelineMode === 'gepa' ? 'bg-amber text-slate-950 font-bold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Dna size={13} /> GEPA Genetic Prompts
          </button>
          <button
            onClick={() => { setPipelineMode('factory'); setActiveStep(0); }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
              pipelineMode === 'factory' ? 'bg-sky-500 text-white font-bold shadow-sm' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Box size={13} /> OOP Factory Pattern
          </button>
        </div>
      </div>

      {/* Main Blueprint Stage Canvas */}
      <div className="flex flex-1 flex-col gap-5 rounded-2xl border border-[#2E3446] bg-[#0A0D14] p-5 shadow-inner overflow-y-auto">
        <div className="flex items-center justify-between text-2xs font-mono text-[#94A3B8]">
          <span>Pipeline Nodes (Click node to inspect dataflow)</span>
          <span>Step {activeStep + 1} of {stepsList.length}</span>
        </div>

        {/* Node Sequence Diagram */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 py-6">
          {stepsList.map((st, idx) => {
            const isActive = activeStep === idx
            return (
              <div key={st.name} className="flex items-center gap-2">
                <button
                  onClick={() => setActiveStep(idx)}
                  className={`flex flex-col items-center justify-center rounded-2xl p-3 w-36 border text-center transition-all ${
                    isActive
                      ? 'scale-105 shadow-lg border-white'
                      : 'border-[#222838] bg-[#101420] opacity-70 hover:opacity-100 hover:border-slate-500'
                  }`}
                  style={{
                    backgroundColor: isActive ? `${st.color}25` : undefined,
                    borderColor: isActive ? st.color : undefined,
                  }}
                >
                  <span
                    className="text-2xs font-bold uppercase tracking-wider mb-1"
                    style={{ color: st.color }}
                  >
                    Node {idx + 1}
                  </span>
                  <span className="font-plate text-xs font-semibold text-white leading-tight">
                    {st.name}
                  </span>
                </button>
                {idx < stepsList.length - 1 && (
                  <ArrowRight size={14} className="text-muted shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        {/* Active Node Detail Card */}
        <div className="mt-auto rounded-2xl border border-[#2E3446] bg-[#101420] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: stepsList[activeStep].color }}
              />
              <h3 className="font-plate text-base font-bold text-white">
                {stepsList[activeStep].name}
              </h3>
            </div>
            <span className="text-2xs font-mono text-cyan">
              Stage {activeStep + 1} Active Inspection
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {stepsList[activeStep].role}
          </p>
          <div className="flex items-center justify-between border-t border-[#222838] pt-2 mt-1">
            <button
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
              className="text-xs text-muted hover:text-white disabled:opacity-30"
            >
              ← Previous Node
            </button>
            <button
              onClick={() => setActiveStep((prev) => Math.min(stepsList.length - 1, prev + 1))}
              disabled={activeStep === stepsList.length - 1}
              className="text-xs text-cyan hover:underline disabled:opacity-30"
            >
              Next Node →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

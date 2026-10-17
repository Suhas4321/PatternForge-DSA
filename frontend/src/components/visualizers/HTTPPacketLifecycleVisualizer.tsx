import { useState } from 'react'
import { Globe, ArrowRight, CheckCircle2, Shield, Key, AlertTriangle, Clock, Server } from 'lucide-react'
import type { VisualizerProps } from './types'

interface Scenario {
  name: string
  code: number
  description: string
  failingGate: string | null
  detail: string
}

const SCENARIOS: Scenario[] = [
  {
    name: '200 OK (Standard Success)',
    code: 200,
    description: 'Valid JWT, valid schema, successfully processed and returned.',
    failingGate: null,
    detail: 'Request passed all middleware gates and controller returned payload in 24ms.',
  },
  {
    name: '202 Accepted (FitLabs Async Job Queued)',
    code: 202,
    description: 'Heavy 45s diffusion job queued in Redis; returns job_id in 15ms.',
    failingGate: null,
    detail: 'Avoids 504 Gateway Timeout by dispatching to background Celery worker and returning job_id.',
  },
  {
    name: '400 Bad Request (Malformed JSON Syntax)',
    code: 400,
    description: 'Client sent unparseable raw JSON syntax (missing bracket or quote).',
    failingGate: 'JSON Parser',
    detail: 'HTTP server cannot deserialize raw request body bytes into JSON object.',
  },
  {
    name: '401 Unauthorized (Invalid / Expired JWT)',
    code: 401,
    description: 'Missing or signature-mismatched Bearer JWT token in Authorization header.',
    failingGate: 'JWT Auth',
    detail: 'Authentication failed: Server cannot identify who the caller is.',
  },
  {
    name: '403 Forbidden (Insufficient Role)',
    code: 403,
    description: 'Valid token (authenticated as user), but lacks admin role to access /delete-db.',
    failingGate: 'Role Guard',
    detail: 'Authorization failed: Server knows who you are, but you lack permission for this resource.',
  },
  {
    name: '404 Not Found (Invalid Path / Resource ID)',
    code: 404,
    description: 'Endpoint URL path or entity ID (/api/v1/jobs/999) does not exist in router or DB.',
    failingGate: 'Router',
    detail: 'Router found no matching route definition for the requested URI path.',
  },
  {
    name: '405 Method Not Allowed (Sent DELETE to POST-only)',
    code: 405,
    description: 'Endpoint exists and supports GET & POST, but client sent a DELETE or PUT request.',
    failingGate: 'Router',
    detail: 'Route matches URI, but the requested HTTP method is disallowed for this path.',
  },
  {
    name: '422 Unprocessable Entity (Pydantic Schema Error)',
    code: 422,
    description: 'Valid JSON syntax ({"age": "twenty"}), but failed semantic type validation.',
    failingGate: 'Pydantic Validator',
    detail: 'FastAPI default response when body fails field type or boundary constraints.',
  },
  {
    name: '429 Too Many Requests (Rate Limit Exceeded)',
    code: 429,
    description: 'Client sent 35 requests in 60 seconds against a 20 req/min Redis rate limit.',
    failingGate: 'Rate Limiter',
    detail: 'Redis token bucket rate limiter rejected request before hitting application code.',
  },
  {
    name: '500 Internal Server Error (Uncaught Python Exception)',
    code: 500,
    description: 'Unhandled KeyError or ZeroDivisionError in FastAPI controller code.',
    failingGate: 'Controller',
    detail: 'Backend infrastructure crashed unexpectedly during request handling.',
  },
  {
    name: '504 Gateway Timeout (Slow Upstream Model)',
    code: 504,
    description: 'Slow 45-second model inference took longer than Nginx reverse proxy 30s timeout.',
    failingGate: 'Reverse Proxy',
    detail: 'FastAPI worker did not return response bytes before proxy timeout expired.',
  },
]

export default function HTTPPacketLifecycleVisualizer({ step: _step }: VisualizerProps) {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0])

  const GATES = [
    { id: 'client', name: '1. Client', icon: Globe },
    { id: 'cors', name: '2. CORS / Reverse Proxy', icon: Server },
    { id: 'Rate Limiter', name: '3. Redis Rate Limiter', icon: Clock },
    { id: 'JWT Auth', name: '4. JWT Auth & Role Guard', icon: Key },
    { id: 'Router', name: '5. FastAPI Router', icon: Globe },
    { id: 'Pydantic Validator', name: '6. Pydantic v2 Schema', icon: Shield },
    { id: 'Controller', name: '7. Controller & DB / Redis', icon: Server },
  ]

  const isFailing = (gateId: string) => {
    if (!selectedScenario.failingGate) return false
    return gateId.toLowerCase().includes(selectedScenario.failingGate.toLowerCase())
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 font-sans text-slate-200">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2E3446] pb-3">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-cyan" />
          <span className="font-plate text-sm font-bold tracking-wide text-white">
            HTTP Packet Lifecycle & Status Code Diagnostic Engine
          </span>
          <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-2xs font-mono text-cyan">
            Citadel V Engine
          </span>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold ${
          selectedScenario.code < 300
            ? 'bg-emerald/20 border border-emerald/50 text-emerald'
            : selectedScenario.code < 500
            ? 'bg-amber/20 border border-amber/50 text-amber'
            : 'bg-crimson/20 border border-crimson/50 text-crimson'
        }`}>
          {selectedScenario.code < 300 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          <span>HTTP {selectedScenario.code}</span>
        </div>
      </div>

      {/* Scenario Picker Selector */}
      <div className="flex flex-col gap-1.5">
        <span className="text-2xs font-mono text-[#94A3B8]">Select Diagnostic Test Case:</span>
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.code + sc.name}
              onClick={() => setSelectedScenario(sc)}
              className={`rounded-lg px-2.5 py-1 text-2xs font-mono transition-all ${
                selectedScenario.name === sc.name
                  ? sc.code < 300
                    ? 'bg-emerald text-slate-950 font-bold shadow-md'
                    : sc.code < 500
                    ? 'bg-amber text-slate-950 font-bold shadow-md'
                    : 'bg-crimson text-white font-bold shadow-md'
                  : 'bg-[#141722] border border-[#222838] text-[#94A3B8] hover:text-white'
              }`}
            >
              {sc.code} {sc.name.split('(')[1]?.replace(')', '') || ''}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline Gates Interactive Visualizer Canvas */}
      <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-[#2E3446] bg-[#0A0D14] p-4 shadow-inner overflow-y-auto">
        <div className="flex items-center justify-between text-2xs font-mono text-[#94A3B8]">
          <span>Request Packet Travel Path</span>
          <span>Fail-Fast Middleware Architecture</span>
        </div>

        {/* Pipeline Stage Blocks */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-4">
          {GATES.map((gate, idx) => {
            const GIcon = gate.icon
            const fails = isFailing(gate.id)
            const passes = !selectedScenario.failingGate || idx < GATES.findIndex(g => isFailing(g.id))

            return (
              <div key={gate.id} className="flex items-center gap-1.5 flex-1 min-w-[110px]">
                <div className={`flex flex-col items-center justify-center rounded-xl p-2.5 w-full border text-center transition-all ${
                  fails
                    ? 'border-crimson bg-crimson/[0.18] shadow-[0_0_20px_rgb(244_63_94/0.4)] animate-bounce'
                    : passes
                    ? 'border-emerald/50 bg-emerald/[0.08]'
                    : 'border-[#222838] bg-[#141722] opacity-40'
                }`}>
                  <GIcon size={16} className={fails ? 'text-crimson' : passes ? 'text-emerald' : 'text-muted'} />
                  <span className={`text-[11px] font-mono mt-1 font-bold ${
                    fails ? 'text-crimson' : passes ? 'text-emerald' : 'text-muted'
                  }`}>
                    {gate.name}
                  </span>
                  {fails && (
                    <span className="mt-1 rounded bg-crimson text-white text-[9px] px-1 py-0.5 font-bold uppercase">
                      Rejected Here!
                    </span>
                  )}
                </div>
                {idx < GATES.length - 1 && (
                  <ArrowRight size={14} className={passes ? 'text-emerald/60' : 'text-muted/30'} />
                )}
              </div>
            )
          })}
        </div>

        {/* Detailed Inspection Card: Zone 2 Aesthetic inside Pitch Stage */}
        <div className="mt-auto rounded-xl border border-[#2E3446] bg-[#101420] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-plate text-sm font-semibold text-white">
              {selectedScenario.name}
            </h3>
            <span className="font-mono text-xs text-cyan">
              Gate: {selectedScenario.failingGate || 'None (Completed Successfully)'}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8]">
            {selectedScenario.description}
          </p>
          <div className="rounded-lg border border-[#222838] bg-[#0E1118] p-2.5 text-2xs font-mono text-slate-300">
            <strong className="text-amber">Diagnostic Deep Dive: </strong>
            {selectedScenario.detail}
          </div>
        </div>
      </div>
    </div>
  )
}

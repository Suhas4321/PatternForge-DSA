import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

interface Props {
  code: string
  language?: string
  title?: string
  className?: string
  maxHeight?: string | number
}

export default function ChatGPTCodeBlock({
  code,
  language = 'python',
  title,
  className = '',
  maxHeight,
}: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore clipboard error */
    }
  }

  return (
    <div
      data-zone="night"
      className={`overflow-hidden rounded-lg border border-white/10 bg-[#0d1117] text-[#e6edf3] font-mono text-xs shadow-md ${className}`}
    >
      {/* ChatGPT-style clean header bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#161b22] px-4 py-2 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {language}
          </span>
          {title && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-xs font-medium text-slate-300 font-sans truncate">
                {title}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs font-sans font-medium text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-slate-100"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald" />
              <span className="text-emerald">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <pre
        className="overflow-x-auto p-4 leading-relaxed text-[#e6edf3] font-mono text-[13px]"
        style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
      >
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}

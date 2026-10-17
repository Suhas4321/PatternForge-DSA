/**
 * ChatComposer component with non-blocking 60-second timer ring
 * Source: 21st.dev / shadcn/ui composer patterns (MIT License)
 * Adapted for PatternForge design tokens
 */

import React, { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { cn } from '../vsrc/utils'

export interface ChatComposerProps {
  placeholder?: string
  onSubmit: (text: string) => void
  disabled?: boolean
  className?: string
  autoFocus?: boolean
  initialSeconds?: number
}

export function ChatComposer({
  placeholder = 'Type your technical answer here (press Ctrl+Enter to submit)...',
  onSubmit,
  disabled = false,
  className,
  autoFocus = true,
  initialSeconds = 60,
}: ChatComposerProps) {
  const [text, setText] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [timerRunning] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 60-second non-blocking timer
  useEffect(() => {
    if (!timerRunning || secondsLeft <= 0) return
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [timerRunning, secondsLeft])

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!text.trim() || disabled) return
    onSubmit(text.trim())
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Timer SVG ring calculation
  const radius = 12
  const stroke = 2.5
  const normRadius = radius - stroke * 2
  const circumference = normRadius * 2 * Math.PI
  const progressRatio = secondsLeft / initialSeconds
  const strokeDashoffset = circumference - progressRatio * circumference

  const isLowTime = secondsLeft <= 10 && secondsLeft > 0
  const isTimeUp = secondsLeft === 0

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative rounded-2xl border border-line bg-surface-2 p-3 shadow-md transition-all focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/20',
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className="w-full resize-none bg-transparent px-2 py-1 text-sm text-chalk placeholder:text-muted/60 focus:outline-none"
      />

      <div className="flex items-center justify-between border-t border-line/40 pt-2.5 px-1">
        {/* 60s non-blocking timer accessory */}
        <div
          className={cn(
            'flex items-center gap-2 rounded-full px-2.5 py-1 text-2xs font-mono transition-colors',
            isTimeUp
              ? 'bg-crimson/15 text-crimson border border-crimson/30'
              : isLowTime
              ? 'bg-amber/15 text-amber border border-amber/30 animate-pulse'
              : 'bg-surface-3 text-muted border border-line/50',
          )}
          title="60-second interview response pacing timer (does not block submission)"
        >
          {/* Circular ring */}
          <svg height={radius * 2} width={radius * 2} className="-rotate-90">
            <circle
              stroke="rgba(255, 255, 255, 0.1)"
              fill="transparent"
              strokeWidth={stroke}
              r={normRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke={isTimeUp ? '#FB7185' : isLowTime ? '#F2B866' : '#6EE7B7'}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s linear' }}
              strokeLinecap="round"
              r={normRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <span>
            {isTimeUp ? 'Time target reached' : `${secondsLeft}s target`}
          </span>
        </div>

        {/* Submit button */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[11px] text-muted">
            <kbd className="font-mono bg-surface-3 px-1.5 py-0.5 rounded border border-line text-2xs">Ctrl</kbd> + <kbd className="font-mono bg-surface-3 px-1.5 py-0.5 rounded border border-line text-2xs">Enter</kbd>
          </span>
          <button
            type="submit"
            disabled={!text.trim() || disabled}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-1.5 text-xs font-semibold text-black transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Answer</span>
            <Send size={13} />
          </button>
        </div>
      </div>
    </form>
  )
}

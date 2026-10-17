/**
 * ChatMessage component
 * Source: 21st.dev / shadcn/ui chat patterns (MIT License)
 * Adapted for PatternForge design tokens (Nebula Plum palette, text tokens)
 */

import type { ReactNode } from 'react'
import { cn } from '../vsrc/utils'

export type MessageRole = 'interviewer' | 'candidate' | 'senior' | 'system'

export interface ChatMessageProps {
  role: MessageRole
  senderName: string
  avatar?: ReactNode
  badge?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
}

export function ChatMessage({
  role,
  senderName,
  avatar,
  badge,
  children,
  className,
  actions,
}: ChatMessageProps) {
  const isCandidate = role === 'candidate'
  const isSenior = role === 'senior'
  const isInterviewer = role === 'interviewer'

  return (
    <div
      className={cn(
        'group flex w-full flex-col gap-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2',
        isCandidate ? 'items-end' : 'items-start',
        className,
      )}
    >
      {/* Header with avatar, sender name, and badge */}
      <div
        className={cn(
          'flex items-center gap-2 px-1 text-2xs',
          isCandidate ? 'flex-row-reverse text-right' : 'flex-row',
        )}
      >
        {avatar && (
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-xs font-bold shadow-sm',
              isInterviewer && 'border-amber/40 bg-amber/10 text-amber',
              isCandidate && 'border-line bg-panel-2 text-chalk',
              isSenior && 'border-sky-500/40 bg-sky-500/10 text-sky-400',
            )}
          >
            {avatar}
          </div>
        )}
        <span className="font-plate font-bold tracking-wide text-chalk">
          {senderName}
        </span>
        {badge && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              isInterviewer && 'bg-amber/15 text-amber border border-amber/30',
              isCandidate && 'bg-line/40 text-muted border border-line',
              isSenior && 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'relative rounded-2xl p-5 text-sm transition-all',
          isCandidate &&
            'max-w-[85%] border border-line bg-surface-2 text-chalk rounded-tr-xs shadow-sm',
          isInterviewer &&
            'w-full border border-amber/25 bg-surface-1 text-chalk rounded-tl-xs shadow-sm',
          isSenior &&
            'w-full border border-sky-500/30 bg-surface-1 text-chalk rounded-tl-xs shadow-md',
        )}
      >
        {children}

        {/* Optional footer / action toolbar inside bubble */}
        {actions && <div className="mt-4 pt-3 border-t border-line/50">{actions}</div>}
      </div>
    </div>
  )
}

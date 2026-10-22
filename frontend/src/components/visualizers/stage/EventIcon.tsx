import {
  Brackets,
  ArrowLeftRight,
  ArrowDownToLine,
  Eye,
  Crosshair,
  CheckCircle2,
  AlertOctagon,
  ArrowUpToLine,
  CornerDownLeft,
  CircleDot,
  Info,
  Layers,
} from 'lucide-react'

export type EventKind =
  | 'compare'
  | 'swap'
  | 'write'
  | 'read'
  | 'push'
  | 'pop'
  | 'enqueue'
  | 'dequeue'
  | 'call'
  | 'return'
  | 'visit'
  | 'found'
  | 'target'
  | 'done'
  | 'exception'
  | 'error'
  | 'init'
  | 'info'

interface EventIconProps {
  kind?: string
  className?: string
  size?: number
}

export function EventIcon({ kind = 'info', className = '', size = 14 }: EventIconProps) {
  const normKind = kind.toLowerCase()

  if (normKind.includes('compare')) {
    return <Brackets size={size} className={`text-cyan ${className}`} />
  }
  if (normKind.includes('swap')) {
    return <ArrowLeftRight size={size} className={`text-rust ${className}`} />
  }
  if (normKind.includes('write')) {
    return <ArrowDownToLine size={size} className={`text-forge ${className}`} />
  }
  if (normKind.includes('read')) {
    return <Eye size={size} className={`text-orchid ${className}`} />
  }
  if (normKind.includes('push') || normKind.includes('enqueue')) {
    return <ArrowDownToLine size={size} className={`text-cyan ${className}`} />
  }
  if (normKind.includes('pop') || normKind.includes('dequeue')) {
    return <ArrowUpToLine size={size} className={`text-amber ${className}`} />
  }
  if (normKind.includes('return') || normKind.includes('done')) {
    return <CheckCircle2 size={size} className={`text-emerald ${className}`} />
  }
  if (normKind.includes('call')) {
    return <CornerDownLeft size={size} className={`text-orchid ${className}`} />
  }
  if (normKind.includes('target') || normKind.includes('found')) {
    return <Crosshair size={size} className={`text-crimson ${className}`} />
  }
  if (normKind.includes('exception') || normKind.includes('error')) {
    return <AlertOctagon size={size} className={`text-crimson ${className}`} />
  }
  if (normKind.includes('visit')) {
    return <CircleDot size={size} className={`text-forge ${className}`} />
  }
  if (normKind.includes('pipeline')) {
    return <Layers size={size} className={`text-cyan ${className}`} />
  }

  return <Info size={size} className={`text-muted ${className}`} />
}

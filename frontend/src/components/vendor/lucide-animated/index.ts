/**
 * Unified icon exporter combining Lucide Animated icons with static fallbacks
 * from lucide-react for icons without an animated variant.
 * License: MIT
 */

export { PlayIcon } from './play'
export { PauseIcon } from './pause'
export { CheckIcon } from './check'
export { RotateCCWIcon as RotateCcwIcon, RotateCCWIcon } from './rotate-ccw'
export { EyeIcon } from './eye'
export { SparklesIcon } from './sparkles'
export { GaugeIcon } from './gauge'
export { ChevronLeftIcon } from './chevron-left'
export { ChevronRightIcon } from './chevron-right'
export { ChevronFirstIcon } from './chevron-first'

// Static fallbacks for icons not present in lucide-animated registry
export {
  ChevronLast as ChevronLastIcon,
  List as ListIcon,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  HelpCircle,
  Clock,
  HardDrive,
  Cpu,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
  Code2,
} from 'lucide-react'

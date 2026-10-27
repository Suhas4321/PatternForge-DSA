import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui'

interface Props {
  children: ReactNode
  fallbackTitle?: string
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PatternForge ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="card flex flex-col items-center justify-center gap-3 rounded-2xl border border-crimson/40 bg-panel p-6 text-center shadow-lg"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-crimson/15 text-crimson">
            <AlertTriangle size={20} />
          </span>
          <div>
            <h3 className="font-plate text-base font-semibold text-chalk">
              {this.props.fallbackTitle ?? 'Something went wrong in this stage'}
            </h3>
            <p className="mt-1 max-w-md font-mono text-2xs text-muted">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
          </div>
          <Button variant="outline" className="mt-1 h-8 px-3 text-xs" onClick={this.handleReset}>
            <RotateCcw size={13} />
            <span>Reset View</span>
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

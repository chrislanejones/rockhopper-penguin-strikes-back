import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Anything that throws inside the Canvas would otherwise leave a black screen
 * and a clean console, because R3F simply stops rendering. This puts the
 * failure on the page where it can be read.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[suite] render failed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="loading" style={{ padding: 24, textAlign: 'left' }}>
          <pre style={{ color: '#ff7a7a', whiteSpace: 'pre-wrap', maxWidth: 900 }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

import { Component, ReactNode, ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary - Catches React errors and displays fallback UI
 * Prevents entire app from crashing due to component errors
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = (): void => {
    // Reset error state and reload the page
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback UI when error occurs
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <svg
                className="h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
              Oops! Something went wrong
            </h1>

            <p className="text-gray-600 text-center mb-6">
              We encountered an unexpected error. Don't worry, your work is saved
              in Firebase. Try refreshing the page to continue.
            </p>

            {/* Error details (only in development) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="text-sm">
                  <p className="font-mono text-red-600 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="overflow-auto text-xs text-gray-700 bg-white p-2 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Reload Application
              </button>
              <a
                href="/"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center"
              >
                Go to Home
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                If this problem persists, please try:
              </p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li className="flex items-center justify-center">
                  <span className="mr-2">•</span>
                  Clearing your browser cache and cookies
                </li>
                <li className="flex items-center justify-center">
                  <span className="mr-2">•</span>
                  Using a different browser
                </li>
                <li className="flex items-center justify-center">
                  <span className="mr-2">•</span>
                  Checking your internet connection
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    // No error, render children normally
    return this.props.children
  }
}

export default ErrorBoundary


'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Sanitize an error message for display — strips anything that looks like
 * a file path, stack trace fragment, or internal identifier.
 */
function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/\/home\/\S+/g, '[path]')
    .replace(/\/app\/\S+/g, '[path]')
    .replace(/\/node_modules\/\S+/g, '[path]')
    .replace(/at\s+\S+/g, '')
    .replace(/\n/g, ' ')
    .trim()
    || 'An unexpected error occurred.'
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoToDashboard = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const displayMessage = this.state.error
        ? sanitizeErrorMessage(this.state.error.message)
        : ''

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
              <p className="text-muted-foreground text-sm">
                An unexpected error occurred. This has been logged for review.
                You can try reloading the page or return to the dashboard.
              </p>
            </div>

            {displayMessage && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
                <p className="text-xs font-mono text-destructive/80 break-all leading-relaxed">
                  {displayMessage}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={this.handleGoToDashboard}
              >
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Button>
              <Button
                className="gap-2"
                onClick={this.handleReload}
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

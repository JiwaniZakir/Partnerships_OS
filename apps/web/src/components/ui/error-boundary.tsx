'use client';

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-sm rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <h3 className="mb-1.5 text-sm font-semibold text-[#F1EFE7]">
              Something went wrong
            </h3>
            <p className="mb-4 text-xs text-[#6B6560]">
              This section encountered an error. Try refreshing.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#F1EFE7] px-4 py-2 text-xs font-medium text-[#0A0A0A] hover:bg-[#E5E1D8] transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for React 19 compatibility
export function ErrorBoundary({ children, fallback }: Props) {
  return (
    <ErrorBoundaryClass fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}

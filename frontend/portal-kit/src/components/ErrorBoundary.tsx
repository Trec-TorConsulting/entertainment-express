import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-2xl border border-[var(--ee-border)] bg-[var(--ee-surface-raised)] shadow-ee-xl text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-[var(--ee-danger-soft)] text-[var(--ee-danger)] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[var(--ee-text)]">
                Something went wrong
              </h2>
              <p className="text-sm text-[var(--ee-muted)] leading-relaxed">
                An unexpected error occurred while rendering this view. Your data is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)] text-left overflow-x-auto max-h-32 text-xs font-mono text-[var(--ee-danger)]">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[var(--ee-brand)] text-white hover:brightness-110 shadow-ee-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-[var(--ee-border)] text-[var(--ee-text)] hover:bg-[var(--ee-surface-inset)] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorPage } from '../../pages/ErrorPage.tsx';
import { ActiveTab } from '../TopNavbar.tsx';
import { api } from '../../services/api.ts';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onNavigate?: (tab: ActiveTab) => void;
  isFullPage?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[KasirWarung ErrorBoundary caught exception]:', error, errorInfo);
    this.setState({ errorInfo });

    // Asynchronously log to Winston backend if available
    try {
      api.simulateLog({
        level: 'error',
        message: `[React UI Crash] ${error.message || 'Unknown component crash'}`,
        meta: {
          componentStack: errorInfo.componentStack,
          url: typeof window !== 'undefined' ? window.location.href : '',
          timestamp: new Date().toISOString(),
        },
      }).catch(() => {
        // Ignored to prevent cascading failures
      });
    } catch {
      // Ignored
    }
  }

  public handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorPage
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onNavigate={this.props.onNavigate}
          isFullPage={this.props.isFullPage}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import { Component } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, Home, LayoutDashboard } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('React Error Boundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error,
            resetErrorBoundary: this.handleReset,
          });
        }
        return this.props.fallback;
      }

      const { compact, title, message } = this.props;
      const { error, errorInfo, showDetails } = this.state;

      const titleText = title || 'Failed to load content';
      const messageText = message || 'An unexpected error occurred while rendering this section.';

      if (compact) {
        return (
          <div className="flex-1 w-full h-full min-w-0 flex items-center justify-center p-6 sm:p-10 bg-surface dark:bg-background">
            <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-md flex flex-col gap-5 text-left">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-error-container/40 text-error flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-headline-md font-bold text-on-surface">
                    {titleText}
                  </h3>
                  <p className="text-sm font-body-md text-secondary mt-1 leading-relaxed">
                    {messageText}
                  </p>
                </div>
              </div>

              {error?.message && (
                <div className="bg-error-container/30 border border-error-variant/40 rounded-lg p-3.5 font-mono text-xs text-on-error-container break-all whitespace-pre-wrap min-w-0">
                  <span className="font-bold">Error: </span>{error.message}
                </div>
              )}

              <div className="space-y-2 pt-1 border-t border-outline-variant">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center gap-1.5 text-xs text-secondary hover:text-on-surface transition-colors cursor-pointer font-semibold"
                >
                  {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{showDetails ? 'Hide technical details' : 'Show technical details'}</span>
                </button>

                {showDetails && (
                  <div className="bg-surface-container-low border border-outline-variant rounded-lg p-3.5 max-h-48 overflow-y-auto font-mono text-[11px] text-secondary space-y-1">
                    <p className="font-bold text-error">{error?.toString()}</p>
                    <pre className="whitespace-pre-wrap leading-relaxed opacity-80">
                      {errorInfo?.componentStack || error?.stack || 'No stack trace available.'}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => (window.location.href = '/workspaces')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary hover:text-on-surface text-xs font-semibold transition-colors border border-outline-variant cursor-pointer"
                >
                  <LayoutDashboard size={14} />
                  <span>Workspaces</span>
                </button>

                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-surface dark:bg-background text-on-surface flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-md space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-error-container/40 border border-error-variant/40 flex items-center justify-center text-error shrink-0">
                <AlertCircle size={26} />
              </div>
              <div>
                <h1 className="text-xl font-headline-md font-bold text-on-surface">
                  {title || 'Something went wrong'}
                </h1>
                <p className="text-sm font-body-md text-secondary">
                  {message || 'An unhandled error occurred in the application.'}
                </p>
              </div>
            </div>

            {error?.message && (
              <div className="bg-error-container/30 border border-error-variant/40 rounded-xl p-4 text-xs font-mono text-on-error-container break-words">
                {error.message}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={this.toggleDetails}
                className="flex items-center gap-1.5 text-xs text-secondary hover:text-on-surface transition-colors cursor-pointer font-semibold"
              >
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>{showDetails ? 'Hide technical details' : 'Show technical details'}</span>
              </button>

              {showDetails && (
                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 max-h-60 overflow-y-auto space-y-2 font-mono text-[11px] text-secondary">
                  <p className="font-bold text-error">{error?.toString()}</p>
                  <pre className="whitespace-pre-wrap leading-relaxed opacity-80">
                    {errorInfo?.componentStack || error?.stack || 'No stack trace available.'}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-sm font-semibold transition-colors border border-outline-variant cursor-pointer"
              >
                <Home size={16} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <RefreshCw size={16} />
                <span>Reload View</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

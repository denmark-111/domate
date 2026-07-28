import { Component } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, Home } from 'lucide-react';

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

      if (compact) {
        return (
          <div className="p-6 bg-bg-secondary/60 border border-border rounded-xl flex flex-col items-center justify-center text-center space-y-3 m-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-semibold text-text">
                {title || 'Failed to load this section'}
              </h3>
              <p className="text-xs text-text-secondary">
                {message || (error?.message ? error.message : 'An unexpected error occurred while rendering.')}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-tertiary/80 text-text text-xs font-medium transition-colors cursor-pointer border border-border"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-bg-primary text-text flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-bg-secondary border border-border rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertCircle size={26} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text">
                  {title || 'Something went wrong'}
                </h1>
                <p className="text-sm text-text-secondary">
                  {message || 'An unhandled error occurred in the application.'}
                </p>
              </div>
            </div>

            {error?.message && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs font-mono text-red-300 break-words">
                {error.message}
              </div>
            )}

            {import.meta.env.DEV && (
              <div className="space-y-2">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text transition-colors cursor-pointer font-medium"
                >
                  {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{showDetails ? 'Hide technical details' : 'Show technical details'}</span>
                </button>

                {showDetails && (
                  <div className="bg-bg-tertiary border border-border rounded-xl p-4 max-h-60 overflow-y-auto space-y-2 font-mono text-[11px] text-text-secondary">
                    <p className="font-bold text-red-400">{error?.toString()}</p>
                    <pre className="whitespace-pre-wrap leading-relaxed opacity-80">
                      {errorInfo?.componentStack || error?.stack || 'No stack trace available.'}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-tertiary hover:bg-bg-tertiary/80 text-text text-sm font-medium transition-colors border border-border cursor-pointer"
              >
                <Home size={16} />
                <span>Go to Dashboard</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-accent/20 cursor-pointer"
              >
                <RefreshCw size={16} />
                <span>Reload Component</span>
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

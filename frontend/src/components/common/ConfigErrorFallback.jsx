import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

export const ConfigErrorFallback = ({ errors = [], onRetry }) => {
  return (
    <div className="min-h-screen bg-bg-primary text-text flex items-center justify-center p-6 font-sans">
      <div className="max-w-lg w-full bg-bg-secondary border border-border rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">Environment Configuration Error</h1>
            <p className="text-sm text-text-secondary">The frontend application is missing required configuration.</p>
          </div>
        </div>

        <div className="bg-bg-tertiary/60 border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
            <Terminal size={14} />
            <span>Detected Issues</span>
          </div>
          <ul className="space-y-2 text-sm">
            {errors.map((err, i) => (
              <li key={i} className="flex items-start gap-2 text-red-400">
                <span className="mt-1">•</span>
                <span>{err}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
          <p className="font-semibold text-text">How to resolve:</p>
          <ol className="list-decimal list-inside space-y-1 bg-bg-tertiary/30 p-3 rounded-lg border border-border/50">
            <li>Check your <code className="text-accent bg-bg-tertiary px-1.5 py-0.5 rounded text-[11px]">frontend/.env</code> file.</li>
            <li>Ensure <code className="text-accent bg-bg-tertiary px-1.5 py-0.5 rounded text-[11px]">VITE_API_URL</code> points to your backend (e.g. <code className="text-text px-1">http://localhost:8000/api</code>).</li>
            <li>Ensure <code className="text-accent bg-bg-tertiary px-1.5 py-0.5 rounded text-[11px]">VITE_SUPABASE_URL</code> and <code className="text-accent bg-bg-tertiary px-1.5 py-0.5 rounded text-[11px]">VITE_SUPABASE_ANON_KEY</code> are provided.</li>
            <li>Restart the frontend development server (<code className="text-text px-1">npm run dev</code>).</li>
          </ol>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => onRetry ? onRetry() : window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-accent/20 cursor-pointer text-sm"
          >
            <RefreshCw size={16} />
            <span>Recheck Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigErrorFallback;

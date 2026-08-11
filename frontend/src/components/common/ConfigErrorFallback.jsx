import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

export const ConfigErrorFallback = ({ errors = [], onRetry }) => {
  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6 font-sans">
      <div className="max-w-lg w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-error shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-on-surface">Environment Configuration Error</h1>
            <p className="text-sm text-secondary">The frontend application is missing required configuration.</p>
          </div>
        </div>

        <div className="bg-surface-container-low/60 border border-outline-variant rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wider">
            <Terminal size={14} />
            <span>Detected Issues</span>
          </div>
          <ul className="space-y-2 text-sm">
            {errors.map((err, i) => (
              <li key={i} className="flex items-start gap-2 text-error">
                <span className="mt-1">•</span>
                <span>{err}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 text-xs text-secondary leading-relaxed">
          <p className="font-semibold text-on-surface">How to resolve:</p>
          <ol className="list-decimal list-inside space-y-1 bg-surface-container-low/30 p-3 rounded-lg border border-outline-variant/50">
            <li>Check your <code className="text-primary bg-surface-container-high px-1.5 py-0.5 rounded text-[11px]">frontend/.env</code> file.</li>
            <li>Ensure <code className="text-primary bg-surface-container-high px-1.5 py-0.5 rounded text-[11px]">VITE_API_URL</code> points to your backend (e.g. <code className="text-on-surface px-1">http://localhost:8000/api</code>).</li>
            <li>Ensure <code className="text-primary bg-surface-container-high px-1.5 py-0.5 rounded text-[11px]">VITE_SUPABASE_URL</code> and <code className="text-primary bg-surface-container-high px-1.5 py-0.5 rounded text-[11px]">VITE_SUPABASE_ANON_KEY</code> are provided.</li>
            <li>Restart the frontend development server (<code className="text-on-surface px-1">npm run dev</code>).</li>
          </ol>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => onRetry ? onRetry() : window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-DEFAULT bg-primary text-on-primary font-label-caps text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
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

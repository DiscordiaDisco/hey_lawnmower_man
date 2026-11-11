import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class SanctuaryErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sanctuary Uncaught Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b090e] text-[#f3e7d3] flex flex-col items-center justify-center p-6 text-center font-serif space-y-4">
          <div className="text-4xl animate-pulse">🥀</div>
          <h1 className="text-xl font-bold text-[#e6c88c] tracking-wider">
            Sanctuary Veil Re-Alignment
          </h1>
          <p className="text-xs text-[#a89070] max-w-sm font-sans leading-relaxed">
            {this.state.error?.message || 'A transient rendering anomaly occurred while loading Sanctuary.'}
          </p>
          <div className="flex gap-3 pt-2 font-mono">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#c59b47] hover:brightness-110 text-[#120b0a] font-bold text-xs cursor-pointer shadow active:scale-95 transition-all"
            >
              Reload Sanctuary
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.clear();
                  localStorage.removeItem('argon_modal_session_state');
                  localStorage.removeItem('argon_last_modal_v1');
                  localStorage.removeItem('sanctuary_chat_draft');
                } catch {
                  // ignore
                }
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl bg-[#24171d] hover:bg-[#38232e] text-[#cbb693] text-xs font-bold border border-[#6b5331] cursor-pointer"
            >
              Clear Cache &amp; Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    createRoot(rootEl).render(
      <SanctuaryErrorBoundary>
        <App />
      </SanctuaryErrorBoundary>
    );
  }
} catch (bootErr) {
  console.error('Fatal Sanctuary mount error:', bootErr);
}


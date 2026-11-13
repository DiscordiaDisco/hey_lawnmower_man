import React, { useState } from 'react';
import { CheckCircle2, Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (variant === 'compact') {
    if (isInstalled) {
      return null;
    }

    if (isInstallable) {
      return (
        <button
          type="button"
          onClick={() => void install()}
          data-testid="pwa-install-btn-compact"
          title="Install Argon Sanctuary as a standalone app"
          className="px-2 py-0.5 min-h-[26px] rounded-full bg-[rgba(230,168,181,0.14)] hover:bg-[rgba(230,168,181,0.24)] border border-[#D4AF37]/80 text-[#f5ead8] text-[9px] font-mono font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all"
        >
          <Download className="w-3 h-3 text-[#D4AF37]" />
          <span>Install</span>
        </button>
      );
    }

    if (isIOS) {
      return (
        <>
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            data-testid="pwa-install-ios-btn-compact"
            className="px-2 py-0.5 min-h-[26px] rounded-full bg-[rgba(230,168,181,0.12)] border border-[#E6A8B5]/60 text-[#f5ead8] text-[9px] font-mono font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Smartphone className="w-3 h-3 text-[#E6A8B5]" />
            <span>Install</span>
          </button>
          {showGuide && (
            <PWAInstallGuideModal isIOS={true} onClose={() => setShowGuide(false)} />
          )}
        </>
      );
    }

    return null;
  }

  // Full Settings Card Variant
  return (
    <div
      data-testid="pwa-install-card"
      className="rounded-xl p-3 border border-[#D4AF37]/50 bg-[rgba(230,168,181,0.08)] space-y-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-[#f5ead8] flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>Standalone Android App (PWA)</span>
          </h4>
          <p className="text-[11px] font-mono text-[#e6a8b5]/85 mt-0.5 break-words">
            Install Argon Sanctuary onto your Android home screen as a full-screen standalone app with offline shell caching.
          </p>
        </div>
        {isInstalled && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-[10px] font-mono font-bold shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Installed
          </span>
        )}
      </div>

      {isInstalled ? (
        <div className="text-[11px] font-mono text-emerald-300/90 px-2.5 py-2 rounded-lg bg-[#161215]/80 border border-emerald-500/30">
          Running in standalone app mode without Chrome address bar or AI Studio wrapper.
        </div>
      ) : isInstallable ? (
        <button
          type="button"
          onClick={() => void install()}
          data-testid="pwa-install-btn-card"
          className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37]/30 via-[#E6A8B5]/25 to-[#D4AF37]/30 hover:from-[#D4AF37]/40 hover:to-[#E6A8B5]/40 active:scale-[0.98] border border-[#D4AF37] text-xs font-bold text-[#f5ead8] cursor-pointer flex items-center justify-center gap-2 transition-all"
        >
          <Download className="w-4 h-4 text-[#D4AF37]" />
          <span>Install Argon Sanctuary to Home Screen</span>
        </button>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            data-testid="pwa-install-guide-btn"
            className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#161215]/85 hover:bg-[#221920] active:scale-[0.98] border border-[#E6A8B5]/60 text-xs font-semibold text-[#f5ead8] cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            <Smartphone className="w-4 h-4 text-[#E6A8B5]" />
            <span>
              {isIOS
                ? 'How to Install on iPhone / iPad'
                : isAndroid
                ? 'How to Install on Android Chrome'
                : 'View Standalone Install Steps'}
            </span>
          </button>
          <p className="text-[10px] font-mono text-[#cbb693]/80 break-words">
            Tip: Open your standalone GitHub Pages URL directly in Android Chrome (outside an embedded preview frame) for the native 1-tap Chrome Install prompt.
          </p>
        </div>
      )}

      {showGuide && (
        <PWAInstallGuideModal isIOS={isIOS} onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
};

const PWAInstallGuideModal: React.FC<{ isIOS: boolean; onClose: () => void }> = ({
  isIOS,
  onClose,
}) => (
  <div
    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Install Argon Sanctuary PWA"
  >
    <div className="w-full max-w-sm rounded-2xl border border-[#D4AF37]/70 bg-[#161215] p-4 space-y-3 text-left shadow-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-[#E6A8B5]/20 pb-2">
        <h3 className="text-sm font-bold text-[#f5ead8] flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#D4AF37]" />
          <span>Install Argon Sanctuary</span>
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center text-[#E6A8B5] hover:text-[#f5ead8] cursor-pointer"
          aria-label="Close install guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isIOS ? (
        <ol className="text-xs font-mono text-[#e6a8b5]/90 space-y-2 list-decimal pl-4">
          <li className="flex items-start gap-1.5">
            <span>
              Tap the <Share className="w-3.5 h-3.5 inline text-[#D4AF37] mx-0.5" /> <strong>Share</strong> button in Safari.
            </span>
          </li>
          <li>
            Scroll down and tap <strong>Add to Home Screen</strong>.
          </li>
          <li>
            Launch <strong>Sanctuary</strong> from your home screen in standalone mode.
          </li>
        </ol>
      ) : (
        <ol className="text-xs font-mono text-[#e6a8b5]/90 space-y-2 list-decimal pl-4">
          <li>
            Open your GitHub Pages app URL directly in <strong>Android Chrome</strong>.
          </li>
          <li>
            Tap Chrome&apos;s top-right menu button (<strong>⋮</strong>) and choose{' '}
            <strong>Add to Home screen</strong> or <strong>Install app</strong>.
          </li>
          <li>
            Confirm <strong>Install</strong> to launch Argon Sanctuary full-screen without browser bars.
          </li>
        </ol>
      )}

      <button
        type="button"
        onClick={onClose}
        className="w-full min-h-[44px] rounded-xl bg-[rgba(230,168,181,0.14)] hover:bg-[rgba(230,168,181,0.22)] border border-[#D4AF37]/60 text-xs font-bold text-[#f5ead8] cursor-pointer"
      >
        Got It
      </button>
    </div>
  </div>
);

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      data-testid="pwa-offline-indicator"
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-3 z-50 flex items-center gap-2 rounded-full bg-[#161215]/95 border border-[#D4AF37]/80 px-3 py-1.5 text-[11px] font-mono font-semibold text-[#E6A8B5] shadow-lg pointer-events-none"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
      <span>Offline Mode — Local Sanctuary cache active</span>
    </div>
  );
};

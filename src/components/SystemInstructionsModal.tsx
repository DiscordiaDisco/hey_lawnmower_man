import React, { useState } from 'react';
import { Flame, RotateCcw } from 'lucide-react';
import {
  ArgonJournalState,
  DEFAULT_ARGON_SYS_PROMPT,
  DEFAULT_RP_INJECTION_SNIPPET,
  JournalEntry,
  LorebookMap,
  buildJournalsSystemContext,
  buildLorebookSystemFooter,
  loadRpInjectionSnippet,
  loadRpModeEnabled,
} from '../utils/workbenchLogic';

interface SystemInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onChangeSystemPrompt: (nextPrompt: string) => void;
  lorebook: LorebookMap;
  argonBook?: ArgonJournalState;
  hexBook?: JournalEntry[];
  rpModeEnabled?: boolean;
  onToggleRpMode?: (enabled: boolean) => void;
  rpInjectionSnippet?: string;
  onChangeRpInjectionSnippet?: (snippet: string) => void;
}

export const SystemInstructionsModal: React.FC<SystemInstructionsModalProps> = ({
  isOpen,
  onClose,
  systemPrompt,
  onChangeSystemPrompt,
  lorebook,
  argonBook,
  hexBook,
  rpModeEnabled,
  onToggleRpMode,
  rpInjectionSnippet,
  onChangeRpInjectionSnippet,
}) => {
  const [savedNotice, setSavedNotice] = useState(false);
  const [rpSavedNotice, setRpSavedNotice] = useState(false);

  if (!isOpen) return null;

  const isRpActive = rpModeEnabled ?? loadRpModeEnabled();
  const effectiveRpSnippet =
    rpInjectionSnippet !== undefined ? rpInjectionSnippet : loadRpInjectionSnippet();

  const lorebookFooter = buildLorebookSystemFooter(lorebook);
  const journalsContext =
    argonBook && hexBook ? buildJournalsSystemContext(argonBook, hexBook) : '';

  const handleResetDefaultPrompt = () => {
    onChangeSystemPrompt(DEFAULT_ARGON_SYS_PROMPT);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleResetDefaultRpSnippet = () => {
    onChangeRpInjectionSnippet?.(DEFAULT_RP_INJECTION_SNIPPET);
    setRpSavedNotice(true);
    window.setTimeout(() => setRpSavedNotice(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#161215] flex flex-col overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="System Instructions Window"
    >
      <header className="shrink-0 sticky top-0 z-20 bg-[#1a130f] border-b border-[#8e6d3b]/70 px-2.5 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] h-11 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            [ ← Back ]
          </button>

          <h2 className="text-xs sm:text-sm font-serif tracking-wider text-[#e6c88c] truncate">
            System Instructions
          </h2>

          <button
            type="button"
            onClick={handleResetDefaultPrompt}
            className="min-h-[44px] h-11 px-3 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            Reset Default
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 max-w-4xl w-full mx-auto space-y-5">
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="argon-sys-prompt-window-textarea"
              className="text-sm font-bold text-[#f3e7d3]"
            >
              Editable System Instructions (argon_sys_prompt)
            </label>
            {savedNotice && (
              <span className="text-xs font-mono text-emerald-400">
                Restored default Argon brain
              </span>
            )}
          </div>

          <textarea
            id="argon-sys-prompt-window-textarea"
            aria-label="Editable System Instructions"
            value={systemPrompt}
            onChange={(e) => onChangeSystemPrompt(e.target.value)}
            rows={12}
            className="w-full p-3 rounded-xl gilded-input-well font-mono text-xs sm:text-sm leading-relaxed"
          />
        </section>

        {/* Ephemeral RP / Intimate Mode Injection Editor */}
        <section
          data-testid="sys-instructions-rp-section"
          className="p-3.5 rounded-2xl bg-[rgba(230,168,181,0.08)] border border-[#D4AF37]/60 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <h3 className="text-sm font-bold text-[#f6e6eb]">
                  Ephemeral RP / Intimate Mode Injection
                </h3>
              </div>
              <p className="text-[11px] font-mono text-[#E6A8B5]/85 mt-1 leading-relaxed">
                Injected into ephemeral <code className="text-[#D4AF37]">systemInstruction</code> only when <strong>RP On</strong> is active. Stripped cleanly on the next turn when toggled <strong>RP Off</strong> with zero chat history residue.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                data-testid="sys-instructions-rp-toggle"
                aria-pressed={isRpActive}
                onClick={() => onToggleRpMode?.(!isRpActive)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-mono font-bold cursor-pointer inline-flex items-center gap-1.5 transition-all ${
                  isRpActive
                    ? 'bg-[rgba(230,168,181,0.2)] border-[#D4AF37] text-[#ffe5a3]'
                    : 'bg-[#161215]/90 border-[#E6A8B5]/40 text-[#E6A8B5]/80'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${isRpActive ? 'text-[#D4AF37]' : 'opacity-60'}`} />
                <span>{isRpActive ? 'RP On' : 'RP Off'}</span>
              </button>
              <button
                type="button"
                data-testid="sys-instructions-rp-reset"
                onClick={handleResetDefaultRpSnippet}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-[#161215]/80 hover:bg-[#231b20] border border-[#E6A8B5]/40 text-[#E6A8B5] text-xs font-mono cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {rpSavedNotice && (
            <div className="text-xs font-mono text-emerald-300">
              Restored default RP clearance snippet
            </div>
          )}

          <label htmlFor="rp-injection-snippet-sys-modal" className="sr-only">
            Custom RP Injection Snippet
          </label>
          <textarea
            id="rp-injection-snippet-sys-modal"
            data-testid="rp-injection-snippet-sys-modal"
            aria-label="Custom RP Injection Snippet"
            value={effectiveRpSnippet}
            onChange={(e) => onChangeRpInjectionSnippet?.(e.target.value)}
            rows={5}
            className="w-full p-3 rounded-xl bg-[#161215] border border-[#E6A8B5]/40 focus:border-[#D4AF37] font-mono text-xs text-[#f6e6eb] leading-relaxed outline-none"
          />
        </section>

        {journalsContext && (
          <div className="p-3 rounded-xl bubble-smoked-glass">
            <div className="text-xs font-semibold text-[#d4b47c] mb-1">
              Auto-Injected Sanctuary Books Live Memory (Memory Section + Latest 5 Argon Entries + All Hex Entries):
            </div>
            <pre className="text-xs font-mono text-[#e6d4b5] whitespace-pre-wrap break-words leading-relaxed max-h-48 overflow-y-auto">
              {journalsContext}
            </pre>
          </div>
        )}

        <div className="p-3 rounded-xl bubble-smoked-glass">
          <div className="text-xs font-semibold text-[#d4b47c] mb-1">
            Auto-Appended 2-Line Lorebook Index Footer:
          </div>
          <pre className="text-xs font-mono text-[#e6d4b5] whitespace-pre-wrap break-words leading-relaxed">
            {lorebookFooter}
          </pre>
        </div>
      </main>
    </div>
  );
};


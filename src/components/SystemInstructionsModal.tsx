import React, { useState } from 'react';
import {
  ArgonJournalState,
  DEFAULT_ARGON_SYS_PROMPT,
  JournalEntry,
  LorebookMap,
  buildJournalsSystemContext,
  buildLorebookSystemFooter,
} from '../utils/workbenchLogic';

interface SystemInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onChangeSystemPrompt: (nextPrompt: string) => void;
  lorebook: LorebookMap;
  argonBook?: ArgonJournalState;
  hexBook?: JournalEntry[];
}

export const SystemInstructionsModal: React.FC<SystemInstructionsModalProps> = ({
  isOpen,
  onClose,
  systemPrompt,
  onChangeSystemPrompt,
  lorebook,
  argonBook,
  hexBook,
}) => {
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const lorebookFooter = buildLorebookSystemFooter(lorebook);
  const journalsContext =
    argonBook && hexBook ? buildJournalsSystemContext(argonBook, hexBook) : '';

  const handleResetDefaultPrompt = () => {
    onChangeSystemPrompt(DEFAULT_ARGON_SYS_PROMPT);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#110c0a] flex flex-col overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="System Instructions Window"
    >
      <header className="shrink-0 sticky top-0 z-20 bg-[#1a130f] border-b border-[#8e6d3b]/70 px-2.5 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            [ ← Back ]
          </button>

          <h2 className="text-xs sm:text-sm font-serif tracking-wider text-[#e6c88c] truncate">
            📜 System Instructions
          </h2>

          <button
            type="button"
            onClick={handleResetDefaultPrompt}
            className="h-9 px-3 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            Reset Default
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 max-w-4xl w-full mx-auto space-y-4">
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
                ✓ Restored default Argon brain
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

          {journalsContext && (
            <div className="p-3 rounded-xl bubble-smoked-glass">
              <div className="text-xs font-semibold text-[#d4b47c] mb-1">
                Auto-Injected Sanctuary Books Live Memory ([ 🧠 Memory Section ] + Latest 5 Argon Entries + All Hex Entries):
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
        </section>
      </main>
    </div>
  );
};

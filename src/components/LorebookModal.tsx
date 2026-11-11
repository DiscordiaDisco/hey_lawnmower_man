import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LorebookMap,
  searchLorebookDrawers,
  LorebookSearchMatchSnippet,
  extractGistIdFromInput,
  LinkedSyncFileMeta,
} from '../utils/workbenchLogic';

interface LorebookModalProps {
  mode: 'closed' | 'list' | 'editor';
  activeDrawerFilename: string | null;
  onBackToChat: () => void;
  onOpenDrawerEditor: (filename: string | null) => void;
  onBackToList: () => void;
  lorebook: LorebookMap;
  onSaveDrawer: (oldFilename: string | null, newFilename: string, content: string) => void;
  onDeleteDrawer: (filename: string) => void;

  // Local Phone Sync (ArgonSanctuary Folder & Persistent File Handle)
  onSaveToPhoneFolder?: () => Promise<void>;
  onLoadFromPhoneFolder?: (file?: File) => Promise<void>;
  onLinkSyncFile?: (mode?: 'open' | 'save') => Promise<void>;
  linkedSyncFileMeta?: LinkedSyncFileMeta | null;
  localSyncStatus?: string;
  isSyncingPhone?: boolean;
  localSyncIsError?: boolean;

  // Legacy optional props
  githubToken?: string;
  onChangeGithubToken?: (token: string) => void;
  gistId?: string;
  onChangeGistId?: (idOrUrl: string) => void;
  onSyncGist?: () => Promise<void>;
  onPushAllToGist?: () => Promise<void>;
  onPullFromGist?: () => Promise<void>;
  onCreateNewPrivateGist?: () => Promise<void>;
  isSyncingGist?: boolean;
  gistSyncStatus?: string;
  gistSyncIsError?: boolean;
}

export const HighlightedSnippet: React.FC<{ snippet: LorebookSearchMatchSnippet }> = ({
  snippet,
}) => {
  const { snippetText, matchStart, matchEnd, matchedTerm } = snippet;
  if (!matchedTerm || matchEnd <= matchStart) {
    return <span className="text-[#b8a282]">{snippetText}</span>;
  }
  const before = snippetText.slice(0, matchStart);
  const match = snippetText.slice(matchStart, matchEnd);
  const after = snippetText.slice(matchEnd);

  return (
    <span className="text-[#e6d4b5]">
      {before}
      <mark className="bg-amber-500/30 text-amber-200 font-semibold px-1 rounded">
        {match}
      </mark>
      {after}
    </span>
  );
};

export const LorebookModal: React.FC<LorebookModalProps> = ({
  mode,
  activeDrawerFilename,
  onBackToChat,
  onOpenDrawerEditor,
  onBackToList,
  lorebook,
  onSaveDrawer,
  onDeleteDrawer,
  onSaveToPhoneFolder,
  onLoadFromPhoneFolder,
  onLinkSyncFile,
  linkedSyncFileMeta,
  localSyncStatus = 'Ready for phone sync',
  isSyncingPhone = false,
  localSyncIsError = false,
  githubToken = '',
  onChangeGithubToken = () => {},
  gistId = '',
  onChangeGistId = () => {},
  onSyncGist,
  onPushAllToGist,
  onPullFromGist,
  onCreateNewPrivateGist,
  isSyncingGist = false,
  gistSyncStatus = '',
  gistSyncIsError = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editFilename, setEditFilename] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (mode === 'editor') {
      if (activeDrawerFilename && activeDrawerFilename in lorebook) {
        setEditFilename(activeDrawerFilename);
        setEditContent(lorebook[activeDrawerFilename] ?? '');
      } else if (activeDrawerFilename) {
        setEditFilename(activeDrawerFilename);
        setEditContent(lorebook[activeDrawerFilename] ?? '');
      } else {
        setEditFilename('04_new_drawer.md');
        setEditContent('## 0. CURRENT ROOM, INTIMACY & PHYSICAL STATE\n\n');
      }
      setSaveToast(null);
    }
  }, [mode, activeDrawerFilename, lorebook]);

  const searchResults = useMemo(
    () => searchLorebookDrawers(lorebook, searchQuery, 1, 55),
    [lorebook, searchQuery]
  );

  if (mode === 'closed') return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = editFilename.trim();
    if (!cleanName) return;
    onSaveDrawer(activeDrawerFilename, cleanName, editContent);
    setSaveToast(`Saved (${editContent.length.toLocaleString()} chars)`);
    window.setTimeout(() => setSaveToast(null), 2200);
  };

  const handleDelete = () => {
    const target = activeDrawerFilename || editFilename.trim();
    if (target && target in lorebook) {
      onDeleteDrawer(target);
    }
    onBackToList();
  };

  const effectiveStatus = localSyncStatus || gistSyncStatus || 'Ready for phone sync';
  const effectiveIsError =
    localSyncIsError ||
    gistSyncIsError ||
    effectiveStatus.startsWith('✗') ||
    /error|failed|missing|invalid|forbidden|not found|unauthorized/i.test(effectiveStatus);
  const effectiveIsSuccess =
    !effectiveIsError &&
    (effectiveStatus.startsWith('✓') ||
      /pushed|pulled|synced|created|backed up|saved|loaded/i.test(effectiveStatus));

  // VIEW B — Full-Screen Drawer Viewer / Editor
  if (mode === 'editor') {
    return (
      <div
        className="fixed inset-0 z-50 bg-[#161215] flex flex-col overflow-x-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Lorebook Drawer Editor"
      >
        <header className="shrink-0 sticky top-0 z-20 bg-[#161215] border-b border-[#D4AF37]/40 px-2 py-2">
          <div className="max-w-5xl mx-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={onBackToList}
              className="h-10 px-2.5 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
            >
              [ ← All Drawers ]
            </button>

            <label htmlFor="drawer-filename-input" className="sr-only">
              Drawer Filename
            </label>
            <input
              id="drawer-filename-input"
              type="text"
              value={editFilename}
              onChange={(e) => setEditFilename(e.target.value)}
              placeholder="filename.md"
              className="flex-1 min-w-0 h-10 px-2.5 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
            />

            <button
              type="button"
              onClick={handleDelete}
              aria-label="Delete Drawer"
              className="h-10 px-2.5 rounded-full bg-[#3a1818] hover:bg-[#4f2020] text-[#f5c2c2] border border-[#a85555] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
            >
              [ 🗑️ ]
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              className="h-10 px-3 rounded-full gilded-send-btn text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              [ 💾 Save ]
            </button>
          </div>

          <div className="max-w-5xl mx-auto flex items-center justify-between px-1 pt-1 text-[11px] font-mono text-[#b8a282] tabular-nums">
            <span>{editContent.length.toLocaleString()} chars</span>
            {saveToast ? (
              <span className="text-emerald-400 font-semibold">✓ {saveToast}</span>
            ) : (
              <span
                className={
                  effectiveIsError
                    ? 'text-red-400 font-semibold'
                    : effectiveIsSuccess
                    ? 'text-emerald-400 font-semibold'
                    : 'text-[#e6a8b5]'
                }
              >
                {effectiveStatus}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 min-h-0 flex flex-col p-2 sm:p-4 max-w-5xl w-full mx-auto">
          <label htmlFor="drawer-content-textarea" className="sr-only">
            Drawer Markdown Content
          </label>
          <textarea
            id="drawer-content-textarea"
            data-testid="lorebook-editor-textarea"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full flex-1 min-h-0 p-3 sm:p-4 rounded-xl gilded-input-well font-mono text-xs sm:text-sm leading-relaxed resize-none overflow-y-auto"
          />
        </main>
      </div>
    );
  }

  // VIEW A — Full-Screen Drawer List
  return (
    <div
      className="fixed inset-0 z-50 bg-[#161215] flex flex-col overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Lorebook Drawer List"
    >
      <header className="shrink-0 sticky top-0 z-20 bg-[#161215] border-b border-[#D4AF37]/40 px-2.5 py-2">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={onBackToChat}
            className="h-10 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            [ ← Back ]
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="lorebook-header-save-phone-btn"
              onClick={onSaveToPhoneFolder}
              disabled={isSyncingPhone}
              className="h-10 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              {isSyncingPhone ? '💾 Saving…' : '💾 Save Phone'}
            </button>

            <button
              type="button"
              onClick={() => onOpenDrawerEditor(null)}
              className="h-10 px-3 rounded-full gilded-send-btn text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              [ + New ]
            </button>
          </div>
        </div>
      </header>

      {/* Local Phone Sync Card (Persistent FileSystemFileHandle on phone storage) */}
      <section
        data-testid="lorebook-gist-config-box"
        aria-label="Local Phone Sync Card"
        className="shrink-0 bg-[#161215] border-b border-[#D4AF37]/30 px-2.5 py-2.5"
      >
        <div className="max-w-5xl mx-auto rounded-xl border border-[#D4AF37]/40 bg-[rgba(230,168,181,0.06)] p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📱</span>
              <div>
                <h3 className="text-xs font-bold font-mono text-[#f5ead8] tracking-wide">
                  Local Phone Sync (Persistent File Handle)
                </h3>
                <p className="text-[10px] text-[#e6a8b5]/80 font-mono">
                  {linkedSyncFileMeta?.fileName ? `Linked: ${linkedSyncFileMeta.fileName}` : 'Direct read/write to sanctuary_live_sync.json on phone storage.'}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                linkedSyncFileMeta?.status === 'connected'
                  ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300'
                  : linkedSyncFileMeta?.status === 'permission_needed'
                  ? 'border-amber-500/60 bg-amber-950/60 text-amber-300'
                  : 'border-[#D4AF37]/40 bg-[#161215] text-[#D4AF37]'
              }`}
            >
              {linkedSyncFileMeta?.status === 'connected'
                ? '🟢 Connected'
                : linkedSyncFileMeta?.status === 'permission_needed'
                ? '🟡 Tap Link'
                : '⚪ Offline-Safe'}
            </span>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              data-testid="lorebook-link-sync-btn"
              onClick={() => onLinkSyncFile?.('open')}
              disabled={isSyncingPhone}
              className="min-h-[44px] px-2.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37]/25 to-[#E6A8B5]/25 hover:from-[#D4AF37]/35 hover:to-[#E6A8B5]/35 active:scale-[0.98] border border-[#D4AF37]/70 text-xs font-bold text-[#f5ead8] cursor-pointer flex items-center justify-center gap-1 transition-all disabled:opacity-50"
              title="Links a persistent FileSystemFileHandle on your phone"
            >
              <span>🔗</span>
              <span>Link File</span>
            </button>

            <button
              type="button"
              data-testid="lorebook-save-phone-btn"
              onClick={onSaveToPhoneFolder}
              disabled={isSyncingPhone}
              className="min-h-[44px] px-2.5 py-2 rounded-xl bg-[rgba(212,175,55,0.15)] hover:bg-[rgba(212,175,55,0.25)] active:scale-[0.98] border border-[#D4AF37]/60 text-xs font-bold text-[#f5ead8] cursor-pointer flex items-center justify-center gap-1 transition-all disabled:opacity-50"
              title="Directly overwrites the linked sync file with current drawers & books (zero browser downloads)"
            >
              <span>💾</span>
              <span>{isSyncingPhone ? 'Writing…' : 'Write to File'}</span>
            </button>

            <button
              type="button"
              data-testid="lorebook-load-phone-btn"
              onClick={() => {
                if (linkedSyncFileMeta?.status === 'connected') {
                  void onLoadFromPhoneFolder?.();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              disabled={isSyncingPhone}
              className="min-h-[44px] px-2.5 py-2 rounded-xl bg-[rgba(230,168,181,0.1)] hover:bg-[rgba(230,168,181,0.18)] active:scale-[0.98] border border-[#E6A8B5]/50 text-xs font-semibold text-[#f5ead8] cursor-pointer flex items-center justify-center gap-1 transition-all disabled:opacity-50"
              title="Reads sanctuary_live_sync.json directly from your linked phone file"
            >
              <span>🔄</span>
              <span>Read File</span>
            </button>

            {/* Hidden native file input for 100% Android Chrome compatibility fallback */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onLoadFromPhoneFolder) {
                  void onLoadFromPhoneFolder(file);
                }
                e.target.value = '';
              }}
            />
          </div>

          {/* Clear Status Line Underneath */}
          <div
            data-testid="lorebook-gist-status-line"
            role="status"
            aria-live="polite"
            className={`text-xs font-mono px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${
              effectiveIsError
                ? 'bg-red-950/60 border-red-500/60 text-red-300 font-semibold'
                : effectiveIsSuccess
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 font-semibold'
                : 'bg-[#161215] border-[#D4AF37]/30 text-[#e6a8b5]'
            }`}
          >
            <span className="truncate">
              {isSyncingPhone ? '⏳ Syncing phone storage…' : effectiveStatus}
            </span>
            <span className="text-[10px] text-[#D4AF37]/80 shrink-0 ml-2 font-mono">
              {linkedSyncFileMeta?.fileName || 'sanctuary_live_sync.json'}
            </span>
          </div>
        </div>
      </section>

      <div className="shrink-0 bg-[#16100d] border-b border-[#6b5331]/60 px-2.5 py-2">
        <div className="max-w-5xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <label htmlFor="lorebook-advanced-search" className="sr-only">
              Search Lorebook keywords
            </label>
            <input
              id="lorebook-advanced-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drawer keywords (e.g. Raynaud, WORKBENCH, handoff)…"
              className="w-full h-10 pl-3 pr-14 rounded-xl gilded-input-well placeholder-[#8c7a65] text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-2 rounded-lg gilded-pill-btn text-[11px] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <main
        data-testid="lorebook-list-scroll"
        className="flex-1 min-h-0 overflow-y-auto px-2.5 py-2.5 max-w-5xl w-full mx-auto space-y-2"
      >
        {searchResults.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-[#8e6d3b]/50 bg-[#1a130f]">
            <p className="text-sm font-semibold text-[#e6d4b5]">
              No Lorebook entries match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        ) : (
          searchResults.map((item) => {
            const firstSnippet = item.snippets[0];
            return (
              <button
                key={item.filename}
                type="button"
                onClick={() => onOpenDrawerEditor(item.filename)}
                className="w-full text-left p-3.5 rounded-xl bubble-hex hover:border-[#e5c485] transition-colors cursor-pointer block"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#f5ead8] truncate">
                    {item.filename}
                  </span>
                  <span className="text-[11px] font-mono text-[#cbb693] tabular-nums shrink-0">
                    {item.charCount.toLocaleString()} chars
                    {searchQuery.trim() && item.totalMatches > 0
                      ? ` · ${item.totalMatches} match${item.totalMatches === 1 ? '' : 'es'}`
                      : ''}
                  </span>
                </div>

                {firstSnippet && (
                  <div className="mt-1.5 text-xs font-mono text-[#cbb693] truncate">
                    {searchQuery.trim() ? (
                      <>
                        <span className="text-[#9e8664] mr-1.5 tabular-nums">
                          L{firstSnippet.lineNumber}:
                        </span>
                        <HighlightedSnippet snippet={firstSnippet} />
                      </>
                    ) : (
                      <span>{firstSnippet.snippetText}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })
        )}
      </main>
    </div>
  );
};

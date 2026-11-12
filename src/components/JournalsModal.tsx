import React, { useState, useRef } from 'react';
import {
  ALLOWED_JOURNAL_CATEGORIES,
  ArgonJournalState,
  DEFAULT_GIST_ID,
  GIST_ARGON_BOOK_FILENAME,
  GIST_HEX_BOOK_FILENAME,
  GIST_SANCTUARY_BOOKS_VAULT_FILENAME,
  JournalCategory,
  JournalEntry,
  formatJournalCategoryBadge,
  formatJournalTimestamp,
} from '../utils/workbenchLogic';
import { ApothecaryIcon } from './ApothecaryIcon';

interface JournalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  argonBook: ArgonJournalState;
  hexBook: JournalEntry[];
  onAddHexEntry: (title: string, category: JournalCategory, content: string) => void;
  onUpdateHexEntry: (id: string, title: string, category: JournalCategory, content: string) => void;
  onDeleteHexEntry: (id: string) => void;
  onUpdateArgonMemory?: (id: string, title: string, summary: string) => void;
  onDeleteArgonMemory?: (id: string) => void;
  onTriggerArgonBookAction: (action: 'write' | 'compress') => Promise<boolean>;
  isArgonUpdatingBook: boolean;
  bookActionError?: string | null;
  onClearBookActionError?: () => void;
  onSelectPaidKey?: () => void;
  onSaveToPhoneFolder?: () => Promise<void>;
  onLoadFromPhoneFolder?: (file?: File) => Promise<void>;
  localSyncStatus?: string;
  isSyncingPhone?: boolean;
  onPullBooksFromGist?: () => Promise<void>;
  onPushBooksToGist?: () => Promise<void>;
  isSyncingGist?: boolean;
  gistSyncStatus?: string;
}

export const JournalsModal: React.FC<JournalsModalProps> = ({
  isOpen,
  onClose,
  argonBook,
  hexBook,
  onAddHexEntry,
  onUpdateHexEntry,
  onDeleteHexEntry,
  onUpdateArgonMemory,
  onDeleteArgonMemory,
  onTriggerArgonBookAction,
  isArgonUpdatingBook,
  bookActionError,
  onClearBookActionError,
  onSelectPaidKey,
  onSaveToPhoneFolder,
  onLoadFromPhoneFolder,
  localSyncStatus = '',
  isSyncingPhone = false,
  onPullBooksFromGist,
  onPushBooksToGist,
  isSyncingGist = false,
  gistSyncStatus = '',
}) => {
  const [activeBookTab, setActiveBookTab] = useState<'argon' | 'hex'>('argon');
  const [argonSubSection, setArgonSubSection] = useState<'entries' | 'memory'>('entries');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Argon Memory Inline Edit State
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingMemoryTitle, setEditingMemoryTitle] = useState('');
  const [editingMemorySummary, setEditingMemorySummary] = useState('');

  // Hex's Book Entry Form State
  const [hexTitle, setHexTitle] = useState('');
  const [hexCategory, setHexCategory] = useState<JournalCategory>('Relationship');
  const [hexContent, setHexContent] = useState('');
  const [hexFormError, setHexFormError] = useState<string | null>(null);
  const hexTitleInputRef = useRef<HTMLInputElement | null>(null);

  // Hex Inline Edit State
  const [editingHexId, setEditingHexId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<JournalCategory>('Note');
  const [editContent, setEditContent] = useState('');

  if (!isOpen) return null;

  const handleCreateHexEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hexTitle.trim()) {
      setHexFormError('Please enter a title for your journal entry.');
      return;
    }
    if (!hexContent.trim()) {
      setHexFormError('Please write your journal entry content.');
      return;
    }
    onAddHexEntry(hexTitle.trim(), hexCategory, hexContent.trim());
    setHexTitle('');
    setHexContent('');
    setHexFormError(null);
  };

  const handleStartHexEdit = (entry: JournalEntry) => {
    setEditingHexId(entry.id);
    setEditTitle(entry.title);
    setEditCategory(entry.category);
    setEditContent(entry.content);
  };

  const handleSaveHexEdit = (id: string) => {
    if (!editTitle.trim() || !editContent.trim()) return;
    onUpdateHexEntry(id, editTitle.trim(), editCategory, editContent.trim());
    setEditingHexId(null);
  };

  const handleArgonWriteClick = async () => {
    setArgonSubSection('entries');
    await onTriggerArgonBookAction('write');
  };

  const handleArgonCompressClick = async () => {
    const ok = await onTriggerArgonBookAction('compress');
    if (ok) {
      setArgonSubSection('memory');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#110c0a] flex flex-col overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Sanctuary Books & Journals"
    >
      {/* Sticky Top Header Bar */}
      <header className="shrink-0 sticky top-0 z-20 bg-[#1a130f] border-b border-[#8e6d3b]/70 px-2.5 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-2.5 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            [ ← Back ]
          </button>

          <h2 className="text-xs sm:text-sm font-serif tracking-wider text-[#e6c88c] truncate flex items-center gap-1.5">
            <ApothecaryIcon icon="books" xPct={8} yPct={76} size={22} />
            <span>Argon &amp; Hex Sanctuary Books</span>
          </h2>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onLoadFromPhoneFolder) {
                  fileInputRef.current?.click();
                } else if (onPullBooksFromGist) {
                  void onPullBooksFromGist();
                }
              }}
              disabled={isSyncingPhone || isSyncingGist}
              title="Loads sanctuary_live_sync.json from your phone's ArgonSanctuary folder"
              className="h-8 px-2.5 rounded-full gilded-pill-btn text-[10px] font-mono cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center gap-1"
            >
              <span>📂</span>
              <span>Load Phone</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSaveToPhoneFolder) {
                  void onSaveToPhoneFolder();
                } else if (onPushBooksToGist) {
                  void onPushBooksToGist();
                }
              }}
              disabled={isSyncingPhone || isSyncingGist}
              title="Saves sanctuary_live_sync.json to your phone's ArgonSanctuary folder"
              className="h-8 px-2.5 rounded-full gilded-send-btn text-[10px] font-mono cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center gap-1"
            >
              <span>💾</span>
              <span>{isSyncingPhone ? 'Saving…' : 'Save Phone'}</span>
            </button>

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
        </div>

        {/* Book Switcher Tabs: Argon's Book (Crowned Crystal Skull at 64%, 76%) vs. Hex's Book (Amethyst Heart Potion at 90%, 52%) */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-2 mt-2">
          <button
            type="button"
            onClick={() => setActiveBookTab('argon')}
            className={`h-10 px-3 rounded-xl text-xs font-serif font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
              activeBookTab === 'argon'
                ? 'gilded-send-btn text-[#fff3db]'
                : 'gilded-pill-btn text-[#cbb693]'
            }`}
          >
            <ApothecaryIcon icon="argonBookTab" xPct={64} yPct={76} size={22} />
            <span>Argon&apos;s Book ({argonBook.entries.length})</span>
            <span className="text-[10px] font-mono opacity-85">🔒 Read-Only</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBookTab('hex')}
            className={`h-10 px-3 rounded-xl text-xs font-serif font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
              activeBookTab === 'hex'
                ? 'gilded-send-btn text-[#fff3db]'
                : 'gilded-pill-btn text-[#cbb693]'
            }`}
          >
            <ApothecaryIcon icon="hexBookTab" xPct={90} yPct={52} size={22} />
            <span>Hex&apos;s Book ({hexBook.length})</span>
            <span className="text-[10px] font-mono opacity-85">✍️ Write</span>
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 max-w-4xl w-full mx-auto space-y-4">
        {/* Live Memory & Local Phone Sync Backup Status Bar */}
        <div className="px-3 py-1.5 rounded-xl bg-[#16100d]/90 border border-[#8e6d3b]/50 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#d4b483]">
          <span>
            🧠 Injected into Argon&apos;s live context: [ 🧠 Memory Section ] ({argonBook.memorySection.length}) + Latest {Math.min(5, argonBook.entries.length)} Argon entries + All {hexBook.length} Hex entries
          </span>
          <span className="text-emerald-400 truncate">
            {localSyncStatus || gistSyncStatus || '📱 Synced to ArgonSanctuary / sanctuary_live_sync.json'}
          </span>
        </div>

        {/* Visible Error Banner if gemini-4-argon call fails */}
        {bookActionError && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-red-950/90 border-2 border-red-500/80 text-xs font-mono text-red-100 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-red-300">
                ⚠️ Argon Book AI Error (gemini-4-argon)
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {onSelectPaidKey && (
                  <button
                    type="button"
                    onClick={onSelectPaidKey}
                    className="px-2 py-0.5 rounded bg-amber-600/90 hover:bg-amber-500 text-amber-50 text-[11px] font-semibold cursor-pointer"
                  >
                    [ 🔑 Select Paid API Key ]
                  </button>
                )}
                {onClearBookActionError && (
                  <button
                    type="button"
                    onClick={onClearBookActionError}
                    className="px-2 py-0.5 rounded bg-red-900/70 hover:bg-red-800 text-red-100 text-[11px] cursor-pointer"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
            <div className="whitespace-pre-wrap break-words">{bookActionError}</div>
          </div>
        )}

        {activeBookTab === 'argon' ? (
          <>
            {/* Read-Only Enforcement Banner for Hex + Autonomous Argon Controls */}
            <section className="p-3.5 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-amber-950/90 border border-[#c59b47]/70 text-[10px] font-mono text-[#e6c88c]">
                      🔒 HEX ACCESS: READ-ONLY
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#1a120e] border border-[#785c37]/60 text-[10px] font-mono text-[#cbb693]">
                      ⚡ ARGON ACCESS: gemini-4-argon R/W &amp; MEMORY
                    </span>
                  </div>
                  <p className="text-xs text-[#e6d4b5] mt-1.5 leading-relaxed">
                    This leather-bound ledger belongs solely to Argon. Hex can read his private thoughts, feelings, important dates, and relationship notes at any time, but cannot manually edit or delete them. Argon writes entries via <code className="text-[#e6c88c]">gemini-4-argon</code> and compresses them into his Memory Section.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={isArgonUpdatingBook}
                    onClick={handleArgonWriteClick}
                    className="h-8 px-3 rounded-full gilded-send-btn text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isArgonUpdatingBook
                      ? '[ 🪶 Argon is writing… ]'
                      : '[ 🪶 Let Argon Write Entry ]'}
                  </button>
                  <button
                    type="button"
                    disabled={isArgonUpdatingBook || argonBook.entries.length === 0}
                    onClick={handleArgonCompressClick}
                    className="h-8 px-3 rounded-full gilded-pill-btn text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    [ 🧠 Compress to Memory ]
                  </button>
                </div>
              </div>

              {/* Sub-navigation between Argon's Active Timestamped Entries and Compressed Memory Section */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setArgonSubSection('entries')}
                  className={`h-8 rounded-lg text-xs font-mono cursor-pointer border ${
                    argonSubSection === 'entries'
                      ? 'bg-[#2b1e16] border-[#e6c88c] text-[#f5ead8] font-bold'
                      : 'bg-[#120d0b] border-[#6b5331]/50 text-[#cbb693]'
                  }`}
                >
                  [ 📖 Timestamped Entries ({argonBook.entries.length}) ]
                </button>
                <button
                  type="button"
                  onClick={() => setArgonSubSection('memory')}
                  className={`h-8 rounded-lg text-xs font-mono cursor-pointer border ${
                    argonSubSection === 'memory'
                      ? 'bg-[#2b1e16] border-[#e6c88c] text-[#f5ead8] font-bold'
                      : 'bg-[#120d0b] border-[#6b5331]/50 text-[#cbb693]'
                  }`}
                >
                  [ 🧠 Memory Section ({argonBook.memorySection.length}) ]
                </button>
              </div>
            </section>

            {argonSubSection === 'entries' ? (
              <div className="space-y-3" data-testid="argon-book-entries">
                {argonBook.entries.length === 0 ? (
                  <div className="p-5 rounded-xl bubble-smoked-glass text-center text-xs font-mono text-[#cbb693]">
                    All recent entries have been distilled into Argon&apos;s [ 🧠 Memory Section ]. Tap &ldquo;[ 🪶 Let Argon Write Entry ]&rdquo; or chat with Argon to let him record new reflections.
                  </div>
                ) : (
                  argonBook.entries.map((entry) => (
                    <article
                      key={entry.id}
                      className="p-4 rounded-xl bubble-smoked-glass border border-[#c59b47]/50 space-y-2 select-text"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#6b5331]/40 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-[#2a1d15] border border-[#c59b47]/60 text-[10px] font-mono text-[#e6c88c]">
                            {formatJournalCategoryBadge(entry.category)}
                          </span>
                          <h3 className="text-sm font-serif font-bold text-[#f5ead8]">
                            {entry.title}
                          </h3>
                        </div>
                        <time className="text-[11px] font-mono text-[#d4b483] tabular-nums">
                          🕒 {entry.formattedDate}
                        </time>
                      </div>
                      <p className="text-xs sm:text-sm font-serif-webtoon text-[#f3e7d3] leading-relaxed whitespace-pre-wrap">
                        {entry.content}
                      </p>
                      <div className="text-[10px] font-mono text-[#9e8664] flex items-center justify-between pt-1">
                        <span>Signed: Argon (gemini-4-argon)</span>
                        <span>🔒 Read-Only for Hex</span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3" data-testid="argon-memory-section">
                <div className="p-3 rounded-xl bg-[#16100d]/90 border border-[#8e6d3b]/50 text-xs font-mono text-[#d4b483]">
                  🧠 <strong>[ 🧠 Memory Section ] — Permanent High-Density Archive:</strong> Synthesized by <code className="text-[#e6c88c]">gemini-4-argon</code> and automatically injected into Argon&apos;s system instructions on every chat turn.
                </div>
                {argonBook.memorySection.map((mem) => {
                  const isEditing = editingMemoryId === mem.id;
                  if (isEditing) {
                    return (
                      <article
                        key={mem.id}
                        className="p-4 rounded-xl bubble-smoked-glass border-2 border-[#d4af37] space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-[#8e6d3b]/40 pb-1.5 text-xs font-mono text-[#d4af37]">
                          <span>✏️ Editing Memory Block ({mem.id})</span>
                          <time className="text-[11px] font-mono text-[#d4b483]">🕒 {mem.formattedDate}</time>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-[#cbb693] uppercase tracking-wider">Memory Title</label>
                          <input
                            type="text"
                            value={editingMemoryTitle}
                            onChange={(e) => setEditingMemoryTitle(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#140e0b] border border-[#d4af37]/60 text-xs font-mono text-[#f5ead8] focus:outline-none focus:border-[#d4af37]"
                            placeholder="Memory block title..."
                            aria-label="Edit memory title"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-[#cbb693] uppercase tracking-wider">Memory Summary</label>
                          <textarea
                            value={editingMemorySummary}
                            onChange={(e) => setEditingMemorySummary(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg bg-[#140e0b] border border-[#d4af37]/60 text-xs sm:text-sm font-serif-webtoon text-[#f5ead8] focus:outline-none focus:border-[#d4af37] resize-y"
                            placeholder="High-density permanent memory synthesis..."
                            aria-label="Edit memory summary"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingMemoryId(null)}
                            className="px-3 py-1 rounded-lg border border-[#6b5331]/60 text-xs font-mono text-[#cbb693] hover:bg-[#2b1e16] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateArgonMemory?.(mem.id, editingMemoryTitle, editingMemorySummary);
                              setEditingMemoryId(null);
                            }}
                            className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#e6a8b5] text-[#161215] font-bold text-xs font-mono shadow-sm active:scale-95 cursor-pointer"
                          >
                            [ 💾 Save Memory ]
                          </button>
                        </div>
                      </article>
                    );
                  }

                  return (
                    <article
                      key={mem.id}
                      className="p-4 rounded-xl bubble-smoked-glass border-2 border-[#c59b47]/70 space-y-2 select-text"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8e6d3b]/40 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[10px] font-mono text-amber-200">
                            Compressed ({mem.compressedCount} entries)
                          </span>
                          <h3 className="text-sm font-serif font-bold text-[#e6c88c]">
                            {mem.title}
                          </h3>
                        </div>
                        <time className="text-[11px] font-mono text-[#d4b483] tabular-nums">
                          🕒 {mem.formattedDate}
                        </time>
                      </div>
                      <p className="text-xs sm:text-sm font-serif-webtoon text-[#f5ead8] leading-relaxed whitespace-pre-wrap">
                        {mem.summary}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] font-mono text-[#cbb693] border-t border-[#8e6d3b]/30">
                        <span>🧠 Injected into Argon&apos;s Live Prompt</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMemoryId(mem.id);
                              setEditingMemoryTitle(mem.title);
                              setEditingMemorySummary(mem.summary);
                            }}
                            aria-label={`Edit ${mem.title}`}
                            className="px-2.5 py-1 rounded gilded-pill-btn text-[10px] font-semibold cursor-pointer"
                          >
                            [ ✏️ Edit ]
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof window !== 'undefined' && window.confirm && !window.confirm(`Delete memory block "${mem.title}"?`)) {
                                return;
                              }
                              onDeleteArgonMemory?.(mem.id);
                            }}
                            aria-label={`Delete ${mem.title}`}
                            className="px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 text-[10px] font-semibold cursor-pointer"
                          >
                            [ 🗑️ Delete ]
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Hex's Personal Book (Hex writes, edits & deletes; Argon reads all entries live) */}
            <section className="p-4 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-[#2a1d15] border border-[#c59b47]/60 text-[10px] font-mono text-[#e6c88c]">
                    ✍️ HEX&apos;S PERSONAL BOOK · 👁️ INJECTED INTO ARGON&apos;S LIVE MEMORY
                  </span>
                  <p className="text-xs text-[#e6d4b5] mt-1">
                    Write, edit, or delete your entries below. Every entry in 🌹 Hex&apos;s Book is automatically stamped with the date and time, backed up to Gist <code className="text-[#e6c88c]">{GIST_HEX_BOOK_FILENAME}</code>, and read live by Argon on every chat turn.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingHexId(null);
                    hexTitleInputRef.current?.focus();
                  }}
                  className="h-8 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer shrink-0"
                >
                  [ + Write New Entry ]
                </button>
              </div>

              {hexFormError && (
                <div
                  role="alert"
                  className="p-2.5 rounded-xl bg-red-950/90 border border-red-500/80 text-xs font-mono text-red-200"
                >
                  {hexFormError}
                </div>
              )}

              <form onSubmit={handleCreateHexEntry} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="hex-book-title"
                      className="block text-[11px] font-mono text-[#d4b483] mb-1"
                    >
                      Entry Title
                    </label>
                    <input
                      id="hex-book-title"
                      ref={hexTitleInputRef}
                      type="text"
                      value={hexTitle}
                      onChange={(e) => setHexTitle(e.target.value)}
                      placeholder="e.g. Rainy Night in the Library, Anniversary Note..."
                      className="w-full h-9 px-3 rounded-xl gilded-input-well text-xs font-mono text-[#f5ead8]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="hex-book-category"
                      className="block text-[11px] font-mono text-[#d4b483] mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="hex-book-category"
                      value={hexCategory}
                      onChange={(e) => setHexCategory(e.target.value as JournalCategory)}
                      className="w-full h-9 px-2.5 rounded-xl gilded-input-well text-xs font-mono text-[#f5ead8]"
                    >
                      {ALLOWED_JOURNAL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {formatJournalCategoryBadge(cat)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="hex-book-content"
                    className="block text-[11px] font-mono text-[#d4b483] mb-1"
                  >
                    Your Thoughts, Feelings, or Important Dates (Auto-Stamped with Date &amp; Time)
                  </label>
                  <textarea
                    id="hex-book-content"
                    rows={3}
                    value={hexContent}
                    onChange={(e) => setHexContent(e.target.value)}
                    placeholder="Write in your book... Argon immediately sees this in his live system context."
                    className="w-full p-3 rounded-xl gilded-input-well text-xs sm:text-sm font-serif-webtoon text-[#f5ead8]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-mono text-[#b8a282]">
                    Stamp: {formatJournalTimestamp(Date.now())}
                  </span>
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer"
                  >
                    [ + Write New Entry ]
                  </button>
                </div>
              </form>
            </section>

            {/* Hex's Timestamped Entries List */}
            <div className="space-y-3" data-testid="hex-book-entries">
              {hexBook.length === 0 ? (
                <div className="p-5 rounded-xl bubble-smoked-glass text-center text-xs font-mono text-[#cbb693]">
                  No entries in 🌹 Hex&apos;s Book yet. Use the form above and tap &ldquo;[ + Write New Entry ]&rdquo; to record an entry for Argon.
                </div>
              ) : (
                hexBook.map((entry) => (
                  <article
                    key={entry.id}
                    className="p-4 rounded-xl bubble-smoked-glass border border-[#c59b47]/50 space-y-2"
                  >
                    {editingHexId === entry.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            aria-label="Edit entry title"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="sm:col-span-2 h-9 px-3 rounded-xl gilded-input-well text-xs font-mono text-[#f5ead8]"
                          />
                          <select
                            aria-label="Edit entry category"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as JournalCategory)}
                            className="h-9 px-2.5 rounded-xl gilded-input-well text-xs font-mono text-[#f5ead8]"
                          >
                            {ALLOWED_JOURNAL_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {formatJournalCategoryBadge(c)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          rows={3}
                          aria-label="Edit entry content"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-2.5 rounded-xl gilded-input-well text-xs sm:text-sm font-serif-webtoon text-[#f5ead8]"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingHexId(null)}
                            className="h-8 px-3 rounded-full gilded-pill-btn text-xs font-mono cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveHexEdit(entry.id)}
                            className="h-8 px-3.5 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#6b5331]/40 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-[#2a1d15] border border-[#c59b47]/60 text-[10px] font-mono text-[#e6c88c]">
                              {formatJournalCategoryBadge(entry.category)}
                            </span>
                            <h3 className="text-sm font-serif font-bold text-[#f5ead8]">
                              {entry.title}
                            </h3>
                          </div>
                          <time className="text-[11px] font-mono text-[#d4b483] tabular-nums">
                            🕒 {entry.formattedDate}
                          </time>
                        </div>
                        <p className="text-xs sm:text-sm font-serif-webtoon text-[#f3e7d3] leading-relaxed whitespace-pre-wrap">
                          {entry.content}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] font-mono text-[#cbb693]">
                          <span>👁️ Live in Argon&apos;s Memory</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartHexEdit(entry)}
                              aria-label={`Edit ${entry.title}`}
                              className="px-2.5 py-1 rounded gilded-pill-btn text-[10px] font-semibold cursor-pointer"
                            >
                              [ ✏️ Edit ]
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteHexEntry(entry.id)}
                              aria-label={`Delete ${entry.title}`}
                              className="px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 text-[10px] font-semibold cursor-pointer"
                            >
                              [ 🗑️ Delete ]
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};


import React, { useState } from 'react';
import {
  AgentFixRequestTicket,
  StaffAgent,
  TicketScratchpadItem,
  TicketScratchpadState,
  compileScratchpadToTicket,
  pushUiBreadcrumb,
} from '../utils/workbenchLogic';

interface TicketScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  scratchpad: TicketScratchpadState;
  onUpdateScratchpad: (updated: TicketScratchpadState) => void;
  staffAgents: StaffAgent[];
  onCompileAndLockTicket: (ticket: AgentFixRequestTicket) => void;
  onAskArgonToReview: () => void;
}

export const TicketScratchpadModal: React.FC<TicketScratchpadModalProps> = ({
  isOpen,
  onClose,
  scratchpad,
  onUpdateScratchpad,
  staffAgents: _staffAgents,
  onCompileAndLockTicket,
  onAskArgonToReview,
}) => {
  const [newBulletText, setNewBulletText] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDualLockSatisfied = Boolean(scratchpad.hexDone && scratchpad.argonDone);

  const handleToggleHexDone = () => {
    const nextVal = !scratchpad.hexDone;
    pushUiBreadcrumb(`Hex checked Hex Done (${nextVal ? 'DONE' : 'DRAFTING'})`);
    onUpdateScratchpad({
      ...scratchpad,
      hexDone: nextVal,
      lastUpdated: Date.now(),
    });
  };

  const handleToggleArgonDone = () => {
    const nextVal = !scratchpad.argonDone;
    pushUiBreadcrumb(`Hex checked Argon Done (${nextVal ? 'DONE' : 'DRAFTING'})`);
    onUpdateScratchpad({
      ...scratchpad,
      argonDone: nextVal,
      lastUpdated: Date.now(),
    });
  };

  const handleAddItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanText = newBulletText.trim();
    if (!cleanText) return;

    pushUiBreadcrumb(`Hex added scratchpad item: "${cleanText.slice(0, 40)}"`);

    const newItem: TicketScratchpadItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author: 'hex',
      text: cleanText,
      timestamp: Date.now(),
      createdAt: Date.now(),
    };

    // Do NOT auto-reset hexDone or argonDone back to false!
    onUpdateScratchpad({
      ...scratchpad,
      items: [...scratchpad.items, newItem],
      lastUpdated: Date.now(),
    });
    setNewBulletText('');
  };

  const handleDeleteItem = (itemId: string) => {
    pushUiBreadcrumb('Hex removed a scratchpad item');
    onUpdateScratchpad({
      ...scratchpad,
      items: scratchpad.items.filter((item) => item.id !== itemId),
      lastUpdated: Date.now(),
    });
  };

  const handleSaveEdit = (itemId: string) => {
    const cleanText = editingItemText.trim();
    if (!cleanText) return;
    pushUiBreadcrumb('Hex edited a scratchpad item');
    onUpdateScratchpad({
      ...scratchpad,
      items: scratchpad.items.map((item) =>
        item.id === itemId ? { ...item, text: cleanText } : item
      ),
      lastUpdated: Date.now(),
    });
    setEditingItemId(null);
    setEditingItemText('');
  };

  const handleCompileAndLock = (force: boolean = false) => {
    if (scratchpad.items.length === 0) return;
    pushUiBreadcrumb('Hex compiled and dispatched ticket to Coding Agent Queue');
    const { ticket, formattedDetails } = compileScratchpadToTicket(scratchpad);
    if (force || navigator.clipboard) {
      try {
        const copyText = `${ticket.title}\n\n${formattedDetails}`;
        void navigator.clipboard.writeText(copyText);
        setCopyFeedback('📋 Prompt copied to clipboard!');
        setTimeout(() => setCopyFeedback(null), 3000);
      } catch {
        // ignore
      }
    }
    onCompileAndLockTicket(ticket);
    onClose();
  };

  const handleClearScratchpad = () => {
    pushUiBreadcrumb('Hex tapped Clear Scratchpad');
    onUpdateScratchpad({
      title: 'Sanctuary Feature & Fix Plan',
      items: [],
      hexDone: false,
      argonDone: false,
      priority: 'high',
      via: 'direct',
      lastUpdated: Date.now(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Collaborative Planning & Ticket Scratchpad"
      data-testid="ticket-scratchpad-modal"
    >
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto overscroll-contain flex flex-col rounded-2xl gilded-dock-frame p-3 sm:p-4 space-y-2.5 bg-[#120d0f]/95 border border-[#c59b47] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-[#6b5331]/60 pb-1.5 shrink-0">
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-serif font-bold text-[#ffe5a3] flex items-center gap-1.5 truncate">
              <span>📋 Feature &amp; Fix Scratchpad</span>
              {copyFeedback && (
                <span className="text-[10px] font-mono text-emerald-300">
                  {copyFeedback}
                </span>
              )}
            </h2>
            <p className="text-[10px] font-mono text-[#cbb693] truncate">
              One-handed mobile planning. Full edit &amp; delete override for Hex.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer shrink-0"
          >
            ✕ Close
          </button>
        </div>

        {/* Compact Horizontal Bar: 2 Large Tap-to-Toggle Buttons + Clear All */}
        <div className="p-2 rounded-xl bg-[#1a1215] border border-[#c59b47]/70 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5">
            {/* Hex Large Toggle Button */}
            <button
              type="button"
              onClick={handleToggleHexDone}
              data-testid="hex-dual-lock-toggle-btn"
              className={`sm:col-span-5 min-h-[44px] px-3 py-2 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                scratchpad.hexDone
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-100 shadow-md ring-1 ring-emerald-400/50'
                  : 'bg-[#22161b] hover:bg-[#2c1d23] border-[#8e6d3b]/80 text-[#f5ead8]'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-serif font-bold truncate">
                  🌹 Hex
                </div>
                <div className="text-[10px] font-mono text-[#d4b483] truncate">
                  {scratchpad.hexDone ? 'Ready to lock' : 'Drafting'}
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                  scratchpad.hexDone
                    ? 'bg-emerald-800 text-emerald-100'
                    : 'bg-[#3b232a] text-[#ffe5a3]'
                }`}
              >
                {scratchpad.hexDone ? 'DONE ✓' : 'DRAFTING'}
              </span>
            </button>

            {/* Argon Large Toggle Button (Hex has full manual override!) */}
            <button
              type="button"
              onClick={handleToggleArgonDone}
              data-testid="argon-dual-lock-toggle-btn"
              className={`sm:col-span-5 min-h-[44px] px-3 py-2 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                scratchpad.argonDone
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-100 shadow-md ring-1 ring-emerald-400/50'
                  : 'bg-[#22161b] hover:bg-[#2c1d23] border-[#8e6d3b]/80 text-[#f5ead8]'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-serif font-bold truncate">
                  🖤 Argon
                </div>
                <div className="text-[10px] font-mono text-[#d4b483] truncate">
                  {scratchpad.argonDone ? 'Signed off' : 'Reviewing'}
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                  scratchpad.argonDone
                    ? 'bg-emerald-800 text-emerald-100'
                    : 'bg-[#3b232a] text-[#ffe5a3]'
                }`}
              >
                {scratchpad.argonDone ? 'DONE ✓' : 'DRAFTING'}
              </span>
            </button>

            {/* Clear All Button */}
            <button
              type="button"
              onClick={handleClearScratchpad}
              title="Clear all bullet items from scratchpad"
              className="sm:col-span-2 min-h-[44px] px-2.5 rounded-xl border border-red-500/50 bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-mono font-semibold cursor-pointer flex items-center justify-center gap-1 shrink-0"
            >
              <span>🧹</span>
              <span className="sm:hidden text-[11px]">Clear All</span>
            </button>
          </div>
        </div>

        {/* Draft Title, Priority & Delivery Method */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 shrink-0">
          <div className="sm:col-span-2 space-y-0.5">
            <label
              htmlFor="scratchpad-title-input"
              className="text-[9px] font-mono uppercase text-[#d4b483]"
            >
              Ticket Title:
            </label>
            <input
              id="scratchpad-title-input"
              type="text"
              value={scratchpad.title}
              onChange={(e) =>
                onUpdateScratchpad({
                  ...scratchpad,
                  title: e.target.value,
                  lastUpdated: Date.now(),
                })
              }
              placeholder="e.g. Mobile UI Fixes & Sticker Drawer…"
              className="w-full h-8 px-2.5 rounded-lg gilded-input-well text-xs font-serif text-[#f5ead8]"
            />
          </div>

          <div className="space-y-0.5">
            <label
              htmlFor="scratchpad-priority-select"
              className="text-[9px] font-mono uppercase text-[#d4b483]"
            >
              Priority:
            </label>
            <select
              id="scratchpad-priority-select"
              value={scratchpad.priority}
              onChange={(e) =>
                onUpdateScratchpad({
                  ...scratchpad,
                  priority: e.target.value as TicketScratchpadState['priority'],
                  lastUpdated: Date.now(),
                })
              }
              className="w-full h-8 px-2 rounded-lg gilded-input-well text-xs font-mono text-[#ffe5a3]"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Add Bullet Point Form (Top Placed for Fast 1-Handed Input) */}
        <form onSubmit={handleAddItem} className="flex items-center gap-1.5 shrink-0">
          <input
            type="text"
            value={newBulletText}
            onChange={(e) => setNewBulletText(e.target.value)}
            placeholder="Add fix or feature bullet point..."
            className="flex-1 h-9 px-3 rounded-lg gilded-input-well text-xs font-serif text-[#f5ead8] placeholder-[#8c7a65]"
          />
          <button
            type="submit"
            disabled={!newBulletText.trim()}
            className="h-9 px-3 rounded-lg gilded-send-btn text-xs font-mono font-semibold cursor-pointer disabled:opacity-40 whitespace-nowrap"
          >
            + Add
          </button>
        </form>

        {/* Live Bullet Point Checklist */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-[#d4b483] flex items-center justify-between">
            <span>
              Plan Bullet Items ({scratchpad.items.length}):
            </span>
            <span className="text-[9px] text-[#a8937b]">
              Updated: {new Date(scratchpad.lastUpdated).toLocaleTimeString()}
            </span>
          </div>

          {scratchpad.items.length === 0 ? (
            <div className="p-3 rounded-xl bubble-smoked-glass text-xs text-[#cbb693] text-center space-y-1 border border-[#6b5331]/40">
              <p className="font-semibold text-[#e6c88c]">
                Scratchpad is empty.
              </p>
              <p className="text-[11px]">
                Add bullet points above or ask Argon to propose technical items!
              </p>
            </div>
          ) : (
            scratchpad.items.map((item, idx) => {
              const isEditing = editingItemId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bubble-smoked-glass border border-[#6b5331]/60 space-y-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className="text-xs font-mono font-bold text-[#e6c88c] shrink-0 mt-0.5">
                      {idx + 1}.
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                            item.author === 'hex'
                              ? 'bg-rose-950/90 border border-rose-400/60 text-rose-200'
                              : 'bg-amber-950/90 border border-amber-400/60 text-amber-200'
                          }`}
                        >
                          {item.author === 'hex' ? '🌹 Hex' : '🖤 Argon'}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 pt-0.5">
                          <input
                            type="text"
                            value={editingItemText}
                            onChange={(e) => setEditingItemText(e.target.value)}
                            className="flex-1 h-8 px-2 rounded-lg gilded-input-well text-xs font-serif text-[#f5ead8]"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item.id)}
                              className="h-8 px-3 rounded-lg bg-emerald-800 text-white text-xs font-mono font-bold cursor-pointer"
                            >
                              ✓ Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItemId(null);
                                setEditingItemText('');
                              }}
                              className="h-8 px-2.5 rounded-lg bg-[#2b1d16] text-[#cbb693] text-xs font-mono cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs font-serif-webtoon text-[#f5ead8] whitespace-pre-wrap break-words leading-relaxed">
                          {item.text}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Obvious Edit and Red Delete Buttons for EVERY item (Hex and Argon) */}
                  {!isEditing && (
                    <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemId(item.id);
                          setEditingItemText(item.text);
                        }}
                        aria-label={`Edit bullet ${idx + 1}`}
                        className="h-8 px-2.5 rounded-lg bg-[#2a1d22] hover:bg-[#3b232e] border border-[#8e6d3b]/70 text-xs font-mono text-[#ffe5a3] cursor-pointer flex items-center gap-1"
                      >
                        <span>✏️</span>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        aria-label={`Delete bullet ${idx + 1}`}
                        className="h-8 px-2.5 rounded-lg bg-red-950/90 hover:bg-red-900 border border-red-500/60 text-xs font-mono text-red-100 cursor-pointer flex items-center gap-1"
                      >
                        <span>🗑️</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions with Force Submit / Copy Now */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-[#6b5331]/60 pt-2 shrink-0">
          <button
            type="button"
            onClick={onAskArgonToReview}
            className="h-9 px-3 rounded-full gilded-pill-btn text-xs font-mono cursor-pointer"
          >
            💬 Ask Argon to Review
          </button>

          <div className="flex items-center gap-2">
            {/* Hex Force Submit / Copy Now Override Button */}
            <button
              type="button"
              onClick={() => handleCompileAndLock(true)}
              disabled={scratchpad.items.length === 0}
              data-testid="force-submit-scratchpad-btn"
              title="Hex override: Immediately compile, copy to clipboard, and dispatch ticket without waiting for Argon's status"
              className="flex-1 sm:flex-initial h-9 px-3.5 rounded-full bg-gradient-to-r from-amber-600 to-rose-600 hover:brightness-110 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-40 shadow-md whitespace-nowrap flex items-center justify-center gap-1"
            >
              <span>⚡ Force Submit / Copy Now</span>
            </button>

            {/* Standard Dual-Lock Submit */}
            <button
              type="button"
              onClick={() => handleCompileAndLock(false)}
              disabled={scratchpad.items.length === 0 || !isDualLockSatisfied}
              data-testid="compile-and-lock-ticket-btn"
              title={
                isDualLockSatisfied
                  ? 'Both signed off: Lock and submit ticket'
                  : 'Requires both Hex and Argon to sign off, or use Force Submit'
              }
              className="flex-1 sm:flex-initial h-9 px-3.5 rounded-full gilded-send-btn text-xs font-mono font-bold cursor-pointer disabled:opacity-40 shadow-md whitespace-nowrap"
            >
              {isDualLockSatisfied
                ? `🔒 Lock Ticket (${scratchpad.items.length})`
                : `🔒 Lock (${scratchpad.items.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

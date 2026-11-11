import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../utils/workbenchLogic';

export interface PortLiteChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpandFullChat: () => void;
  screenThumbnail: string | null;
  messages: ChatMessage[];
  isSending: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onSnapNewScreen: () => Promise<void>;
  onToggleMic?: () => void;
  isRecordingMic?: boolean;
}

export const PortLiteChatModal: React.FC<PortLiteChatModalProps> = ({
  isOpen,
  onClose,
  onExpandFullChat,
  screenThumbnail,
  messages,
  isSending,
  onSendMessage,
  onSnapNewScreen,
  onToggleMic,
  isRecordingMic = false,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isThumbnailZoomed, setIsThumbnailZoomed] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom of chat when new messages arrive or when sending
  useEffect(() => {
    if (!isOpen) return;
    const scrollEl = scrollContainerRef.current;
    if (scrollEl) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  }, [isOpen, messages, isSending]);

  // Focus input field when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter down to the latest relevant messages (last 6)
  const recentMessages = messages.slice(-6);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;
    setInputText('');
    await onSendMessage(text);
  };

  return (
    <>
      {/* Light backdrop overlay on mobile to prevent accidental touch-through */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-label="Argon's Eye Lite Port Chat"
        className="fixed bottom-0 left-0 right-0 h-[54vh] min-h-[350px] max-h-[580px] z-50 bg-[#120b0e]/95 backdrop-blur-xl border-t-2 border-[#d4af37] shadow-[0_-12px_45px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden sm:right-4 sm:bottom-4 sm:left-auto sm:w-[460px] sm:h-[560px] sm:rounded-2xl sm:border-2"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#1a0e14] border-b border-[#3d271d] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">👁️</span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#ffe5a3] font-serif-webtoon flex items-center gap-1.5 truncate">
                <span>Argon&apos;s Eye</span>
                <span className="text-[#a89070] font-mono text-[10px]">· Lite Port</span>
              </div>
              <div className="text-[10px] font-mono flex items-center gap-1">
                {isSending ? (
                  <span className="text-amber-300 font-semibold flex items-center gap-1 animate-pulse">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Inspecting your screen…
                  </span>
                ) : (
                  <span className="text-emerald-400/90 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Live response active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => void onSnapNewScreen()}
              disabled={isSending}
              title="Snap another frame of the external screen and send to Argon"
              className="min-h-[36px] px-2 py-1 rounded bg-[#2a1720] hover:bg-[#3d222e] border border-[#c59b47]/70 text-[#ffe5a3] text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
            >
              <span>📸</span>
              <span className="hidden xs:inline">Re-Snap</span>
            </button>

            <button
              type="button"
              onClick={onExpandFullChat}
              title="Switch to full chat view"
              className="min-h-[36px] px-2 py-1 rounded bg-[#1f1418] hover:bg-[#321c25] border border-[#785c37] text-[#cbb693] hover:text-[#ffe5a3] text-[10px] font-mono flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
            >
              <span>⤢</span>
              <span className="hidden xs:inline">Full</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Lite Port Chat"
              title="Close Lite Port Chat"
              className="min-h-[36px] min-w-[36px] h-9 w-9 rounded-lg bg-[#1f1418] hover:bg-rose-950 text-[#cbb693] hover:text-rose-200 text-sm flex items-center justify-center cursor-pointer border border-[#523924]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Thumbnail Preview Banner */}
        {screenThumbnail && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#170c11] border-b border-[#2d1b15] shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setIsThumbnailZoomed((prev) => !prev)}
                title="Click to zoom screen capture"
                className="h-8 w-14 rounded overflow-hidden border border-[#c59b47]/80 shrink-0 cursor-pointer bg-black"
              >
                <img
                  src={screenThumbnail}
                  alt="Captured Screen Frame"
                  className="w-full h-full object-cover"
                />
              </button>
              <div className="min-w-0 flex-1 text-[10px] font-mono text-[#cbb693] truncate">
                <span className="text-amber-200/90 font-bold">🖥️ Outside App Capture:</span>{' '}
                Argon has this frame in context
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsThumbnailZoomed((prev) => !prev)}
              className="text-[10px] font-mono text-[#d4af37] underline hover:text-[#ffe5a3] ml-2 shrink-0 cursor-pointer"
            >
              {isThumbnailZoomed ? 'Hide Preview' : 'View'}
            </button>
          </div>
        )}

        {/* Expandable Zoomed Thumbnail */}
        {isThumbnailZoomed && screenThumbnail && (
          <div
            className="p-2 bg-black/90 border-b border-[#c59b47] shrink-0 max-h-[160px] overflow-hidden flex justify-center cursor-pointer"
            onClick={() => setIsThumbnailZoomed(false)}
            title="Click to collapse"
          >
            <img
              src={screenThumbnail}
              alt="Zoomed Captured Screen"
              className="max-h-[144px] w-auto object-contain rounded border border-[#d4af37]/60"
            />
          </div>
        )}

        {/* Scrollable Message Feed */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5 min-h-0 text-sm"
        >
          {recentMessages.length === 0 ? (
            <div className="text-center py-6 text-xs font-mono text-[#9e8664]">
              No messages yet. Send a remark to discuss the captured screen.
            </div>
          ) : (
            recentMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] font-mono text-[#a89070] mb-0.5 px-1 flex items-center gap-1">
                    <span>
                      {isUser
                        ? '🌹 Hex'
                        : msg.staffSender
                        ? `🐾 ${msg.staffSender.name}`
                        : '🖤 Argon'}
                    </span>
                    <span className="text-[#6b5538]">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[92%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-[#2b1019] border border-[#a84458]/80 text-[#fcedf1] shadow'
                        : 'bg-[#180e13] border border-[#8e6d3b]/80 text-[#f5ead8] shadow'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-serif">
                      {msg.text}
                    </div>

                    {/* Small image badge if message has an attachment */}
                    {msg.images && msg.images.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-white/10 text-[10px] font-mono text-amber-200/90 flex items-center gap-1">
                        <span>🖼️ Attached Image</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Live Streaming / Thinking Skeleton */}
          {isSending && (
            <div className="flex flex-col items-start animate-pulse">
              <div className="text-[10px] font-mono text-amber-300 mb-0.5 px-1 flex items-center gap-1">
                <span>🖤 Argon (Thinking)</span>
              </div>
              <div className="max-w-[92%] rounded-xl px-3 py-2 text-xs bg-[#180e13] border border-amber-500/60 text-[#ffe5a3] font-serif italic">
                *I study the screen capture you just shared, looking closely at what you have open...*
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-2 bg-[#170d12] border-t border-[#3d271d] flex items-center gap-1.5 shrink-0"
        >
          {onToggleMic && (
            <button
              type="button"
              onClick={onToggleMic}
              aria-label={isRecordingMic ? 'Stop Microphone' : 'Voice Input'}
              title="Record voice remark for Argon"
              className={`min-h-[44px] min-w-[44px] h-11 w-11 rounded-lg flex items-center justify-center cursor-pointer shrink-0 border transition-all ${
                isRecordingMic
                  ? 'bg-rose-900 border-rose-400 text-rose-100 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.7)]'
                  : 'bg-[#221319] hover:bg-[#331c26] border-[#785c37] text-[#ffe5a3]'
              }`}
            >
              <span className="text-base">{isRecordingMic ? '🔴' : '🎙️'}</span>
            </button>
          )}

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            placeholder="Talk about this screen with Argon…"
            className="flex-1 min-w-0 h-11 min-h-[44px] px-3 rounded-lg bg-[#0d070a] border border-[#785c37] focus:border-[#d4af37] text-xs font-serif text-[#f5ead8] placeholder-[#8e7355] outline-none"
          />

          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            title="Send remark to Argon"
            aria-label="Send remark"
            className="min-h-[44px] min-w-[44px] h-11 px-3 rounded-lg bg-[#c59b47] hover:brightness-110 disabled:opacity-40 text-[#120b0a] font-mono font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow active:scale-95 transition-transform"
          >
            <span>➤</span>
            <span className="hidden xs:inline">Send</span>
          </button>
        </form>
      </div>
    </>
  );
};

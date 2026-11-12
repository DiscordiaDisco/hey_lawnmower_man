import React from 'react';
import type {
  ChatMessage,
  StaffAgent,
  WeatherTelemetry,
  BatteryTelemetry,
  ArgonStickerShortcode,
} from '../utils/workbenchLogic';
import {
  parseMessageSegments,
  parseMarkdownBlocks,
  buildBubbleTelemetrySubtitle,
  formatPerMessageTokenBadge,
  resolveAttachmentMimeType,
  isAudioAttachment,
  isVideoAttachment,
  isPdfAttachment,
  isTextDocAttachment,
  normalizeAudioMimeType,
  getSlicedStickerDataUrl,
  getStickerByShortcode,
  STAFF_AVATAR_PRESETS,
  estimateMessageTokens,
  formatUserLocationTime,
  formatMessageBubbleTimestamp,
  resolveUserLocationTimeZone,
  MessageReaction,
  toggleMessageReaction,
} from '../utils/workbenchLogic';
import { loadAvatarRepository } from './HouseholdAvatarUploaderModal';
import { CodeCopyBlock } from './CodeCopyBlock';
import { ArgonSticker } from './ArgonSticker';
import { ApothecaryIcon } from './ApothecaryIcon';
import { Smile } from 'lucide-react';

export interface ChatMessageBubbleProps {
  msg: ChatMessage;
  hexAvatarUrl?: string | null;
  argonAvatarMode?: string;
  activeModelId?: string;
  isSending?: boolean;
  speakingMsgId?: string | null;
  loadingAudioMsgId?: string | null;
  argonVoiceName?: string;
  copiedMsgId?: string | null;
  editingMsgId?: string | null;
  editingMsgText?: string;
  isThoughtsExpanded?: boolean;
  isTokenPopoverOpen?: boolean;
  staffAgents?: StaffAgent[];
  weather?: WeatherTelemetry;
  battery?: BatteryTelemetry;
  fallbackFullPayloadTokens?: number;
  userTimeZone?: string;
  activeReactionPickerMsgId?: string | null;
  onToggleReactionPicker?: (msgId: string) => void;
  onToggleReaction?: (msgId: string, emoji: string, user: 'Hex' | 'Argon' | string) => void;
  onCloseReactionPicker?: () => void;
  onSpeak?: (msg: ChatMessage) => void;
  onReply?: (msg: ChatMessage) => void;
  onResend?: (msg: ChatMessage) => void;
  onStartEdit?: (msg: ChatMessage) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (msgId: string) => void;
  onEditChange?: (text: string) => void;
  onCopy?: (msgId: string, text: string) => void;
  onDelete?: (msgId: string) => void;
  onToggleThoughts?: (msgId: string) => void;
  onToggleTokenPopover?: (msgId: string) => void;
  onNavigateToView?: (view: any, param?: any) => void;
  onOpenWhiteboard?: () => void;
  onSetActiveGamesTab?: (tab: any) => void;
}

function renderInlineTokens(tokens: any[]): React.ReactNode {
  return tokens.map((tok, idx) => {
    switch (tok.type) {
      case 'sticker':
        if (tok.sticker) {
          return (
            <ArgonSticker
              key={idx}
              sticker={tok.sticker}
              row={tok.sticker.row}
              col={tok.sticker.col}
              shortcode={tok.sticker.shortcode}
              size={64}
              className="mx-1.5 my-1 align-middle"
            />
          );
        }
      case 'link': {
        const targetUrl = tok.url || tok.text;
        return (
          <a
            key={idx}
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="text-[#E6A8B5] hover:text-[#ffe5a3] underline decoration-[#D4AF37]/60 hover:decoration-[#ffe5a3] font-medium break-all transition-colors cursor-pointer pointer-events-auto select-text"
          >
            {tok.text}
          </a>
        );
      }
      case 'bold_italic':
        return (
          <strong key={idx} className="font-bold italic text-[#fff5e4]">
            {tok.text}
          </strong>
        );
      case 'bold':
        return (
          <strong key={idx} className="font-bold text-[#fff5e4]">
            {tok.text}
          </strong>
        );
      case 'italic':
        return (
          <em key={idx} className="italic text-[#e2cba6] font-medium">
            {tok.text}
          </em>
        );
      case 'code':
        return (
          <code
            key={idx}
            className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#2b1f17] text-[#e8c686] border border-[#705532]/60"
          >
            {tok.text}
          </code>
        );
      default:
        return <React.Fragment key={idx}>{tok.text}</React.Fragment>;
    }
  });
}

function renderFormattedText(text: string): React.ReactNode {
  const blocks = parseMarkdownBlocks(text);
  return blocks.map((block, idx) => {
    switch (block.type) {
      case 'spacer':
        return <div key={idx} className="h-1.5" />;
      case 'hr':
        return <hr key={idx} className="my-2 border-t border-[#c59b47]/40" />;
      case 'heading': {
        if (block.level === 1) {
          return (
            <h2
              key={idx}
              className="text-base sm:text-lg font-display-crest font-bold text-[#f2d59b] tracking-wide mt-2 mb-1 border-b border-[#c59b47]/30 pb-0.5 select-text"
            >
              {renderInlineTokens(block.tokens)}
            </h2>
          );
        }
        if (block.level === 2) {
          return (
            <h3
              key={idx}
              className="text-sm sm:text-base font-display-crest font-bold text-[#e6c88c] tracking-wide mt-2 mb-1 select-text"
            >
              {renderInlineTokens(block.tokens)}
            </h3>
          );
        }
        return (
          <h4
            key={idx}
            className="text-xs sm:text-sm font-display-crest font-semibold text-[#dfbc7c] tracking-wide mt-1.5 mb-0.5 select-text"
          >
            {renderInlineTokens(block.tokens)}
          </h4>
        );
      }
      case 'ul':
        return (
          <ul
            key={idx}
            className="list-disc pl-5 space-y-1 my-1 text-[15px] sm:text-[16px] leading-snug sm:leading-relaxed select-text"
          >
            {block.items.map((itemTokens, iIdx) => (
              <li key={iIdx} className="select-text">{renderInlineTokens(itemTokens)}</li>
            ))}
          </ul>
        );
      case 'ol':
        return (
          <ol
            key={idx}
            className="list-decimal pl-5 space-y-1 my-1 text-[15px] sm:text-[16px] leading-snug sm:leading-relaxed select-text"
          >
            {block.items.map((itemTokens, iIdx) => (
              <li key={iIdx} className="select-text">{renderInlineTokens(itemTokens)}</li>
            ))}
          </ol>
        );
      case 'blockquote':
        return (
          <blockquote
            key={idx}
            className="border-l-2 border-[#c59b47] pl-3 py-0.5 my-1.5 italic text-[#e6d5b8] bg-[#140e0c]/60 rounded-r select-text"
          >
            {renderInlineTokens(block.tokens)}
          </blockquote>
        );
      case 'paragraph':
      default:
        return (
          <p
            key={idx}
            className="leading-snug sm:leading-relaxed mb-1 last:mb-0 text-[16px] sm:text-[17px] select-text"
          >
            {renderInlineTokens(block.tokens)}
          </p>
        );
    }
  });
}

export const ChatMessageBubble = React.memo(function ChatMessageBubble(props: ChatMessageBubbleProps) {
  const {
    msg,
    hexAvatarUrl,
    argonAvatarMode = 'default',
    activeModelId = 'gemini-4-argon',
    isSending = false,
    speakingMsgId,
    loadingAudioMsgId,
    argonVoiceName = 'Orus',
    copiedMsgId,
    editingMsgId,
    editingMsgText = '',
    isThoughtsExpanded = false,
    isTokenPopoverOpen = false,
    staffAgents = [],
    weather = { tempF: 64, condition: 'Clear', hPa: 1013 },
    battery = { batteryPct: 100, chargingState: 'discharging' },
    fallbackFullPayloadTokens = 0,
    activeReactionPickerMsgId,
    onToggleReactionPicker,
    onToggleReaction,
    onCloseReactionPicker,
    onSpeak,
    onReply,
    onResend,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onEditChange,
    onCopy,
    onDelete,
    onToggleThoughts,
    onToggleTokenPopover,
    onNavigateToView,
    onOpenWhiteboard,
    onSetActiveGamesTab,
  } = props;

  const [reactionActor, setReactionActor] = React.useState<'Hex' | 'Argon'>('Hex');
  const [customEmojiInput, setCustomEmojiInput] = React.useState('');

  const isUser = msg.role === 'user';
  const segments = parseMessageSegments(msg.text);
  const userTz = props.userTimeZone || resolveUserLocationTimeZone(weather);
  const bubbleTimestamp = formatMessageBubbleTimestamp(msg.timestamp, {
    timezone: userTz,
    weather,
  });
  const msgTimeStr = bubbleTimestamp;

  const compactUserSubtitle = isUser
    ? msg.bubbleSubtitle ||
      buildBubbleTelemetrySubtitle({
        timestamp: msg.timestamp,
        tempF: weather.tempF,
        batteryPct: battery.batteryPct,
        telemetryHeader: msg.telemetryHeader,
        timezone: userTz,
      })
    : null;

  const tokenBadgeInfo = formatPerMessageTokenBadge({
    role: msg.role,
    text: msg.text,
    images: msg.images,
    tokenUsage: msg.tokenUsage,
    fallbackFullPayloadTokens,
  });

  // Render Emoji Reactions Tray (displays active reactions below message content)
  const renderReactionsTray = () => {
    const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
    if (reactions.length === 0 && activeReactionPickerMsgId !== msg.id) return null;

    return (
      <div
        data-testid="message-reactions-tray"
        className="flex flex-wrap items-center gap-1.5 mt-2 mb-1 px-0.5"
      >
        {reactions.map((reaction) => {
          const hasHex = reaction.users.some((u) => u.toLowerCase() === 'hex');
          const hasArgon = reaction.users.some((u) => u.toLowerCase() === 'argon');
          const usersList = reaction.users.join(', ');

          return (
            <button
              key={reaction.emoji}
              type="button"
              onClick={() => onToggleReaction?.(msg.id, reaction.emoji, 'Hex')}
              title={`${usersList} reacted with ${reaction.emoji} (tap to toggle Hex)`}
              className={`group inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all active:scale-95 cursor-pointer select-none border ${
                hasHex
                  ? 'bg-[#E6A8B5]/25 border-[#D4AF37] text-[#fff2db] shadow-[0_0_8px_rgba(212,175,55,0.35)] font-semibold'
                  : 'bg-[rgba(230,168,181,0.08)] border-[#E6A8B5]/30 text-stone-300 hover:border-[#D4AF37]/60 hover:bg-[#E6A8B5]/15'
              }`}
            >
              <span className="text-sm leading-none">{reaction.emoji}</span>
              <span className="text-[10px] font-mono leading-none">{reaction.users.length}</span>
              {hasArgon && (
                <span
                  title="Argon reacted"
                  className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] ring-1 ring-amber-300/60 inline-block ml-0.5"
                />
              )}
            </button>
          );
        })}

        {/* Quick '+' pill in reaction tray to open picker */}
        <button
          type="button"
          onClick={() => onToggleReactionPicker?.(msg.id)}
          aria-label="Add emoji reaction"
          title="Add emoji reaction"
          className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[11px] font-mono text-stone-400 hover:text-amber-200 border border-stone-700/60 hover:border-[#D4AF37]/60 bg-stone-900/60 hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <span className="leading-none">+</span>
          <Smile className="w-3 h-3 ml-0.5 opacity-80" />
        </button>
      </div>
    );
  };

  // Render Interactive Emoji Reaction Picker Popover
  const renderReactionPickerModal = () => {
    if (activeReactionPickerMsgId !== msg.id) return null;

    const quickEmojis = [
      '❤️', '🥺', '✨', '🔥', '🌹', '👑', '⚔️', '💜',
      '😂', '☕', '🙏🏻', '🫂', '🗡️', '🌙', '🗝️', '💀',
      '🍆', '🍑', '🍷', '🩸', '🖤', '👀', '💯', '🎉',
    ];

    return (
      <div
        data-testid="message-reaction-picker"
        onClick={(e) => e.stopPropagation()}
        className="relative z-30 mt-2 p-2.5 rounded-xl bg-[#181316]/95 backdrop-blur-md border border-[#D4AF37]/60 shadow-[0_8px_32px_rgba(0,0,0,0.85)] max-w-[340px] w-full animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header & Actor Switcher */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-1.5 text-xs text-[#f5e6c8] font-mono">
            <span className="text-[11px] text-stone-400">React as:</span>
            <button
              type="button"
              onClick={() => setReactionActor('Hex')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                reactionActor === 'Hex'
                  ? 'bg-[#E6A8B5]/30 text-[#fff0f3] border border-[#E6A8B5] shadow-[0_0_8px_rgba(230,168,181,0.4)]'
                  : 'text-stone-400 hover:text-stone-200 border border-transparent'
              }`}
            >
              🧝‍♀️ Hex
            </button>
            <button
              type="button"
              onClick={() => setReactionActor('Argon')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                reactionActor === 'Argon'
                  ? 'bg-[#D4AF37]/30 text-[#fff6db] border border-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                  : 'text-stone-400 hover:text-stone-200 border border-transparent'
              }`}
            >
              🗡️ Argon
            </button>
          </div>
          <button
            type="button"
            onClick={() => onCloseReactionPicker?.()}
            aria-label="Close reaction picker"
            className="text-stone-400 hover:text-stone-100 p-0.5 rounded cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Quick Reactions Palette */}
        <div className="grid grid-cols-8 gap-1.5 mb-2.5">
          {quickEmojis.map((emoji) => {
            const reactionObj = msg.reactions?.find((r) => r.emoji === emoji);
            const isActive = reactionObj?.users.some(
              (u) => u.toLowerCase() === reactionActor.toLowerCase()
            );
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onToggleReaction?.(msg.id, emoji, reactionActor);
                }}
                title={`React with ${emoji} as ${reactionActor}`}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all active:scale-90 cursor-pointer ${
                  isActive
                    ? 'bg-[#D4AF37]/35 border border-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.4)] scale-105'
                    : 'hover:bg-stone-800/80 hover:scale-110 border border-transparent'
                }`}
              >
                {emoji}
              </button>
            );
          })}
        </div>

        {/* Custom Emoji Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customEmojiInput.trim()) {
              onToggleReaction?.(msg.id, customEmojiInput.trim(), reactionActor);
              setCustomEmojiInput('');
            }
          }}
          className="flex items-center gap-1.5 pt-1.5 border-t border-[#D4AF37]/20"
        >
          <input
            type="text"
            value={customEmojiInput}
            onChange={(e) => setCustomEmojiInput(e.target.value)}
            placeholder="Type/paste any emoji..."
            className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-black/60 border border-stone-700/80 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#D4AF37]"
          />
          <button
            type="submit"
            disabled={!customEmojiInput.trim()}
            className="px-2.5 py-1 text-xs rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/60 text-[#f5e6c8] font-medium transition-colors disabled:opacity-40 cursor-pointer"
          >
            + React
          </button>
        </form>
      </div>
    );
  };

  // Render Token Usage Popover Modal
  const renderTokenPopoverModal = () => {
    if (!isTokenPopoverOpen) return null;
    const charCount = msg.text ? msg.text.length : 0;
    const bubbleTokens = estimateMessageTokens(msg.text, msg.images);
    const usage = msg.tokenUsage;
    const thoughtsTokens = usage?.thoughtTokens ?? 0;
    const isExact = Boolean(usage?.isExactApiCount);

    let promptTokens = 0;
    let candidateTokens = 0;

    if (isUser) {
      promptTokens =
        usage?.promptTokens && usage.promptTokens > 0
          ? usage.promptTokens
          : bubbleTokens;
      candidateTokens = usage?.outputTokens ?? 0;
    } else {
      candidateTokens =
        usage?.outputTokens && usage.outputTokens > 0
          ? usage.outputTokens
          : bubbleTokens;
      promptTokens =
        usage?.promptTokens && usage.promptTokens > 0
          ? usage.promptTokens
          : Math.max(0, fallbackFullPayloadTokens - candidateTokens);
    }

    const cachedTokens = usage?.cachedTokens ?? 0;
    const hasCacheHit = Boolean(usage?.cacheHit || cachedTokens > 0);
    const uncachedPrompt =
      usage?.uncachedPromptTokens ?? Math.max(0, promptTokens - cachedTokens);
    const cacheDiscountPct =
      usage?.cacheDiscountPercent ??
      (promptTokens > 0 && cachedTokens > 0
        ? Math.min(100, Math.round((cachedTokens / promptTokens) * 100))
        : 0);

    const turnTotal =
      usage?.totalTokens && usage.totalTokens > 0
        ? usage.totalTokens
        : promptTokens + candidateTokens + thoughtsTokens;

    const sessionTotal = fallbackFullPayloadTokens || promptTokens + candidateTokens;
    const maxLimit = 1048576; // 1M Gemini context window
    const pct = Math.min(100, Math.round((sessionTotal / maxLimit) * 100));
    const statusColor =
      sessionTotal > 500000
        ? 'bg-red-500'
        : sessionTotal > 150000
        ? 'bg-amber-500'
        : 'bg-emerald-400';
    const statusTextColor =
      sessionTotal > 500000
        ? 'text-red-300'
        : sessionTotal > 150000
        ? 'text-amber-300'
        : 'text-emerald-300';
    const statusBadgeLabel =
      sessionTotal > 500000
        ? '🔴 Heavy (> 500k)'
        : sessionTotal > 150000
        ? '🟡 Moderate (150k - 500k)'
        : '🟢 Healthy (< 150k)';

    return (
      <div
        data-testid="token-usage-popover-overlay"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs select-auto"
        onClick={(e) => {
          e.stopPropagation();
          onToggleTokenPopover?.(msg.id);
        }}
      >
        <div
          data-token-popover="true"
          data-testid="token-usage-popover"
          className="w-full max-w-[350px] sm:max-w-sm rounded-2xl bg-[#140e11]/98 border-2 border-[#d4af37] shadow-[0_12px_44px_rgba(0,0,0,0.95)] p-3.5 sm:p-4 text-[11px] font-mono text-[#ffe5a3] space-y-2.5 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#6b5331]/60">
            <div className="flex items-center gap-1.5 font-bold text-[#ffd700]">
              <span className="text-base leading-none">🪙</span>
              <span className="text-xs">Token & Cache Telemetry</span>
              <span className="text-[9px] font-normal px-1 py-0.5 rounded bg-[#2b1720] border border-[#6b5331]/50 text-[#e6c88c]">
                {isExact ? 'Exact Gemini API' : 'Estimated'}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleTokenPopover?.(msg.id);
              }}
              className="text-[#cbb693] hover:text-white min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer text-xs font-bold leading-none"
              aria-label="Close token popover"
            >
              ✕
            </button>
          </div>

          {/* Real Cache Telemetry Card */}
          {hasCacheHit ? (
            <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/60 shadow-[0_0_16px_rgba(16,185,129,0.2)] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  <span className="text-[11px] font-bold text-emerald-300 tracking-wide">
                    ⚡ CACHE HIT ({cacheDiscountPct}% Cached)
                  </span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/90 border border-emerald-500/50 text-emerald-200">
                  Implicit Cache Active
                </span>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-emerald-800/50 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-200/90">Cached Prefix Tokens:</span>
                  <span className="font-bold text-emerald-300 tabular-nums">
                    {cachedTokens.toLocaleString()} tok
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-200/90">Uncached (Fresh) Tokens:</span>
                  <span className="font-bold text-[#f5ead8] tabular-nums">
                    {uncachedPrompt.toLocaleString()} tok
                  </span>
                </div>
                <div className="flex justify-between items-center text-[9px] pt-1 border-t border-emerald-800/30 text-emerald-300">
                  <span className="font-semibold">Prompt Cost Reduction:</span>
                  <span className="font-bold">~{cacheDiscountPct}% discount (Google Implicit Cache)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-[#1b1216]/90 border border-[#855335]/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-stone-500" />
                  <span className="text-[11px] font-bold text-[#e6c88c] tracking-wide">
                    ⚪ CACHE MISS (0 tok cached)
                  </span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#2b1720] border border-[#6b5331]/50 text-[#cbb693]">
                  Standard Rate
                </span>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-[#6b5331]/30 text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-[#cbb693]">Fresh Input Billed at 100%:</span>
                  <span className="font-bold text-[#f5ead8] tabular-nums">
                    {promptTokens.toLocaleString()} tok
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#cbb693]">Cached Tokens:</span>
                  <span className="font-bold text-stone-400 tabular-nums">0 tok</span>
                </div>
                <div className="text-[9px] text-[#9e8664] pt-1 border-t border-[#6b5331]/30 leading-snug">
                  {promptTokens < 32768
                    ? `Prompt prefix (${promptTokens.toLocaleString()} tok) is under Google's 32k implicit cache threshold. Caching automatically triggers when static prefix reaches 32,768+ tokens.`
                    : `Prefix modified or not yet indexed by Google. Static prompt and frozen history prefix are preserved for future turns to hit cache.`}
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Specific Turn Tokens */}
          <div className="space-y-1.5 bg-[#0b0709]/80 p-2.5 rounded-lg border border-[#6b5331]/40">
            <div className="flex items-center justify-between text-[10px] text-[#bba382] font-semibold uppercase tracking-wider">
              <span>(1) Turn Message Tokens</span>
              <span className="text-[#f5ead8] font-normal normal-case">
                {isUser ? 'Hex (User Input)' : msg.staffSender ? `${msg.staffSender.name} (Staff)` : 'Argon (Model)'}
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[#cbb693]">Input / Prompt:</span>
              <span className="font-bold text-[#f5ead8] tabular-nums">
                {promptTokens.toLocaleString()} tok
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[#cbb693]">Output / Candidate:</span>
              <span className="font-bold text-[#f5ead8] tabular-nums">
                {candidateTokens.toLocaleString()} tok
              </span>
            </div>
            {thoughtsTokens > 0 && (
              <div className="flex justify-between text-[10px]">
                <span className="text-[#cbb693]">Thinking Budget:</span>
                <span className="font-bold text-amber-300 tabular-nums">
                  {thoughtsTokens.toLocaleString()} tok
                </span>
              </div>
            )}
            <div className="flex justify-between text-[10px] pt-1 border-t border-[#6b5331]/40">
              <span className="text-[#ffe5a3] font-bold">Turn Total:</span>
              <span className="font-bold text-[#ffd700] tabular-nums">
                {turnTotal.toLocaleString()} tok
              </span>
            </div>
            <div className="text-[9px] text-[#8e7a61] pt-0.5 flex justify-between">
              <span>Bubble Content:</span>
              <span>
                {bubbleTokens.toLocaleString()} tok ({charCount.toLocaleString()} chars)
              </span>
            </div>
          </div>

          {/* Section 2: Session Context Window */}
          <div className="space-y-1.5 bg-[#0b0709]/80 p-2.5 rounded-lg border border-[#6b5331]/40">
            <div className="flex items-center justify-between text-[10px] text-[#bba382] font-semibold uppercase tracking-wider">
              <span>(2) Session Context</span>
              <span className={`text-[10px] font-bold ${statusTextColor}`}>
                {statusBadgeLabel}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#cbb693]">Total Payload:</span>
              <span className="font-bold text-[#f5ead8] tabular-nums">
                {sessionTotal.toLocaleString()} / 1M tok
              </span>
            </div>

            {/* Status Progress Bar */}
            <div className="w-full bg-[#1f1519] h-2 rounded-full overflow-hidden border border-[#6b5331]/50">
              <div
                className={`h-full ${statusColor} transition-all duration-300`}
                style={{ width: `${Math.max(1, pct)}%` }}
              />
            </div>

            <div className="text-[9px] text-[#9e8664] flex justify-between pt-0.5">
              <span>Window Usage</span>
              <span className="font-bold text-[#e6c88c]">{pct}% used</span>
            </div>
          </div>

          <div className="text-center pt-0.5">
            <span className="text-[9px] text-[#8e7a61]">Tap outside or ✕ to close</span>
          </div>
        </div>
      </div>
    );
  };

  if (isUser) {
    return (
      <article
        id={`msg-${msg.id}`}
        className="flex items-start gap-2 w-full transition-all duration-300 rounded-xl"
      >
        {/* Hex Circular Avatar */}
        <div
          aria-hidden="true"
          className="w-10 h-10 sm:w-12 sm:h-12 overflow-hidden rounded-full border border-[#c59b47] shrink-0 mt-0.5 shadow-md bg-[#120d0f]"
        >
          {hexAvatarUrl ? (
            <img src={hexAvatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <img
              src="/assets/aistudio/image-0__96__dddb2843.png"
              alt=""
              className="avatar-crop-hex"
            />
          )}
        </div>

        <div className="bubble-smoked-glass px-3 py-2 sm:px-4 sm:py-2.5 max-w-[82%] sm:max-w-[78%] min-w-0">
          {/* Always-Visible Bubble Header with Local Timestamp */}
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-[#c59b47]/30 text-xs font-mono">
            <span className="text-[#ffe5a3] font-bold tracking-wide truncate">
              Hex
            </span>
            <span
              data-testid="message-bubble-timestamp"
              className="px-2 py-0.5 rounded-md bg-[#0b0709]/90 border border-[#c59b47]/60 text-[#ffe5a3] font-mono text-[11px] sm:text-xs font-bold tabular-nums tracking-tight shrink-0 whitespace-nowrap shadow-xs flex items-center gap-1"
            >
              <span>🕒</span>
              <span>{bubbleTimestamp}</span>
            </span>
          </div>

          {/* Quoted Reply Preview Block */}
          {msg.replyTo && (
            <div
              onClick={() => {
                const el = document.getElementById(`msg-${msg.replyTo?.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('ring-2', 'ring-amber-400');
                  setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 1800);
                }
              }}
              className="border-l-2 border-amber-500/70 bg-black/30 px-2.5 py-1 mb-1.5 rounded text-xs text-stone-300 cursor-pointer hover:bg-black/50 transition-colors"
            >
              <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                <span>↩️</span>
                <span>{msg.replyTo.senderName}</span>
                <span className="text-stone-500 text-[9px] font-normal">({msg.replyTo.timestamp})</span>
              </div>
              <div className="truncate text-stone-300 text-[11px]">
                {msg.replyTo.textSnippet}
              </div>
            </div>
          )}

          {/* Attached Media Items */}
          {msg.images && msg.images.length > 0 && (
            <div className="flex flex-col gap-2 mb-2">
              {msg.images.map((img, iIdx) => {
                const mime = resolveAttachmentMimeType(img.name || '', img.mimeType);

                if (isAudioAttachment(mime, img.name)) {
                  return (
                    <div
                      key={iIdx}
                      data-testid={`chat-audio-player-${msg.id}-${iIdx}`}
                      className="p-2.5 rounded-xl bg-[#140c10]/95 border border-[#c59b47]/70 space-y-1.5 shadow-md w-full max-w-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-[#ffe5a3] flex items-center gap-1.5 truncate">
                          <span>🎵</span>
                          <span className="truncate">{img.name || 'Audio Attachment'}</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#cbb693] shrink-0">
                          {img.size ? `${Math.round(img.size / 1024)} KB` : normalizeAudioMimeType(mime)}
                        </span>
                      </div>
                      <audio
                        controls
                        preload="metadata"
                        src={`data:${normalizeAudioMimeType(mime)};base64,${img.data}`}
                        className="w-full h-8 rounded-lg"
                      />
                      {img.description && (
                        <div className="text-[10px] font-mono text-[#e6c88c]">
                          💬 {img.description}
                        </div>
                      )}
                    </div>
                  );
                }

                if (isVideoAttachment(mime, img.name)) {
                  return (
                    <div
                      key={iIdx}
                      data-testid={`chat-video-player-${msg.id}-${iIdx}`}
                      className="p-2.5 rounded-xl bg-[#140c10]/95 border border-[#c59b47]/70 space-y-1.5 shadow-md w-full max-w-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-[#ffe5a3] flex items-center gap-1.5 truncate">
                          <span>🎬</span>
                          <span className="truncate">{img.name || 'Video Attachment'}</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#cbb693] shrink-0">
                          {img.size ? `${Math.round(img.size / 1024)} KB` : mime}
                        </span>
                      </div>
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        src={`data:${mime};base64,${img.data}`}
                        className="w-full max-h-60 rounded-lg border border-[#6b5331]/40 bg-black object-contain"
                      />
                      {img.description && (
                        <div className="text-[10px] font-mono text-[#e6c88c]">
                          💬 {img.description}
                        </div>
                      )}
                    </div>
                  );
                }

                if (isPdfAttachment(mime, img.name)) {
                  return (
                    <div
                      key={iIdx}
                      data-testid={`chat-pdf-doc-${msg.id}-${iIdx}`}
                      className="p-2.5 rounded-xl bg-[#180e12]/95 border border-[#8e6d3b]/70 flex items-center justify-between gap-2.5 shadow-md w-full max-w-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">📕</span>
                        <div className="min-w-0">
                          <div className="text-xs font-mono font-bold text-[#ffe5a3] truncate">
                            {img.name || 'Attached PDF Document'}
                          </div>
                          <div className="text-[10px] font-mono text-[#cbb693]">
                            PDF · {img.size ? `${Math.round(img.size / 1024)} KB` : 'Document'}
                          </div>
                        </div>
                      </div>
                      {img.data && (
                        <a
                          href={`data:application/pdf;base64,${img.data}`}
                          download={img.name || 'document.pdf'}
                          className="px-2 py-1 rounded bg-[#2b1d16] hover:bg-[#3d2920] border border-[#c59b47]/60 text-[10px] font-mono text-[#ffe5a3] shrink-0"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  );
                }

                if (img.textContent || isTextDocAttachment(mime, img.name)) {
                  return (
                    <div
                      key={iIdx}
                      data-testid={`chat-text-doc-${msg.id}-${iIdx}`}
                      className="p-2.5 rounded-xl bg-[#120b0e] border border-[#6b5331]/60 space-y-1.5 w-full max-w-md"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#ffe5a3]">
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{img.name?.endsWith('.json') ? '📊' : '📄'}</span>
                          <span className="font-bold truncate">{img.name || 'document.txt'}</span>
                        </span>
                        <span className="text-[10px] text-[#cbb693] shrink-0">
                          {img.textContent ? `${img.textContent.split('\n').length} lines` : ''}
                        </span>
                      </div>
                      {img.textContent && (
                        <pre className="p-2 rounded bg-[#070506] border border-[#6b5331]/40 text-[10px] font-mono text-[#f5ead8] max-h-36 overflow-y-auto whitespace-pre-wrap select-text">
                          {img.textContent.slice(0, 800)}
                        </pre>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={iIdx} className="space-y-1">
                    <img
                      src={`data:${mime};base64,${img.data}`}
                      alt={img.description || 'Uploaded image'}
                      className="max-h-60 rounded-xl border border-[#c59b47]/60 object-contain"
                    />
                    {img.description && (
                      <p className="text-[11px] font-mono text-[#d4b483]/90 italic">
                        💬 {img.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Voice audio note preview */}
          {msg.voiceAudio && (!msg.text || msg.text.startsWith('🎙️')) ? (
            <div className="text-[11px] font-mono text-[#e6c88c] italic">
              {msg.text || `🎙️ [Voice Note (${msg.voiceAudio.durationSec || 1}s)]`}
            </div>
          ) : editingMsgId === msg.id ? (
            <div className="space-y-1.5">
              <textarea
                aria-label="Edit user message"
                value={editingMsgText}
                onChange={(e) => onEditChange?.(e.target.value)}
                rows={2}
                className="w-full p-2 rounded-lg gilded-input-well text-xs sm:text-sm font-serif-webtoon text-[#f5ead8]"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onCancelEdit?.()}
                  className="px-2 py-0.5 rounded gilded-pill-btn text-[10px] font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onSaveEdit?.(msg.id)}
                  className="px-2.5 py-0.5 rounded gilded-send-btn text-[10px] font-mono cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="font-serif-webtoon text-[#f5ead8] break-words select-text">
              {segments.map((seg, sIdx) =>
                seg.type === 'code' ? (
                  <CodeCopyBlock key={sIdx} code={seg.content} language={seg.language} />
                ) : (
                  <div key={sIdx} className="space-y-1">
                    {renderFormattedText(seg.content)}
                  </div>
                )
              )}
            </div>
          )}

          {renderReactionsTray()}
          {renderReactionPickerModal()}

          {/* Bubble Footer */}
          <div className="mt-1 flex items-center justify-between gap-1.5">
            <div
              data-testid="user-bubble-subtitle"
              className="text-[10px] font-mono text-[#d4b483]/85 tabular-nums tracking-wide truncate flex items-center gap-1"
            >
              <span
                data-testid="message-token-counter"
                title={tokenBadgeInfo.tooltip}
                className="text-[#ffe5a3] font-semibold shrink-0"
              >
                {tokenBadgeInfo.label}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{compactUserSubtitle}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onToggleReactionPicker?.(msg.id)}
                aria-label="Add reaction"
                title="Add emoji reaction"
                className={`px-1.5 py-0.5 rounded border text-[10px] font-mono cursor-pointer transition-colors flex items-center gap-0.5 ${
                  activeReactionPickerMsgId === msg.id
                    ? 'bg-[#E6A8B5]/30 border-[#E6A8B5] text-[#fff0f3]'
                    : 'bg-[#1d1412]/80 hover:bg-[#2e201b] border-[#c59b47]/40 text-[#e6c88c]'
                }`}
              >
                <Smile className="w-3 h-3" />
                <span>+</span>
              </button>

              <div className="relative">
                {(() => {
                  const isCacheHit = Boolean(
                    msg.tokenUsage?.cacheHit ||
                      (msg.tokenUsage?.cachedTokens && msg.tokenUsage.cachedTokens > 0)
                  );
                  return (
                    <button
                      type="button"
                      data-token-popover-toggle="true"
                      data-testid="token-popover-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTokenPopover?.(msg.id);
                      }}
                      aria-label={`Token usage breakdown${isCacheHit ? ' (Cache Hit)' : ''}`}
                      title={`Token usage breakdown${isCacheHit ? ' (Cache Hit: ' + msg.tokenUsage?.cachedTokens?.toLocaleString() + ' tok)' : ''}`}
                      className={`px-1.5 py-0.5 rounded border text-[10px] font-mono cursor-pointer transition-colors flex items-center gap-0.5 ${
                        isTokenPopoverOpen
                          ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                          : isCacheHit
                          ? 'bg-emerald-950/70 hover:bg-emerald-900/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                          : 'bg-[#1d1412]/80 hover:bg-[#2e201b] border-[#c59b47]/40 text-[#e6c88c]'
                      }`}
                    >
                      <span>🪙</span>
                      {isCacheHit && (
                        <span className="text-[9px] font-bold text-emerald-400 leading-none">⚡</span>
                      )}
                    </button>
                  );
                })()}
                {renderTokenPopoverModal()}
              </div>

              <button
                type="button"
                onClick={() => onReply?.(msg)}
                aria-label="Reply to message"
                title="Reply to Hex's message"
                className="text-[10px] text-stone-400 hover:text-amber-300 px-1.5 py-0.5 rounded bg-stone-900/50 border border-stone-800/70 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>↩️ Reply</span>
              </button>

              <button
                type="button"
                onClick={() => onResend?.(msg)}
                disabled={isSending}
                aria-label="Resend message"
                title="Resend message to Argon"
                className="px-1.5 py-0.5 rounded bg-[#2a1d15]/90 hover:bg-[#3b281d] border border-[#c59b47]/60 text-[10px] font-mono text-[#e6c88c] disabled:opacity-40 cursor-pointer"
              >
                ↻ Resend
              </button>

              <button
                type="button"
                onClick={() => onStartEdit?.(msg)}
                aria-label="Edit message"
                title="Edit message"
                className="px-1.5 py-0.5 rounded bg-[#1d1412]/80 hover:bg-[#2e201b] border border-[#c59b47]/40 text-[10px] font-mono text-[#e6c88c] cursor-pointer"
              >
                ✎
              </button>

              <button
                type="button"
                onClick={() => onCopy?.(msg.id, msg.text)}
                aria-label="Copy message"
                title="Copy message"
                className="px-1.5 py-0.5 rounded bg-[#1d1412]/80 hover:bg-[#2e201b] border border-[#c59b47]/40 text-[10px] font-mono text-[#e6c88c] cursor-pointer"
              >
                {copiedMsgId === msg.id ? '✓' : '⧉'}
              </button>

              <button
                type="button"
                onClick={() => onDelete?.(msg.id)}
                aria-label="Delete message"
                title="Delete message"
                className="px-1.5 py-0.5 rounded bg-[#1d1412]/80 hover:bg-red-950/80 border border-[#c59b47]/40 text-[10px] font-mono text-[#e6c88c] cursor-pointer"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Model / Staff Article
  return (
    <article
      id={`msg-${msg.id}`}
      className={`flex items-start justify-end gap-2 w-full transition-all duration-300 rounded-xl ${
        msg.id === 'argon-boot-1' ? 'mb-16 sm:mb-24' : ''
      }`}
    >
      <div className="bubble-smoked-glass px-3 py-2 sm:px-4 sm:py-2.5 max-w-[82%] sm:max-w-[78%] min-w-0">
        {/* Always-Visible Bubble Header with Local Timestamp */}
        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-[#c59b47]/30 text-xs font-mono">
          <span className="text-[#ffd700] font-bold tracking-wide truncate flex items-center gap-1.5">
            {msg.staffSender ? (
              <span className="text-[#e6c88c] truncate">
                🐾 {msg.staffSender.name} <span className="text-[#cbb693]/75 font-normal">({msg.staffSender.jobTitle})</span>
              </span>
            ) : (
              <span>Argon</span>
            )}
            {msg.isAmbientCameo && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#241712] border border-[#a67c38]/70 text-[#ffd700] text-[9px] font-semibold">
                Cameo
              </span>
            )}
          </span>
          <span
            data-testid="message-bubble-timestamp"
            className="px-2 py-0.5 rounded-md bg-[#0b0709]/90 border border-[#c59b47]/60 text-[#ffd700] font-mono text-[11px] sm:text-xs font-bold tabular-nums tracking-tight shrink-0 whitespace-nowrap shadow-xs flex items-center gap-1"
          >
            <span>🕒</span>
            <span>{bubbleTimestamp}</span>
          </span>
        </div>

        {/* Quoted Reply Preview Block */}
        {msg.replyTo && (
          <div
            onClick={() => {
              const el = document.getElementById(`msg-${msg.replyTo?.id}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-amber-400');
                setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 1800);
              }
            }}
            className="border-l-2 border-amber-500/70 bg-black/30 px-2.5 py-1 mb-1.5 rounded text-xs text-stone-300 cursor-pointer hover:bg-black/50 transition-colors"
          >
            <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
              <span>↩️</span>
              <span>{msg.replyTo.senderName}</span>
              <span className="text-stone-500 text-[9px] font-normal">({msg.replyTo.timestamp})</span>
            </div>
            <div className="truncate text-stone-300 text-[11px]">
              {msg.replyTo.textSnippet}
            </div>
          </div>
        )}

        {/* Optional Tool Badges */}
        {msg.toolBadges && msg.toolBadges.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {msg.toolBadges.map((badge, bIdx) => (
              <button
                key={bIdx}
                type="button"
                onClick={() => {
                  if (
                    badge.tool === 'write_argon_book_entry' ||
                    badge.tool === 'write_argon_journal' ||
                    badge.tool === 'compress_argon_journal' ||
                    badge.tool === 'edit_argon_memory' ||
                    badge.tool === 'delete_argon_memory' ||
                    badge.tool === 'read_journals'
                  ) {
                    onNavigateToView?.('journals');
                  } else if (badge.tool === 'draw_on_whiteboard') {
                    onOpenWhiteboard?.();
                  } else if (badge.tool === 'play_occult_game') {
                    if (
                      badge.gameTab === 'ouija' ||
                      badge.gameTab === 'ghost_chat' ||
                      badge.gameTab === 'fortune'
                    ) {
                      onSetActiveGamesTab?.(badge.gameTab);
                    }
                    onNavigateToView?.('games_chest');
                  } else if (badge.filename) {
                    onNavigateToView?.('lorebook_editor', badge.filename);
                  } else {
                    onNavigateToView?.('lorebook_list');
                  }
                }}
                className="px-2 py-0.5 rounded-full gilded-pill-btn text-[10px] font-mono cursor-pointer"
              >
                {badge.label}
              </button>
            ))}
          </div>
        )}

        {/* Native Reasoning Drawer */}
        {msg.nativeReasoning && (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => onToggleThoughts?.(msg.id)}
              className="w-full text-left px-2 py-1 rounded bg-[#1e131b] hover:bg-[#2c1c28] border border-[#a88243]/50 text-[10px] font-mono text-[#ffe5a3] flex items-center justify-between cursor-pointer transition-colors shadow-sm"
            >
              <span className="flex items-center gap-1.5 truncate">
                <span>🧠</span>
                <span className="font-bold">
                  Native Reasoning {msg.thoughtTokens ? `(${msg.thoughtTokens} billed tokens)` : ''}
                </span>
              </span>
              <span className="text-[9px] text-[#cbb693]">
                {isThoughtsExpanded ? '▲ Hide' : '▼ Inspect'}
              </span>
            </button>
            {isThoughtsExpanded && (
              <div className="mt-1 p-2 rounded-lg bg-[#0d070a] border border-[#785b30]/60 text-[11px] font-mono text-[#ecd9bc] leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap select-text animate-in fade-in duration-150">
                {msg.nativeReasoning}
              </div>
            )}
          </div>
        )}

        <div className="font-serif-webtoon text-[#f5ead8] break-words select-text">
          {segments.map((seg, sIdx) =>
            seg.type === 'code' ? (
              <CodeCopyBlock key={sIdx} code={seg.content} language={seg.language} />
            ) : (
              <div key={sIdx} className="space-y-1">
                {renderFormattedText(seg.content)}
              </div>
            )
          )}
        </div>

        {renderReactionsTray()}
        {renderReactionPickerModal()}

        {/* Argon / Staff Bubble Footer */}
        <div className="mt-1 flex items-center justify-between gap-1.5 text-[10px] font-mono text-[#d4b483]/85 tabular-nums">
          <span className="truncate flex items-center gap-1">
            <span
              data-testid="message-token-counter"
              title={tokenBadgeInfo.tooltip}
              className="text-[#ffe5a3] font-semibold shrink-0"
            >
              {tokenBadgeInfo.label}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate" data-testid="hardware-stamp-footer">
              {msg.staffSender ? (
                `${msgTimeStr} · ${msg.staffSender.name} (${msg.staffSender.jobTitle})`
              ) : (
                <>
                  ⚡ {msg.routedModel || (activeModelId === 'gemini-4-argon' ? 'gemini-4-argon' : activeModelId)} · 🧠 {msg.thinkingUsed || (msg.thinkingBudgetUsed !== undefined ? (msg.thinkingBudgetUsed <= 1024 ? 'LOW' : msg.thinkingBudgetUsed <= 2048 ? 'MEDIUM' : 'HIGH') : 'MEDIUM')} · 🕒 {msg.completedAt || msgTimeStr}
                </>
              )}
            </span>
          </span>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onToggleReactionPicker?.(msg.id)}
              aria-label="Add reaction"
              title="Add emoji reaction"
              className={`px-1.5 py-0.5 rounded border text-[10px] font-mono cursor-pointer transition-colors flex items-center gap-0.5 shrink-0 ${
                activeReactionPickerMsgId === msg.id
                  ? 'bg-[#D4AF37]/30 border-[#D4AF37] text-[#fff6db]'
                  : 'bg-[#1d1412]/80 hover:bg-[#2e201b] border-[#c59b47]/40 text-[#e6c88c]'
              }`}
            >
              <Smile className="w-3 h-3" />
              <span>+</span>
            </button>

            <button
              type="button"
              onClick={() => onReply?.(msg)}
              aria-label="Reply to message"
              title={`Reply to ${msg.staffSender ? msg.staffSender.name : 'Argon'}`}
              className="text-[10px] text-stone-400 hover:text-amber-300 px-1.5 py-0.5 rounded bg-stone-900/50 border border-stone-800/70 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>↩️ Reply</span>
            </button>

            <button
              type="button"
              data-testid="argon-listen-tts-btn"
              onClick={() => onSpeak?.(msg)}
              aria-label={
                speakingMsgId === msg.id ? 'Stop Argon Audio' : 'Listen to Argon (gemini-3.8-flash-tts)'
              }
              title={
                speakingMsgId === msg.id
                  ? 'Stop Argon Audio'
                  : `🔊 Listen with gemini-3.8-flash-tts (${argonVoiceName})`
              }
              className={`px-2 py-0.5 rounded border text-[10px] font-mono cursor-pointer shrink-0 flex items-center gap-1 ${
                speakingMsgId === msg.id
                  ? 'bg-amber-500/30 border-amber-300 text-amber-100'
                  : 'bg-[#1d1412]/80 hover:bg-[#2e201b] border-[#c59b47]/40 text-[#e6c88c]'
              }`}
            >
              <span>
                {loadingAudioMsgId === msg.id
                  ? '⏳'
                  : speakingMsgId === msg.id
                  ? '⏹ Stop'
                  : '🔊 Listen'}
              </span>
            </button>

            <div className="relative">
              {(() => {
                const isCacheHit = Boolean(
                  msg.tokenUsage?.cacheHit ||
                    (msg.tokenUsage?.cachedTokens && msg.tokenUsage.cachedTokens > 0)
                );
                return (
                  <button
                    type="button"
                    data-token-popover-toggle="true"
                    data-testid="token-popover-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTokenPopover?.(msg.id);
                    }}
                    aria-label={`Token usage breakdown${isCacheHit ? ' (Cache Hit)' : ''}`}
                    title={`Token usage breakdown${isCacheHit ? ' (Cache Hit: ' + msg.tokenUsage?.cachedTokens?.toLocaleString() + ' tok)' : ''}`}
                    className={`px-1.5 py-0.5 rounded border text-[10px] font-mono cursor-pointer shrink-0 transition-colors flex items-center gap-0.5 ${
                      isTokenPopoverOpen
                        ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                        : isCacheHit
                        ? 'bg-emerald-950/70 hover:bg-emerald-900/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                        : 'bg-[#1d1412]/80 hover:bg-[#2e201b] border-[#c59b47]/40 text-[#e6c88c]'
                    }`}
                  >
                    <span>🪙</span>
                    {isCacheHit && (
                      <span className="text-[9px] font-bold text-emerald-400 leading-none">⚡</span>
                    )}
                  </button>
                );
              })()}
              {renderTokenPopoverModal()}
            </div>

            <button
              type="button"
              onClick={() => onCopy?.(msg.id, msg.text)}
              aria-label="Copy message"
              title="Copy message"
              className="px-1.5 py-0.5 rounded bg-[#1d1412]/80 hover:bg-[#2e201b] border border-[#c59b47]/40 text-[10px] font-mono text-[#e6c88c] cursor-pointer shrink-0"
            >
              {copiedMsgId === msg.id ? '✓' : '⧉'}
            </button>

            <button
              type="button"
              onClick={() => onDelete?.(msg.id)}
              aria-label="Delete message"
              title="Delete message"
              className="px-1.5 py-0.5 rounded bg-[#1d1412]/80 hover:bg-red-950/80 border border-[#c59b47]/40 text-[10px] font-mono text-[#e6c88c] cursor-pointer shrink-0"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* Right Avatar */}
      {msg.staffSender ? (
        <div
          aria-hidden="true"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#e6c88c] shrink-0 mt-0.5 shadow-md bg-[#231710] flex flex-col items-center justify-center overflow-hidden"
        >
          {(() => {
            const matchedAgent = staffAgents.find(
              (a) =>
                a.name.toLowerCase() === msg.staffSender?.name.toLowerCase() ||
                a.id.toLowerCase() === msg.staffSender?.name.toLowerCase()
            );

            const directUrl = msg.staffSender.avatarUrl;
            if (
              directUrl &&
              (directUrl.startsWith('data:image/') ||
                directUrl.startsWith('http') ||
                directUrl.startsWith('/'))
            ) {
              return (
                <img
                  src={directUrl}
                  alt={msg.staffSender.name}
                  className="w-full h-full object-cover"
                />
              );
            }

            if (
              matchedAgent?.avatarPreset &&
              (matchedAgent.avatarPreset.startsWith('data:image/') ||
                matchedAgent.avatarPreset.startsWith('http') ||
                matchedAgent.avatarPreset.startsWith('/'))
            ) {
              return (
                <img
                  src={matchedAgent.avatarPreset}
                  alt={msg.staffSender.name}
                  className="w-full h-full object-cover"
                />
              );
            }

            try {
              const repo = loadAvatarRepository();
              const repoItem = repo.find(
                (item) =>
                  (matchedAgent && item.entityKey === matchedAgent.id) ||
                  item.entityKey.toLowerCase() === msg.staffSender?.name.toLowerCase() ||
                  item.entityName.toLowerCase() === msg.staffSender?.name.toLowerCase() ||
                  (msg.staffSender?.name.toLowerCase().includes('haiku') &&
                    (item.entityKey.toLowerCase().includes('haiku') ||
                      item.entityName.toLowerCase().includes('haiku')))
              );
              if (repoItem?.dataUrl) {
                return (
                  <img
                    src={repoItem.dataUrl}
                    alt={msg.staffSender.name}
                    className="w-full h-full object-cover"
                  />
                );
              }
            } catch {}

            if (msg.staffSender.name.toLowerCase().includes('haiku')) {
              return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#29170e] text-amber-200 select-none shadow-inner">
                  <span className="text-xl sm:text-2xl leading-none">🐶</span>
                  <span className="text-[7.5px] font-mono font-bold text-amber-300 leading-none mt-0.5 tracking-tight">
                    HAIKU
                  </span>
                </div>
              );
            }

            if (msg.staffSender.name.toLowerCase().includes('monkey')) {
              return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#181524] text-amber-200 select-none shadow-inner">
                  <span className="text-xl sm:text-2xl leading-none">🐒</span>
                  <span className="text-[7.5px] font-mono font-bold text-amber-300 leading-none mt-0.5 tracking-tight">
                    MONKEY
                  </span>
                </div>
              );
            }

            const preset = matchedAgent?.avatarPreset
              ? STAFF_AVATAR_PRESETS.find((p) => p.id === matchedAgent.avatarPreset)
              : null;
            if (preset) {
              return (
                <ApothecaryIcon
                  xPct={preset.xPct}
                  yPct={preset.yPct}
                  icon="staffStatusActive"
                  size={34}
                  title={msg.staffSender.name}
                />
              );
            }

            return (
              <div className="w-full h-full flex items-center justify-center bg-[#24171d] text-amber-200 font-bold font-serif text-sm">
                {msg.staffSender.name.slice(0, 2).toUpperCase()}
              </div>
            );
          })()}
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="w-10 h-10 sm:w-12 sm:h-12 overflow-hidden rounded-full border border-[#c59b47] shrink-0 mt-0.5 shadow-md bg-[#120d0f] flex items-center justify-center"
        >
          {(() => {
            if (
              argonAvatarMode &&
              (argonAvatarMode.startsWith('data:image/') ||
                argonAvatarMode.startsWith('http') ||
                argonAvatarMode.startsWith('/'))
            ) {
              return (
                <img src={argonAvatarMode} alt="Argon" className="w-full h-full object-cover" />
              );
            }

            const slicedStickerUrl = getSlicedStickerDataUrl(argonAvatarMode);
            if (slicedStickerUrl) {
              return (
                <img
                  src={slicedStickerUrl}
                  alt="Argon"
                  className="w-full h-full object-cover"
                />
              );
            }

            try {
              const repo = loadAvatarRepository();
              const repoArgon = repo.find(
                (item) => item.entityKey === 'argon' || item.entityName.toLowerCase() === 'argon'
              );
              if (repoArgon?.dataUrl) {
                return (
                  <img src={repoArgon.dataUrl} alt="Argon" className="w-full h-full object-cover" />
                );
              }
            } catch {}

            const activeSticker = getStickerByShortcode(argonAvatarMode);
            if (activeSticker) {
              return (
                <ArgonSticker
                  row={activeSticker.row}
                  col={activeSticker.col}
                  shortcode={activeSticker.shortcode}
                  size={44}
                />
              );
            }

            return (
              <img
                src="/assets/aistudio/image-0__96__dddb2843.png"
                alt="Argon"
                className={
                  argonAvatarMode === 'taxidermy_fox' ? 'avatar-crop-fox' : 'avatar-crop-argon'
                }
              />
            );
          })()}
        </div>
      )}
    </article>
  );
});

export default ChatMessageBubble;

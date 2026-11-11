import React, { useState, useEffect, useRef } from 'react';
import {
  ArgonAvatarMode,
  STORAGE_KEYS,
  getStickerByShortcode,
} from '../utils/workbenchLogic';
import { ArgonSticker } from './ArgonSticker';

export interface ArgonRoomCompanionBarProps {
  isVisible?: boolean;
  roomTitle: string;
  argonAvatarMode: ArgonAvatarMode;
  argonAvatarDataUrl: string | null;
  stickerSheetDataUrl?: string | null;
  latestReactionText: string;
  isLoading: boolean;
  onSendMessageInRoom: (text: string, includeRoomSnapshot?: boolean) => void;
  onSnapRoomForArgon: () => void;
  onSnapTargetElement?: (targetMode: 'full_screen' | 'scratchpad' | 'active_modal' | 'chat') => void;
  onReturnToChat?: () => void;
}

interface EyePosition {
  x: number;
  y: number;
}

const EYE_SIZE = 48;

function getViewportBounds(): { vw: number; vh: number; maxX: number; maxY: number } {
  if (typeof window === 'undefined') {
    return { vw: 360, vh: 640, maxX: 304, maxY: 584 };
  }
  const vw = Math.max(320, window.visualViewport?.width || window.innerWidth || 360);
  const vh = Math.max(400, window.visualViewport?.height || window.innerHeight || 640);
  const maxX = Math.max(8, Math.round(vw - EYE_SIZE - 8));
  const maxY = Math.max(8, Math.round(vh - EYE_SIZE - 8));
  return { vw, vh, maxX, maxY };
}

function loadSavedEyePosition(): EyePosition {
  const { vw, vh, maxX, maxY } = getViewportBounds();
  const minY = 68; // strictly below top-right header status pills
  if (typeof window === 'undefined') return { x: 16, y: 160 };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FLOATING_EYE_POS);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<EyePosition>;
      if (
        typeof parsed.x === 'number' &&
        Number.isFinite(parsed.x) &&
        typeof parsed.y === 'number' &&
        Number.isFinite(parsed.y)
      ) {
        return {
          x: Math.max(8, Math.min(maxX, Math.round(parsed.x))),
          y: Math.max(minY, Math.min(maxY, Math.round(parsed.y))),
        };
      }
    }
  } catch {
    // ignore
  }
  const defaultX = Math.max(12, Math.min(maxX, vw - EYE_SIZE - 12));
  // Default positioned in the lower-right quadrant above bottom dock
  const defaultY = Math.max(minY, Math.min(maxY, Math.round(vh - EYE_SIZE - 96)));
  return { x: defaultX, y: defaultY };
}

export const ArgonRoomCompanionBar: React.FC<ArgonRoomCompanionBarProps> = ({
  isVisible = true,
  roomTitle,
  argonAvatarMode,
  argonAvatarDataUrl,
  latestReactionText,
  isLoading,
  onSendMessageInRoom,
  onSnapRoomForArgon,
  onSnapTargetElement,
  onReturnToChat,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [pos, setPos] = useState<EyePosition>(() => loadSavedEyePosition());
  const [eyeColorTheme, setEyeColorTheme] = useState<'gold' | 'rose' | 'crimson'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EYE_COLOR_THEME);
      if (saved === 'gold' || saved === 'rose' || saved === 'crimson') return saved;
    } catch {
      // ignore
    }
    return 'gold';
  });

  const handleSetEyeColorTheme = (t: 'gold' | 'rose' | 'crimson') => {
    setEyeColorTheme(t);
    try {
      localStorage.setItem(STORAGE_KEYS.EYE_COLOR_THEME, t);
    } catch {
      // ignore
    }
  };

  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    isPointerDown: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  }>({
    isPointerDown: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });

  const [isEyePulsingGold, setIsEyePulsingGold] = useState(false);

  useEffect(() => {
    const handleEyeBlink = () => {
      setIsEyePulsingGold(true);
      window.setTimeout(() => setIsEyePulsingGold(false), 1400);
    };
    window.addEventListener('argon-eye-blink', handleEyeBlink);
    return () => window.removeEventListener('argon-eye-blink', handleEyeBlink);
  }, []);

  // Clamp inside viewport on window / visualViewport resize
  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => {
        const { maxX, maxY } = getViewportBounds();
        return {
          x: Math.max(8, Math.min(maxX, prev.x)),
          y: Math.max(8, Math.min(maxY, prev.y)),
        };
      });
    };
    window.addEventListener('resize', handleResize, { passive: true });
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  // Collapse popover immediately when tapping outside
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsidePointerDown = (e: PointerEvent | MouseEvent) => {
      const rootEl = rootRef.current;
      if (rootEl && !rootEl.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
    };
  }, [isOpen]);

  if (isVisible === false) return null;

  const activeSticker = getStickerByShortcode(argonAvatarMode);

  const savePosition = (nextPos: EyePosition) => {
    try {
      localStorage.setItem(STORAGE_KEYS.FLOATING_EYE_POS, JSON.stringify(nextPos));
    } catch {
      // ignore
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    dragStateRef.current = {
      isPointerDown: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragStateRef.current;
    if (!st.isPointerDown) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (Math.hypot(dx, dy) > 6) {
      st.moved = true;
    }
    if (st.moved) {
      const maxX = Math.max(8, window.innerWidth - EYE_SIZE - 8);
      const maxY = Math.max(8, window.innerHeight - EYE_SIZE - 8);
      const minY = 68; // strictly below top-right header status pills
      const nextX = Math.max(8, Math.min(maxX, Math.round(st.originX + dx)));
      const nextY = Math.max(minY, Math.min(maxY, Math.round(st.originY + dy)));
      const nextPos = { x: nextX, y: nextY };
      setPos(nextPos);
      savePosition(nextPos);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragStateRef.current;
    if (!st.isPointerDown) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const wasDragged = st.moved;
    dragStateRef.current.isPointerDown = false;
    dragStateRef.current.pointerId = null;

    if (!wasDragged) {
      setIsOpen((prev) => !prev);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickInput.trim();
    if (!trimmed || isLoading) return;
    setQuickInput('');
    onSendMessageInRoom(trimmed, true);
    setIsOpen(false);
  };

  // Position the compact popover near the floating eye without clipping off screen
  const vw = typeof window !== 'undefined' ? window.innerWidth : 360;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 640;
  const openAbove = pos.y > vh / 2;
  const alignRight = pos.x > vw / 2;

  return (
    <div
      ref={rootRef}
      data-testid="argon-floating-eye-root"
      style={{
        position: 'fixed',
        zIndex: 9999,
        left: `${pos.x}px`,
        top: `${pos.y}px`,
      }}
      className="fixed z-[9999] select-none"
    >
      {/* Compact 48px × 48px Draggable Floating Circular Eye Button */}
      <button
        type="button"
        data-testid="argon-floating-eye-btn"
        aria-label={
          isOpen
            ? "Collapse Argon's Eye Menu"
            : "Open Argon's Eye Room Menu (Drag to move)"
        }
        aria-expanded={isOpen}
        title="Drag to move anywhere · Tap to open Argon's Room Eye"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          width: `${EYE_SIZE}px`,
          height: `${EYE_SIZE}px`,
          borderRadius: '50%',
          touchAction: 'none',
        }}
        className={`w-12 h-12 rounded-full border-2 cursor-grab active:cursor-grabbing relative transition-all duration-300 active:scale-95 flex items-center justify-center ${
          eyeColorTheme === 'crimson'
            ? 'border-rose-300 bg-[#be123c] hover:bg-[#e11d48] shadow-[0_4px_18px_rgba(190,18,60,0.65),inset_0_0_8px_rgba(255,200,220,0.35)]'
            : eyeColorTheme === 'rose'
            ? 'border-[#E6A8B5] bg-[#1d1217]/95 hover:bg-[#281820] shadow-[0_4px_18px_rgba(230,168,181,0.4),inset_0_0_8px_rgba(230,168,181,0.25)]'
            : 'border-[#D4AF37] bg-[#181316]/95 hover:bg-[#251d22] shadow-[0_4px_18px_rgba(212,175,55,0.45),inset_0_0_8px_rgba(230,168,181,0.2)]'
        } ${
          isEyePulsingGold ? 'ring-4 ring-amber-400 bg-amber-400/40 scale-125 shadow-[0_0_35px_#f5d061]' : ''
        }`}
      >
        {/* Antique Brass & Glowing Eye SVG */}
        <svg
          viewBox="0 0 48 48"
          className="w-8 h-8 pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="eyeIrisGradGold" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff2d1" />
              <stop offset="45%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#6e4c0d" />
            </radialGradient>
            <radialGradient id="eyeIrisGradRose" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffe6ec" />
              <stop offset="45%" stopColor="#e6a8b5" />
              <stop offset="100%" stopColor="#6e2d3e" />
            </radialGradient>
            <radialGradient id="eyeIrisGradCrimson" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff4d6d" />
              <stop offset="55%" stopColor="#c9184a" />
              <stop offset="100%" stopColor="#590d22" />
            </radialGradient>
          </defs>
          {/* Outer eye contour */}
          <path
            d="M4 24 C12 11, 36 11, 44 24 C36 37, 12 37, 4 24 Z"
            fill="#120c0e"
            stroke={
              eyeColorTheme === 'crimson'
                ? '#ffe5a3'
                : eyeColorTheme === 'rose'
                ? '#ffd6de'
                : '#ffe5a3'
            }
            strokeWidth="2.4"
          />
          {/* Iris */}
          <circle
            cx="24"
            cy="24"
            r="8.5"
            fill={
              eyeColorTheme === 'crimson'
                ? 'url(#eyeIrisGradCrimson)'
                : eyeColorTheme === 'rose'
                ? 'url(#eyeIrisGradRose)'
                : 'url(#eyeIrisGradGold)'
            }
            stroke={
              eyeColorTheme === 'crimson'
                ? '#ffb703'
                : eyeColorTheme === 'rose'
                ? '#f4b8c5'
                : '#f6d582'
            }
            strokeWidth="1.2"
          />
          {/* Vertical slit pupil */}
          <ellipse cx="24" cy="24" rx="2.3" ry="6.2" fill="#090305" />
          {/* Specular highlight */}
          <circle cx="21" cy="20.5" r="1.8" fill="#fff3db" opacity="0.9" />
        </svg>

        {/* Live status dot */}
        <span
          className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border border-[#120c0e] pointer-events-none ${
            isLoading
              ? 'bg-amber-400 animate-ping'
              : eyeColorTheme === 'crimson'
              ? 'bg-rose-500'
              : eyeColorTheme === 'rose'
              ? 'bg-[#E6A8B5]'
              : 'bg-[#D4AF37]'
          }`}
        />
      </button>

      {/* Compact Popover Menu (ONLY shown when tapped, collapses immediately on re-tap or outside tap) */}
      {isOpen && (
        <aside
          data-testid="argon-room-companion-bar"
          aria-label="Argon's Presence in Room"
          style={{
            position: 'absolute',
            zIndex: 35,
            ...(openAbove ? { bottom: '56px' } : { top: '56px' }),
            ...(alignRight ? { right: '0px' } : { left: '0px' }),
          }}
          className={`w-[290px] sm:w-[330px] rounded-2xl p-3 space-y-2.5 z-[35] backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.95)] ${
            eyeColorTheme === 'crimson'
              ? 'border-2 border-rose-500/80 bg-[#120c0e]/95'
              : 'border border-[#D4AF37]/60 bg-[#161215]/95'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#6b5331]/60 pb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full border border-[#e6c88c] bg-[#1d1417] overflow-hidden shrink-0 flex items-center justify-center">
                {activeSticker ? (
                  <ArgonSticker
                    row={activeSticker.row}
                    col={activeSticker.col}
                    shortcode={activeSticker.shortcode}
                    size={26}
                  />
                ) : argonAvatarDataUrl ? (
                  <img
                    src={argonAvatarDataUrl}
                    alt="Argon"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs">🖤</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-bold text-[#ffe5a3] truncate">
                  👁️ Argon&apos;s Eye
                </div>
                <div
                  data-testid="argon-companion-room-badge"
                  className="text-[9px] font-mono text-[#cbb693] truncate"
                >
                  📍 {roomTitle}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Eye Color Theme Switcher */}
              <div
                className="flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded-full border border-stone-800"
                title="Change Eye Color Theme"
              >
                <button
                  type="button"
                  onClick={() => handleSetEyeColorTheme('gold')}
                  aria-label="Gold Eye"
                  title="Gilded Champagne Gold (Default)"
                  className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform ${
                    eyeColorTheme === 'gold'
                      ? 'border border-amber-300 scale-125 bg-[#D4AF37] ring-1 ring-amber-400/80 shadow-[0_0_6px_#D4AF37]'
                      : 'border border-stone-700 bg-[#7a5814] opacity-50 hover:opacity-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleSetEyeColorTheme('rose')}
                  aria-label="Rose Eye"
                  title="Pearlescent Rose"
                  className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform ${
                    eyeColorTheme === 'rose'
                      ? 'border border-rose-300 scale-125 bg-[#E6A8B5] ring-1 ring-rose-400/80 shadow-[0_0_6px_#E6A8B5]'
                      : 'border border-stone-700 bg-[#7a4854] opacity-50 hover:opacity-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleSetEyeColorTheme('crimson')}
                  aria-label="Crimson Eye"
                  title="Primal Crimson"
                  className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform ${
                    eyeColorTheme === 'crimson'
                      ? 'border border-rose-400 scale-125 bg-[#be123c] ring-1 ring-rose-500/80 shadow-[0_0_6px_#be123c]'
                      : 'border border-stone-700 bg-[#590d22] opacity-50 hover:opacity-100'
                  }`}
                />
              </div>

              {onReturnToChat && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onReturnToChat();
                  }}
                  className="h-6 px-2 rounded-full gilded-pill-btn text-[9px] font-mono cursor-pointer"
                >
                  💬 Chat
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Argon Eye Popover"
                className="h-6 w-6 rounded-full gilded-pill-btn text-[10px] font-mono cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Named Overlay HUD Selector */}
          <div className="space-y-1.5 pt-0.5">
            <div
              className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-between border-b pb-1 ${
                eyeColorTheme === 'crimson'
                  ? 'text-rose-300 border-rose-950/70'
                  : 'text-[#e6c88c] border-[#6b5331]/40'
              }`}
            >
              <span className="flex items-center gap-1">
                <span>👁️</span> OVERLAY HUD SELECTOR
              </span>
              <span className="text-[9px] text-[#cbb693]/80">Argon&apos;s Eye</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                data-testid="companion-hud-fullscreen-btn"
                onClick={() => {
                  setIsOpen(false);
                  if (onSnapTargetElement) {
                    onSnapTargetElement('full_screen');
                  } else {
                    onSnapRoomForArgon();
                  }
                }}
                className={`p-2 rounded-xl text-left cursor-pointer active:scale-95 transition-all border ${
                  eyeColorTheme === 'crimson'
                    ? 'bg-[#241318] hover:bg-[#381a23] border-rose-500/50 text-rose-200'
                    : 'bg-[rgba(230,168,181,0.06)] hover:bg-[rgba(230,168,181,0.14)] border-[#D4AF37]/35 text-[#ffe5a3]'
                }`}
              >
                <div
                  className={`text-[11px] font-bold flex items-center gap-1 ${
                    eyeColorTheme === 'crimson' ? 'text-rose-200' : 'text-[#ffe5a3]'
                  }`}
                >
                  <span>📱</span> Full Screen
                </div>
                <div className="text-[9px] font-mono text-[#cbb693]/80 leading-tight">
                  Whole viewport
                </div>
              </button>

              <button
                type="button"
                data-testid="companion-hud-scratchpad-btn"
                onClick={() => {
                  setIsOpen(false);
                  if (onSnapTargetElement) {
                    onSnapTargetElement('scratchpad');
                  } else {
                    onSnapRoomForArgon();
                  }
                }}
                className={`p-2 rounded-xl text-left cursor-pointer active:scale-95 transition-all border ${
                  eyeColorTheme === 'crimson'
                    ? 'bg-[#241318] hover:bg-[#381a23] border-rose-500/50 text-rose-200'
                    : 'bg-[rgba(230,168,181,0.06)] hover:bg-[rgba(230,168,181,0.14)] border-[#D4AF37]/35 text-[#ffe5a3]'
                }`}
              >
                <div
                  className={`text-[11px] font-bold flex items-center gap-1 ${
                    eyeColorTheme === 'crimson' ? 'text-rose-200' : 'text-[#ffe5a3]'
                  }`}
                >
                  <span>📋</span> Scratchpad
                </div>
                <div className="text-[9px] font-mono text-[#cbb693]/80 leading-tight">
                  Plan &amp; tickets
                </div>
              </button>

              <button
                type="button"
                data-testid="companion-hud-modal-btn"
                onClick={() => {
                  setIsOpen(false);
                  if (onSnapTargetElement) {
                    onSnapTargetElement('active_modal');
                  } else {
                    onSnapRoomForArgon();
                  }
                }}
                className={`p-2 rounded-xl text-left cursor-pointer active:scale-95 transition-all border ${
                  eyeColorTheme === 'crimson'
                    ? 'bg-[#241318] hover:bg-[#381a23] border-rose-500/50 text-rose-200'
                    : 'bg-[rgba(230,168,181,0.06)] hover:bg-[rgba(230,168,181,0.14)] border-[#D4AF37]/35 text-[#ffe5a3]'
                }`}
              >
                <div
                  className={`text-[11px] font-bold flex items-center gap-1 ${
                    eyeColorTheme === 'crimson' ? 'text-rose-200' : 'text-[#ffe5a3]'
                  }`}
                >
                  <span>🗂️</span> Active Modal
                </div>
                <div className="text-[9px] font-mono text-[#cbb693]/80 leading-tight">
                  Open dialog
                </div>
              </button>

              <button
                type="button"
                data-testid="companion-hud-chat-btn"
                onClick={() => {
                  setIsOpen(false);
                  if (onSnapTargetElement) {
                    onSnapTargetElement('chat');
                  } else {
                    onSnapRoomForArgon();
                  }
                }}
                className={`p-2 rounded-xl text-left cursor-pointer active:scale-95 transition-all border ${
                  eyeColorTheme === 'crimson'
                    ? 'bg-[#241318] hover:bg-[#381a23] border-rose-500/50 text-rose-200'
                    : 'bg-[rgba(230,168,181,0.06)] hover:bg-[rgba(230,168,181,0.14)] border-[#D4AF37]/35 text-[#ffe5a3]'
                }`}
              >
                <div
                  className={`text-[11px] font-bold flex items-center gap-1 ${
                    eyeColorTheme === 'crimson' ? 'text-rose-200' : 'text-[#ffe5a3]'
                  }`}
                >
                  <span>💬</span> Chat
                </div>
                <div className="text-[9px] font-mono text-[#cbb693]/80 leading-tight">
                  Messages view
                </div>
              </button>
            </div>
          </div>

          {/* 1-Tap Real html2canvas Visual Screenshot Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setIsOpen(false);
              window.setTimeout(() => {
                onSnapRoomForArgon();
              }, 20);
            }}
            data-testid="companion-show-room-btn"
            className="w-full h-8 px-3 rounded-xl gilded-send-btn text-[11px] font-mono font-semibold cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <span>📸 Snap Room for Argon&apos;s Eyes</span>
          </button>

          {/* Argon's Short Reaction Bubble */}
          <div
            data-testid="argon-companion-reaction-bubble"
            className="p-2 rounded-xl bg-[#0b080a]/90 border border-[#6b5331]/60 text-[11px] font-serif-webtoon text-[#f5ead8] max-h-24 overflow-y-auto leading-snug"
          >
            {latestReactionText ||
              `*I watch your screen through the gilded lens.* "Tap 📸 Snap Room or whisper to me below."`}
          </div>

          {/* 1-Line Quick Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              disabled={isLoading}
              data-testid="argon-companion-input"
              placeholder="Whisper to Argon in this room…"
              className="flex-1 h-8 px-2.5 rounded-xl gilded-input-well text-xs text-[#f5ead8] placeholder-[#9e8664]"
            />
            <button
              type="submit"
              disabled={isLoading || !quickInput.trim()}
              data-testid="argon-companion-send-btn"
              className="h-8 px-3 rounded-xl gilded-send-btn text-xs font-semibold cursor-pointer disabled:opacity-40 shrink-0"
            >
              Send
            </button>
          </form>
        </aside>
      )}
    </div>
  );
};


import React, { useEffect, useRef, useState } from 'react';
import {
  WhiteboardPoint,
  WhiteboardStroke,
  normalizeStrokePointsToCanvas,
} from '../utils/workbenchLogic';

interface WhiteboardStageProps {
  strokes: WhiteboardStroke[];
  onAddStrokes: (newStrokes: WhiteboardStroke[]) => void;
  onUndoStroke: () => void;
  onClearBoard: () => void;
  onReturnToChat: () => void;
  onAskArgonToDraw: (promptText: string, canvasDataUrl: string) => Promise<void>;
  isArgonDrawing: boolean;
  argonComment: string;
  whiteboardError?: string | null;
  onSelectPaidKey?: () => Promise<void>;
}

export type WhiteboardToolType =
  | 'pen'
  | 'eraser'
  | 'line'
  | 'circle'
  | 'rect'
  | 'triangle'
  | 'star'
  | 'heart';

const COLORS = [
  { label: 'Gold', hex: '#e6c88c' },
  { label: 'Crimson', hex: '#e11d48' },
  { label: 'Chalk', hex: '#f5ead8' },
  { label: 'Emerald', hex: '#10b981' },
  { label: 'Aether', hex: '#38bdf8' },
  { label: 'Amethyst', hex: '#a855f7' },
  { label: 'Obsidian', hex: '#120c0e' },
  { label: 'White', hex: '#ffffff' },
];

const ALL_TOOLS: ReadonlyArray<{
  id: WhiteboardToolType;
  label: string;
  icon: string;
}> = [
  { id: 'pen', label: 'Pen', icon: '✏️' },
  { id: 'eraser', label: 'Eraser', icon: '🧹' },
  { id: 'line', label: 'Line', icon: '╱' },
  { id: 'circle', label: 'Circle', icon: '◯' },
  { id: 'rect', label: 'Square', icon: '▭' },
  { id: 'triangle', label: 'Triangle', icon: '△' },
  { id: 'star', label: 'Star', icon: '★' },
  { id: 'heart', label: 'Heart', icon: '♡' },
];

const TOOL_LABELS: Record<WhiteboardToolType, string> = {
  pen: '✏️ Pen',
  eraser: '🧹 Eraser',
  line: '╱ Line',
  circle: '◯ Circle',
  rect: '▭ Square',
  triangle: '△ Triangle',
  star: '★ Star',
  heart: '♡ Heart',
};

function renderStrokeOnCanvas(
  ctx: CanvasRenderingContext2D,
  stroke: WhiteboardStroke
) {
  const pts = normalizeStrokePointsToCanvas(
    stroke.points,
    ctx.canvas.width,
    ctx.canvas.height
  );
  if (pts.length === 0) return;

  ctx.save();
  const isEraser = stroke.tool === 'eraser';
  ctx.strokeStyle = isEraser ? '#100b0d' : stroke.color || '#e6c88c';
  ctx.fillStyle = isEraser
    ? '#100b0d'
    : stroke.fillColor || stroke.color || '#e6c88c';
  const rawWidth = stroke.width ?? stroke.size ?? 4;
  ctx.lineWidth = isEraser ? rawWidth * 2.4 : rawWidth * 1.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stroke.author === 'argon' && !isEraser) {
    ctx.shadowColor = stroke.color || '#e6c88c';
    ctx.shadowBlur = 4;
  }

  const p0 = pts[0];
  const pLast = pts[pts.length - 1] || p0;

  if (stroke.tool === 'circle' && pts.length >= 2) {
    const cx = (p0.x + pLast.x) / 2;
    const cy = (p0.y + pLast.y) / 2;
    const r = Math.max(8, Math.hypot(pLast.x - p0.x, pLast.y - p0.y) / 2);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (stroke.fillColor && !isEraser) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = stroke.fillColor;
      ctx.fill();
      ctx.restore();
    }
    ctx.stroke();
  } else if (stroke.tool === 'rect' && pts.length >= 2) {
    const rx = Math.min(p0.x, pLast.x);
    const ry = Math.min(p0.y, pLast.y);
    const rw = Math.max(8, Math.abs(pLast.x - p0.x));
    const rh = Math.max(8, Math.abs(pLast.y - p0.y));
    if (stroke.fillColor && !isEraser) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = stroke.fillColor;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.strokeRect(rx, ry, rw, rh);
  } else if (stroke.tool === 'triangle' && pts.length >= 2) {
    const topX = (p0.x + pLast.x) / 2;
    const topY = Math.min(p0.y, pLast.y);
    const botLeftX = Math.min(p0.x, pLast.x);
    const botRightX = Math.max(p0.x, pLast.x);
    const botY = Math.max(p0.y, pLast.y);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(botRightX, botY);
    ctx.lineTo(botLeftX, botY);
    ctx.closePath();
    if (stroke.fillColor && !isEraser) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = stroke.fillColor;
      ctx.fill();
      ctx.restore();
    }
    ctx.stroke();
  } else if (stroke.tool === 'star' && pts.length >= 2) {
    const cx = (p0.x + pLast.x) / 2;
    const cy = (p0.y + pLast.y) / 2;
    const outerR = Math.max(8, Math.hypot(pLast.x - p0.x, pLast.y - p0.y) / 2);
    const innerR = outerR * 0.45;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const sx = cx + Math.cos(angle) * r;
      const sy = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    if (stroke.fillColor && !isEraser) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = stroke.fillColor;
      ctx.fill();
      ctx.restore();
    }
    ctx.stroke();
  } else if (stroke.tool === 'heart' && pts.length >= 2) {
    const rx = Math.min(p0.x, pLast.x);
    const ry = Math.min(p0.y, pLast.y);
    const rw = Math.max(12, Math.abs(pLast.x - p0.x));
    const rh = Math.max(12, Math.abs(pLast.y - p0.y));
    const cx = rx + rw / 2;
    const topY = ry + rh * 0.3;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.bezierCurveTo(cx, ry, rx, ry, rx, topY);
    ctx.bezierCurveTo(rx, ry + rh * 0.65, cx, ry + rh * 0.9, cx, ry + rh);
    ctx.bezierCurveTo(cx, ry + rh * 0.9, rx + rw, ry + rh * 0.65, rx + rw, topY);
    ctx.bezierCurveTo(rx + rw, ry, cx, ry, cx, topY);
    ctx.closePath();
    if (stroke.fillColor && !isEraser) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = stroke.fillColor;
      ctx.fill();
      ctx.restore();
    }
    ctx.stroke();
  } else if (stroke.tool === 'line' && pts.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(pLast.x, pLast.y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    if (pts.length === 1) {
      ctx.lineTo(p0.x + 0.5, p0.y + 0.5);
    } else if (pts.length === 2) {
      ctx.lineTo(pts[1].x, pts[1].y);
    } else {
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2;
        const midY = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      ctx.lineTo(pLast.x, pLast.y);
    }
    if (stroke.closed && pts.length >= 3) {
      ctx.closePath();
    }
    if (stroke.fillColor && !isEraser && pts.length >= 3) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = stroke.fillColor;
      ctx.fill();
      ctx.restore();
    }
    ctx.stroke();
  }

  ctx.restore();
}

const ARGON_TURN_MODES = [
  {
    id: 'co_draw',
    label: '✨ Complete Scene',
    prompt:
      'Visually inspect what I drew on the canvas and draw your own original companion sketch or scene completion in an open spot!',
  },
  {
    id: 'pictionary',
    label: '🕵️ Pictionary Guess',
    prompt:
      'Play Pictionary! Visually guess what I drew on the canvas, tell me your guess, and draw a funny visual reaction or clue of your own!',
  },
  {
    id: 'tic_tac_toe',
    label: '❌⭕ Tic-Tac-Toe',
    prompt:
      'Look at the Tic-Tac-Toe grid/marks on the canvas and draw your next X or O in an empty cell to beat me!',
  },
  {
    id: 'cartoon',
    label: '😈 Cartoon Reply',
    prompt:
      'Look at my drawing and draw a funny original cartoon or chibi response next to it!',
  },
] as const;

export const WhiteboardStage: React.FC<WhiteboardStageProps> = ({
  strokes,
  onAddStrokes,
  onUndoStroke,
  onClearBoard,
  onReturnToChat,
  onAskArgonToDraw,
  isArgonDrawing,
  argonComment,
  whiteboardError,
  onSelectPaidKey,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTool, setActiveTool] = useState<WhiteboardToolType>('pen');
  const [activeColor, setActiveColor] = useState<string>('#e6c88c');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [fillMode, setFillMode] = useState<boolean>(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [coDrawLive, setCoDrawLive] = useState<boolean>(false);
  const [selectedTurnMode, setSelectedTurnMode] = useState<string>('co_draw');
  const [drawPrompt, setDrawPrompt] = useState<string>('');
  const [draftPoints, setDraftPoints] = useState<WhiteboardPoint[] | null>(null);

  // Redraw canvas whenever strokes or draftPoints change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark Gothic Slate Canvas Background with subtle gilded grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(16, 11, 13, 0.94)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(197, 155, 71, 0.08)';
    ctx.lineWidth = 1;
    for (let g = 100; g < 1000; g += 100) {
      ctx.beginPath();
      ctx.moveTo(g, 0);
      ctx.lineTo(g, 1000);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, g);
      ctx.lineTo(1000, g);
      ctx.stroke();
    }

    for (const s of strokes) {
      renderStrokeOnCanvas(ctx, s);
    }

    if (draftPoints && draftPoints.length > 0) {
      const strokeFill =
        fillMode &&
        activeTool !== 'eraser' &&
        activeTool !== 'pen' &&
        activeTool !== 'line'
          ? activeColor
          : undefined;

      renderStrokeOnCanvas(ctx, {
        id: 'draft',
        author: 'hex',
        tool: activeTool,
        color: activeTool === 'eraser' ? '#100b0d' : activeColor,
        fillColor: strokeFill,
        closed: Boolean(strokeFill),
        width: brushSize,
        size: brushSize,
        points: draftPoints,
        timestamp: Date.now(),
      });
    }
  }, [strokes, draftPoints, activeTool, activeColor, brushSize, fillMode]);

  const getPercentagePoint = (
    e: React.PointerEvent<HTMLCanvasElement>
  ): WhiteboardPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 50, y: 50 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100)
    );
    const y = Math.max(
      0,
      Math.min(100, ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100)
    );
    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getPercentagePoint(e);
    setDraftPoints([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draftPoints) return;
    const pt = getPercentagePoint(e);
    if (activeTool === 'pen' || activeTool === 'eraser') {
      setDraftPoints((prev) => (prev ? [...prev, pt] : [pt]));
    } else {
      setDraftPoints((prev) => (prev ? [prev[0], pt] : [pt]));
    }
  };

  const resolveActiveTurnPrompt = (customOverride?: string) => {
    if (customOverride && customOverride.trim()) return customOverride.trim();
    if (drawPrompt.trim()) return drawPrompt.trim();
    const modeObj =
      ARGON_TURN_MODES.find((m) => m.id === selectedTurnMode) || ARGON_TURN_MODES[0];
    return modeObj.prompt;
  };

  const handlePointerUp = async () => {
    if (!draftPoints || draftPoints.length === 0) return;
    const strokeFill =
      fillMode &&
      activeTool !== 'eraser' &&
      activeTool !== 'pen' &&
      activeTool !== 'line'
        ? activeColor
        : undefined;

    const finishedStroke: WhiteboardStroke = {
      id: `wb-hex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author: 'hex',
      tool: activeTool,
      color: activeTool === 'eraser' ? '#100b0d' : activeColor,
      fillColor: strokeFill,
      closed: Boolean(strokeFill),
      width: brushSize,
      size: brushSize,
      points: draftPoints,
      timestamp: Date.now(),
    };
    setDraftPoints(null);
    onAddStrokes([finishedStroke]);

    // If Co-Draw Live is enabled, Argon immediately inspects the canvas PNG via Multimodal Vision and draws his own original response
    if (coDrawLive && !isArgonDrawing) {
      window.setTimeout(async () => {
        const dataUrl = canvasRef.current?.toDataURL('image/png') || '';
        await onAskArgonToDraw(resolveActiveTurnPrompt(), dataUrl);
      }, 45);
    }
  };

  const handleTriggerArgonDraw = async (
    e?: React.FormEvent,
    customPromptOverride?: string
  ) => {
    if (e) e.preventDefault();
    if (isArgonDrawing) return;
    const requestText = resolveActiveTurnPrompt(customPromptOverride);
    const dataUrl = canvasRef.current?.toDataURL('image/png') || '';
    if (!customPromptOverride) {
      setDrawPrompt('');
    }
    await onAskArgonToDraw(requestText, dataUrl);
  };

  const hexStrokeCount = strokes.filter((s) => s.author === 'hex').length;
  const argonStrokeCount = strokes.filter((s) => s.author === 'argon').length;

  return (
    <div
      data-testid="whiteboard-stage"
      className="flex-1 min-h-0 flex flex-col px-2.5 sm:px-5 py-2 space-y-2 overflow-y-auto"
    >
      {/* Quick Actions Top Bar (Clean single slim bar with Tools & Palette Popover Button) */}
      <div className="relative p-2 rounded-xl bubble-smoked-glass border border-[#c59b47]/70">
        <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onReturnToChat}
              className="h-7 px-2.5 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              💬 Chat
            </button>
            <span className="text-xs font-serif font-bold text-[#e6c88c] whitespace-nowrap hidden xs:inline">
              🎨 Argon &amp; Hex&apos;s Whiteboard
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {/* Consolidated Pop-Up Tools & Palette Button */}
            <button
              type="button"
              data-testid="whiteboard-palette-popover-btn"
              onClick={() => setIsPaletteOpen((prev) => !prev)}
              className="h-7 px-2.5 rounded-full gilded-pill-btn text-[11px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Open Drawing Tools, Shapes, Fill & Colors"
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-[#fff3db]/60 inline-block shrink-0"
                style={{
                  backgroundColor: activeTool === 'eraser' ? '#ffffff' : activeColor,
                }}
              />
              <span>{TOOL_LABELS[activeTool] || '🎨 Palette'} ▾</span>
            </button>

            <button
              type="button"
              data-testid="whiteboard-argons-turn-btn"
              disabled={isArgonDrawing}
              onClick={() => void handleTriggerArgonDraw()}
              className="h-7 px-2.5 rounded-full gilded-send-btn text-[11px] font-mono font-bold text-[#fff3db] cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isArgonDrawing ? '✒️…' : "🎨 Argon's Turn"}
            </button>

            <button
              type="button"
              onClick={() => setCoDrawLive((prev) => !prev)}
              className={`h-7 px-2 rounded-full text-[10px] font-mono cursor-pointer border whitespace-nowrap ${
                coDrawLive
                  ? 'bg-emerald-950/90 border-emerald-400/70 text-emerald-200'
                  : 'bg-[#1a120e] border-[#785c37]/60 text-[#cbb693]'
              }`}
              title="Auto-Turn: Argon draws a companion piece when Hex finishes a stroke"
            >
              {coDrawLive ? '🤝 Auto' : '🤝 Turn'}
            </button>

            <button
              type="button"
              onClick={onUndoStroke}
              className="h-7 px-2 rounded-full gilded-pill-btn text-[10px] font-mono cursor-pointer whitespace-nowrap"
              title="Undo last stroke"
            >
              ↩ Undo
            </button>

            <button
              type="button"
              onClick={onClearBoard}
              className="h-7 px-2 rounded-full bg-red-950/80 border border-red-500/50 text-[10px] font-mono text-red-200 cursor-pointer whitespace-nowrap"
              title="Clear entire canvas"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Pop-Up Tools & Palette Dropdown Menu (Auto-closes on tool or color selection) */}
        {isPaletteOpen && (
          <>
            {/* Backdrop to auto-close when clicking outside */}
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
              onClick={() => setIsPaletteOpen(false)}
            />

            <div
              data-testid="whiteboard-tools-palette-popover"
              className="absolute top-11 right-2 z-50 w-[290px] sm:w-[320px] rounded-2xl bg-[#140e11]/98 border-2 border-[#e6c88c]/80 p-3 space-y-3 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-[#6b5331]/50 pb-1.5">
                <span className="text-xs font-serif font-bold text-[#e6c88c]">
                  🎨 Drawing Tools &amp; Palette
                </span>
                <button
                  type="button"
                  onClick={() => setIsPaletteOpen(false)}
                  className="text-xs text-[#cbb693] hover:text-[#fff3db] cursor-pointer px-1.5 py-0.5 rounded"
                >
                  ✕ Close
                </button>
              </div>

              {/* Tools & Shapes Grid */}
              <div>
                <div className="text-[10px] font-mono text-[#cbb693] mb-1">
                  Tools &amp; Shapes:
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {ALL_TOOLS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setActiveTool(t.id);
                        setIsPaletteOpen(false); // auto-close on selection
                      }}
                      className={`h-7 px-1.5 rounded-lg text-[10px] font-mono cursor-pointer border flex items-center justify-center gap-1 ${
                        activeTool === t.id
                          ? 'bg-[#2c1f16] border-[#e6c88c] text-[#f5ead8] font-bold ring-1 ring-[#e6c88c]'
                          : 'bg-[#120d0b] border-[#6b5331]/50 text-[#cbb693]'
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Shape Fill Toggle */}
              <div className="flex items-center justify-between bg-[#1b1215] px-2.5 py-1.5 rounded-lg border border-[#6b5331]/40">
                <span className="text-[10px] font-mono text-[#e6c88c]">Shape Fill:</span>
                <button
                  type="button"
                  onClick={() => setFillMode((prev) => !prev)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer border ${
                    fillMode
                      ? 'bg-amber-950/90 border-[#e6c88c] text-[#fff3db]'
                      : 'bg-[#120d0b] border-[#6b5331]/60 text-[#cbb693]'
                  }`}
                >
                  {fillMode ? '◼️ Filled (28% Tint)' : '◻️ Outline Only'}
                </button>
              </div>

              {/* Color Swatches Grid */}
              <div>
                <div className="text-[10px] font-mono text-[#cbb693] mb-1">
                  Color Palette:
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        setActiveColor(c.hex);
                        if (activeTool === 'eraser') setActiveTool('pen');
                        setIsPaletteOpen(false); // auto-close on selection
                      }}
                      className={`h-7 rounded-lg border flex items-center gap-1.5 px-2 cursor-pointer transition-transform ${
                        activeColor === c.hex && activeTool !== 'eraser'
                          ? 'border-[#fff3db] bg-[#2a1b1f] ring-1 ring-[#fff3db]'
                          : 'border-[#6b5331]/40 bg-[#120d0b]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/40"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-[9px] font-mono text-[#f5ead8] truncate">
                        {c.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brush Size Slider */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#6b5331]/40">
                <span className="text-[10px] font-mono text-[#cbb693]">
                  Brush: {brushSize}px
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full bg-[#e6c88c]"
                    style={{
                      width: `${Math.max(3, brushSize)}px`,
                      height: `${Math.max(3, brushSize)}px`,
                    }}
                  />
                  <input
                    type="range"
                    aria-label="Brush size"
                    min={2}
                    max={12}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-24 accent-[#e6c88c] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Interactive Dual-User Canvas */}
      <div className="relative flex-1 min-h-[240px] flex items-center justify-center rounded-2xl overflow-hidden border-2 border-[#c59b47]/80 shadow-xl bg-[#0e0a0c]">
        <canvas
          ref={canvasRef}
          width={1000}
          height={1000}
          data-testid="shared-whiteboard-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full max-h-[48vh] object-contain touch-none cursor-crosshair"
        />

        {/* Live Status Overlay */}
        <div className="absolute top-2 left-2.5 right-2.5 flex items-center justify-between pointer-events-none text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded-full bg-black/75 border border-[#c59b47]/50 text-[#e6c88c]">
            🌹 Hex: {hexStrokeCount} · 🖤 Argon: {argonStrokeCount}
          </span>
          {isArgonDrawing && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950/90 border border-[#e6c88c] text-[#fff3db] animate-pulse">
              👁️ Argon is viewing your canvas &amp; drawing original strokes…
            </span>
          )}
        </div>
      </div>

      {/* Argon's In-Character Whiteboard Reply + Direct Turn Mode & Request Bar */}
      <div className="p-2.5 rounded-xl bubble-smoked-glass border border-[#c59b47]/60 space-y-2">
        {whiteboardError && (
          <div
            role="alert"
            className="p-2 rounded-lg bg-red-950/90 border border-red-500/80 text-[11px] font-mono text-red-100 flex flex-wrap items-center justify-between gap-2"
          >
            <span className="break-words">{whiteboardError}</span>
            {onSelectPaidKey && (
              <button
                type="button"
                onClick={onSelectPaidKey}
                className="px-2 py-0.5 rounded bg-amber-600/90 hover:bg-amber-500 text-amber-50 text-[10px] font-semibold cursor-pointer shrink-0"
              >
                [ 🔑 Select Paid API Key ]
              </button>
            )}
          </div>
        )}

        <div
          data-testid="argon-whiteboard-reply"
          className="text-xs font-serif-webtoon text-[#f5ead8] italic leading-snug"
        >
          <strong className="not-italic text-[#e6c88c] font-mono text-[10px] mr-1.5">
            [🖤 ARGON]:
          </strong>
          {argonComment}
        </div>

        {/* Quick Mode Selector Pills for Argon's Turn */}
        <div className="flex flex-wrap items-center gap-1">
          {ARGON_TURN_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              disabled={isArgonDrawing}
              onClick={() => {
                setSelectedTurnMode(mode.id);
                void handleTriggerArgonDraw(undefined, mode.prompt);
              }}
              className={`h-6 px-2 rounded-full text-[10px] font-mono cursor-pointer border ${
                selectedTurnMode === mode.id
                  ? 'bg-[#2c1f16] border-[#e6c88c] text-[#fff3db] font-bold'
                  : 'bg-[#120d0b] border-[#6b5331]/50 text-[#cbb693]'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleTriggerArgonDraw} className="flex items-center gap-1.5">
          <input
            type="text"
            value={drawPrompt}
            onChange={(e) => setDrawPrompt(e.target.value)}
            placeholder="Tell Argon what to draw or tap Argon's Turn…"
            className="flex-1 h-8 px-2.5 rounded-xl gilded-input-well text-xs font-mono text-[#f5ead8]"
          />
          <button
            type="submit"
            disabled={isArgonDrawing}
            className="h-8 px-3 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {isArgonDrawing ? 'Drawing…' : "🎨 Argon's Turn"}
          </button>
        </form>
      </div>
    </div>
  );
};

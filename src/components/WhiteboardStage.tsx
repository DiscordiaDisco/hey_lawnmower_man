import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Circle,
  Eraser,
  Eye,
  Grid3x3,
  Heart,
  KeyRound,
  MessageSquare,
  Minus,
  PaintBucket,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Smile,
  Sparkles,
  Square,
  Star,
  Trash2,
  Triangle,
  Undo2,
  X,
} from 'lucide-react';
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
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'pen', label: 'Pen', Icon: Pencil },
  { id: 'eraser', label: 'Eraser', Icon: Eraser },
  { id: 'line', label: 'Line', Icon: Minus },
  { id: 'circle', label: 'Circle', Icon: Circle },
  { id: 'rect', label: 'Square', Icon: Square },
  { id: 'triangle', label: 'Triangle', Icon: Triangle },
  { id: 'star', label: 'Star', Icon: Star },
  { id: 'heart', label: 'Heart', Icon: Heart },
];

const TOOL_LABELS: Record<WhiteboardToolType, string> = {
  pen: 'Pen',
  eraser: 'Eraser',
  line: 'Line',
  circle: 'Circle',
  rect: 'Square',
  triangle: 'Triangle',
  star: 'Star',
  heart: 'Heart',
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
    label: 'Complete Scene',
    Icon: Sparkles,
    prompt:
      'Visually inspect what I drew on the canvas and draw your own original companion sketch or scene completion in an open spot!',
  },
  {
    id: 'pictionary',
    label: 'Pictionary Guess',
    Icon: Search,
    prompt:
      'Play Pictionary! Visually guess what I drew on the canvas, tell me your guess, and draw a funny visual reaction or clue of your own!',
  },
  {
    id: 'tic_tac_toe',
    label: 'Tic-Tac-Toe',
    Icon: Grid3x3,
    prompt:
      'Look at the Tic-Tac-Toe grid/marks on the canvas and draw your next X or O in an empty cell to beat me!',
  },
  {
    id: 'cartoon',
    label: 'Cartoon Reply',
    Icon: Smile,
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
  const ActiveToolIcon =
    ALL_TOOLS.find((t) => t.id === activeTool)?.Icon || Palette;

  return (
    <div
      data-testid="whiteboard-stage"
      className="flex-1 min-h-0 w-full max-w-full min-w-0 flex flex-col px-2 sm:px-5 py-2 space-y-2 overflow-y-auto overflow-x-hidden box-border"
    >
      {/* Mobile-Safe Quick Actions Top Card (Zero horizontal overflow on 360px-430px phones) */}
      <div className="relative w-full max-w-full min-w-0 p-2 rounded-xl bg-[#e6a8b5]/[0.08] border border-[#D4AF37]/60 space-y-1.5 box-border">
        {/* Row 1: Return to Chat + Title + Undo / Clear */}
        <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={onReturnToChat}
              className="min-h-[44px] px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>Chat</span>
            </button>
            <span className="text-xs font-serif font-bold text-[#e6c88c] truncate min-w-0">
              Whiteboard
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onUndoStroke}
              className="min-h-[44px] px-2.5 rounded-full gilded-pill-btn text-[11px] font-mono cursor-pointer whitespace-nowrap flex items-center gap-1"
              title="Undo last stroke"
            >
              <Undo2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>Undo</span>
            </button>

            <button
              type="button"
              onClick={onClearBoard}
              className="min-h-[44px] px-2.5 rounded-full bg-red-950/80 border border-red-500/50 text-[11px] font-mono text-red-200 cursor-pointer whitespace-nowrap flex items-center gap-1"
              title="Clear entire canvas"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-300 shrink-0" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Row 2: 3-Column Responsive Action Grid (Tools/Palette, Argon's Turn, Auto-Turn Toggle) */}
        <div className="grid grid-cols-3 gap-1.5 w-full min-w-0">
          <button
            type="button"
            data-testid="whiteboard-palette-popover-btn"
            onClick={() => setIsPaletteOpen((prev) => !prev)}
            className="min-h-[44px] min-w-0 px-2 rounded-xl gilded-pill-btn text-[11px] font-mono font-semibold flex items-center justify-center gap-1 cursor-pointer overflow-hidden"
            title="Open Drawing Tools, Shapes, Fill & Colors"
          >
            <span
              className="w-2.5 h-2.5 rounded-full border border-[#fff3db]/60 inline-block shrink-0"
              style={{
                backgroundColor: activeTool === 'eraser' ? '#ffffff' : activeColor,
              }}
            />
            <ActiveToolIcon className="w-3.5 h-3.5 text-[#E6A8B5] shrink-0" />
            <span className="truncate">{TOOL_LABELS[activeTool] || 'Tools'}</span>
            <ChevronDown className="w-3 h-3 text-[#D4AF37] shrink-0" />
          </button>

          <button
            type="button"
            data-testid="whiteboard-argons-turn-btn"
            disabled={isArgonDrawing}
            onClick={() => void handleTriggerArgonDraw()}
            className="min-h-[44px] min-w-0 px-2 rounded-xl gilded-send-btn text-[11px] font-mono font-bold text-[#fff3db] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 overflow-hidden"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {isArgonDrawing ? 'Drawing…' : "Argon's Turn"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCoDrawLive((prev) => !prev)}
            className={`min-h-[44px] min-w-0 px-2 rounded-xl text-[11px] font-mono cursor-pointer border flex items-center justify-center gap-1 overflow-hidden ${
              coDrawLive
                ? 'bg-emerald-950/90 border-emerald-400/70 text-emerald-200 font-semibold'
                : 'bg-[#161215] border-[#D4AF37]/40 text-[#cbb693]'
            }`}
            title="Auto-Turn: Argon draws a companion piece when Hex finishes a stroke"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${coDrawLive ? 'text-emerald-300' : 'text-[#E6A8B5]'}`} />
            <span className="truncate">{coDrawLive ? 'Auto: ON' : 'Auto: OFF'}</span>
          </button>
        </div>

        {/* Viewport-Clamped Pop-Up Tools & Palette Menu (Never overflows off left/right screen edges on phones) */}
        {isPaletteOpen && (
          <>
            {/* Backdrop to auto-close when tapping outside */}
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsPaletteOpen(false)}
            />

            <div
              data-testid="whiteboard-tools-palette-popover"
              className="fixed inset-x-3 top-14 sm:top-20 z-50 mx-auto w-auto max-w-[380px] max-h-[82dvh] overflow-y-auto overflow-x-hidden rounded-2xl bg-[#161215]/98 border border-[#D4AF37] p-3.5 space-y-3 shadow-2xl backdrop-blur-md box-border"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#D4AF37]/30 pb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Palette className="w-4 h-4 text-[#E6A8B5] shrink-0" />
                  <span className="text-xs font-serif font-bold text-[#e6c88c] truncate">
                    Drawing Tools &amp; Palette
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaletteOpen(false)}
                  className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-[#e6a8b5]/[0.08] border border-[#E6A8B5]/40 text-xs text-[#f5ead8] hover:text-[#fff3db] cursor-pointer flex items-center justify-center gap-1 shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-[#E6A8B5]" />
                  <span>Close</span>
                </button>
              </div>

              {/* Tools & Shapes Grid (4-col vertical stack with 48px touch targets) */}
              <div>
                <div className="text-[11px] font-mono text-[#cbb693] mb-1.5">
                  Tools &amp; Shapes:
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {ALL_TOOLS.map((t) => {
                    const ToolIcon = t.Icon;
                    const isSelected = activeTool === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setActiveTool(t.id);
                          setIsPaletteOpen(false);
                        }}
                        className={`min-h-[48px] px-1 py-1.5 rounded-xl text-[10px] font-mono cursor-pointer border flex flex-col items-center justify-center gap-1 min-w-0 ${
                          isSelected
                            ? 'bg-[#2c1f24] border-[#D4AF37] text-[#fff3db] font-bold ring-1 ring-[#D4AF37]/60'
                            : 'bg-[#e6a8b5]/[0.06] border-[#E6A8B5]/25 text-[#cbb693]'
                        }`}
                      >
                        <ToolIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#D4AF37]' : 'text-[#E6A8B5]'}`} />
                        <span className="truncate max-w-full">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shape Fill Toggle */}
              <div className="flex items-center justify-between gap-2 bg-[#e6a8b5]/[0.06] px-3 py-1.5 rounded-xl border border-[#E6A8B5]/25">
                <span className="text-[11px] font-mono text-[#e6c88c] flex items-center gap-1.5 min-w-0">
                  <PaintBucket className="w-3.5 h-3.5 text-[#E6A8B5] shrink-0" />
                  <span className="truncate">Shape Fill:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setFillMode((prev) => !prev)}
                  className={`min-h-[44px] px-3 rounded-xl text-[11px] font-mono cursor-pointer border shrink-0 ${
                    fillMode
                      ? 'bg-amber-950/90 border-[#D4AF37] text-[#fff3db] font-semibold'
                      : 'bg-[#161215] border-[#E6A8B5]/30 text-[#cbb693]'
                  }`}
                >
                  {fillMode ? 'Filled (28%)' : 'Outline Only'}
                </button>
              </div>

              {/* Color Swatches Grid (4-col vertical stack with 48px touch targets) */}
              <div>
                <div className="text-[11px] font-mono text-[#cbb693] mb-1.5">
                  Color Palette:
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLORS.map((c) => {
                    const isSelected = activeColor === c.hex && activeTool !== 'eraser';
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          setActiveColor(c.hex);
                          if (activeTool === 'eraser') setActiveTool('pen');
                          setIsPaletteOpen(false);
                        }}
                        className={`min-h-[48px] rounded-xl border flex flex-col items-center justify-center gap-1 px-1 py-1.5 cursor-pointer transition-transform min-w-0 ${
                          isSelected
                            ? 'border-[#D4AF37] bg-[#2a1b20] ring-1 ring-[#D4AF37]'
                            : 'border-[#E6A8B5]/25 bg-[#e6a8b5]/[0.06]'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 border border-white/30"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[10px] font-mono text-[#f5ead8] truncate max-w-full">
                          {c.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brush Size Controls (Slider + Stepper Buttons for Tremor-Safe Precision) */}
              <div className="space-y-1.5 pt-2 border-t border-[#D4AF37]/30">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#cbb693]">
                  <span>Brush Size: {brushSize}px</span>
                  <span
                    className="rounded-full bg-[#e6c88c] inline-block"
                    style={{
                      width: `${Math.max(4, brushSize)}px`,
                      height: `${Math.max(4, brushSize)}px`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 w-full min-w-0">
                  <button
                    type="button"
                    aria-label="Decrease brush size"
                    onClick={() => setBrushSize((prev) => Math.max(2, prev - 1))}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-[#e6a8b5]/[0.08] border border-[#E6A8B5]/35 text-[#f5ead8] flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    aria-label="Brush size"
                    min={2}
                    max={12}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="flex-1 min-w-0 accent-[#D4AF37] cursor-pointer h-6"
                  />
                  <button
                    type="button"
                    aria-label="Increase brush size"
                    onClick={() => setBrushSize((prev) => Math.min(12, prev + 1))}
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-[#e6a8b5]/[0.08] border border-[#E6A8B5]/35 text-[#f5ead8] flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Interactive Dual-User Canvas */}
      <div className="relative flex-1 min-h-[240px] w-full max-w-full min-w-0 flex items-center justify-center rounded-2xl overflow-hidden border border-[#D4AF37]/80 shadow-xl bg-[#0e0a0c]">
        <canvas
          ref={canvasRef}
          width={1000}
          height={1000}
          data-testid="shared-whiteboard-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full max-h-[46vh] object-contain touch-none cursor-crosshair"
        />

        {/* Live Status Overlay */}
        <div className="absolute top-2 left-2 right-2 flex flex-wrap items-center justify-between gap-1 pointer-events-none text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded-full bg-black/75 border border-[#D4AF37]/50 text-[#e6c88c] max-w-full truncate">
            Hex: {hexStrokeCount} · Argon: {argonStrokeCount}
          </span>
          {isArgonDrawing && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950/90 border border-[#D4AF37] text-[#fff3db] animate-pulse flex items-center gap-1 max-w-full truncate">
              <Eye className="w-3 h-3 text-[#D4AF37] shrink-0" />
              <span className="truncate">Argon is drawing…</span>
            </span>
          )}
        </div>
      </div>

      {/* Argon's In-Character Whiteboard Reply + Direct Turn Mode & Request Bar */}
      <div className="w-full max-w-full min-w-0 p-2.5 rounded-xl bg-[#e6a8b5]/[0.08] border border-[#D4AF37]/60 space-y-2 box-border overflow-hidden">
        {whiteboardError && (
          <div
            role="alert"
            className="p-2 rounded-lg bg-red-950/90 border border-red-500/80 text-[11px] font-mono text-red-100 flex flex-wrap items-center justify-between gap-2"
          >
            <span className="break-words min-w-0">{whiteboardError}</span>
            {onSelectPaidKey && (
              <button
                type="button"
                onClick={onSelectPaidKey}
                className="min-h-[44px] px-3 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-amber-50 text-[11px] font-semibold cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span>Select Paid API Key</span>
              </button>
            )}
          </div>
        )}

        <div
          data-testid="argon-whiteboard-reply"
          className="text-xs font-serif-webtoon text-[#f5ead8] italic leading-snug break-words"
        >
          <strong className="not-italic text-[#e6c88c] font-mono text-[10px] mr-1.5">
            [ARGON]:
          </strong>
          {argonComment}
        </div>

        {/* Quick Mode Selector Grid (2x2 on mobile, 4-col on sm+, 44px touch targets, zero overflow) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full min-w-0">
          {ARGON_TURN_MODES.map((mode) => {
            const ModeIcon = mode.Icon;
            const isSelected = selectedTurnMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                disabled={isArgonDrawing}
                onClick={() => {
                  setSelectedTurnMode(mode.id);
                  void handleTriggerArgonDraw(undefined, mode.prompt);
                }}
                className={`min-h-[44px] min-w-0 px-2 rounded-xl text-[11px] font-mono cursor-pointer border flex items-center justify-center gap-1.5 overflow-hidden ${
                  isSelected
                    ? 'bg-[#2c1f24] border-[#D4AF37] text-[#fff3db] font-bold'
                    : 'bg-[#161215] border-[#E6A8B5]/30 text-[#cbb693]'
                }`}
              >
                <ModeIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#D4AF37]' : 'text-[#E6A8B5]'}`} />
                <span className="truncate">{mode.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleTriggerArgonDraw} className="flex items-center gap-1.5 w-full min-w-0">
          <input
            type="text"
            value={drawPrompt}
            onChange={(e) => setDrawPrompt(e.target.value)}
            placeholder="Tell Argon what to draw…"
            className="flex-1 min-w-0 min-h-[44px] px-3 rounded-xl gilded-input-well text-xs font-mono text-[#f5ead8]"
          />
          <button
            type="submit"
            disabled={isArgonDrawing}
            className="min-h-[44px] px-3.5 rounded-xl gilded-send-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{isArgonDrawing ? 'Drawing…' : "Argon's Turn"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

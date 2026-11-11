import React, { useEffect, useState } from 'react';
import {
  ARGON_STICKERS,
  ArgonStickerDef,
  computeStickerBackgroundPosition,
  getCachedStickerSheetDataUrl,
  getSlicedStickerDataUrl,
  getStickerByShortcode,
  loadStickerStudioConfig,
} from '../utils/workbenchLogic';

export interface ArgonStickerProps {
  row?: number; // 0..6
  col?: number; // 0..4
  shortcode?: string;
  sticker?: ArgonStickerDef | null;
  size?: number;
  className?: string;
  title?: string;
}

export const ArgonSticker: React.FC<ArgonStickerProps> = ({
  row,
  col,
  shortcode,
  sticker,
  size = 56,
  className = '',
  title,
}) => {
  const fromShortcode = sticker || (shortcode ? getStickerByShortcode(shortcode) : null);
  const resolvedRow = fromShortcode ? fromShortcode.row : (row ?? 0);
  const resolvedCol = fromShortcode ? fromShortcode.col : (col ?? 0);
  const fallbackDef =
    fromShortcode ||
    ARGON_STICKERS.find((s) => s.row === resolvedRow && s.col === resolvedCol) ||
    ARGON_STICKERS[0];

  const [slicedPngUrl, setSlicedPngUrl] = useState<string | null>(() =>
    getSlicedStickerDataUrl(fallbackDef.shortcode)
  );
  const [customStickerSheet, setCustomStickerSheet] = useState<string | null>(() =>
    getCachedStickerSheetDataUrl()
  );
  const [studioConfig, setStudioConfig] = useState(() => loadStickerStudioConfig());

  useEffect(() => {
    const syncAssets = () => {
      const cfg = loadStickerStudioConfig();
      const isDeleted = (cfg.deletedShortcodes || []).includes(fallbackDef.shortcode);
      const nextSliced = isDeleted ? null : getSlicedStickerDataUrl(fallbackDef.shortcode);
      const nextSheet = getCachedStickerSheetDataUrl();
      setSlicedPngUrl(nextSliced);
      setCustomStickerSheet(nextSheet);
      setStudioConfig(cfg);
    };

    syncAssets();
    window.addEventListener('argon-custom-icons-updated', syncAssets);
    window.addEventListener('storage', syncAssets);
    return () => {
      window.removeEventListener('argon-custom-icons-updated', syncAssets);
      window.removeEventListener('storage', syncAssets);
    };
  }, [fallbackDef.shortcode]);

  const rows = Math.max(1, studioConfig.rows || 7);
  const cols = Math.max(1, studioConfig.cols || 5);
  const bgPos = computeStickerBackgroundPosition(resolvedRow, resolvedCol, rows, cols);
  const label = title || `${fallbackDef.shortcode} (${fallbackDef.label})`;

  // 1. Standalone Sliced Base64 PNG Data URL (`data:image/png;base64,...`) from Chibi Sticker Studio
  // CRITICAL: Render with 100% transparent background, zero border, and zero border-radius so die-cut stickers keep their exact shape!
  if (slicedPngUrl) {
    return (
      <img
        src={slicedPngUrl}
        alt={label}
        title={label}
        data-sticker-code={fallbackDef.shortcode}
        data-sticker-sliced="true"
        draggable={false}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: 'transparent',
          borderRadius: 0,
          border: 'none',
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
        }}
        className={`inline-block object-contain bg-transparent border-0 rounded-none align-middle shrink-0 select-none ${className}`}
      />
    );
  }

  // 2. Uploaded Full Sprite Sheet Fallback while slicing completes (also transparent & unclipped)
  if (customStickerSheet) {
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        data-sticker-code={fallbackDef.shortcode}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: 'transparent',
          borderRadius: 0,
          border: 'none',
          backgroundImage: `url('${customStickerSheet}')`,
          backgroundSize: `${cols * 100}% ${rows * 100}%`,
          backgroundPosition: bgPos,
          backgroundRepeat: 'no-repeat',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
        }}
        className={`argon-sprite-sheet-bg inline-block bg-transparent border-0 rounded-none align-middle shrink-0 select-none ${className}`}
      />
    );
  }

  // 3. Unloaded Sheet Indicator Badge (shows PISS badge as requested)
  return (
    <span
      role="img"
      aria-label={label}
      title={`[PISS] ${label}`}
      data-sticker-code={fallbackDef.shortcode}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      className={`inline-flex items-center justify-center rounded-lg border border-amber-500/60 bg-[#161011] text-amber-400 font-black tracking-wider shadow-xs align-middle shrink-0 p-0.5 select-none ${className}`}
    >
      <span className="text-[10px] sm:text-xs uppercase font-extrabold text-amber-300 select-none leading-none">
        PISS
      </span>
    </span>
  );
};


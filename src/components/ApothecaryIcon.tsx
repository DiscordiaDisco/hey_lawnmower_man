import React, { useEffect, useState } from 'react';
import {
  APOTHECARY_BUTTON_ICONS,
  ApothecaryIconId,
  CustomButtonIconKey,
  STORAGE_KEYS,
  resolveCustomButtonSlotKey,
} from '../utils/workbenchLogic';

export interface ApothecaryIconProps {
  icon?: ApothecaryIconId;
  xPct?: number;
  yPct?: number;
  row?: number; // 0..4
  col?: number; // 0..3
  size?: number;
  className?: string;
  title?: string;
}

function readCustomButtonIconsFromStorage(): Partial<Record<CustomButtonIconKey, string>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_BUTTON_ICONS);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function readCustomApothecarySheetFromStorage(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_APOTHECARY_SHEET);
    if (raw && raw.trim().startsWith('data:image/')) {
      return raw.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Custom Gothic Apothecary Inline SVGs in Antique Brass (#e6c88c) and Glowing Glass:
 * - Specimen Jar for Lorebook
 * - Grimoire Clasp for Sanctuary Books
 * - Framed Canvas for Whiteboard
 * - Mystic Planchette for Occult / Games
 * - Brass Service Bell with Paw for Staff
 * - Ruby Tesla Coil for Shock
 * - Brass Astrolabe for Settings / System
 */
function renderGoldSvgGlyph(iconKey: string): React.ReactNode {
  switch (iconKey) {
    case 'lorebook':
      // Specimen Jar for Lorebook (Antique brass ribbed lid + glowing bioluminescent glass jar + suspended specimen)
      return (
        <>
          <rect x="7" y="2" width="10" height="2.4" rx="1" fill="#e6c88c" stroke="#b89352" strokeWidth="1" />
          <path d="M8.5 4.4h7v1.2h-7z" fill="#c59b47" />
          <path
            d="M5.5 5.6h13v12.8a3.2 3.2 0 0 1-3.2 3.2H8.7a3.2 3.2 0 0 1-3.2-3.2V5.6z"
            fill="rgba(139, 92, 246, 0.28)"
            stroke="#e6c88c"
            strokeWidth="1.6"
          />
          {/* Glowing glass highlight & bioluminescent fluid */}
          <path
            d="M7.5 8v9.5"
            stroke="rgba(103, 232, 249, 0.7)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="12.3" cy="13" r="3.4" fill="rgba(192, 132, 252, 0.65)" stroke="#e6c88c" strokeWidth="1.2" />
          <circle cx="12.3" cy="13" r="1.3" fill="#180d1e" />
          <circle cx="11.7" cy="12.3" r="0.55" fill="#fff3db" />
          <path d="M6.5 20.8h11" stroke="#e6c88c" strokeWidth="1.4" strokeLinecap="round" />
        </>
      );

    case 'books':
      // Grimoire Clasp for Sanctuary Books (Leather grimoire with antique brass corners & glowing jewel clasp)
      return (
        <>
          <rect
            x="4.5"
            y="3"
            width="14.5"
            height="18"
            rx="2"
            fill="rgba(88, 28, 45, 0.55)"
            stroke="#e6c88c"
            strokeWidth="1.6"
          />
          {/* Spine ridges */}
          <path d="M7.5 3v18" stroke="#c59b47" strokeWidth="1.3" />
          <path d="M4.8 7h2.7M4.8 12h2.7M4.8 17h2.7" stroke="#e6c88c" strokeWidth="1.2" />
          {/* Ornate Grimoire Brass Clasp on right edge */}
          <path
            d="M15 9.5h4.8v5H15a2.2 2.2 0 0 1 0-5z"
            fill="#e6c88c"
            stroke="#fff3db"
            strokeWidth="1"
          />
          {/* Glowing Ruby/Amethyst Cabochon in the Clasp */}
          <circle cx="16.4" cy="12" r="1.4" fill="#e11d48" stroke="#ffe5a3" strokeWidth="0.8" />
          {/* Center Arcane Sigil */}
          <circle cx="11.5" cy="12" r="2.2" fill="none" stroke="#e6c88c" strokeWidth="1.1" />
        </>
      );

    case 'board':
      // Framed Canvas for Whiteboard (Ornate antique brass frame + glowing glass canvas + luminous vector stroke)
      return (
        <>
          <rect
            x="3"
            y="4"
            width="18"
            height="15"
            rx="2"
            fill="rgba(56, 189, 248, 0.16)"
            stroke="#e6c88c"
            strokeWidth="1.8"
          />
          <rect
            x="5"
            y="6"
            width="14"
            height="11"
            rx="1"
            fill="rgba(18, 12, 16, 0.65)"
            stroke="#c59b47"
            strokeWidth="1"
          />
          {/* Glowing brushstroke & star on canvas */}
          <path
            d="M7 14.5c2.2-3.5 4.5-4.2 6.5-1.5s2.5 1.2 4-3.5"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="16.5" cy="8.8" r="1.3" fill="#e6c88c" />
          {/* Easel / Frame Pedestal Feet */}
          <path d="M8.5 19l-1.5 2.5M15.5 19l1.5 2.5M12 2.5V4" stroke="#e6c88c" strokeWidth="1.5" strokeLinecap="round" />
        </>
      );

    case 'games':
      // Mystic Planchette for Occult ("The Eye Thing" — Heart-shaped antique brass planchette with glowing glass oculus)
      return (
        <>
          <path
            d="M12 2.8L19.5 14c1.6 2.5.4 6.2-2.7 6.8-2.1.4-3.6-.8-4.8-2.2-1.2 1.4-2.7 2.6-4.8 2.2-3.1-.6-4.3-4.3-2.7-6.8L12 2.8z"
            fill="rgba(168, 85, 247, 0.24)"
            stroke="#e6c88c"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          {/* Glowing Glass Magnifying Oculus */}
          <circle
            cx="12"
            cy="13"
            r="3.6"
            fill="rgba(56, 189, 248, 0.35)"
            stroke="#e6c88c"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="13" r="1.3" fill="#fff3db" />
          <path d="M12 6.2v2.2M8.8 13H6.8M17.2 13h-2" stroke="#e6c88c" strokeWidth="1.1" strokeLinecap="round" />
        </>
      );

    case 'staffQuarters':
    case 'staff':
    case 'staffStatusActive':
    case 'status_active':
      // Brass Service Bell with Paw for Staff
      return (
        <>
          {/* Ringing spark rays */}
          <path
            d="M4.5 11.5l1.6 1M19.5 11.5l-1.6 1"
            stroke="#ffe5a3"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          {/* Puppy Paw pressing top ringer */}
          <ellipse cx="12" cy="6.8" rx="3.2" ry="2.2" fill="#f5ead8" stroke="#e6c88c" strokeWidth="1.2" />
          <circle cx="9.2" cy="4.2" r="1.05" fill="#e6c88c" />
          <circle cx="12" cy="3.5" r="1.1" fill="#e6c88c" />
          <circle cx="14.8" cy="4.2" r="1.05" fill="#e6c88c" />
          {/* Bell ringer pin */}
          <path d="M12 9v1.8" stroke="#e6c88c" strokeWidth="1.8" strokeLinecap="round" />
          {/* Antique Brass Service Bell Dome */}
          <path
            d="M5.5 18a6.5 6.5 0 0 1 13 0H5.5z"
            fill="rgba(230, 200, 140, 0.35)"
            stroke="#e6c88c"
            strokeWidth="1.6"
          />
          <rect x="3.5" y="18" width="17" height="2.4" rx="1.1" fill="#e6c88c" />
        </>
      );

    case 'staffStatusIdle':
    case 'status_idle':
      // Brass Service Bell with Subtle Paw Emblem (Idle state)
      return (
        <>
          <path d="M10 4.5h4M12 4.5v2.3" stroke="#e6c88c" strokeWidth="1.7" strokeLinecap="round" />
          <path
            d="M5.5 16.8a6.5 6.5 0 0 1 13 0H5.5z"
            fill="rgba(230, 200, 140, 0.25)"
            stroke="#e6c88c"
            strokeWidth="1.6"
          />
          {/* Paw engraving on bell dome */}
          <circle cx="12" cy="13.8" r="1.3" fill="#e6c88c" />
          <circle cx="10.3" cy="11.8" r="0.7" fill="#e6c88c" />
          <circle cx="12" cy="11.3" r="0.7" fill="#e6c88c" />
          <circle cx="13.7" cy="11.8" r="0.7" fill="#e6c88c" />
          <rect x="3.5" y="16.8" width="17" height="2.4" rx="1.1" fill="#c59b47" />
        </>
      );

    case 'shock':
      // Ruby Tesla Coil for Shock (Antique brass electrodes + glowing ruby plasma core + lightning arcs)
      return (
        <>
          {/* Curved Brass Toroid Horns */}
          <path
            d="M6.2 15.5C3.8 12.5 4.2 7.5 7.5 5.2M17.8 15.5c2.4-3 2-8-1.3-10.3"
            fill="none"
            stroke="#e6c88c"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Glowing Ruby Glass Plasma Sphere */}
          <circle
            cx="12"
            cy="10.8"
            r="5.3"
            fill="rgba(225, 29, 72, 0.42)"
            stroke="#e6c88c"
            strokeWidth="1.5"
          />
          {/* High-voltage Ruby/Gold Lightning Bolt */}
          <path
            d="M12.8 6.5l-2.6 4h2.5l-1.8 4.2"
            fill="none"
            stroke="#ffe4e6"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Brass Pedestal Coil Base */}
          <rect x="7.5" y="16.5" width="9" height="2.2" rx="0.8" fill="#e6c88c" />
          <rect x="6" y="19" width="12" height="2.2" rx="1" fill="#b89352" />
        </>
      );

    case 'system':
      // Brass Astrolabe for Settings (Concentric antique brass celestial rings + glowing glass core + alidade needle)
      return (
        <>
          {/* Top suspension ring */}
          <circle cx="12" cy="2.6" r="1.3" fill="none" stroke="#e6c88c" strokeWidth="1.3" />
          {/* Outer Brass Astrolabe Ring */}
          <circle
            cx="12"
            cy="12.8"
            r="8.2"
            fill="rgba(56, 189, 248, 0.14)"
            stroke="#e6c88c"
            strokeWidth="1.7"
          />
          {/* Inner Celestial Equator & Tropics */}
          <circle
            cx="12"
            cy="12.8"
            r="5.2"
            fill="none"
            stroke="#c59b47"
            strokeWidth="1.2"
            strokeDasharray="2.5 1.5"
          />
          {/* Diagonal Alidade Sight Rule */}
          <path
            d="M6.5 7.3l11 11M12 4.6v16.4M3.8 12.8h16.4"
            stroke="#e6c88c"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Glowing Glass Celestial Core */}
          <circle cx="12" cy="12.8" r="2.2" fill="#38bdf8" stroke="#fff3db" strokeWidth="1.1" />
        </>
      );

    case 'prompt':
      // Wax-Sealed Parchment Envelope
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" fill="rgba(230,200,140,0.18)" stroke="#e6c88c" strokeWidth="1.6" />
          <path d="M3.5 6l8.5 6 8.5-6" fill="none" stroke="#e6c88c" strokeWidth="1.5" />
          <circle cx="12" cy="12.5" r="2.8" fill="#e11d48" stroke="#ffe5a3" strokeWidth="1.1" />
        </>
      );

    case 'send':
      // Crimson Heart Wax Seal
      return (
        <>
          <circle cx="12" cy="12" r="8.5" fill="#be123c" stroke="#e6c88c" strokeWidth="1.6" />
          <path
            d="M12 16.2s-4.2-2.6-4.2-5.1a2.4 2.4 0 0 1 4.2-1.5 2.4 2.4 0 0 1 4.2 1.5c0 2.5-4.2 5.1-4.2 5.1z"
            fill="#f5ead8"
          />
        </>
      );

    case 'stickers':
    case 'argonBookTab':
      // Crowned Crystal Skull / Chibi Stickers Crest
      return (
        <>
          <path d="M7.5 6.5l2 2 2.5-3 2.5 3 2-2-.8 3.5H8.3L7.5 6.5z" fill="#e6c88c" />
          <path d="M7 13a5 5 0 1 1 10 0v3.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 16.5V13z" fill="rgba(192,132,252,0.28)" stroke="#e6c88c" strokeWidth="1.5" />
          <circle cx="10" cy="13.5" r="1.2" fill="#f5ead8" />
          <circle cx="14" cy="13.5" r="1.2" fill="#f5ead8" />
        </>
      );

    case 'hexBookTab':
      // Amethyst Heart Potion
      return (
        <>
          <rect x="10" y="3" width="4" height="2.5" rx="0.8" fill="#e6c88c" />
          <path
            d="M12 19.5s-6.5-4-6.5-8a3.8 3.8 0 0 1 6.5-2.6A3.8 3.8 0 0 1 18.5 11.5c0 4-6.5 8-6.5 8z"
            fill="rgba(168,85,247,0.45)"
            stroke="#e6c88c"
            strokeWidth="1.6"
          />
        </>
      );

    default:
      // Ornate Apothecary Crest Fallback
      return (
        <>
          <circle cx="12" cy="12" r="7.5" fill="rgba(230,200,140,0.2)" stroke="#e6c88c" strokeWidth="1.6" />
          <path d="M12 6.5l1.6 3.9 3.9 1.6-3.9 1.6-1.6 3.9-1.6-3.9-3.9-1.6 3.9-1.6L12 6.5z" fill="#f2d59b" />
        </>
      );
  }
}

export const ApothecaryIcon: React.FC<ApothecaryIconProps> = ({
  icon,
  xPct,
  yPct,
  row,
  col,
  size = 22,
  className = '',
  title,
}) => {
  const [customIcons, setCustomIcons] = useState<Partial<Record<CustomButtonIconKey, string>>>(() =>
    readCustomButtonIconsFromStorage()
  );
  const [customSheetUrl, setCustomSheetUrl] = useState<string | null>(() =>
    readCustomApothecarySheetFromStorage()
  );

  useEffect(() => {
    const syncCustomAssets = () => {
      setCustomIcons(readCustomButtonIconsFromStorage());
      setCustomSheetUrl(readCustomApothecarySheetFromStorage());
    };
    window.addEventListener('argon-custom-icons-updated', syncCustomAssets);
    window.addEventListener('storage', syncCustomAssets);
    return () => {
      window.removeEventListener('argon-custom-icons-updated', syncCustomAssets);
      window.removeEventListener('storage', syncCustomAssets);
    };
  }, []);

  const presetFromId = icon ? APOTHECARY_BUTTON_ICONS[icon] : null;
  const presetFromRowCol =
    !presetFromId && row !== undefined && col !== undefined
      ? Object.values(APOTHECARY_BUTTON_ICONS).find(
          (item) => item.row === row && item.col === col
        ) || null
      : null;

  const resolvedXPct =
    xPct !== undefined
      ? xPct
      : presetFromId
      ? presetFromId.xPct
      : presetFromRowCol
      ? presetFromRowCol.xPct
      : col !== undefined
      ? (Math.max(0, Math.min(3, Math.floor(col))) / 3) * 100
      : 8;

  const resolvedYPct =
    yPct !== undefined
      ? yPct
      : presetFromId
      ? presetFromId.yPct
      : presetFromRowCol
      ? presetFromRowCol.yPct
      : row !== undefined
      ? (Math.max(0, Math.min(4, Math.floor(row))) / 4) * 100
      : 4;

  const resolvedIconId =
    icon || presetFromRowCol?.id || 'lorebook';

  const resolvedLabel =
    title ||
    presetFromId?.label ||
    presetFromRowCol?.label ||
    `Apothecary Icon (${resolvedXPct}%, ${resolvedYPct}%)`;

  const slotKey = resolveCustomButtonSlotKey(icon || presetFromRowCol?.id);
  const customIconDataUrl = slotKey ? customIcons[slotKey] : undefined;

  // 1. Individual Custom Button PNG Icon Override
  if (customIconDataUrl && customIconDataUrl.trim().length > 0) {
    return (
      <img
        src={customIconDataUrl}
        alt={resolvedLabel}
        title={resolvedLabel}
        data-apothecary-icon={resolvedIconId}
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`w-6 h-6 object-contain inline-block shrink-0 align-middle drop-shadow-[0_1px_2px_rgba(197,155,71,0.5)] ${className}`}
      />
    );
  }

  // 2. Full Custom Uploaded Apothecary Sheet 2 Override
  if (customSheetUrl) {
    const bgPosition = `${resolvedXPct}% ${resolvedYPct}%`;
    return (
      <span
        role="img"
        aria-label={resolvedLabel}
        title={resolvedLabel}
        data-apothecary-icon={resolvedIconId}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundImage: `url('${customSheetUrl}')`,
          backgroundSize: '380% 500%',
          backgroundPosition: bgPosition,
          backgroundRepeat: 'no-repeat',
          mixBlendMode: 'screen',
        }}
        className={`apothecary-icon-sheet-bg inline-block rounded-md overflow-hidden shrink-0 drop-shadow-[0_1px_2px_rgba(197,155,71,0.5)] align-middle ${className}`}
      />
    );
  }

  // 3. Custom Gothic Apothecary Inline SVG in Antique Brass (#e6c88c) and Glowing Glass
  return (
    <span
      role="img"
      aria-label={resolvedLabel}
      title={resolvedLabel}
      data-apothecary-icon={resolvedIconId}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      className={`inline-flex items-center justify-center rounded-md overflow-hidden shrink-0 drop-shadow-[0_1px_3px_rgba(230,200,140,0.6)] align-middle ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        aria-hidden="true"
        className="w-full h-full block"
      >
        {renderGoldSvgGlyph(resolvedIconId)}
      </svg>
    </span>
  );
};

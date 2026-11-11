import React, { useEffect, useRef, useState } from 'react';
import {
  ARGON_STICKERS,
  ArgonStickerShortcode,
  DEFAULT_STICKER_STUDIO_CONFIG,
  STORAGE_KEYS,
  StickerLibraryEntry,
  StickerStudioConfig,
  appendStickersToLibrary,
  clearEntireStickerLibrary,
  computeStickerSlotCropGeometry,
  deleteStickerFromLibrary,
  getActiveStickerCatalog,
  getCachedStickerSheetDataUrl,
  getSlicedStickersMap,
  getStickerByShortcode,
  getStickerLibrary,
  loadStickerStudioConfig,
  normalizeCustomShortcode,
  resliceOrRepairCurrentStickerPack,
  runClientAutoLabelStickers,
  runClientImageGenerator,
  saveSlicedStickersAndSheet,
  sliceStickerSheetInBrowser,
  stripBlackBackdropFromDataUrl,
  swapStickerStudioSlots,
} from '../utils/workbenchLogic';

export interface ChibiStickerStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  customApiKey?: string;
  onSelectPaidKey?: () => void;
  onBackupStickersToGist?: (
    slicedMap: Partial<Record<ArgonStickerShortcode, string>>,
    config: StickerStudioConfig
  ) => Promise<void>;
}

const DEFAULT_CHIBI_8_PACK_SHORTCODES: ArgonStickerShortcode[] = [
  ':smirk:',
  ':coffee:',
  ':arm_waist:',
  ':eyeroll:',
  ':kiss_forehead:',
  ':unamused:',
  ':protective_glare:',
  ':soft_smile:',
];

const DEFAULT_CHIBI_8_PACK_LABELS: Record<number, string> = {
  0: 'Smirk',
  1: 'Black Coffee',
  2: 'Arm Around Waist',
  3: 'Eyeroll',
  4: 'Forehead Kiss',
  5: 'Unamused',
  6: 'Protective Glare',
  7: 'Soft Smile',
};

export const ChibiStickerStudioModal: React.FC<ChibiStickerStudioModalProps> = ({
  isOpen,
  onClose,
  customApiKey,
  onSelectPaidKey,
  onBackupStickersToGist,
}) => {
  const [config, setConfig] = useState<StickerStudioConfig>(() => loadStickerStudioConfig());
  const [undoStack, setUndoStack] = useState<StickerStudioConfig[]>([]);
  const [sheetDataUrl, setSheetDataUrl] = useState<string | null>(() =>
    getCachedStickerSheetDataUrl()
  );
  const [slicedBySlot, setSlicedBySlot] = useState<string[]>([]);
  const [slicedMap, setSlicedMap] = useState<Partial<Record<ArgonStickerShortcode, string>>>(() =>
    getSlicedStickersMap()
  );
  const [numberedContactSheetUrl, setNumberedContactSheetUrl] = useState<string>('');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [swapSourceSlot, setSwapSourceSlot] = useState<number | null>(null);
  const [isSwapMode, setIsSwapMode] = useState<boolean>(true);
  const [isSlicing, setIsSlicing] = useState<boolean>(false);
  const [isAutoLabeling, setIsAutoLabeling] = useState<boolean>(false);
  const [isGeneratingPack, setIsGeneratingPack] = useState<boolean>(false);
  const [packThemePrompt, setPackThemePrompt] = useState<string>(
    'Handsome dark-haired gothic apothecary Argon in tailored black waistcoat & silver rings — 8 expressive die-cut chibi reaction stickers'
  );
  const [allowGeminiFallback, setAllowGeminiFallback] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.IMAGE_GEMINI_FALLBACK);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [argonVisionComment, setArgonVisionComment] = useState<string | null>(null);
  const [customShortcodeDraft, setCustomShortcodeDraft] = useState<string>('');
  const [customLabelDraft, setCustomLabelDraft] = useState<string>('');
  const [libraryStickers, setLibraryStickers] = useState<StickerLibraryEntry[]>(() =>
    getStickerLibrary()
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const singlePngInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const activeCount = Math.max(1, Math.min(60, config.activeCount || 35));
  const cropShape = config.cropShape || 'transparent_freeform';

  const updateConfigWithUndo = (
    updater: StickerStudioConfig | ((prev: StickerStudioConfig) => StickerStudioConfig)
  ) => {
    setConfig((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setUndoStack((stack) => [...stack.slice(-29), prev]);
      return next;
    });
  };

  const handleUndo = () => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const previous = stack[stack.length - 1];
      setConfig(previous);
      setStatusBanner('↩️ Restored previous sticker alignment & settings.');
      return stack.slice(0, -1);
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    const savedCfg = loadStickerStudioConfig();
    const savedSheet = getCachedStickerSheetDataUrl();
    const savedMap = getSlicedStickersMap();
    setConfig(savedCfg);
    setSheetDataUrl(savedSheet);
    setSlicedMap(savedMap);
    setLibraryStickers(getStickerLibrary());
  }, [isOpen]);

  // Keep custom shortcode & label input boxes synced with selectedSlotIndex
  useEffect(() => {
    const safeIdx = Math.min(selectedSlotIndex, Math.max(0, activeCount - 1));
    const sc =
      config.slotShortcodes[safeIdx] ||
      ARGON_STICKERS[safeIdx]?.shortcode ||
      (`:sticker_${safeIdx + 1}:` as ArgonStickerShortcode);
    const def = getStickerByShortcode(sc) || ARGON_STICKERS[safeIdx] || ARGON_STICKERS[0];
    setCustomShortcodeDraft(sc);
    setCustomLabelDraft(config.customLabels?.[safeIdx] ?? def?.label ?? `Sticker #${safeIdx + 1}`);
  }, [selectedSlotIndex, config.slotShortcodes, config.customLabels, activeCount]);

  // Draw the interactive HTML5 <canvas> preview with crop overlays & slice all `activeCount` transparent PNGs
  useEffect(() => {
    if (!isOpen || !sheetDataUrl) return;
    let cancelled = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      if (cancelled) return;
      loadedImageRef.current = img;
      drawInteractiveSheetCanvas(img, config, selectedSlotIndex, swapSourceSlot);

      setIsSlicing(true);
      try {
        const res = await sliceStickerSheetInBrowser({
          sheetDataUrl,
          config,
          tileSize: 144,
        });
        if (cancelled) return;
        setSlicedBySlot(res.slicedBySlot);
        setSlicedMap(res.slicedMap);
        setNumberedContactSheetUrl(res.numberedContactSheetDataUrl);
        await saveSlicedStickersAndSheet({
          slicedMap: res.slicedMap,
          sheetDataUrl,
          config,
          mode: 'append',
        });
        setLibraryStickers(getStickerLibrary());
      } catch (err) {
        if (!cancelled) {
          setErrorBanner(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setIsSlicing(false);
        }
      }
    };
    img.src = sheetDataUrl;

    return () => {
      cancelled = true;
    };
  }, [isOpen, sheetDataUrl, config]);

  // Redraw overlay immediately when selectedSlotIndex or swapSourceSlot changes
  useEffect(() => {
    if (!isOpen || !loadedImageRef.current) return;
    drawInteractiveSheetCanvas(
      loadedImageRef.current,
      config,
      selectedSlotIndex,
      swapSourceSlot
    );
  }, [isOpen, selectedSlotIndex, swapSourceSlot, config]);

  const drawInteractiveSheetCanvas = (
    img: HTMLImageElement,
    cfg: StickerStudioConfig,
    activeSlot: number,
    swapSlot: number | null
  ) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxDisplayW = 520;
    const natW = Math.max(1, img.naturalWidth || img.width);
    const natH = Math.max(1, img.naturalHeight || img.height);
    const scale = maxDisplayW / natW;
    const cW = Math.round(natW * scale);
    const cH = Math.round(natH * scale);

    canvas.width = cW;
    canvas.height = cH;

    // Subtle transparency checkerboard on the preview canvas ONLY (never baked into sliced PNGs!)
    const checkerSize = 14;
    for (let y = 0; y < cH; y += checkerSize) {
      for (let x = 0; x < cW; x += checkerSize) {
        const isEven = (Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2 === 0;
        ctx.fillStyle = isEven ? '#1c1518' : '#120d10';
        ctx.fillRect(x, y, checkerSize, checkerSize);
      }
    }

    ctx.drawImage(img, 0, 0, cW, cH);

    const count = Math.max(1, Math.min(60, cfg.activeCount || 35));
    const useCircle = cfg.cropShape === 'circle_mask';

    // Draw crop guides for all `activeCount` slots from the exact coordinates positioned on the canvas
    for (let slotIndex = 0; slotIndex < count; slotIndex++) {
      const geom = computeStickerSlotCropGeometry({
        slotIndex,
        imgW: cW,
        imgH: cH,
        config: cfg,
      });

      const isSelected = slotIndex === activeSlot;
      const isSwap = slotIndex === swapSlot;

      ctx.save();
      ctx.lineWidth = isSelected || isSwap ? 3 : 1.5;
      ctx.strokeStyle = isSwap
        ? '#f43f5e'
        : isSelected
        ? '#ffe5a3'
        : 'rgba(230, 200, 140, 0.85)';

      // Transparent Freeform / Square Die-Cut Bounding Box (No Circle Clip!)
      ctx.strokeRect(geom.cropX, geom.cropY, geom.cropSize, geom.cropSize);

      // Slot index badge
      const badgeW = 28;
      const badgeH = 15;
      const bx = geom.cropX + 2;
      const by = geom.cropY + 2;
      ctx.fillStyle = isSwap
        ? 'rgba(225, 29, 72, 0.92)'
        : isSelected
        ? 'rgba(197, 155, 71, 0.95)'
        : 'rgba(13, 10, 12, 0.82)';
      ctx.fillRect(bx, by, badgeW, badgeH);
      ctx.fillStyle = isSelected ? '#120b0a' : '#ffe5a3';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`#${slotIndex}`, bx + 3, by + 11);
      ctx.restore();
    }
  };

  if (!isOpen) return null;

  const compressUploadedSheet = (rawDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1600;
          const scale = Math.min(
            1,
            maxDim / Math.max(1, img.width),
            maxDim / Math.max(1, img.height)
          );
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          // Keep 100% transparent background (alpha = 0)
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/png') || rawDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    });
  };

  const handleUploadSheetFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorBanner(null);
    setStatusBanner(
      `Loading & slicing your transparent sprite sheet into ${activeCount} die-cut PNGs...`
    );
    const reader = new FileReader();
    reader.onload = async () => {
      const rawUrl = String(reader.result || '');
      if (!rawUrl) return;
      const optimizedUrl = await compressUploadedSheet(rawUrl);
      setSheetDataUrl(optimizedUrl);
      setStatusBanner(
        `Sliced ${activeCount} transparent die-cut PNG stickers! Click "➕ Append to Library" to add all ${activeCount} stickers without overwriting any previous stickers.`
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAppendSlicedSheetToLibrary = async () => {
    if (slicedBySlot.length === 0) {
      setErrorBanner('Upload or slice a sprite sheet first to append its stickers to your library.');
      return;
    }
    const itemsToAppend = activeCatalog
      .map((def, idx) => ({
        shortcode: def.shortcode,
        label: def.label,
        dataUrl: slicedBySlot[idx] || slicedMap[def.shortcode] || '',
      }))
      .filter((item) => item.dataUrl.startsWith('data:image/'));

    const res = await appendStickersToLibrary({
      newStickers: itemsToAppend,
      sheetDataUrl,
      config,
      preventOverwriteExisting: true,
    });
    setSlicedMap(res.slicedMap);
    setLibraryStickers(res.library);
    setStatusBanner(
      `➕ Appended ${res.addedShortcodes.length} sticker(s) to your Unlimited Sticker Library (${res.library.length} total saved stickers, zero overwrites)!`
    );
  };

  const handleAppendIndividualPngFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setErrorBanner(null);

    void (async () => {
      const newItems: Array<{ shortcode: string; label: string; dataUrl: string }> = [];
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const rawUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
        if (!rawUrl) continue;
        const cleanUrl = await stripBlackBackdropFromDataUrl(
          await compressUploadedSheet(rawUrl)
        );
        const rawBase = file.name
          .replace(/\.[^.]+$/, '')
          .toLowerCase()
          .replace(/[^a-z0-9_]+/g, '_')
          .replace(/^_+|_+$/g, '') || `custom_${Date.now()}_${i + 1}`;
        newItems.push({
          shortcode: `:${rawBase}:`,
          label: file.name.replace(/\.[^.]+$/, ''),
          dataUrl: cleanUrl,
        });
      }

      if (newItems.length > 0) {
        const res = await appendStickersToLibrary({
          newStickers: newItems,
          preventOverwriteExisting: true,
        });
        setSlicedMap(res.slicedMap);
        setLibraryStickers(res.library);
        setStatusBanner(
          `➕ Appended ${res.addedShortcodes.length} individual transparent PNG sticker(s) (${res.addedShortcodes.join(', ')}) to your Unlimited Sticker Library (${res.library.length} total)!`
        );
      }
    })();

    e.target.value = '';
  };

  const handleDeleteSingleSlotOrSticker = async (params: {
    shortcode?: string;
    slotIndex?: number;
  }) => {
    const res = await deleteStickerFromLibrary({
      shortcode: params.shortcode,
      slotIndex: params.slotIndex,
      config,
    });
    setConfig(res.config);
    setSlicedMap(res.slicedMap);
    setLibraryStickers(res.library);
    if (params.slotIndex !== undefined) {
      setSlicedBySlot((prev) => prev.filter((_, i) => i !== params.slotIndex));
      setSelectedSlotIndex((prev) =>
        Math.max(0, Math.min(prev, (res.config.activeCount || 35) - 1))
      );
    }
    setStatusBanner(
      `🗑️ Deleted sticker ${params.shortcode || `#${params.slotIndex}`} from your library (${res.library.length} remaining).`
    );
  };

  const handleClearEntireLibrary = async () => {
    const resetCfg = await clearEntireStickerLibrary();
    setConfig(resetCfg);
    setSlicedMap({});
    setSlicedBySlot([]);
    setSheetDataUrl(null);
    setLibraryStickers([]);
    setStatusBanner('🧹 Cleared entire sticker library. Ready for a fresh pack!');
  };

  const handleCanvasTap = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width;
    const clickY = ((e.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;

    let closestSlot = 0;
    let bestDist = Infinity;
    for (let slotIndex = 0; slotIndex < activeCount; slotIndex++) {
      const geom = computeStickerSlotCropGeometry({
        slotIndex,
        imgW: canvas.width,
        imgH: canvas.height,
        config,
      });
      const dist = Math.hypot(clickX - geom.centerX, clickY - geom.centerY);
      if (dist < bestDist) {
        bestDist = dist;
        closestSlot = slotIndex;
      }
    }
    setSelectedSlotIndex(closestSlot);
  };

  const handleUpdateNudge = (
    slotIndex: number,
    patch: Partial<{ dxPct: number; dyPct: number; scalePct: number }>
  ) => {
    updateConfigWithUndo((prev) => {
      const current = prev.cellNudges[slotIndex] || { dxPct: 0, dyPct: 0, scalePct: 100 };
      const updated = {
        dxPct: Math.max(-50, Math.min(50, patch.dxPct ?? current.dxPct)),
        dyPct: Math.max(-50, Math.min(50, patch.dyPct ?? current.dyPct)),
        scalePct: Math.max(50, Math.min(180, patch.scalePct ?? current.scalePct)),
      };
      return {
        ...prev,
        cellNudges: {
          ...prev.cellNudges,
          [slotIndex]: updated,
        },
      };
    });
  };

  const handleResetSingleSlotNudge = (slotIndex: number) => {
    updateConfigWithUndo((prev) => {
      const nextNudges = { ...prev.cellNudges };
      delete nextNudges[slotIndex];
      return {
        ...prev,
        cellNudges: nextNudges,
      };
    });
  };

  const handleSlotTileClick = (slotIndex: number) => {
    setSelectedSlotIndex(slotIndex);
    if (!isSwapMode) return;

    if (swapSourceSlot === null) {
      setSwapSourceSlot(slotIndex);
      setStatusBanner(
        `Selected Slot #${slotIndex} (${config.slotShortcodes[slotIndex]}) — now tap any second sticker slot to swap their :shortcode: labels!`
      );
    } else if (swapSourceSlot === slotIndex) {
      setSwapSourceSlot(null);
      setStatusBanner('Cancelled slot swap selection.');
    } else {
      const codeA = config.slotShortcodes[swapSourceSlot];
      const codeB = config.slotShortcodes[slotIndex];
      updateConfigWithUndo((prev) => swapStickerStudioSlots(prev, swapSourceSlot, slotIndex));
      setSwapSourceSlot(null);
      setStatusBanner(`Swapped Slot #${swapSourceSlot} (${codeA}) ↔ Slot #${slotIndex} (${codeB})!`);
    }
  };

  const handleAssignShortcodeToSlot = (
    slotIndex: number,
    targetShortcode: ArgonStickerShortcode,
    customLabel?: string
  ) => {
    const normalized = normalizeCustomShortcode(targetShortcode, slotIndex);
    updateConfigWithUndo((prev) => {
      const nextSlots = [...prev.slotShortcodes];
      nextSlots[slotIndex] = normalized;
      const nextLabels = { ...(prev.customLabels || {}) };
      if (customLabel !== undefined && customLabel.trim()) {
        nextLabels[slotIndex] = customLabel.trim();
      }
      return {
        ...prev,
        slotShortcodes: nextSlots,
        customLabels: nextLabels,
      };
    });
    setStatusBanner(
      `Saved custom shortcode ${normalized} for Sticker Slot #${slotIndex}!`
    );
  };

  const handleAutoLabelWithArgonVision = async () => {
    if (isAutoLabeling) return;
    const contactToSend = numberedContactSheetUrl || sheetDataUrl;
    if (!contactToSend) {
      setErrorBanner('Please upload your sprite sheet image first!');
      return;
    }

    setIsAutoLabeling(true);
    setErrorBanner(null);
    setStatusBanner(
      `Sending real PNG pixels (\`inlineData\`) of all ${activeCount} numbered stickers to Argon (\`gemini-4-argon\`) for visual inspection...`
    );

    try {
      const res = await runClientAutoLabelStickers({
        numberedContactSheetDataUrl: contactToSend,
        rawSheetDataUrl: sheetDataUrl,
        currentSlotShortcodes: config.slotShortcodes,
        activeCount,
        customApiKey,
      });

      const nextCfg: StickerStudioConfig = {
        ...config,
        slotShortcodes: res.slotShortcodes,
      };
      updateConfigWithUndo(nextCfg);
      setArgonVisionComment(res.argonComment);
      setStatusBanner(
        `Argon visually inspected your sheet and auto-labeled ${activeCount} stickers!`
      );

      if (onBackupStickersToGist && slicedBySlot.length > 0) {
        const remapped: Partial<Record<ArgonStickerShortcode, string>> = {};
        res.slotShortcodes.slice(0, activeCount).forEach((sc, idx) => {
          if (slicedBySlot[idx]) {
            remapped[sc] = slicedBySlot[idx];
          }
        });
        await saveSlicedStickersAndSheet({
          slicedMap: remapped,
          sheetDataUrl,
          config: nextCfg,
        });
        void onBackupStickersToGist(remapped, nextCfg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorBanner(msg);
      setStatusBanner(null);
    } finally {
      setIsAutoLabeling(false);
    }
  };

  const handleGenerate8StickerChibiPack = async (mode: 'overwrite' | 'append') => {
    if (isGeneratingPack) return;
    setIsGeneratingPack(true);
    setErrorBanner(null);
    setStatusBanner(
      `🎨 Generating fresh 8-sticker Chibi Argon sheet via gpt-image-2.5 (${
        mode === 'overwrite' ? 'Overwriting old/default stickers' : 'Appending to library'
      })…`
    );

    try {
      const genRes = await runClientImageGenerator({
        prompt: packThemePrompt,
        targetType: 'sticker_sheet_8',
        customGeminiApiKey: customApiKey,
        allowGeminiFallback,
      });

      const nextSlotShortcodes = [...DEFAULT_CHIBI_8_PACK_SHORTCODES];
      for (let i = 8; i < ARGON_STICKERS.length; i++) {
        nextSlotShortcodes.push(ARGON_STICKERS[i].shortcode);
      }

      const nextCfg: StickerStudioConfig = {
        ...config,
        rows: 2,
        cols: 4,
        activeCount: 8,
        cropShape: 'transparent_freeform',
        offsetXPct: 0,
        offsetYPct: 0,
        cellNudges: {},
        slotShortcodes: nextSlotShortcodes,
        customLabels: { ...DEFAULT_CHIBI_8_PACK_LABELS },
      };

      const slicedRes = await sliceStickerSheetInBrowser({
        sheetDataUrl: genRes.dataUrl,
        config: nextCfg,
        tileSize: 144,
      });

      if (mode === 'overwrite') {
        await clearEntireStickerLibrary();
        await saveSlicedStickersAndSheet({
          slicedMap: slicedRes.slicedMap,
          sheetDataUrl: genRes.dataUrl,
          config: nextCfg,
          mode: 'replace',
        });
      } else {
        await saveSlicedStickersAndSheet({
          slicedMap: slicedRes.slicedMap,
          sheetDataUrl: genRes.dataUrl,
          config: nextCfg,
          mode: 'append',
        });
      }

      setConfig(nextCfg);
      setSheetDataUrl(genRes.dataUrl);
      setSlicedBySlot(slicedRes.slicedBySlot);
      setSlicedMap(getSlicedStickersMap());
      setNumberedContactSheetUrl(slicedRes.numberedContactSheetDataUrl);
      setLibraryStickers(getStickerLibrary());
      setSelectedSlotIndex(0);

      setStatusBanner(
        `✨ Generated & sliced 8 fresh Chibi Argon stickers via ${genRes.modelUsed} (${
          mode === 'overwrite'
            ? 'Old default/clown stickers overwritten!'
            : 'Appended to Sticker Library!'
        })`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorBanner(msg);
      setStatusBanner(null);
    } finally {
      setIsGeneratingPack(false);
    }
  };

  const safeSelectedSlot = Math.min(selectedSlotIndex, Math.max(0, activeCount - 1));
  const activeSlotNudge = config.cellNudges[safeSelectedSlot] || {
    dxPct: 0,
    dyPct: 0,
    scalePct: 100,
  };
  const activeCatalog = getActiveStickerCatalog(config);
  const activeSlotDef =
    activeCatalog[safeSelectedSlot] ||
    getStickerByShortcode(config.slotShortcodes[safeSelectedSlot]) ||
    ARGON_STICKERS[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#080506]/95 backdrop-blur-md flex flex-col overflow-hidden text-[#f3e7d3]"
      role="dialog"
      aria-modal="true"
      aria-label="Chibi Sticker Studio — Real HTML5 Canvas Slicer & Multimodal Vision Auto-Labeler"
    >
      {/* Top Studio Header */}
      <header className="shrink-0 px-3 sm:px-6 py-3 border-b border-[#b89352]/50 bg-[#120c0e] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base sm:text-lg font-serif font-bold text-[#e6c88c] truncate">
            🎨 Chibi Sticker Studio (Transparent Die-Cut PNG Slicer)
          </span>
          <span className="text-xs font-mono text-[#cbb693]">
            · {slicedBySlot.length}/{activeCount} Transparent PNGs Ready
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={undoStack.length === 0}
            onClick={handleUndo}
            title="Undo your last slider or alignment change"
            className="h-9 px-3 rounded-lg bg-[#241815] hover:bg-[#32211d] border border-[#e6c88c]/70 text-[#ffe5a3] text-xs font-mono font-semibold cursor-pointer disabled:opacity-40"
          >
            ↩️ Undo ({undoStack.length})
          </button>

          {onBackupStickersToGist && Object.keys(slicedMap).length > 0 && (
            <button
              type="button"
              onClick={() => {
                setStatusBanner(`Backing up ${activeCount} sliced stickers & mappings to Gist...`);
                void onBackupStickersToGist(slicedMap, config).then(() =>
                  setStatusBanner(`Backed up ${activeCount} sliced stickers to GitHub Gist!`)
                );
              }}
              className="h-9 px-3 rounded-lg gilded-pill-btn text-xs font-semibold cursor-pointer"
            >
              ☁️ Backup to Gist
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3.5 rounded-lg gilded-send-btn text-xs font-semibold cursor-pointer"
          >
            ✓ Done &amp; Return
          </button>
        </div>
      </header>

      {/* Main Scrollable Studio Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 max-w-6xl mx-auto w-full">
        {/* Step 0: Direct gpt-image-2.5 8-Sticker Chibi Argon Pack Generator (No Forced Nano-Banana) */}
        <section
          data-testid="gpt-image-sticker-generator-section"
          className="p-3.5 rounded-2xl bubble-smoked-glass border-2 border-[#e6c88c]/85 space-y-2.5 shadow-[0_0_24px_rgba(197,155,71,0.16)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-serif font-bold text-[#ffe5a3]">
                ✨ Generate Fresh 8-Sticker Chibi Argon Pack (Primary: <code className="text-[#e6c88c]">gpt-image-2.5</code> · No Forced Nano-Banana)
              </h3>
              <p className="text-xs text-[#cbb693]">
                Generates a 2×4 (8-sticker) transparent die-cut Chibi Argon reaction pack (<code className="text-[#e6c88c]">:smirk:</code>, <code className="text-[#e6c88c]">:coffee:</code>, <code className="text-[#e6c88c]">:arm_waist:</code>, <code className="text-[#e6c88c]">:eyeroll:</code>, <code className="text-[#e6c88c]">:kiss_forehead:</code>, <code className="text-[#e6c88c]">:unamused:</code>, <code className="text-[#e6c88c]">:protective_glare:</code>, <code className="text-[#e6c88c]">:soft_smile:</code>) and slices it into 8 PNGs immediately.
              </p>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] font-mono text-[#e6c88c] cursor-pointer">
              <input
                type="checkbox"
                checked={allowGeminiFallback}
                onChange={(e) => {
                  const next = e.target.checked;
                  setAllowGeminiFallback(next);
                  try {
                    localStorage.setItem(STORAGE_KEYS.IMAGE_GEMINI_FALLBACK, String(next));
                  } catch {
                    // ignore
                  }
                }}
                className="accent-[#c59b47]"
              />
              <span>Fallback to gemini-3-pro-image if no OpenAI key</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              data-testid="sticker-pack-gpt-prompt-input"
              value={packThemePrompt}
              onChange={(e) => setPackThemePrompt(e.target.value)}
              placeholder="Describe your 8-sticker Chibi Argon pack style…"
              className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl gilded-input-well text-xs font-mono text-[#f5ead8]"
            />
            <button
              type="button"
              disabled={isGeneratingPack}
              data-testid="generate-overwrite-8-sticker-pack-btn"
              onClick={() => void handleGenerate8StickerChibiPack('overwrite')}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl gilded-send-btn text-xs font-mono font-bold cursor-pointer disabled:opacity-40 whitespace-nowrap"
            >
              {isGeneratingPack
                ? '⏳ Generating 8 Stickers…'
                : '✨ Generate 8-Sticker Pack & Overwrite Clowns (gpt-image-2.5)'}
            </button>
            <button
              type="button"
              disabled={isGeneratingPack}
              data-testid="generate-append-8-sticker-pack-btn"
              onClick={() => void handleGenerate8StickerChibiPack('append')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 border border-[#ffe5a3] text-[#fff5e4] text-xs font-mono font-semibold cursor-pointer disabled:opacity-40 whitespace-nowrap"
            >
              ➕ Generate &amp; Append 8 Stickers
            </button>
          </div>
        </section>

        {/* Step 1: Upload Real Sprite Sheet + Crop Shape Toggle + Magic Multimodal Auto-Label Button */}
        <section className="p-3.5 rounded-2xl bubble-smoked-glass border border-[#c59b47]/60 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-serif font-bold text-[#e6c88c]">
                1. Upload Your Transparent Sticker Sheet (Preserves 100% Alpha &amp; Die-Cut Outlines)
              </h3>
              <p className="text-xs text-[#cbb693]">
                Slices your uploaded sheet into {activeCount} standalone transparent base64 PNGs (`alpha = 0`, no black circle fill).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadSheetFile}
                className="hidden"
              />
              <input
                ref={singlePngInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAppendIndividualPngFiles}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 px-3.5 rounded-xl gilded-send-btn text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <span>📤 Upload Sprite Sheet</span>
              </button>

              <button
                type="button"
                data-testid="studio-append-library-btn"
                onClick={() => void handleAppendSlicedSheetToLibrary()}
                className="h-10 px-3.5 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 border border-[#ffe5a3] text-[#fff5e4] text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Append these sliced stickers to your library without overwriting any previously saved stickers"
              >
                <span>➕ Append Sheet to Library ({libraryStickers.length} Saved)</span>
              </button>

              <button
                type="button"
                data-testid="studio-append-single-png-btn"
                onClick={() => singlePngInputRef.current?.click()}
                className="h-10 px-3.5 rounded-xl gilded-pill-btn text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                title="Upload 1 or more individual transparent PNGs and append them to your Sticker Library"
              >
                <span>➕ Append Individual PNG(s)</span>
              </button>

              <button
                type="button"
                disabled={!sheetDataUrl || isAutoLabeling}
                onClick={handleAutoLabelWithArgonVision}
                className="h-10 px-3.5 rounded-xl bg-gradient-to-r from-[#581c87] via-[#7e22ce] to-[#6b21a8] hover:brightness-110 border border-[#e6c88c] text-[#fff3db] text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md"
              >
                <span>
                  {isAutoLabeling
                    ? `👁️ Argon is Inspecting ${activeCount} Stickers...`
                    : `👁️ Let Argon Look & Auto-Label (${activeCount} Stickers)`}
                </span>
              </button>

              <button
                type="button"
                data-testid="studio-clear-library-btn"
                onClick={() => void handleClearEntireLibrary()}
                className="h-10 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-400/60 text-red-100 text-xs font-mono cursor-pointer flex items-center gap-1"
                title="Clear/replace the entire sticker pack library"
              >
                <span>🗑️ Clear / Replace Pack</span>
              </button>
            </div>
          </div>

          {/* Transparent Freeform Die-Cut Mode + One-Click Black Circle Cleaner */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#6b5331]/40">
            <span className="text-xs font-mono text-[#e6c88c]">
              ✂️ Slicer Mode: <strong>100% Transparent Freeform / Die-Cut (No Black Circle Clip)</strong>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="studio-reslice-restore-sheet-btn"
                onClick={async () => {
                  setIsSlicing(true);
                  try {
                    const repaired = await resliceOrRepairCurrentStickerPack();
                    setConfig(repaired.config);
                    setSlicedMap(repaired.slicedMap);
                    setLibraryStickers(repaired.library);
                    const nextSheet = getCachedStickerSheetDataUrl();
                    if (nextSheet) {
                      setSheetDataUrl(nextSheet);
                    }
                    setStatusBanner(
                      `🔄 Re-sliced & restored current sheet (${repaired.restoredCount} stickers active, zero broken slots)!`
                    );
                  } finally {
                    setIsSlicing(false);
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer border bg-emerald-900/90 hover:bg-emerald-800 text-[#fff5e4] border-[#ffe5a3] font-bold shadow"
              >
                🔄 Re-Slice / Restore Current Sheet
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsSlicing(true);
                  try {
                    if (sheetDataUrl) {
                      const res = await sliceStickerSheetInBrowser({
                        sheetDataUrl,
                        config: { ...config, cropShape: 'transparent_freeform' },
                        tileSize: 144,
                      });
                      setSlicedBySlot(res.slicedBySlot);
                      setSlicedMap(res.slicedMap);
                      await saveSlicedStickersAndSheet({
                        slicedMap: res.slicedMap,
                        sheetDataUrl,
                        config: { ...config, cropShape: 'transparent_freeform' },
                      });
                    } else {
                      const current = getSlicedStickersMap();
                      const cleaned: Partial<Record<ArgonStickerShortcode, string>> = {};
                      for (const [k, url] of Object.entries(current)) {
                        if (url) {
                          cleaned[k as ArgonStickerShortcode] = await stripBlackBackdropFromDataUrl(url);
                        }
                      }
                      setSlicedMap(cleaned);
                      await saveSlicedStickersAndSheet({
                        slicedMap: cleaned,
                        config: { ...config, cropShape: 'transparent_freeform' },
                      });
                    }
                    setStatusBanner('✨ Stripped all black circles & dark backgrounds—stickers are now 100% transparent die-cut PNGs!');
                  } finally {
                    setIsSlicing(false);
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer border bg-[#c59b47] text-[#120b0a] border-[#ffe5a3] font-bold shadow"
              >
                🪄 Strip Black Circle &amp; Re-Slice Transparent Die-Cut PNGs
              </button>
            </div>
          </div>

          {statusBanner && (
            <div className="px-3 py-2 rounded-xl bg-[#1c140f] border border-[#c59b47]/70 text-xs font-mono text-[#ffe5a3]">
              ✨ {statusBanner}
            </div>
          )}

          {argonVisionComment && (
            <div className="p-3 rounded-xl bg-[#1a1118]/95 border border-[#c084fc]/60 text-xs text-[#f5ead8] space-y-1">
              <div className="font-mono text-[11px] text-[#e6c88c] font-bold">
                👁️ Argon&apos;s Live Multimodal Vision Inspection:
              </div>
              <p className="leading-relaxed">{argonVisionComment}</p>
            </div>
          )}

          {errorBanner && (
            <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/80 text-xs font-mono text-red-100 flex flex-wrap items-center justify-between gap-2">
              <span>⚠️ {errorBanner}</span>
              <div className="flex items-center gap-2">
                {onSelectPaidKey && (
                  <button
                    type="button"
                    onClick={onSelectPaidKey}
                    className="px-2.5 py-1 rounded bg-amber-600 text-amber-50 text-xs font-semibold cursor-pointer"
                  >
                    🔑 Select Paid API Key
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setErrorBanner(null)}
                  className="px-2 py-1 rounded bg-red-900 text-red-100 text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Step 2: Interactive HTML5 Canvas Slicer + Grid & Per-Sticker Nudge Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Live HTML5 Canvas with Crop Guides */}
          <div className="lg:col-span-6 p-3.5 rounded-2xl bubble-smoked-glass border border-[#b89352]/50 flex flex-col items-center space-y-2.5">
            <div className="w-full flex items-center justify-between gap-2">
              <span className="text-xs font-serif font-bold text-[#e6c88c]">
                Interactive HTML5 &lt;canvas&gt; Crop Preview (Tap any box to select)
              </span>
              {isSlicing && (
                <span className="text-[11px] font-mono text-amber-300">
                  Slicing {activeCount} Transparent PNGs…
                </span>
              )}
            </div>

            {sheetDataUrl ? (
              <div className="w-full overflow-auto rounded-xl border border-[#6b5331] bg-[#0b0809] flex items-center justify-center p-2">
                <canvas
                  ref={previewCanvasRef}
                  onClick={handleCanvasTap}
                  className="max-w-full h-auto cursor-crosshair rounded-lg"
                />
              </div>
            ) : (
              <div className="w-full py-14 px-4 rounded-xl border border-dashed border-[#8e6d3b]/70 bg-[#110c0a]/80 text-center space-y-3">
                <p className="text-sm font-serif text-[#e6c88c]">
                  No Sprite Sheet Uploaded Yet
                </p>
                <p className="text-xs text-[#b8a282] max-w-md mx-auto">
                  Tap <strong>Upload Sprite Sheet</strong> above to load your transparent PNG sticker sheet (e.g. 2×4 = 8 Clown Stickers or 7×5 = 35 Chibi Stickers) and slice it with 100% transparent backgrounds.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-4 rounded-xl gilded-send-btn text-xs font-semibold cursor-pointer"
                >
                  📤 Choose Sprite Sheet Image
                </button>
              </div>
            )}
          </div>

          {/* Right: Global Grid Sliders (with - / + Steppers) + Selected Sticker Nudge & Custom Shortcode Input */}
          <div className="lg:col-span-6 space-y-3">
            {/* Global Grid & Calibration */}
            <div className="p-3.5 rounded-2xl bubble-smoked-glass border border-[#b89352]/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-serif font-bold text-[#e6c88c]">
                  2. Grid Dimensions, Sticker Count &amp; Global Calibration
                </h4>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      updateConfigWithUndo((prev) => ({
                        ...prev,
                        rows: 2,
                        cols: 4,
                        activeCount: 8,
                        cropShape: 'transparent_freeform',
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer border ${
                      config.rows === 2 && config.cols === 4 && activeCount === 8
                        ? 'bg-[#c59b47] text-[#120b0a] border-[#ffe5a3] font-bold'
                        : 'bg-[#18110e] text-[#e6c88c] border-[#6b5331]'
                    }`}
                  >
                    🤡 2×4 (8 Stickers)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateConfigWithUndo((prev) => ({
                        ...prev,
                        rows: 4,
                        cols: 2,
                        activeCount: 8,
                        cropShape: 'transparent_freeform',
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer border ${
                      config.rows === 4 && config.cols === 2 && activeCount === 8
                        ? 'bg-[#c59b47] text-[#120b0a] border-[#ffe5a3] font-bold'
                        : 'bg-[#18110e] text-[#e6c88c] border-[#6b5331]'
                    }`}
                  >
                    4×2 (8 Stickers)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateConfigWithUndo((prev) => ({
                        ...prev,
                        rows: 7,
                        cols: 5,
                        activeCount: 35,
                        cropShape: 'transparent_freeform',
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer border ${
                      config.rows === 7 && config.cols === 5 && activeCount === 35
                        ? 'bg-[#c59b47] text-[#120b0a] border-[#ffe5a3] font-bold'
                        : 'bg-[#18110e] text-[#e6c88c] border-[#6b5331]'
                    }`}
                  >
                    7×5 (35)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateConfigWithUndo((prev) => ({
                        ...prev,
                        rows: 5,
                        cols: 7,
                        activeCount: 35,
                        cropShape: 'transparent_freeform',
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer border ${
                      config.rows === 5 && config.cols === 7 && activeCount === 35
                        ? 'bg-[#c59b47] text-[#120b0a] border-[#ffe5a3] font-bold'
                        : 'bg-[#18110e] text-[#e6c88c] border-[#6b5331]'
                    }`}
                  >
                    5×7 (35)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateConfigWithUndo({
                        ...DEFAULT_STICKER_STUDIO_CONFIG,
                        slotShortcodes: [...DEFAULT_STICKER_STUDIO_CONFIG.slotShortcodes],
                        customLabels: {},
                        cellNudges: {},
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#241815] text-[#cbb693] border border-[#6b5331] text-[11px] font-mono cursor-pointer"
                  >
                    ↺ Reset All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                {/* Rows - / + Steppers (No Range Slider so nudges are never wiped by accidental drags) */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-[#140e0b]/80 border border-[#6b5331]/50">
                  <div className="flex items-center justify-between text-[#d4b483]">
                    <span>Rows (Stepper)</span>
                    <span className="font-bold text-sm text-[#ffe5a3]">{config.rows} Rows</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      data-testid="rows-decrement-btn"
                      onClick={() =>
                        updateConfigWithUndo((prev) => {
                          const nextRows = Math.max(1, prev.rows - 1);
                          return {
                            ...prev,
                            rows: nextRows,
                            activeCount: nextRows * prev.cols,
                          };
                        })
                      }
                      className="flex-1 h-8 rounded-lg bg-[#241815] hover:bg-[#33221d] border border-[#8e6d3b] text-[#ffe5a3] font-bold cursor-pointer"
                    >
                      − Row
                    </button>
                    <span className="px-3 py-1 rounded bg-[#0d0908] border border-[#6b5331] text-[#ffe5a3] font-bold">
                      {config.rows}
                    </span>
                    <button
                      type="button"
                      data-testid="rows-increment-btn"
                      onClick={() =>
                        updateConfigWithUndo((prev) => {
                          const nextRows = Math.min(12, prev.rows + 1);
                          return {
                            ...prev,
                            rows: nextRows,
                            activeCount: nextRows * prev.cols,
                          };
                        })
                      }
                      className="flex-1 h-8 rounded-lg bg-[#241815] hover:bg-[#33221d] border border-[#8e6d3b] text-[#ffe5a3] font-bold cursor-pointer"
                    >
                      + Row
                    </button>
                  </div>
                </div>

                {/* Columns - / + Steppers (No Range Slider so nudges are never wiped by accidental drags) */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-[#140e0b]/80 border border-[#6b5331]/50">
                  <div className="flex items-center justify-between text-[#d4b483]">
                    <span>Columns (Stepper)</span>
                    <span className="font-bold text-sm text-[#ffe5a3]">{config.cols} Cols</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      data-testid="cols-decrement-btn"
                      onClick={() =>
                        updateConfigWithUndo((prev) => {
                          const nextCols = Math.max(1, prev.cols - 1);
                          return {
                            ...prev,
                            cols: nextCols,
                            activeCount: prev.rows * nextCols,
                          };
                        })
                      }
                      className="flex-1 h-8 rounded-lg bg-[#241815] hover:bg-[#33221d] border border-[#8e6d3b] text-[#ffe5a3] font-bold cursor-pointer"
                    >
                      − Col
                    </button>
                    <span className="px-3 py-1 rounded bg-[#0d0908] border border-[#6b5331] text-[#ffe5a3] font-bold">
                      {config.cols}
                    </span>
                    <button
                      type="button"
                      data-testid="cols-increment-btn"
                      onClick={() =>
                        updateConfigWithUndo((prev) => {
                          const nextCols = Math.min(12, prev.cols + 1);
                          return {
                            ...prev,
                            cols: nextCols,
                            activeCount: prev.rows * nextCols,
                          };
                        })
                      }
                      className="flex-1 h-8 rounded-lg bg-[#241815] hover:bg-[#33221d] border border-[#8e6d3b] text-[#ffe5a3] font-bold cursor-pointer"
                    >
                      + Col
                    </button>
                  </div>
                </div>

                {/* Active Sticker Count Slider + -/+ Steppers */}
                <div className="space-y-1 p-2 rounded-xl bg-[#140e0b]/80 border border-[#6b5331]/50">
                  <div className="flex items-center justify-between text-[#d4b483]">
                    <span>Sticker Count (Drawer &amp; Slicer)</span>
                    <span className="font-bold text-[#ffe5a3]">{activeCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateConfigWithUndo((prev) => ({
                          ...prev,
                          activeCount: Math.max(1, (prev.activeCount || 35) - 1),
                        }))
                      }
                      className="w-7 h-7 rounded bg-[#241815] border border-[#8e6d3b] text-[#ffe5a3] font-bold cursor-pointer shrink-0"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min={1}
                      max={40}
                      value={activeCount}
                      onChange={(e) =>
                        updateConfigWithUndo((prev) => ({
                          ...prev,
                          activeCount: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#e6c88c]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateConfigWithUndo((prev) => ({
                          ...prev,
                          activeCount: Math.min(60, (prev.activeCount || 35) + 1),
                        }))
                      }
                      className="w-7 h-7 rounded bg-[#241815] border border-[#8e6d3b] text-[#ffe5a3] font-bold cursor-pointer shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Crop Box Scale Slider + -/+ Steppers */}
                <div className="space-y-1 p-2 rounded-xl bg-[#140e0b]/80 border border-[#6b5331]/50">
                  <div className="flex items-center justify-between text-[#d4b483]">
                    <span>Crop Box Scale</span>
                    <span className="font-bold text-[#ffe5a3]">{config.circleScalePct}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateConfigWithUndo((prev) => ({
                          ...prev,
                          circleScalePct: Math.max(40, prev.circleScalePct - 2),
                        }))
                      }
                      className="w-7 h-7 rounded bg-[#241815] border border-[#8e6d3b] text-[#ffe5a3] font-bold cursor-pointer shrink-0"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min={40}
                      max={160}
                      value={config.circleScalePct}
                      onChange={(e) =>
                        updateConfigWithUndo((prev) => ({
                          ...prev,
                          circleScalePct: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#e6c88c]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateConfigWithUndo((prev) => ({
                          ...prev,
                          circleScalePct: Math.min(160, prev.circleScalePct + 2),
                        }))
                      }
                      className="w-7 h-7 rounded bg-[#241815] border border-[#8e6d3b] text-[#ffe5a3] font-bold cursor-pointer shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Global X Offset Slider + -/+ Steppers */}
                <div className="space-y-1 p-2 rounded-xl bg-[#140e0b]/80 border border-[#6b5331]/50">
                  <div className="flex items-center justify-between text-[#d4b483]">
                    <span>X Offset</span>
                    <span className="font-bold text-[#ffe5a3]">{config.offsetXPct}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateConfigWithUndo((prev) => ({
                          ...prev,
                          offsetXPct: Math.max(-45, Number((prev.offsetXPct - 0.5).toFixed(1))),
                        }))
                      }
                      className="w-7 h-7 rounded bg-[#241815] border border-[#8e6d3b] text-[#ffe5a3] font-bold cursor-pointer shrink-0"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      step={0.5}
                      value={config.offsetXPct}
                      onChange={(e) =>
                        updateConfigWithUndo((prev) => ({
                          ...prev,
                          offsetXPct: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#e6c88c]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateConfigWithUndo((prev) => ({
                          ...prev,
                          offsetXPct: Math.min(45, Number((prev.offsetXPct + 0.5).toFixed(1))),
                        }))
                      }
                      className="w-7 h-7 rounded bg-[#241815] border border-[#8e6d3b] text-[#ffe5a3] font-bold cursor-pointer shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Global Y Offset Slider + -/+ Steppers */}
                <div className="space-y-1 p-2 rounded-xl bg-[#140e0b]/80 border border-[#6b5331]/50">
                  <div className="flex items-center justify-between text-[#d4b483]">
                    <span>Y Offset</span>
                    <span className="font-bold text-[#ffe5a3]">{config.offsetYPct}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateConfigWithUndo((prev) => ({
                          ...prev,
                          offsetYPct: Math.max(-45, Number((prev.offsetYPct - 0.5).toFixed(1))),
                        }))
                      }
                      className="w-7 h-7 rounded bg-[#241815] border border-[#8e6d3b] text-[#ffe5a3] font-bold cursor-pointer shrink-0"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min={-40}
                      max={40}
                      step={0.5}
                      value={config.offsetYPct}
                      onChange={(e) =>
                        updateConfigWithUndo((prev) => ({
                          ...prev,
                          offsetYPct: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#e6c88c]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateConfigWithUndo((prev) => ({
                          ...prev,
                          offsetYPct: Math.min(45, Number((prev.offsetYPct + 0.5).toFixed(1))),
                        }))
                      }
                      className="w-7 h-7 rounded bg-[#241815] border border-[#8e6d3b] text-[#ffe5a3] font-bold cursor-pointer shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Per-Sticker Nudge & Custom :shortcode: Input Controls */}
            <div className="p-3.5 rounded-2xl bubble-smoked-glass border border-[#b89352]/50 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-serif font-bold text-[#e6c88c]">
                  3. Slot #{safeSelectedSlot} Custom `:shortcode:`, Label &amp; Fine Nudge ({activeSlotDef.shortcode})
                </h4>
                <button
                  type="button"
                  onClick={() => handleResetSingleSlotNudge(safeSelectedSlot)}
                  className="px-2.5 py-1 rounded-lg bg-[#241815] border border-[#6b5331] text-[11px] font-mono text-[#cbb693] cursor-pointer"
                >
                  ↺ Reset Slot #{safeSelectedSlot}
                </button>
              </div>

              <div className="flex flex-wrap items-start gap-3">
                {/* Unclipped Transparent Die-Cut Preview Tile */}
                <div className="w-20 h-20 rounded-lg border border-[#e6c88c]/70 bg-transparent flex items-center justify-center shrink-0 p-1">
                  {slicedBySlot[safeSelectedSlot] ? (
                    <img
                      src={slicedBySlot[safeSelectedSlot]}
                      alt={activeSlotDef.shortcode}
                      style={{
                        background: 'transparent',
                        borderRadius: 0,
                        border: 'none',
                        objectFit: 'contain',
                      }}
                      className="w-full h-full object-contain bg-transparent border-0 rounded-none"
                    />
                  ) : (
                    <span className="font-mono text-xs text-[#e6c88c]">
                      #{safeSelectedSlot}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-[210px] space-y-2">
                  {/* Editable Custom :shortcode: + Label Input Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="studio-custom-shortcode-input"
                        className="block text-[10px] font-mono text-[#d4b483] mb-0.5"
                      >
                        Type Custom `:shortcode:`:
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          id="studio-custom-shortcode-input"
                          type="text"
                          value={customShortcodeDraft}
                          onChange={(e) => setCustomShortcodeDraft(e.target.value)}
                          onBlur={() =>
                            handleAssignShortcodeToSlot(
                              safeSelectedSlot,
                              customShortcodeDraft,
                              customLabelDraft
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAssignShortcodeToSlot(
                                safeSelectedSlot,
                                customShortcodeDraft,
                                customLabelDraft
                              );
                            }
                          }}
                          placeholder=":clown_honk:"
                          className="w-full h-8 px-2 rounded-lg bg-[#140e0b] border border-[#8e6d3b] font-mono text-xs text-[#ffe5a3]"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="studio-custom-label-input"
                        className="block text-[10px] font-mono text-[#d4b483] mb-0.5"
                      >
                        Sticker Label / Title:
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          id="studio-custom-label-input"
                          type="text"
                          value={customLabelDraft}
                          onChange={(e) => setCustomLabelDraft(e.target.value)}
                          onBlur={() =>
                            handleAssignShortcodeToSlot(
                              safeSelectedSlot,
                              customShortcodeDraft,
                              customLabelDraft
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAssignShortcodeToSlot(
                                safeSelectedSlot,
                                customShortcodeDraft,
                                customLabelDraft
                              );
                            }
                          }}
                          placeholder="Clown Laugh"
                          className="w-full h-8 px-2 rounded-lg bg-[#140e0b] border border-[#8e6d3b] font-sans text-xs text-[#ffe5a3]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleAssignShortcodeToSlot(
                              safeSelectedSlot,
                              customShortcodeDraft,
                              customLabelDraft
                            )
                          }
                          className="h-8 px-2.5 rounded-lg gilded-send-btn text-[11px] font-mono font-bold cursor-pointer shrink-0"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Preset Dropdown */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="studio-slot-shortcode-select"
                      className="text-[11px] font-mono text-[#d4b483] shrink-0"
                    >
                      Or Pick Preset:
                    </label>
                    <select
                      id="studio-slot-shortcode-select"
                      value={
                        ARGON_STICKERS.some((s) => s.shortcode === activeSlotDef.shortcode)
                          ? activeSlotDef.shortcode
                          : ''
                      }
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const preset = getStickerByShortcode(e.target.value);
                        handleAssignShortcodeToSlot(
                          safeSelectedSlot,
                          e.target.value as ArgonStickerShortcode,
                          preset?.label
                        );
                      }}
                      className="flex-1 h-8 px-2 rounded-lg bg-[#140e0b] border border-[#8e6d3b] font-mono text-xs text-[#ffe5a3]"
                    >
                      <option value="">— Custom ({activeSlotDef.shortcode}) —</option>
                      {ARGON_STICKERS.map((s) => (
                        <option key={s.shortcode} value={s.shortcode}>
                          {s.shortcode} — {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Directional & Scale Stepper Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateNudge(safeSelectedSlot, {
                          dxPct: activeSlotNudge.dxPct - 2,
                        })
                      }
                      className="px-2.5 py-1 rounded bg-[#1d1410] border border-[#6b5331] text-xs font-mono cursor-pointer"
                    >
                      ◀ Left
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateNudge(safeSelectedSlot, {
                          dxPct: activeSlotNudge.dxPct + 2,
                        })
                      }
                      className="px-2.5 py-1 rounded bg-[#1d1410] border border-[#6b5331] text-xs font-mono cursor-pointer"
                    >
                      Right ▶
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateNudge(safeSelectedSlot, {
                          dyPct: activeSlotNudge.dyPct - 2,
                        })
                      }
                      className="px-2.5 py-1 rounded bg-[#1d1410] border border-[#6b5331] text-xs font-mono cursor-pointer"
                    >
                      ▲ Up
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateNudge(safeSelectedSlot, {
                          dyPct: activeSlotNudge.dyPct + 2,
                        })
                      }
                      className="px-2.5 py-1 rounded bg-[#1d1410] border border-[#6b5331] text-xs font-mono cursor-pointer"
                    >
                      ▼ Down
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateNudge(safeSelectedSlot, {
                          scalePct: activeSlotNudge.scalePct - 4,
                        })
                      }
                      className="px-2.5 py-1 rounded bg-[#1d1410] border border-[#6b5331] text-xs font-mono cursor-pointer"
                    >
                      🔍 −
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateNudge(safeSelectedSlot, {
                          scalePct: activeSlotNudge.scalePct + 4,
                        })
                      }
                      className="px-2.5 py-1 rounded bg-[#1d1410] border border-[#6b5331] text-xs font-mono cursor-pointer"
                    >
                      🔍 +
                    </button>
                    <span className="text-[10px] font-mono text-[#cbb693] ml-1">
                      (X:{activeSlotNudge.dxPct}% Y:{activeSlotNudge.dyPct}% Scale:{activeSlotNudge.scalePct}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Active Sliced PNG Stickers Grid (Only shows `activeCount` stickers — e.g. 8 for 2x4 or 35 for 7x5) */}
        <section className="p-3.5 rounded-2xl bubble-smoked-glass border border-[#b89352]/50 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs sm:text-sm font-serif font-bold text-[#e6c88c]">
                4. All {activeCount} Active Transparent Die-Cut Sticker PNGs ({isSwapMode ? 'Tap Sticker A then Sticker B to Swap Shortcodes' : 'Tap to Select Slot'})
              </h4>
              <p className="text-xs text-[#cbb693]">
                Every sticker below is a 100% transparent `data:image/png;base64,...` image with zero circular clipping or dark background fill.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSwapMode((prev) => !prev);
                setSwapSourceSlot(null);
              }}
              className={`h-8 px-3 rounded-lg text-xs font-mono cursor-pointer border ${
                isSwapMode
                  ? 'bg-[#c59b47] text-[#120b0a] border-[#ffe5a3] font-bold'
                  : 'bg-[#18110e] text-[#e6c88c] border-[#6b5331]'
              }`}
            >
              {isSwapMode
                ? '🔄 Swap Mode ON (Tap A then B)'
                : '🎯 Select Mode (Tap to Nudge / Rename)'}
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2.5">
            {activeCatalog.map((def, slotIdx) => {
              const pngUrl = slicedBySlot[slotIdx] || slicedMap[def.shortcode];
              const isSelected = slotIdx === safeSelectedSlot;
              const isSwapSource = slotIdx === swapSourceSlot;

              return (
                <div
                  key={slotIdx}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all relative ${
                    isSwapSource
                      ? 'bg-rose-950/80 border-2 border-rose-400 ring-2 ring-rose-300'
                      : isSelected
                      ? 'bg-[#2a1d15] border-2 border-[#ffe5a3]'
                      : 'bg-[#140e0b]/70 hover:bg-[#221711] border-[#6b5331]/70'
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[9px] font-mono text-[#b8a282]">
                    <span>#{slotIdx}</span>
                    <div className="flex items-center gap-1">
                      {isSwapSource && (
                        <span className="text-rose-300 font-bold">SWAP A</span>
                      )}
                      <button
                        type="button"
                        data-testid={`delete-sticker-slot-${slotIdx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteSingleSlotOrSticker({
                            shortcode: def.shortcode,
                            slotIndex: slotIdx,
                          });
                        }}
                        title={`Delete Slot #${slotIdx} (${def.shortcode})`}
                        aria-label={`Delete sticker ${def.shortcode}`}
                        className="px-1 py-0.5 rounded bg-red-950/80 hover:bg-red-800 border border-red-500/50 text-[9px] text-red-200 cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Transparent die-cut preview — NO rounded-full or black background! */}
                  <button
                    type="button"
                    onClick={() => handleSlotTileClick(slotIdx)}
                    className="w-full flex flex-col items-center justify-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                  >
                    <div className="w-16 h-16 bg-transparent flex items-center justify-center">
                      {pngUrl ? (
                        <img
                          src={pngUrl}
                          alt={def.shortcode}
                          style={{
                            background: 'transparent',
                            borderRadius: 0,
                            border: 'none',
                            objectFit: 'contain',
                          }}
                          className="w-full h-full object-contain bg-transparent border-0 rounded-none"
                        />
                      ) : (
                        <span className="font-mono text-[10px] text-[#e6c88c]">
                          #{slotIdx}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono font-semibold text-[#ffe5a3] truncate max-w-full">
                      {def.shortcode}
                    </span>
                    <span className="text-[9px] text-[#cbb693] truncate max-w-full">
                      {def.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 5: Unlimited Saved Sticker Library (All Appended Packs & Individual PNGs) */}
        <section
          data-testid="unlimited-sticker-library-section"
          className="p-3.5 rounded-2xl bubble-smoked-glass border border-[#c59b47]/60 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs sm:text-sm font-serif font-bold text-[#ffe5a3]">
                📚 Unlimited Saved Sticker Library ({libraryStickers.length} Total Stickers in IndexedDB / localStorage)
              </h4>
              <p className="text-xs text-[#cbb693]">
                Uploading a new sprite sheet or individual PNGs appends here without overwriting your earlier stickers. Tap 🗑️ on any sticker to remove just that slot.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => singlePngInputRef.current?.click()}
                className="h-8 px-3 rounded-lg gilded-send-btn text-xs font-mono font-semibold cursor-pointer"
              >
                ➕ Append PNG(s)
              </button>
              <button
                type="button"
                onClick={() => void handleClearEntireLibrary()}
                className="h-8 px-3 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-400/60 text-red-100 text-xs font-mono cursor-pointer"
              >
                🗑️ Clear Entire Library
              </button>
            </div>
          </div>

          {libraryStickers.length === 0 ? (
            <p className="text-xs font-mono text-[#cbb693]">
              No custom stickers saved in your library yet—upload a sheet or individual PNGs above!
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {libraryStickers.map((entry) => (
                <div
                  key={entry.shortcode}
                  className="p-2 rounded-xl bg-[#140e0b]/80 border border-[#6b5331]/70 flex flex-col items-center justify-between gap-1"
                >
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[#ffe5a3] truncate max-w-[75%]">
                      {entry.shortcode}
                    </span>
                    <button
                      type="button"
                      data-testid={`delete-library-sticker-${entry.code}`}
                      onClick={() =>
                        void handleDeleteSingleSlotOrSticker({
                          shortcode: entry.shortcode,
                        })
                      }
                      title={`Delete ${entry.shortcode} from library`}
                      aria-label={`Delete ${entry.shortcode} from library`}
                      className="px-1 py-0.5 rounded bg-red-950/80 hover:bg-red-800 border border-red-500/50 text-[9px] text-red-200 cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="w-14 h-14 bg-transparent flex items-center justify-center">
                    <img
                      src={entry.dataUrl}
                      alt={entry.shortcode}
                      style={{
                        background: 'transparent',
                        borderRadius: 0,
                        border: 'none',
                        objectFit: 'contain',
                      }}
                      className="w-full h-full object-contain bg-transparent border-0 rounded-none"
                    />
                  </div>
                  <span className="text-[9px] text-[#cbb693] truncate max-w-full">
                    {entry.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};


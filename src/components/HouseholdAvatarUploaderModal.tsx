import React, { useState, useRef, useEffect } from 'react';

export interface AvatarRepositoryItem {
  id: string;
  entityKey: string; // 'argon', 'agent-haiku', 'agent-monkey', or agent ID
  entityName: string; // 'Argon', 'Haiku', 'A Monkey', etc.
  title: string; // short title e.g. "Candlelit Library Suit", "Winter Cloak"
  description: string; // description for AI context e.g. "Argon in high-collared black velvet jacket holding a brass lantern"
  dataUrl: string; // compressed 256x256 or high-res cropped data URL
  uploadedAt: number;
}

const AVATAR_REPOSITORY_STORAGE_KEY = 'argon_avatar_repository_v1';

export function loadAvatarRepository(): AvatarRepositoryItem[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(AVATAR_REPOSITORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveAvatarRepository(items: AvatarRepositoryItem[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AVATAR_REPOSITORY_STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // ignore
  }
}

export function addAvatarToRepository(item: Omit<AvatarRepositoryItem, 'id' | 'uploadedAt'>): AvatarRepositoryItem {
  const newItem: AvatarRepositoryItem = {
    ...item,
    id: `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    uploadedAt: Date.now(),
  };
  const current = loadAvatarRepository();
  const updated = [newItem, ...current];
  saveAvatarRepository(updated);
  return newItem;
}

export function deleteAvatarFromRepository(id: string): AvatarRepositoryItem[] {
  const current = loadAvatarRepository();
  const updated = current.filter((item) => item.id !== id);
  saveAvatarRepository(updated);
  return updated;
}

export interface HouseholdAvatarUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableEntities: Array<{ key: string; name: string }>;
  onSetAvatar: (entityKey: string, dataUrl: string, title: string, description: string) => void;
}

export const HouseholdAvatarUploaderModal: React.FC<HouseholdAvatarUploaderModalProps> = ({
  isOpen,
  onClose,
  availableEntities,
  onSetAvatar,
}) => {
  // Step 1: Slide-out menu for selecting entity
  // Step 2: File selector
  // Step 3: Image Crop / Zoom / Pan Modal with circular mask
  // Step 4: Short Description & Title Modal
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>('argon');
  const [rawImageDataUrl, setRawImageDataUrl] = useState<string | null>(null);
  
  // Crop / Zoom / Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Metadata state
  const [avatarTitle, setAvatarTitle] = useState<string>('');
  const [avatarDescription, setAvatarDescription] = useState<string>('');
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);
  const [repoItems, setRepoItems] = useState<AvatarRepositoryItem[]>([]);
  const [viewingRepo, setViewingRepo] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewImgRef = useRef<HTMLImageElement | null>(null);
  const circleGuideRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
      setAvatarTitle('');
      setAvatarDescription('');
      setRawImageDataUrl(null);
      setCroppedDataUrl(null);
      setViewingRepo(false);
      setRepoItems(loadAvatarRepository());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedEntity = availableEntities.find((e) => e.key === selectedEntityKey) || availableEntities[0] || { key: 'argon', name: 'Argon' };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      if (result) {
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
          setRawImageDataUrl(result);
          setZoom(1);
          setPanOffset({ x: 0, y: 0 });
          setStep(3);
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Render crop canvas to produce final 384x384 image matching circular guide with 100% WYSIWYG precision
  const generateCroppedDataUrl = (): string | null => {
    const imgEl = previewImgRef.current;
    const circleEl = circleGuideRef.current;
    if (!imgEl || !circleEl || !rawImageDataUrl) return null;

    const imgRect = imgEl.getBoundingClientRect();
    const circleRect = circleEl.getBoundingClientRect();

    if (imgRect.width <= 0 || circleRect.width <= 0) return null;

    const OUTPUT_SIZE = 384;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Scale factor from on-screen circular frame to output canvas
    const scale = OUTPUT_SIZE / circleRect.width;

    // Direct pixel coordinate mapping from on-screen circle guide to canvas
    const drawX = (imgRect.left - circleRect.left) * scale;
    const drawY = (imgRect.top - circleRect.top) * scale;
    const drawW = imgRect.width * scale;
    const drawH = imgRect.height * scale;

    // Precise circular clip matching the exact circular frame
    ctx.save();
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Fill with dark Sanctuary background inside the circular frame
    ctx.fillStyle = '#0a0608';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    ctx.drawImage(imgEl, drawX, drawY, drawW, drawH);
    ctx.restore();

    return canvas.toDataURL('image/png');
  };

  const handleConfirmCrop = () => {
    const finalDataUrl = generateCroppedDataUrl();
    if (!finalDataUrl) return;
    setCroppedDataUrl(finalDataUrl);
    setStep(4);
  };

  const handleFinalSetAvatar = () => {
    if (!croppedDataUrl) return;
    const finalTitle = avatarTitle.trim() || `${selectedEntity.name} Custom Outfit`;
    const finalDesc = avatarDescription.trim() || `${selectedEntity.name} wearing ${finalTitle}`;

    // Add to Repository
    addAvatarToRepository({
      entityKey: selectedEntity.key,
      entityName: selectedEntity.name,
      title: finalTitle,
      description: finalDesc,
      dataUrl: croppedDataUrl,
    });

    // Invoke callback to set avatar
    onSetAvatar(selectedEntity.key, croppedDataUrl, finalTitle, finalDesc);

    onClose();
  };

  // Pointer drag for Pan
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panOffset };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanOffset({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Household Avatar Establishment"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#140e11] border-2 border-[#d4af37] shadow-[0_12px_45px_rgba(0,0,0,0.95)] p-4 sm:p-5 text-[#ffe5a3] font-mono space-y-4 animate-in fade-in zoom-in-95 duration-150 relative max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#6b5331]/60">
          <div className="flex items-center gap-2 font-bold text-[#ffd700]">
            <span className="text-xl">🦊</span>
            <span className="text-sm font-serif">Establish Household Avatar</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-[#24171d] hover:bg-rose-950 text-[#cbb693] hover:text-rose-200 text-xs font-bold flex items-center justify-center cursor-pointer border border-[#6b5331]"
          >
            ✕
          </button>
        </div>

        {/* Repository Tab Switcher Header */}
        <div className="flex items-center justify-between bg-[#1f1418] p-1.5 rounded-xl border border-[#6b5331]/40 text-xs">
          <button
            type="button"
            onClick={() => setViewingRepo(false)}
            className={`flex-1 py-1.5 rounded-lg text-center font-bold cursor-pointer transition-all ${
              !viewingRepo ? 'bg-[#3b2919] text-[#fff6e5] border border-[#e6c88c]' : 'text-[#cbb693] hover:text-white'
            }`}
          >
            ➕ New Avatar
          </button>
          <button
            type="button"
            onClick={() => {
              setRepoItems(loadAvatarRepository());
              setViewingRepo(true);
            }}
            className={`flex-1 py-1.5 rounded-lg text-center font-bold cursor-pointer transition-all ${
              viewingRepo ? 'bg-[#3b2919] text-[#fff6e5] border border-[#e6c88c]' : 'text-[#cbb693] hover:text-white'
            }`}
          >
            🗃️ Repository ({repoItems.length})
          </button>
        </div>

        {viewingRepo ? (
          /* Avatar Repository View */
          <div className="space-y-3">
            <div className="text-xs text-[#cbb693] leading-relaxed">
              All custom avatars uploaded across characters are stored in this shared AI repository. Characters can access and wear any avatar from here.
            </div>

            {repoItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8e7a61] border border-dashed border-[#6b5331] rounded-xl">
                No custom avatars in repository yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {repoItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-[#1b1115] border border-[#785c37] flex items-center gap-3"
                  >
                    <img
                      src={item.dataUrl}
                      alt={item.title}
                      className="w-12 h-12 rounded-full border-2 border-[#d4af37] object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#ffe5a3] truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-[#e6c88c] truncate">
                        Entity: {item.entityName}
                      </div>
                      <div className="text-[10px] text-[#9e8664] truncate italic">
                        {item.description}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onSetAvatar(item.entityKey, item.dataUrl, item.title, item.description);
                          onClose();
                        }}
                        className="px-2 py-1 rounded bg-[#c59b47] text-[#120b0a] text-[10px] font-bold cursor-pointer hover:brightness-110"
                      >
                        Wear
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = deleteAvatarFromRepository(item.id);
                          setRepoItems(updated);
                        }}
                        className="px-2 py-1 rounded bg-red-950/80 border border-red-500/50 text-red-200 text-[10px] cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* New Avatar Upload Wizard Flow */
          <>
            {/* Step 1: Slide-Out Entity Selector */}
            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-left duration-200">
                <div className="text-sm font-serif font-bold text-[#f5ead8]">
                  Who&apos;s Avatar are we establishing?
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="entity-select" className="text-xs text-[#cbb693]">
                    Select Character or Argon:
                  </label>
                  <select
                    id="entity-select"
                    value={selectedEntityKey}
                    onChange={(e) => setSelectedEntityKey(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-[#0d070a] border-2 border-[#c59b47] font-mono text-sm text-[#ffe5a3] font-bold outline-none cursor-pointer"
                  >
                    {availableEntities.map((ent) => (
                      <option key={ent.key} value={ent.key} className="bg-[#16100d] text-[#f5ead8]">
                        {ent.name} ({ent.key === 'argon' ? 'Lead Host' : 'Staff Agent'})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep(2);
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                  className="w-full h-11 rounded-xl bg-[#c59b47] hover:brightness-110 text-[#120b0a] font-bold text-xs font-serif cursor-pointer shadow active:scale-98 transition-transform flex items-center justify-center gap-2"
                >
                  <span>Next: Choose File →</span>
                </button>
              </div>
            )}

            {/* Step 2: File Selector Fallback */}
            {step === 2 && (
              <div className="space-y-4 text-center py-4">
                <div className="text-xs text-[#cbb693]">
                  Selected Character: <strong className="text-[#ffe5a3]">{selectedEntity.name}</strong>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 rounded-2xl border-2 border-dashed border-[#d4af37] bg-[#1a0e14] hover:bg-[#281620] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="text-3xl">📂</span>
                  <span className="text-xs font-bold text-[#ffe5a3]">Tap to Choose Image File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#a89070] underline cursor-pointer"
                >
                  ← Back to Character Selection
                </button>
              </div>
            )}

            {/* Step 3: Image Crop / Zoom / Pan Modal with Circular Mask */}
            {step === 3 && rawImageDataUrl && (() => {
              const imgAspect = imageDimensions.width && imageDimensions.height
                ? imageDimensions.width / imageDimensions.height
                : 1;
              const GUIDE_DIAMETER = 240;
              let baseImgW = GUIDE_DIAMETER;
              let baseImgH = GUIDE_DIAMETER;
              if (imgAspect >= 1) {
                baseImgW = GUIDE_DIAMETER;
                baseImgH = GUIDE_DIAMETER / imgAspect;
              } else {
                baseImgH = GUIDE_DIAMETER;
                baseImgW = GUIDE_DIAMETER * imgAspect;
              }

              return (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-[#f5ead8] flex items-center justify-between">
                    <span>Align &amp; Crop Avatar for {selectedEntity.name}</span>
                    <span className="text-[10px] text-[#cbb693]">Drag to Pan · Slider to Zoom</span>
                  </div>

                  {/* Circular Mask Viewport Box */}
                  <div
                    className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-[#d4af37] bg-black select-none touch-none cursor-grab active:cursor-grabbing shadow-inner"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  >
                    {/* Raw Image Layer */}
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{
                        transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                      }}
                    >
                      <img
                        ref={previewImgRef}
                        src={rawImageDataUrl}
                        alt="Avatar Crop Preview"
                        style={{
                          width: `${baseImgW * zoom}px`,
                          height: `${baseImgH * zoom}px`,
                          maxWidth: 'none',
                          maxHeight: 'none',
                          display: 'block',
                        }}
                      />
                    </div>

                    {/* Circular Mask Overlay: 240px diameter centered in 256px box (8px margin on each side) */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle 120px at 128px 128px, transparent 119px, rgba(0,0,0,0.8) 120px)',
                      }}
                    />
                    <div
                      ref={circleGuideRef}
                      className="absolute rounded-full border-2 border-dashed border-[#ffd700] pointer-events-none shadow-[0_0_15px_rgba(212,175,55,0.45)]"
                      style={{
                        top: '8px',
                        left: '8px',
                        width: '240px',
                        height: '240px',
                      }}
                    />
                  </div>

                  <div className="text-[10px] text-center text-[#cbb693]">
                    Gold ring marks the avatar border. Everything inside is preserved.
                  </div>

                  {/* Zoom Controls */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-[#cbb693]">
                      <span>🔍 Zoom Level ({zoom.toFixed(2)}x)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setZoom(1);
                          setPanOffset({ x: 0, y: 0 });
                        }}
                        className="text-[10px] text-[#d4af37] underline cursor-pointer"
                      >
                        Reset Alignment
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0.25"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full accent-[#d4af37] cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 h-10 rounded-xl bg-[#24171d] hover:bg-[#38232e] text-[#cbb693] text-xs font-bold border border-[#6b5331]"
                    >
                      ← Reselect
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCrop}
                      className="flex-[2] h-10 rounded-xl bg-[#c59b47] hover:brightness-110 text-[#120b0a] text-xs font-bold cursor-pointer shadow"
                    >
                      Set Avatar →
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Step 4: Short Description & Title Prompt Modal */}
            {step === 4 && croppedDataUrl && (
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 p-3 bg-[#1b1115] rounded-xl border border-[#785c37]">
                  <div className="relative w-16 h-16 rounded-full border-2 border-[#d4af37] overflow-hidden shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.4)] bg-[#0a0608] flex items-center justify-center">
                    <img
                      src={croppedDataUrl}
                      alt="Cropped Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-[#ffe5a3]">Avatar Final Preview</div>
                    <div className="text-[10px] text-[#e6c88c]">
                      Character: <strong>{selectedEntity.name}</strong>
                    </div>
                    <div className="text-[10px] text-[#9e8664] mt-0.5">
                      ✓ Exact 1:1 match with circular guide
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="avatar-title-input" className="block text-xs font-bold text-[#d4b483]">
                    Avatar Title (Outfit Name):
                  </label>
                  <input
                    id="avatar-title-input"
                    type="text"
                    value={avatarTitle}
                    onChange={(e) => setAvatarTitle(e.target.value)}
                    placeholder="e.g. Gothic Library Coat, Velvet Cloak"
                    className="w-full h-10 px-3 rounded-xl bg-[#0d070a] border border-[#785c37] text-xs text-[#f5ead8] placeholder-[#78644e]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="avatar-desc-input" className="block text-xs font-bold text-[#d4b483]">
                    Short Description for AI Vision Context:
                  </label>
                  <textarea
                    id="avatar-desc-input"
                    rows={3}
                    value={avatarDescription}
                    onChange={(e) => setAvatarDescription(e.target.value)}
                    placeholder="Describe what the character is wearing so the AI models know their outfit in chat..."
                    className="w-full p-2.5 rounded-xl bg-[#0d070a] border border-[#785c37] text-xs text-[#f5ead8] placeholder-[#78644e] resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 h-10 rounded-xl bg-[#24171d] hover:bg-[#38232e] text-[#cbb693] text-xs font-bold border border-[#6b5331]"
                  >
                    ← Back to Crop
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalSetAvatar}
                    className="flex-[2] h-10 rounded-xl bg-[#c59b47] hover:brightness-110 text-[#120b0a] text-xs font-bold cursor-pointer shadow"
                  >
                    Confirm &amp; Establish Avatar
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

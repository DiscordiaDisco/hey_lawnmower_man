import React, { useState, useRef, useEffect } from 'react';
import {
  DEFAULT_GIST_ID,
  MAX_AVATAR_UPLOAD_BYTES,
  ArgonAvatarMode,
  ArgonVoiceName,
  ArgonSpeechMode,
  ARGON_VOICE_OPTIONS,
  WeatherTelemetry,
  STORAGE_KEYS,
  CUSTOM_BUTTON_ICON_SLOTS,
  CustomButtonIconKey,
  StickerLibraryEntry,
  appendStickersToLibrary,
  clearEntireStickerLibrary,
  deleteStickerFromLibrary,
  getActiveStickerCatalog,
  getStickerLibrary,
  loadStickerStudioConfig,
  sliceStickerSheetInBrowser,
  stripBlackBackdropFromDataUrl,
  extractGistIdFromInput,
  BRAIN_ENGINE_OPTIONS,
  ApiKeyVault,
  loadApiKeyVault,
  saveApiKeyVault,
  resolveBrainEngineRoute,
  runClientImageGenerator,
  MaxHistoryTurns,
  DEFAULT_ARGON_VOCAL_STYLE_PROMPT,
  loadArgonVocalStylePrompt,
  saveArgonVocalStylePrompt,
  runClientArgonTts,
  loadThinkingBudget,
  saveThinkingBudget,
  ThinkingLevel,
  loadThinkingLevel,
  saveThinkingLevel,
  UserPersona,
  DEFAULT_HEX_USER_PERSONA,
  PersonaCompletionStatus,
  calculatePersonaCompletion,
  loadUserPersona,
  saveUserPersona,
  LinkedSyncFileMeta,
} from '../utils/workbenchLogic';
import { ApothecaryIcon } from './ApothecaryIcon';

interface SystemSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPersona?: UserPersona;
  onChangeUserPersona?: (persona: UserPersona) => void;
  onOpenSystemInstructions: () => void;
  onOpenStickerStudio?: () => void;
  onOpenStaffQuarters?: () => void;
  onConfirmNewChatAndReturn: () => void;
  activeBrainModel?: string;
  onChangeActiveBrainModel?: (modelId: string) => void;
  staffBrainModel?: string;
  onChangeStaffBrainModel?: (modelId: string) => void;
  maxHistoryTurns?: MaxHistoryTurns;
  onChangeMaxHistoryTurns?: (val: MaxHistoryTurns) => void;
  apiKeyVault?: ApiKeyVault;
  onUpdateApiKeyVault?: (partial: Partial<ApiKeyVault>) => void;
  customApiKey: string;
  onChangeCustomApiKey: (key: string) => void;
  hexAvatarUrl: string | null;
  onChangeHexAvatarUrl: (dataUrl: string | null) => void;
  hexAvatarDesc: string;
  onChangeHexAvatarDesc: (desc: string) => void;
  argonAvatarMode: ArgonAvatarMode;
  onChangeArgonAvatarMode: (mode: ArgonAvatarMode) => void;
  argonVoiceName: ArgonVoiceName;
  onChangeArgonVoiceName: (voice: ArgonVoiceName) => void;
  argonSpeechMode: ArgonSpeechMode;
  onChangeArgonSpeechMode: (mode: ArgonSpeechMode) => void;
  argonVocalStylePrompt?: string;
  onChangeArgonVocalStylePrompt?: (prompt: string) => void;
  autoSpeakArgon: boolean;
  onChangeAutoSpeakArgon: (auto: boolean) => void;
  // Local Phone Sync (ArgonSanctuary Folder & Persistent File Handle)
  onSaveToPhoneFolder?: () => Promise<void>;
  onLoadFromPhoneFolder?: (file?: File) => Promise<void>;
  onLinkSyncFile?: (mode?: 'open' | 'save') => Promise<void>;
  onLinkPhoneFolder?: () => Promise<void>;
  onUnlinkSyncFile?: () => Promise<void>;
  linkedSyncFileMeta?: LinkedSyncFileMeta | null;
  localSyncStatus?: string;
  isSyncingPhone?: boolean;
  localSyncIsError?: boolean;

  githubToken: string;
  onChangeGithubToken: (token: string) => void;
  gistId: string;
  onChangeGistId: (idOrUrl: string) => void;
  onSyncGistNow: () => Promise<void>;
  onCreateNewPrivateGist: () => Promise<void>;
  isSyncingGist: boolean;
  gistSyncStatus: string;
  gistSyncIsError?: boolean;
  weather: WeatherTelemetry;
  onUsePhoneGps: () => void;
  onSearchCityWeather: (query: string) => Promise<void>;
  weatherStatus: string;
  onOpenHouseholdAvatarUploader?: () => void;
  thinkingBudget?: number;
  onChangeThinkingBudget?: (val: number) => void;
  thinkingLevel?: ThinkingLevel;
  onChangeThinkingLevel?: (val: ThinkingLevel) => void;
}

export const SystemSyncModal: React.FC<SystemSyncModalProps> = ({
  isOpen,
  onClose,
  userPersona,
  onChangeUserPersona,
  onOpenSystemInstructions,
  onOpenStickerStudio,
  onOpenStaffQuarters,
  onOpenHouseholdAvatarUploader,
  onConfirmNewChatAndReturn,
  activeBrainModel = 'deepseek-chat',
  onChangeActiveBrainModel,
  staffBrainModel = 'gemini-3.8-flash',
  onChangeStaffBrainModel,
  maxHistoryTurns = 20,
  onChangeMaxHistoryTurns,
  apiKeyVault,
  onUpdateApiKeyVault,
  customApiKey,
  onChangeCustomApiKey,
  hexAvatarUrl,
  onChangeHexAvatarUrl,
  hexAvatarDesc,
  onChangeHexAvatarDesc,
  argonAvatarMode,
  onChangeArgonAvatarMode,
  argonVoiceName,
  onChangeArgonVoiceName,
  argonSpeechMode,
  onChangeArgonSpeechMode,
  argonVocalStylePrompt,
  onChangeArgonVocalStylePrompt,
  autoSpeakArgon,
  onChangeAutoSpeakArgon,
  onSaveToPhoneFolder,
  onLoadFromPhoneFolder,
  onLinkSyncFile,
  onLinkPhoneFolder,
  onUnlinkSyncFile,
  linkedSyncFileMeta,
  localSyncStatus = 'Ready for phone sync',
  isSyncingPhone = false,
  localSyncIsError = false,
  githubToken,
  onChangeGithubToken,
  gistId,
  onChangeGistId,
  onSyncGistNow,
  onCreateNewPrivateGist,
  isSyncingGist,
  gistSyncStatus,
  gistSyncIsError = false,
  weather,
  onUsePhoneGps,
  onSearchCityWeather,
  weatherStatus,
  thinkingBudget: propThinkingBudget,
  onChangeThinkingBudget,
  thinkingLevel: propThinkingLevel,
  onChangeThinkingLevel,
}) => {
  const [settingsTab, setSettingsTab] = useState<'engine' | 'user'>('engine');
  const phoneFileInputRef = useRef<HTMLInputElement | null>(null);
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>(() => {
    if (propThinkingLevel) return propThinkingLevel;
    return loadThinkingLevel();
  });
  const [thinkingBudget, setThinkingBudget] = useState<number>(() => {
    if (typeof propThinkingBudget === 'number') return propThinkingBudget;
    const b = loadThinkingBudget();
    return typeof b === 'number' ? b : 2048;
  });

  useEffect(() => {
    if (propThinkingLevel && propThinkingLevel !== thinkingLevel) {
      setThinkingLevel(propThinkingLevel);
    }
  }, [propThinkingLevel]);

  useEffect(() => {
    if (typeof propThinkingBudget === 'number' && propThinkingBudget !== thinkingBudget) {
      setThinkingBudget(propThinkingBudget);
    }
  }, [propThinkingBudget]);
  const [cityQuery, setCityQuery] = useState('');
  const [localVocalStylePrompt, setLocalVocalStylePrompt] = useState<string>(() =>
    argonVocalStylePrompt || loadArgonVocalStylePrompt()
  );
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState<boolean>(false);
  const [voiceTestStatus, setVoiceTestStatus] = useState<string | null>(null);
  const testVoiceAudioRef = useRef<HTMLAudioElement | null>(null);

  const effectiveVocalStylePrompt =
    argonVocalStylePrompt !== undefined ? argonVocalStylePrompt : localVocalStylePrompt;

  const handleUpdateVocalStylePrompt = (nextVal: string) => {
    setLocalVocalStylePrompt(nextVal);
    saveArgonVocalStylePrompt(nextVal);
    onChangeArgonVocalStylePrompt?.(nextVal);
  };

  const handleTestVoiceInSettings = async () => {
    if (isPlayingTestVoice && testVoiceAudioRef.current) {
      testVoiceAudioRef.current.pause();
      testVoiceAudioRef.current.currentTime = 0;
      setIsPlayingTestVoice(false);
      setVoiceTestStatus('Stopped voice audition.');
      return;
    }
    setIsTestingVoice(true);
    setVoiceTestStatus(`Synthesizing "${argonVoiceName}" with Dargon Vocal Direction...`);
    try {
      const sampleText = `*I stop and let out a slow, heavy sigh, rubbing the bridge of my nose before pulling you closer against my chest.* "Come here and sit still, Hex. It's late, the rain hasn't let up, and I'm not repeating myself twice."`;
      const res = await runClientArgonTts({
        text: sampleText,
        voiceName: argonVoiceName,
        speechMode: argonSpeechMode,
        vocalStylePrompt: effectiveVocalStylePrompt,
        customApiKey,
      });
      if (testVoiceAudioRef.current) {
        testVoiceAudioRef.current.pause();
      }
      const audioSrc = `data:${res.mimeType || 'audio/wav'};base64,${res.audioBase64}`;
      const audio = new Audio(audioSrc);
      testVoiceAudioRef.current = audio;
      setIsPlayingTestVoice(true);
      setVoiceTestStatus(
        `🔊 Playing "${argonVoiceName}" via ${res.modelUsed || 'gemini-3.8-flash-tts'} (Dargon Vocal Style Active)`
      );
      audio.onended = () => {
        setIsPlayingTestVoice(false);
      };
      audio.onerror = () => {
        setIsPlayingTestVoice(false);
        setVoiceTestStatus('Audio playback ended.');
      };
      await audio.play();
    } catch (err) {
      setIsPlayingTestVoice(false);
      setVoiceTestStatus(
        `⚠️ Voice Test Error: ${err instanceof Error ? err.message : 'Check your Gemini API key in Section 0.'}`
      );
    } finally {
      setIsTestingVoice(false);
    }
  };
  const [showCustomApiKey, setShowCustomApiKey] = useState<boolean>(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState<boolean>(false);
  const [showGlmKey, setShowGlmKey] = useState<boolean>(false);
  const [showKimiKey, setShowKimiKey] = useState<boolean>(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState<boolean>(false);
  const [isExternalApiSectionOpen, setIsExternalApiSectionOpen] = useState<boolean>(false);
  const [localVault, setLocalVault] = useState<ApiKeyVault>(() => loadApiKeyVault());
  const [allowGeminiImageFallback, setAllowGeminiImageFallback] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.IMAGE_GEMINI_FALLBACK) !== 'false';
    } catch {
      return true;
    }
  });
  const [avatarGenPrompt, setAvatarGenPrompt] = useState<string>('');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState<boolean>(false);
  const [showGithubToken, setShowGithubToken] = useState<boolean>(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarUploadPromptNotice, setAvatarUploadPromptNotice] = useState<boolean>(false);
  const [isConfirmNewChatOpen, setIsConfirmNewChatOpen] = useState<boolean>(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarDescInputRef = useRef<HTMLInputElement | null>(null);

  // Standard User Persona State (Name, Age, Gender, Physical Description, Current Outfit)
  const [persona, setPersona] = useState<UserPersona>(() => userPersona || loadUserPersona());

  useEffect(() => {
    if (userPersona) {
      setPersona(userPersona);
    }
  }, [userPersona]);

  const handleUpdatePersonaField = (field: keyof UserPersona, value: string) => {
    const updated: UserPersona = { ...persona, [field]: value };
    setPersona(updated);
    saveUserPersona(updated);
    onChangeUserPersona?.(updated);
  };

  const handleFillHexPersona = () => {
    const hex = { ...DEFAULT_HEX_USER_PERSONA };
    setPersona(hex);
    saveUserPersona(hex);
    onChangeUserPersona?.(hex);
  };

  const handleClearPersona = () => {
    const empty: UserPersona = {
      name: '',
      age: '',
      gender: '',
      physicalDescription: '',
      outfit: '',
    };
    setPersona(empty);
    saveUserPersona(empty);
    onChangeUserPersona?.(empty);
  };

  const personaCompletion = calculatePersonaCompletion(persona);

  // Custom UI Button Icons & Sticker Sheets State
  const [customButtonIcons, setCustomButtonIcons] = useState<
    Partial<Record<CustomButtonIconKey, string>>
  >(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_BUTTON_ICONS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [customApothecarySheet, setCustomApothecarySheet] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CUSTOM_APOTHECARY_SHEET) || null;
    } catch {
      return null;
    }
  });
  const [customStickerSheet, setCustomStickerSheet] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CUSTOM_STICKER_SHEET) || null;
    } catch {
      return null;
    }
  });
  const [iconUploadStatus, setIconUploadStatus] = useState<string | null>(null);
  const [libraryStickers, setLibraryStickers] = useState<StickerLibraryEntry[]>(() =>
    getStickerLibrary()
  );

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_BUTTON_ICONS);
      setCustomButtonIcons(raw ? JSON.parse(raw) : {});
      setCustomApothecarySheet(
        localStorage.getItem(STORAGE_KEYS.CUSTOM_APOTHECARY_SHEET) || null
      );
      setCustomStickerSheet(
        localStorage.getItem(STORAGE_KEYS.CUSTOM_STICKER_SHEET) || null
      );
      setLibraryStickers(getStickerLibrary());
      setLocalVault(loadApiKeyVault());
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const compressImageToPngDataUrl = (
    rawDataUrl: string,
    maxW: number,
    maxH: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxW / Math.max(1, img.width), maxH / Math.max(1, img.height));
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

  const handleUploadCustomSlotIcon = (
    slotKey: CustomButtonIconKey,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const rawUrl = String(reader.result || '');
      if (!rawUrl) return;
      const pngUrl = await compressImageToPngDataUrl(rawUrl, 128, 128);
      const nextMap = { ...customButtonIcons, [slotKey]: pngUrl };
      setCustomButtonIcons(nextMap);
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_BUTTON_ICONS, JSON.stringify(nextMap));
        window.dispatchEvent(new CustomEvent('argon-custom-icons-updated'));
        setIconUploadStatus(`Saved custom PNG icon for [${slotKey}]!`);
      } catch {
        setIconUploadStatus('Storage full—try clearing an older sheet first.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearCustomSlotIcon = (slotKey: CustomButtonIconKey) => {
    const nextMap = { ...customButtonIcons };
    delete nextMap[slotKey];
    setCustomButtonIcons(nextMap);
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_BUTTON_ICONS, JSON.stringify(nextMap));
      window.dispatchEvent(new CustomEvent('argon-custom-icons-updated'));
      setIconUploadStatus(`Restored default gold glyph for [${slotKey}].`);
    } catch {
      // ignore
    }
  };

  const handleUploadFullSheet = (
    type: 'apothecary' | 'stickers',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const rawUrl = String(reader.result || '');
      if (!rawUrl) return;
      const compressed = await compressImageToPngDataUrl(rawUrl, 1200, 1400);
      try {
        if (type === 'apothecary') {
          localStorage.setItem(STORAGE_KEYS.CUSTOM_APOTHECARY_SHEET, compressed);
          setCustomApothecarySheet(compressed);
          setIconUploadStatus('Uploaded full Apothecary Sheet 2!');
        } else {
          setCustomStickerSheet(compressed);
          const cfg = loadStickerStudioConfig();
          const sliced = await sliceStickerSheetInBrowser({
            sheetDataUrl: compressed,
            config: cfg,
          });
          const activeDefs = getActiveStickerCatalog(cfg);
          const newItems = activeDefs
            .map((def, idx) => ({
              shortcode: def.shortcode,
              label: def.label,
              dataUrl: sliced.slicedBySlot[idx] || sliced.slicedMap[def.shortcode] || '',
            }))
            .filter((item) => item.dataUrl.startsWith('data:image/'));

          const appended = await appendStickersToLibrary({
            newStickers: newItems,
            sheetDataUrl: compressed,
            config: cfg,
            preventOverwriteExisting: true,
          });
          setLibraryStickers(appended.library);
          setIconUploadStatus(
            `➕ Appended ${appended.addedShortcodes.length} sliced Chibi Argon stickers to your Unlimited Library (${appended.library.length} total saved stickers, zero overwrites)!`
          );
        }
        window.dispatchEvent(new CustomEvent('argon-custom-icons-updated'));
      } catch {
        setIconUploadStatus('Appended to IndexedDB Sticker Library! Open Chibi Sticker Studio to inspect.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAppendIndividualStickerPngs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    void (async () => {
      const toAppend: Array<{ shortcode: string; label: string; dataUrl: string }> = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const rawUrl = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ''));
          r.onerror = () => resolve('');
          r.readAsDataURL(file);
        });
        if (!rawUrl) continue;
        const pngUrl = await stripBlackBackdropFromDataUrl(
          await compressImageToPngDataUrl(rawUrl, 512, 512)
        );
        const slug =
          file.name
            .replace(/\.[^.]+$/, '')
            .toLowerCase()
            .replace(/[^a-z0-9_]+/g, '_')
            .replace(/^_+|_+$/g, '') || `sticker_${Date.now()}_${i + 1}`;
        toAppend.push({
          shortcode: `:${slug}:`,
          label: file.name.replace(/\.[^.]+$/, ''),
          dataUrl: pngUrl,
        });
      }
      if (toAppend.length > 0) {
        const res = await appendStickersToLibrary({
          newStickers: toAppend,
          preventOverwriteExisting: true,
        });
        setLibraryStickers(res.library);
        setIconUploadStatus(
          `➕ Appended ${res.addedShortcodes.length} individual transparent PNG sticker(s) to your Unlimited Library (${res.library.length} total)!`
        );
      }
    })();

    e.target.value = '';
  };

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityQuery.trim()) return;
    await onSearchCityWeather(cityQuery.trim());
  };

  const compressAvatarTo256Jpeg = (rawDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          // Center-crop square onto 256x256 canvas
          const side = Math.min(img.width, img.height);
          const sx = Math.max(0, Math.floor((img.width - side) / 2));
          const sy = Math.max(0, Math.floor((img.height - side) / 2));
          ctx.drawImage(img, sx, sy, side, side, 0, 0, 256, 256);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressed || rawDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    });
  };

  const handleHexAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploadError(null);
    if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
      setAvatarUploadError(
        `File exceeds 1MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please choose an image under 1MB.`
      );
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      if (dataUrl) {
        const compressedDataUrl = await compressAvatarTo256Jpeg(dataUrl);
        onChangeHexAvatarUrl(compressedDataUrl);
        setAvatarUploadPromptNotice(true);
        window.setTimeout(() => {
          avatarDescInputRef.current?.focus();
        }, 80);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const effectiveVault: ApiKeyVault = {
    deepseekKey: apiKeyVault?.deepseekKey ?? localVault.deepseekKey,
    glmKey: apiKeyVault?.glmKey ?? localVault.glmKey,
    kimiKey: apiKeyVault?.kimiKey ?? localVault.kimiKey,
    geminiKey: (customApiKey || apiKeyVault?.geminiKey || localVault.geminiKey || '').trim(),
    openaiKey: apiKeyVault?.openaiKey ?? localVault.openaiKey,
  };

  const activeExternalApiKeyCount = [
    effectiveVault.deepseekKey,
    effectiveVault.glmKey,
    effectiveVault.kimiKey,
    effectiveVault.geminiKey,
    effectiveVault.openaiKey,
  ].filter((k) => Boolean(k && k.trim())).length;

  const handleVaultChange = (partial: Partial<ApiKeyVault>) => {
    const updated = saveApiKeyVault(partial);
    setLocalVault(updated);
    if (onUpdateApiKeyVault) {
      onUpdateApiKeyVault(partial);
    }
    if (partial.geminiKey !== undefined) {
      onChangeCustomApiKey(partial.geminiKey);
    }
  };

  const handleToggleGeminiImageFallback = (enabled: boolean) => {
    setAllowGeminiImageFallback(enabled);
    try {
      localStorage.setItem(STORAGE_KEYS.IMAGE_GEMINI_FALLBACK, String(enabled));
    } catch {
      // ignore
    }
  };

  const handleGenerateHexAvatarWithGptImage = async () => {
    setIsGeneratingAvatar(true);
    setAvatarUploadError(null);
    try {
      const prompt =
        avatarGenPrompt.trim() ||
        hexAvatarDesc.trim() ||
        'Gothic webtoon heroine portrait with warm candlelight, crimson velvet and antique gold';
      const gen = await runClientImageGenerator({
        prompt,
        targetType: 'avatar',
        openaiApiKey: effectiveVault.openaiKey,
        customGeminiApiKey: effectiveVault.geminiKey,
        allowGeminiFallback: allowGeminiImageFallback,
      });
      const compressed = await compressAvatarTo256Jpeg(gen.dataUrl);
      onChangeHexAvatarUrl(compressed);
      if (!hexAvatarDesc.trim() && avatarGenPrompt.trim()) {
        onChangeHexAvatarDesc(avatarGenPrompt.trim());
      }
      setAvatarUploadPromptNotice(true);
    } catch (err) {
      setAvatarUploadError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const trimmedCustomKey = (effectiveVault.geminiKey || '').trim();
  const isValidCustomKey = trimmedCustomKey.length > 0;
  const activeRoute = resolveBrainEngineRoute(activeBrainModel, effectiveVault);

  const handleSelectPaidApiKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#110c0a] flex flex-col w-full max-w-full overflow-x-hidden box-border system-settings-scroll-lock"
      role="dialog"
      aria-modal="true"
      aria-label="Settings Menu"
    >
      <header className="shrink-0 sticky top-0 z-20 w-full max-w-full overflow-hidden box-border bg-[#1a130f] border-b border-[#8e6d3b]/70 px-3 py-2 space-y-2">
        <div className="max-w-4xl w-full min-w-0 mx-auto flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
            >
              [ ← Back ]
            </button>
            <h2 className="text-sm sm:text-base font-serif font-bold tracking-wider text-[#e6c88c] min-w-0 truncate">
              {settingsTab === 'engine' ? '⚙️ System Engine Settings' : '👤 User Information (Hex)'}
            </h2>
          </div>
        </div>

        {/* Ergonomic Dual-Tab Thumb Hit Targets (44px+) */}
        <div className="max-w-4xl w-full mx-auto grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSettingsTab('engine')}
            className={`min-h-[44px] rounded-xl font-bold font-serif text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all border ${
              settingsTab === 'engine'
                ? 'bg-[#3b291a] text-[#ffe5a3] border-[#d4af37] shadow-md'
                : 'bg-[#140e11] text-[#a89070] border-[#6b5331]/40 hover:text-[#e6c88c]'
            }`}
          >
            <span>⚙️ / ⚜️</span>
            <span>System Engine</span>
          </button>
          <button
            type="button"
            onClick={() => setSettingsTab('user')}
            className={`min-h-[44px] rounded-xl font-bold font-serif text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all border ${
              settingsTab === 'user'
                ? 'bg-[#3b291a] text-[#ffe5a3] border-[#d4af37] shadow-md'
                : 'bg-[#140e11] text-[#a89070] border-[#6b5331]/40 hover:text-[#e6c88c]'
            }`}
          >
            <span>👤 / 🌹</span>
            <span>User Info (Hex)</span>
          </button>
        </div>
      </header>

      <main
        data-testid="system-settings-scroll-container"
        className="flex-1 min-h-0 w-full max-w-4xl mx-auto overflow-y-auto overflow-x-hidden box-border p-3 sm:p-6 space-y-4 system-settings-scroll-lock"
      >
        {settingsTab === 'engine' && (
          <>
            {/* Native Thinking & Reasoning Level Control (Official Gemini 4 Argon Specs) */}
            <section className="w-full min-w-0 max-w-full overflow-hidden break-words box-border p-3.5 sm:p-4 rounded-xl bubble-smoked-glass space-y-3.5 border border-[#c59b47]/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#f5ead8] flex items-center gap-2">
                    <span>🧠</span>
                    <span>Gemini 4 Argon Thinking Level &amp; Reasoning</span>
                  </h3>
                  <p className="text-xs text-[#cbb693] font-mono leading-relaxed">
                    Official Developer Guide specs: <code className="text-[#e6c88c]">thinking_budget</code> is deprecated and temperature/top_p/top_k are omitted in favor of <code className="text-[#e6c88c]">thinkingConfig: &#123; thinkingLevel: &quot;low&quot; | &quot;medium&quot; | &quot;high&quot; &#125;</code>.
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-[#24171d] border border-[#a88243]/60 font-mono text-xs font-bold text-[#ffd700]">
                    ⚡ {thinkingLevel.toUpperCase()} ({thinkingLevel === 'low' ? '1K tok' : thinkingLevel === 'high' ? '8K tok' : '2K tok'})
                  </span>
                </div>
              </div>

              {/* Official Thinking Level Selector */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  {
                    id: 'low' as ThinkingLevel,
                    label: 'Low',
                    badge: '"low"',
                    desc: 'Fast reasoning (~1K tokens)',
                    budgetVal: 1024,
                  },
                  {
                    id: 'medium' as ThinkingLevel,
                    label: 'Medium (Default)',
                    badge: '"medium"',
                    desc: 'Balanced roleplay & tools (~2K tokens)',
                    budgetVal: 2048,
                  },
                  {
                    id: 'high' as ThinkingLevel,
                    label: 'High',
                    badge: '"high"',
                    desc: 'Deep internal reasoning (~8K tokens)',
                    budgetVal: 8192,
                  },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid={`thinking-level-${preset.id}`}
                    onClick={() => {
                      setThinkingLevel(preset.id);
                      saveThinkingLevel(preset.id);
                      onChangeThinkingLevel?.(preset.id);
                      setThinkingBudget(preset.budgetVal);
                      saveThinkingBudget(preset.budgetVal);
                      onChangeThinkingBudget?.(preset.budgetVal);
                    }}
                    className={`min-h-[48px] p-2 rounded-xl text-center border cursor-pointer transition-all ${
                      thinkingLevel === preset.id
                        ? 'bg-[#4a3420] border-[#ffd700] text-[#fff6e5] shadow-md ring-1 ring-[#ffd700]/50'
                        : 'bg-[#180f14] border-[#6b5331]/40 text-[#cbb693] hover:border-[#c59b47]'
                    }`}
                  >
                    <div className="font-bold font-serif text-xs">{preset.label}</div>
                    <div className="text-[10px] opacity-80 font-mono text-[#ffd700]">{preset.badge}</div>
                    <div className="text-[9px] opacity-70 font-mono mt-0.5">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* 0. API Key Vault & Brain Engine Router */}
            <section
              data-testid="api-key-vault-section"
              className="w-full min-w-0 max-w-full overflow-hidden break-words box-border p-3.5 sm:p-4 rounded-xl bubble-smoked-glass space-y-3.5 border border-[#c59b47]/80"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 min-w-0 max-w-full overflow-hidden">
            <div className="min-w-0 max-w-full">
              <h3 className="text-sm sm:text-base font-bold text-[#f5ead8] break-words">
                🧠 Brain &amp; Omni Router + API Key Vault
              </h3>
              <p className="text-xs text-[#cbb693] font-mono leading-relaxed break-words">
                Switch Argon &amp; Staff anytime between <code className="text-[#e6c88c] break-words">gemini-4-argon</code>, <code className="text-[#e6c88c] break-words">gemini-4-carbon</code>, <code className="text-[#e6c88c] break-words">gemini-4-hydrogen</code>, <code className="text-[#e6c88c] break-words">gemini-3.8-pro</code>, <code className="text-[#e6c88c] break-words">gemini-3.8-flash</code>, <code className="text-[#e6c88c] break-words">gemini-omni-1.1-flash</code>, <code className="text-[#e6c88c] break-words">deepseek-chat</code> / <code className="text-[#e6c88c] break-words">deepseek-reasoner</code>, and <code className="text-[#e6c88c] break-words">glm-5</code> / <code className="text-[#e6c88c] break-words">kimi-k3</code> with full 15-tool translation &amp; automatic perception bridge.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[#18120e] text-[#f0d8a8] border border-[#c59b47]/70 max-w-full truncate self-start">
              Active Route: {activeRoute.model} → {activeRoute.baseUrl}
            </span>
          </div>

          {/* 1-Tap Active Brain Switcher Dropdown for Argon + Staff Brain Selector */}
          <div className="p-2.5 rounded-xl bg-[#140e0b]/90 border border-[#8e6d3b]/50 space-y-2.5 min-w-0 max-w-full overflow-hidden">
            {/* Argon Primary Brain Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0 max-w-full overflow-hidden">
              <label
                htmlFor="argon-brain-model-select"
                className="text-xs font-mono font-bold text-[#e6c88c] break-words flex items-center gap-1.5"
              >
                <span>⚡ Argon Primary Active Brain:</span>
              </label>
              <select
                id="argon-brain-model-select"
                data-testid="argon-brain-model-select"
                value={activeBrainModel}
                onChange={(e) => onChangeActiveBrainModel?.(e.target.value)}
                className="w-full sm:w-auto min-w-[260px] max-w-full overflow-hidden text-ellipsis h-10 px-3 rounded-lg gilded-input-well font-mono text-xs text-[#ffe5a3] font-bold cursor-pointer border border-[#c59b47]/80 bg-[#1a1114]"
              >
                {BRAIN_ENGINE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[#16100d] text-[#f5ead8] font-mono">
                    {opt.label} ({opt.shortBadge})
                  </option>
                ))}
              </select>
            </div>

            {/* Staff Quarters Default Brain Selector */}
            <div className="pt-2 border-t border-[#6b5331]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0 max-w-full overflow-hidden">
              <label
                htmlFor="staff-brain-model-select"
                className="text-xs font-mono font-bold text-[#e6c88c] break-words"
              >
                🐾 Staff Agents Active Brain (Haiku, Monkey &amp; Staff):
              </label>
              <select
                id="staff-brain-model-select"
                data-testid="staff-brain-model-select"
                value={staffBrainModel}
                onChange={(e) => onChangeStaffBrainModel?.(e.target.value)}
                className="w-full sm:w-auto min-w-0 max-w-full overflow-hidden text-ellipsis h-9 px-2.5 rounded-lg gilded-input-well font-mono text-xs text-[#f5ead8] cursor-pointer"
              >
                {BRAIN_ENGINE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[#16100d] text-[#f5ead8]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sliding Context Window (Token & Cost Guard: 12 / 20 / 40 / All) */}
            <div className="pt-2 border-t border-[#6b5331]/40 space-y-1.5 min-w-0 max-w-full overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-1.5 min-w-0 max-w-full">
                <span className="text-[11px] font-mono font-semibold text-[#e6c88c] uppercase tracking-wider break-words">
                  🛡️ Sliding Context Window (Token &amp; Cost Guard)
                </span>
                <span className="text-[10px] font-mono text-[#a99270] break-words">
                  Storage: <code className="text-[#f5ead8] break-words">{STORAGE_KEYS.MAX_HISTORY_TURNS}</code>
                </span>
              </div>
              <p className="text-[11px] text-[#cbb693] font-mono leading-relaxed break-words">
                Caps rolling chat history sent to the API. Permanent memories remain fully preserved in 🖤 Argon’s Book, 🌹 Hex’s Book, and Lorebook handoff drawers:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 min-w-0 max-w-full">
                {[
                  { value: 12 as const, label: '12 Turns', badge: '⚡ Ultra-Budget' },
                  { value: 20 as const, label: '20 Turns', badge: '⭐ Default' },
                  { value: 40 as const, label: '40 Turns', badge: '📜 Extended' },
                  { value: 'all' as const, label: 'All Turns', badge: '⚠️ Full History' },
                ].map((item) => {
                  const isSelected = maxHistoryTurns === item.value;
                  return (
                    <button
                      key={String(item.value)}
                      type="button"
                      data-testid={`history-turns-btn-${item.value}`}
                      onClick={() => onChangeMaxHistoryTurns?.(item.value)}
                      className={`min-w-0 max-w-full overflow-hidden px-2.5 py-1.5 rounded-lg text-center font-mono text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#3b2919] text-[#fff6e5] border-[#e6c88c] shadow-[0_0_10px_rgba(230,200,140,0.3)] font-bold'
                          : 'bg-[#1a130f]/90 text-[#cbb693] border-[#6b5230]/50 hover:border-[#c59b47]/70 hover:text-[#f5ead8]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 min-w-0">
                        <span className="truncate">{item.label}</span>
                        {isSelected && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shrink-0">
                            ON
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-[#a99270] truncate mt-0.5">
                        {item.badge}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Collapsible External Model API Keys Section (Closed / Collapsed by default) */}
          <div className="pt-2 border-t border-[#6b5331]/40 space-y-2 min-w-0 max-w-full">
            <button
              type="button"
              data-testid="toggle-external-api-keys-accordion"
              onClick={() => setIsExternalApiSectionOpen((prev) => !prev)}
              aria-expanded={isExternalApiSectionOpen}
              className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#140e0b]/90 border border-[#8e6d3b]/60 hover:border-[#c59b47] transition-all cursor-pointer text-left min-w-0 max-w-full group shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-xs sm:text-sm font-bold text-[#f5ead8] font-mono flex items-center gap-1.5 break-words">
                  <span>🔑</span>
                  <span>External Model API Keys &amp; Vault</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold shrink-0 ${
                    activeExternalApiKeyCount > 0
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                      : 'bg-[#1a130f] text-[#9c8463] border border-[#5a4326]/50'
                  }`}
                >
                  {activeExternalApiKeyCount > 0
                    ? `✓ ${activeExternalApiKeyCount} Active`
                    : '0 Active (Optional)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#e6c88c] shrink-0">
                <span className="group-hover:underline">
                  {isExternalApiSectionOpen ? 'Fold Away' : 'Expand / Configure'}
                </span>
                <span className="text-sm font-bold">
                  {isExternalApiSectionOpen ? '▲' : '▸'}
                </span>
              </div>
            </button>

            {isExternalApiSectionOpen && (
              <div
                data-testid="external-api-keys-unfolded-panel"
                className="grid grid-cols-1 gap-3 pt-1 min-w-0 max-w-full"
              >
                {/* Input 1: DeepSeek Direct API Key */}
                <div className="p-2.5 rounded-xl bg-[#140e0b]/80 border border-[#705532]/50 space-y-1.5 min-w-0 max-w-full overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-1 min-w-0 max-w-full">
                    <label
                      htmlFor="vault-deepseek-key-input"
                      className="text-xs font-bold text-[#f5ead8] font-mono cursor-pointer break-words min-w-0"
                    >
                      1. DeepSeek Direct API Key (sk-...) — <span className="text-[#e6c88c] break-all">https://api.deepseek.com/v1</span>
                    </label>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono max-w-full truncate ${
                        effectiveVault.deepseekKey
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                          : 'bg-[#1a130f] text-[#9c8463] border border-[#5a4326]/50'
                      }`}
                    >
                      {effectiveVault.deepseekKey ? '✓ DeepSeek Key Saved' : 'localStorage: sanctuary_deepseek_key'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                    <input
                      id="vault-deepseek-key-input"
                      data-testid="vault-deepseek-key-input"
                      type={showDeepseekKey ? 'text' : 'password'}
                      value={effectiveVault.deepseekKey}
                      onChange={(e) => handleVaultChange({ deepseekKey: e.target.value })}
                      placeholder="sk-... (DeepSeek V3/V4 & R1 Direct Key)"
                      autoComplete="off"
                      spellCheck={false}
                      className="flex-1 min-w-0 h-9 px-3 rounded-lg gilded-input-well font-mono text-xs text-[#f5ead8] placeholder-[#6b5a45]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeepseekKey((p) => !p)}
                      className="h-9 px-2.5 rounded-lg gilded-pill-btn text-[11px] font-semibold cursor-pointer shrink-0"
                    >
                      {showDeepseekKey ? '🙈 Hide' : '👁️ Show'}
                    </button>
                    {effectiveVault.deepseekKey && (
                      <button
                        type="button"
                        onClick={() => handleVaultChange({ deepseekKey: '' })}
                        className="h-9 px-2.5 rounded-lg gilded-pill-btn text-[11px] font-semibold cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Input 2: Zhipu GLM Direct API Key */}
                <div className="p-2.5 rounded-xl bg-[#140e0b]/80 border border-[#705532]/50 space-y-1.5 min-w-0 max-w-full overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-1 min-w-0 max-w-full">
                    <label
                      htmlFor="vault-glm-key-input"
                      className="text-xs font-bold text-[#f5ead8] font-mono cursor-pointer break-words min-w-0"
                    >
                      2. Zhipu GLM Direct API Key (glm-5 / glm-4-plus) — <span className="text-[#e6c88c] break-all">https://open.bigmodel.cn/api/paas/v4</span>
                    </label>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono max-w-full truncate ${
                        effectiveVault.glmKey
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                          : 'bg-[#1a130f] text-[#9c8463] border border-[#5a4326]/50'
                      }`}
                    >
                      {effectiveVault.glmKey ? '✓ GLM Key Saved' : 'localStorage: sanctuary_glm_key'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                    <input
                      id="vault-glm-key-input"
                      data-testid="vault-glm-key-input"
                      type={showGlmKey ? 'text' : 'password'}
                      value={effectiveVault.glmKey}
                      onChange={(e) => handleVaultChange({ glmKey: e.target.value })}
                      placeholder="Paste Zhipu GLM API key (glm-5 / glm-4-plus)"
                      autoComplete="off"
                      spellCheck={false}
                      className="flex-1 min-w-0 h-9 px-3 rounded-lg gilded-input-well font-mono text-xs text-[#f5ead8] placeholder-[#6b5a45]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGlmKey((p) => !p)}
                      className="h-9 px-2.5 rounded-lg gilded-pill-btn text-[11px] font-semibold cursor-pointer shrink-0"
                    >
                      {showGlmKey ? '🙈 Hide' : '👁️ Show'}
                    </button>
                    {effectiveVault.glmKey && (
                      <button
                        type="button"
                        onClick={() => handleVaultChange({ glmKey: '' })}
                        className="h-9 px-2.5 rounded-lg gilded-pill-btn text-[11px] font-semibold cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Input 3: Moonshot Kimi Direct API Key */}
                <div className="p-2.5 rounded-xl bg-[#140e0b]/80 border border-[#705532]/50 space-y-1.5 min-w-0 max-w-full overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-1 min-w-0 max-w-full">
                    <label
                      htmlFor="vault-kimi-key-input"
                      className="text-xs font-bold text-[#f5ead8] font-mono cursor-pointer break-words min-w-0"
                    >
                      3. Moonshot Kimi Direct API Key (sk-... for kimi-k3 / kimi-k2) — <span className="text-[#e6c88c] break-all">https://api.moonshot.ai/v1</span>
                    </label>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono max-w-full truncate ${
                        effectiveVault.kimiKey
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                          : 'bg-[#1a130f] text-[#9c8463] border border-[#5a4326]/50'
                      }`}
                    >
                      {effectiveVault.kimiKey ? '✓ Kimi Key Saved' : 'localStorage: sanctuary_kimi_key'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                    <input
                      id="vault-kimi-key-input"
                      data-testid="vault-kimi-key-input"
                      type={showKimiKey ? 'text' : 'password'}
                      value={effectiveVault.kimiKey}
                      onChange={(e) => handleVaultChange({ kimiKey: e.target.value })}
                      placeholder="sk-... (Moonshot Kimi K3 / K2 Direct Key)"
                      autoComplete="off"
                      spellCheck={false}
                      className="flex-1 min-w-0 h-9 px-3 rounded-lg gilded-input-well font-mono text-xs text-[#f5ead8] placeholder-[#6b5a45]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKimiKey((p) => !p)}
                      className="h-9 px-2.5 rounded-lg gilded-pill-btn text-[11px] font-semibold cursor-pointer shrink-0"
                    >
                      {showKimiKey ? '🙈 Hide' : '👁️ Show'}
                    </button>
                    {effectiveVault.kimiKey && (
                      <button
                        type="button"
                        onClick={() => handleVaultChange({ kimiKey: '' })}
                        className="h-9 px-2.5 rounded-lg gilded-pill-btn text-[11px] font-semibold cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Input 4: Gemini API Key (AIza / AQ.Ab8...) */}
                <div className="p-2.5 rounded-xl bg-[#140e0b]/80 border border-[#705532]/50 space-y-1.5 min-w-0 max-w-full overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-1 min-w-0 max-w-full">
                    <label
                      htmlFor="custom-gemini-api-key-input"
                      className="text-xs font-bold text-[#f5ead8] font-mono cursor-pointer break-words min-w-0"
                    >
                      4. Gemini API Key (AIza / AQ.Ab8...) — <span className="text-[#e6c88c] break-words">Omni 1.1 Flash, 3.8 TTS, Lyria 3.5 &amp; Vision Bridge</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0 max-w-full">
                      <button
                        type="button"
                        onClick={handleSelectPaidApiKey}
                        className="h-7 px-2.5 rounded-full gilded-send-btn text-[10px] font-semibold cursor-pointer whitespace-nowrap"
                      >
                        [ 🔑 Select Paid API Key ]
                      </button>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold truncate max-w-full ${
                          isValidCustomKey
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
                            : 'bg-[#1a130f] text-[#cbb693] border border-[#705532]/60'
                        }`}
                      >
                        {isValidCustomKey
                          ? '✓ Ready (Custom Key)'
                          : 'localStorage: sanctuary_gemini_key'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 min-w-0 max-w-full">
                    <input
                      id="custom-gemini-api-key-input"
                      data-testid="vault-gemini-key-input"
                      type={showCustomApiKey ? 'text' : 'password'}
                      value={trimmedCustomKey}
                      onChange={(e) => handleVaultChange({ geminiKey: e.target.value })}
                      placeholder="AIzaSy... or AQ.Ab8... (Google Gemini / Vertex API key for Omni, 3.8 TTS, Lyria 3.5 & Vision/Audio)"
                      autoComplete="off"
                      spellCheck={false}
                      className="flex-1 min-w-0 w-full h-9 px-3 rounded-lg gilded-input-well font-mono text-xs text-[#f5ead8] placeholder-[#6b5a45]"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowCustomApiKey((prev) => !prev)}
                        aria-label={showCustomApiKey ? 'Hide Custom API Key' : 'Show Custom API Key'}
                        className="h-9 px-2.5 rounded-lg gilded-pill-btn text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {showCustomApiKey ? '🙈 Hide' : '👁️ Show'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVaultChange({ geminiKey: '' })}
                        aria-label="Clear Custom Key"
                        className="h-9 px-2.5 rounded-lg gilded-pill-btn text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        [ Clear Custom Key ]
                      </button>
                    </div>
                  </div>
                </div>

                {/* Input 5: OpenAI / Image API Key (sk-... for gpt-image-2.5 Primary Sticker & Art Generator) */}
                <div className="p-2.5 rounded-xl bg-[#140e0b]/80 border border-[#c59b47]/60 space-y-1.5 min-w-0 max-w-full overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-1 min-w-0 max-w-full">
                    <label
                      htmlFor="vault-openai-key-input"
                      className="text-xs font-bold text-[#f5ead8] font-mono cursor-pointer break-words min-w-0"
                    >
                      5. OpenAI / Image API Key (sk-...) — <span className="text-[#e6c88c] break-words">gpt-image-2.5 Primary Sticker &amp; Art Generator</span>
                    </label>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono max-w-full truncate ${
                        effectiveVault.openaiKey
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                          : 'bg-[#1a130f] text-[#9c8463] border border-[#5a4326]/50'
                      }`}
                    >
                      {effectiveVault.openaiKey
                        ? '✓ gpt-image-2.5 Key Active'
                        : 'localStorage: sanctuary_openai_key'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                    <input
                      id="vault-openai-key-input"
                      data-testid="vault-openai-key-input"
                      type={showOpenaiKey ? 'text' : 'password'}
                      value={effectiveVault.openaiKey}
                      onChange={(e) => handleVaultChange({ openaiKey: e.target.value })}
                      placeholder="sk-... (OpenAI API Key for gpt-image-2.5 Chibi Sticker Packs & Art)"
                      autoComplete="off"
                      spellCheck={false}
                      className="flex-1 min-w-0 h-9 px-3 rounded-lg gilded-input-well font-mono text-xs text-[#f5ead8] placeholder-[#6b5a45]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenaiKey((p) => !p)}
                      className="h-9 px-2.5 rounded-lg gilded-pill-btn text-[11px] font-semibold cursor-pointer shrink-0"
                    >
                      {showOpenaiKey ? '🙈 Hide' : '👁️ Show'}
                    </button>
                    {effectiveVault.openaiKey && (
                      <button
                        type="button"
                        onClick={() => handleVaultChange({ openaiKey: '' })}
                        className="h-9 px-2.5 rounded-lg gilded-pill-btn text-[11px] font-semibold cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <label className="flex items-start gap-2 pt-1 text-[11px] font-mono text-[#cbb693] cursor-pointer min-w-0 max-w-full">
                    <input
                      type="checkbox"
                      data-testid="toggle-gemini-image-fallback"
                      checked={allowGeminiImageFallback}
                      onChange={(e) => handleToggleGeminiImageFallback(e.target.checked)}
                      className="accent-[#e6c88c] mt-0.5 shrink-0"
                    />
                    <span className="min-w-0 break-words">
                      Optional Fallback: Use Gemini&apos;s highest-tier image model (<code className="text-[#e6c88c] break-words">gemini-3-pro-image</code>) only if no OpenAI key is entered (No forced nano-banana!)
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </section>
        </>
      )}

      {settingsTab === 'user' && (
        <>
          {/* 0. Standard User Persona Menu (Name, Age, Gender, Physical Description, Current Outfit & Completion Tracker) */}
          <section
            data-testid="standard-user-persona-section"
            className="w-full min-w-0 max-w-full overflow-hidden break-words box-border p-3.5 sm:p-5 rounded-2xl bubble-smoked-glass space-y-4 border-2 border-[#d4af37]/80 shadow-[0_8px_30px_rgba(0,0,0,0.85)] bg-gradient-to-b from-[#1c1217] via-[#150d11] to-[#0e080b]"
          >
            {/* Header with Persona Title & Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#6b5331]/50">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👤</span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-[#ffd700] tracking-wide">
                    Standard User Persona
                  </h3>
                </div>
                <p className="text-xs text-[#cbb693] font-mono leading-relaxed mt-0.5">
                  Define your persona, physical attributes, and attire. Argon senses and incorporates these live details into his physical contact, lap closeness, and dialogue.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleFillHexPersona}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#3b2919] hover:bg-[#4a3420] border border-[#ffd700]/70 text-[#ffe5a3] text-xs font-serif font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all hover:scale-[1.02] active:scale-98"
                  title="Autofill standard Hex persona defaults"
                >
                  <span>👑</span>
                  <span>Fill Hex Defaults</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearPersona}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#24171d] hover:bg-rose-950/80 border border-[#6b5331] hover:border-rose-500/60 text-[#cbb693] hover:text-rose-200 text-xs font-mono cursor-pointer transition-all active:scale-98"
                  title="Clear all persona fields"
                >
                  🧹 Clear
                </button>
              </div>
            </div>

            {/* Persona Completion Progress Tracker */}
            <div className="p-3 rounded-xl bg-[#0d070a]/90 border border-[#c59b47]/60 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#e6c88c]">Persona Completion:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      personaCompletion.isComplete
                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
                        : 'bg-amber-950/90 text-amber-300 border border-amber-500/60'
                    }`}
                  >
                    {personaCompletion.isComplete
                      ? '✓ 100% Complete'
                      : `${personaCompletion.percentage}% (${personaCompletion.completedFields}/${personaCompletion.totalFields} Fields)`}
                  </span>
                </div>
                <span className="text-[11px] text-[#a89070]">
                  {personaCompletion.isComplete
                    ? '✓ Ready for Argon\'s Somatic Vision'
                    : `${personaCompletion.missingFields.length} field${personaCompletion.missingFields.length > 1 ? 's' : ''} left: ${personaCompletion.missingFields.join(', ')}`}
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-[#1e1318] border border-[#6b5331]/60 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    personaCompletion.isComplete
                      ? 'bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(255,215,0,0.6)]'
                      : 'bg-gradient-to-r from-amber-800 to-amber-500'
                  }`}
                  style={{ width: `${Math.max(personaCompletion.percentage, 4)}%` }}
                />
              </div>
            </div>

            {/* Persona Fields */}
            <div className="space-y-3.5">
              {/* Row 1: Name, Age, Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Name */}
                <div className="space-y-1">
                  <label
                    htmlFor="user-persona-name"
                    className="flex items-center justify-between text-xs font-bold font-serif text-[#ffe5a3]"
                  >
                    <span>Name:</span>
                    {persona.name.trim() ? (
                      <span className="text-[10px] font-mono text-emerald-400">✓ Set</span>
                    ) : (
                      <span className="text-[10px] font-mono text-amber-400">*Required</span>
                    )}
                  </label>
                  <input
                    id="user-persona-name"
                    type="text"
                    value={persona.name}
                    onChange={(e) => handleUpdatePersonaField('name', e.target.value)}
                    placeholder="e.g. Hex"
                    className="w-full min-h-[42px] px-3 rounded-xl bg-[#0d070a] border border-[#785c37] focus:border-[#ffd700] text-sm text-[#f5ead8] placeholder-[#78644e] font-mono outline-none transition-colors"
                  />
                </div>

                {/* Age */}
                <div className="space-y-1">
                  <label
                    htmlFor="user-persona-age"
                    className="flex items-center justify-between text-xs font-bold font-serif text-[#ffe5a3]"
                  >
                    <span>Age:</span>
                    {persona.age.trim() ? (
                      <span className="text-[10px] font-mono text-emerald-400">✓ Set</span>
                    ) : (
                      <span className="text-[10px] font-mono text-amber-400/80">Optional</span>
                    )}
                  </label>
                  <input
                    id="user-persona-age"
                    type="text"
                    value={persona.age}
                    onChange={(e) => handleUpdatePersonaField('age', e.target.value)}
                    placeholder="e.g. 36 or mid-30s"
                    className="w-full min-h-[42px] px-3 rounded-xl bg-[#0d070a] border border-[#785c37] focus:border-[#ffd700] text-sm text-[#f5ead8] placeholder-[#78644e] font-mono outline-none transition-colors"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label
                    htmlFor="user-persona-gender"
                    className="flex items-center justify-between text-xs font-bold font-serif text-[#ffe5a3]"
                  >
                    <span>Gender &amp; Pronouns:</span>
                    {persona.gender.trim() ? (
                      <span className="text-[10px] font-mono text-emerald-400">✓ Set</span>
                    ) : (
                      <span className="text-[10px] font-mono text-amber-400/80">Optional</span>
                    )}
                  </label>
                  <input
                    id="user-persona-gender"
                    type="text"
                    value={persona.gender}
                    onChange={(e) => handleUpdatePersonaField('gender', e.target.value)}
                    placeholder="e.g. Female (She/Her)"
                    className="w-full min-h-[42px] px-3 rounded-xl bg-[#0d070a] border border-[#785c37] focus:border-[#ffd700] text-sm text-[#f5ead8] placeholder-[#78644e] font-mono outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Physical Description */}
              <div className="space-y-1">
                <label
                  htmlFor="user-persona-physical-desc"
                  className="flex items-center justify-between text-xs font-bold font-serif text-[#ffe5a3]"
                >
                  <span>Physical Description:</span>
                  {persona.physicalDescription.trim() ? (
                    <span className="text-[10px] font-mono text-emerald-400">
                      ✓ Set ({persona.physicalDescription.trim().length} chars)
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-400">*Recommended</span>
                  )}
                </label>
                <textarea
                  id="user-persona-physical-desc"
                  rows={3}
                  value={persona.physicalDescription}
                  onChange={(e) => handleUpdatePersonaField('physicalDescription', e.target.value)}
                  placeholder="Height, build, hair, facial features, distinctive traits (e.g. 4'11&quot; petite build, soft dark hair pinned up, wire glasses, sweet face, pale skin)..."
                  className="w-full p-3 rounded-xl bg-[#0d070a] border border-[#785c37] focus:border-[#ffd700] text-xs text-[#f5ead8] placeholder-[#78644e] font-mono outline-none resize-none leading-relaxed transition-colors"
                />
                <div className="text-[10px] text-[#9e8664] font-mono">
                  Argon references these physical traits when describing physical closeness, lap sitting, and holding you.
                </div>
              </div>

              {/* Current Outfit */}
              <div className="space-y-1">
                <label
                  htmlFor="user-persona-outfit"
                  className="flex items-center justify-between text-xs font-bold font-serif text-[#ffe5a3]"
                >
                  <span>Current Outfit / Attire:</span>
                  {persona.outfit.trim() ? (
                    <span className="text-[10px] font-mono text-emerald-400">
                      ✓ Set ({persona.outfit.trim().length} chars)
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-400">*Recommended</span>
                  )}
                </label>
                <textarea
                  id="user-persona-outfit"
                  rows={2}
                  value={persona.outfit}
                  onChange={(e) => handleUpdatePersonaField('outfit', e.target.value)}
                  placeholder="What are you currently wearing? (e.g. Oversized black off-shoulder sweater, dark leggings, warm wool socks)..."
                  className="w-full p-3 rounded-xl bg-[#0d070a] border border-[#785c37] focus:border-[#ffd700] text-xs text-[#f5ead8] placeholder-[#78644e] font-mono outline-none resize-none leading-relaxed transition-colors"
                />
                <div className="text-[10px] text-[#9e8664] font-mono">
                  Update this whenever you change outfits. Argon notices what you are wearing right now in the room.
                </div>
              </div>
            </div>
          </section>

          {/* 1. User (Hex) Avatar Upload (<1MB Cap + Auto-Smoosh 256x256 JPEG) + gpt-image-2.5 Generator */}
          <section className="w-full min-w-0 max-w-full overflow-hidden break-words box-border p-3.5 sm:p-4 rounded-xl bubble-smoked-glass space-y-3 border border-[#c59b47]/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 max-w-full">
            <div className="flex items-center gap-3 min-w-0 max-w-full">
              <div className="w-14 h-14 overflow-hidden rounded-full border-2 border-[#c59b47] shrink-0 bg-[#120d0f] shadow-md">
                {hexAvatarUrl ? (
                  <img
                    src={hexAvatarUrl}
                    alt="Hex Custom Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src="/assets/aistudio/image-0__96__dddb2843.png"
                    alt="Hex Default Avatar"
                    className="avatar-crop-hex"
                  />
                )}
              </div>
              <div className="min-w-0 max-w-full">
                <h3 className="text-sm sm:text-base font-bold text-[#f5ead8] break-words">
                  1. Hex Avatar (&lt;1MB Upload OR <code className="text-[#e6c88c] break-words">gpt-image-2.5</code> Generator)
                </h3>
                <p className="text-xs text-[#cbb693] font-mono leading-relaxed break-words">
                  Upload your custom avatar (&lt;1MB, auto-compressed to 256×256 JPEG) or generate custom art with <code className="text-[#e6c88c] break-words">gpt-image-2.5</code>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleHexAvatarFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="h-9 px-3.5 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                📤 Upload Avatar (≤1MB)
              </button>
              {onOpenHouseholdAvatarUploader && (
                <button
                  type="button"
                  onClick={onOpenHouseholdAvatarUploader}
                  className="h-9 px-3.5 rounded-full bg-[#3b2919] hover:bg-[#4a3420] border border-[#e6c88c] text-xs font-bold font-serif text-[#ffe5a3] cursor-pointer flex items-center gap-1.5 shadow whitespace-nowrap"
                >
                  <span>🦊</span>
                  <span>Household Avatar Establisher</span>
                </button>
              )}
              {hexAvatarUrl && (
                <button
                  type="button"
                  onClick={() => {
                    onChangeHexAvatarUrl(null);
                    setAvatarUploadPromptNotice(false);
                  }}
                  className="h-9 px-2.5 rounded-full gilded-pill-btn text-xs cursor-pointer whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Direct gpt-image-2.5 Avatar / Art Generator Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-[#140e0b]/80 border border-[#705532]/50 min-w-0 max-w-full overflow-hidden">
            <input
              type="text"
              data-testid="generate-avatar-prompt-input"
              value={avatarGenPrompt}
              onChange={(e) => setAvatarGenPrompt(e.target.value)}
              placeholder="Prompt for gpt-image-2.5 avatar (e.g. Gothic apothecary witch with crimson roses)..."
              className="flex-1 min-w-0 w-full h-9 px-3 rounded-lg gilded-input-well font-mono text-xs text-[#f5ead8] placeholder-[#6b5a45]"
            />
            <button
              type="button"
              data-testid="generate-avatar-gpt-image-btn"
              disabled={isGeneratingAvatar}
              onClick={() => void handleGenerateHexAvatarWithGptImage()}
              className="h-9 px-3 rounded-lg gilded-send-btn text-xs font-mono font-semibold cursor-pointer whitespace-nowrap disabled:opacity-40"
            >
              {isGeneratingAvatar ? '⏳ Generating…' : '🎨 Generate Avatar (gpt-image-2.5)'}
            </button>
          </div>

          {avatarUploadError && (
            <div
              role="alert"
              className="p-2.5 rounded-xl bg-red-950/90 border border-red-500/80 text-xs font-mono text-red-200 break-words"
            >
              {avatarUploadError}
            </div>
          )}

          {avatarUploadPromptNotice && (
            <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-400/60 text-xs font-mono text-amber-200 break-words">
              ✨ Avatar uploaded &amp; compressed to 256×256 JPEG! Enter a description below so Argon can see it:
            </div>
          )}

          <div className="min-w-0 max-w-full">
            <label
              htmlFor="hex-avatar-description-input"
              className="block text-xs font-mono text-[#d4b483] mb-1 break-words"
            >
              Describe your avatar image so Argon can &ldquo;see&rdquo; it (Sent to AI vision context):
            </label>
            <input
              id="hex-avatar-description-input"
              ref={avatarDescInputRef}
              type="text"
              value={hexAvatarDesc}
              onChange={(e) => onChangeHexAvatarDesc(e.target.value)}
              placeholder="e.g. Hex wearing round wire glasses and a black off-shoulder sweater..."
              className="w-full min-w-0 h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
            />
          </div>
        </section>

        {/* 1b. Custom UI Button Icons & Sticker Sheet Uploader */}
        <section
          data-testid="custom-ui-icons-uploader"
          className="w-full min-w-0 max-w-full overflow-hidden break-words box-border p-3.5 sm:p-4 rounded-xl bubble-smoked-glass space-y-3 border border-[#c59b47]/70"
        >
          <div className="min-w-0 max-w-full">
            <h3 className="text-sm sm:text-base font-bold text-[#f5ead8] break-words">
              🎨 Custom UI Button Icons &amp; Sticker Sheet Uploader
            </h3>
            <p className="text-xs text-[#cbb693] font-mono leading-relaxed break-words">
              Upload individual transparent PNG icons for any dashboard button or upload your full <code className="text-[#e6c88c] break-words">Apothecary Sheet 2</code> &amp; <code className="text-[#e6c88c] break-words">35-Chibi Argon Sticker Sheet</code> directly from your phone gallery.
            </p>
          </div>

          {iconUploadStatus && (
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-400/60 text-xs font-mono text-emerald-200 break-words">
              ✨ {iconUploadStatus}
            </div>
          )}

          {/* Full Sprite Sheets Uploader Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0 max-w-full">
            <div className="p-2.5 rounded-xl bg-[#140e0b]/90 border border-[#6b5331]/60 flex flex-wrap items-center justify-between gap-2 min-w-0 max-w-full overflow-hidden">
              <div className="min-w-0">
                <div className="text-xs font-serif font-bold text-[#e6c88c] truncate">
                  🧪 Apothecary Icon Sheet 2
                </div>
                <div className="text-[10px] font-mono text-[#cbb693] break-words">
                  {customApothecarySheet ? '✓ Custom Sheet Active' : 'Gold SVG Glyphs Active'}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <label className="h-8 px-2.5 rounded-full gilded-send-btn text-[11px] font-semibold flex items-center cursor-pointer">
                  📤 Upload Sheet
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadFullSheet('apothecary', e)}
                    className="hidden"
                  />
                </label>
                {customApothecarySheet && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(STORAGE_KEYS.CUSTOM_APOTHECARY_SHEET);
                      setCustomApothecarySheet(null);
                      window.dispatchEvent(new CustomEvent('argon-custom-icons-updated'));
                    }}
                    className="h-8 px-2 rounded-full gilded-pill-btn text-[10px] cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#140e0b]/90 border border-[#6b5331]/60 flex flex-col gap-2 min-w-0 max-w-full overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 max-w-full">
                <div className="min-w-0">
                  <div className="text-xs font-serif font-bold text-[#e6c88c] truncate">
                    😈 Unlimited Chibi Argon Sticker Library
                  </div>
                  <div className="text-[10px] font-mono text-[#cbb693] break-words">
                    {libraryStickers.length > 0
                      ? `✓ ${libraryStickers.length} Saved Stickers in Library (Appends Without Overwriting)`
                      : 'Upload Sheet or Individual PNGs to Append'}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1 shrink-0">
                  <label
                    data-testid="system-append-sheet-label"
                    className="h-8 px-2.5 rounded-lg gilded-send-btn text-[11px] font-semibold flex items-center cursor-pointer"
                    title="Slice and append a sprite sheet to your Sticker Library without overwriting existing stickers"
                  >
                    ➕ Append Sheet
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadFullSheet('stickers', e)}
                      className="hidden"
                    />
                  </label>
                  <label
                    data-testid="system-append-png-label"
                    className="h-8 px-2.5 rounded-lg gilded-pill-btn text-[11px] font-semibold flex items-center cursor-pointer"
                    title="Append 1 or more individual transparent PNG stickers to your library"
                  >
                    ➕ Append PNG(s)
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAppendIndividualStickerPngs}
                      className="hidden"
                    />
                  </label>
                  {(customStickerSheet || libraryStickers.length > 0) && (
                    <button
                      type="button"
                      data-testid="system-clear-sticker-library-btn"
                      onClick={async () => {
                        await clearEntireStickerLibrary();
                        setCustomStickerSheet(null);
                        setLibraryStickers([]);
                        setIconUploadStatus('🧹 Cleared entire Sticker Library.');
                      }}
                      className="h-8 px-2 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-[10px] font-mono cursor-pointer"
                      title="Clear/replace all saved stickers in your library"
                    >
                      🗑️ Clear Pack
                    </button>
                  )}
                </div>
              </div>

              {libraryStickers.length > 0 && (
                <div className="max-h-36 overflow-y-auto overflow-x-hidden p-1.5 rounded-lg bg-[#0d090b]/80 border border-[#6b5331]/50 grid grid-cols-4 sm:grid-cols-6 gap-1.5 min-w-0 max-w-full">
                  {libraryStickers.map((st) => (
                    <div
                      key={st.shortcode}
                      className="p-1 rounded-lg bg-[#161012] border border-[#6b5331]/50 flex flex-col items-center gap-0.5 min-w-0 overflow-hidden"
                    >
                      <div className="w-full flex items-center justify-between min-w-0">
                        <span className="text-[8px] font-mono text-[#ffe5a3] truncate max-w-[70%]">
                          {st.shortcode}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await deleteStickerFromLibrary({
                              shortcode: st.shortcode,
                            });
                            setLibraryStickers(res.library);
                            setIconUploadStatus(`🗑️ Removed ${st.shortcode} from Sticker Library.`);
                          }}
                          title={`Delete ${st.shortcode}`}
                          aria-label={`Delete ${st.shortcode}`}
                          className="px-1 rounded bg-red-950/80 text-[8px] text-red-200 cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                      <img
                        src={st.dataUrl}
                        alt={st.shortcode}
                        className="w-9 h-9 object-contain bg-transparent border-0 rounded-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              {onOpenStickerStudio && (
                <button
                  type="button"
                  onClick={onOpenStickerStudio}
                  className="w-full min-h-[36px] px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#581c87] via-[#7e22ce] to-[#6b21a8] hover:brightness-110 border border-[#e6c88c] text-[#fff3db] text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 shadow-sm text-center break-words"
                >
                  <span>🎨 Open Chibi Sticker Studio (Slice, Append &amp; Auto-Label)</span>
                </button>
              )}
            </div>
          </div>

          {/* Individual Button Icon Slots Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-0 max-w-full">
            {CUSTOM_BUTTON_ICON_SLOTS.map((slot) => {
              const hasCustom = Boolean(customButtonIcons[slot.key]);
              return (
                <div
                  key={slot.key}
                  className="p-2 rounded-xl bg-[#140e0b]/90 border border-[#6b5331]/60 flex flex-col justify-between gap-1.5 min-w-0 max-w-full overflow-hidden"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full gilded-circle-btn flex items-center justify-center shrink-0">
                      <ApothecaryIcon icon={slot.key} size={20} />
                    </div>
                    <span className="text-[11px] font-mono text-[#f5ead8] truncate">
                      {slot.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 min-w-0">
                    <label className="flex-1 min-w-0 h-7 px-2 rounded-lg gilded-pill-btn text-[10px] font-mono flex items-center justify-center cursor-pointer truncate">
                      {hasCustom ? '🔄 Replace' : '📤 PNG'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadCustomSlotIcon(slot.key, e)}
                        className="hidden"
                      />
                    </label>
                    {hasCustom && (
                      <button
                        type="button"
                        onClick={() => handleClearCustomSlotIcon(slot.key)}
                        className="h-7 px-1.5 rounded-lg bg-red-950/80 border border-red-500/50 text-[10px] font-mono text-red-200 cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        </>
      )}

      {settingsTab === 'engine' && (
        <>
        {/* 2. Argon Avatar Hotwire (Default vs Crazy Taxidermy Fox) */}
        <section className="w-full min-w-0 max-w-full overflow-hidden break-words box-border p-3.5 sm:p-4 rounded-xl bubble-smoked-glass space-y-3 border border-[#c59b47]/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 max-w-full">
            <div className="flex items-center gap-3 min-w-0 max-w-full">
              <div className="w-14 h-14 overflow-hidden rounded-full border-2 border-[#c59b47] shrink-0 bg-[#120d0f] shadow-md">
                <img
                  src="/assets/aistudio/image-0__96__dddb2843.png"
                  alt="Argon Current Avatar"
                  className={
                    argonAvatarMode === 'taxidermy_fox'
                      ? 'avatar-crop-fox'
                      : 'avatar-crop-argon'
                  }
                />
              </div>
              <div className="min-w-0 max-w-full">
                <h3 className="text-sm sm:text-base font-bold text-[#f5ead8] break-words">
                  2. Argon Avatar Hotwire
                </h3>
                <p className="text-xs text-[#cbb693] font-mono break-words">
                  Active:{' '}
                  <strong className="text-[#e6c88c]">
                    {argonAvatarMode === 'taxidermy_fox'
                      ? '🦊 Crazy Taxidermy Fox (Spec. 17A)'
                      : '🖤 Argon Webtoon Portrait'}
                  </strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onChangeArgonAvatarMode(
                  argonAvatarMode === 'taxidermy_fox' ? 'default' : 'taxidermy_fox'
                )
              }
              className="h-9 px-3.5 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              {argonAvatarMode === 'taxidermy_fox'
                ? '🖤 Restore Argon Face'
                : '🦊 Hotwire Taxidermy Fox'}
            </button>
          </div>
        </section>

        {/* 2b. Argon Audio (Speech / TTS Model Wiring — Single-Column Mobile Stack + All 30 Voices + Dargon Vocal Style Prompt) */}
        <section
          data-testid="argon-audio-settings-section"
          className="w-full min-w-0 max-w-full overflow-hidden break-words box-border p-3.5 sm:p-4 rounded-xl bubble-smoked-glass space-y-3.5 border border-[#c59b47]/60"
        >
          <div className="flex flex-col gap-2.5 w-full min-w-0 max-w-full">
            <div className="min-w-0 max-w-full">
              <h3 className="text-sm sm:text-base font-bold text-[#f5ead8] break-words">
                🔊 Argon Audio (Gemini TTS Speech Pipeline)
              </h3>
              <p className="text-xs text-[#cbb693] font-mono leading-relaxed break-words">
                All 30 prebuilt Gemini voices + custom &ldquo;Dargon&rdquo; Vocal Style / Direction Prompt prepended to every TTS call. Stacked vertically for one-handed Android mobile operation.
              </p>
            </div>

            <button
              type="button"
              data-testid="toggle-auto-speak-btn"
              onClick={() => onChangeAutoSpeakArgon(!autoSpeakArgon)}
              className={`w-full min-h-[44px] px-4 py-2 rounded-xl text-xs font-mono font-semibold cursor-pointer transition-all ${
                autoSpeakArgon ? 'gilded-send-btn' : 'gilded-pill-btn'
              }`}
            >
              {autoSpeakArgon ? '🔊 Auto-Speak Argon Replies: ON' : '🔇 Auto-Speak Argon Replies: OFF'}
            </button>
          </div>

          <div className="flex flex-col space-y-3.5 w-full min-w-0 max-w-full">
            {/* 1. All 30 Prebuilt Gemini Voices Selector */}
            <div className="w-full min-w-0 max-w-full">
              <label
                htmlFor="argon-voice-selector"
                className="block text-xs font-mono font-semibold text-[#e6c88c] mb-1.5 break-words"
              >
                Argon Voice Persona (All 30 Prebuilt Gemini TTS Voices):
              </label>
              <select
                id="argon-voice-selector"
                data-testid="argon-voice-selector"
                value={argonVoiceName}
                onChange={(e) => onChangeArgonVoiceName(e.target.value as ArgonVoiceName)}
                className="w-full min-w-0 max-w-full overflow-hidden text-ellipsis min-h-[44px] px-3 py-2 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
              >
                {ARGON_VOICE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id} className="bg-[#120d0f] text-[#f5ead8]">
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Dargon Vocal Style / Direction Prompt Multi-Line Textarea */}
            <div className="w-full min-w-0 max-w-full space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 max-w-full">
                <label
                  htmlFor="argon-vocal-style-prompt"
                  className="block text-xs font-mono font-semibold text-[#e6c88c] break-words"
                >
                  Vocal Style / Direction (&ldquo;Dargon&rdquo;):
                </label>
                <button
                  type="button"
                  data-testid="reset-dargon-vocal-prompt-btn"
                  onClick={() => handleUpdateVocalStylePrompt(DEFAULT_ARGON_VOCAL_STYLE_PROMPT)}
                  className="px-2.5 py-1 rounded-lg gilded-pill-btn text-[10px] font-mono cursor-pointer shrink-0"
                >
                  ↺ Restore Dargon Default
                </button>
              </div>
              <textarea
                id="argon-vocal-style-prompt"
                data-testid="argon-vocal-style-prompt"
                rows={5}
                value={effectiveVocalStylePrompt}
                onChange={(e) => handleUpdateVocalStylePrompt(e.target.value)}
                placeholder="Describe Argon's vocal age, resonance, gravel, sighing, and close-mic cadence..."
                className="w-full min-w-0 max-w-full p-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8] leading-relaxed resize-y box-border"
              />
              <p className="text-[10px] font-mono text-[#a99270] break-words">
                Prepended automatically to the text payload sent to Gemini TTS (<code className="text-[#e6c88c] break-words">gemini-3.8-flash-tts</code>) whenever Argon speaks.
              </p>
            </div>

            {/* 3. What Argon Reads Aloud Dropdown */}
            <div className="w-full min-w-0 max-w-full">
              <label
                htmlFor="argon-speech-mode-selector"
                className="block text-xs font-mono font-semibold text-[#e6c88c] mb-1.5 break-words"
              >
                What Argon Reads Aloud:
              </label>
              <select
                id="argon-speech-mode-selector"
                data-testid="argon-speech-mode-selector"
                value={argonSpeechMode}
                onChange={(e) => onChangeArgonSpeechMode(e.target.value as ArgonSpeechMode)}
                className="w-full min-w-0 max-w-full overflow-hidden text-ellipsis min-h-[44px] px-3 py-2 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
              >
                <option value="full_clean" className="bg-[#120d0f] text-[#f5ead8]">
                  Full Message (Actions + Spoken Dialogue, skips code)
                </option>
                <option value="dialogue_only" className="bg-[#120d0f] text-[#f5ead8]">
                  Spoken Dialogue Only (Skips *italicized actions*)
                </option>
              </select>
            </div>

            {/* 4. Thumb-Friendly [ 🔊 Test Dargon Voice ] Button Directly Inside Settings */}
            <div className="w-full min-w-0 max-w-full pt-1 space-y-2">
              <button
                type="button"
                data-testid="test-argon-voice-btn"
                disabled={isTestingVoice}
                onClick={handleTestVoiceInSettings}
                className="w-full min-w-0 max-w-full min-h-[46px] px-4 py-2.5 rounded-xl gilded-send-btn text-xs sm:text-sm font-mono font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-center break-words"
              >
                {isTestingVoice
                  ? `⏳ Synthesizing ${argonVoiceName} (Dargon Style)...`
                  : isPlayingTestVoice
                  ? `⏹️ Stop Voice Test (${argonVoiceName})`
                  : `[ 🔊 Test Dargon Voice ] (${argonVoiceName})`}
              </button>
              {voiceTestStatus && (
                <p
                  data-testid="voice-test-status"
                  className="text-xs font-mono text-[#ffe5a3] bg-[#161012]/90 border border-[#c59b47]/50 rounded-lg px-3 py-2 break-words"
                >
                  {voiceTestStatus}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 3. Start New Chat Session & System Instructions Shortcut */}
        <section className="w-full min-w-0 max-w-full overflow-hidden break-words box-border p-3.5 sm:p-4 rounded-xl bubble-smoked-glass flex flex-wrap items-center justify-between gap-2 border border-[#c59b47]/60">
          <div className="min-w-0 max-w-full">
            <h3 className="text-sm sm:text-base font-bold text-[#f5ead8] break-words">
              3. Session &amp; System Instructions
            </h3>
            <p className="text-xs text-[#cbb693] font-mono break-words">
              Edit Argon&apos;s System Instructions or start a fresh chat session.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
            <button
              type="button"
              onClick={onOpenSystemInstructions}
              className="h-9 px-3.5 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer"
            >
              📜 Open System Instructions
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmNewChatOpen(true)}
              className="h-9 px-3.5 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              🧹 Clear Chat &amp; Auto-Backup
            </button>
          </div>
        </section>
        </>
      )}

      {settingsTab === 'user' && (
        <>
        {/* 4. Weather & Barometric Pressure (Open-Meteo) */}
        <section className="w-full min-w-0 max-w-full overflow-hidden break-words box-border p-3.5 sm:p-4 rounded-xl bubble-smoked-glass space-y-3 border border-[#c59b47]/60">
          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 max-w-full">
            <div className="min-w-0 max-w-full">
              <h3 className="text-sm sm:text-base font-bold text-[#f5ead8] break-words">
                4. Weather &amp; Barometric Pressure (Open-Meteo)
              </h3>
              <p className="text-xs text-[#cbb693] font-mono break-words">
                <strong className="text-[#f5ead8]">{weather.locationLabel}</strong> ·{' '}
                {weather.tempF !== null ? `${Math.round(weather.tempF)}°F` : '--°F'} ·{' '}
                {weather.condition} ·{' '}
                {weather.hPa !== null ? `${Math.round(weather.hPa)} hPa (MSL)` : '---- hPa'}
                {weather.surfaceHpa !== null && weather.surfaceHpa !== undefined
                  ? ` · ${Math.round(weather.surfaceHpa)} hPa (Station)`
                  : ''}
              </p>
              <p className="text-[11px] text-[#a8937b] font-mono leading-relaxed">
                Barometer is reduced to Mean Sea Level (MSL) so medical barometric sensitivity (&lt; 1010 hPa) matches official meteorological forecasts regardless of elevation.
              </p>
            </div>

            <button
              type="button"
              onClick={onUsePhoneGps}
              className="h-9 px-3.5 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              📍 Use Phone GPS
            </button>
          </div>

          <form onSubmit={handleCitySubmit} className="flex gap-2 min-w-0 max-w-full">
            <label htmlFor="weather-city-input" className="sr-only">
              City or Postal Code for Open-Meteo
            </label>
            <input
              id="weather-city-input"
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="City or Zip (e.g. Seattle, Seoul, 98101)…"
              className="flex-1 min-w-0 h-10 px-3 rounded-xl gilded-input-well text-xs sm:text-sm placeholder-[#8c7a65]"
            />
            <button
              type="submit"
              className="h-10 px-3.5 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
            >
              Set City
            </button>
          </form>

          {weatherStatus && (
            <p className="text-xs font-mono text-[#cbb693] break-words">{weatherStatus}</p>
          )}
        </section>
        </>
      )}

      {settingsTab === 'engine' && (
        <>
        {/* 5. Application Hardware Permissions & Role Matrix */}
        <section className="w-full min-w-0 max-w-full overflow-hidden break-words box-border p-3.5 sm:p-4 rounded-xl bubble-smoked-glass space-y-3 border border-[#c59b47]/60">
          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 max-w-full">
            <div className="min-w-0 max-w-full">
              <h3 className="text-sm sm:text-base font-bold text-[#f5ead8] break-words">
                5. App Hardware Permissions &amp; Character Access Matrix
              </h3>
              <p className="text-xs text-[#cbb693] font-mono break-words">
                Browser hardware channels (Camera, Mic, Screen Share, GPS) &amp; entity tool assignments.
              </p>
            </div>

            {onOpenStaffQuarters && (
              <button
                type="button"
                onClick={onOpenStaffQuarters}
                className="h-9 px-3.5 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer shrink-0"
              >
                🐾 Open Entity Access Matrix
              </button>
            )}
          </div>

          {/* Quick Hardware Status Checklist & Permission Reset Helpers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-[#140b0e] border border-[#6b5331]/50 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span>🎙️</span>
                <span className="text-[#ffe5a3] font-bold truncate">Microphone Access</span>
              </div>
              <span className="text-[10px] text-emerald-300 font-semibold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 shrink-0">
                Native Web Media
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#140b0e] border border-[#6b5331]/50 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span>📷</span>
                <span className="text-[#ffe5a3] font-bold truncate">Camera Stream</span>
              </div>
              <span className="text-[10px] text-emerald-300 font-semibold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 shrink-0">
                Canvas Photo Snap
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#140b0e] border border-[#6b5331]/50 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span>🖥️</span>
                <span className="text-[#ffe5a3] font-bold truncate">Screen Capture</span>
              </div>
              <span className="text-[10px] text-amber-200 font-semibold px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 shrink-0">
                getDisplayMedia
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#140b0e] border border-[#6b5331]/50 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span>📍</span>
                <span className="text-[#ffe5a3] font-bold truncate">GPS Location</span>
              </div>
              <span className="text-[10px] text-emerald-300 font-semibold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 shrink-0">
                Open-Meteo GPS
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0c0709] border border-[#785c37]/60 text-[11px] font-mono text-[#cbb693] space-y-2">
            <div className="font-bold text-[#ffe5a3]">💡 How to Unblock Permissions on Android / Chrome:</div>
            
            <div className="space-y-1 text-[10px] text-[#e6c88c]">
              <div><strong>Method 1 (Chrome 3-Dots Menu):</strong> Tap the <strong>⋮ (3-dots menu)</strong> at top right of Chrome → Tap <strong>ⓘ Info / Settings</strong> or <strong>Site Settings</strong> → Tap <strong>Permissions</strong> → Set Camera &amp; Microphone to <strong>Allow</strong>.</div>
              <div><strong>Method 2 (Android OS App Settings):</strong> Open phone <strong>Settings</strong> → <strong>Apps</strong> → <strong>Chrome</strong> (or your browser) → <strong>Permissions</strong> → Enable <strong>Camera</strong> &amp; <strong>Microphone</strong>.</div>
              <div><strong>Method 3 (Iframe Fallback Built In):</strong> If browser mic is blocked, use the <strong>📂 Device Mic</strong> button on the recording bar or <strong>📂 Use Device Camera</strong> button inside the Cam modal to upload native voice clips or photos directly!</div>
            </div>
          </div>
        </section>

        {/* 6. Local Phone Sync (Persistent File Handle Architecture) */}
        <section
          data-testid="system-gist-sync-section"
          className="w-full min-w-0 max-w-full overflow-hidden break-words box-border p-3.5 sm:p-4 rounded-xl bubble-smoked-glass space-y-3.5 border border-[#D4AF37]/50"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 max-w-full">
            <div className="min-w-0 max-w-full">
              <h3 className="text-sm sm:text-base font-bold text-[#f5ead8] break-words flex items-center gap-2">
                <span>📱</span>
                <span>6. Local Phone Sync (Persistent File Handle)</span>
              </h3>
              <p className="text-xs text-[#e6a8b5]/85 font-mono break-words">
                Hex links a persistent sync file on her phone once. Changes to Books, Vault, Drawers, Persona, Curios &amp; Tickets auto-sync (~1.2s debounce) and flush automatically before Clear Chat. Cloud backups use private Gist or <code className="text-[#D4AF37]">sanctuary-vault</code> (never <code className="text-[#D4AF37]">main</code>).
              </p>
            </div>
          </div>

          {/* Persistent File Handle Status Card */}
          <div className="p-3 rounded-xl border border-[#D4AF37]/40 bg-[#161215]/80 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">📄</span>
                <span className="text-xs font-bold font-mono text-[#f5ead8] truncate">
                  {linkedSyncFileMeta?.fileName || 'sanctuary_live_sync.json'}
                </span>
              </div>
              <span
                data-testid="sync-file-connection-badge"
                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  linkedSyncFileMeta?.status === 'connected'
                    ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300'
                    : linkedSyncFileMeta?.status === 'permission_needed'
                    ? 'border-amber-500/60 bg-amber-950/60 text-amber-300'
                    : 'border-[#D4AF37]/40 bg-[#161215] text-[#D4AF37]'
                }`}
              >
                {linkedSyncFileMeta?.status === 'connected'
                  ? '🟢 Linked & Connected (Read/Write Direct)'
                  : linkedSyncFileMeta?.status === 'permission_needed'
                  ? '🟡 Permission Needed (Tap Link to Grant)'
                  : '⚪ Not Linked (Tap Link Sync File Below)'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#e6a8b5]/80 font-mono pt-1 border-t border-[#D4AF37]/20">
              <div className="flex items-center gap-1.5">
                <span>🕒 Last Live Sync:</span>
                <strong className="text-[#f5ead8]">
                  {linkedSyncFileMeta?.lastSyncedFormatted || 'Never'}
                </strong>
              </div>
              {typeof linkedSyncFileMeta?.byteSize === 'number' && linkedSyncFileMeta.byteSize > 0 && (
                <div className="flex items-center gap-1">
                  <span>💾 Size:</span>
                  <strong className="text-[#D4AF37]">
                    {(linkedSyncFileMeta.byteSize / 1024).toFixed(1)} KB
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Button: Link / Choose File */}
          <div className="space-y-2">
            <button
              type="button"
              data-testid="link-sync-file-btn"
              onClick={() => onLinkSyncFile?.('open')}
              disabled={isSyncingPhone}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37]/30 via-[#E6A8B5]/25 to-[#D4AF37]/30 hover:from-[#D4AF37]/40 hover:to-[#E6A8B5]/40 active:scale-[0.98] border border-[#D4AF37] text-xs sm:text-sm font-bold text-[#f5ead8] cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              <span className="text-base">🔗</span>
              <span>Choose / Link Sync File (sanctuary_live_sync.json)</span>
            </button>

            {/* Secondary Action Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="sync-now-file-btn"
                onClick={() => onLoadFromPhoneFolder?.()}
                disabled={isSyncingPhone}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-[rgba(230,168,181,0.12)] hover:bg-[rgba(230,168,181,0.22)] active:scale-[0.98] border border-[#E6A8B5]/60 text-xs font-semibold text-[#f5ead8] cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                title="Reads latest drawers, Books, and Curios directly from the linked phone file"
              >
                <span>🔄</span>
                <span>Read &amp; Merge from File</span>
              </button>

              <button
                type="button"
                data-testid="write-now-file-btn"
                onClick={onSaveToPhoneFolder}
                disabled={isSyncingPhone}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-[rgba(212,175,55,0.15)] hover:bg-[rgba(212,175,55,0.25)] active:scale-[0.98] border border-[#D4AF37]/60 text-xs font-bold text-[#f5ead8] cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                title="Directly overwrites the linked sync file with current state (zero browser downloads)"
              >
                <span>💾</span>
                <span>{isSyncingPhone ? 'Writing…' : 'Write Now to File'}</span>
              </button>
            </div>

            {/* Folder Link & Create New Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                data-testid="create-sync-file-btn"
                onClick={() => onLinkSyncFile?.('save')}
                disabled={isSyncingPhone}
                className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg bg-[#161215] hover:bg-[#20181d] active:scale-[0.98] border border-[#D4AF37]/40 text-[11px] font-mono text-[#cbb693] cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <span>➕</span>
                <span>Create / Target New File</span>
              </button>

              <button
                type="button"
                data-testid="link-phone-folder-btn"
                onClick={onLinkPhoneFolder}
                disabled={isSyncingPhone}
                className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg bg-[#161215] hover:bg-[#20181d] active:scale-[0.98] border border-[#D4AF37]/40 text-[11px] font-mono text-[#cbb693] cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <span>📁</span>
                <span>Link ArgonSanctuary Folder</span>
              </button>

              {linkedSyncFileMeta && (
                <button
                  type="button"
                  data-testid="unlink-sync-file-btn"
                  onClick={onUnlinkSyncFile}
                  disabled={isSyncingPhone}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 active:scale-[0.98] border border-red-500/40 text-[11px] font-mono text-red-300 cursor-pointer flex items-center justify-center gap-1 transition-all"
                  title="Unlinks the current persistent file handle"
                >
                  <span>✕</span>
                  <span>Unlink</span>
                </button>
              )}
            </div>

            {/* Fallback File Picker Input (emergency only) */}
            <input
              ref={phoneFileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onLoadFromPhoneFolder) {
                  void onLoadFromPhoneFolder(file);
                }
                e.target.value = '';
              }}
            />
          </div>

          {/* Real-time Status line */}
          <div
            data-testid="system-gist-status-line"
            className={`text-xs font-mono px-3 py-2 rounded-lg border break-words flex items-center justify-between ${
              localSyncIsError ||
              gistSyncIsError ||
              (localSyncStatus || gistSyncStatus).startsWith('✗') ||
              /error|failed|missing|invalid|forbidden|not found|unauthorized/i.test(
                localSyncStatus || gistSyncStatus
              )
                ? 'bg-red-950/60 border-red-500/60 text-red-300 font-semibold'
                : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 font-semibold'
            }`}
          >
            <span>
              {isSyncingPhone ? '⏳ Syncing persistent file…' : localSyncStatus || gistSyncStatus || 'Ready for persistent phone sync'}
            </span>
            <span className="text-[10px] text-[#D4AF37]/80 shrink-0 ml-2 font-mono">
              {linkedSyncFileMeta?.fileName || 'sanctuary_live_sync.json'}
            </span>
          </div>

          {/* Optional Developer Advanced Settings (collapsed by default) */}
          <details className="text-xs font-mono text-[#cbb693] cursor-pointer pt-1">
            <summary className="text-[11px] text-[#cbb693]/80 hover:text-[#f5ead8] select-none py-1">
              Developer Settings: GitHub PAT &amp; Legacy Gist ID (Optional)
            </summary>
            <div className="pt-2 space-y-2 border-t border-[#D4AF37]/20 mt-1">
              <div className="min-w-0 max-w-full">
                <label
                  htmlFor="system-gist-id-input"
                  className="block text-[11px] font-mono text-[#d4b47c] mb-1 break-words"
                >
                  Legacy Gist ID / URL
                </label>
                <input
                  id="system-gist-id-input"
                  data-testid="system-gist-id-input"
                  type="text"
                  value={gistId}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const extracted = extractGistIdFromInput(raw);
                    onChangeGistId(extracted || raw);
                  }}
                  placeholder={DEFAULT_GIST_ID}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full min-w-0 h-9 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8] placeholder-[#6b5a45]"
                />
              </div>

              <div className="min-w-0 max-w-full">
                <label
                  htmlFor="github-pat-input"
                  className="block text-[11px] font-mono text-[#d4b47c] mb-1 break-words"
                >
                  GitHub Personal Access Token (only needed for developer github_api tools)
                </label>
                <input
                  id="github-pat-input"
                  data-testid="system-github-pat-input"
                  type="password"
                  value={githubToken}
                  onChange={(e) => onChangeGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full min-w-0 h-9 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8] placeholder-[#6b5a45]"
                />
              </div>
            </div>
          </details>
        </section>
        </>
      )}
      </main>

      {/* "Are you sure?" Confirmation Popup for Clear Chat & Auto-Backup */}
      {isConfirmNewChatOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Auto-backup all state and clear chat?"
        >
          <div className="w-full max-w-xs rounded-2xl gilded-dock-frame p-5 text-center space-y-4">
            <h3 className="text-base font-serif font-bold text-[#f5ead8]">
              🧹 Clear Chat &amp; Auto-Backup
            </h3>
            <p className="text-xs font-mono text-[#cbb693]">
              Auto-backup all drawers (including 01_live_handoff.md), Sanctuary Books, Curios, and Tickets to storage &amp; Gist, then reset chat?
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmNewChatOpen(false)}
                className="h-10 px-4 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmNewChatOpen(false);
                  onConfirmNewChatAndReturn();
                }}
                className="h-10 px-4 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                Yes, Backup &amp; Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


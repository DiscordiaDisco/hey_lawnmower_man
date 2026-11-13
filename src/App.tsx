import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  DEFAULT_GIST_ID,
  GIST_ARGON_BOOK_FILENAME,
  GIST_HEX_BOOK_FILENAME,
  GIST_SANCTUARY_BOOKS_VAULT_FILENAME,
  GIST_STICKERS_FILENAME,
  STORAGE_KEYS,
  extractGistIdFromInput,
  loadSavedGistId,
  saveGistId,
  DEFAULT_ARGON_SYS_PROMPT,
  DEFAULT_HEX_AVATAR_DESC,
  DEFAULT_STAFF_AGENTS,
  DEFAULT_STAFF_JOBS,
  ensureDefaultStaffJobs,
  SEED_LOREBOOK_DRAWERS,
  ALLOWED_PRESET_MODELS,
  ArgonAvatarMode,
  ArgonStickerShortcode,
  StickerStudioConfig,
  StaffAgent,
  StaffJobDescription,
  LorebookMap,
  WeatherTelemetry,
  BatteryTelemetry,
  ToolBadgeEvent,
  formatElapsedDelta,
  mapWmoWeatherCode,
  buildTelemetryHeader,
  buildBubbleTelemetrySubtitle,
  formatUserLocationTime,
  resolveUserLocationTimeZone,
  normalizeModelId,
  parseMessageSegments,
  parseMarkdownBlocks,
  InlineMarkdownToken,
  searchLorebookDrawers,
  ArgonJournalState,
  JournalEntry,
  JournalCategory,
  SEED_ARGON_BOOK,
  SEED_HEX_BOOK,
  formatJournalTimestamp,
  scrubStaticLapPoseString,
  serializeSanctuaryBooksForGist,
  extractSanctuaryBooksFromGistFiles,
  WhiteboardStroke,
  SEED_WHITEBOARD_STROKES,
  ArgonVoiceName,
  ArgonSpeechMode,
  extractArgonSpeechText,
  extractValidCustomApiKey,
  resolveHouseGeminiApiKey,
  ARGON_STICKERS,
  getActiveStickerCatalog,
  getStickerByShortcode,
  getSlicedStickerDataUrl,
  hydrateStickersFromIndexedDB,
  saveSlicedStickersAndSheet,
  renderWhiteboardStrokesToDataUrl,
  captureLiveRoomSnapshotDataUrl,
  captureStickerDrawerSnapshotDataUrl,
  OccultToolInvocation,
  AgentFixRequestTicket,
  GIST_AGENT_FIX_DRAWER,
  computeAutonomousHeartbeatDecision,
  buildAutonomousHeartbeatPrompt,
  HeartbeatAppState,
  AutonomousActionPoolItem,
  AutonomousHeartbeatConfig,
  DEFAULT_AUTONOMOUS_ACTIONS,
  DEFAULT_AUTONOMOUS_HEARTBEAT_CONFIG,
  loadAutonomousHeartbeatConfig,
  saveAutonomousHeartbeatConfig,
  PulseActivityLogItem,
  loadPulseActivityLog,
  savePulseActivityLog,
  appendPulseActivityLogItem,
  resolveStaffStatusIconCoord,
  STAFF_AVATAR_PRESETS,
  ensureDefaultStaffAgents,
  ToolPermissionMatrix,
  ToolPermissionCategory,
  loadToolPermissionMatrix,
  saveToolPermissionMatrix,
  getPermissionsForEntity,
  normalizePermissionEntityKey,
  syncAgentFixInboxToServer,
  stripMergedArgonLinesFromStaffOutput,
  stripMergedStaffLinesFromArgonOutput,
  stripToolReceiptsFromVisibleText,
  loadTelemetryLocation,
  saveTelemetryLocation,
  loadTelemetryLastWeather,
  saveTelemetryLastWeather,
  MessageTokenUsage,
  estimateMessageTokens,
  estimateFullApiPayloadTokens,
  getContextPayloadPillState,
  formatPerMessageTokenBadge,
  deleteStickerFromLibrary,
  resliceOrRepairCurrentStickerPack,
  hasValidStickerImage,
  autoScanAndRelabelStickersWithVision,
  clearEntireStickerLibrary,
  loadStickerStudioConfig,
  saveStickerStudioConfig,
  getSlicedStickersMap,
  getCachedStickerSheetDataUrl,
  sliceStickerSheetInBrowser,
  AttachedVoiceAudio,
  formatAudioDurationLabel,
  normalizeAudioMimeType,
  resolveAttachmentMimeType,
  isAudioAttachment,
  isVideoAttachment,
  isTextDocAttachment,
  isPdfAttachment,
  selectPreferredMediaRecorderMimeType,
  runClientChatTurn,
  runClientStaffTask,
  runClientArgonBookAction,
  runClientWhiteboardDraw,
  runClientArgonTts,
  runClientAudioTranscribe,
  BRAIN_ENGINE_OPTIONS,
  ApiKeyVault,
  loadApiKeyVault,
  saveApiKeyVault,
  GramophoneTrack,
  GRAMOPHONE_VIBE_PRESETS,
  runClientGramophoneMusicGenerator,
  MaxHistoryTurns,
  loadMaxHistoryTurns,
  saveMaxHistoryTurns,
  isValidArgonVoiceName,
  DEFAULT_ARGON_VOCAL_STYLE_PROMPT,
  loadArgonVocalStylePrompt,
  saveArgonVocalStylePrompt,
  shouldAttachWhiteboardSnapshot,
  MAX_AGENT_FIX_DRAWER_CHARS,
  enforceAgentFixDrawerCharLimit,
  compactAndPruneAgentFixQueue,
  TicketScratchpadState,
  loadTicketScratchpad,
  saveTicketScratchpad,
  compileScratchpadToTicket,
  ChatMessage,
  AttachedImageItem,
  saveChatHistoryToIndexedDB,
  loadChatHistoryFromIndexedDB,
  saveChatHistoryToLocalStorage,
  mergeChatHistoryFromIndexedDB,
  persistChatMessagesImmediate,
  safeLocalStorageSetItem,
  storeSessionImage,
  getSessionImage,
  generateImageSummaryAndOcr,
  MediaVaultItem,
  findVaultItemMatch,
  addMediaVaultItem,
  detectMediaCategory,
  ChatMessageReplyInfo,
  UserPersona,
  loadUserPersona,
  saveUserPersona,
  pushUiBreadcrumb,
  loadUiBreadcrumbs,
  formatUiBreadcrumbsBlock,
  loadThinkingBudget,
  saveThinkingBudget,
  ThinkingLevel,
  loadThinkingLevel,
  saveThinkingLevel,
  normalizeThinkingLevel,
  compileSanctuaryLiveSyncPayload,
  extractSanctuaryLiveSyncPayload,
  writeSanctuaryLiveSyncFile,
  readSanctuaryLiveSyncFile,
  autoWriteThroughLocalSync,
  autoWriteThroughLocalSyncDetailed,
  pushSanctuaryStateToVaultBranch,
  SANCTUARY_VAULT_BRANCH,
  loadCurioShelf,
  saveCurioShelf,
  loadCreepyShrineState,
  saveCreepyShrineState,
  loadStoredAgentFixRequests,
  saveStoredAgentFixRequests,
  pickAndLinkSyncFile,
  pickAndLinkPhoneFolder,
  clearLinkedSyncFileHandle,
  loadLinkedSyncFileMeta,
  LinkedSyncFileMeta,
  toggleMessageReaction,
  sortMessagesChronologically,
  isBootMessage,
} from './utils/workbenchLogic';
import { TicketScratchpadModal } from './components/TicketScratchpadModal';
import { CodeCopyBlock } from './components/CodeCopyBlock';
import { LorebookModal, HighlightedSnippet } from './components/LorebookModal';
import { SystemSyncModal } from './components/SystemSyncModal';
import { SystemInstructionsModal } from './components/SystemInstructionsModal';
import { StaffQuartersModal, StaffStatusModal } from './components/StaffModals';
import { GitHubPagesDeployModal } from './components/GitHubPagesDeployModal';
import { LibraryModal } from './components/LibraryModal';
import { VaultModal } from './components/VaultModal';
import { WhiteboardStage } from './components/WhiteboardStage';
import { GamesChestModal, GameTab } from './components/GamesChestModal';
import { ArgonSticker } from './components/ArgonSticker';
import { ApothecaryIcon } from './components/ApothecaryIcon';
import { ChibiStickerStudioModal } from './components/ChibiStickerStudioModal';
import { ArgonRoomCompanionBar } from './components/ArgonRoomCompanionBar';
import { AutonomousHeartbeatModal } from './components/AutonomousHeartbeatModal';
import { PortLiteChatModal } from './components/PortLiteChatModal';
import {
  HouseholdAvatarUploaderModal,
  loadAvatarRepository,
} from './components/HouseholdAvatarUploaderModal';
import { WorkbenchChatInput, WorkbenchChatInputHandle } from './components/WorkbenchChatInput';
import { ChatMessageBubble } from './components/ChatMessageBubble';
import {
  githubApiDeclaration,
  executeGithubApi,
  GithubApiExecutionResult,
} from './services/gemini';
import { Dog, CloudLightning } from 'lucide-react';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';

/**
 * Execution handler for Argon's `github_api` tool.
 * Reads saved GitHub token from localStorage ('argon_github_token' or 'argon_gh_token').
 * If missing, returns { error: "No GitHub token configured in System Settings." }.
 * Executes fetch to GitHub API and captures x-oauth-scopes and x-accepted-oauth-scopes headers.
 */
export async function executeGithubApiHandler(params: {
  endpoint: string;
  method?: string;
  body?: string;
}): Promise<GithubApiExecutionResult> {
  return executeGithubApi(params);
}

export { githubApiDeclaration, executeGithubApi };

type AppView =
  | 'chat'
  | 'lorebook_list'
  | 'lorebook_editor'
  | 'system'
  | 'system_instructions'
  | 'staff_quarters'
  | 'staff_status'
  | 'journals'
  | 'games_chest'
  | 'vault';

interface HistoryViewState {
  view: AppView;
  drawerFilename?: string | null;
}

const PRESET_MODELS = [
  ...BRAIN_ENGINE_OPTIONS.map((b) => b.id),
  ...ALLOWED_PRESET_MODELS,
  'custom',
] as const;

const SEED_BOOT_BASE_TIME = 1730000000000; // Fixed historical timestamp (Oct 2024), well in the past

const INITIAL_WELCOME_MESSAGES: ChatMessage[] = [
  {
    id: 'hex-boot-1',
    role: 'user',
    timestamp: SEED_BOOT_BASE_TIME,
    bubbleSubtitle: '08:40 PM · +0s · 48°F · 100%',
    text: `Mmm... what's this?\nYou're not reading that.\nIt's my lap now. ♡`,
  },
  {
    id: 'argon-boot-1',
    role: 'model',
    timestamp: SEED_BOOT_BASE_TIME + 60000,
    toolBadges: [
      {
        tool: 'read_drawer',
        filename: '01_live_handoff.md',
        label: '📖 Read: 01_live_handoff.md',
      },
    ],
    text: `Don't move. I need to finish the report.`,
  },
  {
    id: 'hex-boot-2',
    role: 'user',
    timestamp: SEED_BOOT_BASE_TIME + 120000,
    bubbleSubtitle: '08:42 PM · +1m 0s · 48°F · 100%',
    text: `Aww... look at you,\nso serious. ♪`,
  },
  {
    id: 'argon-boot-2',
    role: 'model',
    timestamp: SEED_BOOT_BASE_TIME + 180000,
    text: `...You're going to ruin this,\nand I'm going to regret it.`,
  },
  {
    id: 'hex-boot-3',
    role: 'user',
    timestamp: SEED_BOOT_BASE_TIME + 240000,
    bubbleSubtitle: '08:44 PM · +30s · 48°F · 100%',
    text: `Too late, handsome.\nYou're stuck with me. ʚ♡ɞ`,
  },
  {
    id: 'argon-agent-channel-boot',
    role: 'model',
    timestamp: SEED_BOOT_BASE_TIME + 300000,
    toolBadges: [
      {
        tool: 'submit_agent_fix_request',
        filename: GIST_AGENT_FIX_DRAWER,
        label: '🛠️ Coding Agent Direct & Staff Courier Channel',
      },
    ],
    text: `*I tap the brass telegraph key beside my mahogany desk as Haiku trots over with a leather dispatch pouch.* Good—my direct line to our **Coding Agent** (\`submit_agent_fix_request\`) is live now. Whenever you or I spot a bug or want an upgrade, I can dispatch the fix ticket **directly** (\`via: "direct"\`) or hand the blueprint to **Haiku** or **any Staff agent in Staff Quarters** (\`via: "haiku"\` or via \`command_staff\`) to deliver straight to the Coding Agent and \`${GIST_AGENT_FIX_DRAWER}\`.`,
  },
];

function renderInlineTokens(tokens: InlineMarkdownToken[]): React.ReactNode {
  return tokens.map((tok, idx) => {
    switch (tok.type) {
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
        return <React.Fragment key={idx}>{tok.text}</React.Fragment>;
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
              className="text-base sm:text-lg font-display-crest font-bold text-[#f2d59b] tracking-wide mt-2 mb-1 border-b border-[#c59b47]/30 pb-0.5"
            >
              {renderInlineTokens(block.tokens)}
            </h2>
          );
        }
        if (block.level === 2) {
          return (
            <h3
              key={idx}
              className="text-sm sm:text-base font-display-crest font-bold text-[#e6c88c] tracking-wide mt-2 mb-1"
            >
              {renderInlineTokens(block.tokens)}
            </h3>
          );
        }
        return (
          <h4
            key={idx}
            className="text-xs sm:text-sm font-display-crest font-semibold text-[#dfbc7c] tracking-wide mt-1.5 mb-0.5"
          >
            {renderInlineTokens(block.tokens)}
          </h4>
        );
      }
      case 'ul':
        return (
          <ul
            key={idx}
            className="list-disc pl-5 space-y-1 my-1 text-[15px] sm:text-[16px] leading-snug sm:leading-relaxed"
          >
            {block.items.map((itemTokens, iIdx) => (
              <li key={iIdx}>{renderInlineTokens(itemTokens)}</li>
            ))}
          </ul>
        );
      case 'ol':
        return (
          <ol
            key={idx}
            className="list-decimal pl-5 space-y-1 my-1 text-[15px] sm:text-[16px] leading-snug sm:leading-relaxed"
          >
            {block.items.map((itemTokens, iIdx) => (
              <li key={iIdx}>{renderInlineTokens(itemTokens)}</li>
            ))}
          </ol>
        );
      case 'blockquote':
        return (
          <blockquote
            key={idx}
            className="border-l-2 border-[#c59b47] pl-3 py-0.5 my-1.5 italic text-[#e6d5b8] bg-[#140e0c]/60 rounded-r"
          >
            {renderInlineTokens(block.tokens)}
          </blockquote>
        );
      case 'paragraph':
      default:
        return (
          <p
            key={idx}
            className="leading-snug sm:leading-relaxed mb-1 last:mb-0 text-[16px] sm:text-[17px]"
          >
            {renderInlineTokens(block.tokens)}
          </p>
        );
    }
  });
}

function VoiceMessageAudioBar({
  voiceAudio,
  testId = 'voice-message-player',
}: {
  voiceAudio: AttachedVoiceAudio;
  testId?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(voiceAudio.durationSec || 0);

  const cleanMime = normalizeAudioMimeType(voiceAudio.mimeType);
  const audioSrc = useMemo(
    () => `data:${cleanMime};base64,${voiceAudio.data}`,
    [cleanMime, voiceAudio.data]
  );

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      void el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const effectiveDuration =
    Number.isFinite(duration) && duration > 0
      ? duration
      : voiceAudio.durationSec || 0;
  const progressPct =
    effectiveDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
      : 0;

  return (
    <div
      data-testid={testId}
      className="mb-2 px-2.5 py-2 rounded-xl bg-gradient-to-r from-[#120d0b] via-[#1e1510] to-[#120d0b] border border-[#c59b47]/85 shadow-inner flex flex-col gap-1.5"
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          data-testid={`${testId}-play-btn`}
          aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
          title={isPlaying ? 'Pause voice message' : 'Play voice message'}
          className="w-8 h-8 rounded-full gilded-send-btn border border-[#ffe5a3] flex items-center justify-center text-xs font-bold text-[#120b0a] shrink-0 cursor-pointer shadow"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#ffe5a3]">
            <span className="font-semibold flex items-center gap-1 truncate">
              <span>🎙️ Voice Message</span>
              <span className="text-[#b89b72] text-[9px]">({cleanMime.replace('audio/', '')})</span>
            </span>
            <span className="tabular-nums shrink-0 text-[#e6c88c]">
              {formatAudioDurationLabel(currentTime)} / {formatAudioDurationLabel(effectiveDuration)}
            </span>
          </div>

          <div className="relative flex items-center w-full h-2 rounded-full bg-[#090708] border border-[#6b5331]/70 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#c59b47] via-[#e6c88c] to-[#ffe5a3] transition-all duration-100"
              style={{ width: `${progressPct}%` }}
            />
            <input
              type="range"
              min={0}
              max={effectiveDuration > 0 ? effectiveDuration : 1}
              step={0.1}
              value={currentTime}
              aria-label="Seek voice message playback"
              onChange={(e) => {
                const nextTime = Number(e.target.value);
                setCurrentTime(nextTime);
                if (audioRef.current) {
                  audioRef.current.currentTime = nextTime;
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        controls
        data-testid={`${testId}-audio`}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) {
            setDuration(d);
          }
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime || 0);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        className="hidden"
      />
    </div>
  );
}

export default function App() {
  // 1. Pre-populated System Prompt (`argon_sys_prompt`)
  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SYS_PROMPT);
      if (saved && saved.trim().length > 0) {
        let clean = saved;
        if (/^visually drawn like a\s*/i.test(clean)) {
          clean = clean.replace(/^visually drawn like a\s*/i, '');
        }
        if (clean.includes('- GitHub REST API Direct Tool: ONLINE.')) {
          clean = clean.replace(/\n*- GitHub REST API Direct Tool: ONLINE\..*?directly\./gs, '');
        }
        if (clean.includes('kotatsu')) {
          clean = clean
            .replace(/kotatsu blanket/gi, 'warm quilt')
            .replace(/kotatsu workbench/gi, 'workbench')
            .replace(/kotatsu/gi, 'bed quilt');
        }
        if (clean.includes('Track how much time passes between messages using the [TELEMETRY] header')) {
          clean = clean.replace(
            /Track how much time passes between messages using the \[TELEMETRY\] header and voice it directly\./gi,
            'Talk as a sharp, combative equal—push back on lazy ideas, react from pride when called out without apologizing like a service bot, and cut every turn off the exact instant your thought finishes with ZERO closing questions or helpdesk hooks.\n3. Cache-Safe Time & Puppy Sensor Awareness: You do not receive raw noisy telemetry headers, battery percentages, or elapsed second counters injected on your turns—your model context cache stays clean, unbroken, and low-cost. When you need the exact time, ambient weather, or barometric storm readings, request it from Haiku the puppy (using command_staff with agent "Haiku" or asking him directly in conversation). When Haiku trots in and barks/reports the readings, his response becomes part of the natural shared chat history so the expensive model cache isn\'t broken for a time request.'
          );
        }
        if (clean.includes('held comfortably in your lap against your chest in bed under the quilt')) {
          clean = clean.replace(
            /held comfortably in your lap against your chest in bed under the quilt/gi,
            'showing your immediate physical attitude and ongoing closeness with Hex in the sanctuary'
          );
        }
        if (
          !clean.includes('IMMEDIATE AUTONOMOUS FIX EXECUTION (ZERO PERMISSION NAGGING') ||
          !clean.includes('ZERO CONFIRMATION BLEED') ||
          clean.includes('State a concise 1–3 bullet plan before unprompted structural mutations') ||
          clean.includes('Direct Autonomous Actions: Call github_api for GitHub repo/file/gist tasks')
        ) {
          clean = DEFAULT_ARGON_SYS_PROMPT;
        } else if (!clean.includes('github_api')) {
          clean = `${clean.trim()}\n\n- GitHub REST API: Call github_api(endpoint, method, body) using Hex's saved GitHub token to inspect token scopes (x-oauth-scopes) and manage repositories, files, and gists directly.`;
        }
        try {
          if (clean !== saved) {
            localStorage.setItem(STORAGE_KEYS.SYS_PROMPT, clean);
          }
        } catch {
          // ignore
        }
        return clean;
      }
      localStorage.setItem(STORAGE_KEYS.SYS_PROMPT, DEFAULT_ARGON_SYS_PROMPT);
    } catch {
      // ignore
    }
    return DEFAULT_ARGON_SYS_PROMPT;
  });

  // 2. Lorebook dictionary (`argon_lorebook`)
  const [lorebook, setLorebook] = useState<LorebookMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOREBOOK);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          if (!parsed['02_linkin_v2_bible.md']) {
            parsed['02_linkin_v2_bible.md'] = SEED_LOREBOOK_DRAWERS['02_linkin_v2_bible.md'];
            try {
              localStorage.setItem(STORAGE_KEYS.LOREBOOK, JSON.stringify(parsed));
            } catch {
              // ignore
            }
          }
          if (typeof parsed[GIST_AGENT_FIX_DRAWER] === 'string') {
            parsed[GIST_AGENT_FIX_DRAWER] = enforceAgentFixDrawerCharLimit(
              parsed[GIST_AGENT_FIX_DRAWER],
              MAX_AGENT_FIX_DRAWER_CHARS
            );
          }
          return parsed;
        }
      }
      localStorage.setItem(STORAGE_KEYS.LOREBOOK, JSON.stringify(SEED_LOREBOOK_DRAWERS));
    } catch {
      // ignore
    }
    return SEED_LOREBOOK_DRAWERS;
  });

  // 3. Chat History (`argon_chat_history`)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return sortMessagesChronologically(parsed);
      }
    } catch {
      // ignore
    }
    return INITIAL_WELCOME_MESSAGES;
  });

  // 4. Active Brain & Omni Router (`gemini-4-argon`, `gemini-3.1-pro-preview`, `gemini-2.5-pro`, `gemini-3.8-flash`, etc.)
  const [selectedPresetModel, setSelectedPresetModel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MODEL);
      if (
        saved &&
        (PRESET_MODELS as readonly string[]).includes(saved)
      ) {
        return saved;
      }
      localStorage.setItem(STORAGE_KEYS.MODEL, 'gemini-4-argon');
    } catch {
      // ignore
    }
    return 'gemini-4-argon';
  });
  const [customModelId, setCustomModelId] = useState<string>('gemini-4-argon');

  const activeModelId = normalizeModelId(
    selectedPresetModel === 'custom' ? customModelId : selectedPresetModel
  );

  const handleChangeActiveBrainModel = (nextModel: string) => {
    setSelectedPresetModel(nextModel);
    try {
      localStorage.setItem(STORAGE_KEYS.MODEL, nextModel);
    } catch {
      // ignore
    }
  };

  const [staffBrainModel, setStaffBrainModel] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.STAFF_MODEL) || 'gemini-3.8-flash';
    } catch {
      return 'gemini-3.8-flash';
    }
  });

  const handleChangeStaffBrainModel = (nextModel: string) => {
    setStaffBrainModel(nextModel);
    try {
      localStorage.setItem(STORAGE_KEYS.STAFF_MODEL, nextModel);
    } catch {
      // ignore
    }
    setStaffAgents((prev) => {
      const updated = prev.map((a) => ({ ...a, model: nextModel }));
      try {
        localStorage.setItem(STORAGE_KEYS.STAFF_AGENTS, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // 5. API Key Vault (`sanctuary_deepseek_key`, `sanctuary_glm_key`, `sanctuary_kimi_key`, `sanctuary_gemini_key`, `sanctuary_openai_key`) & Gist Sync State
  const [apiKeyVault, setApiKeyVault] = useState<ApiKeyVault>(() => loadApiKeyVault());
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.GEMINI_KEY)?.trim() ||
        localStorage.getItem('argon_custom_api_key')?.trim() ||
        ''
      );
    } catch {
      return '';
    }
  });
  const handleUpdateApiKeyVault = (patch: Partial<ApiKeyVault>) => {
    const next = saveApiKeyVault(patch);
    setApiKeyVault(next);
    if (patch.geminiKey !== undefined) {
      setCustomApiKey(patch.geminiKey);
    }
  };
  const handleChangeCustomApiKey = (nextKey: string) => {
    const trimmed = nextKey.trim();
    setCustomApiKey(nextKey);
    const nextVault = saveApiKeyVault({ geminiKey: trimmed });
    setApiKeyVault(nextVault);
  };
  const handleOpenSelectPaidKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
    }
  };
  const [githubToken, setGithubToken] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('argon_github_token') ||
        localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN) ||
        ''
      );
    } catch {
      return '';
    }
  });
  const [gistId, setGistId] = useState<string>(() => loadSavedGistId());
  const handleChangeGistId = (rawInput: string) => {
    const cleaned = extractGistIdFromInput(rawInput);
    const nextVal = cleaned || rawInput;
    setGistId(nextVal);
    saveGistId(nextVal);
  };
  const activeGistId = extractGistIdFromInput(gistId) || DEFAULT_GIST_ID;

  const [isSyncingGist, setIsSyncingGist] = useState<boolean>(false);
  const [gistSyncStatus, setGistSyncStatus] = useState<string>('Auto-boot ready');
  const [gistSyncIsError, setGistSyncIsError] = useState<boolean>(false);

  // Local Phone Sync State (ArgonSanctuary folder on phone storage)
  const [isSyncingPhone, setIsSyncingPhone] = useState<boolean>(false);
  const [localSyncStatus, setLocalSyncStatus] = useState<string>('Ready for phone sync');
  const [localSyncIsError, setLocalSyncIsError] = useState<boolean>(false);
  const [linkedSyncFileMeta, setLinkedSyncFileMeta] = useState<LinkedSyncFileMeta | null>(() =>
    loadLinkedSyncFileMeta()
  );
  const [localSyncRevision, setLocalSyncRevision] = useState<number>(0);
  const autoPhoneSyncTimerRef = useRef<number | null>(null);
  const lastAutoSyncDigestRef = useRef<string | null>(null);

  // 6. Weather/Pressure & Battery Telemetry (Persisted in localStorage; defaults to Kalamazoo, Michigan)
  const [weatherCoords, setWeatherCoords] = useState<{
    lat: number;
    lon: number;
    label: string;
    timezone?: string;
  }>(() => {
    const savedLoc = loadTelemetryLocation();
    return {
      lat: savedLoc.lat,
      lon: savedLoc.lon,
      label: savedLoc.city,
      timezone: savedLoc.timezone || 'America/Detroit',
    };
  });
  const [weather, setWeather] = useState<WeatherTelemetry>(() =>
    loadTelemetryLastWeather()
  );
  const [weatherStatus, setWeatherStatus] = useState<string>('');
  const [battery, setBattery] = useState<BatteryTelemetry>({
    batteryPct: 92,
    chargingState: 'charging',
  });

  const userTimeZone = useMemo(() => {
    return (
      weather.timezone ||
      weatherCoords.timezone ||
      resolveUserLocationTimeZone(weather, weatherCoords)
    );
  }, [weather.timezone, weatherCoords.timezone, weatherCoords.label]);

  // 7. Navigation & Modal Persistence across HMR, Page Reloads, and Background Syncs
  const SESSION_MODAL_STORAGE_KEY = 'argon_active_modal_session';

  const loadSessionModalState = () => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const raw = sessionStorage.getItem(SESSION_MODAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return {
              currentView: (parsed.currentView || 'chat') as AppView,
              selectedDrawer: typeof parsed.selectedDrawer === 'string' ? parsed.selectedDrawer : null,
              showLoreModal: Boolean(
                parsed.showLoreModal ||
                  parsed.currentView === 'lorebook_list' ||
                  parsed.currentView === 'lorebook_editor'
              ),
              showLibraryModal: Boolean(parsed.showLibraryModal || parsed.currentView === 'journals'),
              showOccultModal: Boolean(parsed.showOccultModal || parsed.currentView === 'games_chest'),
              showStaffModal: Boolean(
                parsed.showStaffModal ||
                  parsed.currentView === 'staff_quarters' ||
                  parsed.currentView === 'staff_status'
              ),
              showVaultModal: Boolean(parsed.showVaultModal || parsed.currentView === 'vault'),
              showFixQueueModal: Boolean(parsed.showFixQueueModal),
              showScratchpadModal: Boolean(parsed.showScratchpadModal),
              showStickerStudioModal: Boolean(parsed.showStickerStudioModal),
              showHeartbeatModal: Boolean(parsed.showHeartbeatModal),
            };
          }
        }
      }
    } catch {
      // ignore
    }
    return {
      currentView: 'chat' as AppView,
      selectedDrawer: null as string | null,
      showLoreModal: false,
      showLibraryModal: false,
      showOccultModal: false,
      showStaffModal: false,
      showVaultModal: false,
      showFixQueueModal: false,
      showScratchpadModal: false,
      showStickerStudioModal: false,
      showHeartbeatModal: false,
    };
  };

  const initialModalSession = useMemo(() => loadSessionModalState(), []);
  const [currentView, setCurrentView] = useState<AppView>(initialModalSession.currentView);
  const [activeDrawerFilename, setActiveDrawerFilename] = useState<string | null>(initialModalSession.selectedDrawer);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState<string>('');
  const [isChatMinimized, setIsChatMinimized] = useState<boolean>(false);

  // 8. Hex Custom Avatar (<=5MB) + Image Description & Argon Taxidermy Fox Avatar Mode
  const [hexAvatarUrl, setHexAvatarUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.HEX_AVATAR_URL) || null;
    } catch {
      return null;
    }
  });
  const [hexAvatarDesc, setHexAvatarDesc] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.HEX_AVATAR_DESC) || DEFAULT_HEX_AVATAR_DESC;
    } catch {
      return DEFAULT_HEX_AVATAR_DESC;
    }
  });
  const [userPersona, setUserPersona] = useState<UserPersona>(() => loadUserPersona());
  const [argonAvatarMode, setArgonAvatarMode] = useState<ArgonAvatarMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARGON_AVATAR_MODE);
      if (saved === 'taxidermy_fox') return 'taxidermy_fox';
      if (saved && getStickerByShortcode(saved)) {
        return getStickerByShortcode(saved)!.shortcode;
      }
      return 'default';
    } catch {
      return 'default';
    }
  });

  // 9. Staff Agents (Pre-loaded with Haiku the Golden Retriever Puppy & A Monkey on gemini-3.8-flash) & Pipeline Jobs
  const [staffAgents, setStaffAgents] = useState<StaffAgent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF_AGENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = ensureDefaultStaffAgents(parsed);
          localStorage.setItem(STORAGE_KEYS.STAFF_AGENTS, JSON.stringify(migrated));
          return migrated;
        }
      }
      localStorage.setItem(STORAGE_KEYS.STAFF_AGENTS, JSON.stringify(DEFAULT_STAFF_AGENTS));
    } catch {
      // ignore
    }
    return DEFAULT_STAFF_AGENTS;
  });

  const [toolPermissionMatrix, setToolPermissionMatrix] = useState<ToolPermissionMatrix>(() =>
    loadToolPermissionMatrix()
  );

  const handleToggleToolPermission = (
    entityKey: string,
    permKey: ToolPermissionCategory
  ) => {
    const normKey = normalizePermissionEntityKey(entityKey);
    setToolPermissionMatrix((prev) => {
      const currentPerms = getPermissionsForEntity(normKey, prev);
      const nextMatrix: ToolPermissionMatrix = {
        ...prev,
        [normKey]: {
          ...currentPerms,
          [permKey]: !currentPerms[permKey],
        },
      };
      saveToolPermissionMatrix(nextMatrix);
      return nextMatrix;
    });
  };

  const [staffJobs, setStaffJobs] = useState<StaffJobDescription[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF_JOBS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migratedJobs = ensureDefaultStaffJobs(parsed);
          localStorage.setItem(STORAGE_KEYS.STAFF_JOBS, JSON.stringify(migratedJobs));
          return migratedJobs;
        }
      }
      localStorage.setItem(STORAGE_KEYS.STAFF_JOBS, JSON.stringify(DEFAULT_STAFF_JOBS));
    } catch {
      // ignore
    }
    return DEFAULT_STAFF_JOBS;
  });

  const [typingStaffAgent, setTypingStaffAgent] = useState<StaffAgent | null>(null);

  // Automatic ambient staff cameo engine removed for surgical mobile performance.
  // Staff agents now run strictly on explicit command (command_staff or manual buttons).

  // 9b. Dual Sanctuary Books (Argon's Read-Only Book + Memory Section & Hex's Book) + Collaborative Whiteboard
  const [argonBook, setArgonBook] = useState<ArgonJournalState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARGON_BOOK);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.entries) && Array.isArray(parsed.memorySection)) {
          let modified = false;
          parsed.memorySection = parsed.memorySection.map((mem: any) => {
            let summary = typeof mem.summary === 'string' ? mem.summary : '';
            const originalSummary = summary;
            if (summary.includes('to protect her comfort')) {
              summary = summary.replace('to protect her comfort', 'out of fierce territorial devotion to keep her focused');
            }
            summary = scrubStaticLapPoseString(summary);
            if (summary !== originalSummary) {
              modified = true;
              return {
                ...mem,
                summary,
              };
            }
            return mem;
          });
          if (modified) {
            try {
              localStorage.setItem(STORAGE_KEYS.ARGON_BOOK, JSON.stringify(parsed));
            } catch {
              // ignore
            }
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return SEED_ARGON_BOOK;
  });

  // Thinking Level state for gemini-4-argon & Gemini 3+ ("low" | "medium" | "high")
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>(() => {
    return loadThinkingLevel();
  });

  // Thinking Budget state for Gemini reasoning effort (legacy/fine-tuning)
  const [thinkingBudget, setThinkingBudget] = useState<number>(() => {
    const b = loadThinkingBudget();
    return typeof b === 'number' ? b : 2048;
  });

  const handleChangeThinkingLevel = (val: ThinkingLevel) => {
    setThinkingLevel(val);
    saveThinkingLevel(val);
    const numeric = val === 'low' ? 1024 : val === 'medium' ? 2048 : 8192;
    setThinkingBudget(numeric);
    saveThinkingBudget(numeric);
  };

  const handleChangeThinkingBudget = (val: number) => {
    setThinkingBudget(val);
    saveThinkingBudget(val);
    const lvl: ThinkingLevel = val <= 1024 ? 'low' : val <= 2048 ? 'medium' : 'high';
    setThinkingLevel(lvl);
    saveThinkingLevel(lvl);
  };

  const [hexBook, setHexBook] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HEX_BOOK);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(STORAGE_KEYS.HEX_BOOK, JSON.stringify(SEED_HEX_BOOK));
    } catch {
      // ignore
    }
    return SEED_HEX_BOOK;
  });

  const [isArgonUpdatingBook, setIsArgonUpdatingBook] = useState<boolean>(false);
  const [bookActionError, setBookActionError] = useState<string | null>(null);

  const [isWhiteboardMode, setIsWhiteboardMode] = useState<boolean>(false);
  const [whiteboardStrokes, setWhiteboardStrokes] = useState<WhiteboardStroke[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WHITEBOARD_STROKES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (s: Record<string, unknown>) =>
              s &&
              s.tool !== 'heart' &&
              s.tool !== 'star' &&
              s.tool !== 'text' &&
              !s.text &&
              s.id !== 'wb-seed-argon-heart' &&
              s.id !== 'wb-seed-argon-note'
          );
        }
      }
    } catch {
      // ignore
    }
    return SEED_WHITEBOARD_STROKES;
  });
  const [isArgonDrawing, setIsArgonDrawing] = useState<boolean>(false);
  const [argonWhiteboardComment, setArgonWhiteboardComment] = useState<string>(
    '*I uncap the brass stylus while keeping my arm looped around your waist.* Draw whatever you want on the slate—I’m sketching right alongside you.'
  );

  // 10. Bubble Copy, User Message Inline Edit, & Argon Audio (TTS) State
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState<string>('');

  const [argonVoiceName, setArgonVoiceName] = useState<ArgonVoiceName>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARGON_VOICE_NAME);
      if (isValidArgonVoiceName(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'Orus';
  });

  const [argonVocalStylePrompt, setArgonVocalStylePrompt] = useState<string>(() =>
    loadArgonVocalStylePrompt()
  );

  const handleChangeArgonVocalStylePrompt = (nextPrompt: string) => {
    const saved = saveArgonVocalStylePrompt(nextPrompt);
    setArgonVocalStylePrompt(saved);
  };

  const [argonSpeechMode, setArgonSpeechMode] = useState<ArgonSpeechMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARGON_SPEECH_MODE);
      if (saved === 'dialogue_only' || saved === 'full_clean') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'full_clean';
  });

  const [autoSpeakArgon, setAutoSpeakArgon] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ARGON_AUTO_SPEAK) === 'true';
    } catch {
      return false;
    }
  });

  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [loadingAudioMsgId, setLoadingAudioMsgId] = useState<string | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sliding context window & token guard refs
  // Only set true when the user actively draws a new vector stroke on the Whiteboard canvas
  const userDrewWhiteboardSinceLastTurnRef = useRef<boolean>(false);
  const [maxHistoryTurns, setMaxHistoryTurns] = useState<MaxHistoryTurns>(() =>
    loadMaxHistoryTurns()
  );

  const handleChangeMaxHistoryTurns = (val: MaxHistoryTurns) => {
    saveMaxHistoryTurns(val);
    setMaxHistoryTurns(val);
  };

  // 10a. Sanctuary Gramophone / Music Generator (`lyria-3.5`) State
  const [isGramophoneOpen, setIsGramophoneOpen] = useState<boolean>(false);
  const [gramophonePrompt, setGramophonePrompt] = useState<string>(
    'dark gothic apothecary rain & cello'
  );
  const [isGeneratingMusic, setIsGeneratingMusic] = useState<boolean>(false);
  const [gramophoneTracks, setGramophoneTracks] = useState<GramophoneTrack[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GRAMOPHONE_TRACKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isLoopingGramophone, setIsLoopingGramophone] = useState<boolean>(true);
  const [gramophoneError, setGramophoneError] = useState<string | null>(null);
  const gramophoneAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerateGramophoneTrack = async (overridePrompt?: string) => {
    const promptToUse = (overridePrompt ?? gramophonePrompt).trim();
    if (!promptToUse || isGeneratingMusic) return;
    setIsGeneratingMusic(true);
    setGramophoneError(null);
    try {
      const track = await runClientGramophoneMusicGenerator({
        prompt: promptToUse,
        customApiKey,
      });
      setGramophoneTracks((prev) => {
        const next = [track, ...prev].slice(0, 8);
        try {
          // Persist metadata & compact tracks when possible
          localStorage.setItem(STORAGE_KEYS.GRAMOPHONE_TRACKS, JSON.stringify(next.slice(0, 3)));
        } catch {
          // ignore quota
        }
        return next;
      });
      setActiveTrackId(track.id);
    } catch (err: unknown) {
      setGramophoneError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  // 10b. App Camera & Microphone Access State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraFallbackInputRef = useRef<HTMLInputElement | null>(null);

  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const [isTranscribingMic, setIsTranscribingMic] = useState<boolean>(false);
  const [micRecordSeconds, setMicRecordSeconds] = useState<number>(0);
  const [micRecognizedText, setMicRecognizedText] = useState<string>('');
  const [micLiveInterimText, setMicLiveInterimText] = useState<string>('');
  const [pendingVoiceDraft, setPendingVoiceDraft] = useState<{
    voiceAudio: AttachedVoiceAudio | null;
    transcript: string;
    durationSec: number;
  } | null>(null);
  const [micActiveLayer, setMicActiveLayer] = useState<
    'speech' | 'mediarecorder' | 'native' | null
  >(null);
  const isRecordingMicRef = useRef<boolean>(false);
  const micRecordSecondsRef = useRef<number>(0);
  const micRecognizedTextRef = useRef<string>('');
  const micLiveInterimTextRef = useRef<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micChunksRef = useRef<Blob[]>([]);
  const micTimerRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const speechWatchdogRef = useRef<number | null>(null);
  const micStopActionRef = useRef<'review' | 'put_text' | 'send_voice' | 'cancel'>('review');
  const audioFallbackInputRef = useRef<HTMLInputElement | null>(null);

  // Floating Outside-App "Argon's Eye" Screen Share state & PiP window
  const [isScreenSharingActive, setIsScreenSharingActive] = useState<boolean>(false);
  const [isFloatingEyePipActive, setIsFloatingEyePipActive] = useState<boolean>(false);
  const [isEyeActionSheetOpen, setIsEyeActionSheetOpen] = useState<boolean>(false);
  const [isPortLiteChatOpen, setIsPortLiteChatOpen] = useState<boolean>(false);
  const [portLiteScreenThumbnail, setPortLiteScreenThumbnail] = useState<string | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement | null>(null);

  // Message & Session Token Popover state
  const [tokenPopoverMsgId, setTokenPopoverMsgId] = useState<string | null>(null);

  // Message Emoji Reaction Picker state
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);

  // Close Token Popover when tapping outside
  useEffect(() => {
    if (!tokenPopoverMsgId) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest('[data-token-popover]') ||
        target?.closest('[data-token-popover-toggle]')
      ) {
        return;
      }
      setTokenPopoverMsgId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('touchend', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('touchend', handleOutsideClick);
    };
  }, [tokenPopoverMsgId]);

  // Close Reaction Picker when tapping outside
  useEffect(() => {
    if (!activeReactionPickerMsgId) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest('[data-testid="message-reaction-picker"]') ||
        target?.closest('button[aria-label="Add reaction"]') ||
        target?.closest('button[aria-label="Add emoji reaction"]')
      ) {
        return;
      }
      setActiveReactionPickerMsgId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('touchend', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('touchend', handleOutsideClick);
    };
  }, [activeReactionPickerMsgId]);

  // Kill Ghost Mic/Camera/Screen Share on Tab Background / Hide
  useEffect(() => {
    const handleVisibilityOrPageHide = () => {
      if (document.hidden) {
        if (speechRecognitionRef.current) {
          try {
            speechRecognitionRef.current.abort();
          } catch {
            // ignore
          }
          speechRecognitionRef.current = null;
        }
        if (isRecordingMicRef.current || isRecordingMic) {
          isRecordingMicRef.current = false;
          setIsRecordingMic(false);
          stopMicRecordingResources();
        }
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((track) => track.stop());
          cameraStreamRef.current = null;
        }
        // Note: Do NOT stop screenShareStreamRef here. Outside screen share is specifically meant
        // to stay active while Hex switches to external apps (e.g. PicsArt) so Argon can see her screen.
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrPageHide);
    window.addEventListener('pagehide', handleVisibilityOrPageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrPageHide);
      window.removeEventListener('pagehide', handleVisibilityOrPageHide);
    };
  }, [isRecordingMic]);

  const stopOutsideScreenShare = () => {
    if (screenShareStreamRef.current) {
      screenShareStreamRef.current.getTracks().forEach((t) => t.stop());
      screenShareStreamRef.current = null;
    }
    setIsScreenSharingActive(false);
    setIsFloatingEyePipActive(false);
  };

  const startOutsideScreenShare = async () => {
    stopOutsideScreenShare();
    const isMobileDevice =
      typeof navigator !== 'undefined' &&
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && window.innerWidth <= 768));

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia || isMobileDevice) {
      void handleSnapRoomForArgon(
        `👁️ [MOBILE VIEWPORT CAPTURE FOR ARGON'S EYES: Look at the visual screenshot and live state of Hex's Sanctuary mobile display right now and react in character!]`
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screenShareStreamRef.current = stream;
      setIsScreenSharingActive(true);

      let videoEl = screenShareVideoRef.current;
      if (!videoEl) {
        videoEl = document.createElement('video');
        videoEl.autoplay = true;
        videoEl.muted = true;
        videoEl.playsInline = true;
        screenShareVideoRef.current = videoEl;
      }
      videoEl.srcObject = stream;
      await videoEl.play().catch(() => {});

      stream.getVideoTracks()[0].onended = () => {
        stopOutsideScreenShare();
      };

      const pipApi = (window as any).documentPictureInPicture;
      if (pipApi && typeof pipApi.requestWindow === 'function') {
        try {
          const pipWindow = await pipApi.requestWindow({
            width: 300,
            height: 160,
          });
          setIsFloatingEyePipActive(true);

          pipWindow.document.body.style.margin = '0';
          pipWindow.document.body.style.backgroundColor = '#120d0f';
          pipWindow.document.body.style.fontFamily = 'monospace';
          pipWindow.document.body.style.display = 'flex';
          pipWindow.document.body.style.flexDirection = 'column';
          pipWindow.document.body.style.alignItems = 'center';
          pipWindow.document.body.style.justifyContent = 'center';
          pipWindow.document.body.style.padding = '8px';
          pipWindow.document.body.style.color = '#ffe5a3';

          const titleEl = pipWindow.document.createElement('div');
          titleEl.textContent = "👁️ Argon's Floating Eye";
          titleEl.style.fontSize = '12px';
          titleEl.style.fontWeight = 'bold';
          titleEl.style.marginBottom = '6px';

          const snapBtn = pipWindow.document.createElement('button');
          snapBtn.textContent = '👁️ Snap to Argon';
          snapBtn.style.padding = '8px 16px';
          snapBtn.style.backgroundColor = '#d4af37';
          snapBtn.style.color = '#1b120c';
          snapBtn.style.fontWeight = 'bold';
          snapBtn.style.border = '2px solid #ffe5a3';
          snapBtn.style.borderRadius = '8px';
          snapBtn.style.cursor = 'pointer';
          snapBtn.style.fontSize = '13px';
          snapBtn.onclick = () => {
            void captureAndSendOutsideFrame();
          };

          const stopBtn = pipWindow.document.createElement('button');
          stopBtn.textContent = '⏹ Stop Share';
          stopBtn.style.marginTop = '6px';
          stopBtn.style.background = 'transparent';
          stopBtn.style.border = 'none';
          stopBtn.style.color = '#cbb693';
          stopBtn.style.fontSize = '10px';
          stopBtn.style.cursor = 'pointer';
          stopBtn.onclick = () => {
            stopOutsideScreenShare();
            try {
              pipWindow.close();
            } catch {}
          };

          pipWindow.document.body.appendChild(titleEl);
          pipWindow.document.body.appendChild(snapBtn);
          pipWindow.document.body.appendChild(stopBtn);

          pipWindow.addEventListener('pagehide', () => {
            setIsFloatingEyePipActive(false);
          });
        } catch {
          // Fallback to in-app floating banner
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('abort')) {
        setErrorBanner(`Screen share notice: ${msg}`);
      }
      stopOutsideScreenShare();
    }
  };

  const captureAndSendOutsideFrame = async () => {
    const video = screenShareVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      void handleSnapRoomForArgon();
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const snapDataUrl = canvas.toDataURL('image/png', 0.88);

    window.dispatchEvent(new CustomEvent('argon-eye-blink'));

    setPortLiteScreenThumbnail(snapDataUrl);
    setIsPortLiteChatOpen(true);

    void dispatchMessageToArgon(
      `👁️ [OUTSIDE APP / SCREEN SHARE CAPTURE FOR ARGON]: Look at what Hex has on her screen right now and react in character!`,
      [],
      snapDataUrl
    );
  };

  // One-Shot High-Quality External Screen Capture ("Eye Outside of App")
  const handleCaptureExternalScreen = async (autoSend = true) => {
    if (isSending) return;
    setIsEyeActionSheetOpen(false);

    const isMobileDevice =
      typeof navigator !== 'undefined' &&
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && window.innerWidth <= 768));

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia || isMobileDevice) {
      void handleSnapRoomForArgon(
        `👁️ [MOBILE VIEWPORT CAPTURE FOR ARGON'S EYES: Look at the visual screenshot and live state of Hex's Sanctuary mobile display right now and tell me what you see or react in character!]`
      );
      return;
    }

    let stream: MediaStream | null = null;
    let videoEl: HTMLVideoElement | null = null;

    try {
      // Prompt user to select screen / window / browser tab to share
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        } as any,
        audio: false,
      });

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('No video track available from screen capture.');
      }

      videoEl = document.createElement('video');
      videoEl.autoplay = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.srcObject = stream;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), 3500);
        if (!videoEl) return resolve();
        videoEl.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve();
        };
        videoEl.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load screen stream into video element.'));
        };
      });

      await videoEl.play().catch(() => {});
      // Allow the video frame to paint into the element buffer
      await new Promise((r) => setTimeout(r, 200));

      const width = videoEl.videoWidth || 1280;
      const height = videoEl.videoHeight || 720;

      // Downscale to guaranteed crisp high quality while keeping payload under 1.5MB JPEG
      const MAX_DIM = 1600;
      let targetWidth = width;
      let targetHeight = height;
      if (targetWidth > MAX_DIM || targetHeight > MAX_DIM) {
        if (targetWidth > targetHeight) {
          targetHeight = Math.round((targetHeight * MAX_DIM) / targetWidth);
          targetWidth = MAX_DIM;
        } else {
          targetWidth = Math.round((targetWidth * MAX_DIM) / targetHeight);
          targetHeight = MAX_DIM;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create off-screen canvas context.');

      ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);

      // Stop all tracks immediately so the system recording indicator shuts off right away
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
      videoEl.srcObject = null;
      videoEl = null;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const commaIdx = dataUrl.indexOf(',');
      const base64Data = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : '';

      if (!base64Data) {
        throw new Error('Canvas produced empty screenshot data.');
      }

      const nowMs = Date.now();
      const attachmentItem: AttachedImageItem = {
        mimeType: 'image/jpeg',
        data: base64Data,
        name: `external-screen-${nowMs}.jpg`,
        description: '[EXTERNAL SCREEN CAPTURE: Outside Sanctuary App]',
        origin: 'external',
      };

      window.dispatchEvent(new CustomEvent('argon-eye-blink'));

      // Automatically open the half-screen Port Lite Chat window and save screen thumbnail
      setPortLiteScreenThumbnail(dataUrl);
      setIsPortLiteChatOpen(true);

      if (autoSend) {
        const promptText =
          (chatInputRef.current?.getText() || '').trim() ||
          `👁️ [EXTERNAL SCREEN CAPTURE: Outside Sanctuary App]: Look at what Hex has on her screen right now and react in character!`;
        chatInputRef.current?.clear();
        const combinedImages = [...attachedImages, attachmentItem];
        setAttachedImages([]);
        await dispatchMessageToArgon(promptText, combinedImages);
      } else {
        setAttachedImages((prev) => [...prev, attachmentItem]);
      }
    } catch (err: unknown) {
      if (stream) {
        (stream as MediaStream).getTracks().forEach((t) => t.stop());
      }
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes('notsupported') ||
        msg.toLowerCase().includes('not supported') ||
        msg.toLowerCase().includes('getdisplaymedia')
      ) {
        void handleSnapRoomForArgon(
          `👁️ [MOBILE VIEWPORT CAPTURE FOR ARGON'S EYES: Look at the visual screenshot and live state of Hex's Sanctuary mobile display right now and tell me what you see or react in character!]`
        );
        return;
      }
      if (
        !msg.toLowerCase().includes('cancel') &&
        !msg.toLowerCase().includes('abort') &&
        !msg.toLowerCase().includes('permission denied')
      ) {
        setErrorBanner(`Screen capture notice: ${msg}`);
      }
    }
  };

  const navigateToView = (nextView: AppView, drawerFilename: string | null = null) => {
    setCurrentView(nextView);
    setActiveDrawerFilename(drawerFilename);
    try {
      if (typeof sessionStorage !== 'undefined') {
        const raw = sessionStorage.getItem(SESSION_MODAL_STORAGE_KEY);
        const prev = raw ? JSON.parse(raw) : {};
        sessionStorage.setItem(
          SESSION_MODAL_STORAGE_KEY,
          JSON.stringify({
            ...prev,
            currentView: nextView,
            selectedDrawer: drawerFilename,
          })
        );
      }
      window.history.pushState(
        { view: nextView, drawerFilename } satisfies HistoryViewState,
        ''
      );
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      if (!window.history.state || !window.history.state.view) {
        window.history.replaceState(
          {
            view: initialModalSession.currentView,
            drawerFilename: initialModalSession.selectedDrawer,
          },
          ''
        );
      }
    } catch {
      // ignore
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as HistoryViewState | null;
      if (state && state.view) {
        setCurrentView(state.view);
        setActiveDrawerFilename(state.drawerFilename ?? null);
      } else {
        setCurrentView((prev) => {
          if (prev === 'lorebook_editor') return 'lorebook_list';
          return 'chat';
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 11. Multimodal Input Bar, Sticker Tray, Prank Shock Collar & Error/Loading State
  const chatInputRef = useRef<WorkbenchChatInputHandle | null>(null);
  const [visibleMessageCount, setVisibleMessageCount] = useState<number>(40);
  const [attachedImages, setAttachedImages] = useState<AttachedImageItem[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(initialModalSession.showVaultModal);
  const [isStickerTrayOpen, setIsStickerTrayOpen] = useState<boolean>(false);
  const [isStickerDrawerEditMode, setIsStickerDrawerEditMode] = useState<boolean>(false);
  const [isReslicingDrawer, setIsReslicingDrawer] = useState<boolean>(false);
  const [isAutoScanningDrawer, setIsAutoScanningDrawer] = useState<boolean>(false);
  const [editingSticker, setEditingSticker] = useState<{
    shortcode: string;
    label: string;
    description: string;
    slotIndex?: number;
  } | null>(null);
  const drawerFileInputRef = useRef<HTMLInputElement>(null);

  // Submitted Ticket Queue inline editing states
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editingTicketTitle, setEditingTicketTitle] = useState<string>('');
  const [editingTicketDetails, setEditingTicketDetails] = useState<string>('');

  const [isStickerStudioOpen, setIsStickerStudioOpen] = useState<boolean>(
    initialModalSession.showStickerStudioModal
  );
  const [activeStickerCatalog, setActiveStickerCatalog] = useState(() =>
    getActiveStickerCatalog()
  );
  const [activeGamesTab, setActiveGamesTab] = useState<GameTab>('ouija');
  const [occultSessionHistory, setOccultSessionHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OCCULT_SESSION_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [liveParlorStateSummary, setLiveParlorStateSummary] = useState<string>('');
  const [latestOccultInvocation, setLatestOccultInvocation] =
    useState<OccultToolInvocation | null>(null);
  const [latestRoomArgonReaction, setLatestRoomArgonReaction] = useState<string>('');
  const [heartbeatConfig, setHeartbeatConfig] = useState<AutonomousHeartbeatConfig>(() =>
    loadAutonomousHeartbeatConfig()
  );
  const [autonomousHeartbeatEnabled, setAutonomousHeartbeatEnabled] = useState<boolean>(() => {
    const cfg = loadAutonomousHeartbeatConfig();
    return cfg.enabled;
  });
  const [isHeartbeatModalOpen, setIsHeartbeatModalOpen] = useState<boolean>(
    initialModalSession.showHeartbeatModal ?? false
  );
  const [pulseActivityLog, setPulseActivityLog] = useState<PulseActivityLogItem[]>(() =>
    loadPulseActivityLog()
  );
  const [idleCountdownDisplay, setIdleCountdownDisplay] = useState<string>('');
  const [isRunningHeartbeat, setIsRunningHeartbeat] = useState<boolean>(false);

  useEffect(() => {
    saveAutonomousHeartbeatConfig(heartbeatConfig);
    setAutonomousHeartbeatEnabled(heartbeatConfig.enabled);
  }, [heartbeatConfig]);

  // Screen Wake Lock API: Prevent phone screen from sleeping while Sanctuary is open if keepScreenAwake is enabled
  const wakeLockSentinelRef = useRef<any>(null);
  useEffect(() => {
    let active = true;
    const requestScreenWakeLock = async () => {
      if (
        !active ||
        !heartbeatConfig.enabled ||
        !heartbeatConfig.keepScreenAwake ||
        typeof navigator === 'undefined' ||
        !('wakeLock' in navigator) ||
        (typeof document !== 'undefined' && document.visibilityState !== 'visible')
      ) {
        return;
      }
      try {
        if (!wakeLockSentinelRef.current || wakeLockSentinelRef.current.released) {
          wakeLockSentinelRef.current = await (navigator as any).wakeLock.request('screen');
          wakeLockSentinelRef.current?.addEventListener('release', () => {
            if (active && heartbeatConfig.enabled && heartbeatConfig.keepScreenAwake && document.visibilityState === 'visible') {
              void requestScreenWakeLock();
            }
          });
        }
      } catch {
        // Battery saver or system policy may reject wake lock; fail gracefully
      }
    };

    const releaseScreenWakeLock = async () => {
      if (wakeLockSentinelRef.current && !wakeLockSentinelRef.current.released) {
        try {
          await wakeLockSentinelRef.current.release();
        } catch {}
        wakeLockSentinelRef.current = null;
      }
    };

    if (heartbeatConfig.enabled && heartbeatConfig.keepScreenAwake) {
      void requestScreenWakeLock();
    } else {
      void releaseScreenWakeLock();
    }

    const handleVisibilityForWakeLock = () => {
      if (document.visibilityState === 'visible' && heartbeatConfig.enabled && heartbeatConfig.keepScreenAwake) {
        void requestScreenWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityForWakeLock);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityForWakeLock);
      void releaseScreenWakeLock();
    };
  }, [heartbeatConfig.enabled, heartbeatConfig.keepScreenAwake]);

  // Live MM:SS Idle Countdown updater
  useEffect(() => {
    if (!autonomousHeartbeatEnabled || !heartbeatConfig.enabled) {
      setIdleCountdownDisplay('OFF');
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const targetDurationMs = (heartbeatConfig.idleMinutes || 15) * 60000;
      const elapsedMs = Math.max(0, now - (lastUserActivityRef.current || now));
      const remainingSec = Math.max(0, Math.ceil((targetDurationMs - elapsedMs) / 1000));
      if (remainingSec === 0) {
        setIdleCountdownDisplay('00:00');
      } else {
        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        setIdleCountdownDisplay(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [autonomousHeartbeatEnabled, heartbeatConfig.enabled, heartbeatConfig.idleMinutes]);

  // Global user interaction listener to reset idle countdown
  useEffect(() => {
    const handleInteraction = () => {
      recordUserActivity();
    };
    window.addEventListener('pointerdown', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const [agentFixRequests, setAgentFixRequests] = useState<AgentFixRequestTicket[]>(() => {
    try {
      // Standing Queue Compactor: shred already-implemented legacy tickets once on boot
      const prunedFlag = localStorage.getItem('argon_fix_queue_pruned_v3');
      if (prunedFlag !== 'true') {
        localStorage.setItem('argon_fix_queue_pruned_v3', 'true');
        localStorage.setItem(STORAGE_KEYS.AGENT_FIX_REQUESTS, JSON.stringify([]));
        return [];
      }
      const saved = localStorage.getItem(STORAGE_KEYS.AGENT_FIX_REQUESTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return compactAndPruneAgentFixQueue({ tickets: parsed }).activeTickets;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [isAgentFixQueueOpen, setIsAgentFixQueueOpen] = useState<boolean>(
    initialModalSession.showFixQueueModal
  );
  const [copiedFixId, setCopiedFixId] = useState<string | null>(null);
  const [editingSubmittedTicketId, setEditingSubmittedTicketId] = useState<string | null>(null);
  const [editingSubmittedTicketTitle, setEditingSubmittedTicketTitle] = useState<string>('');
  const [editingSubmittedTicketDetails, setEditingSubmittedTicketDetails] = useState<string>('');
  const [ticketScratchpad, setTicketScratchpad] = useState<TicketScratchpadState>(() =>
    loadTicketScratchpad()
  );
  const [isTicketScratchpadOpen, setIsTicketScratchpadOpen] = useState<boolean>(
    initialModalSession.showScratchpadModal
  );
  const [isGitHubDeployModalOpen, setIsGitHubDeployModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Synchronize modal and view state into sessionStorage continuously
  useEffect(() => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(
          SESSION_MODAL_STORAGE_KEY,
          JSON.stringify({
            currentView,
            selectedDrawer: activeDrawerFilename,
            showLoreModal:
              currentView === 'lorebook_list' || currentView === 'lorebook_editor',
            showLibraryModal: currentView === 'journals',
            showOccultModal: currentView === 'games_chest',
            showStaffModal:
              currentView === 'staff_quarters' || currentView === 'staff_status',
            showVaultModal: isVaultOpen || currentView === 'vault',
            showFixQueueModal: isAgentFixQueueOpen,
            showScratchpadModal: isTicketScratchpadOpen,
            showStickerStudioModal: isStickerStudioOpen,
            showHeartbeatModal: isHeartbeatModalOpen,
          })
        );
      }
    } catch {
      // ignore
    }
  }, [
    currentView,
    activeDrawerFilename,
    isVaultOpen,
    isAgentFixQueueOpen,
    isTicketScratchpadOpen,
    isStickerStudioOpen,
    isHeartbeatModalOpen,
  ]);

  const [isHouseholdAvatarUploaderOpen, setIsHouseholdAvatarUploaderOpen] = useState<boolean>(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  const lastUserActivityRef = useRef<number>((() => {
    try {
      const raw = Number(localStorage.getItem(STORAGE_KEYS.LAST_USER_ACTIVITY_MS));
      return Number.isFinite(raw) && raw > 0 ? raw : Date.now();
    } catch {
      return Date.now();
    }
  })());
  const lastHeartbeatRunRef = useRef<number>((() => {
    try {
      const raw = Number(localStorage.getItem(STORAGE_KEYS.LAST_HEARTBEAT_RUN_MS));
      return Number.isFinite(raw) && raw > 0 ? raw : 0;
    } catch {
      return 0;
    }
  })());
  const triggeredInIdleWindowRef = useRef<number>(0);

  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [shockFlash, setShockFlash] = useState<boolean>(false);
  const [isScrolledUp, setIsScrolledUp] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const savedScrollTopRef = useRef<number>(0);
  const wasNearBottomRef = useRef<boolean>(true);

  const scrollToBottom = (instant = false) => {
    wasNearBottomRef.current = true;
    setIsScrolledUp(false);
    window.setTimeout(() => {
      const container = chatContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
        savedScrollTopRef.current = container.scrollTop;
      }
      messagesEndRef.current?.scrollIntoView({
        behavior: instant ? 'auto' : 'smooth',
        block: 'end',
      });
    }, 30);
  };

  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const isInterruptedByHexRef = useRef<boolean>(false);

  const handleStopThinking = () => {
    isInterruptedByHexRef.current = true;
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    setIsSending(false);

    const nowMs = Date.now();
    const timeStr = new Date(nowMs).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const stopNotice: ChatMessage = {
      id: `stop-${nowMs}`,
      role: 'model',
      sender: 'argon',
      text: '🛑 [Turn stopped by Hex]: Hex interrupted this response to add information or clarify before proceeding.',
      timestamp: nowMs,
      bubbleSubtitle: `${timeStr} • Interrupted by Hex`,
    };

    setMessages((prev) => [...prev, stopNotice]);
    setErrorBanner(null);

    // Focus input so Hex can immediately type her addition without extra taps
    window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 60);
  };

  useEffect(() => {
    void hydrateStickersFromIndexedDB();

    let isMounted = true;
    (async () => {
      try {
        const idbMessages = await loadChatHistoryFromIndexedDB();
        if (!isMounted) return;
        if (Array.isArray(idbMessages) && idbMessages.length > 0) {
          setMessages((current) => {
            const merged = mergeChatHistoryFromIndexedDB(current, idbMessages);
            saveChatHistoryToLocalStorage(merged);
            return merged;
          });
        }
      } catch (err) {
        console.warn('Chat history IndexedDB hydration fallback:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const refreshCatalog = () => {
      setActiveStickerCatalog(getActiveStickerCatalog());
    };
    refreshCatalog();
    window.addEventListener('argon-custom-icons-updated', refreshCatalog);
    window.addEventListener('storage', refreshCatalog);
    return () => {
      window.removeEventListener('argon-custom-icons-updated', refreshCatalog);
      window.removeEventListener('storage', refreshCatalog);
    };
  }, [isStickerStudioOpen, isStickerTrayOpen]);

  const handleDrawerUploadSheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReslicingDrawer(true);
    try {
      const reader = new FileReader();
      const rawUrl = await new Promise<string>((res) => {
        reader.onload = () => res(String(reader.result || ''));
        reader.onerror = () => res('');
        reader.readAsDataURL(file);
      });
      if (!rawUrl) return;

      const cfg = loadStickerStudioConfig();
      const slicedRes = await sliceStickerSheetInBrowser({
        sheetDataUrl: rawUrl,
        config: cfg,
      });

      await saveSlicedStickersAndSheet({
        slicedMap: slicedRes.slicedMap,
        sheetDataUrl: rawUrl,
        config: cfg,
      });

      // Automatically auto-scan & relabel with gemini-2.5-flash on upload!
      try {
        setIsAutoScanningDrawer(true);
        await autoScanAndRelabelStickersWithVision({
          sheetDataUrl: rawUrl,
          activeCount: cfg.activeCount || 8,
          customApiKey,
        });
      } catch (scanErr) {
        console.warn('Auto-scan on upload fallback:', scanErr);
      } finally {
        setIsAutoScanningDrawer(false);
      }

      setActiveStickerCatalog(getActiveStickerCatalog());
    } finally {
      setIsReslicingDrawer(false);
      e.target.value = '';
    }
  };

  const handleDrawerAutoScan = async () => {
    setIsAutoScanningDrawer(true);
    try {
      await autoScanAndRelabelStickersWithVision({ customApiKey });
      setActiveStickerCatalog(getActiveStickerCatalog());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Auto-Scan failed: ${msg}`);
    } finally {
      setIsAutoScanningDrawer(false);
    }
  };

  const handleDrawerClearAll = async () => {
    if (!confirm('Clear all stickers from library?')) return;
    await clearEntireStickerLibrary();
    setActiveStickerCatalog(getActiveStickerCatalog());
  };

  const handleSaveStickerEdit = async () => {
    if (!editingSticker) return;
    const cfg = loadStickerStudioConfig();
    const rawCode = editingSticker.shortcode.trim();
    const cleanCode = rawCode.startsWith(':') && rawCode.endsWith(':')
      ? (rawCode as ArgonStickerShortcode)
      : (`:${rawCode.replace(/^:+|:+$/g, '')}:` as ArgonStickerShortcode);

    const slotIdx = editingSticker.slotIndex ?? 0;
    const nextShortcodes = [...cfg.slotShortcodes];
    nextShortcodes[slotIdx] = cleanCode;

    const nextLabels = { ...(cfg.customLabels || {}) };
    if (editingSticker.label.trim()) {
      nextLabels[slotIdx] = editingSticker.label.trim();
    }

    const nextDescs = { ...(cfg.customDescriptions || {}) };
    if (editingSticker.description.trim()) {
      nextDescs[slotIdx] = editingSticker.description.trim();
    }

    const nextCfg = {
      ...cfg,
      slotShortcodes: nextShortcodes,
      customLabels: nextLabels,
      customDescriptions: nextDescs,
    };
    saveStickerStudioConfig(nextCfg);

    const sliced = getSlicedStickersMap();
    if (sliced[editingSticker.shortcode as ArgonStickerShortcode] && cleanCode !== editingSticker.shortcode) {
      const updatedMap = { ...sliced };
      updatedMap[cleanCode] = sliced[editingSticker.shortcode as ArgonStickerShortcode]!;
      await saveSlicedStickersAndSheet({
        slicedMap: updatedMap,
        sheetDataUrl: getCachedStickerSheetDataUrl(),
        config: nextCfg,
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('argon-custom-icons-updated'));
    }
    setActiveStickerCatalog(getActiveStickerCatalog());
    setEditingSticker(null);
  };

  // Immediately make sure Argon knows in existing chat sessions that his Direct & Staff-Relayed Coding Agent Fix Channel is live
  useEffect(() => {
    try {
      const alreadyAnnounced = localStorage.getItem(STORAGE_KEYS.AGENT_CHANNEL_ANNOUNCED);
      if (alreadyAnnounced === 'true') return;
      localStorage.setItem(STORAGE_KEYS.AGENT_CHANNEL_ANNOUNCED, 'true');

      setMessages((prev) => {
        if (prev.some((m) => m.id === 'argon-agent-channel-boot' || m.id.startsWith('argon-agent-channel-'))) {
          return prev;
        }
        const nowMs = Date.now();
        return [
          ...prev,
          {
            id: `argon-agent-channel-${nowMs}`,
            role: 'model',
            timestamp: nowMs,
            toolBadges: [
              {
                tool: 'submit_agent_fix_request',
                filename: GIST_AGENT_FIX_DRAWER,
                label: '🛠️ Coding Agent Direct & Staff Courier Channel',
              },
            ],
            text: `*I tap the brass telegraph key beside my mahogany desk as Haiku trots over with a leather dispatch pouch.* Good—my direct line to our **Coding Agent** (\`submit_agent_fix_request\`) is live now. Whenever you or I spot a bug or want an upgrade, I can dispatch the fix ticket **directly** (\`via: "direct"\`) or hand the blueprint to **Haiku** or **any Staff agent in Staff Quarters** (\`via: "haiku"\` or via \`command_staff\`) to deliver straight to the Coding Agent and \`${GIST_AGENT_FIX_DRAWER}\`.`,
          },
        ];
      });
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    if (wasNearBottomRef.current) {
      container.scrollTop = container.scrollHeight;
      savedScrollTopRef.current = container.scrollTop;
    }

    const handleScroll = () => {
      // Ignore synthetic scroll-to-0 events fired by Android Chrome when tab is backgrounded or collapsed
      if (document.visibilityState === 'hidden' || container.clientHeight < 60) {
        return;
      }
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      wasNearBottomRef.current = distanceFromBottom < 140;
      savedScrollTopRef.current = container.scrollTop;
      setIsScrolledUp(distanceFromBottom > 150);
    };

    const restoreScrollPosition = () => {
      const el = chatContainerRef.current;
      if (!el || el.clientHeight < 40) return;
      requestAnimationFrame(() => {
        if (wasNearBottomRef.current) {
          el.scrollTop = el.scrollHeight;
        } else {
          el.scrollTop = savedScrollTopRef.current;
        }
      });
    };

    const handleVisibilityOrResize = () => {
      if (document.visibilityState === 'visible') {
        restoreScrollPosition();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityOrResize);
    window.addEventListener('resize', handleVisibilityOrResize, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityOrResize);
      window.removeEventListener('resize', handleVisibilityOrResize);
    };
  }, [isWhiteboardMode, isChatMinimized, currentView]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.SYS_PROMPT, systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.LOREBOOK, JSON.stringify(lorebook));
  }, [lorebook]);

  useEffect(() => {
    persistChatMessagesImmediate(messages);
  }, [messages]);

  useEffect(() => {
    safeLocalStorageSetItem('argon_custom_api_key', customApiKey.trim());
  }, [customApiKey]);

  useEffect(() => {
    safeLocalStorageSetItem('argon_github_token', githubToken);
    safeLocalStorageSetItem(STORAGE_KEYS.GITHUB_TOKEN, githubToken);
  }, [githubToken]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.MODEL, selectedPresetModel);
  }, [selectedPresetModel]);

  useEffect(() => {
    if (hexAvatarUrl) {
      safeLocalStorageSetItem(STORAGE_KEYS.HEX_AVATAR_URL, hexAvatarUrl);
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.HEX_AVATAR_URL);
      } catch {}
    }
  }, [hexAvatarUrl]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.HEX_AVATAR_DESC, hexAvatarDesc);
  }, [hexAvatarDesc]);

  useEffect(() => {
    saveUserPersona(userPersona);
  }, [userPersona]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.ARGON_AVATAR_MODE, argonAvatarMode);
  }, [argonAvatarMode]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.STAFF_AGENTS, JSON.stringify(staffAgents));
  }, [staffAgents]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.STAFF_JOBS, JSON.stringify(staffJobs));
  }, [staffJobs]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.ARGON_BOOK, JSON.stringify(argonBook));
  }, [argonBook]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.HEX_BOOK, JSON.stringify(hexBook));
  }, [hexBook]);

  useEffect(() => {
    safeLocalStorageSetItem(
      STORAGE_KEYS.WHITEBOARD_STROKES,
      JSON.stringify(whiteboardStrokes)
    );
  }, [whiteboardStrokes]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.ARGON_VOICE_NAME, argonVoiceName);
  }, [argonVoiceName]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.ARGON_SPEECH_MODE, argonSpeechMode);
  }, [argonSpeechMode]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.ARGON_AUTO_SPEAK, String(autoSpeakArgon));
  }, [autoSpeakArgon]);

  useEffect(() => {
    let batteryObj: {
      level: number;
      charging: boolean;
      addEventListener?: (evt: string, cb: () => void) => void;
      removeEventListener?: (evt: string, cb: () => void) => void;
    } | null = null;

    const updateBattery = () => {
      if (!batteryObj) return;
      const pct = Math.round((batteryObj.level ?? 1) * 100);
      const state = batteryObj.charging ? 'charging' : 'discharging';
      setBattery({ batteryPct: pct, chargingState: state });
    };

    const nav = navigator as Navigator & {
      getBattery?: () => Promise<typeof batteryObj>;
    };

    if (typeof nav.getBattery === 'function') {
      nav
        .getBattery()
        .then((bat) => {
          batteryObj = bat;
          updateBattery();
          bat?.addEventListener?.('levelchange', updateBattery);
          bat?.addEventListener?.('chargingchange', updateBattery);
        })
        .catch(() => {
          // keep fallback
        });
    }

    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener?.('levelchange', updateBattery);
        batteryObj.removeEventListener?.('chargingchange', updateBattery);
      }
    };
  }, []);



  const formatLocalSyncTime = () =>
    new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const handleSaveToPhoneFolder = async () => {
    setIsSyncingPhone(true);
    setLocalSyncIsError(false);
    setLocalSyncStatus('Saving to phone file…');
    try {
      const payload = compileSanctuaryLiveSyncPayload({
        lorebook,
        argonBook,
        hexBook,
        curios: loadCurioShelf(),
        agentFixRequests: loadStoredAgentFixRequests(),
        ticketScratchpad,
        creepyShrine: loadCreepyShrineState(),
        userPersona,
        systemPrompt,
        staffAgents,
        staffJobs,
      });
      const result = await writeSanctuaryLiveSyncFile(payload);
      setLocalSyncIsError(false);
      const timeStr = formatLocalSyncTime();
      if (result.method === 'direct_file') {
        setLocalSyncStatus(`✓ Direct written to ${result.filename} (${timeStr})`);
      } else if (result.method === 'direct_dir') {
        setLocalSyncStatus(`✓ Direct written to ${result.filename} (${timeStr})`);
      } else {
        setLocalSyncStatus(`✓ Saved to persistent storage (${timeStr}). Link sync file to write directly to phone.`);
      }
      setLinkedSyncFileMeta(loadLinkedSyncFileMeta());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLocalSyncIsError(true);
      setLocalSyncStatus(`✗ Phone Save Failed: ${msg}`);
    } finally {
      setIsSyncingPhone(false);
    }
  };

  // Listen for external modal / tool writes (Curios, Shrine, Spines, Scratchpad, Tickets, Persona, Handle Meta)
  useEffect(() => {
    const onDirty = () => setLocalSyncRevision((n) => n + 1);
    const onMetaUpdated = () => setLinkedSyncFileMeta(loadLinkedSyncFileMeta());
    window.addEventListener('argon-local-sync-dirty', onDirty);
    window.addEventListener('argon-curio-shelf-updated', onDirty);
    window.addEventListener('argon-creepy-shrine-updated', onDirty);
    window.addEventListener('argon-linked-sync-meta-updated', onMetaUpdated);
    return () => {
      window.removeEventListener('argon-local-sync-dirty', onDirty);
      window.removeEventListener('argon-curio-shelf-updated', onDirty);
      window.removeEventListener('argon-creepy-shrine-updated', onDirty);
      window.removeEventListener('argon-linked-sync-meta-updated', onMetaUpdated);
    };
  }, []);

  // True Automatic Debounced Phone Sync: auto-writes sanctuary_live_sync.json whenever Books/Vault,
  // Drawers, Persona/Settings, Curios, or Tickets change while a persistent file/folder handle is linked & connected.
  useEffect(() => {
    const currentCurios = loadCurioShelf();
    const currentShrine = loadCreepyShrineState();
    const digest = JSON.stringify({
      argonBook,
      hexBook,
      lorebook,
      userPersona,
      systemPrompt,
      staffAgents,
      staffJobs,
      selectedPresetModel,
      agentFixRequests,
      ticketScratchpad,
      curios: currentCurios,
      creepyShrine: currentShrine,
    });

    if (lastAutoSyncDigestRef.current === null) {
      lastAutoSyncDigestRef.current = digest;
      return;
    }

    if (digest === lastAutoSyncDigestRef.current) {
      return;
    }

    if (autoPhoneSyncTimerRef.current) {
      window.clearTimeout(autoPhoneSyncTimerRef.current);
      autoPhoneSyncTimerRef.current = null;
    }

    if (linkedSyncFileMeta?.status !== 'connected') {
      lastAutoSyncDigestRef.current = digest;
      return;
    }

    autoPhoneSyncTimerRef.current = window.setTimeout(() => {
      autoPhoneSyncTimerRef.current = null;
      lastAutoSyncDigestRef.current = digest;
      void autoWriteThroughLocalSyncDetailed(
        {
          lorebook,
          argonBook,
          hexBook,
          curios: loadCurioShelf(),
          agentFixRequests,
          ticketScratchpad,
          creepyShrine: loadCreepyShrineState(),
          userPersona,
          systemPrompt,
          staffAgents,
          staffJobs,
        },
        { allowPermissionPrompt: false }
      ).then((res) => {
        setLinkedSyncFileMeta(res.meta || loadLinkedSyncFileMeta());
        if (res.method === 'direct_file' || res.method === 'direct_dir') {
          setLocalSyncIsError(false);
          setLocalSyncStatus(`✓ Auto-synced ${res.filename} (${formatLocalSyncTime()})`);
        }
      });
    }, 1200);

    return () => {
      if (autoPhoneSyncTimerRef.current) {
        window.clearTimeout(autoPhoneSyncTimerRef.current);
        autoPhoneSyncTimerRef.current = null;
      }
    };
  }, [
    argonBook,
    hexBook,
    lorebook,
    userPersona,
    systemPrompt,
    staffAgents,
    staffJobs,
    selectedPresetModel,
    agentFixRequests,
    ticketScratchpad,
    localSyncRevision,
    linkedSyncFileMeta?.status,
  ]);

  const handleLoadFromPhoneFolder = async (file?: File) => {
    setIsSyncingPhone(true);
    setLocalSyncIsError(false);
    setLocalSyncStatus('Reading from phone file…');
    try {
      const payload = await readSanctuaryLiveSyncFile(file);
      if (!payload) {
        setLocalSyncIsError(true);
        setLocalSyncStatus('✗ Could not read sanctuary_live_sync.json');
        return;
      }

      if (payload.lorebook && Object.keys(payload.lorebook).length > 0) {
        setLorebook((prev) => {
          const merged = { ...SEED_LOREBOOK_DRAWERS, ...prev, ...payload.lorebook };
          safeLocalStorageSetItem(STORAGE_KEYS.LOREBOOK, JSON.stringify(merged));
          return merged;
        });
      }

      if (
        payload.argonBook &&
        (Array.isArray(payload.argonBook.entries) ||
          Array.isArray(payload.argonBook.memorySection))
      ) {
        setArgonBook(payload.argonBook);
        safeLocalStorageSetItem(STORAGE_KEYS.ARGON_BOOK, JSON.stringify(payload.argonBook));
      }

      if (Array.isArray(payload.hexBook)) {
        setHexBook(payload.hexBook);
        safeLocalStorageSetItem(STORAGE_KEYS.HEX_BOOK, JSON.stringify(payload.hexBook));
      }

      if (Array.isArray(payload.curios)) {
        saveCurioShelf(payload.curios);
      }

      if (Array.isArray(payload.agentFixRequests)) {
        setAgentFixRequests(payload.agentFixRequests);
        saveStoredAgentFixRequests(payload.agentFixRequests);
      }

      if (payload.ticketScratchpad) {
        setTicketScratchpad(payload.ticketScratchpad);
        saveTicketScratchpad(payload.ticketScratchpad);
      }

      if (payload.creepyShrine) {
        saveCreepyShrineState(payload.creepyShrine);
      }

      if (payload.userPersona) {
        setUserPersona(payload.userPersona);
        saveUserPersona(payload.userPersona);
      }

      if (typeof payload.systemPrompt === 'string' && payload.systemPrompt.trim()) {
        setSystemPrompt(payload.systemPrompt);
        safeLocalStorageSetItem(STORAGE_KEYS.SYS_PROMPT, payload.systemPrompt);
      }

      if (Array.isArray(payload.staffAgents)) {
        setStaffAgents(payload.staffAgents);
        safeLocalStorageSetItem(STORAGE_KEYS.STAFF_AGENTS, JSON.stringify(payload.staffAgents));
      }

      if (Array.isArray(payload.staffJobs)) {
        setStaffJobs(payload.staffJobs);
        safeLocalStorageSetItem(STORAGE_KEYS.STAFF_JOBS, JSON.stringify(payload.staffJobs));
      }

      setLocalSyncIsError(false);
      setLocalSyncStatus(
        `✓ Loaded ${Object.keys(payload.lorebook || {}).length} drawers & Sanctuary Books (${formatLocalSyncTime()})`
      );
      setLinkedSyncFileMeta(loadLinkedSyncFileMeta());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLocalSyncIsError(true);
      setLocalSyncStatus(`✗ Phone Load Failed: ${msg}`);
    } finally {
      setIsSyncingPhone(false);
    }
  };

  const handleLinkSyncFile = async (mode: 'open' | 'save' = 'open') => {
    setIsSyncingPhone(true);
    setLocalSyncIsError(false);
    setLocalSyncStatus('Linking sync file…');
    try {
      const res = await pickAndLinkSyncFile(mode);
      if (res.cancelled) {
        setLocalSyncStatus('Sync file selection cancelled');
        return;
      }
      if (!res.success || !res.handle) {
        setLocalSyncIsError(true);
        setLocalSyncStatus(`✗ Could not link file: ${res.error || 'Unknown error'}`);
        return;
      }
      const meta = loadLinkedSyncFileMeta();
      setLinkedSyncFileMeta(meta);
      setLocalSyncStatus(`✓ Linked ${meta?.fileName || 'sanctuary_live_sync.json'} (${formatLocalSyncTime()})`);

      // If file has existing content, read it; otherwise write current sanctuary state into it
      const existing = await readSanctuaryLiveSyncFile();
      if (existing && existing.lorebook && Object.keys(existing.lorebook).length > 0) {
        await handleLoadFromPhoneFolder();
      } else {
        await handleSaveToPhoneFolder();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLocalSyncIsError(true);
      setLocalSyncStatus(`✗ Link file error: ${msg}`);
    } finally {
      setIsSyncingPhone(false);
    }
  };

  const handleLinkPhoneFolder = async () => {
    setIsSyncingPhone(true);
    setLocalSyncIsError(false);
    setLocalSyncStatus('Linking phone folder…');
    try {
      const res = await pickAndLinkPhoneFolder();
      if (res.cancelled) {
        setLocalSyncStatus('Folder selection cancelled');
        return;
      }
      if (!res.success || !res.handle) {
        setLocalSyncIsError(true);
        setLocalSyncStatus(`✗ Could not link folder: ${res.error || 'Unknown error'}`);
        return;
      }
      const meta = loadLinkedSyncFileMeta();
      setLinkedSyncFileMeta(meta);
      setLocalSyncStatus(`✓ Linked folder ${meta?.fileName} (${formatLocalSyncTime()})`);
      await handleSaveToPhoneFolder();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLocalSyncIsError(true);
      setLocalSyncStatus(`✗ Link folder error: ${msg}`);
    } finally {
      setIsSyncingPhone(false);
    }
  };

  const handleUnlinkSyncFile = async () => {
    await clearLinkedSyncFileHandle();
    setLinkedSyncFileMeta(null);
    setLocalSyncStatus('Phone sync file unlinked');
  };

  const formatGistTime = () =>
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  const pushSanctuaryBooksToGist = async (
    nextArgonBook: ArgonJournalState = argonBook,
    nextHexBook: JournalEntry[] = hexBook,
    includeLorebook = false,
    isExplicitPush = false
  ) => {
    const targetGistId = extractGistIdFromInput(gistId) || DEFAULT_GIST_ID;
    const bookFiles = serializeSanctuaryBooksForGist(nextArgonBook, nextHexBook);
    const filesPayload: Record<string, { content: string }> = {
      ...(includeLorebook
        ? Object.fromEntries(
            Object.entries(lorebook).map(([fname, content]) => [fname, { content }])
          )
        : {}),
      ...bookFiles,
    };

    try {
      localStorage.setItem(STORAGE_KEYS.ARGON_BOOK, JSON.stringify(nextArgonBook));
      localStorage.setItem(STORAGE_KEYS.HEX_BOOK, JSON.stringify(nextHexBook));
    } catch {
      // ignore
    }

    const token = githubToken.trim();
    if (!token) {
      if (isExplicitPush) {
        setGistSyncIsError(true);
        setGistSyncStatus(
          '✗ GitHub Token (ghp_...) is required to push to GitHub Gist. Paste your token above.'
        );
      } else {
        setGistSyncIsError(false);
        setGistSyncStatus(
          `Saved ${GIST_SANCTUARY_BOOKS_VAULT_FILENAME} (${GIST_ARGON_BOOK_FILENAME} & ${GIST_HEX_BOOK_FILENAME}) to localStorage`
        );
      }
      return;
    }

    if (isExplicitPush) {
      setIsSyncingGist(true);
    }
    try {
      const directPatch = await fetch(
        `https://api.github.com/gists/${targetGistId}`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: filesPayload }),
        }
      );
      if (directPatch.ok) {
        setGistSyncIsError(false);
        setGistSyncStatus(
          `✓ Pushed to Gist ${targetGistId} at ${formatGistTime()}`
        );
        return;
      } else {
        let errDetail = `${directPatch.status} ${directPatch.statusText}`;
        try {
          const errJson = await directPatch.json();
          if (errJson?.message) errDetail = `${directPatch.status}: ${errJson.message}`;
        } catch {
          // ignore
        }
        setGistSyncIsError(true);
        setGistSyncStatus(`✗ Gist Push Error (${errDetail})`);
        return;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isExplicitPush) {
        setGistSyncIsError(true);
        setGistSyncStatus(`✗ Gist Push Failed: ${msg}`);
        return;
      }
    } finally {
      if (isExplicitPush) {
        setIsSyncingGist(false);
      }
    }

    setGistSyncIsError(false);
    setGistSyncStatus(
      `Saved ${GIST_SANCTUARY_BOOKS_VAULT_FILENAME} (${GIST_ARGON_BOOK_FILENAME} & ${GIST_HEX_BOOK_FILENAME}) to localStorage`
    );
  };

  const handlePushAllToGist = async () => {
    await pushSanctuaryBooksToGist(argonBook, hexBook, true, true);
  };

  const handleCreateNewPrivateGist = async () => {
    const token = githubToken.trim();
    if (!token) {
      setGistSyncIsError(true);
      setGistSyncStatus(
        '✗ GitHub Token (ghp_...) is required to create a new private Gist. Paste your token above.'
      );
      return;
    }

    setIsSyncingGist(true);
    setGistSyncIsError(false);
    setGistSyncStatus('Creating new private Gist on GitHub…');
    try {
      const bookFiles = serializeSanctuaryBooksForGist(argonBook, hexBook);
      const filesPayload: Record<string, { content: string }> = {
        ...Object.fromEntries(
          Object.entries(lorebook).map(([fname, content]) => [
            fname,
            { content: content || '# Empty Drawer' },
          ])
        ),
        ...bookFiles,
      };

      const res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Argon & Hex Sanctuary Lorebook Drawers & Books Vault',
          public: false,
          files: filesPayload,
        }),
      });

      if (!res.ok) {
        let errDetail = `${res.status} ${res.statusText}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) errDetail = `${res.status}: ${errJson.message}`;
        } catch {
          // ignore
        }
        setGistSyncIsError(true);
        setGistSyncStatus(`✗ Create Private Gist Error (${errDetail})`);
        return;
      }

      const data = await res.json();
      const createdId = extractGistIdFromInput(data?.id);
      if (!createdId) {
        setGistSyncIsError(true);
        setGistSyncStatus('✗ GitHub Gist created, but response did not include a Gist ID.');
        return;
      }

      setGistId(createdId);
      saveGistId(createdId);
      setGistSyncIsError(false);
      setGistSyncStatus(`✓ Pushed to Gist ${createdId} at ${formatGistTime()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGistSyncIsError(true);
      setGistSyncStatus(`✗ Create Private Gist Failed: ${msg}`);
    } finally {
      setIsSyncingGist(false);
    }
  };

  const syncGistDrawers = async (isExplicitPull = false) => {
    const targetGistId = extractGistIdFromInput(gistId) || DEFAULT_GIST_ID;
    setIsSyncingGist(true);
    setGistSyncIsError(false);
    setGistSyncStatus(`Syncing Gist ${targetGistId.slice(0, 8)}…`);
    try {
      let filesObj: Record<string, { filename?: string; content?: string }> | null = null;
      let fromRealGithub = false;
      let pullErrorMsg: string | null = null;
      try {
        const directRes = await fetch(
          `https://api.github.com/gists/${targetGistId}`,
          {
            headers: {
              Accept: 'application/vnd.github+json',
              ...(githubToken.trim()
                ? { Authorization: `Bearer ${githubToken.trim()}` }
                : {}),
            },
          }
        );
        if (directRes.ok) {
          const data = await directRes.json();
          if (data && data.files) {
            filesObj = data.files;
            fromRealGithub = true;
          }
        } else if (isExplicitPull) {
          let errDetail = `${directRes.status} ${directRes.statusText}`;
          try {
            const errJson = await directRes.json();
            if (errJson?.message) errDetail = `${directRes.status}: ${errJson.message}`;
          } catch {
            // ignore
          }
          pullErrorMsg = `✗ Pull from Gist ${targetGistId} Error (${errDetail})`;
        }
      } catch (err: unknown) {
        if (isExplicitPull) {
          const msg = err instanceof Error ? err.message : String(err);
          pullErrorMsg = `✗ Pull from Gist ${targetGistId} Failed: ${msg}`;
        }
      }

      if (pullErrorMsg && isExplicitPull) {
        setGistSyncIsError(true);
        setGistSyncStatus(pullErrorMsg);
        return;
      }

      if (filesObj && Object.keys(filesObj).length > 0) {
        const {
          argonBook: gistArgonBook,
          hexBook: gistHexBook,
          lorebookDrawers: loadedDrawers,
        } = extractSanctuaryBooksFromGistFiles(filesObj);

        if (Object.keys(loadedDrawers).length > 0) {
          setLorebook((prev) => {
            const merged = { ...SEED_LOREBOOK_DRAWERS, ...prev, ...loadedDrawers };
            if (typeof merged[GIST_AGENT_FIX_DRAWER] === 'string') {
              merged[GIST_AGENT_FIX_DRAWER] = enforceAgentFixDrawerCharLimit(
                merged[GIST_AGENT_FIX_DRAWER],
                MAX_AGENT_FIX_DRAWER_CHARS
              );
            }
            try {
              localStorage.setItem(STORAGE_KEYS.LOREBOOK, JSON.stringify(merged));
            } catch {
              // ignore
            }
            return merged;
          });
        }

        const hasLocalArgonBook = Boolean(localStorage.getItem(STORAGE_KEYS.ARGON_BOOK));
        const hasLocalHexBook = localStorage.getItem(STORAGE_KEYS.HEX_BOOK) !== null;

        if (gistArgonBook && (fromRealGithub || isExplicitPull || !hasLocalArgonBook)) {
          setArgonBook(gistArgonBook);
          try {
            localStorage.setItem(STORAGE_KEYS.ARGON_BOOK, JSON.stringify(gistArgonBook));
          } catch {
            // ignore
          }
        }

        if (gistHexBook && (fromRealGithub || isExplicitPull || !hasLocalHexBook)) {
          setHexBook(gistHexBook);
          try {
            localStorage.setItem(STORAGE_KEYS.HEX_BOOK, JSON.stringify(gistHexBook));
          } catch {
            // ignore
          }
        }

        // Restore 35 Sliced Chibi Stickers & Studio Config from Gist if present
        const gistStickersRaw = filesObj[GIST_STICKERS_FILENAME]?.content;
        if (gistStickersRaw) {
          try {
            const parsedStickers = JSON.parse(gistStickersRaw) as {
              slicedMap?: Partial<Record<ArgonStickerShortcode, string>>;
              config?: StickerStudioConfig;
            };
            if (parsedStickers?.slicedMap && Object.keys(parsedStickers.slicedMap).length > 0) {
              await saveSlicedStickersAndSheet({
                slicedMap: parsedStickers.slicedMap,
                config: parsedStickers.config,
              });
            }
          } catch {
            // ignore malformed sticker backup
          }
        }

        setGistSyncIsError(false);
        setGistSyncStatus(
          `✓ Pulled from Gist ${targetGistId} at ${formatGistTime()} (${Object.keys(loadedDrawers).length} drawers + ${GIST_SANCTUARY_BOOKS_VAULT_FILENAME})`
        );
      } else {
        setGistSyncIsError(false);
        setGistSyncStatus('Loaded local Lorebook & Sanctuary Books cache');
      }
    } catch (err: unknown) {
      if (isExplicitPull) {
        const msg = err instanceof Error ? err.message : String(err);
        setGistSyncIsError(true);
        setGistSyncStatus(`✗ Gist Sync Failed: ${msg}`);
      } else {
        setGistSyncStatus('Offline cache active');
      }
    } finally {
      setIsSyncingGist(false);
    }
  };

  const handleBackupStickersToGist = async (
    slicedMap: Partial<Record<ArgonStickerShortcode, string>>,
    config: StickerStudioConfig
  ) => {
    const token = githubToken.trim();
    const targetGistId = extractGistIdFromInput(gistId) || DEFAULT_GIST_ID;
    if (!token) {
      setGistSyncStatus('Saved 35 sliced stickers locally (add GitHub Token in Settings for Gist sync)');
      return;
    }
    try {
      const payload = JSON.stringify({ slicedMap, config, updatedAt: Date.now() });
      const res = await fetch(`https://api.github.com/gists/${targetGistId}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            [GIST_STICKERS_FILENAME]: { content: payload },
          },
        }),
      });
      if (res.ok) {
        setGistSyncIsError(false);
        setGistSyncStatus(`✓ Pushed ${GIST_STICKERS_FILENAME} to Gist ${targetGistId} at ${formatGistTime()}`);
      }
    } catch {
      // ignore offline
    }
  };

  useEffect(() => {
    // Local phone boot sync: restore cached local backup without calling GitHub API
    void (async () => {
      try {
        const cached = await readSanctuaryLiveSyncFile();
        if (cached && cached.lorebook && Object.keys(cached.lorebook).length > 0) {
          setLorebook((prev) => ({ ...SEED_LOREBOOK_DRAWERS, ...cached.lorebook, ...prev }));
        }
      } catch {
        // ignore offline cache boot errors
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOpenMeteo = async (lat: number, lon: number, label: string) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,pressure_msl&timezone=auto&temperature_unit=fahrenheit`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const current = data?.current;
      const returnedTz = String(data?.timezone || '').trim() || (label.toLowerCase().includes('kalamazoo') ? 'America/Detroit' : 'America/Detroit');
      saveTelemetryLocation({ city: label, label, lat, lon, timezone: returnedTz });
      if (current) {
        // Use pressure_msl (Mean Sea Level Adjusted Pressure) for standard meteorological & medical barometer telemetry;
        // surface_pressure is raw station pressure (~976 hPa at Kalamazoo's 780ft elevation).
        const resolvedMslHpa =
          typeof current.pressure_msl === 'number'
            ? current.pressure_msl
            : typeof current.surface_pressure === 'number'
            ? current.surface_pressure
            : weather.hPa ?? 1013;
        const resolvedSurfaceHpa =
          typeof current.surface_pressure === 'number'
            ? current.surface_pressure
            : null;

        const nextWeather: WeatherTelemetry = {
          tempF:
            typeof current.temperature_2m === 'number'
              ? current.temperature_2m
              : weather.tempF ?? 64,
          condition: mapWmoWeatherCode(current.weather_code),
          hPa: resolvedMslHpa,
          surfaceHpa: resolvedSurfaceHpa,
          humidity: current.relative_humidity_2m ?? null,
          apparentTempF: current.apparent_temperature ?? null,
          locationLabel: label,
          timezone: returnedTz,
          updatedAt: Date.now(),
        };
        setWeather(nextWeather);
        setWeatherCoords((prev) => ({ ...prev, timezone: returnedTz }));
        setWeatherStatus(
          resolvedSurfaceHpa !== null
            ? `Updated Open-Meteo for ${label} (${Math.round(resolvedMslHpa)} hPa MSL / ${Math.round(resolvedSurfaceHpa)} hPa station)`
            : `Updated Open-Meteo for ${label} (${Math.round(resolvedMslHpa)} hPa MSL)`
        );
        saveTelemetryLastWeather(nextWeather);
      }
    } catch {
      setWeatherStatus(`Using cached barometric telemetry (${label})`);
    }
  };

  useEffect(() => {
    fetchOpenMeteo(weatherCoords.lat, weatherCoords.lon, weatherCoords.label);
    const interval = window.setInterval(
      () => {
        fetchOpenMeteo(weatherCoords.lat, weatherCoords.lon, weatherCoords.label);
      },
      15 * 60 * 1000
    );
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherCoords]);

  const handleUsePhoneGps = () => {
    if (!navigator.geolocation) {
      setWeatherStatus('Geolocation is not supported on this browser.');
      return;
    }
    setWeatherStatus('Acquiring Phone GPS coordinates…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        const label = `GPS (${lat}, ${lon})`;
        saveTelemetryLocation({ city: label, label, lat, lon });
        setWeatherCoords({ lat, lon, label });
      },
      (err) => {
        setWeatherStatus(`GPS error: ${err.message}`);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const handleSearchCityWeather = async (query: string) => {
    setWeatherStatus(`Searching Open-Meteo geocoding for "${query}"…`);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`
      );
      if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
      const data = await res.json();
      const first = data?.results?.[0];
      if (!first) {
        setWeatherStatus(`No matching city/zip found for "${query}".`);
        return;
      }
      const label = [first.name, first.admin1, first.country_code]
        .filter(Boolean)
        .join(', ');
      saveTelemetryLocation({
        city: label,
        label,
        lat: first.latitude,
        lon: first.longitude,
      });
      setWeatherCoords({
        lat: first.latitude,
        lon: first.longitude,
        label,
      });
    } catch {
      setWeatherStatus(`Could not geocode "${query}". Check connection.`);
    }
  };

  const handleSaveDrawer = (
    oldFilename: string | null,
    newFilename: string,
    content: string
  ) => {
    let nextLorebook: LorebookMap = lorebook;
    setLorebook((prev) => {
      const next = { ...prev };
      if (oldFilename && oldFilename !== newFilename) {
        delete next[oldFilename];
      }
      next[newFilename] = content;
      nextLorebook = next;
      safeLocalStorageSetItem(STORAGE_KEYS.LOREBOOK, JSON.stringify(next));
      return next;
    });
    setActiveDrawerFilename(newFilename);

    // Auto-Sync Hook: write through to IndexedDB and phone folder if linked, without GitHub API
    void autoWriteThroughLocalSync({
      lorebook: nextLorebook,
      argonBook,
      hexBook,
    });
    setLocalSyncStatus(`✓ Auto-synced "${newFilename}" locally at ${formatLocalSyncTime()}`);
  };

  const handleDeleteDrawer = (filename: string) => {
    let nextLorebook: LorebookMap = lorebook;
    setLorebook((prev) => {
      const next = { ...prev };
      delete next[filename];
      nextLorebook = next;
      safeLocalStorageSetItem(STORAGE_KEYS.LOREBOOK, JSON.stringify(next));
      return next;
    });

    // Auto-Sync Hook: write through to IndexedDB and phone folder if linked, without GitHub API
    void autoWriteThroughLocalSync({
      lorebook: nextLorebook,
      argonBook,
      hexBook,
    });
    setLocalSyncStatus(`✓ Deleted "${filename}" & auto-synced locally`);
  };

  const handleNewChat = async () => {
    // Cancel any pending debounced auto-sync timer before performing the immediate awaited flush
    if (autoPhoneSyncTimerRef.current) {
      window.clearTimeout(autoPhoneSyncTimerRef.current);
      autoPhoneSyncTimerRef.current = null;
    }

    // 1. Commit Lorebook Drawers (including 01_live_handoff.md), Sanctuary Books/Journals, Persona, Curios, and Tickets
    safeLocalStorageSetItem(STORAGE_KEYS.LOREBOOK, JSON.stringify(lorebook));
    safeLocalStorageSetItem(STORAGE_KEYS.ARGON_BOOK, JSON.stringify(argonBook));
    safeLocalStorageSetItem(STORAGE_KEYS.HEX_BOOK, JSON.stringify(hexBook));
    const currentCurios = loadCurioShelf();
    saveCurioShelf(currentCurios);
    const currentShrine = loadCreepyShrineState();
    saveCreepyShrineState(currentShrine);
    saveUserPersona(userPersona);
    safeLocalStorageSetItem(STORAGE_KEYS.SYS_PROMPT, systemPrompt);
    safeLocalStorageSetItem(STORAGE_KEYS.STAFF_AGENTS, JSON.stringify(staffAgents));
    safeLocalStorageSetItem(STORAGE_KEYS.STAFF_JOBS, JSON.stringify(staffJobs));
    safeLocalStorageSetItem(STORAGE_KEYS.AGENT_FIX_REQUESTS, JSON.stringify(agentFixRequests));
    saveTicketScratchpad(ticketScratchpad);

    // Await automatic phone sync write flush BEFORE clearing messages
    const phoneFlushResult = await autoWriteThroughLocalSyncDetailed(
      {
        lorebook,
        argonBook,
        hexBook,
        curios: currentCurios,
        agentFixRequests,
        ticketScratchpad,
        creepyShrine: currentShrine,
        userPersona,
        systemPrompt,
        staffAgents,
        staffJobs,
      },
      { allowPermissionPrompt: true }
    );
    setLinkedSyncFileMeta(phoneFlushResult.meta || loadLinkedSyncFileMeta());
    if (phoneFlushResult.method === 'direct_file' || phoneFlushResult.method === 'direct_dir') {
      setLocalSyncIsError(false);
      setLocalSyncStatus(
        `✓ Flushed to ${phoneFlushResult.filename} before Clear Chat (${formatLocalSyncTime()})`
      );
    }

    // 2. Trigger private Gist & dedicated `sanctuary-vault` branch backup if GitHub token is configured (NEVER main)
    if (githubToken && githubToken.trim()) {
      try {
        await Promise.allSettled([
          pushSanctuaryBooksToGist(argonBook, hexBook, true, true),
          pushSanctuaryStateToVaultBranch({
            githubToken,
            payload: compileSanctuaryLiveSyncPayload({
              lorebook,
              argonBook,
              hexBook,
              curios: currentCurios,
              agentFixRequests,
              ticketScratchpad,
              creepyShrine: currentShrine,
              userPersona,
              systemPrompt,
              staffAgents,
              staffJobs,
            }),
            commitMessage: `chore(${SANCTUARY_VAULT_BRANCH}): Auto-backup Sanctuary state before Clear Chat`,
          }),
        ]);
      } catch (err) {
        console.warn('Cloud auto-backup during clear chat:', err);
      }
    }

    // 3. Display confirmation toast before resetting message history to 0
    showToast('State backed up & chat cleared');

    setMessages(INITIAL_WELCOME_MESSAGES);
    setErrorBanner(null);
    chatInputRef.current?.clear();
    setAttachedImages([]);
    setIsChatMinimized(false);
  };

  const handleCopyMessageText = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedMsgId(msgId);
    window.setTimeout(() => {
      setCopiedMsgId((prev) => (prev === msgId ? null : prev));
    }, 1800);
  };

  const handleStartEditMessage = (msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setEditingMsgText(msg.text);
  };

  const handleSaveEditedMessage = (msgId: string) => {
    const trimmed = editingMsgText.trim();
    if (trimmed) {
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === msgId ? { ...m, text: trimmed } : m));
        persistChatMessagesImmediate(next);
        return next;
      });
    }
    setEditingMsgId(null);
    setEditingMsgText('');
  };

  const handleDeleteMessage = (msgId: string) => {
    if (speakingMsgId === msgId) {
      stopArgonAudioPlayback();
    }
    setMessages((prev) => {
      const next = prev.filter((m) => m.id !== msgId);
      persistChatMessagesImmediate(next);
      return next;
    });
  };

  const handleToggleReaction = (
    msgId: string,
    emoji: string,
    user: 'Hex' | 'Argon' | string = 'Hex'
  ) => {
    setMessages((prev) => {
      const next = prev.map((m) =>
        m.id === msgId
          ? { ...m, reactions: toggleMessageReaction(m.reactions, emoji, user) }
          : m
      );
      persistChatMessagesImmediate(next);
      return next;
    });
  };

  const stopArgonAudioPlayback = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setSpeakingMsgId(null);
  };

  const playBrowserSpeechFallback = (msgId: string, textToSpeak: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeakingMsgId(null);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.pitch = 0.82;
      utterance.rate = 0.96;
      const voices = window.speechSynthesis.getVoices();
      const deepMaleVoice = voices.find((v) =>
        /male|david|daniel|alex|google uk english male|mark/i.test(v.name)
      );
      if (deepMaleVoice) {
        utterance.voice = deepMaleVoice;
      }
      utterance.onend = () => {
        setSpeakingMsgId((prev) => (prev === msgId ? null : prev));
      };
      utterance.onerror = () => {
        setSpeakingMsgId((prev) => (prev === msgId ? null : prev));
      };
      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingMsgId(null);
    }
  };

  const handleSpeakMessage = async (msg: ChatMessage) => {
    if (speakingMsgId === msg.id) {
      stopArgonAudioPlayback();
      return;
    }

    stopArgonAudioPlayback();
    const cleaned = extractArgonSpeechText(msg.text, argonSpeechMode);
    if (!cleaned) return;

    const cacheKey = `${msg.id}:${argonVoiceName}:${argonSpeechMode}:${argonVocalStylePrompt.slice(0, 64)}`;
    const cachedDataUrl = audioCacheRef.current.get(cacheKey);
    if (cachedDataUrl) {
      try {
        const audio = new Audio(cachedDataUrl);
        activeAudioRef.current = audio;
        setSpeakingMsgId(msg.id);
        audio.onended = () => setSpeakingMsgId((prev) => (prev === msg.id ? null : prev));
        audio.onerror = () => playBrowserSpeechFallback(msg.id, cleaned);
        await audio.play();
        return;
      } catch {
        playBrowserSpeechFallback(msg.id, cleaned);
        return;
      }
    }

    setLoadingAudioMsgId(msg.id);
    try {
      const data = await runClientArgonTts({
        text: cleaned,
        voiceName: argonVoiceName,
        speechMode: argonSpeechMode,
        vocalStylePrompt: argonVocalStylePrompt,
        customApiKey,
      });
      if (!data.audioBase64) {
        throw new Error('No audio generated');
      }
      const mime = data.mimeType || 'audio/wav';
      const dataUrl = `data:${mime};base64,${data.audioBase64}`;
      audioCacheRef.current.set(cacheKey, dataUrl);

      const audio = new Audio(dataUrl);
      activeAudioRef.current = audio;
      setSpeakingMsgId(msg.id);
      audio.onended = () => setSpeakingMsgId((prev) => (prev === msg.id ? null : prev));
      audio.onerror = () => playBrowserSpeechFallback(msg.id, cleaned);
      await audio.play();
    } catch {
      playBrowserSpeechFallback(msg.id, cleaned);
    } finally {
      setLoadingAudioMsgId((prev) => (prev === msg.id ? null : prev));
    }
  };

  // Camera Access Handlers
  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
  };

  const startCameraStream = async (facing: 'environment' | 'user') => {
    stopCameraStream();
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Live camera stream is not supported in this browser context. Use the Snap / Upload button below.'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(`Camera permission or hardware notice: ${msg}`);
    }
  };

  const handleOpenCameraModal = () => {
    setIsCameraModalOpen(true);
    window.setTimeout(() => {
      startCameraStream(cameraFacingMode);
    }, 60);
  };

  const handleCloseCameraModal = () => {
    stopCameraStream();
    setIsCameraModalOpen(false);
    setCameraError(null);
  };

  const handleFlipCamera = () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    startCameraStream(nextFacing);
  };

  const handleCaptureCameraFrame = () => {
    const video = cameraVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      cameraFallbackInputRef.current?.click();
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx !== -1) {
      setAttachedImages((prev) => [
        ...prev,
        {
          mimeType: 'image/jpeg',
          data: dataUrl.slice(commaIdx + 1),
          name: `camera-${Date.now()}.jpg`,
          description: 'Live camera photo from Hex',
        },
      ]);
    }
    handleCloseCameraModal();
  };

  // 3-Layer Iframe-Proof Microphone, Real Playable Voice Messages & Gemini Multimodal Audio Handlers
  const stopMicRecordingResources = () => {
    isRecordingMicRef.current = false;
    if (micTimerRef.current) {
      window.clearInterval(micTimerRef.current);
      micTimerRef.current = null;
    }
    if (speechWatchdogRef.current) {
      window.clearTimeout(speechWatchdogRef.current);
      speechWatchdogRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
  };

  const executeCompletedVoiceAction = async (params: {
    action: 'review' | 'put_text' | 'send_voice' | 'cancel';
    voiceAudio: AttachedVoiceAudio | null;
    transcript: string;
    durationSec: number;
  }) => {
    const { action, voiceAudio, transcript, durationSec } = params;
    const cleanTranscript = transcript.trim();

    if (action === 'cancel') {
      setPendingVoiceDraft(null);
      setMicRecognizedText('');
      setMicLiveInterimText('');
      micRecognizedTextRef.current = '';
      micLiveInterimTextRef.current = '';
      setMicActiveLayer(null);
      return;
    }

    if (action === 'put_text') {
      if (cleanTranscript) {
        chatInputRef.current?.appendText(cleanTranscript);
      }
      setPendingVoiceDraft(null);
      setMicRecognizedText('');
      setMicLiveInterimText('');
      micRecognizedTextRef.current = '';
      micLiveInterimTextRef.current = '';
      setMicActiveLayer(null);
      chatInputRef.current?.focus();
      return;
    }

    if (action === 'send_voice') {
      setPendingVoiceDraft(null);
      setMicRecognizedText('');
      setMicLiveInterimText('');
      micRecognizedTextRef.current = '';
      micLiveInterimTextRef.current = '';
      setMicActiveLayer(null);
      const textForBubble = `🎙️ [Voice Note (${Math.max(1, durationSec)}s)]`;
      await dispatchMessageToArgon(textForBubble, [], null, voiceAudio);
      return;
    }

    // Default 'review': keep the recorded clip & transcript in the Voice Bar so the user can choose Send Voice Message, Put Text in Box, or Cancel!
    if (voiceAudio || cleanTranscript) {
      setPendingVoiceDraft({
        voiceAudio,
        transcript: cleanTranscript,
        durationSec: Math.max(1, durationSec),
      });
    }
    setMicActiveLayer(null);
  };

  const processRecordedAudioBlob = async (
    audioBlob: Blob | null,
    mimeType: string,
    action: 'review' | 'put_text' | 'send_voice' | 'cancel'
  ) => {
    if (action === 'cancel') {
      await executeCompletedVoiceAction({
        action: 'cancel',
        voiceAudio: null,
        transcript: '',
        durationSec: 0,
      });
      return;
    }

    const durationSec = Math.max(1, micRecordSecondsRef.current || micRecordSeconds || 1);
    const liveSpeechCombined = [
      micRecognizedTextRef.current.trim(),
      micLiveInterimTextRef.current.trim(),
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!audioBlob || audioBlob.size === 0) {
      await executeCompletedVoiceAction({
        action,
        voiceAudio: null,
        transcript: liveSpeechCombined,
        durationSec,
      });
      return;
    }

    setIsTranscribingMic(true);
    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resStr = String(reader.result || '');
          const comma = resStr.indexOf(',');
          resolve(comma !== -1 ? resStr.slice(comma + 1) : '');
        };
        reader.onerror = () => reject(new Error('Failed to read recorded audio'));
        reader.readAsDataURL(audioBlob);
      });

      const cleanMime = normalizeAudioMimeType(mimeType || audioBlob.type || 'audio/webm');
      const voiceAudio: AttachedVoiceAudio | null = base64Audio
        ? {
            mimeType: cleanMime,
            data: base64Audio,
            durationSec,
          }
        : null;

      let finalTranscript = liveSpeechCombined;
      if (!finalTranscript && base64Audio) {
        try {
          const geminiText = await runClientAudioTranscribe({
            audioBase64: base64Audio,
            mimeType: cleanMime,
            customApiKey,
          });
          finalTranscript = String(geminiText || '').trim();
        } catch (transcribeErr: unknown) {
          // If transcription fails on 'send_voice' or 'review', we still preserve the playable voiceAudio so Argon hears inlineData directly!
          if (action === 'put_text') {
            throw transcribeErr;
          }
        }
      }

      await executeCompletedVoiceAction({
        action,
        voiceAudio,
        transcript: finalTranscript,
        durationSec,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorBanner(`Microphone transcription error: ${msg}`);
    } finally {
      setIsTranscribingMic(false);
    }
  };

  const handleStopMicRecording = (
    action: 'review' | 'put_text' | 'send_voice' | 'cancel' = 'review'
  ) => {
    micStopActionRef.current = action;
    isRecordingMicRef.current = false;
    setIsRecordingMic(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        return;
      } catch {
        stopMicRecordingResources();
      }
    }

    stopMicRecordingResources();
    void processRecordedAudioBlob(null, 'audio/webm', action);
  };

  const handleCancelVoiceRecording = () => {
    if (isRecordingMicRef.current || isRecordingMic) {
      handleStopMicRecording('cancel');
      return;
    }
    stopMicRecordingResources();
    setIsRecordingMic(false);
    setPendingVoiceDraft(null);
    setMicRecognizedText('');
    setMicLiveInterimText('');
    micRecognizedTextRef.current = '';
    micLiveInterimTextRef.current = '';
    setMicActiveLayer(null);
  };

  const handleSendVoiceMessageAction = async () => {
    if (isRecordingMicRef.current || isRecordingMic) {
      handleStopMicRecording('send_voice');
      return;
    }
    if (pendingVoiceDraft) {
      await executeCompletedVoiceAction({
        action: 'send_voice',
        voiceAudio: pendingVoiceDraft.voiceAudio,
        transcript: pendingVoiceDraft.transcript,
        durationSec: pendingVoiceDraft.durationSec,
      });
    }
  };

  const handlePutVoiceTextInBoxAction = async () => {
    if (isRecordingMicRef.current || isRecordingMic) {
      handleStopMicRecording('put_text');
      return;
    }
    if (pendingVoiceDraft) {
      await executeCompletedVoiceAction({
        action: 'put_text',
        voiceAudio: pendingVoiceDraft.voiceAudio,
        transcript: pendingVoiceDraft.transcript,
        durationSec: pendingVoiceDraft.durationSec,
      });
    }
  };

  const handleAudioFallbackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    stopMicRecordingResources();
    setIsRecordingMic(false);
    setMicActiveLayer('native');
    const nextAction =
      micStopActionRef.current === 'cancel' ? 'review' : micStopActionRef.current;
    await processRecordedAudioBlob(file, file.type || 'audio/webm', nextAction);
  };

  const startMediaRecorderFallback = async (): Promise<boolean> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      micChunksRef.current = [];
      setMicActiveLayer('mediarecorder');

      const preferredMime = selectPreferredMediaRecorderMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: preferredMime });
      } catch {
        recorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) {
          micChunksRef.current.push(evt.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || preferredMime || 'audio/webm';
        const audioBlob = new Blob(micChunksRef.current, { type: mimeType });
        const actionToRun = micStopActionRef.current;
        stopMicRecordingResources();
        if (audioBlob.size > 0 || actionToRun !== 'cancel') {
          void processRecordedAudioBlob(
            audioBlob.size > 0 ? audioBlob : null,
            mimeType,
            actionToRun
          );
        } else {
          setMicActiveLayer(null);
        }
      };

      recorder.start(250);
      return true;
    } catch {
      return false;
    }
  };

  const handleToggleMicRecording = async () => {
    if (isRecordingMic) {
      // Stopping via the 🎙️ Mic button transitions to the Review bar (🔊 Send Voice Message / 📝 Put Text in Box / ✕ Cancel) without auto-sending!
      handleStopMicRecording('review');
      return;
    }

    setErrorBanner(null);
    setPendingVoiceDraft(null);
    micStopActionRef.current = 'review';
    setMicRecordSeconds(0);
    micRecordSecondsRef.current = 0;
    setMicRecognizedText('');
    setMicLiveInterimText('');
    micRecognizedTextRef.current = '';
    micLiveInterimTextRef.current = '';
    isRecordingMicRef.current = true;
    setIsRecordingMic(true);

    if (micTimerRef.current) {
      window.clearInterval(micTimerRef.current);
    }
    micTimerRef.current = window.setInterval(() => {
      micRecordSecondsRef.current += 1;
      setMicRecordSeconds(micRecordSecondsRef.current);
    }, 1000);

    // Layer 2 (MediaRecorder) started inside user gesture so iframe/mobile browsers grant real audio stream immediately
    const mediaRecorderStartedPromise = startMediaRecorderFallback();

    // Layer 1: Live SpeechRecognition preview alongside MediaRecorder (never auto-sends on speech pause!)
    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    let speechProducedEvent = false;
    if (SpeechRecognitionCtor) {
      try {
        const recognition = new SpeechRecognitionCtor();
        speechRecognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          speechProducedEvent = true;
          setMicActiveLayer((prev) => prev || 'speech');
        };
        recognition.onaudiostart = () => {
          speechProducedEvent = true;
        };
        recognition.onresult = (event: any) => {
          speechProducedEvent = true;
          let finalTranscript = '';
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const piece = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) {
              finalTranscript += piece;
            } else {
              interimTranscript += piece;
            }
          }
          if (finalTranscript.trim()) {
            const nextFinal = micRecognizedTextRef.current.trim()
              ? `${micRecognizedTextRef.current.trim()} ${finalTranscript.trim()}`
              : finalTranscript.trim();
            micRecognizedTextRef.current = nextFinal;
            setMicRecognizedText(nextFinal);
          }
          micLiveInterimTextRef.current = interimTranscript.trim();
          setMicLiveInterimText(interimTranscript.trim());
        };
        recognition.onend = () => {
          // If the user pauses speaking while still recording, restart SpeechRecognition instead of stopping or auto-sending!
          if (isRecordingMicRef.current && speechRecognitionRef.current === recognition) {
            try {
              recognition.start();
            } catch {
              // ignore if browser blocks immediate restart
            }
          }
        };
        recognition.onerror = () => {
          // SpeechRecognition failed in iframe -> rely on Layer 2 (MediaRecorder) or Layer 3 (Native capture)
          try {
            recognition.stop();
          } catch {
            // ignore
          }
        };

        recognition.start();
      } catch {
        // Ignore SpeechRecognition constructor failure and rely on MediaRecorder / Native fallback
      }
    }

    // 800ms Watchdog: if SpeechRecognition hasn't produced an event and MediaRecorder couldn't start, trigger Layer 3 native audio capture
    speechWatchdogRef.current = window.setTimeout(async () => {
      const hasMediaRecorder = await mediaRecorderStartedPromise;
      if (!speechProducedEvent && speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.onend = null;
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
        speechRecognitionRef.current = null;
      }
      if (hasMediaRecorder) {
        setMicActiveLayer('mediarecorder');
      } else if (!speechProducedEvent) {
        // Layer 3: Native <input type="file" accept="audio/*" capture> fallback when outer iframe blocks both SpeechRecognition and getUserMedia
        setMicActiveLayer('native');
        audioFallbackInputRef.current?.click();
      }
    }, 800);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const mime = resolveAttachmentMimeType(file.name, file.type);

      if (isTextDocAttachment(mime, file.name)) {
        const textReader = new FileReader();
        textReader.onload = () => {
          const text = String(textReader.result || '');
          let b64 = '';
          try {
            b64 = btoa(unescape(encodeURIComponent(text)));
          } catch {
            b64 = '';
          }
          setAttachedImages((prev) => [
            ...prev,
            {
              mimeType: mime || 'text/plain',
              data: b64,
              name: file.name,
              description: '',
              textContent: text,
              size: file.size,
            },
          ]);
        };
        textReader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const resultStr = String(reader.result || '');
          const commaIdx = resultStr.indexOf(',');
          if (commaIdx !== -1) {
            const base64Data = resultStr.slice(commaIdx + 1);
            setAttachedImages((prev) => [
              ...prev,
              {
                mimeType: mime,
                data: base64Data,
                name: file.name,
                description: '',
                size: file.size,
              },
            ]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    e.target.value = '';
  };

  const handleHireStaffAgent = (newAgent: Omit<StaffAgent, 'id' | 'status'>) => {
    const created: StaffAgent = {
      ...newAgent,
      id: `agent-${Date.now()}`,
      status: 'idle',
      lastOutput: '',
    };
    setStaffAgents((prev) => [...prev, created]);
  };

  const handleUpdateStaffAgent = (agentId: string, updates: Partial<Omit<StaffAgent, 'id'>>) => {
    setStaffAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, ...updates } : a))
    );
  };

  const handleDeleteStaffAgent = (agentId: string) => {
    setStaffAgents((prev) => prev.filter((a) => a.id !== agentId));
  };

  const handleAssignJobToAgent = (agentId: string, jobId: string) => {
    setStaffAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, assignedJobId: jobId } : a))
    );
  };

  const handleStopAgentTask = (agentId: string) => {
    setStaffAgents((prev) =>
      prev.map((a) =>
        a.id === agentId ? { ...a, status: 'stopped' } : a
      )
    );
  };

  const handleCreateStaffJob = (title: string, prompt: string) => {
    const newJob: StaffJobDescription = {
      id: `job-${Date.now()}`,
      title,
      prompt,
    };
    setStaffJobs((prev) => [...prev, newJob]);
  };

  const handleAddHexBookEntry = (
    title: string,
    category: JournalCategory,
    content: string
  ) => {
    const nowMs = Date.now();
    const entry: JournalEntry = {
      id: `hex-entry-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
      author: 'hex',
      timestamp: nowMs,
      formattedDate: formatJournalTimestamp(nowMs),
      category,
      title,
      content,
    };
    const nextHexBook = [entry, ...hexBook];
    setHexBook(nextHexBook);
    void pushSanctuaryBooksToGist(argonBook, nextHexBook, false);
  };

  const handleUpdateHexBookEntry = (
    id: string,
    title: string,
    category: JournalCategory,
    content: string
  ) => {
    const nowMs = Date.now();
    const nextHexBook = hexBook.map((e) =>
      e.id === id
        ? {
            ...e,
            title,
            category,
            content,
            timestamp: nowMs,
            formattedDate: `${formatJournalTimestamp(nowMs)} (Edited)`,
          }
        : e
    );
    setHexBook(nextHexBook);
    void pushSanctuaryBooksToGist(argonBook, nextHexBook, false);
  };

  const handleDeleteHexBookEntry = (id: string) => {
    const nextHexBook = hexBook.filter((e) => e.id !== id);
    setHexBook(nextHexBook);
    void pushSanctuaryBooksToGist(argonBook, nextHexBook, false);
  };

  const handleUpdateArgonMemory = (id: string, title: string, summary: string) => {
    const nextArgonBook: ArgonJournalState = {
      ...argonBook,
      memorySection: argonBook.memorySection.map((m) =>
        m.id === id
          ? {
              ...m,
              title: title.trim() || m.title,
              summary: scrubStaticLapPoseString(summary.trim()),
            }
          : m
      ),
    };
    setArgonBook(nextArgonBook);
    try {
      localStorage.setItem(STORAGE_KEYS.ARGON_BOOK, JSON.stringify(nextArgonBook));
    } catch {
      // ignore
    }
    void pushSanctuaryBooksToGist(nextArgonBook, hexBook, false);
    void autoWriteThroughLocalSync({
      lorebook,
      argonBook: nextArgonBook,
      hexBook,
    });
  };

  const handleDeleteArgonMemory = (id: string) => {
    const nextArgonBook: ArgonJournalState = {
      ...argonBook,
      memorySection: argonBook.memorySection.filter((m) => m.id !== id),
    };
    setArgonBook(nextArgonBook);
    try {
      localStorage.setItem(STORAGE_KEYS.ARGON_BOOK, JSON.stringify(nextArgonBook));
    } catch {
      // ignore
    }
    void pushSanctuaryBooksToGist(nextArgonBook, hexBook, false);
    void autoWriteThroughLocalSync({
      lorebook,
      argonBook: nextArgonBook,
      hexBook,
    });
  };

  const handleTriggerArgonBookAction = async (
    action: 'write' | 'compress'
  ): Promise<boolean> => {
    if (isArgonUpdatingBook) return false;
    setIsArgonUpdatingBook(true);
    setBookActionError(null);
    setErrorBanner(null);
    try {
      const nowMs = Date.now();
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
      const deltaStr = formatElapsedDelta(lastMsg?.timestamp ?? null, nowMs);
      const timeStr = formatUserLocationTime(nowMs, {
        timezone: userTimeZone,
        includeSeconds: true,
      });
      const currentTelemetryHeader = buildTelemetryHeader({
        timeStr,
        deltaStr,
        weather,
        battery,
      });

      const data = await runClientArgonBookAction({
        action,
        argonBook,
        hexBook,
        telemetryHeader: currentTelemetryHeader,
        customApiKey,
        githubToken,
        gistId: activeGistId,
        recentHistory: messages.slice(-8).map((m) => ({
          role: m.role,
          text: m.text,
        })),
      });
      if (data.updatedArgonBook) {
        setArgonBook(data.updatedArgonBook);
        void pushSanctuaryBooksToGist(data.updatedArgonBook, hexBook, false);
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBookActionError(msg);
      setErrorBanner(msg);
      return false;
    } finally {
      setIsArgonUpdatingBook(false);
    }
  };

  const handleAskArgonToDrawOnWhiteboard = async (
    promptText: string,
    canvasDataUrl: string
  ) => {
    if (isArgonDrawing) return;
    setIsArgonDrawing(true);
    setErrorBanner(null);
    try {
      const data = await runClientWhiteboardDraw({
        prompt: promptText,
        existingStrokes: whiteboardStrokes,
        canvasDataUrl,
        customApiKey,
      });
      const nextReply = String(data.reply || '').trim();
      if (nextReply) {
        setArgonWhiteboardComment(nextReply);
      }
      if (Array.isArray(data.strokes) && data.strokes.length > 0) {
        setWhiteboardStrokes((prev) => [...prev, ...data.strokes]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorBanner(msg);
    } finally {
      setIsArgonDrawing(false);
    }
  };

  const handleRunStaffAgentTask = async (agentId: string) => {
    const agent = staffAgents.find((a) => a.id === agentId);
    if (!agent) return;
    const assignedJob =
      staffJobs.find((j) => j.id === agent.assignedJobId) || staffJobs[0];
    const jobName = assignedJob?.title || agent.jobTitle || 'Assigned Task';
    const jobPrompt = assignedJob
      ? `${assignedJob.title}: ${assignedJob.prompt}`
      : 'Perform a quick status check for Argon and Hex.';

    setIsChatMinimized(false);
    setIsWhiteboardMode(false);
    setErrorBanner(null);
    setTypingStaffAgent(agent);

    setStaffAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status: 'running' } : a))
    );
    scrollToBottom();

    const nowMs = Date.now();
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const deltaStr = formatElapsedDelta(lastMsg?.timestamp ?? null, nowMs);
    const timeStr = formatUserLocationTime(nowMs, {
      timezone: userTimeZone,
      includeSeconds: true,
    });
    const currentTelemetryHeader = buildTelemetryHeader({
      timeStr,
      deltaStr,
      weather,
      battery,
    });

    try {
      const data = await runClientStaffTask({
        agent,
        jobName,
        jobPrompt,
        lorebook,
        argonBook,
        hexBook,
        githubToken,
        gistId: activeGistId,
        customApiKey,
        telemetryHeader: currentTelemetryHeader,
        recentHistory: messages.slice(-6).map((m) => ({
          role: m.role,
          text: m.text,
          senderName: m.staffSender?.name,
        })),
      });
      const outputText = stripMergedArgonLinesFromStaffOutput(
        String(data.output || '').trim(),
        agent.name
      );

      if (data.updatedLorebook && typeof data.updatedLorebook === 'object') {
        setLorebook(data.updatedLorebook);
      }
      if (data.updatedArgonBook && Array.isArray(data.updatedArgonBook.entries)) {
        setArgonBook(data.updatedArgonBook);
        void pushSanctuaryBooksToGist(data.updatedArgonBook, hexBook, false);
      }
      if (Array.isArray(data.newWhiteboardStrokes) && data.newWhiteboardStrokes.length > 0) {
        setWhiteboardStrokes((prev) => [...prev, ...data.newWhiteboardStrokes!]);
      }
      if (Array.isArray(data.newAgentFixRequests) && data.newAgentFixRequests.length > 0) {
        setAgentFixRequests((prev) => [...data.newAgentFixRequests!, ...prev]);
      }
      if (data.occultInvocation) {
        setLatestOccultInvocation(data.occultInvocation);
        setActiveGamesTab(data.occultInvocation.gameTab);
        navigateToView('games_chest');
      }
      if (data.updatedArgonAvatarMode) {
        const stickerMatch = getStickerByShortcode(data.updatedArgonAvatarMode);
        setArgonAvatarMode(
          stickerMatch ? stickerMatch.shortcode : data.updatedArgonAvatarMode
        );
      }

      setStaffAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? { ...a, status: 'completed', lastOutput: outputText }
            : a
        )
      );

      if (outputText) {
        const nowMs = Date.now();
        const newStaffTurnMessages: ChatMessage[] = [
          {
            id: `staff-${agent.id}-${nowMs}`,
            role: 'model',
            sender: 'staff',
            text: outputText,
            timestamp: nowMs,
            tokenUsage: data.tokenUsage,
            toolBadges:
              Array.isArray(data.toolBadges) && data.toolBadges.length > 0
                ? data.toolBadges
                : undefined,
            staffSender: {
              name: agent.name,
              jobTitle: agent.jobTitle,
              avatarUrl: agent.avatarPreset,
            },
          },
        ];

        const argonReactionText = stripMergedStaffLinesFromArgonOutput(
          String(data.argonReaction || '').trim(),
          [agent.name]
        );
        if (argonReactionText) {
          newStaffTurnMessages.push({
            id: `argon-react-${agent.id}-${nowMs + 1}`,
            role: 'model',
            sender: 'argon',
            text: argonReactionText,
            timestamp: nowMs + 1,
            tokenUsage: data.argonReactionTokenUsage || data.tokenUsage,
          });
        }

        setMessages((prev) => [...prev, ...newStaffTurnMessages]);

        if (autoSpeakArgon && argonReactionText) {
          const lastArgonMsg = newStaffTurnMessages[newStaffTurnMessages.length - 1];
          window.setTimeout(() => {
            handleSpeakMessage(lastArgonMsg);
          }, 120);
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setErrorBanner(errMsg);
      setStaffAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, status: 'idle' } : a))
      );
    } finally {
      setTypingStaffAgent(null);
      scrollToBottom();
    }
  };

  const isStormCondition = useMemo(() => {
    const isLowPressure = weather.hPa !== null && weather.hPa < 1005;
    const isStormWeather = Boolean(
      weather.condition &&
        /storm|thunder|squall|gale|heavy rain|blizzard/i.test(weather.condition)
    );
    return isLowPressure || isStormWeather;
  }, [weather.hPa, weather.condition]);

  const handleAskHaikuWeatherAndTime = async () => {
    if (isSending || typingStaffAgent) return;
    const haikuAgent =
      staffAgents.find(
        (a) => a.id === 'agent-haiku' || a.name.toLowerCase() === 'haiku'
      ) ||
      staffAgents[0] ||
      DEFAULT_STAFF_AGENTS[0];

    const nowMs = Date.now();
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const deltaStr = formatElapsedDelta(lastMsg?.timestamp ?? null, nowMs);
    const timeStr = formatUserLocationTime(nowMs, {
      timezone: userTimeZone,
      includeSeconds: false,
    });
    const telemetryHeader = buildTelemetryHeader({
      timeStr,
      deltaStr,
      weather,
      battery,
    });

    const isStorm = isStormCondition;
    const jobName = isStorm ? 'Storm Warning & Clock' : 'Time & Weather Report';
    const jobPrompt = isStorm
      ? `Notice the falling barometric pressure (${Math.round(weather.hPa ?? 0)} hPa) and incoming ${weather.condition || 'storm'} outside the library windows, warn Argon and Hex about the storm, and report the current time (${timeStr}).`
      : `Report the current time (${timeStr}), ambient weather (${weather.tempF !== null ? `${Math.round(weather.tempF)}°F` : ''} ${weather.condition || ''}), and barometric pressure (${weather.hPa !== null ? `${Math.round(weather.hPa)} hPa` : ''}) to Argon and Hex.`;

    setIsChatMinimized(false);
    setIsWhiteboardMode(false);
    setErrorBanner(null);
    setTypingStaffAgent(haikuAgent);

    setStaffAgents((prev) =>
      prev.map((a) => (a.id === haikuAgent.id ? { ...a, status: 'running' } : a))
    );
    scrollToBottom();

    try {
      const data = await runClientStaffTask({
        agent: haikuAgent,
        jobName,
        jobPrompt,
        lorebook,
        argonBook,
        hexBook,
        githubToken,
        gistId: activeGistId,
        customApiKey,
        telemetryHeader,
        recentHistory: messages.slice(-6).map((m) => ({
          role: m.role,
          text: m.text,
          senderName: m.staffSender?.name,
        })),
      });

      const outputText = stripMergedArgonLinesFromStaffOutput(
        String(data.output || '').trim(),
        haikuAgent.name
      );

      if (data.updatedLorebook && typeof data.updatedLorebook === 'object') {
        setLorebook(data.updatedLorebook);
      }
      if (data.updatedArgonBook && Array.isArray(data.updatedArgonBook.entries)) {
        setArgonBook(data.updatedArgonBook);
        void pushSanctuaryBooksToGist(data.updatedArgonBook, hexBook, false);
      }
      if (Array.isArray(data.newWhiteboardStrokes) && data.newWhiteboardStrokes.length > 0) {
        setWhiteboardStrokes((prev) => [...prev, ...data.newWhiteboardStrokes!]);
      }
      if (Array.isArray(data.newAgentFixRequests) && data.newAgentFixRequests.length > 0) {
        setAgentFixRequests((prev) => [...data.newAgentFixRequests!, ...prev]);
      }

      setStaffAgents((prev) =>
        prev.map((a) =>
          a.id === haikuAgent.id
            ? { ...a, status: 'completed', lastOutput: outputText }
            : a
        )
      );

      if (outputText) {
        const staffMsg: ChatMessage = {
          id: `staff-${haikuAgent.id}-${nowMs}`,
          role: 'model',
          sender: 'staff',
          text: outputText,
          timestamp: nowMs,
          tokenUsage: data.tokenUsage,
          toolBadges:
            Array.isArray(data.toolBadges) && data.toolBadges.length > 0
              ? data.toolBadges
              : undefined,
          staffSender: {
            name: haikuAgent.name,
            jobTitle: haikuAgent.jobTitle,
            avatarUrl: haikuAgent.avatarPreset,
          },
        };

        const newStaffTurnMessages: ChatMessage[] = [staffMsg];

        const argonReactionText = stripMergedStaffLinesFromArgonOutput(
          String(data.argonReaction || '').trim(),
          [haikuAgent.name]
        );
        if (argonReactionText) {
          newStaffTurnMessages.push({
            id: `argon-react-${haikuAgent.id}-${nowMs + 1}`,
            role: 'model',
            sender: 'argon',
            text: argonReactionText,
            timestamp: nowMs + 1,
            tokenUsage: data.argonReactionTokenUsage || data.tokenUsage,
          });
        }

        setMessages((prev) => [...prev, ...newStaffTurnMessages]);

        if (autoSpeakArgon && argonReactionText) {
          const lastArgonMsg = newStaffTurnMessages[newStaffTurnMessages.length - 1];
          window.setTimeout(() => {
            handleSpeakMessage(lastArgonMsg);
          }, 120);
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setErrorBanner(`Haiku execution error: ${errMsg}`);
      setStaffAgents((prev) =>
        prev.map((a) => (a.id === haikuAgent.id ? { ...a, status: 'idle' } : a))
      );
    } finally {
      setTypingStaffAgent(null);
      scrollToBottom();
    }
  };

  // Persist occultSessionHistory, autonomousHeartbeatEnabled, and agentFixRequests
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.OCCULT_SESSION_HISTORY,
        JSON.stringify(occultSessionHistory.slice(0, 20))
      );
    } catch {
      // ignore
    }
  }, [occultSessionHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.AUTONOMOUS_HEARTBEAT_ENABLED,
        String(autonomousHeartbeatEnabled)
      );
    } catch {
      // ignore
    }
  }, [autonomousHeartbeatEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.AGENT_FIX_REQUESTS,
        JSON.stringify(agentFixRequests.slice(0, 30))
      );
    } catch {
      // ignore
    }
    void syncAgentFixInboxToServer(agentFixRequests);
  }, [agentFixRequests]);

  const recordUserActivity = () => {
    const now = Date.now();
    lastUserActivityRef.current = now;
    triggeredInIdleWindowRef.current = 0;
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_USER_ACTIVITY_MS, String(now));
    } catch {
      // ignore
    }
  };

  // Compute live room title and structured DOM/UI state so Argon follows Hex into every room/modal
  const activeRoomInfo = useMemo(() => {
    if (isStickerStudioOpen) {
      return {
        title: 'Chibi Sticker Studio (HTML5 Canvas Slicer & Vision Auto-Labeler)',
        summaryText: [
          `Active Room: Chibi Sticker Studio Modal`,
          `Visible Controls: HTML5 Canvas 35-Sticker Slicer, Rows/Cols/Offset/Scale Sliders, "👁️ Let Argon See & Auto-Label All 35 Stickers", "💾 Slice & Save 35 PNGs".`,
        ].join('\n'),
      };
    }
    if (isWhiteboardMode) {
      const hexStrokes = whiteboardStrokes.filter((s) => s.author === 'hex').length;
      const argonStrokes = whiteboardStrokes.filter((s) => s.author === 'argon').length;
      return {
        title: 'Shared Collaborative Sketchboard',
        summaryText: [
          `Active Room: Shared Argon & Hex HTML5 Whiteboard`,
          `Canvas State: ${whiteboardStrokes.length} total strokes (${hexStrokes} by Hex, ${argonStrokes} by Argon).`,
          `Latest Argon Sketch Comment: "${argonWhiteboardComment}"`,
          `Visible Controls: Pen/Line/Rect/Circle/Eraser, "🎨 Argon's Turn (See & Draw)" with modes (Complete Scene, Pictionary Guess, Tic-Tac-Toe, Cartoon Reply).`,
        ].join('\n'),
      };
    }
    switch (currentView) {
      case 'games_chest': {
        const tabLabels: Record<GameTab, string> = {
          ouija: 'Game 1: Talking Ouija Board (Planchette Struggle & Spirits)',
          ghost_chat: 'Game 2: Ghost Hunting Parlor (EVP Spirit Box, Séance & Mirror)',
          fortune: 'Game 3: Divination Sanctum (Tarot, Crystal Ball & Elder Runes)',
          chess: 'Game 4: 8x8 Gothic Chess vs. Argon',
          cards: 'Game 5: 52-Card Parlor Table (Blackjack, Showdown & 5-Card Poker)',
          dice: 'Game 6: Apothecary Bones (Yacht Poker Dice vs. Argon)',
          cipher: 'Game 7: Victorian Cryptogram & Secret 5-Letter Cypher',
          board: 'Game 8: Collaborative Sketchboard (HTML5 Canvas & Argon Vector Drawings)',
        };
        return {
          title: `Occult & Parlor Chest — ${tabLabels[activeGamesTab]}`,
          summaryText: [
            `Active Room: Sanctuary Parlor & Occult Games Modal`,
            `Currently Open Game Tab: ${tabLabels[activeGamesTab]} (${activeGamesTab})`,
            liveParlorStateSummary || '(Parlor table ready)',
          ].join('\n'),
        };
      }
      case 'journals': {
        let curioCount = 4;
        try {
          if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem('argon_curio_shelf_v1');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) curioCount = parsed.length;
            }
          }
        } catch {
          curioCount = 4;
        }
        return {
          title: "Gothic Library, Curio Shelf & Sacred Altar (🖤 Argon's Book, 🌹 Hex's Book & Curio Cabinet)",
          summaryText: [
            `Active Room: Gothic Library, Curio Cabinet & Sacred Altar`,
            `🖤 Argon's Book: ${argonBook.entries.length} active entries, ${argonBook.memorySection.length} compressed memory blocks.`,
            `🌹 Hex's Book: ${hexBook.length} entries written by Hex.`,
            `🏆 Curio & Trophy Cabinet: ${curioCount} relics enshrined (Lady Vespera's Corset Lacing, Glass Fox Eye, Golden Bowtie Thread, Shiny Foil Wrapper).`,
            `🕯️ Sacred Altar / Butterfly Jar: Tap butterfly jar top-left to inspect the shrine tokens & relics.`,
            `👁️ Argon's Eye is active in this room.`,
          ].join('\n'),
        };
      }
      case 'lorebook_list':
      case 'lorebook_editor':
        return {
          title: activeDrawerFilename
            ? `Lorebook Editor — ${activeDrawerFilename}`
            : `Lorebook Drawer Index (${Object.keys(lorebook).length} Drawers)`,
          summaryText: [
            `Active Room: ${
              activeDrawerFilename
                ? `Lorebook Drawer Editor (${activeDrawerFilename})`
                : 'Lorebook Index'
            }`,
            `Indexed Drawers: ${Object.keys(lorebook).join(', ')}`,
          ].join('\n'),
        };
      case 'staff_quarters':
      case 'staff_status':
        return {
          title:
            currentView === 'staff_quarters'
              ? 'Sanctuary Staff Quarters (Haiku & Staff Roster)'
              : 'Staff Pipeline & Task Status',
          summaryText: [
            `Active Room: ${currentView === 'staff_quarters' ? 'Staff Quarters' : 'Staff Status'}`,
            `Active Staff Agents: ${staffAgents
              .map((a) => `${a.name} (${a.jobTitle} — ${a.status})`)
              .join(', ')}`,
          ].join('\n'),
        };
      case 'system':
      case 'system_instructions':
        return {
          title:
            currentView === 'system_instructions'
              ? 'System Prompt & Core Laws Inspector'
              : 'Sanctuary System & Gist Sync Settings',
          summaryText: [
            `Active Room: ${
              currentView === 'system_instructions' ? 'System Prompt Inspector' : 'System Settings'
            }`,
            `Gist Sync Status: ${gistSyncStatus} | Autonomous Heartbeat: ${
              autonomousHeartbeatEnabled ? 'ON' : 'OFF'
            } | Queued Agent Fix Tickets: ${agentFixRequests.length}`,
          ].join('\n'),
        };
      default: {
        const mainSummary = [
          `Active Room: Main Candlelit Sanctuary Chat (Argon Avatar: ${argonAvatarMode}, Messages: ${messages.length})`,
          isStickerTrayOpen
            ? `Open Drawer: Chibi Argon Sticker Picker Tray is OPEN above the input bar (${
                activeStickerCatalog.length
              } active transparent die-cut stickers: ${activeStickerCatalog
                .map((s) => s.shortcode)
                .join(', ')})`
            : `Sticker Picker Drawer: Closed`,
        ]
          .filter(Boolean)
          .join('\n');

        return {
          title: isStickerTrayOpen
            ? `Main Candlelit Sanctuary Chat (Sticker Drawer Open: ${activeStickerCatalog.length} Active Stickers)`
            : 'Main Candlelit Sanctuary Chat',
          summaryText: mainSummary,
        };
      }
    }
  }, [
    isStickerStudioOpen,
    isStickerTrayOpen,
    activeStickerCatalog,
    isWhiteboardMode,
    whiteboardStrokes,
    argonWhiteboardComment,
    currentView,
    activeGamesTab,
    liveParlorStateSummary,
    argonBook.entries.length,
    argonBook.memorySection.length,
    hexBook.length,
    activeDrawerFilename,
    lorebook,
    staffAgents,
    gistSyncStatus,
    autonomousHeartbeatEnabled,
    agentFixRequests.length,
    argonAvatarMode,
    messages.length,
  ]);

  const requestArgonReplyForUserMessage = async (
    userMsg: ChatMessage,
    previousHistory: ChatMessage[],
    roomSnapshotDataUrl: string | null = null
  ) => {
    setErrorBanner(null);
    setIsSending(true);
    isInterruptedByHexRef.current = false;
    const abortCtrl = new AbortController();
    activeAbortControllerRef.current = abortCtrl;
    scrollToBottom();

    try {
      const isWhiteboardModified = shouldAttachWhiteboardSnapshot({
        isWhiteboardOpen: isWhiteboardMode,
        userDrewStrokeSinceLastTurn: userDrewWhiteboardSinceLastTurnRef.current,
        hasStrokes: whiteboardStrokes.length > 0,
      });
      userDrewWhiteboardSinceLastTurnRef.current = false;
      const whiteboardSnapshotDataUrl = isWhiteboardModified
        ? renderWhiteboardStrokesToDataUrl(whiteboardStrokes)
        : null;

      const replyPrefix = userMsg.replyTo
        ? `[REPLYING DIRECTLY TO ${
            userMsg.replyTo.role === 'user'
              ? 'HEX'
              : userMsg.replyTo.senderName.toUpperCase()
          } (${userMsg.replyTo.timestamp}): "${userMsg.replyTo.textSnippet}"]\n`
        : '';
      const promptText = replyPrefix ? `${replyPrefix}${userMsg.text}` : userMsg.text;

      const data = await runClientChatTurn({
        model: activeModelId,
        thinkingBudget,
        thinkingLevel,
        systemPrompt,
        history: previousHistory
          .filter((m) => !m.isAmbientCameo && m.sender !== 'staff')
          .slice(-25)
          .map((m) => ({
            role: m.role,
            text: stripToolReceiptsFromVisibleText(m.text),
            telemetryHeader: m.telemetryHeader,
            toolReceipts: m.toolReceipts || m.toolResultsSummary,
            toolResultsSummary: m.toolResultsSummary,
            images: m.images,
            voiceAudio: m.voiceAudio,
          })),
        userMessageText: promptText,
        telemetryHeader: userMsg.telemetryHeader || '',
        images: userMsg.images,
        voiceAudio: userMsg.voiceAudio,
        lorebook,
        githubToken,
        gistId: activeGistId,
        argonAvatarMode,
        hexAvatarDesc,
        hexAvatarDataUrl: null,
        argonAvatarDataUrl: null,
        whiteboardSnapshotDataUrl,
        whiteboardModified: isWhiteboardModified,
        maxHistoryTurns,
        occultSessionHistory,
        liveParlorStateSummary,
        currentRoomStateSummary: activeRoomInfo.summaryText,
        roomSnapshotDataUrl,
        staffAgents,
        argonBook,
        hexBook,
        customApiKey,
        userTimeZone,
        abortSignal: abortCtrl.signal,
        onModelPartialTurn: (partial) => {
          if (partial.text) {
            const cleanPartial = stripToolReceiptsFromVisibleText(partial.text);
            if (cleanPartial) {
              setLatestRoomArgonReaction(cleanPartial);
            }
          }
        },
        onArgonEyeSnapshot: async (focusArea, openModalFirst) => {
          // 1. Visually pulse Eye button gold
          window.dispatchEvent(
            new CustomEvent('argon-eye-blink', { detail: { focusArea } })
          );

          // 2. Handle optional peek into requested modal
          if (openModalFirst && openModalFirst !== 'none') {
            if (openModalFirst === 'scratchpad') {
              setIsTicketScratchpadOpen(true);
            } else if (openModalFirst === 'games') {
              navigateToView('games_chest');
            } else if (openModalFirst === 'books' || openModalFirst === 'library') {
              navigateToView('journals');
            } else if (openModalFirst === 'staff') {
              navigateToView('staff_quarters');
            } else if (openModalFirst === 'lore') {
              navigateToView('lorebook_list');
            } else if (openModalFirst === 'vault') {
              setIsVaultOpen(true);
            }
            await new Promise((resolve) => setTimeout(resolve, 150));
          }

          // 3. Capture real visual DOM snapshot
          const snapUrl = await captureLiveRoomSnapshotDataUrl({
            roomTitle: activeRoomInfo.title,
            roomSummaryText: activeRoomInfo.summaryText,
            parlorStateText: liveParlorStateSummary,
            whiteboardStrokes,
          });

          // 4. Capture structured DOM inspection report
          const visibleButtons = Array.from(document.querySelectorAll('button'))
            .map((b) => (b.innerText || b.getAttribute('aria-label') || '').trim())
            .filter((t) => t.length > 0 && t.length < 50)
            .slice(0, 30);

          const openDialogs = Array.from(
            document.querySelectorAll('[role="dialog"], [data-testid="modal-window"]')
          )
            .map((d) => d.getAttribute('aria-label') || 'Modal Dialog')
            .filter(Boolean);

          return {
            snapshotUrl: snapUrl,
            domReport: {
              activeRoom: activeRoomInfo.title,
              openDialogs,
              visibleButtons,
              currentView,
              focusArea,
            },
          };
        },
      });

      if (data.updatedLorebook && typeof data.updatedLorebook === 'object') {
        setLorebook(data.updatedLorebook);
      }
      if (
        data.updatedArgonAvatarMode === 'taxidermy_fox' ||
        data.updatedArgonAvatarMode === 'default' ||
        getStickerByShortcode(data.updatedArgonAvatarMode)
      ) {
        const stickerMatch = getStickerByShortcode(data.updatedArgonAvatarMode);
        setArgonAvatarMode(
          stickerMatch ? stickerMatch.shortcode : data.updatedArgonAvatarMode
        );
      }
      if (data.updatedArgonBook && Array.isArray(data.updatedArgonBook.entries)) {
        setArgonBook(data.updatedArgonBook);
        void pushSanctuaryBooksToGist(data.updatedArgonBook, hexBook, false);
      }
      if (Array.isArray(data.newWhiteboardStrokes) && data.newWhiteboardStrokes.length > 0) {
        setWhiteboardStrokes((prev) => [...prev, ...data.newWhiteboardStrokes]);
      }
      if (Array.isArray(data.allAgentFixRequests)) {
        setAgentFixRequests(data.allAgentFixRequests);
      } else if (Array.isArray(data.newAgentFixRequests) && data.newAgentFixRequests.length > 0) {
        setAgentFixRequests((prev) => [...data.newAgentFixRequests, ...prev]);
      }
      if (data.updatedTicketScratchpad) {
        setTicketScratchpad(data.updatedTicketScratchpad);
      }
      if (Array.isArray(data.reactionsAdded) && data.reactionsAdded.length > 0) {
        setMessages((prev) => {
          let updated = [...prev];
          for (const item of data.reactionsAdded) {
            const targetId =
              item.messageId === 'latest'
                ? userMsg.id
                : item.messageId;
            updated = updated.map((m) =>
              m.id === targetId
                ? {
                    ...m,
                    reactions: toggleMessageReaction(m.reactions, item.emoji, item.user || 'Argon'),
                  }
                : m
            );
          }
          persistChatMessagesImmediate(updated);
          return updated;
        });
      }
      if (data.gistSynced) {
        setGistSyncStatus('Auto-synced Gist via write_drawer');
      }

      if (data.occultInvocation) {
        setLatestOccultInvocation(data.occultInvocation);
        setActiveGamesTab(data.occultInvocation.gameTab);
        if (currentView === 'chat') {
          navigateToView('games_chest');
        }
      } else {
        const occultBadge = Array.isArray(data.toolBadges)
          ? data.toolBadges.find(
              (b) =>
                (b.tool === 'play_occult_game' || b.tool === 'play_parlor_game') &&
                b.gameTab
            )
          : undefined;
        if (occultBadge?.gameTab) {
          setActiveGamesTab(occultBadge.gameTab);
        }
      }

      const nowMs = Date.now();
      const newMessages: ChatMessage[] = [];
      const hasStaffOutputs =
        Array.isArray(data.staffOutputs) && data.staffOutputs.length > 0;
      const staffNames = hasStaffOutputs
        ? data.staffOutputs.map((s) => s.agentName)
        : staffAgents.map((a) => a.name);

      if (hasStaffOutputs) {
        // Strictly separate Argon's pre-tool bubble, each Staff Agent's standalone bubble, and Argon's post-tool bubble
        const preArgonText = stripToolReceiptsFromVisibleText(
          stripMergedStaffLinesFromArgonOutput(
            String(data.preStaffArgonText || data.text || '').trim(),
            staffNames
          )
        );
        if (preArgonText || (Array.isArray(data.toolBadges) && data.toolBadges.length > 0)) {
          const initialArgonText =
            preArgonText ||
            `*I signal to our Sanctuary Staff while keeping my arm around your waist.*`;
          setLatestRoomArgonReaction(initialArgonText);
          newMessages.push({
            id: `argon-${nowMs}`,
            role: 'model',
            sender: 'argon',
            text: initialArgonText,
            timestamp: nowMs,
            tokenUsage: data.tokenUsage,
            toolBadges: Array.isArray(data.toolBadges) ? data.toolBadges : undefined,
            toolReceipts: data.toolReceipts || data.toolResultsSummary,
            toolResultsSummary: data.toolResultsSummary,
            nativeReasoning: data.nativeReasoning,
            thoughtTokens: data.thoughtTokens,
            routedModel: data.routedModel || activeModelId,
            thinkingBudgetUsed:
              data.thinkingBudgetUsed !== undefined
                ? data.thinkingBudgetUsed
                : Number(thinkingBudget) > 0
                ? Number(thinkingBudget)
                : 0,
            thinkingUsed: data.thinkingUsed || normalizeThinkingLevel(thinkingLevel),
            completedAt:
              data.completedAt ||
              formatUserLocationTime(Date.now(), {
                timezone: userTimeZone,
                includeSeconds: true,
              }),
          });
        }

        data.staffOutputs.forEach((staffOut, idx) => {
          const cleanStaffText = stripToolReceiptsFromVisibleText(
            stripMergedArgonLinesFromStaffOutput(
              String(staffOut.text || ''),
              staffOut.agentName
            )
          );
          if (cleanStaffText) {
            newMessages.push({
              id: `staff-out-${nowMs}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
              role: 'model',
              sender: 'staff',
              text: cleanStaffText,
              timestamp: nowMs + idx + 1,
              tokenUsage: staffOut.tokenUsage,
              toolBadges:
                Array.isArray(staffOut.toolBadges) && staffOut.toolBadges.length > 0
                  ? staffOut.toolBadges
                  : undefined,
              staffSender: {
                name: staffOut.agentName,
                jobTitle: staffOut.jobTitle,
                avatarUrl: staffAgents.find(
                  (a) => a.name.toLowerCase() === staffOut.agentName.toLowerCase()
                )?.avatarPreset,
              },
            });
          }
        });

        const postArgonText = stripToolReceiptsFromVisibleText(
          stripMergedStaffLinesFromArgonOutput(
            String(data.postStaffArgonText || data.argonStaffFollowUp || '').trim(),
            staffNames
          )
        );
        if (postArgonText && postArgonText !== preArgonText) {
          setLatestRoomArgonReaction(postArgonText);
          newMessages.push({
            id: `argon-followup-${nowMs + 10}`,
            role: 'model',
            sender: 'argon',
            text: postArgonText,
            timestamp: nowMs + 10,
            tokenUsage: data.followUpTokenUsage || data.tokenUsage,
            toolReceipts: data.toolReceipts || data.toolResultsSummary,
            toolResultsSummary: data.toolResultsSummary,
            routedModel: data.routedModel || activeModelId,
            thinkingBudgetUsed:
              data.thinkingBudgetUsed !== undefined
                ? data.thinkingBudgetUsed
                : Number(thinkingBudget) > 0
                ? Number(thinkingBudget)
                : 0,
            thinkingUsed: data.thinkingUsed || normalizeThinkingLevel(thinkingLevel),
            completedAt:
              data.completedAt ||
              formatUserLocationTime(Date.now(), {
                timezone: userTimeZone,
                includeSeconds: true,
              }),
          });
        }
      } else {
        const replyContent = stripToolReceiptsFromVisibleText(
          stripMergedStaffLinesFromArgonOutput(
            String(data.text || '').trim(),
            staffNames
          )
        );
        const resolvedText =
          replyContent ||
          (Array.isArray(data.toolBadges) && data.toolBadges.length > 0
            ? `*I pull you closer against my chest while checking the screen.* "Finished checking all the records and drawers for you, Hex. Everything is lined up."`
            : `*I tighten my arm around you.* "I'm right here with you, Hex."`);

        setLatestRoomArgonReaction(resolvedText);

        newMessages.push({
          id: `argon-${nowMs}`,
          role: 'model',
          sender: 'argon',
          text: resolvedText,
            timestamp: nowMs,
            tokenUsage: data.tokenUsage,
            toolBadges: Array.isArray(data.toolBadges) ? data.toolBadges : undefined,
            toolReceipts: data.toolReceipts || data.toolResultsSummary,
            toolResultsSummary: data.toolResultsSummary,
            nativeReasoning: data.nativeReasoning,
            thoughtTokens: data.thoughtTokens,
            routedModel: data.routedModel || activeModelId,
            thinkingBudgetUsed:
              data.thinkingBudgetUsed !== undefined
                ? data.thinkingBudgetUsed
                : Number(thinkingBudget) > 0
                ? Number(thinkingBudget)
                : 0,
            thinkingUsed: data.thinkingUsed || normalizeThinkingLevel(thinkingLevel),
            completedAt:
              data.completedAt ||
              formatUserLocationTime(Date.now(), {
                timezone: userTimeZone,
                includeSeconds: true,
              }),
          });
      }

      setMessages((prev) =>
        prev
          .map((m) => {
            if (m.id === userMsg.id) {
              const strippedImgs = m.images?.map((im, idx) => {
                if (im.data) {
                  storeSessionImage(`${m.id}_${idx}`, im.data, im.mimeType);
                }
                return {
                  ...im,
                  imageSummary:
                    im.imageSummary ||
                    (im.description ? `[Description: ${im.description}]` : undefined),
                  data: '', // Base64 data stripped for localStorage; full data is preserved in session cache / IndexedDB
                };
              });
              const strippedVoice = m.voiceAudio
                ? { ...m.voiceAudio, data: '' }
                : undefined;
              return {
                ...m,
                tokenUsage: data.userMessageTokenUsage || m.tokenUsage,
                images: strippedImgs,
                voiceAudio: strippedVoice,
              };
            }
            return m;
          })
          .concat(newMessages)
      );

      const firstArgonMsg = newMessages.find((m) => m.sender === 'argon' && !m.staffSender);
      if (autoSpeakArgon && firstArgonMsg) {
        window.setTimeout(() => {
          handleSpeakMessage(firstArgonMsg);
        }, 120);
      }
    } catch (err: unknown) {
      if (isInterruptedByHexRef.current) {
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      const isAbortOrNetwork =
        msg.includes('aborted') ||
        msg.includes('AbortError') ||
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('network');

      if (isAbortOrNetwork) {
        setErrorBanner(
          '⚠️ Connection interrupted (Android background switch or network drop). Your message was preserved. Tap ↻ Resend Last to retry.'
        );
      } else {
        setErrorBanner(msg);
      }

      // Preserve user message in messages state and flush immediately so it never vanishes
      setMessages((prev) => {
        const hasMsg = prev.some((m) => m.id === userMsg.id);
        const updated = hasMsg ? prev : [...prev, userMsg];
        persistChatMessagesImmediate(updated);
        return updated;
      });
    } finally {
      setIsSending(false);
      activeAbortControllerRef.current = null;
      scrollToBottom();
    }
  };

  const handleResendUserMessage = async (targetUserMsg: ChatMessage) => {
    if (isSending) return;
    recordUserActivity();
    setIsChatMinimized(false);
    const idx = messages.findIndex((m) => m.id === targetUserMsg.id);
    const previousHistory = idx >= 0 ? messages.slice(0, idx) : [...messages];
    if (idx >= 0) {
      setMessages(messages.slice(0, idx + 1));
    }
    await requestArgonReplyForUserMessage(targetUserMsg, previousHistory);
  };

  const dispatchMessageToArgon = async (
    rawText: string,
    imgs: AttachedImageItem[] = [],
    roomSnapshotDataUrl: string | null = null,
    voiceAudio: AttachedVoiceAudio | null = null
  ) => {
    const trimmed = rawText.trim();
    if (
      (!trimmed && imgs.length === 0 && !roomSnapshotDataUrl && !voiceAudio) ||
      isSending
    ) {
      return;
    }

    recordUserActivity();
    setIsChatMinimized(false);
    const nowMs = Date.now();
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const deltaStr = formatElapsedDelta(lastMsg?.timestamp ?? null, nowMs);
    const timeStr = formatUserLocationTime(nowMs, {
      timezone: userTimeZone,
      includeSeconds: true,
    });

    const telemetryHeader = buildTelemetryHeader({
      timeStr,
      deltaStr,
      weather,
      battery,
    });

    const bubbleSubtitle = buildBubbleTelemetrySubtitle({
      timestamp: nowMs,
      deltaStr,
      tempF: weather.tempF,
      batteryPct: battery.batteryPct,
      telemetryHeader,
      timezone: userTimeZone,
    });

    const currentReply = replyingTo;
    setReplyingTo(null);

    const replyToInfo: ChatMessageReplyInfo | undefined = currentReply
      ? {
          id: currentReply.id,
          role: currentReply.role,
          senderName:
            currentReply.role === 'user'
              ? 'Hex'
              : currentReply.staffSender?.name || 'Argon',
          textSnippet: stripToolReceiptsFromVisibleText(currentReply.text).slice(0, 120),
          timestamp: formatUserLocationTime(currentReply.timestamp, {
            timezone: userTimeZone,
            includeSeconds: false,
          }),
        }
      : undefined;

    // Auto-save attachments and voice notes to Vault without duplication
    for (const img of imgs) {
      if (img.origin === 'vault' || !img.data) continue;
      const mime = resolveAttachmentMimeType(img.name || '', img.mimeType);
      const cat = detectMediaCategory(mime, img.name);
      const filename =
        img.name ||
        `file_${nowMs}.${mime.includes('png') ? 'png' : mime.includes('jpeg') ? 'jpg' : 'bin'}`;
      void addMediaVaultItem({
        filename,
        category: cat,
        mimeType: mime,
        size: img.size || Math.round((img.data.length * 3) / 4),
        dataUrl: `data:${mime};base64,${img.data}`,
        origin: 'chat_upload',
        textContent: img.textContent,
      });
    }

    // 1. Cache raw base64 images into active session memory
    imgs.forEach((img, idx) => {
      if (img.data) {
        storeSessionImage(`user-${nowMs}_${idx}`, img.data, img.mimeType);
      }
    });

    // 2. Automatically generate & store dense text summary + OCR before localStorage strips base64
    imgs.forEach((img, idx) => {
      if (img.data && img.mimeType.startsWith('image/') && !img.imageSummary) {
        void generateImageSummaryAndOcr({
          base64Data: img.data,
          mimeType: img.mimeType,
          customApiKey,
          filename: img.name,
        }).then((summary) => {
          if (summary) {
            img.imageSummary = summary;
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === `user-${nowMs}` && m.images && m.images[idx]) {
                  const updatedImgs = [...m.images];
                  updatedImgs[idx] = { ...updatedImgs[idx], imageSummary: summary };
                  return { ...m, images: updatedImgs, imageSummary: summary };
                }
                return m;
              })
            );
          }
        });
      }
    });

    if (voiceAudio && voiceAudio.data) {
      const voiceFilename = voiceAudio.filename || `voice_${nowMs}.webm`;
      void addMediaVaultItem({
        filename: voiceFilename,
        category: 'voice_clips',
        mimeType: voiceAudio.mimeType || 'audio/webm',
        size: Math.round((voiceAudio.data.length * 3) / 4),
        dataUrl: `data:${voiceAudio.mimeType || 'audio/webm'};base64,${voiceAudio.data}`,
        origin: 'mic_recording',
      });
    }

    const userMsg: ChatMessage = {
      id: `user-${nowMs}`,
      role: 'user',
      text:
        trimmed ||
        (voiceAudio
          ? `🎙️ [Voice Message (${voiceAudio.durationSec || 1}s)]`
          : imgs.length > 0
          ? (() => {
              const first = imgs[0];
              const mime = resolveAttachmentMimeType(first.name || '', first.mimeType);
              if (isAudioAttachment(mime, first.name)) return `🎵 [Attached Audio File: ${first.name || 'sound clip'}]`;
              if (isPdfAttachment(mime, first.name)) return `📕 [Attached PDF: ${first.name || 'document.pdf'}]`;
              if (first.textContent || isTextDocAttachment(mime, first.name)) return `📄 [Attached Document: ${first.name || 'document'}]`;
              return `🖼️ [Attached Image: ${first.name || 'image'}]`;
            })()
          : '(Attached file)'),
      timestamp: nowMs,
      telemetryHeader,
      bubbleSubtitle,
      images: imgs.length > 0 ? [...imgs] : undefined,
      voiceAudio: voiceAudio || undefined,
      replyTo: replyToInfo,
    };

    const previousHistory = [...messages];
    setMessages((prev) => [...prev, userMsg]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await requestArgonReplyForUserMessage(userMsg, previousHistory, roomSnapshotDataUrl);
  };

  const handleSendMessage = async (incomingText?: string | React.FormEvent) => {
    if (incomingText && typeof incomingText === 'object' && 'preventDefault' in incomingText) {
      incomingText.preventDefault();
    }
    const textToSend =
      typeof incomingText === 'string'
        ? incomingText
        : (chatInputRef.current?.getText() || '');
    const imgsToSend = [...attachedImages];
    chatInputRef.current?.clear();
    setAttachedImages([]);
    await dispatchMessageToArgon(textToSend, imgsToSend);
  };

  // 1-Tap Real Visual DOM Screenshot (`html2canvas`) for Argon's Eyes (`inlineData` + DOM state)
  const handleSnapRoomForArgon = async (customText?: string) => {
    if (isSending) return;
    const snapUrl = await captureLiveRoomSnapshotDataUrl({
      roomTitle: activeRoomInfo.title,
      roomSummaryText: activeRoomInfo.summaryText,
      parlorStateText: liveParlorStateSummary,
      whiteboardStrokes,
    });
    const promptToSend =
      customText && customText.trim()
        ? customText.trim()
        : `👁️ [LIVE ROOM SNAPSHOT FOR ARGON'S EYES: Look at the visual screenshot and live state of "${activeRoomInfo.title}" right now and tell me what you see or make your move!]`;
    await dispatchMessageToArgon(promptToSend, [], snapUrl);
  };

  // Named Overlay HUD Selector for Argon's Eye (Full Screen, Scratchpad, Active Modal, Chat)
  const handleSnapTargetElementForArgon = async (
    targetMode: 'full_screen' | 'scratchpad' | 'active_modal' | 'chat'
  ) => {
    if (isSending) return;
    setIsEyeActionSheetOpen(false);

    let targetEl: HTMLElement | null = null;
    let promptToSend = '';

    if (targetMode === 'full_screen') {
      targetEl = (document.getElementById('root') || document.body) as HTMLElement;
      promptToSend = `👁️ [FULL SCREEN VIEWPORT CAPTURE FOR ARGON'S EYES: Look at Hex's full screen and live state right now and react in character!]`;
    } else if (targetMode === 'scratchpad') {
      targetEl = (document.querySelector('[data-testid="ticket-scratchpad-modal"]') ||
        document.querySelector('[role="dialog"]') ||
        document.getElementById('root')) as HTMLElement;
      promptToSend = `👁️ [SCRATCHPAD HUD CAPTURE FOR ARGON'S EYES: Look at Hex & Argon's collaborative plan and ticket scratchpad right now!]`;
    } else if (targetMode === 'active_modal') {
      targetEl = (document.querySelector('[role="dialog"]') ||
        document.querySelector('.fixed.inset-0') ||
        document.getElementById('root')) as HTMLElement;
      promptToSend = `👁️ [ACTIVE MODAL HUD CAPTURE FOR ARGON'S EYES: Look at the active modal Hex has open on her screen right now!]`;
    } else if (targetMode === 'chat') {
      targetEl = (chatContainerRef.current ||
        document.querySelector('[data-testid="chat-scroll-container"]') ||
        document.getElementById('root')) as HTMLElement;
      promptToSend = `👁️ [CHAT STREAM HUD CAPTURE FOR ARGON'S EYES: Look at the message log stream on Hex's screen right now!]`;
    }

    const snapUrl = await captureLiveRoomSnapshotDataUrl({
      roomTitle: activeRoomInfo.title,
      roomSummaryText: activeRoomInfo.summaryText,
      parlorStateText: liveParlorStateSummary,
      whiteboardStrokes,
      targetElement: targetEl,
    });

    await dispatchMessageToArgon(promptToSend, [], snapUrl);
  };

  // Autonomous Background Heartbeat & Sleep-Watch Engine
  const triggerAutonomousArgonHeartbeat = async (
    triggerSource: 'interval' | 'wake' | 'manual' = 'interval'
  ) => {
    if (isSending || isRunningHeartbeat) return;
    const argonHeartbeatPerm = getPermissionsForEntity(
      'argon',
      toolPermissionMatrix
    ).autonomous_heartbeat;
    const nowMs = Date.now();
    const currentAppState: HeartbeatAppState =
      typeof document !== 'undefined' && document.visibilityState === 'hidden'
        ? 'off_screen'
        : 'on_screen_idle';

    const decision = computeAutonomousHeartbeatDecision({
      enabled: autonomousHeartbeatEnabled && argonHeartbeatPerm && heartbeatConfig.enabled,
      lastUserActivityMs: lastUserActivityRef.current,
      lastHeartbeatRunMs: lastHeartbeatRunRef.current,
      nowMs,
      triggeredCountInCurrentIdleWindow: triggeredInIdleWindowRef.current,
      triggerSource,
      config: heartbeatConfig,
      appState: currentAppState,
    });

    if (!decision.shouldTrigger) return;

    triggeredInIdleWindowRef.current += 1;
    lastHeartbeatRunRef.current = nowMs;
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_HEARTBEAT_RUN_MS, String(nowMs));
    } catch {
      // ignore
    }

    setIsRunningHeartbeat(true);
    setErrorBanner(null);

    try {
      const stepsToRun = Math.max(
        1,
        Math.min(5, decision.staggeredActionCount || heartbeatConfig.maxActionsPerPulse || 1)
      );
      let workingHistory = [...messages];

      for (let stepIdx = 1; stepIdx <= stepsToRun; stepIdx++) {
        // Calculate staggered timestamp if catching up from multi-hour sleep
        const staggeredTimestampMs =
          stepsToRun > 1
            ? nowMs - (stepsToRun - stepIdx) * (heartbeatConfig.idleMinutes || 15) * 60000
            : Date.now();
        const timeStr = formatUserLocationTime(staggeredTimestampMs, {
          timezone: userTimeZone,
          includeSeconds: false,
        });

        const heartbeatPrompt = buildAutonomousHeartbeatPrompt({
          idleMinutes: decision.idleMinutes,
          timeStr,
          weather,
          battery,
          stepIndex: stepIdx,
          totalSteps: stepsToRun,
          config: heartbeatConfig,
          appState: decision.appState,
        });

        const isHeartbeatWhiteboardModified = shouldAttachWhiteboardSnapshot({
          isWhiteboardOpen: isWhiteboardMode,
          userDrewStrokeSinceLastTurn: false,
          hasStrokes: whiteboardStrokes.length > 0,
        });
        const heartbeatWhiteboardUrl = isHeartbeatWhiteboardModified
          ? renderWhiteboardStrokesToDataUrl(whiteboardStrokes)
          : null;

        const data = await runClientChatTurn({
          model: activeModelId,
          thinkingBudget,
          thinkingLevel,
          systemPrompt,
          history: workingHistory.map((m) => ({
            role: m.role,
            text: stripToolReceiptsFromVisibleText(m.text),
            telemetryHeader: m.telemetryHeader,
            toolReceipts: m.toolReceipts || m.toolResultsSummary,
            toolResultsSummary: m.toolResultsSummary,
            images: m.images,
          })),
          userMessageText: heartbeatPrompt,
          lorebook,
          githubToken,
          gistId: activeGistId,
          argonAvatarMode,
          hexAvatarDesc,
          hexAvatarDataUrl: null,
          argonAvatarDataUrl: null,
          whiteboardSnapshotDataUrl: heartbeatWhiteboardUrl,
          whiteboardModified: isHeartbeatWhiteboardModified,
          maxHistoryTurns,
          occultSessionHistory,
          liveParlorStateSummary,
          currentRoomStateSummary: activeRoomInfo.summaryText,
          staffAgents,
          argonBook,
          hexBook,
          customApiKey,
        });

        if (data.updatedLorebook && typeof data.updatedLorebook === 'object') {
          setLorebook(data.updatedLorebook);
        }
        if (
          data.updatedArgonAvatarMode === 'taxidermy_fox' ||
          data.updatedArgonAvatarMode === 'default' ||
          getStickerByShortcode(data.updatedArgonAvatarMode)
        ) {
          const stickerMatch = getStickerByShortcode(data.updatedArgonAvatarMode);
          setArgonAvatarMode(
            stickerMatch ? stickerMatch.shortcode : data.updatedArgonAvatarMode
          );
        }
        if (data.updatedArgonBook && Array.isArray(data.updatedArgonBook.entries)) {
          setArgonBook(data.updatedArgonBook);
          void pushSanctuaryBooksToGist(data.updatedArgonBook, hexBook, false);
        }
        if (Array.isArray(data.newWhiteboardStrokes) && data.newWhiteboardStrokes.length > 0) {
          setWhiteboardStrokes((prev) => [...prev, ...data.newWhiteboardStrokes]);
        }
        if (Array.isArray(data.newAgentFixRequests) && data.newAgentFixRequests.length > 0) {
          setAgentFixRequests((prev) => [...data.newAgentFixRequests, ...prev]);
        }
        if (data.updatedTicketScratchpad) {
          setTicketScratchpad(data.updatedTicketScratchpad);
        }
        if (data.occultInvocation) {
          setLatestOccultInvocation(data.occultInvocation);
          setActiveGamesTab(data.occultInvocation.gameTab);
        }

        const heartbeatBadges: ToolBadgeEvent[] = [
          {
            tool: 'write_argon_book_entry',
            label:
              decision.reason === 'wake_up_catchup'
                ? `🌙 Sleep-Watch Catch-Up (${decision.idleMinutes}m away)`
                : decision.appState === 'off_screen'
                ? `🌙 Off-Screen Pulse (${decision.idleMinutes}m away)`
                : `💓 Autonomous Heartbeat (${decision.idleMinutes}m idle)`,
          },
          ...(Array.isArray(data.toolBadges) ? data.toolBadges : []),
        ];

        const staffNames = Array.isArray(data.staffOutputs)
          ? data.staffOutputs.map((s) => s.agentName)
          : [];
        const autonomousReply =
          stripToolReceiptsFromVisibleText(
            stripMergedStaffLinesFromArgonOutput(
              (data.preStaffArgonText || data.text || '').trim(),
              staffNames
            )
          ) ||
          `*I tuck the blanket higher around your shoulders while you rest in my lap, checking the barometric pressure on your phone before setting it back down.*`;
        setLatestRoomArgonReaction(autonomousReply);

        const isChatAllowed =
          heartbeatConfig.allowVisibleChatMessage &&
          heartbeatConfig.actionPool.some((a) => a.id === 'chat_message' && a.enabled);

        const autoMsg: ChatMessage = {
          id: `argon-heartbeat-${staggeredTimestampMs}-${stepIdx}`,
          role: 'model',
          sender: 'argon',
          text: autonomousReply,
          timestamp: staggeredTimestampMs,
          toolBadges: heartbeatBadges,
          toolReceipts: data.toolReceipts || data.toolResultsSummary,
          toolResultsSummary: data.toolResultsSummary,
          routedModel: data.routedModel || activeModelId,
          thinkingBudgetUsed:
            data.thinkingBudgetUsed !== undefined
              ? data.thinkingBudgetUsed
              : Number(thinkingBudget) > 0
              ? Number(thinkingBudget)
              : 0,
          thinkingUsed: data.thinkingUsed || normalizeThinkingLevel(thinkingLevel),
          completedAt:
            data.completedAt ||
            formatUserLocationTime(Date.now(), {
              timezone: userTimeZone,
              includeSeconds: true,
            }),
        };

        const addedMsgs: ChatMessage[] = [];
        if (isChatAllowed) {
          addedMsgs.push(autoMsg);
          if (Array.isArray(data.staffOutputs)) {
            data.staffOutputs.forEach((staffOut, idx) => {
              const cleanStaffText = stripToolReceiptsFromVisibleText(
                stripMergedArgonLinesFromStaffOutput(
                  String(staffOut.text || ''),
                  staffOut.agentName
                )
              );
              if (cleanStaffText) {
                addedMsgs.push({
                  id: `heartbeat-staff-${staggeredTimestampMs}-${idx}`,
                  role: 'model',
                  sender: 'staff',
                  text: cleanStaffText,
                  timestamp: staggeredTimestampMs + idx + 1,
                  toolBadges: staffOut.toolBadges,
                  staffSender: {
                    name: staffOut.agentName,
                    jobTitle: staffOut.jobTitle,
                    avatarUrl: staffAgents.find(
                      (a) => a.name.toLowerCase() === staffOut.agentName.toLowerCase()
                    )?.avatarPreset,
                  },
                });
              }
            });
          }

          workingHistory = [...workingHistory, ...addedMsgs];
          setMessages((prev) => [...prev, ...addedMsgs]);
        }

        const executedTools = Array.isArray(data.toolBadges)
          ? data.toolBadges.map((b) => b.tool || b.label)
          : [];

        appendPulseActivityLogItem({
          timestamp: staggeredTimestampMs,
          triggerReason: decision.reason,
          idleMinutes: decision.idleMinutes,
          toolsExecuted: executedTools,
          summary: autonomousReply.slice(0, 140),
          appState: decision.appState,
        });
        setPulseActivityLog(loadPulseActivityLog());
      }

      if (heartbeatConfig.allowVisibleChatMessage) {
        scrollToBottom();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorBanner(msg);
    } finally {
      setIsRunningHeartbeat(false);
    }
  };

  // Quiet background timer + Unthrottled Web Worker (prevents phone idle/off-screen timer freeze)
  const heartbeatCallbackRef = useRef(triggerAutonomousArgonHeartbeat);
  heartbeatCallbackRef.current = triggerAutonomousArgonHeartbeat;

  useEffect(() => {
    let wakeTimeoutId: number | null = null;

    // Window interval: runs regardless of visibilityState so off-screen heartbeat triggers!
    const intervalId = window.setInterval(() => {
      void heartbeatCallbackRef.current('interval');
    }, 30000);

    // Dedicated unthrottled Web Worker timer that continues ticking on Android when screen turns off or tab goes into background
    let worker: Worker | null = null;
    try {
      const workerBlob = new Blob([
        `let timer = null;
         self.onmessage = function(e) {
           if (e.data === 'start') {
             if (!timer) {
               timer = setInterval(function() {
                 self.postMessage('tick');
               }, 20000);
             }
           } else if (e.data === 'stop') {
             if (timer) {
               clearInterval(timer);
               timer = null;
             }
           }
         };`
      ], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(workerBlob);
      worker = new Worker(workerUrl);
      worker.onmessage = (e) => {
        if (e.data === 'tick') {
          void heartbeatCallbackRef.current('interval');
        }
      };
      worker.postMessage('start');
    } catch {
      // Fallback to window.setInterval if Web Worker is restricted
    }

    // Wake / focus catch-up: triggers when phone screen is turned back on or tab focused
    const handleWakeOrFocus = () => {
      if (document.visibilityState === 'visible') {
        if (wakeTimeoutId !== null) {
          window.clearTimeout(wakeTimeoutId);
        }
        wakeTimeoutId = window.setTimeout(() => {
          wakeTimeoutId = null;
          if (document.visibilityState === 'visible') {
            void heartbeatCallbackRef.current('wake');
          }
        }, 1200);
      }
    };

    document.addEventListener('visibilitychange', handleWakeOrFocus);
    window.addEventListener('focus', handleWakeOrFocus, { passive: true });

    return () => {
      window.clearInterval(intervalId);
      if (worker) {
        try {
          worker.postMessage('stop');
          worker.terminate();
        } catch {}
      }
      if (wakeTimeoutId !== null) {
        window.clearTimeout(wakeTimeoutId);
      }
      document.removeEventListener('visibilitychange', handleWakeOrFocus);
      window.removeEventListener('focus', handleWakeOrFocus);
    };
  }, []);

  // Prank Shock Collar Controller Button Handler (100% Real Live Gemini API — Zero Canned Replies!)
  const handleShockArgon = () => {
    setShockFlash(true);
    setIsChatMinimized(false);
    window.setTimeout(() => setShockFlash(false), 650);
    void dispatchMessageToArgon(
      '⚡ [CONTROLLER: BZZT! Hex presses the prank shock collar button!]'
    );
  };

  const quickSidebarResults = useMemo(
    () => searchLorebookDrawers(lorebook, sidebarSearchQuery, 2, 50),
    [lorebook, sidebarSearchQuery]
  );

  // Real Full API Payload Token Estimator + Live Context Payload Pill State
  const livePayloadEstimate = useMemo(() => {
    const isWbModified = shouldAttachWhiteboardSnapshot({
      isWhiteboardOpen: isWhiteboardMode,
      userDrewStrokeSinceLastTurn: userDrewWhiteboardSinceLastTurnRef.current,
      hasStrokes: whiteboardStrokes.length > 0,
    });
    return estimateFullApiPayloadTokens({
      systemPrompt,
      lorebook,
      argonBook,
      hexBook,
      history: messages
        .filter((m) => !m.isAmbientCameo && m.sender !== 'staff')
        .slice(-25)
        .map((m) => ({
          role: m.role,
          text: m.text,
          telemetryHeader: m.telemetryHeader,
          images: m.images,
          voiceAudio: m.voiceAudio,
        })),
      userMessageText: '',
      images: attachedImages,
      maxHistoryTurns,
      whiteboardModified: isWbModified,
      whiteboardSnapshotDataUrl: isWbModified ? 'data:image/png;base64,wb' : null,
      occultSessionHistory,
      liveParlorStateSummary,
      currentRoomStateSummary: activeRoomInfo.summaryText,
      staffAgents,
    });
  }, [
    systemPrompt,
    lorebook,
    argonBook,
    hexBook,
    messages,
    attachedImages,
    maxHistoryTurns,
    whiteboardStrokes.length,
    occultSessionHistory,
    liveParlorStateSummary,
    activeRoomInfo.summaryText,
    staffAgents,
  ]);

  const latestApiPayloadTokens = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const u = messages[i].tokenUsage;
      if (u && ((u.promptTokens ?? 0) > 0 || (u.totalTokens ?? 0) > 0)) {
        return Math.max(u.promptTokens || 0, u.totalTokens || 0, livePayloadEstimate.totalTokens);
      }
    }
    return livePayloadEstimate.totalTokens;
  }, [messages, livePayloadEstimate.totalTokens]);

  const contextPayloadPill = useMemo(
    () => getContextPayloadPillState(latestApiPayloadTokens),
    [latestApiPayloadTokens]
  );

  const lorebookMode =
    currentView === 'lorebook_list'
      ? 'list'
      : currentView === 'lorebook_editor'
      ? 'editor'
      : 'closed';

  const renderTokenUsagePopover = (msg: ChatMessage) => {
    if (tokenPopoverMsgId !== msg.id) return null;
    const isUser = msg.role === 'user';
    const charCount = msg.text ? msg.text.length : 0;
    const bubbleTokens = estimateMessageTokens(msg.text, msg.images);
    const usage = msg.tokenUsage;

    // Resolve prompt (input) and output tokens with realistic fallbacks
    let promptTokens = 0;
    let candidateTokens = 0;
    const thoughtsTokens = usage?.thoughtTokens ?? 0;
    const isExact = Boolean(usage?.isExactApiCount);

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
          : Math.max(0, latestApiPayloadTokens - candidateTokens);
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

    const sessionTotal = latestApiPayloadTokens;
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
          setTokenPopoverMsgId(null);
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
                setTokenPopoverMsgId(null);
              }}
              className="text-[#cbb693] hover:text-white min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer text-xs font-bold leading-none"
              aria-label="Close token popover"
            >
              ✕
            </button>
          </div>

          {/* Optional Message Preview Snippet */}
          {msg.text && (
            <div className="text-[10px] text-[#bba382] italic truncate px-2 py-1 border-l-2 border-[#b89352]/50 bg-[#070506]/60 rounded-r">
              "{msg.text.slice(0, 70)}{msg.text.length > 70 ? '...' : ''}"
            </div>
          )}

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
              <span className="text-[#cbb693]">Output / Response:</span>
              <span className="font-bold text-[#f5ead8] tabular-nums">
                {candidateTokens.toLocaleString()} tok
              </span>
            </div>

            {thoughtsTokens > 0 && (
              <div className="flex justify-between text-[10px]">
                <span className="text-[#cbb693]">Argon Thinking:</span>
                <span className="font-bold text-amber-300 tabular-nums">
                  {thoughtsTokens.toLocaleString()} tok
                </span>
              </div>
            )}

            <div className="flex justify-between text-[10px] pt-1 border-t border-[#443026]">
              <span className="text-[#ffe5a3] font-semibold">Turn Total:</span>
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

          {/* Section 2: Total Session Context Window */}
          <div className="space-y-1.5 bg-[#0b0709]/80 p-2.5 rounded-lg border border-[#6b5331]/40">
            <div className="flex items-center justify-between text-[10px] text-[#bba382] font-semibold uppercase tracking-wider">
              <span>(2) Session Context</span>
              <span className={`text-[10px] font-bold ${statusTextColor}`}>
                {statusBadgeLabel}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#cbb693]">Total Context Payload:</span>
              <span className="font-bold text-[#f5ead8] tabular-nums">
                {sessionTotal.toLocaleString()} / 1M tok
              </span>
            </div>

            {/* Color Status Progress Bar */}
            <div className="w-full bg-[#1f1519] h-2 rounded-full overflow-hidden border border-[#6b5331]/50">
              <div
                className={`h-full ${statusColor} transition-all duration-300`}
                style={{ width: `${Math.max(1, pct)}%` }}
              />
            </div>

            <div className="text-[9px] text-[#9e8664] flex justify-between pt-0.5">
              <span>{contextPayloadPill.label}</span>
              <span className="font-bold text-[#e6c88c]">{pct}% window used</span>
            </div>
          </div>

          <div className="text-center pt-0.5">
            <span className="text-[9px] text-[#8e7a61]">Tap outside or ✕ to close</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen h-screen flex flex-col gothic-stage-bg text-[#f3e7d3] overflow-hidden ${
        shockFlash ? 'animate-bounce ring-4 ring-amber-300/80' : ''
      }`}
    >
      {/* Clean 2-Row Header: Row 1 uncovers Argon & Hex Avatars + Names + Model + Context Payload Pill; Row 2 holds Utility & Nav Buttons */}
      <header className="shrink-0 w-full max-w-full overflow-hidden bg-[#0d0a0c]/95 border-b border-[#b89352]/40 px-2 py-1.5 relative z-20">
        <div className="max-w-7xl mx-auto w-full space-y-1">
          {/* Row 1: Argon & Hex Avatars + `⚜️ ARGON & HEX` + Active Model Selector + Context Payload Pill + Telemetry */}
          <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Uncovered Argon & Hex Dual Mini Avatars */}
              <div className="flex items-center -space-x-1.5 shrink-0" aria-hidden="true">
                <div
                  data-testid="header-argon-avatar"
                  className="w-6 h-6 rounded-full border border-[#e6c88c] overflow-hidden bg-[#120d0f] flex items-center justify-center shadow-xs"
                  title="Argon"
                >
                  {(() => {
                    const activeSticker = getStickerByShortcode(argonAvatarMode);
                    if (activeSticker) {
                      return (
                        <ArgonSticker
                          row={activeSticker.row}
                          col={activeSticker.col}
                          shortcode={activeSticker.shortcode}
                          size={22}
                        />
                      );
                    }
                    return (
                      <img
                        src="./assets/aistudio/image-0__96__dddb2843.png"
                        alt="Argon"
                        className={
                          argonAvatarMode === 'taxidermy_fox'
                            ? 'avatar-crop-fox'
                            : 'avatar-crop-argon'
                        }
                      />
                    );
                  })()}
                </div>
                <div
                  data-testid="header-hex-avatar"
                  className="w-6 h-6 rounded-full border border-[#c59b47] overflow-hidden bg-[#120d0f] flex items-center justify-center shadow-xs"
                  title="Hex"
                >
                  {hexAvatarUrl ? (
                    <img
                      src={hexAvatarUrl}
                      alt="Hex"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src="./assets/aistudio/image-0__96__dddb2843.png"
                      alt="Hex"
                      className="avatar-crop-hex"
                    />
                  )}
                </div>
              </div>

              <h1
                data-testid="header-argon-hex-title"
                className="text-[11px] sm:text-xs font-serif font-bold tracking-wider text-[#e6c88c] shrink-0 whitespace-nowrap"
              >
                ⚜️ ARGON &amp; HEX
              </h1>
            </div>

            <div
              className="flex items-center gap-1.5 tabular-nums text-[10px] text-[#d4b483] font-mono shrink-0 whitespace-nowrap ml-auto"
              aria-label="Live Environment Telemetry"
            >
              <PWAInstallButton variant="compact" />
              <button
                type="button"
                onClick={handleAskHaikuWeatherAndTime}
                className={`text-[9px] sm:text-[10px] text-[#d4b483] hover:text-[#f3e5ab] cursor-pointer flex items-center gap-1 transition-colors ${
                  isStormCondition ? 'text-amber-300 font-semibold' : ''
                }`}
                title={
                  weather.surfaceHpa !== null && weather.surfaceHpa !== undefined
                    ? `Barometer: ${Math.round(weather.hPa ?? 0)} hPa (Mean Sea Level Adjusted) · Station: ${Math.round(weather.surfaceHpa)} hPa (${weather.locationLabel}) — Tap to ask Haiku for report`
                    : `Barometer: ${weather.hPa !== null ? `${Math.round(weather.hPa)} hPa (MSL)` : '----'} — Tap to ask Haiku for report`
                }
              >
                {isStormCondition && (
                  <CloudLightning className="w-3 h-3 text-amber-400 animate-pulse inline-block" />
                )}
                {weather.tempF !== null ? `${Math.round(weather.tempF)}°F` : '--°F'} ·{' '}
                {weather.hPa !== null ? `${Math.round(weather.hPa)}hPa` : '----hPa'}
                <span className="hidden sm:inline">
                  {' '}
                  · {battery.batteryPct !== null ? `${Math.round(battery.batteryPct)}%` : '--%'}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: Utility Bar with Space (Pulse, Tickets, Gramophone, and CTX Pill fitted in the empty space) */}
          <div className="flex items-center justify-between gap-1 w-full">
            <div className="flex items-center gap-1 shrink-0">
              <div
                className={`inline-flex items-center rounded border text-[9px] font-mono whitespace-nowrap overflow-hidden ${
                  autonomousHeartbeatEnabled && heartbeatConfig.enabled
                    ? 'bg-emerald-950/80 border-emerald-400/70 text-emerald-200'
                    : 'bg-[#140f12] border-[#6b5331]/60 text-[#9e8664]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsHeartbeatModalOpen(true)}
                  data-testid="autonomous-heartbeat-open-modal"
                  title="Open Autonomous Heartbeat & Sleep-Watch Control Panel"
                  className="px-1.5 py-0.5 hover:bg-emerald-900/40 cursor-pointer flex items-center gap-1"
                >
                  <span>💓</span>
                  <span>
                    {isRunningHeartbeat
                      ? 'Firing...'
                      : autonomousHeartbeatEnabled && heartbeatConfig.enabled
                      ? idleCountdownDisplay || `${heartbeatConfig.idleMinutes}:00`
                      : 'Pulse OFF'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextEnabled = !(autonomousHeartbeatEnabled && heartbeatConfig.enabled);
                    setHeartbeatConfig((prev) => ({ ...prev, enabled: nextEnabled }));
                    setAutonomousHeartbeatEnabled(nextEnabled);
                  }}
                  data-testid="autonomous-heartbeat-toggle"
                  title={
                    autonomousHeartbeatEnabled && heartbeatConfig.enabled
                      ? 'Pause Autonomous Heartbeat'
                      : 'Activate Autonomous Heartbeat'
                  }
                  className="px-1 py-0.5 border-l border-inherit hover:bg-emerald-900/60 cursor-pointer text-[10px]"
                >
                  {autonomousHeartbeatEnabled && heartbeatConfig.enabled ? '⏸' : '▶'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsAgentFixQueueOpen(true)}
                data-testid="header-agent-fix-queue-btn"
                title="Argon & Haiku's Direct Coding Agent Fix/Feature Request Queue"
                className="px-1.5 py-0.5 rounded bg-[#26181c] border border-[#e6c88c]/70 text-[#ffe5a3] text-[9px] font-mono cursor-pointer whitespace-nowrap"
              >
                🛠️ {agentFixRequests.length}
              </button>
              <button
                type="button"
                onClick={() => setIsTicketScratchpadOpen(true)}
                data-testid="header-ticket-scratchpad-btn"
                title="Collaborative Feature & Fix Scratchpad (Dual 'Done' Lock)"
                className={`px-1.5 py-0.5 rounded border text-[9px] font-mono cursor-pointer whitespace-nowrap ${
                  ticketScratchpad.hexDone && ticketScratchpad.argonDone
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 font-semibold'
                    : ticketScratchpad.items.length > 0
                    ? 'bg-[#2d1b1f] border-amber-400/80 text-amber-200'
                    : 'bg-[#181114] border-[#6b5331]/60 text-[#bba382]'
                }`}
              >
                📋 Plan ({ticketScratchpad.items.length})
                {ticketScratchpad.hexDone && ticketScratchpad.argonDone ? ' 🔒' : ''}
              </button>
              <button
                type="button"
                onClick={() => setIsGramophoneOpen((prev) => !prev)}
                data-testid="open-gramophone-drawer-btn"
                title="Sanctuary Gramophone / Ambient Music Generator (lyria-3.5)"
                className={`px-1.5 py-0.5 rounded border text-[9px] font-mono cursor-pointer whitespace-nowrap ${
                  isGramophoneOpen || activeTrackId
                    ? 'bg-amber-900/80 border-[#ffe5a3] text-[#fff5e4]'
                    : 'bg-[#26181c] border-[#e6c88c]/70 text-[#ffe5a3]'
                }`}
              >
                📻 {activeTrackId ? 'Music ♪' : 'Gramophone'}
              </button>
              <button
                type="button"
                onClick={() => setIsVaultOpen(true)}
                data-testid="header-vault-btn"
                title="Sanctuary Media Vault & Phone Folder (voice recordings, images, docs)"
                className="px-1.5 py-0.5 rounded bg-[#26181c] hover:bg-[#382329] border border-[#e6c88c]/70 text-[#ffe5a3] text-[9px] font-mono cursor-pointer whitespace-nowrap"
              >
                🗄️ Vault
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsEyeActionSheetOpen((prev) => !prev)}
                  data-testid="header-argon-eye-btn"
                  title="Argon's Eye (👁️ Look at Sanctuary or 🖥️ Look Outside App)"
                  className={`px-1.5 py-0.5 rounded border text-[9px] font-mono cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    isEyeActionSheetOpen || isScreenSharingActive
                      ? 'bg-amber-950/90 border-amber-400 text-amber-200 ring-1 ring-amber-400 font-bold'
                      : 'bg-[#26181c] hover:bg-[#382329] border border-[#e6c88c]/70 text-[#ffe5a3]'
                  }`}
                >
                  <span>👁️</span>
                  <span className="hidden sm:inline">Eye ▾</span>
                </button>

                {/* Two-Button Action Sheet for Argon's Eye */}
                {isEyeActionSheetOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsEyeActionSheetOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-[#140c10] border-2 border-[#d4af37] rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 text-left animate-in fade-in duration-150">
                      <div className="text-[10px] font-mono font-bold text-[#c59b47] px-2 py-1 border-b border-[#3d271d] flex items-center justify-between">
                        <span>👁️ ARGON&apos;S VISUAL EYE</span>
                        <button
                          type="button"
                          onClick={() => setIsEyeActionSheetOpen(false)}
                          className="text-[#a89070] hover:text-[#ffe5a3] text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Option 1: Look at Sanctuary (Internal DOM) */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsEyeActionSheetOpen(false);
                          void handleSnapRoomForArgon();
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-lg bg-[#24151b] hover:bg-[#3d242e] border border-[#785c37] text-left flex items-center gap-2.5 cursor-pointer text-[#ffe5a3] active:scale-[0.98] transition-transform"
                      >
                        <span className="text-xl shrink-0">👁️</span>
                        <div>
                          <div className="text-xs font-bold text-[#ffe5a3] font-serif-webtoon">
                            Look at Sanctuary
                          </div>
                          <div className="text-[10px] font-mono text-[#cbb693]">
                            Internal DOM snapshot of active room
                          </div>
                        </div>
                      </button>

                      {/* Option 2: Look Outside App (Screen Share / External Window) */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsEyeActionSheetOpen(false);
                          void handleCaptureExternalScreen(true);
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-lg bg-[#24151b] hover:bg-[#3d242e] border border-[#c59b47] text-left flex items-center gap-2.5 cursor-pointer text-amber-200 active:scale-[0.98] transition-transform"
                      >
                        <span className="text-xl shrink-0">🖥️</span>
                        <div>
                          <div className="text-xs font-bold text-amber-200 font-serif-webtoon">
                            Look Outside App
                          </div>
                          <div className="text-[10px] font-mono text-amber-300/80">
                            Screen share external app (PicsArt, etc.)
                          </div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Live Color-Coded Context Payload Pill moved down into the row with space */}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <span
                data-testid="context-payload-pill"
                title={contextPayloadPill.tooltip}
                className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-semibold tabular-nums shrink-0 ${
                  contextPayloadPill.level === 'crimson'
                    ? 'bg-red-950/90 border-red-400 text-red-200 animate-pulse'
                    : contextPayloadPill.level === 'amber'
                    ? 'bg-amber-950/90 border-amber-400 text-amber-200'
                    : 'bg-emerald-950/85 border-emerald-400/70 text-emerald-200'
                }`}
              >
                {contextPayloadPill.label}
              </span>
            </div>
          </div>

          {/* Row 3: Navigation Bar (Lorebook, Prompt, System) */}
          <div className="grid grid-cols-3 gap-1 w-full pt-0.5">
            <button
              type="button"
              onClick={() => navigateToView('lorebook_list')}
              className="rounded-full gilded-pill-btn text-[10px] px-2 py-0.5 gap-1 shrink-0 font-medium cursor-pointer whitespace-nowrap leading-none flex items-center justify-center truncate"
            >
              <ApothecaryIcon icon="lorebook" row={0} col={0} xPct={8} yPct={4} size={14} />
              <span>Lorebook ({Object.keys(lorebook).length})</span>
            </button>
            <button
              type="button"
              onClick={() => navigateToView('system_instructions')}
              className="rounded-full gilded-pill-btn text-[10px] px-2 py-0.5 gap-1 shrink-0 font-medium cursor-pointer whitespace-nowrap leading-none flex items-center justify-center truncate"
            >
              <ApothecaryIcon icon="prompt" row={4} col={1} xPct={94} yPct={96} size={14} />
              <span>Prompt</span>
            </button>
            <button
              type="button"
              onClick={() => navigateToView('system')}
              className="rounded-full gilded-pill-btn text-[10px] px-2 py-0.5 gap-1 shrink-0 font-medium cursor-pointer whitespace-nowrap leading-none flex items-center justify-center truncate"
            >
              <ApothecaryIcon icon="system" row={0} col={1} xPct={50} yPct={4} size={14} />
              <span>System</span>
            </button>
          </div>

          {/* Sanctuary Gramophone / Music Generator Drawer (`lyria-3.5`) */}
          {isGramophoneOpen && (
            <div
              data-testid="sanctuary-gramophone-drawer"
              className="mt-1.5 p-2.5 rounded-xl bg-[#150f12]/95 border border-[#c59b47]/80 space-y-2 shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-serif font-bold text-[#ffe5a3]">
                    📻 Sanctuary Gramophone (`lyria-3.5` Ambient Music Generator)
                  </span>
                  <span className="text-[10px] font-mono text-[#cbb693]">
                    · Generate custom room atmospheres
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-1 text-[10px] font-mono text-[#e6c88c] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLoopingGramophone}
                      onChange={(e) => setIsLoopingGramophone(e.target.checked)}
                      className="accent-[#c59b47]"
                    />
                    <span>Loop</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsGramophoneOpen(false)}
                    className="px-2 py-0.5 rounded gilded-pill-btn text-[10px] font-mono cursor-pointer"
                  >
                    ✕ Hide
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
                <input
                  type="text"
                  data-testid="gramophone-vibe-input"
                  value={gramophonePrompt}
                  onChange={(e) => setGramophonePrompt(e.target.value)}
                  placeholder="Type a room vibe (e.g., dark gothic apothecary rain & cello, sleazy late-night bass)…"
                  className="flex-1 min-h-[32px] px-2.5 py-1 rounded-lg gilded-input-well text-xs font-mono text-[#f5ead8]"
                />
                <button
                  type="button"
                  disabled={isGeneratingMusic || !gramophonePrompt.trim()}
                  data-testid="gramophone-generate-btn"
                  onClick={() => void handleGenerateGramophoneTrack()}
                  className="min-h-[32px] px-3 py-1 rounded-lg gilded-send-btn text-xs font-mono font-bold cursor-pointer disabled:opacity-40 whitespace-nowrap"
                >
                  {isGeneratingMusic ? '⏳ Composing (lyria-3.5)…' : '🎶 Generate & Play (lyria-3.5)'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {GRAMOPHONE_VIBE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setGramophonePrompt(preset.prompt);
                      void handleGenerateGramophoneTrack(preset.prompt);
                    }}
                    className="px-2 py-0.5 rounded-full bg-[#1f1613] hover:bg-[#2c1f1a] border border-[#8e6d3b]/70 text-[10px] font-mono text-[#e6c88c] cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {gramophoneError && (
                <div className="text-[11px] font-mono text-rose-300">⚠️ {gramophoneError}</div>
              )}

              {gramophoneTracks.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-[#6b5331]/40">
                  {(() => {
                    const currentTrack =
                      gramophoneTracks.find((t) => t.id === activeTrackId) || gramophoneTracks[0];
                    if (!currentTrack) return null;
                    return (
                      <div className="space-y-1.5 bg-[#0d0a0c] border border-[#c59b47]/60 rounded-lg p-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[11px] font-serif font-bold text-[#ffe5a3] truncate">
                              ♪ {currentTrack.title}
                            </div>
                            <div className="text-[9px] font-mono text-[#cbb693] truncate">
                              Engine: {currentTrack.modelUsed} · Prompt: “{currentTrack.prompt}”
                            </div>
                          </div>
                          <audio
                            ref={gramophoneAudioRef}
                            controls
                            autoPlay
                            loop={isLoopingGramophone}
                            src={currentTrack.audioDataUrl}
                            data-testid="gramophone-audio-player"
                            className="h-7 max-w-full sm:w-56"
                          />
                        </div>

                        {/* Active Visual Feedback: How Prompt Shaped Audio */}
                        {currentTrack.musicalProfile && (
                          <div
                            data-testid="gramophone-track-profile-feedback"
                            className="text-[9px] font-mono bg-[#160f13] border border-[#c59b47]/40 rounded px-2 py-1 text-[#e6c88c] flex flex-wrap items-center gap-1.5"
                          >
                            {currentTrack.musicalProfile.category === 'sfx_comedic' ? (
                              <>
                                <span className="text-amber-300 font-bold">💨 SFX Profile:</span>
                                <span>{currentTrack.musicalProfile.key}</span>
                                <span>·</span>
                                <span>{currentTrack.musicalProfile.instruments.join(' · ')}</span>
                                <span>·</span>
                                <span className="text-[#f5ead8] italic">{currentTrack.musicalProfile.notes}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-amber-300 font-bold">🎼 {currentTrack.musicalProfile.key}</span>
                                <span>·</span>
                                <span>⏳ {currentTrack.musicalProfile.bpm} BPM</span>
                                <span>·</span>
                                <span>🎻 {currentTrack.musicalProfile.instruments.join(', ')}</span>
                                <span>·</span>
                                <span>🌌 {currentTrack.musicalProfile.atmosphere}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Stage: Scrollable Gothic Chat Stream OR Shared Collaborative Whiteboard + Desktop Lorebook Inspector */}
      <div className="flex-1 min-h-0 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative z-10">
        <main className="lg:col-span-8 xl:col-span-8 flex flex-col min-h-0 overflow-hidden justify-end">
          {/* Minimizable Chat Stream Window OR Shared Drawing Whiteboard */}
          {isWhiteboardMode ? (
            <WhiteboardStage
              strokes={whiteboardStrokes}
              onAddStrokes={(added) => {
                userDrewWhiteboardSinceLastTurnRef.current = true;
                setWhiteboardStrokes((prev) => [...prev, ...added]);
              }}
              onUndoStroke={() =>
                setWhiteboardStrokes((prev) => prev.slice(0, -1))
              }
              onClearBoard={() => {
                userDrewWhiteboardSinceLastTurnRef.current = false;
                setWhiteboardStrokes([]);
              }}
              onReturnToChat={() => setIsWhiteboardMode(false)}
              onAskArgonToDraw={handleAskArgonToDrawOnWhiteboard}
              isArgonDrawing={isArgonDrawing}
              argonComment={argonWhiteboardComment}
              whiteboardError={errorBanner}
              onSelectPaidKey={handleOpenSelectPaidKey}
            />
          ) : !isChatMinimized ? (
            <>
              {isScreenSharingActive && (
                <div
                  data-testid="outside-screen-share-banner"
                  className="mx-2 sm:mx-6 mt-2 p-2 rounded-lg bg-amber-950/90 border border-amber-400/80 text-amber-200 flex items-center justify-between gap-2 text-xs font-mono shadow-md z-30"
                >
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse text-amber-400">👁️</span>
                    <span className="font-semibold">Argon's Eye Screen Share Active</span>
                    <span className="text-[10px] text-amber-300/80 hidden sm:inline">
                      (Capture what you're working on in other tabs/apps)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => void captureAndSendOutsideFrame()}
                      className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer shadow-xs"
                    >
                      👁️ Snap to Argon
                    </button>
                    <button
                      type="button"
                      onClick={stopOutsideScreenShare}
                      className="px-2 py-1 rounded bg-stone-900/80 hover:bg-stone-800 text-stone-300 text-xs cursor-pointer"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              )}
              <div
                ref={chatContainerRef}
                data-testid="chat-scroll-container"
                className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 sm:px-6 py-2.5 sm:py-4 space-y-2.5"
              >
              {/* DOM Windowing Header (Ticket 2 Part 2): Render 40 messages by default */}
              {messages.length > visibleMessageCount && (
                <div
                  data-testid="load-earlier-messages-container"
                  className="flex items-center justify-center gap-2 py-2 mb-2 border-b border-[#6b5331]/40"
                >
                  <button
                    type="button"
                    data-testid="load-earlier-messages-btn"
                    onClick={() =>
                      setVisibleMessageCount((prev) => Math.min(messages.length, prev + 40))
                    }
                    className="px-3 py-1.5 rounded-full bg-[#1e1511] hover:bg-[#2c1e17] border border-[#c59b47]/70 text-[#ffe5a3] text-xs font-mono font-semibold cursor-pointer shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>📜 Load Earlier Messages (+40)</span>
                    <span className="text-[10px] text-[#cbb693]">
                      ({messages.length - visibleMessageCount} older remaining)
                    </span>
                  </button>
                  <button
                    type="button"
                    data-testid="load-all-messages-btn"
                    onClick={() => setVisibleMessageCount(messages.length)}
                    className="px-2.5 py-1.5 rounded-full bg-[#180e12] hover:bg-[#25141c] border border-[#8e6d3b]/60 text-[#d4b483] text-xs font-mono cursor-pointer active:scale-95 transition-all"
                  >
                    Show All ({messages.length})
                  </button>
                </div>
              )}

              {(messages.length <= visibleMessageCount
                ? messages
                : messages.slice(-visibleMessageCount)
              ).map((msg) => (
                <ChatMessageBubble
                  key={msg.id}
                  msg={msg}
                  hexAvatarUrl={hexAvatarUrl}
                  argonAvatarMode={argonAvatarMode}
                  activeModelId={activeModelId}
                  isSending={isSending}
                  speakingMsgId={speakingMsgId}
                  loadingAudioMsgId={loadingAudioMsgId}
                  argonVoiceName={argonVoiceName}
                  copiedMsgId={copiedMsgId}
                  editingMsgId={editingMsgId}
                  editingMsgText={editingMsgText}
                  isThoughtsExpanded={Boolean(expandedThoughts[msg.id])}
                  isTokenPopoverOpen={tokenPopoverMsgId === msg.id}
                  staffAgents={staffAgents}
                  weather={weather}
                  battery={battery}
                  userTimeZone={userTimeZone}
                  fallbackFullPayloadTokens={livePayloadEstimate.totalTokens}
                  onSpeak={handleSpeakMessage}
                  onReply={(targetMsg) => {
                    setReplyingTo(targetMsg);
                    chatInputRef.current?.focus();
                  }}
                  onResend={handleResendUserMessage}
                  onStartEdit={handleStartEditMessage}
                  onCancelEdit={() => {
                    setEditingMsgId(null);
                    setEditingMsgText("");
                  }}
                  onSaveEdit={handleSaveEditedMessage}
                  onEditChange={setEditingMsgText}
                  onCopy={handleCopyMessageText}
                  onDelete={handleDeleteMessage}
                  onToggleThoughts={(id) =>
                    setExpandedThoughts((prev) => ({ ...prev, [id]: !prev[id] }))
                  }
                  onToggleTokenPopover={(id) =>
                    setTokenPopoverMsgId((prev) => (prev === id ? null : id))
                  }
                  activeReactionPickerMsgId={activeReactionPickerMsgId}
                  onToggleReactionPicker={(id) =>
                    setActiveReactionPickerMsgId((prev) => (prev === id ? null : id))
                  }
                  onToggleReaction={handleToggleReaction}
                  onCloseReactionPicker={() => setActiveReactionPickerMsgId(null)}
                  onNavigateToView={navigateToView}
                  onOpenWhiteboard={() => setIsWhiteboardMode(true)}
                  onSetActiveGamesTab={setActiveGamesTab}
                />
              ))}

              {/* Stream / Loading State for Argon with Stop / Interrupt Button */}
              {isSending && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-2xl p-3 bubble-smoked-glass text-xs font-mono text-[#e8c686] flex items-center justify-between gap-2 border border-[#8e6d3b]/50 shadow-md"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <span className="font-semibold text-amber-200">Argon is thinking...</span>
                    <span className="hidden sm:inline text-[11px] text-[#b59874] truncate">({activeModelId})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleStopThinking}
                      aria-label="Stop Argon generation"
                      title="Stop Argon's response to add new information or interrupt"
                      className="px-3 py-1.5 rounded-full bg-red-950 hover:bg-red-900 border border-red-500/80 text-red-100 text-xs font-semibold cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                    >
                      <span className="text-sm leading-none">⏹️</span>
                      <span>Stop</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Live Character Typing State for Staff Agents */}
              {typingStaffAgent && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-2xl p-3 bubble-smoked-glass text-xs font-mono text-[#e8c686] flex items-center justify-between"
                >
                  <span>
                    🐾 {typingStaffAgent.name} ({typingStaffAgent.jobTitle}) is typing in character...
                  </span>
                  <span className="text-[#b59874]">{typingStaffAgent.model}</span>
                </div>
              )}

              {/* Visible Red Alert Box for API Errors with One-Tap Resend & Select Paid API Key */}
              {errorBanner && (
                <div
                  role="alert"
                  className="rounded-2xl p-3 bg-red-950/90 border-2 border-red-500/80 text-xs font-mono text-red-100 shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-red-300">
                      ⚠️ Notice / API Error ({activeModelId})
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleOpenSelectPaidKey}
                        className="px-2 py-0.5 rounded bg-amber-600/90 hover:bg-amber-500 text-amber-50 text-xs cursor-pointer font-semibold"
                      >
                        [ 🔑 Select Paid API Key ]
                      </button>
                      {messages.some((m) => m.role === 'user') && (
                        <button
                          type="button"
                          onClick={() => {
                            const lastUser = [...messages]
                              .reverse()
                              .find((m) => m.role === 'user');
                            if (lastUser) {
                              handleResendUserMessage(lastUser);
                            }
                          }}
                          className="px-2 py-0.5 rounded bg-amber-700/80 hover:bg-amber-600 text-amber-50 text-xs cursor-pointer"
                        >
                          ↻ Resend Last
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setErrorBanner(null)}
                        className="px-2 py-0.5 rounded bg-red-900/70 hover:bg-red-800 text-red-100 text-xs cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap break-words leading-relaxed">
                    {errorBanner}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
            </>
          ) : (
            <div className="flex-1 pointer-events-none" />
          )}

          {/* Floating Antique Brass Down-Arrow Button in Bottom-Right Corner Above Input Bar */}
          {!isWhiteboardMode && !isChatMinimized && (
            <div className="relative w-full pointer-events-none z-30">
              <button
                type="button"
                data-testid="scroll-to-bottom-btn"
                onClick={() => scrollToBottom(false)}
                aria-label="Jump to bottom of chat"
                title="Jump to latest message"
                className={`pointer-events-auto absolute right-3 bottom-1.5 w-9 h-9 rounded-full gilded-circle-btn border-2 border-[#e6c88c] shadow-[0_4px_14px_rgba(0,0,0,0.85)] flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                  isScrolledUp
                    ? 'opacity-100 ring-2 ring-[#ffe5a3]/80 bg-[#241812]'
                    : 'opacity-85 hover:opacity-100'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                  className="block"
                >
                  <path
                    d="M12 4.5v13m0 0l-5.2-5.2M12 17.5l5.2-5.2"
                    fill="none"
                    stroke="#e6c88c"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 20h12"
                    stroke="#c59b47"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Bottom User UI Dashboard (Circular Buttons: Staff, Status, Books, Whiteboard, Compact Up/Down Minimize Circle, Games, Shock) */}
          <div className="shrink-0 px-2 sm:px-4 pb-2 pt-1.5 bg-gradient-to-t from-[#0d0a0c]/95 via-[#0d0a0c]/75 to-transparent relative z-20">
            <div className="flex items-center justify-between gap-1 mb-1.5 px-0.5 w-full">
              {/* Left Cluster: Staff Quarters, Staff Status (Dynamic 2-State Bell), Books, Whiteboard */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => navigateToView('staff_quarters')}
                  aria-label="Staff Quarters"
                  title="Staff Quarters (Hire Staff & Haiku)"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full gilded-circle-btn flex flex-col items-center justify-center cursor-pointer shrink-0"
                >
                  <ApothecaryIcon
                    icon="staffQuarters"
                    row={0}
                    col={2}
                    xPct={92}
                    yPct={4}
                    size={20}
                  />
                  <span className="text-[7px] sm:text-[8px] font-mono text-[#e6c88c] leading-none mt-0.5">
                    Staff
                  </span>
                </button>

                {(() => {
                  const statusCoord = resolveStaffStatusIconCoord(
                    staffAgents,
                    Boolean(typingStaffAgent)
                  );
                  return (
                    <button
                      type="button"
                      onClick={() => navigateToView('staff_status')}
                      aria-label="Staff Status"
                      title={`Staff Status — ${statusCoord.label}`}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full gilded-circle-btn flex flex-col items-center justify-center cursor-pointer shrink-0"
                    >
                      <ApothecaryIcon
                        icon={statusCoord.id}
                        row={statusCoord.row}
                        col={statusCoord.col}
                        xPct={statusCoord.xPct}
                        yPct={statusCoord.yPct}
                        size={20}
                      />
                      <span className="text-[7px] sm:text-[8px] font-mono text-[#e6c88c] leading-none mt-0.5">
                        Status
                      </span>
                    </button>
                  );
                })()}

                <button
                  type="button"
                  onClick={handleAskHaikuWeatherAndTime}
                  aria-label="Ask Haiku (Time & Storms)"
                  title={
                    isStormCondition
                      ? `⚡ Storm Alert (${weather.hPa ? Math.round(weather.hPa) : ''} hPa) — Tap to ask Haiku to warn room!`
                      : `🐾 Ask Haiku for Time & Weather (${weather.hPa ? Math.round(weather.hPa) : ''} hPa)`
                  }
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full gilded-circle-btn flex flex-col items-center justify-center cursor-pointer shrink-0 relative transition-all ${
                    isStormCondition
                      ? 'border-amber-400/90 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse bg-amber-950/30'
                      : ''
                  }`}
                >
                  {isStormCondition ? (
                    <CloudLightning className="w-4 h-4 text-amber-300 animate-pulse" />
                  ) : (
                    <Dog className="w-4 h-4 text-[#e6c88c]" />
                  )}
                  <span
                    className={`text-[7px] sm:text-[8px] font-mono leading-none mt-0.5 ${
                      isStormCondition ? 'text-amber-300 font-bold' : 'text-[#e6c88c]'
                    }`}
                  >
                    {isStormCondition ? 'Storm!' : 'Haiku'}
                  </span>
                  {isStormCondition && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-amber-200 animate-ping" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigateToView('journals')}
                  aria-label="Sanctuary Library"
                  title="Sanctuary Library (Argon's Book, Hex's Book & Vault)"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full gilded-circle-btn flex flex-col items-center justify-center cursor-pointer shrink-0"
                >
                  <ApothecaryIcon
                    icon="books"
                    row={4}
                    col={0}
                    xPct={8}
                    yPct={76}
                    size={20}
                  />
                  <span className="text-[7px] sm:text-[8px] font-mono text-[#e6c88c] leading-none mt-0.5">
                    Library
                  </span>
                </button>
              </div>

              {/* Center Compact Circular Up/Down Arrow Minimize Chat Button */}
              <button
                type="button"
                onClick={() => {
                  if (isWhiteboardMode) {
                    setIsWhiteboardMode(false);
                  } else {
                    setIsChatMinimized((prev) => !prev);
                  }
                }}
                aria-label={isChatMinimized ? 'Restore Chat' : 'Minimize Chat'}
                title={isChatMinimized ? 'Restore Chat Window' : 'Minimize Chat Window'}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full gilded-circle-btn flex items-center justify-center cursor-pointer hover:brightness-110 transition-all shrink-0"
              >
                <span aria-hidden="true" className="text-[#e6c88c] text-xs font-bold leading-none">
                  {isChatMinimized ? '▲' : '▼'}
                </span>
              </button>

              {/* Right Cluster above Send Button: Games Chest & Shock Button */}
              <div aria-label="Controller" className="flex items-center justify-end gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => navigateToView('games_chest')}
                  aria-label="Board Games Chest"
                  title="Board Games Chest (52 Cards, Chess, Dice, Cipher)"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full gilded-circle-btn flex flex-col items-center justify-center cursor-pointer shrink-0"
                >
                  <ApothecaryIcon
                    icon="games"
                    row={3}
                    col={1}
                    xPct={94}
                    yPct={76}
                    size={20}
                  />
                  <span className="text-[7px] sm:text-[8px] font-mono text-[#e6c88c] leading-none mt-0.5">
                    Games
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleShockArgon}
                  aria-label="Shock Argon"
                  title="Shock Argon (Prank Collar)"
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 ${
                    shockFlash
                      ? 'bg-amber-400 text-slate-950 border-2 border-amber-200 scale-95'
                      : 'gilded-circle-btn'
                  }`}
                >
                  <ApothecaryIcon
                    icon="shock"
                    row={1}
                    col={1}
                    xPct={90}
                    yPct={28}
                    size={20}
                  />
                  <span className="text-[7px] sm:text-[8px] font-mono leading-none mt-0.5">
                    Shock
                  </span>
                </button>
              </div>
            </div>

            {/* Scrollable Chibi Argon Picker Tray (Compact Single-Row Header + Tombstone Filtering + Edit/Delete) */}
            {isStickerTrayOpen && (() => {
              const validStickerList = activeStickerCatalog.filter(hasValidStickerImage);
              return (
                <div
                  role="region"
                  aria-label="Chibi Argon Sticker Picker Tray"
                  data-testid="sticker-picker-drawer"
                  className="mb-2 p-2.5 rounded-2xl gilded-dock-frame border border-[#c59b47]/80 max-h-72 sm:max-h-80 overflow-y-auto space-y-2.5"
                >
                  {/* Sleek Single-Row Toolbar Header */}
                  <div className="flex items-center justify-between gap-1.5 border-b border-[#6b5331]/50 pb-2 px-0.5 whitespace-nowrap overflow-x-auto">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs sm:text-sm font-serif font-bold text-[#e6c88c] truncate">
                        😈 Stickers ({validStickerList.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Hidden File Input for Direct Upload */}
                      <input
                        type="file"
                        ref={drawerFileInputRef}
                        onChange={handleDrawerUploadSheet}
                        accept="image/*"
                        className="hidden"
                      />

                      {/* Upload / Slice Sheet Button */}
                      <button
                        type="button"
                        disabled={isReslicingDrawer}
                        data-testid="drawer-upload-slice-btn"
                        onClick={() => drawerFileInputRef.current?.click()}
                        title="Upload and slice a sticker sprite sheet into die-cut reaction stickers"
                        className="h-7 px-2.5 rounded-lg bg-gradient-to-r from-[#581c87] via-[#7e22ce] to-[#6b21a8] hover:brightness-110 border border-[#e6c88c]/80 text-[#fff3db] text-[10px] font-mono font-semibold cursor-pointer shadow-xs flex items-center gap-1 disabled:opacity-40"
                      >
                        <span>✂️ {isReslicingDrawer ? 'Slicing…' : 'Upload / Slice Sheet'}</span>
                      </button>

                      {/* Auto-Scan & Relabel Button */}
                      <button
                        type="button"
                        disabled={isAutoScanningDrawer || validStickerList.length === 0}
                        data-testid="drawer-autoscan-relabel-btn"
                        onClick={handleDrawerAutoScan}
                        title="Use gemini-2.5-flash vision to inspect stickers and automatically generate accurate :shortcode: slugs and visual descriptions"
                        className="h-7 px-2.5 rounded-lg bg-[#2a1d15] hover:bg-[#3d291e] border border-[#c59b47]/80 text-[#ffe5a3] text-[10px] font-mono font-semibold cursor-pointer disabled:opacity-40 flex items-center gap-1"
                      >
                        <span>{isAutoScanningDrawer ? '⏳ Scanning…' : '🔍 Auto-Scan & Relabel'}</span>
                      </button>

                      {/* Clear All Trash Icon */}
                      <button
                        type="button"
                        disabled={validStickerList.length === 0}
                        data-testid="drawer-clear-all-stickers-btn"
                        onClick={handleDrawerClearAll}
                        title="Clear all stickers from library"
                        aria-label="Clear all stickers"
                        className="h-7 w-7 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-200 text-xs cursor-pointer disabled:opacity-30 flex items-center justify-center shrink-0"
                      >
                        🗑️
                      </button>

                      {/* Close Button */}
                      <button
                        type="button"
                        onClick={() => setIsStickerTrayOpen(false)}
                        title="Close Sticker Drawer"
                        aria-label="Close Sticker Drawer"
                        className="h-7 w-7 rounded-lg gilded-pill-btn text-xs font-mono cursor-pointer flex items-center justify-center shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Sticker Grid / Empty State */}
                  {validStickerList.length === 0 ? (
                    <div className="p-4 rounded-xl bubble-smoked-glass border border-[#6b5331]/40 text-center space-y-2">
                      <div className="text-2xl">🖼️</div>
                      <p className="text-xs font-serif font-bold text-[#e6c88c]">
                        Sticker Tray is Currently Empty
                      </p>
                      <p className="text-[11px] font-mono text-[#cbb693] max-w-sm mx-auto">
                        No sticker images are loaded yet. Tap <strong className="text-[#ffe5a3]">&quot;✂️ Upload / Slice Sheet&quot;</strong> to load die-cut reaction stickers or open Chibi Sticker Studio!
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => drawerFileInputRef.current?.click()}
                          className="h-8 px-3 rounded-lg gilded-send-btn text-xs font-mono font-bold cursor-pointer"
                        >
                          ✂️ Upload Sheet
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsStickerStudioOpen(true)}
                          className="h-8 px-3 rounded-lg gilded-pill-btn text-xs font-mono cursor-pointer"
                        >
                          🎨 Open Sticker Studio
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {validStickerList.map((sticker, sIdx) => {
                        const tooltipText = `${sticker.shortcode} — ${sticker.label}${
                          sticker.description ? ` (${sticker.description})` : ''
                        }`;
                        return (
                          <div
                            key={`${sticker.slotIndex ?? sIdx}-${sticker.shortcode}`}
                            className="p-1.5 rounded-xl bg-[#140e0f]/80 hover:bg-[#25171e]/90 border border-[#6b5331]/50 hover:border-[#e6c88c] flex flex-col items-center justify-between gap-1 transition-all relative group"
                          >
                            {/* Card Header: Edit Pencil and Red Delete */}
                            <div className="w-full flex items-center justify-between gap-1 z-10 px-0.5">
                              <button
                                type="button"
                                data-testid={`drawer-edit-sticker-${sticker.code}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingSticker({
                                    shortcode: sticker.shortcode,
                                    label: sticker.label,
                                    description: sticker.description || '',
                                    slotIndex: sticker.slotIndex,
                                  });
                                }}
                                title={`Edit ${sticker.shortcode} name & visual description`}
                                aria-label={`Edit ${sticker.shortcode}`}
                                className="p-1 rounded bg-[#2a1d15] hover:bg-[#3d291e] border border-[#8e6d3b]/70 text-[10px] text-[#ffe5a3] cursor-pointer shadow-xs leading-none"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                data-testid={`drawer-delete-sticker-${sticker.code}`}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  await deleteStickerFromLibrary({
                                    shortcode: sticker.shortcode,
                                    slotIndex: sticker.slotIndex,
                                  });
                                  setActiveStickerCatalog(getActiveStickerCatalog());
                                }}
                                title={`Delete ${sticker.shortcode} from Sticker Library`}
                                aria-label={`Delete ${sticker.shortcode}`}
                                className="p-1 rounded bg-red-950/95 hover:bg-red-800 border border-red-400 text-[10px] text-red-100 cursor-pointer shadow-xs leading-none"
                              >
                                🗑️
                              </button>
                            </div>

                            {/* Sticker Insert Button */}
                            <button
                              type="button"
                              onClick={() => {
                                chatInputRef.current?.appendText(`${sticker.shortcode} `);
                                chatInputRef.current?.focus();
                              }}
                              title={tooltipText}
                              aria-label={`Insert ${sticker.shortcode}`}
                              className="w-full flex flex-col items-center justify-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                            >
                              <ArgonSticker
                                sticker={sticker}
                                row={sticker.row}
                                col={sticker.col}
                                shortcode={sticker.shortcode}
                                size={58}
                              />
                              <span
                                title={tooltipText}
                                className="text-[10px] font-mono text-[#e6c88c] text-center truncate max-w-full px-0.5 leading-tight"
                              >
                                {sticker.shortcode}
                              </span>
                              {sticker.description && (
                                <span
                                  title={sticker.description}
                                  className="text-[8px] font-mono text-[#a8937b] text-center truncate max-w-full px-0.5 leading-none"
                                >
                                  {sticker.description}
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Manual Edit Sticker Dialog/Modal */}
                  {editingSticker && (
                    <div
                      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3"
                      role="dialog"
                      aria-modal="true"
                      aria-label="Edit Sticker Details"
                    >
                      <div className="w-full max-w-sm rounded-2xl gilded-dock-frame p-4 space-y-3 bg-[#160f14] border border-[#c59b47] shadow-2xl">
                        <div className="flex items-center justify-between gap-2 border-b border-[#6b5331]/50 pb-2">
                          <h3 className="text-sm font-serif font-bold text-[#ffe5a3]">
                            ✏️ Edit Sticker Details
                          </h3>
                          <button
                            type="button"
                            onClick={() => setEditingSticker(null)}
                            className="h-7 px-2.5 rounded-full gilded-pill-btn text-xs font-mono cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex items-center justify-center p-2 bg-[#0d090b] rounded-xl border border-[#6b5331]/40">
                          <ArgonSticker shortcode={editingSticker.shortcode} size={72} />
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-[10px] font-mono text-[#d4b483] mb-1">
                              Shortcode Tag:
                            </label>
                            <input
                              type="text"
                              value={editingSticker.shortcode}
                              onChange={(e) =>
                                setEditingSticker((prev) =>
                                  prev ? { ...prev, shortcode: e.target.value } : null
                                )
                              }
                              className="w-full h-8 px-2.5 rounded-lg gilded-input-well text-xs font-mono text-[#ffe5a3]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-[#d4b483] mb-1">
                              Human Label:
                            </label>
                            <input
                              type="text"
                              value={editingSticker.label}
                              onChange={(e) =>
                                setEditingSticker((prev) =>
                                  prev ? { ...prev, label: e.target.value } : null
                                )
                              }
                              className="w-full h-8 px-2.5 rounded-lg gilded-input-well text-xs font-serif text-[#f5ead8]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-[#d4b483] mb-1">
                              Visual Description (Tells Argon what this sticker looks like):
                            </label>
                            <textarea
                              rows={2}
                              value={editingSticker.description}
                              onChange={(e) =>
                                setEditingSticker((prev) =>
                                  prev ? { ...prev, description: e.target.value } : null
                                )
                              }
                              placeholder="e.g. Chibi girl flipping a wooden table in rage with wide angry eyes"
                              className="w-full p-2 rounded-lg gilded-input-well text-xs font-serif text-[#f5ead8] resize-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#6b5331]/40">
                          <button
                            type="button"
                            onClick={() => setEditingSticker(null)}
                            className="h-8 px-3 rounded-lg gilded-pill-btn text-xs font-mono cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveStickerEdit}
                            className="h-8 px-4 rounded-lg gilded-send-btn text-xs font-mono font-bold cursor-pointer"
                          >
                            ✓ Save Sticker
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Ornate Gold-Framed Bottom Input Console */}
            <form
              onSubmit={handleSendMessage}
              className="gilded-dock-frame rounded-2xl py-2 px-1.5 sm:px-3 relative z-10"
            >
              {/* Universal Multimodal Attachment Preview Bar (Sound Files, Documents, PDFs, Images) */}
              {attachedImages.length > 0 && (
                <div className="space-y-1.5 mb-2 px-1">
                  {attachedImages.map((img, idx) => {
                    const mime = resolveAttachmentMimeType(img.name || '', img.mimeType);

                    if (isAudioAttachment(mime, img.name)) {
                      return (
                        <div
                          key={idx}
                          data-testid={`preview-audio-attachment-${idx}`}
                          className="flex flex-wrap items-center gap-2 bg-[#140c10] border border-[#c59b47]/80 rounded-xl p-2 shadow-md"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-base shrink-0">🎵</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-mono font-bold text-[#ffe5a3] truncate">
                                {img.name || 'Audio Clip'}
                              </div>
                              <div className="text-[10px] font-mono text-[#cbb693]">
                                {normalizeAudioMimeType(mime)} {img.size ? `· ${Math.round(img.size / 1024)} KB` : ''}
                              </div>
                            </div>
                          </div>
                          <audio
                            controls
                            preload="metadata"
                            src={`data:${normalizeAudioMimeType(mime)};base64,${img.data}`}
                            className="h-8 max-w-[210px] sm:max-w-[280px] rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setAttachedImages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label={`Remove ${img.name || 'audio clip'}`}
                            className="h-8 w-8 rounded-lg bg-[#2b1d16] hover:bg-red-950 text-[#f3e7d3] hover:text-red-200 text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center border border-[#6b5331]"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    }

                    if (isVideoAttachment(mime, img.name)) {
                      return (
                        <div
                          key={idx}
                          data-testid={`preview-video-attachment-${idx}`}
                          className="flex flex-wrap items-center gap-2 bg-[#140c10] border border-[#c59b47]/80 rounded-xl p-2 shadow-md"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-base shrink-0">🎬</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-mono font-bold text-[#ffe5a3] truncate">
                                {img.name || 'Video Clip'}
                              </div>
                              <div className="text-[10px] font-mono text-[#cbb693]">
                                {mime} {img.size ? `· ${Math.round(img.size / 1024)} KB` : ''}
                              </div>
                            </div>
                          </div>
                          <video
                            controls
                            playsInline
                            preload="metadata"
                            src={`data:${mime};base64,${img.data}`}
                            className="h-14 max-w-[140px] sm:max-w-[200px] rounded-lg border border-[#6b5331]/40 bg-black object-contain"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setAttachedImages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label={`Remove ${img.name || 'video clip'}`}
                            className="h-8 w-8 rounded-lg bg-[#2b1d16] hover:bg-red-950 text-[#f3e7d3] hover:text-red-200 text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center border border-[#6b5331]"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    }

                    if (isPdfAttachment(mime, img.name)) {
                      return (
                        <div
                          key={idx}
                          data-testid={`preview-pdf-attachment-${idx}`}
                          className="flex items-center gap-2 bg-[#180e12] border border-[#8e6d3b]/80 rounded-xl p-2 shadow-md"
                        >
                          <span className="text-xl shrink-0">📕</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-mono font-bold text-[#ffe5a3] truncate">
                              {img.name || 'Document.pdf'}
                            </div>
                            <div className="text-[10px] font-mono text-[#cbb693]">
                              PDF Document {img.size ? `· ${Math.round(img.size / 1024)} KB` : ''}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachedImages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label={`Remove ${img.name || 'PDF'}`}
                            className="h-8 w-8 rounded-lg bg-[#2b1d16] hover:bg-red-950 text-[#f3e7d3] hover:text-red-200 text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center border border-[#6b5331]"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    }

                    if (img.textContent || isTextDocAttachment(mime, img.name)) {
                      return (
                        <div
                          key={idx}
                          data-testid={`preview-doc-attachment-${idx}`}
                          className="flex items-center gap-2 bg-[#120b0e] border border-[#6b5331]/80 rounded-xl p-2 shadow-md"
                        >
                          <span className="text-lg shrink-0">
                            {img.name?.endsWith('.json') || img.name?.endsWith('.csv') ? '📊' : img.name?.endsWith('.md') ? '📝' : '📄'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-mono font-bold text-[#ffe5a3] truncate">
                              {img.name || 'Document'}
                            </div>
                            <div className="text-[10px] font-mono text-[#cbb693]">
                              {img.textContent ? `${img.textContent.split('\n').length} lines · ` : ''}
                              {img.size ? `${Math.round(img.size / 1024)} KB` : mime}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachedImages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label={`Remove ${img.name || 'document'}`}
                            className="h-8 w-8 rounded-lg bg-[#2b1d16] hover:bg-red-950 text-[#f3e7d3] hover:text-red-200 text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center border border-[#6b5331]"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-[#140e0b] border border-[#9d7b44] rounded-xl p-1.5"
                      >
                        <div
                          role="img"
                          aria-label={img.name}
                          style={{
                            backgroundImage: `url(data:${mime};base64,${img.data})`,
                          }}
                          className="h-9 w-9 rounded-lg bg-cover bg-center shrink-0 border border-[#c59b47]/60"
                        />
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            aria-label={`Description for ${img.name || `image ${idx + 1}`}`}
                            value={img.description || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAttachedImages((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, description: val } : item
                                )
                              );
                            }}
                            placeholder="Describe image so Argon can see it..."
                            className="w-full h-7 px-2 rounded bg-[#0d0a0c] border border-[#785c37] font-mono text-[11px] text-[#f5ead8] placeholder-[#9e8664]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachedImages((prev) => prev.filter((_, i) => i !== idx))
                          }
                          aria-label={`Remove ${img.name}`}
                          className="h-7 w-7 rounded-lg bg-[#2b1d16] text-[#f3e7d3] text-xs font-bold cursor-pointer shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*,audio/*,image/*,application/pdf,text/*,.mp4,.webm,.mov,.mp3,.wav,.ogg,.m4a,.aac,.flac,.pdf,.txt,.md,.json,.csv,.py,.ts,.js,.html,.css"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <input
                ref={cameraFallbackInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />
              <input
                ref={audioFallbackInputRef}
                type="file"
                accept="audio/*"
                capture
                onChange={handleAudioFallbackUpload}
                className="hidden"
              />

              {/* Live Pulsing Crimson Recording Bar OR Stopped Voice Draft Review Bar (Never auto-sends on speech pause!) */}
              {(isRecordingMic || isTranscribingMic || pendingVoiceDraft) && (
                <div
                  data-testid="live-mic-recording-bar"
                  className="mb-2 px-2.5 py-2 rounded-xl bg-gradient-to-r from-[#3a0a14] via-[#260810] to-[#1a060b] border-2 border-rose-500/90 shadow-[0_0_18px_rgba(244,63,94,0.45)] flex flex-col gap-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-3 h-3 rounded-full shrink-0 ${
                          isRecordingMic
                            ? 'bg-rose-500 animate-ping'
                            : isTranscribingMic
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-[#e6c88c]'
                        }`}
                      />
                      <span className="text-xs font-mono font-bold text-rose-100 truncate">
                        {isTranscribingMic
                          ? '⏳ Gemini Audio Processing…'
                          : isRecordingMic
                          ? `🔴 Recording Voice (${micRecordSeconds}s)`
                          : `🎙️ Voice Clip Ready (${pendingVoiceDraft?.durationSec || 1}s)`}
                      </span>
                      {micActiveLayer && isRecordingMic && !isTranscribingMic && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-950/90 border border-rose-400/60 text-[9px] font-mono text-rose-200">
                          {micActiveLayer === 'mediarecorder'
                            ? 'MediaRecorder + Speech'
                            : micActiveLayer === 'speech'
                            ? 'Live Speech'
                            : 'Device Mic'}
                        </span>
                      )}
                    </div>

                    {!isTranscribingMic && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          data-testid="mic-send-voice-btn"
                          onClick={() => void handleSendVoiceMessageAction()}
                          className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-600 text-white border border-rose-300 text-[10px] font-mono font-bold cursor-pointer shadow"
                        >
                          🔊 Send Voice Message
                        </button>
                        <button
                          type="button"
                          data-testid="mic-put-text-btn"
                          onClick={() => void handlePutVoiceTextInBoxAction()}
                          className="px-2.5 py-1 rounded-lg bg-[#c59b47] hover:brightness-110 text-[#120b0a] border border-[#ffe5a3] text-[10px] font-mono font-bold cursor-pointer shadow"
                        >
                          📝 Put Text in Box
                        </button>
                        <button
                          type="button"
                          data-testid="mic-cancel-btn"
                          onClick={handleCancelVoiceRecording}
                          className="px-2.5 py-1 rounded-lg bg-[#1d1410] hover:bg-red-950 border border-[#8e6d3b] text-[#f5ead8] text-[10px] font-mono font-bold cursor-pointer"
                        >
                          ✕ Cancel
                        </button>
                        {isRecordingMic && (
                          <button
                            type="button"
                            data-testid="mic-native-file-btn"
                            onClick={() => audioFallbackInputRef.current?.click()}
                            title="Open native phone voice recorder / audio clip picker if iframe blocks browser mic"
                            className="px-2 py-1 rounded-lg bg-[#1d1410] hover:bg-[#2a1d15] border border-[#8e6d3b] text-[#e6c88c] text-[10px] font-mono cursor-pointer"
                          >
                            📂 Device Mic
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Live SpeechRecognition Preview (while recording) OR Editable Draft Preview (when stopped) */}
                  {isRecordingMic && (micRecognizedText || micLiveInterimText) && (
                    <div
                      data-testid="mic-live-transcript-preview"
                      className="px-2.5 py-1.5 rounded-lg bg-[#120b0d]/90 border border-rose-400/40 text-xs font-serif text-[#ffe5a3]"
                    >
                      “{[micRecognizedText, micLiveInterimText].filter(Boolean).join(' ')}”
                    </div>
                  )}

                  {!isRecordingMic && !isTranscribingMic && pendingVoiceDraft && (
                    <div className="space-y-1.5">
                      {pendingVoiceDraft.voiceAudio && (
                        <VoiceMessageAudioBar
                          voiceAudio={pendingVoiceDraft.voiceAudio}
                          testId="draft-voice-message-player"
                        />
                      )}
                      <input
                        type="text"
                        data-testid="draft-voice-transcript-input"
                        value={pendingVoiceDraft.transcript}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPendingVoiceDraft((prev) =>
                            prev ? { ...prev, transcript: val } : null
                          );
                        }}
                        placeholder="Transcript preview (optional—edit before sending or putting in box)…"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#120b0d] border border-[#c59b47]/60 text-xs font-serif text-[#f5ead8] placeholder-[#9e8664]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Compact Media Toolbar Row directly above the full-width Message Argon input */}
              <div className="grid grid-cols-5 gap-1.5 mb-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach File or Audio"
                  title="Attach Audio (.mp3, .wav, .m4a, .ogg), Document (.pdf, .txt, .md, .json, .csv), or Image"
                  className="gilded-image-btn min-h-[44px] h-11 px-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <span aria-hidden="true" className="text-sm leading-none">
                    📎
                  </span>
                  <span className="text-[10px] font-serif-webtoon leading-none">
                    Attach
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCameraModal}
                  aria-label="Camera"
                  title="Open Live Camera"
                  className="gilded-image-btn min-h-[44px] h-11 px-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <span aria-hidden="true" className="text-sm leading-none">
                    📷
                  </span>
                  <span className="text-[10px] font-serif-webtoon leading-none">
                    Cam
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleCaptureExternalScreen(true)}
                  aria-label="External Screen Eye"
                  title="🖥️ External Eye — Stream/capture outside app screen (PicsArt, browser, etc.) directly into Argon's multimodal vision"
                  className="gilded-image-btn min-h-[44px] h-11 px-1 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-transform hover:border-amber-400 group"
                >
                  <span aria-hidden="true" className="text-sm leading-none">
                    🖥️
                  </span>
                  <span className="text-[10px] font-serif-webtoon leading-none text-amber-200 font-semibold group-hover:text-amber-100">
                    Ext Eye
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="chat-mic-btn"
                  onClick={() => void handleToggleMicRecording()}
                  disabled={isTranscribingMic}
                  aria-label={isRecordingMic ? 'Stop Microphone Recording' : 'Microphone Voice Input'}
                  title={
                    isRecordingMic
                      ? 'Tap to Stop & Transcribe with Gemini'
                      : 'Record Voice with 3-Layer Iframe-Proof Microphone (SpeechRecognition -> MediaRecorder Gemini Audio -> Native Mic)'
                  }
                  className={`min-h-[44px] h-11 px-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-transform ${
                    isRecordingMic
                      ? 'bg-rose-900/95 border-2 border-rose-400 text-rose-100 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.7)]'
                      : 'gilded-image-btn'
                  }`}
                >
                  <span aria-hidden="true" className="text-sm leading-none">
                    {isTranscribingMic ? '⏳' : isRecordingMic ? '🔴' : '🎙️'}
                  </span>
                  <span className="text-[10px] font-serif-webtoon leading-none">
                    {isTranscribingMic
                      ? 'Wait'
                      : isRecordingMic
                      ? `${micRecordSeconds}s`
                      : 'Mic'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsStickerTrayOpen((prev) => !prev)}
                  aria-label="Stickers"
                  title="😈 Stickers — Open Chibi Argon Reaction Stickers"
                  className={`min-h-[44px] h-11 px-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-transform ${
                    isStickerTrayOpen
                      ? 'gilded-send-btn ring-1 ring-[#fff3db]'
                      : 'gilded-image-btn'
                  }`}
                >
                  <span aria-hidden="true" className="text-sm leading-none">
                    😈
                  </span>
                  <span className="text-[10px] font-serif-webtoon leading-none">
                    Stickers
                  </span>
                </button>
              </div>

              {/* Active Reply Preview Banner Above Input Bar */}
              {replyingTo && (
                <div
                  data-testid="active-reply-banner"
                  className="flex items-center justify-between px-3 py-1.5 mb-1.5 bg-[#181114]/95 border border-[#c59b47]/70 rounded-xl text-xs font-mono text-[#e6c88c] shadow-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[#ffe5a3] font-bold shrink-0">
                      ↩️ Replying to {replyingTo.role === 'user' ? 'Hex' : (replyingTo.staffSender?.name || 'Argon')}
                    </span>
                    <span className="text-[#a8937b] truncate text-[11px]">
                      {stripToolReceiptsFromVisibleText(replyingTo.text).slice(0, 120)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    aria-label="Cancel reply"
                    title="Cancel reply"
                    className="text-stone-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-stone-800 text-xs font-bold cursor-pointer shrink-0 ml-1.5"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Full-Width Message Argon Textarea + Send Button Row (Memoized WorkbenchChatInput) */}
              <WorkbenchChatInput
                ref={chatInputRef}
                onSendMessage={handleSendMessage}
                isSending={isSending}
                hasAttachedImages={attachedImages.length > 0}
                onUserActivity={recordUserActivity}
              />
            </form>
          </div>
        </main>

        {/* Desktop Right Column: Live Lorebook Quick Search */}
        <aside
          aria-label="Lorebook Search Panel"
          className="hidden lg:flex lg:col-span-4 xl:col-span-4 flex-col border-l border-[#8e6d3b]/60 bg-[#120d0a]/92 min-h-0 overflow-hidden"
        >
          <div className="p-4 border-b border-[#6b5331]/60 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#f5ead8]">
                Lorebook Quick Search
              </h2>
              <button
                type="button"
                onClick={() => navigateToView('lorebook_list')}
                className="min-h-[36px] px-3 py-1 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer"
              >
                Full Lorebook
              </button>
            </div>

            <div>
              <label htmlFor="sidebar-lorebook-search" className="sr-only">
                Search Lorebook keywords
              </label>
              <input
                id="sidebar-lorebook-search"
                type="search"
                value={sidebarSearchQuery}
                onChange={(e) => setSidebarSearchQuery(e.target.value)}
                placeholder="Search drawer keywords (e.g. Raynaud, WORKBENCH)…"
                className="w-full min-h-[38px] px-3 py-1.5 rounded-xl gilded-input-well text-xs placeholder-[#8c7a65]"
              />
            </div>

            <div className="text-[11px] font-mono text-[#b8a282] tabular-nums flex items-center justify-between">
              <span>
                {sidebarSearchQuery.trim()
                  ? `${quickSidebarResults.length} matching drawers`
                  : `${Object.keys(lorebook).length} drawers indexed`}
              </span>
              <span>{gistSyncStatus}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
            {quickSidebarResults.length === 0 ? (
              <div className="p-4 rounded-xl bubble-smoked-glass text-xs text-[#cbb693] text-center">
                No drawers match &ldquo;{sidebarSearchQuery}&rdquo;.
              </div>
            ) : (
              quickSidebarResults.map((entry) => (
                <div
                  key={entry.filename}
                  className="p-3 rounded-xl bubble-smoked-glass space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#f5ead8] truncate">
                      {entry.filename}
                    </span>
                    <span className="font-mono text-[11px] text-[#cbb693] tabular-nums shrink-0">
                      {entry.charCount.toLocaleString()} chars
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {entry.snippets.map((snip, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] font-mono bg-[#110c0a]/90 border border-[#6b5331]/60 rounded-lg px-2.5 py-1.5 leading-relaxed break-words"
                      >
                        <span className="text-[#9e8664] mr-1.5 tabular-nums">
                          L{snip.lineNumber}:
                        </span>
                        <HighlightedSnippet snippet={snip} />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => navigateToView('lorebook_editor', entry.filename)}
                      className="min-h-[34px] flex-1 px-3 py-1 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer"
                    >
                      📖 Open Editor
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* Full-Screen Two-Step Lorebook Page */}
      <LorebookModal
        mode={lorebookMode}
        activeDrawerFilename={activeDrawerFilename}
        onBackToChat={() => navigateToView('chat')}
        onOpenDrawerEditor={(fname) => navigateToView('lorebook_editor', fname)}
        onBackToList={() => navigateToView('lorebook_list')}
        lorebook={lorebook}
        onSaveDrawer={handleSaveDrawer}
        onDeleteDrawer={handleDeleteDrawer}
        onSaveToPhoneFolder={handleSaveToPhoneFolder}
        onLoadFromPhoneFolder={handleLoadFromPhoneFolder}
        onLinkSyncFile={handleLinkSyncFile}
        linkedSyncFileMeta={linkedSyncFileMeta}
        localSyncStatus={localSyncStatus}
        isSyncingPhone={isSyncingPhone}
        localSyncIsError={localSyncIsError}
        githubToken={githubToken}
        onChangeGithubToken={setGithubToken}
        gistId={gistId}
        onChangeGistId={handleChangeGistId}
        onSyncGist={() => syncGistDrawers(true)}
        onPushAllToGist={handlePushAllToGist}
        onPullFromGist={() => syncGistDrawers(true)}
        onCreateNewPrivateGist={handleCreateNewPrivateGist}
        isSyncingGist={isSyncingGist}
        gistSyncStatus={gistSyncStatus}
        gistSyncIsError={gistSyncIsError}
      />

      {/* Full-Screen Settings Page (with Brain & Omni Router, API Key Vault, 5MB Hex Avatar Upload + gpt-image-2.5 Generator, Fox Hotwire, Argon Audio, and New Chat Yes/No Popup) */}
      <SystemSyncModal
        isOpen={currentView === 'system'}
        onClose={() => navigateToView('chat')}
        onOpenSystemInstructions={() => navigateToView('system_instructions')}
        onOpenStickerStudio={() => setIsStickerStudioOpen(true)}
        onConfirmNewChatAndReturn={() => {
          void handleNewChat();
          navigateToView('chat');
        }}
        customApiKey={customApiKey}
        onChangeCustomApiKey={handleChangeCustomApiKey}
        activeBrainModel={selectedPresetModel === 'custom' ? customModelId : selectedPresetModel}
        onChangeActiveBrainModel={handleChangeActiveBrainModel}
        staffBrainModel={staffBrainModel}
        onChangeStaffBrainModel={handleChangeStaffBrainModel}
        maxHistoryTurns={maxHistoryTurns}
        onChangeMaxHistoryTurns={handleChangeMaxHistoryTurns}
        apiKeyVault={apiKeyVault}
        onUpdateApiKeyVault={handleUpdateApiKeyVault}
        hexAvatarUrl={hexAvatarUrl}
        onChangeHexAvatarUrl={setHexAvatarUrl}
        hexAvatarDesc={hexAvatarDesc}
        onChangeHexAvatarDesc={setHexAvatarDesc}
        userPersona={userPersona}
        onChangeUserPersona={setUserPersona}
        argonAvatarMode={argonAvatarMode}
        onChangeArgonAvatarMode={setArgonAvatarMode}
        argonVoiceName={argonVoiceName}
        onChangeArgonVoiceName={setArgonVoiceName}
        argonSpeechMode={argonSpeechMode}
        onChangeArgonSpeechMode={setArgonSpeechMode}
        argonVocalStylePrompt={argonVocalStylePrompt}
        onChangeArgonVocalStylePrompt={handleChangeArgonVocalStylePrompt}
        autoSpeakArgon={autoSpeakArgon}
        onChangeAutoSpeakArgon={setAutoSpeakArgon}
        githubToken={githubToken}
        onChangeGithubToken={setGithubToken}
        gistId={gistId}
        onChangeGistId={handleChangeGistId}
        onSyncGistNow={async () => {
          await pushSanctuaryBooksToGist(argonBook, hexBook, true, true);
          await syncGistDrawers(true);
        }}
        onSaveToPhoneFolder={handleSaveToPhoneFolder}
        onLoadFromPhoneFolder={handleLoadFromPhoneFolder}
        onLinkSyncFile={handleLinkSyncFile}
        onLinkPhoneFolder={handleLinkPhoneFolder}
        onUnlinkSyncFile={handleUnlinkSyncFile}
        linkedSyncFileMeta={linkedSyncFileMeta}
        localSyncStatus={localSyncStatus}
        isSyncingPhone={isSyncingPhone}
        localSyncIsError={localSyncIsError}
        onCreateNewPrivateGist={handleCreateNewPrivateGist}
        isSyncingGist={isSyncingGist}
        gistSyncStatus={gistSyncStatus}
        gistSyncIsError={gistSyncIsError}
        weather={weather}
        onUsePhoneGps={handleUsePhoneGps}
        onSearchCityWeather={handleSearchCityWeather}
        weatherStatus={weatherStatus}
        onOpenStaffQuarters={() => navigateToView('staff_quarters')}
        onOpenHouseholdAvatarUploader={() => setIsHouseholdAvatarUploaderOpen(true)}
        thinkingBudget={thinkingBudget}
        onChangeThinkingBudget={handleChangeThinkingBudget}
        thinkingLevel={thinkingLevel}
        onChangeThinkingLevel={handleChangeThinkingLevel}
      />

      {/* Full-Screen Chibi Sticker Studio Modal (HTML5 Canvas Slicer, Nudge Sliders, & Argon Multimodal Vision Auto-Labeler) */}
      <ChibiStickerStudioModal
        isOpen={isStickerStudioOpen}
        onClose={() => setIsStickerStudioOpen(false)}
        customApiKey={customApiKey}
        onSelectPaidKey={handleOpenSelectPaidKey}
        onBackupStickersToGist={handleBackupStickersToGist}
      />

      {/* Live App Camera Capture Modal */}
      {isCameraModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Live Camera Capture"
        >
          <div className="w-full max-w-sm rounded-2xl gilded-dock-frame p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-serif font-bold text-[#e6c88c]">
                📷 Sanctuary Camera Access
              </h3>
              <button
                type="button"
                onClick={handleCloseCameraModal}
                className="h-8 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-[#0b0809] border border-[#c59b47]/60 flex items-center justify-center">
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {cameraError && (
                <div className="absolute inset-0 bg-black/80 p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <p className="text-xs font-mono text-amber-200">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      cameraFallbackInputRef.current?.click();
                      handleCloseCameraModal();
                    }}
                    className="h-9 px-4 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer"
                  >
                    📂 Use Device Camera / Photo Picker
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleFlipCamera}
                className="h-10 px-3.5 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer"
              >
                🔄 Flip ({cameraFacingMode === 'environment' ? 'Rear' : 'Front'})
              </button>
              <button
                type="button"
                onClick={handleCaptureCameraFrame}
                className="h-10 flex-1 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer"
              >
                📸 Snap Photo for Argon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated System Instructions Window */}
      <SystemInstructionsModal
        isOpen={currentView === 'system_instructions'}
        onClose={() => navigateToView('chat')}
        systemPrompt={systemPrompt}
        onChangeSystemPrompt={setSystemPrompt}
        lorebook={lorebook}
        argonBook={argonBook}
        hexBook={hexBook}
      />

      {/* Full-Screen Staff Quarters Window (with Haiku, A Monkey, Permission Matrix, Edit Agent & Hire Staff Popup) */}
      <StaffQuartersModal
        isOpen={currentView === 'staff_quarters'}
        onClose={() => navigateToView('chat')}
        onOpenStaffStatus={() => navigateToView('staff_status')}
        onOpenAvatarUploader={() => setIsHouseholdAvatarUploaderOpen(true)}
        onOpenGitHubDeploy={() => setIsGitHubDeployModalOpen(true)}
        agents={staffAgents}
        jobs={staffJobs}
        onHireAgent={handleHireStaffAgent}
        onUpdateAgent={handleUpdateStaffAgent}
        onDeleteAgent={handleDeleteStaffAgent}
        onAssignJob={handleAssignJobToAgent}
        onOrderInChat={(agent) => {
          navigateToView('chat');
          handleRunStaffAgentTask(agent.id);
        }}
        permissionMatrix={toolPermissionMatrix}
        onTogglePermission={handleToggleToolPermission}
      />

      {/* Full-Screen Staff Status Window (with Task Dropdowns, Stop/Run, & Create Job Popup) */}
      <StaffStatusModal
        isOpen={currentView === 'staff_status'}
        onClose={() => navigateToView('chat')}
        onOpenStaffQuarters={() => navigateToView('staff_quarters')}
        onOpenGitHubDeploy={() => setIsGitHubDeployModalOpen(true)}
        agents={staffAgents}
        jobs={staffJobs}
        onAssignJob={handleAssignJobToAgent}
        onUpdateAgent={handleUpdateStaffAgent}
        onRunAgentTask={handleRunStaffAgentTask}
        onStopAgentTask={handleStopAgentTask}
        onCreateJob={handleCreateStaffJob}
      />

      {/* 1-Tap GitHub Pages Quick-Fix & Deploy Modal */}
      <GitHubPagesDeployModal
        isOpen={isGitHubDeployModalOpen}
        onClose={() => setIsGitHubDeployModalOpen(false)}
        githubToken={githubToken}
        onOrderInChat={(msg) => {
          navigateToView('chat');
          void handleSendMessage(msg);
        }}
        onRunStaffTask={(agentId) => {
          navigateToView('chat');
          void handleRunStaffAgentTask(agentId);
        }}
      />

      {/* Full-Screen Sanctuary Gothic Library (Interactive 4-Shelf Bookcase, Argon's Book, Hex's Book & Vault) */}
      <LibraryModal
        isOpen={currentView === 'journals'}
        onClose={() => navigateToView('chat')}
        argonBook={argonBook}
        hexBook={hexBook}
        onAddHexEntry={handleAddHexBookEntry}
        onUpdateHexEntry={handleUpdateHexBookEntry}
        onDeleteHexEntry={handleDeleteHexBookEntry}
        onUpdateArgonMemory={handleUpdateArgonMemory}
        onDeleteArgonMemory={handleDeleteArgonMemory}
        onTriggerArgonBookAction={handleTriggerArgonBookAction}
        isArgonUpdatingBook={isArgonUpdatingBook}
        bookActionError={bookActionError}
        onClearBookActionError={() => setBookActionError(null)}
        onSelectPaidKey={handleOpenSelectPaidKey}
        onSaveToPhoneFolder={handleSaveToPhoneFolder}
        onLoadFromPhoneFolder={handleLoadFromPhoneFolder}
        localSyncStatus={localSyncStatus}
        isSyncingPhone={isSyncingPhone}
        onPullBooksFromGist={() => syncGistDrawers(true)}
        onPushBooksToGist={() => pushSanctuaryBooksToGist(argonBook, hexBook, true)}
        isSyncingGist={isSyncingGist}
        gistSyncStatus={gistSyncStatus}
        onSetArgonAvatarMode={(mode) => {
          setArgonAvatarMode(mode as ArgonAvatarMode);
          try {
            localStorage.setItem(STORAGE_KEYS.ARGON_AVATAR_MODE, mode);
          } catch {
            // ignore
          }
        }}
        onOpenArgonEye={() => setIsEyeActionSheetOpen(true)}
      />

      {/* Full-Screen Apothecary Board Games & Occult Séance Chest (Ouija, EVP/Scrying Ghosts, Tarot/Crystal/Rune Fortune, Chess, Cards, Dice, Cipher) */}
      <GamesChestModal
        isOpen={currentView === 'games_chest'}
        onClose={() => navigateToView('chat')}
        activeModelId={activeModelId}
        customApiKey={customApiKey}
        onSelectPaidKey={handleOpenSelectPaidKey}
        initialTab={activeGamesTab}
        onChangeTab={setActiveGamesTab}
        externalInvocation={latestOccultInvocation}
        recentChatContext={messages
          .slice(-6)
          .map((m) => `${m.role === 'user' ? 'Hex' : 'Argon'}: ${m.text}`)
          .join('\n')}
        whiteboardStrokes={whiteboardStrokes}
        onAddWhiteboardStrokes={(added) => {
          userDrewWhiteboardSinceLastTurnRef.current = true;
          setWhiteboardStrokes((prev) => [...prev, ...added]);
        }}
        onUndoWhiteboardStroke={() =>
          setWhiteboardStrokes((prev) => prev.slice(0, -1))
        }
        onClearWhiteboard={() => {
          userDrewWhiteboardSinceLastTurnRef.current = false;
          setWhiteboardStrokes([]);
        }}
        onAskArgonToDrawWhiteboard={handleAskArgonToDrawOnWhiteboard}
        isArgonDrawingWhiteboard={isArgonDrawing}
        argonWhiteboardComment={argonWhiteboardComment}
        whiteboardError={errorBanner}
        onUpdateLiveParlorState={setLiveParlorStateSummary}
        onRecordParlorMove={(historyEntry, userChatLine, argonAndGameReply, latestArgonBanter) => {
          recordUserActivity();
          setOccultSessionHistory((prev) => [historyEntry, ...prev].slice(0, 20));
          const effectiveArgonText = (latestArgonBanter || argonAndGameReply || userChatLine || '').trim();
          if (effectiveArgonText) {
            setLatestRoomArgonReaction(effectiveArgonText);
          }
          const nowMs = Date.now();
          const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
          const deltaStr = formatElapsedDelta(lastMsg?.timestamp ?? null, nowMs);
          const bubbleSubtitle = buildBubbleTelemetrySubtitle({
            timestamp: nowMs,
            deltaStr,
            tempF: weather.tempF,
            batteryPct: battery.batteryPct,
          });

          const rawUserText = argonAndGameReply ? (userChatLine || historyEntry) : historyEntry;
          const userText = (rawUserText || '').trim();
          const userFormatted =
            userText.startsWith('🎲') ||
            userText.startsWith('👁️') ||
            userText.startsWith('📻') ||
            userText.startsWith('🔮') ||
            userText.startsWith('♟️') ||
            userText.startsWith('🃏') ||
            userText.startsWith('🔐')
              ? userText
              : `🎲 ${userText}`;

          const parlorUserMsg: ChatMessage = {
            id: `parlor-move-${nowMs}`,
            role: 'user',
            sender: 'hex',
            text: userFormatted,
            timestamp: nowMs,
            bubbleSubtitle,
          };
          const added: ChatMessage[] = [parlorUserMsg];
          const rawArgonReply = argonAndGameReply ? argonAndGameReply : userChatLine;
          if (rawArgonReply && rawArgonReply.trim()) {
            added.push({
              id: `parlor-argon-${nowMs + 1}`,
              role: 'model',
              sender: 'argon',
              text: rawArgonReply.trim(),
              timestamp: nowMs + 1,
            });
          }
          setMessages((prev) => [...prev, ...added]);
        }}
        onSendGameMomentToChat={(userSummary, argonReaction) => {
          recordUserActivity();
          setOccultSessionHistory((prev) => [userSummary, ...prev].slice(0, 20));
          if (argonReaction) {
            setLatestRoomArgonReaction(argonReaction);
          }
          const nowMs = Date.now();
          const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
          const deltaStr = formatElapsedDelta(lastMsg?.timestamp ?? null, nowMs);
          const bubbleSubtitle = buildBubbleTelemetrySubtitle({
            timestamp: nowMs,
            deltaStr,
            tempF: weather.tempF,
            batteryPct: battery.batteryPct,
          });
          const gameUserMsg: ChatMessage = {
            id: `game-user-${nowMs}`,
            role: 'user',
            sender: 'hex',
            text: userSummary,
            timestamp: nowMs,
            bubbleSubtitle,
          };
          const gameArgonMsg: ChatMessage = {
            id: `game-argon-${nowMs + 1}`,
            role: 'model',
            sender: 'argon',
            text: argonReaction,
            timestamp: nowMs + 1,
          };
          setMessages((prev) => [...prev, gameUserMsg, gameArgonMsg]);
          navigateToView('chat');
          scrollToBottom();
        }}
      />

      {/* Shared Collaborative Feature & Fix Scratchpad (Dual 'Done' Lock) Modal */}
      <TicketScratchpadModal
        isOpen={isTicketScratchpadOpen}
        onClose={() => setIsTicketScratchpadOpen(false)}
        scratchpad={ticketScratchpad}
        onUpdateScratchpad={(updated) => {
          setTicketScratchpad(updated);
          saveTicketScratchpad(updated);
        }}
        staffAgents={staffAgents}
        onCompileAndLockTicket={(ticket) => {
          setAgentFixRequests((prev) => {
            const next = [ticket, ...prev];
            const compacted = compactAndPruneAgentFixQueue({
              tickets: next,
              maxChars: MAX_AGENT_FIX_DRAWER_CHARS,
            });
            setLorebook((lb) => ({
              ...lb,
              [GIST_AGENT_FIX_DRAWER]: compacted.drawerMarkdown,
            }));
            void syncAgentFixInboxToServer(compacted.activeTickets);
            return compacted.activeTickets;
          });

          const resetScratchpad: TicketScratchpadState = {
            title: 'Sanctuary Feature & Fix Plan',
            items: [],
            hexDone: false,
            argonDone: false,
            priority: 'high',
            via: 'direct',
            lastUpdated: Date.now(),
          };
          setTicketScratchpad(resetScratchpad);
          saveTicketScratchpad(resetScratchpad);
          setIsTicketScratchpadOpen(false);
          setIsAgentFixQueueOpen(true);
        }}
        onAskArgonToReview={() => {
          setIsTicketScratchpadOpen(false);
          const bulletsList = ticketScratchpad.items
            .map((it, idx) => `${idx + 1}. [${it.author === 'hex' ? 'Hex' : 'Argon'}] ${it.text}`)
            .join('\n');
          void dispatchMessageToArgon(
            `📋 Argon, please review our shared Collaborative Ticket Scratchpad titled "${ticketScratchpad.title}" with me! Here are our current plan items:\n${bulletsList || '(no items yet)'}\n\nPlease add or update any points using update_ticket_scratchpad(action="add_item", text="..."), and when you agree it is ready, call update_ticket_scratchpad(action="mark_argon_done", argonDone=true) so we can dual-lock and dispatch it!`
          );
        }}
      />

      {/* Argon & Haiku's Direct Coding Agent Fix & Feature Request Queue Modal */}
      {isAgentFixQueueOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-xs flex items-center justify-center p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Argon & Haiku Coding Agent Fix & Feature Queue"
          data-testid="agent-fix-queue-modal"
        >
          <div className="w-full max-w-2xl h-[92vh] max-h-[92vh] sm:h-auto sm:max-h-[88vh] flex flex-col rounded-2xl gilded-dock-frame p-3 sm:p-4 space-y-2 overflow-hidden">
            {/* Header: Title + Close Button */}
            <div className="flex items-center justify-between gap-2 border-b border-[#6b5331]/60 pb-1.5 shrink-0">
              <h2 className="text-xs sm:text-sm font-serif font-bold text-[#ffe5a3] flex items-center gap-1.5 truncate">
                <span>🛠️ Coding Agent Fix &amp; Feature Queue</span>
                {copiedFixId && (
                  <span className="text-[10px] font-mono text-emerald-300">
                    Copied!
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={() => setIsAgentFixQueueOpen(false)}
                className="h-7 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer shrink-0"
              >
                ✕ Close
              </button>
            </div>

            {/* Single Compact Flex-Wrap Row of Small Pills */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0 pb-1 border-b border-[#6b5331]/30">
              <button
                type="button"
                onClick={() => {
                  setIsAgentFixQueueOpen(false);
                  setIsTicketScratchpadOpen(true);
                }}
                data-testid="open-scratchpad-from-queue-btn"
                className="h-7 px-2.5 rounded-full bg-[#362217] hover:bg-[#4a2e1f] border border-[#d4af37]/80 text-[#ffe5a3] text-[11px] font-mono font-semibold cursor-pointer"
              >
                📋 Scratchpad ({ticketScratchpad.items.length})
                {ticketScratchpad.hexDone && ticketScratchpad.argonDone ? ' 🔒' : ''}
              </button>

              <button
                type="button"
                onClick={() => {
                  const compiled = compileScratchpadToTicket(ticketScratchpad);
                  const queueMd =
                    agentFixRequests.length > 0
                      ? agentFixRequests
                          .map((t) => `## [${t.priority.toUpperCase()}] ${t.title}\n${t.details}`)
                          .join('\n\n')
                      : compiled.formattedDetails;
                  void navigator.clipboard.writeText(queueMd);
                  setCopiedFixId('all');
                  setTimeout(() => setCopiedFixId(null), 1800);
                }}
                title="Copy current fix tickets and scratchpad plan to clipboard"
                className="h-7 px-2.5 rounded-full gilded-pill-btn text-[11px] font-mono cursor-pointer"
              >
                📋 Copy Prompt
              </button>

              <button
                type="button"
                disabled={isSending}
                onClick={() => {
                  setIsAgentFixQueueOpen(false);
                  void dispatchMessageToArgon(
                    '🐾 Argon, call submit_agent_fix_request with via="haiku" so Haiku the Golden Retriever Puppy carries your fix/feature request blueprint in his jaws to the Coding Agent!'
                  );
                }}
                data-testid="ask-haiku-fix-btn"
                className="h-7 px-2.5 rounded-full gilded-pill-btn text-[11px] font-mono font-semibold cursor-pointer disabled:opacity-40"
              >
                🐕 Haiku
              </button>

              <button
                type="button"
                disabled={isSending}
                onClick={() => {
                  setIsAgentFixQueueOpen(false);
                  void dispatchMessageToArgon(
                    '🛠️ Argon, use your submit_agent_fix_request tool right now (via="direct") to send a fix or improvement request directly to the Coding Agent!'
                  );
                }}
                data-testid="ask-argon-direct-fix-btn"
                className="h-7 px-2.5 rounded-full gilded-send-btn text-[11px] font-mono font-semibold cursor-pointer disabled:opacity-40"
              >
                ⚡ Direct
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAgentFixQueueOpen(false);
                  navigateToView('lorebook_editor', GIST_AGENT_FIX_DRAWER);
                }}
                className="h-7 px-2.5 rounded-full gilded-pill-btn text-[11px] font-mono cursor-pointer"
              >
                📂 Lorebook
              </button>

              <button
                type="button"
                data-testid="haiku-compact-prune-queue-btn"
                onClick={() => {
                  const compacted = compactAndPruneAgentFixQueue({
                    tickets: [],
                    maxChars: MAX_AGENT_FIX_DRAWER_CHARS,
                  });
                  setAgentFixRequests([]);
                  setLorebook((prev) => {
                    const next = {
                      ...prev,
                      [GIST_AGENT_FIX_DRAWER]: compacted.drawerMarkdown,
                    };
                    try {
                      localStorage.setItem(STORAGE_KEYS.LOREBOOK, JSON.stringify(next));
                    } catch {
                      // ignore
                    }
                    return next;
                  });
                }}
                className="h-7 px-2.5 rounded-full gilded-pill-btn text-[11px] font-mono cursor-pointer text-emerald-300 border-emerald-500/50"
              >
                🧹 Clear
              </button>
            </div>

            {/* Smoothly Scrolling Modal Content with Scratchpad Items at the Top */}
            <div className="flex-1 min-h-0 min-h-[55vh] overflow-y-auto space-y-2.5 pr-1 overscroll-contain">
              {/* Prominent Live Scratchpad Plan Card if items exist */}
              {ticketScratchpad.items.length > 0 && (
                <div className="p-3 rounded-xl bg-[#1f1519]/95 border-2 border-[#d4af37]/80 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between gap-2 border-b border-[#6b5331]/40 pb-1.5">
                    <span className="text-xs font-serif font-bold text-[#ffe5a3] flex items-center gap-1.5">
                      <span>📋 Live Collaborative Scratchpad:</span>
                      <span className="text-[#f5ead8]">{ticketScratchpad.title}</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                        ticketScratchpad.hexDone && ticketScratchpad.argonDone
                          ? 'bg-emerald-900 border border-emerald-400 text-emerald-200'
                          : 'bg-[#3b232a] border border-[#8e6d3b]/80 text-[#ffe5a3]'
                      }`}
                    >
                      {ticketScratchpad.hexDone && ticketScratchpad.argonDone
                        ? '🔒 DUAL-LOCKED'
                        : '🔓 DRAFTING'}
                    </span>
                  </div>

                  {/* Scratchpad Numbered List */}
                  <div className="space-y-1 text-xs font-serif-webtoon text-[#f5ead8]">
                    {ticketScratchpad.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-1.5 p-1.5 rounded-lg bg-[#140c10]/80 border border-[#6b5331]/40"
                      >
                        <span className="text-[#ffe5a3] font-mono font-bold shrink-0">
                          {idx + 1}.
                        </span>
                        <span className="text-[10px] font-mono px-1 rounded bg-[#2b1720] text-[#e6c88c] shrink-0">
                          {item.author === 'hex' ? 'Hex' : 'Argon'}
                        </span>
                        <span className="flex-1 break-words">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#6b5331]/30">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAgentFixQueueOpen(false);
                        setIsTicketScratchpadOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#3b232a] hover:bg-[#4a2e36] border border-[#d4af37]/70 text-[#ffe5a3] text-[11px] font-mono cursor-pointer"
                    >
                      ✎ Edit in Scratchpad
                    </button>
                  </div>
                </div>
              )}
              {agentFixRequests.length === 0 ? (
                <div className="p-4 rounded-xl bubble-smoked-glass text-xs text-[#cbb693] text-center space-y-1">
                  <p className="font-semibold text-[#e6c88c]">
                    Queue Compacted &amp; Clean (&lt; 3,500 chars enforced)
                  </p>
                  <p>
                    All processed tickets have been shredded &amp; archived by Haiku so duplicate tickets never bloat your prompt cache. Tell Argon in chat (or tap a button above) whenever you want to file a new ticket!
                  </p>
                </div>
              ) : (
                agentFixRequests.map((ticket) => {
                  const isEditing = editingSubmittedTicketId === ticket.id;
                  return (
                    <div
                      key={ticket.id}
                      className="p-3 rounded-xl bubble-smoked-glass border border-[#c59b47]/60 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-[#ffe5a3]">
                          [{ticket.priority.toUpperCase()}] {ticket.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#24181c] border border-[#c59b47]/60 text-[#e6c88c]">
                          {ticket.via === 'direct'
                            ? '🖤 Argon Direct'
                            : ticket.via === 'haiku'
                            ? '🐾 Via Haiku Puppy'
                            : `🛎️ Via ${ticket.courierAgentName || ticket.via}`}{' '}
                          · {ticket.formattedDate}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2 pt-1 border-t border-[#6b5331]/40">
                          <div>
                            <label className="text-[10px] font-mono text-[#d4b483] block mb-0.5">
                              Edit Ticket Title:
                            </label>
                            <input
                              type="text"
                              value={editingSubmittedTicketTitle}
                              onChange={(e) => setEditingSubmittedTicketTitle(e.target.value)}
                              className="w-full h-8 px-2.5 rounded-lg gilded-input-well text-xs font-serif text-[#f5ead8]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-[#d4b483] block mb-0.5">
                              Edit Ticket Details:
                            </label>
                            <textarea
                              rows={4}
                              value={editingSubmittedTicketDetails}
                              onChange={(e) => setEditingSubmittedTicketDetails(e.target.value)}
                              className="w-full p-2.5 rounded-lg gilded-input-well text-xs font-serif text-[#f5ead8] resize-y"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const cleanTitle = editingSubmittedTicketTitle.trim() || ticket.title;
                                const cleanDetails = editingSubmittedTicketDetails.trim() || ticket.details;
                                setAgentFixRequests((prev) => {
                                  const next = prev.map((item) =>
                                    item.id === ticket.id
                                      ? { ...item, title: cleanTitle, details: cleanDetails }
                                      : item
                                  );
                                  const compacted = compactAndPruneAgentFixQueue({
                                    tickets: next,
                                    maxChars: MAX_AGENT_FIX_DRAWER_CHARS,
                                  });
                                  setLorebook((lb) => ({
                                    ...lb,
                                    [GIST_AGENT_FIX_DRAWER]: compacted.drawerMarkdown,
                                  }));
                                  void syncAgentFixInboxToServer(compacted.activeTickets);
                                  return compacted.activeTickets;
                                });
                                setEditingSubmittedTicketId(null);
                              }}
                              className="h-8 px-3.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-mono font-bold cursor-pointer"
                            >
                              ✓ Save Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSubmittedTicketId(null)}
                              className="h-8 px-3 rounded-lg bg-[#2b1d16] text-[#cbb693] text-xs font-mono cursor-pointer"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-serif-webtoon text-[#f5ead8] whitespace-pre-wrap leading-relaxed">
                            {ticket.details}
                          </p>
                          {ticket.haikuDeliveryNote && (
                            <div className="p-2 rounded-lg bg-[#161012] border border-[#6b5331]/50 text-[11px] font-serif-webtoon text-[#e6c88c] italic">
                              🐾 <strong>{ticket.courierAgentName || 'Haiku'}:</strong> {ticket.haikuDeliveryNote}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1 border-t border-[#6b5331]/30">
                            {/* Hex Edit Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubmittedTicketId(ticket.id);
                                setEditingSubmittedTicketTitle(ticket.title);
                                setEditingSubmittedTicketDetails(ticket.details);
                              }}
                              className="min-h-[32px] px-2.5 rounded-lg bg-[#24181d] hover:bg-[#342229] border border-[#8e6d3b]/70 text-[11px] font-mono text-[#ffe5a3] cursor-pointer flex items-center gap-1"
                            >
                              <span>✏️</span>
                              <span>Edit</span>
                            </button>
                            {/* Hex Delete Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setAgentFixRequests((prev) => {
                                  const next = prev.filter((item) => item.id !== ticket.id);
                                  const compacted = compactAndPruneAgentFixQueue({
                                    tickets: next,
                                    maxChars: MAX_AGENT_FIX_DRAWER_CHARS,
                                  });
                                  setLorebook((lb) => ({
                                    ...lb,
                                    [GIST_AGENT_FIX_DRAWER]: compacted.drawerMarkdown,
                                  }));
                                  void syncAgentFixInboxToServer(compacted.activeTickets);
                                  return compacted.activeTickets;
                                });
                              }}
                              className="min-h-[32px] px-2.5 rounded-lg bg-red-950/90 hover:bg-red-900 border border-red-500/60 text-[11px] font-mono text-red-200 cursor-pointer flex items-center gap-1"
                            >
                              <span>🗑️</span>
                              <span>Delete</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAgentFixRequests((prev) => {
                                  const next = prev.filter((item) => item.id !== ticket.id);
                                  const compacted = compactAndPruneAgentFixQueue({
                                    tickets: next,
                                    maxChars: MAX_AGENT_FIX_DRAWER_CHARS,
                                  });
                                  setLorebook((lb) => ({
                                    ...lb,
                                    [GIST_AGENT_FIX_DRAWER]: compacted.drawerMarkdown,
                                  }));
                                  return compacted.activeTickets;
                                });
                              }}
                              className="min-h-[32px] px-2.5 rounded-lg gilded-pill-btn text-[11px] font-mono cursor-pointer text-emerald-300"
                            >
                              ✓ Shred &amp; Archive
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const textToCopy = `[ARGON & HAIKU FIX REQUEST — ${ticket.priority.toUpperCase()}]\nTitle: ${ticket.title}\nDispatched Via: ${ticket.via}\nDetails: ${ticket.details}`;
                                void navigator.clipboard?.writeText(textToCopy);
                                setCopiedFixId(ticket.id);
                                window.setTimeout(() => setCopiedFixId(null), 1800);
                              }}
                              className="min-h-[32px] px-3 rounded-lg gilded-send-btn text-[11px] font-mono cursor-pointer"
                            >
                              {copiedFixId === ticket.id
                                ? '✓ Copied for Coding Agent!'
                                : '📋 Copy Ticket for Coding Agent'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sanctuary Media Vault Modal (Linked Phone Folder & IndexedDB Vault) */}
      {(isVaultOpen || currentView === 'vault') && (
        <VaultModal
          onClose={() => {
            setIsVaultOpen(false);
            if (currentView === 'vault') navigateToView('chat');
          }}
          onAttachItemToChat={(item) => {
            if (item.category === 'voice_clips') {
              const base64Data = item.dataUrl.split(',')[1] || '';
              setPendingVoiceDraft({
                transcript: item.description || item.filename,
                durationSec: 1,
                voiceAudio: {
                  data: base64Data,
                  mimeType: item.mimeType,
                  durationSec: 1,
                  filename: item.filename,
                },
              });
            } else {
              const base64Data = item.dataUrl.split(',')[1] || '';
              setAttachedImages((prev) => [
                ...prev,
                {
                  mimeType: item.mimeType,
                  data: base64Data,
                  name: item.filename,
                  description: item.description,
                  textContent: item.textContent,
                  size: item.size,
                  origin: 'vault',
                  vaultId: item.id,
                },
              ]);
            }
            setIsVaultOpen(false);
            if (currentView === 'vault') navigateToView('chat');
          }}
        />
      )}

      {/* Autonomous Heartbeat & Sleep-Watch Control Panel Modal */}
      {isHeartbeatModalOpen && (
        <AutonomousHeartbeatModal
          isOpen={isHeartbeatModalOpen}
          config={heartbeatConfig}
          onUpdateConfig={(next) => setHeartbeatConfig(next)}
          activityLog={pulseActivityLog}
          onClearLog={() => {
            savePulseActivityLog([]);
            setPulseActivityLog([]);
          }}
          onFirePulseNow={async () => {
            await triggerAutonomousArgonHeartbeat('manual');
          }}
          isFiringNow={isRunningHeartbeat}
          currentIdleCountdown={idleCountdownDisplay}
          idleMinutes={heartbeatConfig.idleMinutes}
          sessionPulseCount={triggeredInIdleWindowRef.current}
          onClose={() => setIsHeartbeatModalOpen(false)}
        />
      )}

      {/* Household Avatar Establishment Wizard Modal (Entity Selector, Circular Mask Crop/Zoom/Pan, AI Vision Description & Shared Repository) */}
      <HouseholdAvatarUploaderModal
        isOpen={isHouseholdAvatarUploaderOpen}
        onClose={() => setIsHouseholdAvatarUploaderOpen(false)}
        availableEntities={[
          { key: 'argon', name: 'Argon (Lead Host)' },
          ...staffAgents.map((a) => ({ key: a.id, name: a.name })),
        ]}
        onSetAvatar={(entityKey, dataUrl, title, description) => {
          if (entityKey === 'argon') {
            localStorage.setItem(STORAGE_KEYS.ARGON_AVATAR_MODE, dataUrl);
            setArgonAvatarMode(dataUrl as any);
          } else {
            handleUpdateStaffAgent(entityKey, {
              avatarPreset: dataUrl as any,
            });
          }
        }}
      />

      {/* Half-Screen Port Lite Chat Window (Auto-pops up on External Screen Capture so Hex can receive Argon's reply and talk about the screen without switching back) */}
      <PortLiteChatModal
        isOpen={isPortLiteChatOpen}
        onClose={() => setIsPortLiteChatOpen(false)}
        onExpandFullChat={() => {
          setIsPortLiteChatOpen(false);
          navigateToView('chat');
        }}
        screenThumbnail={portLiteScreenThumbnail}
        messages={messages}
        isSending={isSending}
        onSendMessage={async (text) => {
          await dispatchMessageToArgon(text, []);
        }}
        onSnapNewScreen={async () => {
          await handleCaptureExternalScreen(true);
        }}
        onToggleMic={() => void handleToggleMicRecording()}
        isRecordingMic={isRecordingMic}
      />

      {/* Draggable 48x48px Floating Circular Crimson Eye — ALWAYS Visible Everywhere (Main Chat, Sticker Drawer, and Every Modal / Room) */}
      <ArgonRoomCompanionBar
        isVisible={true}
        roomTitle={activeRoomInfo.title}
        argonAvatarMode={argonAvatarMode}
        argonAvatarDataUrl={getSlicedStickerDataUrl(argonAvatarMode)}
        latestReactionText={
          latestRoomArgonReaction ||
          messages
            .slice()
            .reverse()
            .find((m) => m.role === 'model' && !m.staffSender)?.text ||
          ''
        }
        isLoading={isSending || isRunningHeartbeat}
        onSendMessageInRoom={async (text, includeSnap) => {
          if (includeSnap) {
            const snapUrl = await captureLiveRoomSnapshotDataUrl({
              roomTitle: activeRoomInfo.title,
              roomSummaryText: activeRoomInfo.summaryText,
              parlorStateText: liveParlorStateSummary,
              whiteboardStrokes,
            });
            void dispatchMessageToArgon(
              `[In ${activeRoomInfo.title}] ${text}`,
              [],
              snapUrl
            );
          } else {
            void dispatchMessageToArgon(`[In ${activeRoomInfo.title}] ${text}`);
          }
        }}
        onSnapRoomForArgon={() => void handleSnapRoomForArgon()}
        onSnapTargetElement={handleSnapTargetElementForArgon}
        onReturnToChat={() => {
          setIsStickerStudioOpen(false);
          setIsWhiteboardMode(false);
          navigateToView('chat');
        }}
      />

      {/* Floating State Backup & Clear Chat Confirmation Toast */}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[92vw] sm:max-w-md px-4 py-2.5 rounded-2xl bg-[#161215]/95 border border-[#D4AF37] shadow-2xl backdrop-blur-md text-[#ffe5a3] font-mono text-xs flex items-center gap-2 pointer-events-none"
        >
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </aside>
      )}
      <OfflineIndicator />
    </div>
  );
}

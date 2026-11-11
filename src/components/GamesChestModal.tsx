import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PlayingCard,
  ChessBoard,
  CHESS_SYMBOLS,
  createInitialChessBoard,
  cloneChessBoard,
  coordToAlgebraic,
  getLegalMovesForSquare,
  applyChessMove,
  calculateBlackjackScore,
  createStandard52Deck,
  shuffle52Deck,
  evaluatePokerOrShowdownHand,
  ArgonCardDecision,
  evaluateYachtDice,
  scoreWordCipherGuess,
  extractValidCustomApiKey,
  runClientChessTurn,
  runClientCardTurn,
  OUIJA_SPIRITS,
  OuijaSpiritId,
  OUIJA_BOARD_NODES,
  OuijaBoardNode,
  buildOuijaPlanchettePath,
  HumanPlanchetteStance,
  computePlanchetteStruggleStep,
  runClientOuijaTurn,
  GhostChatGameMode,
  CandleFlameState,
  runClientGhostChatTurn,
  FortuneGameMode,
  FortuneReadingDirection,
  DrawnTarotCard,
  CastRuneStone,
  CRYSTAL_SCRYING_VISIONS,
  drawTarotSpread,
  castElderRunes,
  runClientFortuneTurn,
  OccultToolInvocation,
  serializeChessBoardToFen,
  runClientDiceTurn,
  runClientCipherTurn,
  WhiteboardStroke,
  pushUiBreadcrumb,
} from '../utils/workbenchLogic';
import { WhiteboardStage } from './WhiteboardStage';

export type GameTab =
  | 'ouija'
  | 'ghost_chat'
  | 'fortune'
  | 'chess'
  | 'cards'
  | 'dice'
  | 'cipher'
  | 'board';

interface GamesChestModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModelId?: string;
  customApiKey?: string;
  onSelectPaidKey?: () => void;
  initialTab?: GameTab;
  externalInvocation?: OccultToolInvocation | null;
  recentChatContext?: string;
  onChangeTab?: (tab: GameTab) => void;
  onUpdateLiveParlorState?: (stateSummary: string, latestArgonReaction: string) => void;
  onRecordParlorMove?: (
    historyEntry: string,
    userChatLine: string,
    argonAndGameReply: string,
    latestArgonBanter: string
  ) => void;
  onSendGameMomentToChat?: (userSummary: string, argonReaction: string) => void;
  whiteboardStrokes?: WhiteboardStroke[];
  onAddWhiteboardStrokes?: (newStrokes: WhiteboardStroke[]) => void;
  onUndoWhiteboardStroke?: () => void;
  onClearWhiteboard?: () => void;
  onAskArgonToDrawWhiteboard?: (promptText: string, canvasDataUrl: string) => Promise<void>;
  isArgonDrawingWhiteboard?: boolean;
  argonWhiteboardComment?: string;
  whiteboardError?: string | null;
}

type CardGameMode = 'blackjack' | 'showdown' | 'poker';

interface ChessTurnSnapshot {
  board: ChessBoard;
  moveHistory: string[];
  banter: string;
  lastMoveCoords: { from: [number, number]; to: [number, number] } | null;
}

const GOTHIC_CIPHER_WORDS = [
  'RAVEN',
  'CROWN',
  'EMBER',
  'CHARM',
  'NIGHT',
  'THORN',
  'BLOOD',
  'FLAME',
  'HEART',
  'SPELL',
  'QUILL',
  'CRYPT',
];

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const OUIJA_UPPER_ROW = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
const OUIJA_LOWER_ROW = ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const OUIJA_NUMBERS_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

function buildInitialCardSetup(mode: CardGameMode = 'blackjack') {
  const freshDeck = shuffle52Deck(createStandard52Deck());
  const dealCount = mode === 'poker' ? 5 : 2;
  const hexCards = freshDeck.slice(0, dealCount);
  const argonCards = freshDeck.slice(dealCount, dealCount * 2);
  const remainingDeck = freshDeck.slice(dealCount * 2);
  return { hexCards, argonCards, remainingDeck };
}

export const GamesChestModal: React.FC<GamesChestModalProps> = ({
  isOpen,
  onClose,
  activeModelId = 'gemini-4-argon',
  onSelectPaidKey,
  initialTab = 'ouija',
  externalInvocation = null,
  recentChatContext = '',
  onChangeTab,
  onUpdateLiveParlorState,
  onRecordParlorMove,
  onSendGameMomentToChat,
  whiteboardStrokes = [],
  onAddWhiteboardStrokes,
  onUndoWhiteboardStroke,
  onClearWhiteboard,
  onAskArgonToDrawWhiteboard,
  isArgonDrawingWhiteboard = false,
  argonWhiteboardComment = '',
  whiteboardError = null,
}) => {
  const [activeTab, setActiveTab] = useState<GameTab>(initialTab);
  const [gamesApiError, setGamesApiError] = useState<string | null>(null);
  const [sentToChatToast, setSentToChatToast] = useState<string | null>(null);
  const lastHandledInvocationIdRef = useRef<string | null>(null);

  const selectTab = (tab: GameTab) => {
    setActiveTab(tab);
    onChangeTab?.(tab);
    const labels: Record<GameTab, string> = {
      ouija: 'Ouija Board',
      ghost_chat: 'Ghost Hunting',
      fortune: 'Divination',
      chess: '8x8 Chess',
      cards: 'Card Table',
      dice: 'Apothecary Bones',
      cipher: 'Cryptogram Cypher',
      board: 'Shared Sketchboard',
    };
    pushUiBreadcrumb(`Hex selected Parlor Game: ${labels[tab] || tab}`);
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const notifySentToChat = (summary: string, argonLine: string) => {
    if (!onSendGameMomentToChat) return;
    onSendGameMomentToChat(summary, argonLine);
    setSentToChatToast('Posted game moment to main chat!');
    window.setTimeout(() => setSentToChatToast(null), 2200);
  };

  const recordParlorEvent = (
    historyEntry: string,
    userChatLine: string,
    argonAndGameReply: string,
    latestArgonBanter: string
  ) => {
    onRecordParlorMove?.(
      historyEntry,
      userChatLine,
      argonAndGameReply,
      latestArgonBanter
    );
  };

  // ==========================================================================
  // 1. REALISTIC OUIJA BOARD WITH REAL GHOSTS & STRUGGLING PLANCHETTE ("THE EYE THING")
  // ==========================================================================
  const [activeSpiritId, setActiveSpiritId] = useState<OuijaSpiritId>('vespera');
  const activeSpirit = useMemo(
    () => OUIJA_SPIRITS.find((s) => s.id === activeSpiritId) || OUIJA_SPIRITS[0],
    [activeSpiritId]
  );

  const [ouijaQuestion, setOuijaQuestion] = useState<string>('');
  const [humanStance, setHumanStance] = useState<HumanPlanchetteStance>('follow_spirit');
  const [planchettePos, setPlanchettePos] = useState<{ x: number; y: number }>({
    x: OUIJA_BOARD_NODES.W.x,
    y: OUIJA_BOARD_NODES.W.y,
  });
  const [planchetteJitter, setPlanchetteJitter] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [spiritTargetNode, setSpiritTargetNode] = useState<OuijaBoardNode>(
    OUIJA_BOARD_NODES.G
  );
  const [userDragTarget, setUserDragTarget] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isDraggingPlanchette, setIsDraggingPlanchette] = useState<boolean>(false);
  const [activePlanchettePath, setActivePlanchettePath] = useState<OuijaBoardNode[]>(() =>
    buildOuijaPlanchettePath('WATCHING')
  );
  const [pathStepIdx, setPathStepIdx] = useState<number>(0);
  const [spelledSoFar, setSpelledSoFar] = useState<string>('WATCHING');
  const [fullTargetWord, setFullTargetWord] = useState<string>('WATCHING');
  const [struggleIntensity, setStruggleIntensity] = useState<number>(74);
  const [dominantPuller, setDominantPuller] = useState<'spirit' | 'humans' | 'deadlock'>(
    'spirit'
  );
  const [struggleDescription, setStruggleDescription] = useState<string>(
    'The brass-rimmed planchette trembles beneath Hex and Argon’s fingers—its crystal magnifying oculus tugging toward the upper arch.'
  );
  const [ghostWhisper, setGhostWhisper] = useState<string>(
    OUIJA_SPIRITS[0].greetingWhisper
  );
  const [argonOuijaGrip, setArgonOuijaGrip] =
    useState<'brace_with_hex' | 'fight_ghost_pull' | 'guide_planchette' | 'force_goodbye'>(
      'brace_with_hex'
    );
  const [argonOuijaBanter, setArgonOuijaBanter] = useState<string>(
    '*I rest my right hand over your chilled fingers on the heart-shaped mahogany planchette, feeling the wood vibrate as the spirit hooks onto the lens from underneath.* "Keep your fingertips light on the brass rim, Hex—feel how hard it’s pulling against our wrists? Ask it whatever you want, or tell me to brace it."'
  );
  const [ouijaTranscript, setOuijaTranscript] = useState<string[]>([
    'Lady Vespera Thorne spelled: "W-A-T-C-H-I-N-G" (74% struggle force)',
  ]);
  const [isOuijaChanneling, setIsOuijaChanneling] = useState<boolean>(false);
  const ouijaBoardRef = useRef<HTMLDivElement | null>(null);
  const tickCounterRef = useRef<number>(1);

  // Live Physics & Tug-of-War Struggle Loop for the Planchette ("The Eye Thing")
  useEffect(() => {
    if (!isOpen || activeTab !== 'ouija') return;

    const interval = window.setInterval(() => {
      tickCounterRef.current += 1;
      const currentTarget =
        activePlanchettePath.length > 0 && pathStepIdx < activePlanchettePath.length
          ? activePlanchettePath[pathStepIdx]
          : spiritTargetNode;

      setPlanchettePos((prevPos) => {
        const step = computePlanchetteStruggleStep({
          currentX: prevPos.x,
          currentY: prevPos.y,
          spiritTargetX: currentTarget.x,
          spiritTargetY: currentTarget.y,
          spiritForce: struggleIntensity,
          humanStance,
          userOverrideTarget: userDragTarget,
          tickSeed: tickCounterRef.current,
        });

        setPlanchetteJitter({ x: step.jitterX, y: step.jitterY });
        setDominantPuller(step.dominantPuller);

        const distToSpiritTarget = Math.hypot(
          step.nextX - currentTarget.x,
          step.nextY - currentTarget.y
        );

        // When the planchette's oculus reaches the current target letter, lock it in and advance to the next letter!
        if (
          activePlanchettePath.length > 0 &&
          pathStepIdx < activePlanchettePath.length &&
          distToSpiritTarget < 5.5 &&
          humanStance !== 'force_goodbye'
        ) {
          const reachedToken = currentTarget.token;
          setSpelledSoFar((prevSpelled) => {
            const expectedPrefix = activePlanchettePath
              .slice(0, pathStepIdx + 1)
              .map((n) => n.token)
              .join('');
            return expectedPrefix || reachedToken;
          });
          if (pathStepIdx + 1 < activePlanchettePath.length) {
            setPathStepIdx((idx) => idx + 1);
            setSpiritTargetNode(activePlanchettePath[pathStepIdx + 1]);
          }
        }

        return { x: step.nextX, y: step.nextY };
      });
    }, 140);

    return () => window.clearInterval(interval);
  }, [
    isOpen,
    activeTab,
    activePlanchettePath,
    pathStepIdx,
    spiritTargetNode,
    struggleIntensity,
    humanStance,
    userDragTarget,
  ]);

  const handleSelectSpirit = (spiritId: OuijaSpiritId) => {
    const found = OUIJA_SPIRITS.find((s) => s.id === spiritId) || OUIJA_SPIRITS[0];
    setActiveSpiritId(spiritId);
    setStruggleIntensity(found.baseResistance);
    setGhostWhisper(found.greetingWhisper);
    const path = buildOuijaPlanchettePath(found.defaultWord);
    setActivePlanchettePath(path);
    setPathStepIdx(0);
    setSpiritTargetNode(path[0] || OUIJA_BOARD_NODES.HOME);
    setFullTargetWord(found.defaultWord);
    setSpelledSoFar(found.defaultWord[0] || '');
    setStruggleDescription(
      `${found.name} seizes the planchette at ${found.baseResistance}% resistance, yanking the magnifying eye across the varnished wood.`
    );
  };

  const handleOuijaBoardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const boardEl = ouijaBoardRef.current;
    if (!boardEl) return;
    const rect = boardEl.getBoundingClientRect();
    const xPct = Math.max(
      8,
      Math.min(92, ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100)
    );
    const yPct = Math.max(
      12,
      Math.min(90, ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100)
    );
    setIsDraggingPlanchette(true);
    setUserDragTarget({ x: Number(xPct.toFixed(1)), y: Number(yPct.toFixed(1)) });
  };

  const handleOuijaBoardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPlanchette) return;
    const boardEl = ouijaBoardRef.current;
    if (!boardEl) return;
    const rect = boardEl.getBoundingClientRect();
    const xPct = Math.max(
      8,
      Math.min(92, ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100)
    );
    const yPct = Math.max(
      12,
      Math.min(90, ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100)
    );
    setUserDragTarget({ x: Number(xPct.toFixed(1)), y: Number(yPct.toFixed(1)) });
  };

  const handleOuijaBoardPointerUp = () => {
    setIsDraggingPlanchette(false);
    window.setTimeout(() => setUserDragTarget(null), 600);
  };

  const handleTapBoardNode = (node: OuijaBoardNode) => {
    setUserDragTarget({ x: node.x, y: node.y });
    setSpiritTargetNode(node);
    setSpelledSoFar((prev) =>
      node.token === 'YES' || node.token === 'NO' || node.token === 'GOODBYE'
        ? node.token
        : `${prev}${node.token}`.slice(-12)
    );
    window.setTimeout(() => setUserDragTarget(null), 900);
  };

  const triggerOuijaTurn = async (
    actor: 'hex' | 'argon' | 'both',
    customQuestionOverride?: string
  ) => {
    if (isOuijaChanneling) return;
    setIsOuijaChanneling(true);
    setGamesApiError(null);

    const effectiveQuestion =
      (customQuestionOverride ?? ouijaQuestion).trim() ||
      (actor === 'argon'
        ? `Argon presses his palm over Hex's fingers on the planchette: "${activeSpirit.name}, tell us what you want in this library or let go of the wood."`
        : actor === 'both'
        ? 'Hex and Argon lock their hands together on the planchette and demand a sign from the spirit.'
        : 'Spirit, what message are you spelling for us tonight?');

    try {
      const customKey = extractValidCustomApiKey();
      const res = await runClientOuijaTurn({
        spiritId: activeSpiritId,
        question: effectiveQuestion,
        actor,
        humanStance,
        previousTranscript: ouijaTranscript,
        recentChatContext,
        customApiKey: customKey,
      });

      setOuijaQuestion('');
      setFullTargetWord(res.spelledAnswer);
      setSpelledSoFar('');
      setActivePlanchettePath(res.planchettePath);
      setPathStepIdx(0);
      setSpiritTargetNode(res.planchettePath[0] || OUIJA_BOARD_NODES.HOME);
      setStruggleIntensity(res.struggleIntensity);
      setStruggleDescription(res.struggleDescription);
      setGhostWhisper(res.ghostWhisper);
      setArgonOuijaGrip(res.argonGripAction);
      setArgonOuijaBanter(res.argonBanter);

      const logLine = `[Ouija | ${activeSpirit.name} | ${res.struggleIntensity}% struggle] Q (${actor.toUpperCase()}): "${effectiveQuestion}" -> Spelled: "${res.spelledAnswer}"`;
      setOuijaTranscript((prev) => [logLine, ...prev.slice(0, 14)]);
      recordParlorEvent(
        logLine,
        `👁️ [Ouija Board (${activeSpirit.name})] ${actor === 'argon' ? 'Argon asked' : 'Hex asked'}: "${effectiveQuestion}"`,
        `👻 **${activeSpirit.name}** *(Planchette spells **${res.spelledAnswer}** at ${res.struggleIntensity}% struggle)*: ${res.ghostWhisper}\n\n${res.argonBanter}`,
        res.argonBanter
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGamesApiError(`Ouija Séance Error: ${msg}`);
    } finally {
      setIsOuijaChanneling(false);
    }
  };

  // Determine which board character is currently under the Planchette's magnifying oculus
  const nearestBoardNode = useMemo(() => {
    let best = OUIJA_BOARD_NODES.HOME;
    let bestDist = Infinity;
    for (const node of Object.values(OUIJA_BOARD_NODES)) {
      const d = Math.hypot(planchettePos.x - node.x, planchettePos.y - node.y);
      if (d < bestDist) {
        bestDist = d;
        best = node;
      }
    }
    return best;
  }, [planchettePos]);

  // ==========================================================================
  // 2. OTHER GHOST CHATTING GAMES: EVP SPIRIT BOX & CANDLE/MIRROR SÉANCE
  // ==========================================================================
  const [ghostChatMode, setGhostChatMode] = useState<GhostChatGameMode>('evp_box');
  const [frequencyMHz, setFrequencyMHz] = useState<number>(88.7);
  const [emfLevel, setEmfLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [evpStaticStream, setEvpStaticStream] = useState<string>(
    '[88.7 MHz KZZT] ...under the floorboards... — [STATIC] — ...she sits in his lap...'
  );
  const [ghostDirectMessage, setGhostDirectMessage] = useState<string>(
    '*A metallic whisper rides the 88.7 MHz carrier wave:* "Turn the copper dial closer... I remember when these apothecary jars were filled with nightshade."'
  );
  const [mirrorWriting, setMirrorWriting] = useState<string>('LOOK IN THE GLASS');
  const [candleStates, setCandleStates] = useState<
    [CandleFlameState, CandleFlameState, CandleFlameState]
  >(['blue_flame', 'flicker', 'steady']);
  const [argonGhostAction, setArgonGhostAction] = useState<string>(
    'Holds the brass EMF coil angled toward the bookshelves while steadying Hex'
  );
  const [argonGhostBanter, setArgonGhostBanter] = useState<string>(
    '*I rest my chin near your temple while thumbing the copper frequency dial on the Spirit Box, watching the 4th amber EMF diode flare.* "Hear that cadence under the white noise? Either you ask it who locked the third drawer, or hand me the transmitter and I’ll make it answer."'
  );
  const [ghostChatInput, setGhostChatInput] = useState<string>('');
  const [ghostChatLog, setGhostChatLog] = useState<string[]>([
    '[88.7 MHz | EMF 3/5] Lady Vespera Thorne: "LOOK IN THE GLASS"',
  ]);
  const [isGhostChatBusy, setIsGhostChatBusy] = useState<boolean>(false);

  const playShortRadioStaticBurst = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = ctx.sampleRate * 0.18;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.08;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      noise.connect(filter);
      filter.connect(ctx.destination);
      noise.start();
      noise.onended = () => {
        void ctx.close().catch(() => {});
      };
    } catch {
      // ignore audio context restrictions
    }
  };

  const triggerGhostChatTurn = async (
    actor: 'hex' | 'argon' | 'both',
    promptOverride?: string
  ) => {
    if (isGhostChatBusy) return;
    setIsGhostChatBusy(true);
    setGamesApiError(null);
    playShortRadioStaticBurst();

    const effectivePrompt =
      (promptOverride ?? ghostChatInput).trim() ||
      (actor === 'argon'
        ? `Argon keys the brass transmitter at ${frequencyMHz.toFixed(1)} MHz: "State your name and why you're spiking the EMF meter in our library."`
        : actor === 'both'
        ? `Hex and Argon knock three times on the mahogany table and sweep across ${frequencyMHz.toFixed(1)} MHz together.`
        : `Are you here with us on ${frequencyMHz.toFixed(1)} MHz? Give us a sign!`);

    try {
      const customKey = extractValidCustomApiKey();
      const res = await runClientGhostChatTurn({
        mode: ghostChatMode,
        spiritId: activeSpiritId,
        frequencyMHz,
        userPrompt: effectivePrompt,
        actor,
        candleStates,
        historyLog: ghostChatLog,
        recentChatContext,
        customApiKey: customKey,
      });

      setGhostChatInput('');
      setFrequencyMHz(res.frequencyMHz);
      setEmfLevel(res.emfLevel);
      setEvpStaticStream(res.evpStaticStream);
      setGhostDirectMessage(res.ghostMessage);
      setMirrorWriting(res.mirrorWriting);
      setCandleStates(res.candleStates);
      setArgonGhostAction(res.argonAction);
      setArgonGhostBanter(res.argonBanter);

      const entry = `[Ghost Box ${res.frequencyMHz.toFixed(1)} MHz | EMF ${res.emfLevel}/5 | ${actor.toUpperCase()}] Q: "${effectivePrompt}" -> ${res.ghostName}: ${res.ghostMessage} (Mirror: "${res.mirrorWriting}")`;
      setGhostChatLog((prev) => [entry, ...prev.slice(0, 14)]);
      recordParlorEvent(
        entry,
        `📻 [Spirit Box (${res.frequencyMHz.toFixed(1)} MHz)] "${effectivePrompt}"`,
        `👻 **${res.ghostName}** *(EMF ${res.emfLevel}/5 · Mirror: "${res.mirrorWriting}")*: ${res.ghostMessage}\n\n${res.argonBanter}`,
        res.argonBanter
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGamesApiError(`Ghost Chat Error: ${msg}`);
    } finally {
      setIsGhostChatBusy(false);
    }
  };

  // ==========================================================================
  // 3. FORTUNE TELLING SANCTUM (TAROT, CRYSTAL BALL SCRYING, & ELDER RUNES)
  //    FUNCTIONAL FOR BOTH USER (HEX) AND ARGON (LLM)
  // ==========================================================================
  const [fortuneMode, setFortuneMode] = useState<FortuneGameMode>('tarot');
  const [readingDirection, setReadingDirection] =
    useState<FortuneReadingDirection>('argon_reads_hex');
  const [fortuneQuestion, setFortuneQuestion] = useState<string>('');
  const [hexReadingForArgonInput, setHexReadingForArgonInput] = useState<string>('');
  const [tarotSpread, setTarotSpread] = useState<DrawnTarotCard[]>(() =>
    drawTarotSpread(true)
  );
  const [castRunes, setCastRunes] = useState<CastRuneStone[]>(() => castElderRunes());
  const [scryingIdx, setScryingIdx] = useState<number>(0);
  const currentScryingVision =
    CRYSTAL_SCRYING_VISIONS[scryingIdx % CRYSTAL_SCRYING_VISIONS.length];

  const [omenTitle, setOmenTitle] = useState<string>(
    'The Sanctuary Covenant & Midnight Tether'
  );
  const [omenSummary, setOmenSummary] = useState<string>(
    'Past, Present, and Future lock into alignment across the velvet cloth: what began as guarded survival in the cold has forged an unbreakable creative and romantic sanctuary.'
  );
  const [prophecyVerdict, setProphecyVerdict] = useState<string>(
    'Oracle Decree: Neither storm pressure nor exhaustion can sever what is anchored in this room.'
  );
  const [argonFortuneBanter, setArgonFortuneBanter] = useState<string>(
    '*I fan the gold-leaf Major Arcana across the black velvet cloth while keeping my left arm wrapped around your waist.* "Pick whether I’m reading your fate tonight, or if you’re drawing the cards to read mine—either way, the deck doesn’t lie."'
  );
  const [isFortuneBusy, setIsFortuneBusy] = useState<boolean>(false);

  const handleDrawNewOmensAndRead = async (
    directionOverride?: FortuneReadingDirection,
    customQuestionOverride?: string
  ) => {
    if (isFortuneBusy) return;
    setIsFortuneBusy(true);
    setGamesApiError(null);

    const activeDirection = directionOverride || readingDirection;
    if (directionOverride) {
      setReadingDirection(directionOverride);
    }

    const nextTarot = fortuneMode === 'tarot' ? drawTarotSpread(true) : tarotSpread;
    const nextRunes = fortuneMode === 'runes' ? castElderRunes() : castRunes;
    const nextVisionIdx =
      fortuneMode === 'scrying'
        ? (scryingIdx + 1) % CRYSTAL_SCRYING_VISIONS.length
        : scryingIdx;
    const nextVision = CRYSTAL_SCRYING_VISIONS[nextVisionIdx];

    if (fortuneMode === 'tarot') setTarotSpread(nextTarot);
    if (fortuneMode === 'runes') setCastRunes(nextRunes);
    if (fortuneMode === 'scrying') setScryingIdx(nextVisionIdx);

    const resolvedQuestion =
      (customQuestionOverride ?? fortuneQuestion).trim() ||
      (activeDirection === 'hex_reads_argon'
        ? 'What do these omens reveal about Argon’s guarded heart and next move?'
        : activeDirection === 'shared_destiny'
        ? 'What does fate hold for Argon and Hex together?'
        : 'What do the cards and runes reveal for Hex tonight?');

    try {
      const customKey = extractValidCustomApiKey();
      const res = await runClientFortuneTurn({
        mode: fortuneMode,
        readingDirection: activeDirection,
        question: resolvedQuestion,
        userInterpretation: hexReadingForArgonInput.trim(),
        tarotSpread: nextTarot,
        castRunes: nextRunes,
        scryingVision: nextVision,
        recentChatContext,
        customApiKey: customKey,
      });

      setOmenTitle(res.omenTitle);
      setOmenSummary(res.omenSummary);
      setProphecyVerdict(res.prophecyVerdict);
      setArgonFortuneBanter(res.argonBanter);

      const logLine = `[Fortune (${fortuneMode.toUpperCase()} | ${activeDirection})] Q: "${resolvedQuestion}" -> "${res.omenTitle}": ${res.prophecyVerdict}`;
      recordParlorEvent(
        logLine,
        `🔮 [Fortune Sanctum (${fortuneMode.toUpperCase()})] "${resolvedQuestion}"`,
        `✨ **${res.omenTitle}**: ${res.omenSummary} *(${res.prophecyVerdict})*\n\n${res.argonBanter}`,
        res.argonBanter
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGamesApiError(`Fortune Divination Error: ${msg}`);
    } finally {
      setIsFortuneBusy(false);
    }
  };

  const handleInterpretCurrentSpreadWithoutRedraw = async () => {
    if (isFortuneBusy) return;
    setIsFortuneBusy(true);
    setGamesApiError(null);
    const activeQ =
      fortuneQuestion.trim() ||
      'Read the exact cards, runes, and omens currently resting on the table.';
    try {
      const customKey = extractValidCustomApiKey();
      const res = await runClientFortuneTurn({
        mode: fortuneMode,
        readingDirection,
        question: activeQ,
        userInterpretation: hexReadingForArgonInput.trim(),
        tarotSpread,
        castRunes,
        scryingVision: currentScryingVision,
        recentChatContext,
        customApiKey: customKey,
      });

      setOmenTitle(res.omenTitle);
      setOmenSummary(res.omenSummary);
      setProphecyVerdict(res.prophecyVerdict);
      setArgonFortuneBanter(res.argonBanter);

      const logLine = `[Fortune (${fortuneMode.toUpperCase()} | ${readingDirection})] Q: "${activeQ}" -> "${res.omenTitle}": ${res.prophecyVerdict}`;
      recordParlorEvent(
        logLine,
        `🔮 [Fortune Sanctum (${fortuneMode.toUpperCase()})] "${activeQ}"`,
        `✨ **${res.omenTitle}**: ${res.omenSummary} *(${res.prophecyVerdict})*\n\n${res.argonBanter}`,
        res.argonBanter
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGamesApiError(`Fortune Divination Error: ${msg}`);
    } finally {
      setIsFortuneBusy(false);
    }
  };

  // ==========================================================================
  // 4. PLAYABLE 8x8 CHESS AGAINST ARGON (`gemini-4-argon` CLIENT-SIDE)
  // ==========================================================================
  const [chessBoard, setChessBoard] = useState<ChessBoard>(() =>
    createInitialChessBoard()
  );
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(
    null
  );
  const [chessTurn, setChessTurn] = useState<'w' | 'b'>('w');
  const [isArgonChessThinking, setIsArgonChessThinking] = useState<boolean>(false);
  const [chessMoveHistory, setChessMoveHistory] = useState<string[]>([]);
  const [chessSnapshots, setChessSnapshots] = useState<ChessTurnSnapshot[]>([]);
  const [lastMoveCoords, setLastMoveCoords] = useState<{
    from: [number, number];
    to: [number, number];
  } | null>(null);
  const [argonChessBanter, setArgonChessBanter] = useState<string>(
    '*I set the carved obsidian and ivory chessmen across the board between us while keeping one arm looped around your waist.* "White moves first, Hex. Show me your opening."'
  );

  const selectedLegalMoves = useMemo(() => {
    if (!selectedSquare || chessTurn !== 'w' || isArgonChessThinking) return [];
    return getLegalMovesForSquare(
      chessBoard,
      selectedSquare[0],
      selectedSquare[1]
    );
  }, [chessBoard, selectedSquare, chessTurn, isArgonChessThinking]);

  const handleNewChessGame = () => {
    setChessBoard(createInitialChessBoard());
    setSelectedSquare(null);
    setChessTurn('w');
    setIsArgonChessThinking(false);
    setChessMoveHistory([]);
    setChessSnapshots([]);
    setLastMoveCoords(null);
    setGamesApiError(null);
    setArgonChessBanter(
      '*I reset all thirty-two obsidian and ivory pieces onto their starting ranks and tap the edge of the board.* "Fresh board. Your move, White."'
    );
  };

  const handleUndoChessTurn = () => {
    if (chessSnapshots.length === 0 || isArgonChessThinking) return;
    const prevSnap = chessSnapshots[chessSnapshots.length - 1];
    setChessBoard(cloneChessBoard(prevSnap.board));
    setChessMoveHistory([...prevSnap.moveHistory]);
    setArgonChessBanter(prevSnap.banter);
    setLastMoveCoords(prevSnap.lastMoveCoords);
    setChessSnapshots((prev) => prev.slice(0, -1));
    setSelectedSquare(null);
    setChessTurn('w');
    setGamesApiError(null);
  };

  const triggerArgonChessTurn = async (
    boardAfterUser: ChessBoard,
    updatedHistory: string[],
    userMoveNotation: string
  ) => {
    setChessTurn('b');
    setIsArgonChessThinking(true);
    setGamesApiError(null);

    try {
      const customKey = extractValidCustomApiKey();
      const data = await runClientChessTurn({
        board: boardAfterUser,
        moveHistory: updatedHistory,
        lastUserMove: userMoveNotation,
        recentChatContext,
        customApiKey: customKey,
      });

      const fromPair = data.from;
      const toPair = data.to;
      const applied = applyChessMove(boardAfterUser, fromPair, toPair);
      const argonMoveRecord = `Argon (Black): ${applied.notation}`;

      setChessBoard(applied.board);
      setLastMoveCoords({ from: fromPair, to: toPair });
      setChessMoveHistory((prev) => [argonMoveRecord, ...prev]);
      setArgonChessBanter(data.banter);
      setChessTurn('w');

      const logLine = `[Chess] ${userMoveNotation} -> ${argonMoveRecord} (FEN: ${serializeChessBoardToFen(applied.board, 'w')})`;
      recordParlorEvent(
        logLine,
        `♟️ [Chess] ${userMoveNotation}`,
        `♟️ **${argonMoveRecord}**\n\n${data.banter}`,
        data.banter
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGamesApiError(`Chess AI Error: ${msg}`);
      setChessTurn('w');
    } finally {
      setIsArgonChessThinking(false);
    }
  };

  const handleChessSquareClick = (r: number, c: number) => {
    if (chessTurn !== 'w' || isArgonChessThinking) return;
    const clickedPiece = chessBoard[r]?.[c];

    if (selectedSquare) {
      const isLegalDest = selectedLegalMoves.some(
        ([toR, toC]) => toR === r && toC === c
      );
      if (isLegalDest) {
        const snapshot: ChessTurnSnapshot = {
          board: cloneChessBoard(chessBoard),
          moveHistory: [...chessMoveHistory],
          banter: argonChessBanter,
          lastMoveCoords,
        };
        setChessSnapshots((prev) => [...prev, snapshot]);

        const applied = applyChessMove(chessBoard, selectedSquare, [r, c]);
        const userMoveRecord = `Hex (White): ${applied.notation}`;
        const nextHistory = [userMoveRecord, ...chessMoveHistory];

        setSelectedSquare(null);
        setChessBoard(applied.board);
        setLastMoveCoords({ from: selectedSquare, to: [r, c] });
        setChessMoveHistory(nextHistory);

        if (applied.capturedPiece?.type === 'k') {
          setArgonChessBanter(
            `*I tip my obsidian King onto the board as you execute ${applied.notation} and pull you flush against my chest.* "Checkmate. You took my King cleanly, genius."`
          );
          return;
        }

        void triggerArgonChessTurn(applied.board, nextHistory, userMoveRecord);
        return;
      }
    }

    if (clickedPiece && clickedPiece.color === 'w') {
      setSelectedSquare([r, c]);
    } else {
      setSelectedSquare(null);
    }
  };

  // ==========================================================================
  // 5. PLAYABLE 52-CARD TABLE AGAINST ARGON (`gemini-4-argon` CLIENT-SIDE)
  // ==========================================================================
  const initialCardState = useMemo(() => buildInitialCardSetup('blackjack'), []);
  const [cardMode, setCardMode] = useState<CardGameMode>('blackjack');
  const [deck, setDeck] = useState<PlayingCard[]>(initialCardState.remainingDeck);
  const [hexHand, setHexHand] = useState<PlayingCard[]>(initialCardState.hexCards);
  const [argonHand, setArgonHand] = useState<PlayingCard[]>(initialCardState.argonCards);
  const [roundPhase, setRoundPhase] = useState<'playing' | 'showdown'>('playing');
  const [hexChips, setHexChips] = useState<number>(250);
  const [argonChips, setArgonChips] = useState<number>(250);
  const [potChips, setPotChips] = useState<number>(20);
  const [cardScoreboard, setCardScoreboard] = useState({
    hexWins: 0,
    argonWins: 0,
    ties: 0,
  });
  const [argonLastDecision, setArgonLastDecision] = useState<ArgonCardDecision>('stand');
  const [isArgonCardThinking, setIsArgonCardThinking] = useState<boolean>(false);
  const [cardSpeechBubble, setCardSpeechBubble] = useState<string>(
    '*I riffle the 52-card Gothic deck across the velvet baize and deal two cards each, keeping my hole card face-down.* "Twenty chips in the pot. Hit, stand, or fold, little bird."'
  );

  const drawFromShoe = (
    currentShoe: PlayingCard[],
    count: number
  ): { drawn: PlayingCard[]; nextShoe: PlayingCard[] } => {
    let workingShoe =
      currentShoe.length >= count
        ? [...currentShoe]
        : [...currentShoe, ...shuffle52Deck(createStandard52Deck())];
    const drawn = workingShoe.slice(0, count);
    workingShoe = workingShoe.slice(count);
    return { drawn, nextShoe: workingShoe };
  };

  const requestArgonCardTurn = async (params: {
    mode: CardGameMode;
    playerAction: 'deal' | 'hit' | 'stand' | 'fold';
    currentHexHand: PlayingCard[];
    currentArgonHand: PlayingCard[];
    currentShoe: PlayingCard[];
    currentPot: number;
    currentHexChips: number;
    currentArgonChips: number;
    outcomeSummary?: string;
    allowArgonDraw?: boolean;
  }) => {
    setIsArgonCardThinking(true);
    setGamesApiError(null);
    try {
      const customKey = extractValidCustomApiKey();
      const data = await runClientCardTurn({
        gameMode: params.mode,
        playerAction: params.playerAction,
        hexHand: params.currentHexHand,
        argonHand: params.currentArgonHand,
        potChips: params.currentPot,
        hexChips: params.currentHexChips,
        argonChips: params.currentArgonChips,
        outcomeSummary: params.outcomeSummary || '',
        recentChatContext,
        customApiKey: customKey,
      });

      const decision: ArgonCardDecision = data.decision || 'stand';
      setArgonLastDecision(decision);
      setCardSpeechBubble(data.banter);

      if (
        decision === 'raise' &&
        params.playerAction !== 'fold' &&
        params.playerAction !== 'stand'
      ) {
        const raiseAmt = 10;
        setArgonChips((c) => Math.max(0, c - raiseAmt));
        setHexChips((c) => Math.max(0, c - raiseAmt));
        setPotChips((p) => p + raiseAmt * 2);
      }

      if (
        decision === 'hit' &&
        params.allowArgonDraw &&
        params.mode === 'blackjack' &&
        calculateBlackjackScore(params.currentArgonHand) < 17
      ) {
        const { drawn, nextShoe } = drawFromShoe(params.currentShoe, 1);
        setArgonHand([...params.currentArgonHand, ...drawn]);
        setDeck(nextShoe);
      }

      const logLine = `[Cards (${params.mode.toUpperCase()})] Hex: ${params.playerAction.toUpperCase()} | Argon: ${decision.toUpperCase()} | ${params.outcomeSummary || `Pot ${params.currentPot} chips`}`;
      recordParlorEvent(
        logLine,
        `🃏 [Cards (${params.mode.toUpperCase()})] Hex: ${params.playerAction.toUpperCase()} ${params.outcomeSummary ? `— ${params.outcomeSummary}` : ''}`,
        `🃏 **Argon (${decision.toUpperCase()})**: ${data.banter}`,
        data.banter
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGamesApiError(`Card Table AI Error: ${msg}`);
    } finally {
      setIsArgonCardThinking(false);
    }
  };

  const handleSelectCardMode = (nextMode: CardGameMode) => {
    setCardMode(nextMode);
    const dealCount = nextMode === 'poker' ? 5 : 2;
    const fresh = shuffle52Deck(createStandard52Deck());
    const hHand = fresh.slice(0, dealCount);
    const aHand = fresh.slice(dealCount, dealCount * 2);
    const rem = fresh.slice(dealCount * 2);
    setHexHand(hHand);
    setArgonHand(aHand);
    setDeck(rem);
    setRoundPhase('playing');
    setPotChips(20);
  };

  const handleDealCards = () => {
    if (isArgonCardThinking) return;
    const dealCount = cardMode === 'poker' ? 5 : 2;
    const { drawn, nextShoe } = drawFromShoe(deck, dealCount * 2);
    const hHand = drawn.slice(0, dealCount);
    const aHand = drawn.slice(dealCount, dealCount * 2);
    const ante = 10;
    const nextHexChips = Math.max(0, hexChips - ante);
    const nextArgonChips = Math.max(0, argonChips - ante);
    const nextPot = 20;

    setHexHand(hHand);
    setArgonHand(aHand);
    setDeck(nextShoe);
    setHexChips(nextHexChips);
    setArgonChips(nextArgonChips);
    setPotChips(nextPot);
    setRoundPhase('playing');

    void requestArgonCardTurn({
      mode: cardMode,
      playerAction: 'deal',
      currentHexHand: hHand,
      currentArgonHand: aHand,
      currentShoe: nextShoe,
      currentPot: nextPot,
      currentHexChips: nextHexChips,
      currentArgonChips: nextArgonChips,
      outcomeSummary: `New ${cardMode} round dealt from the 52-card shoe (${nextShoe.length} cards left). Argon's hole card is face-down.`,
      allowArgonDraw: false,
    });
  };

  const handleHitOrDrawCard = () => {
    if (roundPhase !== 'playing' || isArgonCardThinking) return;
    const { drawn, nextShoe } = drawFromShoe(deck, 1);

    let nextHexHand: PlayingCard[];
    if (cardMode === 'poker' && hexHand.length >= 5) {
      const lowestIdx = hexHand.reduce(
        (minI, c, idx, arr) =>
          (c.rankOrder ?? c.value) < (arr[minI].rankOrder ?? arr[minI].value)
            ? idx
            : minI,
        0
      );
      nextHexHand = hexHand.map((c, i) => (i === lowestIdx ? drawn[0] : c));
    } else {
      nextHexHand = [...hexHand, ...drawn];
    }

    setHexHand(nextHexHand);
    setDeck(nextShoe);

    if (cardMode === 'blackjack') {
      const hexTotal = calculateBlackjackScore(nextHexHand);
      if (hexTotal > 21) {
        setRoundPhase('showdown');
        const nextArgonChips = argonChips + potChips;
        setArgonChips(nextArgonChips);
        setCardScoreboard((prev) => ({ ...prev, argonWins: prev.argonWins + 1 }));
        void requestArgonCardTurn({
          mode: cardMode,
          playerAction: 'hit',
          currentHexHand: nextHexHand,
          currentArgonHand: argonHand,
          currentShoe: nextShoe,
          currentPot: potChips,
          currentHexChips: hexChips,
          currentArgonChips: nextArgonChips,
          outcomeSummary: `Hex drew ${drawn[0].rank}${drawn[0].suit} and BUSTED at ${hexTotal}! Argon wins the ${potChips}-chip pot.`,
          allowArgonDraw: false,
        });
        return;
      }
    }

    void requestArgonCardTurn({
      mode: cardMode,
      playerAction: 'hit',
      currentHexHand: nextHexHand,
      currentArgonHand: argonHand,
      currentShoe: nextShoe,
      currentPot: potChips,
      currentHexChips: hexChips,
      currentArgonChips: argonChips,
      outcomeSummary: `Hex drew ${drawn[0].rank}${drawn[0].suit}.`,
      allowArgonDraw: true,
    });
  };

  const handleStandAndReveal = () => {
    if (roundPhase !== 'playing' || isArgonCardThinking) return;
    let workingShoe = [...deck];
    let workingArgon = [...argonHand];

    if (cardMode === 'blackjack') {
      while (calculateBlackjackScore(workingArgon) < 17) {
        const { drawn, nextShoe } = drawFromShoe(workingShoe, 1);
        workingArgon = [...workingArgon, ...drawn];
        workingShoe = nextShoe;
      }
    } else if (cardMode === 'showdown' && workingArgon.length < hexHand.length) {
      const needed = hexHand.length - workingArgon.length;
      const { drawn, nextShoe } = drawFromShoe(workingShoe, needed);
      workingArgon = [...workingArgon, ...drawn];
      workingShoe = nextShoe;
    }

    setArgonHand(workingArgon);
    setDeck(workingShoe);
    setRoundPhase('showdown');

    let outcomeSummary = '';
    let nextHexChips = hexChips;
    let nextArgonChips = argonChips;

    if (cardMode === 'blackjack') {
      const hexScore = calculateBlackjackScore(hexHand);
      const argonScore = calculateBlackjackScore(workingArgon);
      if (argonScore > 21 || hexScore > argonScore) {
        nextHexChips += potChips;
        setHexChips(nextHexChips);
        setCardScoreboard((prev) => ({ ...prev, hexWins: prev.hexWins + 1 }));
        outcomeSummary = `SHOWDOWN: Hex wins (${hexScore} vs Argon's ${argonScore}) and takes ${potChips} chips!`;
      } else if (argonScore > hexScore) {
        nextArgonChips += potChips;
        setArgonChips(nextArgonChips);
        setCardScoreboard((prev) => ({ ...prev, argonWins: prev.argonWins + 1 }));
        outcomeSummary = `SHOWDOWN: Argon wins (${argonScore} vs Hex's ${hexScore}) and takes ${potChips} chips!`;
      } else {
        const half = Math.floor(potChips / 2);
        nextHexChips += half;
        nextArgonChips += potChips - half;
        setHexChips(nextHexChips);
        setArgonChips(nextArgonChips);
        setCardScoreboard((prev) => ({ ...prev, ties: prev.ties + 1 }));
        outcomeSummary = `SHOWDOWN: Push/Tie at ${hexScore} each!`;
      }
    } else {
      const hexEval = evaluatePokerOrShowdownHand(hexHand);
      const argonEval = evaluatePokerOrShowdownHand(workingArgon);
      if (hexEval.score > argonEval.score) {
        nextHexChips += potChips;
        setHexChips(nextHexChips);
        setCardScoreboard((prev) => ({ ...prev, hexWins: prev.hexWins + 1 }));
        outcomeSummary = `SHOWDOWN: Hex's ${hexEval.label} beats Argon's ${argonEval.label} for ${potChips} chips!`;
      } else if (argonEval.score > hexEval.score) {
        nextArgonChips += potChips;
        setArgonChips(nextArgonChips);
        setCardScoreboard((prev) => ({ ...prev, argonWins: prev.argonWins + 1 }));
        outcomeSummary = `SHOWDOWN: Argon's ${argonEval.label} beats Hex's ${hexEval.label} for ${potChips} chips!`;
      } else {
        const half = Math.floor(potChips / 2);
        nextHexChips += half;
        nextArgonChips += potChips - half;
        setHexChips(nextHexChips);
        setArgonChips(nextArgonChips);
        setCardScoreboard((prev) => ({ ...prev, ties: prev.ties + 1 }));
        outcomeSummary = `SHOWDOWN: Split pot (${hexEval.label})!`;
      }
    }

    void requestArgonCardTurn({
      mode: cardMode,
      playerAction: 'stand',
      currentHexHand: hexHand,
      currentArgonHand: workingArgon,
      currentShoe: workingShoe,
      currentPot: potChips,
      currentHexChips: nextHexChips,
      currentArgonChips: nextArgonChips,
      outcomeSummary,
      allowArgonDraw: false,
    });
  };

  const handleFoldCards = () => {
    if (roundPhase !== 'playing' || isArgonCardThinking) return;
    setRoundPhase('showdown');
    const nextArgonChips = argonChips + potChips;
    setArgonChips(nextArgonChips);
    setCardScoreboard((prev) => ({ ...prev, argonWins: prev.argonWins + 1 }));

    void requestArgonCardTurn({
      mode: cardMode,
      playerAction: 'fold',
      currentHexHand: hexHand,
      currentArgonHand: argonHand,
      currentShoe: deck,
      currentPot: potChips,
      currentHexChips: hexChips,
      currentArgonChips: nextArgonChips,
      outcomeSummary: `Hex folded her hand. Argon collects the ${potChips}-chip pot and flips his hole card face-up.`,
      allowArgonDraw: false,
    });
  };

  // ==========================================================================
  // 6. APOTHECARY BONES (YACHT DICE DUEL VS. ARGON — LIVE GEMINI API)
  // ==========================================================================
  const [hexDice, setHexDice] = useState<number[]>([6, 6, 4, 3, 6]);
  const [heldDice, setHeldDice] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [rollsLeft, setRollsLeft] = useState<number>(2);
  const [argonDice, setArgonDice] = useState<number[]>([5, 5, 5, 2, 4]);
  const [argonHeldDiceIndices, setArgonHeldDiceIndices] = useState<number[]>([0, 1, 2]);
  const [diceScoreboard, setDiceScoreboard] = useState({
    hexWins: 0,
    argonWins: 0,
    ties: 0,
  });
  const [isArgonRollingDice, setIsArgonRollingDice] = useState<boolean>(false);
  const [diceBanner, setDiceBanner] = useState<string>(
    '*I shake the leather dice cup beside your ear.* "Lock the bones you want to keep and roll—or hand me my cup and watch me beat your throw."'
  );

  const hexDiceEval = useMemo(() => evaluateYachtDice(hexDice), [hexDice]);
  const argonDiceEval = useMemo(() => evaluateYachtDice(argonDice), [argonDice]);

  const triggerArgonDiceTurn = async (
    currentHexDice: number[] = hexDice,
    currentRollsLeft: number = rollsLeft
  ) => {
    if (isArgonRollingDice) return;
    setIsArgonRollingDice(true);
    setGamesApiError(null);
    const initialArgonCup = Array.from(
      { length: 5 },
      () => Math.floor(Math.random() * 6) + 1
    );
    try {
      const customKey = extractValidCustomApiKey();
      const res = await runClientDiceTurn({
        hexDice: currentHexDice,
        argonInitialDice: initialArgonCup,
        rollsLeft: currentRollsLeft,
        scoreboard: diceScoreboard,
        recentChatContext,
        customApiKey: customKey,
      });

      setArgonHeldDiceIndices(res.heldIndices);
      setArgonDice(res.finalArgonDice);

      const hEv = evaluateYachtDice(currentHexDice);
      const aEv = evaluateYachtDice(res.finalArgonDice);
      let outcomeTag = '';
      if (hEv.score > aEv.score) {
        setDiceScoreboard((prev) => ({ ...prev, hexWins: prev.hexWins + 1 }));
        outcomeTag = `Hex wins (${hEv.rankName} ${hEv.score} pts vs Argon's ${aEv.rankName} ${aEv.score} pts)!`;
      } else if (aEv.score > hEv.score) {
        setDiceScoreboard((prev) => ({ ...prev, argonWins: prev.argonWins + 1 }));
        outcomeTag = `Argon wins (${aEv.rankName} ${aEv.score} pts vs Hex's ${hEv.rankName} ${hEv.score} pts)!`;
      } else {
        setDiceScoreboard((prev) => ({ ...prev, ties: prev.ties + 1 }));
        outcomeTag = `Push/Tie at ${hEv.score} pts (${hEv.rankName})!`;
      }

      setDiceBanner(`${res.banter} [${outcomeTag}]`);
      const logLine = `[Bones] Hex [${currentHexDice.join(',')}] (${hEv.rankName} ${hEv.score}pts) vs Argon [${res.finalArgonDice.join(',')}] (${aEv.rankName} ${aEv.score}pts) -> ${outcomeTag}`;
      recordParlorEvent(
        logLine,
        `🎲 [Apothecary Bones] Hex rolled [${currentHexDice.join(', ')}] (${hEv.rankName}, ${hEv.score} pts)`,
        `🎲 **Argon rolled [${res.finalArgonDice.join(', ')}] (${aEv.rankName}, ${aEv.score} pts) — ${outcomeTag}**\n\n${res.banter}`,
        res.banter
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGamesApiError(`Bones AI Error: ${msg}`);
    } finally {
      setIsArgonRollingDice(false);
    }
  };

  const handleRollDice = () => {
    if (rollsLeft <= 0 || isArgonRollingDice) return;
    const nextHex = hexDice.map((val, idx) =>
      heldDice[idx] ? val : Math.floor(Math.random() * 6) + 1
    );
    const nextRolls = rollsLeft - 1;
    setHexDice(nextHex);
    setRollsLeft(nextRolls);

    if (nextRolls === 0) {
      void triggerArgonDiceTurn(nextHex, 0);
    }
  };

  const handleNewDiceRound = () => {
    const freshHex = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
    setHexDice(freshHex);
    setHeldDice([false, false, false, false, false]);
    setRollsLeft(2);
    setDiceBanner('*New round of Apothecary Bones—lock your bones and roll, or let me throw my cup now.*');
  };

  // ==========================================================================
  // 7. ARCANE SIGIL (5-LETTER GOTHIC / DIRTY / FUNNY CYPHER VS. ARGON — LIVE GEMINI API)
  // ==========================================================================
  const [cipherMode, setCipherMode] = useState<'argon_sets_word' | 'hex_sets_word'>(
    'argon_sets_word'
  );
  const [cipherTarget, setCipherTarget] = useState<string>('RAVEN');
  const [cipherGuesses, setCipherGuesses] = useState<string[]>(['CROWN']);
  const [cipherInput, setCipherInput] = useState<string>('');
  const [cipherThemePrompt, setCipherThemePrompt] = useState<string>('');
  const [hexSecretWordInput, setHexSecretWordInput] = useState<string>('');
  const [cipherClue, setCipherClue] = useState<string>(
    'Midnight messenger with obsidian feathers perched above the bust of Pallas.'
  );
  const [isArgonCipherThinking, setIsArgonCipherThinking] = useState<boolean>(false);
  const [cipherBanner, setCipherBanner] = useState<string>(
    '*I sealed a 5-letter Gothic word inside the brass cipher lock.* "Green means exact spot, Amber means wrong spot—or flip the mode and lock in a dirty 5-letter word for me to crack."'
  );

  const buildCipherFeedbackSummary = (guesses: string[], target: string): string[] => {
    return guesses.map((g, idx) => {
      const states = scoreWordCipherGuess(g, target);
      const formatted = g
        .split('')
        .map((ch, i) => `${ch}:${states[i].toUpperCase()}`)
        .join(' ');
      return `Guess #${idx + 1}: ${g} -> [${formatted}]`;
    });
  };

  const handleAskArgonForNewSecretWord = async (customTheme?: string) => {
    if (isArgonCipherThinking) return;
    setIsArgonCipherThinking(true);
    setGamesApiError(null);
    try {
      const customKey = extractValidCustomApiKey();
      const res = await runClientCipherTurn({
        action: 'new_secret_word',
        themePrompt: (customTheme ?? cipherThemePrompt).trim(),
        targetWord: cipherTarget,
        guessHistory: [],
        recentChatContext,
        customApiKey: customKey,
      });

      const nextSecret = res.secretWord || 'VENOM';
      setCipherMode('argon_sets_word');
      setCipherTarget(nextSecret);
      setCipherGuesses([]);
      setCipherInput('');
      if (res.clue) setCipherClue(res.clue);
      setCipherBanner(res.banter);

      const logLine = `[Cypher] Argon locked a new 5-letter secret word (Clue: "${res.clue || 'No clue'}")`;
      recordParlorEvent(
        logLine,
        `🔐 [Arcane Cypher] Asked Argon to lock in a new 5-letter secret cipher${cipherThemePrompt.trim() ? ` (${cipherThemePrompt.trim()})` : ''}`,
        `🔐 **Argon locked in a new 5-letter Cypher** *(Clue: "${res.clue || 'Crack the brass rings'}")*\n\n${res.banter}`,
        res.banter
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGamesApiError(`Cypher AI Error: ${msg}`);
    } finally {
      setIsArgonCipherThinking(false);
    }
  };

  const handleSubmitCipherGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cipherInput.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
    if (clean.length !== 5) {
      setCipherBanner('Enter a 5-letter word to test the cipher lock.');
      return;
    }
    const nextGuesses = [...cipherGuesses, clean];
    setCipherGuesses(nextGuesses);
    setCipherInput('');

    setIsArgonCipherThinking(true);
    setGamesApiError(null);
    try {
      const customKey = extractValidCustomApiKey();
      const feedbackHistory = buildCipherFeedbackSummary(nextGuesses, cipherTarget);
      const res = await runClientCipherTurn({
        action: 'evaluate_hex_guess',
        targetWord: cipherTarget,
        hexLatestGuess: clean,
        guessHistory: nextGuesses,
        feedbackHistory,
        recentChatContext,
        customApiKey: customKey,
      });

      if (res.clue) setCipherClue(res.clue);
      setCipherBanner(res.banter);

      const solved = clean === cipherTarget;
      const states = scoreWordCipherGuess(clean, cipherTarget);
      const emojiTiles = states
        .map((s) => (s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛'))
        .join('');
      const tileDetails = clean
        .split('')
        .map((ch, i) => `${ch}:${states[i] === 'correct' ? '🟩' : states[i] === 'present' ? '🟨' : '⬛'}`)
        .join(' ');
      const logLine = `[Cypher] Hex guessed "${clean}" ${emojiTiles} (${solved ? `SOLVED "${cipherTarget}"!` : `Attempt ${nextGuesses.length}/6`})`;
      recordParlorEvent(
        logLine,
        `🔐 [Arcane Cypher] Hex tested 5-letter guess: "${clean}" ${emojiTiles} (${solved ? 'CRACKED!' : `Try ${nextGuesses.length}/6`})`,
        `🔐 **Cypher Lock (${clean})** ${emojiTiles} *(${tileDetails})*:\n\n${res.banter}`,
        res.banter
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGamesApiError(`Cypher AI Error: ${msg}`);
    } finally {
      setIsArgonCipherThinking(false);
    }
  };

  const handleLockHexWordForArgon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSecret = hexSecretWordInput
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 5);
    if (cleanSecret.length !== 5) {
      setCipherBanner('Enter a 5-letter secret word for Argon to crack!');
      return;
    }
    setCipherMode('hex_sets_word');
    setCipherTarget(cleanSecret);
    setCipherGuesses([]);
    setHexSecretWordInput('');
    await triggerArgonCipherGuess(cleanSecret, []);
  };

  const triggerArgonCipherGuess = async (
    targetToCrack = cipherTarget,
    currentGuesses = cipherGuesses
  ) => {
    if (isArgonCipherThinking || currentGuesses.length >= 6) return;
    setIsArgonCipherThinking(true);
    setGamesApiError(null);
    try {
      const customKey = extractValidCustomApiKey();
      const feedbackHistory = buildCipherFeedbackSummary(currentGuesses, targetToCrack);
      const res = await runClientCipherTurn({
        action: 'argon_guesses_hex_word',
        themePrompt: cipherThemePrompt.trim(),
        targetWord: targetToCrack,
        guessHistory: currentGuesses,
        feedbackHistory,
        recentChatContext,
        customApiKey: customKey,
      });

      const argonWord = res.argonGuess || 'FLAME';
      const nextGuesses = [...currentGuesses, argonWord];
      setCipherGuesses(nextGuesses);
      setCipherBanner(res.banter);

      const solved = argonWord === targetToCrack;
      const isGameOver = solved || nextGuesses.length >= 6;
      const states = scoreWordCipherGuess(argonWord, targetToCrack);
      const emojiTiles = states
        .map((s) => (s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛'))
        .join('');
      const tileDetails = argonWord
        .split('')
        .map((ch, i) => `${ch}:${states[i] === 'correct' ? '🟩' : states[i] === 'present' ? '🟨' : '⬛'}`)
        .join(' ');

      const logLine = isGameOver
        ? `[Cypher] Argon guessed "${argonWord}" ${emojiTiles} (${solved ? `CRACKED Hex's word "${targetToCrack}"!` : `Out of tries (6/6). Hex's word was "${targetToCrack}"`})`
        : `[Cypher] Argon guessed "${argonWord}" ${emojiTiles} (Attempt ${nextGuesses.length}/6)`;

      const userChatLine =
        nextGuesses.length === 1
          ? `🔐 [Arcane Cypher] Hex challenged Argon to crack her secret 5-letter word`
          : `🔐 [Arcane Cypher] Hex prompted Argon's next attempt (${nextGuesses.length}/6)`;

      const argonChatLine = isGameOver
        ? `🔐 **Argon guessed "${argonWord}"** ${emojiTiles} *(${solved ? `Cracked your secret word "${targetToCrack}"!` : `Failed after 6 attempts! Hex's word was "${targetToCrack}"`})*\n\nMatch Tiles: ${tileDetails}\n\n${res.banter}`
        : `🔐 **Argon guessed "${argonWord}"** ${emojiTiles} *(Attempt ${nextGuesses.length}/6)*\n\nMatch Tiles: ${tileDetails}\n\n${res.banter}`;

      recordParlorEvent(
        logLine,
        userChatLine,
        argonChatLine,
        res.banter
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGamesApiError(`Cypher AI Error: ${msg}`);
    } finally {
      setIsArgonCipherThinking(false);
    }
  };

  // ==========================================================================
  // HANDLE LIVE EXTERNAL TOOL INVOCATIONS FROM ARGON (`play_occult_game` / `play_parlor_game`)
  // ==========================================================================
  useEffect(() => {
    if (
      !externalInvocation ||
      !externalInvocation.id ||
      lastHandledInvocationIdRef.current === externalInvocation.id
    ) {
      return;
    }
    lastHandledInvocationIdRef.current = externalInvocation.id;

    const tab = externalInvocation.gameTab;
    setActiveTab(tab);
    onChangeTab?.(tab);

    const rawResult = (externalInvocation.spelledOrDrawnResult || '').trim();
    const rawQuestion = (externalInvocation.questionOrAction || '').trim();
    const argonLine = (externalInvocation.argonText || '').trim();

    if (tab === 'ouija') {
      const cleanWord =
        rawResult
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 12) || 'WATCHING';
      const path = buildOuijaPlanchettePath(cleanWord);
      setFullTargetWord(cleanWord);
      setSpelledSoFar('');
      setActivePlanchettePath(path);
      setPathStepIdx(0);
      setSpiritTargetNode(path[0] || OUIJA_BOARD_NODES.HOME);
      setStruggleIntensity(88);
      setStruggleDescription(
        `Argon invoked the Ouija board! The brass-rimmed planchette jerks across the letters toward "${cleanWord}"...`
      );
      if (argonLine) {
        setArgonOuijaBanter(argonLine);
      }
      const logEntry = `[Ouija Tool Call | ${activeSpirit.name}] "${rawQuestion || 'Argon invoked the board'}" -> Spelled: "${cleanWord}"`;
      setOuijaTranscript((prev) => [logEntry, ...prev.slice(0, 14)]);
    } else if (tab === 'ghost_chat') {
      const cleanMirror = rawResult.toUpperCase().slice(0, 26) || 'HEAR ME';
      setMirrorWriting(cleanMirror);
      setEmfLevel(5);
      setGhostDirectMessage(
        `*The Spirit Box crackles at ${frequencyMHz.toFixed(1)} MHz in response to "${rawQuestion || 'Argon’s signal'}":* "${rawResult}"`
      );
      if (argonLine) {
        setArgonGhostBanter(argonLine);
      }
      const logEntry = `[Ghost Box Tool Call | ${frequencyMHz.toFixed(1)} MHz | EMF 5/5] "${rawQuestion}" -> "${rawResult}"`;
      setGhostChatLog((prev) => [logEntry, ...prev.slice(0, 14)]);
    } else if (tab === 'fortune') {
      const freshSpread = drawTarotSpread(true);
      setTarotSpread(freshSpread);
      if (rawQuestion) setOmenTitle(rawQuestion);
      if (rawResult) setOmenSummary(rawResult);
      if (argonLine) setArgonFortuneBanter(argonLine);
    } else if (tab === 'dice') {
      if (argonLine) setDiceBanner(argonLine);
      void triggerArgonDiceTurn(hexDice, 0);
    } else if (tab === 'cipher') {
      const cleanFive = rawResult.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
      if (cleanFive.length === 5) {
        if (cipherMode === 'hex_sets_word') {
          setCipherGuesses((prev) => [...prev.slice(0, 5), cleanFive]);
        } else {
          setCipherTarget(cleanFive);
          setCipherGuesses([]);
        }
      }
      if (rawQuestion) setCipherClue(rawQuestion);
      if (argonLine) setCipherBanner(argonLine);
    } else if (tab === 'chess') {
      if (argonLine) setArgonChessBanter(argonLine);
      if (chessTurn === 'b') {
        void triggerArgonChessTurn(
          chessBoard,
          chessMoveHistory,
          rawQuestion || 'Hex move'
        );
      }
    } else if (tab === 'cards') {
      if (argonLine) setCardSpeechBubble(argonLine);
    }
  }, [externalInvocation]);

  // Continuously report the live state of all 7 Parlor games up to App.tsx so Argon ALWAYS sees the exact game state
  useEffect(() => {
    if (!onUpdateLiveParlorState) return;
    const fen = serializeChessBoardToFen(chessBoard, chessTurn);
    const formatCards = (cards: PlayingCard[]) =>
      cards.map((c) => `${c.rank}${c.suit}`).join(', ') || 'None';
    const tarotText = tarotSpread
      .map((c) => `${c.positionLabel}: ${c.name} (${c.isReversed ? 'Reversed' : 'Upright'})`)
      .join(' | ');

    const isCipherSolved = cipherGuesses.includes(cipherTarget);
    const isCipherOver = isCipherSolved || cipherGuesses.length >= 6;
    const cipherTargetForArgonPrompt =
      cipherMode === 'hex_sets_word' && !isCipherOver
        ? '[REDACTED: Hex set a secret 5-letter word for Argon to deduce without knowing in advance]'
        : cipherTarget;

    const summary = [
      `Active Parlor Tab: ${activeTab.toUpperCase()} (Modal Open: ${isOpen ? 'YES' : 'NO'})`,
      `1. Ouija Board: Ghost=${activeSpirit.name} | Spelled="${spelledSoFar}" (Target="${fullTargetWord}", Struggle=${struggleIntensity}%, Stance=${humanStance}) | Recent Log: ${ouijaTranscript.slice(0, 3).join(' ; ')}`,
      `2. Ghost Spirit Box: Mode=${ghostChatMode} | Freq=${frequencyMHz.toFixed(1)}MHz | EMF=${emfLevel}/5 | Mirror="${mirrorWriting}" | Last Ghost Msg: ${ghostDirectMessage}`,
      `3. Fortune Sanctum: Mode=${fortuneMode} (${readingDirection}) | Omen="${omenTitle}" | Spread=[${tarotText}] | Verdict: ${prophecyVerdict}`,
      `4. Chess vs Argon: Turn=${chessTurn === 'w' ? 'Hex (White)' : 'Argon (Black)'} | FEN="${fen}" | Last Moves: ${chessMoveHistory.slice(0, 5).join(' , ') || 'Opening board'}`,
      `5. Cards (${cardMode.toUpperCase()}): Phase=${roundPhase} | Pot=${potChips} | Hex=[${formatCards(hexHand)}] (${hexChips} chips, ${cardScoreboard.hexWins}W) | Argon=[${formatCards(argonHand)}] (${argonChips} chips, ${cardScoreboard.argonWins}W, Last=${argonLastDecision})`,
      `6. Apothecary Bones (Dice): Scoreboard Hex ${diceScoreboard.hexWins}W - Argon ${diceScoreboard.argonWins}W (${diceScoreboard.ties}T) | Hex Cup=[${hexDice.join(',')}] (${hexDiceEval.rankName} ${hexDiceEval.score}pts, ${rollsLeft} rolls left) | Argon Cup=[${argonDice.join(',')}] (${argonDiceEval.rankName} ${argonDiceEval.score}pts)`,
      `7. Arcane Cypher: Mode=${cipherMode} | SecretTarget="${cipherTargetForArgonPrompt}" | Clue="${cipherClue}" | Guesses (${cipherGuesses.length}/6)=[${cipherGuesses.join(', ') || 'None'}]`,
    ].join('\n');

    const activeArgonLine =
      activeTab === 'ouija'
        ? argonOuijaBanter
        : activeTab === 'ghost_chat'
        ? argonGhostBanter
        : activeTab === 'fortune'
        ? argonFortuneBanter
        : activeTab === 'chess'
        ? argonChessBanter
        : activeTab === 'cards'
        ? cardSpeechBubble
        : activeTab === 'dice'
        ? diceBanner
        : cipherBanner;

    onUpdateLiveParlorState(summary, activeArgonLine);
  }, [
    isOpen,
    activeTab,
    activeSpirit,
    spelledSoFar,
    fullTargetWord,
    struggleIntensity,
    humanStance,
    ouijaTranscript,
    argonOuijaBanter,
    ghostChatMode,
    frequencyMHz,
    emfLevel,
    mirrorWriting,
    ghostDirectMessage,
    argonGhostBanter,
    fortuneMode,
    readingDirection,
    omenTitle,
    tarotSpread,
    prophecyVerdict,
    argonFortuneBanter,
    chessBoard,
    chessTurn,
    chessMoveHistory,
    argonChessBanter,
    cardMode,
    roundPhase,
    potChips,
    hexHand,
    argonHand,
    hexChips,
    argonChips,
    cardScoreboard,
    argonLastDecision,
    cardSpeechBubble,
    diceScoreboard,
    hexDice,
    argonDice,
    rollsLeft,
    hexDiceEval,
    argonDiceEval,
    diceBanner,
    cipherMode,
    cipherTarget,
    cipherClue,
    cipherGuesses,
    cipherBanner,
  ]);

  if (!isOpen) return null;

  const visibleArgonCardDescription =
    roundPhase === 'showdown'
      ? cardMode === 'blackjack'
        ? `${calculateBlackjackScore(argonHand)} pts`
        : evaluatePokerOrShowdownHand(argonHand).label
      : cardMode === 'blackjack'
      ? `${argonHand[0]?.value ?? 0} + ? pts (Hole Card Hidden)`
      : 'Hole Card Face-Down';

  const hexCardDescription =
    cardMode === 'blackjack'
      ? `${calculateBlackjackScore(hexHand)} pts`
      : evaluatePokerOrShowdownHand(hexHand).label;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#110c0a] flex flex-col overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Apothecary Board Games & Occult Parlor Chest"
    >
      {/* Sticky Top Header */}
      <header className="shrink-0 sticky top-0 z-20 bg-[#1a130f] border-b border-[#8e6d3b]/70 px-2.5 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-2.5 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            [ ← Back ]
          </button>

          <h2 className="text-xs sm:text-sm font-serif tracking-wider text-[#e6c88c] truncate">
            🎲 Occult Parlor, Fortune &amp; Board Games
          </h2>

          <span className="text-[10px] font-mono text-[#cbb693] shrink-0">
            {activeModelId || 'gemini-4-argon'} Live
          </span>
        </div>

        {/* 8-Game Selector Grid (Ouija, Ghost Chat, Fortune, Chess, Cards, Bones, Cipher, Board) */}
        <div className="max-w-4xl mx-auto grid grid-cols-4 sm:grid-cols-8 gap-1 mt-2">
          {(
            [
              { id: 'ouija', label: '👁️ Ouija' },
              { id: 'ghost_chat', label: '📻 Ghosts' },
              { id: 'fortune', label: '🔮 Fortune' },
              { id: 'chess', label: '♟️ Chess' },
              { id: 'cards', label: '🃏 Cards' },
              { id: 'dice', label: '🎲 Bones' },
              { id: 'cipher', label: '🔐 Cypher' },
              { id: 'board', label: '🎨 Board' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              className={`h-8 px-1.5 rounded-xl text-[10px] sm:text-[11px] font-serif font-semibold cursor-pointer truncate ${
                activeTab === tab.id
                  ? 'gilded-send-btn text-[#fff3db]'
                  : 'gilded-pill-btn text-[#cbb693]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-5 pb-32 max-w-4xl w-full mx-auto space-y-3">
        {sentToChatToast && (
          <div className="p-2 rounded-xl bg-emerald-950/90 border border-emerald-400/70 text-xs font-mono text-emerald-100 text-center">
            ✨ {sentToChatToast}
          </div>
        )}

        {gamesApiError && (
          <div className="p-2.5 rounded-xl bg-red-950/90 border border-red-500/80 text-xs font-mono text-red-100 flex flex-wrap items-center justify-between gap-2">
            <span>{gamesApiError}</span>
            <div className="flex items-center gap-1.5">
              {onSelectPaidKey && (
                <button
                  type="button"
                  onClick={onSelectPaidKey}
                  className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[11px] cursor-pointer"
                >
                  [ 🔑 Select Paid API Key ]
                </button>
              )}
              <button
                type="button"
                onClick={() => setGamesApiError(null)}
                className="px-2 py-1 rounded bg-red-900 text-red-100 text-[11px] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            GAME 1: REALISTIC OUIJA BOARD WITH REAL GHOSTS & STRUGGLING PLANCHETTE
           ================================================================ */}
        {activeTab === 'ouija' && (
          <div className="space-y-3" data-testid="games-ouija-panel">
            {/* Summoned Spirit Selector + Struggle Force Meter */}
            <div className="p-3 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-mono text-[#e6c88c]">
                  👁️ <strong>Victorian Ouija Spirit Board</strong> · Active Ghost:{' '}
                  <span className="text-[#fff3db] font-bold">{activeSpirit.name}</span>{' '}
                  <span className="text-[#cbb693]">({activeSpirit.era})</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    struggleIntensity >= 80
                      ? 'bg-red-950/90 border-red-400 text-red-200 animate-pulse'
                      : 'bg-amber-950/80 border-[#e6c88c] text-[#f5ead8]'
                  }`}
                >
                  ⚡ Planchette Struggle: {struggleIntensity}% ({dominantPuller.toUpperCase()})
                </span>
              </div>

              {/* 4 Real Ghosts Selector Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {OUIJA_SPIRITS.map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => handleSelectSpirit(sp.id)}
                    className={`p-2 rounded-xl text-left border cursor-pointer transition-all ${
                      activeSpiritId === sp.id
                        ? 'bg-[#2c1d14] border-[#e6c88c] text-[#fff3db] shadow-md'
                        : 'bg-[#140e0b]/90 border-[#6b5331]/50 text-[#cbb693] hover:border-[#c59b47]'
                    }`}
                  >
                    <div className="text-[11px] font-serif font-bold truncate">
                      👻 {sp.name}
                    </div>
                    <div className="text-[9px] font-mono text-[#d4b483] truncate">
                      {sp.title} · {sp.baseResistance}% Pull
                    </div>
                  </button>
                ))}
              </div>

              {/* Tug-of-War Struggle Resistance Bar between Ghost and Hex & Argon's Hands */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#d4b483]">
                  <span>👻 Ghost Pull ({struggleIntensity}%)</span>
                  <span>
                    👁️ Oculus Lens Over: <strong className="text-[#fff3db]">{nearestBoardNode.token}</strong> · Spelled:{' '}
                    <strong className="text-amber-300 tracking-widest">{spelledSoFar}</strong>
                  </span>
                  <span>🌹🖤 Hex &amp; Argon Grip ({humanStance.replace(/_/g, ' ')})</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#120c0a] border border-[#8e6d3b]/70 overflow-hidden flex">
                  <div
                    style={{ width: `${struggleIntensity}%` }}
                    className="h-full bg-gradient-to-r from-purple-900 via-crimson-600 to-amber-500 transition-all duration-200"
                  />
                </div>
                <p className="text-[11px] font-mono text-[#cbb693] italic">
                  {struggleDescription}
                </p>
              </div>
            </div>

            {/* Realistic Carved Wooden Ouija Board Surface + Interactive Struggling Planchette ("The Eye Thing") */}
            <div
              ref={ouijaBoardRef}
              data-testid="ouija-board-surface"
              onPointerDown={handleOuijaBoardPointerDown}
              onPointerMove={handleOuijaBoardPointerMove}
              onPointerUp={handleOuijaBoardPointerUp}
              className="relative w-full aspect-[16/11] min-h-[290px] sm:min-h-[360px] rounded-2xl border-4 border-[#c59b47] shadow-2xl overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
              style={{
                background:
                  'radial-gradient(ellipse at center, #3b2416 0%, #24140c 62%, #120905 100%)',
              }}
            >
              {/* Ornate Victorian Corner Filigree & Wood Grain Overlay */}
              <div className="absolute inset-2 rounded-xl border border-[#e6c88c]/45 pointer-events-none" />

              {/* Top Row: ☀️ YES (Left) — 👁️ Spelled Word Readout (Center) — 🌙 NO (Right) */}
              <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
                <button
                  type="button"
                  onClick={() => handleTapBoardNode(OUIJA_BOARD_NODES.YES)}
                  className="px-3 py-1 rounded-lg bg-[#1c100a]/85 border border-[#e6c88c]/70 text-xs sm:text-sm font-serif font-bold text-[#f5ead8] hover:bg-[#331e12] cursor-pointer shadow"
                >
                  ☀️ YES
                </button>

                <div className="px-3 py-1 rounded-full bg-black/75 border border-[#c59b47]/80 text-[11px] sm:text-xs font-mono text-amber-200 tracking-widest shadow">
                  {isOuijaChanneling
                    ? '🕯️ CHANNELING SPIRIT…'
                    : `SPELLED: ${spelledSoFar || '—'} (Target: ${fullTargetWord})`}
                </div>

                <button
                  type="button"
                  onClick={() => handleTapBoardNode(OUIJA_BOARD_NODES.NO)}
                  className="px-3 py-1 rounded-lg bg-[#1c100a]/85 border border-[#e6c88c]/70 text-xs sm:text-sm font-serif font-bold text-[#f5ead8] hover:bg-[#331e12] cursor-pointer shadow"
                >
                  🌙 NO
                </button>
              </div>

              {/* Upper Arch Letters: A - M */}
              <div className="absolute inset-x-3 top-[31%] flex items-center justify-between px-1 sm:px-4 z-10">
                {OUIJA_UPPER_ROW.map((letter, idx) => {
                  const archOffset = Math.abs(6 - idx) * 2.2;
                  const isUnderEye = nearestBoardNode.token === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleTapBoardNode(OUIJA_BOARD_NODES[letter])}
                      style={{ transform: `translateY(${archOffset}px)` }}
                      className={`w-6 h-7 sm:w-8 sm:h-9 rounded flex items-center justify-center font-serif font-bold text-sm sm:text-xl transition-all cursor-pointer ${
                        isUnderEye
                          ? 'text-amber-200 scale-125 drop-shadow-[0_0_8px_rgba(251,191,36,0.95)] bg-amber-500/20 rounded-full'
                          : 'text-[#e6c88c] hover:text-white'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              {/* Lower Arch Letters: N - Z */}
              <div className="absolute inset-x-3 top-[48%] flex items-center justify-between px-1 sm:px-4 z-10">
                {OUIJA_LOWER_ROW.map((letter, idx) => {
                  const archOffset = Math.abs(6 - idx) * 2.0;
                  const isUnderEye = nearestBoardNode.token === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleTapBoardNode(OUIJA_BOARD_NODES[letter])}
                      style={{ transform: `translateY(${archOffset}px)` }}
                      className={`w-6 h-7 sm:w-8 sm:h-9 rounded flex items-center justify-center font-serif font-bold text-sm sm:text-xl transition-all cursor-pointer ${
                        isUnderEye
                          ? 'text-amber-200 scale-125 drop-shadow-[0_0_8px_rgba(251,191,36,0.95)] bg-amber-500/20 rounded-full'
                          : 'text-[#e6c88c] hover:text-white'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              {/* Numbers Row: 1 2 3 4 5 6 7 8 9 0 */}
              <div className="absolute inset-x-8 top-[68%] flex items-center justify-center gap-2 sm:gap-4 z-10">
                {OUIJA_NUMBERS_ROW.map((num) => {
                  const isUnderEye = nearestBoardNode.token === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleTapBoardNode(OUIJA_BOARD_NODES[num])}
                      className={`w-6 h-7 sm:w-7 sm:h-8 rounded flex items-center justify-center font-mono font-bold text-xs sm:text-base cursor-pointer ${
                        isUnderEye
                          ? 'text-amber-200 scale-125 bg-amber-500/25 rounded-full'
                          : 'text-[#d4b483] hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              {/* Bottom GOODBYE Arc */}
              <div className="absolute bottom-2.5 inset-x-0 flex justify-center z-10">
                <button
                  type="button"
                  onClick={() => handleTapBoardNode(OUIJA_BOARD_NODES.GOODBYE)}
                  className="px-6 py-1 rounded-full bg-[#1c100a]/90 border border-[#e6c88c]/70 font-serif tracking-[0.25em] text-xs sm:text-sm font-bold text-[#e6c88c] hover:bg-[#331e12] cursor-pointer shadow"
                >
                  ✦ GOODBYE ✦
                </button>
              </div>

              {/* THE PLANCHETTE ("THE EYE THING") — Struggling Heart-Shaped Pointer with Crystal Magnifying Oculus & Both Hands */}
              <div
                data-testid="ouija-planchette-eye"
                aria-label={`Ouija Planchette Oculus currently over ${nearestBoardNode.token}`}
                style={{
                  left: `calc(${planchettePos.x}% + ${planchetteJitter.x}px)`,
                  top: `calc(${planchettePos.y}% + ${planchetteJitter.y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-20 pointer-events-none transition-[left,top] duration-150 ease-out"
              >
                <div className="relative w-28 h-24 sm:w-36 sm:h-28 flex items-center justify-center">
                  {/* Ornate Heart/Teardrop Planchette SVG Body */}
                  <svg
                    viewBox="0 0 140 120"
                    className="w-full h-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.92)]"
                  >
                    <defs>
                      <radialGradient id="planchetteWood" cx="50%" cy="45%" r="60%">
                        <stop offset="0%" stopColor="#5c341d" />
                        <stop offset="70%" stopColor="#2e180c" />
                        <stop offset="100%" stopColor="#170b05" />
                      </radialGradient>
                      <radialGradient id="oculusGlass" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(255, 245, 214, 0.35)" />
                        <stop offset="65%" stopColor="rgba(168, 85, 247, 0.28)" />
                        <stop offset="100%" stopColor="rgba(20, 12, 10, 0.85)" />
                      </radialGradient>
                    </defs>
                    {/* Heart-shaped wooden planchette frame */}
                    <path
                      d="M70 8 L124 88 C130 98 122 110 108 108 L70 96 L32 108 C18 110 10 98 16 88 Z"
                      fill="url(#planchetteWood)"
                      stroke="#e6c88c"
                      strokeWidth="3"
                    />
                    {/* Brass inner filigree triangle */}
                    <path
                      d="M70 20 L110 84 L70 76 L30 84 Z"
                      fill="none"
                      stroke="#c59b47"
                      strokeWidth="1.4"
                      strokeDasharray="4 2"
                    />
                    {/* Magnifying Oculus Ring ("The Eye Thing") */}
                    <circle
                      cx="70"
                      cy="56"
                      r="20"
                      fill="url(#oculusGlass)"
                      stroke="#fbbf24"
                      strokeWidth="3.5"
                    />
                    {/* Crosshair & Eye Markings inside the Oculus */}
                    <line x1="70" y1="36" x2="70" y2="42" stroke="#fde68a" strokeWidth="1.5" />
                    <line x1="70" y1="70" x2="70" y2="76" stroke="#fde68a" strokeWidth="1.5" />
                    <line x1="50" y1="56" x2="56" y2="56" stroke="#fde68a" strokeWidth="1.5" />
                    <line x1="84" y1="56" x2="90" y2="56" stroke="#fde68a" strokeWidth="1.5" />
                  </svg>

                  {/* Magnified Character Inside the Crystal Oculus */}
                  <div className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
                    <span className="font-serif font-extrabold text-sm sm:text-lg text-[#fff7e6] drop-shadow-[0_0_8px_rgba(251,191,36,1)]">
                      {nearestBoardNode.token}
                    </span>
                  </div>

                  {/* Left Wing Badge: Hex's Hand on the Planchette */}
                  <span className="absolute -bottom-1 -left-4 px-1.5 py-0.5 rounded-full bg-rose-950/95 border border-rose-400/80 text-[8px] font-mono text-rose-100 whitespace-nowrap shadow">
                    🌹 Hex Hand
                  </span>

                  {/* Right Wing Badge: Argon's Hand on the Planchette */}
                  <span className="absolute -bottom-1 -right-4 px-1.5 py-0.5 rounded-full bg-amber-950/95 border border-[#e6c88c] text-[8px] font-mono text-[#fff3db] whitespace-nowrap shadow">
                    🖤 Argon Hand
                  </span>
                </div>
              </div>
            </div>

            {/* Hand Grip / Planchette Struggle Controls (Tug-of-War against the Ghost) */}
            <div className="p-2.5 rounded-xl bubble-smoked-glass border border-[#c59b47]/60 space-y-2">
              <div className="text-[10px] font-mono text-[#d4b483] uppercase tracking-wider">
                🖐️ Physical Hand Grip on the Planchette (Fight or Yield to the Ghost&apos;s Pull):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {(
                  [
                    { id: 'follow_spirit', label: '🕯️ Let Spirit Pull' },
                    { id: 'brace_together', label: '🖐️ Brace with Argon' },
                    { id: 'pull_to_yes', label: '☀️ Fight to YES' },
                    { id: 'pull_to_no', label: '🌙 Fight to NO' },
                    { id: 'force_goodbye', label: '🚪 Force GOODBYE' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setHumanStance(st.id);
                      if (st.id === 'force_goodbye') {
                        setSpiritTargetNode(OUIJA_BOARD_NODES.GOODBYE);
                        setSpelledSoFar('GOODBYE');
                      }
                    }}
                    className={`h-8 px-2 rounded-lg text-[10px] font-mono cursor-pointer border truncate ${
                      humanStance === st.id
                        ? 'gilded-send-btn text-[#fff3db] font-bold'
                        : 'bg-[#140e0b] border-[#6b5331]/60 text-[#cbb693]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Live Reaction Bubbles: 1) Ghost's Whisper  2) Argon's Live Reaction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div
                data-testid="ouija-ghost-whisper"
                className="p-3 rounded-xl bg-[#160d18]/95 border border-purple-400/60 space-y-1 shadow-lg"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-purple-200 uppercase">
                  <span>👻 {activeSpirit.name} (Spirit Manifestation)</span>
                  <span>Spelled: &ldquo;{fullTargetWord}&rdquo;</span>
                </div>
                <p className="text-xs sm:text-sm font-serif-webtoon text-purple-100 leading-snug">
                  {ghostWhisper}
                </p>
              </div>

              <div
                data-testid="ouija-argon-banter"
                className="p-3 rounded-xl bubble-smoked-glass border border-[#e6c88c]/70 bg-[#19120e]/95 space-y-1 shadow-lg"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-[#e6c88c] uppercase">
                  <span>🖤 Argon on the Planchette (gemini-4-argon)</span>
                  {onSendGameMomentToChat && (
                    <button
                      type="button"
                      onClick={() =>
                        notifySentToChat(
                          `[👁️ OUIJA BOARD SÉANCE with ${activeSpirit.name}] Planchette spelled "${fullTargetWord}" (${struggleIntensity}% struggle). Ghost whispered: ${ghostWhisper}`,
                          argonOuijaBanter
                        )
                      }
                      className="px-2 py-0.5 rounded bg-[#2c1f16] border border-[#c59b47] text-[9px] text-[#fff3db] cursor-pointer"
                    >
                      💬 Share to Chat
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-serif-webtoon text-[#f5ead8] leading-snug">
                  {argonOuijaBanter}
                </p>
              </div>
            </div>

            {/* Interactive Séance Question Bar for BOTH User (Hex) AND Argon */}
            <div className="p-3 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void triggerOuijaTurn('hex');
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="text"
                  value={ouijaQuestion}
                  onChange={(e) => setOuijaQuestion(e.target.value)}
                  placeholder={`Ask ${activeSpirit.name} a question on the Ouija board…`}
                  aria-label="Ask the Ouija board a question"
                  className="flex-1 h-9 px-3 rounded-xl gilded-input-well text-xs font-mono text-[#f5ead8]"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="submit"
                    disabled={isOuijaChanneling}
                    className="h-9 px-3 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isOuijaChanneling ? '🕯️ Channeling…' : '🌹 Hex Asks Board'}
                  </button>
                  <button
                    type="button"
                    disabled={isOuijaChanneling}
                    onClick={() => void triggerOuijaTurn('argon')}
                    className="h-9 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    🖤 Let Argon Interrogate Ghost
                  </button>
                  <button
                    type="button"
                    disabled={isOuijaChanneling}
                    onClick={() => void triggerOuijaTurn('both')}
                    className="h-9 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    🤝 Both Press Planchette
                  </button>
                </div>
              </form>

              {/* Séance Transcript Log */}
              <div className="max-h-24 overflow-y-auto space-y-1 pt-1 border-t border-[#6b5331]/40">
                {ouijaTranscript.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-[10px] font-mono text-[#d4b483] bg-[#120d0b]/90 px-2 py-1 rounded border border-[#6b5331]/40"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            GAME 2: PARANORMAL GHOST CHATTING PARLOR (EVP SPIRIT BOX & CANDLE SÉANCE)
           ================================================================ */}
        {activeTab === 'ghost_chat' && (
          <div className="space-y-3" data-testid="games-ghost-chat-panel">
            {/* Sub-Game Mode Switcher + Spirit Picker */}
            <div className="p-3 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGhostChatMode('evp_box')}
                    className={`h-8 px-3 rounded-full text-xs font-mono cursor-pointer ${
                      ghostChatMode === 'evp_box'
                        ? 'gilded-send-btn text-[#fff3db] font-bold'
                        : 'gilded-pill-btn text-[#cbb693]'
                    }`}
                  >
                    📻 EVP Spirit Box &amp; EMF Radar
                  </button>
                  <button
                    type="button"
                    onClick={() => setGhostChatMode('candle_seance')}
                    className={`h-8 px-3 rounded-full text-xs font-mono cursor-pointer ${
                      ghostChatMode === 'candle_seance'
                        ? 'gilded-send-btn text-[#fff3db] font-bold'
                        : 'gilded-pill-btn text-[#cbb693]'
                    }`}
                  >
                    🕯️ Scrying Mirror &amp; 3-Candle Séance
                  </button>
                </div>

                {/* 5-LED EMF Spike Meter */}
                <div className="flex items-center gap-1.5 bg-[#120c0a] px-2.5 py-1 rounded-full border border-[#8e6d3b]/70">
                  <span className="text-[10px] font-mono text-[#e6c88c]">EMF:</span>
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const active = lvl <= emfLevel;
                    const colorClass =
                      lvl <= 2
                        ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                        : lvl === 3
                        ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                        : 'bg-red-500 shadow-[0_0_8px_#ef4444]';
                    return (
                      <span
                        key={lvl}
                        className={`w-3 h-3 rounded-full border border-black/60 ${
                          active ? colorClass : 'bg-stone-800'
                        }`}
                      />
                    );
                  })}
                  <span className="text-[10px] font-mono font-bold text-[#fff3db]">
                    {emfLevel}/5 mG
                  </span>
                </div>
              </div>

              {/* Active Ghost Channel Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {OUIJA_SPIRITS.map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => setActiveSpiritId(sp.id)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-mono cursor-pointer border truncate ${
                      activeSpiritId === sp.id
                        ? 'bg-[#2c1d14] border-[#e6c88c] text-[#fff3db] font-bold'
                        : 'bg-[#120d0b] border-[#6b5331]/50 text-[#cbb693]'
                    }`}
                  >
                    👻 {sp.name}
                  </button>
                ))}
              </div>
            </div>

            {ghostChatMode === 'evp_box' ? (
              /* MODE A: APOTHECARY EVP SPIRIT BOX & RADIO FREQUENCY TUNER */
              <div className="p-3.5 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono text-[#e6c88c]">
                      📻 <strong>Copper EVP Frequency Sweep Tuner</strong>
                    </div>
                    <div className="text-[11px] font-mono text-[#cbb693]">
                      Argon&apos;s Rig Status: {argonGhostAction}
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-black/85 border border-amber-400/70 font-mono text-sm sm:text-base font-bold text-amber-300 tracking-wider">
                    {frequencyMHz.toFixed(1)} MHz
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-[#cbb693]">65.0</span>
                  <input
                    type="range"
                    min={65.0}
                    max={108.0}
                    step={0.1}
                    value={frequencyMHz}
                    aria-label="EVP Radio Frequency MHz"
                    onChange={(e) => setFrequencyMHz(Number(e.target.value))}
                    className="flex-1 accent-[#e6c88c] cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-[#cbb693]">108.0</span>
                  <button
                    type="button"
                    disabled={isGhostChatBusy}
                    onClick={() => {
                      const randomFreq = Number(
                        (65 + Math.random() * 43).toFixed(1)
                      );
                      setFrequencyMHz(randomFreq);
                      void triggerGhostChatTurn(
                        'both',
                        `Sweeping Spirit Box dial across ${randomFreq} MHz—who is broadcasting on this frequency?`
                      );
                    }}
                    className="h-8 px-3 rounded-full gilded-pill-btn text-[11px] font-mono cursor-pointer shrink-0"
                  >
                    📡 Sweep Dial
                  </button>
                </div>

                {/* Raw EVP Static Waveform Readout */}
                <div className="p-2.5 rounded-xl bg-black/85 border border-emerald-500/50 font-mono text-xs text-emerald-300">
                  <div className="text-[9px] uppercase text-emerald-400/80 mb-0.5">
                    ⚡ Raw EVP Carrier Wave Intercept:
                  </div>
                  {evpStaticStream}
                </div>
              </div>
            ) : (
              /* MODE B: MIDNIGHT SCRYING MIRROR & 3-CANDLE KNOCK SÉANCE */
              <div className="p-3.5 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  {/* 3 Interactive Séance Candles */}
                  <div className="p-3 rounded-xl bg-[#120c0a]/90 border border-[#6b5331]/60 space-y-2">
                    <div className="text-[10px] font-mono text-[#e6c88c] uppercase text-center">
                      🕯️ 3-Candle Telekinesis Altar (Tap to Toggle / Relight)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Black Tallow', 'Crimson Wax', 'White Sage'] as const).map(
                        (candleLabel, idx) => {
                          const st = candleStates[idx];
                          return (
                            <button
                              key={candleLabel}
                              type="button"
                              onClick={() => {
                                const order: CandleFlameState[] = [
                                  'steady',
                                  'flicker',
                                  'blue_flame',
                                  'snuffed',
                                ];
                                const nextSt =
                                  order[(order.indexOf(st) + 1) % order.length];
                                setCandleStates((prev) => {
                                  const copy = [...prev] as [
                                    CandleFlameState,
                                    CandleFlameState,
                                    CandleFlameState,
                                  ];
                                  copy[idx] = nextSt;
                                  return copy;
                                });
                              }}
                              className="p-2 rounded-xl bg-[#1b120e] border border-[#8e6d3b]/60 flex flex-col items-center gap-1 cursor-pointer"
                            >
                              <span className="text-2xl leading-none">
                                {st === 'snuffed'
                                  ? '💨'
                                  : st === 'blue_flame'
                                  ? '💠'
                                  : st === 'flicker'
                                  ? '🔥'
                                  : '🕯️'}
                              </span>
                              <span className="text-[10px] font-serif font-bold text-[#f5ead8]">
                                {candleLabel}
                              </span>
                              <span className="text-[9px] font-mono text-amber-300 uppercase">
                                {st.replace('_', ' ')}
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Fogged Obsidian Scrying Mirror */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0b0914] via-[#13111c] to-[#09070d] border-2 border-[#c59b47] flex flex-col items-center justify-center text-center min-h-[128px] shadow-inner">
                    <span className="text-[10px] font-mono text-purple-300/80 uppercase tracking-widest mb-1">
                      🪞 Condensation on the Scrying Glass:
                    </span>
                    <div className="font-serif font-extrabold text-base sm:text-xl tracking-[0.2em] text-purple-100 drop-shadow-[0_0_10px_rgba(192,132,252,0.85)]">
                      &ldquo;{mirrorWriting}&rdquo;
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Direct Ghost Message & Argon's Live Response */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div
                data-testid="ghost-chat-spirit-reply"
                className="p-3 rounded-xl bg-[#160d18]/95 border border-purple-400/60 space-y-1"
              >
                <div className="text-[10px] font-mono text-purple-200 uppercase">
                  👻 {activeSpirit.name} ({frequencyMHz.toFixed(1)} MHz · Mirror: &ldquo;{mirrorWriting}&rdquo;)
                </div>
                <p className="text-xs sm:text-sm font-serif-webtoon text-purple-100 leading-snug">
                  {ghostDirectMessage}
                </p>
              </div>

              <div
                data-testid="ghost-chat-argon-reply"
                className="p-3 rounded-xl bubble-smoked-glass border border-[#e6c88c]/70 bg-[#19120e]/95 space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-[#e6c88c] uppercase">
                  <span>🖤 Argon&apos;s Paranormal Response</span>
                  {onSendGameMomentToChat && (
                    <button
                      type="button"
                      onClick={() =>
                        notifySentToChat(
                          `[📻 GHOST PARLOR (${frequencyMHz.toFixed(1)} MHz | EMF ${emfLevel}/5)] ${activeSpirit.name}: ${ghostDirectMessage} (Mirror fog: "${mirrorWriting}")`,
                          argonGhostBanter
                        )
                      }
                      className="px-2 py-0.5 rounded bg-[#2c1f16] border border-[#c59b47] text-[9px] text-[#fff3db] cursor-pointer"
                    >
                      💬 Share to Chat
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-serif-webtoon text-[#f5ead8] leading-snug">
                  {argonGhostBanter}
                </p>
              </div>
            </div>

            {/* Interactive Controls for BOTH User (Hex) AND Argon */}
            <div className="p-3 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void triggerGhostChatTurn('hex');
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="text"
                  value={ghostChatInput}
                  onChange={(e) => setGhostChatInput(e.target.value)}
                  placeholder="Speak into the Spirit Box or séance circle…"
                  aria-label="Message for the ghost"
                  className="flex-1 h-9 px-3 rounded-xl gilded-input-well text-xs font-mono text-[#f5ead8]"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="submit"
                    disabled={isGhostChatBusy}
                    className="h-9 px-3 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isGhostChatBusy ? '📡 Scanning…' : '🌹 Hex Transmits'}
                  </button>
                  <button
                    type="button"
                    disabled={isGhostChatBusy}
                    onClick={() => void triggerGhostChatTurn('argon')}
                    className="h-9 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    🖤 Argon Interrogates Ghost
                  </button>
                  <button
                    type="button"
                    disabled={isGhostChatBusy}
                    onClick={() =>
                      void triggerGhostChatTurn(
                        'both',
                        'Hex and Argon knock three times on the table: "Knock back or flare the candles if you can hear us!"'
                      )
                    }
                    className="h-9 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    ✊ Knock 3 Times
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================
            GAME 3: FORTUNE TELLING SANCTUM (TAROT, CRYSTAL BALL, & ELDER RUNES)
            FUNCTIONAL FOR BOTH USER (HEX) AND ARGON (LLM)
           ================================================================ */}
        {activeTab === 'fortune' && (
          <div className="space-y-3" data-testid="games-fortune-panel">
            {/* Divination Method + Role Direction Selector (Who reads for whom?) */}
            <div className="p-3 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-2.5">
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'tarot', label: '🎴 3-Card Tarot Spread' },
                    { id: 'scrying', label: '🔮 Crystal Ball & Tea' },
                    { id: 'runes', label: '🪨 Elder Futhark Runes' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFortuneMode(m.id)}
                    className={`h-8 px-2 rounded-xl text-xs font-serif font-semibold cursor-pointer truncate ${
                      fortuneMode === m.id
                        ? 'gilded-send-btn text-[#fff3db]'
                        : 'gilded-pill-btn text-[#cbb693]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* 3-Way Role Selector: Argon Reads Hex | Hex Reads Argon | Shared Destiny */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 border-t border-[#6b5331]/40">
                {(
                  [
                    {
                      id: 'argon_reads_hex',
                      label: '🖤 Argon Reads Hex’s Fortune',
                    },
                    {
                      id: 'hex_reads_argon',
                      label: '🌹 Hex Reads Argon’s Fortune',
                    },
                    {
                      id: 'shared_destiny',
                      label: '✨ Shared Destiny (Hex & Argon)',
                    },
                  ] as const
                ).map((dir) => (
                  <button
                    key={dir.id}
                    type="button"
                    onClick={() => setReadingDirection(dir.id)}
                    className={`h-8 px-2.5 rounded-lg text-[11px] font-mono cursor-pointer border truncate ${
                      readingDirection === dir.id
                        ? 'bg-[#2c1f16] border-[#e6c88c] text-[#fff3db] font-bold'
                        : 'bg-[#120d0b] border-[#6b5331]/50 text-[#cbb693]'
                    }`}
                  >
                    {dir.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Divination Table Display */}
            {fortuneMode === 'tarot' && (
              <div className="p-3.5 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#e6c88c]">
                  <span>
                    🎴 <strong>22 Major Arcana Spread (Past · Present · Future)</strong> — Tap any card to Flip or Toggle Upright/Reversed:
                  </span>
                  <button
                    type="button"
                    disabled={isFortuneBusy}
                    onClick={() => void handleDrawNewOmensAndRead()}
                    className="h-8 px-3 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer"
                  >
                    🔀 Shuffle &amp; Deal New Spread
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {tarotSpread.map((card, idx) => (
                    <div
                      key={`${card.id}-${idx}`}
                      className="p-3 rounded-2xl bg-gradient-to-b from-[#231711] to-[#120b08] border-2 border-[#e6c88c] flex flex-col justify-between space-y-2 shadow-lg"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#d4b483]">
                        <span className="font-bold tracking-wider text-[#e6c88c]">
                          {card.positionLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setTarotSpread((prev) =>
                              prev.map((c, i) =>
                                i === idx ? { ...c, isReversed: !c.isReversed } : c
                              )
                            )
                          }
                          className="px-2 py-0.5 rounded bg-[#2c1f16] border border-[#8e6d3b] text-[9px] text-amber-200 cursor-pointer"
                        >
                          {card.isReversed ? '🔄 Reversed' : '⬆️ Upright'}
                        </button>
                      </div>

                      <div className="py-2 text-center space-y-1">
                        <div
                          className={`text-3xl inline-block transition-transform ${
                            card.isReversed ? 'rotate-180' : ''
                          }`}
                        >
                          {card.symbol}
                        </div>
                        <div className="font-serif font-bold text-sm text-[#fff3db]">
                          {card.numeral} · {card.name}
                        </div>
                      </div>

                      <p className="text-[11px] font-mono text-[#cbb693] leading-snug">
                        {card.isReversed ? card.reversedMeaning : card.uprightMeaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fortuneMode === 'scrying' && (
              <div className="p-4 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  disabled={isFortuneBusy}
                  onClick={() => void handleDrawNewOmensAndRead()}
                  className="w-36 h-36 rounded-full bg-radial from-purple-600/40 via-[#1a0f2e] to-[#08050d] border-4 border-[#e6c88c] shadow-[0_0_30px_rgba(168,85,247,0.5)] flex flex-col items-center justify-center p-3 cursor-pointer hover:scale-105 transition-transform shrink-0"
                >
                  <span className="text-4xl">{currentScryingVision.symbol}</span>
                  <span className="text-[10px] font-mono text-purple-200 mt-1">
                    Tap to Part Mist
                  </span>
                </button>
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="text-xs font-mono text-purple-300 uppercase">
                    🔮 Obsidian Sphere &amp; Tasseography Tea-Leaf Vision
                  </div>
                  <h4 className="text-sm sm:text-base font-serif font-bold text-[#fff3db]">
                    {currentScryingVision.title}
                  </h4>
                  <p className="text-xs font-serif-webtoon text-[#e6d4b5] leading-relaxed">
                    {currentScryingVision.omen}
                  </p>
                </div>
              </div>
            )}

            {fortuneMode === 'runes' && (
              <div className="p-3.5 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#e6c88c]">
                  <span>
                    🪨 <strong>Elder Futhark Bloodstone Runes (3-Rune Norns Cast)</strong>:
                  </span>
                  <button
                    type="button"
                    disabled={isFortuneBusy}
                    onClick={() => void handleDrawNewOmensAndRead()}
                    className="h-8 px-3 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer"
                  >
                    🎲 Shake Pouch &amp; Cast Runes
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {castRunes.map((rune, idx) => (
                    <div
                      key={`${rune.id}-${idx}`}
                      className="p-3 rounded-2xl bg-[#1a110e] border-2 border-[#c59b47] flex flex-col items-center text-center space-y-1.5 shadow-md"
                    >
                      <span className="text-[10px] font-mono text-[#d4b483] uppercase">
                        {rune.nornSlot}
                      </span>
                      <span
                        className={`text-3xl font-bold text-amber-300 ${
                          rune.isMerkstave ? 'rotate-180' : ''
                        }`}
                      >
                        {rune.glyph}
                      </span>
                      <span className="text-xs font-serif font-bold text-[#fff3db]">
                        {rune.name} ({rune.element}) ·{' '}
                        {rune.isMerkstave ? 'Merkstave' : 'Brightstave'}
                      </span>
                      <p className="text-[11px] font-mono text-[#cbb693]">
                        {rune.meaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Oracle Synthesis + Argon's Reaction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div
                data-testid="fortune-oracle-summary"
                className="p-3 rounded-xl bg-[#171019]/95 border border-[#c59b47]/80 space-y-1.5"
              >
                <div className="text-[10px] font-mono text-amber-300 uppercase">
                  ✨ {omenTitle}
                </div>
                <p className="text-xs font-serif-webtoon text-[#f5ead8] leading-relaxed">
                  {omenSummary}
                </p>
                <div className="text-[11px] font-mono text-emerald-300 pt-1 border-t border-[#6b5331]/40">
                  {prophecyVerdict}
                </div>
              </div>

              <div
                data-testid="fortune-argon-banter"
                className="p-3 rounded-xl bubble-smoked-glass border border-[#e6c88c]/70 bg-[#19120e]/95 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-[#e6c88c] uppercase">
                  <span>🖤 Argon&apos;s Reading &amp; Reaction</span>
                  {onSendGameMomentToChat && (
                    <button
                      type="button"
                      onClick={() =>
                        notifySentToChat(
                          `[🔮 FORTUNE SANCTUM — ${omenTitle}] ${omenSummary} (${prophecyVerdict})`,
                          argonFortuneBanter
                        )
                      }
                      className="px-2 py-0.5 rounded bg-[#2c1f16] border border-[#c59b47] text-[9px] text-[#fff3db] cursor-pointer"
                    >
                      💬 Share to Chat
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-serif-webtoon text-[#f5ead8] leading-snug">
                  {argonFortuneBanter}
                </p>
              </div>
            </div>

            {/* Interactive Controls for BOTH Hex Reading Argon AND Argon Reading Hex */}
            <div className="p-3 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-2">
              {readingDirection === 'hex_reads_argon' && (
                <div>
                  <label className="block text-[11px] font-mono text-[#e6c88c] mb-1">
                    🌹 Hex&apos;s Interpretation of Argon&apos;s Cards/Runes (Argon will react to your reading of him):
                  </label>
                  <input
                    type="text"
                    value={hexReadingForArgonInput}
                    onChange={(e) => setHexReadingForArgonInput(e.target.value)}
                    placeholder="e.g. The Emperor and The Devil show you're hopelessly possessive of me, Argon…"
                    className="w-full h-9 px-3 rounded-xl gilded-input-well text-xs font-mono text-[#f5ead8]"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={fortuneQuestion}
                  onChange={(e) => setFortuneQuestion(e.target.value)}
                  placeholder="Enter a question for the cards, crystal ball, or runes…"
                  aria-label="Fortune telling question"
                  className="flex-1 h-9 px-3 rounded-xl gilded-input-well text-xs font-mono text-[#f5ead8]"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isFortuneBusy}
                    onClick={() =>
                      void handleDrawNewOmensAndRead('argon_reads_hex')
                    }
                    className="h-9 px-3 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isFortuneBusy ? '🔮 Reading…' : '🖤 Argon Draws & Reads Hex'}
                  </button>
                  <button
                    type="button"
                    disabled={isFortuneBusy}
                    onClick={() => {
                      setReadingDirection('hex_reads_argon');
                      void handleInterpretCurrentSpreadWithoutRedraw();
                    }}
                    className="h-9 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    🌹 Hex Reads Argon&apos;s Fate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            GAME 4: PLAYABLE 8x8 CHESS AGAINST ARGON (`gemini-4-argon`)
           ================================================================ */}
        {activeTab === 'chess' && (
          <div className="space-y-2.5" data-testid="games-chess-panel">
            <div className="p-2.5 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono text-[#e6c88c]">
                ♟️ <strong>8×8 Chess vs. Argon</strong> ·{' '}
                {isArgonChessThinking
                  ? '🖤 Argon (Black) thinking via gemini-4-argon…'
                  : chessTurn === 'w'
                  ? '🌹 Hex (White) to Move'
                  : '🖤 Argon (Black) Turn'}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleNewChessGame}
                  className="h-8 px-2.5 rounded-full gilded-pill-btn text-[11px] font-mono cursor-pointer"
                >
                  [ 🔄 New Game ]
                </button>
                <button
                  type="button"
                  disabled={chessSnapshots.length === 0 || isArgonChessThinking}
                  onClick={handleUndoChessTurn}
                  className="h-8 px-2.5 rounded-full gilded-pill-btn text-[11px] font-mono cursor-pointer disabled:opacity-40"
                >
                  [ ↩️ Undo Last Turn ]
                </button>
              </div>
            </div>

            <div
              data-testid="chess-speech-bubble"
              className="p-3 rounded-xl bubble-smoked-glass border border-[#e6c88c]/70 bg-[#19120e]/95 shadow-lg space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#e6c88c]">
                  💬 Argon (Black · gemini-4-argon)
                </span>
                {isArgonChessThinking && (
                  <span className="text-[10px] font-mono text-amber-300 animate-pulse">
                    Computing counter-move…
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-serif-webtoon text-[#f5ead8] leading-snug">
                {argonChessBanter}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
              <div className="md:col-span-7 flex flex-col items-center">
                <div
                  data-testid="chess-board-grid"
                  className="grid grid-cols-8 border-2 border-[#c59b47] rounded-xl overflow-hidden shadow-2xl w-full max-w-[324px] aspect-square"
                >
                  {chessBoard.map((row, rIdx) =>
                    row.map((piece, cIdx) => {
                      const alg = coordToAlgebraic(rIdx, cIdx);
                      const isDark = (rIdx + cIdx) % 2 === 1;
                      const isSelected =
                        selectedSquare?.[0] === rIdx && selectedSquare?.[1] === cIdx;
                      const isLegalDest = selectedLegalMoves.some(
                        ([toR, toC]) => toR === rIdx && toC === cIdx
                      );
                      const isLastMove =
                        (lastMoveCoords?.from[0] === rIdx &&
                          lastMoveCoords?.from[1] === cIdx) ||
                        (lastMoveCoords?.to[0] === rIdx &&
                          lastMoveCoords?.to[1] === cIdx);

                      const pieceLabel = piece
                        ? `${piece.color === 'w' ? 'White' : 'Black'} ${piece.type.toUpperCase()}`
                        : 'empty';

                      return (
                        <button
                          key={alg}
                          type="button"
                          onClick={() => handleChessSquareClick(rIdx, cIdx)}
                          aria-label={`Square ${alg} (${pieceLabel})`}
                          className={`w-full h-full flex items-center justify-center text-lg sm:text-2xl cursor-pointer select-none relative transition-colors ${
                            isSelected
                              ? 'bg-amber-500/80 ring-2 ring-inset ring-[#fff3db]'
                              : isLegalDest
                              ? 'bg-emerald-700/70 ring-1 ring-inset ring-emerald-300'
                              : isLastMove
                              ? isDark
                                ? 'bg-[#3d291a]'
                                : 'bg-[#735338]'
                              : isDark
                              ? 'bg-[#261913]'
                              : 'bg-[#5c4332]'
                          }`}
                        >
                          {cIdx === 0 && (
                            <span className="absolute top-0.5 left-0.5 text-[8px] font-mono text-[#cbb693]/70 leading-none pointer-events-none">
                              {8 - rIdx}
                            </span>
                          )}
                          {rIdx === 7 && (
                            <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono text-[#cbb693]/70 leading-none pointer-events-none">
                              {'abcdefgh'[cIdx]}
                            </span>
                          )}
                          {piece && (
                            <span
                              className={
                                piece.color === 'w'
                                  ? 'text-[#fff9ed] drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]'
                                  : 'text-[#120b09] drop-shadow-[0_1px_2px_rgba(230,200,140,0.85)]'
                              }
                            >
                              {CHESS_SYMBOLS[`${piece.color}${piece.type}`]}
                            </span>
                          )}
                          {isLegalDest && !piece && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-300/90 shadow" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="md:col-span-5 space-y-2">
                <div
                  data-testid="chess-move-history"
                  className="p-3 rounded-xl bg-[#140e0b]/90 border border-[#6b5331]/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#d4b483] uppercase">
                    <span>Algebraic Move History ({chessMoveHistory.length})</span>
                    <span>Undo Stack: {chessSnapshots.length}</span>
                  </div>
                  {chessMoveHistory.length === 0 ? (
                    <div className="text-[11px] font-mono text-[#9e8664]">
                      Tap any White piece (rows 1–2) to highlight legal squares in gold, then tap a target square (e.g. e2 -&gt; e4).
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                      {chessMoveHistory.map((entry, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] font-mono text-[#e6d4b5] bg-[#1c1410] px-2 py-1 rounded border border-[#6b5331]/40"
                        >
                          {entry}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            GAME 5: PLAYABLE 52-CARD TABLE AGAINST ARGON (`gemini-4-argon`)
           ================================================================ */}
        {activeTab === 'cards' && (
          <div className="space-y-3" data-testid="games-cards-panel">
            <div className="p-3 rounded-xl bubble-smoked-glass border border-[#c59b47]/60 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#e6c88c]">
                <span>
                  🃏 <strong>52-Card Shoe:</strong> {deck.length} cards left
                </span>
                <span>
                  💰 <strong>Pot:</strong> {potChips} · 🌹 Hex: {hexChips} chips ({cardScoreboard.hexWins}W) · 🖤 Argon: {argonChips} chips ({cardScoreboard.argonWins}W)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'blackjack', label: '21 Blackjack' },
                    { id: 'showdown', label: 'High-Card Showdown' },
                    { id: 'poker', label: '5-Card Poker Draw' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectCardMode(m.id)}
                    className={`h-7 px-2 rounded-lg text-[10px] font-mono cursor-pointer border truncate ${
                      cardMode === m.id
                        ? 'bg-[#2c1f16] border-[#e6c88c] text-[#f5ead8] font-bold'
                        : 'bg-[#120d0b] border-[#6b5331]/50 text-[#cbb693]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              data-testid="card-speech-bubble"
              className="p-3 rounded-xl bubble-smoked-glass border border-[#e6c88c]/70 bg-[#19120e]/95 shadow-lg space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#e6c88c]">
                  💬 Argon&apos;s Table Talk (gemini-4-argon)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2c1f16] border border-[#c59b47] text-[#f5ead8]">
                  {isArgonCardThinking
                    ? 'Thinking…'
                    : `Decision: ${argonLastDecision.toUpperCase()}`}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-serif-webtoon text-[#f5ead8] leading-snug">
                {cardSpeechBubble}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-4">
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-[#d4b483] flex items-center justify-between">
                  <span>🖤 Argon&apos;s Hand ({visibleArgonCardDescription}):</span>
                  <span className="text-[10px] text-[#cbb693]">
                    {roundPhase === 'playing' ? '🔒 Hole card hidden' : '🔓 Revealed'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {argonHand.map((card, idx) => {
                    const isHoleCardHidden = roundPhase === 'playing' && idx >= 1;
                    if (isHoleCardHidden) {
                      return (
                        <div
                          key={`argon-hidden-${idx}`}
                          data-testid="argon-hole-card-facedown"
                          aria-label="Argon face-down hole card"
                          className="w-14 h-20 rounded-xl bg-gradient-to-br from-[#2a1810] to-[#120a07] border-2 border-[#c59b47] flex flex-col items-center justify-center p-1.5 shadow-md"
                        >
                          <span className="text-xl text-[#e6c88c]">🂠</span>
                          <span className="text-[8px] font-mono text-[#cbb693] uppercase mt-0.5">
                            Hole
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={`${card.id}-${idx}`}
                        className="w-14 h-20 rounded-xl bg-[#18110e] border-2 border-[#c59b47] flex flex-col items-center justify-between p-1.5 shadow-md"
                      >
                        <span
                          className={`text-xs font-bold self-start leading-none ${
                            card.isRed ? 'text-rose-400' : 'text-[#f5ead8]'
                          }`}
                        >
                          {card.rank}
                        </span>
                        <span
                          className={`text-xl leading-none ${
                            card.isRed ? 'text-rose-400' : 'text-[#e6c88c]'
                          }`}
                        >
                          {card.suit}
                        </span>
                        <span
                          className={`text-xs font-bold self-end leading-none ${
                            card.isRed ? 'text-rose-400' : 'text-[#f5ead8]'
                          }`}
                        >
                          {card.rank}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-mono text-[#e6c88c]">
                  🌹 Hex&apos;s Hand ({hexCardDescription}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {hexHand.map((card, idx) => (
                    <div
                      key={`${card.id}-${idx}`}
                      className="w-14 h-20 rounded-xl bg-[#221712] border-2 border-[#e6c88c] flex flex-col items-center justify-between p-1.5 shadow-md"
                    >
                      <span
                        className={`text-xs font-bold self-start leading-none ${
                          card.isRed ? 'text-rose-400' : 'text-[#f5ead8]'
                        }`}
                      >
                        {card.rank}
                      </span>
                      <span
                        className={`text-xl leading-none ${
                          card.isRed ? 'text-rose-400' : 'text-[#e6c88c]'
                        }`}
                      >
                        {card.suit}
                      </span>
                      <span
                        className={`text-xs font-bold self-end leading-none ${
                          card.isRed ? 'text-rose-400' : 'text-[#f5ead8]'
                        }`}
                      >
                        {card.rank}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  disabled={isArgonCardThinking}
                  onClick={handleDealCards}
                  className="h-9 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer disabled:opacity-40"
                >
                  [ Deal ]
                </button>
                <button
                  type="button"
                  disabled={roundPhase !== 'playing' || isArgonCardThinking}
                  onClick={handleHitOrDrawCard}
                  className="h-9 px-3 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer disabled:opacity-40"
                >
                  [ Hit / Draw ]
                </button>
                <button
                  type="button"
                  disabled={roundPhase !== 'playing' || isArgonCardThinking}
                  onClick={handleStandAndReveal}
                  className="h-9 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer disabled:opacity-40"
                >
                  [ Stand / Reveal ]
                </button>
                <button
                  type="button"
                  disabled={roundPhase !== 'playing' || isArgonCardThinking}
                  onClick={handleFoldCards}
                  className="h-9 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer disabled:opacity-40"
                >
                  [ Fold ]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            GAME 6: APOTHECARY BONES (YACHT DICE DUEL VS. ARGON)
           ================================================================ */}
        {activeTab === 'dice' && (
          <div
            className="p-4 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-4"
            data-testid="games-dice-panel"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono text-[#e6c88c]">
                🎲 <strong>Apothecary Bones (Yacht Poker Dice)</strong> · Rolls Left: {rollsLeft} · 🌹 Hex: {diceScoreboard.hexWins}W · 🖤 Argon: {diceScoreboard.argonWins}W
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isArgonRollingDice}
                  onClick={() => void triggerArgonDiceTurn()}
                  data-testid="argon-roll-dice-btn"
                  className="h-8 px-3 rounded-full gilded-send-btn text-xs font-mono cursor-pointer disabled:opacity-40"
                >
                  {isArgonRollingDice ? '🎲 Argon Rolling…' : '🖤 Let Argon Roll Bones'}
                </button>
                <button
                  type="button"
                  disabled={isArgonRollingDice}
                  onClick={handleNewDiceRound}
                  className="h-8 px-3 rounded-full gilded-pill-btn text-xs font-mono cursor-pointer disabled:opacity-40"
                >
                  🔄 New Dice Round
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-mono text-[#e6c88c]">
                🌹 Hex&apos;s Cup — {hexDiceEval.rankName} ({hexDiceEval.score} pts) · Tap any die to Hold/Lock:
              </div>
              <div className="flex flex-wrap gap-2">
                {hexDice.map((val, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setHeldDice((prev) => prev.map((h, i) => (i === idx ? !h : h)))
                    }
                    className={`w-14 h-16 rounded-xl flex flex-col items-center justify-center cursor-pointer border-2 transition-all ${
                      heldDice[idx]
                        ? 'bg-amber-950/90 border-[#e6c88c] scale-105'
                        : 'bg-[#1a120e] border-[#785c37]/70'
                    }`}
                  >
                    <span className="text-2xl leading-none text-[#f5ead8]">
                      {DICE_FACES[val]}
                    </span>
                    <span className="text-[9px] font-mono text-[#d4b483] mt-1">
                      {heldDice[idx] ? '🔒 HELD' : `Die ${val}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-mono text-[#cbb693] flex items-center justify-between">
                <span>
                  🖤 Argon&apos;s Cup — {argonDiceEval.rankName} ({argonDiceEval.score} pts):
                </span>
                {isArgonRollingDice && (
                  <span className="text-[10px] font-mono text-[#e6c88c] animate-pulse">
                    Argon is choosing which dice to hold…
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {argonDice.map((val, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-12 rounded-xl bg-[#140e0b] border border-[#6b5331]/60 flex items-center justify-center text-xl text-[#e6c88c]"
                  >
                    {DICE_FACES[val]}
                  </div>
                ))}
              </div>
            </div>

            <p
              data-testid="dice-banner-text"
              className="text-xs font-serif-webtoon text-[#f5ead8] italic bg-[#120d0b]/90 p-2.5 rounded-lg border border-[#6b5331]/50"
            >
              {diceBanner}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={rollsLeft <= 0 || isArgonRollingDice}
                onClick={handleRollDice}
                data-testid="hex-roll-dice-btn"
                className="h-9 px-5 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer disabled:opacity-40"
              >
                🎲 Roll Unheld Dice ({rollsLeft} left)
              </button>
              <button
                type="button"
                disabled={isArgonRollingDice}
                onClick={() => void triggerArgonDiceTurn(hexDice, Math.max(0, rollsLeft))}
                className="h-9 px-4 rounded-full gilded-pill-btn text-xs font-mono cursor-pointer disabled:opacity-40"
              >
                🖤 Ask Argon to Counter-Roll Now
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            GAME 7: ARCANE SIGIL (5-LETTER GOTHIC / SPICY WORD CYPHER WITH ARGON)
           ================================================================ */}
        {activeTab === 'cipher' && (
          <div
            className="p-4 rounded-xl bubble-smoked-glass border border-[#c59b47]/70 space-y-4"
            data-testid="games-cipher-panel"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono text-[#e6c88c]">
                🔐 <strong>Victorian Cryptogram &amp; Secret Cypher (5-Letter Lock)</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isArgonCipherThinking}
                  onClick={() => void handleAskArgonForNewSecretWord()}
                  data-testid="argon-set-cipher-btn"
                  className="h-8 px-3 rounded-full gilded-send-btn text-xs font-mono cursor-pointer disabled:opacity-40"
                >
                  {isArgonCipherThinking ? '🔐 Forging…' : '🖤 Ask Argon for Secret Word'}
                </button>
              </div>
            </div>

            {/* Dual Mode Controls: Ask Argon for a themed/spicy cipher OR Set a word for Argon to crack */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#140e0b]/90 border border-[#6b5331]/60">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#d4b483]">
                  Mode 1: Argon Locks a 5-Letter Word for Hex
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={cipherThemePrompt}
                    onChange={(e) => setCipherThemePrompt(e.target.value)}
                    placeholder="Theme (e.g. spicy, gothic, teasing, dark)…"
                    className="flex-1 h-8 px-2.5 rounded-lg gilded-input-well text-[11px] font-mono text-[#f5ead8]"
                  />
                  <button
                    type="button"
                    disabled={isArgonCipherThinking}
                    onClick={() => void handleAskArgonForNewSecretWord(cipherThemePrompt)}
                    className="h-8 px-2.5 rounded-lg gilded-pill-btn text-[10px] font-mono cursor-pointer shrink-0 disabled:opacity-40"
                  >
                    🔐 Forge Lock
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#e6c88c]">
                  Mode 2: Hex Locks a Secret Word for Argon to Crack
                </label>
                <form onSubmit={handleLockHexWordForArgon} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={5}
                    value={hexSecretWordInput}
                    onChange={(e) =>
                      setHexSecretWordInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))
                    }
                    placeholder="Your 5-letter word…"
                    data-testid="hex-secret-word-input"
                    className="flex-1 h-8 px-2.5 rounded-lg gilded-input-well text-[11px] font-mono uppercase text-[#f5ead8]"
                  />
                  <button
                    type="submit"
                    disabled={isArgonCipherThinking}
                    data-testid="lock-word-for-argon-btn"
                    className="h-8 px-2.5 rounded-lg gilded-send-btn text-[10px] font-mono font-semibold cursor-pointer shrink-0 disabled:opacity-40"
                  >
                    🌹 Challenge Argon
                  </button>
                </form>
              </div>
            </div>

            {cipherClue && (
              <div className="px-3 py-2 rounded-lg bg-[#19120e] border border-[#c59b47]/50 text-xs font-mono text-[#e6c88c]">
                🕯️ <strong>Cryptogram Clue:</strong> {cipherClue}
              </div>
            )}

            <div className="space-y-1.5 max-w-xs mx-auto">
              {Array.from({ length: 6 }).map((_, rowIdx) => {
                const guess = cipherGuesses[rowIdx] || '';
                const states = guess
                  ? scoreWordCipherGuess(guess, cipherTarget)
                  : [];
                return (
                  <div key={rowIdx} className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: 5 }).map((__, colIdx) => {
                      const letter = guess[colIdx] || '';
                      const st = states[colIdx];
                      return (
                        <div
                          key={colIdx}
                          className={`h-11 rounded-lg border flex items-center justify-center font-mono text-sm font-bold ${
                            st === 'correct'
                              ? 'bg-emerald-800/80 border-emerald-400 text-white'
                              : st === 'present'
                              ? 'bg-amber-700/80 border-amber-300 text-white'
                              : letter
                              ? 'bg-[#1a1310] border-[#6b5331] text-[#9e8664]'
                              : 'bg-[#120d0b] border-[#594327]/50 text-[#f5ead8]'
                          }`}
                        >
                          {letter}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <p
              data-testid="cipher-banner-text"
              className="text-xs font-serif-webtoon text-[#f5ead8] italic bg-[#120d0b]/90 p-2.5 rounded-lg border border-[#6b5331]/50"
            >
              {cipherBanner}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <form
                onSubmit={handleSubmitCipherGuess}
                className="flex items-center gap-2 max-w-xs"
              >
                <input
                  type="text"
                  maxLength={5}
                  value={cipherInput}
                  onChange={(e) => setCipherInput(e.target.value.toUpperCase())}
                  placeholder="5-letter word…"
                  aria-label="5-letter cipher guess"
                  className="flex-1 h-9 px-3 rounded-xl gilded-input-well font-mono text-xs uppercase text-[#f5ead8]"
                />
                <button
                  type="submit"
                  disabled={isArgonCipherThinking}
                  className="h-9 px-4 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer disabled:opacity-40"
                >
                  Test Lock
                </button>
              </form>

              {cipherMode === 'hex_sets_word' &&
                !cipherGuesses.includes(cipherTarget) &&
                cipherGuesses.length < 6 && (
                  <button
                    type="button"
                    disabled={isArgonCipherThinking}
                    onClick={() => void triggerArgonCipherGuess(cipherTarget, cipherGuesses)}
                    data-testid="argon-next-cipher-guess-btn"
                    className="h-9 px-3.5 rounded-full gilded-pill-btn text-xs font-mono cursor-pointer disabled:opacity-40"
                  >
                    {isArgonCipherThinking ? '🖤 Guessing…' : '🖤 Argon’s Next Guess'}
                  </button>
                )}
            </div>
          </div>
        )}

        {/* ================================================================
            GAME 8: SHARED COLLABORATIVE WHITEBOARD & SKETCHPAD
           ================================================================ */}
        {activeTab === 'board' && (
          <div className="space-y-3" data-testid="games-whiteboard-panel">
            <WhiteboardStage
              strokes={whiteboardStrokes}
              onAddStrokes={onAddWhiteboardStrokes || (() => {})}
              onUndoStroke={onUndoWhiteboardStroke || (() => {})}
              onClearBoard={onClearWhiteboard || (() => {})}
              onReturnToChat={onClose}
              onAskArgonToDraw={onAskArgonToDrawWhiteboard || (async () => {})}
              isArgonDrawing={isArgonDrawingWhiteboard}
              argonComment={argonWhiteboardComment}
              whiteboardError={whiteboardError}
              onSelectPaidKey={onSelectPaidKey ? async () => { onSelectPaidKey(); } : undefined}
            />
          </div>
        )}
      </main>
    </div>
  );
};

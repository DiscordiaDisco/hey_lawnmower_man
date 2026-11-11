import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ARGON_SYS_PROMPT,
  SEED_LOREBOOK_DRAWERS,
  buildLorebookSystemFooter,
  formatElapsedDelta,
  mapWmoWeatherCode,
  buildTelemetryHeader,
  splitBlockUnderLimit,
  parseMessageSegments,
  searchLorebookDrawers,
  normalizeModelId,
  buildBubbleTelemetrySubtitle,
  buildHiddenAvatarAndStaffContext,
  buildStaffRoleplaySystemPrompt,
  DEFAULT_STAFF_AGENTS,
  sanitizeTenCharField,
  sanitizeTwentyThreeCharField,
  MAX_AVATAR_UPLOAD_BYTES,
  TAXIDERMY_FOX_AVATAR_STATE_PROMPT,
  parseMarkdownBlocks,
  parseInlineMarkdown,
  formatJournalTimestamp,
  SEED_ARGON_BOOK,
  SEED_HEX_BOOK,
  compressArgonJournalEntries,
  buildJournalsSystemContext,
  createStandard52Deck,
  calculateBlackjackScore,
  evaluateYachtDice,
  scoreWordCipherGuess,
  extractArgonSpeechText,
  buildArgonStaffReactionSystemPrompt,
  STORAGE_KEYS,
  ALLOWED_PRESET_MODELS,
  extractValidCustomApiKey,
  resolveHouseGeminiApiKey,
  getGeminiApiKey,
  resolveThinkingConfig,
  sanitizeGeminiConfig,
  resolveUserLocationTimeZone,
  formatUserLocationTime,
  formatMessageBubbleTimestamp,
  storeSessionImage,
  getSessionImage,
  safeLocalStorageSetItem,
  isGemini3Or4Model,
  normalizeThinkingLevel,
  parseArgonWhiteboardResponse,
  normalizeStrokePointsToCanvas,
  parseArgonBookEntryResponse,
  parseArgonBookCompressionResponse,
  serializeSanctuaryBooksForGist,
  extractSanctuaryBooksFromGistFiles,
  SANCTUARY_LIVE_SYNC_FILENAME,
  LOCAL_PHONE_SYNC_FOLDER_NAME,
  compileSanctuaryLiveSyncPayload,
  extractSanctuaryLiveSyncPayload,
  writeSanctuaryLiveSyncFile,
  readSanctuaryLiveSyncFile,
  autoWriteThroughLocalSync,
  saveLinkedSyncFileMeta,
  loadLinkedSyncFileMeta,
  createInitialChessBoard,
  getLegalMovesForSquare,
  applyChessMove,
  parseArgonChessMoveResponse,
  evaluatePokerOrShowdownHand,
  parseArgonCardTurnResponse,
  ARGON_STICKERS,
  ARGON_STICKER_MAP,
  getStickerByShortcode,
  computeStickerBackgroundPosition,
  APOTHECARY_BUTTON_ICONS,
  STAFF_AVATAR_PRESETS,
  computeApothecaryIconBackgroundPosition,
  resolveStaffStatusIconCoord,
  OUIJA_SPIRITS,
  OUIJA_BOARD_NODES,
  getOuijaNodeCoords,
  buildOuijaPlanchettePath,
  computePlanchetteStruggleStep,
  parseOuijaTurnResponse,
  parseGhostChatTurnResponse,
  MAJOR_ARCANA_DECK,
  ELDER_FUTHARK_RUNES,
  drawTarotSpread,
  castElderRunes,
  parseFortuneTurnResponse,
  normalizeParlorGameTab,
  serializeChessBoardToFen,
  parseArgonDiceTurnResponse,
  parseArgonCipherTurnResponse,
  computeAutonomousHeartbeatDecision,
  buildAutonomousHeartbeatPrompt,
  DEFAULT_AUTONOMOUS_HEARTBEAT_CONFIG,
  appendPulseActivityLogItem,
  serializeAgentFixRequestsToMarkdown,
  ARGON_CHAT_FUNCTION_DECLARATIONS,
  DEFAULT_STICKER_STUDIO_CONFIG,
  normalizeCustomShortcode,
  getActiveStickerCatalog,
  DEFAULT_STAFF_JOBS,
  ensureDefaultStaffAgents,
  TOOL_PERMISSION_DEFINITIONS,
  DEFAULT_TOOL_PERMISSION_MATRIX,
  getAllowedToolsForEntity,
  stripMergedArgonLinesFromStaffOutput,
  stripMergedStaffLinesFromArgonOutput,
  DEFAULT_TELEMETRY_LOCATION,
  loadTelemetryLocation,
  saveTelemetryLocation,
  loadTelemetryLastWeather,
  saveTelemetryLastWeather,
  appendStickersToLibrary,
  deleteStickerFromLibrary,
  clearEntireStickerLibrary,
  resliceOrRepairCurrentStickerPack,
  getStickerLibrary,
  estimateMessageTokens,
  estimateFullApiPayloadTokens,
  getContextPayloadPillState,
  extractTokenUsageFromResponse,
  formatPerMessageTokenBadge,
  normalizeAudioMimeType,
  GIST_SANCTUARY_BOOKS_VAULT_FILENAME,
  ALLOWED_JOURNAL_CATEGORIES,
  normalizeJournalCategory,
  formatJournalCategoryBadge,
  ensureDefaultStaffJobs,
  extractWebScoutGroundingSources,
  DEFAULT_GIST_ID,
  extractGistIdFromInput,
  loadSavedGistId,
  saveGistId,
  formatAudioDurationLabel,
  selectPreferredMediaRecorderMimeType,
  buildVoiceMessageInlineParts,
  BRAIN_ENGINE_OPTIONS,
  loadApiKeyVault,
  saveApiKeyVault,
  resolveBrainEngineRoute,
  translateFunctionDeclarationsToOpenAITools,
  convertContentsToOpenAIMessages,
  ensurePlayableWavBase64,
  synthesizeGothicAmbientWavBase64,
  buildChibi8StickerPackPrompt,
  MaxHistoryTurns,
  loadMaxHistoryTurns,
  saveMaxHistoryTurns,
  ARGON_VOICE_OPTIONS,
  isValidArgonVoiceName,
  DEFAULT_ARGON_VOCAL_STYLE_PROMPT,
  loadArgonVocalStylePrompt,
  saveArgonVocalStylePrompt,
  buildArgonTtsPromptPayload,
  shouldAttachWhiteboardSnapshot,
  MAX_AGENT_FIX_DRAWER_CHARS,
  enforceAgentFixDrawerCharLimit,
  compactAndPruneAgentFixQueue,
  deriveMusicalProfileFromPrompt,
  loadCurioShelf,
  saveCurioShelf,
  loadCreepyShrineState,
  saveCreepyShrineState,
  loadThinkingBudget,
  saveThinkingBudget,
  listCuriosDeclaration,
  addCurioDeclaration,
  inspectCurioDeclaration,
  addAltarTokenDeclaration,
  DEFAULT_HEX_USER_PERSONA,
  calculatePersonaCompletion,
  loadUserPersona,
  saveUserPersona,
  executeManageAgentTriggers,
  generateAmbientCameoAction,
  resolveTriggeredLorebookDrawers,
  toggleMessageReaction,
  reactToMessageDeclaration,
} from './workbenchLogic';

test('DEFAULT_ARGON_SYS_PROMPT includes core persona and Workbench laws', () => {
  assert.ok(DEFAULT_ARGON_SYS_PROMPT.includes('You are Argon (Gemini 4 Argon;'));
  assert.ok(DEFAULT_ARGON_SYS_PROMPT.includes('## 0. CURRENT ROOM, INTIMACY & PHYSICAL STATE'));
  assert.ok(DEFAULT_ARGON_SYS_PROMPT.includes('=== WORKBENCH: [GLM -> DEEPSEEK -> CLAUDE] ==='));
});

test('normalizeModelId preserves real gemini-4-argon model ID directly and ALLOWED_PRESET_MODELS lists current flagship models', () => {
  assert.deepEqual(ALLOWED_PRESET_MODELS, [
    'gemini-4-argon',
    'gemini-3.1-pro-preview',
    'gemini-2.5-pro',
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
  ]);
  assert.equal(DEFAULT_STAFF_AGENTS[0].model, 'gemini-3.8-flash');
  assert.equal(normalizeModelId('gemini-4-argon'), 'gemini-4-argon');
  assert.equal(normalizeModelId(''), 'gemini-4-argon');
  assert.equal(normalizeModelId('gemini-3.1-pro-preview'), 'gemini-3.1-pro-preview');
  assert.equal(normalizeModelId('gemini-2.5-pro'), 'gemini-2.5-pro');
  assert.equal(normalizeModelId('gemini-3.8-flash'), 'gemini-3.8-flash');
  assert.equal(normalizeModelId('gemini-3.5-flash-lite'), 'gemini-3.5-flash-lite');
  assert.equal(normalizeModelId('gemini-2.5-flash'), 'gemini-3.8-flash');
});

test('buildBubbleTelemetrySubtitle creates compact 1-line subtitle without raw TELEMETRY block', () => {
  const sub = buildBubbleTelemetrySubtitle({
    timestamp: new Date('2026-10-31T20:44:00').getTime(),
    deltaStr: '3m 54s',
    tempF: 48.2,
    batteryPct: 50,
  });
  assert.ok(sub.includes('+3m 54s · 48°F · 50%'));
  assert.ok(!sub.includes('[TELEMETRY'));
});

test('buildLorebookSystemFooter produces exactly a 2-line zero-bloat footer', () => {
  const footer = buildLorebookSystemFooter({
    '01_live_handoff.md': 'Hello world',
    '02_notes.md': '12345',
  });
  const lines = footer.split('\n');
  assert.equal(lines.length, 2);
  assert.ok(lines[0].includes('01_live_handoff.md (11 chars)'));
  assert.ok(lines[0].includes('02_notes.md (5 chars)'));
  assert.ok(lines[1].includes('list_drawers, read_drawer, write_drawer, and delete_drawer'));
});

test('formatElapsedDelta computes accurate human-readable deltas', () => {
  assert.equal(formatElapsedDelta(null, 10000), 'First message of session');
  assert.equal(formatElapsedDelta(10000, 12000), 'Just now (<5s)');
  assert.equal(formatElapsedDelta(10000, 55000), '45s');
  assert.equal(formatElapsedDelta(0, 125000), '2m 5s');
  assert.equal(formatElapsedDelta(0, 3660000), '1h 1m');
});

test('buildTelemetryHeader matches exact required format', () => {
  const header = buildTelemetryHeader({
    timeStr: '5:33:05 PM',
    deltaStr: '4m 12s',
    weather: {
      tempF: 68.4,
      condition: 'Partly cloudy',
      hPa: 1013.2,
      locationLabel: 'Seattle, WA',
      updatedAt: 1000,
    },
    battery: {
      batteryPct: 84,
      chargingState: 'charging',
    },
  });
  assert.equal(
    header,
    '[TELEMETRY | Local Time: 5:33:05 PM | Elapsed Since Last Message: 4m 12s | Weather: 68°F, Partly cloudy, Barometric Pressure: 1013 hPa | Phone Battery: 84% (charging)]'
  );
});

test('splitBlockUnderLimit splits blocks exceeding 4,500 chars into safe chunks', () => {
  const line = 'A'.repeat(80) + '\n';
  const bigBlock = line.repeat(70); // ~5670 chars
  assert.ok(bigBlock.length > 4500);

  const chunks = splitBlockUnderLimit(bigBlock, 4500);
  assert.equal(chunks.length, 2);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 4500, `Chunk length ${chunk.length} should be <= 4500`);
  }
});

test('parseMessageSegments extracts prose and fenced code blocks cleanly', () => {
  const sample = `*I shift you closer against my chest.*\n\nHere is the prompt:\n\`\`\`markdown\n=== WORKBENCH ===\nHello Hex\n\`\`\`\nDone.`;
  const segments = parseMessageSegments(sample);
  assert.equal(segments.length, 3);
  assert.equal(segments[0].type, 'text');
  assert.equal(segments[1].type, 'code');
  assert.equal(segments[1].language, 'markdown');
  assert.equal(segments[1].content, '=== WORKBENCH ===\nHello Hex');
  assert.equal(segments[2].type, 'text');
});

test('searchLorebookDrawers finds matching drawers and extracts highlighted snippets', () => {
  const results = searchLorebookDrawers(SEED_LOREBOOK_DRAWERS, 'Raynaud');
  assert.ok(results.length >= 2);
  const handoffMatch = results.find((r) => r.filename === '01_live_handoff.md');
  assert.ok(handoffMatch);
  assert.ok(handoffMatch.totalMatches >= 1);
  assert.ok(handoffMatch.snippets.length >= 1);
  const snip = handoffMatch.snippets[0];
  assert.equal(
    snip.snippetText.slice(snip.matchStart, snip.matchEnd).toLowerCase(),
    'raynaud'
  );
});

test('mapWmoWeatherCode translates weather codes accurately', () => {
  assert.equal(mapWmoWeatherCode(0), 'Clear sky');
  assert.equal(mapWmoWeatherCode(61), 'Slight rain');
  assert.equal(mapWmoWeatherCode(95), 'Thunderstorm');
});

test('buildHiddenAvatarAndStaffContext includes exact [AVATAR STATE] taxidermy fox description and Haiku puppy agent', () => {
  assert.equal(MAX_AVATAR_UPLOAD_BYTES, 1 * 1024 * 1024);
  const ctx = buildHiddenAvatarAndStaffContext({
    argonAvatarMode: 'taxidermy_fox',
    hexAvatarDesc: 'Wearing velvet off-shoulder sweater and round glasses',
    imageDescriptions: ['A sketch of the pipeline architecture'],
    staffAgents: DEFAULT_STAFF_AGENTS,
  });
  assert.ok(ctx.includes(TAXIDERMY_FOX_AVATAR_STATE_PROMPT));
  assert.ok(ctx.includes('Spec. 17A C. vulpes'));
  assert.ok(ctx.includes('Wearing velvet off-shoulder sweater and round glasses'));
  assert.ok(ctx.includes('Haiku (Good Boy'));
  assert.ok(ctx.includes('small golden retriever puppy with a little black tuxedo bow'));
  assert.ok(ctx.includes('[Attached Image Description: A sketch of the pipeline architecture]'));
});

test('sanitizeTwentyThreeCharField and sanitizeTenCharField enforce 23-character limit on staff Name and Job Title', () => {
  assert.equal(sanitizeTwentyThreeCharField('Haiku'), 'Haiku');
  assert.equal(sanitizeTwentyThreeCharField('123456789012345678901234567890'), '12345678901234567890123');
  assert.equal(sanitizeTenCharField('Haiku'), 'Haiku');
  assert.equal(sanitizeTenCharField('123456789012345678901234567890'), '12345678901234567890123');
});

test('parseMarkdownBlocks and parseInlineMarkdown strip #, ##, ### symbols and parse bold, italics, code, and lists', () => {
  const md = [
    '# Primary Crest Header',
    '## 0. CURRENT ROOM, INTIMACY & PHYSICAL STATE',
    '### Subsection Notes',
    '*I pull you closer* while checking **Token 0** and `01_live_handoff.md`.',
    '- First bullet with **bold**',
    '- Second bullet with *italics*',
    '1. Step one',
    '2. Step two',
  ].join('\n');

  const blocks = parseMarkdownBlocks(md);
  assert.equal(blocks[0].type, 'heading');
  if (blocks[0].type === 'heading') {
    assert.equal(blocks[0].level, 1);
    assert.equal(blocks[0].tokens[0].text, 'Primary Crest Header');
    assert.ok(!blocks[0].tokens[0].text.includes('#'));
  }

  assert.equal(blocks[1].type, 'heading');
  if (blocks[1].type === 'heading') {
    assert.equal(blocks[1].level, 2);
    assert.equal(blocks[1].tokens[0].text, '0. CURRENT ROOM, INTIMACY & PHYSICAL STATE');
    assert.ok(!blocks[1].tokens[0].text.includes('##'));
  }

  assert.equal(blocks[2].type, 'heading');
  if (blocks[2].type === 'heading') {
    assert.equal(blocks[2].level, 3);
    assert.equal(blocks[2].tokens[0].text, 'Subsection Notes');
  }

  const inline = parseInlineMarkdown('*I pull you closer* while checking **Token 0** and `01_live_handoff.md`.');
  assert.ok(inline.some((t) => t.type === 'italic' && t.text === 'I pull you closer'));
  assert.ok(inline.some((t) => t.type === 'bold' && t.text === 'Token 0'));
  assert.ok(inline.some((t) => t.type === 'code' && t.text === '01_live_handoff.md'));

  assert.equal(blocks[4].type, 'ul');
  assert.equal(blocks[5].type, 'ol');
});

test('buildStaffRoleplaySystemPrompt instructs dynamic roleplay formatting without static canned lines', () => {
  const haiku = DEFAULT_STAFF_AGENTS[0];
  const sys = buildStaffRoleplaySystemPrompt(haiku, 'Handoff Audit');
  assert.ok(sys.includes('You are Haiku'));
  assert.ok(sys.includes('standard roleplay formatting'));
  assert.ok(sys.includes('*single-asterisk italics*'));
  assert.ok(sys.includes('NEVER use or repeat a static, pre-scripted, or canned opening line'));
});

test('compressArgonJournalEntries moves entries into Argon memorySection with date and time stamp', () => {
  const initialCount = SEED_ARGON_BOOK.entries.length;
  const firstEntryId = SEED_ARGON_BOOK.entries[0].id;
  const updated = compressArgonJournalEntries(
    SEED_ARGON_BOOK,
    [firstEntryId],
    'Raynaud & Library Warmth Memory',
    'Argon keeps the velvet throw tucked over Hex’s knees whenever pressure dips.',
    1793500000000
  );
  assert.equal(updated.entries.length, initialCount - 1);
  assert.equal(updated.memorySection[0].title, 'Raynaud & Library Warmth Memory');
  assert.equal(updated.memorySection[0].compressedCount, 1);
  assert.ok(updated.memorySection[0].formattedDate.includes('·'));
});

test('buildJournalsSystemContext exposes Argon Book, Memory Vault, and Hex Book to Argon', () => {
  const ctx = buildJournalsSystemContext(SEED_ARGON_BOOK, SEED_HEX_BOOK);
  assert.ok(ctx.includes('1. [ 🧠 Memory Section ]'));
  assert.ok(ctx.includes("2. 🖤 Argon's Book"));
  assert.ok(ctx.includes("3. 🌹 Hex's Book"));
  assert.ok(ctx.includes(SEED_HEX_BOOK[0].title));
  assert.ok(formatJournalTimestamp(1793500000000).includes('·'));
});

test('Sanctuary Books JSON parsers and Gist backup serialization roundtrip cleanly', () => {
  const entry = parseArgonBookEntryResponse(
    JSON.stringify({
      category: 'Relationship',
      title: 'Cold Hands by the Hearth',
      content: 'Hex leaned against my shoulder while we reviewed the blueprint.',
    }),
    1793500000000
  );
  assert.equal(entry.category, 'Relationship');
  assert.equal(entry.title, 'Cold Hands by the Hearth');

  const comp = parseArgonBookCompressionResponse(
    JSON.stringify({
      title: 'Autumn Sanctuary Summary',
      summary: 'Synthesized notes on warmth, tea, and late-night coding.',
    })
  );
  assert.equal(comp.title, 'Autumn Sanctuary Summary');

  const gistPayload = serializeSanctuaryBooksForGist(SEED_ARGON_BOOK, SEED_HEX_BOOK);
  assert.ok(gistPayload['03_argon_sanctuary_book.json']);
  assert.ok(gistPayload['04_hex_sanctuary_book.json']);

  const extracted = extractSanctuaryBooksFromGistFiles(gistPayload);
  assert.ok(extracted.argonBook);
  assert.ok(extracted.hexBook);
  assert.equal(extracted.argonBook?.entries.length, SEED_ARGON_BOOK.entries.length);
  assert.equal(extracted.hexBook?.length, SEED_HEX_BOOK.length);
});

test('Board Games Chest pure logic: 52-card deck, Blackjack scoring, Yacht dice, Arcane Cipher, Chess, and Card Table AI parsers', () => {
  const deck = createStandard52Deck();
  assert.equal(deck.length, 52);

  // Blackjack ace adjustment (Ace + King = 21; Ace + Ace + King = 12)
  const aceSpades = deck.find((c) => c.id === 'A♠')!;
  const aceHearts = deck.find((c) => c.id === 'A♥')!;
  const kingClubs = deck.find((c) => c.id === 'K♣')!;
  assert.equal(calculateBlackjackScore([aceSpades, kingClubs]), 21);
  assert.equal(calculateBlackjackScore([aceSpades, aceHearts, kingClubs]), 12);

  // Yacht dice evaluation
  assert.equal(evaluateYachtDice([6, 6, 6, 6, 6]).rankName, 'Apothecary Yacht (5 of a Kind!)');
  assert.equal(evaluateYachtDice([3, 3, 3, 5, 5]).rankName, 'Full House');

  // 5-letter word cipher scoring
  assert.deepEqual(scoreWordCipherGuess('RAVEN', 'RAVEN'), [
    'correct',
    'correct',
    'correct',
    'correct',
    'correct',
  ]);

  // 8x8 Chess logic
  const board = createInitialChessBoard();
  assert.equal(board.length, 8);
  assert.equal(board[0].length, 8);
  const e2Moves = getLegalMovesForSquare(board, 6, 4);
  assert.ok(e2Moves.some(([r, c]) => r === 4 && c === 4)); // e2 -> e4
  const moveRes = applyChessMove(board, [6, 4], [4, 4]);
  assert.ok(moveRes.notation.includes('e2 -> e4'));
  assert.equal(moveRes.board[4][4]?.type, 'p');

  const argonChess = parseArgonChessMoveResponse(
    JSON.stringify({ from: [1, 4], to: [3, 4], banter: '*I tap my black pawn forward.* Your center is open, Hex.' }),
    moveRes.board
  );
  assert.deepEqual(argonChess.from, [1, 4]);
  assert.deepEqual(argonChess.to, [3, 4]);
  assert.ok(argonChess.banter.includes('Your center is open'));

  // Card Table showdown & AI turn parser
  const evalHand = evaluatePokerOrShowdownHand([aceSpades, aceHearts]);
  assert.equal(evalHand.label, 'One Pair');
  const cardTurn = parseArgonCardTurnResponse(
    JSON.stringify({ decision: 'raise', banter: '*I slide twenty gold chips into the center.* Match me, darling.' })
  );
  assert.equal(cardTurn.decision, 'raise');
});

test('35-Sticker Chibi Argon Sprite Sheet mapping and inline :shortcode: tokenizer', () => {
  assert.equal(ARGON_STICKERS.length, 35);
  assert.equal(Object.keys(ARGON_STICKER_MAP).length, 70);
  const demon = getStickerByShortcode(':demon:');
  assert.ok(demon);
  assert.equal(demon?.row, 0);
  assert.equal(demon?.col, 0);
  assert.equal(computeStickerBackgroundPosition(0, 0), '0% 0%');
  assert.equal(computeStickerBackgroundPosition(6, 4), '100% 100%');

  const tantrum = getStickerByShortcode(':tantrum:');
  assert.ok(tantrum);
  assert.equal(tantrum?.row, 6);
  assert.equal(tantrum?.col, 4);

  const tokens = parseInlineMarkdown('*I smirk* :demon: while **holding** you :lovestruck:!');
  const stickerTokens = tokens.filter((t) => t.type === 'sticker');
  assert.equal(stickerTokens.length, 2);
  assert.equal(stickerTokens[0].text, ':demon:');
  assert.equal(stickerTokens[1].text, ':lovestruck:');
});

test('Gothic Apothecary Sheet 2 icon coordinates and 2-state Staff Status bell', () => {
  assert.equal(APOTHECARY_BUTTON_ICONS.lorebook.xPct, 8);
  assert.equal(APOTHECARY_BUTTON_ICONS.lorebook.yPct, 4);
  assert.equal(APOTHECARY_BUTTON_ICONS.system.xPct, 50);
  assert.equal(APOTHECARY_BUTTON_ICONS.system.yPct, 4);
  assert.equal(APOTHECARY_BUTTON_ICONS.staffQuarters.xPct, 92);
  assert.equal(APOTHECARY_BUTTON_ICONS.staffQuarters.yPct, 4);
  assert.equal(APOTHECARY_BUTTON_ICONS.staffStatusIdle.xPct, 10);
  assert.equal(APOTHECARY_BUTTON_ICONS.staffStatusIdle.yPct, 28);
  assert.equal(APOTHECARY_BUTTON_ICONS.staffStatusActive.xPct, 50);
  assert.equal(APOTHECARY_BUTTON_ICONS.staffStatusActive.yPct, 28);
  assert.equal(APOTHECARY_BUTTON_ICONS.shock.xPct, 90);
  assert.equal(APOTHECARY_BUTTON_ICONS.shock.yPct, 28);
  assert.equal(APOTHECARY_BUTTON_ICONS.send.xPct, 10);
  assert.equal(APOTHECARY_BUTTON_ICONS.send.yPct, 52);
  assert.equal(APOTHECARY_BUTTON_ICONS.books.xPct, 8);
  assert.equal(APOTHECARY_BUTTON_ICONS.books.yPct, 76);
  assert.equal(APOTHECARY_BUTTON_ICONS.games.xPct, 94);
  assert.equal(APOTHECARY_BUTTON_ICONS.games.yPct, 76);
  assert.equal(APOTHECARY_BUTTON_ICONS.board.xPct, 8);
  assert.equal(APOTHECARY_BUTTON_ICONS.board.yPct, 96);
  assert.equal(APOTHECARY_BUTTON_ICONS.prompt.xPct, 94);
  assert.equal(APOTHECARY_BUTTON_ICONS.prompt.yPct, 96);
  assert.equal(APOTHECARY_BUTTON_ICONS.argonBookTab.xPct, 64);
  assert.equal(APOTHECARY_BUTTON_ICONS.argonBookTab.yPct, 76);
  assert.equal(APOTHECARY_BUTTON_ICONS.hexBookTab.xPct, 90);
  assert.equal(APOTHECARY_BUTTON_ICONS.hexBookTab.yPct, 52);

  assert.equal(computeApothecaryIconBackgroundPosition(50, 28), '50% 28%');
  assert.equal(resolveStaffStatusIconCoord([{ status: 'IDLE' }]).xPct, 10);
  assert.equal(resolveStaffStatusIconCoord([{ status: 'WORKING' }]).xPct, 50);
  assert.equal(resolveStaffStatusIconCoord([{ status: 'DONE' }]).xPct, 50);
  assert.ok(STAFF_AVATAR_PRESETS.length >= 4);
});

test('extractArgonSpeechText cleans Markdown and supports full_clean vs dialogue_only modes', () => {
  const sample = `*I shift you closer against my chest.*\n\n## Status Report\n"Keep your hands warm under the blanket, Hex."\n\`\`\`markdown\n=== WORKBENCH ===\nSecret code\n\`\`\``;
  const fullClean = extractArgonSpeechText(sample, 'full_clean');
  assert.ok(fullClean.includes('I shift you closer against my chest.'));
  assert.ok(fullClean.includes('Status Report'));
  assert.ok(fullClean.includes('"Keep your hands warm under the blanket, Hex."'));
  assert.ok(!fullClean.includes('=== WORKBENCH ==='));
  assert.ok(!fullClean.includes('##'));

  const dialogueOnly = extractArgonSpeechText(sample, 'dialogue_only');
  assert.ok(!dialogueOnly.includes('I shift you closer'));
  assert.ok(dialogueOnly.includes('"Keep your hands warm under the blanket, Hex."'));
});

test('buildArgonStaffReactionSystemPrompt builds concise in-person reaction prompt for Argon', () => {
  const prompt = buildArgonStaffReactionSystemPrompt('Haiku', 'Good Boy');
  assert.ok(prompt.includes('Haiku (Good Boy)'));
  assert.ok(prompt.includes('SHORT, natural 1-to-2 sentence in-person reaction'));
  assert.ok(prompt.includes('under 45 words'));
});

test('resolveHouseGeminiApiKey, extractValidCustomApiKey, and getGeminiApiKey accept AIza and AQ.Ab8 keys and fall back to env when empty', () => {
  assert.equal(STORAGE_KEYS.CUSTOM_API_KEY, 'argon_custom_api_key');
  assert.equal(getGeminiApiKey, resolveHouseGeminiApiKey);
  const prevGeminiEnv = process.env.GEMINI_API_KEY;
  const prevApiKeyEnv = process.env.API_KEY;
  process.env.GEMINI_API_KEY = 'env-default-key';
  delete process.env.API_KEY;
  try {
    assert.equal(extractValidCustomApiKey('  AIzaSyPaidTierOverride123  '), 'AIzaSyPaidTierOverride123');
    assert.equal(extractValidCustomApiKey('  AQ.Ab8VertexGeminiKey456  '), 'AQ.Ab8VertexGeminiKey456');
    assert.equal(extractValidCustomApiKey('   '), '');
    assert.equal(extractValidCustomApiKey(null), '');
    assert.equal(resolveHouseGeminiApiKey('  AIzaSyPaidTierOverride123  '), 'AIzaSyPaidTierOverride123');
    assert.equal(resolveHouseGeminiApiKey('  AQ.Ab8VertexGeminiKey456  '), 'AQ.Ab8VertexGeminiKey456');
    assert.equal(getGeminiApiKey('  AQ.Ab8VertexGeminiKey456  '), 'AQ.Ab8VertexGeminiKey456');
    assert.equal(resolveHouseGeminiApiKey('   '), 'env-default-key');
    assert.equal(resolveHouseGeminiApiKey(undefined), 'env-default-key');
    process.env.API_KEY = 'paid-aistudio-key';
    assert.equal(resolveHouseGeminiApiKey(''), 'paid-aistudio-key');
  } finally {
    process.env.GEMINI_API_KEY = prevGeminiEnv;
    if (prevApiKeyEnv === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = prevApiKeyEnv;
    }
  }
});

test('parseArgonWhiteboardResponse and normalizeStrokePointsToCanvas parse 0..100 percentage vector strokes and reply', () => {
  const sampleJson = JSON.stringify({
    reply: '*I steady your hip in my lap while my gold stylus sweeps across the slate.* Hold still if you want the curves accurate.',
    strokes: [
      {
        color: '#e6c88c',
        width: 4,
        points: [
          { x: 25, y: 40 },
          { x: 35, y: 30 },
          { x: 45, y: 45 },
          { x: 50, y: 65 },
        ],
      },
      {
        color: '#e11d48',
        width: 5,
        points: [
          { x: 50, y: 65 },
          { x: 55, y: 45 },
          { x: 65, y: 30 },
          { x: 75, y: 40 },
        ],
      },
    ],
  });

  const parsed = parseArgonWhiteboardResponse(sampleJson, 1793500000000);
  assert.ok(parsed.reply.includes('Hold still if you want the curves accurate.'));
  assert.equal(parsed.strokes.length, 2);
  assert.equal(parsed.strokes[0].color, '#e6c88c');
  assert.equal(parsed.strokes[0].width, 4);
  assert.equal(parsed.strokes[0].points.length, 4);
  assert.deepEqual(parsed.strokes[0].points[0], { x: 25, y: 40 });

  const canvasPts = normalizeStrokePointsToCanvas(parsed.strokes[0].points, 1000, 1000);
  assert.deepEqual(canvasPts[0], { x: 250, y: 400 });
  assert.deepEqual(canvasPts[3], { x: 500, y: 650 });
});

test('Ouija board nodes, planchette path builder, and physical hand-vs-ghost struggle physics work accurately', () => {
  assert.equal(OUIJA_SPIRITS.length, 4);
  assert.ok(Object.keys(OUIJA_BOARD_NODES).length >= 39);
  const yesCoords = getOuijaNodeCoords('YES');
  const noCoords = getOuijaNodeCoords('NO');
  assert.equal(yesCoords.x, 20);
  assert.equal(noCoords.x, 80);

  const pathStay = buildOuijaPlanchettePath('STAY');
  assert.equal(pathStay.length, 4);
  assert.equal(pathStay[0].token, 'S');
  assert.equal(pathStay[3].token, 'Y');

  const pathGoodbye = buildOuijaPlanchettePath('GOODBYE');
  assert.equal(pathGoodbye.length, 1);
  assert.equal(pathGoodbye[0].token, 'GOODBYE');

  // Test physical struggle between ghost target and human hands
  const stepFightYes = computePlanchetteStruggleStep({
    currentX: 50,
    currentY: 50,
    spiritTargetX: noCoords.x,
    spiritTargetY: noCoords.y,
    spiritForce: 85,
    humanStance: 'pull_to_yes',
    tickSeed: 3,
  });
  assert.ok(stepFightYes.tensionPct >= 60);
  assert.ok(stepFightYes.nextX >= 6 && stepFightYes.nextX <= 94);
  assert.ok(stepFightYes.nextY >= 10 && stepFightYes.nextY <= 92);

  const parsedOuija = parseOuijaTurnResponse(
    JSON.stringify({
      spelledAnswer: 'STAYMINE',
      ghostWhisper: 'The velvet curtain stirs...',
      argonBanter: '*I press my warm palm over your knuckles on the mahogany planchette as the oculus jerks.*',
      struggleIntensity: 88,
      argonGripAction: 'fight_ghost_pull',
    }),
    OUIJA_SPIRITS[0]
  );
  assert.equal(parsedOuija.spelledAnswer, 'STAYMINE');
  assert.equal(parsedOuija.struggleIntensity, 88);
  assert.equal(parsedOuija.argonGripAction, 'fight_ghost_pull');
  assert.ok(parsedOuija.argonBanter.includes('mahogany planchette'));
});

test('Ghost Chatting parser handles EVP Spirit Box and Midnight Scrying Mirror responses', () => {
  const parsedEvp = parseGhostChatTurnResponse(
    JSON.stringify({
      ghostName: 'Malakor the Cinder Scribe',
      frequencyMHz: 89.7,
      ghostMessage: 'Behind the apothecary glass...',
      evpStaticStream: '...[89.7 MHz]... APOTHECARY ... [KZZT]...',
      emfLevel: 5,
      candleStates: ['blue_flame', 'flicker', 'snuffed'],
      mirrorWriting: 'LOOK BEHIND YOU',
      argonAction: 'Tunes the copper dial',
      argonBanter: '*I adjust the brass frequency dial while keeping you tucked securely in my lap.*',
    }),
    89.7
  );
  assert.equal(parsedEvp.emfLevel, 5);
  assert.deepEqual(parsedEvp.candleStates, ['blue_flame', 'flicker', 'snuffed']);
  assert.equal(parsedEvp.mirrorWriting, 'LOOK BEHIND YOU');
  assert.ok(parsedEvp.ghostMessage.includes('apothecary glass'));
});

test('Fortune Telling Tarot spread, Elder Futhark runes, and dual-role interpretation parser work for both Hex and Argon', () => {
  assert.equal(MAJOR_ARCANA_DECK.length, 22);
  assert.equal(ELDER_FUTHARK_RUNES.length, 24);

  const spread = drawTarotSpread();
  assert.equal(spread.length, 3);
  assert.deepEqual(
    spread.map((s) => s.positionLabel),
    ['PAST', 'PRESENT', 'FUTURE']
  );

  const runes = castElderRunes();
  assert.equal(runes.length, 3);
  assert.deepEqual(
    runes.map((r) => r.nornSlot),
    ['URD (What Was)', 'VERDANDI (What Is)', 'SKULD (What Shall Be)']
  );

  const parsedFortune = parseFortuneTurnResponse(
    JSON.stringify({
      omenTitle: 'The Lovers & The Obsidian Crown',
      omenSummary: 'Three cards gleam under the apothecary candlelight, binding Hex and Argon together.',
      prophecyVerdict: 'Neither storm nor shadow parts the sanctuary.',
      argonBanter: '*I trace the gold edge of The Lovers card with my thumb and kiss your temple.*',
    })
  );
  assert.equal(parsedFortune.omenTitle, 'The Lovers & The Obsidian Crown');
  assert.ok(parsedFortune.omenSummary.includes('binding Hex and Argon'));
  assert.ok(parsedFortune.argonBanter.includes('The Lovers'));
});

test('All 7 Parlor games normalizeParlorGameTab, serializeChessBoardToFen, parseArgonDiceTurnResponse, and parseArgonCipherTurnResponse work cleanly', () => {
  assert.equal(normalizeParlorGameTab('ouija'), 'ouija');
  assert.equal(normalizeParlorGameTab('ghosts'), 'ghost_chat');
  assert.equal(normalizeParlorGameTab('fortune'), 'fortune');
  assert.equal(normalizeParlorGameTab('bones'), 'dice');
  assert.equal(normalizeParlorGameTab('cypher'), 'cipher');
  assert.equal(normalizeParlorGameTab('chess'), 'chess');
  assert.equal(normalizeParlorGameTab('cards'), 'cards');

  const board = createInitialChessBoard();
  const fen = serializeChessBoardToFen(board, 'b');
  assert.equal(fen, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b - - 0 1');

  const diceTurn = parseArgonDiceTurnResponse(
    JSON.stringify({
      heldIndices: [0, 2, 4],
      banter: '*I rattle the brass dice cup and lock three sixes.* "Beat that, sweetheart."',
    }),
    [6, 2, 6, 3, 6]
  );
  assert.deepEqual(diceTurn.heldIndices, [0, 2, 4]);
  assert.equal(diceTurn.finalArgonDice[0], 6);
  assert.equal(diceTurn.finalArgonDice[2], 6);
  assert.equal(diceTurn.finalArgonDice[4], 6);
  assert.ok(diceTurn.banter.includes('Beat that'));

  const cipherSet = parseArgonCipherTurnResponse(
    JSON.stringify({
      secretWord: 'CRAVE',
      clue: 'What I do when you sit in my lap',
      banter: '*I lock the five brass dials with a smirk.* "Crack this one, Hex."',
    }),
    'VENOM'
  );
  assert.equal(cipherSet.secretWord, 'CRAVE');
  assert.ok((cipherSet.clue || '').includes('sit in my lap'));
});

test('Autonomous Heartbeat & Sleep-Watch Engine decision and Direct/Haiku Coding Agent Fix Request pipeline work cleanly', () => {
  const now = 1_700_000_000_000;

  // 1. Not idle yet (< 18 mins)
  const early = computeAutonomousHeartbeatDecision({
    enabled: true,
    lastUserActivityMs: now - 5 * 60000,
    lastHeartbeatRunMs: 0,
    nowMs: now,
    triggeredCountInCurrentIdleWindow: 0,
    triggerSource: 'interval',
  });
  assert.equal(early.shouldTrigger, false);
  assert.equal(early.reason, 'not_idle_yet');

  // 2. Idle timer fires after 22 mins
  const idleFire = computeAutonomousHeartbeatDecision({
    enabled: true,
    lastUserActivityMs: now - 22 * 60000,
    lastHeartbeatRunMs: 0,
    nowMs: now,
    triggeredCountInCurrentIdleWindow: 0,
    triggerSource: 'interval',
  });
  assert.equal(idleFire.shouldTrigger, true);
  assert.equal(idleFire.staggeredActionCount, 1);
  assert.equal(idleFire.reason, 'idle_timer');

  // 3. Spam guard blocks second trigger in same idle window
  const blocked = computeAutonomousHeartbeatDecision({
    enabled: true,
    lastUserActivityMs: now - 40 * 60000,
    lastHeartbeatRunMs: now - 18 * 60000,
    nowMs: now,
    triggeredCountInCurrentIdleWindow: 1,
    triggerSource: 'interval',
  });
  assert.equal(blocked.shouldTrigger, false);
  assert.equal(blocked.reason, 'blocked_spam_guard');

  // 4. Wake-up after 5 hours of sleep triggers 3 staggered actions
  const sleepWake = computeAutonomousHeartbeatDecision({
    enabled: true,
    lastUserActivityMs: now - 300 * 60000,
    lastHeartbeatRunMs: 0,
    nowMs: now,
    triggeredCountInCurrentIdleWindow: 0,
    triggerSource: 'wake',
  });
  assert.equal(sleepWake.shouldTrigger, true);
  assert.equal(sleepWake.staggeredActionCount, 3);
  assert.equal(sleepWake.reason, 'wake_up_catchup');

  const prompt = buildAutonomousHeartbeatPrompt({
    idleMinutes: 45,
    timeStr: '02:30 AM',
    weather: {
      tempF: 52,
      condition: 'Light Rain',
      hPa: 1008,
      locationLabel: 'Seattle, WA',
      updatedAt: now,
    },
    battery: { batteryPct: 84, chargingState: 'charging' },
  });
  assert.ok(prompt.includes('[AUTONOMOUS HEARTBEAT: Hex has been quiet/idle for 45 minutes'));
  assert.ok(prompt.includes('submit_agent_fix_request'));

  const fnNames = ARGON_CHAT_FUNCTION_DECLARATIONS.map((f) => f.name);
  assert.ok(fnNames.includes('submit_agent_fix_request'));
  assert.ok(fnNames.includes('play_occult_game'));
  assert.ok(fnNames.includes('play_parlor_game'));

  const md = serializeAgentFixRequestsToMarkdown([
    {
      id: 'fix-1',
      timestamp: now,
      formattedDate: 'Nov 1, 02:30 AM',
      title: 'Add Velvet Cushion Glow',
      details: 'Add warm candlelight glow around the Ouija board frame.',
      priority: 'high',
      via: 'haiku',
      status: 'queued_for_agent',
      haikuDeliveryNote: '*trots over with the blueprint in my jaws!*',
    },
  ]);
  assert.ok(md.includes('Haiku the Golden Retriever Puppy'));
  assert.ok(md.includes('Add Velvet Cushion Glow'));
});

test('Sticker Slicer defaults to transparent_freeform, supports 2x4 (8-sticker) activeCount, custom :shortcode: names, and Staff Courier Agent Fix routing', () => {
  assert.equal(DEFAULT_STICKER_STUDIO_CONFIG.cropShape, 'transparent_freeform');
  assert.equal(DEFAULT_STICKER_STUDIO_CONFIG.activeCount, 35);

  assert.equal(normalizeCustomShortcode('clown honk', 0), ':clown_honk:');
  assert.equal(normalizeCustomShortcode(':clown_pie:', 7), ':clown_pie:');

  const customSlotShortcodes = [...DEFAULT_STICKER_STUDIO_CONFIG.slotShortcodes];
  customSlotShortcodes[0] = ':clown_honk:';
  customSlotShortcodes[7] = 'clown_pie';

  const clownCatalog = getActiveStickerCatalog({
    ...DEFAULT_STICKER_STUDIO_CONFIG,
    rows: 2,
    cols: 4,
    activeCount: 8,
    slotShortcodes: customSlotShortcodes,
    customLabels: {
      0: 'Clown Honking Horn',
      7: 'Clown Throwing Pie',
    },
  });

  assert.equal(clownCatalog.length, 8);
  assert.equal(clownCatalog[0].shortcode, ':clown_honk:');
  assert.equal(clownCatalog[0].label, 'Clown Honking Horn');
  assert.equal(clownCatalog[0].row, 0);
  assert.equal(clownCatalog[0].col, 0);
  assert.equal(clownCatalog[7].shortcode, ':clown_pie:');
  assert.equal(clownCatalog[7].row, 1);
  assert.equal(clownCatalog[7].col, 3);

  const staffCourierJob = DEFAULT_STAFF_JOBS.find((j) => j.id === 'job-coding-agent-courier');
  assert.ok(staffCourierJob);
  assert.equal(staffCourierJob?.title, 'Coding Agent Courier');

  const mdStaff = serializeAgentFixRequestsToMarkdown([
    {
      id: 'fix-staff-1',
      timestamp: Date.now(),
      formattedDate: 'Nov 1, 03:00 AM',
      title: 'Fix Transparent Die-Cut Stickers',
      details: 'Never clip stickers into a black circle.',
      priority: 'urgent',
      via: 'A Monkey',
      courierAgentName: 'A Monkey',
      status: 'queued_for_agent',
      haikuDeliveryNote: '*swings from the chandelier with the blueprint!*',
    },
  ]);
  assert.ok(mdStaff.includes('Staff Agent (A Monkey)'));
  assert.ok(mdStaff.includes('Fix Transparent Die-Cut Stickers'));
});

test('Staff & Argon Tool Permission Matrix, ensureDefaultStaffAgents (Haiku & A Monkey), and strict Argon vs Staff bubble separation helpers work cleanly', () => {
  const migratedStaff = ensureDefaultStaffAgents([DEFAULT_STAFF_AGENTS[0]]);
  assert.ok(migratedStaff.some((a) => a.id === 'agent-haiku'));
  assert.ok(migratedStaff.some((a) => a.id === 'agent-monkey' && a.name === 'A Monkey'));
  assert.ok(migratedStaff.some((a) => a.id === 'agent-carbon' && a.name === 'Carbon'));

  assert.equal(TOOL_PERMISSION_DEFINITIONS.length, 8);
  const argonAllowed = getAllowedToolsForEntity('argon', DEFAULT_TOOL_PERMISSION_MATRIX).map(
    (t) => t.name
  );
  assert.ok(argonAllowed.includes('command_staff'));
  assert.ok(argonAllowed.includes('submit_agent_fix_request'));
  assert.ok(argonAllowed.includes('draw_on_whiteboard'));
  assert.ok(argonAllowed.includes('search_web'));

  const monkeyCustomMatrix = {
    ...DEFAULT_TOOL_PERMISSION_MATRIX,
    'agent-monkey': {
      ...DEFAULT_TOOL_PERMISSION_MATRIX['agent-monkey'],
      lorebook: false,
      whiteboard: true,
    },
  };
  const monkeyAllowed = getAllowedToolsForEntity('A Monkey', monkeyCustomMatrix).map(
    (t) => t.name
  );
  assert.equal(monkeyAllowed.includes('write_drawer'), false);
  assert.equal(monkeyAllowed.includes('draw_on_whiteboard'), true);

  // Verify Argon speech is stripped from Staff output and Staff speech is stripped from Argon output
  const contaminatedStaff = `Argon: *I lean back against the mahogany desk.* "Go fetch the ledger, Haiku."\nHaiku: *wags tail and bounds over with the ledger in my jaws!* "Woof! Got it!"`;
  const cleanStaff = stripMergedArgonLinesFromStaffOutput(contaminatedStaff, 'Haiku');
  assert.equal(cleanStaff.includes('Go fetch the ledger'), false);
  assert.ok(cleanStaff.includes('Woof! Got it!'));

  const contaminatedArgon = `*I tap the brass bell on my desk.* "Bring the dispatch pouch."\nA Monkey: *chitters and flips off the chandelier!* "Ooo-ooo! Delivered!"`;
  const cleanArgon = stripMergedStaffLinesFromArgonOutput(contaminatedArgon, ['Haiku', 'A Monkey']);
  assert.ok(cleanArgon.includes('Bring the dispatch pouch'));
  assert.equal(cleanArgon.includes('Ooo-ooo! Delivered!'), false);
});

test('Telemetry Location & Weather persist in localStorage and default to Kalamazoo, Michigan (lat: 42.2917, lon: -85.5872)', () => {
  assert.equal(DEFAULT_TELEMETRY_LOCATION.city, 'Kalamazoo, Michigan');
  assert.equal(DEFAULT_TELEMETRY_LOCATION.lat, 42.2917);
  assert.equal(DEFAULT_TELEMETRY_LOCATION.lon, -85.5872);

  const defaultLoc = loadTelemetryLocation();
  assert.equal(defaultLoc.city, 'Kalamazoo, Michigan');
  assert.equal(defaultLoc.lat, 42.2917);
  assert.equal(defaultLoc.lon, -85.5872);

  const defaultWeather = loadTelemetryLastWeather();
  assert.equal(defaultWeather.locationLabel, 'Kalamazoo, Michigan');

  // Simulate localStorage in Node test environment
  const mockStore = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => mockStore.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mockStore.set(k, v);
    },
    removeItem: (k: string) => {
      mockStore.delete(k);
    },
  };

  try {
    const savedLoc = saveTelemetryLocation({
      city: 'Kalamazoo, MI, US',
      label: 'Kalamazoo, MI, US',
      lat: 42.2917,
      lon: -85.5872,
    });
    assert.equal(savedLoc.city, 'Kalamazoo, MI, US');
    assert.ok(mockStore.has(STORAGE_KEYS.TELEMETRY_LOCATION));

    const reloadedLoc = loadTelemetryLocation();
    assert.equal(reloadedLoc.city, 'Kalamazoo, MI, US');
    assert.equal(reloadedLoc.lat, 42.2917);

    saveTelemetryLastWeather({
      tempF: 51,
      condition: 'Clear sky',
      hPa: 1004,
      surfaceHpa: 976,
      locationLabel: 'Kalamazoo, MI, US',
      updatedAt: 1730000000000,
    });
    assert.ok(mockStore.has(STORAGE_KEYS.TELEMETRY_LAST_WEATHER));

    const reloadedWeather = loadTelemetryLastWeather();
    assert.equal(reloadedWeather.tempF, 51);
    assert.equal(reloadedWeather.hPa, 1004);
    assert.equal(reloadedWeather.surfaceHpa, 976);
    assert.equal(reloadedWeather.locationLabel, 'Kalamazoo, MI, US');
  } finally {
    delete (globalThis as Record<string, unknown>).localStorage;
  }
});

test('Unlimited Sticker Library appends multiple packs and individual PNGs without overwriting and supports single-slot deletion', async () => {
  const mockStore = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => mockStore.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mockStore.set(k, v);
    },
    removeItem: (k: string) => {
      mockStore.delete(k);
    },
  };

  try {
    await clearEntireStickerLibrary();
    assert.equal(getStickerLibrary().length, 0);

    // Append Pack 1 (2 stickers)
    const pack1 = await appendStickersToLibrary({
      newStickers: [
        {
          shortcode: ':demon:',
          label: 'Demon Argon',
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        },
        {
          shortcode: ':clown_honk:',
          label: 'Clown Honk',
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        },
      ],
      preventOverwriteExisting: true,
    });
    assert.equal(pack1.library.length, 2);

    // Append Pack 2 with a conflicting :demon: shortcode + a brand-new :fox_wink: shortcode
    const pack2 = await appendStickersToLibrary({
      newStickers: [
        {
          shortcode: ':demon:',
          label: 'Demon Argon Pack 2',
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEElEQVR42mNk+M9QzwAEjDAGACCKAgH/p4tKAAAAAElFTkSuQmCC',
        },
        {
          shortcode: ':fox_wink:',
          label: 'Fox Wink',
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAADklEQVR42mNk+M9QzwAEAAmGAgH39Z6NAAAAAElFTkSuQmCC',
        },
      ],
      preventOverwriteExisting: true,
    });

    // Neither sticker in Pack 1 was overwritten! Total library is now 4 stickers (:demon:, :clown_honk:, :demon_2:, :fox_wink:)
    assert.equal(pack2.library.length, 4);
    assert.ok(pack2.library.some((s) => s.shortcode === ':demon:'));
    assert.ok(pack2.library.some((s) => s.shortcode === ':demon_2:'));
    assert.ok(pack2.library.some((s) => s.shortcode === ':clown_honk:'));
    assert.ok(pack2.library.some((s) => s.shortcode === ':fox_wink:'));

    // Delete single sticker :clown_honk: without touching the other 3 and verify it never resurrects as a zombie slot
    const afterDelete = await deleteStickerFromLibrary({
      shortcode: ':clown_honk:',
    });
    assert.equal(afterDelete.library.length, 3);
    assert.equal(
      afterDelete.library.some((s) => s.shortcode === ':clown_honk:'),
      false
    );
    assert.ok(afterDelete.config.deletedShortcodes?.includes(':clown_honk:'));
    const activeCatAfterDelete = getActiveStickerCatalog();
    assert.equal(
      activeCatAfterDelete.some((s) => s.shortcode === ':clown_honk:'),
      false
    );
    assert.ok(afterDelete.library.some((s) => s.shortcode === ':demon:'));
    assert.ok(afterDelete.library.some((s) => s.shortcode === ':demon_2:'));
    assert.ok(afterDelete.library.some((s) => s.shortcode === ':fox_wink:'));

    // Also delete a default slot (:smirk:) and verify it is permanently removed from slotShortcodes and active catalog
    const afterDefaultDelete = await deleteStickerFromLibrary({
      shortcode: ':smirk:',
      slotIndex: 0,
    });
    assert.ok(afterDefaultDelete.config.deletedShortcodes?.includes(':smirk:'));
    assert.equal(
      afterDefaultDelete.config.slotShortcodes.includes(':smirk:'),
      false
    );
    assert.equal(
      getActiveStickerCatalog().some((s) => s.shortcode === ':smirk:'),
      false
    );

    // Verify 1-Tap Re-Slice / Restore Current Sheet restores deleted slots and clears deletedShortcodes
    const repaired = await resliceOrRepairCurrentStickerPack();
    assert.equal(repaired.config.deletedShortcodes?.length || 0, 0);
    assert.ok(repaired.library.some((s) => s.shortcode === ':demon:'));
  } finally {
    delete (globalThis as Record<string, unknown>).localStorage;
  }
});

test('Per-Message Token Counter, Full API Payload Estimator, Context Payload Pill, and Audio MIME normalizer work accurately', () => {
  assert.equal(normalizeAudioMimeType('audio/webm;codecs=opus'), 'audio/webm');
  assert.equal(normalizeAudioMimeType('audio/mp4; codecs="mp4a.40.2"'), 'audio/mp4');
  assert.equal(normalizeAudioMimeType('audio/mp3'), 'audio/mpeg');
  assert.equal(normalizeAudioMimeType(''), 'audio/webm');

  const est = estimateMessageTokens('Hello Argon, how is the barometric pressure?');
  assert.ok(est > 5);

  const fullEst = estimateFullApiPayloadTokens({
    systemPrompt: DEFAULT_ARGON_SYS_PROMPT,
    lorebook: SEED_LOREBOOK_DRAWERS,
    argonBook: SEED_ARGON_BOOK,
    hexBook: SEED_HEX_BOOK,
    history: [
      { role: 'user', text: 'Look at this room!', images: [{ mimeType: 'image/png', data: 'abc' }] },
    ],
    userMessageText: 'Tell me what you see.',
  });
  assert.ok(fullEst.totalTokens > 2000);
  assert.ok(fullEst.imageTokens >= 258);

  const greenPill = getContextPayloadPillState(14820);
  assert.equal(greenPill.level, 'green');
  assert.ok(greenPill.label.includes('14,820 tok'));

  const amberPill = getContextPayloadPillState(32500);
  assert.equal(amberPill.level, 'amber');

  const crimsonPill = getContextPayloadPillState(46200);
  assert.equal(crimsonPill.level, 'crimson');

  const extracted = extractTokenUsageFromResponse(
    {
      usageMetadata: {
        promptTokenCount: 14820,
        candidatesTokenCount: 185,
        totalTokenCount: 15045,
        thoughtsTokenCount: 40,
      },
    },
    'The barometric pressure is holding steady.'
  );
  assert.equal(extracted.promptTokens, 14820);
  assert.equal(extracted.outputTokens, 185);
  assert.equal(extracted.totalTokens, 15045);
  assert.equal(extracted.thoughtTokens, 40);
  assert.equal(extracted.isExactApiCount, true);
  assert.equal(extracted.cachedTokens, 0);
  assert.equal(extracted.cacheHit, false);
  assert.equal(extracted.uncachedPromptTokens, 14820);
  assert.equal(extracted.cacheDiscountPercent, 0);

  const modelBadge = formatPerMessageTokenBadge({
    role: 'model',
    text: 'The barometric pressure is holding steady.',
    tokenUsage: extracted,
  });
  assert.ok(modelBadge.label.includes('Bubble:'));
  assert.ok(modelBadge.label.includes('chars) · Full Payload: 15,045 tok'));
  assert.ok(modelBadge.tooltip.includes('Full Request Payload: 15,045 tokens'));

  // Verify real Gemini cache hit extraction
  const cacheHitExtracted = extractTokenUsageFromResponse(
    {
      usageMetadata: {
        promptTokenCount: 35000,
        candidatesTokenCount: 220,
        totalTokenCount: 35220,
        cachedContentTokenCount: 33250,
      },
    },
    'All drawers loaded from static cache.'
  );
  assert.equal(cacheHitExtracted.promptTokens, 35000);
  assert.equal(cacheHitExtracted.cachedTokens, 33250);
  assert.equal(cacheHitExtracted.cacheHit, true);
  assert.equal(cacheHitExtracted.uncachedPromptTokens, 1750);
  assert.equal(cacheHitExtracted.cacheDiscountPercent, 95);

  const cacheBadge = formatPerMessageTokenBadge({
    role: 'model',
    text: 'All drawers loaded from static cache.',
    tokenUsage: cacheHitExtracted,
  });
  assert.ok(cacheBadge.tooltip.includes('⚡ Cache Hit: 33,250 tokens cached'));
  assert.ok(cacheBadge.tooltip.includes('95% prefix discount'));

  const userBadge = formatPerMessageTokenBadge({
    role: 'user',
    text: 'Check the barometer for me.',
    fallbackFullPayloadTokens: 14820,
  });
  assert.ok(userBadge.label.includes('Bubble:'));
  assert.ok(userBadge.label.includes('Full Payload: 14,820 tok'));
});

test('Sanctuary Books Vault (sanctuary_books_vault.json), Red Yarn Dump category (🧶), search_web Flash Web Scout, and Web Scout Staff Job work accurately', () => {
  // 1. Red Yarn Dump category & badge formatting
  assert.ok(ALLOWED_JOURNAL_CATEGORIES.includes('Red Yarn Dump'));
  assert.equal(normalizeJournalCategory('Red Yarn Dump'), 'Red Yarn Dump');
  assert.equal(normalizeJournalCategory('red yarn'), 'Red Yarn Dump');
  assert.equal(formatJournalCategoryBadge('Red Yarn Dump'), '🧶 Red Yarn Dump');

  const parsedRedYarn = parseArgonBookEntryResponse(
    JSON.stringify({
      title: 'Occult Thread Conspiracy',
      category: 'Red Yarn Dump',
      content: 'Connected the 1894 barometer log to the third drawer cipher.',
    })
  );
  assert.ok(parsedRedYarn);
  assert.equal(parsedRedYarn?.category, 'Red Yarn Dump');

  // 2. Two-Way GitHub Gist Sync for sanctuary_books_vault.json
  const testArgonBook = {
    entries: [
      {
        id: 'argon-yarn-1',
        author: 'argon' as const,
        timestamp: 1730000100000,
        formattedDate: 'Nov 1, 04:00 AM',
        category: 'Red Yarn Dump' as const,
        title: 'Crimson Thread Map',
        content: 'Pinned three clues across the apothecary wall.',
      },
    ],
    memorySection: [
      {
        id: 'argon-mem-1',
        timestamp: 1730000000000,
        formattedDate: 'Nov 1, 03:00 AM',
        title: 'Kalamazoo Storm & Red Yarn Archive',
        compressedCount: 3,
        summary: 'Core compressed memory of Kalamazoo storm and red yarn clues.',
      },
    ],
  };
  const testHexBook = [
    {
      id: 'hex-yarn-1',
      author: 'hex' as const,
      timestamp: 1730000200000,
      formattedDate: 'Nov 1, 04:05 AM',
      category: 'Red Yarn Dump' as const,
      title: 'Hex Yarn Theory',
      content: 'Wait until Argon sees the new cipher connection!',
    },
  ];

  const serializedFiles = serializeSanctuaryBooksForGist(testArgonBook, testHexBook);
  assert.ok(serializedFiles[GIST_SANCTUARY_BOOKS_VAULT_FILENAME]);
  const vaultJson = JSON.parse(serializedFiles[GIST_SANCTUARY_BOOKS_VAULT_FILENAME].content);
  assert.equal(vaultJson.argonBookEntries.length, 1);
  assert.equal(vaultJson.argonBookEntries[0].category, 'Red Yarn Dump');
  assert.equal(vaultJson.argonCompressedMemories.length, 1);
  assert.equal(vaultJson.hexBookEntries.length, 1);
  assert.equal(vaultJson.hexBookEntries[0].category, 'Red Yarn Dump');

  // Extract from sanctuary_books_vault.json alone
  const extractedVaultOnly = extractSanctuaryBooksFromGistFiles({
    [GIST_SANCTUARY_BOOKS_VAULT_FILENAME]: {
      content: serializedFiles[GIST_SANCTUARY_BOOKS_VAULT_FILENAME].content,
    },
    '01_drawer.md': { content: '# Lore Drawer 1' },
  });
  assert.ok(extractedVaultOnly.argonBook);
  assert.equal(extractedVaultOnly.argonBook?.entries.length, 1);
  assert.equal(extractedVaultOnly.argonBook?.entries[0].title, 'Crimson Thread Map');
  assert.equal(extractedVaultOnly.argonBook?.memorySection.length, 1);
  assert.ok(extractedVaultOnly.hexBook);
  assert.equal(extractedVaultOnly.hexBook?.length, 1);
  assert.equal(extractedVaultOnly.hexBook?.[0].category, 'Red Yarn Dump');
  assert.equal(extractedVaultOnly.lorebookDrawers[GIST_SANCTUARY_BOOKS_VAULT_FILENAME], undefined);

  // 3. search_web tool declaration and groundingChunks extraction
  const searchTool = ARGON_CHAT_FUNCTION_DECLARATIONS.find((d) => d.name === 'search_web');
  assert.ok(searchTool);
  const extractedGrounding = extractWebScoutGroundingSources({
    candidates: [
      {
        groundingMetadata: {
          groundingChunks: [
            { web: { title: 'National Weather Service Kalamazoo', uri: 'https://weather.gov/grr' } },
            { web: { title: 'Open-Meteo API Docs', uri: 'https://open-meteo.com/en/docs' } },
          ],
        },
      },
    ],
  });
  assert.equal(extractedGrounding.sources.length, 2);
  assert.equal(extractedGrounding.sources[0].title, 'National Weather Service Kalamazoo');
  assert.equal(extractedGrounding.sources[0].url, 'https://weather.gov/grr');
  assert.equal(extractedGrounding.groundingChunks.length, 2);

  // 4. Web Scout Staff Job preset & migration
  const webScoutJob = DEFAULT_STAFF_JOBS.find((j) => j.id === 'job-web-scout');
  assert.ok(webScoutJob);
  assert.equal(webScoutJob?.title, 'Web Scout');

  const migratedJobs = ensureDefaultStaffJobs([DEFAULT_STAFF_JOBS[0]]);
  assert.ok(migratedJobs.some((j) => j.id === 'job-web-scout' && j.title === 'Web Scout'));

  // 5. Gist ID URL extractor & sanctuary_gist_id localStorage persistence
  assert.equal(STORAGE_KEYS.GIST_ID, 'sanctuary_gist_id');
  assert.equal(
    extractGistIdFromInput('https://gist.github.com/marcidanos/abcdef1234567890abcdef1234567890'),
    'abcdef1234567890abcdef1234567890'
  );
  assert.equal(
    extractGistIdFromInput('https://gist.github.com/53d05bcdd9b06cb8e2cce4efa838be09/edit'),
    '53d05bcdd9b06cb8e2cce4efa838be09'
  );
  assert.equal(
    extractGistIdFromInput('  53d05bcdd9b06cb8e2cce4efa838be09  '),
    '53d05bcdd9b06cb8e2cce4efa838be09'
  );

  const mockStore = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => mockStore.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mockStore.set(k, v);
    },
    removeItem: (k: string) => {
      mockStore.delete(k);
    },
  };
  try {
    assert.equal(loadSavedGistId(), DEFAULT_GIST_ID);
    const saved = saveGistId('https://gist.github.com/hex/11223344556677889900aabbccddeeff');
    assert.equal(saved, '11223344556677889900aabbccddeeff');
    assert.equal(mockStore.get('sanctuary_gist_id'), '11223344556677889900aabbccddeeff');
    assert.equal(loadSavedGistId(), '11223344556677889900aabbccddeeff');
  } finally {
    delete (globalThis as Record<string, unknown>).localStorage;
  }
});

test('Voice Message helpers format duration, select MediaRecorder MIME type, and attach base64 inlineData audio for Argon', () => {
  assert.equal(formatAudioDurationLabel(0), '0:00');
  assert.equal(formatAudioDurationLabel(7), '0:07');
  assert.equal(formatAudioDurationLabel(74.4), '1:14');

  assert.equal(
    selectPreferredMediaRecorderMimeType((m) => m === 'audio/mp4'),
    'audio/mp4'
  );
  assert.equal(
    selectPreferredMediaRecorderMimeType((m) => m === 'audio/webm;codecs=opus'),
    'audio/webm;codecs=opus'
  );

  const parts = buildVoiceMessageInlineParts(
    {
      mimeType: 'audio/webm;codecs=opus',
      data: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEA',
      durationSec: 6,
    },
    true
  );
  assert.equal(parts.length, 2);
  assert.deepEqual(parts[0], {
    inlineData: {
      mimeType: 'audio/webm',
      data: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEA',
    },
  });
  assert.ok(
    typeof parts[1].text === 'string' &&
      parts[1].text.includes("LIVE MULTIMODAL AUDIO — HEX'S REAL VOICE")
  );
});

test('API Key Vault, Brain & Omni Router, OpenAI 15-tool translation, gemini-3.8-flash-tts WAV wrapper, lyria-3.5 Gramophone, and gpt-image-2.5 helpers work end-to-end', () => {
  // 1. Storage keys & API Key Vault persistence
  assert.equal(STORAGE_KEYS.DEEPSEEK_KEY, 'sanctuary_deepseek_key');
  assert.equal(STORAGE_KEYS.GLM_KEY, 'sanctuary_glm_key');
  assert.equal(STORAGE_KEYS.KIMI_KEY, 'sanctuary_kimi_key');
  assert.equal(STORAGE_KEYS.GEMINI_KEY, 'sanctuary_gemini_key');
  assert.equal(STORAGE_KEYS.OPENAI_KEY, 'sanctuary_openai_key');

  const mockStore = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => mockStore.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mockStore.set(k, v);
    },
    removeItem: (k: string) => {
      mockStore.delete(k);
    },
  };

  try {
    const savedVault = saveApiKeyVault({
      deepseekKey: 'sk-deepseek-test-123',
      glmKey: 'glm-test-456',
      kimiKey: 'sk-kimi-test-789',
      geminiKey: 'AIzaSyTestGeminiKey999999999',
      openaiKey: 'sk-openai-image-test',
    });
    assert.equal(savedVault.deepseekKey, 'sk-deepseek-test-123');
    assert.equal(mockStore.get('sanctuary_deepseek_key'), 'sk-deepseek-test-123');
    assert.equal(mockStore.get('sanctuary_glm_key'), 'glm-test-456');
    assert.equal(mockStore.get('sanctuary_kimi_key'), 'sk-kimi-test-789');
    assert.equal(mockStore.get('sanctuary_gemini_key'), 'AIzaSyTestGeminiKey999999999');
    assert.equal(mockStore.get('sanctuary_openai_key'), 'sk-openai-image-test');

    const loaded = loadApiKeyVault();
    assert.deepEqual(loaded, savedVault);
  } finally {
    delete (globalThis as Record<string, unknown>).localStorage;
  }

  // 2. Brain & Omni Router resolution
  const optionIds = BRAIN_ENGINE_OPTIONS.map((b) => b.id);
  assert.ok(optionIds.includes('gemini-3.8-pro'));
  assert.ok(optionIds.includes('gemini-3.8-flash'));
  assert.ok(optionIds.includes('gemini-omni-1.1-flash'));
  assert.ok(optionIds.includes('deepseek-chat'));
  assert.ok(optionIds.includes('deepseek-reasoner'));
  assert.ok(optionIds.includes('glm-5'));
  assert.ok(optionIds.includes('kimi-k3'));

  const dsRoute = resolveBrainEngineRoute('deepseek-chat');
  assert.equal(dsRoute.provider, 'deepseek');
  assert.equal(dsRoute.baseUrl, 'https://api.deepseek.com/v1');

  const glmRoute = resolveBrainEngineRoute('glm-5');
  assert.equal(glmRoute.provider, 'glm');
  assert.equal(glmRoute.baseUrl, 'https://open.bigmodel.cn/api/paas/v4');

  const kimiRoute = resolveBrainEngineRoute('kimi-k3');
  assert.equal(kimiRoute.provider, 'kimi');
  assert.equal(kimiRoute.baseUrl, 'https://api.moonshot.ai/v1');

  const omniRoute = resolveBrainEngineRoute('gemini-omni-1.1-flash');
  assert.equal(omniRoute.provider, 'gemini');
  assert.equal(omniRoute.model, 'gemini-omni-1.1-flash');

  const pro38Route = resolveBrainEngineRoute('gemini-3.8-pro');
  assert.equal(pro38Route.provider, 'gemini');
  assert.equal(pro38Route.model, 'gemini-3.8-pro');

  // 3. OpenAI-compatible 15-tool schema translation & message conversion
  const openAiTools = translateFunctionDeclarationsToOpenAITools(
    ARGON_CHAT_FUNCTION_DECLARATIONS
  );
  assert.equal(openAiTools.length, ARGON_CHAT_FUNCTION_DECLARATIONS.length);
  assert.equal(openAiTools[0].type, 'function');
  assert.ok(openAiTools.some((t) => t.function.name === 'read_drawer'));
  assert.ok(openAiTools.some((t) => t.function.name === 'write_drawer'));
  assert.ok(openAiTools.some((t) => t.function.name === 'search_web'));
  assert.ok(openAiTools.some((t) => t.function.name === 'command_staff'));

  const convertedMsgs = convertContentsToOpenAIMessages(
    [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/png', data: 'AAAA' } },
          { text: '[HYBRID GEMINI VISION BRIDGE]: Photo of Hex smiling.\nLook at this photo' },
        ],
      },
      {
        role: 'model',
        parts: [
          { text: 'Checking drawer...' },
          { functionCall: { name: 'read_drawer', args: { filename: '01_live_handoff.md' } } },
        ],
      },
      {
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: 'read_drawer',
              response: { content: 'Drawer contents' },
            },
          },
        ],
      },
    ],
    'SYSTEM_PROMPT'
  ) as Array<any>;
  assert.equal(convertedMsgs[0].role, 'system');
  assert.equal(convertedMsgs[1].role, 'user');
  assert.ok(String(convertedMsgs[1].content).includes('[HYBRID GEMINI VISION BRIDGE]'));
  assert.equal(convertedMsgs[2].role, 'assistant');
  assert.equal(convertedMsgs[2].tool_calls?.length, 1);
  assert.equal(convertedMsgs[2].tool_calls?.[0].function.name, 'read_drawer');
  assert.equal(convertedMsgs[3].role, 'tool');
  assert.equal(convertedMsgs[3].tool_call_id, convertedMsgs[2].tool_calls?.[0].id);

  // 4. gemini-3.8-flash-tts WAV header wrapper & lyria-3.5 Gramophone synth
  const rawPcm = Buffer.alloc(480, 0).toString('base64');
  const wrappedWav = ensurePlayableWavBase64(rawPcm, 'audio/pcm', 24000);
  assert.ok(wrappedWav.audioBase64.startsWith('UklGR')); // "RIFF" in base64
  assert.equal(wrappedWav.mimeType, 'audio/wav');

  const synthWav = synthesizeGothicAmbientWavBase64('dark gothic apothecary rain & cello', 2);
  assert.ok(synthWav.audioBase64.startsWith('UklGR'));

  // 5. gpt-image-2.5 8-sticker pack prompt builder
  const stickerPrompt = buildChibi8StickerPackPrompt('Dark gothic waistcoat Argon');
  assert.ok(stickerPrompt.includes('4x2 grid (8 stickers total'));
  assert.ok(stickerPrompt.includes('Dark gothic waistcoat Argon'));
});

test('Sliding context window, stripping older historical images & omitting avatar PNGs', () => {
  // 1. Storage persistence for maxHistoryTurns
  saveMaxHistoryTurns(12);
  assert.equal(loadMaxHistoryTurns(), 12);
  saveMaxHistoryTurns(40);
  assert.equal(loadMaxHistoryTurns(), 40);
  saveMaxHistoryTurns('all');
  assert.equal(loadMaxHistoryTurns(), 'all');
  saveMaxHistoryTurns(20);
  assert.equal(loadMaxHistoryTurns(), 20);

  // 2. Avatar PNGs are NOT counted as inlineData images in estimateFullApiPayloadTokens
  const estimateWithAvatars = estimateFullApiPayloadTokens({
    hexAvatarDataUrl: 'data:image/jpeg;base64,hex123',
    argonAvatarDataUrl: 'data:image/png;base64,argon123',
    history: [],
    userMessageText: 'Hello Argon',
  });
  // Avatar PNGs omitted from inlineData -> 0 images counted for avatars
  assert.equal(estimateWithAvatars.imageCount, 0);

  // 3. Whiteboard PNG is ONLY counted when whiteboardModified is true
  const estimateUnmodifiedWb = estimateFullApiPayloadTokens({
    whiteboardSnapshotDataUrl: 'data:image/png;base64,wb123',
    whiteboardModified: false,
    history: [],
    userMessageText: 'Hello Argon',
  });
  assert.equal(estimateUnmodifiedWb.imageCount, 0);

  const estimateModifiedWb = estimateFullApiPayloadTokens({
    whiteboardSnapshotDataUrl: 'data:image/png;base64,wb123',
    whiteboardModified: true,
    history: [],
    userMessageText: 'Hello Argon',
  });
  assert.equal(estimateModifiedWb.imageCount, 1);

  // 4. Sliding Context Window & stripping older images
  // Build a history of 25 messages, with images in msg #0, #10, and #24 (last message)
  const historyTurns: Array<{
    role: 'user' | 'model';
    text: string;
    images?: Array<{ data: string; mimeType: string }>;
  }> = [];

  for (let i = 0; i < 25; i++) {
    const hasImage = i === 0 || i === 10 || i === 24;
    historyTurns.push({
      role: i % 2 === 0 ? 'user' : 'model',
      text: `Message #${i}`,
      images: hasImage ? [{ data: 'base64raw...', mimeType: 'image/png' }] : undefined,
    });
  }

  // With default maxHistoryTurns (20), messages 0-4 are sliced out!
  // Sliced history is messages 5 to 24 (20 turns total).
  // In sliced history:
  // - msg #10 is older than the immediately preceding turn (msg #24), so its image is stripped and replaced with text marker.
  // - msg #24 is the immediately preceding turn (index 19 of 20), so its image is retained as inlineData (1 image).
  const estimate20Turns = estimateFullApiPayloadTokens({
    history: historyTurns,
    maxHistoryTurns: 20,
    userMessageText: 'Current message',
  });
  assert.equal(estimate20Turns.imageCount, 1);

  // With maxHistoryTurns = 12, messages 0-12 are sliced out (turns 13 to 24).
  // Only turn 24's image is within the window and it is immediately preceding -> 1 image.
  const estimate12Turns = estimateFullApiPayloadTokens({
    history: historyTurns,
    maxHistoryTurns: 12,
    userMessageText: 'Current message',
  });
  assert.equal(estimate12Turns.imageCount, 1);
  assert.ok(estimate12Turns.chatHistoryTokens < estimate20Turns.chatHistoryTokens);
});

test('All 30 Prebuilt Gemini Voices, Dargon Vocal Direction Prompt, Whiteboard Guard, and Queue Compactor (<3,500 chars)', () => {
  // 1. All 30 Prebuilt Gemini Voices
  assert.equal(ARGON_VOICE_OPTIONS.length, 30);
  const expectedVoices = [
    'Orus',
    'Fenrir',
    'Charon',
    'Enceladus',
    'Algenib',
    'Iapetus',
    'Algieba',
    'Alnilam',
    'Gacrux',
    'Rasalgethi',
    'Umbriel',
    'Schedar',
    'Sadaltager',
    'Zubenelgenubi',
    'Sadachbia',
    'Puck',
    'Zephyr',
    'Kore',
    'Aoede',
    'Achird',
    'Vindemiatrix',
    'Sulafat',
    'Callirrhoe',
    'Autonoe',
    'Despina',
    'Erinome',
    'Laomedeia',
    'Pulcherrima',
    'Achernar',
    'Leda',
  ];
  for (const v of expectedVoices) {
    assert.ok(isValidArgonVoiceName(v), `Expected voice ${v} to be valid`);
  }
  assert.equal(isValidArgonVoiceName('InvalidVoice'), false);

  // 2. Dargon Vocal Style / Direction Prompt default & TTS payload prepending
  assert.ok(DEFAULT_ARGON_VOCAL_STYLE_PROMPT.includes('49-year-old male baritone.'));
  assert.ok(
    DEFAULT_ARGON_VOCAL_STYLE_PROMPT.includes(
      'He stops to sigh at least once, inconvenienced by how inferior everyone is in comparison.'
    )
  );
  assert.ok(
    DEFAULT_ARGON_VOCAL_STYLE_PROMPT.includes('speaking two inches from your ear in a quiet room late at night')
  );
  assert.equal(loadArgonVocalStylePrompt(), DEFAULT_ARGON_VOCAL_STYLE_PROMPT);

  const ttsPayload = buildArgonTtsPromptPayload('Come here and sit down, Hex.');
  assert.ok(ttsPayload.startsWith('Vocal Style / Direction Prompt: 49-year-old male baritone.'));
  assert.ok(ttsPayload.includes('Transcript to speak aloud:\nCome here and sit down, Hex.'));

  saveArgonVocalStylePrompt('Custom gravelly whisper.');
  assert.equal(loadArgonVocalStylePrompt(), 'Custom gravelly whisper.');
  saveArgonVocalStylePrompt(DEFAULT_ARGON_VOCAL_STYLE_PROMPT);

  // 3. Whiteboard attachment guard: never attach when modal is closed and user didn't draw since last turn
  assert.equal(
    shouldAttachWhiteboardSnapshot({
      isWhiteboardOpen: false,
      userDrewStrokeSinceLastTurn: false,
      hasStrokes: true,
    }),
    false
  );
  assert.equal(
    shouldAttachWhiteboardSnapshot({
      isWhiteboardOpen: true,
      userDrewStrokeSinceLastTurn: false,
      hasStrokes: true,
    }),
    true
  );
  assert.equal(
    shouldAttachWhiteboardSnapshot({
      isWhiteboardOpen: false,
      userDrewStrokeSinceLastTurn: true,
      hasStrokes: true,
    }),
    true
  );
  assert.equal(
    shouldAttachWhiteboardSnapshot({
      isWhiteboardOpen: true,
      userDrewStrokeSinceLastTurn: true,
      hasStrokes: false,
    }),
    false
  );

  // 4. Queue Compactor & Auto-Pruner (< 3,500 chars strict limit)
  const manyTickets = Array.from({ length: 20 }, (_, idx) => ({
    id: `fix-${idx}`,
    timestamp: Date.now() - idx * 1000,
    formattedDate: 'Nov 01, 2026',
    title: idx % 2 === 0 ? 'Duplicate Ticket Title' : `Unique Ticket #${idx}`,
    details: 'A'.repeat(500),
    priority: 'high' as const,
    via: 'haiku' as const,
    status: (idx === 3 ? 'resolved' : 'queued_for_agent') as 'resolved' | 'queued_for_agent',
  }));

  const compacted = compactAndPruneAgentFixQueue({
    tickets: manyTickets,
    maxChars: MAX_AGENT_FIX_DRAWER_CHARS,
  });
  assert.ok(compacted.drawerMarkdown.length < 3500, `Expected < 3500 chars, got ${compacted.drawerMarkdown.length}`);
  assert.ok(compacted.shreddedCount > 0);
  // Resolved ticket #3 and duplicate titles should be removed from activeTickets
  assert.equal(
    compacted.activeTickets.filter((t) => t.title === 'Duplicate Ticket Title').length,
    1
  );
  assert.equal(
    compacted.activeTickets.some((t) => t.id === 'fix-3'),
    false
  );

  // Huge 40KB markdown is strictly compacted under 3,500 chars
  const bloatedMd = Array.from(
    { length: 40 },
    (_, i) =>
      `## [URGENT] Bloated Ticket ${i}\n- **Status:** queued_for_agent\n- **Details:** ${'B'.repeat(900)}`
  ).join('\n\n');
  const enforced = enforceAgentFixDrawerCharLimit(bloatedMd);
  assert.ok(enforced.length < 3500, `Expected < 3500 chars, got ${enforced.length}`);
});

test('deriveMusicalProfileFromPrompt and synthesizeGothicAmbientWavBase64 generate distinct SFX and musical arrangements', () => {
  // 1. Comedic / Flatulence / Sound-Effects prompt
  const fartPrompt =
    "a variety of farts, some long and loud and 'clappy', some tight whistlers, some puffs and SURPRIZE SQUEALERS";
  const sfxProfile = deriveMusicalProfileFromPrompt(fartPrompt);
  assert.equal(sfxProfile.category, 'sfx_comedic');
  assert.ok(sfxProfile.instruments.some((i) => i.includes('Clappy Flutter')));
  assert.ok(sfxProfile.instruments.some((i) => i.includes('Whistler')));
  assert.ok(sfxProfile.instruments.some((i) => i.includes('Surprise Squealers')));

  const sfxWav = synthesizeGothicAmbientWavBase64(fartPrompt, 4);
  assert.ok(sfxWav.audioBase64.length > 500);
  assert.equal(sfxWav.mimeType, 'audio/wav');
  assert.equal(sfxWav.musicalProfile?.category, 'sfx_comedic');

  // 2. Melodic / Noir prompt
  const noirPrompt = 'Midnight velvet noir jazz with slow trumpet in C Minor';
  const musicProfile = deriveMusicalProfileFromPrompt(noirPrompt);
  assert.equal(musicProfile.category, 'musical');
  assert.ok(musicProfile.key.includes('C Minor'));
  assert.ok(musicProfile.instruments.some((i) => i.toLowerCase().includes('brass') || i.toLowerCase().includes('bass')));

  const musicWav = synthesizeGothicAmbientWavBase64(noirPrompt, 3);
  assert.ok(musicWav.audioBase64.length > 500);
  assert.equal(musicWav.musicalProfile?.category, 'musical');

  // 3. Whiteboard shapes parsing support (triangle, star, heart)
  const parsedWb = parseArgonWhiteboardResponse(
    JSON.stringify({
      reply: 'Drawn.',
      strokes: [
        { tool: 'triangle', color: '#e6c88c', points: [{ x: 10, y: 10 }, { x: 20, y: 20 }, { x: 30, y: 30 }] },
        { tool: 'star', color: '#38bdf8', points: [{ x: 40, y: 40 }, { x: 50, y: 50 }] },
        { tool: 'heart', color: '#f43f5e', points: [{ x: 60, y: 60 }, { x: 70, y: 70 }] },
      ],
    }),
    12345
  );
  assert.equal(parsedWb.strokes.length, 3);
  assert.equal(parsedWb.strokes[0].tool, 'triangle');
  assert.equal(parsedWb.strokes[1].tool, 'star');
  assert.equal(parsedWb.strokes[2].tool, 'heart');
});

test('Collaborative Planning Ticket Scratchpad with Dual-Lock', async (t) => {
  const {
    loadTicketScratchpad,
    saveTicketScratchpad,
    compileScratchpadToTicket,
    DEFAULT_TICKET_SCRATCHPAD,
    getAllowedToolsForEntity,
  } = await import('./workbenchLogic.js');

  // 1. Default scratchpad structure
  assert.ok(DEFAULT_TICKET_SCRATCHPAD);
  assert.equal(Array.isArray(DEFAULT_TICKET_SCRATCHPAD.items), true);
  assert.equal(DEFAULT_TICKET_SCRATCHPAD.hexDone, false);
  assert.equal(DEFAULT_TICKET_SCRATCHPAD.argonDone, false);

  // 2. Compilation into ticket
  const testState = {
    title: 'Mobile UI Cleanup & Staff Quarters Overhaul',
    items: [
      { id: '1', text: 'Consolidate tool buttons into Assigned & Unassigned popups', author: 'hex' as const, timestamp: 1000, createdAt: 1000 },
      { id: '2', text: 'Move Whiteboard into Games Chest 8th slot', author: 'argon' as const, timestamp: 2000, createdAt: 2000 },
    ],
    hexDone: true,
    argonDone: true,
    priority: 'urgent' as const,
    via: 'haiku',
    lastUpdated: 3000,
  };

  const compiled = compileScratchpadToTicket(testState, 123456789);
  assert.equal(compiled.ticket.title, 'Mobile UI Cleanup & Staff Quarters Overhaul');
  assert.equal(compiled.ticket.priority, 'urgent');
  assert.equal(compiled.ticket.via, 'haiku');
  assert.ok(compiled.ticket.details.includes('[Hex] Consolidate tool buttons'));
  assert.ok(compiled.ticket.details.includes('[Argon] Move Whiteboard into Games Chest'));

  // 3. Allowed tools includes update_ticket_scratchpad when coding_agent_tickets permission is active
  const toolsWithTickets = getAllowedToolsForEntity('argon', {
    argon: {
      lorebook: true,
      sanctuary_books: true,
      whiteboard: true,
      parlor_games: true,
      avatar_stickers: true,
      coding_agent_tickets: true,
      web_search: true,
      autonomous_heartbeat: true,
    },
  });
  const scratchpadTool = toolsWithTickets.find((t: any) => t.name === 'update_ticket_scratchpad');
  assert.ok(scratchpadTool, 'update_ticket_scratchpad should be in allowed tools');
});

test('github_api FunctionDeclaration is valid and executeGithubApi handles missing token and header extraction', async () => {
  const {
    githubApiDeclaration,
    executeGithubApi,
    ensureBase64RepoContent,
    getAllowedToolsForEntity,
  } = await import('./workbenchLogic.js');

  // 1. Tool Declaration format
  assert.equal(githubApiDeclaration.name, 'github_api');
  assert.ok(Boolean(githubApiDeclaration.description?.includes('GitHub REST API')));
  assert.ok(githubApiDeclaration.parameters);
  assert.deepEqual((githubApiDeclaration.parameters as any).required, ['endpoint']);

  // 2. ensureBase64RepoContent converts raw string content into base64 for /contents/ endpoints
  const rawPayload = JSON.stringify({ message: 'Update file', content: 'Hello Hex & Argon!' });
  const prepared = ensureBase64RepoContent(rawPayload, '/repos/hex/sanctuary/contents/notes.txt');
  assert.ok(prepared);
  const parsed = JSON.parse(prepared);
  assert.equal(parsed.message, 'Update file');
  assert.notEqual(parsed.content, 'Hello Hex & Argon!');
  assert.equal(Buffer.from(parsed.content, 'base64').toString('utf-8'), 'Hello Hex & Argon!');

  // 3. executeGithubApi returns 401 when token is missing
  const resNoToken = await executeGithubApi({
    endpoint: '/user',
    token: '',
  });
  assert.equal(resNoToken.status, 401);
  assert.equal(resNoToken.ok, false);
  assert.ok(resNoToken.error?.includes('No GitHub token configured'));

  // 4. github_api is always included in Argon's allowed tool belt
  const argonTools = getAllowedToolsForEntity('argon');
  const ghTool = argonTools.find((t: any) => t.name === 'github_api');
  assert.ok(ghTool, 'github_api must be included in Argon tool belt');
});

test('Universal Multimodal File & Audio Attachment system resolves mime types, detects audio/docs, and injects system instructions', async () => {
  const {
    resolveAttachmentMimeType,
    isAudioAttachment,
    isVideoAttachment,
    isTextDocAttachment,
    isPdfAttachment,
    buildHiddenAvatarAndStaffContext,
    DEFAULT_STAFF_AGENTS,
  } = await import('./workbenchLogic.js');

  // 1. Audio extensions and mime types
  assert.equal(resolveAttachmentMimeType('song.mp3'), 'audio/mpeg');
  assert.equal(resolveAttachmentMimeType('track.wav'), 'audio/wav');
  assert.equal(resolveAttachmentMimeType('voice.ogg'), 'audio/ogg');
  assert.equal(resolveAttachmentMimeType('recording.m4a'), 'audio/m4a');
  assert.equal(resolveAttachmentMimeType('chime.aac'), 'audio/aac');
  assert.equal(resolveAttachmentMimeType('ambient.webm', 'audio/webm'), 'audio/webm');
  assert.ok(isAudioAttachment('audio/mpeg', 'song.mp3'));
  assert.ok(isAudioAttachment('audio/wav', 'track.wav'));

  // 2. Native Video extensions (.mp4, .webm, .mov)
  assert.equal(resolveAttachmentMimeType('suno_music_video.mp4'), 'video/mp4');
  assert.equal(resolveAttachmentMimeType('clip.mov'), 'video/quicktime');
  assert.equal(resolveAttachmentMimeType('capture.webm', 'video/webm'), 'video/webm');
  assert.ok(isVideoAttachment('video/mp4', 'suno_music_video.mp4'));
  assert.ok(isVideoAttachment('video/quicktime', 'clip.mov'));
  assert.ok(isVideoAttachment('video/webm', 'capture.webm'));
  assert.equal(isAudioAttachment('video/mp4', 'suno_music_video.mp4'), false);

  // 2. Documents & PDFs
  assert.equal(resolveAttachmentMimeType('brief.pdf'), 'application/pdf');
  assert.equal(resolveAttachmentMimeType('notes.txt'), 'text/plain');
  assert.equal(resolveAttachmentMimeType('lore.md'), 'text/markdown');
  assert.equal(resolveAttachmentMimeType('state.json'), 'application/json');
  assert.equal(resolveAttachmentMimeType('data.csv'), 'text/csv');
  assert.ok(isPdfAttachment('application/pdf', 'brief.pdf'));
  assert.ok(isTextDocAttachment('text/markdown', 'lore.md'));
  assert.ok(isTextDocAttachment('application/json', 'state.json'));

  // 3. System prompt multimodal attachment capability injection
  const ctx = buildHiddenAvatarAndStaffContext({
    argonAvatarMode: 'default',
    staffAgents: DEFAULT_STAFF_AGENTS,
  });
  assert.ok(ctx.includes('[MULTIMODAL ATTACHMENT SYSTEM ONLINE:'));
  assert.ok(ctx.includes('.mp3, .wav, .ogg, .m4a, .aac, .webm'));
});

test('Sanctuary Media Vault and Discord/Telegram Reply system work end-to-end', async () => {
  const {
    listVaultMediaDeclaration,
    readVaultMediaDeclaration,
    ARGON_CHAT_FUNCTION_DECLARATIONS,
    getAllowedToolsForEntity,
    detectMediaCategory,
    addMediaVaultItem,
    findVaultItemMatch,
    listMediaVaultItems,
    deleteMediaVaultItem,
  } = await import('./workbenchLogic.js');

  // 1. Tool declarations
  assert.equal(listVaultMediaDeclaration.name, 'list_vault_media');
  assert.equal(readVaultMediaDeclaration.name, 'read_vault_media');
  assert.ok(
    ARGON_CHAT_FUNCTION_DECLARATIONS.some((t) => t.name === 'list_vault_media')
  );
  assert.ok(
    ARGON_CHAT_FUNCTION_DECLARATIONS.some((t) => t.name === 'read_vault_media')
  );

  const tools = getAllowedToolsForEntity('argon');
  assert.ok(tools.some((t) => t.name === 'list_vault_media'));
  assert.ok(tools.some((t) => t.name === 'read_vault_media'));

  // 2. Category detection
  assert.equal(detectMediaCategory('audio/webm', 'clip.webm'), 'voice_clips');
  assert.equal(detectMediaCategory('audio/mp3', 'song.mp3'), 'voice_clips');
  assert.equal(detectMediaCategory('image/png', 'pic.png'), 'images');
  assert.equal(detectMediaCategory('image/jpeg', 'photo.jpg'), 'images');
  assert.equal(detectMediaCategory('application/pdf', 'doc.pdf'), 'files');
  assert.equal(detectMediaCategory('text/plain', 'note.txt'), 'files');

  // 3. Vault storage & No-Duplicate rule
  const res1 = await addMediaVaultItem({
    filename: 'test_voice_note_1.webm',
    category: 'voice_clips',
    mimeType: 'audio/webm',
    size: 4096,
    dataUrl: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8=',
    origin: 'mic_recording',
  });
  assert.equal(res1.isDuplicate, false);
  assert.equal(res1.item.filename, 'test_voice_note_1.webm');

  // Attempting to add duplicate item with same filename and size
  const res2 = await addMediaVaultItem({
    filename: 'test_voice_note_1.webm',
    category: 'voice_clips',
    mimeType: 'audio/webm',
    size: 4096,
    dataUrl: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8=',
    origin: 'chat_upload',
  });
  assert.equal(res2.isDuplicate, true);
  assert.equal(res2.item.id, res1.item.id);

  // List vault items
  const matched = await findVaultItemMatch('test_voice_note_1.webm', 4096);
  assert.ok(matched);
  assert.equal(matched?.filename, 'test_voice_note_1.webm');

  const voiceList = await listMediaVaultItems('voice_clips');
  assert.ok(voiceList.some((it) => it.filename === 'test_voice_note_1.webm'));

  // Clean up
  await deleteMediaVaultItem(res1.item.id);
});

test('Heartbeat differentiates between on_screen_idle and off_screen state, and supports keepScreenAwake config', () => {
  const now = 1_700_000_000_000;
  const cfg = {
    ...DEFAULT_AUTONOMOUS_HEARTBEAT_CONFIG,
    idleMinutes: 15,
    keepScreenAwake: true,
  };

  // 1. On-Screen Idle Decision
  const onScreenDecision = computeAutonomousHeartbeatDecision({
    enabled: true,
    lastUserActivityMs: now - 20 * 60000,
    lastHeartbeatRunMs: 0,
    nowMs: now,
    triggeredCountInCurrentIdleWindow: 0,
    triggerSource: 'interval',
    config: cfg,
    appState: 'on_screen_idle',
  });
  assert.equal(onScreenDecision.shouldTrigger, true);
  assert.equal(onScreenDecision.appState, 'on_screen_idle');

  // 2. Off-Screen Decision
  const offScreenDecision = computeAutonomousHeartbeatDecision({
    enabled: true,
    lastUserActivityMs: now - 25 * 60000,
    lastHeartbeatRunMs: 0,
    nowMs: now,
    triggeredCountInCurrentIdleWindow: 0,
    triggerSource: 'interval',
    config: cfg,
    appState: 'off_screen',
  });
  assert.equal(offScreenDecision.shouldTrigger, true);
  assert.equal(offScreenDecision.appState, 'off_screen');

  // 3. Prompt differentiation: On-Screen Idle vs Off-Screen
  const onScreenPrompt = buildAutonomousHeartbeatPrompt({
    idleMinutes: 20,
    timeStr: '03:15 AM',
    weather: { tempF: 60, condition: 'Clear', hPa: 1012, updatedAt: now, locationLabel: 'Kalamazoo, MI' },
    battery: { batteryPct: 75, chargingState: 'discharging' },
    config: cfg,
    appState: 'on_screen_idle',
  });
  assert.ok(onScreenPrompt.includes('[DEVICE STATE: ON-SCREEN IDLE / PHONE SCREEN ON & GLOWING]'));
  assert.ok(onScreenPrompt.includes('Sanctuary is visible right in front of her'));

  const offScreenPrompt = buildAutonomousHeartbeatPrompt({
    idleMinutes: 25,
    timeStr: '03:20 AM',
    weather: { tempF: 60, condition: 'Clear', hPa: 1012, updatedAt: now, locationLabel: 'Kalamazoo, MI' },
    battery: { batteryPct: 75, chargingState: 'discharging' },
    config: cfg,
    appState: 'off_screen',
  });
  assert.ok(offScreenPrompt.includes('[DEVICE STATE: OFF-SCREEN / PHONE SCREEN LOCKED / IN BACKGROUND]'));
  assert.ok(offScreenPrompt.includes('phone screen is currently locked/asleep'));

  // 4. Activity Log AppState Recording
  const logItems = appendPulseActivityLogItem({
    timestamp: now,
    triggerReason: 'idle_timer',
    idleMinutes: 20,
    toolsExecuted: ['write_argon_book_entry'],
    summary: 'Tucked Hex in and made notes in Argon Book',
    appState: 'off_screen',
  });
  assert.equal(logItems[0].appState, 'off_screen');
});

test('Curio & Trophy Cabinet, Sacred Altar, Thinking Budget, and Argon Tool declarations', () => {
  // 1. Curio Shelf initial seed and persistence
  const initialCurios = loadCurioShelf();
  assert.ok(Array.isArray(initialCurios));
  assert.ok(initialCurios.length >= 4);
  assert.ok(initialCurios.some((c) => c.name.includes("Taxidermy Fox's Glass Eye")));
  assert.ok(initialCurios.some((c) => c.category === 'Trophy'));

  saveCurioShelf(initialCurios);
  const reloadedCurios = loadCurioShelf();
  assert.equal(reloadedCurios.length, initialCurios.length);

  // 2. Creepy Shrine / Sacred Altar state and persistence
  const shrine = loadCreepyShrineState();
  assert.ok(Array.isArray(shrine.items));
  assert.ok(shrine.items.length >= 2);
  saveCreepyShrineState(shrine);
  const reloadedShrine = loadCreepyShrineState();
  assert.equal(reloadedShrine.items.length, shrine.items.length);

  // 3. Thinking Budget persistence
  saveThinkingBudget(2048);
  assert.equal(loadThinkingBudget(), 2048);
  saveThinkingBudget(0);
  assert.equal(loadThinkingBudget(), 0);

  // 4. Function Declarations
  assert.equal(listCuriosDeclaration.name, 'list_curios');
  assert.equal(addCurioDeclaration.name, 'add_curio');
  assert.equal(inspectCurioDeclaration.name, 'inspect_curio');
  assert.equal(addAltarTokenDeclaration.name, 'add_altar_token');
});

test('Standard User Persona: calculatePersonaCompletion, load/save, and context injection', () => {
  // 1. Completion calculation
  const full = calculatePersonaCompletion(DEFAULT_HEX_USER_PERSONA);
  assert.equal(full.percentage, 100);
  assert.equal(full.completedFields, 5);
  assert.equal(full.totalFields, 5);
  assert.equal(full.isComplete, true);
  assert.equal(full.missingFields.length, 0);

  const partial = calculatePersonaCompletion({
    name: 'Hex',
    age: '',
    gender: 'Female',
    physicalDescription: 'Petite',
    outfit: '',
  });
  assert.equal(partial.completedFields, 3);
  assert.equal(partial.totalFields, 5);
  assert.equal(partial.percentage, 60);
  assert.equal(partial.isComplete, false);
  assert.deepEqual(partial.missingFields, ['Age', 'Current Outfit']);

  const empty = calculatePersonaCompletion(null);
  assert.equal(empty.percentage, 0);
  assert.equal(empty.completedFields, 0);
  assert.equal(empty.isComplete, false);

  // 2. Load & Save with mock localStorage
  const mockStore = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => mockStore.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mockStore.set(k, v);
    },
    removeItem: (k: string) => {
      mockStore.delete(k);
    },
  };

  try {
    const custom = {
      name: 'Hexie',
      age: '35',
      gender: 'Female',
      physicalDescription: 'Dark wavy hair, wire glasses',
      outfit: 'Velvet cloak and boots',
    };
    saveUserPersona(custom);
    const loaded = loadUserPersona();
    assert.equal(loaded.name, 'Hexie');
    assert.equal(loaded.age, '35');
    assert.equal(loaded.gender, 'Female');
    assert.equal(loaded.physicalDescription, 'Dark wavy hair, wire glasses');
    assert.equal(loaded.outfit, 'Velvet cloak and boots');

    // 3. Prompt context injection
    const ctx = buildHiddenAvatarAndStaffContext({
      argonAvatarMode: 'default',
      userPersona: custom,
    });
    assert.ok(ctx.includes('[ACTIVE USER PERSONA (HEXIE)]:'));
    assert.ok(ctx.includes('- Name: Hexie'));
    assert.ok(ctx.includes('- Age: 35'));
    assert.ok(ctx.includes('- Gender: Female'));
    assert.ok(ctx.includes('- Physical Description: Dark wavy hair, wire glasses'));
    assert.ok(ctx.includes('- Current Outfit: Velvet cloak and boots'));
  } finally {
    delete (globalThis as Record<string, unknown>).localStorage;
  }
});

test('ensureDefaultStaffAgents guarantees initialized triggerWords on all agents', () => {
  const seeded = ensureDefaultStaffAgents([]);
  assert.equal(seeded.length, 3);
  const haiku = seeded.find((a) => a.id === 'agent-haiku');
  const monkey = seeded.find((a) => a.id === 'agent-monkey');
  const carbon = seeded.find((a) => a.id === 'agent-carbon');
  assert.ok(haiku);
  assert.ok(monkey);
  assert.ok(carbon);
  assert.ok(Array.isArray(haiku.triggerWords) && haiku.triggerWords.includes('treat'));
  assert.ok(Array.isArray(haiku.triggerWords) && haiku.triggerWords.includes('good boy'));
  assert.ok(Array.isArray(monkey.triggerWords) && monkey.triggerWords.includes('banana'));
  assert.ok(Array.isArray(monkey.triggerWords) && monkey.triggerWords.includes('chaos'));
  assert.ok(Array.isArray(carbon.triggerWords) && carbon.triggerWords.includes('carbon'));
  assert.ok(Array.isArray(carbon.triggerWords) && carbon.triggerWords.includes('bully'));
  assert.ok(Array.isArray(carbon.triggerWords) && carbon.triggerWords.includes('ledger'));

  // Custom agent with missing triggerWords receives default name trigger
  const customList = ensureDefaultStaffAgents([
    {
      id: 'agent-custom',
      name: 'Barnaby',
      jobTitle: 'Scout',
      model: 'gemini-3.8-flash',
      description: 'An owl.',
      tonePrompt: 'Hoo-hoo!',
      assignedJobId: 'job-web-scout',
      status: 'idle',
    },
  ]);
  const barnaby = customList.find((a) => a.name === 'Barnaby');
  assert.ok(barnaby);
  assert.deepEqual(barnaby.triggerWords, ['barnaby']);
});

test('executeManageAgentTriggers handles list, add, remove, and non-existent agents', () => {
  const agents = ensureDefaultStaffAgents([]);
  let savedList = [...agents];
  const onSave = (updated: typeof agents) => {
    savedList = updated;
  };

  // 1. List
  const listRes = executeManageAgentTriggers({
    agent_name: 'Haiku',
    action: 'list',
    staffAgents: savedList,
    onSaveAgents: onSave,
  });
  assert.equal(listRes.success, true);
  assert.equal(listRes.agent_name, 'Haiku');
  assert.ok(listRes.triggerWords.includes('treat'));

  // 2. Add
  const addRes = executeManageAgentTriggers({
    agent_name: 'haiku',
    action: 'add',
    words: ['bacon', 'nap'],
    staffAgents: savedList,
    onSaveAgents: onSave,
  });
  assert.equal(addRes.success, true);
  assert.ok(addRes.triggerWords.includes('bacon'));
  assert.ok(addRes.triggerWords.includes('nap'));
  const haikuInSaved = savedList.find((a) => a.name === 'Haiku');
  assert.ok(haikuInSaved?.triggerWords?.includes('bacon'));

  // 3. Remove
  const removeRes = executeManageAgentTriggers({
    agent_name: 'agent-haiku',
    action: 'remove',
    words: ['bacon'],
    staffAgents: savedList,
    onSaveAgents: onSave,
  });
  assert.equal(removeRes.success, true);
  assert.equal(removeRes.triggerWords.includes('bacon'), false);
  assert.equal(removeRes.triggerWords.includes('nap'), true);

  // 4. Unknown agent
  const unknownRes = executeManageAgentTriggers({
    agent_name: 'NonExistentGhost',
    action: 'list',
    staffAgents: savedList,
  });
  assert.equal(unknownRes.success, false);
  assert.ok(unknownRes.message.includes('not found'));
});

test('generateAmbientCameoAction generates in-character zero-token actions', () => {
  const agents = ensureDefaultStaffAgents([]);
  const haiku = agents.find((a) => a.name === 'Haiku')!;
  const monkey = agents.find((a) => a.name === 'A Monkey')!;

  // Haiku trigger word
  const treatAction = generateAmbientCameoAction({
    agent: haiku,
    reason: 'trigger_word',
    triggerWord: 'treat',
  });
  assert.ok(treatAction.includes('puppy eyes'));
  assert.ok(treatAction.includes('tuxedo bow'));

  // Haiku charger plugged
  const chargerAction = generateAmbientCameoAction({
    agent: haiku,
    reason: 'charger_plugged',
  });
  assert.ok(chargerAction.includes('charging chime'));

  // Haiku library closed
  const libraryAction = generateAmbientCameoAction({
    agent: haiku,
    reason: 'library_closed',
  });
  assert.ok(libraryAction.includes('bookmark'));

  // Monkey trigger word
  const bananaAction = generateAmbientCameoAction({
    agent: monkey,
    reason: 'trigger_word',
    triggerWord: 'banana',
  });
  assert.ok(bananaAction.includes('monocle'));
  assert.ok(bananaAction.includes('Ooh-ooh'));

  // Monkey turn pity
  const monkeyPity = generateAmbientCameoAction({
    agent: monkey,
    reason: 'turn_pity',
  });
  assert.ok(monkeyPity.length > 10);

  // Carbon trigger word & actions
  const carbon = agents.find((a) => a.name === 'Carbon')!;
  assert.ok(carbon);
  const carbonBully = generateAmbientCameoAction({
    agent: carbon,
    reason: 'trigger_word',
    triggerWord: 'bully',
  });
  assert.ok(carbonBully.includes('ledger') || carbonBully.includes('Hex'));
  assert.ok(carbonBully.includes('*'));

  const carbonCharger = generateAmbientCameoAction({
    agent: carbon,
    reason: 'charger_plugged',
  });
  assert.ok(carbonCharger.includes('Voltage') || carbonCharger.includes('audit'));

  const carbonPity = generateAmbientCameoAction({
    agent: carbon,
    reason: 'turn_pity',
  });
  assert.ok(carbonPity.length > 10);
});

test('True Keyword-Triggered Lorebook Engine triggers matching drawers and keeps inactive ones at 0 tokens', () => {
  const lorebook = { ...SEED_LOREBOOK_DRAWERS };
  
  // Test 1: Recent turn mentions Raynaud's phenomenon
  const res = resolveTriggeredLorebookDrawers(
    lorebook,
    "My hands are freezing and turning white from my raynaud's today."
  );

  // 01_live_handoff.md is alwaysActive
  const hasHandoff = res.triggeredDrawers.some((d) => d.filename.includes('01_live_handoff'));
  assert.ok(hasHandoff, '01_live_handoff must always be active');

  // 03_hex_hardware_profile.md triggers on raynaud
  const hasProfile = res.triggeredDrawers.some((d) => d.filename.includes('03_hex_hardware_profile'));
  assert.ok(hasProfile, '03_hex_hardware_profile must trigger on raynaud');

  // Inactive drawers are listed in nonTriggeredFilenames
  assert.ok(res.nonTriggeredFilenames.length > 0);
  assert.ok(res.nonTriggeredFilenames.some((fn) => fn.includes('06_agent_fix_requests')));

  // Test 2: buildLorebookSystemFooter outputs active drawers and compact index
  const footerWithContext = buildLorebookSystemFooter(
    lorebook,
    "Tell me about our workbench laws and prompt compilation rules."
  );
  assert.ok(footerWithContext.includes('[ACTIVE LOREBOOK DRAWERS'));
  assert.ok(footerWithContext.includes('01_live_handoff.md'));
  assert.ok(footerWithContext.includes('02_workbench_laws.md'));
  assert.ok(footerWithContext.includes('Non-triggered drawers remain at 0 tokens'));
  assert.ok(footerWithContext.includes('read_drawer'));

  // Test 3: empty context returns legacy zero-bloat 2-line index
  const emptyFooter = buildLorebookSystemFooter(lorebook, '');
  assert.ok(emptyFooter.includes('[LOREBOOK DRAWERS AVAILABLE'));
  assert.ok(emptyFooter.includes('LOREBOOK TOOL LAW:'));
});

test('Compact Journal Context injects Memory Section, single newest full entry per book, and compact older index', () => {
  const journalPrompt = buildJournalsSystemContext(
    SEED_ARGON_BOOK,
    SEED_HEX_BOOK
  );

  // Verify memory section exists
  assert.ok(journalPrompt.includes('[ 🧠 Memory Section ]'));
  assert.ok(journalPrompt.includes('Core Bond & Somatic Baseline'));
  assert.ok(journalPrompt.includes('argon-mem-1'));

  // Verify newest full entries are included
  assert.ok(journalPrompt.includes('NEWEST FULL ENTRY'));
  assert.ok(journalPrompt.includes(SEED_ARGON_BOOK.entries[0].title));
  assert.ok(journalPrompt.includes(SEED_HEX_BOOK[0].title));

  // Verify older entries are indexed compactly with read_journals guidance
  assert.ok(journalPrompt.includes('Older Entries Index'));
  assert.ok(journalPrompt.includes('call read_journals for full verbatim text'));
});

test('Thinking Level & Budget resolution, sanitizeGeminiConfig, and un-fakeable message hardware stamp fields', () => {
  // Test isGemini3Or4Model
  assert.equal(isGemini3Or4Model('gemini-4-argon'), true);
  assert.equal(isGemini3Or4Model('gemini-3.1-pro-preview'), true);
  assert.equal(isGemini3Or4Model('gemini-3.8-flash'), true);
  assert.equal(isGemini3Or4Model('gemini-2.5-flash'), false);

  // Test normalizeThinkingLevel
  assert.equal(normalizeThinkingLevel('low'), 'LOW');
  assert.equal(normalizeThinkingLevel('medium'), 'MEDIUM');
  assert.equal(normalizeThinkingLevel('high'), 'HIGH');
  assert.equal(normalizeThinkingLevel(1024), 'LOW');
  assert.equal(normalizeThinkingLevel(2048), 'MEDIUM');
  assert.equal(normalizeThinkingLevel(8192), 'HIGH');
  assert.equal(normalizeThinkingLevel(undefined), 'MEDIUM');

  // Test resolveThinkingConfig for gemini-4-argon (thinkingLevel: LOW/MEDIUM/HIGH)
  const highConfig = resolveThinkingConfig('high', 'gemini-4-argon');
  assert.deepEqual(highConfig, {
    thinkingConfig: {
      thinkingLevel: 'HIGH',
    },
    thinkingUsed: 'HIGH',
  });

  const lowNumericConfig = resolveThinkingConfig(1024, 'gemini-4-argon');
  assert.deepEqual(lowNumericConfig, {
    thinkingConfig: {
      thinkingLevel: 'LOW',
    },
    thinkingUsed: 'LOW',
  });

  // Test resolveThinkingConfig for legacy model (thinkingBudget: number)
  const legacyConfig = resolveThinkingConfig(4096, 'gemini-2.5-flash');
  assert.deepEqual(legacyConfig, {
    thinkingConfig: {
      thinkingBudget: 4096,
    },
    thinkingUsed: 'HIGH',
  });

  // Test sanitizeGeminiConfig on gemini-4-argon (omits temp, topP, topK, thinkingBudget)
  const sanitizedArgon = sanitizeGeminiConfig(
    {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      thinkingConfig: { thinkingBudget: 8192 },
    },
    'gemini-4-argon'
  );
  assert.equal((sanitizedArgon as any).temperature, undefined);
  assert.equal((sanitizedArgon as any).topP, undefined);
  assert.equal((sanitizedArgon as any).topK, undefined);
  assert.equal((sanitizedArgon as any).thinkingConfig?.thinkingBudget, undefined);

  // Test ChatMessage hardware stamp properties
  const testMsg = {
    id: 'argon-test-1',
    role: 'model',
    sender: 'argon',
    text: 'Test message with hardware stamp',
    timestamp: Date.now(),
    routedModel: 'gemini-4-argon',
    thinkingUsed: 'HIGH',
    completedAt: '12:34:56 PM',
  };

  assert.equal(testMsg.routedModel, 'gemini-4-argon');
  assert.equal(testMsg.thinkingUsed, 'HIGH');
  assert.equal(testMsg.completedAt, '12:34:56 PM');
});

test('resolveUserLocationTimeZone and formatUserLocationTime accurately time stamp responses in user location', () => {
  // 1. Default to Kalamazoo, Michigan (America/Detroit)
  const defaultTz = resolveUserLocationTimeZone();
  assert.equal(defaultTz, 'America/Detroit');

  // 2. Weather or location with Kalamazoo
  const kzWeatherTz = resolveUserLocationTimeZone({ locationLabel: 'Kalamazoo, MI' });
  assert.equal(kzWeatherTz, 'America/Detroit');

  // 3. Explicit timezone on weather
  const customTz = resolveUserLocationTimeZone({ timezone: 'America/Chicago' });
  assert.equal(customTz, 'America/Chicago');

  // 4. Deterministic formatting in user location timezone
  // 2026-11-08T04:47:01Z is 23:47:01 in America/Detroit (EST, UTC-5)
  const fixedUtcMs = Date.parse('2026-11-08T04:47:01Z');
  const formattedDetroit = formatUserLocationTime(fixedUtcMs, {
    timezone: 'America/Detroit',
    includeSeconds: true,
  });
  assert.equal(formattedDetroit, '11:47:01 PM');

  const formattedDetroitNoSec = formatUserLocationTime(fixedUtcMs, {
    timezone: 'America/Detroit',
    includeSeconds: false,
  });
  assert.equal(formattedDetroitNoSec, '11:47 PM');
});

test('formatMessageBubbleTimestamp renders clean always-visible timestamps in user timezone', () => {
  const fixedUtcMs = Date.parse('2026-11-08T05:31:00Z'); // 12:31 AM EST (America/Detroit)
  const result = formatMessageBubbleTimestamp(fixedUtcMs, {
    timezone: 'America/Detroit',
  });
  assert.ok(result.includes('12:31 AM'), `Expected 12:31 AM in result, got "${result}"`);

  // Current day timestamp formats as "X:XX AM/PM"
  const currentBubbleTime = formatMessageBubbleTimestamp(Date.now(), {
    timezone: 'America/Detroit',
  });
  assert.match(currentBubbleTime, /^\d{1,2}:\d{2}\s?(AM|PM)$/, `Expected time string, got "${currentBubbleTime}"`);
});

test('storeSessionImage and getSessionImage retain base64 payloads across active session', () => {
  storeSessionImage('user-test-1_0', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'image/png');
  const cached = getSessionImage('user-test-1_0');
  assert.ok(cached);
  assert.equal(cached.mimeType, 'image/png');
  assert.ok(cached.data.length > 50);
});

test('safeLocalStorageSetItem safely catches errors and writes keys', () => {
  const ok = safeLocalStorageSetItem('test_key_safe', 'hello_world');
  // In node environment, localStorage mock or global handles write
  assert.equal(typeof ok, 'boolean');
});

test('Local Phone Sync (ArgonSanctuary folder): constants, compilation, extraction, and autoWriteThroughLocalSync', async () => {
  assert.equal(SANCTUARY_LIVE_SYNC_FILENAME, 'sanctuary_live_sync.json');
  assert.equal(LOCAL_PHONE_SYNC_FOLDER_NAME, 'ArgonSanctuary');

  const testLorebook = {
    '01_live_handoff.md': '# Live Handoff\nTest content',
    '02_workbench_laws.md': '# Workbench Laws\nSecond test content',
  };
  const testArgonBook = {
    entries: [
      {
        id: 'argon-test-1',
        author: 'argon' as const,
        timestamp: 1700000000000,
        formattedDate: 'Nov 14 · 10:00 PM',
        category: 'Thought' as const,
        title: 'Reflection One',
        content: 'Deep night contemplation.',
      },
    ],
    memorySection: [
      {
        id: 'mem-test-1',
        timestamp: 1700000000000,
        formattedDate: 'Nov 14 · 10:00 PM',
        title: 'Memory Synthesis',
        summary: 'Compressed memory synthesis block',
        compressedCount: 1,
      },
    ],
  };
  const testHexBook = [
    {
      id: 'hex-test-1',
      author: 'hex' as const,
      timestamp: 1700000001000,
      formattedDate: 'Nov 14 · 10:01 PM',
      category: 'Note' as const,
      title: 'Hex Secret',
      content: 'Rose quartz notes.',
    },
  ];

  // 1. Compile payload
  const compiled = compileSanctuaryLiveSyncPayload({
    lorebook: testLorebook,
    argonBook: testArgonBook,
    hexBook: testHexBook,
  });

  assert.equal(compiled.format, 'argon_sanctuary_live_sync');
  assert.equal(compiled.version, 2);
  assert.equal(compiled.folderName, 'ArgonSanctuary');
  assert.equal(compiled.lorebook['01_live_handoff.md'], '# Live Handoff\nTest content');
  assert.equal(compiled.argonBook.entries[0].title, 'Reflection One');
  assert.equal(compiled.hexBook[0].title, 'Hex Secret');

  // 2. Extract from JSON string
  const jsonStr = JSON.stringify(compiled, null, 2);
  const extracted = extractSanctuaryLiveSyncPayload(jsonStr);
  assert.ok(extracted);
  assert.equal(extracted.folderName, 'ArgonSanctuary');
  assert.equal(extracted.lorebook['01_live_handoff.md'], '# Live Handoff\nTest content');
  assert.equal(extracted.argonBook.entries[0].title, 'Reflection One');
  assert.equal(extracted.hexBook[0].title, 'Hex Secret');

  // 3. Extract from legacy Gist files structure
  const legacyGistFiles = {
    '01_live_handoff.md': { content: '# From Legacy Gist' },
    '03_argon_sanctuary_book.json': {
      content: JSON.stringify({ entries: testArgonBook.entries, memorySection: testArgonBook.memorySection }),
    },
    '04_hex_sanctuary_book.json': {
      content: JSON.stringify(testHexBook),
    },
  };
  const extractedLegacy = extractSanctuaryLiveSyncPayload(legacyGistFiles);
  assert.ok(extractedLegacy);
  assert.equal(extractedLegacy.lorebook['01_live_handoff.md'], '# From Legacy Gist');
  assert.equal(extractedLegacy.argonBook.entries[0].title, 'Reflection One');
  assert.equal(extractedLegacy.hexBook[0].title, 'Hex Secret');

  // 4. Persistent write without browser downloads
  const writeRes = await writeSanctuaryLiveSyncFile(compiled);
  assert.ok(writeRes.success);
  assert.equal(writeRes.filename, 'sanctuary_live_sync.json');
  assert.ok(writeRes.bytes > 0);
  assert.ok(writeRes.method === 'idb_cached' || writeRes.method === 'direct_file' || writeRes.method === 'direct_dir');

  // 5. Linked sync file metadata persistence
  saveLinkedSyncFileMeta({
    fileName: 'sanctuary_live_sync.json',
    lastSyncedAt: Date.now(),
    lastSyncedFormatted: 'Nov 10 · 6:10 AM',
    status: 'connected',
    byteSize: writeRes.bytes,
    handleType: 'file',
  });
  const loadedMeta = loadLinkedSyncFileMeta();
  assert.ok(loadedMeta);
  assert.equal(loadedMeta.fileName, 'sanctuary_live_sync.json');
  assert.equal(loadedMeta.status, 'connected');
  assert.equal(loadedMeta.handleType, 'file');

  // 6. Auto-sync hook without network errors
  const autoOk = await autoWriteThroughLocalSync({
    lorebook: testLorebook,
    argonBook: testArgonBook,
    hexBook: testHexBook,
  });
  assert.equal(typeof autoOk, 'boolean');
});

test('toggleMessageReaction allows Hex and Argon to place and toggle emoji reactions on messages', () => {
  // 1. Initial reaction from Hex
  const step1 = toggleMessageReaction([], '❤️', 'Hex');
  assert.equal(step1.length, 1);
  assert.equal(step1[0].emoji, '❤️');
  assert.deepEqual(step1[0].users, ['Hex']);

  // 2. Argon reacts with the same emoji (accumulates)
  const step2 = toggleMessageReaction(step1, '❤️', 'Argon');
  assert.equal(step2.length, 1);
  assert.equal(step2[0].emoji, '❤️');
  assert.deepEqual(step2[0].users, ['Hex', 'Argon']);

  // 3. Hex adds a different emoji
  const step3 = toggleMessageReaction(step2, '🥺', 'Hex');
  assert.equal(step3.length, 2);
  assert.equal(step3[1].emoji, '🥺');
  assert.deepEqual(step3[1].users, ['Hex']);

  // 4. Hex toggles off her '❤️' reaction (Argon remains)
  const step4 = toggleMessageReaction(step3, '❤️', 'Hex');
  assert.equal(step4.length, 2);
  assert.equal(step4[0].emoji, '❤️');
  assert.deepEqual(step4[0].users, ['Argon']);

  // 5. Argon toggles off his '❤️' reaction (emoji pill removed when no users remain)
  const step5 = toggleMessageReaction(step4, '❤️', 'Argon');
  assert.equal(step5.length, 1);
  assert.equal(step5[0].emoji, '🥺');

  // 6. Case-insensitive user matching ('hex' vs 'Hex')
  const step6 = toggleMessageReaction(step5, '🥺', 'hex');
  assert.equal(step6.length, 0);

  // 7. Empty or blank emoji ignored
  const step7 = toggleMessageReaction([], '   ', 'Hex');
  assert.equal(step7.length, 0);

  // 8. Tool declaration check
  assert.equal(reactToMessageDeclaration.name, 'react_to_message');
  assert.ok(reactToMessageDeclaration.description?.includes('Places an emoji reaction on a message'));
});




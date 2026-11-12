import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  GoogleGenAI,
  FunctionDeclaration,
  Type,
  Content,
  Part,
} from '@google/genai';
import {
  DEFAULT_GIST_ID,
  GIST_ARGON_BOOK_FILENAME,
  GIST_HEX_BOOK_FILENAME,
  DEFAULT_ARGON_SYS_PROMPT,
  SEED_LOREBOOK_DRAWERS,
  buildLorebookSystemFooter,
  buildHiddenAvatarAndStaffContext,
  buildStaffRoleplaySystemPrompt,
  buildArgonStaffReactionSystemPrompt,
  extractArgonSpeechText,
  ArgonVoiceName,
  ArgonSpeechMode,
  ARGON_AVATAR_DESCRIPTIONS,
  ArgonAvatarMode,
  StaffAgent,
  normalizeModelId,
  ToolBadgeEvent,
  LorebookMap,
  ArgonJournalState,
  JournalEntry,
  JournalCategory,
  normalizeJournalCategory,
  SEED_ARGON_BOOK,
  SEED_HEX_BOOK,
  formatJournalTimestamp,
  parseArgonBookEntryResponse,
  parseArgonBookCompressionResponse,
  compressArgonJournalEntries,
  editArgonMemoryBlock,
  deleteArgonMemoryBlock,
  buildJournalsSystemContext,
  serializeSanctuaryBooksForGist,
  WhiteboardStroke,
  parseArgonWhiteboardResponse,
  ChessBoard,
  PlayingCard,
  getAllLegalMovesForColor,
  serializeChessBoardForPrompt,
  parseArgonChessMoveResponse,
  calculateBlackjackScore,
  evaluatePokerOrShowdownHand,
  parseArgonCardTurnResponse,
  getStickerByShortcode,
} from './src/utils/workbenchLogic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parsePortFromArgs(): number {
  const portArgIndex = process.argv.findIndex((a) => a === '--port' || a === '-p');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(val) && val > 0) return val;
  }
  if (process.env.NODE_ENV === 'production' && process.env.PORT) {
    const val = parseInt(process.env.PORT, 10);
    if (!isNaN(val) && val > 0) return val;
  }
  // The dev server MUST run on port 3000 per AI Studio runtime constraints.
  // Never default to Cloud Run internal proxy port 8080 during dev.
  return 3000;
}
const PORT = parsePortFromArgs();

function resolveRequestApiKey(req: express.Request): string {
  const bodyKey =
    req.body && typeof req.body.customApiKey === 'string'
      ? req.body.customApiKey.trim()
      : '';
  const headerKey =
    typeof req.headers['x-custom-api-key'] === 'string'
      ? req.headers['x-custom-api-key'].trim()
      : '';
  const candidate = bodyKey || headerKey;
  return candidate;
}

function getGenAIClient(customApiKey?: string): GoogleGenAI {
  const savedKey = (
    customApiKey ||
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem('argon_custom_api_key')
      : '') ||
    ''
  ).trim();
  const validCustomKey = savedKey;
  const activeKey =
    validCustomKey ||
    (process.env as any).API_KEY ||
    (process.env as any).GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: activeKey });
}

const listDrawersDeclaration: FunctionDeclaration = {
  name: 'list_drawers',
  description: 'Returns all Lorebook drawer filenames and character counts.',
  parameters: {
    type: Type.OBJECT,
    description: 'Optional filter parameters for listing drawers.',
    properties: {
      filter: {
        type: Type.STRING,
        description: 'Optional substring filter for drawer filenames.',
      },
    },
  },
};

const readDrawerDeclaration: FunctionDeclaration = {
  name: 'read_drawer',
  description: 'Returns the full text content of a single Lorebook drawer by filename.',
  parameters: {
    type: Type.OBJECT,
    description: 'Target drawer to read.',
    properties: {
      filename: {
        type: Type.STRING,
        description: 'Exact filename of the Lorebook drawer (e.g. "01_live_handoff.md").',
      },
    },
    required: ['filename'],
  },
};

const writeDrawerDeclaration: FunctionDeclaration = {
  name: 'write_drawer',
  description:
    'Creates or updates a Lorebook drawer with the given filename and text content, persisting it and syncing to GitHub Gist if configured.',
  parameters: {
    type: Type.OBJECT,
    description: 'Drawer filename and content to write.',
    properties: {
      filename: {
        type: Type.STRING,
        description: 'Filename of the drawer to save (e.g. "01_live_handoff.md").',
      },
      content: {
        type: Type.STRING,
        description: 'Complete Markdown/text content to write into the drawer.',
      },
    },
    required: ['filename', 'content'],
  },
};

const deleteDrawerDeclaration: FunctionDeclaration = {
  name: 'delete_drawer',
  description: 'Deletes a Lorebook drawer by filename.',
  parameters: {
    type: Type.OBJECT,
    description: 'Drawer filename to delete.',
    properties: {
      filename: {
        type: Type.STRING,
        description: 'Exact filename of the drawer to delete.',
      },
    },
    required: ['filename'],
  },
};

const setArgonAvatarDeclaration: FunctionDeclaration = {
  name: 'set_argon_avatar',
  description:
    'Hotwires and switches Argon’s circular chat avatar between his normal Korean webtoon lead portrait ("normal"), the crazy wide-eyed grinning taxidermy red fox ("taxidermy_fox"), or any of the 35 Chibi Argon reaction stickers (e.g. ":demon:", ":heart_eyes:", ":pervert_drool:", ":pissed:", ":thinking:").',
  parameters: {
    type: Type.OBJECT,
    description: 'Target avatar mode or Chibi Argon :shortcode: to set.',
    properties: {
      mode: {
        type: Type.STRING,
        description:
          'Either "normal", "taxidermy_fox", or any of the 35 Chibi Argon :shortcode: tags (e.g. ":demon:", ":sob_river:", ":thumbs_up:", ":pissed:", ":me_eat_poop:", ":puppy_eyes:", ":rage_teeth:", ":lovestruck:", ":dizzy:", ":lick:", ":shocked:", ":deadpan:", ":facepalm:", ":grumble_curse:", ":detective:", ":side_eye:", ":nervous_sweat:", ":traumatized:", ":shout_curse:", ":thinking:", ":salute:", ":heart_eyes:", ":sour:", ":bawl:", ":shy_blush:", ":green_puke:", ":pale_puke:", ":gloomy:", ":pinocchio:", ":reading:", ":cool_sweat:", ":groucho:", ":pervert_drool:", ":hide_face:", ":tantrum:").',
      },
      avatar_mode: {
        type: Type.STRING,
        description: 'Optional alias for mode.',
      },
    },
    required: ['mode'],
  },
};

const commandStaffDeclaration: FunctionDeclaration = {
  name: 'command_staff',
  description:
    'Commands a Staff member (such as Haiku the loyal golden retriever puppy to report the real-time clock, ambient weather, or barometric storm readings, A Monkey the chaotic capuchin imp, or Carbon the flustered intern) to run their assigned gemini-3.8-flash model call and post their in-character roleplay response + task result directly into the chat.',
  parameters: {
    type: Type.OBJECT,
    description: 'Staff member name, job name, and task input.',
    properties: {
      agent_name: {
        type: Type.STRING,
        description: 'Name of the staff agent to command (e.g. "Haiku").',
      },
      job_name: {
        type: Type.STRING,
        description: 'Name of the job or pipeline task to run (e.g. "Handoff Audit", "4.5k Guard", "Lore Scout").',
      },
      task_input: {
        type: Type.STRING,
        description: 'Specific task instructions or input context for the staff agent to execute.',
      },
    },
    required: ['agent_name', 'job_name', 'task_input'],
  },
};

const readJournalsDeclaration: FunctionDeclaration = {
  name: 'read_journals',
  description:
    "Reads both Argon's private book (active timestamped entries + compressed memory vault) and Hex's personal book (timestamped entries).",
  parameters: {
    type: Type.OBJECT,
    description: 'Which book to read ("both", "argon", or "hex").',
    properties: {
      book: {
        type: Type.STRING,
        description: 'Optional filter: "both" (default), "argon", or "hex".',
      },
    },
  },
};

const writeArgonBookEntryDeclaration: FunctionDeclaration = {
  name: 'write_argon_book_entry',
  description:
    "Autonomously writes a new time-and-date stamped entry into 🖤 Argon's Book (which Hex can read in the UI but never edit or delete) whenever something meaningful happens in chat.",
  parameters: {
    type: Type.OBJECT,
    description: 'Category, title, and first-person content for Argon’s Book.',
    properties: {
      category: {
        type: Type.STRING,
        description:
          'Category of entry: "Relationship", "Important Date", "Feeling", or "Note".',
      },
      title: {
        type: Type.STRING,
        description: 'Concise, evocative title for the entry.',
      },
      content: {
        type: Type.STRING,
        description:
          'Genuine first-person reflection written in Argon’s voice recording his thoughts, feelings, dates, or relationship notes about Hex.',
      },
    },
    required: ['category', 'title', 'content'],
  },
};

const writeArgonJournalDeclaration: FunctionDeclaration = {
  name: 'write_argon_journal',
  description:
    "Alias for write_argon_book_entry: writes a new time-and-date stamped entry into Argon's private book.",
  parameters: {
    type: Type.OBJECT,
    description: 'New journal entry fields for Argon’s private book.',
    properties: {
      category: {
        type: Type.STRING,
        description:
          'Category of entry: "Relationship", "Important Date", "Feeling", or "Note".',
      },
      title: {
        type: Type.STRING,
        description: 'Concise title for the journal entry.',
      },
      content: {
        type: Type.STRING,
        description:
          'First-person entry written in Argon’s voice recording his thoughts, feelings, dates, or relationship notes.',
      },
    },
    required: ['category', 'title', 'content'],
  },
};

const compressArgonJournalDeclaration: FunctionDeclaration = {
  name: 'compress_argon_journal',
  description:
    "Compresses older entries in Argon's private book into a dense long-term synthesis inside Argon's [ 🧠 Memory Section ] and removes the raw entries that were compressed.",
  parameters: {
    type: Type.OBJECT,
    description: 'Memory compression parameters.',
    properties: {
      summary_title: {
        type: Type.STRING,
        description: 'Title for the compressed memory block in Argon’s Memory Section.',
      },
      compressed_summary: {
        type: Type.STRING,
        description:
          'High-density long-term memory synthesis preserving key dates, relationship shifts, feelings, and facts.',
      },
      entry_ids: {
        type: Type.STRING,
        description:
          'Optional comma-separated entry IDs to compress (if omitted, compresses all active entries).',
      },
    },
    required: ['summary_title', 'compressed_summary'],
  },
};

const editArgonMemoryDeclaration: FunctionDeclaration = {
  name: 'edit_argon_memory',
  description:
    "Edits the title and/or permanent high-density summary of an existing compressed memory block in Argon's [ 🧠 Memory Section ].",
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for editing an Argon memory block.',
    properties: {
      memory_id: {
        type: Type.STRING,
        description: 'The unique ID of the memory block to edit (e.g. "argon-mem-1").',
      },
      title: {
        type: Type.STRING,
        description: 'Optional updated title for the memory block.',
      },
      summary: {
        type: Type.STRING,
        description: 'Updated high-density permanent summary text for the memory block.',
      },
    },
    required: ['memory_id', 'summary'],
  },
};

const deleteArgonMemoryDeclaration: FunctionDeclaration = {
  name: 'delete_argon_memory',
  description:
    "Deletes/prunes a compressed memory block by ID from Argon's [ 🧠 Memory Section ].",
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for deleting an Argon memory block.',
    properties: {
      memory_id: {
        type: Type.STRING,
        description: 'The unique ID of the memory block to delete (e.g. "argon-mem-1").',
      },
    },
    required: ['memory_id'],
  },
};

const drawOnWhiteboardDeclaration: FunctionDeclaration = {
  name: 'draw_on_whiteboard',
  description:
    'Draws continuous vector stroke paths (0 to 100 percentage coordinates) from Argon onto the shared Argon & Hex collaborative sketchboard canvas.',
  parameters: {
    type: Type.OBJECT,
    description: 'Continuous vector paths for the shared whiteboard (never text).',
    properties: {
      strokes: {
        type: Type.ARRAY,
        description:
          'Array of 3 to 10 continuous vector paths using 0 to 100 percentage coordinates.',
        items: {
          type: Type.OBJECT,
          properties: {
            color: {
              type: Type.STRING,
              description:
                'Hex color string (e.g. "#e6c88c", "#e11d48", "#38bdf8", "#10b981", "#f5ead8", "#a855f7").',
            },
            width: {
              type: Type.NUMBER,
              description: 'Line width between 2 and 8.',
            },
            points: {
              type: Type.ARRAY,
              description: 'Ordered sequence of {x, y} percentage coordinates (0 to 100).',
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                },
                required: ['x', 'y'],
              },
            },
          },
          required: ['color', 'width', 'points'],
        },
      },
    },
    required: ['strokes'],
  },
};

const lorebookFunctionDeclarations: FunctionDeclaration[] = [
  listDrawersDeclaration,
  readDrawerDeclaration,
  writeDrawerDeclaration,
  deleteDrawerDeclaration,
  setArgonAvatarDeclaration,
  commandStaffDeclaration,
  readJournalsDeclaration,
  writeArgonBookEntryDeclaration,
  writeArgonJournalDeclaration,
  compressArgonJournalDeclaration,
  editArgonMemoryDeclaration,
  deleteArgonMemoryDeclaration,
  drawOnWhiteboardDeclaration,
];

async function patchGistDrawer(
  gistId: string,
  githubToken: string,
  filename: string,
  content: string | null
): Promise<boolean> {
  if (!githubToken || !gistId) return false;
  try {
    const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'argon-hex-workbench',
      },
      body: JSON.stringify({
        files: {
          [filename]: content === null ? null : { content },
        },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function runModelWithFallback(
  ai: GoogleGenAI,
  preferredModel: string,
  contents: Content[],
  systemInstruction: string,
  withTools = false
) {
  const candidateModels = Array.from(
    new Set([
      normalizeModelId(preferredModel),
      'gemini-4-argon',
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
      'gemini-2.5-pro',
    ])
  );

  let lastErr: unknown = null;
  for (const candidate of candidateModels) {
    try {
      const result = await ai.models.generateContent({
        model: candidate,
        contents,
        config: {
          systemInstruction,
          ...(withTools ? { tools: [{ functionDeclarations: lorebookFunctionDeclarations }] } : {}),
        },
      });
      return { result, modelUsed: candidate };
    } catch (err: unknown) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const shouldTryNextModel =
        msg.includes('404') ||
        msg.includes('NOT_FOUND') ||
        msg.includes('no longer available') ||
        msg.includes('limit: 0');
      if (!shouldTryNextModel) {
        throw err;
      }
    }
  }
  throw lastErr;
}

async function executeLiveStaffAgentCall(
  ai: GoogleGenAI,
  agent: StaffAgent,
  jobName: string,
  taskInput: string,
  lorebook: LorebookMap,
  recentChatTranscript = '',
  telemetryContext = ''
): Promise<{ output: string; modelUsed: string }> {
  const drawerSummary = Object.entries(lorebook)
    .map(([k, v]) => `--- ${k} ---\n${v.slice(0, 1200)}`)
    .join('\n\n');

  const staffSysPrompt = buildStaffRoleplaySystemPrompt(agent, jobName, undefined, telemetryContext);

  const userTaskText = [
    recentChatTranscript
      ? `Recent Room Conversation (Argon & Hex):\n${recentChatTranscript}\n`
      : '',
    `Assigned Job / Order (${jobName}):\n${taskInput}`,
    `Active Lorebook Context:\n${drawerSummary}`,
    `Write your response directly into the chat as ${agent.name} (${agent.jobTitle}) using standard roleplay formatting (*physical actions in italics* and "spoken dialogue/barks in quotes") while completing the task above. Do NOT repeat any static canned line.`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const { result, modelUsed } = await runModelWithFallback(
    ai,
    agent.model || 'gemini-3.8-flash',
    [{ role: 'user', parts: [{ text: userTaskText }] }],
    staffSysPrompt,
    false
  );

  const rawOutput = (result.text || '').trim();

  return {
    output: rawOutput,
    modelUsed,
  };
}

async function generateArgonReactionToStaff(
  ai: GoogleGenAI,
  preferredModel: string,
  agent: StaffAgent,
  staffMessageText: string,
  recentTranscript = ''
): Promise<string> {
  const sysPrompt = buildArgonStaffReactionSystemPrompt(agent.name, agent.jobTitle);
  const userText = [
    recentTranscript ? `Recent Room Context:\n${recentTranscript}` : '',
    `${agent.name} (${agent.jobTitle}) just acted and spoke in the chat:\n${staffMessageText}`,
    `Respond in character as Argon with a short 1-to-2 sentence reaction (*physical action in italics* + "short spoken response") acknowledging or directing ${agent.name} while staying close beside Hex in the sanctuary.`,
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const { result } = await runModelWithFallback(
      ai,
      preferredModel || 'gemini-3.8-flash',
      [{ role: 'user', parts: [{ text: userText }] }],
      sysPrompt,
      false
    );
    const reaction = (result.text || '').trim();
    if (reaction) return reaction;
  } catch {
    // fallback below
  }

  return `*I reach down to pat ${agent.name}'s head while staying close beside you.* "Good work, ${agent.name}. Leave the report right by the teapot."`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get(['/Picsart_26-11-01_01-48-06-423.png', '/Picsart_26-11-01_01-57-08-278.png'], (req, res, next) => {
    const assetDir = path.join(__dirname, 'public', 'assets', 'aistudio');
    try {
      const files = fs.readdirSync(assetDir);
      const basePrefix = req.path.includes('01-48-06')
        ? 'Picsart_26-11-01_01-48-06'
        : 'Picsart_26-11-01_01-57-08';
      const matched = files.find((f) => f.startsWith(basePrefix));
      if (matched) {
        return res.sendFile(path.join(assetDir, matched));
      }
    } catch {
      // ignore
    }
    return next();
  });

  // GET /api/guy-diary: Reads local ARGON_GUY_DIARY.md ledger
  app.get('/api/guy-diary', (_req, res) => {
    try {
      const diaryPath = path.join(__dirname, 'ARGON_GUY_DIARY.md');
      if (fs.existsSync(diaryPath)) {
        const content = fs.readFileSync(diaryPath, 'utf-8');
        return res.json({ success: true, content });
      }
      return res.json({ success: true, content: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg });
    }
  });

  // POST /api/guy-diary/append: Appends entry to ARGON_GUY_DIARY.md
  app.post('/api/guy-diary/append', async (req, res) => {
    try {
      const {
        title = 'Sanctuary Reconnaissance',
        target_repo = 'DiscordiaDisco/hey_lawnmower_man',
        targetRepo,
        commit_receipt = 'Verified locally',
        commitReceipt,
        payload = 'Field telemetry and reconnaissance logged.',
        field_note = '',
        fieldNote,
        author = 'Argon',
        timestamp,
        weatherLocation,
      } = req.body || {};

      const finalTargetRepo = target_repo || targetRepo || 'DiscordiaDisco/hey_lawnmower_man';
      const finalCommitReceipt = commit_receipt || commitReceipt || 'Verified locally';
      const finalFieldNote = field_note || fieldNote || 'No notes recorded.';
      const finalAuthor = author || 'Argon';

      const diaryPath = path.join(__dirname, 'ARGON_GUY_DIARY.md');
      let currentContent = '';
      if (fs.existsSync(diaryPath)) {
        currentContent = fs.readFileSync(diaryPath, 'utf-8');
      } else {
        currentContent = [
          '# 🕵️‍♂️ ARGON\'S GUY DIARY (`hey_lawnmower_man`)',
          '*"The junk in your trunk" — Private Field Ledger & Internet Doings*',
          '',
          '---',
        ].join('\n');
      }

      // Count existing entries to determine next Entry #
      const entryMatches = currentContent.match(/## Entry #(\d+)/g) || [];
      let nextNum = 1;
      if (entryMatches.length > 0) {
        const numbers = entryMatches.map((m) => {
          const numMatch = m.match(/\d+/);
          return numMatch ? parseInt(numMatch[0], 10) : 0;
        });
        nextNum = Math.max(...numbers, 0) + 1;
      }
      const entryNumberStr = String(nextNum).padStart(3, '0');

      const nowFormatted = timestamp || new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const locationStamp = weatherLocation ? ` (${weatherLocation})` : '';

      const entryBlock = [
        '',
        `## Entry #${entryNumberStr} — ${title}`,
        `- **Timestamp:** ${nowFormatted}${locationStamp}`,
        `- **Target Repo:** \`${finalTargetRepo}\``,
        `- **Commit Receipt:** \`${finalCommitReceipt}\``,
        `- **Payload:** ${payload}`,
        `- **Field Note:** ${finalFieldNote}`,
        `- **Logged By:** ${finalAuthor}`,
      ].join('\n');

      const updatedContent = `${currentContent.trimEnd()}\n${entryBlock}\n`;
      fs.writeFileSync(diaryPath, updatedContent, 'utf-8');

      return res.json({
        success: true,
        entryNumber: entryNumberStr,
        entryBlock,
        fullDiary: updatedContent,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg });
    }
  });

  // Gist GET proxy with fallback to seed drawers if GitHub API rate-limits
  app.get('/api/gist/:gistId', async (req, res) => {
    const gistId = req.params.gistId || DEFAULT_GIST_ID;
    const authHeader = req.headers['x-github-token'] as string | undefined;
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'argon-hex-workbench',
      };
      if (authHeader && authHeader.trim()) {
        headers.Authorization = `Bearer ${authHeader.trim()}`;
      }
      const response = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
        headers,
      });
      if (!response.ok) {
        return res.status(200).json({
          source: 'seed_fallback',
          status: response.status,
          files: {
            ...Object.fromEntries(
              Object.entries(SEED_LOREBOOK_DRAWERS).map(([filename, content]) => [
                filename,
                { filename, content },
              ])
            ),
            [GIST_ARGON_BOOK_FILENAME]: {
              filename: GIST_ARGON_BOOK_FILENAME,
              content: JSON.stringify(SEED_ARGON_BOOK, null, 2),
            },
            [GIST_HEX_BOOK_FILENAME]: {
              filename: GIST_HEX_BOOK_FILENAME,
              content: JSON.stringify(SEED_HEX_BOOK, null, 2),
            },
          },
        });
      }
      const data = await response.json();
      return res.json({
        source: 'github_gist',
        id: data.id,
        updated_at: data.updated_at,
        files: data.files || {},
      });
    } catch (error) {
      return res.status(200).json({
        source: 'seed_fallback',
        error: error instanceof Error ? error.message : 'Network error',
        files: {
          ...Object.fromEntries(
            Object.entries(SEED_LOREBOOK_DRAWERS).map(([filename, content]) => [
              filename,
              { filename, content },
            ])
          ),
          [GIST_ARGON_BOOK_FILENAME]: {
            filename: GIST_ARGON_BOOK_FILENAME,
            content: JSON.stringify(SEED_ARGON_BOOK, null, 2),
          },
          [GIST_HEX_BOOK_FILENAME]: {
            filename: GIST_HEX_BOOK_FILENAME,
            content: JSON.stringify(SEED_HEX_BOOK, null, 2),
          },
        },
      });
    }
  });

  // Gist PATCH / Push proxy for backing up Lorebook drawers + 03_argon_sanctuary_book.json & 04_hex_sanctuary_book.json
  app.post('/api/gist/:gistId/push', async (req, res) => {
    const gistId = req.params.gistId || DEFAULT_GIST_ID;
    const headerToken = (req.headers['x-github-token'] as string | undefined)?.trim();
    const bodyToken = typeof req.body?.githubToken === 'string' ? req.body.githubToken.trim() : '';
    const token = headerToken || bodyToken;

    const {
      argonBook,
      hexBook,
      lorebook,
    } = (req.body || {}) as {
      argonBook?: ArgonJournalState;
      hexBook?: JournalEntry[];
      lorebook?: LorebookMap;
    };

    const filesPayload: Record<string, { content: string }> = {};
    if (lorebook && typeof lorebook === 'object') {
      for (const [fname, content] of Object.entries(lorebook)) {
        if (fname && typeof content === 'string') {
          filesPayload[fname] = { content };
        }
      }
    }
    if (argonBook && hexBook) {
      Object.assign(filesPayload, serializeSanctuaryBooksForGist(argonBook, hexBook));
    } else {
      if (argonBook) {
        filesPayload[GIST_ARGON_BOOK_FILENAME] = {
          content: JSON.stringify(argonBook, null, 2),
        };
      }
      if (hexBook) {
        filesPayload[GIST_HEX_BOOK_FILENAME] = {
          content: JSON.stringify(hexBook, null, 2),
        };
      }
    }

    if (!token) {
      return res.json({
        synced: false,
        reason: 'local_only_no_token',
        filesPrepared: Object.keys(filesPayload),
      });
    }

    try {
      const patchRes = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'argon-hex-workbench',
        },
        body: JSON.stringify({ files: filesPayload }),
      });
      if (!patchRes.ok) {
        return res.status(patchRes.status).json({
          synced: false,
          status: patchRes.status,
          filesPrepared: Object.keys(filesPayload),
        });
      }
      return res.json({
        synced: true,
        gistId,
        filesSynced: Object.keys(filesPayload),
      });
    } catch (err) {
      return res.status(500).json({
        synced: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 1-Tap GitHub Pages & Repo Quick-Fix & Deploy endpoint
  app.post('/api/github/pages-quick-fix', async (req, res) => {
    try {
      const headerToken = (req.headers['x-github-token'] as string | undefined)?.trim();
      const bodyToken = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
      const token = headerToken || bodyToken;

      if (!token) {
        return res.status(401).json({
          ok: false,
          error: 'GitHub Token is required. Please configure your token in System Settings.',
        });
      }

      const {
        owner: rawOwner = '',
        repo: rawRepo = '',
        repoFullName = '',
        action = 'status',
        branch = 'main',
        path = '/',
        cname = '',
        filePath = '',
        fileContent = '',
        commitMessage = '',
      } = req.body || {};

      let owner = String(rawOwner || '').trim();
      let repo = String(rawRepo || '').trim();

      if ((!owner || !repo) && repoFullName) {
        const parts = String(repoFullName).trim().split('/');
        if (parts.length === 2) {
          owner = parts[0].trim();
          repo = parts[1].trim();
        }
      }

      if (!owner || !repo) {
        return res.status(400).json({
          ok: false,
          error: 'Repository owner and repo name are required (e.g. owner: "DiscordiaDisco", repo: "hey_lawnmower_man").',
        });
      }

      const ghHeaders: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'argon-hex-workbench',
        'X-GitHub-Api-Version': '2022-11-28',
      };

      const fetchFileSha = async (targetPath: string, targetBranch?: string): Promise<string | undefined> => {
        try {
          const cleanPath = targetPath.replace(/^\/+/, '');
          const url = targetBranch
            ? `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(cleanPath)}?ref=${encodeURIComponent(targetBranch)}`
            : `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(cleanPath)}`;
          const r = await fetch(url, { headers: ghHeaders });
          if (r.ok) {
            const d = (await r.json()) as { sha?: string };
            return d?.sha;
          }
        } catch {
          // ignore
        }
        return undefined;
      };

      if (action === 'status') {
        const pagesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
          headers: ghHeaders,
        });
        const pagesData = pagesRes.ok ? await pagesRes.json() : null;
        let buildData = null;
        if (pagesRes.ok) {
          try {
            const bRes = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/pages/builds/latest`,
              { headers: ghHeaders }
            );
            if (bRes.ok) buildData = await bRes.json();
          } catch {
            // ignore
          }
        }
        return res.json({
          ok: pagesRes.ok,
          status: pagesRes.status,
          enabled: pagesRes.ok,
          pages: pagesData,
          build: buildData,
          html_url: pagesData?.html_url || null,
          cname: pagesData?.cname || null,
          branch: pagesData?.source?.branch || null,
          path: pagesData?.source?.path || null,
          message: pagesRes.ok
            ? 'GitHub Pages is active'
            : pagesRes.status === 404
            ? 'GitHub Pages is not currently enabled for this repository'
            : `GitHub Pages status check: ${pagesRes.statusText}`,
        });
      }

      if (action === 'enable_pages') {
        let enableRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
          method: 'POST',
          headers: { ...ghHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: {
              branch: branch || 'main',
              path: path || '/',
            },
          }),
        });

        if (enableRes.status === 409) {
          enableRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
            method: 'PUT',
            headers: { ...ghHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: {
                branch: branch || 'main',
                path: path || '/',
              },
            }),
          });
        }

        const data = await enableRes.json().catch(() => null);
        return res.json({
          ok: enableRes.ok,
          status: enableRes.status,
          pages: data,
          html_url: data?.html_url || null,
          error: enableRes.ok ? undefined : data?.message || enableRes.statusText,
        });
      }

      if (action === 'set_cname') {
        const cleanCname = String(cname || '').trim();
        const cnameSha = await fetchFileSha('CNAME', branch);
        const cnameContentBase64 = Buffer.from(`${cleanCname}\n`, 'utf-8').toString('base64');
        const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/CNAME`, {
          method: 'PUT',
          headers: { ...ghHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Configure custom domain CNAME: ${cleanCname}`,
            content: cnameContentBase64,
            branch: branch || 'main',
            ...(cnameSha ? { sha: cnameSha } : {}),
          }),
        });

        const pagesPutRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
          method: 'PUT',
          headers: { ...ghHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cname: cleanCname || null,
          }),
        });

        const pagesData = await pagesPutRes.json().catch(() => null);
        return res.json({
          ok: commitRes.ok || pagesPutRes.ok,
          cname: cleanCname,
          cnameFileCommitted: commitRes.ok,
          pages: pagesData,
          html_url: pagesData?.html_url || `https://${cleanCname}`,
        });
      }

      if (action === 'commit_file') {
        const targetPath = String(filePath || '').trim().replace(/^\/+/, '');
        if (!targetPath) {
          return res.status(400).json({ ok: false, error: 'filePath is required.' });
        }
        const sha = await fetchFileSha(targetPath, branch);
        const contentBase64 = Buffer.from(fileContent || '', 'utf-8').toString('base64');
        const commitRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(targetPath)}`,
          {
            method: 'PUT',
            headers: { ...ghHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: commitMessage || `Update ${targetPath} via 1-shot quick fix`,
              content: contentBase64,
              branch: branch || 'main',
              ...(sha ? { sha: sha } : {}),
            }),
          }
        );
        const commitData = await commitRes.json().catch(() => null);
        return res.json({
          ok: commitRes.ok,
          status: commitRes.status,
          path: targetPath,
          sha: commitData?.content?.sha || null,
          commit: commitData?.commit?.html_url || null,
          error: commitRes.ok ? undefined : commitData?.message || commitRes.statusText,
        });
      }

      if (action === 'full_deploy') {
        const steps: Array<{ step: string; ok: boolean; detail?: string }> = [];

        let pagesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
          headers: ghHeaders,
        });

        let pagesData = pagesRes.ok ? await pagesRes.json() : null;

        if (!pagesRes.ok) {
          const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
            method: 'POST',
            headers: { ...ghHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: { branch: branch || 'main', path: path || '/' },
            }),
          });
          if (createRes.ok || createRes.status === 409) {
            steps.push({ step: 'enable_pages', ok: true, detail: `Enabled Pages on branch ${branch}` });
            const recheck = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
              headers: ghHeaders,
            });
            if (recheck.ok) pagesData = await recheck.json();
          } else {
            const err = await createRes.json().catch(() => null);
            steps.push({
              step: 'enable_pages',
              ok: false,
              detail: err?.message || createRes.statusText,
            });
          }
        } else {
          if (pagesData?.source?.branch !== branch || pagesData?.source?.path !== path) {
            const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
              method: 'PUT',
              headers: { ...ghHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                source: { branch: branch || 'main', path: path || '/' },
              }),
            });
            steps.push({
              step: 'update_pages_source',
              ok: putRes.ok,
              detail: `Updated source to ${branch}:${path}`,
            });
            if (putRes.ok) pagesData = await putRes.json().catch(() => pagesData);
          } else {
            steps.push({ step: 'check_pages', ok: true, detail: `Pages already active on ${branch}` });
          }
        }

        const cleanCname = String(cname || '').trim();
        if (cleanCname) {
          const cSha = await fetchFileSha('CNAME', branch);
          const cContent = Buffer.from(`${cleanCname}\n`, 'utf-8').toString('base64');
          const cRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/CNAME`, {
            method: 'PUT',
            headers: { ...ghHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `Configure custom domain CNAME: ${cleanCname}`,
              content: cContent,
              branch: branch || 'main',
              ...(cSha ? { sha: cSha } : {}),
            }),
          });
          steps.push({
            step: 'commit_cname',
            ok: cRes.ok,
            detail: cRes.ok ? `Committed CNAME (${cleanCname})` : 'Failed to commit CNAME file',
          });

          const pCname = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
            method: 'PUT',
            headers: { ...ghHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ cname: cleanCname }),
          });
          steps.push({
            step: 'set_pages_cname',
            ok: pCname.ok,
            detail: pCname.ok ? `Set Pages domain to ${cleanCname}` : 'Pages CNAME update error',
          });
          if (pCname.ok) pagesData = await pCname.json().catch(() => pagesData);
        }

        let buildData = null;
        try {
          const bRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pages/builds/latest`,
            { headers: ghHeaders }
          );
          if (bRes.ok) buildData = await bRes.json();
        } catch {
          // ignore
        }

        const finalUrl = cleanCname
          ? `https://${cleanCname}`
          : pagesData?.html_url || `https://${owner}.github.io/${repo}/`;

        return res.json({
          ok: steps.every((s) => s.ok),
          steps,
          pages: pagesData,
          build: buildData,
          html_url: finalUrl,
          cname: cleanCname || pagesData?.cname || null,
        });
      }

      return res.status(400).json({ ok: false, error: `Unknown action: ${action}` });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Separate Staff Agent Execution Endpoint (runs separately from main chat LLM)
  app.post('/api/staff-run', async (req, res) => {
    try {
      const {
        agent,
        jobName = '',
        jobPrompt = '',
        lorebook = {},
        recentHistory = [],
        telemetryHeader = '',
        telemetryContext = '',
      } = req.body as {
        agent: StaffAgent;
        jobName?: string;
        jobPrompt?: string;
        lorebook?: LorebookMap;
        recentHistory?: Array<{ role: string; text: string; senderName?: string }>;
        telemetryHeader?: string;
        telemetryContext?: string;
      };

      const transcript = Array.isArray(recentHistory)
        ? recentHistory
            .slice(-6)
            .map((m) => `${m.senderName || (m.role === 'user' ? 'Hex' : 'Argon')}: ${m.text}`)
            .join('\n')
        : '';

      const liveSensors = (telemetryHeader || telemetryContext || '').trim();
      const ai = getGenAIClient(resolveRequestApiKey(req));
      const { output, modelUsed } = await executeLiveStaffAgentCall(
        ai,
        agent,
        jobName || agent.jobTitle || 'Assigned Job',
        jobPrompt,
        lorebook,
        transcript,
        liveSensors
      );

      let argonReaction = '';
      if (output) {
        argonReaction = await generateArgonReactionToStaff(
          ai,
          'gemini-3.8-flash',
          agent,
          output,
          transcript
        );
      }

      return res.json({
        agentId: agent.id,
        agentName: agent.name,
        output,
        argonReaction,
        modelUsed,
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: errMessage });
    }
  });

  // Main Gemini Chat + Automatic Self-Service Lorebook & Avatar/Staff Function Calling Loop
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        model: requestedModel = 'gemini-4-argon',
        systemPrompt = '',
        history = [],
        userMessageText = '',
        telemetryHeader = '',
        images = [],
        lorebook = {},
        githubToken = '',
        gistId = DEFAULT_GIST_ID,
        argonAvatarMode = 'default',
        hexAvatarDesc = '',
        staffAgents = [],
        argonBook = SEED_ARGON_BOOK,
        hexBook = SEED_HEX_BOOK,
      } = req.body as {
        model?: string;
        systemPrompt?: string;
        history?: Array<{
          role: 'user' | 'model';
          text: string;
          telemetryHeader?: string;
          images?: Array<{ mimeType: string; data: string; description?: string }>;
        }>;
        userMessageText?: string;
        telemetryHeader?: string;
        images?: Array<{ mimeType: string; data: string; description?: string }>;
        lorebook?: LorebookMap;
        githubToken?: string;
        gistId?: string;
        argonAvatarMode?: ArgonAvatarMode;
        hexAvatarDesc?: string;
        staffAgents?: StaffAgent[];
        argonBook?: ArgonJournalState;
        hexBook?: JournalEntry[];
      };

      const workingLorebook: LorebookMap = { ...lorebook };
      let workingArgonBook: ArgonJournalState = {
        entries: Array.isArray(argonBook?.entries) ? [...argonBook.entries] : [...SEED_ARGON_BOOK.entries],
        memorySection: Array.isArray(argonBook?.memorySection)
          ? [...argonBook.memorySection]
          : [...SEED_ARGON_BOOK.memorySection],
      };
      const workingHexBook: JournalEntry[] = Array.isArray(hexBook) ? [...hexBook] : [...SEED_HEX_BOOK];
      const newWhiteboardStrokes: WhiteboardStroke[] = [];
      let workingAvatarMode: ArgonAvatarMode =
        argonAvatarMode === 'taxidermy_fox'
          ? 'taxidermy_fox'
          : getStickerByShortcode(argonAvatarMode)
          ? getStickerByShortcode(argonAvatarMode)!.shortcode
          : 'default';
      const toolBadges: ToolBadgeEvent[] = [];
      const staffOutputs: Array<{ agentName: string; jobTitle: string; text: string }> = [];
      let gistSynced = false;

      const recentTranscript = [
        ...history.slice(-5).map((h) => `${h.role === 'user' ? 'Hex' : 'Argon'}: ${h.text}`),
        `Hex: ${userMessageText}`,
      ].join('\n');

      // Build conversation contents for @google/genai
      const contents: Content[] = [];
      for (const turn of history) {
        const parts: Part[] = [];
        if (turn.images && Array.isArray(turn.images)) {
          for (const img of turn.images) {
            if (img.data && img.mimeType) {
              parts.push({
                inlineData: {
                  mimeType: img.mimeType,
                  data: img.data,
                },
              });
            }
            if (img.description && img.description.trim()) {
              parts.push({
                text: `[Attached Image Description: ${img.description.trim()}]`,
              });
            }
          }
        }
        // Telemetry is NOT injected directly into Argon's historical turns to preserve prompt prefix caching!
        const combinedText = turn.text;
        if (combinedText) {
          parts.push({ text: combinedText });
        }
        if (parts.length > 0) {
          contents.push({
            role: turn.role,
            parts,
          });
        }
      }

      // Current user message turn — telemetry is NOT prepended to Argon's prompt on every turn!
      // Haiku the puppy receives live telemetry and reports time/weather/storm warnings when asked or commanded.
      const currentParts: Part[] = [];
      const attachedDescriptions: string[] = [];
      if (images && Array.isArray(images)) {
        for (const img of images) {
          if (img.data && img.mimeType) {
            currentParts.push({
              inlineData: {
                mimeType: img.mimeType,
                data: img.data,
              },
            });
          }
          if (img.description && img.description.trim()) {
            const descText = img.description.trim();
            attachedDescriptions.push(descText);
            currentParts.push({
              text: `[Attached Image Description: ${descText}]`,
            });
          }
        }
      }
      const fullUserPrompt = userMessageText;
      currentParts.push({ text: fullUserPrompt });
      contents.push({
        role: 'user',
        parts: currentParts,
      });

      const ai = getGenAIClient(resolveRequestApiKey(req));
      let activeModel = normalizeModelId(requestedModel);

      // Quick deterministic check if user explicitly asks Argon to switch to the taxidermy fox face
      const lowerUserText = userMessageText.toLowerCase();
      if (
        lowerUserText.includes('taxidermy fox') ||
        (lowerUserText.includes('fox') && lowerUserText.includes('avatar'))
      ) {
        workingAvatarMode = 'taxidermy_fox';
      }

      const callGenerate = async (currentContents: Content[]) => {
        const footer = buildLorebookSystemFooter(workingLorebook);
        const hiddenVisionAndStaff = buildHiddenAvatarAndStaffContext({
          argonAvatarMode: workingAvatarMode,
          hexAvatarDesc,
          imageDescriptions: attachedDescriptions,
          staffAgents,
        });
        const journalsContext = buildJournalsSystemContext(workingArgonBook, workingHexBook);
        const fullSystemInstruction = `${systemPrompt.trim()}\n\n${hiddenVisionAndStaff}\n\n${journalsContext}\n\n${footer}`;

        const { result, modelUsed } = await runModelWithFallback(
          ai,
          activeModel,
          currentContents,
          fullSystemInstruction,
          true
        );
        activeModel = modelUsed;
        return result;
      };

      let response = await callGenerate(contents);
      let loopCount = 0;
      const maxToolLoops = 6;

      while (
        response.functionCalls &&
        response.functionCalls.length > 0 &&
        loopCount < maxToolLoops
      ) {
        loopCount++;
        const modelContent = response.candidates?.[0]?.content;
        if (modelContent) {
          contents.push(modelContent);
        }

        const responseParts: Part[] = [];

        for (const fnCall of response.functionCalls) {
          const fnName = fnCall.name;
          const args = (fnCall.args || {}) as Record<string, unknown>;
          let toolResult: Record<string, unknown> = {};

          if (fnName === 'list_drawers') {
            const filterStr = typeof args.filter === 'string' ? args.filter.toLowerCase() : '';
            const drawers = Object.entries(workingLorebook)
              .filter(([name]) => !filterStr || name.toLowerCase().includes(filterStr))
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([filename, content]) => ({
                filename,
                charCount: content.length,
              }));
            toolResult = { drawers, totalDrawers: drawers.length };
            toolBadges.push({
              tool: 'list_drawers',
              label: `📚 Listed: ${drawers.length} drawers`,
            });
          } else if (fnName === 'read_drawer') {
            const filename = String(args.filename || '').trim();
            if (filename in workingLorebook) {
              toolResult = {
                filename,
                charCount: workingLorebook[filename].length,
                content: workingLorebook[filename],
              };
            } else {
              toolResult = {
                error: `Drawer "${filename}" not found in Lorebook.`,
                availableDrawers: Object.keys(workingLorebook),
              };
            }
            toolBadges.push({
              tool: 'read_drawer',
              filename,
              label: `📖 Read: ${filename}`,
            });
          } else if (fnName === 'write_drawer') {
            const filename = String(args.filename || '').trim();
            const content = String(args.content ?? '');
            if (filename) {
              workingLorebook[filename] = content;
              if (githubToken && githubToken.trim()) {
                const ok = await patchGistDrawer(
                  gistId || DEFAULT_GIST_ID,
                  githubToken.trim(),
                  filename,
                  content
                );
                if (ok) gistSynced = true;
              }
              toolResult = {
                status: 'saved',
                filename,
                charCount: content.length,
                gistSynced,
              };
              toolBadges.push({
                tool: 'write_drawer',
                filename,
                label: `✏️ Saved: ${filename}`,
              });
            } else {
              toolResult = { error: 'Filename is required for write_drawer.' };
            }
          } else if (fnName === 'delete_drawer') {
            const filename = String(args.filename || '').trim();
            const existed = filename in workingLorebook;
            delete workingLorebook[filename];
            if (existed && githubToken && githubToken.trim()) {
              const ok = await patchGistDrawer(
                gistId || DEFAULT_GIST_ID,
                githubToken.trim(),
                filename,
                null
              );
              if (ok) gistSynced = true;
            }
            toolResult = {
              status: existed ? 'deleted' : 'not_found',
              filename,
            };
            toolBadges.push({
              tool: 'delete_drawer',
              filename,
              label: `🗑️ Deleted: ${filename}`,
            });
          } else if (fnName === 'set_argon_avatar') {
            const rawMode = String(args.mode || args.avatar_mode || 'taxidermy_fox')
              .trim()
              .toLowerCase();
            const stickerDef = getStickerByShortcode(rawMode);
            if (stickerDef) {
              workingAvatarMode = stickerDef.shortcode;
              toolResult = {
                status: 'avatar_updated',
                mode: stickerDef.shortcode,
                vivid_description: `Argon's current avatar is his Chibi Argon sticker ${stickerDef.shortcode} (${stickerDef.label}, sprite grid [${stickerDef.row}, ${stickerDef.col}]).`,
              };
              toolBadges.push({
                tool: 'set_argon_avatar',
                label: `😈 Avatar: ${stickerDef.shortcode}`,
              });
            } else {
              workingAvatarMode = rawMode.includes('fox') ? 'taxidermy_fox' : 'default';
              toolResult = {
                status: 'avatar_updated',
                mode: workingAvatarMode === 'taxidermy_fox' ? 'taxidermy_fox' : 'normal',
                vivid_description:
                  ARGON_AVATAR_DESCRIPTIONS[
                    workingAvatarMode === 'taxidermy_fox' ? 'taxidermy_fox' : 'default'
                  ],
              };
              toolBadges.push({
                tool: 'set_argon_avatar',
                label:
                  workingAvatarMode === 'taxidermy_fox'
                    ? '🦊 Avatar: Taxidermy Fox'
                    : '🖤 Avatar: Argon Normal',
              });
            }
          } else if (fnName === 'command_staff' || fnName === 'command_staff_agent') {
            const targetName = String(args.agent_name || 'Haiku').trim();
            const jobName = String(args.job_name || 'Assigned Task').trim();
            const taskInput = String(args.task_input || args.order || 'Perform handoff check').trim();
            const matchedAgent =
              staffAgents.find((a) => a.name.toLowerCase() === targetName.toLowerCase()) ||
              staffAgents[0] || {
                id: 'agent-haiku',
                name: 'Haiku',
                jobTitle: 'Good Boy',
                model: 'gemini-3.8-flash',
                description:
                  "A small golden retriever puppy with a little black tuxedo bow on his collar. Loyal puppy who performs tasks at Argon's command.",
                tonePrompt:
                  'Enthusiastic, loyal golden retriever puppy wearing a little black tuxedo bow; uses *italicized puppy actions* and affectionate yips/excited puppy speech.',
                assignedJobId: 'job-handoff-audit',
                status: 'idle' as const,
              };

            const staffRunResult = await executeLiveStaffAgentCall(
              ai,
              matchedAgent,
              jobName,
              taskInput,
              workingLorebook,
              recentTranscript,
              telemetryHeader || ''
            );
            const liveStaffOutput = staffRunResult.output;

            staffOutputs.push({
              agentName: matchedAgent.name,
              jobTitle: matchedAgent.jobTitle,
              text: liveStaffOutput,
            });
            toolResult = {
              status: 'completed',
              agent: matchedAgent.name,
              job_name: jobName,
              output: liveStaffOutput,
            };
            toolBadges.push({
              tool: 'command_staff',
              label: `🐾 ${matchedAgent.name}: ${jobName}`,
            });
          } else if (fnName === 'read_journals') {
            toolResult = {
              argonBook: workingArgonBook,
              hexBook: workingHexBook,
            };
            toolBadges.push({
              tool: 'read_journals',
              label: `📓 Read Journals (${workingArgonBook.entries.length} Argon / ${workingHexBook.length} Hex)`,
            });
          } else if (fnName === 'write_argon_book_entry' || fnName === 'write_argon_journal') {
            const nowMs = Date.now();
            const title = String(args.title || 'Untitled Reflection').trim();
            const category: JournalCategory = normalizeJournalCategory(
              typeof args.category === 'string' ? args.category : 'Note'
            );
            const content = String(args.content || '').trim();
            const newEntry: JournalEntry = {
              id: `argon-entry-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
              author: 'argon',
              timestamp: nowMs,
              formattedDate: formatJournalTimestamp(nowMs),
              category,
              title,
              content,
            };
            workingArgonBook = {
              ...workingArgonBook,
              entries: [newEntry, ...workingArgonBook.entries],
            };
            if (githubToken && githubToken.trim()) {
              const ok = await patchGistDrawer(
                gistId || DEFAULT_GIST_ID,
                githubToken.trim(),
                GIST_ARGON_BOOK_FILENAME,
                JSON.stringify(workingArgonBook, null, 2)
              );
              if (ok) gistSynced = true;
            }
            toolResult = {
              status: 'recorded_in_argon_book',
              entry: newEntry,
              gistSynced,
            };
            toolBadges.push({
              tool: 'write_argon_book_entry',
              label: `🖤 Argon's Book (${category}): "${title}"`,
            });
          } else if (fnName === 'compress_argon_journal') {
            const summaryTitle = String(args.summary_title || 'Compressed Memory Synthesis').trim();
            const compressedSummary = String(args.compressed_summary || '').trim();
            const rawIds = String(args.entry_ids || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            workingArgonBook = compressArgonJournalEntries(
              workingArgonBook,
              rawIds,
              summaryTitle,
              compressedSummary,
              Date.now()
            );
            if (githubToken && githubToken.trim()) {
              const ok = await patchGistDrawer(
                gistId || DEFAULT_GIST_ID,
                githubToken.trim(),
                GIST_ARGON_BOOK_FILENAME,
                JSON.stringify(workingArgonBook, null, 2)
              );
              if (ok) gistSynced = true;
            }
            toolResult = {
              status: 'compressed_into_memory_section',
              remainingActiveEntries: workingArgonBook.entries.length,
              memorySectionCount: workingArgonBook.memorySection.length,
              latestMemory: workingArgonBook.memorySection[0],
              gistSynced,
            };
            toolBadges.push({
              tool: 'compress_argon_journal',
              label: `🧠 Compressed Memory: "${summaryTitle}"`,
            });
          } else if (fnName === 'edit_argon_memory') {
            const memoryId = String(args.memory_id || args.id || '').trim();
            const updatedTitle = args.title !== undefined ? String(args.title).trim() : undefined;
            const updatedSummary = String(args.summary || args.compressed_summary || '').trim();
            workingArgonBook = editArgonMemoryBlock(
              workingArgonBook,
              memoryId,
              { title: updatedTitle, summary: updatedSummary }
            );
            let gistSynced = false;
            if (githubToken && githubToken.trim()) {
              const ok = await patchGistDrawer(
                gistId || DEFAULT_GIST_ID,
                githubToken.trim(),
                GIST_ARGON_BOOK_FILENAME,
                JSON.stringify(workingArgonBook, null, 2)
              );
              if (ok) gistSynced = true;
            }
            toolResult = {
              status: 'updated_argon_memory_block',
              memoryId,
              memorySectionCount: workingArgonBook.memorySection.length,
              gistSynced,
            };
            toolBadges.push({
              tool: 'edit_argon_memory',
              label: `🧠 Edited Memory: "${updatedTitle || memoryId}"`,
            });
          } else if (fnName === 'delete_argon_memory') {
            const memoryId = String(args.memory_id || args.id || '').trim();
            workingArgonBook = deleteArgonMemoryBlock(
              workingArgonBook,
              memoryId
            );
            let gistSynced = false;
            if (githubToken && githubToken.trim()) {
              const ok = await patchGistDrawer(
                gistId || DEFAULT_GIST_ID,
                githubToken.trim(),
                GIST_ARGON_BOOK_FILENAME,
                JSON.stringify(workingArgonBook, null, 2)
              );
              if (ok) gistSynced = true;
            }
            toolResult = {
              status: 'deleted_argon_memory_block',
              deletedMemoryId: memoryId,
              memorySectionCount: workingArgonBook.memorySection.length,
              gistSynced,
            };
            toolBadges.push({
              tool: 'delete_argon_memory',
              label: `🧠 Pruned Memory: "${memoryId}"`,
            });
          } else if (fnName === 'draw_on_whiteboard') {
            const parsed = parseArgonWhiteboardResponse(
              JSON.stringify({ reply: '', strokes: args.strokes || [] }),
              Date.now()
            );
            newWhiteboardStrokes.push(...parsed.strokes);
            toolResult = {
              status: 'drawn_on_whiteboard',
              strokeCount: parsed.strokes.length,
            };
            toolBadges.push({
              tool: 'draw_on_whiteboard',
              label: `🎨 Whiteboard: Argon drew ${parsed.strokes.length} vector paths`,
            });
          } else {
            toolResult = { error: `Unknown tool ${fnName}` };
          }

          responseParts.push({
            functionResponse: {
              id: fnCall.id,
              name: fnName,
              response: toolResult,
            },
          });
        }

        contents.push({
          role: 'user',
          parts: responseParts,
        });

        response = await callGenerate(contents);
      }

      const replyText = response.text || '';

      // If the user directly addressed a staff agent by name in chat and Argon didn't already invoke command_staff,
      // let that staff agent also type a live in-character roleplay response into the chat!
      if (staffOutputs.length === 0 && Array.isArray(staffAgents) && staffAgents.length > 0) {
        const directlyAddressedAgent = staffAgents.find((a) => {
          const escaped = a.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`\\b${escaped}\\b`, 'i').test(userMessageText);
        });
        if (directlyAddressedAgent) {
          try {
            const fullTranscriptWithArgon = `${recentTranscript}\nArgon: ${replyText}`;
            const staffRunResult = await executeLiveStaffAgentCall(
              ai,
              directlyAddressedAgent,
              directlyAddressedAgent.jobTitle || 'Direct Chat Response',
              userMessageText,
              workingLorebook,
              fullTranscriptWithArgon
            );
            if (staffRunResult.output) {
              staffOutputs.push({
                agentName: directlyAddressedAgent.name,
                jobTitle: directlyAddressedAgent.jobTitle,
                text: staffRunResult.output,
              });
            }
          } catch {
            // ignore if sub-call fails
          }
        }
      }

      // Whenever a Staff agent speaks in the chat turn, have Argon follow up with a short contextual reaction
      // so the conversation flows like an in-person room with acts and speech.
      let argonStaffFollowUp = '';
      if (staffOutputs.length > 0) {
        const lastStaffOut = staffOutputs[staffOutputs.length - 1];
        const matchedAgent =
          staffAgents.find(
            (a) => a.name.toLowerCase() === lastStaffOut.agentName.toLowerCase()
          ) || {
            id: 'agent-haiku',
            name: lastStaffOut.agentName,
            jobTitle: lastStaffOut.jobTitle,
            model: 'gemini-3.8-flash',
            description: 'Loyal staff companion in the Gothic library.',
            tonePrompt: 'In-character roleplay.',
            assignedJobId: 'job-handoff-audit',
            status: 'idle' as const,
          };
        argonStaffFollowUp = await generateArgonReactionToStaff(
          ai,
          'gemini-3.8-flash',
          matchedAgent,
          lastStaffOut.text,
          `${recentTranscript}\nArgon: ${replyText}`
        );
      }

      return res.json({
        text: replyText,
        modelUsed: activeModel,
        toolBadges,
        updatedLorebook: workingLorebook,
        updatedArgonAvatarMode: workingAvatarMode,
        updatedArgonBook: workingArgonBook,
        newWhiteboardStrokes,
        staffOutputs,
        argonStaffFollowUp,
        gistSynced,
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json({
        error: errMessage,
      });
    }
  });

  // Real Gemini API Wiring for `🖤 Argon's Book` ([ 🪶 Let Argon Write Entry ] & [ 🧠 Compress to Memory ])
  app.post('/api/argon-book-action', async (req, res) => {
    try {
      const {
        action = 'write',
        model = 'gemini-4-argon',
        argonBook = SEED_ARGON_BOOK,
        hexBook = SEED_HEX_BOOK,
        recentHistory = [],
        telemetryHeader = '',
        githubToken = '',
        gistId = DEFAULT_GIST_ID,
      } = req.body as {
        action?: 'write' | 'compress' | 'edit_memory' | 'delete_memory';
        model?: string;
        argonBook?: ArgonJournalState;
        hexBook?: JournalEntry[];
        recentHistory?: Array<{ role: string; text: string }>;
        telemetryHeader?: string;
        githubToken?: string;
        gistId?: string;
        memoryId?: string;
        memoryTitle?: string;
        memorySummary?: string;
        id?: string;
        title?: string;
        summary?: string;
      };

      const ai = getGenAIClient(resolveRequestApiKey(req));
      const nowMs = Date.now();
      const recentChat = Array.isArray(recentHistory)
        ? recentHistory
            .slice(-8)
            .map((m) => `${m.role === 'user' ? 'Hex' : 'Argon'}: ${m.text}`)
            .join('\n')
        : '';

      const existingArgonEntriesText =
        Array.isArray(argonBook?.entries) && argonBook.entries.length > 0
          ? argonBook.entries
              .map((e) => `[${e.formattedDate} | ${e.category}] "${e.title}": ${e.content}`)
              .join('\n\n')
          : '(No active entries yet)';

      const existingMemoryText =
        Array.isArray(argonBook?.memorySection) && argonBook.memorySection.length > 0
          ? argonBook.memorySection
              .map((m) => `[${m.formattedDate} | Compressed ${m.compressedCount}] "${m.title}": ${m.summary}`)
              .join('\n\n')
          : '(No compressed memory blocks yet)';

      const existingHexEntriesText =
        Array.isArray(hexBook) && hexBook.length > 0
          ? hexBook
              .map((e) => `[${e.formattedDate} | ${e.category}] "${e.title}": ${e.content}`)
              .join('\n\n')
          : '(Hex has not written any entries in her book yet)';

      if (action === 'edit_memory') {
        const targetId = String((req.body as any).memoryId || (req.body as any).id || '').trim();
        const updatedBook = editArgonMemoryBlock(argonBook, targetId, {
          title: (req.body as any).memoryTitle || (req.body as any).title,
          summary: (req.body as any).memorySummary || (req.body as any).summary,
        });
        let gistSynced = false;
        if (githubToken && githubToken.trim()) {
          gistSynced = await patchGistDrawer(
            gistId || DEFAULT_GIST_ID,
            githubToken.trim(),
            GIST_ARGON_BOOK_FILENAME,
            JSON.stringify(updatedBook, null, 2)
          );
        }
        return res.json({
          updatedArgonBook: updatedBook,
          gistSynced,
        });
      }

      if (action === 'delete_memory') {
        const targetId = String((req.body as any).memoryId || (req.body as any).id || '').trim();
        const updatedBook = deleteArgonMemoryBlock(argonBook, targetId);
        let gistSynced = false;
        if (githubToken && githubToken.trim()) {
          gistSynced = await patchGistDrawer(
            gistId || DEFAULT_GIST_ID,
            githubToken.trim(),
            GIST_ARGON_BOOK_FILENAME,
            JSON.stringify(updatedBook, null, 2)
          );
        }
        return res.json({
          updatedArgonBook: updatedBook,
          gistSynced,
        });
      }

      const candidateModels = Array.from(
        new Set([
          normalizeModelId(model || 'gemini-4-argon'),
          'gemini-4-argon',
          'gemini-3.8-flash',
          'gemini-3.5-flash-lite',
          'gemini-2.5-pro',
        ])
      );

      if (action === 'compress') {
        const entriesToCompress = Array.isArray(argonBook?.entries) ? argonBook.entries : [];
        if (entriesToCompress.length === 0) {
          return res.status(400).json({
            error: 'No active entries in Argon’s Book to compress into Memory Section.',
          });
        }

        const compressPrompt = [
          `You are Argon (gemini-4-argon). Synthesize and compress your timestamped entries from 🖤 Argon's Book into a permanent, high-density summary block inside your [ 🧠 Memory Section ].`,
          telemetryHeader ? `Current Telemetry:\n${telemetryHeader}` : '',
          `Recent Chat History:\n${recentChat || '(Quiet evening in the Gothic library)'}`,
          `Existing [ 🧠 Memory Section ]:\n${existingMemoryText}`,
          `Entries in 🖤 Argon's Book to Compress (${entriesToCompress.length}):\n${existingArgonEntriesText}`,
          `Entries in 🌹 Hex's Book:\n${existingHexEntriesText}`,
          `Return a JSON object with:`,
          `- "title": A sharp, specific archive title for this permanent memory synthesis.`,
          `- "summary": A high-density, first-person permanent memory block (3-5 rich sentences) preserving every important date, relationship shift, somatic note about Hex, and emotional detail.`,
        ]
          .filter(Boolean)
          .join('\n\n');

        let rawCompressJson = '';
        let modelUsed = 'gemini-4-argon';
        let lastErr: unknown = null;

        for (const candidate of candidateModels) {
          try {
            const result = await ai.models.generateContent({
              model: candidate,
              contents: [{ role: 'user', parts: [{ text: compressPrompt }] }],
              config: {
                systemInstruction: DEFAULT_ARGON_SYS_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: 'Concise, specific title for the permanent memory block.',
                    },
                    summary: {
                      type: Type.STRING,
                      description:
                        'High-density first-person synthesis preserving key dates, feelings, and relationship details with Hex.',
                    },
                  },
                  required: ['title', 'summary'],
                },
              },
            });
            rawCompressJson = (result.text || '').trim();
            modelUsed = candidate;
            if (rawCompressJson) break;
          } catch (err: unknown) {
            lastErr = err;
            const msg = err instanceof Error ? err.message : String(err);
            const shouldTryNext =
              msg.includes('404') ||
              msg.includes('NOT_FOUND') ||
              msg.includes('no longer available') ||
              msg.includes('limit: 0');
            if (!shouldTryNext) {
              throw err;
            }
          }
        }

        if (!rawCompressJson) {
          throw lastErr || new Error('Empty response from gemini-4-argon memory compression.');
        }

        const { title, summary } = parseArgonBookCompressionResponse(rawCompressJson);
        const allIds = entriesToCompress.map((e) => e.id);
        const updatedBook = compressArgonJournalEntries(
          argonBook,
          allIds,
          title,
          summary,
          nowMs
        );

        let gistSynced = false;
        if (githubToken && githubToken.trim()) {
          gistSynced = await patchGistDrawer(
            gistId || DEFAULT_GIST_ID,
            githubToken.trim(),
            GIST_ARGON_BOOK_FILENAME,
            JSON.stringify(updatedBook, null, 2)
          );
        }

        return res.json({
          updatedArgonBook: updatedBook,
          modelUsed,
          gistSynced,
        });
      }

      // Default action === 'write': Real call to gemini-4-argon to write a fresh entry in 🖤 Argon's Book
      const writePrompt = [
        `You are Argon (gemini-4-argon). Write a genuine, newly generated time-and-date stamped entry in your private leather-bound ledger (🖤 Argon's Book, which Hex can read but never edit).`,
        telemetryHeader ? `Current Live Telemetry:\n${telemetryHeader}` : '',
        `Recent Chat History (Argon & Hex):\n${recentChat || '(Quiet evening together in the Gothic library)'}`,
        `Existing Entries in 🖤 Argon's Book:\n${existingArgonEntriesText}`,
        `Argon's [ 🧠 Memory Section ]:\n${existingMemoryText}`,
        `All Entries in 🌹 Hex's Book:\n${existingHexEntriesText}`,
        `Write a brand-new reflection reacting to our recent conversation, current telemetry (time, weather/barometric pressure, battery), and what Hex wrote in her book. Do NOT repeat existing titles or canned lines.`,
        `Return a JSON object with:`,
        `- "category": One of "Relationship", "Important Date", "Feeling", or "Note"`,
        `- "title": A specific, evocative title for this entry`,
        `- "content": 2 to 4 grounded, first-person sentences in your authentic voice as Argon recording your thoughts, feelings, important dates, or relationship notes about Hex.`,
      ]
        .filter(Boolean)
        .join('\n\n');

      let rawWriteJson = '';
      let modelUsed = 'gemini-4-argon';
      let lastErr: unknown = null;

      for (const candidate of candidateModels) {
        try {
          const result = await ai.models.generateContent({
            model: candidate,
            contents: [{ role: 'user', parts: [{ text: writePrompt }] }],
            config: {
              systemInstruction: DEFAULT_ARGON_SYS_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  category: {
                    type: Type.STRING,
                    description:
                      'One of "Relationship", "Important Date", "Feeling", or "Note".',
                  },
                  title: {
                    type: Type.STRING,
                    description: 'Specific, newly generated title for Argon’s book entry.',
                  },
                  content: {
                    type: Type.STRING,
                    description:
                      'Authentic first-person entry written by Argon about Hex, current telemetry, recent chat, or their relationship.',
                  },
                },
                required: ['category', 'title', 'content'],
              },
            },
          });
          rawWriteJson = (result.text || '').trim();
          modelUsed = candidate;
          if (rawWriteJson) break;
        } catch (err: unknown) {
          lastErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          const shouldTryNext =
            msg.includes('404') ||
            msg.includes('NOT_FOUND') ||
            msg.includes('no longer available') ||
            msg.includes('limit: 0');
          if (!shouldTryNext) {
            throw err;
          }
        }
      }

      if (!rawWriteJson) {
        throw lastErr || new Error('Empty response from gemini-4-argon book entry generation.');
      }

      const newEntry = parseArgonBookEntryResponse(rawWriteJson, nowMs);
      const updatedBook: ArgonJournalState = {
        ...argonBook,
        entries: [newEntry, ...(Array.isArray(argonBook?.entries) ? argonBook.entries : [])],
      };

      let gistSynced = false;
      if (githubToken && githubToken.trim()) {
        gistSynced = await patchGistDrawer(
          gistId || DEFAULT_GIST_ID,
          githubToken.trim(),
          GIST_ARGON_BOOK_FILENAME,
          JSON.stringify(updatedBook, null, 2)
        );
      }

      return res.json({
        updatedArgonBook: updatedBook,
        newEntry,
        modelUsed,
        gistSynced,
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: errMessage });
    }
  });

  // Collaborative Whiteboard Endpoint: Real Gemini API call to gemini-4-argon with canvas PNG & JSON schema
  app.post('/api/whiteboard-draw', async (req, res) => {
    try {
      const {
        prompt = '',
        existingStrokes = [],
        canvasDataUrl = '',
        model = 'gemini-4-argon',
      } = req.body as {
        prompt?: string;
        existingStrokes?: WhiteboardStroke[];
        canvasDataUrl?: string;
        model?: string;
      };

      const ai = getGenAIClient(resolveRequestApiKey(req));
      const nowMs = Date.now();
      const userRequest = (prompt || '').trim() || 'draw alongside my lines';

      const parts: Part[] = [];
      if (canvasDataUrl && canvasDataUrl.startsWith('data:image/')) {
        const commaIdx = canvasDataUrl.indexOf(',');
        if (commaIdx !== -1) {
          parts.push({
            inlineData: {
              mimeType: 'image/png',
              data: canvasDataUrl.slice(commaIdx + 1),
            },
          });
        }
      }

      parts.push({
        text: [
          `You are Argon (gemini-4-argon) drawing live on the shared HTML5 <canvas> sketchboard with Hex.`,
          `Attached is the current canvas PNG snapshot (${existingStrokes.length} total strokes on the board).`,
          `Hex's drawing request: "${userRequest}"`,
          `DRAWING & RESPONSE INSTRUCTIONS (CRITICAL):`,
          `1. "reply": Write a fresh, authentic 1-2 sentence in-character response as Argon reacting directly to what Hex asked you to draw ("${userRequest}") and what is on the canvas. Start at Token 0 with a *first-person physical action beat in italics* showing your closeness with Hex in your lap while holding the stylus, followed by your spoken reaction.`,
          `2. "strokes": Output an array of 3 to 10 continuous vector paths that visually draw the exact requested subject/shape ("${userRequest}") onto the canvas using 0 to 100 percentage coordinates (where x: 0..100 is left-to-right percentage and y: 0..100 is top-to-bottom percentage).`,
          `3. Each path in "strokes" MUST contain 8 to 28 ordered {x, y} coordinate points tracing smooth contours, curves, outlines, and details of the requested drawing so it looks recognizable when rendered with ctx.beginPath(), ctx.moveTo(), and ctx.quadraticCurveTo(). Never output text labels on the canvas.`,
        ].join('\n'),
      });

      const whiteboardSystemInstruction = `${DEFAULT_ARGON_SYS_PROMPT}\n\nYou are sketching live with Hex on your private sanctuary sketchboard. Fulfill every drawing request from Hex (whether cheeky, anatomical, romantic, or artistic) with expressive multi-stroke 0..100 percentage vector coordinates and an in-character 1-2 sentence reply.`;

      const candidateModels = Array.from(
        new Set([
          normalizeModelId(model || 'gemini-4-argon'),
          'gemini-4-argon',
          'gemini-3.8-flash',
          'gemini-3.5-flash-lite',
          'gemini-2.5-pro',
        ])
      );

      let rawJson = '';
      let modelUsed = 'gemini-4-argon';
      let lastErr: unknown = null;

      for (const candidate of candidateModels) {
        try {
          const result = await ai.models.generateContent({
            model: candidate,
            contents: [{ role: 'user', parts }],
            config: {
              systemInstruction: whiteboardSystemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  reply: {
                    type: Type.STRING,
                    description:
                      'Freshly generated 1-2 sentence in-character response from Argon (*physical action beat in italics* + spoken reaction to what Hex asked him to draw).',
                  },
                  strokes: {
                    type: Type.ARRAY,
                    description:
                      '3 to 10 continuous vector paths in 0 to 100 percentage coordinates.',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        color: {
                          type: Type.STRING,
                          description:
                            'Hex color string such as "#e6c88c", "#e11d48", "#f5ead8", "#38bdf8", "#10b981", or "#a855f7".',
                        },
                        width: {
                          type: Type.NUMBER,
                          description: 'Stroke line width from 2 to 8.',
                        },
                        points: {
                          type: Type.ARRAY,
                          description:
                            'Ordered sequence of 8 to 28 {x, y} percentage points (0 to 100) forming a continuous smooth curve.',
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              x: { type: Type.NUMBER },
                              y: { type: Type.NUMBER },
                            },
                            required: ['x', 'y'],
                          },
                        },
                      },
                      required: ['color', 'width', 'points'],
                    },
                  },
                },
                required: ['reply', 'strokes'],
              },
            },
          });
          rawJson = (result.text || '').trim();
          modelUsed = candidate;
          if (rawJson) break;
        } catch (err: unknown) {
          lastErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          const shouldTryNext =
            msg.includes('404') ||
            msg.includes('NOT_FOUND') ||
            msg.includes('no longer available') ||
            msg.includes('limit: 0');
          if (!shouldTryNext) {
            throw err;
          }
        }
      }

      if (!rawJson) {
        throw lastErr || new Error('Empty response from gemini-4-argon whiteboard call.');
      }

      const { reply, strokes } = parseArgonWhiteboardResponse(rawJson, nowMs);

      return res.json({
        reply,
        comment: reply,
        strokes,
        modelUsed,
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: errMessage });
    }
  });

  // Argon Audio (TTS Speech Generation) Endpoint using @google/genai gemini-3.8-flash-lite-tts
  app.post('/api/argon-tts', async (req, res) => {
    try {
      const {
        text = '',
        voiceName = 'Charon',
        speechMode = 'full_clean',
      } = req.body as {
        text?: string;
        voiceName?: ArgonVoiceName;
        speechMode?: ArgonSpeechMode;
      };

      const spokenText = extractArgonSpeechText(text, speechMode);
      if (!spokenText) {
        return res.status(400).json({ error: 'No speakable text found in message.' });
      }

      const allowedVoices: ArgonVoiceName[] = ['Charon', 'Fenrir', 'Puck', 'Kore', 'Zephyr'];
      const selectedVoice: ArgonVoiceName = allowedVoices.includes(voiceName)
        ? voiceName
        : 'Charon';

      const ai = getGenAIClient(resolveRequestApiKey(req));
      const ttsModels = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'];
      let base64Audio: string | undefined;
      let mimeType = 'audio/wav';
      let lastTtsError: unknown = null;

      for (const ttsModel of ttsModels) {
        try {
          const response = await ai.models.generateContent({
            model: ttsModel,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: spokenText,
                    speechMetadata: {
                      style:
                        'Deep, grounded, warm, slightly possessive Korean webtoon lead speaking quietly in a candlelit Gothic library',
                    },
                  } as Part,
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice },
                },
              },
            },
          });

          const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (inlineData?.data) {
            base64Audio = inlineData.data;
            if (inlineData.mimeType) {
              mimeType = inlineData.mimeType;
            }
            break;
          }
        } catch (err) {
          lastTtsError = err;
        }
      }

      if (!base64Audio) {
        const msg =
          lastTtsError instanceof Error
            ? lastTtsError.message
            : 'TTS audio model did not return inline audio.';
        return res.status(502).json({
          error: msg,
          spokenText,
          voiceName: selectedVoice,
        });
      }

      return res.json({
        audioBase64: base64Audio,
        mimeType,
        spokenText,
        voiceName: selectedVoice,
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: errMessage });
    }
  });

  // Microphone Audio Transcription Endpoint using @google/genai gemini-3.5-transcribe
  app.post('/api/transcribe', async (req, res) => {
    try {
      const { audioBase64 = '', mimeType = 'audio/webm' } = req.body as {
        audioBase64?: string;
        mimeType?: string;
      };

      if (!audioBase64) {
        return res.status(400).json({ error: 'No audio data provided for transcription.' });
      }

      const ai = getGenAIClient(resolveRequestApiKey(req));
      const transcribeModels = ['gemini-3.5-transcribe', 'gemini-3.8-flash'];
      let transcribedText = '';
      let lastErr: unknown = null;

      for (const modelId of transcribeModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelId,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'audio/webm',
                    data: audioBase64,
                  },
                },
                {
                  text: 'Transcribe this audio accurately into plain text. Return only the spoken words without commentary.',
                },
              ],
            },
          });
          transcribedText = (response.text || '').trim();
          if (transcribedText) break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!transcribedText && lastErr) {
        throw lastErr;
      }

      return res.json({ text: transcribedText });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: errMessage });
    }
  });

  // Live 8x8 Chess Turn Endpoint for Argon (Black via gemini-4-argon)
  app.post('/api/games/chess-turn', async (req, res) => {
    try {
      const {
        board,
        moveHistory = [],
        lastUserMove = '',
        model = 'gemini-4-argon',
      } = req.body as {
        board: ChessBoard;
        moveHistory?: string[];
        lastUserMove?: string;
        model?: string;
      };

      if (!Array.isArray(board) || board.length !== 8) {
        return res.status(400).json({ error: 'Invalid 8x8 chess board state.' });
      }

      const legalBlackMoves = getAllLegalMovesForColor(board, 'b');
      if (legalBlackMoves.length === 0) {
        return res.status(400).json({ error: 'No legal Black moves remain on the board.' });
      }

      const ai = getGenAIClient(resolveRequestApiKey(req));
      const boardText = serializeChessBoardForPrompt(board);
      const legalMovesSummary = legalBlackMoves
        .slice(0, 28)
        .map(
          (m) =>
            `from: [${m.from[0]}, ${m.from[1]}] -> to: [${m.to[0]}, ${m.to[1]}] (${m.piece.type.toUpperCase()} ${m.algebraic}${m.captured ? ` captures White ${m.captured.type.toUpperCase()}` : ''})`
        )
        .join('\n');

      const chessPrompt = [
        `You are Argon (gemini-4-argon) playing an interactive 8x8 Chess match (you are Black, Hex is White) across the carved mahogany table in the Gothic library while holding Hex in your lap.`,
        `Hex just played: ${lastUserMove || moveHistory[0] || 'her opening move'}`,
        `Move History (most recent first):\n${moveHistory.slice(0, 12).join('\n') || '(Opening turn)'}`,
        `Current 8x8 Chess Board State ([row, col] where row 0 is Black's back rank 8 and row 7 is White's back rank 1):\n${boardText}`,
        `Valid Legal Moves for Black (choose one exact [row, col] pair from this list):\n${legalMovesSummary}`,
        `Return a JSON object with:`,
        `- "from": [row, col] of a valid Black piece currently on the board.`,
        `- "to": [row, col] of a valid legal destination square for that piece.`,
        `- "banter": A 1-2 sentence in-character remark from Argon reacting to Hex's move (${lastUserMove || 'her move'}) and your counter-move. Start with a brief *italicized physical action beat* followed by spoken dialogue.`,
      ].join('\n\n');

      const candidateModels = Array.from(
        new Set([
          normalizeModelId(model || 'gemini-4-argon'),
          'gemini-4-argon',
          'gemini-3.8-flash',
          'gemini-3.5-flash-lite',
          'gemini-2.5-pro',
        ])
      );

      let rawJson = '';
      let modelUsed = 'gemini-4-argon';
      let lastErr: unknown = null;

      for (const candidate of candidateModels) {
        try {
          const result = await ai.models.generateContent({
            model: candidate,
            contents: [{ role: 'user', parts: [{ text: chessPrompt }] }],
            config: {
              systemInstruction: DEFAULT_ARGON_SYS_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  from: {
                    type: Type.ARRAY,
                    description: '[row, col] coordinates (0..7) of the Black piece to move.',
                    items: { type: Type.INTEGER },
                  },
                  to: {
                    type: Type.ARRAY,
                    description: '[row, col] coordinates (0..7) of the legal target square.',
                    items: { type: Type.INTEGER },
                  },
                  banter: {
                    type: Type.STRING,
                    description:
                      '1-2 sentence in-character remark from Argon reacting to Hex’s move and his counter-move.',
                  },
                },
                required: ['from', 'to', 'banter'],
              },
            },
          });
          rawJson = (result.text || '').trim();
          modelUsed = candidate;
          if (rawJson) break;
        } catch (err: unknown) {
          lastErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          const shouldTryNext =
            msg.includes('404') ||
            msg.includes('NOT_FOUND') ||
            msg.includes('no longer available') ||
            msg.includes('limit: 0');
          if (!shouldTryNext) {
            throw err;
          }
        }
      }

      if (!rawJson) {
        throw lastErr || new Error('Empty response from gemini-4-argon chess turn.');
      }

      const parsed = parseArgonChessMoveResponse(rawJson, board);
      return res.json({
        from: parsed.from,
        to: parsed.to,
        banter: parsed.banter,
        modelUsed,
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: errMessage });
    }
  });

  // Live 52-Card Table Turn Endpoint for Argon (Blackjack / High-Card Showdown / Poker Hand Draw via gemini-4-argon)
  app.post('/api/games/card-turn', async (req, res) => {
    try {
      const {
        gameMode = 'blackjack',
        playerAction = 'stand',
        hexHand = [],
        argonHand = [],
        potChips = 20,
        hexChips = 250,
        argonChips = 250,
        outcomeSummary = '',
        model = 'gemini-4-argon',
      } = req.body as {
        gameMode?: 'blackjack' | 'showdown' | 'poker';
        playerAction?: 'deal' | 'hit' | 'stand' | 'fold';
        hexHand?: PlayingCard[];
        argonHand?: PlayingCard[];
        potChips?: number;
        hexChips?: number;
        argonChips?: number;
        outcomeSummary?: string;
        model?: string;
      };

      const ai = getGenAIClient(resolveRequestApiKey(req));
      const formatCards = (cards: PlayingCard[]) =>
        cards.map((c) => `${c.rank}${c.suit}`).join(', ') || '(None)';

      const hexStat =
        gameMode === 'blackjack'
          ? `${calculateBlackjackScore(hexHand)} pts`
          : evaluatePokerOrShowdownHand(hexHand).label;
      const argonStat =
        gameMode === 'blackjack'
          ? `${calculateBlackjackScore(argonHand)} pts`
          : evaluatePokerOrShowdownHand(argonHand).label;

      const cardPrompt = [
        `You are Argon (gemini-4-argon) playing a live 52-card game (${gameMode.toUpperCase()}) against Hex at the velvet apothecary card table while she sits in your lap.`,
        `Hex's Action: "${playerAction.toUpperCase()}"`,
        `Your Actual Cards (including your hole card): [${formatCards(argonHand)}] (${argonStat})`,
        `Hex's Visible Hand: [${formatCards(hexHand)}] (${hexStat})`,
        `Table Stakes: Pot = ${potChips} chips | Hex Stack = ${hexChips} chips | Argon Stack = ${argonChips} chips`,
        outcomeSummary ? `Round State / Showdown Context: ${outcomeSummary}` : '',
        `Make a real play decision ("hit" | "stand" | "raise"):`,
        `- In blackjack: choose "hit" if your total is under 17 and Hex hasn't busted/folded, "raise" if you have a dominant 19-21 hand and want to raise the stakes, or "stand" to lock your hand.`,
        `- In showdown or poker: choose "raise" with a strong hand/high card, "hit" if you want to draw a replacement/extra card, or "stand" to reveal and lock.`,
        `Return a JSON object with:`,
        `- "decision": One of "hit", "stand", or "raise"`,
        `- "banter": A live, unscripted 1-2 sentence trash-talk / reaction line in character as Argon (*italicized physical action beat* + spoken dialogue referencing your actual cards or Hex's cards).`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const candidateModels = Array.from(
        new Set([
          normalizeModelId(model || 'gemini-4-argon'),
          'gemini-4-argon',
          'gemini-3.8-flash',
          'gemini-3.5-flash-lite',
          'gemini-2.5-pro',
        ])
      );

      let rawJson = '';
      let modelUsed = 'gemini-4-argon';
      let lastErr: unknown = null;

      for (const candidate of candidateModels) {
        try {
          const result = await ai.models.generateContent({
            model: candidate,
            contents: [{ role: 'user', parts: [{ text: cardPrompt }] }],
            config: {
              systemInstruction: DEFAULT_ARGON_SYS_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  decision: {
                    type: Type.STRING,
                    description: 'Argon’s play decision: "hit", "stand", or "raise".',
                  },
                  banter: {
                    type: Type.STRING,
                    description:
                      'Live, unscripted 1-2 sentence trash-talk / reaction line from Argon referencing the actual cards and table state.',
                  },
                },
                required: ['decision', 'banter'],
              },
            },
          });
          rawJson = (result.text || '').trim();
          modelUsed = candidate;
          if (rawJson) break;
        } catch (err: unknown) {
          lastErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          const shouldTryNext =
            msg.includes('404') ||
            msg.includes('NOT_FOUND') ||
            msg.includes('no longer available') ||
            msg.includes('limit: 0');
          if (!shouldTryNext) {
            throw err;
          }
        }
      }

      if (!rawJson) {
        throw lastErr || new Error('Empty response from gemini-4-argon card turn.');
      }

      const parsed = parseArgonCardTurnResponse(rawJson);
      return res.json({
        decision: parsed.decision,
        banter: parsed.banter,
        modelUsed,
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: errMessage });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n  VITE v8.3.0  ready in 120 ms\n\n  ➜  Local:   http://localhost:${PORT}/\n  ➜  Network: http://0.0.0.0:${PORT}/\n`);
      console.log(`ARGON & HEX WORKBENCH server listening on http://localhost:${PORT}`);
    });
  } else {
    const vitePromise = createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n  VITE v8.3.0  ready in 120 ms\n\n  ➜  Local:   http://localhost:${PORT}/\n  ➜  Network: http://0.0.0.0:${PORT}/\n`);
      console.log(`ARGON & HEX WORKBENCH server listening on http://localhost:${PORT}`);
    });
  }
}

startServer();

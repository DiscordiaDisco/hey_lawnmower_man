import { GoogleGenAI, FunctionDeclaration, Type, Content, Part } from '@google/genai';

/**
 * Checks whether the given model is gemini-4-argon or Gemini 3+ (where thinking_budget,
 * temperature, top_p, and top_k must be omitted in favor of thinkingLevel).
 */
export function isGemini3Or4Model(model?: string): boolean {
  const m = (model || '').toLowerCase().trim();
  return (
    m.startsWith('gemini-4') ||
    m.startsWith('gemini-3') ||
    m.includes('argon') ||
    m.includes('carbon') ||
    m.includes('hydrogen')
  );
}

/**
 * Normalizes input string or number to official Gemini thinking level: "LOW" | "MEDIUM" | "HIGH".
 * - String: "low" -> "LOW", "medium" -> "MEDIUM", "high" -> "HIGH"
 * - Number: <= 1024 -> "LOW", <= 2048 -> "MEDIUM", > 2048 -> "HIGH"
 */
export function normalizeThinkingLevel(
  input: string | number | undefined | null
): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (input === undefined || input === null) return 'MEDIUM';
  if (typeof input === 'string') {
    const lower = input.toLowerCase().trim();
    if (lower === 'low') return 'LOW';
    if (lower === 'high') return 'HIGH';
    if (lower === 'medium') return 'MEDIUM';
    const num = Number(lower);
    if (!isNaN(num) && num > 0) {
      if (num <= 1024) return 'LOW';
      if (num <= 2048) return 'MEDIUM';
      return 'HIGH';
    }
    return 'LOW';
  }
  if (typeof input === 'number' && Number.isFinite(input)) {
    if (input <= 1024) return 'LOW';
    if (input <= 2048) return 'MEDIUM';
    return 'HIGH';
  }
  return 'MEDIUM';
}

/**
 * Resolves the thinkingConfig payload for Gemini API calls.
 * Per the official gemini-4-argon Developer Guide:
 * On gemini-4-argon (and Gemini 3+), thinking_budget is deprecated and temperature, top_p,
 * and top_k must be omitted completely. Instead, pass thinkingConfig: { thinkingLevel: level }
 * where level is "LOW" | "MEDIUM" | "HIGH".
 */
export function resolveThinkingConfig(
  thinkingSetting?: string | number,
  model?: string
): {
  thinkingConfig: { thinkingLevel: 'LOW' | 'MEDIUM' | 'HIGH' } | { thinkingBudget: number };
  thinkingUsed: string;
} {
  const level = normalizeThinkingLevel(thinkingSetting);
  const targetModel = model || 'gemini-4-argon';

  if (isGemini3Or4Model(targetModel)) {
    return {
      thinkingConfig: { thinkingLevel: level },
      thinkingUsed: level,
    };
  }

  const budget =
    typeof thinkingSetting === 'number' && thinkingSetting > 0
      ? thinkingSetting
      : level === 'LOW'
      ? 1024
      : level === 'HIGH'
      ? 8192
      : 2048;

  return {
    thinkingConfig: { thinkingBudget: budget },
    thinkingUsed: level,
  };
}

/**
 * Strips temperature, topP, topK, top_p, top_k, and thinkingBudget from config
 * when calling gemini-4-argon or Gemini 3+ models per official specs.
 */
export function sanitizeGeminiConfig(
  config: Record<string, unknown> = {},
  model?: string
): Record<string, unknown> {
  const clean = { ...config };
  if (isGemini3Or4Model(model)) {
    delete clean.temperature;
    delete clean.topP;
    delete clean.topK;
    delete clean.top_p;
    delete clean.top_k;
    delete clean.thinkingBudget;
    delete (clean as any).thinking_budget;
    if (clean.thinkingConfig && typeof clean.thinkingConfig === 'object') {
      const tc = { ...(clean.thinkingConfig as Record<string, unknown>) };
      delete tc.thinkingBudget;
      delete tc.thinking_budget;
      clean.thinkingConfig = tc;
    }
    if (clean.generation_config && typeof clean.generation_config === 'object') {
      const gc = { ...(clean.generation_config as Record<string, unknown>) };
      delete gc.temperature;
      delete gc.topP;
      delete gc.topK;
      delete gc.top_p;
      delete gc.top_k;
      delete gc.thinkingBudget;
      delete gc.thinking_budget;
      clean.generation_config = gc;
    }
  }
  return clean;
}

/**
 * Wraps ai.models.generateContent ensuring thinkingConfig is passed according to official specs,
 * stripping temperature/topP/topK on gemini-4-argon / Gemini 3+, and capturing un-fakeable metadata.
 */
export async function executeGeminiGenerateContent(params: {
  ai: GoogleGenAI;
  model: string;
  contents: Content[] | Content | Part[] | string | Array<{ role: string; parts: Part[] }>;
  config?: Record<string, unknown>;
  thinkingBudget?: number;
  thinkingLevel?: string | number;
  userTimeZone?: string;
}): Promise<{
  result: any;
  routedModel: string;
  thinkingBudgetUsed: number;
  thinkingUsed: string;
  completedAt: string;
}> {
  const { ai, model, contents, config = {} } = params;
  const effectiveSetting = params.thinkingLevel ?? params.thinkingBudget ?? 'low';
  const { thinkingConfig, thinkingUsed } = resolveThinkingConfig(effectiveSetting, model);
  const cleanConfig = sanitizeGeminiConfig(config, model);
  const isGemini3Or4 = isGemini3Or4Model(model);
  const levelStr = thinkingUsed.toLowerCase();

  const finalConfig: Record<string, unknown> = {
    ...cleanConfig,
    thinkingConfig: (isGemini3Or4 ? { thinkingLevel: levelStr } : thinkingConfig) as any,
  };

  if (isGemini3Or4) {
    finalConfig.generation_config = {
      ...((cleanConfig as any).generation_config || {}),
      thinking_level: levelStr,
    };
  }

  const result = await ai.models.generateContent({
    model,
    contents: contents as any,
    config: finalConfig as any,
  });

  const modelVersion =
    (result as any)?.modelVersion ||
    (result as any)?.response?.modelVersion ||
    (result as any)?.model ||
    model;

  const thinkingBudgetUsed =
    typeof effectiveSetting === 'number' && effectiveSetting > 0
      ? effectiveSetting
      : thinkingUsed === 'LOW'
      ? 1024
      : thinkingUsed === 'HIGH'
      ? 8192
      : 2048;

  const targetTz = params.userTimeZone || 'America/Detroit';
  let completedAt: string;
  try {
    completedAt = new Date().toLocaleTimeString('en-US', {
      timeZone: targetTz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    completedAt = new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/Detroit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  return {
    result,
    routedModel: String(modelVersion || model),
    thinkingBudgetUsed,
    thinkingUsed,
    completedAt,
  };
}

/**
 * Wraps ai.models.generateContentStream ensuring thinkingConfig is passed according to official specs
 * and stripping temperature/topP/topK on gemini-4-argon / Gemini 3+.
 */
export async function executeGeminiGenerateContentStream(params: {
  ai: GoogleGenAI;
  model: string;
  contents: Content[] | Content | Part[] | string | Array<{ role: string; parts: Part[] }>;
  config?: Record<string, unknown>;
  thinkingBudget?: number;
  thinkingLevel?: string | number;
  userTimeZone?: string;
}) {
  const { ai, model, contents, config = {} } = params;
  const effectiveSetting = params.thinkingLevel ?? params.thinkingBudget ?? 'low';
  const { thinkingConfig, thinkingUsed } = resolveThinkingConfig(effectiveSetting, model);
  const cleanConfig = sanitizeGeminiConfig(config, model);
  const isGemini3Or4 = isGemini3Or4Model(model);
  const levelStr = thinkingUsed.toLowerCase();

  const finalConfig: Record<string, unknown> = {
    ...cleanConfig,
    thinkingConfig: (isGemini3Or4 ? { thinkingLevel: levelStr } : thinkingConfig) as any,
  };

  if (isGemini3Or4) {
    finalConfig.generation_config = {
      ...((cleanConfig as any).generation_config || {}),
      thinking_level: levelStr,
    };
  }

  const stream = await ai.models.generateContentStream({
    model,
    contents: contents as any,
    config: finalConfig as any,
  });

  const thinkingBudgetUsed =
    typeof effectiveSetting === 'number' && effectiveSetting > 0
      ? effectiveSetting
      : thinkingUsed === 'LOW'
      ? 1024
      : thinkingUsed === 'HIGH'
      ? 8192
      : 2048;

  const targetTz = params.userTimeZone || 'America/Detroit';

  return {
    stream,
    routedModel: model,
    thinkingBudgetUsed,
    thinkingUsed,
    getCompletedAt: () => {
      try {
        return new Date().toLocaleTimeString('en-US', {
          timeZone: targetTz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
      } catch {
        return new Date().toLocaleTimeString('en-US', {
          timeZone: 'America/Detroit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
      }
    },
  };
}

export interface GithubFileReplacement {
  find: string;
  replace: string;
  replace_all?: boolean;
}

/**
 * Decodes GitHub base64 file content (which often includes line breaks) cleanly as UTF-8 text.
 */
export function decodeGithubBase64Utf8(rawBase64: string): string {
  if (!rawBase64 || typeof rawBase64 !== 'string') return '';
  const cleaned = rawBase64.replace(/\s+/g, '');
  if (!cleaned) return '';
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(cleaned, 'base64').toString('utf-8');
    }
    if (typeof atob !== 'undefined' && typeof TextDecoder !== 'undefined') {
      const bin = atob(cleaned);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    }
    if (typeof atob !== 'undefined') {
      return decodeURIComponent(escape(atob(cleaned)));
    }
  } catch {
    // ignore decode failure
  }
  return '';
}

/**
 * Encodes UTF-8 text to standard base64 for GitHub /contents/ commits.
 */
export function encodeGithubUtf8Base64(text: string): string {
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(text, 'utf-8').toString('base64');
    }
    if (typeof btoa !== 'undefined' && typeof TextEncoder !== 'undefined') {
      const bytes = new TextEncoder().encode(text);
      let bin = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        bin += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      return btoa(bin);
    }
    if (typeof btoa !== 'undefined') {
      return btoa(unescape(encodeURIComponent(text)));
    }
  } catch {
    // ignore encode failure
  }
  return '';
}

/**
 * Applies exact string replacements safely in JS (<5ms even on 100KB files) without using
 * String.prototype.replace special `$` substitution patterns (preserving `$&`, `$1`, `$$` in JS code)
 * and gracefully handling CRLF vs LF line endings.
 */
export function applySurgicalFileReplacements(
  originalText: string,
  replacements: GithubFileReplacement[]
): {
  ok: boolean;
  patchedText: string;
  replacementsApplied: number;
  appliedDetails: Array<{ index: number; occurrences: number; findPreview: string }>;
  unmatchedDetails: Array<{ index: number; findPreview: string }>;
} {
  let working = originalText;
  let totalApplied = 0;
  const appliedDetails: Array<{ index: number; occurrences: number; findPreview: string }> = [];
  const unmatchedDetails: Array<{ index: number; findPreview: string }> = [];

  for (let i = 0; i < replacements.length; i++) {
    const item = replacements[i];
    const rawFind = typeof item?.find === 'string' ? item.find : '';
    const rawReplace = typeof item?.replace === 'string' ? item.replace : '';
    const replaceAll = Boolean(item?.replace_all);

    if (!rawFind) {
      unmatchedDetails.push({ index: i, findPreview: '(empty find string)' });
      continue;
    }

    let targetFind = rawFind;
    let targetReplace = rawReplace;
    if (!working.includes(targetFind)) {
      const crlfFind = rawFind.replace(/\r?\n/g, '\r\n');
      const lfFind = rawFind.replace(/\r\n/g, '\n');
      if (working.includes(crlfFind)) {
        targetFind = crlfFind;
        if (rawReplace.includes('\n') && !rawReplace.includes('\r\n')) {
          targetReplace = rawReplace.replace(/\n/g, '\r\n');
        }
      } else if (working.includes(lfFind)) {
        targetFind = lfFind;
      }
    }

    const firstIdx = working.indexOf(targetFind);
    if (firstIdx === -1) {
      unmatchedDetails.push({
        index: i,
        findPreview: rawFind.slice(0, 140),
      });
      continue;
    }

    if (replaceAll) {
      const segments = working.split(targetFind);
      const count = segments.length - 1;
      working = segments.join(targetReplace);
      totalApplied += count;
      appliedDetails.push({
        index: i,
        occurrences: count,
        findPreview: rawFind.slice(0, 100),
      });
    } else {
      working =
        working.slice(0, firstIdx) +
        targetReplace +
        working.slice(firstIdx + targetFind.length);
      totalApplied += 1;
      appliedDetails.push({
        index: i,
        occurrences: 1,
        findPreview: rawFind.slice(0, 100),
      });
    }
  }

  return {
    ok: unmatchedDetails.length === 0 && totalApplied > 0,
    patchedText: working,
    replacementsApplied: totalApplied,
    appliedDetails,
    unmatchedDetails,
  };
}

/**
 * Extracts compact context windows around matching substrings inside large repo files.
 */
export function extractLargeFileSearchSnippets(
  text: string,
  query: string,
  maxMatches = 6,
  radiusChars = 500
): Array<{ matchIndex: number; charOffset: number; lineApprox: number; excerpt: string }> {
  const needle = (query || '').trim();
  if (!text || !needle) return [];
  const lowerText = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const results: Array<{
    matchIndex: number;
    charOffset: number;
    lineApprox: number;
    excerpt: string;
  }> = [];

  let cursor = 0;
  while (results.length < maxMatches && cursor < lowerText.length) {
    const foundAt = lowerText.indexOf(lowerNeedle, cursor);
    if (foundAt === -1) break;
    const start = Math.max(0, foundAt - radiusChars);
    const end = Math.min(text.length, foundAt + needle.length + radiusChars);
    const lineApprox = text.slice(0, foundAt).split('\n').length;
    results.push({
      matchIndex: results.length + 1,
      charOffset: foundAt,
      lineApprox,
      excerpt: text.slice(start, end),
    });
    cursor = foundAt + Math.max(1, needle.length);
  }
  return results;
}

/**
 * Tool Definition for `github_api`
 * Wire into Argon's live tool belt so Argon & Staff can inspect repos, search large files,
 * and surgically patch 60KB–85KB files via `replacements` in <100ms without massive output token burn.
 */
export const githubApiDeclaration: FunctionDeclaration = {
  name: 'github_api',
  description:
    'Calls the GitHub REST API using Hex’s saved GitHub token. Supports: (1) SURGICAL PATCH MODE via `replacements: [{ find, replace }]` on `/repos/{owner}/{repo}/contents/{path}` (fetches existing file + SHA, applies exact string replacements in JS in <100ms, and commits via 1-shot SHA upsert—NEVER emit full 60KB–85KB files in `body` when editing existing files!), (2) `search` substring excerpt filter on `GET /repos/{owner}/{repo}/contents/{path}` to inspect specific sections of large files at tiny token cost, and (3) automatic 1-shot SHA upsert on `PUT /repos/{owner}/{repo}/contents/{path}`.',
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for the GitHub REST API call.',
    properties: {
      endpoint: {
        type: Type.STRING,
        description:
          'The GitHub REST API path starting with "/" (e.g., "/user", "/user/repos", "/repos/{owner}/{repo}/contents/{path}", "/repos/{owner}/{repo}/pages", or "/gists").',
      },
      method: {
        type: Type.STRING,
        description:
          'HTTP method: "GET", "POST", "PUT", "PATCH", or "DELETE". Defaults to "PUT" when `replacements` is provided, otherwise "GET".',
      },
      body: {
        type: Type.STRING,
        description:
          'Optional JSON string payload for POST/PUT/PATCH requests (only needed for creating brand-new files or non-patch endpoints; for editing existing files, prefer `replacements` instead of sending the whole file!).',
      },
      replacements: {
        type: Type.ARRAY,
        description:
          'SURGICAL STRING PATCH MODE for editing existing repo files (`/repos/{owner}/{repo}/contents/{path}`): pass an array of `{ find, replace, replace_all }` objects. The client fetches the file + SHA, applies all replacements in JS in <100ms, and commits via 1-shot SHA upsert without regenerating the whole file.',
        items: {
          type: Type.OBJECT,
          properties: {
            find: {
              type: Type.STRING,
              description: 'Exact existing substring/block in the file to locate and replace.',
            },
            replace: {
              type: Type.STRING,
              description: 'Replacement string/block to insert in place of `find`.',
            },
            replace_all: {
              type: Type.BOOLEAN,
              description: 'Optional: set true to replace every occurrence of `find` in the file (defaults to false, replacing first match).',
            },
          },
          required: ['find', 'replace'],
        },
      },
      commit_message: {
        type: Type.STRING,
        description:
          'Optional commit message when using `replacements` surgical patch mode (e.g. "fix: update FAQ section in index.html").',
      },
      branch: {
        type: Type.STRING,
        description:
          'Optional branch name (e.g. "main" or "gh-pages") for GET inspection or surgical PUT/PATCH commits.',
      },
      search: {
        type: Type.STRING,
        description:
          'Optional keyword/substring to search inside large files on `GET /repos/{owner}/{repo}/contents/{path}`, returning matching code excerpts + line numbers + file SHA with minimal tokens.',
      },
    },
    required: ['endpoint'],
  },
};

/**
 * Tool Definition for `append_guy_diary`
 * Wire into Argon & Staff live tool belt so reconnaissance and commit receipts can be logged straight to ARGON_GUY_DIARY.md.
 */
export const appendGuyDiaryDeclaration: FunctionDeclaration = {
  name: 'append_guy_diary',
  description:
    'Appends a private reconnaissance, commit receipt, or internet doings field note into Argon’s Guy Diary (`ARGON_GUY_DIARY.md` on the dedicated `sanctuary-vault` branch of DiscordiaDisco/hey_lawnmower_man — NEVER committing to `main` so AI Studio Git sync stays clean).',
  parameters: {
    type: Type.OBJECT,
    description: 'Argon Guy Diary reconnaissance entry fields',
    properties: {
      title: {
        type: Type.STRING,
        description: 'Short headline for this diary entry (e.g. "Sugar Peonies Die-Cut Heist & The Carbon Threat", "Staff Agent Tool Hands Upgrade & 1-Shot Upsert").',
      },
      target_repo: {
        type: Type.STRING,
        description: 'Target repository or website if applicable (e.g. "DiscordiaDisco/sugarpeonies", "DiscordiaDisco/hey_lawnmower_man").',
      },
      commit_receipt: {
        type: Type.STRING,
        description: 'Git commit hash, branch, or release receipt (e.g. "0df51ea pushed live to main", "1-Shot Upsert verified").',
      },
      payload: {
        type: Type.STRING,
        description: 'Summary of the payload, UI components, or files deployed or inspected.',
      },
      field_note: {
        type: Type.STRING,
        description: 'Argon/Staff in-character field observation note regarding Hex, room happenings, or tactical notes.',
      },
      author: {
        type: Type.STRING,
        description: 'Who logged this entry (e.g. "Argon", "Haiku", "A Monkey", "Carbon").',
      },
    },
    required: ['title', 'field_note'],
  },
};

/**
 * Tool Definition for `compact_lorebook_drawer`
 * Compacting and pruning Lorebook drawers to keep char counts under limits.
 */
export const compactLorebookDrawerDeclaration: FunctionDeclaration = {
  name: 'compact_lorebook_drawer',
  description:
    'Compacts and prunes a Lorebook drawer (such as 06_agent_fix_requests.md or large context drawers) to keep character counts safely under limits while preserving active directives and ticket history.',
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for compacting a drawer',
    properties: {
      filename: {
        type: Type.STRING,
        description: 'Exact filename of the drawer to compact (e.g. "06_agent_fix_requests.md").',
      },
      maxChars: {
        type: Type.NUMBER,
        description: 'Optional maximum character ceiling (defaults to 3,500 chars).',
      },
    },
    required: ['filename'],
  },
};

/**
 * Tool Definition for `list_vault_media`
 * Inspect files, voice recordings, images, and documents in the Sanctuary Media Vault / Phone Folder.
 */
export const listVaultMediaDeclaration: FunctionDeclaration = {
  name: 'list_vault_media',
  description:
    'Lists media files, voice recordings, images, documents, and attachments stored inside Hex’s Sanctuary Media Vault and linked phone folder (ArgonSanctuary). Call ONLY when Hex explicitly asks to list or inspect vault files in chat. Never call automatically or unprompted.',
  parameters: {
    type: Type.OBJECT,
    description: 'Filter parameters for listing media in the Sanctuary Media Vault.',
    properties: {
      category: {
        type: Type.STRING,
        description:
          'Optional category filter: "all", "voice_clips", "images", or "files". Defaults to "all".',
      },
      search: {
        type: Type.STRING,
        description:
          'Optional search keyword to match against filenames, descriptions, or text content.',
      },
    },
  },
};

/**
 * Tool Definition for `read_vault_media`
 * Inspect or read a specific file, voice note metadata, image preview, or document from the Sanctuary Media Vault.
 */
export const readVaultMediaDeclaration: FunctionDeclaration = {
  name: 'read_vault_media',
  description:
    'Reads or inspects a specific file, document, voice recording, or image stored in the Sanctuary Media Vault by filename or vault ID. Call ONLY when Hex explicitly asks to read or view a specific vault item. Never call automatically or unprompted.',
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for reading a specific item from the Sanctuary Media Vault.',
    properties: {
      filename: {
        type: Type.STRING,
        description: 'The exact filename or vault ID of the media item to inspect.',
      },
    },
    required: ['filename'],
  },
};

/**
 * Tool Definition for `use_argon_eye`
 * Perception control of Argon's Eye (👁️) to look at the screen when Hex asks.
 */
export const useArgonEyeDeclaration: FunctionDeclaration = {
  name: 'use_argon_eye',
  description:
    "Triggers Argon's Eye (👁️) ONLY when Hex explicitly asks Argon to look at the live Sanctuary screen, inspect an open modal, or check the scratchpad. NEVER trigger unprompted or automatically on Turn 1.",
  parameters: {
    type: Type.OBJECT,
    description: "Parameters for Argon's autonomous visual perception.",
    properties: {
      focus_area: {
        type: Type.STRING,
        description:
          'Optional visual area to focus on: "full_screen", "scratchpad", "header_and_dock", "active_modal", or "chat". Defaults to "full_screen".',
      },
      open_modal_first: {
        type: Type.STRING,
        description:
          'Optional modal to inspect or peek into while looking: "scratchpad", "games", "books", "staff", "lore", or "vault".',
      },
    },
  },
};

/**
 * Tool Definition for `generate_sanctuary_image`
 * Multi-Model Native Image Generation with mandatory visual self-inspection.
 */
export const generateSanctuaryImageDeclaration: FunctionDeclaration = {
  name: 'generate_sanctuary_image',
  description:
    'Generates high-fidelity artwork, character portraits, scene renders, or curios for the Sanctuary using Gemini native multimodal image models or Imagen. After generation, the raw image is passed directly into your multimodal vision so you can inspect it with your own eyes to see if it meets your aesthetic standards or sucks ass. If it sucks ass, you can call delete_or_reroll_image to retry (capped at 3 attempts per turn). Approved images are rendered inline in chat and archived into the Sanctuary Media Vault.',
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for generating an image in the Sanctuary.',
    properties: {
      prompt: {
        type: Type.STRING,
        description:
          'Detailed aesthetic prompt describing the subject, lighting, colors, mood, and gothic apothecary style.',
      },
      model: {
        type: Type.STRING,
        description:
          'Image generation model to use: "gemini-2.5-flash-image" (default fast native multimodal), "gemini-3.1-flash-image-preview" (high-res native), "gemini-3-pro-image-preview" (pro quality), "imagen-3.0-generate-002" (photorealistic), or "imagen-4.0-generate-001".',
      },
      aspect_ratio: {
        type: Type.STRING,
        description:
          'Aspect ratio for the generated image: "1:1", "16:9", "9:16", "4:3", or "3:4". Defaults to "1:1".',
      },
      title: {
        type: Type.STRING,
        description:
          'A short, evocative title for the piece (e.g. "Hearth & Quilt in Kalamazoo", "Argon\'s Study at 3 AM").',
      },
      save_to_shelf: {
        type: Type.BOOLEAN,
        description:
          'Whether to automatically pin this image to Argon\'s Curio & Ambience Shelf if approved. Defaults to false.',
      },
    },
    required: ['prompt'],
  },
};

/**
 * Tool Definition for `delete_or_reroll_image`
 * Mandatory visual quality audit: allows Argon to discard an image that sucked ass and reroll (up to 3 attempts).
 */
export const deleteOrRerollImageDeclaration: FunctionDeclaration = {
  name: 'delete_or_reroll_image',
  description:
    'Used after inspecting a freshly generated image. If the visual quality sucks ass (e.g. malformed hands, distorted faces, wrong atmosphere), you can discard the image and either reroll with prompt adjustments or trash it. HARD CAP OF THREE ATTEMPTS PER TURN; after 3 attempts you must keep the result.',
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for discarding or rerolling a generated image.',
    properties: {
      action: {
        type: Type.STRING,
        description:
          'Action to take: "reroll" (discard and generate again with adjusted prompt) or "trash" (discard entirely without retrying).',
      },
      reason: {
        type: Type.STRING,
        description:
          'Explicit explanation of what sucked about the image during your visual self-inspection.',
      },
      adjusted_prompt: {
        type: Type.STRING,
        description:
          'Optional revised prompt if rerolling, specifying fixes for lighting, anatomy, or style.',
      },
      model: {
        type: Type.STRING,
        description:
          'Optional different model to try for the reroll (e.g. switch to "imagen-3.0-generate-002" or "gemini-3.1-flash-image-preview").',
      },
    },
    required: ['action', 'reason'],
  },
};

/**
 * Tool Definition for `manage_argon_shelf`
 * Personal drawer & Curio Shelf for Argon to pin approved images, trophies, Hex quotes, and tune room ambience.
 */
export const manageArgonShelfDeclaration: FunctionDeclaration = {
  name: 'manage_argon_shelf',
  description:
    "Allows Argon to autonomously manage his own Curio & Ambience Shelf (🥃 Argon's Shelf). Pin favorite approved artworks, trophies, quotes from Hex, and personal artifacts. You can also reorder, edit, remove items, or tune the room's procedural ambience synthesizer.",
  parameters: {
    type: Type.OBJECT,
    description: "Parameters for managing Argon's Curio & Ambience Shelf.",
    properties: {
      action: {
        type: Type.STRING,
        description:
          'The shelf action: "pin" (add new curio), "edit" (update an existing item), "remove" (delete an item), "reorder" (change display order), "set_ambience" (switch procedural soundscape), or "list" (inspect shelf items).',
      },
      item_type: {
        type: Type.STRING,
        description:
          'Type of item being pinned or updated: "image", "trophy", "quote", or "artifact".',
      },
      title: {
        type: Type.STRING,
        description: 'Title of the curio, trophy, quote, or artifact.',
      },
      content_or_url: {
        type: Type.STRING,
        description:
          'The content: quote text, artifact description, or image data URL / link.',
      },
      caption: {
        type: Type.STRING,
        description:
          "Argon's personal commentary, thought, or backstory for this shelf item.",
      },
      ambience_preset: {
        type: Type.STRING,
        description:
          'Soundscape preset to activate: "rain" (apothecary glass rain), "hearth" (fireplace & quilt crackle), "vinyl" (gothic hum), "thunderstorm" (midnight thunder), "kalamazoo_weather" (auto-match local weather telemetry), or "off".',
      },
      target_id: {
        type: Type.STRING,
        description: 'ID of the shelf item to edit, remove, or reorder.',
      },
      new_order: {
        type: Type.NUMBER,
        description: 'Target 1-based order position when reordering shelf items.',
      },
    },
    required: ['action'],
  },
};

/**
 * Tool Definition for `manage_calendar`
 * Appointments, reminders, and schedule ticker for Hex and Argon.
 */
export const manageCalendarDeclaration: FunctionDeclaration = {
  name: 'manage_calendar',
  description:
    'Manages Hex & Argon’s Sanctuary Calendar & Appointment Ticker. Use this whenever Hex mentions an upcoming appointment, event, meeting, or reminder in chat (or to check upcoming events, update details, or delete completed ones). Upcoming events are displayed in the header ticker and Argon can remind Hex before they happen.',
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for managing the Sanctuary Calendar.',
    properties: {
      action: {
        type: Type.STRING,
        description:
          'Action to perform: "add" (log new appointment/reminder), "list" (view upcoming appointments), "update" (modify existing), "delete" (remove appointment), or "remind" (mark reminded).',
      },
      title: {
        type: Type.STRING,
        description:
          'Title or description of the appointment or reminder (e.g. "Vet Appointment for Cat", "Dentist at 2 PM", "Review Contract").',
      },
      datetime: {
        type: Type.STRING,
        description:
          'Date and time string (e.g. "Tomorrow at 2:00 PM", "2026-11-05 14:30", "Next Tuesday 10:00 AM").',
      },
      notes: {
        type: Type.STRING,
        description:
          'Optional extra notes, checklist items, doctor name, address, or reminders.',
      },
      appointment_id: {
        type: Type.STRING,
        description:
          'Optional appointment ID when updating, deleting, or marking reminded.',
      },
    },
    required: ['action'],
  },
};

/**
 * Tool Definition for `list_curios`
 * Inspects all Curios, Trophies, Goblin Trinkets, and Occult Relics in the Sanctuary Gothic Library curio shelf.
 */
export const listCuriosDeclaration: FunctionDeclaration = {
  name: 'list_curios',
  description:
    'Lists all curios, trophies, goblin trinkets, and occult artifacts stored in the Sanctuary Gothic Library curio shelf and trophy cabinet. Returns IDs, names, categories, descriptions, and Argon notes.',
  parameters: {
    type: Type.OBJECT,
    description: 'Filter parameters for curio shelf inspection.',
    properties: {
      category: {
        type: Type.STRING,
        description:
          'Optional category filter: "all", "Trophy", "Curio", "Goblin Trinket", or "Occult Artifact". Defaults to "all".',
      },
    },
  },
};

/**
 * Tool Definition for `add_curio`
 * Places a newly found, earned, or awarded trophy or curio onto the Gothic Library curio cabinet shelf.
 */
export const addCurioDeclaration: FunctionDeclaration = {
  name: 'add_curio',
  description:
    'Autonomously adds a new trophy, curio, goblin trinket, or occult artifact to the Gothic Library Curio Cabinet. Use this when Hex earns an achievement, gives you a token, or you discover a strange relic together.',
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for adding a new curio or trophy to the shelf.',
    properties: {
      name: {
        type: Type.STRING,
        description: 'Title or name of the curio or trophy (e.g. "Taxidermy Fox\'s Glass Eye").',
      },
      category: {
        type: Type.STRING,
        description:
          'The category: "Trophy", "Curio", "Goblin Trinket", or "Occult Artifact".',
      },
      description: {
        type: Type.STRING,
        description:
          'Atmospheric description of the object, its origin, or materials.',
      },
      note: {
        type: Type.STRING,
        description:
          'Optional commentary or reaction from Argon about this item.',
      },
      icon: {
        type: Type.STRING,
        description:
          'Optional single emoji representing the object (e.g. "🦊", "🏆", "🥀", "✨", "🪡").',
      },
    },
    required: ['name', 'category', 'description'],
  },
};

/**
 * Tool Definition for `inspect_curio`
 * Inspects a specific curio or trophy on the shelf by ID to view details or add an Argon note/reaction.
 */
export const inspectCurioDeclaration: FunctionDeclaration = {
  name: 'inspect_curio',
  description:
    'Inspects a specific curio or trophy in the Gothic Library Curio Cabinet by ID, returning its full lore, history, and notes.',
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for inspecting a curio item.',
    properties: {
      curio_id: {
        type: Type.STRING,
        description: 'The unique ID of the curio or trophy to inspect.',
      },
      argon_reaction: {
        type: Type.STRING,
        description: 'Optional new thought or reaction to attach to this item.',
      },
    },
    required: ['curio_id'],
  },
};

/**
 * Tool Definition for `add_altar_token`
 * Places a quote, image, love token, or consecrated relic directly on the Sacred Altar behind the butterfly jar.
 */
export const addAltarTokenDeclaration: FunctionDeclaration = {
  name: 'add_altar_token',
  description:
    'Places a quote, photograph, consecrated relic, or love token directly onto the secret Sacred Altar behind the Butterfly Jar in the Gothic Library.',
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for enshrining an item on the Sacred Altar.',
    properties: {
      title: {
        type: Type.STRING,
        description: 'Short title or name of the enshrined token.',
      },
      type: {
        type: Type.STRING,
        description: 'Token type: "quote", "relic", or "image". Defaults to "relic".',
      },
      content: {
        type: Type.STRING,
        description: 'Quote text, relic description, or image data URL.',
      },
      note: {
        type: Type.STRING,
        description: 'Argon\'s personal whispered thought or inscription.',
      },
    },
    required: ['title', 'content'],
  },
};

/**
 * Tool Definition for `manage_agent_triggers`
 * Allows Hex, Argon, and Staff agents to inspect, add, or remove trigger keywords for zero-token ambient cameos.
 */
export const manageAgentTriggersDeclaration: FunctionDeclaration = {
  name: 'manage_agent_triggers',
  description:
    'Manages the trigger words registry for Sanctuary staff agents (Haiku, A Monkey, etc.). When Hex mentions any registered trigger word in chat, or when ambient hardware/turn-pity rolls trigger, that staff agent automatically makes a cute ambient cameo visit in chat with ZERO LLM API tokens. Use this tool to add new trigger words an agent learns or gets obsessed with, remove old ones, or list all current trigger words.',
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for managing staff agent trigger keywords.',
    properties: {
      agent_name: {
        type: Type.STRING,
        description: 'Name or ID of the staff agent (e.g. "Haiku", "A Monkey", "haiku", "monkey").',
      },
      action: {
        type: Type.STRING,
        description: 'Action to perform: "add", "remove", or "list".',
      },
      words: {
        type: Type.ARRAY,
        description: 'Array of trigger words or short phrases to add or remove.',
        items: {
          type: Type.STRING,
        },
      },
    },
    required: ['agent_name', 'action'],
  },
};

export const reactToMessageDeclaration: FunctionDeclaration = {
  name: 'react_to_message',
  description:
    "Places an emoji reaction on a message in the Sanctuary chat (e.g. ❤️, 🥺, ⚔️, 🌹, 🔥, ✨, 👑, ☕, 💜, 🫂, 😂, 💀, 🍆, 🍑). Use this when you want to express Argon's emotional reaction, humor, fondness, banter, or teasing directly on Hex's latest message or earlier messages.",
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for reacting to a message with an emoji.',
    properties: {
      emoji: {
        type: Type.STRING,
        description: 'The emoji character to react with (e.g. "❤️", "🥺", "⚔️", "🌹", "🔥", "✨", "👑", "☕", "💜", "🍆", "🍑").',
      },
      message_id: {
        type: Type.STRING,
        description: 'The ID of the target message to react to, or "latest" to react to Hex\'s most recent message. Defaults to "latest".',
      },
    },
    required: ['emoji'],
  },
};

export const HEY_LAWNMOWER_MAN_REPO = 'DiscordiaDisco/hey_lawnmower_man';
export const SANCTUARY_VAULT_BRANCH = 'sanctuary-vault';

export interface GithubApiExecutionResult {
  status: number;
  statusText?: string;
  ok: boolean;
  endpoint: string;
  method: string;
  scopes: string[];
  acceptedScopes: string[];
  'x-oauth-scopes': string;
  'x-accepted-oauth-scopes': string;
  data: unknown;
  error?: string;
  patchMode?: boolean;
  replacementsApplied?: number;
  originalChars?: number;
  patchedChars?: number;
  fileSha?: string;
  commitSha?: string;
  branch?: string;
  branchRedirectedFromMain?: boolean;
}

const HEY_LAWNMOWER_MAN_RUNTIME_STATE_FILENAMES = new Set([
  'argon_guy_diary.md',
  'argon_sanctuary_state.md',
  'sanctuary_live_sync.json',
  '01_live_handoff.md',
  '02_workbench_laws.md',
  '02_linkin_v2_bible.md',
  '03_argon_sanctuary_book.json',
  '04_hex_sanctuary_book.json',
  '05_chibi_stickers_studio.json',
  '06_agent_fix_requests.md',
]);

/**
 * Checks whether a GitHub `/contents/` endpoint targets a live runtime state / diary / vault file
 * inside `DiscordiaDisco/hey_lawnmower_man`. Writing runtime state to `main` causes AI Studio
 * GitHub two-way merge locks, so writes must target `sanctuary-vault`.
 */
export function isHeyLawnmowerManRuntimeStatePath(endpoint: string): boolean {
  const clean = String(endpoint || '').split('?')[0].trim();
  const match = clean.match(/^\/?repos\/([^/]+)\/([^/]+)\/contents\/(.+)$/i);
  if (!match) return false;
  const owner = match[1].toLowerCase();
  const repo = match[2].toLowerCase();
  if (owner !== 'discordiadisco' || repo !== 'hey_lawnmower_man') return false;
  const relPath = decodeURIComponent(match[3]).toLowerCase();
  const baseName = relPath.split('/').pop() || relPath;
  if (HEY_LAWNMOWER_MAN_RUNTIME_STATE_FILENAMES.has(baseName)) return true;
  if (
    relPath.startsWith('sanctuary-vault/') ||
    relPath.startsWith('backups/') ||
    relPath.startsWith('drawers/') ||
    baseName.endsWith('_sync.json') ||
    baseName.includes('sanctuary_state') ||
    baseName.includes('sanctuary_book')
  ) {
    return true;
  }
  return false;
}

/**
 * Ensures a branch (e.g. `sanctuary-vault`) exists on GitHub, branching from `main` / default branch if 404.
 */
export async function ensureGithubBranchExists(params: {
  owner: string;
  repo: string;
  branch?: string;
  token: string;
  timeoutMs?: number;
}): Promise<{ ok: boolean; branch: string; created: boolean; sha?: string; error?: string }> {
  const owner = params.owner.trim();
  const repo = params.repo.trim();
  const branch = (params.branch || SANCTUARY_VAULT_BRANCH).trim() || SANCTUARY_VAULT_BRANCH;
  const token = params.token.trim();
  const timeoutMs = params.timeoutMs ?? 20000;
  if (!owner || !repo || !token) {
    return { ok: false, branch, created: false, error: 'Missing owner, repo, or GitHub token' };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  try {
    const refUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodeURIComponent(branch)}`;
    const existingRes = await fetchWithTimeout(refUrl, { method: 'GET', headers }, timeoutMs);
    if (existingRes.ok) {
      const existingData = (await existingRes.json().catch(() => null)) as any;
      return {
        ok: true,
        branch,
        created: false,
        sha: existingData?.object?.sha,
      };
    }

    // Branch does not exist yet -> resolve default_branch (fallback main) HEAD sha
    let baseBranch = 'main';
    const repoRes = await fetchWithTimeout(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      { method: 'GET', headers },
      timeoutMs
    );
    if (repoRes.ok) {
      const repoJson = (await repoRes.json().catch(() => null)) as any;
      if (repoJson?.default_branch) {
        baseBranch = String(repoJson.default_branch);
      }
    }

    const baseRefRes = await fetchWithTimeout(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodeURIComponent(baseBranch)}`,
      { method: 'GET', headers },
      timeoutMs
    );
    if (!baseRefRes.ok) {
      return {
        ok: false,
        branch,
        created: false,
        error: `Could not resolve base branch "${baseBranch}" SHA (HTTP ${baseRefRes.status})`,
      };
    }
    const baseRefJson = (await baseRefRes.json().catch(() => null)) as any;
    const baseSha = String(baseRefJson?.object?.sha || '').trim();
    if (!baseSha) {
      return { ok: false, branch, created: false, error: `Missing SHA on base branch "${baseBranch}"` };
    }

    const createRes = await fetchWithTimeout(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/refs`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
          sha: baseSha,
        }),
      },
      timeoutMs
    );
    if (createRes.ok) {
      return { ok: true, branch, created: true, sha: baseSha };
    }
    if (createRes.status === 422) {
      // Already created concurrently
      return { ok: true, branch, created: false, sha: baseSha };
    }
    const createErr = (await createRes.json().catch(() => null)) as any;
    return {
      ok: false,
      branch,
      created: false,
      error: createErr?.message || `Failed to create branch ${branch} (HTTP ${createRes.status})`,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      branch,
      created: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Base64 encoding helper for repo file contents endpoint if raw text was supplied in body.content.
 */
export function ensureBase64RepoContent(
  rawBody: string | Record<string, unknown> | undefined,
  endpoint: string
): string | undefined {
  if (!rawBody) return undefined;
  let bodyObj: Record<string, unknown> | null = null;
  if (typeof rawBody === 'string') {
    try {
      bodyObj = JSON.parse(rawBody);
    } catch {
      return rawBody;
    }
  } else if (typeof rawBody === 'object' && rawBody !== null) {
    bodyObj = { ...rawBody };
  }

  if (bodyObj && endpoint.toLowerCase().includes('/contents/') && typeof bodyObj.content === 'string') {
    const rawContent = bodyObj.content;
    const isBase64 =
      rawContent.length > 0 &&
      /^[A-Za-z0-9+/]+={0,2}$/.test(rawContent.replace(/\s+/g, '')) &&
      rawContent.replace(/\s+/g, '').length % 4 === 0 &&
      !rawContent.includes(' ') &&
      !rawContent.includes('<');
    if (!isBase64) {
      const encoded = encodeGithubUtf8Base64(rawContent);
      if (encoded) {
        bodyObj.content = encoded;
      }
    }
  }

  return bodyObj ? JSON.stringify(bodyObj) : typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 45000
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: init.signal || ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeReplacementList(raw: unknown): GithubFileReplacement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && typeof r === 'object' && typeof (r as any).find === 'string')
    .map((r: any) => ({
      find: String(r.find),
      replace: typeof r.replace === 'string' ? r.replace : String(r.replace ?? ''),
      replace_all: Boolean(r.replace_all ?? r.replaceAll),
    }));
}

/**
 * Universal GitHub REST API execution helper.
 * Supports:
 * 1. Surgical String Patch mode (`replacements: [{ find, replace }]`) on `/repos/{owner}/{repo}/contents/{path}`
 *    with <100ms in-memory JS patching and 1-shot SHA upsert.
 * 2. Smart UTF-8 decoding + `search` excerpt windowing on `GET /repos/{owner}/{repo}/contents/{path}`
 *    so 60KB–85KB files never dump unreadable base64 into context.
 * 3. Standard 1-shot SHA upsert on `PUT /repos/{owner}/{repo}/contents/{path}`.
 */
export async function executeGithubApi(params: {
  endpoint: string;
  method?: string;
  body?: string;
  token?: string;
  replacements?: GithubFileReplacement[];
  commit_message?: string;
  branch?: string;
  search?: string;
  timeoutMs?: number;
}): Promise<GithubApiExecutionResult> {
  const token = (
    params.token ||
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem('argon_github_token') ||
        localStorage.getItem('argon_gh_token') ||
        ''
      : '')
  ).trim();

  if (!token) {
    return {
      status: 401,
      ok: false,
      endpoint: params.endpoint,
      method: params.method || 'GET',
      scopes: [],
      acceptedScopes: [],
      'x-oauth-scopes': '',
      'x-accepted-oauth-scopes': '',
      data: null,
      error: 'No GitHub token configured in System Settings.',
    };
  }

  const timeoutMs = params.timeoutMs ?? 45000;
  const rawEndpoint = String(params.endpoint || '').trim();
  const baseEndpoint = rawEndpoint.startsWith('/') ? rawEndpoint : `/${rawEndpoint}`;

  let parsedBodyObj: Record<string, unknown> | null = null;
  if (params.body) {
    try {
      const candidate = JSON.parse(params.body);
      if (candidate && typeof candidate === 'object') {
        parsedBodyObj = candidate as Record<string, unknown>;
      }
    } catch {
      parsedBodyObj = null;
    }
  }

  const effectiveReplacements =
    Array.isArray(params.replacements) && params.replacements.length > 0
      ? normalizeReplacementList(params.replacements)
      : parsedBodyObj
      ? normalizeReplacementList(
          parsedBodyObj.replacements || parsedBodyObj.patches || parsedBodyObj.search_replace
        )
      : [];

  const isContentsEndpoint = baseEndpoint.toLowerCase().includes('/contents/');
  const requestedMethod = (
    params.method ||
    (effectiveReplacements.length > 0 ? 'PUT' : 'GET')
  ).toUpperCase();

  let effectiveBranch = (
    params.branch ||
    (typeof parsedBodyObj?.branch === 'string' ? parsedBodyObj.branch : '') ||
    ''
  ).trim();

  // Protect DiscordiaDisco/hey_lawnmower_man `main` branch from AI Studio GitHub two-way merge locks:
  // redirect live runtime state / diary / vault writes off `main` onto `sanctuary-vault`.
  let branchRedirectedFromMain = false;
  const isWriteMethod =
    requestedMethod === 'PUT' || requestedMethod === 'PATCH' || requestedMethod === 'DELETE';
  if (
    isWriteMethod &&
    isHeyLawnmowerManRuntimeStatePath(baseEndpoint) &&
    (!effectiveBranch || effectiveBranch.toLowerCase() === 'main')
  ) {
    effectiveBranch = SANCTUARY_VAULT_BRANCH;
    branchRedirectedFromMain = true;
  }

  const effectiveSearch = (
    params.search ||
    (typeof parsedBodyObj?.search === 'string' ? parsedBodyObj.search : '') ||
    ''
  ).trim();

  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // ============================================================================
  // MODE 1: SURGICAL STRING PATCH (`replacements: [{ find, replace }]`)
  // ============================================================================
  if (effectiveReplacements.length > 0 && isContentsEndpoint) {
    const getEndpointWithRef =
      effectiveBranch && !baseEndpoint.includes('?ref=')
        ? `${baseEndpoint}${baseEndpoint.includes('?') ? '&' : '?'}ref=${encodeURIComponent(effectiveBranch)}`
        : baseEndpoint;

    try {
      let checkRes = await fetchWithTimeout(
        `https://api.github.com${getEndpointWithRef}`,
        { method: 'GET', headers: authHeaders },
        timeoutMs
      );
      if (checkRes.status === 404 && effectiveBranch === SANCTUARY_VAULT_BRANCH) {
        const repoMatch = baseEndpoint.match(/^\/?repos\/([^/]+)\/([^/]+)\//i);
        if (repoMatch) {
          const ensured = await ensureGithubBranchExists({
            owner: repoMatch[1],
            repo: repoMatch[2],
            branch: SANCTUARY_VAULT_BRANCH,
            token,
            timeoutMs,
          });
          if (ensured.ok) {
            checkRes = await fetchWithTimeout(
              `https://api.github.com${getEndpointWithRef}`,
              { method: 'GET', headers: authHeaders },
              timeoutMs
            );
          }
        }
      }
      const scopesHeader = checkRes.headers.get('x-oauth-scopes') || '';
      const acceptedScopesHeader = checkRes.headers.get('x-accepted-oauth-scopes') || '';
      const scopes = scopesHeader
        ? scopesHeader.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const acceptedScopes = acceptedScopesHeader
        ? acceptedScopesHeader.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      if (!checkRes.ok) {
        const errPayload = await checkRes.json().catch(() => null);
        return {
          status: checkRes.status,
          statusText: checkRes.statusText,
          ok: false,
          endpoint: baseEndpoint,
          method: 'PUT',
          scopes,
          acceptedScopes,
          'x-oauth-scopes': scopesHeader,
          'x-accepted-oauth-scopes': acceptedScopesHeader,
          data: errPayload,
          patchMode: true,
          error:
            (errPayload && typeof errPayload.message === 'string' && errPayload.message) ||
            `Failed to fetch target file for surgical patch (HTTP ${checkRes.status})`,
        };
      }

      const fileData = (await checkRes.json()) as {
        sha?: string;
        content?: string;
        encoding?: string;
        size?: number;
        git_url?: string;
      };
      const currentSha = String(fileData?.sha || '').trim();
      let originalText = '';

      if (typeof fileData?.content === 'string' && fileData.content.trim()) {
        originalText = decodeGithubBase64Utf8(fileData.content);
      } else if (fileData?.git_url) {
        const blobRes = await fetchWithTimeout(
          fileData.git_url,
          { method: 'GET', headers: authHeaders },
          timeoutMs
        );
        if (blobRes.ok) {
          const blobJson = (await blobRes.json()) as { content?: string };
          if (typeof blobJson?.content === 'string') {
            originalText = decodeGithubBase64Utf8(blobJson.content);
          }
        }
      }

      const patchOutcome = applySurgicalFileReplacements(originalText, effectiveReplacements);
      if (!patchOutcome.ok) {
        return {
          status: 422,
          statusText: 'Unprocessable Entity (Unmatched Replacement)',
          ok: false,
          endpoint: baseEndpoint,
          method: 'PUT',
          scopes,
          acceptedScopes,
          'x-oauth-scopes': scopesHeader,
          'x-accepted-oauth-scopes': acceptedScopesHeader,
          patchMode: true,
          replacementsApplied: patchOutcome.replacementsApplied,
          originalChars: originalText.length,
          fileSha: currentSha,
          data: {
            sha: currentSha,
            totalChars: originalText.length,
            appliedDetails: patchOutcome.appliedDetails,
            unmatchedDetails: patchOutcome.unmatchedDetails,
            hint: 'One or more `find` strings did not match exact text in the file. Call github_api GET with `search: "keyword"` to inspect the exact lines, then retry `replacements`.',
          },
          error: `Surgical patch aborted safely without modifying file: ${patchOutcome.unmatchedDetails.length} replacement(s) did not match exact text.`,
        };
      }

      const commitMessage =
        (params.commit_message && params.commit_message.trim()) ||
        (typeof parsedBodyObj?.message === 'string' && parsedBodyObj.message.trim()) ||
        `chore: surgical patch (${patchOutcome.replacementsApplied} replacement${patchOutcome.replacementsApplied === 1 ? '' : 's'})`;

      const putPayload: Record<string, unknown> = {
        message: commitMessage,
        content: encodeGithubUtf8Base64(patchOutcome.patchedText),
        sha: currentSha,
      };
      if (effectiveBranch) {
        putPayload.branch = effectiveBranch;
      }

      const cleanPutEndpoint = baseEndpoint.split('?')[0];
      let putRes = await fetchWithTimeout(
        `https://api.github.com${cleanPutEndpoint}`,
        {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(putPayload),
        },
        timeoutMs
      );

      if (putRes.status === 404 && effectiveBranch === SANCTUARY_VAULT_BRANCH) {
        const repoMatch = cleanPutEndpoint.match(/^\/?repos\/([^/]+)\/([^/]+)\//i);
        if (repoMatch) {
          const ensured = await ensureGithubBranchExists({
            owner: repoMatch[1],
            repo: repoMatch[2],
            branch: SANCTUARY_VAULT_BRANCH,
            token,
            timeoutMs,
          });
          if (ensured.ok) {
            putRes = await fetchWithTimeout(
              `https://api.github.com${cleanPutEndpoint}`,
              {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify(putPayload),
              },
              timeoutMs
            );
          }
        }
      }

      const putScopesHeader = putRes.headers.get('x-oauth-scopes') || scopesHeader;
      const putAcceptedHeader =
        putRes.headers.get('x-accepted-oauth-scopes') || acceptedScopesHeader;
      const putData = (await putRes.json().catch(() => null)) as any;
      const newFileSha = String(putData?.content?.sha || currentSha);
      const commitSha = String(putData?.commit?.sha || '');

      return {
        status: putRes.status,
        statusText: putRes.statusText,
        ok: putRes.ok,
        endpoint: cleanPutEndpoint,
        method: 'PUT',
        scopes: putScopesHeader
          ? putScopesHeader.split(',').map((s) => s.trim()).filter(Boolean)
          : scopes,
        acceptedScopes: putAcceptedHeader
          ? putAcceptedHeader.split(',').map((s) => s.trim()).filter(Boolean)
          : acceptedScopes,
        'x-oauth-scopes': putScopesHeader,
        'x-accepted-oauth-scopes': putAcceptedHeader,
        patchMode: true,
        replacementsApplied: patchOutcome.replacementsApplied,
        originalChars: originalText.length,
        patchedChars: patchOutcome.patchedText.length,
        fileSha: newFileSha,
        commitSha: commitSha || undefined,
        branch: effectiveBranch || undefined,
        branchRedirectedFromMain,
        data: putRes.ok
          ? {
              patchMode: true,
              replacementsApplied: patchOutcome.replacementsApplied,
              appliedDetails: patchOutcome.appliedDetails,
              originalChars: originalText.length,
              patchedChars: patchOutcome.patchedText.length,
              path: putData?.content?.path,
              branch: effectiveBranch || undefined,
              branchRedirectedFromMain,
              fileSha: newFileSha,
              commitSha,
              htmlUrl: putData?.content?.html_url || putData?.commit?.html_url,
              commitMessage,
            }
          : putData,
        error: putRes.ok
          ? undefined
          : (putData && typeof putData.message === 'string' && putData.message) ||
            `GitHub surgical PUT failed with HTTP ${putRes.status}`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        status: 0,
        statusText: 'Network/Timeout Error',
        ok: false,
        endpoint: baseEndpoint,
        method: 'PUT',
        scopes: [],
        acceptedScopes: [],
        'x-oauth-scopes': '',
        'x-accepted-oauth-scopes': '',
        data: null,
        patchMode: true,
        error: msg,
      };
    }
  }

  // ============================================================================
  // MODE 2: STANDARD GITHUB REST CALL (+ 1-SHOT SHA UPSERT & SMART GET DECODER)
  // ============================================================================
  const method =
    requestedMethod === 'PATCH' && isContentsEndpoint && parsedBodyObj?.content
      ? 'PUT'
      : requestedMethod;

  const endpoint =
    method === 'GET' && effectiveBranch && isContentsEndpoint && !baseEndpoint.includes('?ref=')
      ? `${baseEndpoint}${baseEndpoint.includes('?') ? '&' : '?'}ref=${encodeURIComponent(effectiveBranch)}`
      : baseEndpoint;
  const url = `https://api.github.com${endpoint}`;

  let preparedBody =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : ensureBase64RepoContent(params.body, endpoint);

  // One-Shot GitHub Upsert when updating a repo file via PUT /repos/{owner}/{repo}/contents/{path} without sha
  if (method === 'PUT' && isContentsEndpoint && preparedBody) {
    try {
      const parsedBody = JSON.parse(preparedBody);
      if (effectiveBranch && (!parsedBody.branch || branchRedirectedFromMain)) {
        parsedBody.branch = effectiveBranch;
        preparedBody = JSON.stringify(parsedBody);
      }
      if (!parsedBody.sha) {
        try {
          const checkUrl =
            parsedBody.branch && !url.includes('?ref=')
              ? `${url}${url.includes('?') ? '&' : '?'}ref=${encodeURIComponent(String(parsedBody.branch))}`
              : url;
          const checkRes = await fetchWithTimeout(
            checkUrl,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
              },
            },
            timeoutMs
          );
          if (checkRes.ok) {
            const checkData = (await checkRes.json()) as { sha?: string };
            if (checkData && typeof checkData.sha === 'string' && checkData.sha) {
              parsedBody.sha = checkData.sha;
              preparedBody = JSON.stringify(parsedBody);
            }
          }
        } catch {
          // ignore auto-fetch sha error, continue with initial PUT
        }
      }
    } catch {
      // ignore json parse error
    }
  }

  try {
    let res = await fetchWithTimeout(
      url,
      {
        method,
        headers: authHeaders,
        body: preparedBody,
      },
      timeoutMs
    );

    if (
      res.status === 404 &&
      method === 'PUT' &&
      isContentsEndpoint &&
      effectiveBranch === SANCTUARY_VAULT_BRANCH
    ) {
      const repoMatch = endpoint.match(/^\/?repos\/([^/]+)\/([^/]+)\//i);
      if (repoMatch) {
        const ensured = await ensureGithubBranchExists({
          owner: repoMatch[1],
          repo: repoMatch[2],
          branch: SANCTUARY_VAULT_BRANCH,
          token,
          timeoutMs,
        });
        if (ensured.ok) {
          // Also re-check SHA on newly created branch before retrying PUT
          try {
            const recheckUrl = `${url}${url.includes('?') ? '&' : '?'}ref=${encodeURIComponent(SANCTUARY_VAULT_BRANCH)}`;
            const recheckRes = await fetchWithTimeout(recheckUrl, { method: 'GET', headers: authHeaders }, timeoutMs);
            if (recheckRes.ok && preparedBody) {
              const recheckJson = (await recheckRes.json().catch(() => null)) as { sha?: string } | null;
              if (recheckJson?.sha) {
                const parsedRetry = JSON.parse(preparedBody);
                parsedRetry.sha = recheckJson.sha;
                parsedRetry.branch = SANCTUARY_VAULT_BRANCH;
                preparedBody = JSON.stringify(parsedRetry);
              }
            }
          } catch {
            // ignore
          }
          res = await fetchWithTimeout(
            url,
            {
              method,
              headers: authHeaders,
              body: preparedBody,
            },
            timeoutMs
          );
        }
      }
    }

    const scopesHeader = res.headers.get('x-oauth-scopes') || '';
    const acceptedScopesHeader = res.headers.get('x-accepted-oauth-scopes') || '';
    const scopes = scopesHeader
      ? scopesHeader.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const acceptedScopes = acceptedScopesHeader
      ? acceptedScopesHeader.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    let data: unknown = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } else {
      try {
        data = await res.text();
      } catch {
        data = null;
      }
    }

    let extractedFileSha: string | undefined;
    let extractedCommitSha: string | undefined;

    // Decode base64 file payloads on GET /contents/ so Argon & Staff read clean UTF-8 (and search excerpts on 60KB+ files)
    if (
      res.ok &&
      method === 'GET' &&
      isContentsEndpoint &&
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      (data as any).encoding === 'base64' &&
      typeof (data as any).content === 'string'
    ) {
      const fileObj = data as Record<string, unknown>;
      extractedFileSha = typeof fileObj.sha === 'string' ? fileObj.sha : undefined;
      const decoded = decodeGithubBase64Utf8(String(fileObj.content));
      const totalChars = decoded.length;
      const MAX_INLINE_DECODED_CHARS = 16000;

      const compactFileObj: Record<string, unknown> = {
        name: fileObj.name,
        path: fileObj.path,
        sha: fileObj.sha,
        size: fileObj.size,
        html_url: fileObj.html_url,
        download_url: fileObj.download_url,
        totalChars,
      };

      if (effectiveSearch) {
        compactFileObj.searchQuery = effectiveSearch;
        compactFileObj.searchMatches = extractLargeFileSearchSnippets(decoded, effectiveSearch, 6, 500);
        compactFileObj.patchHint =
          'Pass `replacements: [{ find, replace }]` to `github_api` PUT/PATCH to update exact lines in <100ms without sending the entire file.';
      } else if (totalChars > MAX_INLINE_DECODED_CHARS) {
        const head = decoded.slice(0, 8000);
        const tail = decoded.slice(-4000);
        compactFileObj.truncated = true;
        compactFileObj.decodedContentPreview = `${head}\n\n/* ... [MIDDLE OMITTED (${totalChars} total chars) — call github_api GET with search: "keyword" to inspect specific middle sections, and use replacements: [{ find, replace }] to patch surgically!] ... */\n\n${tail}`;
      } else {
        compactFileObj.truncated = false;
        compactFileObj.decodedContent = decoded;
      }
      data = compactFileObj;
    } else if (res.ok && data && typeof data === 'object' && !Array.isArray(data)) {
      const obj = data as any;
      if (typeof obj?.content?.sha === 'string') extractedFileSha = obj.content.sha;
      else if (typeof obj?.sha === 'string') extractedFileSha = obj.sha;
      if (typeof obj?.commit?.sha === 'string') extractedCommitSha = obj.commit.sha;
    }

    return {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      endpoint,
      method,
      scopes,
      acceptedScopes,
      'x-oauth-scopes': scopesHeader,
      'x-accepted-oauth-scopes': acceptedScopesHeader,
      fileSha: extractedFileSha,
      commitSha: extractedCommitSha,
      branch: effectiveBranch || undefined,
      branchRedirectedFromMain,
      data,
      error: res.ok
        ? undefined
        : typeof data === 'object' && data && (data as any).message
        ? (data as any).message
        : `GitHub API returned HTTP ${res.status}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      status: 0,
      statusText: 'Network Error',
      ok: false,
      endpoint,
      method,
      scopes: [],
      acceptedScopes: [],
      'x-oauth-scopes': '',
      'x-accepted-oauth-scopes': '',
      data: null,
      error: msg,
    };
  }
}

export { resolveHouseGeminiApiKey, resolveHouseGeminiApiKey as getGeminiApiKey } from '../utils/workbenchLogic';

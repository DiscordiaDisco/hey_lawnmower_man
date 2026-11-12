import { GoogleGenAI, FunctionDeclaration, Type, Content, Part } from '@google/genai';

/**
 * Checks whether the given model is gemini-4-argon or Gemini 3+ (where thinking_budget,
 * temperature, top_p, and top_k must be omitted in favor of thinkingLevel).
 */
export function isGemini3Or4Model(model?: string): boolean {
  const m = (model || '').toLowerCase().trim();
  return m.startsWith('gemini-4') || m.startsWith('gemini-3') || m.includes('argon');
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

/**
 * Tool Definition for `github_api`
 * Wire into Argon's live tool belt so Argon can inspect token scopes and interact with GitHub REST API directly.
 */
export const githubApiDeclaration: FunctionDeclaration = {
  name: 'github_api',
  description:
    'Calls the GitHub REST API using Hex’s saved GitHub token. Supports 1-Shot Upsert on PUT /repos/{owner}/{repo}/contents/{path}: if updating an existing file and "sha" is omitted, the SHA is automatically fetched behind the scenes so the commit succeeds in a single call. Call when Hex or an authorized Staff task requests GitHub operations.',
  parameters: {
    type: Type.OBJECT,
    description: 'Parameters for the GitHub REST API call.',
    properties: {
      endpoint: {
        type: Type.STRING,
        description:
          'The GitHub REST API path starting with "/" (e.g., "/user", "/user/repos", "/repos/{owner}/{repo}/contents/{path}", "/gists", "/user/codespaces", or "/repos/{owner}/{repo}/hooks").',
      },
      method: {
        type: Type.STRING,
        description:
          'HTTP method for the request: "GET", "POST", "PUT", "PATCH", or "DELETE". Defaults to "GET".',
      },
      body: {
        type: Type.STRING,
        description:
          'Optional JSON string payload for POST/PUT/PATCH requests (includes automatic base64 encoding and automatic 1-shot SHA upsert for repo contents).',
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
    'Appends a private reconnaissance, commit receipt, or internet doings field note into Argon’s Guy Diary (`hey_lawnmower_man/ARGON_GUY_DIARY.md` in repo DiscordiaDisco/hey_lawnmower_man). Both updates the local workspace and commits straight to GitHub via 1-shot upsert on Flash tokens.',
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
      /^[A-Za-z0-9+/]+={0,2}$/.test(rawContent.replace(/\s+/g, '')) && rawContent.length % 4 === 0;
    if (!isBase64) {
      try {
        if (typeof btoa !== 'undefined') {
          bodyObj.content = btoa(unescape(encodeURIComponent(rawContent)));
        } else if (typeof Buffer !== 'undefined') {
          bodyObj.content = Buffer.from(rawContent, 'utf-8').toString('base64');
        }
      } catch {
        // keep original if encoding fails
      }
    }
  }

  return bodyObj ? JSON.stringify(bodyObj) : typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
}

/**
 * Universal GitHub REST API execution helper.
 * Reads token from localStorage ('argon_github_token' or 'argon_gh_token') or supplied token.
 * Captures x-oauth-scopes and x-accepted-oauth-scopes headers.
 */
export async function executeGithubApi(params: {
  endpoint: string;
  method?: string;
  body?: string;
  token?: string;
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

  const rawEndpoint = String(params.endpoint || '').trim();
  const endpoint = rawEndpoint.startsWith('/') ? rawEndpoint : `/${rawEndpoint}`;
  const method = (params.method || 'GET').toUpperCase();
  const url = `https://api.github.com${endpoint}`;

  let preparedBody =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : ensureBase64RepoContent(params.body, endpoint);

  // One-Shot GitHub Upsert:
  // If updating a repo file via PUT /repos/{owner}/{repo}/contents/{path} and no sha was supplied,
  // automatically fetch current file SHA via GET behind the scenes so the commit succeeds in a single call!
  if (method === 'PUT' && endpoint.toLowerCase().includes('/contents/') && preparedBody) {
    try {
      const parsedBody = JSON.parse(preparedBody);
      if (!parsedBody.sha) {
        try {
          const checkUrl =
            parsedBody.branch && !url.includes('?ref=')
              ? `${url}?ref=${encodeURIComponent(String(parsedBody.branch))}`
              : url;
          const checkRes = await fetch(checkUrl, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
          });
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

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: preparedBody,
    });

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

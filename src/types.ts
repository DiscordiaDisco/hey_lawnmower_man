import type {
  MessageTokenUsage,
  ToolBadgeEvent,
  AttachedImageItem,
  AttachedVoiceAudio,
  ChatMessageReplyInfo,
  ChatMessageVaultRef,
} from './utils/workbenchLogic';

export interface MessageReaction {
  emoji: string;
  users: Array<'hex' | 'argon' | 'Hex' | 'Argon' | string>;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  sender?: 'hex' | 'argon' | 'staff';
  text: string;
  timestamp: number;
  reactions?: MessageReaction[];
  telemetryHeader?: string;
  bubbleSubtitle?: string;
  images?: AttachedImageItem[];
  voiceAudio?: AttachedVoiceAudio;
  toolBadges?: ToolBadgeEvent[];
  tokenUsage?: MessageTokenUsage;
  staffSender?: {
    name: string;
    jobTitle: string;
    avatarUrl?: string;
  };
  replyTo?: ChatMessageReplyInfo;
  vaultRef?: ChatMessageVaultRef;
  nativeReasoning?: string;
  thoughtTokens?: number;
  isAmbientCameo?: boolean;
  cameoTriggerReason?: string;
  routedModel?: string;
  thinkingBudgetUsed?: number;
  thinkingUsed?: string;
  completedAt?: string;
}

export type ThinkingLevel = 'low' | 'medium' | 'high';

export type PresetBrainModel =
  | 'gemini-4-argon'
  | 'gemini-3.1-pro-preview'
  | 'gemini-2.5-pro'
  | 'gemini-3.8-flash'
  | 'gemini-3.5-flash-lite'
  | 'gemini-omni-1.1-flash'
  | 'deepseek-chat'
  | 'deepseek-reasoner'
  | 'glm-5'
  | 'kimi-k3'
  | 'glm-4-plus'
  | 'kimi-k2'
  | 'custom';

export type ChatMessage = Message;
export type {
  MessageTokenUsage,
  ToolBadgeEvent,
  AttachedImageItem,
  AttachedVoiceAudio,
  ChatMessageReplyInfo,
  ChatMessageVaultRef,
};


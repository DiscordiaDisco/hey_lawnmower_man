import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { ApothecaryIcon } from './ApothecaryIcon';

export interface WorkbenchChatInputHandle {
  getText: () => string;
  setText: (val: string) => void;
  appendText: (val: string) => void;
  clear: () => void;
  focus: () => void;
}

export interface WorkbenchChatInputProps {
  onSendMessage: (text: string) => void;
  isSending: boolean;
  hasAttachedImages: boolean;
  onUserActivity: () => void;
  placeholder?: string;
}

export const CHAT_DRAFT_KEY = 'sanctuary_chat_draft';

export const WorkbenchChatInput = React.memo(
  forwardRef<WorkbenchChatInputHandle, WorkbenchChatInputProps>(function WorkbenchChatInput(
    {
      onSendMessage,
      isSending,
      hasAttachedImages,
      onUserActivity,
      placeholder = 'Message Argon...',
    },
    ref
  ) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [localText, setLocalText] = useState<string>(() => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return localStorage.getItem(CHAT_DRAFT_KEY) || '';
        }
      } catch {
        // ignore
      }
      return '';
    });

    React.useEffect(() => {
      if (textareaRef.current && localText) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getText: () => localText,
        setText: (val: string) => {
          setLocalText(val);
          try {
            if (val) {
              localStorage.setItem(CHAT_DRAFT_KEY, val);
            } else {
              localStorage.removeItem(CHAT_DRAFT_KEY);
            }
          } catch {
            // ignore
          }
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
          }
        },
        appendText: (val: string) => {
          setLocalText((prev) => {
            const next = prev.trim() ? `${prev.trim()} ${val}` : val;
            try {
              localStorage.setItem(CHAT_DRAFT_KEY, next);
            } catch {
              // ignore
            }
            return next;
          });
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
              textareaRef.current.style.height = 'auto';
              textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
            }
          }, 10);
        },
        clear: () => {
          setLocalText('');
          try {
            localStorage.removeItem(CHAT_DRAFT_KEY);
          } catch {
            // ignore
          }
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        },
        focus: () => {
          textareaRef.current?.focus();
        },
      }),
      [localText]
    );

    const handleSubmit = useCallback(
      (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = localText.trim();
        if (isSending || (!trimmed && !hasAttachedImages)) return;
        const textToSend = localText;
        setLocalText('');
        try {
          localStorage.removeItem(CHAT_DRAFT_KEY);
        } catch {
          // ignore
        }
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        onSendMessage(textToSend);
      },
      [localText, isSending, hasAttachedImages, onSendMessage]
    );

    // Android soft keyboard & desktop: Enter/Return always inserts a line break (\n).
    // Auto-send on Enter is completely removed so multi-line drafting never triggers accidental sends.
    // Messages are only dispatched when Hex explicitly taps the gilded Send button.

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setLocalText(val);
        try {
          if (val) {
            localStorage.setItem(CHAT_DRAFT_KEY, val);
          } else {
            localStorage.removeItem(CHAT_DRAFT_KEY);
          }
        } catch {
          // ignore
        }
        onUserActivity();
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
      },
      [onUserActivity]
    );

    return (
      <div className="flex items-center gap-1.5 w-full">
        <div className="flex-1 min-w-0">
          <label htmlFor="workbench-chat-input" className="sr-only">
            Message Argon
          </label>
          <textarea
            id="workbench-chat-input"
            ref={textareaRef}
            rows={1}
            value={localText}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full h-11 max-h-[120px] px-3 py-2.5 rounded-xl gilded-input-well text-sm sm:text-base font-serif-webtoon placeholder-[#8c7a65] resize-none leading-snug"
          />
        </div>

        {/* Right Metallic Gold Bevel Send Button with Crimson Heart Wax Seal Icon */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSending || (!localText.trim() && !hasAttachedImages)}
          data-testid="workbench-send-btn"
          aria-label="Send message"
          className="gilded-send-btn h-11 px-3.5 sm:px-4 rounded-xl flex items-center gap-1.5 text-xs sm:text-base font-serif-webtoon font-semibold disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
        >
          <ApothecaryIcon
            icon="send"
            row={1}
            col={2}
            xPct={10}
            yPct={52}
            size={20}
          />
          <span>{isSending ? '…' : 'Send'}</span>
        </button>
      </div>
    );
  })
);

export default WorkbenchChatInput;

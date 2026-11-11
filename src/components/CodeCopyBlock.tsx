import React, { useState } from 'react';
import { Copy, Check, Split } from 'lucide-react';
import { splitBlockUnderLimit, estimateMessageTokens } from '../utils/workbenchLogic';

interface CodeCopyBlockProps {
  code: string;
  language?: string;
}

const CHAR_LIMIT = 4500;

export const CodeCopyBlock: React.FC<CodeCopyBlockProps> = ({ code }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSplit, setIsSplit] = useState<boolean>(false);

  // Exact deterministic JavaScript string length (never estimated or hallucinated)
  const charCount = typeof code === 'string' ? code.length : String(code || '').length;
  // Deterministic token estimate matching Sanctuary token estimator
  const tokenEst = estimateMessageTokens(code);

  const isUnderLimit = charCount <= CHAR_LIMIT;
  const exceedsLimit = charCount > CHAR_LIMIT;
  const chunks = isSplit ? splitBlockUnderLimit(code, CHAR_LIMIT) : [code];

  const handleCopy = async (textToCopy: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedIndex(idx);
    window.setTimeout(() => {
      setCopiedIndex((prev) => (prev === idx ? null : prev));
    }, 1500);
  };

  return (
    <div className="my-2 rounded-xl border border-[#8e6d3b]/80 bg-[#0d0a08]/98 overflow-hidden shadow-md select-text max-w-full">
      {/* ONLY ONE Single Compact, Clean Header Bar (Never clips on narrow 360px Android) */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-[#1b1410] border-b border-[#6b5331]/70 text-xs text-[#cbb693] overflow-hidden select-none">
        {/* Left/Center: Exact Deterministic Character + Token Count Badge (Full row width priority, never clips) */}
        <div
          data-testid="code-block-char-badge"
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold tracking-tight border tabular-nums whitespace-nowrap shrink-0 ${
            isUnderLimit
              ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
              : 'bg-rose-950/70 border-rose-500/80 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
          }`}
          title={
            isUnderLimit
              ? `Safe Android Prompt: exact ${charCount.toLocaleString()} chars (~${tokenEst.toLocaleString()} tok), within 4,500 limit`
              : `Exceeds Android Clipboard Limit: exact ${charCount.toLocaleString()} chars (~${tokenEst.toLocaleString()} tok, > 4,500 limit). Tap Split to break into safe chunks.`
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isUnderLimit
                ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]'
                : 'bg-rose-400 animate-pulse shadow-[0_0_5px_#f43f5e]'
            }`}
          />
          <span>
            {charCount.toLocaleString()} chars · ~{tokenEst.toLocaleString()} tok
          </span>
        </div>

        {/* Right Side: Split Toggle (if >4.5kc) + Compact Square Icon-Only Copy Button (w-7 h-7) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {exceedsLimit && (
            <button
              type="button"
              onClick={() => setIsSplit((prev) => !prev)}
              aria-label={isSplit ? 'Merge code block parts' : 'Split code block under 4,500 characters'}
              className="min-h-[28px] px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold tracking-tight gilded-pill-btn cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
              title={isSplit ? 'Merge back to single block' : 'Split under 4,500 chars for safe Android copy'}
            >
              <Split className="w-3 h-3 text-[#d4af37]" />
              <span>{isSplit ? 'Merge' : 'Split'}</span>
            </button>
          )}

          {/* Compact Square Icon-Only Copy Button: w-7 h-7, swaps to checkmark for 1.5s */}
          <button
            type="button"
            onClick={() => handleCopy(code, 0)}
            aria-label="Copy code block"
            title={copiedIndex === 0 ? 'Copied to clipboard' : 'Copy code block'}
            className={`w-7 h-7 min-w-[28px] min-h-[28px] p-0 rounded-md flex items-center justify-center transition-all cursor-pointer select-none shrink-0 ${
              copiedIndex === 0
                ? 'bg-emerald-700 text-emerald-100 border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                : 'gilded-pill-btn hover:border-[#d4af37] text-[#d4af37]'
            }`}
          >
            {copiedIndex === 0 ? (
              <Check className="w-4 h-4 text-emerald-200" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Code Content — Direct pre block, zero redundant duplicate buttons */}
      {chunks.length > 1 ? (
        <div className="divide-y divide-[#594327]/40">
          {chunks.map((chunk, idx) => {
            const isCopied = copiedIndex === idx + 1;
            const chunkCount = chunk.length;
            const chunkTokens = estimateMessageTokens(chunk);
            const chunkUnderLimit = chunkCount <= CHAR_LIMIT;
            return (
              <div key={idx} className="p-2 sm:p-2.5">
                <div className="flex items-center justify-between gap-1.5 mb-1.5 text-[11px] font-mono text-[#cbb693]">
                  <span className="font-semibold text-[#f2e2c4]">
                    Part {idx + 1} of {chunks.length}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] tabular-nums font-bold whitespace-nowrap ${
                        chunkUnderLimit ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {chunkCount.toLocaleString()} chars · ~{chunkTokens.toLocaleString()} tok
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(chunk, idx + 1)}
                      aria-label={`Copy Part ${idx + 1}`}
                      title={isCopied ? 'Copied' : `Copy Part ${idx + 1}`}
                      className={`w-7 h-7 min-w-[28px] min-h-[28px] p-0 rounded-md flex items-center justify-center cursor-pointer select-none shrink-0 ${
                        isCopied
                          ? 'bg-emerald-700 text-white border border-emerald-400'
                          : 'gilded-pill-btn text-[#d4af37]'
                      }`}
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <pre className="text-xs sm:text-[13px] font-mono text-[#efe4d2] whitespace-pre-wrap break-words leading-relaxed max-h-[320px] overflow-y-auto p-2 rounded-lg bg-[#090706] border border-[#594327]/60">
                  <code>{chunk}</code>
                </pre>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-2 sm:p-2.5">
          <pre className="text-xs sm:text-[13px] font-mono text-[#efe4d2] whitespace-pre-wrap break-words leading-relaxed max-h-[320px] overflow-y-auto p-2 rounded-lg bg-[#090706] border border-[#594327]/60">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

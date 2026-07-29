"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SuggestionGroup } from "@/agents/first/parse-agent-reply";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SHORTCUT_KEYS = "abcdefghijklmnopqrstuvwxyz";

type ChoiceCardProps = {
  suggestions: SuggestionGroup[];
  groupIdx: number; // first unanswered group — used to init displayIdx
  onSelect: (option: string, fromGroupIdx: number) => void;
  disabled: boolean;
};

export function ChoiceCard({ suggestions, groupIdx, onSelect, disabled }: ChoiceCardProps) {
  const [displayIdx, setDisplayIdx] = useState(groupIdx);
  const displayIdxRef = useRef(displayIdx);

  // Keep ref in sync so the document keydown closure always has the latest value
  useEffect(() => {
    displayIdxRef.current = displayIdx;
  }, [displayIdx]);

  // When the first-unanswered group advances (e.g. after a single-group answer), follow it
  // and blur any focused input so document-level shortcuts work immediately
  useEffect(() => {
    setDisplayIdx(groupIdx);
    (document.activeElement as HTMLElement)?.blur();
  }, [groupIdx]);

  // Also blur on initial mount so shortcuts work from the start
  useEffect(() => {
    (document.activeElement as HTMLElement)?.blur();
  }, []);

  // Document-level keyboard shortcuts — work regardless of which element has focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Don't intercept when the user is typing in an input or textarea
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      )
        return;

      const idx = SHORTCUT_KEYS.indexOf(e.key.toLowerCase());
      const currentGroup = suggestions[displayIdxRef.current];
      if (idx >= 0 && currentGroup && idx < currentGroup.options.length) {
        e.preventDefault();
        onSelect(currentGroup.options[idx], displayIdxRef.current);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [disabled, suggestions, onSelect]);

  if (suggestions.length === 0) return null;

  const total = suggestions.length;
  const group = suggestions[displayIdx];
  if (!group) return null;

  const options = group.options;
  const question = group.question;

  const handleClick = (option: string) => {
    if (disabled) return;
    onSelect(option, displayIdx);
  };

  return (
    <div className="flex flex-col items-center bg-seymour-canvas px-6 pb-2">
      <div className="w-full max-w-chat-content overflow-hidden rounded-xl border border-seymour-border bg-seymour-surface-2">
        {/* Header: question text + optional pagination */}
        <div className="flex items-center justify-between gap-4 border-b border-seymour-border/50 px-4 py-3">
          <span className="flex-1 text-body-sm font-medium text-seymour-text">
            {question ?? "How does this look?"}
          </span>
          {total > 1 && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setDisplayIdx((i) => Math.max(0, i - 1))}
                disabled={displayIdx === 0 || disabled}
                className="flex h-6 w-6 items-center justify-center rounded text-seymour-text/50 transition hover:text-seymour-text focus:outline-none focus-visible:ring-2 focus-visible:ring-seymour-accent disabled:opacity-30"
                aria-label="Previous question"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="min-w-[3rem] text-center text-label text-seymour-text/50">
                {displayIdx + 1} of {total}
              </span>
              <button
                type="button"
                onClick={() => setDisplayIdx((i) => Math.min(total - 1, i + 1))}
                disabled={displayIdx === total - 1 || disabled}
                className="flex h-6 w-6 items-center justify-center rounded text-seymour-text/50 transition hover:text-seymour-text focus:outline-none focus-visible:ring-2 focus-visible:ring-seymour-accent disabled:opacity-30"
                aria-label="Next question"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Option rows */}
        {options.map((option, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(option)}
            disabled={disabled}
            className="flex w-full items-center gap-3 border-b border-seymour-border/50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-seymour-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-seymour-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-seymour-text/10 text-label font-medium text-seymour-text">
              {LETTERS[i]}
            </span>
            <span className="flex-1 text-body-sm text-seymour-text">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

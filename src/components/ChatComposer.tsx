"use client";

import { useRef, useEffect } from "react";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: (overrideText?: string) => void;
  disabled?: boolean;
  suggestions?: string[][];
};

const MAX_LINES = 6;
const LINE_HEIGHT = 22;
const MIN_HEIGHT = LINE_HEIGHT;
const MAX_HEIGHT = MAX_LINES * LINE_HEIGHT;

const SHORTCUT_KEYS = "abcdefghijklmnopqrstuvwxyz";

export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  suggestions = [],
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Derive which suggestion group to answer next based on numbered answers already in the input.
  // When the user deletes a numbered answer, groupIdx automatically steps back.
  const groupIdx = suggestions.length > 1
    ? Math.min(
        value.split('\n').filter(line => /^\d+\. /.test(line)).length,
        suggestions.length
      )
    : 0;

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    ta.style.height = "auto";
    const nextHeight = Math.min(ta.scrollHeight, MAX_HEIGHT);
    ta.style.height = `${Math.max(nextHeight, MIN_HEIGHT)}px`;
    ta.style.overflowY = ta.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);

  // Refocus textarea when disabled transitions from true → false (after send completes)
  const prevDisabledRef = useRef(disabled);
  useEffect(() => {
    if (prevDisabledRef.current && !disabled) {
      textareaRef.current?.focus();
    }
    prevDisabledRef.current = disabled;
  }, [disabled]);

  // Cmd+A / Ctrl+A: intercept at capture phase so the browser never gets it,
  // then select only the textarea content.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "a" && (e.metaKey || e.ctrlKey) && document.activeElement === ta) {
        e.preventDefault();
        ta.select();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
      return;
    }

    // Suggestion shortcut: single letter, no modifiers
    const currentGroup = suggestions[groupIdx];
    if (
      currentGroup &&
      currentGroup.length > 0 &&
      !disabled &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      e.key.length === 1
    ) {
      const idx = SHORTCUT_KEYS.indexOf(e.key.toLowerCase());
      if (idx >= 0 && idx < currentGroup.length) {
        e.preventDefault();
        const answer = currentGroup[idx];
        const numberedAnswer = suggestions.length > 1 ? `${groupIdx + 1}. ${answer}` : answer;
        const next = value.trim() ? `${value.trim()}\n${numberedAnswer}` : numberedAnswer;
        onChange(next);
        textareaRef.current?.focus();
      }
    }
  };

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="flex flex-col items-center bg-seymour-canvas px-6 pb-4 pt-2">
      <div className="flex w-full max-w-chat-content items-end gap-2.5 rounded border border-seymour-border bg-seymour-surface-2 px-4 py-2.5 focus-within:ring-2 focus-within:ring-seymour-accent">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Seymour"
          rows={1}
          disabled={disabled}
          autoFocus
          className="flex-1 resize-none bg-transparent py-0.5 text-body-sm leading-[22px] text-seymour-text placeholder:text-seymour-text/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Message input"
        />
        <button
          type="button"
          onClick={() => onSend()}
          disabled={!canSend}
          className={`mb-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-seymour-text text-seymour-surface-2 transition-opacity focus:outline-none focus:ring-2 focus:ring-seymour-accent disabled:cursor-not-allowed ${canSend ? "opacity-100" : "opacity-50"}`}
          aria-label="Send message"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

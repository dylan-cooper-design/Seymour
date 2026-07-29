"use client";

import { useRef, useEffect } from "react";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: (overrideText?: string) => void;
  disabled?: boolean;
};

const MAX_LINES = 6;
const LINE_HEIGHT = 22;
const MIN_HEIGHT = LINE_HEIGHT;
const MAX_HEIGHT = MAX_LINES * LINE_HEIGHT;

export function ChatComposer({ value, onChange, onSend, disabled = false }: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Focus on mount (programmatic, not the autoFocus prop, to satisfy jsx-a11y/no-autofocus)
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

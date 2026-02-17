"use client";

import { useRef, useEffect } from "react";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

const MAX_LINES = 6;
const LINE_HEIGHT = 22;
const MIN_HEIGHT = LINE_HEIGHT;
const MAX_HEIGHT = MAX_LINES * LINE_HEIGHT;

export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled = false,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    ta.style.height = "auto";
    const nextHeight = Math.min(ta.scrollHeight, MAX_HEIGHT);
    ta.style.height = `${Math.max(nextHeight, MIN_HEIGHT)}px`;
    ta.style.overflowY = ta.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);

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
    <div className="border-t border-[#302f2d] bg-[#1c1d1f] p-6">
      <div className="mx-auto flex w-full max-w-[720px] items-center gap-[10px] rounded-2xl border border-[#302f2d] bg-[#232426] p-6 focus-within:ring-2 focus-within:ring-[#d4b774]">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Seymour"
          rows={1}
          disabled={disabled}
          className="min-h-[22px] flex-1 resize-none bg-transparent text-sm leading-[22px] text-[#e3e2e1] placeholder:text-[#e3e2e1]/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Message input"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="flex size-6 shrink-0 items-center justify-center self-end rounded-full bg-[#e3e2e1]/50 text-[#232426] transition-opacity focus:outline-none focus:ring-2 focus:ring-[#d4b774] disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Send message"
        >
          <span className="text-sm leading-none">↑</span>
        </button>
      </div>
    </div>
  );
}

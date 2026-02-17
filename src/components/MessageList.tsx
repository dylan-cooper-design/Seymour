"use client";

import { forwardRef } from "react";
import type { ThreadMessage } from "@/types/navigation";
import { MessageBubble } from "./MessageBubble";

type MessageListProps = {
  messages: ThreadMessage[];
  isStreaming?: boolean;
  onStopGenerating?: () => void;
  onScroll?: () => void;
};

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  function MessageList(
    { messages, isStreaming = false, onStopGenerating, onScroll },
    ref
  ) {
    return (
      <div
        ref={ref}
        onScroll={onScroll}
        className="flex w-full max-w-[744px] flex-1 flex-col gap-6 overflow-y-auto px-0 pb-6 pt-16"
        role="log"
        aria-live="polite"
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            text={msg.text}
            state={msg.state}
          />
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={onStopGenerating}
              className="rounded-full border border-[#3f3e3a] px-3 py-1 text-xs text-[#e3e2e1]/80 transition hover:border-[#d4b774] hover:text-[#e3e2e1] focus:outline-none focus:ring-2 focus:ring-[#d4b774]/60"
            >
              Stop generating
            </button>
          </div>
        )}
      </div>
    );
  }
);

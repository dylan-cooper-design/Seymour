"use client";

import { forwardRef } from "react";
import type { ThreadMessage } from "@/types/navigation";
import { MessageBubble } from "./MessageBubble";
import { UserMessage } from "./UserMessage";

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
        className="flex w-full max-w-message-list flex-1 flex-col gap-6 overflow-y-auto px-6 pb-8 pt-12"
        role="log"
        aria-live="polite"
      >
        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserMessage key={msg.id} text={msg.text} />
          ) : (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              text={msg.text}
              state={msg.state}
            />
          )
        )}
        {isStreaming && (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={onStopGenerating}
              className="rounded-full border border-seymour-border-subtle px-3 py-1 text-label text-seymour-text/80 transition hover:border-seymour-accent hover:text-seymour-text focus:outline-none focus:ring-2 focus:ring-seymour-accent/60"
            >
              Stop generating
            </button>
          </div>
        )}
      </div>
    );
  }
);

"use client";

import { forwardRef } from "react";
import type { ProjectTree } from "@/types/project";
import type { ThreadMessage } from "@/types/navigation";
import type { ProposalRecord } from "@/types/tree-patch";
import { MessageBubble } from "./MessageBubble";
import { UserMessage } from "./UserMessage";

type MessageListProps = {
  messages: ThreadMessage[];
  tree: ProjectTree;
  isStreaming?: boolean;
  onStopGenerating?: () => void;
  onScroll?: () => void;
  onProposalAccept?: (messageId: string, proposal: ProposalRecord) => void;
  onProposalReject?: (messageId: string, proposalId: string) => void;
};

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(function MessageList(
  {
    messages,
    tree,
    isStreaming = false,
    onStopGenerating,
    onScroll,
    onProposalAccept,
    onProposalReject,
  },
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
            proposals={msg.proposals}
            tree={tree}
            onProposalAccept={
              onProposalAccept && ((proposal) => onProposalAccept(msg.id, proposal))
            }
            onProposalReject={
              onProposalReject && ((proposalId) => onProposalReject(msg.id, proposalId))
            }
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
});

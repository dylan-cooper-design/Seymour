"use client";

/**
 * The right panel's bottom half: past chat sessions tagged to the exact
 * selected node (not its descendants) — see the chat-centric layout spec's
 * "Chat session model" section.
 */

import type { ChatSession } from "@/types/navigation";
import { SectionLabel } from "@/components/ui/SectionLabel";

type ChatHistoryPanelProps = {
  /** Already filtered to the selected node and sorted most-recent-first. */
  sessions: ChatSession[];
  activeSessionId: string | null;
  onOpenSession: (sessionId: string) => void;
};

function sessionPreview(session: ChatSession): string {
  const firstUserMessage = session.messages.find((m) => m.role === "user");
  if (firstUserMessage?.text) return firstUserMessage.text;
  const firstMessage = session.messages[0];
  return firstMessage ? firstMessage.text.replace(/\*\*/g, "") : "New chat";
}

function relativeTime(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function ChatHistoryPanel({
  sessions,
  activeSessionId,
  onOpenSession,
}: ChatHistoryPanelProps) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-6">
      <SectionLabel>History</SectionLabel>

      {sessions.length === 0 ? (
        <p className="text-body-sm text-seymour-text/40">
          No conversations have written to this node yet.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onOpenSession(session.id)}
                className={`flex flex-col gap-0.5 rounded border px-3 py-2 text-left transition ${
                  isActive
                    ? "border-seymour-accent bg-seymour-surface-2"
                    : "border-transparent hover:border-seymour-border hover:bg-seymour-surface-2"
                }`}
              >
                <span className="line-clamp-2 text-body-sm text-seymour-text">
                  {sessionPreview(session)}
                </span>
                <span className="text-label-sm text-seymour-text/50">
                  {relativeTime(session.updatedAt)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

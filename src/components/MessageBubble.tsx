import type { MessageState } from "@/types/navigation";

type MessageBubbleProps = {
  role: "user" | "assistant";
  text: string;
  state?: MessageState;
};

export function MessageBubble({ role, text, state }: MessageBubbleProps) {
  const isUser = role === "user";
  const showTypingIndicator = !isUser && state === "streaming" && text.length === 0;
  const statusText =
    state === "cancelled" ? "Stopped" : state === "error" ? "Connection issue" : null;

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      data-role={role}
    >
      {isUser ? (
        <div className="max-w-bubble rounded border border-seymour-accent bg-seymour-border px-6 py-4 text-seymour-text">
          <p className="whitespace-pre-wrap text-right text-body-sm">
            {text}
          </p>
        </div>
      ) : (
        <div className="max-w-full">
          {showTypingIndicator ? (
            <div className="flex items-center gap-1 pt-1 text-seymour-text/50" aria-label="Seymour is typing">
              <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:0ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
            </div>
          ) : (
            <p className="max-w-full whitespace-pre-wrap text-body-sm text-seymour-text">
              {text}
            </p>
          )}
          {statusText && (
            <p className="mt-1 text-label text-seymour-text/50">{statusText}</p>
          )}
        </div>
      )}
    </div>
  );
}

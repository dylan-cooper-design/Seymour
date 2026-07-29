import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MessageState } from "@/types/navigation";

type MessageBubbleProps = {
  role: "user" | "assistant";
  text: string;
  state?: MessageState;
};

type QAPair = { question: string; answer: string };

function parseQAPairs(text: string): QAPair[] | null {
  if (!text.trimStart().startsWith("Q: ")) return null;
  const blocks = text.trim().split(/\n\n+/);
  const pairs: QAPair[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const qLine = lines.find((l) => l.startsWith("Q: "));
    const aLine = lines.find((l) => l.startsWith("A: "));
    if (!qLine || !aLine) return null;
    pairs.push({ question: qLine.slice(3), answer: aLine.slice(3) });
  }
  return pairs.length > 0 ? pairs : null;
}

export function MessageBubble({ role, text, state }: MessageBubbleProps) {
  const isUser = role === "user";
  const showTypingIndicator = !isUser && state === "streaming" && text.length === 0;
  const statusText =
    state === "cancelled" ? "Stopped" : state === "error" ? "Connection issue" : null;

  const qaPairs = isUser ? parseQAPairs(text) : null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`} data-role={role}>
      {isUser ? (
        <div className="max-w-bubble rounded border border-seymour-accent bg-seymour-border px-6 py-4 text-seymour-text">
          {qaPairs ? (
            <div className="space-y-4 text-left">
              {qaPairs.map((pair, i) => (
                <div key={i}>
                  <p className="text-body-sm text-seymour-text/60">Q: {pair.question}</p>
                  <p className="text-body-sm text-seymour-text">A: {pair.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-right text-body-sm">{text}</p>
          )}
        </div>
      ) : (
        <div className="max-w-full">
          {showTypingIndicator ? (
            <div
              className="flex items-center gap-1 pt-1 text-seymour-text/50"
              aria-label="Seymour is typing"
            >
              <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:0ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="mb-3 text-body-sm text-seymour-text last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-seymour-white">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => (
                  <ul className="mb-3 list-disc space-y-1 pl-4 text-body-sm text-seymour-text last:mb-0">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 list-decimal space-y-1 pl-4 text-body-sm text-seymour-text last:mb-0">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-body-sm text-seymour-text">{children}</li>
                ),
                h1: ({ children }) => (
                  <h1 className="mb-2 text-header font-semibold text-seymour-white">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-2 text-label-sm font-semibold text-seymour-white">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-1 text-body-sm font-semibold text-seymour-white">{children}</h3>
                ),
                table: ({ children }) => (
                  <div className="mb-4 overflow-x-auto last:mb-0">
                    <table className="w-full border-collapse text-body-sm">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-seymour-surface">{children}</thead>,
                th: ({ children }) => {
                  const str = typeof children === "string" ? children : null;
                  const match = str?.match(/^([A-Z]) — (.+)$/);
                  if (match) {
                    return (
                      <th className="border border-seymour-border-subtle px-3 py-2 text-left">
                        <span className="flex items-center gap-2">
                          <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-seymour-border text-[10px] font-bold text-seymour-accent">
                            {match[1]}
                          </span>
                          <span className="text-label-sm font-medium text-seymour-text">
                            {match[2]}
                          </span>
                        </span>
                      </th>
                    );
                  }
                  return (
                    <th className="border border-seymour-border-subtle px-3 py-2 text-left text-label font-semibold text-seymour-accent">
                      {children}
                    </th>
                  );
                },
                td: ({ children }) => (
                  <td className="border border-seymour-border px-3 py-2 align-top text-body-sm text-seymour-text">
                    {children}
                  </td>
                ),
                code: ({ children }) => (
                  <code className="rounded bg-seymour-surface px-1 text-seymour-accent">
                    {children}
                  </code>
                ),
              }}
            >
              {text}
            </ReactMarkdown>
          )}
          {statusText && <p className="mt-1 text-label text-seymour-text/50">{statusText}</p>}
        </div>
      )}
    </div>
  );
}

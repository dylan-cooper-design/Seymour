"use client";

/**
 * Prose renderer for node notes and decision records in the detail panel.
 * Separate from MessageBubble's map, which is tuned for chat (decision tables,
 * streaming indicators) and shouldn't be perturbed by detail-panel styling.
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="text-body-sm leading-relaxed text-seymour-text">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-seymour-white">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="flex list-disc flex-col gap-1 pl-4 text-body-sm text-seymour-text">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="flex list-decimal flex-col gap-1 pl-4 text-body-sm text-seymour-text">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-seymour-accent underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-seymour-surface-2 px-1 py-0.5 text-label-sm">
              {children}
            </code>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

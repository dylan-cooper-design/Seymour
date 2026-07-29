// Utility functions for parsing agent replies.
// Extracted here so they can be unit-tested independently of the Next.js route.

import type { NavPatch } from "@/types/navigation";

export type ThreadMessage = { role: string; text: string };

export type SuggestionGroup = { question?: string; options: string[] };

export function normalizeSuggestions(raw: unknown): SuggestionGroup[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;

  // New format: { question?, options }[]
  if (typeof raw[0] === "object" && raw[0] !== null && !Array.isArray(raw[0])) {
    const groups = (raw as Record<string, unknown>[])
      .map((g) => {
        const opts = Array.isArray(g.options)
          ? (g.options as unknown[]).filter((s): s is string => typeof s === "string")
          : [];
        return {
          question: typeof g.question === "string" ? g.question : undefined,
          options: opts,
        };
      })
      .filter((g) => g.options.length > 0);
    return groups.length > 0 ? groups : undefined;
  }

  // Legacy format: string[][] — convert to SuggestionGroup[]
  if (Array.isArray(raw[0])) {
    const groups = (raw as unknown[][])
      .map((g) => ({
        options: Array.isArray(g)
          ? (g as unknown[]).filter((s): s is string => typeof s === "string")
          : [],
      }))
      .filter((g) => g.options.length > 0);
    return groups.length > 0 ? groups : undefined;
  }

  // Legacy flat string[] — treat as single group
  const flat = (raw as unknown[]).filter((s): s is string => typeof s === "string");
  return flat.length > 0 ? [{ options: flat }] : undefined;
}

export function extractJsonBlock(text: string): {
  cleanReply: string;
  navPatch?: NavPatch;
  suggestions?: SuggestionGroup[];
} {
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/gi;
  let navPatch: NavPatch | undefined;
  let suggestions: SuggestionGroup[] | undefined;
  let cleanReply = text;

  let match: RegExpExecArray | null;
  while ((match = jsonBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as { navPatch?: NavPatch; suggestions?: unknown };
      if (parsed.navPatch) navPatch = parsed.navPatch;
      if (parsed.suggestions) suggestions = normalizeSuggestions(parsed.suggestions) ?? suggestions;
    } catch {
      // skip malformed blocks
    }
  }

  cleanReply = text.replace(/```json\s*[\s\S]*?```/gi, "").trim() || text.trim();

  if (!navPatch && !suggestions) {
    return { cleanReply: text };
  }

  return { cleanReply, navPatch, suggestions };
}

export function createJsonBlockFilter() {
  let pending = "";
  let insideJsonBlock = false;
  const jsonFence = "```json";
  const fence = "```";

  const feed = (chunk: string): string => {
    pending += chunk;
    let output = "";

    while (pending.length > 0) {
      if (!insideJsonBlock) {
        const idx = pending.indexOf(jsonFence);
        if (idx === -1) {
          if (pending.length <= jsonFence.length - 1) break;
          output += pending.slice(0, -(jsonFence.length - 1));
          pending = pending.slice(-(jsonFence.length - 1));
          break;
        }

        output += pending.slice(0, idx);
        pending = pending.slice(idx + jsonFence.length);
        insideJsonBlock = true;
        continue;
      }

      const idx = pending.indexOf(fence);
      if (idx === -1) {
        if (pending.length > fence.length - 1) {
          pending = pending.slice(-(fence.length - 1));
        }
        break;
      }

      pending = pending.slice(idx + fence.length);
      insideJsonBlock = false;
    }

    return output;
  };

  const flush = (): string => {
    if (insideJsonBlock) {
      pending = "";
      return "";
    }
    const output = pending;
    pending = "";
    return output;
  };

  return { feed, flush };
}

export const SESSION_GREETING =
  "Hey I'm Seymour, your decision partner to help you reach your goals.\n\nWhat are you working on today?\n\nTell me your goal, and I'll create a plan to help you achieve it.";

export function buildApiMessages(
  threadMessages: ThreadMessage[],
  navContext: string,
  currentMessage: string
): Array<{ role: "user" | "assistant"; content: string }> {
  const firstUserIdx = threadMessages.findIndex((m) => m.role === "user");
  const history = firstUserIdx >= 0 ? threadMessages.slice(firstUserIdx) : [];
  const mappedHistory = history.map((m) => ({
    role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.text,
  }));
  const currentUserMessage = {
    role: "user" as const,
    content: `NAV_CONTEXT:\n${navContext}\n\nUSER_MESSAGE:\n${currentMessage}`,
  };

  if (mappedHistory.length === 0) {
    return [
      {
        role: "user",
        content:
          "[Context: New session. You have already sent your opening greeting. Do not repeat it. Respond directly to the user's message below.]",
      },
      { role: "assistant", content: SESSION_GREETING },
      currentUserMessage,
    ];
  }

  return [...mappedHistory, currentUserMessage];
}

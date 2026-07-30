// Utility functions for parsing agent replies.
// Extracted here so they can be unit-tested independently of the Next.js route.

import type { Proposal, StructurePatch } from "@/types/tree-patch";

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
  structure?: StructurePatch;
  proposals?: Proposal[];
  suggestions?: SuggestionGroup[];
} {
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/gi;
  let structure: StructurePatch | undefined;
  let proposals: Proposal[] | undefined;
  let suggestions: SuggestionGroup[] | undefined;

  let match: RegExpExecArray | null;
  while ((match = jsonBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as {
        structure?: StructurePatch;
        proposals?: unknown;
        suggestions?: unknown;
      };
      if (parsed.structure) structure = parsed.structure;
      if (Array.isArray(parsed.proposals) && parsed.proposals.length > 0) {
        proposals = parsed.proposals as Proposal[];
      }
      if (parsed.suggestions) suggestions = normalizeSuggestions(parsed.suggestions) ?? suggestions;
    } catch {
      // skip malformed blocks
    }
  }

  const cleanReply = text.replace(/```json\s*[\s\S]*?```/gi, "").trim() || text.trim();

  if (!structure && !proposals && !suggestions) {
    return { cleanReply: text };
  }

  return { cleanReply, structure, proposals, suggestions };
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

export function buildApiMessages(
  threadMessages: ThreadMessage[],
  projectContext: string,
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
    content: `PROJECT_CONTEXT:\n${projectContext}\n\nUSER_MESSAGE:\n${currentMessage}`,
  };

  return [...mappedHistory, currentUserMessage];
}

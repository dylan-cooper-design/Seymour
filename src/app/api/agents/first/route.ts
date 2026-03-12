import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSeymourInstructions } from "../../../../agents/first/prompt";
import type { NavModel, NavPatch } from "@/types/navigation";


function normalizeSuggestions(raw: unknown): string[][] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  // Already grouped: string[][]
  if (Array.isArray(raw[0])) {
    const groups = (raw as unknown[][]).map((g) =>
      Array.isArray(g) ? (g as unknown[]).filter((s): s is string => typeof s === "string") : []
    ).filter((g) => g.length > 0);
    return groups.length > 0 ? groups : undefined;
  }
  // Flat string[] — treat as a single group
  const flat = (raw as unknown[]).filter((s): s is string => typeof s === "string");
  return flat.length > 0 ? [flat] : undefined;
}

function extractJsonBlock(text: string): { cleanReply: string; navPatch?: NavPatch; suggestions?: string[][] } {
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/i;
  const match = text.match(jsonBlockRegex);
  if (!match?.[1]) {
    return { cleanReply: text };
  }

  try {
    const parsed = JSON.parse(match[1]) as { navPatch?: NavPatch; suggestions?: unknown };
    return {
      cleanReply: text.replace(jsonBlockRegex, "").trim() || text.trim(),
      navPatch: parsed.navPatch,
      suggestions: normalizeSuggestions(parsed.suggestions),
    };
  } catch {
    return { cleanReply: text };
  }
}

function toSseData(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function createJsonBlockFilter() {
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

type ThreadMessage = { role: string; text: string };

// Synthetic first turn — mirrors the UI greeting so the model knows it has
// already asked "What are you working on?" and should not repeat it.
const SESSION_GREETING =
  "Hey I'm Seymour, your decision partner to help you reach your goals.\n\nWhat are you working on today?\n\nTell me your goal, and I'll create a plan to help you achieve it.";

function buildApiMessages(
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

  // Only inject the synthetic greeting when there is no prior user message.
  // The branches are mutually exclusive: we never both inject synthetic AND
  // append threadMessages. When history exists, the model has full context.
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

function sseResponse(build: (controller: ReadableStreamDefaultController, encoder: TextEncoder) => Promise<void>) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      async start(controller) {
        await build(controller, encoder);
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    }
  );
}


export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = (body?.message ?? "").trim();
    const navModel = (body?.navModel ?? null) as NavModel | null;
    const activeNavItemId = (body?.activeNavItemId ?? "").trim();
    const threadMessages = (body?.threadMessages ?? []) as ThreadMessage[];

    if (!message) {
      return NextResponse.json(
        { reply: "Please enter a message.", ok: false },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { reply: "Agent error: Missing Anthropic API key.", ok: false },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey, maxRetries: 2, timeout: 25_000 });

    const navContext = navModel
      ? JSON.stringify({ activeNavItemId, navModel })
      : "{}";

    const apiMessages = buildApiMessages(threadMessages, navContext, message);

    const stream = client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: getSeymourInstructions(),
      messages: apiMessages,
    });

    return sseResponse(async (controller, encoder) => {
      let rawReply = "";
      let seq = 0;
      const filter = createJsonBlockFilter();

      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(toSseData(payload)));
      };

      try {
        for await (const event of stream) {
          if (event.type !== "content_block_delta") continue;
          if (!("delta" in event) || event.delta.type !== "text_delta") continue;

          const chunk = event.delta.text ?? "";
          if (!chunk) continue;
          rawReply += chunk;

          const visibleChunk = filter.feed(chunk);
          if (!visibleChunk) continue;
          send({ type: "text", content: visibleChunk, seq });
          seq += 1;
        }

        const trailingChunk = filter.flush();
        if (trailingChunk) {
          send({ type: "text", content: trailingChunk, seq });
          seq += 1;
        }

        const { navPatch, suggestions } = extractJsonBlock(rawReply);
        if (navPatch) {
          send({ type: "nav_patch", content: navPatch });
        }
        if (suggestions && suggestions.length > 0) {
          send({ type: "suggestions", content: suggestions });
        }

        send({ type: "done" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown stream error";
        send({ type: "error", message: `Agent error: ${msg}` });
      }
    });
  } catch (err) {
    if (err instanceof Anthropic.APIConnectionError) {
      return NextResponse.json(
        {
          reply: "Agent error: Could not reach Anthropic. Check your internet connection and API key.",
          ok: false,
        },
        { status: 502 }
      );
    }

    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { reply: `Agent error: ${msg}`, ok: false },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSeymourInstructions } from "../../../../agents/first/prompt";
import type { ProjectTree } from "@/types/project";
import {
  extractJsonBlock,
  createJsonBlockFilter,
  buildApiMessages,
} from "../../../../agents/first/parse-agent-reply";
import type { ThreadMessage } from "../../../../agents/first/parse-agent-reply";
import { createClient } from "@/lib/supabase/server";

function toSseData(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function sseResponse(
  build: (controller: ReadableStreamDefaultController, encoder: TextEncoder) => Promise<void>
) {
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ reply: "Unauthorized.", ok: false }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const message = (body?.message ?? "").trim();
    const tree = (body?.tree ?? null) as ProjectTree | null;
    const activeNodeId = (body?.activeNodeId ?? "").trim();
    const threadMessages = (body?.threadMessages ?? []) as ThreadMessage[];

    if (!message) {
      return NextResponse.json({ reply: "Please enter a message.", ok: false }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { reply: "Agent error: Missing Anthropic API key.", ok: false },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey, maxRetries: 2, timeout: 25_000 });

    const projectContext = tree ? JSON.stringify({ activeNodeId, tree }) : "{}";

    const apiMessages = buildApiMessages(threadMessages, projectContext, message);

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
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

        const { structure, proposals, suggestions } = extractJsonBlock(rawReply);
        if (structure) {
          send({ type: "structure", content: structure });
        }
        if (proposals && proposals.length > 0) {
          send({ type: "proposals", content: proposals });
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
          reply:
            "Agent error: Could not reach Anthropic. Check your internet connection and API key.",
          ok: false,
        },
        { status: 502 }
      );
    }

    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ reply: `Agent error: ${msg}`, ok: false }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SEYMOUR_INSTRUCTIONS } from "../../../../agents/first/prompt";
import { generateMilestonesAndDecisions } from "@/lib/planning/generate-plan";
import type { NavModel, NavPatch } from "@/types/navigation";

const GOAL_THREAD_ID = "goal-definition";

function hasNoMilestones(navModel: NavModel | null): boolean {
  if (!navModel?.groups?.length) return true;
  const count = navModel.groups.reduce((sum, g) => sum + (g.items?.length ?? 0), 0);
  return count === 0;
}

function isGoalMessage(
  message: string,
  activeNavItemId: string,
  navModel: NavModel | null
): boolean {
  return (
    activeNavItemId === GOAL_THREAD_ID &&
    hasNoMilestones(navModel) &&
    message.trim().length > 0
  );
}

function extractNavPatch(text: string): { cleanReply: string; navPatch?: NavPatch } {
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/i;
  const match = text.match(jsonBlockRegex);
  if (!match?.[1]) {
    return { cleanReply: text };
  }

  try {
    const parsed = JSON.parse(match[1]) as { navPatch?: NavPatch };
    return {
      cleanReply: text.replace(jsonBlockRegex, "").trim() || text.trim(),
      navPatch: parsed.navPatch,
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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = (body?.message ?? "").trim();
    const navModel = (body?.navModel ?? null) as NavModel | null;
    const activeNavItemId = (body?.activeNavItemId ?? "").trim();
    if (!message) {
      return NextResponse.json(
        { reply: "Please enter a message.", ok: false },
        { status: 400 }
      );
    }

    if (isGoalMessage(message, activeNavItemId, navModel)) {
      const { milestones } = generateMilestonesAndDecisions(message);
      const firstGroupId = navModel?.groups?.[0]?.id ?? "valuable";
      const navPatch: NavPatch = {
        setProjectName: message.slice(0, 80).trim(),
        clearAllItemsBeforeAdd: true,
        addMilestones: milestones.map((m) => ({
          id: m.id,
          groupId: firstGroupId,
          label: m.title,
          status: "incomplete-decision" as const,
          objective: m.objective,
          decisions: m.decisions,
        })),
        setActiveNavItemId: milestones[0]?.id,
      };
      const confirmation = `Current goal: ${message.trim()}\n\nI created a milestone plan with ${milestones.length} milestones. Select a milestone to continue.`;

      const encoder = new TextEncoder();
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(toSseData({ type: "text", content: confirmation, seq: 0 })));
            controller.enqueue(encoder.encode(toSseData({ type: "nav_patch", content: navPatch })));
            controller.enqueue(encoder.encode(toSseData({ type: "done" })));
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

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { reply: "Agent error: Missing Anthropic API key.", ok: false },
        { status: 500 }
      );
    }

    const client = new Anthropic({
      apiKey,
      maxRetries: 2,
      timeout: 20_000,
    });

    const navContext = navModel
      ? JSON.stringify({
          activeNavItemId,
          navModel,
        })
      : "{}";

    const stream = client.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 800,
      system: SEYMOUR_INSTRUCTIONS,
      messages: [
        {
          role: "user",
          content: `NAV_CONTEXT:\n${navContext}\n\nUSER_MESSAGE:\n${message}`,
        },
      ],
    });

    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
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

            const { navPatch } = extractNavPatch(rawReply);
            if (navPatch) {
              send({ type: "nav_patch", content: navPatch });
            }

            send({ type: "done" });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown stream error";
            send({ type: "error", message: `Agent error: ${message}` });
          } finally {
            controller.close();
          }
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
    return NextResponse.json(
      { reply: `Agent error: ${msg}`, ok: false },
      { status: 500 }
    );
  }
}
# Sub-agents design

## Overview

Seymour today is a single stateful agent (`src/agents/first/`) that owns the entire conversation: goal clarification → outline → phase entry → decisions, with nav-tree side effects (`navPatch`). This spec adds **on-demand sub-agents** the user can call at any point in that flow to get a different kind of thinking — starting with a critic and an ideator — without disturbing Seymour's own state machine.

## Goals

- Let the user pressure-test or diverge on any message in the thread (their own or Seymour's) without leaving the conversation.
- Keep sub-agents cheap to add: each new one should be a prompt, not a new state machine.
- Keep Seymour aware of what a sub-agent said, so it can build on it in the next turn.

## Non-goals

- Sub-agents do not get their own multi-turn conversation or persistent state.
- Sub-agents do not write to the nav tree (`navPatch`) — only Seymour does.
- No natural-language routing in v1 (e.g. typing "poke holes in this" to auto-invoke Critic). Trigger is UI-only.
- No agent beyond Critic and Generator in v1.

## Architecture

Seymour remains the sole **orchestrator**: the only agent with multi-turn state, phase/decision sequencing, and nav authority. Sub-agents are **stateless, single-shot experts**: given a target message plus a slice of current context, they return one response and exit. They share a single runner rather than each getting Seymour's full agent scaffolding (own route, own state machine), because structurally every sub-agent call is the same shape — context in, one critique/ideation out — and only the system prompt differs.

## Sub-agent roster (v1)

**Critic** — pressure-tests the target message. Finds the weakest assumption, the likeliest failure mode, the counterargument that hasn't been raised. Does not propose a fix; its job is to surface risk, not resolve it.

**Generator** — diverges on the target message. Produces additional options/framings beyond what's currently on the table (more decision options, alternative phase structures, different ways to frame the goal). Does not rank or recommend — that stays Seymour's job.

Both are intentionally narrow: no premortem, no assumptions-audit, no research agent yet. Add those later only if Critic/Generator prove insufficient in practice — splitting a proven pattern is cheap, un-splitting a premature one is not.

## Trigger

A hover action row appears on any message in the thread (`MessageBubble`, both `role: "user"` and `role: "assistant"`), with two buttons: **"Pressure-test this"** and **"More options."** The target is always the message being hovered — no separate global invocation, no natural-language detection.

## Data flow

1. User clicks a trigger on a message. Client calls `POST /api/agents/subagents` with `{ agentId: "critic" | "generator", targetMessage: string, context: ItemDetail }`. `context` is the same `foundationDetail`/active-item slice (`ItemDetail`, `src/types/navigation.ts:50`) Seymour already receives — not full chat history — since the sub-agent's job doesn't require the whole thread.
2. The route runs the matching prompt (`src/agents/subagents/critic/prompt.ts` or `generator/prompt.ts`) through the shared single-shot runner and returns one response, no streaming required for v1.
3. Client appends the result to the thread's message array as a new entry distinguishable from user/assistant messages (a `subagent` role carrying `agentId`), and renders it as an inline card with a small label ("Critic" / "Generator") and distinct accent, in the same scroll as the rest of the thread.
4. Because it's stored in the same per-thread message array, the next time the user messages Seymour, this entry is part of the history sent to `/api/agents/first` — Seymour sees it as prior context without any special-casing beyond recognizing the label in the transcript.

### Data model change

`ThreadMessage.role` (`src/types/navigation.ts`) extends from `"user" | "assistant"` to `"user" | "assistant" | "subagent"`, with an added optional `agentId?: "critic" | "generator"` field. `MessageBubble` gains a render branch for `role === "subagent"` (distinct accent + label, reuses the existing markdown rendering path). The history mapper that builds the payload for `/api/agents/first` (`src/app/page.tsx:352`) needs to include subagent messages in a way Seymour's prompt can read as labeled context (e.g. prefixing text with `[Critic]: `) rather than silently dropping or mislabeling them as `assistant`.

## File structure

```
src/agents/
  first/                      # Seymour — unchanged
  subagents/
    critic/prompt.ts
    generator/prompt.ts
    run.ts                    # shared single-shot runner
src/app/api/agents/
  first/route.ts               # unchanged
  subagents/route.ts            # one route; takes { agentId, targetMessage, context }
```

One shared route instead of one per agent, since Critic and Generator are identical calls structurally — only the prompt differs. This deviates slightly from `docs/agents/README.md`'s "one folder per agent" convention (written for full stateful agents like Seymour); update that doc to note sub-agents are a lighter-weight category once this ships.

## Error handling

Sub-agent call failures render an inline error on the triggered card (consistent with existing chat error handling) with a retry action. They do not block or interfere with the main Seymour thread — the user can keep talking to Seymour while a sub-agent card shows an error.

## Testing

- Unit: prompt construction for each sub-agent (context slice → expected prompt shape), following the existing pattern in `src/agents/first/__tests__/`.
- Manual: trigger both agents on a decision-table message and an outline message; confirm the resulting card renders inline, is visually distinct, and that a subsequent Seymour reply reflects awareness of the sub-agent's content.

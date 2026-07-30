# Agents

Two categories, not a generic "one folder per agent" pattern. See `APPROACH.md` §1
and §3 for why: Seymour is the only agent with multi-turn state and tree-write
authority; everything else is a stateless lens invoked on a single message.

## Seymour (primary agent)

- `src/agents/first/` — `prompt.ts` (system instructions) and `parse-agent-reply.ts`
  (extracts `structure`/`proposals`/`suggestions` from a reply, plus the streaming
  JSON-block filter).
- Entry point: `src/app/api/agents/first/route.ts` (POST, streams via SSE).
- Owns the conversation, the five moves (Frame/Diverge/Critique/Decide/Check), and
  all writes to the project tree.

## Sub-agents (Critic, Generator)

Stateless, single-shot: given a target message plus a context slice, return one
response and exit. No multi-turn state, no tree-write authority. Specced in
`../docs/superpowers/specs/2026-07-29-subagents-design.md`; not yet implemented.

Planned structure:

```
src/agents/subagents/
  critic/prompt.ts
  generator/prompt.ts
  run.ts        # shared single-shot runner
```

One shared route (`src/app/api/agents/subagents/route.ts`) rather than one per
agent, since every sub-agent call is the same shape (context in, one
critique/ideation out) and only the prompt differs.

## Adding a new sub-agent

1. Add `src/agents/subagents/<name>/prompt.ts`.
2. Wire it into the shared runner and route — no new route, no new state machine.
3. Add it to the roster in `../docs/superpowers/specs/2026-07-29-subagents-design.md`
   (or a successor spec, once one exists).

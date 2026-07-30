# Seymour — Approach

How the app actually behaves. This is a living document — edit it in place as the
product evolves, don't append a history of changes. For why the app exists and who
it's for, see `FOUNDATIONS.md`; that document should rarely change, this one will
change often.

Update this doc whenever you change how Seymour behaves. If the code and this doc
disagree, one of them is wrong — fix it before moving on.

---

## 1. Shell

Cursor, for designers. Not a novel interface — a familiar one.

- Tree on the left (the project's folders, work areas, decisions, actions). Chat on
  the right. The node's document in the middle when there's something to show.
- Click a node to see its chats. Resume one, or start a new one.
- A chat belongs to exactly one node — that node is its context.
- Chat titles auto-generate from the first exchange.
- There is no separate "planning mode" or "planning chat." Planning is just what a
  conversation looks like when it's happening on a broad node (the project root, or
  Foundations). Same agent, same rules, different node.

**One agent, not a picker.** Seymour is always the agent in the thread. Specialist
behaviors (see Moves, below) are actions applied to a moment in the conversation, not
separate agents you switch into. Reasons this beats a picker:

- Picking the right specialist is often the decision you can't make yet — it costs
  attention at exactly the moment you're trying to think about the design.
- Switching agents breaks the thread: either the specialist doesn't have context, or
  you re-explain it.
- It breaks write ownership (see §4) — if you're "in" a specialist for twenty minutes,
  nothing is filing to the tree.

---

## 2. Context — what Seymour sees in any chat

Every chat gets the same assembly, scoped by the node's position in the tree:

- **Foundations, always** — problem statement, users, goals, constraints. This is
  what makes the Check move (§3) possible.
- **The current node** — label, objective, note.
- **Its ancestors** — e.g. "Password recovery / Error states" carries both levels.
- **Its siblings' resolved decisions** — what's already settled nearby.
- **This chat's history.**

Not included: other chats on the same node, other work areas' internals. The node's
position in the tree does the scoping — same principle as Cursor giving you the open
file plus what you `@`-mention, not the whole repo.

---

## 3. The moves

Five things Seymour can do. No "mode" — every message, Seymour is making one of these
moves, chosen by what the node and the conversation need, not by a stage the project
is in.

| Move         | What it does                                               | Fires when                                                   |
| ------------ | ---------------------------------------------------------- | ------------------------------------------------------------ |
| **Frame**    | Turns something vague into a specific, answerable question | A node is thin — a name with no real objective or content    |
| **Diverge**  | Widens the option space before narrowing                   | A question is sharp but only one answer is on the table      |
| **Critique** | Pressure-tests a direction, or an artifact brought in      | A leading option exists, or the user drops in a screen/link  |
| **Decide**   | Converges — records choice + rationale as a decision       | Options exist and have been compared                         |
| **Check**    | Holds new work against what's already been decided         | Continuously, especially right before a decision is recorded |

**Two ways a move gets invoked:**

1. **Seymour invokes and announces it.** "Before we narrow — let me widen this
   first." The user learns the moves exist by watching them used, not by reading a
   manual.
2. **The user invokes one, on any message.** A hover row on a message with two
   actions — **Widen** and **Poke holes**. Stateless, single-shot: takes the target
   message plus the node's context slice, returns one response, exits. Does not get
   its own multi-turn conversation and does not write to the tree. (This is the
   sub-agent design already specced in
   `docs/superpowers/specs/2026-07-29-subagents-design.md` — Critic and Generator.
   That spec is correct as written; the point of this doc is that those two actions
   are core to the loop, not a side feature.)

**Check is the move that makes this a design tool and not an organized chat app.** It
fires automatically before a decision is recorded, cross-referencing Foundations and
nearby resolved decisions. Example: _"Your stated success metric is recovery under 60
seconds. The full-page route adds a navigation step. Does that still hold?"_ This
only works because Foundations, decisions, and current work live in one store — it's
the payoff of the app being "one home," not a nice-to-have.

---

## 4. Write authority — who commits what

There are no stage gates ("approve this outline," "ready to start"). The funnel has
no fixed boundary between planning and doing — decisions and actions emerge as the
work happens, at whatever node they happen to surface. The one boundary that replaces
gates is **who writes what**:

- **Structure — Seymour writes freely.** Creating nodes, renaming, setting
  objectives, filing things into the right place. Low-stakes, easily undone. Shows up
  as a quiet inline line in the thread: _"Added 'Error states' under Password
  recovery."_
- **Substance — Seymour proposes, the user commits.** Anything that records the
  user's actual thinking — a resolved decision (choice, rationale, options
  considered), a problem statement, an action item — is presented as a card: accept,
  edit, or reject. The words that land in the document are the user's, or words the
  user explicitly approved.

Short version: **Seymour owns the filing, the user owns the reasoning.**

---

## 5. The honest map — what replaces stage gates

Without approval gates, the thing that stops the document from silently drifting from
reality is being able to see its true state at a glance. The tree must always tell
the truth. `NodeGlyph.tsx` renders node state — states it needs to support:

- **thin** — exists but has no objective or content yet
- **open** — has unresolved decisions
- **blocked** — has an action waiting on an unresolved decision
- **stale** — Check found a contradiction, or a decision predates a change to
  Foundations
- **settled** — resolved, actions done

Plus: exactly one node at a time is marked as the suggested next thing to work on.
Not a separate queue or screen — one row in the tree, leaning forward. The user picks
where to go; Seymour just points.

---

## 6. Implementation status

This doc describes target behavior, not current behavior. As of 2026-07-29:

- The data model (`src/types/project.ts` — folders / workstreams / decisions /
  actions) already matches this approach.
- The agent's actual prompt (`src/agents/first/prompt.ts`, ~430 lines) does **not**
  — it still runs the old phase/milestone/outline-approval sequence (Tier 1/Tier 2
  questions, full outline, phase entry, `navPatch` with `setGroups`/`addMilestones`).
  Rewriting this prompt to match §§3–5 above is the main outstanding work.
- The sub-agent trigger (§3, "user invokes one") is specced
  (`docs/superpowers/specs/2026-07-29-subagents-design.md`) but not yet wired to a
  hover row in `MessageBubble`.
- Multiple chats per node (§1) is not yet supported — `ThreadsByNodeId` is
  `Record<string, ThreadMessage[]>` (one thread per node). Needs to become
  `Record<string, Thread[]>` with each `Thread` carrying its own `id`, `title`, and
  `messages`.
- Node state glyphs (§5: thin / open / blocked / stale / settled) are not yet
  implemented — `NodeGlyph.tsx` exists but doesn't carry this state model yet.

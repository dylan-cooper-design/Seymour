# Chat-centric layout redesign

## Overview

Seymour's shell today (`src/app/page.tsx`) is tree (left, fixed) → doc (`DetailPanel`, middle, fixed 400px) → chat (right, fills remainder), matching `product/APPROACH.md` §1's stated intent ("Tree on the left... Chat on the right. The node's document in the middle"). This spec replaces that arrangement: chat becomes the dominant center pane, and a new right-hand panel holds both the doc and a chat-history list for the selected node. The left tree is unchanged.

The other real change bundled into this: chat stops being one continuous thread per workstream. Starting a new chat becomes a first-class, always-available action, and each chat session gets auto-tagged to whichever node(s) it actually writes to.

## Goals

- Chat is the primary workspace and gets the majority of screen width — not squeezed beside or layered thinly over anything else.
- Every node (once it's written to) has a reference trail of past conversations, visible without digging through tabs.
- Starting a new chat is always one click away, regardless of what's selected in the tree — never gated behind picking a node.
- Doc and chat-history stay visually and spatially unified (both live in one right-hand panel) since they're both "what I know about this node."

## Non-goals

- Not resizing the left tree's width or the right panel's total width in this pass — right panel keeps roughly today's ~400px; only the split _within_ it (doc vs. history) is new.
- Not fully specifying the chat-session data model (types, storage shape, migration from today's `ThreadsByNodeId`) — that's implementation-planning work. This spec fixes the shape and rules; the next phase designs the types.
- Not changing what doc content looks like or how it renders — still the existing `DetailPanel` content (objective/decision record/notes).
- Not solving multi-node tagging UI (a chat that writes to two different nodes shows up under both) beyond stating the rule — no special merged view.

## Layout

**Three columns**, left to right:

1. **Tree** (`Nav`/`NodeTree`) — unchanged. Always has something selected; there is no "nothing selected" state to design for (today's `initialSelection` already guarantees this).
2. **Chat** (center) — the active conversation. Full remaining width after the other two columns; no overlay, no drawer sharing this space with the doc.
3. **Right panel** — one column, split top/bottom by a **draggable divider**:
   - **Top: doc** — the selected node's objective/decision record/notes (same content `DetailPanel` renders today).
   - **Bottom: chat history** — sessions tagged to _that exact node_ (not its children), most recent first.
   - Each half scrolls independently. Default split ratio TBD visually (roughly two-thirds doc / one-third history is a reasonable starting point), user-draggable from there.

Rejected alternatives (for context, don't re-litigate without new information):

- _Chat as a floating/translucent overlay on the doc_ — rejected because chat needs substantial space as the primary workspace; an overlay that keeps the doc legible underneath necessarily starves chat of room.
- _Chat history moved to the left panel (with the tree)_ — rejected because the tree already needs full height for whole-project navigation as it grows, and stacking a second growing list under it recreates the same space competition the right-panel split was designed to solve. It also fragments "everything about this node" across both sides of the screen instead of keeping doc+history together.
- _Chat history behind a tab_ — rejected explicitly; history must be visibly present, not hidden behind a click.

## Chat session model

- New chat is always available regardless of tree selection — selecting a node scopes what the _right panel_ displays, it never scopes or gates what a new chat is about.
- A chat session gets **auto-tagged** to a node only when it actually writes to that node — i.e. a call to `applyStructurePatch` or `applyProposal` (`src/lib/tree/patch.ts`) targets it. Being merely discussed or referenced does not tag a chat; only a write does.
- A chat that never writes anywhere stays untagged and won't appear under any node's history.
- Selecting a node in the tree filters the history list to sessions tagged to **that exact node**, not descendants — selecting a parent workstream does not surface its child decisions'/actions' chats.

## Open questions for the planning phase

These are real gaps this spec intentionally leaves for `writing-plans` to resolve, not oversights to silently paper over:

1. **Thread ownership per node kind.** Today, only workstream nodes own a thread (`src/types/navigation.ts` — `ThreadsByNodeId` comment: "Only workstream nodes own a thread... Giving decisions their own threads would shatter one discussion into stubs"). The new tagging rule (tag whichever node a write targets) can tag a decision or action node directly, which is finer-grained than "thread lives on the workstream." Planning needs to resolve whether the _history list_ for a decision node shows chats that specifically wrote to it (a subset of its parent workstream's conversations), while the _active chat you type into_ still remains the parent workstream's thread — or whether something else is meant.
2. **Data model migration.** `ThreadsByNodeId` (`Record<nodeId, ThreadMessage[]>`, one array per node) needs to become a multi-session-per-node shape with tag metadata, and existing stored user state (`src/lib/storage.ts`) needs a migration path rather than silently dropping history on upgrade.
3. **Divider persistence.** Whether the right panel's doc/history split ratio should persist per-session (localStorage) or reset each load — not decided, low-stakes, pick one during planning.

## Testing

- Manual: confirm a chat that never writes to a node doesn't appear in any node's history; confirm a chat that writes to node X appears under X's history immediately after the write; confirm switching tree selection updates both doc and history panes together; confirm "new chat" is reachable from the chat pane regardless of current tree selection.
- Unit: extend `src/lib/tree/__tests__/patch.test.ts`-style coverage to whatever tagging function planning designs (given a patch/proposal, which node id(s) does it target).

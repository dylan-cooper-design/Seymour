# Flow Compass — Milestone Work & Decision Making

### 1. Valuable — Desired Outcome

The user wants to make progress on a specific milestone by thinking through it with AI assistance and landing on a clear decision. Success means they finish the conversation knowing what they've decided and why. They walk away with a resolved question, not just a longer chat log.

---

### 2. Usable — User Journey & Problems

> User wants to know what a milestone is actually about → Problem: milestone labels are short and lose context over time → System helps by showing a detail panel with objective, decisions, and rationale alongside the chat

> User wants to think through the problem → Problem: it's hard to reason alone about complex trade-offs → System helps by providing a scoped AI thread focused only on this milestone

> User wants to capture what they decided → Problem: decisions get buried in chat history → System helps by surfacing decisions in the detail panel, separate from the conversation

> User wants to move to the next milestone → Problem: it's easy to lose track of where they are across multiple milestones → System helps by keeping the sidebar visible with status indicators on each item

---

### 3. Practical — Interface Strategy

**Components in Play**

- `Nav` / `MilestoneTree` → milestone selection; status indicators show progress at a glance
- `DetailPanel` → shows the milestone's objective, decisions, and rationale; gives the user context before and during the conversation
- `MessageList` → the AI conversation scoped to the active milestone
- `ChatComposer` → input for the milestone conversation
- `SectionBlock` → renders individual detail sections (Context, Decision, Rationale, etc.) inside the panel

**Flow Mechanics**
- Selecting a milestone in the sidebar loads its thread in the chat and its detail content in the panel simultaneously
- The detail panel and chat panel are always in sync — they always reflect the same active milestone
- The detail panel is read-only for MVP; it reflects what the AI has captured, not a form the user edits directly

**Non-Negotiable Rules**
- The detail panel must only be visible when a milestone is active — never on the Foundation thread
- Switching milestones must immediately update both the chat thread and the detail panel
- Each milestone thread is isolated — messages from one milestone never appear in another
- The detail panel must show a clear empty state when no detail content exists yet

---

### 4. Out of Scope

- Editing decision content directly in the detail panel
- Marking milestones as complete from the UI
- AI writing to the detail panel via `nav_patch` (detail is currently static/mock)
- Reordering milestones

---

### 5. Assumptions

Assumption: A milestone's detail content is static for MVP — the AI does not update it mid-conversation.
Assumption: Status indicators on milestone items (`complete-decision`, `incomplete-decision`, `incomplete-action`) are set by the AI, not manually by the user.

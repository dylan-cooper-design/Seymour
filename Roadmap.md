# Seymour Development Roadmap

> **Goal:** Build a working MVP of Seymour that helps designers make better decisions through structured conversation.
>
> **Stack:** Next.js 15, TypeScript, Tailwind CSS, Radix UI (selective), Anthropic SDK
>
> **Last updated:** March 2, 2026

---

## How to use this file

This is your single source of truth for what to build and in what order. Work top to bottom within each phase. Check items off as you go.

When working with Claude Code, use this prompt template:

> Read docs/PRD.md for design system rules and project constraints. Read ROADMAP.md for the full plan. My current task is: [paste the next unchecked item]. Do only this task. Do not modify unrelated files. Do not move ahead to the next task. Flag any missing design tokens rather than hardcoding values.

---

## Phase 1: MVP Chat (current)

> Get a working chat loop: user sends a message, Claude responds, it looks right.

### Already done

- [x] Two-column layout (static sidebar + chat area)
- [x] Sidebar with Current Project header, Platform/Foundation item, helper text
- [x] Seymour conversation starter (three assistant messages as empty state)
- [x] ChatInput composer with "Message Seymour" placeholder and send button

### Remaining

- [x] **1.1** Create UserMessage component. Right-aligned card with: rounded corners (large radius), subtle accent/gold border, elevated surface background, centered text. Use design tokens only. See PRD "Message display" section for full spec.
- [x] **1.2** Add messages state array to track conversation. When user presses Enter, append their message to state and render as UserMessage. Shift+Enter inserts a newline. Clear input after sending.
- [x] **1.3** Wire send to API. Call POST /api/agents/first with the message. On success, append response as a ChatMessage (assistant). Disable send button while waiting. Show a "Thinking..." placeholder while waiting (optional but preferred).
- [x] **1.4** Add auto-scroll. Scroll to bottom of message list whenever a new message is added (user or assistant).
- [x] **1.5** Add error handling. If API returns `{ ok: false }` or fetch fails, show inline error below the failed message. Allow retry (resend last message). Timeout after 30 seconds.
- [x] **1.6** Visual polish pass. Verify all colors, spacing, typography, and radii use Tailwind config tokens. Flag any hardcoded values. Check message spacing between user and assistant messages against Figma.

---

## Phase 2: Design Token Audit

> Make sure the foundation is solid before building more UI.

- [x] **2.1** Audit existing Tailwind config. Document all defined tokens (colors, spacing, typography, radii, shadows).
- [x] **2.2** Compare config tokens against Figma designs. Identify gaps — values used in Figma that don't have a token yet.
- [x] **2.3** Define missing semantic tokens (e.g., surface-primary, surface-elevated, text-muted, border-subtle, accent-gold). Add to Tailwind config.
- [x] **2.4** Refactor any hardcoded values from Phase 1 to use the new tokens.

---

## Phase 3: Sidebar Navigation

> Make the sidebar interactive with milestone tree navigation.

- [ ] **3.1** Create MilestoneGroup component. Collapsible section with label, chevron, expand/collapse state.
- [ ] **3.2** Create MilestoneItem component. Selectable child item with active/inactive states.
- [ ] **3.3** Create MilestoneTree component. Renders a list of MilestoneGroup components from mock data.
- [ ] **3.4** Define mock data structure for milestones. Match the Goal, Milestones, Decisions, Actions hierarchy.
- [ ] **3.5** Wire up selection state. Clicking a MilestoneItem sets it as active.
- [ ] **3.6** Wire up PlatformSelector (Foundation). Selecting it shows the project overview state.
- [ ] **3.7** Visual polish. Match Figma styling (text sizes, spacing, selected state highlight, indentation).

---

## Phase 4: Detail Panel

> Add the middle column that shows structured content for the selected item.

- [ ] **4.1** Implement three-column layout. When a sidebar item is selected, the main area splits into detail panel (left) + chat (right). When Foundation is selected with no sub-item, return to two-column.
- [ ] **4.2** Create DetailHeader component. Renders the title of the selected item.
- [ ] **4.3** Create SectionBlock component. Label + body content (supports text and lists).
- [ ] **4.4** Create BulletList component. Styled list within sections.
- [ ] **4.5** Build the Foundation view. Composed of SectionBlocks showing Goal, Milestones summary, Working Context.
- [ ] **4.6** Build a generic milestone item view. Composed of SectionBlocks showing Context, Decision, Rationale, Pros, Cons, Assumptions, Open Questions.
- [ ] **4.7** Wire detail panel to sidebar selection. Selecting a nav item renders the appropriate view with mock data.
- [ ] **4.8** Visual polish. Typography, spacing, section label styling (small caps gold labels).

---

## Phase 5: State Management and Data Flow

> Connect all three panels so they respond to the same state.

- [ ] **5.1** Define the app state shape. Selected item, project data, conversations per item.
- [ ] **5.2** Implement state management (React context or lightweight store, keep it simple).
- [ ] **5.3** Create a mock data file representing a full project (goal, milestones, decisions, chat histories).
- [ ] **5.4** Wire all three panels to shared state. Sidebar selection drives detail + chat content.
- [ ] **5.5** Scope chat to selected nav item. Switching items loads a different conversation.
- [ ] **5.6** Implement empty state to active state transition (before goal is set vs. after).

---

## Phase 6: AI Integration

> Connect Seymour's brain to drive the real experience.

- [ ] **6.1** Define the API call structure. What gets sent to Claude (system prompt + conversation history + current context).
- [ ] **6.2** Handle milestone generation. When user sets a goal, Claude generates the milestone tree and populates the sidebar.
- [ ] **6.3** Handle detail panel updates. When decisions are made in chat, the detail panel content updates.
- [ ] **6.4** Add streaming responses (Seymour's messages appear progressively).

---

## Phase 7: Polish and Edge Cases

> The details that make it feel real.

- [ ] **7.1** Loading states. Skeleton/shimmer for milestone generation, typing indicator for chat.
- [ ] **7.2** Empty states. No milestones yet, no chat history for a new item.
- [ ] **7.3** Error states across all panels (not just chat).
- [ ] **7.4** Keyboard navigation. Tab through sidebar items, enter to select, focus management.
- [ ] **7.5** Responsive behavior (or decide it is desktop-only for MVP).
- [ ] **7.6** Scrolling behavior. Sidebar scrolls independently, detail panel scrolls, chat auto-scrolls to bottom.

---

## Decisions to Make Along the Way

These will come up as you build. Do not solve them now.

- **Detail panel editing:** Read-only or directly editable?
- **Persistence:** Local storage for MVP? Supabase later?
- **Multi-project support:** The Current Project header implies switching. MVP or later?
- **Chat history scope:** Per-item or one continuous thread?

---

## Progress

**Phase 1 (MVP Chat):** Done — chat loop working, tokens verified
**Phase 2 (Token Audit):** Done
**Phase 3 (Sidebar Nav):** ⬜ Not started
**Phase 4 (Detail Panel):** ⬜ Not started
**Phase 5 (State):** ⬜ Not started
**Phase 6 (AI Integration):** ⬜ Not started
**Phase 7 (Polish):** ⬜ Not started
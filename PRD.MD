# PRD: Seymour Chat MVP

## Overview

Build a two-column app (static sidebar + chat) where a user can send a message and get a response from Claude, styled to match the Figma dark theme using only existing design tokens. No milestone navigation, no detail panel, no persistence — just a working chat loop that looks right.

## Goals

- Ship a working chat interface that visually matches the existing Figma design (frame: Seymour V1, dark theme).
- Connect the UI to the existing server endpoint that returns `{ reply, ok }`.
- Establish the foundation for future work: state management, decision-by-decision flow, milestone navigation, detail panel, multiple agents.

## Non-goals (for MVP)

- No authentication or accounts.
- No streaming responses.
- No persistent conversation history beyond in-memory for the session.
- No multi-agent routing or tool calling beyond Claude text responses.
- No "perfect Seymour behavior" tuning; good enough prompt compliance is fine.
- No detail panel (the middle column that shows structured content for a selected item). Post-MVP.
- No interactive sidebar navigation. Sidebar is static for MVP (shows project name and Foundation item, but clicking does nothing).
- No three-column layout. MVP is two-column only (sidebar + chat).
- No milestone tree generation or display.

## Success criteria

- A user can send a message and receive a Claude response within the chat UI.
- UI matches the layout and styling of the existing Figma frame (dark theme, spacing, typography).
- All styling uses design tokens from the Tailwind config. Zero hardcoded values.
- Errors are handled gracefully (show a simple inline error state).
- Works locally via `pnpm dev`.

## Target user

Designer/developer building an MVP agent product. They need a chat interface foundation that fits the current app shell.

## Design source of truth (Figma)

- Frame name: Seymour V1
- Node ID: TBD (discover via Figma MCP by searching for the frame name, then record in `docs/figma.md`)

## Design system rules (non-negotiable)

These rules apply to every component, layout, and style in this project:

- **All colors must come from the Tailwind config.** No hardcoded hex values, rgb values, or opacity hacks. If a color from the Figma design does not have a corresponding token, stop and flag it — do not invent a new token or hardcode the value.
- **All spacing must follow the 8px grid** using Tailwind spacing utilities. No arbitrary pixel values (e.g., no `p-[13px]` or `mt-[7px]`). Use the spacing scale defined in the config.
- **All typography must use tokens** defined in the Tailwind config (font family, size, weight, line height). No one-off font sizes or inline font overrides.
- **Use semantic token names** (e.g., `surface-primary`, `text-muted`, `border-subtle`, `accent`) rather than visual names (e.g., `dark-gray`, `gold-500`). If semantic names don't exist yet, flag what's needed so they can be added to the config first.
- **No inline one-off overrides** unless explicitly approved. Every style should trace back to a token.
- **Radii, shadows, and borders** follow the same rule: use config values only.
- **If something is missing from the config, flag it.** The correct response to a missing token is to pause and ask, not to hardcode a workaround.

## UX requirements

### Layout

MVP implements the **two-column layout only**:

- **Left sidebar (fixed width):** Static for MVP. Shows "Current Project" header with project name, "Platform" section with a "Foundation" item (visually styled but non-interactive), and placeholder text "Set a goal to generate your plan." Sidebar is full height with a dark surface background.
- **Right main area (flexible width):** The chat interface. Contains the message history area and the composer input pinned to the bottom.

The **three-column layout** (sidebar + detail panel + chat) is post-MVP.

### Visual style

- Match existing design language from Figma: colors, typography, spacing, radii, borders.
- Dark theme with warm/gold accent tones for labels and interactive elements.
- Use the app's existing UI components if available (`src/components/`).
- Use Tailwind for styling (project convention).
- Typography hierarchy: body text using the primary text color token, muted text using the muted text color token.
- All values must come from design tokens. See "Design system rules" above.

### Empty state (no messages)

Before the user has sent any messages, show Seymour's conversation starter in the message area:

- "Hey I'm Seymour, your decision partner to help you reach your goals."
- "What are you working on today?"
- "Tell me your goal, and I'll create a milestone plan to help you achieve it."

These render as Seymour (assistant) messages, not as a special empty-state component. The conversation starter is part of the chat history and the user simply types their response in the composer.

### Message behavior

- When user sends:
  - Immediately render user message in chat.
  - Disable send button while waiting for response.
  - Show a subtle "Thinking..." placeholder for the pending assistant message (optional but recommended).
- On response:
  - Render assistant message with returned text.
  - Re-enable send button.
- Scroll behavior:
  - Auto-scroll to bottom on new messages (both user and assistant).

### Message display

- **Seymour's messages:** Left-aligned, no bubble or background. Uses the primary text color token. Plain text that supports multi-paragraph content including line breaks, lists, and formatted options.
- **User messages:** Displayed as a card/bubble with the following styling:
  - Rounded corners (use the config border-radius token, visually a large/pill radius).
  - Subtle accent-colored border (use `border-accent` or closest warm/gold border token).
  - Elevated surface background (use `surface-elevated` or equivalent — slightly lighter than the chat area background).
  - Text is centered within the card.
  - The card is right-aligned in the chat area.
  - Text uses the primary text color token.
  - Padding follows the 8px spacing grid.
  - See Figma frame for exact radii, padding, and border weight.

### Error states

- If API returns `{ ok: false }` or fetch fails: show a small inline error message below the failed request.
- Allow user to retry (resend the last message).
- If request takes too long (timeout): show an error message with retry option.

## Functional requirements

### API

Use existing POST endpoint:

- `POST /api/agents/first`
- Request body: `{ message: string }`
- Response: `{ reply: string, ok: boolean }`
- Timeout handling: if request takes more than 30 seconds, show an error.

### Frontend state

Minimum state shape (keep in component state, no external store needed):
```typescript
messages: Array<{ role: "user" | "assistant"; text: string }>
inputValue: string
isSending: boolean
error?: string
```

No persistence required. State resets on page refresh.

### Composer behavior

- Input is multiline and auto-grows up to ~4 lines, then scrolls internally.
- **Enter** sends the message.
- **Shift+Enter** inserts a newline.
- Send button disabled while `isSending` is true or when input is empty/whitespace only.
- Placeholder text: "Message Seymour"
- Send button: circular icon button with arrow-up icon, using accent color token.

## Content / prompt requirements (MVP)

- Seymour system instructions stored at `src/agents/first/prompt.ts`.
- Prompt quality and tone tuning iterated after chat foundation works.
- For MVP, Seymour responds conversationally and helpfully. Does not need to follow the full milestone/decision framework yet.

## Technical requirements

- Next.js App Router.
- TypeScript strict mode.
- Tailwind CSS for styling, using design tokens exclusively.
- Keep API keys server-only via `.env.local`.
- Do not add new heavy dependencies unless necessary.
- All components must consume design tokens via Tailwind utilities. No hardcoded color values, no pixel-based spacing outside the 8px grid, no font sizes not defined in the config.

## Component inventory

### Exists (reuse and refine)

- `ChatMessage` — renders a single Seymour (assistant) message. Left-aligned, no bubble.
- `ChatInput` — composer input with send button.
- `Sidebar` — left navigation panel (static for MVP).
- `AppShell` — top-level layout wrapper.

### New for MVP

- `MessageList` — scrollable list of messages (user + assistant), handles auto-scroll.
- `UserMessage` — renders a user message as a right-aligned card with accent border, elevated surface background, rounded corners, and centered text. Visually distinct from ChatMessage.

### Post-MVP (do not build yet)

- `MilestoneTree` — collapsible tree navigation in sidebar.
- `MilestoneGroup` — expandable milestone category.
- `MilestoneItem` — selectable child item within a group.
- `DetailPanel` — middle column structured content view.
- `DetailHeader` — title of selected item.
- `SectionBlock` — labeled content section (GOAL, CONTEXT, DECISION, etc.).
- `BulletList` — styled list within detail sections.

All components must use design tokens only. See "Design system rules" section.

## Files and locations

| File | Purpose |
|---|---|
| `src/app/page.tsx` | Main page, composes layout + chat |
| `src/components/` | Reusable UI components |
| `src/agents/first/prompt.ts` | Seymour system prompt |
| `src/app/api/agents/first/route.ts` | API route (already exists) |
| `docs/figma.md` | Figma node IDs and design references |
| `tailwind.config.ts` | Design tokens (colors, spacing, typography) |

## Implementation plan (MVP)

1. Build the two-column page layout to match the Figma shell (static sidebar + chat area).
2. Implement the message list with empty state (Seymour's conversation starter).
3. Implement the composer with Enter/Shift+Enter behavior and auto-grow.
4. Wire send to call `/api/agents/first` and append the response.
5. Add loading state (disable send, optional thinking indicator).
6. Add error state (inline error with retry).
7. Add auto-scroll to bottom on new messages.
8. Visual polish pass against Figma. Verify all values use design tokens.

## Acceptance tests (manual)

- [ ] Empty state shows Seymour's conversation starter before any user input.
- [ ] Typing a message and pressing Enter sends it and renders the user message immediately.
- [ ] User messages render as right-aligned cards with accent border, elevated background, rounded corners, and centered text.
- [ ] Seymour messages render as left-aligned plain text with no bubble.
- [ ] Send button is disabled while waiting for a response.
- [ ] Claude's response renders as an assistant message from the API.
- [ ] Auto-scroll keeps the latest message visible.
- [ ] Shift+Enter inserts a newline without sending.
- [ ] Errors show cleanly when endpoint fails and retry is possible.
- [ ] Layout matches the Figma frame structure and dark theme.
- [ ] Sidebar is visible and styled but non-interactive.
- [ ] All colors, spacing, typography, and radii use Tailwind config tokens. No hardcoded values anywhere.
- [ ] Works locally after `pnpm dev`.

## What comes after MVP

Once the chat foundation is working, the next phases (see ROADMAP.md) are:

1. Design token audit and semantic token definitions
2. Interactive sidebar with milestone tree navigation
3. Detail panel (middle column) for structured content
4. Chat scoped to selected nav items
5. State management connecting all three panels
6. AI integration for milestone generation and structured responses
7. Polish, loading states, keyboard navigation
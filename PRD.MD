# PRD: Seymour Chat MVP (fits existing Figma design)
## Overview
Build the first working version of “Seymour” as a chat experience inside the existing Figma-designed layout (frame: **Seymour V1**). The MVP goal is a functional chat loop: user types → message appears → backend calls Claude → response appears. No multi-agent orchestration yet.

## Goals
- Ship a working chat interface that visually matches the existing design system.
- Connect the UI to the existing server endpoint that returns `{ reply, ok }`.
- Establish the foundation for future: state, decision-by-decision flow, multiple agents.

## Non-goals (for MVP)
- No authentication/accounts.
- No streaming responses.
- No persistent conversation history beyond in-memory for the session.
- No multi-agent routing or tool calling beyond Claude text responses.
- No “perfect Seymour behavior” tuning; “good enough” prompt compliance is fine.

## Success criteria
- A user can send a message and receive a Claude response within the chat UI.
- UI matches the layout and styling of the existing Figma frame (dark theme, spacing, typography).
- Errors are handled gracefully (show a simple inline error state).
- Works locally via `pnpm dev`.
## Target user
Designer/developer building an MVP agent product. They need a chat interface foundation that fits the current app shell.
## Design source of truth (Figma)
- Frame name: **Seymour V1**
- Node ID: **TBD**
  - For MVP, discover the node ID via Figma MCP by searching for the frame name.
  - Once discovered, record it in `docs/figma.md` for future reference.

## UX requirements

### Layout
- Implement the full screen layout from the Figma design as **greenfield** for MVP:
  - Left sidebar + main panel + chat area.
- Build this in `src/app/page.tsx` (current page is minimal).
- The chat UI must live within the right-side chat region and preserve the overall structure.

### Visual style
- Match existing design language from Figma:
  - colors, typography, spacing, radii, borders
- Use the app’s existing UI components if available (`src/components/`).
- Use Tailwind for styling (project convention).

### Empty state (no messages)
Show a simple welcome state in the messages area:
- Title: “Seymour”
- One-liner: “What’s the goal?”
- Optional suggestion chips (2–3):
  - “Define my MVP”
  - “Plan a roadmap”
  - “Decide between options”

### Message behavior
- When user sends:
  - immediately render user bubble
  - disable send while waiting
  - show a subtle “Thinking…” placeholder (optional)
- On response:
  - render assistant bubble with returned text
- Scroll behavior:
  - auto-scroll to bottom on new messages

### Error states
- If API returns `{ ok: false }` or fetch fails:
  - show a small inline error message in chat
  - allow user to retry (send again)

## Functional requirements

### API
- Use existing POST endpoint:
  - `POST /api/agents/first`
  - body: `{ message: string }`
  - response: `{ reply: string, ok: boolean }`
- Timeout handling: if request takes too long, show an error message.

### Frontend state
- Minimum state:
  - `messages: Array<{ role: "user" | "assistant"; text: string }>`
  - `inputValue: string`
  - `isSending: boolean`
  - `error?: string`
- No persistence required for MVP; keep in component state.

### Composer behavior
- Input is **multiline** and auto-grows up to ~4 lines, then scrolls internally.
- **Enter = send**
- **Shift+Enter = newline**
- Send button disabled while sending or when input is empty/whitespace.
- Optional helper text: “Shift+Enter for newline”.

## Content/prompt requirements (MVP)
- Seymour instructions are stored in code at `src/agents/first/prompt.ts`.
- Prompt quality/tone tuning can be iterated later.

## Technical requirements
- Next.js App Router.
- TypeScript strict.
- Tailwind.
- Keep API keys server-only via `.env.local`.
- Do not add new heavy dependencies unless necessary.

## Files / locations (expected)
- UI: `src/app/page.tsx`
- Components: `src/components/`
- Prompt: `src/agents/first/prompt.ts`
- API route (already exists): `src/app/api/agents/first/route.ts`

## Implementation plan (MVP)
1) Build the page layout (greenfield) to match the Figma screen shell (sidebar + main chat panel).
2) Implement chat UI:
   - messages list + empty state
   - composer with Enter/Shift+Enter behavior
3) Wire Send to call `/api/agents/first`
4) Add loading + error states
5) Add auto-scroll to bottom on new message/response
6) Manual test and light visual polish against Figma

## Acceptance tests (manual)
- Empty state appears before any messages.
- Sending a message renders immediately and disables send.
- Claude response renders from API.
- Auto-scroll keeps latest message visible.
- Errors show cleanly when endpoint fails (e.g., missing key) and retry is possible.
- Layout matches the Figma frame structure and dark theme.
- Works locally after `pnpm dev`.

## Notes
- Frame reference: “Seymour V1” is the design source of truth.
- Keep scope small: working chat foundation first, Seymour behavior depth later.
# Figma workflow

## Flow

1. Get design context (and screenshots if useful) via the Figma MCP tools (e.g. design context for a node).
2. Implement or adjust UI under `src/components/`. Use the node ID and file key from the Figma URL.
3. Use Tailwind for layout and styling so generated code matches the rest of the app.

## Figma URL

- **File key**: From the design URL, e.g. `https://www.figma.com/design/hIqTLfV6U4JRbCf0mHSXOe/Seymour?node-id=0-1&t=xUo9dEC6kHcPO1dI-1` → file key is `hIqTLfV6U4JRbCf0mHSXOe`.
- **Node ID**: From `?node-id=1-2` → use node ID `1:2` (colon for MCP).

## Seymour file

- **Figma file key**: `hIqTLfV6U4JRbCf0mHSXOe`
- **Main screens**:
  - Seymour V1: node ID `1:168` (chat layout: sidebar + main panel)

## Where code goes

- New or generated components: `src/components/` with clear names.
- Design tokens and styles should align with Tailwind (and `tailwind.config.ts` if you extend the theme).

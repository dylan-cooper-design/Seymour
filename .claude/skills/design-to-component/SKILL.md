# Skill: design-to-component

## Model
Use **sonnet** for this skill.

## When to use
Always — whenever building or modifying any UI in this project. This includes creating new components, editing existing ones, or building screens.

---

## Before writing any code

Do these steps first, every time:

1. **Read the Figma design** — Use `mcp__figma__get_design_context` with the provided URL or node ID. Never guess from a screenshot. If no Figma URL is provided, ask for one before proceeding.

2. **Load design tokens** — Read `src/app/globals.css` and `tailwind.config.ts`. Use the current values from these files. Do not rely on memorized values — tokens change. Never hardcode hex colors or arbitrary spacing.

3. **Check what's already built** — Search `src/components/` for existing components before creating anything new. If a component already exists and matches a Figma component, use it. Do not rebuild things that already exist.

4. **Check available Lucide icons** — If the design uses icons, run `node -e "const icons = require('lucide-react'); console.log(Object.keys(icons).join('\n'))"` to confirm the icon exists in the installed package before using it.

---

## The core rule

**Only build what exists in Figma.**

Do not invent new components, wrappers, variants, or UI patterns that aren't in the design. If you need something that doesn't exist in Figma, stop and ask before creating it.

---

## What is OK to do

- Use a component that exists in Figma
- Add interaction states to an existing component (hover, focus, active, disabled, loading, empty, error) — these are expected even if not every state is explicitly drawn in Figma
- Compose existing components together (e.g., a Button inside a Card)
- Add accessibility attributes (aria labels, roles, semantic HTML) that don't conflict with the design

## What is NOT OK to do

- Create a new component that has no equivalent in Figma
- Rename or restructure a Figma component into something different (e.g., splitting a Figma "Card" into a "Panel" and "CardHeader" that don't exist in the design)
- Add variants that don't exist in Figma (e.g., adding a "ghost" button style when Figma only has primary, secondary, and danger)
- Wrap a Figma component in a new custom wrapper unless there's a clear technical reason — and even then, ask first

---

## When something is missing

If you're building a screen and realize you need a component that doesn't exist in the Figma library, do not improvise. Stop and say:

> "This screen needs a [description] component but I don't see one in the Figma file. Should I create one, use an existing component differently, or skip it for now?"

The same applies to icons. If a Figma icon doesn't exist in the installed Lucide package, stop and ask — do not use a blank, a substitute, or guess.

---

## Building rules

### Tokens
- Read `globals.css` and `tailwind.config.ts` fresh every session — don't rely on memorized values
- Use only token names defined in those files (e.g., `bg-seymour-bg`, `text-seymour-text`)
- If a Figma color or size has no matching token, stop and flag it before writing code — adding missing tokens is a prerequisite task, not something to skip around with a hardcoded value

### Spacing
- Follow the 8px grid: use 8, 16, 24, 32, 48, 64px increments (Tailwind: `gap-2`, `gap-4`, `gap-6`, `gap-8`, `gap-12`, `gap-16`)
- Translate Figma px values to the nearest 8px-grid Tailwind token

### HTML
- Use semantic HTML first: `button`, `nav`, `section`, `ul/li`, `label`, `h1`–`h6` — not divs for everything
- All inputs need an associated `label` element
- All interactive elements must be keyboard navigable with a visible focus state
- Use ARIA attributes only when semantic HTML alone isn't sufficient

### Icons
- Use Lucide React exclusively (`lucide-react`). Import: `import { IconName } from "lucide-react"`
- Never use Heroicons (`@heroicons/react`)
- Never use a blank or placeholder for a missing icon — flag it and ask

### Components
- One component per file
- Props should have sensible defaults
- When pointed at an existing component as a pattern to follow, match its structure, naming conventions, and token usage exactly

---

## When following a pattern component

If the user says "follow this component as a pattern," read that file before writing anything. Match:
- File and export structure
- Prop naming and TypeScript types
- Which tokens are used and how
- Class ordering and formatting conventions
- How interaction states are handled

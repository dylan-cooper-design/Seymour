# Skill: figma-audit

## When to use
Trigger this skill when the user says something like:
- "compare my code against Figma"
- "audit against Figma"
- "what's different from the design"
- "sync with Figma"
- "check my implementation against the design"

## Prerequisites
- The user must provide a Figma URL or node ID.
- You must have access to the Figma MCP server (`mcp__figma__*` tools).
- Never guess at design intent from screenshots alone — always read the design via MCP.

---

## Before starting: load project context

Do these before touching anything else:

1. **Load design tokens** — Read `src/app/globals.css` and `tailwind.config.ts`. Use these throughout the audit. Do not invent or assume token names or values. If a Figma value maps to a token, use the token name. If it doesn't map to any existing token, that is itself a mismatch.

2. **Load available Lucide icons** — Run `node -e "const icons = require('lucide-react'); console.log(Object.keys(icons).join('\n'))"` to get the full list of available icon names from the installed package. Use this list when checking whether a Figma icon has a Lucide equivalent. Do not guess — if the icon name isn't in this list, flag it in "Needs Attention."

---

## Phase 1 — Audit

### Step 1: Read the Figma design
Use `mcp__figma__get_design_context` with the provided URL or node ID. If the user gives a top-level frame, also call `mcp__figma__get_metadata` to enumerate child nodes, then call `get_design_context` on each meaningful component node separately.

Extract from the design:
- All spacing values (padding, gap, margin)
- All color values — map each one to a token from the loaded token set. Flag any color that has no matching token.
- All typography (font size, weight, line height, letter spacing) — map to the `fontSize` tokens in `tailwind.config.ts`
- All icons — note the icon name and which component uses it
- All interactive states present in the design (hover, focus, active, disabled, loading, empty, error)
- Layout structure (flex direction, alignment, wrapping, grid)
- Semantic HTML implications (headings, buttons vs divs, lists, labels, landmark roles)

### Step 2: Read the built components
Find and read every source file that corresponds to the Figma frame being audited. Check:
- `src/components/**/*.tsx`
- `src/app/**/*.tsx`

Use Grep to search for component names, class names, or other identifiers from the Figma design to locate the right files quickly.

### Step 3: Compare and list mismatches
For each component, compare the Figma design to the code and list every mismatch. Group by component. Be specific — never write "fix spacing," write "change `gap-3` to `gap-4` (16px) in `src/components/nav/Nav.tsx` line 42."

**Mismatch categories to check:**

#### Spacing
- Padding, gap, margin values that differ from Figma
- Translate Figma px values to the nearest Tailwind spacing token (e.g., 16px → `gap-4`)

#### Colors & tokens
- Any hardcoded hex or Tailwind color class that should be a project token (as loaded from `tailwind.config.ts`)
- Any Figma color that has no matching token in the loaded token set — this generates a token task, not a component task
- Any token used in code that doesn't match what Figma specifies for that element

#### Typography
- Font size, weight, line height, letter spacing mismatches
- Compare against the `fontSize` tokens loaded from `tailwind.config.ts`

#### Interaction states
- Missing hover state
- Missing focus-visible ring or outline
- Missing disabled styling
- Missing loading state (spinner, skeleton, opacity)
- Missing empty state
- Missing error state

#### Layout
- Wrong flex direction or alignment
- Missing wrapping behavior
- Incorrect grid structure

#### Icons
- Icon in Figma but not rendered in code → flag
- Icon rendered as blank/empty → flag in "Needs Attention"
- Icon name from Figma that isn't in the installed Lucide package → flag in "Needs Attention"
- Any use of Heroicons (`@heroicons/react`) in existing code → flag as a migration task
- Icon is the wrong one (e.g., a chevron used where an arrow is shown) → flag

#### Accessibility
- Missing `aria-label` on icon-only buttons
- Missing `role` attributes
- Non-semantic HTML (div used where button, nav, ul/li, or heading is appropriate)
- Missing focus states visible to keyboard users
- Missing `sr-only` text for screen readers

#### Missing components
- A component, section, or pattern visible in Figma that has no corresponding code → flag

---

## Phase 2 — Plan

After completing the audit, write the task plan to `TASKS.md` at the project root.

**If `TASKS.md` already exists, overwrite it.** Do not append. Each audit run produces a fresh, complete plan.

### TASKS.md format

```markdown
# Figma Audit Tasks

> Audited against: [Figma URL or frame name]
> Date: [today's date]

---

## Needs Attention

_These items require your input before Claude can fix them._

- [ ] **[Component] — Missing icon: [icon name]**
  Figma shows `[icon name]` in `[component]`. This icon is not available in the installed Lucide React package. Please choose a Lucide alternative or provide an SVG.
  Figma ref: [frame name / node ID]

- [ ] **[Component] — Icon renders blank**
  `[component file:line]` renders an icon that shows as blank/empty. Confirm the correct icon name.
  Figma ref: [frame name / node ID]

---

## Token Tasks

_Fix these before touching components that use them._

- [ ] **Add missing token: `[token-name]`**
  Figma uses `[hex]` for `[purpose]` but no matching token exists in `globals.css` or `tailwind.config.ts`.
  Add `[token-name]: [hex]` to both files.

---

## [Component Name]

Figma ref: [frame name / node ID]

- [ ] **Fix: [specific mismatch description]**
  File: `src/components/[...].tsx` line [N]
  Change: `[current value]` → `[correct value]`

- [ ] **Add hover state to [element]**
  File: `src/components/[...].tsx`
  Add: `hover:bg-[token]` (matches Figma hover fill [hex])

---

## [Next Component Name]

...
```

### Ordering rules
1. "Needs Attention" always comes first — blocked on user input
2. Token tasks come next — components depend on them
3. Shared/base components before pages or views that compose them
4. Within a component: tokens → layout → spacing → color → typography → icons → states → accessibility

### Task writing rules
- Each task must be small enough to be a single commit
- Be specific: name the file, the line (if known), the current value, and the correct value
- Include the Figma frame reference on every task so you can call `get_design_context` when starting work
- Do not include tasks for things that already match the design
- If a Heroicons import is found, add a migration task for every icon used from that package

---

## Icon library rules (always apply)
- **Use Lucide React exclusively** (`lucide-react`). Import: `import { IconName } from "lucide-react"`
- **Never use Heroicons** (`@heroicons/react`). If found in existing code, create a migration task.
- **Never use a blank or placeholder** for a missing icon. Always flag in "Needs Attention."
- To check icon availability, query the installed package — do not browse external websites.

---

## Output summary
After writing `TASKS.md`, tell the user:
- How many components were audited
- Total number of mismatches found
- Number of items in "Needs Attention"
- Number of token tasks
- The path to `TASKS.md`
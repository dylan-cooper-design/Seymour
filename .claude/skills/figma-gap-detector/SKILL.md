# Skill: figma-gap-detector

## Model
Use **sonnet** for this skill.

## When to use
Trigger this skill when the user says something like:
- "check the design for gaps"
- "audit the design before I build it"
- "what's missing from this Figma design"
- "find design gaps"
- "pre-implementation audit"
- "what do I need to clarify before building this"
- "run the gap detector"
- "figma gap detector"

This skill runs **before implementation begins**. Its job is different from `figma-audit` (which compares a built component to Figma) and `design-to-component` (which builds from Figma). This skill identifies what is unclear or missing in the design itself so that implementation can proceed without guessing.

---

## Prerequisites
- The user must provide a Figma URL or node ID. If none is provided, stop and ask for one before doing anything else.
- You must have access to the Figma MCP server (`mcp__figma__*` tools).

---

## Before starting: load project context

Do these steps in parallel before analyzing anything:

1. **Load design tokens** — Read `src/app/globals.css` and `tailwind.config.ts`. These are the source of truth for all color, spacing, and typography tokens. Do not rely on memorized values.

2. **Load available Lucide icons** — Run:
   ```
   node -e "const icons = require('lucide-react'); console.log(Object.keys(icons).join('\n'))"
   ```
   Use this exact list when checking icon availability. Do not guess.

---

## Audit Process

### Step 1: Read the Figma design

Call `mcp__figma__get_design_context` with the provided URL or node ID.

If the user provides a top-level frame, also call `mcp__figma__get_metadata` to enumerate child nodes, then call `get_design_context` on each meaningful component node separately.

Extract from the design:
- Layout structure (flex, grid, direction, alignment, wrapping)
- All spacing values (padding, gap, margin)
- All color values — attempt to map each to a token from the loaded token set
- All typography (font size, weight, line height, letter spacing)
- All icons referenced
- Container sizing behavior (fixed, fill, hug, max-width)
- Any variants and states shown
- Any interaction patterns or annotations
- Responsive or breakpoint behavior (if annotated)
- Any assets requiring export

### Step 2: Apply the Default Policy

For each detected gap, determine whether to:
- **Auto-fill** — silently apply a best-practice default and list it under "Auto-applied Defaults"
- **Ask** — flag it under "Needs Attention" because the decision materially affects layout, tokens, or product behavior

Use the rules below.

---

## Default Policy

### AUTO-FILL: apply without asking

These are safe to infer. Do not interrupt the user for these.

**Interaction states (standard controls)**

| Control | Hover | Active/Pressed | Focus | Disabled |
|---|---|---|---|---|
| Button (primary) | background darkens ~6%, 180ms ease-out | background darkens ~10% | focus-visible ring using project focus token | opacity-50, cursor-not-allowed |
| Button (secondary/ghost) | subtle bg tint ~4%, 150ms ease-out | tint ~8% | focus-visible ring | opacity-50, cursor-not-allowed |
| Tab / menu item | subtle bg, 150ms ease-out | slightly stronger bg | focus-visible ring | opacity-50 |
| List row | bg-hover tint, 150ms ease-out | slightly stronger | focus-visible ring | — |
| Input / textarea | border brightens or thickens | — | focus ring, 150ms | opacity-50, cursor-not-allowed |
| Checkbox / radio / toggle | bg tint | — | focus-visible ring | opacity-50 |

If the project has a `focus` token, use it. If not, use the primary brand color at ~80% opacity for the ring.

**Motion defaults**
- hover transitions: 150–200ms ease-out
- open/close transitions (modals, dropdowns, drawers): 200–250ms ease-out entry, ease-in exit
- Do not add transitions to elements where motion would be disorienting (progress bars, large layout shifts)

**Loading / empty / error states**
- loading: skeleton loader for data-dense content; spinner for single-action elements
- empty: neutral message, optional primary CTA — match surrounding tone
- error: inline message below the field; use `aria-describedby` linking field to message

**Text overflow**
- Single-line labels → `truncate` with ellipsis
- Multi-line body text → `line-clamp-2` when content is variable

**Accessibility defaults**
- Icon-only buttons: infer `aria-label` from context (nearby label, tooltip text, or semantic position)
- Ensure all interactive elements are keyboard navigable
- Ensure focus states are visible

**Spacing rounding**
- Round Figma px values to the nearest 8px-grid increment (4, 8, 12, 16, 24, 32, 40, 48, 64)
- Only flag spacing that is more than 2px off the grid

List everything auto-filled under **Auto-applied Defaults** in the output.

---

### REQUIRES INPUT: ask the user

Only raise questions for decisions that would meaningfully change the implementation.

**Layout contracts**
- Container width behavior: is this fixed, fill-available, or max-width constrained?
- Scroll behavior: does this panel scroll independently or does the page scroll?
- Sticky or fixed positioning: is the nav/toolbar sticky? At what breakpoint does behavior change?
- Breakpoint layout changes: does the layout collapse, stack, or hide elements at tablet/mobile?

**Design tokens**
- Any Figma color that doesn't map to an existing token → must be flagged (cannot be hardcoded)
- Any new spacing value that falls off the 8px grid by more than 2px
- Any typography value that doesn't map to an existing `fontSize` token

**Data or product behavior**
- Sort order, filter logic, pagination behavior
- Validation rules or form submission logic
- Any business rule implied by the UI that isn't obvious

**Accessibility**
- `aria-label` for icon-only buttons where context is genuinely ambiguous (no nearby text, no tooltip, no semantic position to infer from)

**Complex visuals**
- Gradients
- Blur effects
- Complex masks or clipping
- Multi-layer shadows not representable with a single Tailwind shadow token

---

## Output

Write the output directly to the conversation. Do **not** write to a file unless the user asks.

Use this format:

---

# Figma Implementation Gap Report

**Audited frame:** [frame name]
**Date:** [today's date]

---

## Needs Attention

_These items require a decision before implementation can begin._

[List each item as a clear question or decision point. If there are none, write: "None — design is fully specified for implementation."]

Example format:
> **Sidebar container width**
> Figma does not specify whether the sidebar is fixed-width or fills available space.
> Options: fixed 280px / max-width within container / full-height collapsible
> _Decision needed before implementing layout._

---

## Auto-applied Defaults

_These design details were not specified in Figma. Claude will apply the following best-practice defaults during implementation._

[List each default that will be applied. If the design specifies everything, write: "None — all states and behaviors are defined in the design."]

Example format:
> **Primary button — hover state**
> Background darkens ~6%, transition: 180ms ease-out

> **Icon-only button aria-label**
> "Open project switcher" — inferred from adjacent label text

---

## Token Issues

_Figma values that do not map to an existing token in `globals.css` or `tailwind.config.ts`._

[List every unmatched value. If all values map to tokens, write: "None — all Figma values map to existing tokens."]

Example format:
> **Color: `#F8FAFC`** — no matching token found
> Used for: [element / context]
> Suggested token name: `--color-seymour-surface-subtle`

---

## Layout Ambiguities

_Container sizing, scroll behavior, or structural questions not defined in the design._

[List each ambiguity. If none, write: "None."]

---

## Accessibility Gaps

_Missing labels, contrast issues, non-semantic elements, or focus state problems._

[List each gap. If none, write: "None detected."]

---

## Responsive Behavior Missing

_Breakpoints or layout changes not defined in the design._

[List each missing behavior. If none, write: "None — responsive behavior is fully specified or not applicable."]

---

## Assets & Icons

_All icons referenced in the design and their availability in `lucide-react`._

| Icon name (Figma) | Lucide equivalent | Status |
|---|---|---|
| [name] | [LucideName] | Available / Not found — needs decision |

---

## Implementation Questions

_Concise list of questions for the designer, only when required._

[Numbered list. Only include questions for items under "Needs Attention" above. If there are none, omit this section entirely.]

---

## Summary

| | Count |
|---|---|
| Components analyzed | [N] |
| Missing or unspecified states | [N] |
| Token mismatches | [N] |
| Layout ambiguities | [N] |
| Accessibility issues | [N] |
| Items requiring designer decision | [N] |
| Auto-applied defaults | [N] |

---

## Next Steps

After reviewing this report:
- Resolve all **Needs Attention** items
- Then run `/design-to-component` to build the component with full context
- After building, run `/figma-audit` to verify the implementation matches the design

---

## Integration with other skills

This skill is the first step in a three-stage workflow:

1. **figma-gap-detector** (this skill) — identify what is missing or ambiguous _before_ building
2. **design-to-component** — build the component using verified design intent and project tokens
3. **figma-audit** — compare the built component against Figma and produce a TASKS.md fix list

Run this skill before `/design-to-component` any time you're implementing a new screen, frame, or component for the first time.

---

## Important behavior rules

- Never guess missing design intent that affects layout, tokens, or product behavior.
- Never hardcode hex values — all colors must map to tokens. Unmatched colors are always flagged.
- Automatically apply best-practice interaction defaults. Do not ask the user about hover states, transitions, or standard accessibility defaults.
- Only interrupt the user when the missing information would meaningfully change the code.
- Use Lucide React exclusively for icons. Run the icon check command — do not guess availability.
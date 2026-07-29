# Project template restructure: drop Screens/Handoff, add Best practices

## Context

`src/lib/templates/product-design.ts` seeds every new project with six locked
top-level folders: Foundations, Research, Flows & IA, Design system, Screens,
Handoff. Two problems with this, surfaced in conversation with Dylan:

1. **Screens and Handoff overlap.** Handoff (specs, redlines, edge cases) is
   really just the resolved artifact of the same screen decisions Screens
   holds. Splitting them into separate global buckets scatters one flow's
   work across three unrelated places in the tree (Flows & IA, Screens,
   Handoff).
2. **A Seymour project is usually one feature, not many flows.** The
   "multiple flows" framing implied by a plural `Flows & IA` bucket doesn't
   match how Dylan actually works: one project = one design challenge. A
   dedicated wrapper folder for "flows" is unnecessary ceremony for the
   common case.

Separately, there's no home for industry-standard UX patterns (e.g. known
best practices for onboarding, checkout, empty states) distinct from the
project's own research notes or its concrete design system.

## New top-level shape

In order, all locked (present on every new project, not deletable/reparentable,
reorderable):

1. **Foundations** — unchanged. Problem statement, Users, Goals & success
   metrics, Constraints & assumptions (workstreams).
2. **Research** — unchanged. Empty, guidance note only.
3. **Best practices** _(new)_ — industry research on established ways to
   solve the kind of problem this project is tackling. Empty at project
   start, guidance note only. Entries here can reference specific
   components/tokens already defined in Design system (e.g. "best practice
   for confirmation flows, given our existing Modal component") — this is a
   content convention, not a structural link enforced by the data model.
4. **Design system** — unchanged. Styles + Components sub-folders.

**Removed:** `Flows & IA`, `Screens`, `Handoff` — no longer seeded by the
template.

**What replaces them:** nothing pre-seeded. Once the project's actual
feature/flow is scoped, the agent creates an ordinary (unlocked) top-level
folder named for that work (e.g. "Password recovery"). No fixed internal
sub-structure — workstreams get added as the work demands them, freely named,
same principle already used for Foundations' workstreams. If a project
genuinely branches into a second distinct flow, a second such folder is added
alongside the first at the top level.

### Sharing model for Best practices

Same relationship as Design system has today: **conceptually** meant to be
shared across projects, but **not actually built that way yet** — no
cross-project storage/library mechanism exists in this codebase
(`src/lib/storage`, `src/types/project.ts`). Confirmed by inspection before
writing this spec. Both Best practices and Design system today are just
locked, per-project folders seeded empty. Building real cross-project
sharing is out of scope for this change — it would need a separate
library/workspace-level store and project↔library linking, and should be
designed as its own piece of work when both entities are ready to actually
share.

## Code changes

**`src/lib/templates/product-design.ts`**

- `TEMPLATE_KEYS`: remove `flowsAndIa`, `screens`, `handoff`; add
  `bestPractices: "best-practices"`.
- `FOLDER_NOTES`: remove `flowsAndIa`, `screens`, `handoff` notes; add a
  `bestPractices` note describing what goes there and the DS-reference
  convention.
- `createProductDesignTemplate`: `roots` becomes `[Foundations, Research,
Best practices, Design system]` (4 folders, down from 6). Best practices
  folder: locked, empty, note only — same shape as Research.
- `INITIAL_TEMPLATE_KEY` and `initialExpandedTemplateKeys` are unaffected
  (still `problemStatement` / `foundations`).

**`src/lib/templates/__tests__/product-design.test.ts`**

- "ships the six top-level folders in order" → four folders:
  `["Foundations", "Research", "Best practices", "Design system"]`.
- "locks every top-level folder" → `roots).toHaveLength(4)`.
- Existing generic tests (template key resolution, nesting rules, notes on
  empty folders, no pre-seeded decisions/actions, DS Styles/Components
  shape) continue to pass unmodified — they iterate the template rather
  than hardcoding the old folder set, except where noted above.

No other files reference the removed keys (`screens`, `handoff`,
`flowsAndIa`) — confirmed by search. `src/app/page.tsx` only reads
`TEMPLATE_KEYS.foundations`, unaffected.

## Out of scope (explicitly deferred)

- Nav UI grouping/visual separation for dynamic work-area folders — revisit
  once a project typically has more than one.
- Cross-project sharing infrastructure for Design system and/or Best
  practices — no library/workspace data model exists; needs its own design.
- Cross-referencing between two flow folders in the rare multi-flow project
  — no reference mechanism exists in the data model today.
- `src/agents/first/prompt.ts` — doesn't name Screens/Handoff/Flows & IA
  today, so needs no edit for this change. It's still the older phase/
  milestone planner and isn't aware of the folder/workstream/decision/action
  tree model at all; updating it to originate work-area folders and Best
  practices content is separate, larger follow-up work.

## Testing

Update and run the existing vitest suite (`vitest.config.ts` already wired,
`pnpm test` or equivalent) — the template test file above is the only one
touching this shape.

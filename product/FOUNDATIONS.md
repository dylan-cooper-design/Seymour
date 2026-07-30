# Seymour

## Discovery (Lisa)

**Who:** A product designer starting or mid-way through a design project, working within a design system they didn't create fresh for this project.

**Before:** Every designer tracks project context, decisions, and actions their own ad-hoc way, scattered across whatever tools they happen to use. There's no consistent container, so the reasoning behind the work has no default home and the path through the work has no shape.

**After:** A designer opens one file per project that already knows what to hold — the outcome, the user, the design system in play, and the work broken into named areas, each carrying the decisions that have to be made before the next action can be taken. Seymour defines that structure with them and keeps them moving through it.

**Core:** Momentum during the project — there's always an identifiable next decision, so the project never stalls in the gap between "I know what I'm doing" and "I know what to do right now" — and defensibility after: the reasoning survives, so a designer (or teammate) can answer "why is it a modal" months later without digging through Slack.

**Problems to solve:**

1. Nothing in the app is design-specific yet. The system prompt is a general goal planner with no concept of a design system, a design decision, or a design artifact — the over-general shape this project is moving away from.
2. Work areas are AI-named from the actual project, so both the nav structure and the detail schema must be generated per project, not hardcoded to fixed labels like "milestone."
3. A decision must be attached to the action it unblocks — currently these would be two independent, unlinked lists.
4. "Easily moving through them" requires the app to compute what's next: decisions and actions need status, and something has to identify the frontier item.
5. The design system is shared 1:many across projects, but everything else (foundations, work areas, decisions, actions) is per-project. That's a second data model layered on top of what's currently a single-project local-storage shape.
6. Foundations must stay live and revisable — not a form filled once at kickoff and never reopened.

**Intent:** Give every design project one structured home — for product designers — so the decisions behind the work are captured as they're made and the next one is always identifiable.

---

## Product shape (as implemented, `src/lib/templates/product-design.ts`)

**Entities**

- **Project** — one per design project. A `ProjectTree` (see `src/types/project.ts`), currently one per user (no multi-project support yet — `user_state` table holds a single row per `user_id`). Ships with four locked top-level folders, in order:
  - **Foundations** — problem statement, users, goals & success metrics, constraints & assumptions. Set at start, revisited throughout.
  - **Research** — competitive teardowns, interview synthesis, usability findings. Starts empty.
  - **Best practices** — established industry patterns for the kind of problem this project is solving. Starts empty. Conceptually meant to be shared across projects eventually (see below).
  - **Patterns** _(renamed from "Design system" 2026-07-29 — the old name read as the whole shared library rather than this project's slice of it)_ — Styles + Components sub-folders. Same shared-across-projects intent as Best practices.
- **Work areas** — NOT pre-seeded by the template. Created as ordinary (unlocked) top-level folders once the project's actual feature/flow is scoped, named for that work (e.g. "Password recovery"). Each contains freely-named workstreams, which hold:
  - **Decisions** — options considered, tradeoffs, what was picked, why. Open, resolved, or deferred.
  - **Actions** — unblocked by a resolved decision, move the project toward finished. Can also stand alone under a workstream without a decision.

**Seymour's job:** help define the work areas, help make the decisions inside them, and keep surfacing the next actionable thing — not run a generic multi-phase planner.

**Known gap, not yet built:** Best practices and Patterns are meant to be shared 1:many across projects (like a design system library), but no cross-project storage mechanism exists yet — today they're just empty per-project folders. When that library/workspace-level store gets built, it must surface only the subset of the library actually relevant to/used by a given project — never the whole library duplicated inline into every project's tree. See `docs/superpowers/specs/2026-07-29-project-template-restructure-design.md` for the full reasoning.

## Status of existing docs (as of this rewrite)

- `PRD.MD` — specs the original two-column MVP chat product. Describes a system this project has since built past (says "no auth," "no persistence," "no milestone tree" — all now exist). Needs a rewrite against this foundations doc, not incremental edits.
- `Roadmap.md` — all 7 phases checked off, last updated March 2. Predates the general→design-specific narrowing and doesn't reflect uncommitted work in the tree (Supabase auth, login flow, middleware, ChoiceCard, reply parser, vitest). Needs re-cutting once the PRD reflects this doc.
- `.planning/flows/*.md` — Flow Compass docs for goal-definition and milestone-work flows. Written for the general-planner version of Seymour; will need a pass once work areas replace "milestones."
- `src/agents/first/prompt.ts` — the actual behavioral spec (430 lines). This is where "general goal planner" currently lives in practice and is the main rewrite target to become design-specific.

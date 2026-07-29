# Project Template Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the template's `Flows & IA` / `Screens` / `Handoff` top-level folders with a new locked `Best practices` folder, so every project ships with `Foundations → Research → Best practices → Design system`, and dynamic feature/flow work is added later as freeform folders (not seeded by the template at all).

**Architecture:** Single-file change. `src/lib/templates/product-design.ts` is a factory function (`createProductDesignTemplate`) that returns a `ProjectTree`; this plan edits its `TEMPLATE_KEYS`, `FOLDER_NOTES`, and the `roots` array it builds. No other source file references the removed keys (confirmed by repo-wide search during design), so no other production code changes.

**Tech Stack:** TypeScript (strict), Vitest for tests.

## Global Constraints

- TypeScript strict mode — no `any`, no implicit loosening.
- No new template keys beyond `bestPractices`; do not reintroduce `flowsAndIa`, `screens`, or `handoff`.
- Top-level folders remain `locked: true` (renameable/reorderable, not deletable/reparentable — enforced by `moveNode`/`canDrop` in `src/lib/tree/nodes.ts`, untouched by this change).
- Every folder that ships empty must carry a `note` (existing test enforces this generically — see Task 1).
- Full spec: `docs/superpowers/specs/2026-07-29-project-template-restructure-design.md`.

---

### Task 1: Restructure top-level template folders

**Files:**

- Modify: `src/lib/templates/product-design.ts` (full file, ~135 lines)
- Modify: `src/lib/templates/__tests__/product-design.test.ts:31-47`

**Interfaces:**

- Consumes: `createFolder`, `createWorkstream` from `@/lib/tree/create`; `FolderNode`, `ProjectTree`, `SCHEMA_VERSION` from `@/types/project` — all unchanged, already imported.
- Produces: `TEMPLATE_KEYS.bestPractices` (new, value `"best-practices"`) — no other task in this plan consumes it, but it's the stable handle any future agent/prompt work would reference for this folder. `TEMPLATE_KEYS.flowsAndIa`, `TEMPLATE_KEYS.screens`, `TEMPLATE_KEYS.handoff` no longer exist — if any later work reintroduces references to them, that's a bug.

- [ ] **Step 1: Update the test file to assert the new four-folder shape**

  In `src/lib/templates/__tests__/product-design.test.ts`, replace lines 31–47 (the two tests below) exactly:

  ```typescript
  it("ships the four top-level folders in order", () => {
    const { roots } = createProductDesignTemplate();
    expect(roots.map((n) => n.label)).toEqual([
      "Foundations",
      "Research",
      "Best practices",
      "Design system",
    ]);
  });

  it("locks every top-level folder so the prompt's guarantees stay true", () => {
    const { roots } = createProductDesignTemplate();
    expect(roots).toHaveLength(4);
    expect(roots.every((n) => n.locked === true)).toBe(true);
  });
  ```

  Leave every other test in the file untouched — they resolve keys generically via `findByTemplateKey`/`Object.values(TEMPLATE_KEYS)` and don't hardcode the removed folders.

- [ ] **Step 2: Run the suite to confirm it now fails**

  Run: `npx vitest run src/lib/templates/__tests__/product-design.test.ts`

  Expected: FAIL — `ships the four top-level folders in order` and `locks every top-level folder...` both fail, because the implementation still produces six folders (`Flows & IA`, `Screens`, `Handoff` still present, `Best practices` doesn't exist yet).

- [ ] **Step 3: Rewrite the template implementation**

  Replace the full contents of `src/lib/templates/product-design.ts` with:

  ```typescript
  /**
   * The product design project template.
   *
   * Every project starts here. The agent no longer invents a skeleton — it fills
   * decisions into a structure that already exists, which is both more consistent
   * for the user and dramatically less for the model to get wrong.
   *
   * A factory, not a constant: each call mints fresh ids and timestamps.
   */

  import { createFolder, createWorkstream } from "@/lib/tree/create";
  import { SCHEMA_VERSION, type FolderNode, type ProjectTree } from "@/types/project";

  /**
   * Stable handles the prompt refers to instead of UUIDs. Patch targets resolve
   * id -> templateKey -> skip, so a reference still lands after the user renames
   * the node.
   */
  export const TEMPLATE_KEYS = {
    foundations: "foundations",
    problemStatement: "foundations.problem-statement",
    users: "foundations.users",
    goals: "foundations.goals",
    constraints: "foundations.constraints",
    research: "research",
    bestPractices: "best-practices",
    designSystem: "design-system",
    styles: "design-system.styles",
    components: "design-system.components",
  } as const;

  /** Where the user lands on a brand-new project. */
  export const INITIAL_TEMPLATE_KEY = TEMPLATE_KEYS.problemStatement;

  /**
   * Folders that ship empty would otherwise be a dead end on day one, so each
   * carries a note the detail panel renders as guidance.
   */
  const FOLDER_NOTES = {
    research:
      "**What goes here:** competitive teardowns, interview synthesis, usability findings, analytics reads.\n\nStart a workstream for each study or question you're chasing.",
    bestPractices:
      "**What goes here:** established patterns for problems like this one — how others have solved onboarding, checkout, empty states, and similar. Distilled from research, not raw findings.\n\nWhere relevant, ground a pattern in what's already in Design system — e.g. best practice for confirmation flows, given the existing Modal component.",
    designSystem:
      "**What goes here:** the foundations everything else is built from.\n\n*Styles* covers color, type, spacing, elevation and motion. *Components* covers the reusable pieces.",
    styles:
      "**What goes here:** color, typography, spacing, elevation, motion — one workstream per token family.",
    components:
      "**What goes here:** one workstream per component, or per component family once the set gets large.",
  } as const;

  export function createProductDesignTemplate(opts: { projectName?: string } = {}): ProjectTree {
    const roots: FolderNode[] = [
      createFolder("Foundations", {
        templateKey: TEMPLATE_KEYS.foundations,
        locked: true,
        children: [
          createWorkstream("Problem statement", {
            templateKey: TEMPLATE_KEYS.problemStatement,
            objective: "Settle what problem this project solves, and for whom.",
          }),
          createWorkstream("Users", {
            templateKey: TEMPLATE_KEYS.users,
            objective: "Settle who the primary user is and what they're trying to do.",
          }),
          createWorkstream("Goals & success metrics", {
            templateKey: TEMPLATE_KEYS.goals,
            objective: "Settle what success looks like and how it will be measured.",
          }),
          createWorkstream("Constraints & assumptions", {
            templateKey: TEMPLATE_KEYS.constraints,
            objective: "Surface what's fixed, what's assumed, and what still needs validating.",
          }),
        ],
      }),

      createFolder("Research", {
        templateKey: TEMPLATE_KEYS.research,
        locked: true,
        note: FOLDER_NOTES.research,
      }),

      createFolder("Best practices", {
        templateKey: TEMPLATE_KEYS.bestPractices,
        locked: true,
        note: FOLDER_NOTES.bestPractices,
      }),

      createFolder("Design system", {
        templateKey: TEMPLATE_KEYS.designSystem,
        locked: true,
        note: FOLDER_NOTES.designSystem,
        children: [
          createFolder("Styles", {
            templateKey: TEMPLATE_KEYS.styles,
            note: FOLDER_NOTES.styles,
          }),
          createFolder("Components", {
            templateKey: TEMPLATE_KEYS.components,
            note: FOLDER_NOTES.components,
          }),
        ],
      }),
    ];

    return {
      schemaVersion: SCHEMA_VERSION,
      projectName: opts.projectName?.trim() || "Untitled project",
      roots,
    };
  }

  /** Ids of the folders that should start expanded on a fresh project. */
  export function initialExpandedTemplateKeys(): string[] {
    return [TEMPLATE_KEYS.foundations];
  }
  ```

- [ ] **Step 4: Run the suite to confirm it passes**

  Run: `npx vitest run src/lib/templates/__tests__/product-design.test.ts`

  Expected: PASS — all tests in the file, including the two rewritten in Step 1 and every generic test that walks `TEMPLATE_KEYS`/`roots` without hardcoding the old folder set.

- [ ] **Step 5: Run the full test suite and a type check**

  Run: `npx vitest run`
  Expected: PASS — no other test file references `screens`, `handoff`, or `flows-and-ia` (confirmed by repo-wide search during design; this step is the safety net in case something was missed).

  Run: `npx tsc --noEmit`
  Expected: no errors. This catches any stray reference to the removed `TEMPLATE_KEYS.screens` / `.handoff` / `.flowsAndIa` outside test files (design-time search found none, but `src/app/page.tsx` imports `TEMPLATE_KEYS` and this confirms it still compiles).

- [ ] **Step 6: Commit**

  ```bash
  git add src/lib/templates/product-design.ts src/lib/templates/__tests__/product-design.test.ts
  git commit -m "$(cat <<'EOF'
  Restructure project template: drop Screens/Handoff/Flows & IA, add Best practices

  Flows & IA, Screens, and Handoff overlapped and scattered one flow's work
  across three separate top-level buckets. Feature/flow work now gets a
  freeform, AI-named top-level folder created when the work is scoped,
  instead of a pre-seeded wrapper. Best practices joins Research and Design
  system as a fixed folder for industry patterns relevant to the problem
  being solved.

  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  EOF
  )"
  ```

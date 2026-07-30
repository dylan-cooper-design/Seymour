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
  outcome: "foundations.outcome",
  users: "foundations.users",
  goals: "foundations.goals",
  constraints: "foundations.constraints",
  research: "research",
  researchReadme: "research.readme",
  bestPractices: "best-practices",
  bestPracticesReadme: "best-practices.readme",
  patterns: "patterns",
  patternsReadme: "patterns.readme",
  styles: "patterns.styles",
  stylesReadme: "patterns.styles.readme",
  components: "patterns.components",
  componentsReadme: "patterns.components.readme",
} as const;

/** Where the user lands on a brand-new project. */
export const INITIAL_TEMPLATE_KEY = TEMPLATE_KEYS.outcome;

/**
 * Folders never carry their own readable content — clicking a folder in the
 * nav must never show anything, only navigate. Every folder that would
 * otherwise ship empty gets a README workstream child instead, so there's
 * always something to click into.
 *
 * Copy rule: the user is a designer. Never define what a concept is (a
 * design system, a best practice, a token family) — just say what to put
 * where, in this app's terms.
 */
const README_CONTENT = {
  research:
    "One workstream per study or question you're chasing — competitive teardowns, interviews, usability findings, analytics reads.",
  bestPractices:
    "One workstream per pattern relevant to this project — onboarding, checkout, empty states, and similar.\n\nGround it in what's already in Patterns where relevant, e.g. confirmation flows given the existing Modal component.",
  patterns:
    "*Styles* — color, type, spacing, elevation, motion.\n\n*Components* — the reusable pieces.",
  styles: "One workstream per token family — color, typography, spacing, elevation, motion.",
  components: "One workstream per component, or per family once the set gets large.",
} as const;

function readme(templateKey: string, note: string) {
  return createWorkstream("README", { templateKey, note });
}

export function createProductDesignTemplate(opts: { projectName?: string } = {}): ProjectTree {
  const roots: FolderNode[] = [
    createFolder("Foundations", {
      templateKey: TEMPLATE_KEYS.foundations,
      locked: true,
      children: [
        createWorkstream("Outcome", {
          templateKey: TEMPLATE_KEYS.outcome,
          objective: "What's the outcome — and why does it matter?",
        }),
        createWorkstream("Users", {
          templateKey: TEMPLATE_KEYS.users,
          objective: "Who's this for, and what are they trying to do?",
        }),
        createWorkstream("Goals & success metrics", {
          templateKey: TEMPLATE_KEYS.goals,
          objective: "What does success look like, and how will you measure it?",
        }),
        createWorkstream("Constraints & assumptions", {
          templateKey: TEMPLATE_KEYS.constraints,
          objective: "What's fixed, what are you assuming, and what still needs validating?",
        }),
      ],
    }),

    createFolder("Research", {
      templateKey: TEMPLATE_KEYS.research,
      locked: true,
      children: [readme(TEMPLATE_KEYS.researchReadme, README_CONTENT.research)],
    }),

    createFolder("Best practices", {
      templateKey: TEMPLATE_KEYS.bestPractices,
      locked: true,
      children: [readme(TEMPLATE_KEYS.bestPracticesReadme, README_CONTENT.bestPractices)],
    }),

    createFolder("Patterns", {
      templateKey: TEMPLATE_KEYS.patterns,
      locked: true,
      children: [
        readme(TEMPLATE_KEYS.patternsReadme, README_CONTENT.patterns),
        createFolder("Styles", {
          templateKey: TEMPLATE_KEYS.styles,
          children: [readme(TEMPLATE_KEYS.stylesReadme, README_CONTENT.styles)],
        }),
        createFolder("Components", {
          templateKey: TEMPLATE_KEYS.components,
          children: [readme(TEMPLATE_KEYS.componentsReadme, README_CONTENT.components)],
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

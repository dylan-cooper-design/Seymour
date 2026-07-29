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
  patterns: "patterns",
  styles: "patterns.styles",
  components: "patterns.components",
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
    "**What goes here:** established patterns for problems like this one — how others have solved onboarding, checkout, empty states, and similar. Distilled from research, not raw findings.\n\nWhere relevant, ground a pattern in what's already in Patterns — e.g. best practice for confirmation flows, given the existing Modal component.",
  patterns:
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

    createFolder("Patterns", {
      templateKey: TEMPLATE_KEYS.patterns,
      locked: true,
      note: FOLDER_NOTES.patterns,
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

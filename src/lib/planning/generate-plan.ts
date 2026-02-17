import type { Decision } from "@/types/navigation";

export interface GeneratedMilestone {
  id: string;
  title: string;
  objective: string;
  order: number;
  decisions: Decision[];
}

function createId(prefix: string, index: number): string {
  return `${prefix}-${index}-${Date.now().toString(36)}`;
}

/**
 * Template-based milestone templates.
 * Each has a title, objective, and decision templates [title, actionItem].
 */
const MILESTONE_TEMPLATES: Array<{
  title: string;
  objective: string;
  decisions: Array<[string, string]>;
}> = [
  {
    title: "Clarify scope and audience",
    objective: "Define what you are building and for whom.",
    decisions: [
      ["Target audience", "Identify the primary user profile"],
      ["Core value", "Define the main problem you solve"],
      ["Success criteria", "Set 2–3 measurable outcomes"],
      ["Out of scope", "List what you will not do in v1"],
    ],
  },
  {
    title: "Research and validate",
    objective: "Reduce risk before building.",
    decisions: [
      ["Competitive landscape", "List 3–5 direct alternatives"],
      ["User interviews", "Schedule 5+ conversations with target users"],
      ["Technical feasibility", "Confirm approach with a spike or proof of concept"],
      ["Timeline constraints", "Document hard deadlines or dependencies"],
    ],
  },
  {
    title: "Design the solution",
    objective: "Shape the product before implementation.",
    decisions: [
      ["Information architecture", "Define main screens and flows"],
      ["Key interactions", "Specify core user journeys"],
      ["Visual direction", "Choose references or design system"],
      ["Edge cases", "Document error and empty states"],
      ["Feedback loops", "Plan how users know something worked"],
    ],
  },
  {
    title: "Build the core",
    objective: "Deliver the minimum viable version.",
    decisions: [
      ["Tech stack", "Finalize languages, frameworks, and hosting"],
      ["Data model", "Define core entities and relationships"],
      ["Integration points", "List external APIs or services needed"],
      ["Deployment pipeline", "Set up build and release process"],
    ],
  },
  {
    title: "Test and refine",
    objective: "Ensure quality and readiness.",
    decisions: [
      ["Test scenarios", "Document critical paths to verify"],
      ["Feedback source", "Identify who will use the beta"],
      ["Bug triage", "Define severity levels and response targets"],
      ["Launch readiness", "Complete pre-launch checklist"],
    ],
  },
  {
    title: "Launch and iterate",
    objective: "Ship and learn from real usage.",
    decisions: [
      ["Launch plan", "Set date, channel, and rollback steps"],
      ["Monitoring", "Define metrics and alerts"],
      ["First review", "Schedule retrospective within 2 weeks"],
      ["Iteration backlog", "Prioritize next 3 improvements"],
    ],
  },
];

function pickMilestones(goalText: string): number[] {
  const lower = goalText.toLowerCase();
  const hasResearch =
    /research|validate|interview|market|competitor/.test(lower);
  const hasTest = /test|qa|quality|beta/.test(lower);

  const indices: number[] = [];
  indices.push(0);
  if (hasResearch) indices.push(1);
  indices.push(2);
  indices.push(3);
  if (hasTest) indices.push(4);
  indices.push(5);

  return indices.slice(0, 6);
}

/**
 * Deterministic MVP planner. Generates 4–6 milestones with 3–5 decisions each.
 * Rule-based and template-driven for stable, predictable output.
 */
export function generateMilestonesAndDecisions(
  goalText: string
): { milestones: GeneratedMilestone[] } {
  try {
    const selectedIndices = pickMilestones(goalText || "achieve a goal");
    const milestones: GeneratedMilestone[] = [];
    const baseId = `m-${Date.now().toString(36)}`;

    for (let i = 0; i < selectedIndices.length; i++) {
      const templateIdx = selectedIndices[i];
      const template = MILESTONE_TEMPLATES[templateIdx];
      const milestoneId = createId(baseId, i);
      const decisions: Decision[] = template.decisions.map(([title, actionItem], j) => ({
        id: createId(milestoneId, j),
        milestoneId,
        title,
        actionItem,
        status: "todo" as const,
      }));

      milestones.push({
        id: milestoneId,
        title: template.title,
        objective: template.objective,
        order: i + 1,
        decisions,
      });
    }

    return { milestones };
  } catch {
    return getFallbackPlan();
  }
}

function getFallbackPlan(): { milestones: GeneratedMilestone[] } {
  const baseId = `m-fallback-${Date.now().toString(36)}`;
  const fallbackTemplates = MILESTONE_TEMPLATES.slice(0, 3);

  const milestones: GeneratedMilestone[] = fallbackTemplates.map(
    (template, i) => {
      const milestoneId = createId(baseId, i);
      const decisions: Decision[] = template.decisions
        .slice(0, 3)
        .map(([title, actionItem], j) => ({
          id: createId(milestoneId, j),
          milestoneId,
          title,
          actionItem,
          status: "todo" as const,
        }));
      return {
        id: milestoneId,
        title: template.title,
        objective: template.objective,
        order: i + 1,
        decisions,
      };
    }
  );

  return { milestones };
}

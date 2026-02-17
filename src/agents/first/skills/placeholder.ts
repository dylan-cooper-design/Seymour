/**
 * Placeholder skill for the first agent.
 * Replace with real behavior once docs/agents/01-first-agent.md is filled in.
 */

export interface PlaceholderSkillInput {
  message?: string;
}

export interface PlaceholderSkillOutput {
  reply: string;
  ok: boolean;
}

export function runPlaceholderSkill(
  input: PlaceholderSkillInput
): PlaceholderSkillOutput {
  const message = input?.message ?? "Hello";
  return {
    reply: `Placeholder skill received: ${message}. Add real behavior in docs/agents/01-first-agent.md and here.`,
    ok: true,
  };
}

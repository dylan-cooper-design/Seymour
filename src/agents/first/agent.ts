/**
 * First agent entry. Calls placeholder skill; extend when 01-first-agent.md is defined.
 */

import { runPlaceholderSkill } from "./skills/placeholder";

export interface FirstAgentInput {
  message?: string;
}

export interface FirstAgentOutput {
  reply: string;
  ok: boolean;
}

export function runFirstAgent(input: FirstAgentInput): FirstAgentOutput {
  return runPlaceholderSkill({ message: input.message });
}

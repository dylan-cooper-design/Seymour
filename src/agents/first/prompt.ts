// src/agents/first/prompt.ts

import * as fs from "fs";
import * as path from "path";

const instructionsPath = path.join(process.cwd(), "src/agents/first/instructions.txt");

export function getSeymourInstructions(): string {
  return fs.readFileSync(instructionsPath, "utf-8").trim();
}

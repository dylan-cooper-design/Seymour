# Skill: flow-compass

## Model
Use **opus** for this skill.

## When to use

Use this skill before implementing any feature involving:
- Multiple components
- Navigation changes
- User flows
- AI interactions

Skip it only for single, isolated component changes with no flow implications.

---

## Example invocations

```
/flow-compass
"Implement the Goal Definition → Milestone generation flow"

/flow-compass
"Implement milestone switching with sidebar + detail panel"
```

---

## Rules (non-negotiable)

- Always produce the Flow Compass BEFORE writing or editing any code.
- Output must be 300–600 words. No exceptions.
- Do NOT include data contracts, TypeScript types, or accessibility audits.
- Only include system states if they directly block the user from completing the flow.
- Make reasonable assumptions for anything unknown. Label them "Assumption:".
- Ask questions only if they block implementation.
- After producing the compass, treat it as the source of truth for the feature. Do not deviate from it silently.

---

## Inputs

Accept any combination of:
- A feature or milestone name
- Figma frame or component names (read via MCP if available)
- Current repo entry points or relevant files
- Constraints (MVP, no backend, localStorage only, etc.)

If a Figma URL is provided, call `get_design_context` on the relevant nodes before writing the compass.

---

## Output contract

Produce a markdown document titled:

```
Flow Compass — <Feature or Milestone Name>
```

Sections must appear in this exact order:

---

### 1. Valuable — Desired Outcome

What is the user trying to achieve? Why does it matter?

- What success looks like for the user
- Why this matters to them
- What they walk away with after completing the flow

**2–4 sentences max.**

---

### 2. Usable — User Journey & Problems

The path the user takes to reach the outcome. Focus on problems the user faces, not UI mechanics.

**Primary Journey (max 6 steps)**

Format each step as:
> User wants to ___ → Problem: ___ → System helps by ___

---

### 3. Practical — Interface Strategy

How the interface implements the journey.

**Components in Play (max 10)**
List only components involved in this flow. For each:
> `ComponentName` → role in helping the user progress

**Flow Mechanics**
2–5 bullets explaining how the components connect. Examples:
- Sidebar selection changes the active thread context
- Detail panel reveals milestone-specific context when a milestone is active
- Chat thread drives decision-making for the active item

**Non-Negotiable Rules**
3–6 bullets describing rules the UI must follow to preserve the experience. Examples:
- Foundation must always be the entry point on first load
- DetailPanel appears only when a milestone is active, never on the Foundation thread
- AI responses may modify nav structure via `nav_patch`

---

### 4. Out of Scope

List things explicitly NOT part of this slice of work. Be specific.

---

### 5. Assumptions

List safe defaults used because information was missing. Each on one line, prefixed with "Assumption:".

---

## After the compass

Output exactly:

> **Flow understood. Ready for implementation.**

Then propose the first implementation step with the specific files to inspect or modify.

---

## Implementation Alignment Rule

During implementation, treat the Flow Compass as the source of truth.

1. Before writing code for each step, restate the relevant step from the User Journey in one sentence.
2. If a coding decision affects navigation behavior, panel visibility, state transitions, or AI responses — check it against sections 1–3 before proceeding.
3. If implementation requires changing the flow, update the Flow Compass first, then implement.
4. If a requested change conflicts with the Flow Compass, pause and name the conflict before proceeding.
5. Prefer solutions that preserve the user journey over technical convenience.

---

## Save location

After producing the compass, save it to `.planning/flows/` using the Write tool.

Filename: kebab-case slug of the feature name, e.g. `goal-definition-flow.md`, `milestone-switching-flow.md`.

Create the directory if it does not exist. Confirm the path to the user before moving to implementation.

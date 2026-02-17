# Agents

## Structure

- One folder per agent under `src/agents/` (e.g. `src/agents/first/`, `src/agents/support/`).
- Each agent has an entry point (e.g. API route or server action) and optional `skills/` and `integrations/` subfolders.
- Skills are pluggable modules. Shared skills live in `src/agents/shared/skills/`.

## Adding a new agent

1. Create a new folder under `src/agents/<agent-name>/`.
2. Add an entry point (e.g. route handler or server action) that the UI calls.
3. Add at least one skill module under `skills/` (or a placeholder).
4. Document the agent here or in a sibling file (e.g. `docs/agents/01-first-agent.md`).

## Adding a skill or integration

- Add a new module under the agent's `skills/` folder (or under `src/agents/shared/skills/` if multiple agents use it).
- Keep each skill focused and pluggable.

## First agent

- **Implementation**: `src/agents/first/` with entry in `src/app/api/agents/first/` (POST). Placeholder skill in `src/agents/first/skills/placeholder.ts`.
- See [01-first-agent.md](01-first-agent.md) for the first agent's goal and behavior (fill in as you go). Once that doc is filled in, replace the placeholder skill with real logic.

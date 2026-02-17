# Seymour – README for agents

## Dev setup

- **Node**: Use a current LTS version (e.g. 20.x).
- **Install**: `pnpm install` (or `npm install` if pnpm is not available).
- **Run**: `pnpm dev` (or `npm run dev`). App runs at http://localhost:3000.
- **Build**: `pnpm build` then `pnpm start` for production.
- **Lint**: `pnpm lint`.

## Where things live

- **Routes and layouts**: `src/app/`
- **UI components**: `src/components/` (Figma-sourced and shared)
- **Agents**: `src/agents/` (one folder per agent; entry points and skills)
- **Shared code**: `src/lib/` (utils, storage helpers)
- **Types**: `src/types/`

## Conventions

- TypeScript strict mode. Tailwind for UI. No em dashes in prose.
- Persistence: app data lives in browser local storage via helpers in `src/lib/storage/`. See `docs/agents/` for agent goals and `docs/figma.md` for Figma workflow.

## Testing

Tests are not set up yet. When added, run them with the project test script (e.g. `pnpm test`).

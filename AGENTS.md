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
- **Agents**: `src/agents/` — see `product/agents-architecture.md`
- **Shared code**: `src/lib/` (utils, tree helpers, storage helpers)
- **Types**: `src/types/`
- **Product definition**: `product/` (why it exists, how it behaves, agent structure)

## Conventions

- TypeScript strict mode. Tailwind for UI. No em dashes in prose.
- Persistence: Supabase (auth + `user_state` table), via helpers in `src/lib/storage/`. See `docs/figma.md` for Figma workflow.

## Testing

Vitest is configured but no `test` script exists in `package.json` yet — run
`npx vitest run` directly (or `npx vitest` to watch).

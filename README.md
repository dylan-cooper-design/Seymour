# Seymour

Functional app from Figma, local storage, and AI agents.

## Prerequisites

- Node.js (current LTS, e.g. 20.x)
- pnpm (optional; npm works too)

## Setup

1. Clone the repo and go into the project directory.
2. Install dependencies: `pnpm install` or `npm install`.
3. Run the dev server: `pnpm dev` or `npm run dev`.
4. Open http://localhost:3000.

Data is stored in the browser (local storage) via helpers in `src/lib/storage/`; no backend or env vars required.

## Commands

- `pnpm dev` – Start development server
- `pnpm build` – Build for production
- `pnpm start` – Run production build
- `pnpm lint` – Run ESLint

## Docs

- [docs/README.md](docs/README.md) – Index (Figma workflow, agents, architecture)
- [docs/figma.md](docs/figma.md) – Figma MCP and design-to-code
- [docs/agents/README.md](docs/agents/README.md) – Agent structure and how to add agents/skills

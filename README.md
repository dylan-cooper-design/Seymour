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

- [product/README.md](product/README.md) – The product itself: why it exists (`FOUNDATIONS.md`), how it behaves (`APPROACH.md`), how the agents are structured (`agents-architecture.md`)
- [docs/README.md](docs/README.md) – Technical/setup references (Figma workflow, design tokens) and dated design specs

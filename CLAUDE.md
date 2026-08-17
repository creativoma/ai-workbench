# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

AI Workbench — a frontend-first AI engineering lab: streaming chat, tool calling, human-in-the-loop agents, structured outputs, LLM observability and evals. Work advances in phases — see [ROADMAP.md](./ROADMAP.md) for the current phase, checklists and setup notes.

## Stack

- **Bun** — package manager and script runner; runs TypeScript natively. Never use npm/yarn/pnpm; the lockfile is `bun.lock`.
- **Vite 8** (Rolldown bundler) + **React 19** + **TypeScript 7** (native compiler).
- **Tailwind CSS v4** — configured in CSS (`@import 'tailwindcss'` + `@theme` in `src/index.css`).
- **oxlint** for linting (`.oxlintrc.json`), **Prettier** for formatting.
- Planned per roadmap: Vercel AI SDK, Hono, Zod, Langfuse, Vitest + Playwright.

## Commands

- `bun install` — install dependencies
- `bun run dev` — dev server (Vite, http://localhost:5173)
- `bun run build` — `tsc -b` + production build
- `bun run lint` — oxlint
- `bun run format` — Prettier over the repo
- `bun run type-check` — `tsc -b`
- `bun run test` — Vitest. Never `bun test`: Bun's runner ignores `vite.config.ts`, so jsdom never loads and every component test dies on `document is not defined`.
- `bun run e2e` — Playwright. Stubs `/api/*`, so it needs no API key.
- `bun run eval` — scored dataset against the real model. Needs a provider API key and spends tokens.

## Conventions

- Code style is enforced by Prettier (`.prettierrc`): no semicolons, single quotes, 4-space indent. Run `bun run format` and `bun run lint` before committing.
- All model calls live in `server/` (Hono on :8787, proxied by Vite as `/api/*`). The frontend never holds API keys; secrets go in `.env`.
- The provider is not pinned: `AI_PROVIDER` (`anthropic` | `google`) and `AI_MODEL` select it, defaulting to whichever key is present. The rule is pure in `src/domain/config/provider.ts`; `server/infrastructure/model.ts` only turns it into an SDK call. Add a provider there, never inline in a route.
- Tailwind v4 is configured in CSS via `@theme` in `src/index.css` — do not create `tailwind.config.js` or a PostCSS config.
- Structured outputs use Zod schemas shared between server and client as the single source of truth.
- `src/domain/` is pure — no React, no I/O — so both the server and the browser can import it. Zod schemas, tool contracts and rules like "which streamed steps are renderable" live there and are unit-tested directly; `server/` and `src/components/` stay thin around it.
- `server/app.ts` takes the model as an injected dep so tests can pass `MockLanguageModelV4` (`server/test-support/mock-model.ts`) instead of calling Anthropic.
- Documentation lives in four files: `README.md` (overview and setup), `ROADMAP.md` (phases), `DESIGN.md` (visual spec and tokens), `CLAUDE.md` (this file). Keep them in sync when the stack or scripts change.
- UI work follows [DESIGN.md](./DESIGN.md): use its semantic tokens (`surface-*`, `ink-*`, `line-*`, `brand-*`) rather than raw hex or Tailwind's default `gray-*`, and keep the measurements it specifies. Icons come from `lucide-react`; shared primitives (`Card`, `IconButton`, `Sparkle`) live in `src/components/ui/`.
- Styling must not break a component's test contract — the `aria-label`, `role` and visible text that `*.test.tsx` and `e2e/` query. When the spec and a test contract genuinely conflict, the contract wins and the departure gets recorded in DESIGN.md §12.
- Icon-only controls always carry an `aria-label`, and the focus ring is never removed (it is `:focus-visible` only, defined once in `src/index.css`).

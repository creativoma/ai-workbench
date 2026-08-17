# Roadmap

The lab is built in public, phase by phase. Each phase below carries its checklist and, where relevant, the setup steps and reference snippets for the pieces it introduces.

## Groundwork

Setup steps for the base pieces the phases depend on.

### Tailwind CSS v4 — done

Installed and wired: `tailwindcss` + `@tailwindcss/vite` are in `package.json`, the plugin is registered in `vite.config.ts`, and `src/index.css` imports it with `@import 'tailwindcss'`. No `tailwind.config.js`, no PostCSS config, no content globs.

The `/api` proxy is in place too:

```ts
server: {
    proxy: {
        '/api': 'http://localhost:8787',
    },
},
```

Design tokens are declared with `@theme` in `src/index.css`; the palette,
type scale and component measurements live in [DESIGN.md](./DESIGN.md).

### AI SDK + server — done

Installed and wired. The server is split for testability: `server/app.ts` builds the Hono app from an injected `model`, `server/index.ts` supplies the real one, and tests pass `MockLanguageModelV4` instead (`server/test-support/mock-model.ts`).

```bash
bun add ai @ai-sdk/react @ai-sdk/anthropic @ai-sdk/google zod hono
bun add -d concurrently
```

Bun runs TypeScript natively and serves Hono via a default export, so neither `tsx` nor `@hono/node-server` is needed.

The shape it started as — the real `server/index.ts` now injects the model and
resolves the provider, see [Provider selection](#provider-selection):

```ts
import { Hono } from 'hono'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const app = new Hono()

app.post('/api/chat', async (c) => {
    const { messages }: { messages: UIMessage[] } = await c.req.json()

    const result = streamText({
        model: anthropic('claude-opus-5'),
        messages: convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
})

export default { fetch: app.fetch, port: 8787 }
```

### Environment

Copy `.env.example` to `.env` and fill in your keys. Bun loads `.env` automatically — no `dotenv` needed. `.env` is gitignored; only `.env.example` is tracked.

```bash
# One provider key is enough — Anthropic wins when both are set.
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
# Phase 5 — observability
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

### Provider selection

The model is not pinned to one vendor. `src/domain/config/provider.ts` owns the
rule and is unit-tested; `server/infrastructure/model.ts` is the thin shell that
turns its answer into an SDK call.

| Variable      | Effect                                                          |
| ------------- | --------------------------------------------------------------- |
| _(none)_      | First provider whose API key is present, Anthropic first        |
| `AI_PROVIDER` | `anthropic` \| `google` — forces the choice, key present or not |
| `AI_MODEL`    | Overrides that provider's default model id                      |

Defaults are `claude-opus-5` and `gemini-3.6-flash`. Google is the one with a
free tier, so `AI_PROVIDER=google` is the way to run the lab without spending:

```bash
AI_PROVIDER=google
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

Verified end to end against Google on 2026-08-17: streamed text, a multi-step
`getWeather` round trip, and a `/api/plan` object all come back intact.

The Google default is deliberately one version behind the newest. `gemini-3.7-flash`
returns 503 `high demand` often enough to kill a run _after_ the tool call has
already fired, and `gemini-2.5-flash` is 404 — Google no longer serves it to new
accounts. Reach for `AI_MODEL` rather than editing the source when a model is
unavailable or a free quota does not cover it.

`evals/dataset.json` was written against Anthropic's behaviour, so `bun run eval`
prints the active model above the scores. In practice it travelled well — 9 of
12 cases passed against Google on first contact, and the three that did not were
spent quota rather than disagreement, which is what prompted the
[error-vs-failure split](#a-failed-case-and-a-case-that-never-ran-are-different-things)
in the eval harness. The free tier's 20 requests/day cannot run the dataset;
keep evals on Anthropic and use Google for day-to-day development.

Missing keys never crash the app: the server logs which provider is active, or
warns and serves every route untraced and unmodelled, so the shell and the E2E
stubs keep working.

### Scripts — done

All of these are in `package.json` now:

```jsonc
{
    "scripts": {
        "dev": "concurrently -n web,api \"vite\" \"bun --watch server/index.ts\"",
        "build": "tsc -b && vite build",
        "lint": "oxlint",
        "preview": "vite preview",
        "format": "prettier --write .",
        "type-check": "tsc -b",
        "test": "vitest run",
        "e2e": "playwright test",
        "eval": "bun run evals/run.ts",
    },
}
```

`tsc -b` rather than `tsc --noEmit`: the project is split into four tsconfigs
(app, node, server, root references), and `-b` is what builds a composite
project. Use `bun run test`, never `bun test` — Bun's own runner ignores
`vite.config.ts`, so jsdom never loads and every component test fails on
`document is not defined`.

## Phase 1 — Streaming chat — done

- [x] `useChat` from `@ai-sdk/react` with `DefaultChatTransport` pointing at `/api/chat`
- [x] Render `message.parts` (text parts), not a plain string
- [x] Handle `status` (`submitted` / `streaming` / `error`) with proper UI states
- [x] Auto-scroll, stop button, retry on error

```tsx
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'

export function Chat() {
    const [input, setInput] = useState('')
    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({ api: '/api/chat' }),
    })
    // useChat v5+ no longer manages input state — you own it.
}
```

## Phase 2 — Tool calling + generative UI — done

- [x] Define typed tools with `tool()` + Zod `inputSchema`
- [x] Render tool parts (`tool-<NAME>`) as dedicated React components (cards, tables)
- [x] Multi-step runs (model → tool → model) via `stopWhen: isStepCount(5)`

## Phase 3 — Human-in-the-loop — done

- [x] Mark sensitive tools with `needsApproval: true`
- [x] Build an approval UI: show pending tool call, Approve / Reject, `addToolApprovalResponse`
- [x] Conditional approval (function form of `needsApproval` based on input) — `sendEmail` only asks outside the trusted domain

```ts
import { tool } from 'ai'
import { z } from 'zod'

export const sendEmail = tool({
    description: 'Send an email to a recipient',
    inputSchema: z.object({ to: z.string().email(), body: z.string() }),
    needsApproval: true, // the human decides before this runs
    execute: async ({ to, body }) => {
        /* ... */
    },
})
```

Auto-scroll follows new content only for a reader already at the floor, so
streaming never yanks the view away from someone who scrolled up
(`src/domain/chat/scroll.ts`). It is driven by a `ResizeObserver` on the content
box rather than by the message array, so a resolving tool card or a filling plan
panel counts as growth too.

## Phase 4 — Structured outputs — done

- [x] `streamObject` on the server + `useObject` on the client
- [x] Zod schema shared between server and client (single source of truth)
- [x] Render partial objects as they stream in

The plan generator is the worked example: `POST /api/plan` takes a goal and streams back a `{ goal, steps[] }` object.

`src/domain/objects/plan.ts` owns the schemas both sides import, plus `renderableSteps` — the pure rule for which half-written steps are worth painting mid-stream (a step needs a title; its detail may still be arriving).

`streamObject` needs `toTextStreamResponse()`, not `toUIMessageStreamResponse()` — `useObject` reads a raw JSON text stream:

```ts
const result = streamObject({ model, schema: planSchema, prompt })
return result.toTextStreamResponse()
```

`useObject` takes an `api` URL rather than a transport, so `PlanPanel` accepts an optional `fetch` for tests (`src/components/plan/test-support.ts` has the stream fakes).

## Phase 5 — Observability with Langfuse — done (unverified against a live project)

- [x] Install `@langfuse/client @langfuse/vercel-ai-sdk @langfuse/tracing @langfuse/otel @opentelemetry/sdk-node`
- [x] Register the `LangfuseSpanProcessor` — lives in `server/observability/langfuse.ts`
- [x] Tag traces with session metadata; inspect latency, cost and token usage per generation
- [x] Add a thumbs-up / thumbs-down feedback control in the UI wired to Langfuse scores

**Not verified against a live project.** The wiring, the port and the feedback round-trip are covered by tests, but nobody has yet opened a Langfuse dashboard and confirmed traces land there. That is the one open item in this phase.

Routes depend on an `Observability` port (`server/observability/index.ts`), not on Langfuse. Two payoffs: the app runs untraced when the keys are absent instead of crashing, and route tests assert on what _would_ have been reported via `recordingObservability`.

AI SDK v7 traces through a registered integration, **not** the `experimental_telemetry` flag used by v6 and earlier:

```ts
const sdk = new NodeSDK({ spanProcessors: [new LangfuseSpanProcessor()] })
sdk.start()
registerTelemetry(new LangfuseVercelAiSdkIntegration())
```

Feedback needs the trace id in the browser. The chat route wraps the run in `propagateAttributes` + `startActiveObservation`, then ships `getActiveTraceId()` out as assistant-message `messageMetadata`; `POST /api/feedback` turns a thumb into a numeric Langfuse score. The AI SDK types metadata as `unknown`, so the client parses it with Zod (`traceIdOf`) rather than trusting it.

## Phase 6 — Evals — done

- [x] Build `evals/dataset.json` (12 prompts with expected behaviours)
- [x] `evals/run.ts`: runs the dataset against the API and asserts with code
- [x] Track eval scores across changes (fails CI if quality regresses)

Checks are code, not a judge model, so the gate is deterministic and costs nothing beyond the runs themselves: required tools, forbidden tools, regexes over the answer, and whether the run paused for approval. A case must assert something — `expect: {}` fails schema validation.

Every judgement is pure and unit-tested in `src/domain/evals/` (`scoring.ts`, `transcript.ts`); `evals/run.ts` is only the I/O shell. Cases run sequentially on purpose — a parallel fan-out trips provider rate limits.

### A failed case and a case that never ran are different things

Sequential execution turned out not to be enough. A first run against Google's
free tier spent its quota partway through and reported `9/12 (75%) — Quality
regression`, when nothing about quality had changed: the last three cases were
429s. The chat route answers `200` and reports the failure _inside_ the stream,
so `observeStream` saw an empty transcript and `scoreCase` dutifully reported
`expected tool getWeather; called [none]`.

Three pieces fix it, and they matter on any provider — a transient 500 faked the
same regression on Anthropic:

- `describeStreamError` (`src/domain/api/stream-error.ts`) maps the status to a
  fixed phrase — `rate limited by the model provider`, `the configured model is
not available` — which the chat route passes as `onError`. The default masks
  everything as "An error occurred.", indistinguishable from a bad answer. It
  maps rather than forwards, so quota figures and model ids stay off the wire.
- `Observed.error` carries that through the transcript.
- `CaseStatus` is `pass | fail | error`, and an errored case is **excluded from
  the pass rate** instead of dragging it down. `isRegression` answers "did the
  model get worse?"; the new `isInconclusive` answers "did this run happen at
  all?". Both exit non-zero, so a run that did not happen still cannot read as a
  green build — but only one of them claims a regression.

`bun run eval` needs a provider API key and spends real tokens. The expectations
were tuned against Anthropic — see [Provider selection](#provider-selection)
before reading a score from another model. Note the free tier cannot run this
dataset at all: Google allows **5 requests/minute and 20/day** per model, and 12
cases with multi-step tool calls need more than that.

## Design pass — done

The UI in [DESIGN.md](./DESIGN.md) is built: tokens, the icon rail / sidebar /
top bar shell, the canvas with its scroll fade and floating composer, the user
bubble and assistant block, the code card, and the shared card shell that tool
output and structured output both wear. §12 there records every deliberate
departure from the reference — the biggest being that the send button does not
become a stop button, because the test contract needs both to exist at once.

Skipped on purpose: dark mode (out of scope in §10) and per-token syntax
highlighting. Every colour goes through a semantic token, so dark mode stays a
values-only change.

## Phase 7 — Production polish — done

- [x] Unit tests (Vitest + Testing Library) for chat components — landed early, alongside phases 1–4
- [x] Happy-path E2E with Playwright (`e2e/`) — 13 specs
- [x] GitHub Actions: lint + typecheck + test + build, E2E, and evals
- [x] Rate limiting + input validation on the API
- [x] SEO and favicon

### SEO and favicon

`index.html` referenced `/favicon.svg` while `public/` was empty, so the icon
404'd. The mark is now the §3 brand diamond in three forms — SVG, a 32px PNG for
browsers that still refuse SVG, and a 180px PNG because iOS ignores SVG for
home-screen icons — plus a `robots.txt` that keeps `/api/` out of the index.
`e2e/seo.spec.ts` fetches every icon the document declares and fails on a
non-200, which is the check that would have caught the original 404.

Three tags are deliberately **absent** from the head: `rel=canonical`,
`og:url` and `og:image` all need an absolute origin this app does not have.
README's SEO section lists exactly what to add once there is a domain.

The honest ceiling here: this is a client-rendered SPA with no SSR, so a crawler
that does not execute JavaScript sees an empty `#root`. The static `<head>` is
therefore the whole indexable surface. Making the conversation itself indexable
would mean SSR or prerendering, which is not something this lab needs.

### Notes

The E2E specs stub `/api/*` with canned streams, so they need no API key and spend nothing — they prove the browser wiring, not the model. Playwright points at `127.0.0.1`, not `localhost`: Vite binds IPv6 `[::1]` by default, and a `localhost` health check that resolves to IPv4 first never connects, so the run hangs waiting for a server that is already up.

CI runs evals only on `main` and manual dispatch (they cost money), and skips them with a warning when neither provider key is configured, so forks are not broken by a missing secret. Point CI at the free tier with an `AI_PROVIDER=google` repository variable plus a `GOOGLE_GENERATIVE_AI_API_KEY` secret.

Rate limiting is a fixed-window counter: the algorithm is pure and tested in `src/domain/api/rate-limit.ts`, the Hono middleware only owns the `Map`. Note it is per-process — a multi-instance deploy needs a shared store behind the same `consume`. Headers are set _after_ `await next()`, because Hono does not merge `c.header()` into a `Response` a route returns itself (which is every streaming route here).

Every route now rejects malformed JSON as 400 rather than 500, and `/api/chat` validates the envelope with Zod plus `safeValidateUIMessages` for the message shapes.

---

## Out of scope

Every phase above is closed. These were on the plan and are deliberately not
being built — they are listed here rather than left as open checkboxes, so the
roadmap never implies work that is not coming.

**Deploy.** Dropped from Phase 7. Picking hosts, creating accounts and holding
production secrets are decisions for the repo owner, not something to guess at.
Everything a deploy needs is in place: `bun run build` emits a static `dist/`,
the API is a single Bun process (`server/index.ts`, port 8787) that reads its
config from the environment, and CI already gates lint, types, tests, E2E and
the build. Two things to remember when it happens — the rate limiter is
per-process, so more than one API instance needs a shared store behind the same
`consume`; and add the three origin-dependent SEO tags listed in README.

**Verifying Langfuse against a live project.** Needs Langfuse keys, which only
the repo owner has. The wiring, the `Observability` port and the feedback
round-trip are covered by tests, and the app runs untraced without keys — but no
one has opened a dashboard and watched a trace land. Set the keys in `.env` and
send one message: traces should appear grouped by session, with a
`user-feedback` score once you rate an answer.

**Dark mode, the user bubble's line clamp, and per-token syntax highlighting.**
Recorded in [DESIGN.md](./DESIGN.md) §12 with reasons. Dark mode was out of
scope in §10 from the start; because every colour goes through a semantic token
and no component carries a raw hex, it stays a values-only change whenever it is
wanted.

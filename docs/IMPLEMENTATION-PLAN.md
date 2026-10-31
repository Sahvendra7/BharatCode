# Turant: implementation plan

Branch: `claude/blissful-galileo-krihbg`. Repository: `Sahvendra7/BharatCode` (fresh; see `research/github-audit.md` §5).

## Stack (and why)

| Choice | Reason |
|---|---|
| Next.js 16.4 App Router + React 19.3, TypeScript strict | One deployable unit with server route handlers (key stays server-side) and a fast client; matches owner's recent projects |
| zod 4 | Single source for runtime validation and the JSON Schema sent to `text.format` |
| Plain `fetch` + own SSE parser for BharatCode | Full control of documented edge cases (keepalive comments, `response.incomplete`, 503, `x-request-id`), no SDK behaviour to work around |
| Plain CSS with custom properties | Full design control, no build plugin, small bundle |
| Vitest, Playwright 1.63 (pre-installed browser), @axe-core/playwright | Unit/integration/API + E2E + accessibility |
| No database | Sensitive data; nothing to persist in v1 |

## Milestones

| # | Milestone | Done when |
|---|---|---|
| M1 | Scaffold: Next.js, TS, lint, Vitest, Playwright, CI workflow, `.env.example`, `.gitignore` | `npm run build`, `npm test` green on empty app |
| M2 | Validators + URL analysis + datetime parser (TDD) | unit vectors pass |
| M3 | Domain schemas + strict JSON Schema generation | strictness test passes |
| M4 | Plan engine: steps, working days, entitlement, documents, fact lock, rule floors (TDD) | scenario tests pass |
| M5 | BharatCode layer: config, errors, SSE parser, client with retries, agent loop, structured helper | fake-fetch integration tests pass |
| M6 | Tools registry + analysis/check pipelines + post-processing | pipeline tests with scripted model pass |
| M7 | API routes with guards (origin, rate limit, limits) + SSE writer | route tests pass |
| M8 | UI: landing, `/help` flow (call-first card, intake, live trace, review, plan/docs), `/check`, `/how-it-works`, `/privacy` | manual run on desktop + mobile |
| M9 | Sample cases + synthetic screenshots (fictional data, no real brands) | samples open with honest labels |
| M10 | E2E + axe on desktop and mobile; fix defects | Playwright green |
| M11 | Eval: gold set + `eval` (live) + `eval:rules` (offline); `verify:live` script | offline eval measured and reported |
| M12 | README, screenshots, demo GIF, LICENSE, CONTRIBUTING, BharatCode.txt, launch kit, submission checklist | checklist complete or marked blocked |

## Task order inside milestones

TDD for M2–M7: write the failing test from the spec, implement, refactor. UI after the engine so the UI renders
real engine output from day one.

## Out of scope for this round

Accounts, persistence, multi-language UI beyond Hindi labels on the call sheet, browser extension, WhatsApp bot,
detection of forged payment screenshots.

## Externally blocked work (needs the owner)

1. A BharatCode API key (student access or Lite/Pro) to run `npm run verify:live` and `npm run eval`.
2. Making the repository public and submitting on bharatcode.ai (requires the owner's account).
3. Deploying to a hosting account (Vercel/Render) with the key as a secret.

## Status (30 Oct 2026)

M1–M12 are complete, except the parts that need a BharatCode key or the owner's accounts: live verification
(`npm run verify:live`), the live extraction benchmark (`npm run eval`), real-model screenshots, making the repo
public, deployment and submission. See `docs/SUBMISSION-CHECKLIST.md`.

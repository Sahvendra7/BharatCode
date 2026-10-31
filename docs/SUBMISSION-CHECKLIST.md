# Submission checklist: BharatCode Build League 2026, Round 1

Status as of **31 October 2026**. Legend: ✅ done and verified · ⏳ incomplete · 🔒 externally blocked (needs the owner).

## Deadlines and rules

| Item | Status | Notes |
|---|---|---|
| Application deadline confirmed | ✅ | **10 Nov 2026, 11:59 PM IST** (hackathon page bundle: `2026-11-10T23:59:00+05:30`) |
| Separate project-submission deadline | ⏳ unknown | Not published. Treat 10 Nov 23:59 IST as the latest safe time. Re-check the page and community channels. |
| Judging weights / rubric | ⏳ unknown | Not published. Community score observed as 50% normalised stars + 50% normalised votes (see `research/hackathon-analysis.md`). |

## Registration and submission (owner actions)

| Item | Status | Notes |
|---|---|---|
| BharatCode account + Round 1 application | 🔒 | Sign in at bharatcode.ai/hackathon and apply. Suggested direction: **Everyday assistance** |
| Repository made **public** | 🔒 | `Sahvendra7/BharatCode` was private at audit time. Make it public before submitting. |
| `BharatCode.txt` in repo root | ✅ | Present; describes model, endpoints, features and how to run |
| Submit main repo URL (not a branch/file link) | 🔒 | URL can't be changed after submission. Merge this branch into the default branch first so the main page shows the project. |
| Project name and summary | ✅ drafted | `docs/LAUNCH.md` §2 (summary under 1,000 characters) |
| No secrets, tokens, private links or private data | ✅ | Scanned tracked files: only dummy test strings (`bc_live_secret`); only `.env.example` committed; client bundles contain no key-like strings |

## Product

| Item | Status | Evidence |
|---|---|---|
| Core workflow (call-first → intake → AI reading → fact review → plan → documents) | ✅ | E2E: `e2e/turant.spec.ts` |
| Check-before-you-pay mode with rule floor | ✅ | Unit + E2E |
| Works without a key (samples, manual, rules-only) | ✅ | E2E "manual path" |
| Mobile and desktop, no horizontal scroll | ✅ | E2E on Desktop Chrome + Pixel 7 |
| Accessibility (axe: no serious/critical violations on all pages) | ✅ | E2E |
| Error handling (503 retry, incomplete, failed, invalid output, no key, rate limit, cross-site) | ✅ | Unit/integration/API tests + E2E busy test |
| Production build | ✅ | `npm run build` |

## BharatCode integration

| Item | Status | Notes |
|---|---|---|
| Responses API, `store:false`, streaming, tools, structured output, image input | ✅ in code | `src/lib/bharatcode/` |
| Verified against documented wire format | ✅ | Fixture tests + E2E protocol stub |
| `GET /models` checked live | ✅ | Public endpoint, fetched 30 Oct 2026: `qwen-3.8-27b` (262k context, 32k output, text+image, tools) |
| **Live generation calls verified** | ✅ | `npm run verify:live`: 5/5 (models, streaming with store:false, `text.format`, tool round-trip, image input). The first attempt returned HTTP 402 `subscription_required` until API access was enabled; 402 now has its own error kind. |
| **Model extraction accuracy measured** | ✅ | `npm run eval` on 7 gold cases: amounts 9/9, UTRs 5/5, payees 7/7, scammer IDs 9/9, money-lost 7/7, transaction count 6/7, scam type 6/7, 0 invented numbers. Small fictional set: an early signal only. |
| Defects found by live testing and fixed | ✅ | (1) a schema key named `pattern` was rejected by BharatCode's structured-output validator, forcing a fallback; renamed. (2) `response.failed: Model unavailable` before any output is now retried like a 503. (3) Recorded payments now force "money lost". (4) Long model summaries no longer become the page heading. (5) Values in the wrong field (names as account numbers, SMS sender IDs as UPI IDs) are dropped or moved, never copied into documents. |
| AI-path screenshots from a real model run | ✅ | `docs/media/ai-trace.png`, `ai-results.png`, `ai-complaint.png` |

## Repository

| Item | Status |
|---|---|
| README (problem, solution, architecture diagram, setup, env vars, API, tests, limitations) | ✅ |
| Screenshots + demo GIF | ✅ (`docs/media/`) |
| LICENSE (MIT), CONTRIBUTING, SECURITY, `.gitignore`, `.env.example` | ✅ |
| CI workflow (typecheck, lint, unit, rules eval, E2E, bundle key scan) | ✅ written · ⏳ not yet run on GitHub (runs on first push to GitHub with Actions enabled) |
| Research and design docs (`research/*.md`, `docs/*.md`) | ✅ |
| Misleading claims check | ✅ | Every metric in the README states its caveat; the stub is labelled; no recovery promises |

## Deployment (optional, recommended for votes)

| Item | Status | Notes |
|---|---|---|
| Public deployment | 🔒 | Needs the owner's hosting account (e.g. Vercel: import repo, set `BHARATCODE_API_KEY` secret). Without a key the deployment still serves samples, manual entry and rule checks. |
| Add deployment link to README, submission summary and repo "About" | 🔒 | After deployment |

## Before pressing submit

```bash
npm ci && npm run typecheck && npm run lint && npm test && npm run test:e2e
BHARATCODE_API_KEY=... npm run verify:live
BHARATCODE_API_KEY=... npm run eval
```

Then make the repo public, merge to the default branch, confirm `BharatCode.txt` shows in the root on GitHub,
and submit the repo URL.

## Release audit (31 Oct 2026)

| Check | Result |
|---|---|
| Gitleaks v8.21.2, full history | No leaks (re-run on the clean single-commit history before publishing) |
| Gitleaks, working tree | 12 hits, all in gitignored `.next*/` build output (Next.js preview-mode keys generated at build), never committed |
| Real API key in history / tracked files / built client assets | 0 / 0 / 0 occurrences |
| Env files ever committed | `.env.example` only, placeholders |
| Commit author metadata | `Claude <noreply@anthropic.com>`; no personal email |
| `BHARATCODE_API_KEY` usage | Server-only (`src/lib/bharatcode/config.ts`); no client component imports server config |
| Sample incidents and screenshots | Fictional, labelled "Sample · fictional"; no real financial data |
| Private-repository references | Removed from `research/github-audit.md`; the repository was republished with a single clean commit so no earlier version is in its history |
| Typecheck · lint · unit/integration/API · build | Pass · pass · 136/136 · pass |
| Browser tests | 36/36 (desktop + mobile, axe) |
| Live BharatCode (`npm run verify:live`) | 5/5 |
| GitHub Actions CI | Passed on the pre-cleanup history; re-runs on the clean `main` push |
| Default branch | `main` (single clean commit) |
| Visibility | Private. Must be changed by the owner (Settings → General → Danger Zone); not possible from the build environment |
| Existing submission | None for Turant / Sahvendra7 in the public list (66 entries) |
| Submission summary | 876 / 1,000 characters |

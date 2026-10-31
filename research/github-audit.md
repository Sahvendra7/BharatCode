# GitHub and workspace audit

Audit date: 30 October 2026. **Read-only.** No repository other than this one was modified. Repositories were
shallow-cloned into a temporary directory outside the workspace for inspection; `.env` files were not opened and
no secrets were read or recorded.

This public version keeps only the findings relevant to Turant. Names and details of the owner's other
repositories (public or private) and of other people are deliberately left out.

## 1. Account

- The authenticated GitHub account belongs to the project owner.
- The owner's public profile describes a backend/systems engineering focus and an interest in AI systems that
  stay observable and bounded by deterministic rules.

## 2. Local workspace

- The workspace contained only this repository, on a fresh branch with **no commits**, and no other projects.

## 3. What the account has access to (summary)

| Category | Count | Relevance to Turant |
|---|---|---|
| Repositories owned by the account (public and private), excluding this one | ~20 | A few contain reusable *patterns* (see §4); none is a better base for this product |
| Forks of third-party projects | ~9 | None: upstream work, not reusable as own work |
| Repository owned by another account, with collaborator access | 1 (Apache-2.0) | Idea only; nothing copied |
| Empty or learning-exercise repositories | several | None |

## 4. What is reusable

### 4.1 Legally
- Code the owner authored can be reused by the owner. Where other people or tools also committed to a
  repository, copying large blocks needs care. **Decision: reuse patterns and configuration, not code.**
- Repositories owned by others (including the Apache-2.0 collaborator repository) and forks belong to their
  authors. Nothing was copied from them.

### 4.2 Practically

| Asset found in the owner's earlier work | Reuse decision |
|---|---|
| Next.js 16 + React 19 + zod 4 + Playwright + axe setup; security headers; a separate E2E build directory; E2E servers that blank API keys so tests can never spend real calls; desktop + mobile Playwright projects | **Reuse as a pattern** (configuration written fresh here) |
| "Model output is a suggestion; trusted values are computed by code" | **Reuse as a principle**: Turant's numbers come from validated extraction plus deterministic rules |
| "AI can interpret and recommend; AI cannot authorise" | **Reuse as a principle**: the model never decides the action plan |
| Evidence records that cite their source span | **Reuse as a principle**: every extracted fact quotes where it came from |
| Token-bucket rate limiting | **Reuse as an idea**: a small in-memory limiter on the API routes |
| Multilingual, mobile-first UI tested down to 320 px | Idea only |

## 5. Extend an existing repository, or start fresh?

| Option | For | Against |
|---|---|---|
| Extend an earlier project with the same stack | Familiar tooling | Built for different problems and different hackathons; unrelated code would distract reviewers |
| **New repository (this one)** | Clean history for judges; one focused product; no licensing ambiguity | Configuration must be rewritten (cheap) |

**Decision: build in this repository from scratch**, reusing proven *patterns* (stack choice, E2E isolation,
deterministic-over-model design) rather than code.

## 6. Observations used for planning (not for picking the idea)

- The owner's recent work repeatedly wraps a probabilistic model in deterministic, auditable rules and measures
  the model's reliability instead of trusting it.
- Frontends are typically Next.js with Playwright + axe; backends are FastAPI or TypeScript.
- India-relevant consumer problems recur in the owner's projects.

The project selection in `project-selection.md` was made from hackathon and market evidence first. This audit only
confirms that the chosen architecture (deterministic engine + model-assisted extraction) fits existing
engineering habits, which lowers delivery risk.

# Contributing to Turant

Thanks for helping. Turant is used in stressful moments, so correctness and honesty matter more than features.

## Ground rules

- **Code decides, the model reads.** New behaviour that affects what a person is told to do belongs in
  `src/lib/engine/` (deterministic, unit-tested), not in a prompt.
- **Cite official sources.** Any rule about rights, deadlines or procedures must link a primary source
  (RBI, I4C/cybercrime.gov.in, DoT). If you can't find one, word it as "check on the portal".
- **No invented numbers.** Anything that puts numbers into a document must go through `applyFactLock`.
- **Never log user content.** Use `logEvent` in `src/lib/server/log.ts`; it has no field for content.
- **Sample data is fictional** and must stay labelled as sample everywhere it appears.

## Setup

```bash
npm install
cp .env.example .env.local   # optional: add BHARATCODE_API_KEY
npm run dev
```

## Before opening a pull request

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
```

The E2E suite starts its own servers: one without a key, and one wired to `e2e/mock-bharatcode.mjs`, a
local stub of BharatCode's documented SSE format. It never calls the real API.

## Good first contributions

- Scam patterns and rule signals for more Indian languages (add labelled messages to `eval/rules-set.ts`)
- More IFSC bank codes and UPI handles in `src/lib/validators/`
- Translations of the call sheet labels

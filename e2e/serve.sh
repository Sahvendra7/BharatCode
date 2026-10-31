#!/usr/bin/env bash
# Builds once into .next-e2e, then serves two instances: one with NO key (port 3100) and one wired
# to the local BharatCode stub (port 3101). Never uses a real key: any key in .env files is overridden.
set -euo pipefail
export NEXT_DIST_DIR=.next-e2e
npx next build >/dev/null
node e2e/mock-bharatcode.mjs &
BHARATCODE_API_KEY= TURANT_RATE_LIMIT_PER_10_MIN=1000 npx next start -p 3100 &
BHARATCODE_API_KEY=bc_test_e2e BHARATCODE_BASE_URL=http://localhost:3199/api/model/v1 TURANT_RATE_LIMIT_PER_10_MIN=1000 npx next start -p 3101 &
wait

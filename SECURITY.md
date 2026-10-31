# Security

Please report vulnerabilities privately through GitHub's "Report a vulnerability" (Security tab) rather
than a public issue.

Design notes relevant to security:

- The BharatCode API key is read only on the server (`src/lib/bharatcode/config.ts`) and never sent to
  the browser. `/api/health` exposes only whether a key is configured and the model id.
- POST endpoints require a same-origin `Origin`, enforce body-size and image-type limits (magic-byte check),
  and are rate-limited per client (in-memory; use a shared store for multi-instance deployments).
- Tools available to the model are pure functions with no network access or side effects, so text injected
  into a screenshot cannot trigger actions.
- No user content is stored or logged.

# BharatCode Build League 2026 (Round 1): hackathon analysis

Research date: **30 October 2026** (IST evening). All facts below were checked on that date. The organisers
may change pages after this date, so re-check anything time-sensitive before submitting.

Legend used throughout:

- **[OFFICIAL]**: stated on a bharatcode.ai page or returned by a bharatcode.ai endpoint.
- **[OBSERVED]**: measured from bharatcode.ai's public data, not stated in prose (e.g. a formula inferred from numbers).
- **[EXTERNAL]**: from a non-BharatCode source.
- **[INTERPRETATION]**: my strategic reading. Not a fact.
- **[UNKNOWN]**: could not be determined.

## 1. Sources inspected

| Source | What it gave |
|---|---|
| <https://bharatcode.ai/hackathon> (HTML + client JS bundle) | Rules, steps, judging inputs, form fields, deadline constant |
| <https://bharatcode.ai/build> | API reference |
| <https://bharatcode.ai/account> | Sign-in wall only; no public information |
| <https://bharatcode.ai/api/hackathon/projects> | Public JSON list of all submitted projects with stars, votes and scores (66 entries on 30 Oct 2026) |
| <https://bharatcode.ai/api/model/v1/models> | Live model catalogue (public, no auth needed) |
| <https://bharatcode.ai/terms>, `/mission`, `/livestats`, `/community` | Pricing, student access, shared-capacity behaviour |

## 2. Rules and objective

- **Name:** "BharatCode Build League · Round 1". Tagline: "Build something useful with AI." [OFFICIAL]
- **Objective:** "a hackathon for AI-powered apps, bots and tools"; use BharatCode's model API to solve a real problem. [OFFICIAL]
- **Format:** a standalone product or an integration; it "does not have to run inside the BharatCode app". Websites, mobile apps, bots, CLIs and integrations are all accepted. [OFFICIAL]
- **"Harness"** is defined on the page as "software that combines an AI model with prompts, tools and a workflow to solve a user's problem." [OFFICIAL]
- **Problem directions** (chosen at registration, changeable): Research & discovery; Learning & education; Writing & creative work; Work & automation; Everyday assistance; Coding & developer tools; Chatbots & communities; Something else. The JS bundle also contains legacy directions ("Editor integration", "MCP & connectors", "Eval & demo harness") shown only to people who picked them earlier. [OFFICIAL, from bundle]
- **Restrictions on categories, languages or frameworks:** none stated. [OFFICIAL: absence]
- **Model restriction:** none stated in the rules beyond "use BharatCode's model API". [OFFICIAL]
  - [INTERPRETATION] A project that does not call the BharatCode API is weak on the stated objective, whatever its votes. 6 of the top 10 entries by community score contain no BharatCode API call in their code (OrvynAI, ashby-job-scraper, EklavyaX, Crystal, AI-StudyMate, IssuePilot), and a 7th (QA auto-pilot) could not be cloned to check (see competitor analysis), so a real integration is a meaningful differentiator for judges.

## 3. Eligibility and registration

- "Students and other builders are welcome." Solo or small-team entries, "student or not". [OFFICIAL]
- Entries are tied to a BharatCode account (sign in with Google, GitHub or email). [OFFICIAL]
- Step 01: apply ("No finished project needed"). Step 02: pick a problem direction. Step 03: ship and submit. [OFFICIAL]
- Team size limit, age limit, country limit: **[UNKNOWN]**, not stated.

## 4. Dates

| Item | Value | Status |
|---|---|---|
| Application close | **10 November 2026, 11:59 PM IST** (`2026-11-10T23:59:00+05:30` in the page bundle) | [OFFICIAL] |
| Project submission deadline | **Not stated separately.** The submit form lives in the same registration flow. | [UNKNOWN] |
| Voting close | Not stated. "You can change your vote while voting is open." | [UNKNOWN] |
| Judging date / results | Not stated | [UNKNOWN] |

[INTERPRETATION] Treat 10 Nov 2026 23:59 IST as the latest safe time to submit, because the submission flow is gated
behind registration and no later date is published. Do not assume a later submission window exists.

## 5. Submission requirements

- Public GitHub repository, "named anything you want". [OFFICIAL]
- `BharatCode.txt` must be **in the repository root**. The page gives **no required content** for the file;
  the form only asks the submitter to tick "BharatCode.txt is present in the repo root". [OFFICIAL]
  - [INTERPRETATION] Since no content is prescribed, the file should briefly say what the project is, which BharatCode
    model/endpoints it uses and where, and how to run it. Several competitors do this (e.g. Yunas: "BharatCode.txt has the short version").
- Submit the **main repository link**, "not a file or branch link". The repository URL **cannot be changed after submission**; the name and summary can. [OFFICIAL]
- Form fields: Project name (2–160 chars, required), GitHub repo URL (required), Short summary (optional, ≤1,000 chars). [OFFICIAL]
- "Do not include secrets, tokens, private links, or private user data." [OFFICIAL]
- After submission the page says: "Keep your repo public and BharatCode.txt in place." [OFFICIAL]
- The public projects API has a `bharatcodeTxtConfirmed` flag (true for all 66 listed entries) and `status: "pending"` for all. [OBSERVED]

## 6. Judging and scoring

Official text: "Judging considers all three inputs":

1. **GitHub stars**: "Community interest in your open-source repo"
2. **Website votes**: "One vote per registered account, changeable"
3. **Judges' evaluation**: "Review of your project alongside the community response"

"The community score combines GitHub stars and registered BharatCode website votes; it does not include judges' evaluation." [OFFICIAL]

**Weights between community score and judges: not published.** [UNKNOWN] No rubric for judges is published. [UNKNOWN]

### Observed community-score formula [OBSERVED]

The public API returns `githubStarScore`, `websiteVoteScore` and `finalScore`. On 30 Oct 2026 every entry matched:

```
githubStarScore  = 100 × stars / (max stars among entries)          # max was 58
websiteVoteScore = 100 × votes / (max votes among entries)          # max was 41
finalScore       = 0.5 × githubStarScore + 0.5 × websiteVoteScore
```

Example: OrvynAI, 18 stars and 41 votes → 0.5 × 31.03 + 0.5 × 100 = 65.52 (API value 65.517). This is
**inferred from data**, is relative to the current leader, and may change. The field is named `finalScore` but the page
says the community score excludes judges, so it should not be read as the final ranking.

[INTERPRETATION] Consequences:
- Because both halves are normalised to the leader, a project needs **both** stars and votes. ashby-job-scraper has the most stars (58) but only 5 votes and sits third.
- Votes come only from registered BharatCode accounts, mostly Indian students and builders. A project whose usefulness that audience understands at once has an advantage.
- Stars come from anyone on GitHub, so a repository that is useful to the wider public (not just hackathon voters) can earn stars over time.
- Manipulation (fake accounts, star-for-star exchanges) is unethical and plausibly disqualifying. Not pursued.

## 7. Prizes and benefits [OFFICIAL]

First prize ₹10,000; 1,000 GC; 3 Ginhouse event tickets; possible consideration for shipping as an official BharatCode
offering ("selection is not automatic"); free student access subject to usage limits; public visibility; a Ginclair
learning-path discount. Sponsors: Ginclair, CodeQuesters.

## 8. BharatCode API: capabilities and limits

### Officially documented [OFFICIAL]

- Base URL `https://bharatcode.ai/api/model/v1`; `Authorization: Bearer <BHARATCODE_API_KEY>`; OpenAI-compatible payloads.
- Endpoints: `GET /models`, `POST /responses`, `POST /chat/completions`.
- `model` is required on every generation request and must be an exact ID.
- **Responses API:** `store: false` is required; stateless (replay full history, function-call items and
  `function_call_output` items each turn; resend tool definitions); text **and image** input; streaming; your own
  function tools; structured output through `text.format`.
- **Not supported (returns 400):** `store: true`, `previous_response_id`, hosted tools, background jobs, audio/video/file input.
- **Tool calling:** define function tools with JSON Schema (`strict: true` shown); the application validates arguments
  and runs the function; follow-up must include the original input, the `response.output` items and a `function_call_output`
  with the matching `call_id` and a **string** output. `tool_choice` can force a function. **Do not execute incomplete tool calls.**
- **Streaming:** text in `response.output_text.delta`; ends with `response.completed` or `response.incomplete`;
  `response.failed` is an error; **queue keepalive SSE comments are not model output**.
- **Incomplete output:** Responses `status: "incomplete"` with `incomplete_details.reason: "max_output_tokens"`
  (Chat Completions: `finish_reason: "length"`, even with HTTP 200). Output budget includes reasoning tokens. Keep partial
  output, raise `max_output_tokens` (≤32,000) or use `reasoning: {effort: "none"}`; **do not auto-retry with the same budget**.
- **503** = model busy: wait a few seconds and retry. Include the `x-request-id` header when reporting problems.
- Keys must stay server-side; never in browser bundles or mobile apps.

### Live model catalogue (`GET /models`, fetched 30 Oct 2026, no auth required) [OFFICIAL, live]

| id | display name | context window | max output | input | tool calling | reasoning | access tier |
|---|---|---|---|---|---|---|---|
| `qwen-3.8-27b` | Qwen 3.8 27B | 262,144 | 32,000 | text, image | yes | yes | standard (students 10M tokens/day, Lite, Pro) |
| `deepseek-v4.1-flash` | BharatCode DeepSeek V4.1 Flash | 1,000,000 | 32,000 | text, image (max_input_mb 8) | yes | yes | heavy (Pro only) |

Unauthenticated generation returns HTTP 401 with
`{"error":{"message":"Missing BharatCode bearer token.","type":"authentication_required","code":"authentication_required"}}`.

### Access tiers and pricing [OFFICIAL, /terms and /mission]

- API access requires Lite, Pro or verified student access.
- Students: Qwen free up to **10,000,000 tokens per IST day** (input, cached input and output incl. reasoning count).
- Lite ₹399/month (₹299 for eligible students); Pro ₹999/month from 13 Oct 2026; no daily/weekly allowance on paid plans,
  but "context, output and queue limits still apply" and a fair-use policy exists.
- **Numeric rate limits: not published.** [UNKNOWN] Shared capacity means requests may queue; `/livestats` showed
  average API queue depths up to ~16 (Qwen) and ~23 (DeepSeek) over the last day.

[INTERPRETATION] Engineering implications for any entry:
1. Default to `qwen-3.8-27b` (what student voters and judges can actually run); make the model configurable.
2. Expect queueing: show "queued" state in the UI rather than a frozen spinner; use streaming to observe keepalives.
3. Treat 503 as normal and retry with backoff; never retry an exhausted output budget unchanged.
4. Keep all tools application-side and pure; the API has no hosted tools.

## 9. Restrictions summary

| Area | Restriction | Status |
|---|---|---|
| Technology/framework | None stated | [OFFICIAL: absence] |
| Models | Use BharatCode's model API; only `qwen-3.8-27b` and `deepseek-v4.1-flash` exist | [OFFICIAL] |
| Category | Any (8 directions incl. "Something else") | [OFFICIAL] |
| Repo | Public GitHub, `BharatCode.txt` in root, main repo URL | [OFFICIAL] |
| Data | No secrets, tokens, private links or private user data | [OFFICIAL] |
| Unsupported API features | `store:true`, `previous_response_id`, hosted tools, background, audio/video/file input | [OFFICIAL] |

## 10. Unknowns to re-check before submitting

1. Whether a separate project-submission deadline after 10 Nov exists.
2. Voting close date and judging date.
3. Judges' rubric and weight of judges vs community score.
4. Whether `BharatCode.txt` content is ever checked beyond presence (the API flag suggests a check of some kind).
5. Numeric rate limits for student keys.

## 11. Announcements and FAQs

No FAQ or announcements section exists on the hackathon page as of 30 Oct 2026. The community page points to
WhatsApp and Discord groups (links behind sign-in/off-site) where announcements may be posted. [OFFICIAL]

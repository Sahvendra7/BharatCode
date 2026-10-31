# Project selection

**Selected: Turant (तुरंत, "right away"). A free, open-source first-response kit for people who have just lost
money to a scam, or are about to.** It reads the victim's screenshots and story with BharatCode's Qwen 3.8 27B,
extracts the transaction facts, checks them with deterministic validators, and produces an ordered action plan plus
ready-to-use text: a 1930 call sheet, a cybercrime.gov.in complaint draft and a bank dispute letter. It never invents a
number and never promises a refund.

No project is guaranteed to win; this is the strongest option the evidence supports.

## 1. Evaluation framework

Built from the official judging inputs (stars, website votes, judges' review "alongside the community response") and
from what the competitor data shows actually earns those inputs. Weights are my own judgement; the official weights are unknown.

| Criterion | Weight | Why it matters here |
|---|---|---|
| Problem significance & real user value | 20% | Judges review usefulness; the hackathon's stated goal is "solve a real problem" |
| Community pull (votes from BharatCode's student/builder accounts + GitHub stars) | 15% | Half of the community score is votes, half stars; relevance to students drives votes |
| Differentiation (in hackathon and in market) | 15% | 35% of entries are dev tools, 20% learning/career; the market for detection is crowded |
| Depth & necessity of BharatCode integration | 15% | Only 16/63 entries call the API at all; almost none use images or combine tools with structured output |
| Feasibility to finish and polish before 10 Nov 2026, with no API key in the build environment | 15% | An unfinished product scores on nothing |
| Demonstration clarity for non-technical viewers | 10% | Voters and judges decide quickly |
| Responsibility / harm risk (inverted: higher = safer) | 5% | Wrong advice in money or health contexts causes real harm |
| Longevity beyond the hackathon | 5% | "May be considered for shipping as an official BharatCode offering" |

## 2. Scores (1–5)

| Criterion (weight) | C1 Fraud first-response | C2 Insurance rejection | C4 Job-offer verifier | C5 Consumer complaints | C8 Eval harness |
|---|---|---|---|---|---|
| Significance (20) | **5**: ₹19.8–22.5k crore/yr, 24 lakh complaints | 5: ~26 lakh repudiations/yr | 3: serious but narrower | 3: 5.1 lakh e-com complaints | 2: builder convenience |
| Community pull (15) | **4**: every family; students help parents; job/task scams hit students | 3 | 4 | 3 | 3 |
| Differentiation (15) | **5**: no response tool in market or hackathon | 4 | 2: ScamDekho covers job offers | 2: NCH/INGRAM are free | 2: promptfoo; saturated direction |
| BharatCode depth (15) | **5**: images + tools + structured output, all essential | 4: long context + images | 4 | 3: mostly drafting | 4: but meta |
| Feasibility (15) | **4**: rules from primary RBI text; deterministic core testable without a key | 2: rules unverifiable from primary source in time | 4 | 4 | 4 |
| Demo clarity (10) | **5**: panic → plan in one minute | 4 | 4 | 3 | 2 |
| Responsibility (5) | 4: refuses to promise recovery; official channels only | 2: regulatory misstatement risk | 4 | 4 | 5 |
| Longevity (5) | **5**: public-good, grows with new scam patterns | 4 | 3 | 3 | 3 |
| **Weighted total (out of 5)** | **4.65** | 3.65 | 3.45 | 3.05 | 2.95 |

Weighted totals: C1 = 0.20·5 + 0.15·4 + 0.15·5 + 0.15·5 + 0.15·4 + 0.10·5 + 0.05·4 + 0.05·5 = 4.65;
C2 = 1.00+0.45+0.60+0.60+0.30+0.40+0.10+0.20 = 3.65; C4 = 0.60+0.60+0.30+0.60+0.60+0.40+0.20+0.15 = 3.45;
C5 = 0.60+0.45+0.30+0.45+0.60+0.30+0.20+0.15 = 3.05; C8 = 0.40+0.45+0.30+0.60+0.60+0.20+0.25+0.15 = 2.95.

Sensitivity check: C1 stays first if the community-pull weight is set to 0% (C1 4.05 vs C2 3.20) or doubled to 30% (5.25 vs 4.10, unnormalised), or if C1's feasibility is scored 3 instead of 4 (4.50).

## 3. The selected opportunity

### Problem
In the hour after a scam payment, a victim has to:
1. call **1930** and read out exact transaction details (amount, date/time, UTR/reference, payee UPI ID or account, bank);
2. complete the complaint on **cybercrime.gov.in** (secondary sources say within ~24 hours of the call);
3. get the bank to **block** compromised cards/UPI/net-banking and record a **written dispute**;
4. secure the phone if a remote-access app was installed or an OTP/PIN was shared;
5. preserve evidence and later escalate (bank → RBI CMS if no reply in 30 days).

The facts needed are scattered across screenshots, in a panic, often in Hindi/Hinglish, often by an older parent
with a student child helping by phone. Errors and delay reduce the chance of holding funds.

### Target users
- **Primary:** a person who has just paid a scammer, or noticed unauthorised debits, and the family member helping (often a student).
- **Secondary:** someone holding a suspicious message who has *not* paid yet (pre-payment check mode).
- **Tertiary:** volunteers, college cyber-cells and NGOs who help victims.

### Research evidence
See `competitor-analysis.md` §6.1–6.3: complaint volumes; funds saved by fast reporting; student-targeted job scams;
RBI 2017 liability circular (primary source); Chakshu is only for unreported, no-loss communication; Truecaller,
ScamDekho and Seerie are detection-only.

### Competitor analysis (summary)
- In the hackathon: no fraud, consumer-rights or "what do I do now" product among 65 repos; the one legal-document tool uses Gemini.
- In the market: detection is served (Truecaller since 28 Sep 2026; ScamDekho; Seerie); **response is not**.
  Government portals are the *destination* for complaints. Turant prepares people to use them well and never replaces them.

### Differentiation
1. **Response-first.** The "Call 1930 now" action is the first thing shown and never waits on the AI.
2. **Screenshot-to-facts.** Qwen reads UPI receipts, bank SMS and chats; every extracted fact carries the quote it came from.
3. **Fact lock.** Generated documents may contain only numbers that exist in the verified facts. A deterministic check
   strips or flags any amount, UTR, phone or ID that does not. Measurable: "invented-number rate".
4. **Correct entitlement logic.** Distinguishes *authorised-under-deception* from *unauthorised* transactions before
   mentioning RBI's 3/7-working-day rules; computes the working-day window deterministically.
5. **Deterministic floors.** If the evidence shows an OTP/PIN shared or a remote-access app installed, the plan
   includes the lock-down steps whatever the model says.
6. **Privacy.** No login, nothing stored server-side; screenshots go only to the model call.

### Core value proposition
"In the worst hour, Turant turns your screenshots into exactly what to say and send, in the right order, without making anything up."

### Why it suits this hackathon
- Uses BharatCode for an irreplaceable part: reading images and messy narratives, tool-using extraction, schema output. No other entrant does this combination.
- Free student access + flat pricing make a free public tool sustainable; it could plausibly be offered as a BharatCode public-good showcase.
- "Everyday assistance" direction (or "Something else"), which is underpopulated.

### Technical feasibility
- Deterministic engine (validators, working-day math, playbook, document templates, fact lock) is fully testable without an API key.
- Model layer follows the documented Responses API exactly (store:false, client-side tools, `text.format`, streaming, 503/incomplete handling) and can be tested with documented-format fixtures. A live verification script runs as soon as a key is supplied.
- Stack (Next.js 16, TypeScript, zod, Vitest, Playwright + axe) matches the owner's recent projects.

### Main risks and mitigations

| Risk | Mitigation |
|---|---|
| No BharatCode API key available in the build environment → live behaviour unverified | Fixture tests in the documented formats; `npm run verify:live` script; sample cases clearly labelled "pre-filled sample, no AI call"; manual-entry path works without AI; checklist marks live verification as **externally blocked** |
| Qwen misreads a screenshot | Every fact needs a source quote; user confirms/edits facts before documents are generated; validators reject malformed UTRs/UPI IDs/IFSCs |
| Users treat output as legal advice | Clear "not legal advice; official channels decide" copy; links only to official portals; no recovery promises |
| Wrong regulatory statements | Only rules quoted from primary sources (RBI 2017 circular) are encoded; unverified details (e.g. the exact 24-hour NCRP window, RB-IOS time limits) are worded as "check on the portal" |
| Prompt injection from scammer text inside screenshots | The model has only pure, read-only tools; the action plan is computed by code; injected text cannot trigger actions |
| Queueing on shared capacity | Streaming with keepalive detection → "Queued at BharatCode" status; retries on 503 with backoff |
| Sensitive data | No persistence; no logging of content; images size-limited and never stored |

### Why C1 over the alternatives
- **Over C2 (insurance):** equally significant, but its correctness depends on regulatory text I could not verify from
  the primary source in time. Shipping wrong rights information about medical claims is worse than shipping nothing.
- **Over C4 (job offers):** narrower and partly served by ScamDekho; kept inside Turant as a scam pattern and sample case aimed at students.
- **Over C5 (consumer complaints):** the official NCH/INGRAM channels are already free and guided; less AI necessity.
- **Over C8 (eval harness):** saturated direction, weak for non-developer voters and judges.
- **Over C3 (standalone scam checker):** crowded; kept as Turant's secondary "check before you pay" mode.

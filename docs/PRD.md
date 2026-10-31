# Turant: product requirements

Status: v1.0 for the BharatCode Build League (Round 1). Owner: Sahvendra7. Last updated 30 Oct 2026.

## 1. Summary

Turant (तुरंत, "right away") helps a person in India who has **just lost money to a scam** (or is about to) do the
right things, in the right order, with the right details. It reads their screenshots and story with BharatCode's
Qwen 3.8 27B, extracts the transaction facts with source quotes, checks every identifier with deterministic
validators, lets the person confirm the facts, and then produces:

- an ordered **action plan** computed by code (not by the model);
- a **1930 call sheet** (what to read out on the national cyber-fraud helpline);
- a **cybercrime.gov.in complaint draft** mapped to the portal's sections;
- a **bank dispute letter**;
- an honest **"what you may be entitled to"** note based on RBI's 2017 liability circular, applied only when it actually applies.

A secondary mode, **"Check before you pay"**, reads a suspicious message or screenshot and shows warning signs with
the exact words that triggered them.

Not a replacement for 1930, the police, the bank or a lawyer. Turant never promises recovery and never invents a number.

## 2. Goals and non-goals

**Goals**
1. Get a victim from panic to a correct, complete 1930 call and complaint in minutes.
2. Make every number in every document traceable to the person's own evidence.
3. Work for a non-technical user on a phone, including a family member helping remotely.
4. Work without the AI: the manual path produces the same plan and documents.
5. Use BharatCode where it is necessary: reading images and messy multilingual text, and tool-using extraction.

**Non-goals (v1)**
- Filing complaints on the user's behalf (no automation of government portals).
- Accounts, history sync, or any server-side storage of cases.
- Detecting forged payment screenshots (merchant-side problem; different product).
- Legal advice, recovery guarantees, or contacting scammers.
- Audio/voice input (not supported by the API).

## 3. Personas

| Persona | Situation | Needs | Constraints |
|---|---|---|---|
| **Sunita, 54, homemaker (victim)** | Paid ₹48,500 to a caller claiming her electricity would be cut tonight | Know what to do now; not be blamed; exact words for the helpline | Hindi-first, panicking, small phone screen, shares via WhatsApp |
| **Aarav, 20, engineering student (helper)** | His mother calls him in tears; he's in his hostel | Collect her screenshots remotely, get a correct plan fast, send her the call sheet | Mobile, limited time, distrusts "AI magic" |
| **Priya, 21, final-year student (pre-payment)** | Got an internship offer asking ₹1,999 "registration fee" via UPI | Is this a scam? Why? What to do with the sender? | Wants a quick, explainable answer |
| **Volunteer at a college cyber-cell** | Helps several victims a week | Consistent, complete complaint drafts | Needs printable/copyable output |

## 4. User journeys

### J1. "I've lost money" (primary)
1. Landing → **"I've lost money"**.
2. **Immediately** (before any input): a red card "Call 1930 now. Don't wait for this page." with a tap-to-call link,
   plus "Already called? Continue". The plan also works if they are on hold.
3. Intake: optional story (any language), up to 4 screenshots, "Did you make the payment yourself?" (yes / no / not sure),
   "When did you first find out?" (date/time).
4. **Analyse with BharatCode**: a live progress panel shows queue state, each tool call (e.g. "Checked UPI ID
   `refund.helpdesk@okaxis`: valid format"), and the final extraction.
5. **Review facts**: transactions (amount, date/time, UTR, payee UPI/account, bank), scammer identifiers and what was
   compromised. Each fact shows its source ("from your story: '…'" or "read by AI from screenshot 2: check it") and a
   validator badge. The person edits, deletes or adds facts.
6. **Plan & documents**: ordered steps with urgency; call sheet; complaint draft; bank letter; entitlement note.
   Copy, share to WhatsApp, print. Facts can be edited and everything regenerates instantly without another AI call.

### J2. "Check before you pay"
1. Landing → **"Check a message"**. Paste text and/or attach a screenshot.
2. Result: one of three verdicts ("Strong scam signs" / "Some warning signs" / "No known scam pattern found (not a
   guarantee)"), each signal quoted, which signals came from fixed rules and which from the AI, link/UPI/phone checks,
   and what to do (don't pay, don't share OTP, report on Chakshu, block). If they already paid → one tap to J1 with the message attached.

### J3. No AI available (no key on server, BharatCode busy, or user prefers)
"Enter details yourself" opens the same review form empty; J1 steps 5–6 work fully. "Check before you pay" falls
back to rules-only signals, clearly labelled.

### J4. Sample cases (demo)
Four sample cases (electricity-bill scam, fake internship fee, "digital arrest", unauthorised card debit) open with
**pre-filled facts labelled "Sample: filled in by hand, no AI call"**. If the server has a key, a sample can also be
"Run through BharatCode" using its sample story and synthetic screenshots.

## 5. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| F1 | Show "Call 1930" before any input on the lost-money path; tap-to-call `tel:1930` | P0 |
| F2 | Accept story ≤ 4,000 chars and ≤ 4 images (PNG/JPEG/WebP), downscaled in the browser to ≤ 1,600 px | P0 |
| F3 | Server-side BharatCode analysis with tool calling, image input and structured output; streamed progress to the browser | P0 |
| F4 | Every extracted fact carries a source (story quote or screenshot number + quote) | P0 |
| F5 | Deterministic validators: UTR/RRN, UPI ID, IFSC, Indian phone number, bank account number, email, URL | P0 |
| F6 | Story quotes are verified against the story text; image-derived facts are labelled "read by AI, check it" | P0 |
| F7 | Editable fact review; documents regenerate client-side without a model call | P0 |
| F8 | Deterministic plan engine (ordering, urgency, conditional steps for OTP/remote-app/card compromise) | P0 |
| F9 | Entitlement note: classify authorised-under-deception vs unauthorised; for unauthorised, compute working days under RBI's 2017 Table 2 | P0 |
| F10 | Documents: 1930 call sheet, NCRP complaint draft, bank letter; copy/share/print | P0 |
| F11 | Fact lock: AI-written narrative may only contain numbers present in confirmed facts; violations flagged and removed | P0 |
| F12 | "Check before you pay" with rule floors that the AI can raise but never lower | P1 |
| F13 | Manual entry path and graceful no-key mode | P0 |
| F14 | Sample cases with honest labelling | P0 |
| F15 | "How it works" page that shows the BharatCode integration and limits | P1 |
| F16 | Hindi labels on the call sheet; narrative language toggle (English/Hindi) via the model | P2 |

## 6. Non-functional requirements

- **Privacy:** no database, no server logs of content (only request id, timings, error kind). Case kept in the
  browser's `sessionStorage` so a refresh doesn't lose it; "Clear this case" button.
- **Security:** API key server-side only; same-origin check on POST; per-IP rate limit; body-size limits; strict
  input validation; security headers; tools are pure functions with no network or side effects.
- **Performance:** first contentful paint < 2 s on 4G; analysis typically < 60 s depending on BharatCode queue; UI never blocks without a status.
- **Accessibility:** WCAG 2.2 AA target; keyboard operable; axe: no serious/critical violations; 16 px base text; 44 px tap targets.
- **Responsive:** 320 px to desktop; no horizontal scroll.
- **Reliability:** 503 retry with backoff; incomplete responses never execute tool calls; every failure leaves the manual path available with the person's inputs intact.

## 7. Feature prioritisation

**P0 (must ship):** F1–F11, F13, F14. **P1:** F12, F15. **P2:** F16.
Deliberately excluded: accounts, history, multi-case dashboards, chat interface, browser extension, voice.

## 8. Success metrics

| Metric | How measured | Target |
|---|---|---|
| Invented-number rate in generated text | Fact-lock check over eval cases (`npm run eval`) | 0 after the fact lock; report the pre-lock rate honestly |
| Field extraction accuracy (amount, UTR, payee ID, date) | Gold eval set, exact match after normalisation | Report measured value; no target claimed before a live run |
| Validator correctness | Unit tests | 100% of test vectors |
| Plan correctness | Scenario tests for each branch | 100% |
| Rule-floor recall on labelled scam messages | `npm run eval:rules` over authored set | Report measured value (synthetic set, caveated) |
| Time to call sheet (manual path) | E2E timing | < 2 minutes for a practised user |

## 9. Content and tone

- Calm, direct, short sentences. Never blame the victim ("Scammers are professionals. Acting fast is what matters now.").
- No promises: "may", "can ask", "the bank decides".
- Official channels only: 1930, cybercrime.gov.in, sancharsaathi.gov.in (Chakshu), cms.rbi.org.in / 14448, the bank's official number printed on the card or passbook.

## 10. Risks

See `research/project-selection.md` §3 "Main risks". Product-specific additions:
- People may skip calling 1930 to "finish the form first" → F1 places the call first and repeats it at the top of the plan.
- Someone may paste a sample's fictional data into a real complaint → samples carry a visible "SAMPLE: not real" watermark on documents.

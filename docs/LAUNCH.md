# Turant: launch and presentation kit

Everything here is a draft for the owner to review and post from their own accounts. Nothing has been posted.

## 1. Name and tagline

- **Name:** Turant (तुरंत, "right away")
- **Tagline:** Lost money to a scam? The next hour matters.
- **One-liner:** Turant turns your screenshots into exactly what to say to 1930 and your bank, in the right
  order, without making anything up.

## 2. Official submission (bharatcode.ai/hackathon form)

- **Project name** (≤160): `Turant: first-hour help after a scam, powered by BharatCode`
- **GitHub repo URL:** `https://github.com/Sahvendra7/BharatCode` (main repo link, not a branch link; must be public first)
- **Short summary** (≤1,000 characters; this draft is ~900):

> Turant helps people in India in the hour after a scam. It shows "Call 1930" first, then reads the
> victim's story and screenshots (UPI receipts, bank SMS, chats) with BharatCode's qwen-3.8-27b, using image
> input, app-side tool calls (UTR/UPI/IFSC/phone validators, link inspection, IST date parsing) and strict
> structured output. Turant's own rules re-check every fact, build the action plan in the right order, apply
> RBI's 2017 liability circular only where it applies (most scam payments aren't covered), and write a 1930
> call sheet, a cybercrime.gov.in complaint draft and a bank letter. A "fact lock" replaces any number the AI
> can't back up with [check]. Also: a "check before you pay" mode where fixed rules set a minimum verdict.
> Works without a key via sample cases and manual entry. 136 unit/API tests and 36 Playwright tests (desktop +
> mobile, axe). Open source, MIT.

## 3. README introduction

The README opens with the tagline, a two-sentence description, the landing screenshot and a disclaimer:
see [`README.md`](../README.md).

## 4. Landing page

The app's own home page (`/`) is the landing page: headline, the 1930 call button, a sample call sheet
showing the source badges and `[check]`, three steps, four sample cases and the "AI reads, code decides" principle.

## 5. Demo

- **GIF in README:** `docs/media/demo-sample.gif`. Sample case, no AI.
- **Video to record once a key is available (90 s):** run the electricity sample through BharatCode
  ("Run this sample through BharatCode AI"), so the live tool trace and AI-read facts are real. Record the
  screen with the browser at 1280×800. Don't show the `.env` file or terminal with the key.

## 6. Two-minute presentation script

| Time | Say | Show |
|---|---|---|
| 0:00–0:15 | "In 2025 Indians filed about 24 lakh cyber-fraud complaints. The first hour after a scam decides whether money can still be held. And that hour is usually spent panicking." | Landing page |
| 0:15–0:30 | "Every scam tool helps before you pay. Turant is for after. The first thing it shows is: call 1930. It never stands between you and the helpline." | Tap the 1930 slab; help page |
| 0:30–1:00 | "Then you tell it what happened, in any language, with screenshots. BharatCode's Qwen 3.8 reads them, and you can watch it call our validators live: the UTR, the UPI ID, the time." | Intake with screenshots; live trace |
| 1:00–1:25 | "The model reads. Code decides. Every fact shows where it came from, and screenshot facts are marked 'check it'. The plan is built by tested rules: 1930, then your bank, then the written complaint." | Results: badges, plan |
| 1:25–1:45 | "And the documents: a call sheet to read out, a complaint for cybercrime.gov.in, a bank letter. If the AI writes a number that isn't a confirmed fact, it becomes [check]. We never invent a number." | Complaint with [check] |
| 1:45–2:00 | "It even gets the refund rules right: most scam payments aren't covered by RBI's zero-liability rule, and Turant says so honestly. Free, open source, built on BharatCode. Send it to your parents." | RBI note; repo |

## 7. Screenshots to capture (already in `docs/media/`)

1. `landing.png`: hero with 1930 slab and sample call sheet
2. `sample-plan.png`: plan + fact review with source badges
3. `fact-lock.png`: complaint draft with a `[check]` stamp
4. `check-rules.png`: "Strong signs of a scam" with quoted signals
5. `ai-trace.png`, `ai-results.png`, `ai-complaint.png`: a **real** run with `qwen-3.8-27b` on the sample screenshots (31 Oct 2026)
6. `mobile-call-first.png`, `mobile-sample.png`: mobile views

## 8. GitHub launch announcement (draft)

> **Turant: help for the first hour after a scam (open source, built on BharatCode)**
>
> If someone you know pays a scammer, the next hour matters: 1930 can ask banks to hold money still sitting
> in the receiving account. But under stress, people can't find the UTR, don't know the order of steps, and
> get told wrong things about RBI refunds.
>
> Turant shows "Call 1930" first, then reads your screenshots with BharatCode's Qwen 3.8 27B, checks every
> UTR, UPI ID and phone number with deterministic validators, and writes your call sheet, cybercrime.gov.in
> complaint and bank letter. Numbers the AI can't back up become [check]. It never invents one.
>
> Try a sample case (no login, nothing stored): [link to deployment]
> Code (MIT): https://github.com/Sahvendra7/BharatCode
>
> Feedback welcome, especially scam messages in Indian languages we should recognise.

## 9. Community engagement (authentic only)

Do:
- Share in the BharatCode WhatsApp/Discord with a specific ask: "try the sample case and tell me what's confusing".
- Post in college groups and to family WhatsApp groups as a safety resource, not as "please vote". Voting is
  one per registered account and changeable, so it should follow genuine interest.
- Ask college cyber-cells, NSS units or digital-literacy volunteers for feedback; offer to add their language.
- Open "good first issue" tickets (more UPI handles, IFSC codes, Indian-language scam phrases) so developers can contribute.
- Answer every issue and comment; credit contributors in the README.

Don't:
- Ask for stars or votes in exchange for anything, use multiple accounts, star-for-star groups, or mass DMs.
- Post fake testimonials or claim recovery outcomes Turant can't know.
- Use real victims' data or screenshots in demos.

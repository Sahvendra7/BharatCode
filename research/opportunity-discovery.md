# Opportunity discovery

Inputs: `hackathon-analysis.md` (rules, API), `competitor-analysis.md` (65 repos inspected, market research),
`github-audit.md` (existing assets). Candidates were generated from **gaps found in that evidence**, across consumer,
civic, financial, legal, education, business and developer domains. Each candidate answers the same ten questions:

1. Who has the problem? 2. How important/frequent? 3. How is it solved today? 4. Why is that insufficient?
5. What would make a new solution meaningfully different? 6. Role of AI? 7. Why BharatCode?
8. What can be demonstrated convincingly? 9. Implementation difficulty? 10. What drives adoption and recommendation?

Evidence links are in `competitor-analysis.md` §6 unless given inline.

---

## C1. Fraud first-response kit ("I just lost money to a scam: what now?")

1. **Who:** anyone in India who has just paid a scammer or seen unauthorised debits, and the family member helping
   them. Students are targeted directly (fake internships, task scams) and are usually the ones helping parents.
2. **Importance:** ~24 lakh financial-fraud complaints and ~₹19,800–22,500 crore reported lost in 2025; >12.7 lakh
   complaints in H1 2026. Reporting speed measurably matters (CFCFRMS holds funds still in mule accounts; ~₹8,189 crore "saved" by end-2025).
3. **Today:** call 1930, file on cybercrime.gov.in, call the bank, search blogs, ask relatives.
4. **Insufficient because:** under stress, victims can't find the UTR, payee UPI ID, exact time or amount buried in
   screenshots; they don't know the order of steps (bank block vs 1930 vs portal); advice online often misstates RBI
   liability rules (most scams are *authorised* payments, which the 2017 zero-liability circular does not cover);
   no tool turns their evidence into ready-to-read and ready-to-paste text. Commercial tools (Truecaller Scam Checker,
   ScamDekho, Seerie) stop at detection.
5. **Different:** response-first; extracts transaction facts from screenshots; deterministic action plan in the right
   order; correct RBI-liability classification with working-day arithmetic; 1930 call sheet, NCRP complaint text and
   bank letter that contain **only verified facts**; "Call 1930 now" shown *before* any AI runs.
6. **AI role (essential):** read messy multilingual screenshots (UPI receipts, bank SMS, WhatsApp chats) and free-text
   panic narratives; extract structured facts with quotes; classify the scam pattern; ask for missing facts; write a
   clear incident narrative. Rules can't read screenshots or Hinglish narratives; the model can.
7. **BharatCode fit:** Qwen 3.8 27B has image input, tool calling and structured output (all three are needed); flat
   pricing and free student access make a free public-good tool sustainable; nobody in the hackathon uses image input.
8. **Demo:** "Sunita's mother paid ₹48,500 to a fake electricity-board caller 20 minutes ago": upload two
   screenshots, and within a minute get the call sheet with UTRs, a pre-filled complaint and a bank letter. Instantly understandable to non-technical judges.
9. **Difficulty:** medium. Deterministic engine and validators are standard engineering; the model loop with tools,
   images and schema needs care; RBI rule fetched from the primary source.
10. **Adoption:** almost every family knows a victim; "send this to your parents" is natural sharing; free, no login,
    no data stored.

## C2. Health-insurance claim-rejection challenger

1. Families whose cashless/reimbursement claim was rejected or cut. 2. ~3.26 crore health claims FY25, ~8% repudiated;
health grievances +41% in FY25. 3. Insurer GRO → Bima Bharosa → Insurance Ombudsman; paid claim-assistance firms.
4. Rejection letters cite clauses people can't interpret; they don't know moratorium/PED rules or timelines.
5. Rejection-reason analysis against the policy wording + IRDAI rules, and a grievance draft with deadlines.
6. AI reads the letter and the long policy wording, maps the reason to clauses. 7. Long context (262k) + image input fit.
8. Strong demo (rejection "for non-disclosure" after 6 years of renewals → moratorium argument).
9. **High**: the 2024 IRDAI master circular's exact provisions conflict across secondary sources and the primary PDF
could not be retrieved reliably; wrong regulatory claims cause real financial harm. 10. High value per user, but
infrequent; voter base (students) is one step removed.

## C3. Scam message checker (before payment only)

1. Anyone receiving suspicious SMS/WhatsApp/calls. 2. Very frequent. 3. Truecaller Scam Checker (Sep 2026), ScamDekho,
Seerie, Google/Truecaller spam labels, Chakshu reporting. 4. Remaining gaps are small (screenshots on Truecaller "planned").
5. Hard to differentiate against Truecaller's community data. 6. Classification + explanation. 7. Image input helps.
8. Easy demo. 9. Low–medium. 10. Strong sharing, but competing against free incumbents with network effects.
**Assessment: commercially crowded as a standalone product; useful as a secondary mode of C1.**

## C4. Job/internship offer verifier for students

1. Students receiving offers via email/WhatsApp/Telegram. 2. Frequent in placement season; college notices warn about
fee-demanding fake internships; one case had 45 students charged ₹6,000 each. 3. Word of mouth, college notices,
LinkedIn checks. 4. No structured check. 5. Deterministic checks (fee demands, free-mail domains, CIN/GSTIN format
and checksum, UPI-to-individual payments) + AI reading of the offer. 6. Extraction + reasoning. 7. Image input.
8. Good demo. 9. Medium. 10. Strong with student voters, but narrow and also covered by ScamDekho's "job offer" feature.
**Assessment: best folded into C1 as a scam pattern with its own sample case.**

## C5. Consumer-complaint escalation assistant (e-commerce refunds, telecom, travel)

1. Online shoppers with failed refunds. 2. >5.1 lakh e-commerce complaints to NCH in 2025. 3. Platform support → NCH
(1915/INGRAM) → e-Daakhil consumer commission. 4. People don't know the ladder or what to write. 5. Timeline +
evidence pack + drafted grievance. 6. Drafting and extraction. 7. Fine. 8. Moderate demo. 9. Low–medium.
10. **Official channels are already free and reasonably guided; AI adds mostly drafting.** Moderate differentiation.

## C6. Government-recruitment notification decoder

1. Govt-job aspirants. 2. Very frequent. 3. Sarkari-result sites, many free age/relaxation calculators.
4. Notifications are long PDFs; the API has no file input (client-side PDF text extraction needed). 5. Eligibility
from the actual notification text. 6. Extraction. 7. Long context. 8. OK demo. 9. Medium–high (PDF variety, accuracy).
10. Crowded with free tools and ad-supported sites.

## C7. Official-notice decoder (income-tax intimations, bank notices, legal notices)

1. Taxpayers and families receiving formal notices. 2. Seasonal for tax; legal notices less frequent. 3. CAs, tax
platforms' AI helpers. 4. Generic. 5. Notice-type-specific explanation. 6. Explanation. 7. Fine. 8. OK demo.
9. Medium, with professional-advice liability. 10. Commercial incumbents (tax platforms) already do this for their users.

## C8. BharatCode eval & regression harness for builders

1. Developers building on BharatCode. 2. Every builder needs it, but rarely recognises it. 3. promptfoo, custom
scripts. 4. Not queue-aware or BharatCode-tuned. 5. Queue-aware runner, schema checks, report. 6. The model is the
thing under test. 7. Native. 8. Hard to make compelling to non-developers. 9. Medium. 10. Niche;
developer-tools direction is ~35% of entries.

## C9. Resilient BharatCode client SDK

1. Builders. 2. Every entrant must handle 503/queue/incomplete/tool loops. 3. OpenAI SDK + ad-hoc code. 4. Edge cases
are repeatedly mis-handled (see competitor grep: most entries lack `incomplete` handling). 5. Correct handling out of
the box. 6. None in the product itself. 7. Native. 8. Weak demo. 9. Low. 10. Useful, but thin as a hackathon "product"
and judged as infrastructure. **Its core can live inside C1's integration layer instead.**

## C10. Small-business GST invoice validator

1. Freelancers/MSMEs. 2. Monthly. 3. Tally/Zoho/accountants. 4. Errors caught late. 5. GSTIN checksum, tax math,
HSN checks from an invoice photo. 6. Extraction from images. 7. Image input. 8. Decent demo. 9. Medium. 10. Paid
accounting tools dominate; students aren't the audience.

## C11. Rental deposit & agreement assistant

1. Tenants. 2. At move-in/move-out. 3. Lawyers, templates. 4. Evidence is scattered. 5. The owner has already
built a separate project for this problem; repeating it adds little. **Rejected: duplicates existing work.**

## C12. Prescription / discharge-summary explainer

1. Patients and caregivers. 2. Frequent. 3. Doctors, pharmacists. 4. Handwriting, jargon. 5. Translation into plain
language. 6. OCR + explanation. 7. Image input. 8. Strong demo. 9. Medium. 10. **Rejected on safety**: misreading a
dose or drug name from handwriting is a direct patient-harm risk that a hackathon prototype cannot responsibly carry.

## C13. WhatsApp-forward misinformation checker

1. Families on WhatsApp. 2. Very frequent. 3. Fact-check sites (Alt News, Factly, PIB Fact Check). 4. Slow, manual.
5. Instant checks with sources. 6. Requires web retrieval. 7. **BharatCode has no hosted search tool**; would need a
paid search API and still risks confident wrong verdicts. 8. Good demo when it works. 9. High. 10. High sharing, high
reputational risk. **Rejected: core capability depends on retrieval the stack doesn't provide, and wrong verdicts spread.**

---

## Rejected as weak or superficial (summary)

| Candidate | Reason |
|---|---|
| C3 standalone scam checker | Commercially crowded (Truecaller, ScamDekho, Seerie); kept only as a secondary mode of C1 |
| C6 recruitment decoder | Many free calculators; PDF/no-file-input friction |
| C7 notice decoder | Incumbent tax platforms; professional-advice liability |
| C8/C9 dev tooling | Saturated direction; thin for non-developer judges; C9's value is absorbed into C1's model layer |
| C10 GST validator | Paid incumbents; audience mismatch |
| C11 rental | Duplicates owner's existing project |
| C12 medical | Patient-safety risk |
| C13 misinformation | Needs retrieval BharatCode doesn't host; high harm from wrong verdicts |

Shortlist for scoring in `project-selection.md`: **C1, C2, C4, C5, C8.**

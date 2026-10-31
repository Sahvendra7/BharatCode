# Competitor and market analysis

Research date: 30 October 2026. Every repository listed below was **shallow-cloned and inspected** (file tree,
README, and a code grep for API usage), not just read from its submission summary. Two repositories could not be
cloned (`zaibshamsi/qa-automation`, `harsshithat1708-source/Investwise`, both returned errors, likely private or
deleted), and two were empty (`Annushreee/RecallAI`, `devilTa1K/CodeShield-AI` had 0 tracked files on the default branch).

Method notes (so the numbers can be reproduced):
- Submission data: `GET https://bharatcode.ai/api/hackathon/projects` (66 entries, 65 unique repos; Atithyam was submitted twice).
- "BharatCode call in code" = a non-Markdown, non-`BharatCode.txt` file contains `bharatcode.ai/api`, `api/model/v1`,
  `qwen-3.8-27b` or `deepseek-v4.1`. This can produce false negatives when a base URL lives only in an env file, so a
  "no" means "not found in committed code", not "proven absent".
- "Other providers" = case-insensitive file-level grep for provider names in non-Markdown files. Mentions can be
  comments or optional fallbacks; it indicates presence, not exclusivity.
- Test-file and CI counts are path-pattern counts, not proof the tests pass.

## 1. All submissions, ranked by observed community score

`*` Community score = 0.5 × normalised stars + 0.5 × normalised votes (see `hackathon-analysis.md` §6). Snapshot of 30 Oct 2026.

| # | Project | Repo | Stars | Votes | Community score* |
|---|---|---|---|---|---|
| 1 | OrvynAi — Adaptive AI Interview & Skill Assessment Platform | [itzVarun1426/OrvynAI](https://github.com/itzVarun1426/OrvynAI) | 18 | 41 | 65.5 |
| 2 | BharatCode Visual Studio Code Extension | [thenabbu/BharatCode-VSCode-Extension](https://github.com/thenabbu/BharatCode-VSCode-Extension) | 30 | 28 | 60.0 |
| 3 | ashby-job-scraper | [rishilahoti/ashby-job-scraper](https://github.com/rishilahoti/ashby-job-scraper) | 58 | 5 | 56.1 |
| 4 | Nazar – free AI code review for every Indian developer | [Ironankit525/nazar](https://github.com/Ironankit525/nazar) | 9 | 26 | 39.5 |
| 5 | EklavyaX | [Sayandevxyz/EklavyaX](https://github.com/Sayandevxyz/EklavyaX) | 3 | 15 | 20.9 |
| 6 | Crystal | [Saatwik-ss/Crystal-Desktop](https://github.com/Saatwik-ss/Crystal-Desktop) | 0 | 10 | 12.2 |
| 7 | AI-StudyMate | [Siddu-119/AI-StudyMate](https://github.com/Siddu-119/AI-StudyMate) | 5 | 4 | 9.2 |
| 8 | IssuePilot | [aeyjeyaryan/IssuePilot](https://github.com/aeyjeyaryan/IssuePilot) | 8 | 1 | 8.1 |
| 9 | QA auto-pilot | [zaibshamsi/qa-automation](https://github.com/zaibshamsi/qa-automation) | 4 | 3 | 7.1 |
| 10 | Showboard | [rohanbeingsocial/showboard](https://github.com/rohanbeingsocial/showboard) | 5 | 2 | 6.7 |
| 11 | algoxai | [Lokesh-102214/algoxai](https://github.com/Lokesh-102214/algoxai) | 5 | 2 | 6.7 |
| 12 | marg | [Mqhnish/marg](https://github.com/Mqhnish/marg) | 7 | 0 | 6.0 |
| 13 | contextbridge-ai | [lvhNaruto/contextbridge-ai](https://github.com/lvhNaruto/contextbridge-ai) | 1 | 4 | 5.7 |
| 14 | StudyPilot AI | [bhavyalovestocode/studypilot-ai](https://github.com/bhavyalovestocode/studypilot-ai) | 0 | 3 | 3.7 |
| 15 | Mumma's Kitchen | [adi-1080/mumma](https://github.com/adi-1080/mumma) | 0 | 3 | 3.7 |
| 16 | Research Mind | [jiya1928/Multiagent-ai-research-system-Research-Mind](https://github.com/jiya1928/Multiagent-ai-research-system-Research-Mind) | 1 | 2 | 3.3 |
| 17 | Atithyam – AI-Powered Hotel Review Intelligence & Competitive Benchmar | [Ashish-Rautela/Atithyam](https://github.com/Ashish-Rautela/Atithyam) | 1 | 2 | 3.3 |
| 18 | AI powered complaint management system | [sunil691/AI-POWERED-COMPLAINT-MANAGEMENT](https://github.com/sunil691/AI-POWERED-COMPLAINT-MANAGEMENT) | 0 | 2 | 2.4 |
| 19 | AccessPath — Accessible Journeys & Barrier Improvement Simulator | [sakshamlc/AccessPath](https://github.com/sakshamlc/AccessPath) | 0 | 2 | 2.4 |
| 20 | maitreanushka-source's Project | [maitreanushka-source/Civicsense-municipal-intelligence](https://github.com/maitreanushka-source/Civicsense-municipal-intelligence) | 0 | 2 | 2.4 |
| 21 | RecallAI | [Annushreee/RecallAI](https://github.com/Annushreee/RecallAI) | 0 | 2 | 2.4 |
| 22 | SENTINEL | [h4rsh740/SENTINEL](https://github.com/h4rsh740/SENTINEL) | 0 | 2 | 2.4 |
| 23 | Defensight | [Aayush-Poonia/DefenSight](https://github.com/Aayush-Poonia/DefenSight) | 0 | 2 | 2.4 |
| 24 | LIFEGRID AI | [sirigiricharitha27/LIFEGRID-AI](https://github.com/sirigiricharitha27/LIFEGRID-AI) | 0 | 2 | 2.4 |
| 25 | ATITHYAM | [Ashish-Rautela/Atithyam](https://github.com/Ashish-Rautela/Atithyam) | 1 | 1 | 2.1 |
| 26 | SemanticCache | [0x-bala/semanticcache](https://github.com/0x-bala/semanticcache) | 1 | 1 | 2.1 |
| 27 | Shakira / Commits Don't Lie | [adot-7/commits-dont-lie](https://github.com/adot-7/commits-dont-lie) | 1 | 1 | 2.1 |
| 28 | MCP that automatically run prompt when BharatCode have free gpu | [subidhkhanal/spare-gpu](https://github.com/subidhkhanal/spare-gpu) | 1 | 1 | 2.1 |
| 29 | Kosh — Minimalist Creative MCP Studio & Headless Blender Engine | [SachinyadavAug20/kosh](https://github.com/SachinyadavAug20/kosh) | 1 | 1 | 2.1 |
| 30 | EduSnap AI — AI Powered Attendance Management System | [pankajdikale/edusnap-ai](https://github.com/pankajdikale/edusnap-ai) | 2 | 0 | 1.7 |
| 31 | JARVIS-WEB | [anuveytq-sys/JARVIS-WEB](https://github.com/anuveytq-sys/JARVIS-WEB) | 2 | 0 | 1.7 |
| 32 | Yunas | [anasamin822-dotcom/yunas](https://github.com/anasamin822-dotcom/yunas) | 0 | 1 | 1.2 |
| 33 | AI Hand Gesture calculator | [ratan12-cell/AI_Hand_Gesture_Calculator](https://github.com/ratan12-cell/AI_Hand_Gesture_Calculator) | 0 | 1 | 1.2 |
| 34 | FeildProofAI | [rajatmurhe/fieldproof-ai](https://github.com/rajatmurhe/fieldproof-ai) | 0 | 1 | 1.2 |
| 35 | Firmware_Fix | [amaan2286/FirmWare_Fix](https://github.com/amaan2286/FirmWare_Fix) | 0 | 1 | 1.2 |
| 36 | TokenLens — VS Code LLM Cost Profiler & Code Optimizer | [GAUTHAM21K/TokenLens-VS-Code-LLM-Cost-Profiler-Code-Optimizer](https://github.com/GAUTHAM21K/TokenLens-VS-Code-LLM-Cost-Profiler-Code-Optimizer) | 0 | 1 | 1.2 |
| 37 | AlgoVisualizer | [Prakhar-Sethi012/AlgoVisualizer](https://github.com/Prakhar-Sethi012/AlgoVisualizer) | 0 | 1 | 1.2 |
| 38 | AGENT-PAY | [sarishanasane-beep/AGENT-PAY](https://github.com/sarishanasane-beep/AGENT-PAY) | 0 | 1 | 1.2 |
| 39 | Ecotrack-India | [0013muskan-hub/Ecotrack-India](https://github.com/0013muskan-hub/Ecotrack-India) | 0 | 1 | 1.2 |
| 40 | InvoiceKit | [jayendrakasera/invoicekit-backend](https://github.com/jayendrakasera/invoicekit-backend) | 0 | 1 | 1.2 |
| 41 | PlaceMate: A Personalized Placement Preparation Framework Using Assess | [Aaron-Coutinho/PlaceMate](https://github.com/Aaron-Coutinho/PlaceMate) | 0 | 1 | 1.2 |
| 42 | AGENI-X | [vaasu2906/AGEN-X](https://github.com/vaasu2906/AGEN-X) | 0 | 1 | 1.2 |
| 43 | Exam Night Rescue — AI 1-Night Study Companion | [TGunaSree/exam-night-rescue](https://github.com/TGunaSree/exam-night-rescue) | 0 | 1 | 1.2 |
| 44 | Clause Ai | [Karthik0956A/clauseai-2.0](https://github.com/Karthik0956A/clauseai-2.0) | 0 | 1 | 1.2 |
| 45 | DevDocs Intelligence | [affanraza84/devdocs-intelligence](https://github.com/affanraza84/devdocs-intelligence) | 1 | 0 | 0.9 |
| 46 | ShopAI | [AbhaySingh034/ShopAI](https://github.com/AbhaySingh034/ShopAI) | 1 | 0 | 0.9 |
| 47 | smartscan | [prathamgokulkar/SmartScan](https://github.com/prathamgokulkar/SmartScan) | 1 | 0 | 0.9 |
| 48 | CodoVyn | [Gautam-aman/CODOVYN](https://github.com/Gautam-aman/CODOVYN) | 1 | 0 | 0.9 |
| 49 | studystreak | [yogeshbamane16/studystreak](https://github.com/yogeshbamane16/studystreak) | 0 | 0 | 0.0 |
| 50 | ScopeBot | [suryakant-source/scopebot](https://github.com/suryakant-source/scopebot) | 0 | 0 | 0.0 |
| 51 | Investwise | [harsshithat1708-source/Investwise](https://github.com/harsshithat1708-source/Investwise) | 0 | 0 | 0.0 |
| 52 | codingAgents | [Kamalakar30/codingAgent](https://github.com/Kamalakar30/codingAgent) | 0 | 0 | 0.0 |
| 53 | IKS Explorer AI | [Jayant-2/IKS](https://github.com/Jayant-2/IKS) | 0 | 0 | 0.0 |
| 54 | DebugDost | [Shashank-VK/debugdost](https://github.com/Shashank-VK/debugdost) | 0 | 0 | 0.0 |
| 55 | oss-quest | [h4rsh740/oss-quest](https://github.com/h4rsh740/oss-quest) | 0 | 0 | 0.0 |
| 56 | DevCorp AI — Autonomous AI Company Simulator | [sagar25446-prog/AI-AGENTS-](https://github.com/sagar25446-prog/AI-AGENTS-) | 0 | 0 | 0.0 |
| 57 | PatchProofAI | [CodesbyRohit/PatchProofAI](https://github.com/CodesbyRohit/PatchProofAI) | 0 | 0 | 0.0 |
| 58 | Bharatcode_project | [nikhil-kumawat7/Bharatcode_project](https://github.com/nikhil-kumawat7/Bharatcode_project) | 0 | 0 | 0.0 |
| 59 | muse kit | [aditya8948/music_player_backend](https://github.com/aditya8948/music_player_backend) | 0 | 0 | 0.0 |
| 60 | contextflow | [bmahajan18/ContextFlow](https://github.com/bmahajan18/ContextFlow) | 0 | 0 | 0.0 |
| 61 | CodeShield AI | [devilTa1K/CodeShield-AI](https://github.com/devilTa1K/CodeShield-AI) | 0 | 0 | 0.0 |
| 62 | Nexus – AI Personal Assistant & Automation System | [Sachin1707-jpg/Nexus](https://github.com/Sachin1707-jpg/Nexus) | 0 | 0 | 0.0 |
| 63 | BharatCode PR Reviewer | [AnmolSrivastava3000/workflows](https://github.com/AnmolSrivastava3000/workflows) | 0 | 0 | 0.0 |
| 64 | CrustCraft – Premium Pizza Delivery Platform | [basavarajmg450-oss/OIBSIP](https://github.com/basavarajmg450-oss/OIBSIP) | 0 | 0 | 0.0 |
| 65 | PrepCoach | [eres0045/prepcoach](https://github.com/eres0045/prepcoach) | 0 | 0 | 0.0 |
| 66 | AI_Agent | [Ary1727/AI_Agent](https://github.com/Ary1727/AI_Agent) | 0 | 0 | 0.0 |

## 2. Implementation signals for every cloned repository

| 0013muskan-hub/Ecotrack-India | 29 | no | - | 0 | 0 | none |
| 0x-bala/semanticcache | 72 | no | gemini openai ollama  | 28 | 1 | LICENSE |
| Aaron-Coutinho/PlaceMate | 65 | no | gemini groq openai  | 2 | 0 | none |
| Aayush-Poonia/DefenSight | 145 | no | gemini groq openai  | 0 | 0 | none |
| AbhaySingh034/ShopAI | 1730 | no | groq openai  | 60 | 0 | none |
| AnmolSrivastava3000/workflows | 555 | no | - | 6 | 1 | none |
| Annushreee/RecallAI | 0 | no | - | 0 | 0 | none |
| Ary1727/AI_Agent | 102 | no | groq openai  | 4 | 0 | none |
| Ashish-Rautela/Atithyam | 222 | no | gemini groq  | 19 | 1 | none |
| CodesbyRohit/PatchProofAI | 274 | yes | openai  | 79 | 1 | LICENSE |
| GAUTHAM21K/TokenLens-VS-Code-LLM-Cost-Profiler-Code-Optimizer | 369 | no | gemini groq openai anthropic  | 66 | 1 | LICENSE |
| Gautam-aman/CODOVYN | 592 | no | gemini openai openrouter  | 121 | 7 | LICENSE |
| Ironankit525/nazar | 94 | yes | groq openai anthropic  | 9 | 3 | LICENSE |
| Jayant-2/IKS | 57 | no | gemini  | 0 | 0 | none |
| Kamalakar30/codingAgent | 1 | no | - | 0 | 0 | none |
| Karthik0956A/clauseai-2.0 | 115 | no | gemini groq  | 0 | 0 | none |
| Lokesh-102214/algoxai | 203 | no | gemini groq openai anthropic ollama openrouter sarvam  | 18 | 3 | LICENSE |
| Mqhnish/marg | 31 | yes | openai  | 7 | 1 | LICENSE |
| Prakhar-Sethi012/AlgoVisualizer | 291 | no | gemini  | 0 | 0 | none |
| Saatwik-ss/Crystal-Desktop | 279 | no | gemini groq openai ollama  | 11 | 1 | LICENSE |
| Sachin1707-jpg/Nexus | 105 | no | gemini groq openai ollama  | 5 | 0 | LICENSE |
| SachinyadavAug20/kosh | 43 | no | gemini openai  | 2 | 0 | none |
| Sayandevxyz/EklavyaX | 160 | no | gemini groq openai openrouter  | 6 | 0 | none |
| Shashank-VK/debugdost | 11 | yes | openai  | 1 | 0 | none |
| Siddu-119/AI-StudyMate | 36 | no | gemini groq  | 2 | 0 | none |
| TGunaSree/exam-night-rescue | 19 | no | gemini  | 0 | 0 | none |
| adi-1080/mumma | 88 | no | groq openai openrouter  | 0 | 0 | none |
| aditya8948/music_player_backend | 44 | no | - | 6 | 1 | none |
| adot-7/commits-dont-lie | 68 | yes | openai anthropic  | 16 | 0 | LICENSE |
| aeyjeyaryan/IssuePilot | 65 | no | ollama  | 13 | 0 | LICENSE |
| affanraza84/devdocs-intelligence | 69 | no | gemini groq  | 8 | 0 | none |
| amaan2286/FirmWare_Fix | 13 | no | - | 1 | 0 | none |
| anasamin822-dotcom/yunas | 45 | yes | gemini openai ollama  | 4 | 0 | none |
| anuveytq-sys/JARVIS-WEB | 82 | yes | gemini openai anthropic openrouter  | 0 | 3 | LICENSE |
| basavarajmg450-oss/OIBSIP | 102 | no | groq  | 0 | 0 | none |
| bhavyalovestocode/studypilot-ai | 28 | no | groq openai  | 2 | 0 | none |
| bmahajan18/ContextFlow | 18 | no | gemini groq openai  | 0 | 0 | none |
| devilTa1K/CodeShield-AI | 0 | no | - | 0 | 0 | none |
| eres0045/prepcoach | 21 | no | openai  | 5 | 0 | none |
| h4rsh740/SENTINEL | 58 | yes | - | 6 | 0 | LICENSE |
| h4rsh740/oss-quest | 80 | yes | openai  | 5 | 0 | LICENSE |
| itzVarun1426/OrvynAI | 90 | no | gemini groq  | 0 | 0 | none |
| jayendrakasera/invoicekit-backend | 64 | no | - | 1 | 0 | LICENSE |
| jiya1928/Multiagent-ai-research-system-Research-Mind | 10 | no | gemini groq openai anthropic ollama  | 0 | 0 | none |
| lvhNaruto/contextbridge-ai | 113 | no | gemini  | 5 | 1 | LICENSE |
| maitreanushka-source/Civicsense-municipal-intelligence | 2 | no | - | 0 | 0 | none |
| nikhil-kumawat7/Bharatcode_project | 1 | no | - | 0 | 0 | none |
| pankajdikale/edusnap-ai | 143 | no | groq  | 2 | 1 | none |
| prathamgokulkar/SmartScan | 202 | no | groq openai  | 0 | 0 | none |
| rajatmurhe/fieldproof-ai | 139 | no | gemini  | 12 | 1 | none |
| ratan12-cell/AI_Hand_Gesture_Calculator | 37 | no | - | 0 | 0 | none |
| rishilahoti/ashby-job-scraper | 186 | no | gemini groq openai anthropic openrouter  | 17 | 5 | LICENSE |
| rohanbeingsocial/showboard | 168 | yes | gemini openai anthropic  | 18 | 1 | LICENSE |
| sagar25446-prog/AI-AGENTS- | 44 | yes | gemini openai  | 0 | 1 | none |
| sakshamlc/AccessPath | 26 | no | gemini  | 0 | 0 | none |
| sarishanasane-beep/AGENT-PAY | 810 | no | groq openai  | 46 | 0 | none |
| sirigiricharitha27/LIFEGRID-AI | 13 | yes | - | 1 | 1 | LICENSE |
| subidhkhanal/spare-gpu | 62 | yes | - | 23 | 1 | LICENSE |
| sunil691/AI-POWERED-COMPLAINT-MANAGEMENT | 74 | no | groq  | 2 | 0 | none |
| suryakant-source/scopebot | 30 | yes | openai  | 0 | 0 | LICENSE |
| thenabbu/BharatCode-VSCode-Extension | 10933 | yes | gemini groq openai anthropic ollama openrouter sarvam  | 2599 | 7 | LICENSE |
| vaasu2906/AGEN-X | 104 | no | openai anthropic ollama  | 10 | 0 | none |
| yogeshbamane16/studystreak | 29 | yes | gemini groq openai  | 0 | 0 | none |

Summary of the table:
- **16 of 63 cloned repositories** contain a BharatCode API call in committed code. The rest use Gemini, Groq,
  OpenAI-compatible third parties, Ollama, or no model at all (several are non-AI apps: a pizza store, a music player,
  an invoicing backend, a hand-gesture calculator).
- Among the 16 with a BharatCode call, **image input to BharatCode appears in only one** (JARVIS-WEB, in a `docs/` demo
  file). Responses-API usage appears in 2 (marg, Showboard); the rest use Chat Completions. Function/tool calling with
  BharatCode appears in about 6 (marg, Showboard, spare-gpu, commits-dont-lie, Yunas, SENTINEL). Structured output
  appears in about 5.
- 6 of the top 10 by community score show no BharatCode call: OrvynAI (Gemini/Groq), ashby-job-scraper (no LLM call
  to BharatCode; Gemini/Groq/Anthropic mentions), EklavyaX (OpenRouter/Gemini/OpenAI per its README), Crystal (Groq/Gemini/Ollama),
  AI-StudyMate (Gemini; "BharatCode" appears only as a label), IssuePilot (Ollama). QA auto-pilot could not be cloned.

## 3. Detailed profiles (21 entries)

### 3.1 OrvynAI: adaptive interview platform (#1, 18★, 41 votes)
- **User / problem:** job seekers preparing for technical interviews; generic question banks.
- **Features:** resume + job-description analysis, adaptive follow-up questions, performance report.
- **Implementation:** React + Node + MongoDB; README badges and code show **Gemini** (and Groq); **no BharatCode call found**; no tests, no CI.
- **Differentiation:** questions grounded in the candidate's own resume.
- **Weaknesses:** crowded category (PlaceMate, PrepCoach, StudyPilot also do interview/placement prep); doesn't use the hackathon's API.
- **Why it leads votes [INTERPRETATION]:** the voter base is students, and interview prep is personally relevant to almost all of them.

### 3.2 BharatCode VS Code Extension (#2, 30★, 28 votes)
- **User / problem:** developers who want an agentic coding assistant on BharatCode.
- **Implementation:** an openly declared **fork of Kilo Code (itself a fork of OpenCode)**, ~10,900 files, MIT, 7 CI
  workflows, published on the VS Code Marketplace; rebranded so bharatcode.ai is the only provider.
- **Strength:** real distribution (marketplace installs), immediately useful to BharatCode's own users.
- **Weakness:** the novel engineering is integration/rebranding, not new product thinking; most code is upstream.

### 3.3 ashby-job-scraper (#3, 58★, 5 votes)
- **User / problem:** job seekers; jobs scattered across ATS boards.
- **Implementation:** Next.js 16, Postgres, Docker, Cloudflare Tunnel, 5 CI workflows, tests; ATS adapters and change detection.
- **AI use:** none against BharatCode in committed code. Strong engineering, weak hackathon-API fit.
- **Lesson:** a genuinely useful free tool earns stars from outside the voter base (most stars of any entry).

### 3.4 Nazar: free AI code review (#4, 9★, 26 votes)
- **User / problem:** Indian students/indie devs who can't pay $15–30/month for AI review.
- **Implementation:** TypeScript GitHub Action + npm CLI; BharatCode `qwen-3.8-27b` via Chat Completions; schema-validated
  JSON; two-pass "verifier" to drop false positives; deterministic regex+entropy secret scanner; Hinglish mode; CI; MIT.
- **Strength:** well-scoped, honest, uses the flat-rate pricing as a product advantage; good README with live demo PRs.
- **Weakness:** AI code review is a crowded market (CodeRabbit, Copilot review, etc.) and crowded in this hackathon
  (CodeShield, BharatCode PR Reviewer, PatchProof).

### 3.5 EklavyaX: gamified learning (#5, 3★, 15 votes)
- Plain HTML/JS + FastAPI; README lists OpenRouter/Gemini/OpenAI; broad feature list (tutor, labs, XP, assignments);
  6 test-like files, no CI. Breadth over depth; generic.

### 3.6 Crystal: AI coding desktop (#6)
- Electron + FastAPI harness with Monaco, AST tools, embeddings; Groq and Gemini routing; **no BharatCode call**;
  136 committed binaries. Crowded category (coding harness).

### 3.7 IssuePilot: issue-to-PR agent (#8, 8★)
- Python; Ollama local model; retrieval + repro test + Docker sandbox; good engineering; **does not use BharatCode**.

### 3.8 Showboard: data dashboards via MCP (#10)
- TypeScript MCP server; question box defaults to BharatCode `qwen-3.8-27b` via Responses API with tools; good README
  with GIFs and measured token claims. One of the deepest BharatCode integrations.

### 3.9 marg: repository onboarding guide CLI (#12, 7★)
- Python, zero dependencies; Responses API + read-only tools; **verifies every `file:line` citation** against the
  lines it read ("108 citations verified, 0 unverified"). Best example in the field of *measurable trust* in model output.

### 3.10 ScopeBot: client brief → scope/estimates (0★)
- Next.js; `qwen-3.8-27b`; schema-validated JSON with retry; deployed on Vercel. Clean, but a single-prompt transformer.

### 3.11 DebugDost: traceback explainer in English/Hindi/Kannada (0★)
- 11 files; FastAPI + one HTML page; one Chat Completions call. Shows Indic-language output is a common, cheap differentiator.

### 3.12 Yunas: Hindi/English voice assistant for laptop/phone (0★)
- Local faster-whisper STT (because the API has no audio input), BharatCode picks from an allowlist of safe actions.
  Good safety pattern (allowlisted tools). Windows-only.

### 3.13 Commits Don't Lie: build-in-public post drafter with claim checking (1★)
- Python; BharatCode Chat Completions with tools; checks every claim against commits; a 2-minute demo video. Strong
  "verification" angle, niche audience.

### 3.14 SENTINEL: deterministic firewall for agent tool calls (0★)
- Python SDK/CLI + Next.js console; hash-chained decision receipts; BharatCode used only in an advisory role to draft
  policies. Strong concept, developer-only audience.

### 3.15 PatchProof AI / OSS Quest: test-verified patches (0★)
- Both run tests before/after an AI patch and refuse to claim success without evidence. Shows a cluster of
  "prove it" coding agents, all in the saturated developer-tools direction.

### 3.16 spare-gpu: queue-aware chore runner (1★)
- Reads BharatCode live load and only sends work when capacity is free; git-worktree isolation. Clever use of
  BharatCode-specific behaviour; Windows-only.

### 3.17 LIFEGRID AI: emergency response prototype (0★, 2 votes)
- Python; BharatCode for audience-specific emergency briefs with template fallback; explicitly labelled a demo with
  simulated events. Social-impact category; thin AI role.

### 3.18 AccessPath: accessible-journey simulator (0★, 2 votes)
- Built for a different challenge (Tata Young Social Innovator); Gemini; sample data. Civic/accessibility.

### 3.19 FieldProof AI: video QA for field service (0★)
- Gemini video understanding (which BharatCode cannot do: no video input). Good B2B idea; wrong API for this event.

### 3.20 Exam Night Rescue: Telegram study bot (0★)
- Photo of syllabus → time-boxed plan; Gemini for vision. Shows students want "photo in, plan out" flows.

### 3.21 Clause AI: legal document simplifier (0★)
- Next.js + MongoDB + Gemini; contract simplification, risk highlighting. Closest to "make an Indian document
  understandable", but generic and not on BharatCode.

## 4. Category saturation inside the hackathon

Categories were assigned by me from README + code (one primary category each, 65 unique repos):

| Category | Count | Examples | Assessment |
|---|---|---|---|
| Coding & developer tools (agents, review, debugging, IDEs, MCP, eval, caches) | ~23 | VS Code ext, Nazar, Crystal, IssuePilot, marg, Showboard, PatchProof, OSS Quest, CODOVYN, TokenLens, DebugDost, CodeShield, PR Reviewer, spare-gpu, SENTINEL, algoxai, SemanticCache, Kosh, DevDocs, Firmware Fix, codingAgents, DevCorp, QA auto-pilot | **Saturated** (≈35%) |
| Learning, exams & career prep | ~13 | OrvynAI, EklavyaX, AI-StudyMate, StudyPilot, PlaceMate, PrepCoach, studystreak, Exam Night Rescue, ContextBridge, IKS Explorer, AlgoVisualizer, EduSnap, ashby-job-scraper | **Saturated** (interview prep ×3) |
| Personal assistants / chat | ~6 | JARVIS-WEB, Yunas, Nexus, RecallAI, Mumma's Kitchen, ShopAI | Crowded, generic |
| Business / enterprise workflow | ~10 | Atithyam, ScopeBot, FieldProof, InvoiceKit, AGENT-PAY, Investwise, SmartScan, AGEN-X, AI_Agent, Complaint mgmt (pharma QA) | Fragmented |
| Civic, safety & public good | ~5 | CivicSense, AccessPath, LIFEGRID, Ecotrack, DefenSight | **Underserved**, mostly thin prototypes |
| Legal / rights / money protection for ordinary people | 1 | Clause AI (Gemini) | **Nearly empty** |
| Non-AI or unrelated | ~4 | CrustCraft pizza, muse kit, hand-gesture calculator, Bharatcode_project (1 file) | n/a |

**Nobody in the field** addresses financial fraud, scams, consumer rights, insurance claims, government notices or any
"something bad just happened to me, what do I do" situation, even though those are among the most common real
problems for Indian families (see §6).

## 5. Patterns: what earns community response here [INTERPRETATION, evidence-based]

1. **Personal relevance to students** earns votes (OrvynAI interview prep: 41 votes; Nazar "free for students": 26).
2. **Free, useful tools with real distribution** earn stars (ashby-job-scraper 58★; VS Code extension 30★, marketplace).
3. **Clear demos** (live PRs, GIFs, a 2-minute video) are common among the stronger READMEs.
4. **Trust mechanisms** (marg's verified citations, PatchProof's test evidence, Nazar's verifier pass) are the best
   engineering signals in the field, but they are almost all in developer tooling.
5. **Deep API use is rare**: image input, Responses API, tool loops and structured output together appear in no entry.
6. Thin wrappers (one prompt, one page) get no stars or votes.

## 6. External market research (outside the hackathon)

### 6.1 Financial fraud in India: size of the problem [EXTERNAL]
- NCRP (cybercrime.gov.in) financial-fraud complaints in 2025: ~24.0 lakh, ~₹22,495 crore reported lost (I4C table as
  reported by [Free Press Journal](https://www.freepressjournal.in/amp/mumbai/over-24-lakh-cyber-complaints-22495-crore-fraud-reported-in-2025));
  other reports give ₹19,813 crore across 21.78 lakh "cheating" complaints. Figures differ by definition, so treat them as a range.
- Jan–Jun 2026: >12.71 lakh financial cyber-fraud complaints, >₹10,178 crore ([Anantam IAS summary](https://anantamias.com/current-affairs/cyber-fraud-complaints-12-7-lakh-six-months/)).
- Senior citizens and women: ₹7,769.63 crore lost in 2025 per MHA reply to Rajya Sabha ([Asianet Newsable](https://newsable.asianetnews.com/india/senior-citizens-women-lost-rs-7-769-crore-to-cyber-fraud-in-2025-articleshow-u9oad8w)).
- CFCFRMS (the system 1930 calls feed into) reports ~₹8,189 crore "saved" by 31 Dec 2025 ([News On AIR](https://www.newsonair.gov.in/over-rs-7000-crore-saved-through-citizen-financial-)): **speed of reporting measurably matters**.
- Students are specifically targeted by fake internship/job offers with "registration fees" (college notices from
  [St. Xavier's Jaipur](https://sxcjpr.edu.in/wp-content/uploads/2025/12/Notice-regarding-Unauthorized-Internship-Offers-and-Fraudulent-Emails-2025.pdf),
  [CyberPeace](https://cyberpeace.org/resources/blogs/internship-scams-exposing-financial-frauds-targeting-students);
  case: [45 Jabalpur students charged ₹6,000 each](https://www.freepressjournal.in/bhopal/45-jabalpur-students-allegedly-cheated-in-fake-job-placement-scam-extorted-of-6k-each-in-delhi-video)).

### 6.2 Existing solutions for fraud [EXTERNAL]

| Product | What it does | Gap |
|---|---|---|
| [Truecaller Scam Checker](https://www.techrepublic.com/article/news-truecaller-scam-checker-apac-india/) (launched India 28 Sep 2026) | Check numbers, links, message descriptions against Truecaller's signals | **Before** payment only; screenshot upload "planned", not available ([ConsumerAffairs](https://www.consumeraffairs.com/news/truecaller-launches-free-tool-to-check-suspicious-links-and-phone-numbers-092926.html)); no help after money is lost |
| [ScamDekho](https://www.producthunt.com/products/scamdekho) | AI checker for messages, links, UPI IDs, QR, payment screenshots, job offers (EN/HI) | Detection only; closed source; accuracy unverified |
| [Seerie](https://www.producthunt.com/products/seerie) | On-device checker for SMS/links/screenshots (EN/HI) | Detection only |
| DoT [Chakshu](https://factly.in/explainer-government-launches-chakshu-to-report-sms-call-or-whatsapp-messages-attempting-to-commit-fraud/amp) on Sanchar Saathi | Report *suspected* fraud communication | Explicitly **not** for frauds that already happened; reporting only |
| 1930 helpline + cybercrime.gov.in (I4C) | Official reporting; routes to CFCFRMS to hold funds | The victim must supply UTRs, amounts, times, payee IDs under stress; secondary guides say a 1930 call produces an SMS reference that should be completed as a full complaint on the portal within about 24 hours ([Tribune](https://www.tribuneindia.com/news/himachal/cybercrime-helpline-number-linked-with-national-portal), [ApniLaw](https://www.apnilaw.com/legal-articles/how-to-file-a-cyber-fraud-complaint-on-the-national-cyber-crime-reporting-portal-ncrp-in-india/); not confirmed on an official I4C page); no guidance on bank letters or liability rules |
| Banks' own fraud lines | Block cards/UPI, accept disputes | Bank-specific; customer must know their RBI rights |
| Blogs / legal guides | Generic advice | Not personalised; often wrong on RBI liability (see below) |

**Market gap found:** detection ("is this a scam?") is now crowded commercially. **Response** ("I just lost money:
what exactly do I do, in what order, with which numbers, and what am I entitled to?") has no dedicated tool.

### 6.3 A correctness trap most advice gets wrong [EXTERNAL, primary source]
The RBI circular *Customer Protection – Limiting Liability of Customers in Unauthorised Electronic Banking
Transactions* (DBR.No.Leg.BC.78/09.07.005/2017-18, 6 July 2017;
[RBI index page](https://www.rbi.org.in/scripts/BS_CircularIndexDisplay.aspx?Id=11040)) grants zero liability for
third-party breaches reported within **3 working days**, and capped liability for **4–7 working days**
(₹5,000/₹10,000/₹25,000 by account type), with shadow reversal within **10 working days** of notification. But it
also says that where the loss is due to the customer's negligence "such as where he has shared the payment
credentials, the customer will bear the entire loss until he reports". Most scam losses are payments the victim was
manipulated into authorising, so they are generally **not** covered by the zero-liability rule. Telling victims "RBI
guarantees a refund within 3 days" is wrong and harmful. A response tool must classify the incident correctly before
it states any entitlement.

### 6.4 Other domains researched

| Domain | Evidence | Existing solutions | Notes |
|---|---|---|---|
| Health-insurance claim rejection | ~3.26 crore health claims FY25, ~8% repudiated; health grievances +41% to 1,37,361 in FY25 ([Angel One](https://oga-prod.angelone.in/news/personal-finance/irdai-data-reveals-41-spike-in-health-insurance-grievances-over-claim-settlements-in-fy25)); a secondary report cites ~53,184 ombudsman complaints in FY25 with ~71% resolved for policyholders (not verified against the CIO annual report) | Paid claim-assistance firms, Bima Bharosa portal, ombudsman | High value, but regulatory rules (moratorium, PED caps) conflict across secondary sources and the primary IRDAI circular could not be retrieved reliably |
| Consumer grievances (e-commerce refunds) | >5.1 lakh e-commerce complaints on National Consumer Helpline in 2025 ([Inc42](https://inc42.com/buzz/5-1-lakh-complaints-filed-against-ecommerce-platforms-in-2025-govt/)); NCH recovered ~₹45 crore in 2025 ([Business Standard](https://www.business-standard.com/india-news/national-consumer-helpline-resolves-67k-complaints-recovers-45-cr-in-2025-125122700291_1.html)) | NCH portal, INGRAM app, e-Daakhil (all free, official) | Official channels are already free and decent; AI adds drafting only |
| Govt job notification eligibility | Many free age/relaxation calculators exist ([example](https://onlineresult.in/tools/govt-exam-eligibility-calculator)) | Sarkari-result sites, calculators | Crowded with free tools |
| Income-tax 143(1) intimations | Frequently misunderstood ([TaxBuddy](https://www.taxbuddy.com/blog/section-1431-intimation-vs-income-tax-notice-taxbuddy)) | Tax-filing platforms with AI helpers, CAs | Commercial incumbents; seasonal |

## 7. Opportunities identified

1. **Post-incident fraud response** for ordinary people: underserved commercially, absent from the hackathon, with a
   measurable benefit from speed and a known correctness trap a careful product can get right.
2. **Image-first workflows** on BharatCode: almost no entrant uses Qwen's image input, although people's evidence
   (UPI receipts, bank SMS, WhatsApp chats) exists mainly as screenshots.
3. **Verifiable AI output for non-developers:** the trust patterns in marg/PatchProof/Nazar have not been applied to
   consumer problems.
4. **Indian-language output for stressful moments:** cheap to add, and it matters more when someone is panicking.

## 8. What not to copy

- Interview/placement prep (3+ entries), AI code review (4+), coding harnesses (6+): saturated.
- Broad "platforms" with many shallow features (EklavyaX, JARVIS-WEB): judges and users can't tell what they're for.
- Using a non-BharatCode model for the core: undermines the hackathon's stated objective.

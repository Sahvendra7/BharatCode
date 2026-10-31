import type { Metadata } from "next";
import Link from "next/link";
import { publicModelInfo } from "@/lib/bharatcode/config";

export const metadata: Metadata = {
  title: "How it works",
  description: "How Turant uses BharatCode's model to read evidence, and why fixed rules decide the plan.",
};

export const dynamic = "force-dynamic";

export default function HowItWorks() {
  const model = publicModelInfo();
  return (
    <div className="wrap flow">
      <article className="prose">
        <h1 style={{ fontSize: "var(--step-3)" }}>How Turant works</h1>
        <p>
          Turant splits the job in two. An AI model reads what people have: messy screenshots and stories written in a panic,
          in any language. Fixed, tested code decides what to do and what goes into each document, from facts the person
          confirms.
        </p>
        <p className="hint">
          This server: AI reading is <strong>{model.configured ? "on" : "off"}</strong>
          {model.configured ? `, using BharatCode ${model.id}` : ". The manual path and fixed-rule checks still work"}.
        </p>

        <h2>What BharatCode&apos;s model does</h2>
        <p>
          Turant calls BharatCode&apos;s OpenAI-compatible <code>/responses</code> API with <code>qwen-3.8-27b</code>, always
          with <code>store: false</code> and streaming on. Each analysis has two phases:
        </p>
        <ol>
          <li>
            <strong>Reading with tools.</strong> The model gets the story and up to four screenshots as image input. It can call
            four tools that run inside Turant, never at BharatCode: <code>check_identifier</code> (UTR, UPI ID, IFSC, phone,
            account, email), <code>inspect_link</code>, <code>parse_datetime</code> and <code>lookup_scam_pattern</code>. When a
            tool says a value is malformed, the model looks again, which catches misread digits.
          </li>
          <li>
            <strong>Structured extraction.</strong> The conversation, including every tool result, is replayed (the API is
            stateless) with a strict JSON Schema in <code>text.format</code>. Every transaction must quote the words it came
            from.
          </li>
        </ol>
        <p>You can watch both phases live: every tool call appears on screen as it happens.</p>

        <h2>What code does</h2>
        <ul>
          <li>Re-validates every identifier, ignoring the model&apos;s own opinion about validity.</li>
          <li>Checks that facts the model says came from the story really occur in the story. Facts read from screenshots are labelled for the person to check.</li>
          <li>Builds the plan: 1930 and the bank first, lock-down steps only when the evidence shows a shared OTP or an installed app.</li>
          <li>
            Applies RBI&apos;s 2017 circular on unauthorised electronic transactions only when it applies, counting working days for the
            3- and 7-day limits.
          </li>
          <li>
            <strong>Fact lock:</strong> any number in the AI-written description that isn&apos;t one of the confirmed facts is replaced with [check].
          </li>
          <li>In &quot;Check a message&quot;, fixed rules set a minimum verdict. The AI can raise it, never lower it.</li>
        </ul>

        <h2>When things go wrong</h2>
        <ul>
          <li>BharatCode busy (HTTP 503): retried up to three times with backoff, and you see that it&apos;s retrying.</li>
          <li>Queued on shared capacity: shown as &quot;waiting in queue&quot;, never as a frozen spinner.</li>
          <li>Answer cut off (<code>status: incomplete</code>): partial text is kept, tool calls from it are never run, and the budget is raised once, never retried unchanged.</li>
          <li>Structured output rejected or invalid: one fallback and one repair attempt, then the manual form opens with your inputs intact.</li>
          <li>No API key on the server: manual entry and rules-only checks still work.</li>
        </ul>

        <h2>Why screenshots can&apos;t trick it into doing anything</h2>
        <p>
          A scammer&apos;s message might contain text aimed at an AI. Turant&apos;s tools are read-only and do nothing outside the
          request: they can&apos;t send messages, open links or change the plan. The model is told to treat everything as evidence,
          and the plan is computed by code.
        </p>

        <h2>Sources</h2>
        <ul>
          <li>
            RBI circular DBR.No.Leg.BC.78/09.07.005/2017-18 (6 July 2017),{" "}
            <a href="https://www.rbi.org.in/scripts/BS_CircularIndexDisplay.aspx?Id=11040">Customer Protection: Limiting Liability of Customers in Unauthorised Electronic Banking Transactions</a>
          </li>
          <li>
            <a href="https://cybercrime.gov.in">National Cyber Crime Reporting Portal</a> and helpline 1930 (I4C, Ministry of Home Affairs)
          </li>
          <li>
            <a href="https://sancharsaathi.gov.in">Sanchar Saathi / Chakshu</a> (Department of Telecommunications)
          </li>
          <li>
            <a href="https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=53372">RBI BE(A)WARE booklet</a> on modus operandi of financial frauds
          </li>
          <li>
            <a href="https://bharatcode.ai/build">BharatCode API documentation</a>
          </li>
        </ul>
        <p>
          Source code and tests: <a href="https://github.com/Sahvendra7/BharatCode">github.com/Sahvendra7/BharatCode</a>. <Link href="/privacy">Privacy</Link>.
        </p>
      </article>
    </div>
  );
}

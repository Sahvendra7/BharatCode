import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <div className="wrap flow">
      <article className="prose">
        <h1 style={{ fontSize: "var(--step-3)" }}>Privacy</h1>
        <p>Turant is built to handle sensitive moments, so it keeps as little as possible.</p>
        <ul>
          <li>
            <strong>No accounts, no database.</strong> Turant has nowhere to store your case on its server.
          </li>
          <li>
            <strong>Your case stays in this browser tab</strong> (session storage) so a refresh doesn&apos;t lose it. Closing the tab or
            choosing &quot;Start a new case&quot; removes it.
          </li>
          <li>
            <strong>When you ask the AI to read your evidence,</strong> your story and screenshots are sent from Turant&apos;s server to
            BharatCode&apos;s model API to be read, with storage turned off (<code>store: false</code>). Screenshots are shrunk in your
            browser first. See <a href="https://bharatcode.ai/privacy">BharatCode&apos;s privacy policy</a>.
          </li>
          <li>
            <strong>Server logs</strong> record only timings, outcomes and BharatCode request IDs, never your text, screenshots or the
            facts found in them.
          </li>
          <li>Crop screenshots to what&apos;s needed, and never include your PIN, OTP, CVV or passwords.</li>
        </ul>
        <p>
          If you run your own copy of Turant, these guarantees depend on your hosting. The code is open for anyone to check.
        </p>
      </article>
    </div>
  );
}

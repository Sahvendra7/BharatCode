import Link from "next/link";
import { CallSlab } from "@/components/CallSlab";
import { SAMPLES } from "@/data/samples";
import { formatInr, totalLost } from "@/lib/engine/format";

export default function Home() {
  return (
    <>
      <div className="wrap">
        <section className="hero" aria-labelledby="hero-title">
          <div>
            <h1 id="hero-title">Lost money to a scam? The next hour matters.</h1>
            <p className="lede">
              Call 1930 first. Then Turant reads your screenshots, checks every number, and writes what to say to the
              helpline, your complaint and your bank letter.
            </p>
            <CallSlab />
            <div className="btn-row">
              <Link className="btn" href="/help">
                I&apos;ve lost money
              </Link>
              <Link className="btn secondary" href="/check">
                Check a message before paying
              </Link>
            </div>
          </div>

          <figure className="slip preview" aria-label="Example of a 1930 call sheet Turant prepares">
            <span className="sample-stamp">SAMPLE</span>
            <div className="slip-head">
              <h3>1930 call sheet</h3>
            </div>
            <dl>
              <dt>Amount</dt>
              <dd>
                ₹48,500 <span className="src ok">from your screenshot</span>
              </dd>
              <dt>Date &amp; time</dt>
              <dd>30 Oct 2026, 3:42 PM IST</dd>
              <dt>UTR</dt>
              <dd>
                630412875309 <span className="src ok">12-digit UPI ref</span>
              </dd>
              <dt>Paid to</dt>
              <dd>
                elec.bill.update.desk@ybl <span className="src bad">official-sounding name</span>
              </dd>
              <dt>Scammer&apos;s phone</dt>
              <dd>+91 98765 43210</dd>
            </dl>
            <figcaption className="hint" style={{ marginTop: "1rem" }}>
              Every number comes from your own evidence. Anything the AI can&apos;t back up is marked{" "}
              <span className="mark-check" style={{ fontFamily: "var(--typed)" }}>
                [check]
              </span>{" "}
              instead of being guessed.
            </figcaption>
          </figure>
        </section>
      </div>

      <section className="section" aria-labelledby="how-title">
        <div className="wrap">
          <h2 id="how-title">From panic to a complete complaint</h2>
          <ol className="steps">
            <li>
              <h3>Tell it what happened</h3>
              <p>Type it in any language, and add screenshots of the payment, bank SMS or chat.</p>
            </li>
            <li>
              <h3>Check the facts it found</h3>
              <p>
                BharatCode&apos;s AI reads your evidence. Turant validates every UTR, UPI ID and phone number and shows where
                each one came from.
              </p>
            </li>
            <li>
              <h3>Do the steps in order</h3>
              <p>A call sheet for 1930, a cybercrime.gov.in complaint draft and a bank letter, ready to copy or share.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="samples-title">
        <div className="wrap">
          <h2 id="samples-title">See it with a sample case</h2>
          <p>These are made-up cases based on common scams. They open with details already filled in, without any AI call.</p>
          <ul className="samples">
            {SAMPLES.map((s) => (
              <li key={s.id}>
                <Link href={`/help?sample=${s.id}`}>
                  <span className="sample-title">{s.title}</span>
                  <span className="sample-meta">{s.blurb}</span>
                  <span className="sample-amount">{formatInr(totalLost(s.case.transactions.map((t) => t.amountInr)))}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="trust-title">
        <div className="wrap split">
          <div>
            <h2 id="trust-title">The AI reads. Code decides.</h2>
            <p>
              The model&apos;s job is to read messy screenshots and stories. It never decides what you should do or what goes
              into your complaint. Fixed, tested rules do that, from facts you confirm.
            </p>
          </div>
          <div>
            <ul className="prose">
              <li>Every number in a document must match a confirmed fact, or it is replaced with [check].</li>
              <li>RBI&apos;s refund rules are applied only when they apply: payments you were tricked into making are treated differently from ones you never made.</li>
              <li>Nothing is stored on a server. Your case stays in this browser tab.</li>
              <li>Turant only points you to official channels. Anyone offering to recover money for a fee is running another scam.</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

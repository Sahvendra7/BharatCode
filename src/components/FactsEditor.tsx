"use client";

import type { Case, CaseIdentifier, CaseTransaction } from "@/lib/domain/case";
import { emptyTransaction, newId } from "@/lib/domain/case";
import {
  ACCOUNT_TYPES,
  CHANNELS,
  CHANNEL_LABELS,
  METHOD_LABELS,
  PATTERN_LABELS,
  PAYMENT_METHODS,
  SCAM_PATTERNS,
  SUSPECT_ID_KINDS,
  type AccountType,
  type Tri,
} from "@/lib/domain/enums";
import { checkIfsc, checkPhone, checkReference, checkUpiId, checkAccountNumber, checkEmail } from "@/lib/validators";
import { inspectLink } from "@/lib/validators/url";
import { istInputToIso, isoToIstInput } from "@/lib/time/ist";
import { SourceBadge } from "./SourceBadge";

type Patch<T> = (p: Partial<T>) => void;

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  savings: "Savings account",
  bsbd: "Basic savings (BSBD / zero-balance)",
  current_small: "Current/OD, up to ₹25 lakh, or small business",
  current_other: "Other current / OD account",
  credit_card_small: "Credit card, limit up to ₹5 lakh",
  credit_card_large: "Credit card, limit above ₹5 lakh",
  prepaid: "Prepaid wallet / gift card",
  unknown: "Not sure",
};

function Check({ ok, label }: { ok: boolean; label: string }) {
  return <span className={`src ${ok ? "ok" : "bad"}`}>{label}</span>;
}

function TriChoice({ name, legend, value, onChange }: { name: string; legend: string; value: Tri; onChange: (v: Tri) => void }) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="choices">
        {(["yes", "no", "unknown"] as const).map((v) => (
          <label className="choice" key={v}>
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            <span>{v === "unknown" ? "Not sure" : v === "yes" ? "Yes" : "No"}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function TransactionEditor({ t, index, patch, remove }: { t: CaseTransaction; index: number; patch: Patch<CaseTransaction>; remove: () => void }) {
  const id = (f: string) => `${t.id}-${f}`;
  const ref = t.reference ? checkReference(t.reference) : null;
  const upi = t.payeeUpiId ? checkUpiId(t.payeeUpiId) : null;
  const ifsc = t.payeeIfsc ? checkIfsc(t.payeeIfsc) : null;
  const acct = t.payeeAccount ? checkAccountNumber(t.payeeAccount) : null;
  const edit = (p: Partial<CaseTransaction>) => patch({ ...p, verification: t.verification === "sample" ? "sample" : "user_entered" });

  return (
    <div className="tx">
      <div className="tx-head">
        <h3>Payment {index + 1}</h3>
        <SourceBadge source={t.source} verification={t.verification} />
      </div>
      {t.source.quote && <p className="quote">“{t.source.quote}”</p>}
      <div className="grid-2">
        <div className="field">
          <label htmlFor={id("amount")}>Amount (₹)</label>
          <input
            id={id("amount")}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={t.amountInr ?? ""}
            onChange={(e) => edit({ amountInr: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
          />
        </div>
        <div className="field">
          <label htmlFor={id("when")}>Date and time (India time)</label>
          <input id={id("when")} type="datetime-local" value={isoToIstInput(t.occurredAt)} onChange={(e) => edit({ occurredAt: istInputToIso(e.target.value) })} />
        </div>
        <div className="field">
          <label htmlFor={id("ref")}>UTR / UPI reference no.</label>
          <input id={id("ref")} type="text" autoComplete="off" value={t.reference ?? ""} onChange={(e) => edit({ reference: e.target.value || null })} aria-describedby={id("ref-hint")} />
          <p className="hint" id={id("ref-hint")}>
            {ref ? <Check ok={ref.valid} label={ref.valid ? ref.label : ref.notes[0] ?? ref.label} /> : "12 digits for UPI/IMPS. Find it in the payment app or bank SMS."}
          </p>
        </div>
        <div className="field">
          <label htmlFor={id("method")}>How was it paid?</label>
          <select id={id("method")} value={t.method} onChange={(e) => edit({ method: e.target.value as CaseTransaction["method"] })}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={id("upi")}>Paid to UPI ID</label>
          <input id={id("upi")} type="text" autoComplete="off" value={t.payeeUpiId ?? ""} onChange={(e) => edit({ payeeUpiId: e.target.value || null })} />
          {upi && (
            <p className="hint">
              <Check ok={upi.valid && upi.flags.length === 0} label={upi.valid ? (upi.flags.includes("official_sounding_name") ? "official-sounding name: proves nothing" : upi.label) : upi.label} />
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor={id("acct")}>Or paid to account no.</label>
          <input id={id("acct")} type="text" inputMode="numeric" autoComplete="off" value={t.payeeAccount ?? ""} onChange={(e) => edit({ payeeAccount: e.target.value || null })} />
          {acct && !acct.valid && (
            <p className="hint">
              <Check ok={false} label={acct.label} />
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor={id("ifsc")}>IFSC of that account</label>
          <input id={id("ifsc")} type="text" autoComplete="off" value={t.payeeIfsc ?? ""} onChange={(e) => edit({ payeeIfsc: e.target.value || null })} />
          {ifsc && (
            <p className="hint">
              <Check ok={ifsc.valid} label={ifsc.label} />
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor={id("from")}>From your bank</label>
          <input id={id("from")} type="text" value={t.payerBank ?? ""} onChange={(e) => edit({ payerBank: e.target.value || null })} />
        </div>
      </div>
      <TriChoice
        name={id("made")}
        legend="Did you (or your family member) make this payment yourselves, even if tricked?"
        value={t.madeByVictim}
        onChange={(v) => edit({ madeByVictim: v })}
      />
      <button type="button" className="btn quiet small" onClick={remove}>
        Remove payment {index + 1}
      </button>
    </div>
  );
}

function identifierStatus(s: CaseIdentifier): { ok: boolean; label: string } | null {
  switch (s.kind) {
    case "phone": {
      const r = checkPhone(s.value);
      return { ok: r.valid && !r.flags.includes("international"), label: r.label };
    }
    case "upi_id": {
      const r = checkUpiId(s.value);
      return { ok: r.valid && r.flags.length === 0, label: r.flags.includes("official_sounding_name") ? "official-sounding name" : r.label };
    }
    case "url": {
      const r = inspectLink(s.value);
      return { ok: r.risk === "low" || r.risk === "none_found", label: r.valid ? `${r.registrableDomain}: ${r.risk === "none_found" ? "no signs in address" : `${r.risk} risk`}` : "not a valid link" };
    }
    case "account_number": {
      const r = checkAccountNumber(s.value);
      return { ok: r.valid, label: r.label };
    }
    case "email": {
      const r = checkEmail(s.value);
      return { ok: r.valid && r.flags.length === 0, label: r.label };
    }
    default:
      return null;
  }
}

const KIND_LABELS: Record<CaseIdentifier["kind"], string> = {
  phone: "Phone number",
  upi_id: "UPI ID",
  url: "Website / link",
  account_number: "Bank account",
  email: "Email",
  other: "Other",
};

export function FactsEditor({ value, onChange }: { value: Case; onChange: (c: Case) => void }) {
  const set = (p: Partial<Case>) => onChange({ ...value, ...p });
  const patchTx = (i: number) => (p: Partial<CaseTransaction>) => set({ transactions: value.transactions.map((t, j) => (j === i ? { ...t, ...p } : t)) });
  const patchId = (i: number, p: Partial<CaseIdentifier>) =>
    set({ suspect: value.suspect.map((s, j) => (j === i ? { ...s, ...p, verification: s.verification === "sample" ? "sample" : "user_entered" } : s)) });

  return (
    <div>
      <h2 id="facts-title">Check the facts</h2>
      <p className="hint">Every document below is built only from these details. Fix anything that&apos;s wrong; the plan and documents update as you type.</p>

      <h3 style={{ marginTop: "1.5rem" }}>Payments</h3>
      {value.transactions.length === 0 && <p className="hint">No payments added yet.</p>}
      {value.transactions.map((t, i) => (
        <TransactionEditor key={t.id} t={t} index={i} patch={patchTx(i)} remove={() => set({ transactions: value.transactions.filter((_, j) => j !== i) })} />
      ))}
      {value.transactions.length < 10 && (
        <button type="button" className="btn small secondary" onClick={() => set({ transactions: [...value.transactions, emptyTransaction()] })}>
          Add a payment
        </button>
      )}

      <h3 style={{ marginTop: "2rem" }}>The scammer&apos;s details</h3>
      {value.suspect.map((s, i) => {
        const status = identifierStatus(s);
        return (
          <div className="field" key={s.id}>
            <div className="grid-2">
              <select aria-label={`Type of detail ${i + 1}`} value={s.kind} onChange={(e) => patchId(i, { kind: e.target.value as CaseIdentifier["kind"] })}>
                {SUSPECT_ID_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABELS[k]}
                  </option>
                ))}
              </select>
              <input aria-label={`${KIND_LABELS[s.kind]} ${i + 1}`} type="text" value={s.value} onChange={(e) => patchId(i, { value: e.target.value })} />
            </div>
            <p className="hint">
              <SourceBadge source={s.source} verification={s.verification} /> {status && <Check ok={status.ok} label={status.label} />}{" "}
              <button type="button" className="btn quiet small" onClick={() => set({ suspect: value.suspect.filter((_, j) => j !== i) })}>
                Remove
              </button>
            </p>
          </div>
        );
      })}
      {value.suspect.length < 20 && (
        <button
          type="button"
          className="btn small secondary"
          onClick={() => set({ suspect: [...value.suspect, { id: newId("sid"), kind: "phone", value: "", source: { kind: "user", image: null, quote: null }, verification: "user_entered" }] })}
        >
          Add a phone, UPI ID or link
        </button>
      )}

      <h3 style={{ marginTop: "2rem" }}>What happened</h3>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="pattern">Type of scam</label>
          <select id="pattern" value={value.pattern} onChange={(e) => set({ pattern: e.target.value as Case["pattern"] })}>
            {SCAM_PATTERNS.map((p) => (
              <option key={p} value={p}>
                {PATTERN_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="channel">How they contacted you</label>
          <select id="channel" value={value.channel} onChange={(e) => set({ channel: e.target.value as Case["channel"] })}>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {CHANNEL_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="discovered">When did you first find out? (usually the bank SMS)</label>
        <input id="discovered" type="datetime-local" value={isoToIstInput(value.discoveredAt)} onChange={(e) => set({ discoveredAt: istInputToIso(e.target.value) })} />
      </div>
      <div className="field">
        <label htmlFor="story">In your words, for the complaint</label>
        <textarea id="story" maxLength={1500} value={value.howItHappened} onChange={(e) => set({ howItHappened: e.target.value })} aria-describedby="story-hint" />
        <p className="hint" id="story-hint">
          Numbers here are checked against the facts above. Any that don&apos;t match are replaced with [check] in the complaint.
        </p>
      </div>
      <TriChoice name="otp" legend="Was any OTP or PIN shared?" value={value.compromise.otpOrPinShared} onChange={(v) => set({ compromise: { ...value.compromise, otpOrPinShared: v } })} />
      <TriChoice name="card" legend="Were card details (number, CVV) shared?" value={value.compromise.cardDetailsShared} onChange={(v) => set({ compromise: { ...value.compromise, cardDetailsShared: v } })} />
      <TriChoice
        name="netbanking"
        legend="Was a net-banking password shared?"
        value={value.compromise.netbankingPasswordShared}
        onChange={(v) => set({ compromise: { ...value.compromise, netbankingPasswordShared: v } })}
      />
      <TriChoice
        name="remote"
        legend="Were you asked to install an app (AnyDesk, TeamViewer, a .apk file)?"
        value={value.compromise.remoteAppInstalled}
        onChange={(v) => set({ compromise: { ...value.compromise, remoteAppInstalled: v } })}
      />
      {value.compromise.remoteAppInstalled === "yes" && (
        <div className="field">
          <label htmlFor="appname">Which app?</label>
          <input id="appname" type="text" value={value.compromise.remoteAppName ?? ""} onChange={(e) => set({ compromise: { ...value.compromise, remoteAppName: e.target.value || null } })} />
        </div>
      )}

      <h3 style={{ marginTop: "2rem" }}>Your details for the documents</h3>
      <p className="hint">Optional. They stay in this browser tab and are only used to fill in the letters.</p>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="vname">Account holder&apos;s name</label>
          <input id="vname" type="text" autoComplete="name" value={value.victim.name} onChange={(e) => set({ victim: { ...value.victim, name: e.target.value } })} />
        </div>
        <div className="field">
          <label htmlFor="vphone">Mobile number</label>
          <input id="vphone" type="tel" autoComplete="tel" value={value.victim.phone} onChange={(e) => set({ victim: { ...value.victim, phone: e.target.value } })} />
        </div>
        <div className="field">
          <label htmlFor="vemail">Email registered with the bank</label>
          <input id="vemail" type="email" autoComplete="email" value={value.victim.email} onChange={(e) => set({ victim: { ...value.victim, email: e.target.value } })} />
        </div>
        <div className="field">
          <label htmlFor="vbank">Bank and branch</label>
          <input id="vbank" type="text" value={value.victim.bankName} onChange={(e) => set({ victim: { ...value.victim, bankName: e.target.value } })} />
        </div>
        <div className="field">
          <label htmlFor="vlast4">Last 4 digits of account</label>
          <input
            id="vlast4"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={value.victim.accountLast4}
            onChange={(e) => set({ victim: { ...value.victim, accountLast4: e.target.value.replace(/\D/g, "").slice(0, 4) } })}
          />
        </div>
        <div className="field">
          <label htmlFor="vtype">Type of account</label>
          <select id="vtype" value={value.victim.accountType} onChange={(e) => set({ victim: { ...value.victim, accountType: e.target.value as AccountType } })}>
            {ACCOUNT_TYPES.map((a) => (
              <option key={a} value={a}>
                {ACCOUNT_TYPE_LABELS[a]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

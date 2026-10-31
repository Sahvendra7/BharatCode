import { inspectLink } from "@/lib/validators/url";
import { checkEmail, checkPhone, checkUpiId } from "@/lib/validators";

/**
 * Fixed warning-sign rules for "Check before you pay". They run on the message text with no model,
 * and set a floor on the verdict: the AI can raise the verdict but never lower it below these.
 */

export type Severity = "critical" | "warning";
export type Verdict = "strong" | "warning" | "none_found";

export interface RuleSignal {
  id: string;
  label: string;
  severity: Severity;
  quote: string;
}

interface Rule {
  id: string;
  label: string;
  severity: Severity;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  {
    id: "asks_otp",
    label: "Asks for an OTP or verification code",
    severity: "critical",
    patterns: [
      /\b(share|send|tell|give|forward|read out|batao|bhejo|bata do|bhej do)\b[^.\n]{0,40}\b(otp|one[- ]time password|verification code|code)\b/i,
      /\b(otp|code)\b[^.\n]{0,25}\b(share|send|tell|batao|bhejo|bata do|bhej do|bataiye|bhejiye)\b/i,
      /ओटीपी/,
    ],
  },
  {
    id: "asks_pin_password",
    label: "Asks for a PIN, password, CVV or card number",
    severity: "critical",
    patterns: [/\b(upi pin|atm pin|mpin|password|cvv|card number|expiry date)\b/i, /\bpin\b(?!\s*-?\s*code)/i],
  },
  {
    id: "pin_to_receive",
    label: "Says you must pay, scan or enter a PIN to receive money",
    severity: "critical",
    patterns: [
      /\b(scan|enter (your )?(upi )?pin|approve|accept)\b[^.\n]{0,50}\b(receive|get|claim|refund|cashback|prize)\b/i,
      /\b(to receive|to get|to claim)\b[^.\n]{0,40}\b(pay|scan|enter pin|approve)\b/i,
    ],
  },
  {
    id: "remote_access_app",
    label: "Asks you to install a screen-sharing or remote-control app",
    severity: "critical",
    patterns: [/\b(anydesk|any desk|teamviewer|team viewer|quicksupport|quick support|rustdesk|airdroid|screen ?share|screen sharing)\b/i],
  },
  {
    id: "apk_file",
    label: "Sends an app file (.apk) to install",
    severity: "critical",
    patterns: [/\.apk\b/i],
  },
  {
    id: "digital_arrest",
    label: "Threatens arrest or legal action by 'police', 'CBI', 'customs' or a court",
    severity: "critical",
    patterns: [
      /\bdigital(ly)? arrest/i,
      /\b(cbi|ncb|narcotics|customs|ed officer|enforcement directorate|cyber ?cell|crime branch|police|supreme court|rbi officer)\b[^.\n]{0,80}\b(arrest|warrant|case|fir|parcel|money laundering|drugs|verify|verification)\b/i,
      /\b(arrest|warrant)\b[^.\n]{0,60}\b(video call|skype|transfer|deposit|verify)\b/i,
    ],
  },
  {
    id: "job_fee",
    label: "Asks for a fee to confirm a job, internship or task",
    severity: "critical",
    patterns: [
      /\b(registration|joining|training|security|refundable|onboarding|processing|verification|document)\s+(fee|fees|deposit|charge|charges|amount)\b/i,
      /\b(pay|deposit|transfer)\b[^.\n]{0,40}\b(to (confirm|book|secure|reserve) (your )?(seat|slot|selection|offer|internship|job))\b/i,
      /\b(prepaid|pre-paid|merchant|vip) task/i,
    ],
  },
  {
    id: "disconnection_threat",
    label: "Threatens disconnection or blocking tonight",
    severity: "warning",
    patterns: [
      /\b(electricity|power|bijli|connection|account|sim|card|wallet)\b[^.\n]{0,60}\b(disconnect|disconnected|cut|blocked|block|suspend|suspended|deactivat|band|kat)/i,
      /बिजली/,
    ],
  },
  {
    id: "kyc_update",
    label: "Says your KYC must be updated through a link or call",
    severity: "warning",
    patterns: [/\bkyc\b[^.\n]{0,60}\b(update|expire|expired|pending|blocked|suspend|verify)/i, /\b(update|complete)\b[^.\n]{0,20}\bkyc\b/i],
  },
  {
    id: "urgency",
    label: "Pushes you to act immediately",
    severity: "warning",
    patterns: [/\b(immediately|urgent|urgently|within \d+\s*(min|minutes|hours?|hrs?)|tonight|today itself|right now|last chance|turant|abhi|jaldi)\b/i, /तुरंत|अभी/],
  },
  {
    id: "secrecy",
    label: "Tells you to keep it secret",
    severity: "warning",
    patterns: [/\b(don'?t|do not|never)\s+(tell|inform|share with)\b[^.\n]{0,30}\b(anyone|family|bank|police)/i, /\b(confidential|kisi ko mat batana|kisi ko na batayein)\b/i],
  },
  {
    id: "prize_or_easy_money",
    label: "Promises a prize, lottery or easy money",
    severity: "warning",
    patterns: [/\b(lottery|kbc|lucky draw|you have won|congratulations you|prize|jackpot|earn ₹?\s?\d+[,\d]* (daily|per day)|work from home and earn|like (videos|youtube))\b/i],
  },
  {
    id: "call_this_number",
    label: "Asks you to call back a personal number",
    severity: "warning",
    patterns: [/\b(call|contact|whatsapp)\b[^.\n]{0,30}(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/i],
  },
];

const SNIPPET = 90;

function quoteAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + Math.max(length, 1) + 40);
  let q = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (q.length > SNIPPET) q = `${q.slice(0, SNIPPET - 1)}…`;
  return q;
}

export function detectSignals(text: string): RuleSignal[] {
  const found: RuleSignal[] = [];
  for (const rule of RULES) {
    for (const re of rule.patterns) {
      const m = re.exec(text);
      if (m) {
        found.push({ id: rule.id, label: rule.label, severity: rule.severity, quote: quoteAround(text, m.index, m[0].length) });
        break;
      }
    }
  }

  for (const m of text.matchAll(/\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s)]*)?)/gi)) {
    const candidate = m[1] ?? "";
    const start = m.index ?? 0;
    const end = start + m[0].length;
    // Skip the parts of an email address or UPI ID on either side of the "@".
    if (text[start - 1] === "@" || text[end] === "@") continue;
    if (!/[./]/.test(candidate) || /^\d+(\.\d+)+$/.test(candidate)) continue;
    const link = inspectLink(candidate);
    if (link.valid && link.risk === "high") {
      found.push({ id: `link:${link.host}`, label: `Risky link: ${link.notes[0] ?? link.host}`, severity: "critical", quote: candidate });
    } else if (link.valid && link.risk === "medium") {
      found.push({ id: `link:${link.host}`, label: `Link warning: ${link.notes[0] ?? link.host}`, severity: "warning", quote: candidate });
    }
  }

  for (const m of text.matchAll(/\b[a-z0-9._-]{2,256}@[a-z][a-z0-9.]{1,63}\b/gi)) {
    const value = m[0];
    if (/\.[a-z]{2,}$/i.test(value)) {
      const email = checkEmail(value);
      if (email.flags.includes("free_email_provider")) {
        found.push({ id: `email:${value}`, label: "Official-sounding offer or notice from a free email account", severity: "warning", quote: value });
      }
    } else {
      const upi = checkUpiId(value);
      if (upi.flags.includes("official_sounding_name")) {
        found.push({ id: `upi:${value}`, label: "Payment to a personal UPI ID with an official-sounding name", severity: "warning", quote: value });
      }
    }
  }

  for (const m of text.matchAll(/(?:\+|00)\d[\d\s-]{7,16}\d/g)) {
    const phone = checkPhone(m[0]);
    if (phone.flags.includes("international")) {
      found.push({ id: `phone:${phone.normalized}`, label: `${phone.label}: Indian banks and police don't contact you from foreign numbers`, severity: "warning", quote: m[0] });
    }
  }

  const seen = new Set<string>();
  return found.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
}

export function verdictFromSignals(signals: RuleSignal[]): Verdict {
  if (signals.some((s) => s.severity === "critical")) return "strong";
  if (signals.filter((s) => s.severity === "warning").length >= 2) return "strong";
  if (signals.length) return "warning";
  return "none_found";
}

const RANK: Record<Verdict, number> = { none_found: 0, warning: 1, strong: 2 };

/** The higher of the two verdicts. Rules set a floor the model cannot lower. */
export function combineVerdicts(rules: Verdict, model: Verdict | null): Verdict {
  if (!model) return rules;
  return RANK[model] > RANK[rules] ? model : rules;
}

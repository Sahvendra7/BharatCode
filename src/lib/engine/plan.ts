import { OFFICIAL_CHANNELS } from "@/data/official-channels";
import type { Case } from "@/lib/domain/case";
import { formatInr, totalLost } from "./format";

export type Urgency = "now" | "today" | "this_week" | "later";

export interface PlanAction {
  label: string;
  href: string;
}

export interface PlanStep {
  id: string;
  urgency: Urgency;
  title: string;
  detail: string;
  why: string;
  actions: PlanAction[];
}

export const URGENCY_LABELS: Record<Urgency, string> = {
  now: "Do this now",
  today: "Today",
  this_week: "This week",
  later: "If needed later",
};

/**
 * The action plan. Pure and deterministic: the same confirmed facts always produce the same steps.
 * The model never decides which steps appear; evidence-driven conditions do.
 */
export function buildPlan(c: Case): PlanStep[] {
  const steps: PlanStep[] = [];
  const lost = c.paid !== "no";
  const total = totalLost(c.transactions.map((t) => t.amountInr));
  const credentialsShared = [c.compromise.otpOrPinShared, c.compromise.cardDetailsShared, c.compromise.netbankingPasswordShared].includes("yes");
  const phoneCompromised = c.compromise.remoteAppInstalled === "yes" || c.compromise.unknownApkInstalled === "yes";

  if (!lost) {
    steps.push({
      id: "stop_contact",
      urgency: "now",
      title: "Stop: don't pay, don't share codes, don't install anything",
      detail: "Don't reply, don't call back numbers from the message, and don't open its links. No bank, police or company needs your OTP, PIN or a payment to 'verify' you.",
      why: "Scams depend on keeping you talking and acting fast.",
      actions: [],
    });
  }

  if (c.paid === "unknown") {
    steps.push({
      id: "check_debits",
      urgency: "now",
      title: "Check whether money actually left your account",
      detail: "Open your bank's official app or check bank SMS (not messages from the other person). A screenshot from someone else is not proof of anything.",
      why: "Fake 'credited' or 'debited' messages are common. Your bank's own record is what counts.",
      actions: [],
    });
  }

  if (lost) {
    steps.push({
      id: "call_1930",
      urgency: "now",
      title: "Call 1930, the National Cyber Crime Helpline",
      detail: "Read out the details on your call sheet. Ask for the acknowledgement or reference number and write it down. If you can't get through, file directly on cybercrime.gov.in.",
      why: "Reports through 1930 reach banks quickly through the government's fraud-reporting system, so money still in the receiving account can be put on hold. Every hour matters.",
      actions: [
        { label: "Call 1930", href: OFFICIAL_CHANNELS.helpline1930.href },
        { label: "Open cybercrime.gov.in", href: OFFICIAL_CHANNELS.ncrp.href },
      ],
    });
    steps.push({
      id: "call_bank",
      urgency: "now",
      title: "Call your bank and block what was used",
      detail: "Use the number printed on your card or passbook, or in the bank's official app; scammers post fake helpline numbers online. Ask the bank to block UPI, cards or net banking as needed, report the transactions as fraud, and give you a complaint reference.",
      why: "Blocking stops further loss. For unauthorised transactions, RBI's rules depend on when you told the bank.",
      actions: [],
    });
  }

  if (credentialsShared) {
    steps.push({
      id: "secure_credentials",
      urgency: "now",
      title: "Change PINs and passwords, and block cards",
      detail: "Change your UPI PIN, net-banking and email passwords, and block any card whose details were shared, using a different device if your phone may be compromised.",
      why: "Shared codes and card details can be used again.",
      actions: [],
    });
  }

  if (phoneCompromised) {
    const app = c.compromise.remoteAppName ? ` (${c.compromise.remoteAppName})` : "";
    steps.push({
      id: "secure_phone",
      urgency: "now",
      title: "Cut off the scammer's access to your phone",
      detail: `Turn off mobile data and Wi-Fi, then uninstall the app you were asked to install${app}. Check Settings → Accessibility and remove apps you don't recognise. Change banking passwords from a different device. If an unknown .apk file was installed, ask a trusted person to help back up and reset the phone.`,
      why: "Screen-sharing and fake apps can read OTPs and operate banking apps while you're on the call.",
      actions: [],
    });
  }

  if (c.pattern === "sim_swap") {
    steps.push({
      id: "block_sim",
      urgency: "now",
      title: "Call your mobile operator from another phone",
      detail: "Ask them to block the SIM and tell you whether a duplicate SIM was issued, and when.",
      why: "A duplicated SIM receives your OTPs.",
      actions: [],
    });
  }

  if (lost) {
    steps.push({
      id: "ncrp_complaint",
      urgency: "today",
      title: "Complete the written complaint on cybercrime.gov.in",
      detail: "Choose 'Report Cyber Crime' → financial fraud. Enter the 1930 acknowledgement number if you have one, copy in the complaint draft below, and upload your screenshots. Secondary guides say a 1930 report should be completed on the portal within about 24 hours; do it today.",
      why: "The written complaint is the official record police and banks act on.",
      actions: [{ label: "Open cybercrime.gov.in", href: OFFICIAL_CHANNELS.ncrp.href }],
    });
    steps.push({
      id: "bank_letter",
      urgency: "today",
      title: "Give your bank a written complaint",
      detail: "Send the bank letter below from your registered email, or hand it in at your branch. Ask for a dated acknowledgement and keep it.",
      why: "A written, dated complaint fixes when you reported and starts the bank's resolution clock.",
      actions: [],
    });
  }

  if (lost && total > 1_000_000) {
    steps.push({
      id: "e_zero_fir",
      urgency: "today",
      title: `Large loss (${formatInr(total)}): ask about an e-Zero FIR`,
      detail: "Since May 2025, high-value cyber-fraud complaints filed through 1930 or cybercrime.gov.in can be converted automatically into an FIR (an \"e-Zero FIR\"). Thresholds and rollout differ by state; ask when you call 1930 or at your nearest cyber police station.",
      why: "An FIR starts a formal police investigation.",
      actions: [],
    });
  }

  if (c.pattern === "digital_arrest") {
    steps.push({
      id: "digital_arrest_note",
      urgency: "now",
      title: "End any ongoing call. No real officer will 'arrest' you on video",
      detail: "Indian police and agencies do not hold people on video calls or ask for money to 'verify' accounts. Hang up, tell your family, and stop all further transfers.",
      why: "These scams keep victims isolated on camera for hours to extract more payments.",
      actions: [],
    });
  }

  if (c.pattern === "sextortion") {
    steps.push({
      id: "sextortion_note",
      urgency: "now",
      title: "Don't pay any further demands",
      detail: "Paying usually brings more demands. Stop replying, don't delete the chat (it's evidence), and report it. You can use the women/children section of cybercrime.gov.in if relevant.",
      why: "Blackmailers rely on shame and secrecy.",
      actions: [],
    });
  }

  steps.push({
    id: "preserve_evidence",
    urgency: "today",
    title: "Keep the evidence",
    detail: "Don't delete chats, call logs or SMS. Take screenshots that show dates, numbers and UPI IDs. Don't contact the scammer again, and ignore anyone who offers to 'recover' your money for a fee: that is another scam.",
    why: "Police and banks need the original messages and identifiers.",
    actions: [],
  });

  if (!lost) {
    steps.push({
      id: "chakshu",
      urgency: "today",
      title: "Report the number or message on Chakshu (Sanchar Saathi)",
      detail: "Chakshu, run by the Department of Telecommunications, is for suspected fraud calls, SMS and WhatsApp messages where no money was lost. Also block and report the sender in WhatsApp or Telegram.",
      why: "Reports help disconnect numbers used for fraud.",
      actions: [{ label: "Open sancharsaathi.gov.in", href: OFFICIAL_CHANNELS.chakshu.href }],
    });
    if (credentialsShared) {
      steps.push({
        id: "call_bank",
        urgency: "now",
        title: "Tell your bank that a code or card detail was shared",
        detail: "Call the number printed on your card or passbook and ask them to block the card or UPI until you change your PIN.",
        why: "Nothing was taken yet, but shared details can be used later.",
        actions: [],
      });
    }
  }

  steps.push({
    id: "tell_family",
    urgency: "this_week",
    title: "Warn family and friends",
    detail: "Tell them what happened, especially older relatives. The same scam is usually sent to many people.",
    why: "Sharing early prevents the next victim.",
    actions: [],
  });

  if (lost) {
    steps.push({
      id: "rbi_cms",
      urgency: "later",
      title: "If the bank doesn't help: complain to RBI",
      detail: "If your bank doesn't reply within 30 days of your written complaint, or you're not satisfied, file at cms.rbi.org.in or call 14448. Check the current time limit for filing on the portal.",
      why: "The RBI Integrated Ombudsman handles complaints about banks' service.",
      actions: [{ label: "Open cms.rbi.org.in", href: OFFICIAL_CHANNELS.rbiCms.href }],
    });
  }

  const order: Record<Urgency, number> = { now: 0, today: 1, this_week: 2, later: 3 };
  return steps
    .map((s, i) => ({ s, i }))
    .sort((a, b) => order[a.s.urgency] - order[b.s.urgency] || a.i - b.i)
    .map(({ s }) => s);
}

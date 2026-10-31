/**
 * Gold cases for measuring extraction against BharatCode's model (npm run eval, needs a key).
 * All stories and screenshots are FICTIONAL and written by the Turant developers.
 */
import type { ScamPattern, Tri } from "../src/lib/domain/enums";

export interface GoldTransaction {
  amountInr: number;
  reference: string | null;
  payee: string | null; // UPI ID or account number
  occurredAt: string | null; // ISO, minute precision
}

export interface GoldCase {
  id: string;
  story: string;
  screenshots: string[]; // paths relative to repo root
  paid: Tri;
  pattern: ScamPattern;
  transactions: GoldTransaction[];
  suspectValues: string[]; // normalised phones / UPI IDs / accounts / emails / urls expected
}

export const GOLD: GoldCase[] = [
  {
    id: "electricity-screenshots",
    story: "My mother paid after this SMS. Screenshots attached.",
    screenshots: ["public/samples/electricity-sms.png", "public/samples/electricity-receipt.png"],
    paid: "yes",
    pattern: "electricity_bill",
    transactions: [{ amountInr: 48500, reference: "630412875309", payee: "elec.bill.update.desk@ybl", occurredAt: "2026-10-30T15:42" }],
    suspectValues: ["+919876543210", "elec.bill.update.desk@ybl"],
  },
  {
    id: "electricity-text",
    story:
      "My mother got an SMS at around 3:30 pm saying our electricity would be disconnected tonight. She called the number in the SMS, 98765 43210, and paid 48,500 by UPI to elec.bill.update.desk@ybl at 3:42 pm today. UPI ref 630412875309.",
    screenshots: [],
    paid: "yes",
    pattern: "electricity_bill",
    transactions: [{ amountInr: 48500, reference: "630412875309", payee: "elec.bill.update.desk@ybl", occurredAt: null }],
    suspectValues: ["+919876543210", "elec.bill.update.desk@ybl"],
  },
  {
    id: "internship-hinglish",
    story:
      "Mujhe WhatsApp pe internship offer aaya, careers.dataworks.hr@gmail.com se offer letter bheja. 27 Oct ko 1999 registration fee di dataworks.onboarding@axl pe, ref 630041952276. Fir 28 Oct ko 4500 laptop deposit bhi diya same UPI pe. Ab 7000 training fee maang rahe hain.",
    screenshots: [],
    paid: "yes",
    pattern: "fake_internship_or_job",
    transactions: [
      { amountInr: 1999, reference: "630041952276", payee: "dataworks.onboarding@axl", occurredAt: null },
      { amountInr: 4500, reference: null, payee: "dataworks.onboarding@axl", occurredAt: null },
    ],
    suspectValues: ["careers.dataworks.hr@gmail.com", "dataworks.onboarding@axl"],
  },
  {
    id: "digital-arrest-hindi",
    story:
      "मेरे पिताजी को कॉल आया कि उनके नाम के पार्सल में ड्रग्स हैं। वीडियो कॉल पर पुलिस की वर्दी में एक आदमी ने कहा कि वे डिजिटल अरेस्ट में हैं। उन्होंने खाता 50200091234567 (IFSC PUNB0123400) में IMPS से 1,50,000 भेजे, रेफरेंस 630311208734।",
    screenshots: [],
    paid: "yes",
    pattern: "digital_arrest",
    transactions: [{ amountInr: 150000, reference: "630311208734", payee: "50200091234567", occurredAt: null }],
    suspectValues: ["50200091234567"],
  },
  {
    id: "sim-swap",
    story:
      "Yesterday evening my phone suddenly showed no network. This morning net banking showed two transfers I did not make: 25,000 by NEFT and 18,000 by IMPS (ref 630323581102), both to account 39871200004521. I never shared any OTP.",
    screenshots: [],
    paid: "yes",
    pattern: "sim_swap",
    transactions: [
      { amountInr: 25000, reference: null, payee: "39871200004521", occurredAt: null },
      { amountInr: 18000, reference: "630323581102", payee: "39871200004521", occurredAt: null },
    ],
    suspectValues: ["39871200004521"],
  },
  {
    id: "remote-access",
    story:
      "I searched for the courier customer care number online and called 98765 11223. He asked me to install AnyDesk to help with the refund. Then 9,999 and 14,500 were debited from my account without me doing anything.",
    screenshots: [],
    paid: "yes",
    pattern: "remote_access",
    transactions: [
      { amountInr: 9999, reference: null, payee: null, occurredAt: null },
      { amountInr: 14500, reference: null, payee: null, occurredAt: null },
    ],
    suspectValues: ["+919876511223"],
  },
  {
    id: "no-loss",
    story: "Someone called saying my SIM will be blocked in 2 hours and asked me to press 9. I hung up. I did not pay anything.",
    screenshots: [],
    paid: "no",
    pattern: "kyc_update",
    transactions: [],
    suspectValues: [],
  },
];

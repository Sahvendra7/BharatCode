import { EMPTY_COMPROMISE, EMPTY_VICTIM, type Case } from "@/lib/domain/case";

/**
 * Sample cases for demonstration. Every name, number, UPI ID and reference here is FICTIONAL and was
 * written by hand. Facts are pre-filled without any AI call, and the UI and documents say so.
 * `story` and `screenshots` let a server with a BharatCode key run the same case through the model.
 */
export interface SampleCase {
  id: string;
  title: string;
  blurb: string;
  story: string;
  screenshots: string[];
  case: Case;
}

const base = (sampleId: string): Pick<Case, "version" | "origin" | "sampleId" | "requestIds" | "missingInfo"> => ({
  version: 1,
  origin: "sample",
  sampleId,
  requestIds: [],
  missingInfo: [],
});

const src = (quote: string, image: number | null = null) =>
  ({ kind: "sample", image, quote }) as const;

export const SAMPLES: SampleCase[] = [
  {
    id: "electricity",
    title: "“Your electricity will be cut tonight”",
    blurb: "A mother pays a fake electricity officer by UPI after an SMS threat.",
    story:
      "My mother got an SMS at around 3:30 pm saying our electricity would be disconnected tonight because last month's bill was not updated. She called the number in the SMS, 98765 43210. The man said he was from the electricity office and told her to pay the pending amount by UPI. She paid 48,500 from her SBI account. Now his phone is switched off.",
    screenshots: ["/samples/electricity-sms.png", "/samples/electricity-receipt.png"],
    case: {
      ...base("electricity"),
      paid: "yes",
      pattern: "electricity_bill",
      channel: "sms",
      summary: "Your mother paid a fake electricity officer ₹48,500 by UPI after an SMS threatened disconnection.",
      howItHappened:
        "My mother received an SMS saying our electricity would be disconnected tonight because the previous bill was not updated. She called the number given in the SMS. The man claimed to be from the electricity office and told her to clear the pending amount immediately by UPI. After she paid, his phone was switched off.",
      discoveredAt: "2026-10-30T15:55:00+05:30",
      transactions: [
        {
          id: "s_e_tx1",
          amountInr: 48500,
          occurredAt: "2026-10-30T15:42:00+05:30",
          reference: "630412875309",
          method: "upi",
          payerBank: "State Bank of India",
          payeeUpiId: "elec.bill.update.desk@ybl",
          payeeAccount: null,
          payeeIfsc: null,
          payeeName: "R K TRADERS",
          madeByVictim: "yes",
          source: src("Paid ₹48,500.00 to elec.bill.update.desk@ybl · UPI Ref No. 630412875309", 2),
          verification: "sample",
        },
      ],
      suspect: [
        { id: "s_e_p1", kind: "phone", value: "+919876543210", source: src("Contact our electricity officer 98765 43210", 1), verification: "sample" },
        { id: "s_e_u1", kind: "upi_id", value: "elec.bill.update.desk@ybl", source: src("elec.bill.update.desk@ybl", 2), verification: "sample" },
      ],
      compromise: { ...EMPTY_COMPROMISE, otpOrPinShared: "no", remoteAppInstalled: "no", cardDetailsShared: "no", netbankingPasswordShared: "no", unknownApkInstalled: "no" },
      victim: { ...EMPTY_VICTIM, bankName: "State Bank of India", accountType: "savings" },
    },
  },
  {
    id: "internship",
    title: "Internship “registration fee”",
    blurb: "A student pays twice to confirm a data-science internship that doesn't exist.",
    story:
      "I got an internship offer on WhatsApp for a data science role. They sent an offer letter from careers.dataworks.hr@gmail.com and asked me to pay a refundable registration fee of 1,999 to confirm my seat. I paid on 27 Oct. Then they asked 4,500 for a laptop security deposit on 28 Oct, which I also paid to the same UPI ID. Now they want 7,000 more for training.",
    screenshots: [],
    case: {
      ...base("internship"),
      paid: "yes",
      pattern: "fake_internship_or_job",
      channel: "whatsapp",
      summary: "You paid ₹6,499 in two fees for an internship offer that asks for money: a classic fake-internship pattern.",
      howItHappened:
        "I received an internship offer for a data science role on WhatsApp, with an offer letter sent from a free email address. I was asked to pay a refundable registration fee to confirm my seat, and later a security deposit for a laptop. Both were paid to the same UPI ID. They are now asking for a training fee.",
      discoveredAt: "2026-10-29T19:00:00+05:30",
      transactions: [
        {
          id: "s_i_tx1",
          amountInr: 1999,
          occurredAt: "2026-10-27T11:05:00+05:30",
          reference: "630041952276",
          method: "upi",
          payerBank: "Kotak Mahindra Bank",
          payeeUpiId: "dataworks.onboarding@axl",
          payeeAccount: null,
          payeeIfsc: null,
          payeeName: "ANIL MEHTA",
          madeByVictim: "yes",
          source: src("₹1,999 paid to dataworks.onboarding@axl Ref 630041952276"),
          verification: "sample",
        },
        {
          id: "s_i_tx2",
          amountInr: 4500,
          occurredAt: "2026-10-28T18:20:00+05:30",
          reference: null,
          method: "upi",
          payerBank: "Kotak Mahindra Bank",
          payeeUpiId: "dataworks.onboarding@axl",
          payeeAccount: null,
          payeeIfsc: null,
          payeeName: null,
          madeByVictim: "yes",
          source: src("Then they asked 4,500 for a laptop security deposit"),
          verification: "sample",
        },
      ],
      suspect: [
        { id: "s_i_e1", kind: "email", value: "careers.dataworks.hr@gmail.com", source: src("careers.dataworks.hr@gmail.com"), verification: "sample" },
        { id: "s_i_u1", kind: "upi_id", value: "dataworks.onboarding@axl", source: src("dataworks.onboarding@axl"), verification: "sample" },
      ],
      compromise: { ...EMPTY_COMPROMISE, otpOrPinShared: "no", remoteAppInstalled: "no", cardDetailsShared: "no", netbankingPasswordShared: "no", unknownApkInstalled: "no" },
      victim: { ...EMPTY_VICTIM, bankName: "Kotak Mahindra Bank", accountType: "savings" },
      missingInfo: ["What is the UTR / UPI reference number of the ₹4,500 payment? It's in the payment app's transaction details."],
    },
  },
  {
    id: "digital-arrest",
    title: "“Digital arrest” by fake CBI officers",
    blurb: "A retired teacher is kept on a video call for hours and transfers savings to “verify” them.",
    story:
      "My father, 67, got a call saying a parcel in his name had drugs. They connected him on a video call to a man in police uniform who said he was under digital arrest and must not tell anyone. They made him transfer money to an account for verification: 1,50,000 by IMPS and later 90,000. The account was in the name of Shree Balaji Enterprises, IFSC PUNB0123400.",
    screenshots: [],
    case: {
      ...base("digital-arrest"),
      paid: "yes",
      pattern: "digital_arrest",
      channel: "phone_call",
      summary: "Your father was manipulated by fake officers on a video call into transferring ₹2,40,000 to a business account.",
      howItHappened:
        "My father received a call claiming a parcel in his name contained drugs. He was connected to a video call with a man in police uniform who said he was under 'digital arrest' and must not tell anyone. He was told to transfer his savings to an account for 'verification' and made two transfers.",
      discoveredAt: "2026-10-30T13:30:00+05:30",
      transactions: [
        {
          id: "s_d_tx1",
          amountInr: 150000,
          occurredAt: "2026-10-30T11:12:00+05:30",
          reference: "630311208734",
          method: "imps",
          payerBank: "Bank of Baroda",
          payeeUpiId: null,
          payeeAccount: "50200091234567",
          payeeIfsc: "PUNB0123400",
          payeeName: "SHREE BALAJI ENTERPRISES",
          madeByVictim: "yes",
          source: src("IMPS Rs.1,50,000.00 to A/c 50200091234567 IFSC PUNB0123400 Ref 630311208734"),
          verification: "sample",
        },
        {
          id: "s_d_tx2",
          amountInr: 90000,
          occurredAt: "2026-10-30T12:47:00+05:30",
          reference: "630312479921",
          method: "imps",
          payerBank: "Bank of Baroda",
          payeeUpiId: null,
          payeeAccount: "50200091234567",
          payeeIfsc: "PUNB0123400",
          payeeName: "SHREE BALAJI ENTERPRISES",
          madeByVictim: "yes",
          source: src("IMPS Rs.90,000.00 to A/c 50200091234567 Ref 630312479921"),
          verification: "sample",
        },
      ],
      suspect: [
        { id: "s_d_p1", kind: "phone", value: "+919876501234", source: src("call from 98765 01234"), verification: "sample" },
        { id: "s_d_a1", kind: "account_number", value: "50200091234567", source: src("A/c 50200091234567"), verification: "sample" },
      ],
      compromise: { ...EMPTY_COMPROMISE, otpOrPinShared: "no", remoteAppInstalled: "no", cardDetailsShared: "no", netbankingPasswordShared: "no", unknownApkInstalled: "no" },
      victim: { ...EMPTY_VICTIM, bankName: "Bank of Baroda", accountType: "savings" },
    },
  },
  {
    id: "sim-swap",
    title: "Phone went dead, then money left",
    blurb: "After a SIM swap, two net-banking transfers happen that the account holder never made.",
    story:
      "Yesterday evening my phone suddenly showed no network. This morning I saw on net banking that two transfers were made from my HDFC account last night that I did not make: 25,000 and 18,000. I never shared any OTP or password.",
    screenshots: [],
    case: {
      ...base("sim-swap"),
      paid: "yes",
      pattern: "sim_swap",
      channel: "unknown",
      summary: "Two transfers you didn't make left your account after your SIM stopped working: likely a SIM swap.",
      howItHappened:
        "My mobile phone suddenly lost network in the evening. The next morning I found, through net banking, two transfers from my account made during the night that I did not make or authorise. I had not shared any OTP, PIN or password with anyone.",
      discoveredAt: "2026-10-30T08:10:00+05:30",
      transactions: [
        {
          id: "s_s_tx1",
          amountInr: 25000,
          occurredAt: "2026-10-29T23:41:00+05:30",
          reference: "HDFCN52026102912345",
          method: "neft_rtgs",
          payerBank: "HDFC Bank",
          payeeUpiId: null,
          payeeAccount: "39871200004521",
          payeeIfsc: "UTIB0004433",
          payeeName: null,
          madeByVictim: "no",
          source: src("NEFT Dr 25,000.00 HDFCN52026102912345"),
          verification: "sample",
        },
        {
          id: "s_s_tx2",
          amountInr: 18000,
          occurredAt: "2026-10-29T23:58:00+05:30",
          reference: "630323581102",
          method: "imps",
          payerBank: "HDFC Bank",
          payeeUpiId: null,
          payeeAccount: "39871200004521",
          payeeIfsc: "UTIB0004433",
          payeeName: null,
          madeByVictim: "no",
          source: src("IMPS Dr 18,000.00 Ref 630323581102"),
          verification: "sample",
        },
      ],
      suspect: [{ id: "s_s_a1", kind: "account_number", value: "39871200004521", source: src("to A/c 39871200004521"), verification: "sample" }],
      compromise: { ...EMPTY_COMPROMISE, otpOrPinShared: "no", remoteAppInstalled: "no", cardDetailsShared: "no", netbankingPasswordShared: "no", unknownApkInstalled: "no" },
      victim: { ...EMPTY_VICTIM, bankName: "HDFC Bank", accountType: "savings" },
      missingInfo: ["The NEFT reference shown is 19 characters; check the exact UTR in your statement (NEFT UTRs are 16 characters)."],
    },
  },
];

export function getSample(id: string | null | undefined): SampleCase | undefined {
  return SAMPLES.find((s) => s.id === id);
}

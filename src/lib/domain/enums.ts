import { z } from "zod";

export const Tri = z.enum(["yes", "no", "unknown"]);
export type Tri = z.infer<typeof Tri>;

export const SCAM_PATTERNS = [
  "electricity_bill",
  "kyc_update",
  "digital_arrest",
  "courier_customs",
  "job_task",
  "fake_internship_or_job",
  "investment_trading",
  "loan_app",
  "online_shopping",
  "refund_or_reversal",
  "qr_or_collect_request",
  "sim_swap",
  "remote_access",
  "otp_or_card_fraud",
  "lottery_prize",
  "sextortion",
  "impersonation_relative",
  "other",
  "unknown",
] as const;
export const ScamPattern = z.enum(SCAM_PATTERNS);
export type ScamPattern = z.infer<typeof ScamPattern>;

export const CHANNELS = [
  "phone_call",
  "sms",
  "whatsapp",
  "telegram",
  "email",
  "social_media",
  "website",
  "app",
  "in_person",
  "unknown",
] as const;
export const Channel = z.enum(CHANNELS);
export type Channel = z.infer<typeof Channel>;

export const PAYMENT_METHODS = ["upi", "imps", "neft_rtgs", "card", "netbanking", "wallet", "unknown"] as const;
export const PaymentMethod = z.enum(PAYMENT_METHODS);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const SUSPECT_ID_KINDS = ["phone", "upi_id", "url", "account_number", "email", "other"] as const;
export const SuspectIdKind = z.enum(SUSPECT_ID_KINDS);
export type SuspectIdKind = z.infer<typeof SuspectIdKind>;

export const ACCOUNT_TYPES = ["savings", "bsbd", "current_small", "current_other", "credit_card_small", "credit_card_large", "prepaid", "unknown"] as const;
export const AccountType = z.enum(ACCOUNT_TYPES);
export type AccountType = z.infer<typeof AccountType>;

export const PATTERN_LABELS: Record<ScamPattern, string> = {
  electricity_bill: "Fake electricity bill / disconnection",
  kyc_update: "Fake KYC / account-block update",
  digital_arrest: "\"Digital arrest\" / fake police or agency",
  courier_customs: "Fake courier or customs parcel",
  job_task: "Part-time job / online task scam",
  fake_internship_or_job: "Fake job or internship offer",
  investment_trading: "Fake investment or trading group",
  loan_app: "Loan app harassment / fake loan",
  online_shopping: "Fake online seller or shopping site",
  refund_or_reversal: "Fake refund or \"money sent by mistake\"",
  qr_or_collect_request: "QR code or UPI collect-request trick",
  sim_swap: "SIM swap",
  remote_access: "Screen-sharing / remote-access app",
  otp_or_card_fraud: "OTP or card-details fraud",
  lottery_prize: "Lottery / prize / gift scam",
  sextortion: "Sextortion / video-call blackmail",
  impersonation_relative: "Impersonating a relative or friend",
  other: "Other",
  unknown: "Not sure yet",
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  phone_call: "Phone call",
  sms: "SMS",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  email: "Email",
  social_media: "Social media",
  website: "Website",
  app: "Mobile app",
  in_person: "In person",
  unknown: "Not sure",
};

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: "UPI",
  imps: "IMPS",
  neft_rtgs: "NEFT / RTGS",
  card: "Debit/credit card",
  netbanking: "Net banking",
  wallet: "Wallet",
  unknown: "Not sure",
};

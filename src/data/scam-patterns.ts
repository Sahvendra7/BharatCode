import type { ScamPattern } from "@/lib/domain/enums";

/**
 * Short, plain descriptions of common fraud patterns, used to ground the model's classification
 * (via the lookup_scam_pattern tool) and to explain results to people.
 * Sources: RBI "BE(A)WARE" booklet on modus operandi of financial frauds (March 2022,
 * https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=53372) and I4C/cybercrime.gov.in advisories.
 */
export interface PatternInfo {
  description: string;
  typicalSigns: string[];
  advice: string[];
}

export const SCAM_PATTERN_INFO: Record<ScamPattern, PatternInfo> = {
  electricity_bill: {
    description: "A message or call says your electricity will be cut tonight because a bill is unpaid, and asks you to call a number, pay to a UPI ID or install an app.",
    typicalSigns: ["threat of disconnection tonight", "personal mobile number to call", "payment to an individual's UPI ID", "link or app to 'update' the bill"],
    advice: ["Electricity boards don't disconnect over SMS from personal numbers. Check your bill in the board's official app or office."],
  },
  kyc_update: {
    description: "A message says your bank account, card, wallet or SIM will be blocked unless you update KYC through a link or a call.",
    typicalSigns: ["account will be blocked today", "KYC link", "request for OTP, PIN or card details"],
    advice: ["Banks don't ask for KYC updates through links in SMS. Visit the branch or use the official app you installed yourself."],
  },
  digital_arrest: {
    description: "Callers pretending to be police, CBI, customs, narcotics or a court say you are involved in a crime, keep you on a video call and demand money to 'verify' or 'settle' it.",
    typicalSigns: ["video call with uniformed 'officers'", "parcel with drugs in your name", "told not to tell family", "transfer money for verification"],
    advice: ["There is no 'digital arrest' in Indian law. Police and agencies don't demand money or keep you on video calls. Hang up and call 1930."],
  },
  courier_customs: {
    description: "A courier or customs 'officer' says a parcel in your name is held and asks for a fee, or connects you to fake police.",
    typicalSigns: ["parcel held at customs", "fee to release", "transfer to 'police'"],
    advice: ["Check with the courier company's official website or number, never one given in the call."],
  },
  job_task: {
    description: "You are offered money for simple online tasks (liking videos, rating hotels). Small payouts build trust, then you must 'pre-pay' for bigger tasks and can't withdraw.",
    typicalSigns: ["earn from home by liking/rating", "Telegram group", "pay to unlock tasks", "withdrawal needs another payment"],
    advice: ["Real jobs never ask you to pay to earn. Stop paying: more payments won't release earlier ones."],
  },
  fake_internship_or_job: {
    description: "An offer letter or recruiter asks for a registration, training, security-deposit or verification fee, often from a free email address or WhatsApp.",
    typicalSigns: ["fee to confirm selection", "offer without interview", "Gmail/Yahoo recruiter", "payment to personal UPI ID"],
    advice: ["Genuine employers and AICTE's internship portal don't charge students. Verify on the company's own careers page."],
  },
  investment_trading: {
    description: "A WhatsApp/Telegram 'trading group' or app shows huge fake profits, then blocks withdrawals until more money is paid.",
    typicalSigns: ["guaranteed returns", "SEBI-registered claims without proof", "app not on official stores", "pay tax/fee to withdraw"],
    advice: ["Check registration on SEBI's website. Don't pay 'withdrawal fees'."],
  },
  loan_app: {
    description: "Instant-loan apps demand excessive repayments and harass using your contacts and photos, or fake lenders take 'processing fees' and never disburse.",
    typicalSigns: ["access to contacts and photos", "processing fee before loan", "threats and morphed photos"],
    advice: ["Check whether the lender is an RBI-regulated entity. Report harassment to 1930 and the police."],
  },
  online_shopping: {
    description: "A fake seller or website takes payment and never delivers, or a 'buyer' sends a QR code to 'pay' you.",
    typicalSigns: ["prices far below market", "payment only by UPI to individual", "no return policy or address"],
    advice: ["Use platforms with buyer protection. Never scan a QR code to receive money."],
  },
  refund_or_reversal: {
    description: "Someone claims they sent you money by mistake or offers a refund, and asks you to send money, approve a collect request or share an OTP.",
    typicalSigns: ["fake 'credited' SMS", "collect request to 'receive' refund", "urgent request to return money"],
    advice: ["Check your actual bank balance. You never need a PIN or OTP to receive money."],
  },
  qr_or_collect_request: {
    description: "You are asked to scan a QR code or approve a UPI request to 'receive' money. Scanning and entering a PIN always sends money out.",
    typicalSigns: ["scan to receive", "enter PIN to get refund/prize"],
    advice: ["Entering your UPI PIN is only for paying. Decline unknown collect requests."],
  },
  sim_swap: {
    description: "Fraudsters get a duplicate SIM for your number and use OTPs to move money. Your phone suddenly loses network.",
    typicalSigns: ["phone shows no network unexpectedly", "OTPs you didn't request", "call asking to SMS a code to the operator"],
    advice: ["Call your mobile operator from another phone immediately and ask to block the SIM."],
  },
  remote_access: {
    description: "You are asked to install a screen-sharing or remote-control app (AnyDesk, TeamViewer, QuickSupport, RustDesk, AirDroid) to 'help', and the caller then operates your banking apps.",
    typicalSigns: ["install app to fix a problem", "share a 9- or 10-digit code shown in the app", "caller can see your screen"],
    advice: ["Turn off data, uninstall the app, and change banking passwords from another device."],
  },
  otp_or_card_fraud: {
    description: "Someone posing as a bank, card or wallet executive gets your OTP, card number, CVV or PIN and makes transactions.",
    typicalSigns: ["call from 'bank' asking OTP/CVV", "reward points expiring", "card will be blocked"],
    advice: ["No bank asks for OTP, PIN or CVV. Block the card through the official app or helpline."],
  },
  lottery_prize: {
    description: "You are told you won a lottery, KBC prize, car or gift and must pay tax or processing fees first.",
    typicalSigns: ["prize you never entered for", "fee to release prize", "celebrity photos"],
    advice: ["No real prize requires you to pay first."],
  },
  sextortion: {
    description: "A video call is recorded or faked and used to blackmail you for money.",
    typicalSigns: ["unknown video call", "threats to share video with contacts", "repeated demands"],
    advice: ["Don't pay: paying usually brings more demands. Report on cybercrime.gov.in; you can choose the women/child section if relevant."],
  },
  impersonation_relative: {
    description: "A message from a 'friend' or 'relative' on a new number or hacked account urgently asks for money.",
    typicalSigns: ["new number", "emergency and secrecy", "payment to someone else's UPI ID"],
    advice: ["Call the person on their known number before paying."],
  },
  other: { description: "A fraud that doesn't match the common patterns.", typicalSigns: [], advice: [] },
  unknown: { description: "Not enough information yet to recognise the pattern.", typicalSigns: [], advice: [] },
};

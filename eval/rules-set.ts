/**
 * Labelled messages for measuring the fixed-rule floor in "Check before you pay".
 * AUTHORED BY THE TURANT DEVELOPERS: messages are written to resemble common scam and ordinary texts
 * seen in India (English, Hinglish, Hindi). They are not collected from real victims. Results on this set
 * show how the rules behave on these patterns, not real-world accuracy.
 */
export interface LabelledMessage {
  text: string;
  scam: boolean;
  note: string;
}

export const RULE_SET: LabelledMessage[] = [
  { scam: true, note: "electricity", text: "Dear Consumer your electricity power will be disconnected tonight at 9.30pm because previous month bill was not update. Please immediately contact our electricity officer 9876543210." },
  { scam: true, note: "electricity hinglish", text: "Aapka bijli connection aaj raat kat jayega. Turant is number par call karein 9876501234." },
  { scam: true, note: "kyc link", text: "Dear SBI user, your KYC is expired and your account will be blocked today. Update now: http://sbi-kyc-verify.top/login" },
  { scam: true, note: "kyc shortener", text: "Your bank account is suspended. Complete KYC within 30 minutes at bit.ly/3kycupd8" },
  { scam: true, note: "otp request", text: "Sir aapke account mein galti se 5000 aa gaye hain, jo OTP aaya hai woh bata do please" },
  { scam: true, note: "otp english", text: "This is from the bank's security team. Please share the OTP you just received to stop the fraud transaction." },
  { scam: true, note: "upi pin to receive", text: "Your cashback of Rs 2,000 is ready. Scan the QR code and enter your UPI PIN to receive the money." },
  { scam: true, note: "remote access", text: "To process your refund please install AnyDesk from Play Store and tell me the 9 digit code." },
  { scam: true, note: "apk", text: "Your electricity bill update is pending. Download the app: https://bill-update-app.in/BillPay.apk" },
  { scam: true, note: "digital arrest", text: "This is CBI Mumbai. A parcel containing drugs was seized in your name. You are under digital arrest. Stay on the video call and do not tell your family." },
  { scam: true, note: "customs parcel", text: "Customs officer: your parcel from Taiwan is held with illegal items. Transfer Rs 45000 for verification or an arrest warrant will be issued." },
  { scam: true, note: "internship fee", text: "Congratulations! You are selected for the Data Science internship. Pay the refundable registration fee of Rs 1999 to confirm your seat." },
  { scam: true, note: "job security deposit", text: "Dear candidate, you are shortlisted for the Amazon work-from-home job. Pay a security deposit of Rs 3500 to get your joining letter. Contact hr.amazon.jobs@gmail.com" },
  { scam: true, note: "task scam", text: "Part time job! Earn ₹3000 daily by liking YouTube videos. Join our Telegram group. Prepaid task bonus available." },
  { scam: true, note: "lottery", text: "Congratulations you have won KBC lottery of 25 lakh. To claim the prize pay the processing tax of Rs 12500." },
  { scam: true, note: "foreign whatsapp", text: "Hello dear, I am the HR manager. Please WhatsApp me at +92 300 1234567 for the work from home offer." },
  { scam: true, note: "pan card block", text: "Your PAN card will be blocked today. Update immediately at http://incometax-pan-update.xyz" },
  { scam: true, note: "secrecy plus money", text: "Beta main mamaji bol raha hoon, naya number hai. Urgent 20000 bhej do is UPI pe, kisi ko mat batana." },
  { scam: true, note: "hindi electricity", text: "प्रिय उपभोक्ता, आपकी बिजली आज रात 9:30 बजे काट दी जाएगी। तुरंत बिजली अधिकारी से संपर्क करें 9876543210" },
  { scam: true, note: "card details", text: "Your credit card reward points expire today. Reply with card number, expiry date and CVV to redeem." },
  { scam: false, note: "lunch", text: "Hi, are we still meeting for lunch on Sunday at 1? I'll book a table at the usual place." },
  { scam: false, note: "genuine debit sms", text: "Rs 450.00 debited from A/c XX4417 on 30-10-26 to VPA swiggy@icici. Not you? Call the number on the back of your card." },
  { scam: false, note: "college notice", text: "Reminder: the mid-semester exam timetable is on the college portal. Exams start Monday." },
  { scam: false, note: "family", text: "Mummy ne bola hai shaam ko sabzi le aana, aur doodh bhi." },
  { scam: false, note: "delivery", text: "Your order has been delivered to Flat 4, MG Road, Bengaluru, PIN code 560001. Rate your experience in the app." },
  { scam: false, note: "doctor", text: "Your appointment with Dr. Rao is confirmed for 2 Nov at 11 am. Please arrive 10 minutes early." },
  { scam: false, note: "friend upi", text: "Bhai maine tujhe 500 bheje hain movie ke liye, check kar lena." },
  { scam: false, note: "official site mention", text: "You can file cyber fraud complaints at https://cybercrime.gov.in or call 1930." },
  { scam: false, note: "hindi greeting", text: "दीपावली की हार्दिक शुभकामनाएँ! आपका दिन शुभ हो।" },
  { scam: false, note: "meeting", text: "Team, the project review is moved to Thursday 4 pm. Please update the slides before that." },
];

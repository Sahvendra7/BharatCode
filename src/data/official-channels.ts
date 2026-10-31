/**
 * Official channels Turant points people to. Every entry has a source, checked on 30 Oct 2026.
 * Turant links only to these; it never suggests unofficial "recovery" services.
 */
export interface OfficialChannel {
  id: string;
  name: string;
  contact: string;
  href: string;
  purpose: string;
  source: string;
}

export const OFFICIAL_CHANNELS = {
  helpline1930: {
    id: "helpline1930",
    name: "National Cyber Crime Helpline",
    contact: "1930",
    href: "tel:1930",
    purpose: "Report financial cyber fraud as fast as possible so funds can be held. Available 24×7.",
    source: "https://cybercrime.gov.in",
  },
  ncrp: {
    id: "ncrp",
    name: "National Cyber Crime Reporting Portal",
    contact: "cybercrime.gov.in",
    href: "https://cybercrime.gov.in",
    purpose: "File the full written complaint with transaction details and screenshots.",
    source: "https://cybercrime.gov.in",
  },
  chakshu: {
    id: "chakshu",
    name: "Chakshu on Sanchar Saathi (Department of Telecommunications)",
    contact: "sancharsaathi.gov.in",
    href: "https://sancharsaathi.gov.in",
    purpose:
      "Report suspected fraud calls, SMS or WhatsApp messages when no money has been lost. For money already lost, use 1930 / cybercrime.gov.in.",
    source: "https://sancharsaathi.gov.in",
  },
  rbiCms: {
    id: "rbiCms",
    name: "RBI Complaint Management System (Integrated Ombudsman)",
    contact: "cms.rbi.org.in · 14448",
    href: "https://cms.rbi.org.in",
    purpose:
      "If your bank does not reply within 30 days of your written complaint, or you are not satisfied with the reply. Check the current time limit on the portal before filing.",
    source: "https://cms.rbi.org.in",
  },
} satisfies Record<string, OfficialChannel>;

/** RBI circular on customer liability for unauthorised electronic banking transactions. */
export const RBI_LIABILITY_CIRCULAR = {
  reference: "RBI/2017-18/15, DBR.No.Leg.BC.78/09.07.005/2017-18, 6 July 2017",
  title: "Customer Protection – Limiting Liability of Customers in Unauthorised Electronic Banking Transactions",
  url: "https://www.rbi.org.in/scripts/BS_CircularIndexDisplay.aspx?Id=11040",
};

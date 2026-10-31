import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Turant: lost money to a scam? Act in the next hour", template: "%s · Turant" },
  description:
    "Turant reads your screenshots, checks every number and writes your 1930 call sheet, cybercrime complaint and bank letter. Free and open source, powered by BharatCode.",
  applicationName: "Turant",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b2a4a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand" aria-label="Turant home">
              Turant <small lang="hi">तुरंत</small>
            </Link>
            <nav className="site-nav" aria-label="Main">
              <Link href="/help">I&apos;ve lost money</Link>
              <Link href="/check">Check a message</Link>
              <Link href="/how-it-works">How it works</Link>
            </nav>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <p>
              Turant is a free, open-source helper, not a government service, a bank or a lawyer. It never files anything
              for you and never promises recovery. Official channels: National Cyber Crime Helpline <a href="tel:1930">1930</a>,{" "}
              <a href="https://cybercrime.gov.in" rel="noopener noreferrer">cybercrime.gov.in</a>, your bank&apos;s official number.
            </p>
            <p>AI reading is powered by <a href="https://bharatcode.ai/build">BharatCode</a>.</p>
            <p className="btn-row">
              <Link href="/privacy">Privacy</Link>
              <Link href="/how-it-works">How it works</Link>
              <a href="https://github.com/Sahvendra7/BharatCode">Source code</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

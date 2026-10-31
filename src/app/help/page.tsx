import type { Metadata } from "next";
import { Suspense } from "react";
import { HelpFlow } from "@/components/HelpFlow";

export const metadata: Metadata = {
  title: "I've lost money",
  description: "Call 1930 first, then let Turant turn your screenshots into a call sheet, complaint and bank letter.",
};

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="wrap flow">Loading…</div>}>
      <HelpFlow />
    </Suspense>
  );
}

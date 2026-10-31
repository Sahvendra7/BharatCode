import type { Metadata } from "next";
import { CheckFlow } from "@/components/CheckFlow";

export const metadata: Metadata = {
  title: "Check a message before paying",
  description: "Paste a suspicious message or add a screenshot. Turant shows the warning signs and the exact words behind them.",
};

export default function CheckPage() {
  return <CheckFlow />;
}

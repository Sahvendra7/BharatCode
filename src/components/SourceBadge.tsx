import type { CaseSource, Verification } from "@/lib/domain/case";

const TEXT: Record<Verification, { cls: string; label: (s: CaseSource) => string }> = {
  verified_in_story: { cls: "ok", label: () => "found in your story" },
  ai_read_image: { cls: "ai", label: (s) => `read by AI from screenshot ${s.image ?? ""}: check it`.replace("  ", " ") },
  unverified: { cls: "bad", label: () => "AI couldn't show where this came from: check it" },
  user_entered: { cls: "you", label: () => "entered by you" },
  sample: { cls: "you", label: () => "sample data" },
};

export function SourceBadge({ source, verification }: { source: CaseSource; verification: Verification }) {
  const t = TEXT[verification];
  return <span className={`src ${t.cls}`}>{t.label(source)}</span>;
}

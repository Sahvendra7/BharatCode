import { Case } from "@/lib/domain/case";

const KEY = "turant.case.v1";

/** The active case lives only in this tab (sessionStorage), never on the server. */
export function loadCase(): Case | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = Case.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveCase(c: Case): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* storage unavailable (private mode): the case still works for this page view */
  }
}

export function clearCase(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Structured operational log. Deliberately has no field for user content: stories, images and
 * extracted facts must never be logged.
 */
export function logEvent(entry: {
  route: string;
  outcome: string;
  ms: number;
  requestIds?: string[];
  errorKind?: string;
  status?: number | null;
}): void {
  if (process.env.NODE_ENV === "test") return;
  console.info(JSON.stringify({ at: new Date().toISOString(), ...entry }));
}

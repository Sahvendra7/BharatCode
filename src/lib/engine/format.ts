/** "₹12,34,567.50": Indian digit grouping, paise shown only when non-zero. Locale-independent. */
export function formatInr(amount: number): string {
  const negative = amount < 0;
  const fixed = Math.abs(amount).toFixed(2);
  const [rupees = "0", paise = "00"] = fixed.split(".");
  const last3 = rupees.slice(-3);
  const rest = rupees.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3;
  return `${negative ? "-" : ""}₹${grouped}${paise === "00" ? "" : `.${paise}`}`;
}

export function totalLost(amounts: Array<number | null>): number {
  return amounts.reduce<number>((sum, a) => sum + (a ?? 0), 0);
}

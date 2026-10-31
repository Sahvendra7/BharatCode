/** India Standard Time is a fixed UTC+05:30 offset with no daylight saving. */
export const IST_OFFSET_MINUTES = 330;

export interface IstParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = Sunday
}

export function istParts(date: Date): IstParts {
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

/** Builds the instant for an IST wall-clock time, or null if the calendar date does not exist. */
export function fromIst(year: number, month: number, day: number, hour = 0, minute = 0): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  const utc = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(utc);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return new Date(utc - IST_OFFSET_MINUTES * 60_000);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO instant → value for <input type="datetime-local"> in India time. */
export function isoToIstInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return toIstIso(d).slice(0, 16);
}

/** <input type="datetime-local"> value, read as India time → ISO with +05:30. */
export function istInputToIso(value: string): string | null {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00+05:30` : null;
}

export function toIstIso(date: Date): string {
  const p = istParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:00+05:30`;
}

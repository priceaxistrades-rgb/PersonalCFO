export type RecurringFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Advance an ISO date without drifting end-of-month schedules. */
export function nextRecurringDate(isoDate: string, frequency: RecurringFrequency, interval = 1): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day || interval < 1) throw new Error("Invalid recurrence date");
  const currentMonth = month - 1;
  let targetYear = year;
  let targetMonth = currentMonth;
  let targetDay = day;

  if (frequency === "weekly") {
    const date = new Date(Date.UTC(year, currentMonth, day));
    date.setUTCDate(date.getUTCDate() + 7 * interval);
    return date.toISOString().slice(0, 10);
  }

  const months = frequency === "monthly" ? interval : frequency === "quarterly" ? interval * 3 : interval * 12;
  targetMonth += months;
  targetYear += Math.floor(targetMonth / 12);
  targetMonth = ((targetMonth % 12) + 12) % 12;
  targetDay = Math.min(targetDay, daysInMonth(targetYear, targetMonth));
  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
}

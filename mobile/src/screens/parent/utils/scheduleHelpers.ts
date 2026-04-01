// ── Constants ─────────────────────────────────────────────────

export type ViewMode = "daily" | "weekly" | "monthly";

export const STATUS_LABELS: Record<string, string> = {
  scheduled: "예정",
  boarded: "탑승 중",
  completed: "완료",
  cancelled: "취소됨",
  no_show: "미탑승",
};

export const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
export const DAY_NAMES_FULL = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

export const timeFmt = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" });

export const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "daily", label: "일간" },
  { key: "weekly", label: "주간" },
  { key: "monthly", label: "월간" },
];

// ── Date helpers ──────────────────────────────────────────────

export function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function dateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toDateStr(d);
}

export function fmtTime(t: string): string {
  return t?.length >= 5 ? t.slice(0, 5) : t;
}

export function fmtDisplayDate(dateIso: string): string {
  const d = new Date(dateIso + "T00:00:00");
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

/** Get Monday of the week containing the given date */
export function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** Get array of 7 dates for the week containing the reference date */
export function getWeekDates(refDate: Date): Date[] {
  const monday = getMonday(refDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Get first day of month */
export function getMonthStart(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/** Get calendar grid (6 weeks x 7 days) for the month */
export function getCalendarGrid(year: number, month: number): Date[][] {
  const firstDay = getMonthStart(year, month);
  const startDay = firstDay.getDay(); // 0=Sun
  const startOffset = startDay === 0 ? -6 : 1 - startDay; // align to Monday
  const gridStart = new Date(year, month, 1 + startOffset);

  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + d);
      week.push(date);
    }
    // Stop if entire week is in next month
    if (w >= 4 && week[0].getMonth() !== month) break;
    weeks.push(week);
  }
  return weeks;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

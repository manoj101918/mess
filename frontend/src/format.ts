import type { MemberSummary, Plan } from "./api";
import { getLang, translate } from "./i18n";

const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  te: ["జన", "ఫిబ్ర", "మార్చి", "ఏప్రి", "మే", "జూన్", "జూలై", "ఆగ", "సెప్టెం", "అక్టో", "నవం", "డిసెం"],
};

export function monthName(iso: string): string {
  return MONTHS[getLang()][Number(iso.slice(5, 7)) - 1];
}

/** "2026-10-05" → "05 Oct 2026". Parsed by hand so the browser's timezone can't shift the day. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, , d] = iso.slice(0, 10).split("-");
  return `${d} ${monthName(iso)} ${y}`;
}

/** Timestamp → "05 Oct 2026, 3:45 pm" in India time. */
export function formatDateTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const date = formatDate(`${get("year")}-${get("month")}-${get("day")}`);
  return `${date}, ${get("hour")}:${get("minute")} ${get("dayPeriod").toLowerCase()}`;
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
export function formatINR(amount: number): string {
  return `₹${inr.format(amount)}`;
}

export function daysText(m: Pick<MemberSummary, "status" | "days_left" | "days_overdue">): string {
  if (m.status === "expired") {
    return m.days_overdue === 1 ? translate("days.endedYesterday") : translate("days.overdue", { n: m.days_overdue });
  }
  if (m.days_left === 0) return translate("days.endsToday");
  if (m.days_left === 1) return translate("days.endsTomorrow");
  return translate("days.left", { n: m.days_left });
}

export function planDuration(p: Pick<Plan, "duration_value" | "duration_unit">): string {
  const one = p.duration_value === 1;
  const key = p.duration_unit === "months" ? (one ? "dur.month" : "dur.months") : one ? "dur.day" : "dur.days";
  return translate(key, { n: p.duration_value });
}

/** Today's date in India as YYYY-MM-DD (used only for form defaults). */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** "+919876543210" → "98765 43210" */
export function displayPhone(phone: string): string {
  const d = phone.replace(/\D/g, "").slice(-10);
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

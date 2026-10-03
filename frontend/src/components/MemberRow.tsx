import { useState } from "react";
import { Link } from "react-router-dom";
import { api, type MemberSummary } from "../api";
import { daysText, formatDate } from "../format";
import { translate, useI18n } from "../i18n";
import { StatusBadge } from "./ui";

/** Logs the reminder, then hands off to WhatsApp with the message pre-typed. */
export function useWhatsAppReminder(onSent?: (memberId: number) => void) {
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function send(member: Pick<MemberSummary, "id" | "name">) {
    setSendingId(member.id);
    setError("");
    try {
      const { wa_link } = await api.remind(member.id);
      onSent?.(member.id);
      window.location.href = wa_link;
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("row.whatsappError"));
    } finally {
      setSendingId(null);
    }
  }

  return { send, sendingId, error };
}

const DAYS_COLOR = { active: "text-green-700", expiring: "text-orange-700", expired: "text-red-700" };

export function MemberRow({
  member,
  onRemind,
  sending,
}: {
  member: MemberSummary;
  onRemind: (m: MemberSummary) => void;
  sending?: boolean;
}) {
  const { t } = useI18n();
  return (
    <li className="card p-4">
      <Link to={`/members/${member.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{member.name}</p>
            <p className="truncate text-sm text-slate-500">{member.plan_name ?? t("row.noPlan")}</p>
          </div>
          <StatusBadge status={member.status} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-slate-600">{t("row.ends", { date: formatDate(member.end_date) })}</span>
          <span className={`font-semibold ${DAYS_COLOR[member.status]}`}>{daysText(member)}</span>
          {member.reminded_today && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
              {t("row.remindedToday")}
            </span>
          )}
        </div>
      </Link>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          onClick={() => onRemind(member)}
          disabled={sending}
          className={`btn px-2 text-sm ${
            member.reminded_today
              ? "border border-green-300 bg-white text-green-700"
              : "bg-[#25D366] text-white hover:bg-[#1ebe5b]"
          }`}
        >
          {sending ? "…" : member.reminded_today ? t("row.remindAgain") : t("row.whatsapp")}
        </button>
        <Link to={`/members/${member.id}/renew`} className="btn-primary px-2 text-sm">
          {t("row.renew")}
        </Link>
        <a href={`tel:${member.phone}`} className="btn-secondary px-2 text-sm">
          {t("row.call")}
        </a>
      </div>
    </li>
  );
}

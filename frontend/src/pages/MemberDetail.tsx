import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useWhatsAppReminder } from "../components/MemberRow";
import { ConfirmDialog, ErrorBox, PageHeader, Spinner, StatusBadge } from "../components/ui";
import { daysText, displayPhone, formatDate, formatDateTime, formatINR } from "../format";
import { translate, useI18n } from "../i18n";
import { useLoad } from "../useLoad";

export default function MemberDetail() {
  const { t } = useI18n();
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { data: m, error, loading, reload } = useLoad(() => api.member(id), [id]);
  const reminder = useWhatsAppReminder(() => reload(true));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function remove() {
    setDeleting(true);
    try {
      await api.deleteMember(id);
      navigate("/members", { replace: true });
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : translate("detail.deleteError"));
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (loading && !m) return <Spinner />;
  if (error && !m)
    return (
      <>
        <PageHeader title={t("detail.title")} back="/members" />
        <ErrorBox message={error} onRetry={() => reload()} />
      </>
    );
  if (!m) return null;

  return (
    <div className="pb-6">
      <PageHeader
        title={m.name}
        back="/members"
        right={
          <Link to={`/members/${id}/edit`} className="flex min-h-12 items-center px-2 font-semibold text-brand-700">
            {t("common.edit")}
          </Link>
        }
      />

      <div className="space-y-4 p-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={m.status} />
            <span className="text-sm font-semibold text-slate-700">{daysText(m)}</span>
          </div>
          <p className="mt-3 text-lg font-bold">{m.plan_name}</p>
          <p className="text-slate-600">
            {formatDate(m.start_date)} → {formatDate(m.end_date)}
          </p>
          <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
            <Row label={t("detail.phone")} value={displayPhone(m.phone)} />
            {m.room_or_address && <Row label={t("detail.room")} value={m.room_or_address} />}
            {m.notes && <Row label={t("detail.notes")} value={m.notes} />}
            {m.created_at && <Row label={t("detail.since")} value={formatDate(m.created_at)} />}
          </dl>
        </div>

        {m.reminded_today && (
          <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-800">{t("detail.alreadyReminded")}</p>
        )}
        {(reminder.error || deleteError) && <ErrorBox message={reminder.error || deleteError} />}

        <div className="grid grid-cols-2 gap-3">
          <button
            className="btn bg-[#25D366] text-white"
            disabled={reminder.sendingId === m.id}
            onClick={() => reminder.send(m)}
          >
            {t("detail.whatsapp")}
          </button>
          <a href={`tel:${m.phone}`} className="btn-secondary">
            {t("row.call")}
          </a>
          <Link to={`/members/${id}/renew`} className="btn-primary col-span-2 text-lg">
            {t("detail.renew")}
          </Link>
        </div>

        <section>
          <h2 className="mb-2 text-base font-bold">{t("detail.history")}</h2>
          <ul className="card divide-y divide-slate-100">
            {m.subscriptions.map((s) => (
              <li key={s.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{s.plan_name}</p>
                  <p className="font-bold">{formatINR(s.amount_paid)}</p>
                </div>
                <p className="text-sm text-slate-600">
                  {formatDate(s.start_date)} → {formatDate(s.end_date)}
                </p>
                <p className="text-xs text-slate-500">
                  {t("detail.paidOn", { date: formatDate(s.paid_on), mode: t(s.payment_mode === "upi" ? "detail.upi" : "detail.cash") })}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">{t("detail.reminders")}</h2>
          {m.reminders.length === 0 ? (
            <p className="card p-4 text-sm text-slate-500">{t("detail.noReminders")}</p>
          ) : (
            <ul className="card divide-y divide-slate-100">
              {m.reminders.map((r) => (
                <li key={r.id} className="flex items-center justify-between p-4 text-sm">
                  <span>{formatDateTime(r.sent_at)}</span>
                  <span className="text-slate-500">{t(r.type === "expired" ? "detail.expiredNotice" : "detail.renewalReminder")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button className="btn w-full border border-red-200 bg-white text-red-700" onClick={() => setConfirmOpen(true)}>
          {t("detail.delete")}
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t("detail.deleteTitle", { name: m.name })}
        message={t("detail.deleteMsg")}
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium whitespace-pre-line">{value}</dd>
    </div>
  );
}

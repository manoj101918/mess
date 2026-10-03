import { Link } from "react-router-dom";
import { api, type Dashboard as DashboardData, type MemberSummary } from "../api";
import { MemberRow, useWhatsAppReminder } from "../components/MemberRow";
import { EmptyState, ErrorBox, Spinner } from "../components/ui";
import { formatDate, formatINR, monthName } from "../format";
import { useI18n } from "../i18n";
import { useLoad } from "../useLoad";

function markReminded(d: DashboardData, id: number): DashboardData {
  const mark = (list: MemberSummary[]) => list.map((m) => (m.id === id ? { ...m, reminded_today: true } : m));
  return { ...d, expiring: mark(d.expiring), expired: mark(d.expired) };
}

export default function Dashboard() {
  const { t, lang, setLang } = useI18n();
  const { data, setData, error, loading, reload } = useLoad(api.dashboard);
  const reminder = useWhatsAppReminder((id) => setData((d) => (d ? markReminded(d, id) : d)));

  if (loading && !data) return <Spinner />;
  if (error && !data) return <ErrorBox message={error} onRetry={() => reload()} />;
  if (!data) return null;

  const { counts } = data;

  return (
    <div>
      <header className="flex items-start justify-between gap-3 bg-brand-700 px-4 pt-5 pb-16 text-white">
        <div className="min-w-0">
          <p className="text-sm text-white/80">{formatDate(data.today)}</p>
          <h1 className="truncate text-2xl font-bold">{data.mess_name}</h1>
        </div>
        <button
          onClick={() => setLang(lang === "en" ? "te" : "en")}
          className="min-h-10 shrink-0 rounded-full border border-white/40 bg-white/10 px-4 text-sm font-semibold"
        >
          🌐 {t("dash.switchLang")}
        </button>
      </header>

      <div className="-mt-12 grid grid-cols-2 gap-3 px-4">
        <SummaryCard to="/members?status=active" label={t("dash.active")} value={counts.active} color="text-green-700" />
        <SummaryCard
          to="/members?status=expiring"
          label={t("dash.expiringIn", { n: data.expiring_window_days })}
          value={counts.expiring}
          color="text-orange-600"
        />
        <SummaryCard to="/members?status=expired" label={t("dash.expired")} value={counts.expired} color="text-red-600" />
        <SummaryCard label={t("dash.collectedIn", { month: monthName(data.today) })} value={formatINR(counts.month_collection)} color="text-slate-900" />
      </div>

      {reminder.error && <ErrorBox message={reminder.error} />}

      {counts.total === 0 ? (
        <EmptyState
          icon="📒"
          title={t("dash.noMembers")}
          hint={t("dash.noMembersHint")}
          action={
            <Link to="/add" className="btn-primary">
              {t("dash.addMember")}
            </Link>
          }
        />
      ) : (
        <>
          <Section title={t("dash.expiringSoon")} count={data.expiring.length}>
            {data.expiring.length === 0 ? (
              <p className="card p-4 text-sm text-slate-500">
                {t("dash.noneExpiring", { n: data.expiring_window_days })}
              </p>
            ) : (
              data.expiring.map((m) => (
                <MemberRow key={m.id} member={m} onRemind={reminder.send} sending={reminder.sendingId === m.id} />
              ))
            )}
          </Section>

          <Section title={t("dash.expiredRecent")} count={data.expired.length}>
            {data.expired.length === 0 ? (
              <p className="card p-4 text-sm text-slate-500">{t("dash.noneExpired")}</p>
            ) : (
              data.expired.map((m) => (
                <MemberRow key={m.id} member={m} onRemind={reminder.send} sending={reminder.sendingId === m.id} />
              ))
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, to }: { label: string; value: number | string; color: string; to?: string }) {
  const body = (
    <>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-sm text-slate-600">{label}</p>
    </>
  );
  return to ? (
    <Link to={to} className="card block p-4 active:bg-slate-50">
      {body}
    </Link>
  ) : (
    <div className="card p-4">{body}</div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mt-6 px-4">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
        {title}
        {count > 0 && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">{count}</span>}
      </h2>
      <ul className="space-y-3">{children}</ul>
    </section>
  );
}
